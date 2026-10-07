# Tests

`qa.mjs` doorloopt het hele dashboard met Playwright (86 controles): inloggen, overzicht, zoeken, account-instellingen, de website-bron (adres → aanwijzen → element wisselen → volgende pagina → uitlezen → Excel/CSV → taak bewaren → hernoemen → verwijderen), Bestanden, de PDF-bron (uploaden, sjabloon, Excel bewaren), het dashboard (CSV → dashboard → opslaan), formulier invullen-installatiepaneel, de AI-knoppen van de website-bron en het dashboard (toestemming vragen en de melding zonder sleutel), mobiel, uitloggen en het dashboard zonder server.

Vooraf, in drie terminals:

```
cd parselab && PARSELAB_ALLOW_PRIVATE=1 node server/server.js          # ParseLab op 8080 (lokale testsite toestaan)
cd parselab/tests/site && python3 -m http.server 9000                   # testwinkel
cd .. && python3 -m http.server 8765                                    # map boven parselab, voor "zonder server"
```

Dan: `cd parselab/tests && node qa.mjs`. Resultaat staat in `qa-result.txt`, schermafbeeldingen in `shots/`. Playwright moet vindbaar zijn (`npm install` in `parselab`).

`styleguide.mjs` controleert het dashboard tegen `docs/DASHBOARD-styleguide.md`: palet, contrast, typografie, raster, knophoogte, focusring, laadtoestand en de drie breedtes. Vraagt dezelfde servers als `qa.mjs`.

`webflow.mjs` test de vijf de PDF-bron-embeds uit `parselab/webflow/`. Die test start zelf wat hij nodig heeft: hij bouwt met `webflow-proef.mjs` een proefpagina in `proef/` (namaak-Supabase, pdf.js uit `tools/parsepdf.html`, drie proef-PDF's), zet daar een server op 8123 bij, controleert ook de losse pagina uit `webflow/bouw-pagina.mjs` en sluit alles weer af. Los draaien: `node webflow.mjs`.

`werkbank.mjs` loopt de hele werkstroom af: een rommelige Excel opschonen met de databestand-bron, de
tabel bij je gestructureerde data zien verschijnen, Excel en CSV downloaden, het rapport maken als `.md` én
`.html` (kolommen, kerncijfers en de som nagerekend) en de rijen doorgeven aan het dashboard.
Vraagt de ParseLab-server op 8080. Los draaien: `node werkbank.mjs`.

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

`extensie-zoekveld.mjs` controleert een zoekveld met suggesties (typeahead-combobox) zoals portalen
die gebruiken: `type="search"` met `role="combobox"`, een willekeurig id, een label dat er los boven
staat, en een suggestielijst die pas verschijnt na drie getypte tekens. De test loopt de hele weg af:
velden ophalen (de kolom moet naar het label heten), invulstap maken, een invullijst met één kolom
uploaden, draaien, en dan moet de suggestie gekozen zijn. Los draaien: `node extensie-zoekveld.mjs`.

`board-live.mjs` controleert de live-datakoppeling van de dashboardmaker langs beide wegen: een
bron die CORS toestaat haalt de browser zelf op, een bron die dat niet doet (zoals Google Sheets en
SharePoint) gaat via `/api/data/haal` op de server. Verder: een onvolledige link en een link die een
webpagina teruggeeft moeten uitleg geven, en het serverdeel moet een webpagina weigeren met
foutcode 415. Vraagt een draaiende server met `PARSELAB_ALLOW_PRIVATE=1`. Het verversen op een
interval zit niet in de test (de kortste stand is een minuut). Los draaien: `node board-live.mjs`.

`extensie-balk.mjs` controleert de schermindeling van het paneel: een balk tegen de rechterrand
over de volle schermhoogte, de pagina die ernaast opschuift (en haar volle breedte terugkrijgt als
het paneel weg is), het werkgedeelte dat de hoogte vult, en de breedte die je aan de greep kunt
slepen. Los draaien: `node extensie-balk.mjs`.

`extensie-knoppen.mjs` controleert knoppen in een design system van webcomponenten
(Lit/ASR-stijl): de echte `<button>` zit in een shadow root en de tekst komt via een `<slot>` uit de
light DOM van de host. Getest wordt dat een aangewezen knop een stap met een bruikbare naam geeft
(niet "button"), dat een knop die vijf shadow roots diep zit wordt ingedrukt en niet een van de
knoppen die er identiek uitzien, en dat het paneel klikbaar blijft als de pagina een modaal
`<dialog>` opent — dat maakt alles buiten de dialog inert. Los draaien: `node extensie-knoppen.mjs`.

`extensie-velden.mjs` controleert de knop *Velden ophalen*: welke invulvelden ziet ParseLab op de
pagina, wat komt er niet in (verborgen velden), wordt er een invulstap van gemaakt, en vult de taak
met een geüploade lijst van twee regels beide regels in. Los draaien: `node extensie-velden.mjs`.

`pdfs/` bevat zeven proef-PDF's met de verwachte uitkomsten (`pdfs/README.md`), te herbouwen met `node pdfs/maak-pdfs.mjs`.

De extensie heeft een eigen test in `tools/extension/` (zie README daar).
