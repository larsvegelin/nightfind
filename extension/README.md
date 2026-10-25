# ParseLab — handleiding

ParseLab is een kleine uitbreiding voor Chrome (en Edge). Hij doet twee dingen, allebei in je eigen
browser, op de pagina die je zelf open hebt:

- **formulier invullen — formulieren laten invullen.** Je maakt een lijst in Excel, ParseLab vult het
  formulier op de website regel voor regel in en drukt op Opslaan. Handig voor portalen en
  extranetten waar je anders 30 keer hetzelfde intypt.
- **de website-bron — websites uitlezen.** Klik op een prijs, een naam of één regel van een lijst, en je
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
   de pagina; nog een klik sluit het weer. (Ook sluiten: ✕ rechtsboven in het paneel.)
   Gebeurt er niets, kijk dan naar het icoon: staat er een rood uitroepteken, houd de muis er dan
   op. Op browserpagina's (`chrome://`, nieuw tabblad), in de browserwinkel en bij bestanden op je
   schijf mag geen enkele extensie werken. Open eerst een gewone website.
2. **Wijs aan wat er moet gebeuren.** Klik op *+ Stap toevoegen* en kies:
   - **Invullen** — klik het veld, de keuzelijst of het hele formulier. ParseLab ziet zelf of het een
     tekstveld, datum of keuzelijst is. Zit het veld in een webcomponent (veel
     verzekeraarsportalen bouwen zo), dan pakt ParseLab het veld daarbinnen — ook als je net naast
     het invoervak klikt, op de rand of op het zoekicoon.
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

### Nieuw in 1.22: begeleiding, PDF per klant en lussen

- **Wat wil je doen?** Bij het openen kies je een doel (PDF per item, uitlezen naar Excel,
  invullen vanuit Excel, herhalen per item). ParseLab leidt je er stap voor stap doorheen. Bovenaan
  zie je steeds de fase (① Aanwijzen → ② Start → ③ Resultaat) en wat de volgende stap is. De
  rondleiding staat achter het **?** in de kop.
- **PDF opslaan** werkt als *Ctrl+P → Opslaan als PDF* (A4, met achtergronden), maar zonder venster.
  Kies bij de stap **Map per unieke waarde**: dan komt elke PDF in `Downloads/ParseLab/<waarde>/`,
  bijvoorbeeld per klantnummer. De waarde mag uit je lijst komen, uit een *Uitlezen*-stap of uit
  de lus.
- **Pagina's met een kader (iframe)**, zoals de pakketpagina in Cockpit: ParseLab print dan alleen
  het kader, volledig, net als klikken in de pagina + Ctrl+A + Ctrl+P. Bredere inhoud wordt
  automatisch verkleind zodat er rechts niets wegvalt. Bij de stap kun je kiezen: automatisch,
  alleen het kader, of de hele pagina.
- **Voor elk item (lus).** Wijs één regel van een lijst aan; ParseLab vindt de andere regels. Stappen
  die je daarna toevoegt gebeuren bij elk item (je wijst ze aan bij het eerste item). Met
  **⚡ PDF per item** bouwt ParseLab de hele lus in één keer: klik op het item → wachten →
  PDF in een map per waarde → terug naar de lijst → volgende item. Test eerst met 3 items.
- **Nieuwe pagina?** Opent een klik tijdens het bouwen een andere pagina, dan verschijnt een gele balk
  met **↩ Terug naar vorige pagina** en **+ Wachten**. In de stappenlijst staat waar een nieuwe pagina
  begint, met **ga hierheen** om terug te springen. De stap **Terug / naar pagina** gaat terug, naar
  de lijst van de lus, of naar een vast adres.
- **Groter paneel** (instelling: normaal, groot of extra groot) en nooit meer naar links en rechts
  scrollen.

### Nieuw in 1.49
- **Rustig tempo** (Start → Volgende ronde → *rustig tempo*): na elke regel wacht ParseLab tot de pagina klaar is en pauzeert dan nog een paar seconden. De pauze verschilt per regel (tussen 1× en 2× het ingestelde aantal seconden). Zo krijgt een site niet elke paar seconden een verzoek. Handig voor grote lijsten op sites zoals de BAG Viewer of Google Maps.

### Nieuw in 1.48
- **Andere pagina's uitlezen** (Handmatig → Uitlezen → Andere pagina's): voor elke regel uit je lijst haalt ParseLab de pagina van het adres in die regel op en leest hem uit, ook van andere websites, zonder je tabblad te verlaten. Werkt op elke site die je in Chrome kunt openen, met je eigen inlog; er is geen API nodig.
- **Ophalen**: *automatisch* (standaard) probeert eerst snel, alleen de HTML. Komt daar niets uit (bijvoorbeeld bij een pagina die met JavaScript wordt opgebouwd), dan opent ParseLab de pagina in een verborgen tabblad, wacht tot hij klaar is en sluit het tabblad weer. Je kunt ook vast *snel* of *volledig* kiezen.
- **Velden aanwijzen**: open één pagina van dezelfde soort en klik op wat je wilt (titel, prijs, link, afbeelding). ParseLab maakt er een selector van die ook op de andere pagina's werkt. Pas de kolomnaam aan bij de stap. Zonder velden leest ParseLab de hele pagina: titel, beschrijving, koppen, label-waarde-paren en tekst.
- **Test op eerste adres** laat direct zien wat er uitkomt. Met **pauze** tussen pagina's (standaard 1 s) houd je een rustig tempo.
- Een adres dat niet bestaat (404) of geen webpagina is, komt als fout in het resultaat met het adres erbij. De rest van de lijst gaat gewoon door.

