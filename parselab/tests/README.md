# Tests

`qa.mjs` doorloopt het hele dashboard met Playwright (86 controles): inloggen, overzicht, zoeken, account-instellingen, ParseScraper (adres → aanwijzen → element wisselen → volgende pagina → uitlezen → Excel/CSV → taak bewaren → hernoemen → verwijderen), Bestanden, ParsePDF (uploaden, sjabloon, Excel bewaren), ParseBoard (CSV → dashboard → opslaan), ParseForm-installatiepaneel, de AI-knoppen van ParseScraper en ParseBoard (toestemming vragen en de melding zonder sleutel), mobiel, uitloggen en het dashboard zonder server.

Vooraf, in drie terminals:

```
cd parselab && PARSELAB_ALLOW_PRIVATE=1 node server/server.js          # ParseLab op 8080 (lokale testsite toestaan)
cd parselab/tests/site && python3 -m http.server 9000                   # testwinkel
cd .. && python3 -m http.server 8765                                    # map boven parselab, voor "zonder server"
```

Dan: `cd parselab/tests && node qa.mjs`. Resultaat staat in `qa-result.txt`, schermafbeeldingen in `shots/`. Playwright moet vindbaar zijn (`npm install` in `parselab`).

`styleguide.mjs` controleert het dashboard tegen `docs/DASHBOARD-styleguide.md`: palet, contrast, typografie, raster, knophoogte, focusring, laadtoestand en de drie breedtes. Vraagt dezelfde servers als `qa.mjs`.

`webflow.mjs` test de vijf ParsePDF-embeds uit `parselab/webflow/`. Die test start zelf wat hij nodig heeft: hij bouwt met `webflow-proef.mjs` een proefpagina in `proef/` (namaak-Supabase, pdf.js uit `tools/parsepdf.html`, drie proef-PDF's), zet daar een server op 8123 bij, controleert ook de losse pagina uit `webflow/bouw-pagina.mjs` en sluit alles weer af. Los draaien: `node webflow.mjs`.

`extensie.mjs` laadt de browserextensie in een echte Chromium en controleert het openen: een klik op
het icoon opent het paneel ook als de bewaarde vlag nog "aan" stond van een ander tabblad of een
vorige sessie, een tweede klik sluit het, er ontstaat geen tweede paneel, en op een browserpagina
komt er uitleg op het icoon. De test zet zelf een pagina op poort 9100 neer en draait op een kopie
van de extensie met de testsite in het manifest, omdat `activeTab` alleen bij een echte muisklik
geldt. Los draaien: `node extensie.mjs`.

`extensie-aanwijzen.mjs` controleert het aanwijzen op een nagebouwd portaal: het blauwe kader moet
op de pixel om het element liggen waar de muis boven staat (tekstveld, keuzelijst, knop, en ook na
scrollen), en klikken moet een stap opleveren — ook als je net naast het veld klikt, op het label of
op het zoekicoon ernaast. Los draaien: `node extensie-aanwijzen.mjs`.

`extensie-schaduw.mjs` controleert velden die in een webcomponent (shadow DOM) zitten, zoals
verzekeraarsportalen die bouwen. Zo'n veld staat niet in de gewone pagina: een klik levert de
buitenkant op en `document.querySelector` kijkt er niet in. De test bouwt het veld na en
controleert dat het kader op het veld zelf ligt, dat *Invullen* een stap oplevert met het label uit
de component, en dat de stap het veld later terugvindt. Los draaien: `node extensie-schaduw.mjs`.

`extensie-velden.mjs` controleert de knop *Velden ophalen*: welke invulvelden ziet ParseLab op de
pagina, wat komt er niet in (verborgen velden), wordt er een invulstap van gemaakt, en vult de taak
met een geüploade lijst van twee regels beide regels in. Los draaien: `node extensie-velden.mjs`.

`pdfs/` bevat zeven proef-PDF's met de verwachte uitkomsten (`pdfs/README.md`), te herbouwen met `node pdfs/maak-pdfs.mjs`.

De extensie heeft een eigen test in `tools/extension/` (zie README daar).
