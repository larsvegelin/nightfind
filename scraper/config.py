"""Instellingen voor de huurwoningen-scraper: regio, bronnen en uitvoerpaden."""
from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
OUTPUT_JSON = DATA_DIR / "huurwoningen.json"
OUTPUT_JS = DATA_DIR / "huurwoningen.js"
CACHE_DIR = Path(__file__).resolve().parent / ".cache"

# ---------------------------------------------------------------------------
# Regio: plaats -> gemeente. Alleen woningen in deze plaatsen worden bewaard.
# Voeg hier plaatsen toe of haal ze weg om de regio aan te passen.
# ---------------------------------------------------------------------------
PLAATSEN: dict[str, str] = {
    "Alkmaar": "Alkmaar",
    "Koedijk": "Alkmaar",
    "Oudorp": "Alkmaar",
    "Heerhugowaard": "Dijk en Waard",
    "Sint Pancras": "Dijk en Waard",
    "Broek op Langedijk": "Dijk en Waard",
    "Noord-Scharwoude": "Dijk en Waard",
    "Zuid-Scharwoude": "Dijk en Waard",
    "Oudkarspel": "Dijk en Waard",
    "Dijk en Waard": "Dijk en Waard",
    "Schagen": "Schagen",
    "Tuitjenhorn": "Schagen",
    "Warmenhuizen": "Schagen",
    "Waarland": "Schagen",
    "Dirkshorn": "Schagen",
    "Sint Maarten": "Schagen",
    "Schagerbrug": "Schagen",
    "Callantsoog": "Schagen",
    "'t Zand": "Schagen",
    "Petten": "Schagen",
    "Obdam": "Koggenland",
    "Ursem": "Koggenland",
}

# Andere schrijfwijzen die sites gebruiken -> officiële plaatsnaam
PLAATS_ALIASSEN: dict[str, str] = {
    "st pancras": "Sint Pancras",
    "st. pancras": "Sint Pancras",
    "sint-pancras": "Sint Pancras",
    "broek op langedijk": "Broek op Langedijk",
    "broek-op-langedijk": "Broek op Langedijk",
    "langedijk": "Dijk en Waard",
    "noord scharwoude": "Noord-Scharwoude",
    "zuid scharwoude": "Zuid-Scharwoude",
    "dijk-en-waard": "Dijk en Waard",
    "gemeente dijk en waard": "Dijk en Waard",
    "t zand": "'t Zand",
    "'t zand nh": "'t Zand",
    "sint-maarten": "Sint Maarten",
    "st. maarten": "Sint Maarten",
    "st maarten": "Sint Maarten",
}

# Plaatsen waarop commerciële sites (Funda, Pararius, ...) worden doorzocht.
ZOEKPLAATSEN: list[str] = [
    "Alkmaar",
    "Heerhugowaard",
    "Sint Pancras",
    "Broek op Langedijk",
    "Noord-Scharwoude",
    "Zuid-Scharwoude",
    "Oudkarspel",
    "Schagen",
    "Tuitjenhorn",
    "Warmenhuizen",
    "Obdam",
    "Ursem",
]

# De plaatsen uit de oorspronkelijke vraag; standaard-zoekplaatsen voor extra huursites.
HOOFDPLAATSEN: list[str] = ["Alkmaar", "Heerhugowaard", "Sint Pancras", "Schagen", "Tuitjenhorn", "Obdam", "Ursem"]

# Bekende verhuurders in de regio; worden herkend in teksten van advertenties.
CORPORATIES: list[str] = [
    "Woonstichting Langedijk",
    "Woonwaard",
    "Van Alckmaer",
    "Kennemer Wonen",
    "Wooncompagnie",
    "De Woonschakel",
    "Woontij",
    "Intermaris",
    "Het Grootslag",
    "Woningstichting Den Helder",
    "Zeestad",
    "Woonzorg Nederland",
    "Brederode Wonen",
    "Woningstichting Uitgeest",
    "Habion",
    "Stichting Woonwaard",
]

