"""Generieke scraper voor makelaars, verhuurders en kleinere huurplatforms.

Werkt voor vrijwel elke site die een overzichtspagina met woningkaarten heeft:
- Met een `detail`-regex in de config worden precies die links gebruikt.
- Zonder regex zoekt hij zelf links naar woningen: links op dezelfde site waarvan de
  omliggende kaart een huurprijs (€ 250 – € 15.000) bevat.
- Koopwoningen (k.k., v.o.n., vraagprijs) worden overgeslagen.
- Volgende pagina's worden gevolgd via rel=next, 'Volgende' of ?page=2-achtige links.
- Detailpagina's leveren daarna extra velden (JSON-LD, label/waarde-lijsten, tekst).
"""
from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

from bs4 import Tag

from .. import config, model, parse
from ..fetch import FetchError
from .base import Source, SourceResult

SKIP_PATH = re.compile(
    r"contact|over-?ons|about|privacy|cookie|login|inloggen|account|registreren|vacature|nieuws|blog|team|medewerker"
    r"|waardebepaling|taxatie|hypothe|verkopen|verkoop|aankoop|zoekopdracht|disclaimer|voorwaarden|klacht|faq|veelgestelde"
    r"|diensten|bedrijfs|nieuwbouw-?projecten$|mailto:|tel:|javascript:|whatsapp|wp-content|wp-json|/feed|\.pdf$|\.jpe?g$|\.png$",
    re.I,
)
SOCIAL = re.compile(r"facebook|instagram|linkedin|twitter|x\.com|youtube|pinterest|tiktok|google\.|apple\.com|maps\.", re.I)
PAGE_RX = r"(?:[?&](?:page|pagina|p|paged|pg|pageNo|pageNumber)=|/page/|/pagina[-/]|/p[-/]?|-page-)"


def is_sale_text(text: str) -> bool:
    t = text.lower()
    if re.search(r"k\.\s?k\.|kosten koper|v\.\s?o\.\s?n\.|vrij op naam|vraagprijs|koopsom|te koop\b", t):
        return not re.search(r"per maand|p/m|p\.m\.|/\s?mnd|/\s?maand|huurprijs|te huur", t)
    return False


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def next_page_url(soup, page_url: str, page_no: int) -> str | None:
    link = soup.find("link", rel=lambda r: r and "next" in r) or soup.find("a", rel=lambda r: r and "next" in r)
    if link is not None and link.get("href"):
        return urljoin(page_url, link["href"])
    for a in soup.find_all("a", href=True):
        label = (a.get_text(" ", strip=True) or a.get("aria-label") or a.get("title") or "").strip().lower()
        if label in ("volgende", "volgende pagina", "next", "›", "»", ">", "→") or label.startswith("volgende"):
            u = urljoin(page_url, a["href"])
            if u.split("#")[0] != page_url.split("#")[0]:
                return u
    rx = re.compile(PAGE_RX + str(page_no + 1) + r"(?:\D|$)", re.I)
    for a in soup.find_all("a", href=True):
        if rx.search(a["href"]):
            return urljoin(page_url, a["href"])
    return None


def cards_for_hrefs(soup, page_url: str, hrefs: set[str]) -> list[tuple[str, Tag]]:
    """Zoals parse.cards_from_links, maar voor een vaste set detail-URL's."""
    def norm(h: str) -> str:
        return urljoin(page_url, h).split("#")[0].rstrip("/")

    results: list[tuple[str, Tag]] = []
    done: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = norm(a["href"])
        if href not in hrefs or href in done:
            continue
        done.add(href)
        card: Tag = a
        node: Tag = a
        for _ in range(10):
            parent = node.parent
            if parent is None or parent.name in ("body", "html", "main"):
                break
            inside = {norm(x["href"]) for x in parent.find_all("a", href=True)} & hrefs
            if len(inside) > 1:
                break
            node = card = parent
        results.append((href, card))
    return results


def auto_detail_cards(soup, page_url: str, extra_hosts: tuple[str, ...] = ()) -> list[tuple[str, Tag]]:
    """Vindt woningkaarten zonder vooraf bekende linkstructuur."""
    hosts = {_host(page_url), *(h.removeprefix("www.") for h in extra_hosts)}
    page_norm = page_url.split("#")[0].rstrip("/")
    cands: set[str] = set()
    for a in soup.find_all("a", href=True):
        raw = a["href"].strip()
        if not raw or raw.startswith("#") or SOCIAL.search(raw):
            continue
        u = urljoin(page_url, raw).split("#")[0].rstrip("/")
        p = urlparse(u)
        if p.scheme not in ("http", "https") or _host(u) not in hosts or u == page_norm:
            continue
        path = p.path.strip("/")
        if not path or SKIP_PATH.search(u) or re.search(PAGE_RX + r"\d+", u, re.I):
            continue
        if path.count("/") == 0 and not re.search(r"\d", path):
            continue  # menu-items als /huren, /contact
        cands.add(u)
    if not cands:
        return []
    out = []
    for href, card in cards_for_hrefs(soup, page_url, cands):
        text = parse.text_of(card, " | ")
        if len(text) > 1500:
            continue
        if parse.fields_from_text(text).get("rent_total"):
            out.append((href, card))
        elif parse.detect_status(text) in ("verhuurd", "verhuurd_ovb", "onder_optie") and (parse.parse_postcode(text) or re.search(r"m²|m2", text)):
            out.append((href, card))  # verhuurde woning zonder prijs op de kaart
    return out


