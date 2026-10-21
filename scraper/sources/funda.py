"""Funda – huurwoningen van makelaars en particulieren.

Zoekt met één zoekopdracht op alle regioplaatsen en neemt ook woningen 'in
onderhandeling' en 'verhuurd' mee, zodat die status zichtbaar is. Funda blokkeert
vaak gewone HTTP-verzoeken; installeer dan Playwright (zie README).
"""
from __future__ import annotations

import json
import re
from urllib.parse import quote

from .. import config, model, parse
from ..fetch import FetchError
from .base import Source, SourceResult

# Ook verhuurde woningen: /detail/huur/verhuurd/heerhugowaard/appartement-dione-25/43275681/
DETAIL_RX = r"funda\.nl/(?:[a-z]{2}/)?(?:detail/huur/(?:verhuurd/|onder-bod/|onder-optie/)?[^/?#]+/[^/?#]+/\d{6,}|huur/[^/?#]+/[a-z]+-\d{6,}-[^/?#]+)"
_CANON_RX = r"funda\.nl/(?:[a-z]{2}/)?((?:detail/huur/(?:verhuurd/|onder-bod/|onder-optie/)?[^/?#]+/[^/?#]+/\d{6,}|huur/[^/?#]+/[a-z]+-\d{6,}-[^/?#]+))"


def slug(place: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", place.lower().replace("'t ", "t-")).strip("-")


class Funda(Source):
    def search_url(self, page: int) -> str:
        areas = json.dumps([slug(p) for p in config.ZOEKPLAATSEN], separators=(",", ":"))
        availability = json.dumps(["available", "negotiations", "unavailable"], separators=(",", ":"))
        url = f"{self.base}/zoeken/huur?selected_area={quote(areas)}&availability={quote(availability)}&sort=%22date_down%22"
        return url + (f"&search_result={page}" if page > 1 else "")

    @staticmethod
    def canonical(url: str) -> str | None:
        m = re.search(_CANON_RX, url)
        return f"https://www.funda.nl/{m.group(1)}/" if m else None

    def scrape(self) -> SourceResult:
        found: dict[str, dict] = {}
        complete = True
        for page_no in range(1, self.opts.max_pages + 1):
            try:
                page = self.get(self.search_url(page_no))
            except FetchError as e:
                if page_no == 1 or e.fatal:
                    raise
                self.notes.append(str(e))
                complete = False
                break
            soup = parse.soup_of(page.text)
            new_here = 0

            for obj in parse.json_ld(soup):
                for item in obj.get("itemListElement") or []:
                    u = self.canonical(str(item.get("url") or (item.get("item") or {}).get("url") or ""))
                    if u and u not in found:
                        found[u] = {}
                        new_here += 1

            for href, card in parse.cards_from_links(soup, page.url, DETAIL_RX):
                u = self.canonical(href)
                if not u:
                    continue
                text = parse.text_of(card, " | ")
                fields = parse.fields_from_text(text, self.opts.today)
                fields.update(parse.address_from_segments(text))
                status = parse.detect_status(text)
                if status:
                    fields["status"] = status
                fields["label_new"] = parse.detect_new_label(text)
                imgs = parse.image_of(card, page.url)
                if imgs:
                    fields["images"] = imgs
                if u not in found:
                    new_here += 1
                found.setdefault(u, {}).update({k: v for k, v in fields.items() if v not in (None, "", [])})

            if new_here == 0:
                break
        else:
            complete = False  # max_pages bereikt

        listings = []
        for url, fields in found.items():
            listing = self.new(model.id_from_url(url), url=url)
            model.merge_fields(listing, fields)
            if "/huur/verhuurd/" in url and listing.get("status") in (None, "beschikbaar"):
                listing["status"] = "verhuurd"
            if not listing.get("street"):
                # /detail/huur/alkmaar/appartement-laat-12/43912345/
                m = re.search(r"/huur/(?:verhuurd/|onder-bod/|onder-optie/)?([^/]+)/([a-z]+)-([^/]+?)/\d+", url) or re.search(r"/huur/([^/]+)/([a-z]+)-\d+-([^/]+)", url)
                if m:
                    listing["city"] = listing.get("city") or parse.find_place_in_text(m.group(1).replace("-", " "))
                    listing["property_type"] = listing.get("property_type") or m.group(2).capitalize()
                    model.merge_fields(listing, parse.parse_address(m.group(3).replace("-", " ").title()))
            listings.append(listing)

        for listing in listings:
            self.enrich_from_detail(listing)
        return SourceResult(listings, complete=complete, notes=self.notes)

    def on_detail(self, listing: dict, soup, text: str) -> None:
        agent = soup.find("a", href=re.compile(r"/makelaars?/|/makelaar/"))
        if agent is not None and not listing.get("landlord"):
            listing["landlord"] = parse.clean(parse.text_of(agent))
        heading = soup.find("h1")
        if heading is not None:
            h = parse.text_of(heading, " | ")
            model.merge_fields(listing, parse.address_from_segments(h))
            if not listing.get("street"):
                model.merge_fields(listing, parse.parse_address(h.split(" | ")[0]))
