# ParseBoard — per element

Basis: `tools/parseboard.html` (het "Paneel"): een wizard van zes stappen van CSV naar dashboard, volledig lokaal, opgeslagen onder `paneel-config`.

## Stappenbalk (1 Databron · 2 Typen · 3 Metrieken · 4 Onderdelen · 5 Weergave · 6 Dashboard)

### Zes stappen met voortgangsbalk
- **Nu:** elke stap een scherm; terug kan, vooruit alleen na de vorige.
- **Simpeler:** zes stappen is lang voor "ik wil een overzicht". Voeg stap 2 en 3 samen (typen worden automatisch herkend en alleen getoond als de tool twijfelt) en stap 4 en 5 (onderdelen en kleuren worden één scherm "Indeling"). Drie stappen: **Bron → Kies je overzicht → Klaar**.
- **Prioriteit:** 1

## Stap 1 — Databron

### "Upload je CSV-bestand" (sleepvlak, .csv/.tsv/.txt, puntkomma/komma/tab)
- **Nu:** alleen CSV-achtige bestanden.
- **Simpeler:** accepteer ook `.xlsx`; dat is wat leken hebben. Toon direct de eerste vijf regels als controle.
- **Veiliger:** blijft lokaal; zeg het in één zin onder het sleepvlak (staat er al, goed).
- **Prioriteit:** 1

### "Verken met voorbeelddata" (kolomnamen plakken, demo's Webshop-bestellingen en Verzekeringsportefeuille)
- **Nu:** plak kolomnamen en de tool verzint data; twee demo's.
- **Simpeler:** sterk voor een eerste indruk. Het plakveld met `Besteldatum;Polisnummer;Regio;…` is voor leken vreemd; zet de twee demo-knoppen bovenaan en het plakveld eronder als "Of gebruik je eigen kolomnamen".
- **Prioriteit:** 2

### Bron uit de suite
- **Nu:** niet aanwezig; ParseBoard weet niets van ParsePDF of ParseScraper.
- **Simpeler:** derde keuze in stap 1: "Gebruik een ParsePDF-sjabloon of een ParseScraper-taak als bron". Dan hoeft de gebruiker geen bestand heen en weer te slepen, en kan het dashboard zichzelf bijwerken, wat de pagina-spec belooft ("Rapportage die zich zelf bijwerkt").
- **Prioriteit:** 1

### Opgeslagen dashboard ("Open mijn dashboard", "Verwijderen")
- **Nu:** één opgeslagen configuratie in `localStorage`.
- **Simpeler:** meerdere dashboards met een naam; die lijst staat dan ook in het ParseLab-dashboard onder ParseBoard.
- **Veiliger:** de configuratie bevat kolomnamen en instellingen, geen data; de data komt uit het bestand dat de gebruiker opnieuw uploadt. Dat is een goede scheiding, houd die.
- **Prioriteit:** 2

## Stap 2 — Kolomtypen

### Typen controleren (Datum, Datum + tijd, Heel getal, Getal met komma, Bedrag, tekst, categorie)
- **Nu:** per kolom een keuzelijst met rol en uitleg ("opgeteld (som)").
- **Simpeler:** alleen tonen wat de tool niet zeker weet: "Is 'Korting %' een percentage of een bedrag?". De rest samenvatten in één regel: "12 kolommen herkend ✓".
- **Prioriteit:** 1

## Stap 3 — Metrieken

### Route "standaard" of "custom"; KPI-tegels (max), grafieken (max, series), "Suggesties opnieuw laden"
- **Nu:** kies standaard (suggesties) of zelf samenstellen; per KPI en grafiek kolom en aggregatie kiezen.
- **Simpeler:** begin altijd met de suggesties en laat de gebruiker daarop wijzigen. Het woord "metrieken" wordt "cijfers", "KPI-tegel" wordt "cijfer", "serie" wordt "extra lijn". Aggregaties (som, gemiddelde, aantal) in mensentaal: "Totaal omzet", "Gemiddelde korting", "Aantal bestellingen".
- **Prioriteit:** 1

## Stap 4 — Onderdelen & tabjes

### Tabjes per categorie, groepering, verdeling
- **Nu:** kies een kolom voor tabbladen ("Alles" + waarden) en voor groepering.
- **Simpeler:** "tabjes" is goed Nederlands maar het concept vraagt uitleg. Toon het als voorbeeld: "Wil je een apart tabblad per Regio? [ja/nee]".
- **Prioriteit:** 2

## Stap 5 — Kleuren & thema

### Licht/Donker/Automatisch, accentkleur (terracotta, groen)
- **Nu:** eigen thema en accent per dashboard.
- **Simpeler:** in de ParseLab-suite is er één huisstijl. Haal de stap weg; thema volgt het dashboard. Kleuren per serie mogen automatisch.
- **Prioriteit:** 2

## Stap 6 — Je dashboard

### Periode-tabs, filter, "Geen data binnen deze selectie"
- **Nu:** periodes (week, maand, kwartaal, jaar), tab per categorie.
- **Simpeler:** goed. Lege selectie krijgt een knop "Toon alles".
- **Prioriteit:** 3

### Opslaan · Aanpassen · Opnieuw
- **Nu:** drie knoppen.
- **Simpeler:** "Opnieuw" gooit alles weg zonder bevestiging; vraag het. "Opslaan" wordt automatisch (elke wijziging bewaard), zodat de knop kan verdwijnen.
- **Prioriteit:** 2

### ⬇ Overzicht CSV en ⬇ Data CSV
- **Nu:** twee CSV-knoppen met tooltip.
- **Simpeler:** één knop "Download voor Excel" met twee tabbladen in het bestand (Overzicht, Data). CSV alleen onder "Andere formaten".
- **Prioriteit:** 1

### Delen als link
- **Nu:** niet aanwezig; wel beloofd in de pagina-spec.
- **Simpeler:** "Deel met mijn accountant" als één knop.
- **Veiliger:** een gedeeld dashboard bevat de data. Deel alleen via het ParseLab-account met een link die verloopt en die per ontvanger kan worden ingetrokken; nooit een openbare link zonder verloopdatum. Toon bij het delen wat de ontvanger ziet.
- **Prioriteit:** 2

## Overig

### Kop, tagline en voettekst ("Prototype · Alles gebeurt lokaal…")
- **Nu:** verborgen in de werkbank via de embed-patch; los geopend zichtbaar.
- **Simpeler:** naam overal "ParseBoard", tagline weg, de privacy-regel blijft maar verhuist naar stap 1 onder het sleepvlak.
- **Prioriteit:** 3

### Opslag in `localStorage` en de tellers in het dashboard
- **Nu:** het ParseLab-dashboard leest `paneel-config` om "1 dashboard" en het aantal kolommen te tonen.
- **Veiliger:** werkt alleen op één origin en één browser; bij accounts hoort dit via de backend. Zie `dashboard.md`.
- **Prioriteit:** 2