# Woonmatch-subdomeinen per corporatie (bijv. woonschakel.woonmatchwestfriesland.nl)
WOONMATCH_SUBDOMEINEN: dict[str, str] = {
    "woonschakel": "De Woonschakel",
    "wooncom": "Wooncompagnie",
    "intermaris": "Intermaris",
    "woontij": "Woontij",
    "grootslag": "Het Grootslag",
    "zeestad": "Zeestad",
    "wsdh": "Woningstichting Den Helder",
}

# ---------------------------------------------------------------------------
# Bronnen. 'type' is "corporatie" (sociale huur via woonruimteverdeling),
# "platform" (huursites), "makelaar" of "verhuurder" (belegger/verhuurorganisatie).
# Makelaars en verhuurders staan in scraper/sites.py.
# ---------------------------------------------------------------------------
BRONNEN: dict[str, dict] = {
    "svnk": {
        "naam": "SVNK",
        "type": "corporatie",
        "base": "https://www.svnk.nl",
        "omschrijving": "Woonwaard, Van Alckmaer, Kennemer Wonen e.a. (Alkmaar, Dijk en Waard)",
        # Staat standaard uit (op verzoek): draait alleen met `--bronnen svnk`.
        "standaard_aan": False,
    },
    "woonmatch_wf": {
        "naam": "Woonmatch West-Friesland",
        "type": "corporatie",
        "base": "https://www.woonmatchwestfriesland.nl",
        "lijstpaden": ["/", "/woningaanbod", "/client/westfries"],
        "omschrijving": "De Woonschakel, Intermaris e.a. (Obdam, Ursem)",
    },
    "woonmatch_kopnh": {
        "naam": "Woonmatch Kop van NH",
        "type": "corporatie",
        "base": "https://www.woonmatchkopnh.nl",
        "lijstpaden": ["/", "/woningaanbod"],
        "extra_bases": ["https://wooncom.woonmatchkopnh.nl"],
        "omschrijving": "Wooncompagnie, Woontij e.a. (Schagen, Tuitjenhorn)",
    },
    "funda": {
        "naam": "Funda",
        "type": "platform",
        "base": "https://www.funda.nl",
        "omschrijving": "Makelaars en particuliere verhuurders",
    },
    "pararius": {
        "naam": "Pararius",
        "type": "platform",
        "base": "https://www.pararius.nl",
        "omschrijving": "Verhuurmakelaars",
    },
    "huurwoningen": {
        "naam": "Huurwoningen.nl",
        "type": "platform",
        "base": "https://www.huurwoningen.nl",
        "omschrijving": "Verhuurmakelaars en particulieren",
    },
    "kamernet": {
        "naam": "Kamernet",
        "type": "platform",
        "base": "https://kamernet.nl",
        "zoekplaatsen": ["Alkmaar", "Heerhugowaard", "Schagen"],
        "omschrijving": "Kamers, studio's en appartementen",
    },
}

from .sites import EXTRA_BRONNEN  # noqa: E402  (makelaars, verhuurders, extra platforms)

BRONNEN.update(EXTRA_BRONNEN)

# Volgorde waarin dubbele advertenties (zelfde adres) als hoofdadvertentie gelden
BRON_PRIORITEIT = ["svnk", "woonmatch_wf", "woonmatch_kopnh", "funda", "pararius", "huurwoningen", "kamernet"]

# ---------------------------------------------------------------------------
# Gedrag
# ---------------------------------------------------------------------------
NIEUW_DAGEN = 3              # zo lang na plaatsing telt een woning als "Nieuw"
OFFLINE_BEWAREN_DAGEN = 60   # verdwenen advertenties zo lang tonen als "Offline"
VERTRAGING_SEC = 1.5         # pauze tussen verzoeken naar dezelfde site
TIMEOUT_SEC = 25
MAX_PAGINAS = 15             # per zoekopdracht
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)
