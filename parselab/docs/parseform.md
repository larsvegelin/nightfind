# ParseForm — per element

Basis: de browserextensie in `tools/extension/` (`panel.js`, `background.js`, `manifest.json`, `README.md`). ParseForm en ParseScraper zijn technisch één extensie ("WebTool Scraper"); dit bestand gaat over alles wat met invullen en klikken te maken heeft. Het scrapen staat in `parsescraper.md`.

## Status van toepassing

| Element | Status |
|---|---|
| Web Store in plaats van zip | Voorbereid: dashboardknop "Toevoegen aan Chrome" (`CONFIG.webstoreUrl`), IT-route met zip eronder; de vermelding zelf moet worden ingediend |
| Rechten: `activeTab` in plaats van `<all_urls>`, `debugger` optioneel, geen `tabs`; sitetoegang per website na toestemming | Toegepast (`manifest.json`, `background.js`) |
| Sneltoets niet meer dé ingang; welkomstpagina "Hier zit ParseLab", icoon vastzetten | Toegepast (`welcome.html`); automatisch vastzetten kan Chrome niet |
| Paneel alleen terug op sites met een bewaarde taak, met kleine hoekknop | Toegepast |
| Chatbalk ingeklapt onder Gevorderd; drie snelknoppen | Toegepast |
| Vier hoofdstappen Invullen / Klikken / Uitlezen / Wachten, rest onder "Meer" | Toegepast; Invullen herkent zelf veld, datum, keuzelijst of formulier |
| Voorbeeldwaarde uit regel 1 bij Formulier vullen | Toegepast |
| Kolom kiezen uit de kolomkoppen; "Lege cel? Veld blijft zoals het is." | Toegepast |
| Datums: gangbare notaties, "Ik herken 'X' als datum ✓" | Toegepast |
| Variabelen en rekenen alleen onder Gevorderd | Toegepast |
| Wachten = slim wachten; Voorwaarde = vinkje "Alleen als dit er is" | Toegepast |
| "Start · N regels" en eindsamenvatting | Toegepast |
| Invullijst als Excel (.xlsx), upload van xlsx en csv | Toegepast |
| Automatische koppelingscheck vóór Start met "Wijs het opnieuw aan →" | Toegepast |
| Taken bewaren zonder lijstdata | Toegepast; opslaan bij het account wacht op een backend |
| Instellingen en Gevorderd gescheiden; "sla over en ga door (aanbevolen)" | Toegepast |
| Taalkiezer in Instellingen | Toegepast |
| Webhook alleen https, met bevestiging, onder Gevorderd | Toegepast |
| Toestemming per portaal bij de eerste ronde; logboek per ronde | Toegepast (`pl-consent`, `pl-log`) |

## Installatie en toegang

### Installeren via zip en ontwikkelaarsmodus
- **Nu:** zip uitpakken, `chrome://extensions`, Ontwikkelaarsmodus aan, "Uitgepakte extensie laden". Bij elke update opnieuw.
- **Simpeler:** publiceer in de Chrome Web Store (en Edge Add-ons). Eén knop "Toevoegen aan Chrome" in het dashboard. Updates gaan vanzelf.
- **Veiliger:** de store controleert de code, de gebruiker kan geen gemanipuleerde kopie krijgen en er bestaan geen verouderde versies met bekende fouten meer. Ontwikkelaarsmodus geeft bovendien elke keer een waarschuwing bij het opstarten van Chrome, wat leken onzeker maakt.
- **Prioriteit:** 1

### Rechten in het manifest
- **Nu:** `activeTab`, `scripting`, `storage`, `downloads`, `tabs`, `debugger`; `host_permissions: <all_urls>`; een content-script op álle pagina's bij `document_idle`.
- **Simpeler:** minder rechten is minder installatie-waarschuwingen. Nu meldt Chrome "kan al je gegevens op alle websites lezen en wijzigen" plus "toegang tot de debugger", wat precies de zin is waar een leek op afhaakt.
- **Veiliger:** vraag sitetoegang pas als de gebruiker het paneel opent (`activeTab` + `scripting.executeScript` in plaats van een vast content-script op `<all_urls>`); maak `debugger` een `optional_permission` die alleen wordt gevraagd bij de eerste 🖨 Print-stap; laat `tabs` vervallen als `activeTab` volstaat. De README belooft "dankzij activeTab heeft hij pas toegang op het moment dat jíj op het icoon klikt", maar het manifest laadt `panel.js` en `panel.css` toch overal. Laat de code de belofte waarmaken.
- **Prioriteit:** 1

