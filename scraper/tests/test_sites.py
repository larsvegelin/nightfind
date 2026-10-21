"""Controleert de siteconfiguratie en de linkpatronen tegen echte advertentie-URL's
die in oktober 2026 in zoekresultaten zijn gezien."""
from __future__ import annotations

import re
import unittest
from datetime import date

from scraper import config, model, parse
from scraper.sources import REGISTRY
from scraper.sources.funda import DETAIL_RX as FUNDA_RX
from scraper.sources.funda import Funda
from scraper.sources.pararius import Pararius

TODAY = date(2026, 10, 21)

# bron-id -> (URL's die WEL een woning zijn, URL's die GEEN woning zijn)
SEEN = {
    "pinedo": (["https://pinedo.nl/woningaanbod/tuinderspad-133-2/", "https://pinedo.nl/woningaanbod/voordam-1-a/"], ["https://pinedo.nl/huurwoningen/"]),
    "072wonen": (["https://www.072wonen.nl/woningaanbod/huur/alkmaar/rijperwaard/3"], ["https://www.072wonen.nl/woningaanbod/huur/alkmaar/type-woonhuis", "https://www.072wonen.nl/woningaanbod/huur/alkmaar"]),
    "123wonen": (["https://www.123wonen.nl/huur/alkmaar/appartement/kooimeerlaan-1167-20", "https://www.123wonen.nl/huur/alkmaar/appartement/annie+m.g.+schmidtstraat-1086-20",
                  "https://www.123wonen.nl/huur/heerhugowaard/appartement/lindenlaan-1051-20"], ["https://www.123wonen.nl/huurwoningen/in/alkmaar"]),
    "vanderborden": (["https://www.vanderborden.nl/aanbod/huur/oudegracht-3-b/", "https://www.vanderborden.nl/woning/alkmaar-fabriekserf-ong/"], ["https://www.vanderborden.nl/aanbod/huur/", "https://www.vanderborden.nl/aanbod/huur/page/2/"]),
    "leygraaf": (["https://leygraafmakelaars.nl/woningen/noorderkade-20-f-alkmaar-90513727877c9c7a6942f8a1006cebc9cf1d64/"], ["https://leygraafmakelaars.nl/huurwoningen/"]),
    "scbakker": (["https://www.scbakker.nl/woningen/gedempte-gracht-27-07-schagen-3134689cb37a3315944c69d440cb3272d5e41/"], ["https://www.scbakker.nl/aanbod/woningaanbod/SCHAGEN/huur/"]),
    "vlieg": (["https://www.vlieg.nl/woning/heerhugowaard-coolplein-21/", "https://www.vlieg.nl/en/woning/alkmaar-laat-1/"], ["https://www.vlieg.nl/woningen/"]),
    "rotsvast": (["https://www.rotsvast.nl/en/alkmaar-winkelwaard-H102650274/", "https://rotsvast.nl/heerhugowaard-zeearend-H102650288"], ["https://www.rotsvast.nl/en/renting-apartment-alkmaar/"]),
    "nederwoon": (["https://www.nederwoon.nl/huurwoning/alkmaar/25151/appartement-jan-van-goyenstraat"], ["https://www.nederwoon.nl/search?city=Alkmaar"]),
    "vbt": (["https://vbtverhuurmakelaars.nl/woning/heerhugowaard-lapis-lazuli-175"], ["https://vbtverhuurmakelaars.nl/woningen"]),
    "ikwilhuren": (["https://ikwilhuren.nu/object/alkmaar-1813se-12-schelphoek-472e2b05f871d3fb2b83e47e96689272/", "https://ikwilhuren.nu/heerhugowaard/jade-37-tm-92/jade-61/34426355"],
                   ["https://ikwilhuren.nu/aanbod/alkmaar/", "https://ikwilhuren.nu/aanbod/binnenkort-beschikbaar/"]),
    "vesteda": (["https://www.vesteda.com/nl/braspenningstraat/braspenningstraat-75-alkmaar-36695", "https://www.vesteda.com/en/dampkring/dampkring-457-heerhugowaard-38477"],
                ["https://www.vesteda.com/nl/dampkring", "https://www.vesteda.com/nl/huurwoningen-alkmaar"]),
    "directwonen": (["https://directwonen.nl/en/rentals-for-rent/alkmaar/voordam/apartment-467868", "https://directwonen.nl/appartement-huren/heerhugowaard/raadhuisplein/appartement-327981"],
                    ["https://directwonen.nl/en/rentals-for-rent/alkmaar"]),
    "huurstunt": (["https://www.huurstunt.nl/appartement/huren/in/alkmaar/breedstraat/a4x96"], ["https://www.huurstunt.nl/huren/heerhugowaard"]),
    "rentola": (["https://rentola.nl/en/listings/woning-te-huur-kogerlaan-36b-78-1741da-schagen-d5da3f"], ["https://rentola.nl/huren/obdam"]),
    "huurportaal": (["https://huurportaal.nl/listings/appartement-te-huur-kennemerstraatweg-21-b-in-alkmaar-voor-1-200-p7adea2"], ["https://huurportaal.nl/huurwoningen/obdam"]),
    "kamer_nl": (["https://www.kamer.nl/huren/appartement-alkmaar/judith-leysterstraat/668383/"], ["https://www.kamer.nl/huren/appartement-alkmaar/"]),
    "huislijn": (["https://www.huislijn.nl/huurwoning/nederland/noord-holland/4334935/stetwaard-alkmaar"], ["https://www.huislijn.nl/huurwoning/nederland/noord-holland/alkmaar/centrum"]),
    "vastgoednederland": (["https://www.vastgoednederland.nl/huurwoningen/alkmaar/woning-660057-stationsweg-103"], ["https://www.vastgoednederland.nl/huurwoningen/alkmaar"]),
}


