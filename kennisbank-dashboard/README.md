# Kennisbank-analytics dashboard (Confluence + Refined)

Inzicht in wie de kennisbank gebruikt, wat er bekeken wordt en welke
accounts/klantgroepen achterblijven.

**Openen:** dubbelklik `dashboard.html` — één zelfstandig bestand, geen server
nodig, werkt vanaf een netwerkschijf. Licht/donker thema, printbaar naar PDF,
elke tabel exporteerbaar naar CSV (opent direct in Excel).

## Verversen met nieuwe data

1. Zet nieuwe Refined-exports («Page views events») in `input/pageviews/`.
   Bestanden mogen overlappen met eerdere exports — events worden gededupliceerd
   op event-id, dus niets telt dubbel.
2. Zet de nieuwste Atlassian org-export («export users», met groepen) in
   `input/users/` (nieuwste bestandsnaam wint).
3. Optioneel: ververs de pagina-inventaris (voor «verweesde pagina's»):
   `python3 fetch_atlassian.py` — credentials in `.atlassian.env` (niet in git).
4. Draai `python3 etl.py` (alleen Python 3 nodig, geen extra installaties).

Het script bouwt de historie op in `data/events.csv` (append-only) en genereert
`dashboard.html` opnieuw uit `template.html`.

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
| Export | CSV per tabel + Print/PDF |
| Zoekopdrachten / downloads | ⏳ wacht op Refined |

De Refined-export bevat per weergave het echte Atlassian-`account_id`, dus
koppelen aan namen/groepen gaat direct via de org-export. Systeemgroepen
(`*-dewaerdse`, `org-admins`) blijven buiten het filter — zie
`FUNCTIONAL_GROUPS` in `etl.py`.

> ⚠️ **Privacy:** `input/`, `data/` en `dashboard.html` bevatten
> persoonsgegevens en worden niet meegecommit (zie `.gitignore`).