class GenericSite(Source):
    def list_urls(self) -> list[str]:
        urls = list(self.cfg.get("lijst", []))
        templates = self.cfg.get("zoek_url") or []
        if isinstance(templates, str):
            templates = [templates]
        for tpl in templates:
            for place in self.cfg.get("zoekplaatsen") or config.HOOFDPLAATSEN:
                slug = re.sub(r"[^a-z0-9]+", "-", place.lower().replace("'t ", "t-")).strip("-")
                urls.append(tpl.format(slug=slug, plaats=place, plaats_url=place.replace(" ", "%20")))
        return list(dict.fromkeys(urls))

    def find_cards(self, html: str, page_url: str) -> list[tuple[str, Tag]]:
        soup = parse.soup_of(html)
        rx = self.cfg.get("detail")
        if rx:
            pairs = parse.cards_from_links(soup, page_url, rx)
        else:
            pairs = auto_detail_cards(soup, page_url, tuple(self.cfg.get("hosts", ())))
        return pairs

    def card_fields(self, card: Tag, href: str) -> dict | None:
        text = parse.text_of(card, " | ")
        if is_sale_text(text):
            return None
        f = parse.fields_from_text(text, self.opts.today)
        if self.cfg.get("gemengd") and not f.get("rent_total") and parse.detect_status(text) not in ("verhuurd", "verhuurd_ovb", "onder_optie"):
            return None  # pagina met koop én huur: zonder huurprijs overslaan
        f.update({k: v for k, v in parse.address_from_segments(text).items() if v})
        heading = card.find(["h2", "h3", "h4", "h5"]) or card.find("strong")
        if heading is not None:
            title = parse.text_of(heading)
            if title and len(title) < 120:
                f["title"] = title
                for k, v in parse.parse_address(title).items():
                    f.setdefault(k, v)
        if not f.get("city"):
            place = parse.find_place_in_text(text)
            if place:
                f["city"] = place
        status = parse.detect_status(text)
        if status:
            f["status"] = status
        f["label_new"] = parse.detect_new_label(text)
        f["property_type"] = f.get("property_type") or parse.detect_property_type(text)
        imgs = parse.image_of(card, href)
        if imgs:
            f["images"] = imgs
        if self.cfg["type"] in ("makelaar", "verhuurder"):
            f["landlord"] = self.cfg["naam"]
        return {k: v for k, v in f.items() if v not in (None, "", [])}

    def scrape(self) -> SourceResult:
        found: dict[str, dict] = {}
        complete = True
        urls = self.list_urls()
        errors = 0
        for start in urls:
            url: str | None = start
            seen: set[str] = set()
            for page_no in range(1, self.opts.max_pages + 1):
                if not url or url in seen:
                    break
                seen.add(url)
                try:
                    page = self.get(url, render=bool(self.cfg.get("render")))
                except FetchError as e:
                    if e.fatal:
                        raise
                    if "404" not in str(e):
                        errors += 1
                        complete = False
                        self.notes.append(f"{url}: {e}")
                    break
                cards = self.find_cards(page.text, page.url)
                if not cards and page_no == 1 and not page.via_browser and self.fetcher.browser_mode != "nooit":
                    try:
                        rendered = self.get(url, render=True)
                        if rendered.via_browser:
                            page, cards = rendered, self.find_cards(rendered.text, rendered.url)
                    except FetchError:
                        pass
                new_here = 0
                for href, card in cards:
                    if href in found:
                        continue
                    fields = self.card_fields(card, href)
                    if fields is None:
                        continue
                    found[href] = fields
                    new_here += 1
                if new_here == 0:
                    break
                url = next_page_url(parse.soup_of(page.text), page.url, page_no)
            else:
                complete = False
        if urls and errors == len(urls):
            raise FetchError(self.notes[-1] if self.notes else "geen pagina bereikbaar")

        default_city = None
        plaatsen = self.cfg.get("plaatsen") or []
        if len(plaatsen) == 1:
            default_city = plaatsen[0]
        listings = []
        for href, fields in found.items():
            listing = self.new(model.id_from_url(href), url=href)
            model.merge_fields(listing, fields)
            listings.append(listing)
        for listing in listings:
            if listing.get("city") and not parse.canonical_place(listing["city"]):
                continue  # buiten de regio
            self.enrich_from_detail(listing, render=bool(self.cfg.get("render")))
            if not listing.get("city") and default_city and self.cfg.get("alleen_eigen_plaats"):
                listing["city"] = default_city
        return SourceResult(listings, complete=complete, notes=self.notes)

    def on_detail(self, listing: dict, soup, text: str) -> None:
        if not listing.get("street"):
            heading = soup.find("h1")
            if heading is not None:
                h = parse.text_of(heading, " | ")
                model.merge_fields(listing, parse.address_from_segments(h))
                model.merge_fields(listing, parse.parse_address(h.split(" | ")[0]))
        if not listing.get("city"):
            heading = soup.find("h1")
            blob = " ".join(filter(None, [parse.text_of(heading) if heading is not None else "", parse.text_of(soup.title) if soup.title else ""]))
            place = parse.find_place_in_text(blob)
            if place:
                listing["city"] = place
        if not listing.get("status") or listing.get("status") == "beschikbaar":
            # statuslabels staan vaak als badge bovenaan de detailpagina
            for el in soup.select("[class*='status'], [class*='label'], [class*='badge'], [class*='sticker'], [class*='ribbon']")[:20]:
                st = parse.detect_status(parse.text_of(el))
                if st and st != "beschikbaar":
                    listing["status"] = st
                    listing["status_text"] = parse.text_of(el)
                    break
