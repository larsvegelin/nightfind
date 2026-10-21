"""Makelaars, verhuurders en extra huurplatforms (generieke scraper, zie sources/generic.py).

Per site:
  naam        weergavenaam
  type        "makelaar" | "verhuurder" | "platform"
  base        homepage
  lijst       overzichtspagina('s) met huuraanbod
  zoek_url    optioneel sjabloon per zoekplaats, bijv. "https://site.nl/huren/{slug}/"
  zoekplaatsen optioneel: plaatsen voor zoek_url (standaard config.ZOEKPLAATSEN)
  detail      optioneel regex voor detail-links (anders automatisch herkend)
  render      True als de site JavaScript nodig heeft (Playwright)
  plaatsen    waar de makelaar vooral actief is (informatief)
  omschrijving korte toelichting
"""
from __future__ import annotations

EXTRA_BRONNEN: dict[str, dict] = {}
