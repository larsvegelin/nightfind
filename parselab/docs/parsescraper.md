# ParseScraper — per element, en de scraper zonder extensie

Basis: `tools/extension/` (`panel.js`, `background.js`, `manifest.json`, `mcp-server/`). Alles wat over invullen gaat staat in `parseform.md`; hier gaat het over uitlezen, exporteren en de vraag of dit vanuit het dashboard kan in plaats van als extensie.

## Status van toepassing

| Element | Status |
|---|---|
| Scraper vanuit de tool (serverbrowser, proxies, planning) | Gebouwd: `server/server.js` en `tools/parsescraper.html`, drie stappen Adres → Aanwijzen → Klaar, taken elk uur/dag/week op de server, Excel/CSV. Grenzen: alleen openbare pagina's, robots.txt, 2 s per website, geen captcha-omzeiling |
| Eén stap Uitlezen met "Alleen dit, of de hele lijst?" en voorbeeld | Toegepast |
| "Wat wil je hebben?" (tekst / link / afbeelding), "Maak er een getal van", "Eigen patroon" onder Gevorderd | Toegepast |
| Doorladen bij scrollen zelf herkennen ("Alles ophalen?") | Toegepast |
| Cookiemeldingen automatisch sluiten (instelling) | Toegepast |
| Bewijskopie (afbeelding/PDF); `debugger` pas bij de eerste PDF-stap | Toegepast |
| "Download alle PDF's op deze pagina" als één klik | Toegepast |
| Downloadmap `ParseLab`, "Sorteer bestanden in mappen op:" | Toegepast |
| Excel standaard, andere formaten apart, geen BOM/`;` zichtbaar | Toegepast |
| Resttijd en één eindmelding | Toegepast |
| Webhook alleen https met bevestiging | Toegepast |
| MCP: uit het gebruikerspaneel, gedeeld geheim, alleen bij open paneel, status + Stop, logboek | Toegepast (`PARSELAB_MCP_TOKEN`, hello/hello_ok) |
| Installatie en rechten | Toegepast, zie `parseform.md` |

## Scraper vanuit de tool in plaats van een extensie

### Waarom de extensie nu nodig is
De extensie draait bovenop de pagina die de gebruiker zelf ziet. Daardoor werkt het op ingelogde portalen, na JavaScript, achter cookiemeldingen en in web-apps. Dat is de kracht, en tegelijk de drempel: installeren, rechten, ontwikkelaarsmodus, een paneel dat over de pagina zweeft.

### Wat er wél vanuit het dashboard kan
Een groot deel van de scrapes uit de voorbeelden (webshop-prijzen, concurrentie-assortiment, vacatures, openbare registers) is zonder inloggen te zien. Daarvoor kan ParseLab de pagina zelf ophalen en renderen, met een echte browser op de server (Playwright of vergelijkbaar), en de gebruiker in het dashboard laten aanwijzen wat hij wil.

| Situatie | Vanuit het dashboard | Extensie nodig |
|---|---|---|
| Openbare webshop, vacaturesite, register, nieuwssite | Ja | Nee |
| Pagina die pas laadt na scrollen of klikken ("laad meer") | Ja, de serverbrowser kan scrollen en klikken | Nee |
| Ingelogd portaal, extranet, intern systeem | Nee, tenzij de gebruiker zijn login afgeeft en dat wil je niet | Ja |
| Formulieren invullen en knoppen drukken in een web-app | Nee | Ja |
| Sites die scrapers actief weren (captcha, bot-detectie) | Beperkt | Meestal wel, want het is de gebruiker zelf |
| Bestanden en PDF's downloaden achter een login | Nee | Ja |

