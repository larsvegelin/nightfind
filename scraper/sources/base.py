"""Basisklasse voor een bron (site) en gedeelde stappen zoals detailpagina's verrijken."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any

from .. import model, parse
from ..fetch import Fetcher, FetchError


@dataclass
class Options:
    details: bool = True              # detailpagina's ophalen voor extra velden
    max_pages: int = 15
    known: dict[str, dict] = field(default_factory=dict)  # vorige run: id -> listing
    refresh_details: bool = False
    today: date = field(default_factory=date.today)


@dataclass
class SourceResult:
    listings: list[dict]
    complete: bool = True           # False als paginering is afgekapt of deels mislukt
    notes: list[str] = field(default_factory=list)


class Source:
    id: str = ""

    def __init__(self, cfg: dict, fetcher: Fetcher, opts: Options, log=print) -> None:
        self.cfg = cfg
        self.base = cfg["base"].rstrip("/")
        self.fetcher = fetcher
        self.opts = opts
        self.log = log
        self.notes: list[str] = []

    # Te implementeren door subklassen
    def scrape(self) -> SourceResult:
        raise NotImplementedError

    # ------------------------------------------------------------------
    def get(self, url: str, **kw):
        return self.fetcher.get(url, source=self.cfg["id"], **kw)

    def post(self, url: str, **kw):
        return self.fetcher.post(url, source=self.cfg["id"], **kw)

    def new(self, source_id: str, **fields: Any) -> dict:
        return model.new_listing(source_id, self.cfg, **fields)

    def needs_details(self, listing: dict) -> bool:
        if not self.opts.details:
            return False
        if self.opts.refresh_details:
            return True
        prev = self.opts.known.get(listing["id"])
        if prev and (prev.get("details_fetched") or prev.get("_details_fetched")):
            # al eerder verrijkt: velden overnemen in plaats van opnieuw ophalen
            model.merge_fields(listing, {k: v for k, v in prev.items() if k not in ("status", "status_text", "label_new", "first_seen", "last_seen", "status_history", "offline_since")})
            listing["_details_fetched"] = True
            return False
        return True

    def enrich_from_detail(self, listing: dict, render: bool = False) -> None:
        """Haalt de detailpagina op en vult ontbrekende velden aan (JSON-LD, label/waarde, tekst)."""
        if not listing.get("url") or not self.needs_details(listing):
            return
        try:
            page = self.get(listing["url"], render=render)
        except FetchError as e:
            self.notes.append(f"detail mislukt: {e}")
            return
        soup = parse.soup_of(page.text)
        today = self.opts.today
        model.merge_fields(listing, parse.fields_from_json_ld(parse.json_ld(soup), today))
        kv = parse.map_kv(parse.kv_pairs(soup), today)
        status_text = kv.pop("status_text", None)
        model.merge_fields(listing, kv)
        if status_text:
            st = parse.detect_status(status_text)
            if st:
                listing["status"] = st
                listing["status_text"] = status_text
        main = soup.find("main") or soup.body or soup
        text = parse.text_of(main, " | ")
        model.merge_fields(listing, parse.fields_from_text(text, today))
        if not listing.get("description"):
            desc = soup.find(attrs={"class": lambda c: c and any(x in str(c).lower() for x in ("description", "omschrijving", "toelichting"))})
            if desc is not None:
                d = parse.clean(parse.text_of(desc, "\n"))
                listing["description"] = d[:4000] if d else None
        if not listing.get("images"):
            listing["images"] = parse.image_of(main, page.url)[:20]
        if not listing.get("landlord"):
            listing["landlord"] = parse.detect_landlord(text)
        if not listing.get("target_group"):
            listing["target_group"] = parse.detect_target_group(text)
        self.on_detail(listing, soup, text)
        listing["_details_fetched"] = True

    def on_detail(self, listing: dict, soup, text: str) -> None:
        """Optionele extra stap per bron na het lezen van een detailpagina."""
