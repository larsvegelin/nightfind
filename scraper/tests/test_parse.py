"""Tests voor de parse-hulpjes en de opslaglogica. Draaien: python -m unittest discover scraper/tests"""
from __future__ import annotations

import unittest
from datetime import date

from scraper import model, parse, store
from scraper.sources.base import Options
from scraper.sources.pararius import Pararius
from scraper.sources.zig import ZigPortal

TODAY = date(2026, 10, 21)


class MoneyAndNumbers(unittest.TestCase):
    def test_money(self):
        self.assertEqual(parse.parse_money("€ 1.234,56 per maand"), 1234.56)
        self.assertEqual(parse.parse_money("€950,-"), 950.0)
        self.assertEqual(parse.parse_money("€ 1.450 /maand"), 1450.0)
        self.assertEqual(parse.parse_money("€ 932,93"), 932.93)
        self.assertEqual(parse.parse_money(812.5), 812.5)
        self.assertIsNone(parse.parse_money("op aanvraag"))

    def test_area_rooms_label(self):
        self.assertEqual(parse.parse_area("75 m²"), 75)
        self.assertEqual(parse.parse_area("88,5 m2"), 88)
        self.assertEqual(parse.parse_energy_label("A++"), "A++")
        self.assertEqual(parse.parse_energy_label("Energieklasse B"), "B")
        self.assertIsNone(parse.parse_energy_label("Appartement"))
        self.assertEqual(parse.parse_postcode("1811ab Alkmaar"), None)
        self.assertEqual(parse.parse_postcode("1811AB Alkmaar"), "1811 AB")


