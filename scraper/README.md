# Huurwoningen-scraper Noord-Holland Noord

Verzamelt huurwoningen in **Alkmaar, Dijk en Waard (Heerhugowaard, Sint Pancras, Broek op Langedijk, …), Schagen, Tuitjenhorn, Obdam en Ursem** en schrijft ze naar `data/huurwoningen.json` + `data/huurwoningen.js`. Bekijk het resultaat in `huurwoningen.html`.

Nog niet gekoppeld aan Supabase: de veldnamen zijn wel al zo gekozen dat ze 1-op-1 in een tabel passen.

## Bronnen

| Bron-id | Site | Wat | Plaatsen |
|---|---|---|---|
| `svnk` | svnk.nl | Sociale huur + middenhuur van Woonwaard, Van Alckmaer, Kennemer Wonen e.a. | Alkmaar, Dijk en Waard |
| `woonmatch_wf` | woonmatchwestfriesland.nl | Corporaties West-Friesland (De Woonschakel, Intermaris, …) | Obdam, Ursem |
| `woonmatch_kopnh` | woonmatchkopnh.nl | Corporaties Kop van NH (Wooncompagnie, Woontij, …) | Schagen, Tuitjenhorn e.o. |
| `funda` | funda.nl | Makelaars en particulieren, incl. *in onderhandeling* en *verhuurd* | alle |
| `pararius` | pararius.nl | Verhuurmakelaars | alle |
| `huurwoningen` | huurwoningen.nl | Makelaars en particulieren | alle |
| `kamernet` | kamernet.nl | Kamers, studio's, kleine appartementen | Alkmaar, Heerhugowaard, Schagen |

De corporaties zelf (Woonwaard, Van Alckmaer, Kennemer Wonen, Wooncompagnie) adverteren hun sociale huurwoningen verplicht via SVNK of Woonmatch, dus die worden daar meegenomen.

Daarnaast **31 makelaars, verhuurders en extra platforms** in `scraper/sites.py` (`python -m scraper --lijst` toont ze allemaal):

| Soort | Bronnen |
|---|---|
| Makelaars (17) | Pinedo, 072wonen/Broekman, Broekman, 123Wonen, Van der Borden Huur & Beheer, Leygraaf, SC Bakker (Schagen), VLIEG (Schagen/Heerhugowaard/Alkmaar), Rotsvast, NederWoon, vb&t Verhuurmakelaars, Hoekstra en Van Eck, Verhuurmakelaar Bas, CLIQ, Bakker Schoon, Panthera (Warmenhuizen), Demonie (Oudorp) |
| Verhuurders & beleggers (4) | Ik wil huren (MVGM), Vesteda, Vaanpark (nieuwbouw Heerhugowaard), Heimstaden |
| Extra platforms (10) | Directwonen, Huurstunt, Rentola, Huurportaal, Kamer.nl, HousingAnywhere, Huislijn, Vastgoed Nederland, Buurtje, Marktplaats |

De lijst komt uit webonderzoek (oktober 2026). Bij bronnen met `url_gezien: False` is het adres van de aanbodpagina afgeleid en nog niet gecontroleerd; in `--lijst` staat dan "(url nog controleren)". Veel lokale makelaars plaatsen hun huurwoningen alleen op Funda/Pararius; die komen dus via die bronnen binnen. Dezelfde woning op meerdere sites wordt op de pagina samengevoegd.

### Makelaars, verhuurders en extra platforms

Lokale makelaars, verhuurorganisaties/beleggers en kleinere huursites staan in `scraper/sites.py` en gebruiken de generieke scraper (`scraper/sources/generic.py`). Die herkent zelf de woningkaarten op een overzichtspagina (links op dezelfde site met een huurprijs), slaat koopwoningen over, volgt volgende pagina's en leest daarna de detailpagina's.

Een makelaar toevoegen is één blok in `scraper/sites.py`:

```python
"mijnmakelaar": {
    "naam": "Mijn Makelaar",
    "type": "makelaar",                      # of "verhuurder" / "platform"
    "base": "https://www.mijnmakelaar.nl",
    "lijst": ["https://www.mijnmakelaar.nl/aanbod/woningaanbod/huur/"],
    "plaatsen": ["Alkmaar"],
},
```

Optioneel: `"zoek_url": "https://site.nl/huren/{slug}/"` (één pagina per zoekplaats), `"detail": r"regex"` als de automatische herkenning de verkeerde links pakt, en `"render": True` voor sites die JavaScript nodig hebben.

## Supabase (live op je telefoon)

De gegevens staan in het Supabase-project **scraper** (`gpkohiyzdjyehqdkgpdb`), in eigen tabellen naast ParseLab:

| Tabel | Inhoud |
|---|---|
| `huur_woningen` | één rij per advertentie (zelfde velden als `data/huurwoningen.json`) |
| `huur_bronnen` | resultaat van de laatste scan per bron |
| `huur_instellingen` | hash van de toegangscode, regio en tijdstip laatste scan |

- **Lezen** kan alleen met de **toegangscode** (header `x-huur-code`). `huurwoningen.html` vraagt die één keer en bewaart hem op dat apparaat (knop *Koppelen* / *Live* rechtsboven).
- **Schrijven** doet alleen de scraper, met de geheime service-role-sleutel. Die staat nooit in de pagina of in git.
- Schema en uitleg: `scraper/supabase/huurwoningen.sql`.

Zelf naar Supabase schrijven vanaf je computer: maak in de projectmap een bestand `.env` (staat in `.gitignore`):

