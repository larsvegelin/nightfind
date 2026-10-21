"""Kamernet – kamers, studio's en kleine appartementen (vooral Alkmaar)."""
from __future__ import annotations

import re

from .. import config, model, parse
from ..fetch import FetchError
from .base import Source, SourceResult

DETAIL_RX = r"kamernet\.nl/(?:en/)?(?:huren|for-rent)/[a-z]+-[a-z-]+/[^/?#]+/[a-z-]+-\d+"


def slug(place: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", place.lower()).strip("-")


class Kamernet(Source):
    def scrape(self) -> SourceResult:
        found: dict[str, dict] = {}
        complete = True
        failures = 0
        places = self.cfg.get("zoekplaatsen") or config.ZOEKPLAATSEN
        for place in places:
            for page_no in range(1, self.opts.max_pages + 1):
                url = f"{self.base}/huren/huurwoningen-{slug(place)}" + (f"?pageNo={page_no}" if page_no > 1 else "")
                try:
                    page = self.get(url)
                except FetchError as e:
                    if e.fatal:
                        raise
                    if "404" not in str(e):
                        self.notes.append(f"{place}: {e}")
                        failures += 1
                        complete = False
                    break
                soup = parse.soup_of(page.text)
                new_here = 0
                for href, card in parse.cards_from_links(soup, page.url, DETAIL_RX):
                    href = href.split("?")[0]
                    if href in found:
                        continue
                    text = parse.text_of(card, " | ")
                    f = parse.fields_from_text(text, self.opts.today)
                    m = re.search(r"/(?:huren|for-rent)/([a-z]+)-([a-z-]+)/([^/]+)/", href)
                    if m:
                        f["property_type"] = m.group(1).capitalize()
                        f["city"] = parse.find_place_in_text(m.group(2).replace("-", " ")) or m.group(2).replace("-", " ").title()
                        f["street"] = m.group(3).replace("-", " ").title()
                    status = parse.detect_status(text)
                    if status:
                        f["status"] = status
                    f["label_new"] = parse.detect_new_label(text)
                    imgs = parse.image_of(card, page.url)
                    if imgs:
                        f["images"] = imgs
                    found[href] = f
                    new_here += 1
                if new_here == 0:
                    break
        if failures and failures == len(places):
            raise FetchError(self.notes[-1])

        listings = []
        for url, fields in found.items():
            listing = self.new(model.id_from_url(url), url=url)
            model.merge_fields(listing, fields)
            listings.append(listing)
        for listing in listings:
            if parse.canonical_place(listing.get("city")):
                self.enrich_from_detail(listing)
        return SourceResult(listings, complete=complete, notes=self.notes)
