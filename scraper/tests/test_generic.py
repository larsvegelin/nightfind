"""Tests voor de generieke makelaar-/verhuurderscraper. Draaien: python -m unittest discover -s scraper/tests -t ."""
from __future__ import annotations

import unittest
from datetime import date

from scraper import model, parse
from scraper.fetch import FetchError, Page
from scraper.sources.base import Options
from scraper.sources.generic import GenericSite, auto_detail_cards, is_sale_text, next_page_url

TODAY = date(2026, 10, 21)
BASE = "https://www.voorbeeldmakelaars.nl"
LIST = BASE + "/aanbod/woningaanbod/huur/"

PAGE1 = """<html><body>
<nav><a href="/">Home</a><a href="/aanbod/woningaanbod/huur/">Huur</a><a href="/contact">Contact</a>
<a href="https://www.facebook.com/voorbeeld">Facebook</a><a href="/waardebepaling">Gratis waardebepaling</a></nav>
<main><div class="aanbod">
  <article class="object">
    <a href="/aanbod/woningaanbod/alkmaar/huur/huis-1234567-laat-12/"><img src="/media/laat12.jpg" alt=""></a>
    <h3><a href="/aanbod/woningaanbod/alkmaar/huur/huis-1234567-laat-12/">Laat 12</a></h3>
    <div>1811 EK Alkmaar</div><div>€ 1.450,- /mnd</div><span>75 m²</span><span>3 kamers</span>
    <span class="label">Nieuw</span>
  </article>
  <article class="object">
    <a href="/aanbod/woningaanbod/heerhugowaard/huur/appartement-7654321-middenweg-5/"><h3>Middenweg 5</h3></a>
    <div>1701 AA Heerhugowaard</div><span class="status">Verhuurd</span><span>60 m²</span>
  </article>
  <article class="object">
    <a href="/aanbod/woningaanbod/bergen/huur/huis-1111111-dorpsstraat-1/"><h3>Dorpsstraat 1</h3></a>
    <div>1861 AB Bergen</div><div>€ 1.800 per maand</div>
  </article>
  <article class="object">
    <a href="/aanbod/woningaanbod/alkmaar/koop/huis-2222222-koopweg-3/"><h3>Koopweg 3</h3></a>
    <div>1812 AA Alkmaar</div><div>€ 425.000 k.k.</div>
  </article>
</div>
<div class="pagination"><a href="?page=1">1</a><a href="?page=2">2</a></div>
</main><footer><a href="/privacy">Privacy</a></footer></body></html>"""

PAGE2 = """<html><body><main>
  <div class="object"><a href="/aanbod/woningaanbod/sint-pancras/huur/huis-3333333-bovenweg-8-a/">
    <strong>Bovenweg 8 A</strong><p>1834 AB Sint Pancras</p><p>Huurprijs € 1.275 p/m</p><p>Onder optie</p></a></div>
</main></body></html>"""

DETAIL_LAAT = """<html><head><title>Laat 12, Alkmaar</title></head><body><main>
<h1>Laat 12</h1><p>1811 EK Alkmaar</p>
<dl><dt>Huurprijs</dt><dd>€ 1.450 per maand</dd><dt>Aangeboden sinds</dt><dd>12 oktober 2026</dd>
<dt>Energielabel</dt><dd>A</dd><dt>Bouwjaar</dt><dd>1932</dd><dt>Aanvaarding</dt><dd>1 december 2026</dd>
<dt>Interieur</dt><dd>Gestoffeerd</dd></dl>
<div class="omschrijving">Sfeervolle woning in het centrum.</div></main></body></html>"""


class FakeFetcher:
    browser_mode = "nooit"

    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def get(self, url, **kw):
        self.calls.append(url)
        if url in self.pages:
            return Page(url, 200, self.pages[url])
        raise FetchError(f"HTTP 404 bij {url}")