class Dates(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(parse.parse_date("2026-10-18T09:00:00+02:00", TODAY), "2026-10-18")
        self.assertEqual(parse.parse_date("18-10-2026", TODAY), "2026-10-18")
        self.assertEqual(parse.parse_date("18 okt. 2026", TODAY), "2026-10-18")
        self.assertEqual(parse.parse_date("vrijdag 18 oktober", TODAY, past=True), "2026-10-18")
        self.assertEqual(parse.parse_date("vandaag", TODAY), "2026-10-21")
        self.assertEqual(parse.parse_date("3 dagen", TODAY, past=True), "2026-10-18")
        self.assertEqual(parse.parse_date("2 weken", TODAY, past=True), "2026-10-07")

    def test_year_inference(self):
        # plaatsing in december, nu oktober -> vorig jaar
        self.assertEqual(parse.parse_date("12 december", TODAY, past=True), "2025-12-12")
        # sluitdatum in januari -> volgend jaar
        self.assertEqual(parse.parse_date("5 januari", TODAY, past=False), "2027-01-05")


class Status(unittest.TestCase):
    def test_status(self):
        self.assertEqual(parse.detect_status("Verhuurd onder voorbehoud"), "verhuurd_ovb")
        self.assertEqual(parse.detect_status("Onder optie"), "onder_optie")
        self.assertEqual(parse.detect_status("Verhuurd"), "verhuurd")
        self.assertEqual(parse.detect_status("Beschikbaar"), "beschikbaar")
        self.assertEqual(parse.detect_status("geadverteerd geweest van 1 tot 7 mei"), "gesloten")
        self.assertIsNone(parse.detect_status("Verhuurder: Woonwaard"))

    def test_new_label(self):
        self.assertTrue(parse.detect_new_label("Nieuw | Onder optie"))
        self.assertFalse(parse.detect_new_label("Nieuwbouw"))
        self.assertFalse(parse.detect_new_label("Nieuwe Niedorp"))


class Places(unittest.TestCase):
    def test_canonical(self):
        self.assertEqual(parse.canonical_place("ALKMAAR"), "Alkmaar")
        self.assertEqual(parse.canonical_place("St. Pancras"), "Sint Pancras")
        self.assertEqual(parse.canonical_place("Noord Scharwoude"), "Noord-Scharwoude")
        self.assertEqual(parse.canonical_place("Alkmaar (Centrum)"), "Alkmaar")
        self.assertIsNone(parse.canonical_place("Hoorn"))
        self.assertEqual(parse.municipality_of("Tuitjenhorn"), "Schagen")

    def test_address(self):
        a = parse.parse_address("Dokter Lohmanstraat 21 C te Obdam")
        self.assertEqual((a["street"], a["house_number"], a.get("house_number_addition"), a["city"]), ("Dokter Lohmanstraat", "21", "C", "Obdam"))
        a = parse.parse_address("Appartement Laat 12")
        self.assertEqual((a["property_type"], a["street"], a["house_number"]), ("Appartement", "Laat", "12"))
        a = parse.address_from_segments("Laat 12 | 1811 EK Alkmaar (Centrum) | € 1.450 /maand")
        self.assertEqual((a["street"], a["postcode"], a["city"], a["neighbourhood"]), ("Laat", "1811 EK", "Alkmaar", "Centrum"))


class TextFields(unittest.TestCase):
    def test_woonmatch_period(self):
        text = "Dubbelspoor 26 te Obdam | € 932,93 | 4 kamers | 88 m² | Energieklasse A | geadverteerd van vrijdag 16 oktober tot donderdag 22 oktober | Loting"
        f = parse.fields_from_text(text, TODAY)
        self.assertEqual(f["rent_total"], 932.93)
        self.assertEqual(f["rooms"], 4)
        self.assertEqual(f["area_m2"], 88)
        self.assertEqual(f["energy_label"], "A")
        self.assertEqual(f["published_at"], "2026-10-16")
        self.assertEqual(f["closing_date"], "2026-10-22")
        self.assertEqual(f["allocation_model"], "Loting")

    def test_kv(self):
        html = """<dl><dt>Aangeboden sinds</dt><dd>3 weken</dd><dt>Status</dt><dd>Verhuurd onder voorbehoud</dd>
        <dt>Huurprijs</dt><dd>€ 1.395 per maand</dd><dt>Woonoppervlakte</dt><dd>72 m²</dd>
        <dt>Aantal kamers</dt><dd>3 kamers (2 slaapkamers)</dd><dt>Energielabel</dt><dd>B</dd>
        <dt>Aanvaarding</dt><dd>Per 1 november 2026</dd></dl>"""
        f = parse.map_kv(parse.kv_pairs(parse.soup_of(html)), TODAY)
        self.assertEqual(f["published_at"], "2026-09-30")
        self.assertEqual(f["status_text"], "Verhuurd onder voorbehoud")
        self.assertEqual(f["rent_total"], 1395.0)
        self.assertEqual(f["area_m2"], 72)
        self.assertEqual(f["rooms"], 3)
        self.assertEqual(f["energy_label"], "B")
        self.assertEqual(f["available_from"], "2026-11-01")


class FakeFetcher:
    def __init__(self, pages=None):
        self.pages = pages or {}

    def get(self, url, **kw):
        from scraper.fetch import FetchError, Page
        if url in self.pages:
            return Page(url, 200, self.pages[url])
        raise FetchError(f"HTTP 404 bij {url}")

    post = get


class SourceParsers(unittest.TestCase):
    def test_pararius_cards(self):
        html = """<ul><li class="search-list__item search-list__item--listing"><section class="listing-search-item">
          <div class="listing-search-item__label"><span class="listing-label listing-label--new">Nieuw</span></div>
          <h2 class="listing-search-item__title"><a class="listing-search-item__link listing-search-item__link--title" href="/appartement-te-huur/alkmaar/1a2b3c4d/laat">Appartement Laat 12</a></h2>
          <div class="listing-search-item__sub-title">1811 EK Alkmaar (Centrum)</div>
          <div class="listing-search-item__price">€1.450 per maand</div>
          <ul class="illustrated-features"><li class="illustrated-features__item illustrated-features__item--surface-area">72 m²</li>
          <li class="illustrated-features__item illustrated-features__item--number-of-rooms">3 kamers</li>
          <li class="illustrated-features__item illustrated-features__item--interior">Gestoffeerd</li></ul>
          <div class="listing-search-item__info"><a href="/makelaars/alkmaar/x">Voorbeeld Makelaars</a></div>
        </section></li></ul>"""
        cfg = {"id": "pararius", "naam": "Pararius", "type": "commercieel", "base": "https://www.pararius.nl"}
        src = Pararius(cfg, FakeFetcher(), Options(details=False, today=TODAY), log=lambda *a: None)
        cards = src.parse_cards(html, "https://www.pararius.nl/huurwoningen/alkmaar", "Alkmaar")
        self.assertEqual(len(cards), 1)
        url, f = cards[0]
        self.assertEqual(url, "https://www.pararius.nl/appartement-te-huur/alkmaar/1a2b3c4d/laat")
        self.assertEqual((f["street"], f["house_number"], f["city"], f["postcode"]), ("Laat", "12", "Alkmaar", "1811 EK"))
        self.assertEqual((f["rent_total"], f["area_m2"], f["rooms"], f["interior"]), (1450.0, 72, 3, "Gestoffeerd"))
        self.assertTrue(f["label_new"])
        self.assertEqual(f["landlord"], "Voorbeeld Makelaars")
        self.assertEqual(model.id_from_url(url), "1a2b3c4d")

    def test_zig_object(self):
        cfg = {"id": "svnk", "naam": "SVNK", "type": "corporatie", "base": "https://www.svnk.nl"}
        src = ZigPortal(cfg, FakeFetcher(), Options(today=TODAY), log=lambda *a: None)
        obj = {
            "id": 25862, "urlKey": "25862-europaplein-79-alkmaar", "street": "Europaplein", "houseNumber": "79",
            "houseNumberAddition": "", "postalcode": "1823CA", "city": {"name": "Alkmaar"}, "rentBuy": "Huur",
            "totalRent": "812.40", "netRent": 760.1, "serviceCosts": 52.3, "areaDwelling": 64,
            "sleepingRoom": {"amountOfRooms": "2"}, "energyLabel": {"localizedName": "B"},
            "dwellingType": {"localizedName": "Galerijflat"}, "corporation": {"name": "Van Alckmaer"},
            "publicationDate": "2026-10-20 00:00:00", "closingDate": "2026-10-23 23:59:59",
            "model": {"localizedName": "Loting", "modelCategorie": {"code": "loting"}},
            "pictures": [{"uri": "/portal/image/1.jpg"}],
        }
        l = src._from_api_object(obj)
        model.normalize(l, today=TODAY)
        self.assertEqual(l["url"], "https://www.svnk.nl/aanbod/te-huur/details/25862-europaplein-79-alkmaar")
        self.assertEqual((l["street"], l["house_number"], l["postcode"], l["city"], l["municipality"]), ("Europaplein", "79", "1823 CA", "Alkmaar", "Alkmaar"))
        self.assertEqual((l["rent_total"], l["rent_net"], l["area_m2"], l["bedrooms"], l["energy_label"]), (812.4, 760.1, 64, 2, "B"))
        self.assertEqual((l["published_at"], l["closing_date"], l["allocation_model"], l["landlord"]), ("2026-10-20", "2026-10-23", "Loting", "Van Alckmaer"))
        self.assertEqual(l["images"], ["https://www.svnk.nl/portal/image/1.jpg"])
        self.assertEqual(l["segment"], "Sociale huur")


class StoreLogic(unittest.TestCase):
    cfg = {"id": "funda", "naam": "Funda", "type": "commercieel"}

    def _l(self, sid, **kw):
        l = model.new_listing(sid, self.cfg, city="Alkmaar", street="Laat", house_number="1", **kw)
        return model.normalize(l, today=TODAY)

    def test_new_and_offline(self):
        a = self._l("1", published_at="2026-10-20")
        b = self._l("2", published_at="2026-09-01")
        runs = {"funda": {"status": "ok", "complete": True, "count": 2}}
        first = store.merge({"sources": [], "listings": []}, [a, b], runs, TODAY)
        by = {l["id"]: l for l in first}
        self.assertTrue(by["funda:1"]["is_new"])
        self.assertFalse(by["funda:2"]["is_new"])
        self.assertEqual(by["funda:1"]["status"], "beschikbaar")

        prev = {"sources": [{"id": "funda", "status": "ok"}], "listings": first}
        c = self._l("1", published_at="2026-10-20", status="onder_optie")
        second = store.merge(prev, [c], {"funda": {"status": "ok", "complete": True, "count": 1}}, TODAY)
        by = {l["id"]: l for l in second}
        self.assertEqual(by["funda:1"]["status"], "onder_optie")
        self.assertEqual([h["status"] for h in by["funda:1"]["status_history"]], ["beschikbaar", "onder_optie"])
        self.assertEqual(by["funda:2"]["status"], "offline")

    def test_failed_source_keeps_data(self):
        a = self._l("1")
        prev = {"sources": [{"id": "funda", "status": "ok"}], "listings": store.merge({"listings": []}, [a], {}, TODAY)}
        out = store.merge(prev, [], {"funda": {"status": "fout", "complete": False, "count": 0}}, TODAY)
        self.assertEqual(out[0]["status"], "beschikbaar")

    def test_corporation_closed(self):
        cfg = {"id": "svnk", "naam": "SVNK", "type": "corporatie"}
        l = model.normalize(model.new_listing("9", cfg, city="Heerhugowaard", closing_date="2026-10-19"), today=TODAY)
        out = store.merge({"listings": []}, [l], {}, TODAY)
        self.assertEqual(out[0]["status"], "gesloten")


if __name__ == "__main__":
    unittest.main()