### Voorstel: "Website uitlezen" in het dashboard
1. **Plak een adres.** Eén veld: "Welke pagina wil je uitlezen?" Het dashboard haalt de pagina op en toont hem in de werkbank als een live voorbeeld (een gerenderde weergave uit de serverbrowser, geen iframe; iframes worden door de meeste sites geblokkeerd).
2. **Klik één item aan.** Precies het klik-en-scrape-principe van de extensie, maar in het voorbeeld in het dashboard. De lijst wordt herkend; kolommen krijgen een naam.
3. **Kies wanneer.** Nu, dagelijks, wekelijks. Hier zit de tweede grote winst: de extensie kan alleen scrapen als de browser van de gebruiker open staat. Vanuit ParseLab kan een scrape 's nachts draaien en staat het resultaat 's ochtends in ParseBoard.
4. **Download of stuur door.** Naar Excel, of rechtstreeks als bron voor ParseBoard.

De extensie blijft bestaan, maar wordt de uitzondering: "Deze pagina vraagt om inloggen. Gebruik de ParseLab-extensie in je eigen browser →". Voor de meeste gebruikers is de eerste scrape dan een bestand uploaden en een adres plakken, meer niet.

### Wat het veiliger maakt
- De gebruiker installeert niets en geeft geen rechten op zijn hele browser.
- Scrapen gebeurt vanaf ParseLab-servers met een vast, herkenbaar user-agent en respect voor `robots.txt` en snelheidslimieten; dat is netter richting de sites dan honderd individuele browsers, en juridisch beter uit te leggen.
- Er gaat nooit een login of sessie van de gebruiker naar ParseLab, omdat ingelogde sites simpelweg niet in deze route zitten.

### Wat het simpeler maakt
- Zelfde werkbank als ParsePDF: bestand of adres erin, aanwijzen, exporteren. Wie ParsePDF begrijpt, begrijpt dit.
- Geen paneel dat over een vreemde website zweeft, geen sneltoets, geen "paneel blijft open op elke pagina".
- Planning en geschiedenis staan op één plek, in het dashboard.

### Tussenstap zonder backend
Wil je dit eerder hebben dan een serverbrowser: een "ParseLab Companion" als kleine desktop-app (Electron of Tauri) met een ingebouwde browser waarin de gebruiker gewoon inlogt. Dezelfde `panel.js` draait daarin als ingebouwde laag, zonder Web Store en zonder manifest-rechten. Dat lost installatie en rechten op, maar niet het plannen buiten kantooruren, en het is een tweede codebasis. Aanbevolen volgorde: eerst Web Store (klein werk), dan de serverroute voor openbare sites, de companion alleen als de extensie in de praktijk door IT-afdelingen wordt geblokkeerd.

## Het paneel, per element

### 🔎 Element scrapen en 📋 Lijst scrapen
- **Nu:** twee losse stappen; bij lijst wordt de rest herkend "Octoparse-stijl".
- **Simpeler:** één stap *Uitlezen*; na de klik vraagt de tool "Alleen dit, of de hele lijst?" met een voorbeeld van wat er dan meekomt. Het woord "scrapen" verdwijnt uit de UI.
- **Prioriteit:** 1

### Scrape-opties: kolomnaam, attribuut (text/href/src/alt), opschoning (trim, alleen getal, regex met capture-group)
- **Nu:** per element in te stellen.
- **Simpeler:** "attribuut" wordt "Wat wil je hebben?": *de tekst*, *de link*, *de afbeelding*. "Opschoning" wordt "Maak er een getal van" als vinkje; de tool herkent `€ 49,95` zelf. Regex verdwijnt naar "Gevorderd" en heet daar "Eigen patroon".
- **Prioriteit:** 1

### 🖱 Hover, ↕ Scroll, ↕ Scroll & laad
- **Nu:** drie stappen voor inhoud die pas verschijnt bij hover of scrollen.
- **Simpeler:** de tool ziet zelf of een lijst doorlaadt bij scrollen en vraagt "Deze lijst laadt verder als je scrolt. Alles ophalen?". Hover blijft onder "Meer".
- **Prioriteit:** 2