### Nieuw in 1.47
- **Planning**: Flows → Planning. Laat een flow starten elke dag, op werkdagen, wekelijks, elke X minuten of één keer. Op het tijdstip opent ParseLab een venster met de startpagina, laadt de flow uit de cloud, voert hem uit en sluit het venster na afloop (instelbaar). "Nu uitvoeren" test het direct. Planningen gelden per computer; Chrome moet open zijn en je moet op de site ingelogd zijn.
- **Wachtrij (cloud)**: Flows → Wachtrij. Zet je lijst in de wachtrij, of laat collega's/andere systemen (Power Automate, Make, script) regels toevoegen via één HTTP-verzoek (voorbeeld staat in het paneel). Zet bij Start "Regels uit: de wachtrij": de flow pakt het volgende werk op, meldt per regel klaar (met resultaat) of fout (met reden), en zet niet-afgemaakte regels terug. Twee computers pakken nooit dezelfde regel. "Fouten opnieuw" en "Klaar opruimen" met één klik.
- **Alleen starten als er werk is**: een planning met deze optie opent geen venster als de wachtrij leeg is.
- **Geschiedenis**: Flows → Geschiedenis toont elke run: wanneer, handmatig/gepland/wachtrij, rondes, fouten, duur en welke computer.
- **Naam van deze computer** (Instellingen → Cloud), zichtbaar in wachtrij en geschiedenis.
- Hersteld: na een paginawissel midden in een ronde bleven de flow-instellingen (bv. startpagina, regels uit) niet behouden.
- Nieuw logo (flow met drie knooppunten), ook in het paneel.

### Nieuw in 1.46
- **Flows worden vanzelf bewaard in de cloud** (Supabase-project "scraper", EU/Frankfurt). Zodra een flow een stap heeft, staat hij in de cloud ("Naamloos …"). Elke wijziging wordt automatisch opgeslagen: stappen, startpagina, PDF-naam, rondes, regels van–tot en de andere instellingen.
- **Naam en map**: klik bovenaan de flow op de naam. Geef een naam en kies een map, of maak een nieuwe map (ook genest, bv. `Cockpit/Polissen`).
- **Flows** (knop naast de naam) toont al je flows per map, inklapbaar en met een zoekveld. Klik een flow om hem te laden; de huidige flow wordt eerst opgeslagen. Per flow: naam/map wijzigen, vorige versie terugzetten, verwijderen. Per map: submap maken, hernoemen, verwijderen (alleen als hij leeg is).
- **+** naast Flows = nieuwe lege flow.
- **Versies**: bij wijzigingen bewaart de cloud hoogstens elke 5 minuten de vorige versie. Die kun je terugzetten.
- **De lijst** (klantgegevens) gaat standaard níet mee naar de cloud. Per flow aan te zetten bij naam/map ("lijst ook bewaren").
- **Teamcode** (Instellingen → Cloud): wordt automatisch aangemaakt. Wie dezelfde code invult (Koppel), ziet dezelfde flows. De code werkt als wachtwoord: de database bewaart alleen een versleutelde vorm en laat via beveiligingsregels (RLS) alleen de flows van het eigen team zien.
- **ZIP altijd automatisch**: aan het eind van elke opdracht (klaar of gestopt) wordt de ZIP vanzelf gedownload. Loopt een ronde vast, dan komt er meteen een tussenstand-ZIP (hoogstens elke 3 minuten). De ZIP-naam bevat de flownaam en datum/tijd.
- Voor IT-beheer: een ander database-adres kan via chrome.storage `pl-db-url` / `pl-db-key` (alleen https of localhost).

### Nieuw in 1.45
- **Voorloopnullen tellen niet**: Excel haalt de 0 vooraan weg (0865358741 wordt 865358741). ParseLab ziet die nummers nu als hetzelfde bij "gelijk aan" en "is", bij knoppen kiezen op waarde, bij regels (als … dan) en bij suggesties in zoekvelden. Spaties of punten in een nummer tellen ook niet (0865 358 741).
- **"Bevat" is letterlijk**: staat de waarde ergens in de tekst, dan klopt het (865358741 vindt ook 0865358741 en 1865358741). Zijn er meerdere treffers, dan wint de beste: eerst het precies gelijke nummer (met of zonder voorloopnullen), daarna een gedeeltelijke treffer.