### Sneltoets Alt+Shift+S
- **Nu:** enige manier naast het icoon; in de docs steeds genoemd.
- **Simpeler:** leken onthouden geen sneltoetsen. Het icoon rechtsboven is de ingang; zet de extensie na installatie automatisch vast (pin) en toon één keer een pijl "Hier zit ParseLab".
- **Prioriteit:** 2

### Paneel blijft open op elke pagina
- **Nu:** eenmaal geopend verschijnt het paneel op elke volgende pagina totdat je ✕ klikt.
- **Simpeler:** logisch tijdens een taak, verwarrend erbuiten. Laat het paneel alleen automatisch terugkomen op sites waar een taak is opgeslagen, met een kleine knop "ParseLab" in de hoek in plaats van het volledige paneel.
- **Veiliger:** een content-script dat op elke site meeloopt heeft toegang tot alles wat de gebruiker daar ziet, ook bankieren. Beperk het meelopen tot sites met een opgeslagen taak.
- **Prioriteit:** 2

## Het paneel

### Chatbalk "Bouw met opdrachten"
- **Nu:** typ `vul veld met {{Naam}}`, `klik Opslaan`, `wacht 2s`, `help`; stappen worden aangemaakt, doel daarna aanwijzen.
- **Simpeler:** sterk idee, maar de syntaxis (`{{Naam}}`, `wacht 2s`) is programmeren met een chatgevoel. Vervang door een keuzelijst met drie knoppen bovenaan: *Iets invullen*, *Ergens op klikken*, *Even wachten*. De chatbalk mag blijven voor gevorderden, ingeklapt.
- **Prioriteit:** 2

### "+ Stap toevoegen" met vijftien staptypen
- **Nu:** Element scrapen, Lijst scrapen, Formulier vullen, Veld invullen, Dropdown, Knop drukken, Wachten, Screenshot, Print, Typ tekst / Toets, Hover, Scroll, Scroll & laad, Wacht op element, Voorwaarde, Bestanden, Webhook.
- **Simpeler:** vijftien keuzes met emoji is een menukaart, geen hulp. Toon standaard vier: *Invullen*, *Klikken*, *Uitlezen*, *Wachten*. De rest onder "Meer" en met een uitleg van één zin per stap. "Formulier vullen" en "Veld invullen" en "Dropdown" horen één stap te zijn: *Invullen*, waarna de tool zelf ziet of het een tekstveld, datum of keuzelijst is.
- **Prioriteit:** 1

### Formulier vullen → aanvinklijst van velden, knopjes alle/geen
- **Nu:** klik het formulier, vink af welke velden je niet wilt.
- **Simpeler:** goed. Toon bij elk veld een voorbeeldwaarde uit de eerste CSV-regel zodat de gebruiker ziet dat het klopt vóór hij start.
- **Prioriteit:** 2

### Veld invullen → kolomnaam kiezen, "Leeg = overslaan"
- **Nu:** technische veldnaam (`mudinput828389`) wordt `veld1`; gebruiker hernoemt naar `postcode`; optie "leeg = overslaan" staat standaard aan.
- **Simpeler:** vraag niet om een kolomnaam maar laat de gebruiker de kolom uit zijn eigen lijst kiezen ("Welke kolom hoort hier?" met de kolomkoppen van de CSV). "Leeg = overslaan" is een goede standaard; de uitleg mag korter: "Lege cel? Veld blijft zoals het is."
- **Prioriteit:** 1

### Datum- en gemaskeerde velden (teken voor teken typen)
- **Nu:** werkt automatisch, uitgelegd in de README met voorbeelden `30-11-2002` en `dd-MM-yyyy`.
- **Simpeler:** de gebruiker hoeft dit niet te weten. Accepteer elke gangbare datumnotatie in de CSV en toon bij het inlezen "Ik herken 'Geboortedatum' als datum ✓".
- **Prioriteit:** 2

### Variabelen en rekenen (`{{Prijs*1.21}}`)
- **Nu:** in een CSV-cel of veldstap.
- **Simpeler:** voor leken onzichtbaar maken; wie rekenen nodig heeft doet dat in Excel vóór het uploaden. Houd de functie, verberg de documentatie achter "Gevorderd".
- **Prioriteit:** 3