class SiteConfig(unittest.TestCase):
    def test_every_source_is_complete(self):
        for sid, cfg in config.BRONNEN.items():
            with self.subTest(sid):
                self.assertTrue(cfg.get("naam") and cfg.get("base", "").startswith("https://"))
                self.assertIn(cfg["type"], ("corporatie", "platform", "makelaar", "verhuurder"))
                if sid not in REGISTRY:
                    self.assertTrue(cfg.get("lijst") or cfg.get("zoek_url"), "generieke bron zonder lijst/zoek_url")
                    for u in cfg.get("lijst", []):
                        self.assertTrue(u.startswith("https://"))
                if cfg.get("detail"):
                    re.compile(cfg["detail"])
                for p in cfg.get("zoekplaatsen", []):
                    self.assertIsNotNone(parse.canonical_place(p), p)

    def test_detail_patterns_match_seen_urls(self):
        for sid, (good, bad) in SEEN.items():
            rx = re.compile(config.BRONNEN[sid]["detail"], re.I)
            for u in good:
                with self.subTest(sid=sid, url=u):
                    self.assertTrue(rx.search(u))
            for u in bad:
                with self.subTest(sid=sid, url=u, expect="geen woning"):
                    self.assertFalse(rx.search(u))

    def test_funda_rented_urls(self):
        u = "https://www.funda.nl/en/detail/huur/verhuurd/heerhugowaard/appartement-dione-25/43275681/"
        self.assertTrue(re.search(FUNDA_RX, u))
        self.assertEqual(Funda.canonical(u), "https://www.funda.nl/detail/huur/verhuurd/heerhugowaard/appartement-dione-25/43275681/")
        self.assertEqual(Funda.canonical("https://www.funda.nl/detail/huur/sint-pancras/huis-gedempte-veert-143/89666286/kenmerken/"),
                         "https://www.funda.nl/detail/huur/sint-pancras/huis-gedempte-veert-143/89666286/")
        self.assertEqual(model.id_from_url(u), "43275681")

    def test_pararius_listing_uuid(self):
        rx = re.compile(Pararius.detail_rx)
        self.assertTrue(rx.search("https://www.pararius.com/en/listing/9e4adb87-b284-580c-9978-61060ff411fe"))
        self.assertTrue(rx.search("https://www.pararius.nl/appartement-te-huur/alkmaar/1a2b3c4d/laat"))
        self.assertFalse(rx.search("https://www.pararius.nl/huurwoningen/alkmaar"))


class NewLabels(unittest.TestCase):
    def test_status_labels_from_new_sites(self):
        self.assertEqual(parse.detect_status("Binnenkort in de verhuur"), "binnenkort")
        self.assertEqual(parse.detect_status("Binnenkort beschikbaar"), "binnenkort")
        self.assertEqual(parse.detect_status("Gereserveerd"), "onder_optie")
        self.assertEqual(parse.detect_status("VERHUURD"), "verhuurd")
        self.assertEqual(parse.detect_status("This property has been rented"), "verhuurd")
        self.assertEqual(parse.detect_status("Je kan niet meer inschrijven"), "gesloten")

    def test_dates_from_new_sites(self):
        f = parse.fields_from_text("Kooimeerlaan | € 1.195 | Per 30-10-2026 beschikbaar", TODAY)
        self.assertEqual(f["available_from"], "2026-10-30")
        f = parse.fields_from_text("Voordam | € 1.350 | posted 4 days ago", TODAY)
        self.assertEqual(f["published_at"], "2026-10-17")


if __name__ == "__main__":
    unittest.main()
