# WebTool Scraper — browserextensie

Klik-en-scrape op **elke** website, rechtstreeks op de echte pagina — geen proxy
of render-server nodig. De extensie draait in je browser bovenop de pagina die je
bekijkt, dus JavaScript is al uitgevoerd en alles werkt overal (webshops, web-apps).

## Strakke bediening

Onder in het paneel staat één vaste knoppenrij, zonder ruis:

- **▶ Start** · **⏸ Pauze** · **■ Stop** — pauzeer een lopende run en hervat later precies waar je
  was (de voortgang blijft bewaard, ook na een paginawissel).
- **⤒ Upload data** — kies je CSV. **⬇ Download uitkomst** — de resultaten als CSV. **💾 Bewaar flow**.
- Al het extra (herhaal, foutafhandeling, downloadmap/submap, andere exportformaten, presets, thema,
  import/export) zit netjes onder **⚙ Meer opties**, ingeklapt.

Dropdowns van moderne web-apps (o.a. **MudBlazor**, en algemene ARIA-comboboxen) worden nu correct
ingevuld: de tool opent de lijst en kiest de juiste optie op naam.

### Dropdown als eigen stap

Een dropdown is geen gewoon invoerveld, dus die heeft een **eigen stap: 🔽 Dropdown**. Klik de stap,
wijs de dropdown/keuzelijst op de pagina aan (klik gerust op het pijltje of het label — de tool pakt
automatisch het echte veld eronder, niet "body"), en de stap krijgt standaard `{{kolomnaam}}`. Bij het
draaien opent de tool de lijst en kiest de optie die bij de CSV-waarde past. De dropdown-kolom komt ook
gewoon in **⬇ CSV-sjabloon van invoervelden** te staan, naast je andere velden.

Tip: tijdens het aanwijzen wordt de pagina geblokkeerd, zodat een dropdown niet opengaat of een
overlay je klik opvangt — daardoor pakt de tool altijd het juiste element.

### Datum- en gemaskeerde velden (o.a. MudBlazor MudDatePicker)

Een gemaskeerd veld (bv. een datumveld met `placeholder="dd-MM-yyyy"`) bouwt zijn waarde op uit
toetsaanslagen; in één keer de waarde zetten geeft rommel (je zag bv. `01-01-1983`). De tool **typt
zulke velden nu teken voor teken** en voert bij een datummasker alleen de cijfers in — het masker zet
zelf de streepjes ertussen. Geef de datum gewoon als `30-11-2002` (of `30/11/2002`); een gewoon
`<input type="date">` wordt automatisch naar `2002-11-30` omgezet.

Zie je een datumveld als **3 kolommen** in het formulier-sjabloon? Gebruik dan de losse **✎ Veld
invullen**-stap en wijs precies het datumveld aan — dat geeft één nette datumkolom, in plaats van het
hele formulier te lezen.

## Wat het kan

Eén **flow-builder**: bouw een reeks stappen door elkaar heen — scrapen, formulier
vullen en knoppen drukken — en draai die één keer of per CSV-rij.

- **🗨 Bouw met opdrachten** — een chatbalk boven in het paneel: typ in gewone taal wat je
  wilt (bv. `scrape de prijs`, `vul veld met {{Naam}}`, `klik Opslaan`, `wacht 2s`,
  `screenshot`, `herhaal 5`, `map shirts`, `submap per relatienummer`, `start`) en de stappen
  worden voor je gemaakt. Voor scrape/klik/veld wijs je daarna nog even het doel op de pagina
  aan. Werkt volledig lokaal — geen AI-server of sleutel nodig. Typ `help` voor alle opdrachten.
