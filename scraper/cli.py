"""Opdrachtregel: `python -m scraper` scrapet alle bronnen en schrijft data/huurwoningen.json."""
from __future__ import annotations

import argparse
import sys
import time
import traceback
from datetime import date
from pathlib import Path

from . import config, model, store
from .fetch import FetchError, Fetcher
from .sources import REGISTRY
from .sources.generic import GenericSite
from .sources.base import Options


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        prog="python -m scraper",
        description="Scrapet huurwoningen in Alkmaar, Dijk en Waard, Schagen, Obdam en Ursem naar data/huurwoningen.json",
    )
    ap.add_argument("--bronnen", help="komma-gescheiden bron-id's, bijv. svnk,funda (standaard: alle). Zie --lijst")
    ap.add_argument("--soort", help="alleen bronnen van dit type: corporatie, platform, makelaar, verhuurder (komma-gescheiden)")
    ap.add_argument("--lijst", action="store_true", help="toon beschikbare bronnen en stop")
    ap.add_argument("--browser", choices=["auto", "altijd", "nooit"], default="auto",
                    help="Playwright gebruiken: auto = alleen bij blokkade/JS-pagina's (standaard)")
    ap.add_argument("--geen-details", action="store_true", help="geen detailpagina's ophalen (sneller, minder velden)")
    ap.add_argument("--details-opnieuw", action="store_true", help="detailpagina's opnieuw ophalen, ook als ze al bekend zijn")
    ap.add_argument("--max-paginas", type=int, default=config.MAX_PAGINAS, help="max. zoekresultaatpagina's per zoekopdracht")
    ap.add_argument("--vertraging", type=float, default=config.VERTRAGING_SEC, help="seconden pauze tussen verzoeken per site")
    ap.add_argument("--dump", action="store_true", help="ruwe HTML/JSON bewaren in scraper/.cache/raw (voor debuggen)")
    ap.add_argument("--uitvoer", type=Path, default=config.OUTPUT_JSON, help="pad van het JSON-bestand")
    ap.add_argument("-v", "--verbose", action="store_true", help="volledige foutmeldingen tonen")
    return ap


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.lijst:
        for sid, cfg in config.BRONNEN.items():
            mark = "" if cfg.get("url_gezien", True) else "  (url nog controleren)"
            print(f"{sid:20} {cfg['naam']:32} {cfg['type']:11} {cfg['base']}{mark}")
        counts = {}
        for cfg in config.BRONNEN.values():
            counts[cfg["type"]] = counts.get(cfg["type"], 0) + 1
        print(f"\n{len(config.BRONNEN)} bronnen: " + ", ".join(f"{v} {k}" for k, v in counts.items()))
        return 0

    wanted = list(config.BRONNEN) if not args.bronnen else [s.strip() for s in args.bronnen.split(",") if s.strip()]
    unknown = [s for s in wanted if s not in config.BRONNEN]
    if unknown:
        print(f"Onbekende bron(nen): {', '.join(unknown)}. Zie: python -m scraper --lijst", file=sys.stderr)
        return 2
    if args.soort:
        # 'makelaars' en 'makelaar' werken allebei
        types = {t.strip().lower().rstrip("s") for t in args.soort.split(",") if t.strip()}
        wanted = [s for s in wanted if config.BRONNEN[s]["type"].rstrip("s") in types]
        if not wanted:
            print("Geen bronnen van dat type. Kies uit: corporatie, platform, makelaar, verhuurder", file=sys.stderr)
            return 2

    today = date.today()
    previous = store.load(args.uitvoer)
    known = {l["id"]: l for l in previous.get("listings", [])}
    opts = Options(details=not args.geen_details, max_pages=args.max_paginas, known=known, refresh_details=args.details_opnieuw, today=today)
    fetcher = Fetcher(browser=args.browser, delay=args.vertraging, dump_dir=(config.CACHE_DIR / "raw") if args.dump else None)

    runs: dict[str, dict] = {}
    current: list[dict] = []
    try:
        for sid in wanted:
            cfg = {"id": sid, **config.BRONNEN[sid]}
            print(f"→ {cfg['naam']} ({cfg['base']})")
            started = time.time()
            run = {"id": sid, "name": cfg["naam"], "type": cfg["type"], "url": cfg["base"], "description": cfg.get("omschrijving"),
                   "url_checked": cfg.get("url_gezien", True),
                   "status": "ok", "count": 0, "found": 0, "complete": True, "error": None, "notes": [], "scraped_at": store.now_iso()}
            try:
                source = REGISTRY.get(sid, GenericSite)(cfg, fetcher, opts, log=print)
                result = source.scrape()
                kept, skipped_no_city = [], 0
                for listing in result.listings:
                    model.normalize(listing, today=today)
                    if model.in_region(listing):
                        kept.append(listing)
                    elif not listing.get("city"):
                        skipped_no_city += 1
                run.update(found=len(result.listings), count=len(kept), complete=result.complete, notes=result.notes[:8])
                if skipped_no_city:
                    run["notes"].append(f"{skipped_no_city} advertentie(s) zonder herkenbare plaats overgeslagen")
                if not kept and not result.listings:
                    run["status"] = "leeg"
                current.extend(kept)
                print(f"   {len(result.listings)} gevonden, {len(kept)} in de regio" + ("" if result.complete else " (niet volledig)"))
            except FetchError as e:
                run.update(status="fout", error=str(e), complete=False)
                print(f"   ✗ {e}")
            except Exception as e:  # onverwachte parserfout: andere bronnen gaan door
                run.update(status="fout", error=f"{type(e).__name__}: {e}", complete=False)
                print(f"   ✗ onverwachte fout: {type(e).__name__}: {e}")
                if args.verbose:
                    traceback.print_exc()
            run["duration_s"] = round(time.time() - started, 1)
            runs[sid] = run
    finally:
        fetcher.close()

    merged = store.merge(previous, current, runs, today)
    prev_runs = {r["id"]: r for r in previous.get("sources", [])}
    all_runs = [runs.get(sid) or prev_runs.get(sid) for sid in config.BRONNEN if runs.get(sid) or prev_runs.get(sid)]
    data = store.build_output(merged, all_runs)
    store.write(args.uitvoer, data)

    counts: dict[str, int] = {}
    for l in data["listings"]:
        counts[l["status"]] = counts.get(l["status"], 0) + 1
    nieuw = sum(1 for l in data["listings"] if l.get("is_new"))
    print(f"\n✓ {len(data['listings'])} advertenties opgeslagen in {args.uitvoer} (+ .js)")
    print("  " + ", ".join([f"{k}: {v}" for k, v in sorted(counts.items())] + [f"nieuw: {nieuw}"]))
    print(f"  {fetcher.requests_made} verzoeken. Open huurwoningen.html om ze te bekijken.")
    failed = [r for r in runs.values() if r["status"] == "fout"]
    return 1 if failed and len(failed) == len(runs) else 0


if __name__ == "__main__":
    raise SystemExit(main())
