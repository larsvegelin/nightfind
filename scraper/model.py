"""Het datamodel van één advertentie en het opschonen ervan.

Veldnamen zijn snake_case zodat ze later 1-op-1 in een Supabase-tabel passen.
"""
from __future__ import annotations

import hashlib
import re
from datetime import date
from typing import Any

from . import parse

FIELDS: list[str] = [
    "id", "source", "source_name", "source_type", "source_id", "url",
    "title", "street", "house_number", "house_number_addition", "postcode",
    "city", "municipality", "neighbourhood", "address_key",
    "property_type", "segment",
    "rent_total", "rent_net", "service_costs", "energy_costs", "deposit",
    "area_m2", "rooms", "bedrooms", "floor", "energy_label", "build_year", "interior",
    "published_at", "closing_date", "available_from", "available_text",
    "allocation_model", "reactions", "landlord", "target_group",
    "income_text", "age_text", "household_text", "contract",
    "status", "status_text", "label_new", "is_new",
    "lat", "lon", "images", "description", "features", "extra",
    "first_seen", "last_seen", "offline_since", "status_history",
]


def new_listing(source_id: str, cfg: dict, **fields: Any) -> dict:
    listing: dict[str, Any] = {f: None for f in FIELDS}
    listing.update({
        "source": cfg["id"],
        "source_name": cfg["naam"],
        "source_type": cfg["type"],
        "images": [],
        "features": [],
        "label_new": False,
        "is_new": False,
    })
    for k, v in fields.items():
        if v not in (None, "", []):
            listing[k] = v
    listing["source_id"] = str(source_id)
    listing["id"] = f"{cfg['id']}:{source_id}"
    return listing


def merge_fields(listing: dict, fields: dict, overwrite: bool = False) -> dict:
    """Voegt velden toe; bestaande waarden blijven staan tenzij overwrite=True."""
    for k, v in fields.items():
        if k == "_extras":
            if v:
                listing["extra"] = {**(listing.get("extra") or {}), **v}
            continue
        if k == "street_raw":
            if v and not listing.get("street"):
                merge_fields(listing, {kk: vv for kk, vv in parse.parse_address(v).items() if kk != "city"})
            continue
        if k not in listing and k not in FIELDS:
            continue
        if v in (None, "", []):
            continue
        if overwrite or listing.get(k) in (None, "", [], False):
            listing[k] = v
    return listing


def id_from_url(url: str) -> str:
    """Stabiel ID uit een URL: GUID, lange cijferreeks of hash."""
    m = re.search(r"([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})", url)
    if m:
        return m.group(1).upper()
    m = re.search(r"/(\d{5,})(?:[-/][^/]*)?/?(?:\?.*)?$", url) or re.search(r"/details/(\d+)", url) or re.search(r"-(\d{5,})/?$", url)
    if m:
        return m.group(1)
    m = re.search(r"/([0-9a-f]{8})/[^/]+/?$", url)
    if m:
        return m.group(1)
    return hashlib.sha1(url.encode()).hexdigest()[:12]


def normalize(listing: dict, default_city: str | None = None, today: date | None = None) -> dict:
    """Schoont velden op, vult adres/plaats aan en bepaalt status/segment waar mogelijk."""
    for k in ("title", "street", "city", "neighbourhood", "property_type", "landlord", "floor", "interior", "description", "status_text", "allocation_model", "target_group"):
        if isinstance(listing.get(k), str):
            listing[k] = parse.clean(listing[k])

    if listing.get("title") and not listing.get("street"):
        merge_fields(listing, parse.parse_address(listing["title"]))
    elif listing.get("street") and not listing.get("house_number"):
        parsed = parse.parse_address(listing["street"])
        if parsed.get("house_number"):
            listing["street"] = parsed.get("street")
            merge_fields(listing, parsed)

    city = parse.canonical_place(listing.get("city")) or parse.find_place_in_text(listing.get("city"))
    if not city and default_city and not listing.get("city"):
        city = parse.canonical_place(default_city)
    if city:
        listing["city"] = city
    listing["municipality"] = parse.municipality_of(parse.canonical_place(listing.get("city")))

    if listing.get("postcode"):
        listing["postcode"] = parse.parse_postcode(listing["postcode"]) or listing["postcode"]
    if listing.get("energy_label"):
        listing["energy_label"] = parse.parse_energy_label(listing["energy_label"]) or None
    if listing.get("property_type"):
        listing["property_type"] = str(listing["property_type"]).strip().capitalize()
    for k in ("rent_total", "rent_net", "service_costs", "energy_costs", "deposit"):
        if listing.get(k) is not None:
            listing[k] = parse.parse_money(listing[k])
            if listing[k] is not None and listing[k] <= 0:
                listing[k] = None
    if listing.get("rent_total") is None and listing.get("rent_net") is not None:
        listing["rent_total"] = round(listing["rent_net"] + (listing.get("service_costs") or 0), 2)
    for k in ("area_m2", "rooms", "bedrooms", "reactions", "build_year"):
        if listing.get(k) is not None:
            listing[k] = parse.parse_int(listing[k])
            if listing[k] == 0:
                listing[k] = None
    if listing.get("house_number_addition"):
        listing["house_number_addition"] = str(listing["house_number_addition"]).strip(" -").upper() or None

    if not listing.get("title"):
        parts = [listing.get("street"), listing.get("house_number"), listing.get("house_number_addition")]
        listing["title"] = " ".join(str(p) for p in parts if p) or None

    listing["address_key"] = parse.address_key(listing.get("street"), listing.get("house_number"), listing.get("house_number_addition"), listing.get("city"))

    if not listing.get("status"):
        listing["status"] = parse.detect_status(listing.get("status_text"))
    if not listing.get("allocation_model"):
        listing["allocation_model"] = parse.detect_allocation(listing.get("description"))
    if not listing.get("target_group"):
        listing["target_group"] = parse.detect_target_group(" ".join(filter(None, [listing.get("title"), listing.get("allocation_model"), listing.get("income_text"), listing.get("age_text")])))
    if not listing.get("landlord") and listing["source_type"] == "corporatie":
        listing["landlord"] = parse.detect_landlord(listing.get("description"))

    if not listing.get("segment"):
        blob = " ".join(str(listing.get(k) or "") for k in ("allocation_model", "title", "property_type", "status_text")).lower()
        if "middenhuur" in blob:
            listing["segment"] = "Middenhuur"
        elif "vrije sector" in blob:
            listing["segment"] = "Vrije sector"
        elif listing["source_type"] == "corporatie":
            listing["segment"] = "Sociale huur"
        else:
            listing["segment"] = "Vrije sector"

    listing["images"] = parse.iter_unique(listing.get("images") or [])[:20]
    listing["features"] = parse.iter_unique(listing.get("features") or [])
    return listing


def in_region(listing: dict) -> bool:
    return parse.canonical_place(listing.get("city")) is not None