class GenericHelpers(unittest.TestCase):
    def test_sale_detection(self):
        self.assertTrue(is_sale_text("€ 425.000 k.k."))
        self.assertTrue(is_sale_text("Vraagprijs € 300.000 v.o.n."))
        self.assertFalse(is_sale_text("Huurprijs € 1.250 per maand"))

    def test_auto_cards(self):
        soup = parse.soup_of(PAGE1)
        hrefs = [h for h, _ in auto_detail_cards(soup, LIST)]
        self.assertEqual(len(hrefs), 3)  # 3 huurkaarten; koop (€ 425.000) heeft geen huurprijs
        self.assertTrue(all("/huur/" in h for h in hrefs))
        self.assertFalse(any("contact" in h or "facebook" in h or "waardebepaling" in h for h in hrefs))

    def test_next_page(self):
        self.assertEqual(next_page_url(parse.soup_of(PAGE1), LIST, 1), LIST + "?page=2")
        self.assertIsNone(next_page_url(parse.soup_of(PAGE2), LIST + "?page=2", 2))


class GenericScrape(unittest.TestCase):
    def test_scrape_listing_pages_and_details(self):
        laat = BASE + "/aanbod/woningaanbod/alkmaar/huur/huis-1234567-laat-12"
        fetcher = FakeFetcher({LIST: PAGE1, LIST + "?page=2": PAGE2, laat: DETAIL_LAAT})
        cfg = {"id": "voorbeeld", "naam": "Voorbeeld Makelaars", "type": "makelaar", "base": BASE, "lijst": [LIST]}
        src = GenericSite(cfg, fetcher, Options(today=TODAY), log=lambda *a: None)
        result = src.scrape()
        listings = [model.normalize(l, today=TODAY) for l in result.listings]
        in_region = {l["street"]: l for l in listings if model.in_region(l)}

        self.assertEqual(set(in_region), {"Laat", "Middenweg", "Bovenweg"})
        self.assertNotIn("Koopweg", {l.get("street") for l in listings})
        # Bergen valt buiten de regio en krijgt geen detailverzoek
        self.assertFalse(any("bergen" in c for c in fetcher.calls))

        l = in_region["Laat"]
        self.assertEqual((l["house_number"], l["postcode"], l["city"], l["municipality"]), ("12", "1811 EK", "Alkmaar", "Alkmaar"))
        self.assertEqual((l["rent_total"], l["area_m2"], l["rooms"]), (1450.0, 75, 3))
        self.assertEqual((l["published_at"], l["energy_label"], l["build_year"], l["available_from"]), ("2026-10-12", "A", 1932, "2026-12-01"))
        self.assertTrue(l["label_new"])
        self.assertEqual(l["landlord"], "Voorbeeld Makelaars")
        self.assertEqual(l["images"], [BASE + "/media/laat12.jpg"])
        self.assertEqual(l["segment"], "Vrije sector")

        self.assertEqual(in_region["Middenweg"]["status"], "verhuurd")
        self.assertEqual(in_region["Middenweg"]["city"], "Heerhugowaard")
        b = in_region["Bovenweg"]
        self.assertEqual((b["house_number"], b.get("house_number_addition"), b["city"], b["status"], b["rent_total"]), ("8", "A", "Sint Pancras", "onder_optie", 1275.0))

    def test_zoek_url_template(self):
        cfg = {"id": "x", "naam": "X", "type": "platform", "base": "https://x.nl", "zoek_url": "https://x.nl/huren/{slug}/", "zoekplaatsen": ["Sint Pancras", "Alkmaar"]}
        src = GenericSite(cfg, FakeFetcher({}), Options(today=TODAY), log=lambda *a: None)
        self.assertEqual(src.list_urls(), ["https://x.nl/huren/sint-pancras/", "https://x.nl/huren/alkmaar/"])

    def test_all_pages_missing_raises_nothing_found(self):
        cfg = {"id": "x", "naam": "X", "type": "makelaar", "base": "https://x.nl", "lijst": ["https://x.nl/huur"]}
        src = GenericSite(cfg, FakeFetcher({}), Options(today=TODAY), log=lambda *a: None)
        self.assertEqual(src.scrape().listings, [])


if __name__ == "__main__":
    unittest.main()
