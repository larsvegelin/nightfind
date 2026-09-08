# ParseLab — handleiding

ParseLab is een kleine uitbreiding voor Chrome (en Edge). Hij doet twee dingen, allebei in je eigen
browser, op de pagina die je zelf open hebt:

- **ParseForm — formulieren laten invullen.** Je maakt een lijst in Excel, ParseLab vult het
  formulier op de website regel voor regel in en drukt op Opslaan. Handig voor portalen en
  extranetten waar je anders 30 keer hetzelfde intypt.
- **ParseScraper — websites uitlezen.** Klik op een prijs, een naam of één regel van een lijst, en je
  krijgt alles netjes in een Excel-bestand.

Er gaat niets naar buiten: geen server, geen account, geen kopie van je gegevens. Alles blijft op
je computer.

## Installeren

**Via de winkel (aanbevolen):** open de ParseLab-pagina in de Chrome Web Store en klik op
*Toevoegen aan Chrome*. Updates komen dan vanzelf. Staat ParseLab (nog) niet in de winkel, dan
regelt IT-beheer de installatie; zie helemaal onderaan.

Na het installeren opent één keer een pagina "Hier zit ParseLab". Zet het icoon vast: klik
rechtsboven op het puzzelstukje 🧩, zoek ParseLab en klik op de punaise 📌. Vanaf dan staat het
ParseLab-icoon altijd rechtsboven.

ParseLab vraagt géén toegang tot al je websites. Hij krijgt pas toegang tot een site op het moment
dat jij daar op het icoon klikt.

## Zo werkt het

1. **Open de pagina** waar je wilt werken en klik op het ParseLab-icoon. Het paneel verschijnt op
   de pagina. (Sluiten: ✕ rechtsboven in het paneel.)
2. **Wijs aan wat er moet gebeuren.** Klik op *+ Stap toevoegen* en kies:
   - **Invullen** — klik het veld, de keuzelijst of het hele formulier. ParseLab ziet zelf of het een
     tekstveld, datum of keuzelijst is.
   - **Klikken** — klik op de knop die ingedrukt moet worden (Opslaan, Volgende…).
   - **Uitlezen** — klik op een tekst, prijs of één regel van een lijst. ParseLab vraagt dan:
     *Alleen dit, of de hele lijst?* en laat zien wat er meekomt.
   - **Wachten** — wacht tot de pagina klaar is (of een vaste tijd).
   Onder *Meer* staan de minder vaak gebruikte stappen, elk met één zin uitleg: een bewijskopie
   van de pagina bewaren (afbeelding of PDF), alle PDF's op een pagina downloaden, tekst typen,
   een toets indrukken, de muis ergens boven houden, scrollen.
   Bovenaan het paneel staan ook drie snelknoppen: *Iets invullen*, *Ergens op klikken*, *Even wachten*.
3. **Klik op Start.** Bij het invullen upload je eerst je lijst; de Start-knop laat zien hoeveel
   regels er gaan lopen ("Start · 24 regels"). Na afloop zie je één samenvatting:
   "24 regels gedaan, 3 om na te kijken".

### Je lijst maken (ParseForm)

Klik op **Maak mijn invullijst (Excel)**. ParseLab maakt een Excel-bestand met precies één kolom
per veld dat je hebt aangewezen. Vul dat in Excel in en klik op **Lijst uploaden**. Excel (.xlsx)
en CSV werken allebei.

- Bij elke *Invullen*-stap kies je uit de kolomkoppen van je lijst: *Welke kolom hoort hier?*
- Lege cel? Het veld blijft zoals het is.
- Datums mag je schrijven zoals je gewend bent: 30-11-2002, 30/11/2002 of 2002-11-30. Bij het
  inlezen zegt ParseLab: "Ik herken 'Geboortedatum' als datum ✓".
- Bij een formulier zie je per veld een voorbeeldwaarde uit de eerste regel van je lijst, zodat je
  vóór het starten ziet dat het klopt.