- **+ Stap toevoegen** → kies wat je wilt en selecteer het op de pagina:
  - **🔎 Element scrapen** — klik precies één element (cel, waarde, tekst, link, afbeelding).
  - **📋 Lijst scrapen** — klik één item van een lijst/tabel → de hele lijst wordt herkend.
  - **✎ Formulier vullen** — klik het formulier; de waarden komen per rij uit je CSV.
    In de stap zie je een **aanvinklijst van alle velden** — vink uit welke je *niet* wilt
    (bv. alleen de bovenste 3 aanhouden). Alleen de aangevinkte velden komen in het CSV-sjabloon
    en worden gevuld; de rest laat de tool met rust. Knopjes **alle/geen** om snel te schakelen.
    Het **CSV-sjabloon** wordt met `;` geschreven zodat Nederlandse Excel de kolommen netjes splitst.
  - **👆 Knop drukken** — klik de knop die ingedrukt moet worden (Opslaan, Volgende…).
  - **⏱ Wachten** — een pauze tussen stappen (ook via de **+ pauze**-knopjes).
  - **📸 Screenshot** — legt de zichtbare pagina vast en bewaart als PNG (ons paneel
    staat niet in de foto).
  - **🖨 Print** — drukt de pagina automatisch af naar **PDF** (Chrome's eigen
    print-engine, geen dialoog) en bewaart hem in de map.
  - **⌨ Typ tekst / Toets** — typ in een veld (optioneel Enter), of stuur een losse toets.
  - **🖱 Hover / ↕ Scroll / ↕ Scroll & laad** — voor inhoud die pas verschijnt bij hover of scrollen (incl. oneindig scrollen).
  - **⏳ Wacht op element** — wacht tot iets geladen is (met time-out), slimmer dan een vaste pauze.
  - **❓ Voorwaarde** — doe de volgende stap(pen) alleen als een element bestaat/tekst bevat (bv. cookie-melding wegklikken), anders overslaan of stoppen.
  - **⬇ Bestanden** — download alle `img`/PDF-links die op een patroon matchen naar je map.
  - **🔗 Webhook** — POST de huidige rij naar een URL (bv. een Google Apps Script of eigen endpoint).
- **Scrape-opties** — per element-scrape geef je een **kolomnaam** (elk gescrapet element wordt een
  eigen kolom in je export — vul bv. `Premie18`, `Premie30`), kies je het **attribuut**
  (text/href/src/alt/…) en een **opschoning** (trim, alleen het getal, of een regex met capture-group).
- **Export-encoding** — CSV wordt met een UTF-8 BOM en `;` als scheidingsteken weggeschreven, zodat
  Nederlandse Excel de kolommen splitst en `€`/accenten goed toont (geen `â‚¬` meer).
- **Variabelen bij invullen** — `{{Naam}}` en rekenen zoals `{{Prijs*1.21}}` (zie ook Typ-stap).
- **Robuustheid** — per run een **retry**-aantal en een **bij-fout**-keuze (overslaan of stoppen).
- **Downloadmap** — stel een map in Downloads in (standaard `webtool`); screenshots, print-PDF's,
  gedownloade bestanden én je export (JSON/CSV/**Excel**/**ZIP**) komen daar automatisch in terecht.
- **Flow beheren** — meerdere flows per site opslaan met een naam, snel wisselen, en de flow
  **exporteren/importeren** als bestand.
- **Veld invullen** — een losse stap om één invoerveld (input/select/checkbox) een waarde te geven,
  met variabelen/factor (`{{kolom}}`, `{{Prijs*1.21}}`), naast het hele-formulier-vullen.
  - **Kolomnaam zelf kiezen** — in de stap staat een **kolom**-veld. Heeft het veld geen nette naam
    (bv. MudBlazor `mudinput828389`), dan krijgt het een generieke naam (`veld1`) die je hernoemt naar
    bv. `postcode`. Die naam is meteen de kolomkop in je CSV-sjabloon.
  - **Uit de CSV** — laad je CSV (bij *Meer opties*) en kies in de stap een **CSV-kolom** uit de
    keuzelijst; de flow draait dan één keer per rij (5 regels = 5×), telkens met de waarde uit die rij.
  - **Datum in één kolom** — een datumveld (ook MudBlazor MudDatePicker met masker `dd-MM-yyyy`) is
    één invoerveld en dus **één kolom**; geef de datum als `30-11-2002`. Kalender-popovers worden bij
    het lezen van een formulier overgeslagen, zodat één datum niet als 3 kolommen verschijnt.
  - **Leeg = overslaan** (standaard aan) — is de cel voor die rij leeg (bv. een niet-verplicht veld
    zoals *Toevoeging*), dan laat de tool dat veld met rust en maakt het niet leeg. Zet je het uit,
    dan wordt het veld bij een lege cel juist gewist.
