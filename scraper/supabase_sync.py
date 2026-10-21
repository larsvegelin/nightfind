"""Wegschrijven naar Supabase (project "scraper"): huur_woningen, huur_bronnen en huur_instellingen.

Sleutel: de service-role/secret key in de omgevingsvariabele SUPABASE_SERVICE_ROLE_KEY
(of SUPABASE_SECRET_KEY), eventueel in een `.env`-bestand in de projectmap (staat in .gitignore).
Deze sleutel mag NOOIT in de HTML-pagina of in git terechtkomen.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

from . import config, model

DEFAULT_URL = "https://gpkohiyzdjyehqdkgpdb.supabase.co"
LISTING_COLUMNS = model.FIELDS + ["details_fetched"]
BRON_COLUMNS = ["id", "name", "type", "url", "description", "url_checked", "status", "count", "found",
                "complete", "error", "notes", "scraped_at", "duration_s"]
JSON_LIST_COLUMNS = {"images", "features", "status_history"}
PAGE_SIZE = 1000


class SupabaseError(Exception):
    pass


def load_env() -> None:
    """Leest KEY=waarde-regels uit .env (projectmap of scraper/) zonder bestaande variabelen te overschrijven."""
    for path in (config.REPO_ROOT / ".env", Path(__file__).resolve().parent / ".env"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class Supabase:
    def __init__(self, url: str, key: str, session: requests.Session | None = None, timeout: float = 60) -> None:
        self.url = url.rstrip("/")
        self.timeout = timeout
        self.session = session or requests.Session()
        self.session.headers.update({"apikey": key, "Content-Type": "application/json", "Accept": "application/json"})
        if key.startswith("eyJ"):  # oude JWT-sleutels gaan ook in Authorization; sb_secret_-sleutels niet
            self.session.headers["Authorization"] = f"Bearer {key}"

    @classmethod
    def from_env(cls) -> "Supabase | None":
        load_env()
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
        if not key:
            return None
        return cls(os.environ.get("SUPABASE_URL") or DEFAULT_URL, key)

    def _request(self, method: str, path: str, **kw) -> requests.Response:
        try:
            r = self.session.request(method, f"{self.url}/rest/v1/{path}", timeout=self.timeout, **kw)
        except requests.RequestException as e:
            raise SupabaseError(f"geen verbinding met Supabase: {e}") from e
        if r.status_code >= 400:
            raise SupabaseError(f"{method} {path.split('?')[0]}: HTTP {r.status_code} {r.text[:300]}")
        return r

    def select_all(self, table: str) -> list[dict]:
        rows: list[dict] = []
        offset = 0
        while True:
            batch = self._request("GET", f"{table}?select=*&order=id&limit={PAGE_SIZE}&offset={offset}").json()
            rows.extend(batch)
            if len(batch) < PAGE_SIZE:
                return rows
            offset += PAGE_SIZE

    def upsert(self, table: str, rows: list[dict], batch: int = 500) -> None:
        for i in range(0, len(rows), batch):
            body = json.dumps(rows[i:i + batch], ensure_ascii=False, default=str).encode("utf-8")
            self._request("POST", f"{table}?on_conflict=id", data=body,
                          headers={"Prefer": "resolution=merge-duplicates,return=minimal"})

    def delete_where_older(self, table: str, column: str, stamp: str) -> None:
        self._request("DELETE", f"{table}?{column}=lt.{quote(stamp, safe='')}", headers={"Prefer": "return=minimal"})

    def update_settings(self, fields: dict) -> None:
        self._request("PATCH", "huur_instellingen?id=eq.true", data=json.dumps(fields, ensure_ascii=False).encode("utf-8"),
                      headers={"Prefer": "return=minimal"})


def listing_row(listing: dict, stamp: str) -> dict:
    row: dict = {}
    for col in LISTING_COLUMNS:
        value = listing.get(col)
        if value == "":
            value = None
        if col in JSON_LIST_COLUMNS and value is None:
            value = []
        row[col] = value
    row["status"] = row["status"] or "beschikbaar"
    row["label_new"] = bool(row["label_new"])
    row["is_new"] = bool(row["is_new"])
    row["details_fetched"] = bool(listing.get("details_fetched") or listing.get("_details_fetched"))
    row["gesynchroniseerd"] = stamp
    return row


def bron_row(run: dict) -> dict:
    row = {col: run.get(col) for col in BRON_COLUMNS}
    row["notes"] = row["notes"] or []
    return row


def load_previous(client: Supabase) -> dict:
    """Vorige stand uit Supabase (als er lokaal nog geen data/huurwoningen.json is, bijv. in GitHub Actions)."""
    listings = client.select_all("huur_woningen")
    for l in listings:
        l.pop("gesynchroniseerd", None)
    return {"generated_at": None, "sources": client.select_all("huur_bronnen"), "listings": listings}


def sync(data: dict, client: Supabase, log=print) -> dict:
    """Schrijft de complete stand weg. Woningen die niet meer in de lijst staan (na 60 dagen offline) worden verwijderd."""
    stamp = datetime.now(timezone.utc).isoformat(timespec="microseconds")
    rows = [listing_row(l, stamp) for l in data.get("listings", [])]
    sources = [bron_row(r) for r in data.get("sources", [])]
    if sources:
        client.upsert("huur_bronnen", sources)
    client.upsert("huur_woningen", rows)
    if rows:
        # Alleen opruimen als er iets is weggeschreven, zodat een lege run nooit alles wist
        client.delete_where_older("huur_woningen", "gesynchroniseerd", stamp)
    client.update_settings({"bijgewerkt": data.get("generated_at"), "regio": (data.get("region") or {}).get("plaatsen") or config.PLAATSEN})
    log(f"✓ Supabase bijgewerkt: {len(rows)} woningen, {len(sources)} bronnen")
    return {"woningen": len(rows), "bronnen": len(sources)}