### Uitlezen (ParseScraper)

Bij elke *Uitlezen*-stap kies je *Wat wil je hebben?*: de tekst, de link of de afbeelding. Met het
vinkje *Maak er een getal van* wordt "€ 49,95" netjes 49,95. **Download bestand** geeft een
Excel-bestand; andere formaten staan onder Gevorderd.

### Handig om te weten

- **Controleer koppelingen** kijkt of alle aangewezen velden en knoppen nog op de pagina staan. Dit
  gebeurt ook automatisch vóór Start; als er iets mist zie je bijvoorbeeld: "Het veld 'Toevoeging'
  staat niet meer op deze pagina. Wijs het opnieuw aan →".
- **Alleen als dit er is** — een vinkje op elke stap: de stap wordt dan overgeslagen als het
  aangewezen element ontbreekt (bijvoorbeeld een melding die niet altijd verschijnt).
- **Cookiemeldingen** worden bij de start van een ronde automatisch weggeklikt. Uitzetten kan onder
  Instellingen.
- **Bewaar taak** bewaart alleen de stappen voor deze site — nooit je lijst. Daarna komt ParseLab
  op deze site vanzelf terug na een paginawissel, zodat een ronde doorloopt. Is het paneel dicht,
  dan zie je op zo'n site alleen een kleine knop *ParseLab* rechtsonder; één klik opent het paneel.
  *Taak van deze site wissen* (onder Gevorderd) zet dat weer uit.
- Laadt een lijst verder als je scrolt? Dan vraagt ParseLab bij *Uitlezen*: "Deze lijst laadt verder
  als je scrolt. Alles ophalen?" en scrolt eerst naar onderen tot alles er staat.
- **Pauze en Stop** werken altijd; na Pauze gaat *Hervat* verder waar je was, ook na een paginawissel.
- Tijdens een ronde zie je de voortgang en een schatting: "nog ongeveer 3 minuten".
- Bij de eerste ronde op een nieuwe website vraagt ParseLab één keer: "Je gaat automatisch invullen
  op portaal.example.nl. Mag dat van je organisatie?" Onder Gevorderd → Logboek staan de laatste
  rondes (site, tijd, aantal regels), zodat een kantoor kan verantwoorden wat er is gedaan.

### Instellingen en Gevorderd

- **Instellingen:** donker/licht, paneel links of rechts, taal (Nederlands, English, Deutsch,
  Français, Español), cookiemeldingen automatisch sluiten, en de map in Downloads (standaard
  `Downloads/ParseLab`) waar bestanden en bewijskopieën terechtkomen.
- **Gevorderd:** de taak herhalen, pauze tussen regels, *Als een regel niet lukt: sla over en ga
  door (aanbevolen)*, opnieuw proberen, bestanden sorteren in mappen op een kolom, andere
  bestandsformaten (CSV, JSON, ZIP, kopiëren), doorsturen naar een eigen internetadres (alleen
  https, met bevestiging), taken opslaan en laden als bestand, de opdrachtenbalk (typen wat je
  wilt), het logboek en het onderdeel *Voor IT-beheer*.

## Privacy

Niets verlaat je computer. ParseLab heeft geen server en geen account. Je lijst en de ingevulde
waarden worden nooit in een taak bewaard. Alleen als je zelf *Doorsturen (webhook)* instelt gaat er
iets naar een adres dat jij kiest, en dan alleen via https en na een bevestiging waarin je de
eerste regel ziet.

Automatisch invullen op een extranet of portaal van een ander (bijvoorbeeld met klantgegevens)
moet zijn toegestaan door de eigenaar of beheerder van dat systeem. ParseLab vraagt dat één keer
per site aan jou en houdt een logboek bij.

---

## Voor IT-beheer