- **Submap per kolom** — vul een kolomnaam in (bv. `relatienummer`) om per unieke waarde een eigen
  submap te maken; alle downloads van die rij gaan daarheen en de waarde komt in je resultaten.
  Zo krijgt elk relatienummer (ook met meerdere producten/regels) zijn eigen mapje.
- **Meertalig** — taalkiezer rechtsboven (Nederlands, English, Deutsch, Français, Español); de tool
  kiest standaard je browsertaal.
- **Uiterlijk & sneltoets** — licht/**donker thema**, paneel links/rechts, en het paneel togglen
  met **Alt+Shift+S**.
- **Variabelen bij invullen** — in een CSV-cel kun je een eerder gescrapete waarde of
  kolom gebruiken met <code>{{Naam}}</code>, en rekenen met een factor, bv.
  <code>{{Prijs*1.21}}</code> of <code>{{aantal+1}}</code>.
- **CSV-sjabloon van invoervelden (centraal)** — onder *Data voor invullen* zit de knop
  **⬇ CSV-sjabloon van invoervelden**. Die maakt één CSV met een **kolomkop per invoerveld**
  uit je hele flow: alle aangevinkte velden van *Formulier vullen* én elke *Veld invullen*-stap.
  Kies je 3 velden, dan krijg je 3 kolomkoppen (met `;` zodat NL-Excel ze splitst). Vul het in
  en upload het op dezelfde plek → de flow draait één keer per rij. Een *Veld invullen*-stap
  krijgt standaard `{{veldnaam}}` als waarde, zodat de kolomnaam meteen klopt.
- **CSV met leesbare koppen** — de 📄-knop bij een *Formulier vullen*-stap geeft een sjabloon van
  alleen die stap; de centrale knop hierboven combineert alle stappen in één sjabloon.
- **Flowchart** — toont de hele reeks stappen zodat je hem makkelijk volgt.
- **Herordenen/hernoemen/verwijderen** van stappen, **Bewaar/Laad** de flow per site.
- **Exporteren** — resultaten naar JSON, CSV of klembord.

## MCP-koppeling (AI-agent stuurt de tool aan)

Wil je dit vanuit een AI-agent (bv. Claude) aansturen — *"haal de velden op, hier zijn 30
records, voer ze in"* — dan zit er een MCP-server in [`mcp-server/`](mcp-server/README.md).
Die biedt tools aan (`read_fields`, `fill_records`) en voert ze uit in **jouw ingelogde
tabblad** via een lokale WebSocket-bridge (alleen `localhost`, geen wachtwoorden nodig).
Zet de koppeling aan met de knop **MCP-koppeling** onder *Meer opties*. Zie de
[mcp-server/README](mcp-server/README.md) voor installatie en het koppelen aan Claude.
Automatiseren op een extranet met klantgegevens moet door de beheerder zijn toegestaan.

## Installeren (voor jezelf / testen)

1. Open in Chrome (of Edge/Brave): `chrome://extensions`
2. Zet rechtsboven **Ontwikkelaarsmodus** aan.
3. Klik **Uitgepakte extensie laden** en kies deze map (`extension`).
4. De extensie verschijnt met een blauw **W**-icoon. Zet hem eventueel vast (pin).

## Gebruiken

1. Ga naar een willekeurige website.
2. Klik op het **W**-icoon in de werkbalk → het paneel verschijnt rechtsboven.
3. Klik **+ Stap toevoegen** en kies wat je wilt (scrapen / formulier vullen / knop
   drukken / wachten), en selecteer het doel op de pagina. Voeg pauzes in met de
   **+ pauze**-knopjes tussen de stappen.
4. Draai de flow (eenmalig of per CSV-rij, met herhaal-opties), of exporteer naar CSV.

**Onthoudt velden op HTML-structuur (ook na refresh):** moderne web-apps (o.a. MudBlazor) geven velden
bij elke pagina-load een nieuw willekeurig id (`mudinput828389` → `mudinputXYZ`). De tool koppelt daarom
**niet op naam of id**, maar op **HTML-structuur** — een structuurpad (tag + positie, bv. `#form>div>input`),
het veldtype en de stabiele klassen, plus de opgeslagen **HTML** als extra herkenning. Na een refresh of
navigatie worden de velden zo nog steeds gevonden en ingevuld. Beweeg met de muis over de veld-stap (🔎)
om de opgeslagen HTML te zien.

- **🎯 per stap** — klik het richtkruisje bij een stap om het gekoppelde element op de pagina te tonen
  met een **blauwe omlijning** (het scrollt er ook naartoe).
- **🔗 Check koppelingen** — knop bij de stappen die controleert of elk gekoppeld veld/knop op de huidige
  pagina te vinden is; je krijgt **goed** (groene ✓ per stap) of **fout** (rode ✗ + welke stappen).
- **CSV blijft bewaard** (meteen opgeslagen na uploaden), en met **✕ CSV wissen** maak je 'm leeg voor een
  nieuwe. Meerdere regels = één ronde per regel (5 relaties = 5×).
- **Start begint altijd bij het begin**; een run die is blijven hangen (tab gesloten/gecrasht) wordt niet
  meer half hervat.
- Bij invullen wordt het veld **altijd eerst leeggemaakt** voordat de nieuwe waarde erin gaat.
- **Blijft klikbaar boven modals** — opent de pagina een modaal met een schermvullende overlay (o.a.
  MudBlazor `.mud-overlay`), dan zou die bij gelijke z-index de klikken opvangen. Het paneel wordt
  daarom via de **Popover-API in de browser-top-layer** gezet: dat staat gegarandeerd boven élke
  page-overlay, ongeacht z-index of DOM-volgorde, en blijft klikbaar. (In een oude browser zonder
  Popover-API valt hij terug op "laatste in de DOM".)

**Blijft open bij navigatie:** zodra je het paneel opent blijft het "aan" — het
verschijnt automatisch op elke volgende pagina die je bezoekt, zodat je je stappen
kunt blijven volgen. Je flow (stappen, CSV, instellingen) wordt per website bewaard
en teruggezet. Klik op **✕** om het paneel te sluiten en het automatisch openen te
stoppen; klik het **W**-icoon om het weer aan te zetten.

**Loopt door over paginawissels:** een lopende run gaat automatisch verder na een
paginanavigatie (bv. een stap die op "Volgende" drukt en een nieuwe pagina laadt) —
de voortgang wordt bewaard en op de nieuwe pagina wordt de flow bij de volgende stap
hervat. Je ziet de voortgang live: een **✓** bij elke voltooide stap en een teller
met balk (**"2/5 voltooid"**). Bouw je flow zo op dat elke stap-selector bestaat op de
pagina waar die stap draait.

## Publiceren in de Chrome Web Store (optioneel)

Zo kunnen anderen hem in één klik installeren en link je ernaar vanaf je website:

1. Maak een zip van de inhoud van deze map (niet de map zelf):
   `cd extension && zip -r ../webtool-scraper.zip .`
2. Ga naar het [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   (eenmalig $5 registratie), upload de zip, vul de winkelvermelding in en dien in.
3. Na goedkeuring krijg je een winkel-URL; zet daar op je Webflow-site een knop
   naartoe ("Installeer de scraper").

## Firefox

Firefox gebruikt bijna hetzelfde formaat. Voor een Firefox-versie is een kleine
aanpassing nodig (`browser_specific_settings` + `background.scripts`); vraag erom
als je die nodig hebt.

## Privacy

De extensie stuurt niets naar een server. Alles gebeurt lokaal in je browser.
Dankzij `activeTab` heeft hij pas toegang tot een pagina op het moment dat jíj op
het icoon klikt.
