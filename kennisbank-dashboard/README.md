# Kennisbank-analytics dashboard (Confluence + Refined)

Inzicht in wie de kennisbank gebruikt, wat er bekeken wordt en welke
accounts/klantgroepen achterblijven.

**Openen:** dubbelklik `dashboard.html` — één zelfstandig bestand, geen server
nodig, werkt vanaf een netwerkschijf. Licht/donker thema, printbaar naar PDF,
elke tabel exporteerbaar naar CSV (opent direct in Excel).

## Verversen met nieuwe data

1. Zet nieuwe Refined-exports in `input/pageviews/` («Page views events»,
   Page details) en `input/searches/` («Search events»). Exporteren gaat via
   Confluence → Refined Administration → Analytics → periode kiezen → Export;
   vermoedelijk max. 90 dagen per export, dus exporteer maandelijks.
   Bestanden mogen overlappen — events worden gededupliceerd op event-id.
   (De «Page trends»-export bevat dezelfde regels als «Page details»; één van
   beide is genoeg.)
2. Zet de nieuwste Atlassian org-export («export users», met groepen) in
   `input/users/` (nieuwste bestandsnaam wint).
3. Optioneel: ververs de pagina-inventaris (voor «verweesde pagina's»):
   `python3 fetch_atlassian.py` — credentials in `.atlassian.env` (niet in git).
4. Draai `python3 etl.py` (alleen Python 3.10+ nodig, geen extra installaties).
5. Optioneel: `python3 rapport.py` maakt `rapport.html`, een managementrapport
   over de hele periode (samenvatting, trend, adoptie per groep, populaire
   pagina's, zoekgedrag, aanbevelingen, bijlagen met namen). Openen in de
   browser en Ctrl+P → «Opslaan als PDF» voor een A4-versie.

Het script bouwt de historie op in `data/events.csv` en `data/searches.csv`
(append-only) en genereert `dashboard.html` opnieuw uit `template.html`.

> ⚠️ **Bewaar `data/events.csv`.** Refined bewaart analytics maar beperkt;
> de opgebouwde historie leeft alleen in die map. Zet de projectmap op een
> netwerkschijf met back-up.

## Onderdelen

| Briefing | Onderdeel |
|---|---|
| Wie logde in? | KPI's + tabel «Gebruikersactiviteit» (afgeleid uit paginabezoeken) |
| Populairste pagina's | Balken met views **en** unieke gebruikers |
| Nooit gebruikt | Accounts met Confluence-toegang zonder één weergave |
| 90 dagen inactief | Views + Atlassian «last active» |
| Verweesde pagina's | Pagina-inventaris zonder weergaven in de periode |
| Groepsfilter | Dropdown, filtert alle onderdelen (dubbeltelling bij meervoudig lidmaatschap) |
| Zoekopdrachten | Meest gezocht + zoekopdrachten zonder resultaat (tussentijdse toetsaanslagen eruit gefilterd) |
| Export | CSV per tabel + Print/PDF |
| Downloads | ⏳ niet in de Refined-exports |

De Refined-export bevat per weergave het echte Atlassian-`account_id`, dus
koppelen aan namen/groepen gaat direct via de org-export. Systeemgroepen
(`*-dewaerdse`, `org-admins`) blijven buiten het filter — zie
`FUNCTIONAL_GROUPS` in `etl.py`.

> ⚠️ **Privacy:** `input/`, `data/` en `dashboard.html` bevatten
> persoonsgegevens en worden niet meegecommit (zie `.gitignore`).