**Installeren zonder winkel.** Pak de zip uit, open `chrome://extensions`, zet *Ontwikkelaarsmodus*
aan en kies *Uitgepakte extensie laden* → de map `extension`. Bij een update: map vervangen en op
↻ klikken. Voor een hele organisatie is een beleidsregel (`ExtensionInstallForcelist`) met het
store-id netter.

**Rechten (manifest v3).**
- Vast: `activeTab`, `scripting`, `storage`, `downloads`. Er is géén `host_permissions: <all_urls>`
  en géén content-script op alle pagina's. Het paneel wordt pas in een tabblad geladen na een klik
  op het icoon (of de sneltoets Alt+Shift+S).
- Optioneel, per site: `optional_host_permissions: <all_urls>`. Bij *Bewaar taak* of *Start* vraagt
  ParseLab toegang tot precies die origin (bv. `https://portaal.example.nl/*`) en registreert het
  paneel daar als content-script, zodat een lopende ronde en het paneel terugkomen na een
  paginawissel. Bij ✕ sluiten of *Taak van deze site wissen* wordt die registratie én de toegang
  weer verwijderd.
- Optioneel: `debugger` — alleen nodig voor de PDF-bewijskopie (Chrome's `Page.printToPDF`). Wordt pas
  gevraagd bij de eerste PDF-stap, met uitleg. De afbeelding-bewijskopie heeft dit recht niet nodig.
- Dashboard-detectie: een klein script `bridge.js` draait uitsluitend op `http://localhost/*`,
  `http://127.0.0.1/*` en `https://*.parselab.nl/*`. Het zet `data-parselab-extension="<versie>"` op
  het `<html>`-element en stuurt `postMessage({ source:"parselab-extension", type:"parselab:extension", version })`;
  het antwoordt op `{ source:"parselab-dashboard", type:"parselab:ping" }`.

**Opslag.** Alles in `chrome.storage.local`: taken per site (`wt-flow-<host>`, `wt-presets-<host>`;
alleen stappen), de geüploade lijst apart per site (`pl-csv-<host>`), instellingen (`pl-folder`,
`pl-cookies`, `wt-dark`, `wt-side`, `wt-lang`), toestemming per site (`pl-consent`), en het logboek
`pl-log` (max. 200 regels: host, start, einde, regels, fouten, bron).

**Hoe velden worden teruggevonden.** Moderne web-apps (MudBlazor, React) geven velden bij elke
pagina-load een nieuw id. ParseLab bewaart daarom per stap een structuurpad (tag + positie,
verankerd op een stabiel id) plus een vingerafdruk (type, stabiele klassen, placeholder, HTML). Bij
het uitvoeren wordt eerst het pad geprobeerd en anders de best passende kandidaat. Datum- en
gemaskeerde velden worden teken voor teken getypt; keuzelijsten (ook MudBlazor/ARIA-comboboxen)
worden geopend en op naam gekozen.

**Eigen patroon.** Onder Gevorderd kan per *Uitlezen*-stap een reguliere expressie worden ingevuld
(eerste capture-group wint). In cellen van de lijst mag `{{Kolom*1.21}}` staan om te rekenen.

**Bestanden.** CSV wordt met UTF-8 BOM en `;` geschreven (Nederlandse Excel); Excel via een eigen
minimale xlsx-writer/-reader (inline strings; datumopmaak uit `styles.xml` wordt herkend).

**Agent-koppeling (MCP).** Standaard uit. Onder Gevorderd → *Voor IT-beheer* zet je de koppeling aan;
de extensie toont een code van zes groepen. Die code zet je in `PARSELAB_MCP_TOKEN` voor de lokale
MCP-server in `mcp-server/` (zie de README daar). De extensie verbindt alleen zolang het paneel open
is, stuurt als eerste bericht `{type:"hello", token}` en voert pas opdrachten uit na `hello_ok`. Het
paneel toont "Verbonden met een agent" met een Stop-knop; elke `fill_records` wordt gelogd.
