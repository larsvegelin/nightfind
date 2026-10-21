"""Pararius en Huurwoningen.nl – beide gebruiken dezelfde soort zoekresultaatkaarten.

Kaarten tonen titel, postcode/plaats/wijk, prijs, m², kamers, interieur en labels
als 'Nieuw', 'Onder optie' of 'Verhuurd onder voorbehoud'. De detailpagina geeft
o.a. 'Aangeboden sinds' (plaatsingsdatum), status, aanvaarding en energielabel.
"""
from __future__ import annotations

import re
from urllib.parse import urljoin

from .. import config, model, parse
from ..fetch import FetchError
from .base import Source, SourceResult

CARD_SELECTOR = "section.listing-search-item, li.search-list__item--listing, article.listing-search-item"


def slug(place: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", place.lower().replace("'t ", "t-")).strip("-")


class Pararius(Source):
    detail_rx = r"pararius\.nl/[a-z-]+-te-huur/[^/?#]+/[0-9a-f]{8}/[^/?#]+"

    def search_url(self, place: str, page: int) -> str:
        url = f"{self.base}/huurwoningen/{slug(place)}"
        return url + (f"/page-{page}" if page > 1 else "")

    def scrape(self) -> SourceResult:
        found: dict[str, dict] = {}
        complete = True
        failures = 0
        places = self.cfg.get("zoekplaatsen") or config.ZOEKPLAATSEN
        for place in places:
            for page_no in range(1, self.opts.max_pages + 1):
                try:
                    page = self.get(self.search_url(place, page_no))
                except FetchError as e:
                    if e.fatal:
                        raise
                    if "404" in str(e):
                        break  # geen aanbod in deze plaats
                    self.notes.append(f"{place}: {e}")
                    failures += 1
                    complete = False
                    break
                new_here = 0
                for url, fields in self.parse_cards(page.text, page.url, place):
                    if url not in found:
                        new_here += 1
                        found[url] = fields
                if new_here == 0 or not self.has_next(page.text, page_no):
                    break
            else:
                complete = False
        if failures and failures == len(places):
            raise FetchError(self.notes[-1])

        listings = []
        for url, fields in found.items():
            listing = self.new(model.id_from_url(url), url=url)
            model.merge_fields(listing, fields)
            listings.append(listing)
        for listing in listings:
            if listing.get("city") and not parse.canonical_place(listing["city"]):
                continue  # buiten de regio: geen detailpagina nodig
            self.enrich_from_detail(listing)
        return SourceResult(listings, complete=complete, notes=self.notes)

    def has_next(self, html: str, page_no: int) -> bool:
        return bool(re.search(r"(?:page-|page=)" + str(page_no + 1) + r"\b", html))

    def parse_cards(self, html: str, page_url: str, place: str) -> list[tuple[str, dict]]:
        soup = parse.soup_of(html)
        out: list[tuple[str, dict]] = []
        seen: set[str] = set()
        cards = soup.select(CARD_SELECTOR)
        if cards:
            pairs = []
            for card in cards:
                link = card.select_one("a.listing-search-item__link--title, .listing-search-item__title a") or card.find("a", href=re.compile(self.detail_rx))
                if link is None or not link.get("href"):
                    continue
                pairs.append((urljoin(page_url, link["href"]).split("?")[0], card))
        else:
            pairs = parse.cards_from_links(soup, page_url, self.detail_rx)

        for url, card in pairs:
            if url in seen or not re.search(self.detail_rx, url):
                continue
            seen.add(url)
            text = parse.text_of(card, " | ")
            f: dict = {}
            title = card.select_one(".listing-search-item__title, [class*='__title']")
            if title is not None:
                f["title"] = parse.text_of(title)
                f.update({k: v for k, v in parse.parse_address(f["title"]).items()})
            sub = card.select_one(".listing-search-item__sub-title, [class*='sub-title'], [class*='subtitle']")
            if sub is not None:
                st = parse.text_of(sub)
                f["postcode"] = parse.parse_postcode(st)
                m = re.match(r"^(?:\d{4}\s?[A-Z]{2}\s+)?([^()]+?)(?:\s*\((.+)\))?$", st)
                if m:
                    f["city"] = m.group(1).strip()
                    if m.group(2):
                        f["neighbourhood"] = m.group(2).strip()
            price = card.select_one(".listing-search-item__price, [class*='price']")
            if price is not None:
                f["rent_total"] = parse.parse_money(parse.text_of(price))
                if re.search(r"excl", parse.text_of(price), re.I):
                    f["rent_net"] = f["rent_total"]
            for item in card.select("[class*='illustrated-features__item']"):
                cls = " ".join(item.get("class", []))
                val = parse.text_of(item)
                if "surface-area" in cls:
                    f["area_m2"] = parse.parse_area(val)
                elif "number-of-rooms" in cls:
                    f["rooms"] = parse.parse_int(val)
                elif "interior" in cls:
                    f["interior"] = val
                elif "construction-period" in cls:
                    f["build_year"] = parse.parse_year(val)
            labels = " | ".join(parse.text_of(x) for x in card.select("[class*='listing-label'], [class*='label--']"))
            status = parse.detect_status(labels) or parse.detect_status(text)
            if status:
                f["status"] = status
                f["status_text"] = labels or None
            f["label_new"] = parse.detect_new_label(labels)
            agent = card.select_one(".listing-search-item__info a, [class*='agent'] a, [class*='broker']")
            if agent is not None:
                f["landlord"] = parse.text_of(agent)
            fallback = parse.fields_from_text(text, self.opts.today)
            for k, v in fallback.items():
                f.setdefault(k, v)
            if not f.get("city"):
                f.update({k: v for k, v in parse.address_from_segments(text).items() if not f.get(k)})
            if not f.get("city"):
                f["city"] = place
            imgs = parse.image_of(card, page_url)
            if imgs:
                f["images"] = imgs
            f["property_type"] = f.get("property_type") or parse.detect_property_type(url.split("/")[3].replace("-te-huur", ""))
            out.append((url, {k: v for k, v in f.items() if v not in (None, "", [])}))
        return out


class Huurwoningen(Pararius):
    detail_rx = r"huurwoningen\.nl/huren/[^/?#]+/[0-9a-f]{8}/[^/?#]+"

    def search_url(self, place: str, page: int) -> str:
        return f"{self.base}/in/{slug(place)}/" + (f"?page={page}" if page > 1 else "")