### ❓ Voorwaarde (cookiemelding wegklikken)
- **Nu:** losse stap "doe de volgende stap alleen als element bestaat".
- **Simpeler:** cookiemeldingen zijn zo standaard dat de tool ze zelf mag herkennen en wegklikken, met een vinkje "Cookiemeldingen automatisch sluiten" in Instellingen.
- **Prioriteit:** 2

### 📸 Screenshot en 🖨 Print naar PDF
- **Nu:** print gebruikt `chrome.debugger` en `Page.printToPDF`.
- **Simpeler:** goede functies voor bewijsvoering (dossiers). Benoem ze zo: "Bewaar een bewijskopie van deze pagina".
- **Veiliger:** `debugger` is de zwaarste permissie in het pakket en geeft de extensie in principe volledige controle over het tabblad. Maak het een `optional_permission` die pas bij de eerste Print-stap wordt gevraagd, met uitleg. Screenshot heeft dat recht niet nodig.
- **Prioriteit:** 1

### ⬇ Bestanden (download alle img/PDF-links op patroon)
- **Nu:** patroon invullen.
- **Simpeler:** "Download alle PDF's op deze pagina" als één klik, patroon alleen onder Gevorderd.
- **Prioriteit:** 3

### Herhaal, retry, bij-fout, downloadmap, submap per kolom
- **Nu:** onder Meer opties. Submap per kolom maakt per unieke waarde (relatienummer) een map.
- **Simpeler:** downloadmap standaard `Downloads/ParseLab`; "submap per kolom" wordt "Sorteer bestanden in mappen op: [kolom kiezen]". Retry en bij-fout krijgen een aanbevolen standaard en verdwijnen uit het zicht.
- **Prioriteit:** 2

### Export: JSON, CSV (UTF-8 BOM, `;`), Excel, ZIP, klembord
- **Nu:** vijf formaten.
- **Simpeler:** standaard Excel. CSV en JSON onder "Andere formaten". Het is goed dat de CSV Nederlandse Excel-proof is, maar de gebruiker hoeft "UTF-8 BOM" en "`;`" nergens te zien.
- **Prioriteit:** 1

### Loopt door over paginawissels, pauze en hervat, voortgang "2/5 voltooid"
- **Nu:** werkt; voortgang per stap met ✓ en balk.
- **Simpeler:** goed. Voeg een geschatte resttijd toe ("nog ongeveer 3 minuten") en één eindmelding.
- **Prioriteit:** 3

### 🔗 Webhook
- **Nu:** POST van de huidige rij naar een URL.
- **Veiliger:** zie `parseform.md`. Vereis https en een bevestiging.
- **Prioriteit:** 2

## MCP-koppeling en lokale bridge

### MCP-koppeling (knop onder Meer opties, `chrome.storage 'wt-mcp'`)
- **Nu:** standaard uit; de extensie verbindt met `ws://127.0.0.1:8765`; de MCP-server biedt `read_fields`, `fill_records`, `ping`.
- **Simpeler:** dit is voor ontwikkelaars en AI-agenten, niet voor de doelgroep. Haal het uit het gebruikerspaneel en zet het in het dashboard onder "Voor IT-beheer" met een duidelijke uitleg wat het doet.
- **Veiliger:** de WebSocket op localhost heeft geen handshake. Elk proces op de computer dat op poort 8765 luistert kan zich voordoen als de MCP-server en de extensie opdracht geven om records in te vullen in het ingelogde tabblad. Voeg een gedeeld geheim toe (de extensie toont een code, de gebruiker plakt die bij de MCP-server), laat de extensie alleen verbinden als de gebruiker het paneel open heeft, en toon in het paneel een duidelijke status "Verbonden met een agent" met een Stop-knop. Log elke `fill_records`-opdracht met tijd en aantal records.
- **Prioriteit:** 1

## Installatie en rechten
Identiek aan `parseform.md`: Web Store in plaats van zip, `activeTab` in plaats van `<all_urls>` en een content-script overal, `debugger` optioneel, paneel alleen op sites met een opgeslagen taak. Prioriteit 1.