### Nieuw in 1.44
- **Vastgelopen? Terug naar stap 1**: lukt een stap niet (ook niet na één keer opnieuw proberen vanaf het adres), dan doet ParseLab de rest van die ronde NIET. Het gaat terug naar stap 1 en begint aan de volgende ronde. In het logboek en aan het eind staat welke rondes zijn overgeslagen (met waarde en stap). In het Excel-bestand krijgt die ronde een kolom "Fout".
- **ZIP tijdens de run**: "Alles als ZIP" werkt al vanaf de start, met alles wat tot dan toe is opgeslagen. Handig als het ergens vastloopt.
- **Startpagina voor stap 1** (bovenaan de flow, "Start op"): wordt automatisch ingevuld met het adres van stap 1. Je kunt het aanpassen, of met het doel-icoon de huidige pagina nemen. Elke ronde begint daar. ParseLab wacht tot de pagina echt geladen is, en tot het element van stap 1 er staat (geen vast aantal seconden).
- **Regels kiezen** (bij Start): alles, eerste 100, eerste 500 of van … tot …. Na afloop staat de volgende portie meteen klaar (bv. 101–200), dus je klikt gewoon weer op Start. Bij een stop gaat de volgende portie verder vanaf de eerste regel die nog niet gedaan is.

### Nieuw in 1.43
- **Bestandsnaam is vrije tekst**: typ bij Resultaat → Bestandsnaam gewoon een naam, bv. `personenauto`. Wil je een waarde uit je lijst in de naam? Klik op een kolomknop eronder; dan komt er `{{polisnummer}}` in te staan. Combineren mag, bv. `{{polisnummer}} personenauto`. Een streepje is niet meer verplicht. Leeg = automatisch.
- Dezelfde naam in één map krijgt (2), (3)… erachter. Spaties in bestandsnamen blijven nu gewoon spaties (geen _ meer).
- **Eerste blad van elke PDF overslaan**: een vinkje bij Resultaat. Heeft een PDF maar één blad, dan wordt dat blad wel opgeslagen (met een melding in het logboek).

### Nieuw in 1.42
- **Bestandsnaam van PDF's en screenshots uit een kolom**: onderin bij Resultaat staat **Bestandsnaam**. Kies een kolom (bv. polisnummer) en eventueel een tweede kolom erachter. Elke PDF krijgt dan de waarde van die regel als naam, bv. `7552439005 - 3700 - A.B. de Jong.pdf`. Je ziet direct een voorbeeld van de naam.
- Op "automatisch" blijft het zoals het was: de ingevulde lijstwaarde, anders de stapnaam.
- Krijgen twee bestanden in dezelfde map dezelfde naam, dan komt er (2), (3)… achter. Er wordt niets overschreven.
- De keuze wordt onthouden. Een naam die bij de PDF-stap zelf is ingesteld, gaat voor.

### Nieuw in 1.41
- **Zoekvelden (asr) worden ingevuld**: een zoekveld met suggesties (type=search, role=combobox) telt nu als tekstveld ("Veld: …"), niet als keuzelijst. De invoer-events gaan nu ook de webcomponent uit (composed), zoals bij echt typen. Is het veld na het invullen nog leeg, dan zet ParseLab de waarde er alsnog direct in. Een suggestie wordt alleen gekozen als die echt bij de waarde past.
- In het logboek staat een waarschuwing als een veld leeg bleef, of als het aangewezen element geen invoerveld is.
- **Invullen → Dropdown**: wijs een keuzelijst aan (gewone of popup). Kies daarna **Standaard** (uit de keuzes van die dropdown) of **Uit kolom** (een kolom uit je upload, elke ronde de waarde van die regel). Achteraf aan te passen in de flow.

### Nieuw in 1.40
- **Stappen naar een andere pagina slepen:** loslaten op een stap of op een paginakop van een andere pagina; de stap
  krijgt dan het adres van die pagina.
- **Nieuwe pagina beter herkend:** stappen in een kader horen bij het adres van dat kader; wisselt een web-app van scherm
  zonder ander adres, dan herkent ParseLab dat aan de hoofdkop.
- **Webcomponent-knoppen** zoals `<asr-button>Zoeken</asr-button>`: ParseLab onthoudt de webcomponent en drukt bij afspelen
  de knop in de shadow root in.
- **Alles als ZIP** (Resultaat): alle PDF's en screenshots van de laatste ronde in één zip, met dezelfde mappen (bv. per
  relatienummer). Opties: *eerste screenshot overslaan* en *witte/lege screenshots overslaan*.
- **Witte screenshots opgelost:** werd het venster smaller dan het paneel (bv. vlak na een PDF of bij een klein venster),
  dan had de pagina 0 pixels breedte. Tijdens een screenshot staat de pagina nu even op volle breedte, de pagina houdt altijd
  minimaal 320 pixels, en het paneel past zich aan als het venster kleiner wordt.

### Nieuw in 1.39
- **PDF's en screenshots opslaan → per unieke waarde uit kolom…**: kies een kolom (bv. relatienummer); elke unieke waarde
  krijgt een eigen map. Geldt voor alle PDF- en screenshotstappen.