### Knop drukken, Wachten, Wacht op element, Voorwaarde
- **Nu:** vier losse stappen; "Wacht op element" met time-out; "Voorwaarde" met bestaat / bevat tekst en overslaan of stoppen.
- **Simpeler:** "Wachten" en "Wacht op element" worden één stap *Wachten tot de pagina klaar is* (de tool kiest zelf slim wachten met een maximum). "Voorwaarde" wordt een vinkje op een stap: "Alleen als dit er is".
- **Prioriteit:** 2

### ▶ Start · ⏸ Pauze · ■ Stop
- **Nu:** vaste knoppenrij onderaan; Start begint altijd opnieuw.
- **Simpeler:** goed. Toon naast Start hoeveel regels er gaan lopen ("Start · 24 regels") en na afloop één samenvatting: "24 regels gedaan, 3 om na te kijken".
- **Prioriteit:** 2

### ⤒ Upload data · ⬇ CSV-sjabloon van invoervelden · ✕ CSV wissen
- **Nu:** CSV uploaden onder "Data voor invullen"; het sjabloon maakt een kolomkop per veld met `;`.
- **Simpeler:** het sjabloon is de beste stap in de hele flow, maar de naam "CSV-sjabloon van invoervelden" schrikt af. Noem het "Maak mijn invullijst (Excel)" en lever een `.xlsx` in plaats van een CSV. Leken openen een CSV en zien alles in één kolom staan; een xlsx opent altijd goed. Upload accepteert dan ook xlsx.
- **Prioriteit:** 1

### 🎯 per stap en 🔗 Check koppelingen
- **Nu:** toont het gekoppelde element met blauwe omlijning; check geeft ✓ of ✗ per stap.
- **Simpeler:** goed. Laat de check automatisch lopen vóór Start en toon in gewone taal wat er mis is: "Het veld 'Toevoeging' staat niet meer op deze pagina. Wijs het opnieuw aan →".
- **Prioriteit:** 1

### Bewaar flow / Laad flow, meerdere flows per site, exporteren als bestand
- **Nu:** per website opgeslagen in de extensie; import/export onder Meer opties.
- **Simpeler:** flows horen bij het account, niet bij de browser. Sla ze op in ParseLab zodat ze in het dashboard staan onder "Flows" en op een andere computer beschikbaar zijn.
- **Veiliger:** een flow kan CSV-data met persoonsgegevens bevatten. Bewaar de CSV niet ín de flow; alleen de stappen. De data uploadt de gebruiker per ronde.
- **Prioriteit:** 2

### ⚙ Meer opties (herhaal, foutafhandeling, downloadmap, exportformaten, presets, thema, links/rechts, import/export, MCP-koppeling)
- **Nu:** één ingeklapte sectie met alles.
- **Simpeler:** splits in "Instellingen" (thema, positie, taal) en "Gevorderd" (retry, bij-fout, webhook, MCP). "Bij fout: overslaan of stoppen" wordt "Als een regel niet lukt: sla over en ga door (aanbevolen)".
- **Prioriteit:** 2

### Taalkiezer (NL, EN, DE, FR, ES)
- **Nu:** volgt de browsertaal, keuze rechtsboven.
- **Simpeler:** goed; verplaats naar Instellingen.
- **Prioriteit:** 3

## Veiligheid en privacy

### "Niets naar buiten"
- **Nu:** klopt: geen server, alles lokaal.
- **Veiliger:** blijft de kern van de belofte. Als flows naar het ParseLab-account gaan (zie boven), maak dan in het paneel zichtbaar wát gesynchroniseerd wordt (stappen) en wát niet (de CSV, de ingevulde waarden).
- **Prioriteit:** 1

### Webhook-stap (POST van de huidige rij naar een URL)
- **Nu:** vrije URL.
- **Veiliger:** een rij met persoonsgegevens gaat naar een willekeurig adres. Vereis https, toon een bevestiging met de eerste rij als voorbeeld, en zet de stap onder "Gevorderd".
- **Prioriteit:** 2

### Automatisering op een extranet met klantgegevens
- **Nu:** README: "moet door de beheerder zijn toegestaan".
- **Veiliger:** leg dat één keer in de tool voor bij de eerste run op een nieuw domein: "Je gaat automatisch invullen op portaal.example.nl. Mag dat van je organisatie?" met Ja / Nee. Log per ronde domein, tijdstip en aantal regels in het dashboard, zodat een kantoor kan verantwoorden wat er is gedaan.
- **Prioriteit:** 2
