"""SVNK (svnk.nl) – woonruimteverdeling Noord-Kennemerland op het Zig-platform.

Zig-portalen laden het aanbod via een JSON-endpoint. We proberen eerst de bekende
endpoints; lukt dat niet, dan lezen we de (eventueel met de browser gerenderde)
aanbodpagina's en de detailpagina's.
Detail-URL's hebben de vorm /aanbod/te-huur/details/25862-europaplein-79-alkmaar.
"""
from __future__ import annotations

import re
from typing import Any

from .. import model, parse
from ..fetch import FetchError
from .base import Source, SourceResult

API_PATHS = [
    "/portal/publication/frontend/getallobjects/format/json",
    "/portal/object/frontend/getallobjects/format/json",
]
LIST_PATHS = ["/aanbod/te-huur", "/aanbod/nu-te-huur/huurwoningen", "/aanbod/nu-te-huur"]
DETAIL_RX = r"/aanbod/(?:nu-)?te-huur/(?:[a-z-]+/)?details/[\w-]+"


class ZigPortal(Source):
    def scrape(self) -> SourceResult:
        objects = self._from_api()
        if objects is not None:
            listings = [self._from_api_object(o) for o in objects]
            listings = [l for l in listings if l]
            self.log(f"    API: {len(objects)} objecten, {len(listings)} huurwoningen")
            return SourceResult(listings, complete=True, notes=self.notes)
        return self._from_html()

    # ------------------------------------------------------------------
    def _from_api(self) -> list[dict] | None:
        headers = {"X-Requested-With": "XMLHttpRequest", "Accept": "application/json, text/javascript, */*; q=0.01", "Referer": self.base + "/aanbod/te-huur"}
        for path in API_PATHS:
            for method in ("POST", "GET"):
                url = self.base + path
                try:
                    page = self.post(url, data={}, headers=headers) if method == "POST" else self.get(url, headers=headers)
                    data = page.json()
                except FetchError as e:
                    if e.fatal:
                        raise
                    self.notes.append(f"API {method} {path}: {str(e)[:80]}")
                    continue
                except ValueError:
                    self.notes.append(f"API {method} {path}: geen JSON")
                    continue
                objs = data.get("result") if isinstance(data, dict) else data
                if isinstance(objs, dict):
                    objs = objs.get("items") or objs.get("objects")
                if isinstance(objs, list) and objs and isinstance(objs[0], dict):
                    return objs
        return None

    def _from_api_object(self, o: dict) -> dict | None:
        rent_buy = parse.name_of(o.get("rentBuy")) or ""
        if rent_buy and "huur" not in rent_buy.lower() and "rent" not in rent_buy.lower():
            return None
        fields = parse.fields_from_dict(o, self.base, self.opts.today)
        url_key = o.get("urlKey") or o.get("urlkey")
        oid = str(o.get("id") or url_key or model.id_from_url(str(o)))
        url = f"{self.base}/aanbod/te-huur/details/{url_key}" if url_key else None
        listing = self.new(oid, url=url, **fields)
        model_name = parse.name_of(o.get("model"))
        model_cat = parse.name_of((o.get("model") or {}).get("modelCategorie")) if isinstance(o.get("model"), dict) else None
        listing["allocation_model"] = parse.detect_allocation(" ".join(filter(None, [model_name, model_cat]))) or model_name
        listing["landlord"] = parse.name_of(o.get("corporation")) or listing.get("landlord")
        listing["reactions"] = parse.parse_int(o.get("numberOfReactions") or o.get("reactionCount") or o.get("aantalReacties"))
        income = [parse.parse_money(o.get("minimumIncome") or o.get("minimumInkomen")), parse.parse_money(o.get("maximumIncome") or o.get("maximumInkomen"))]
        if any(income):
            listing["income_text"] = " – ".join(f"€ {x:,.0f}".replace(",", ".") if x else "…" for x in income)
        ages = [o.get("minimumAge") or o.get("minimumLeeftijd"), o.get("maximumAge") or o.get("maximumLeeftijd")]
        if any(ages):
            listing["age_text"] = f"{ages[0] or '…'} – {ages[1] or '…'} jaar"
        hh = [o.get("minimumHouseholdSize") or o.get("minimaleGezinsgrootte"), o.get("maximumHouseholdSize") or o.get("maximaleGezinsgrootte")]
        if any(hh):
            listing["household_text"] = f"{hh[0] or '…'} – {hh[1] or '…'} personen"
        groups = o.get("doelgroepen") or o.get("targetGroups")
        if groups:
            listing["target_group"] = parse.name_of(groups)
        feats = []
        for key, label in (("balcony", "Balkon"), ("garden", "Tuin"), ("elevator", "Lift"), ("storage", "Berging"), ("parking", "Parkeren"), ("lift", "Lift"), ("tuin", "Tuin"), ("balkon", "Balkon")):
            v = o.get(key)
            if v is True or (isinstance(v, str) and v.lower() in ("ja", "yes", "true")):
                feats.append(label)
        listing["features"] = feats
        extra: dict[str, Any] = {}
        for key in ("heating", "kitchen", "isExtraAanbod", "isVoorrangUrgent", "huurtoeslagMogelijk", "huurtoeslagVoorwaarde", "reactionMethod", "temporaryRent", "isTijdelijkeVerhuur"):
            if o.get(key) not in (None, "", [], {}):
                extra[key] = parse.name_of(o.get(key)) if isinstance(o.get(key), (dict, list)) else o.get(key)
        if extra:
            listing["extra"] = extra
        if o.get("isGepubliceerd") is False:
            listing["status"] = "gesloten"
        listing["_details_fetched"] = True  # API levert al alle velden
        return listing

    # ------------------------------------------------------------------
    def _from_html(self) -> SourceResult:
        cards: dict[str, Any] = {}
        complete = True
        for path in LIST_PATHS:
            url = self.base + path
            try:
                page = self.get(url, render=True)
            except FetchError as e:
                if e.fatal:
                    raise
                self.notes.append(f"lijst {path}: {e}")
                continue
            soup = parse.soup_of(page.text)
            for href, card in parse.cards_from_links(soup, page.url, DETAIL_RX):
                cards.setdefault(href, card)
            for href in parse.find_links(page.text, page.url, DETAIL_RX):
                cards.setdefault(href, None)
            for obj in parse.embedded_json(page.text):
                for d in parse.find_listing_dicts(obj):
                    f = parse.fields_from_dict(d, self.base, self.opts.today)
                    key = d.get("urlKey")
                    if key:
                        cards[f"{self.base}/aanbod/te-huur/details/{key}"] = f
            if cards:
                break
        if not cards:
            raise FetchError("geen aanbod gevonden op svnk.nl (API en HTML gaven niets terug)")

        listings = []
        for href, card in cards.items():
            m = re.search(r"/details/((\d+)[\w-]*)", href)
            oid = m.group(2) if m else model.id_from_url(href)
            listing = self.new(oid, url=href)
            if isinstance(card, dict):
                model.merge_fields(listing, card)
            elif card is not None:
                text = parse.text_of(card, " | ")
                model.merge_fields(listing, parse.fields_from_text(text, self.opts.today))
                heading = card.find(["h2", "h3", "h4"])
                if heading is not None:
                    listing["title"] = parse.text_of(heading)
                listing["city"] = parse.find_place_in_text(text)
                listing["images"] = parse.image_of(card, href)
                listing["landlord"] = parse.detect_landlord(text)
                st = parse.detect_status(text)
                if st and st != "beschikbaar":
                    listing["status"] = st
                listing["label_new"] = parse.detect_new_label(text)
            if not listing.get("street") and m:
                # slug: 25862-europaplein-79-alkmaar
                slug = m.group(1).split("-", 1)[-1].replace("-", " ")
                place = parse.find_place_in_text(slug)
                if place:
                    listing["city"] = listing.get("city") or place
                    slug = re.sub(r"\s+" + re.escape(place.lower().replace("-", " ")) + r"$", "", slug)
                if not listing.get("title"):
                    listing["title"] = slug.title()
            listings.append(listing)

        for listing in listings:
            if listing.get("city") and not parse.canonical_place(listing["city"]):
                continue  # buiten de regio: geen detailpagina nodig
            self.enrich_from_detail(listing, render=True)
        return SourceResult(listings, complete=complete, notes=self.notes)