- Zonder gekozen bestandsnaam heet een PDF naar de waarde die in die ronde uit de lijst is ingevuld (bv. het polisnummer),
  zodat bestanden in dezelfde map elkaar niet overschrijven.
- “Eén ronde per” wordt niet meer automatisch gekozen; je kiest het zelf (ParseLab geeft alleen een tip).

### Nieuw in 1.38.1
- Heeft de eerste kolom van je lijst dubbele waarden (bv. relatienummer), dan kiest ParseLab bij het uploaden zelf
  “Eén ronde per” die kolom. Meldingen tellen dan in rondes.

### Nieuw in 1.38: lijst vooraf, rondes per klant, plusje voor pauze

- **Lijst vooraf uploaden:** bovenaan rechts staat de kaart *Lijst* met **Lijst uploaden** (Excel, CSV of TXT),
  *Zelf maken*, *Kolommen (Excel)* en *Wissen*. Na uploaden zie je de lijst meteen. Er zit geen upload-knop meer in de stappen.
- **Stap koppelen aan een kolom:** bij een invoerveld kies je de kolom uit je lijst in een keuzelijst. Bij "Klik op waarde"
  en bij de PDF-map/bestandsnaam kies je ook een kolom.
- **Eén ronde per unieke waarde:** kies bij *Eén ronde per* bv. "unieke Ronde" of "unieke Klant". Alle regels met dezelfde
  waarde vormen één ronde (Piet met 3 auto's = 1 ronde, Klaas met een inboedel = 1 ronde).
- **Lus: elke regel van de ronde** (Herhalen): loopt binnen de ronde alle regels van die klant af. Stappen in de lus
  gebruiken de waarden van die regel (bv. klik op het polisnummer, PDF in de map van de klant).
- **Altijd een plusje tussen stappen** om er een pauze tussen te zetten.

### Nieuw in 1.37: paneel echt naast de pagina

- **De pagina krijgt alleen de ruimte links van het paneel**, ook onderdelen die de site vastzet op het scherm:
  kopbalken, knoppen rechtsonder, menu's en schermen die later openklappen (ook met een hoge z-index).
  - Web-app die zelf niet scrolt (zoals Cockpit): de hele app past zich aan de smallere ruimte aan.
  - Gewone pagina die scrolt: marge rechts; vaste balken en menu's die onder het paneel zouden vallen, worden
    tot de rand van het paneel ingekort of opgeschoven (ook als ze later verschijnen). Alles wordt teruggezet
    zodra je het paneel inklapt of sluit.
- **Tijdens het aanwijzen** klapt het paneel in tot een smal balkje met de uitleg, zodat er niets onder het paneel zit.

### Nieuw in 1.36: twee kolommen, zwart, zonder vragen

- **Links stappen toevoegen, rechts de flow.** Links de tabs Opnemen / Handmatig / AI en je invoerlijst; rechts Start,
  de flow per pagina, het resultaat en de instellingen. Op een smal scherm staan ze onder elkaar.
- **Zwart met witte tekst** (licht kan nog via Instellingen). Minder uitlegtekst.
- **Kleur per soort stap**, in het menu én in de flow (ook als je een stap uitklapt): invullen blauw, klikken oranje,
  uitlezen groen, pagina paars, opslaan roze, herhalen turquoise.
- **Geen rondleiding, geen "klaar om te starten" en geen goedkeuringsvragen.** Een invoerveld komt direct in de flow
  (kolomnaam = label van het veld; bij "Lijst aflopen" de eerste vrije kolom uit je lijst). Alleen bij Logica en
  Eerder element vraagt ParseLab de instelling. Opnemen stopt zonder vragen: de flow staat er precies zoals je het deed.
- **Lijst per ronde:** bij een invoerveld kies je *de volgende waarde*, *alle waarden* of *een aantal waarden* per ronde
  (eventueel met Enter na elke waarde). Het aantal rondes past zich aan.
- **Knop in een gebied:** ParseLab toont per item de herkenbare waarde (bv. het polisnummer met de soort verzekering).
  Kies een item, of laat het item kiezen op een waarde uit je lijst, elke ronde het volgende item (ParseLab maakt dan
  zelf de lijst met deze waarden), elk item binnen één ronde, of via een regel. Staat het nummer niet in de knop zelf,
  dan klikt ParseLab de knop in hetzelfde item (bv. "Bekijk" in de tegel).

### Nieuw in 1.35: volgende ronde pas na de hele flow

- ParseLab doet per regel de **hele flow** (stap 1 t/m de laatste) en begint pas daarna aan de volgende regel.
  Onder Start kies je bij **Volgende ronde** wanneer: *als de pagina klaar is* (standaard), *na een aantal seconden*,
  *als ik op Volgende klik* (je controleert elke ronde zelf; met "Rest automatisch" gaat de rest vanzelf) of *meteen*.
- **Elke ronde beginnen op de pagina van stap 1** (Instellingen, standaard aan): eindigt de flow op een andere pagina
  (bv. een bevestiging), dan gaat ParseLab eerst terug naar de pagina van stap 1 voordat hij de volgende regel invult.
- Onder de flow staat **Einde van de ronde** met uitleg wat er daarna gebeurt.

### Nieuw in 1.34: hoe vaak uitvoeren

- Onder **Start** staat **Hoe vaak**: *Lijst afwerken* (één ronde per regel) of *Aantal keer* met een getal.
  Met een lijst en een aantal gebruikt ParseLab de regels om de beurt (bv. 5× met 2 regels: 1, 2, 1, 2, 1).
  Oplopende waarden tellen gewoon door. De keuze wordt per site onthouden; de rondeschuif en de Start-knop tonen het aantal.

### Nieuw in 1.33: strakke indeling

- **Handmatig = alleen stappen, per kolom:** zes groepen met lijn-iconen: *Invullen*, *Klikken*, *Uitlezen*,
  *Pagina* (nieuw: **Ga naar adres** met een URL, Terug, Wachten, Alles laden), *Opslaan* (PDF, Screenshot, Alle PDF's)
  en *Herhalen* (Lus, Lus afsluiten). De dubbele knop “Stap toevoegen” is weg.
- **Invoerlijst-kaart** daaronder: *Lijst zelf maken* (open invulvelden), *Upload invoervelden*, *Download invoerkolommen*
  en *Wissen*. Een zelfgemaakte lijst krijgt automatisch de kolom van elk invoerveld dat de lijst afloopt.
- **Flow per pagina:** elke pagina is een eigen blok met nummer en adres, in en uit te klappen. Elke stap is een
  duidelijke rechthoek met nummer, icoon, naam en uitleg. Slepen (aan het greepje) kan binnen dezelfde pagina.
- **Onderaan:** *Resultaat* (Download bestand, CSV, JSON, hoe PDF's en screenshots worden opgeslagen, logboek) en
  *Instellingen* (map, gedrag bij fouten, opnieuw proberen, pauze, herhalen, terug naar adres bij fout, screenshot per stap,
  cookiemeldingen, paneelgrootte, thema, rondleiding, koppelingen controleren, taak exporteren/importeren/wissen).
- **Alleen iconen, geen emoji** — ook in meldingen, vragen en het logboek.

### Nieuw in 1.32: lijst zelf maken, knop via regel, navigeren per pagina

- **Lijst zelf maken** (✋ Handmatig → *Lijst zelf maken*, of in de vraag bij een invoerveld): typ je lijst in een tabel,
  zonder bestand. Een geüploade lijst zie je meteen in dezelfde tabel en kun je daar aanpassen: cellen, kolomnamen
  (wijzigt overal mee), + regel, + kolom, regel weghalen. Klik op een regelnummer om die ronde in de flow te bekijken.
- **Uitgelezen waarden als kolom:** naast je lijst staan grijze 🔎-kolommen voor wat ParseLab uitleest (met het
  stapnummer). Na een ronde staat daar wat er is opgehaald. Bij *Eerder element* zie je bij welke stap een waarde wordt
  uitgelezen of ingevuld.
- **Knop via regel:** wijs een gebied met meerdere knoppen aan en laat een regel kiezen, bv. *als Soort is woning → Opstal,
  als Soort is auto → Auto, anders → Inboedel*. Tot 3 regels plus “anders”, met vooruitblik per ronde. Ook vanuit een
  bestaande knop-stap (🧮) en vanuit de vraag “Welke knop wil je aanklikken?”. Werkt ook in kaders.
- **Navigeren per pagina:** boven de flow staan ◀ terug / vooruit ▶ (binnen de site en binnen kaders) en een knop per
  pagina (p.1, p.2…). Een klik brengt je naar het opgeslagen adres van die pagina en naar die stappen in de flow.

### Nieuw in 1.31: invoer-logica, rondes volgen, testen en lus-in-lus

- **Handmatig in drie kolommen:** *Invullen* · *Klikken* · *Uitlezen*, met de soorten eronder.
  - Invullen: lijst aflopen, standaardwaarde, oplopend (1, 2, 3… of K-1001, K-1002…),
    logica (datum, als…dan…anders, formule met `{{kolom}}`, `{{ronde}}`, `{{vandaag}}`) en eerder element
    (een eerder uitgelezen of ingevulde waarde, ook `vorige …` uit de vorige ronde).
  - Klikken: klik, dubbelklik, hover, klik op waarde, items aflopen.
  - Uitlezen: onderdeel, tabel/lijst, alle velden, hele pagina, hele site.
  - Daaronder: wachten, screenshot, PDF, terug/pagina, lus.
- **Lijst uploaden:** Excel, CSV of **TXT** (één waarde per regel mag ook). Bij elk invoerveld zie je een
  **vooruitblik**: wat er in ronde 1, 2, 3 wordt ingevuld en wat de volgende stap is.
- **Rondeschuif** bovenaan de flow: ◀ 4/50 ▶. Bij elke stap zie je wat ParseLab in die ronde invult of aanklikt.
- **Eén flow voor alles:** opnemen (⏺), handmatig en AI (✨) vullen dezelfde flow. De flow staat altijd onder
  de tabs, stap voor stap; klik een stap om hem uit te klappen. **Aanpassen** klapt alles open,
  **Alles verwijderen** maakt de flow leeg. De AI krijgt de hele flow en je lijst mee.
- **Lus in een lus**, elk lusblok omkaderd met het ↻-cirkelteken (de binnenlus gestreept). De binnenlus loopt
  alleen de items binnen het huidige buitenitem af.
- **Adres per stap:** elke stap bewaart het exacte adres. Lukt een stap niet, dan gaat ParseLab één keer terug naar
  het adres waar dat stuk flow begint en probeert het opnieuw. Per stap: *↪ start vanaf hier*.
- **Testen:** naast Start kies je *Alles automatisch*, *Test: eerste 5 rondes* (daarna: “Rest automatisch?”),
  *Eerste 5 rondes stap voor stap* of *Eén testronde stap voor stap*. Stap voor stap ga je met ▶ / ◀ of de pijltjestoetsen.
- **Opnemen herkent** ook dubbelklik, Ctrl+P (→ PDF-stap) en PrintScreen (→ screenshot-stap).
- **Bestanden opslaan** (onderin): alles in één map, per ronde, per lus-item, per pagina, of alles los genummerd.
- **Hele site uitlezen:** loopt alle pagina’s van het domein af (via links, met jouw inlog, alleen lezen), leest alle
  elementen en meldt wat opvalt (kapotte links, pagina’s zonder titel of h1, dubbele titels, formulieren,
  bestanden). Download als Excel: overzicht, alle elementen, of alle velden per pagina.

### Nieuw in 1.30: zijbalk, opnemen & nadoen, logboek en AI

- **Zijbalk.** ParseLab opent als zijvenster rechts: de website schuift op en blijft volledig
  zichtbaar en klikbaar (het paneel ligt er niet meer overheen). Bij afdrukken/PDF verdwijnt de ruimte.
- **Eén balk met vier tabs:** *Opnemen* · *Handmatig* · *AI* · *Flow*. Start, Pauze en Stop staan
  altijd bovenin.
- **Korte rondleiding** (4 schermen) bij de eerste keer; op elk scherm staat *Overslaan*. Later
  terug te halen met **?**.
- **Opnemen → nadoen.** Klik *Opname starten* en werk gewoon op de site: klikken, typen, Enter en
  keuzelijsten worden stappen. Typen in één veld wordt één stap, wachtwoorden worden nooit bewaard.
  De opname loopt door na een paginawissel en in kaders (iframes). Na *Stop* kun je per getypte
  waarde kiezen: vaste waarde of een kolom uit je lijst.
- **Elementen terugvinden.** Elke stap bewaart meerdere kenmerken (id, test-id, rol + naam, tekst,
  label, placeholder, positie). Is de pagina veranderd, dan zoekt ParseLab het meest gelijkende
  element (*zelfherstel*) en meldt dat in het logboek.
- **AI volgt het element** (optioneel, tab AI): met je eigen Claude-sleutel kiest de AI bij twijfel
  het juiste element, en kun je in gewone taal stappen laten maken (“zoek polisnummer en sla PDF
  op”). Zonder sleutel werkt alles gewoon handmatig.
- **Logboek per run** (tab Flow): per stap status, duur, wat er is uitgelezen, eventueel herstel,
  en een **screenshot** (wachtwoordvelden vervaagd). Klik een plaatje voor groot; *Rapport* slaat
  een HTML-verslag op. De laatste 10 runs worden bewaard.

### Nieuw in 1.29

- **Waarde in een tekst**: *Precies gelijk* vindt nu ook de waarde als heel woord in een korte tekst,
  zoals “Polisnr. 7552439005” (maar niet 75524390051). Een treffer in een echte knop/tegel wint van
  losse tekst elders op de pagina.
- **a.s.r.-tegels (webcomponenten)**: de tekst in de tegel wordt gevonden en ParseLab klikt de knop
  van die tegel. Ook het aanwijzen van een gebied werkt nu door webcomponenten heen (bv. de hele
  lijst met polissen).

### Nieuw in 1.28

- **Klikken op een waarde**: ParseLab zoekt niet meer naar een knop, maar naar de **tekst met de
  waarde** (uit een invoerveld, je lijst, een uitgelezen waarde of een vaste tekst) — op de hele
  pagina of in een aangewezen gebied, ook in kaders. Hij klikt op die tekst of op de klikbare plek
  eromheen: de link/knop/aanklikbare regel waar de tekst in staat, of anders de knop/link in
  dezelfde regel. *Precies gelijk* negeert zinnen waar de waarde alleen in voorkomt.

### Nieuw in 1.27

- **Lijst aflopen alleen bij een echte lijst**: op een losse knop (bv. *Zoeken*) weigert ParseLab
  een lus en maakt hij er een gewone klik-stap van. Voorheen zocht de lus dan over de hele pagina
  en kon hij op een willekeurige knop klikken (bv. *Geef uw mening*).
- **Volgorde-hulp**: voeg je een invoerveld toe ná een klik op dezelfde pagina, dan vraagt ParseLab
  of het veld ervóór moet (eerst invullen, dan op *Zoeken*).
- **Eén plek voor een kolomnaam**: je kiest de naam alleen bij het invoerveld (uniek; hetzelfde
  als in je Excel als die kolom daar al staat). Bij een knop of PDF-map kies je uit de bestaande
  namen. Hernoem je hem bij de stap, dan verandert hij overal mee: in de knop-koppeling, de
  PDF-map en de kolomkop van *Maak mijn invullijst (Excel)*.
- **Slepen**: in de flow kun je stappen verslepen om de volgorde te veranderen.

### Nieuw in 1.26

- **Breed paneel in twee kolommen**: links Start/Pauze/Stop, de acties om toe te voegen, de vragen
  en de meldingen; rechts de flow van alle stappen, per pagina gegroepeerd, met het resultaat
  eronder. In een smal venster staan de kolommen onder elkaar. Tijdens het aanwijzen klapt het
  paneel in, zodat je de pagina eronder kunt aanklikken.
- **Kolomnaam verplicht bij invoer**: elk invoerveld krijgt een kolomnaam. Daaronder onthoudt
  ParseLab wat er is ingevuld (ook bij een vaste waarde), zodat een latere knop-stap kan zoeken op
  “de knop met dezelfde tekst als Klantnummer”.

### Nieuw in 1.25

- **Eén knop aanklikken = meteen klaar**: de stap klikt altijd de knop op díe plek, ongeacht de
  tekst erop (bv. een knop die per klant anders heet). In het logboek zie je welke tekst er nu op
  stond. Bij de stap kun je hem later nog *🔗 koppelen aan een waarde* of *↻ alle items aflopen*.
- **In een gebied geklikt met meerdere knoppen** (niet op een knop zelf): ParseLab vraagt *Welke knop
  wil je aanklikken?* — kies er één (met de naam uit de regel erbij), of laat hem in het hele gebied
  de knop zoeken die past bij een waarde, of elk item één voor één aflopen.
- **Eenvoudiger paneel**: *Instellingen* en *Gevorderd* onderin zijn weg. ParseLab gebruikt de
  standaarden (map `Downloads/ParseLab`, groot paneel, cookiemeldingen sluiten, bij een fout de
  regel overslaan en doorgaan).

### Nieuw in 1.24

- **Invoer kiezen met één keuzelijst**: *zelf een vaste waarde invullen*, een *kolom uit je lijst*
  (met optioneel een standaardwaarde als de cel leeg is), een uitgelezen waarde, of *＋ nieuwe kolom*
  waarvan je zelf de naam van de kolomkop geeft.
- **Zoeken in een gebied**: bij *De knop die past bij een waarde* kies je *In een gebied dat ik
  aanwijs* (bv. de subpolissen onderaan). ParseLab zoekt daar de regel met de waarde en klikt de
  knop/link in die regel — ook in een kader.
- **Lijst aflopen**: *Elk item hier één voor één* (bij een knop) of *Elke knop/link in een lijst
  aanklikken* (bij *Voor elk item*). ParseLab klikt elk item aan, voert de stappen per item uit en
  zet de naam uit de regel (bv. “Inboedelverzekering”) in de kolom **Item** — handig als mapnaam
  voor de PDF. Werkt ook in kaders.

### Nieuw in 1.23

- **Werkt ook in kaders (iframes)**, zoals de polisgegevens in Cockpit: aanwijzen, uitlezen,
  klikken en invullen. Stappen in een kader krijgen ▣ en “in kader”.
- **Alle velden in één keer**: wijs bij *Uitlezen* één waarde aan in een label/waarde-overzicht
  (Product, Polisversienummer, Jaarbedrag…) en kies *Alle velden*: alle velden worden één regel in Excel.
- **Knop die past bij een waarde**: na het aanwijzen van een knop vraagt ParseLab of het altijd
  die knop is, of de knop (op die plek) waarvan de tekst gelijk is aan / bevat: een kolom uit je
  lijst, een uitgelezen waarde, een invoerveld op de pagina of een vaste tekst. *Test nu* laat zien
  welke knop het zou worden.
- **Invoer**: bij elk veld kies je *per regel uit je lijst* (met optioneel een standaardwaarde als
  de cel leeg is) of *altijd een vaste waarde*.
- **Nieuwe indeling**: bovenin de fase, de samenvatting en de Start-knop; daaronder de tabs
  *Handmatig* en *Met AI* (komt later); onderin het overzicht van alle stappen, met per stap het
  paginanummer (p.1, p.2 …) en een legenda welke pagina welk nummer heeft.

### Je lijst maken (formulier invullen)

De snelste weg: klik op **Velden ophalen**. ParseLab kijkt welke invulvelden er nu op de pagina
staan — ook die in webcomponenten — en zet ze op een rij: kolomnaam, soort veld en label. Met het
knopje ernaast laat hij zien waar een veld staat. Vink af wat mee moet en kies dan **Maak
invulstap** (één stap die alle aangevinkte velden invult, één keer per regel van je lijst) of
**Invullijst (Excel)** (een Excel met een kolom per veld). Verborgen velden en hulpvelden van een
kalender blijven eruit.

Wil je liever zelf aanwijzen, klik dan op **Maak mijn invullijst (Excel)**. ParseLab maakt een Excel-bestand met precies één kolom
per veld dat je hebt aangewezen. Vul dat in Excel in en klik op **Lijst uploaden**. Excel (.xlsx)
en CSV werken allebei.

- Bij elke *Invullen*-stap kies je uit de kolomkoppen van je lijst: *Welke kolom hoort hier?*
- Lege cel? Het veld blijft zoals het is.
- Datums mag je schrijven zoals je gewend bent: 30-11-2002, 30/11/2002 of 2002-11-30. Bij het
  inlezen zegt ParseLab: "Ik herken 'Geboortedatum' als datum ✓".
- Bij een formulier zie je per veld een voorbeeldwaarde uit de eerste regel van je lijst, zodat je
  vóór het starten ziet dat het klopt.

### Uitlezen (de website-bron)

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

**AI (optioneel).** Alleen als je zelf een Claude-sleutel invult in de tab AI, stuurt ParseLab bij
een AI-vraag of zelfherstel een korte beschrijving van de pagina-elementen (tekst, rol, label —
geen ingevulde waarden of wachtwoorden) en jouw chatbericht naar Anthropic (`api.anthropic.com`).
De sleutel staat alleen lokaal in `chrome.storage.local`. Zonder sleutel gaat er niets naar buiten.
Screenshots van het logboek blijven lokaal (IndexedDB) en worden nooit verstuurd.

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
- Vast: `activeTab`, `scripting`, `storage`, `downloads`, `debugger`, `webNavigation` en
  `host_permissions: <all_urls>`. Er is géén content-script op alle pagina's: het paneel wordt pas
  geladen na een klik op het icoon (of Alt+Shift+S). De brede sitetoegang is nodig om ook in
  **kaders (iframes) van een ander domein** te werken (zoals de polisgegevens in Cockpit) en om
  zonder extra toestemmingsvensters door te werken na een paginawissel. `webNavigation` gebruikt
  ParseLab om de kaders in het huidige tabblad op te zoeken en om tijdens een opname de helper
  opnieuw in een kader te laden na een paginawissel.
- Kaders: het paneel draait in de hoofdpagina; in een kader laadt ParseLab `panel.js` als
  *helper* (zonder paneel). Paneel en helper praten uitsluitend via de extensie
  (`chrome.runtime`/`chrome.tabs.sendMessage` met `frameId`), nooit via `postMessage`, zodat een
  webpagina de helper geen opdrachten kan geven.
- Openen/sluiten gaat per tabblad. Het achtergrondscript vraagt het tabblad eerst zelf of het paneel
  daar draait (`wt-ping`) en klapt dan de goede kant op; de bewaarde vlag `wt-active` bepaalt alleen
  of het paneel na een paginawissel terugkomt, nooit of een klik iets doet. Kan het op die pagina
  niet, dan komt er een rood uitroepteken met uitleg op het icoon in plaats van stilte.
- Per site: bij *Bewaar taak* of *Start* registreert ParseLab het paneel als content-script voor
  precies die origin (bv. `https://portaal.example.nl/*`), zodat een lopende ronde en het paneel
  terugkomen na een paginawissel. Bij ✕ sluiten of *Taak van deze site wissen* wordt die
  registratie weer verwijderd.
- Vast: `debugger` — alleen gebruikt voor PDF opslaan (Chrome's `Page.printToPDF`, dezelfde engine als
  Ctrl+P). Chrome staat dit recht niet toe als optionele toestemming, dus het staat vast in het manifest;
  er komt geen extra vraag. Tijdens het opslaan toont Chrome kort een balk bovenin. De afbeelding-bewijskopie heeft dit recht niet nodig.
- Dashboard-detectie: een klein script `bridge.js` draait uitsluitend op `http://localhost/*`,
  `http://127.0.0.1/*` en `https://*.parselab.nl/*`. Het zet `data-parselab-extension="<versie>"` op
  het `<html>`-element en stuurt `postMessage({ source:"parselab-extension", type:"parselab:extension", version })`;
  het antwoordt op `{ source:"parselab-dashboard", type:"parselab:ping" }`.

**Opslag.** Alles in `chrome.storage.local`: taken per site (`wt-flow-<host>`, `wt-presets-<host>`;
alleen stappen), de geüploade lijst apart per site (`pl-csv-<host>`), instellingen (`pl-folder`,
`pl-cookies`, `wt-dark`, `wt-side`, `wt-lang`), toestemming per site (`pl-consent`), en het logboek
`pl-log` (max. 200 regels: host, start, einde, regels, fouten, bron). Runlogboek: `pl-runs`;
screenshots in IndexedDB `parselab`/`shots` (laatste 10 runs); AI: `pl-ai-key`, `pl-ai-model`.

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
