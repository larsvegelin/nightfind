"""Woonmatch-portalen (West-Friesland voor Obdam/Ursem, Kop van Noord-Holland voor Schagen/Tuitjenhorn).

Advertenties staan op /woningaanbod/<GUID>, soms op een subdomein per corporatie
(woonschakel., wooncom., ...). Een detailpagina vermeldt de plaatsingsperiode, bijv.
"geadverteerd van vrijdag 18 oktober tot donderdag 24 oktober".
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

from .. import config, model, parse
from ..fetch import FetchError
from .base import Source, SourceResult


class Woonmatch(Source):
    def _detail_rx(self) -> str:
        domain = urlparse(self.base).netloc.removeprefix("www.")
        return r"https?://(?:[a-z0-9-]+\.)?" + re.escape(domain) + r"/woningaanbod/[0-9A-Fa-f]{8}-[0-9A-Fa-f-]{27}"

    def scrape(self) -> SourceResult:
        rx = self._detail_rx()
        bases = [self.base] + list(self.cfg.get("extra_bases", []))
        cards: dict[str, object] = {}
        errors = 0
        attempts = 0
        for base in bases:
            for path in self.cfg.get("lijstpaden", ["/"]):
                attempts += 1
                url = base.rstrip("/") + path
                try:
                    page = self.get(url, render=True)
                except FetchError as e:
                    if e.fatal and base == self.base:
                        raise
                    errors += 1
                    self.notes.append(f"lijst {url}: {e}")
                    continue
                soup = parse.soup_of(page.text)
                for href, card in parse.cards_from_links(soup, page.url, rx):
                    cards.setdefault(model.id_from_url(href), (href, card))
                for href in parse.find_links(page.text, page.url, rx):
                    cards.setdefault(model.id_from_url(href), (href, None))
        if not cards:
            if errors == attempts:
                raise FetchError(self.notes[-1] if self.notes else "site niet bereikbaar")
            raise FetchError("geen advertenties gevonden op de aanbodpagina's")

        listings = []
        for guid, (href, card) in cards.items():
            listing = self.new(guid, url=href)
            sub = urlparse(href).netloc.split(".")[0]
            if sub in config.WOONMATCH_SUBDOMEINEN:
                listing["landlord"] = config.WOONMATCH_SUBDOMEINEN[sub]
            if card is not None:
                text = parse.text_of(card, " | ")
                model.merge_fields(listing, parse.fields_from_text(text, self.opts.today))
                m = re.search(r"([A-Z][^|]{2,60}?\s\d+[^|]{0,8}?)\s+te\s+([A-Z][A-Za-z' -]+)", text)
                if m:
                    model.merge_fields(listing, parse.parse_address(f"{m.group(1)} te {m.group(2).strip()}"))
                if not listing.get("city"):
                    listing["city"] = parse.find_place_in_text(text)
                listing["images"] = parse.image_of(card, href)
                listing["landlord"] = listing.get("landlord") or parse.detect_landlord(text)
                listing["property_type"] = parse.detect_property_type(text)
                st = parse.detect_status(text)
                if st and st != "beschikbaar":
                    listing["status"] = st
                listing["label_new"] = parse.detect_new_label(text)
            listings.append(listing)

        for listing in listings:
            if listing.get("city") and not parse.canonical_place(listing["city"]):
                continue  # buiten de regio (bijv. Hoorn of Den Helder): overslaan
            self.enrich_from_detail(listing, render=True)
        return SourceResult(listings, complete=errors == 0, notes=self.notes)

    def on_detail(self, listing: dict, soup, text: str) -> None:
        heading = soup.find("h1")
        title = parse.text_of(heading) if heading is not None else ""
        if " te " not in title and soup.title is not None:
            title = parse.text_of(soup.title).split(" - ")[0]
        if " te " in title:
            parsed = parse.parse_address(title)
            model.merge_fields(listing, parsed, overwrite=True)
            listing["title"] = title
        low = text.lower()
        if re.search(r"geadverteerd geweest|niet meer (?:publiek )?toegankelijk|advertentie is verlopen|reageren is niet meer mogelijk", low):
            listing["status"] = "gesloten"
        if not listing.get("allocation_model"):
            listing["allocation_model"] = parse.detect_allocation(low)
        m = re.search(r"(?:minimaal|minimum)\s+(\d+)\s+(?:en\s+(?:maximaal|maximum)\s+(\d+)\s+)?personen", low)
        if m and not listing.get("household_text"):
            listing["household_text"] = f"{m.group(1)} – {m.group(2) or '…'} personen"
