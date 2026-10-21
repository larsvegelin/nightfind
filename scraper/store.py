"""Opslag: samenvoegen met de vorige run, status bepalen en wegschrijven naar JSON + JS.

- `first_seen` / `last_seen`: wanneer we de advertentie voor het eerst/laatst zagen.
- Verdwijnt een advertentie bij een bron die wél goed gescand is, dan wordt de status
  'offline' (waarschijnlijk verhuurd); na OFFLINE_BEWAREN_DAGEN valt hij uit de lijst.
- `status_history` houdt bij wanneer de status veranderde (bijv. beschikbaar -> onder optie).
"""
from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from . import config, model

KEEP_FROM_PREVIOUS_EXCLUDE = {"status", "status_text", "label_new", "is_new", "last_seen", "offline_since", "status_history", "first_seen"}


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return {"generated_at": None, "sources": [], "listings": []}


def _days_between(a: str | None, b: date) -> int | None:
    if not a:
        return None
    try:
        return (b - date.fromisoformat(a[:10])).days
    except ValueError:
        return None


def finalize(listing: dict, today: date, source_had_previous_run: bool) -> None:
    status = listing.get("status") or "beschikbaar"
    closing = listing.get("closing_date")
    if status == "beschikbaar" and listing.get("source_type") == "corporatie" and closing and closing < today.isoformat():
        status = "gesloten"
    listing["status"] = status

    is_new = False
    if status == "beschikbaar":
        age = _days_between(listing.get("published_at"), today)
        if listing.get("label_new"):
            is_new = True
        elif age is not None:
            is_new = age <= config.NIEUW_DAGEN
        elif source_had_previous_run:
            seen = _days_between(listing.get("first_seen"), today)
            is_new = seen is not None and seen <= config.NIEUW_DAGEN
    listing["is_new"] = is_new


def _push_history(listing: dict, status: str, when: str) -> None:
    hist = listing.get("status_history") or []
    if not hist or hist[-1].get("status") != status:
        hist.append({"status": status, "since": when})
    listing["status_history"] = hist[-20:]


def merge(previous: dict, current: list[dict], runs: dict[str, dict], today: date) -> list[dict]:
    """Combineert de nieuwe scan met de vorige gegevens."""
    stamp = now_iso()
    prev_runs = {r["id"]: r for r in previous.get("sources", [])}
    prev_by_id = {l["id"]: l for l in previous.get("listings", [])}
    out: dict[str, dict] = {}

    for listing in current:
        prev = prev_by_id.get(listing["id"])
        if prev:
            model.merge_fields(listing, {k: v for k, v in prev.items() if k not in KEEP_FROM_PREVIOUS_EXCLUDE})
            listing["first_seen"] = prev.get("first_seen") or stamp
            listing["status_history"] = prev.get("status_history") or []
            listing["details_fetched"] = bool(listing.get("details_fetched") or prev.get("details_fetched"))
        else:
            listing["first_seen"] = stamp
        listing["last_seen"] = stamp
        listing["offline_since"] = None
        had_prev = prev_runs.get(listing["source"], {}).get("status") == "ok"
        finalize(listing, today, had_prev)
        _push_history(listing, listing["status"], stamp)
        out[listing["id"]] = listing

    for lid, prev in prev_by_id.items():
        if lid in out:
            continue
        run = runs.get(prev.get("source"))
        source_scanned_fully = bool(run and run.get("status") == "ok" and run.get("complete") and run.get("count", 0) > 0)
        if not source_scanned_fully:
            # bron niet (volledig) gescand: vorige gegevens ongewijzigd laten staan
            prev = dict(prev)
            if prev.get("status") != "offline":
                finalize(prev, today, True)
            out[lid] = prev
            continue
        if prev.get("status") != "offline":
            prev = dict(prev)
            prev["status"] = "offline"
            prev["is_new"] = False
            prev["offline_since"] = stamp
            _push_history(prev, "offline", stamp)
        age = _days_between(prev.get("offline_since"), today)
        if age is not None and age > config.OFFLINE_BEWAREN_DAGEN:
            continue
        out[lid] = prev

    return list(out.values())


def ordered(listing: dict) -> dict:
    data = {k: listing.get(k) for k in model.FIELDS}
    data["details_fetched"] = bool(listing.get("details_fetched") or listing.get("_details_fetched"))
    for k, v in listing.items():
        if k not in data and not k.startswith("_"):
            data[k] = v
    return data


def write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=1)
    path.write_text(payload + "\n", encoding="utf-8")
    js_path = path.with_suffix(".js")
    js_path.write_text(
        "// Automatisch gegenereerd door `python -m scraper` – niet met de hand aanpassen.\n"
        "window.HUURWONINGEN_DATA = " + payload + ";\n",
        encoding="utf-8",
    )


def build_output(listings: list[dict], runs: list[dict]) -> dict[str, Any]:
    status_order = {"beschikbaar": 0, "onder_optie": 1, "verhuurd_ovb": 2, "gesloten": 3, "verhuurd": 4, "offline": 5}
    listings = sorted(
        (ordered(l) for l in listings),
        key=lambda l: (status_order.get(l.get("status"), 9), -(int((l.get("published_at") or l.get("first_seen") or "0000-00-00")[:10].replace("-", "")))),
    )
    return {
        "generated_at": now_iso(),
        "region": {
            "plaatsen": config.PLAATSEN,
            "gemeenten": sorted(set(config.PLAATSEN.values())),
        },
        "settings": {"nieuw_dagen": config.NIEUW_DAGEN, "offline_bewaren_dagen": config.OFFLINE_BEWAREN_DAGEN},
        "sources": runs,
        "listings": listings,
    }
