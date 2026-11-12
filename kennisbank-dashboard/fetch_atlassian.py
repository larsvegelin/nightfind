#!/usr/bin/env python3
"""Haalt de Confluence pagina-inventaris op via de Atlassian API (voor «verweesde pagina's»).

Credentials in .atlassian.env naast dit script (NIET in git — staat in .gitignore):
    ATLASSIAN_SITE=https://dewaerdse.atlassian.net
    ATLASSIAN_EMAIL=functioneel-account@dewaerdse.nl
    ATLASSIAN_TOKEN=ATATT...

Gebruik:
    python3 fetch_atlassian.py          # schrijft input/pages/pages.csv
Daarna gewoon `python3 etl.py` draaien.
"""
import base64
import csv
import json
import os
import sys
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
ENV_FILE = BASE / ".atlassian.env"
OUT = BASE / "input" / "pages" / "pages.csv"


def load_env() -> dict:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    for k in ("ATLASSIAN_SITE", "ATLASSIAN_EMAIL", "ATLASSIAN_TOKEN"):
        env.setdefault(k, os.environ.get(k, ""))
        if not env[k]:
            sys.exit(f"Ontbrekend: {k} (zet het in {ENV_FILE.name} of als omgevingsvariabele)")
    return env


def api_get(env: dict, path: str) -> dict:
    url = env["ATLASSIAN_SITE"].rstrip("/") + path
    auth = base64.b64encode(f"{env['ATLASSIAN_EMAIL']}:{env['ATLASSIAN_TOKEN']}".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def fetch_all_pages(env: dict) -> list:
    spaces = {}
    path = "/wiki/api/v2/spaces?limit=250"
    while path:
        data = api_get(env, path)
        for s in data.get("results", []):
            spaces[s["id"]] = (s.get("name") or s.get("key", ""), s.get("key", ""))
        path = (data.get("_links") or {}).get("next")

    pages, path = [], "/wiki/api/v2/pages?limit=250&status=current"
    site = env["ATLASSIAN_SITE"].rstrip("/")
    while path:
        data = api_get(env, path)
        for p in data.get("results", []):
            name, key = spaces.get(p.get("spaceId"), (str(p.get("spaceId", "")), ""))
            pages.append({
                "page_id": str(p["id"]),
                "title": p.get("title", ""),
                "space": name,
                "url": f"{site}/wiki/spaces/{key}/pages/{p['id']}" if key else "",
                "last_modified": ((p.get("version") or {}).get("createdAt") or "")[:10],
                "status": p.get("status", ""),
            })
        path = (data.get("_links") or {}).get("next")
    return pages


def main() -> None:
    env = load_env()
    pages = fetch_all_pages(env)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["page_id", "title", "space", "url", "last_modified", "status"])
        w.writeheader()
        w.writerows(pages)
    print(f"Pagina-inventaris: {len(pages)} pagina's → {OUT}")


if __name__ == "__main__":
    main()