```
SUPABASE_SERVICE_ROLE_KEY=<service_role- of secret-sleutel uit Supabase → Project Settings → API Keys>
```

en draai `python -m scraper`. Met een sleutel schrijft hij automatisch naar Supabase (`--supabase uit` om dat over te slaan, `--supabase aan` om te stoppen als de sleutel ontbreekt). Zonder lokaal `data/huurwoningen.json` gaat hij verder met de stand in Supabase, zodat "eerst gezien" en "offline sinds" kloppen.

### Automatisch scrapen (GitHub Actions)

`.github/workflows/huurwoningen.yml` draait de scraper elke 3 uur (± 6:40–21:40) en schrijft naar Supabase. Eenmalig nodig: repository secret **`SUPABASE_SERVICE_ROLE_KEY`** (GitHub → Settings → Secrets and variables → Actions). Het schema draait vanaf `main`; op deze branch start hij bij een push van de scraper of workflow.

### SVNK

SVNK staat standaard **uit** en wordt niet automatisch gescrapet. Alleen `python -m scraper --bronnen svnk` haalt het op.

## Installeren en draaien

Vanuit de hoofdmap van het project:

```bash
pip install -r scraper/requirements.txt
python -m scraper                      # alle bronnen
python -m scraper --bronnen svnk,funda # alleen deze bronnen
python -m scraper --soort makelaars    # alleen makelaars (ook: corporatie, platform, verhuurder)
python -m scraper --lijst              # toon bron-id's
```

Daarna `huurwoningen.html` openen (dubbelklikken werkt; de pagina leest `data/huurwoningen.js`).

### Funda en andere sites die blokkeren

Funda (en soms Pararius) weigert gewone scripts. Installeer dan Playwright; de scraper schakelt automatisch over op een echte (onzichtbare) Chrome-browser zodra een site blokkeert of JavaScript nodig heeft:

```bash
pip install playwright
playwright install chromium
python -m scraper                 # --browser auto (standaard)
python -m scraper --browser altijd
```

### Handige opties

| Optie | Uitleg |
|---|---|
| `--geen-details` | Alleen zoekresultaten, geen detailpagina's (sneller, minder velden) |
| `--details-opnieuw` | Detailpagina's opnieuw ophalen, ook voor bekende woningen |
| `--max-paginas 5` | Max. aantal resultaatpagina's per zoekopdracht |
| `--vertraging 2` | Seconden pauze tussen verzoeken naar dezelfde site (standaard 1,5) |
| `--dump` | Ruwe HTML/JSON bewaren in `scraper/.cache/raw/` om parsers te verbeteren |
| `-v` | Volledige foutmeldingen |

## Wat er per woning wordt bewaard

- **Adres**: straat, huisnummer, toevoeging, postcode, plaats, gemeente, wijk
- **Huur**: totale huur, kale huur, servicekosten, energiekosten, borg, segment (sociale huur / middenhuur / vrije sector)
- **Woning**: type, m², kamers, slaapkamers, verdieping, energielabel, bouwjaar, interieur
- **Plaatsing**: `published_at` (datum van plaatsing), `closing_date` (reageren tot), beschikbaar per, toewijzing (loting / inschrijfduur / direct te huur), aantal reacties
- **Voorwaarden**: doelgroep, inkomen, leeftijd, huishoudgrootte
- **Status** + `is_new` (zie hieronder), verhuurder/makelaar, foto's, omschrijving, link
- **Historie**: `first_seen`, `last_seen`, `offline_since`, `status_history`

### Statussen

| Status | Betekenis |
|---|---|
| **Nieuw** (`is_new`) | Beschikbaar en minder dan 3 dagen geleden geplaatst (of door de site als "Nieuw" gemarkeerd) |
| `beschikbaar` | Te huur / reageren mogelijk |
| `binnenkort` | Binnenkort beschikbaar / binnenkort in de verhuur (bijv. nieuwbouw) |
| `onder_optie` | Onder optie / in onderhandeling |
| `verhuurd_ovb` | Verhuurd onder voorbehoud |
| `verhuurd` | Verhuurd (Funda en Pararius tonen dit) |
| `gesloten` | Corporatiewoning waarvan de reactietermijn voorbij is (wordt toegewezen) |
| `offline` | Advertentie verdwenen sinds de vorige scan – waarschijnlijk verhuurd. Blijft 60 dagen zichtbaar |

Draai de scraper regelmatig (bijv. elke ochtend): dan zie je wanneer een woning onder optie gaat of verdwijnt.

## Regio en instellingen aanpassen

Alles staat in `scraper/config.py`: plaatsen (`PLAATSEN`), zoekplaatsen voor Funda/Pararius (`ZOEKPLAATSEN`), hoe lang iets "Nieuw" is (`NIEUW_DAGEN`) en de pauze tussen verzoeken.

## Als een bron niets oplevert

Sites passen hun opmaak soms aan. Draai dan `python -m scraper --bronnen <bron> --dump -v` en kijk in `scraper/.cache/raw/<bron>/` wat de site teruggaf. De parsers per site staan in `scraper/sources/`. Elke bron lees eerst gestructureerde data (JSON-API, JSON-LD, label/waarde-lijsten) en valt anders terug op tekstpatronen, zodat kleine wijzigingen meestal geen probleem zijn.

Tests: `python -m unittest discover -s scraper/tests -t .`

## Netjes scrapen

De scraper pauzeert tussen verzoeken, haalt detailpagina's alleen op voor nieuwe woningen en is bedoeld voor persoonlijk gebruik. Lees de gebruiksvoorwaarden van de sites; Funda staat geautomatiseerd ophalen alleen beperkt toe.
