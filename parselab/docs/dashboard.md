# ParseLab Dashboard — per element

Basis: `parselab/index.html`. Het dashboard is een prototype-shell met echte tools erin. De spec kiest bewust voor "alleen navigatie werkt"; de punten hieronder gaan over wat er nodig is zodra echte gebruikers erin werken.

## Zijbalk

### Logo en wordmark
- **Nu:** klikbaar naar het overzicht. Geen tekst dat het klikbaar is.
- **Simpeler:** goed zo. Voeg `title="Naar overzicht"` toe voor de muis-tooltip.
- **Prioriteit:** 3

### Groep "Werkruimte" → Overzicht
- **Nu:** één item.
- **Simpeler:** hier hoort later ook "Exports" (alle bestanden van alle tools op één plek) en "Hulp". Een gebruiker zonder IT-achtergrond zoekt zijn bestand niet per tool, maar op datum.
- **Prioriteit:** 2

### Groep "Software" → vier tools met teller
- **Nu:** tegel + naam + mono-teller (`3 flows`, `1 run`, `2 sjabl.`, `—`).
- **Simpeler:** de afkorting `sjabl.` en het streepje `—` zijn onduidelijk. Toon de teller alleen als die iets betekent voor de gebruiker ("1 bezig", "3 fouten") en laat hem anders weg. Een lege tool krijgt geen teller.
- **Prioriteit:** 2

### Verbruikskaart
- **Nu:** `3.240` van `5.000 pagina's · reset 1 okt`.
- **Simpeler:** "pagina's" betekent per tool iets anders (PDF-pagina's, formulierrijen, gescrapete rijen). Zeg wat het is: "3.240 van 5.000 handelingen deze maand" en één zin bij 80%: "Bijna vol. Vanaf 1 oktober begin je opnieuw." De upgrade-knop pas tonen bij 80%, conform het principe "verbruik is de upgrade-trigger, geen banner".
- **Prioriteit:** 2

### Gebruiker (avatar, naam, rol)
- **Nu:** statisch; geen menu.
- **Simpeler:** klikbaar met drie opties: Account, Team, Uitloggen. Niet meer.
- **Veiliger:** hier hoort ook "Sessies en apparaten" en "Verbonden extensie" (zie ParseScraper), zodat de gebruiker ziet welke browser aan zijn account hangt en die kan loskoppelen.
- **Prioriteit:** 2

## Topbar

### Begroeting en titel
- **Nu:** "Goedemorgen, Sanne" op het overzicht, toolnaam op detail.
- **Simpeler:** goed zo. Op een tooldetail helpt een subregel in gewone taal onder de toolnaam ("Formulieren invullen vanuit een lijst") meer dan de caps-eyebrow "Chrome-extensie".
- **Prioriteit:** 3

### Zoekveld
- **Nu:** filtert de tabel op de huidige weergave; placeholder "Zoek een flow of export…".
- **Simpeler:** "flow" is jargon. Gebruik "Zoek een taak of bestand…". Zoeken over álle tools tegelijk (één resultatenlijst) is voor een leek logischer dan per weergave.
- **Prioriteit:** 2

### Primaire actie ("Nieuwe flow", "ParsePDF openen", "Terug naar …")
- **Nu:** wisselt per weergave; op het overzicht opent "Nieuwe flow" de ParseForm-installatie.
- **Simpeler:** op het overzicht is "Nieuwe flow" een raadsel voor een nieuwe gebruiker. Maak er "Wat wil je doen?" van met vier keuzes in mensentaal: *Documenten uitlezen*, *Een website uitlezen*, *Een formulier laten invullen*, *Een overzicht maken*. Elke keuze opent de juiste tool. Dat is dezelfde vraag die ParsePDF nu al stelt bij onboarding ("Wat wil je als eerste doen?"), maar dan één keer, op suite-niveau.
- **Prioriteit:** 1

## Overzicht

### Vier softwarekaarten
- **Nu:** tegel + soort + statuspil, naam, één regel uitleg, hoofdcijfer, "Openen →".
- **Simpeler:** de soortlabels ("Chrome-extensie", "Klik-en-scrape", "PDF-parse", "Dashboards") zeggen de leek weinig. Vervang ze door de taak: *Formulieren invullen*, *Websites uitlezen*, *Documenten uitlezen*, *Overzichten maken*. Houd de productnaam eronder.
- **Veiliger:** een statuspil "3 fouten" hoort hier in de kaart, niet alleen rechts in "Vraagt aandacht", zodat de gebruiker het ziet vóór het klikken (spec-punt 3).
- **Prioriteit:** 1

### Recente runs
- **Nu:** kolommen flow / software / rijen / status; klikken doet niets.
- **Simpeler:** een rij moet openen wat er gebeurd is: de export downloaden of de fouten zien. "rijen" → "regels"; kolomkop "flow" → "taak". Status "bezig" met een voortgang ("14 van 24") is duidelijker dan alleen een pil.
- **Prioriteit:** 2

### Bespaarde tijd (navy kaart met staven)
- **Nu:** 148 uur en zes maanden; de berekening is niet uitgelegd.
- **Simpeler:** één regel eronder: "Gerekend met 4 minuten per handmatige regel." Anders vertrouwt niemand het cijfer, en dit is precies het cijfer waarmee een gebruiker de tool intern verdedigt.
- **Prioriteit:** 2

### Vraagt aandacht
- **Nu:** drie meldingen in mensentaal. Goed.
- **Simpeler:** elke melding krijgt één knop: "Bekijk rij", "Upgrade", "Test sjabloon". Een melding zonder actie is ruis.
- **Prioriteit:** 2

## Tooldetail (identiek voor alle tools)

### Navy toolheader met statuspil en primaire actie
- **Nu:** naam, uitleg, statuspil, knop naar de werkbank.
- **Simpeler:** prima. Voeg voor de extensie-tools een tweede regel toe met de werkelijke staat: "Extensie verbonden in Chrome op deze computer" of "Nog niet geïnstalleerd". Nu ziet de gebruiker pas in de werkbank dat er nog iets te installeren is.
- **Prioriteit:** 1

### Drie KPI-kaarten met delta-pil
- **Nu:** feitelijke delta's (`+8,2%`, `−2 sec`, `live`); ParseBoard toont `—` als delta.
- **Simpeler:** een delta-pil zonder cijfer weglaten in plaats van `—` tonen. "Foutloos 97,4%" is voor een leek beter als "48 regels om na te kijken" met een knop.
- **Prioriteit:** 3

### Lijst (Flows / Scrapes / Sjablonen / Dashboards)
- **Nu:** voorbeelddata; de ParsePDF-sjablonen en het ParseBoard-dashboard komen wel uit de opslag van de ingebedde tool.
- **Simpeler:** elke rij is een knop die de werkbank op dát item opent. Kolomkoppen in gewone taal: "sjabloon / soort document / velden / status".
- **Veiliger:** de tellers lezen nu `localStorage` van de tools op dezelfde origin. Dat werkt alleen zolang alles op één domein staat en de gebruiker één browser gebruikt. Met accounts hoort dit uit een backend te komen, met de gebruiker als eigenaar.
- **Prioriteit:** 2

### "Zo werkt het hier" (drie stappen)
- **Nu:** drie stappen per tool. Goed.
- **Simpeler:** koppel stap 1 aan de primaire actie ("Begin met stap 1 →"). De stappen verdwijnen zodra de gebruiker zijn eerste item heeft, dan komt er een "Tips"-kaart voor in de plaats.
- **Prioriteit:** 3

### Laatste export met "Download opnieuw"
- **Nu:** visueel.
- **Simpeler:** goed idee. Voeg de bestemming toe ("in je map Downloads/ParseLab") en maak van "Download opnieuw" ook "Open in Excel" wanneer het een xlsx is.
- **Veiliger:** exports met persoonsgegevens (ParseForm, ParsePDF) horen niet oneindig bewaard te worden. Toon "wordt na 30 dagen verwijderd" en maak dat instelbaar per werkruimte.
- **Prioriteit:** 2

## Werkbank

### Iframe-werkbank (ParsePDF, ParseBoard)
- **Nu:** de echte tool in een witte kaart, met "In nieuw tabblad openen" en "Sluiten".
- **Simpeler:** gedaan. De eigen navigatie van de tool (ParsePDF: Home/Documenten/Kolommen/Resultaten/Automatiseren; ParseBoard: zes stappen) is in de werkbank verborgen en klapt uit als sub-items onder de tool in de dashboardzijbalk. De tool meldt zijn eigen sectie terug (bijv. na "Volgende"), zodat de zijbalk meeloopt; de hash wordt `#pdf/docs` of `#board/3`. Bij ParseBoard zijn stappen die nog niet bereikt zijn gedimd, precies zoals de stappenbalk van de tool dat deed. De extensie-tools klappen uit naar "Extensie installeren". Volgende stap: ParsePDF's "Rondleiding" en taalkeuze (stonden in de verborgen zijbalk) een plek geven in Instellingen.
- **Veiliger:** een iframe op dezelfde origin deelt opslag en cookies met het dashboard. Zet de tools op een eigen subdomein (`app.parselab.nl/pdf`, of `pdf.parselab.nl`) met een `sandbox`-attribuut dat alleen `allow-same-origin allow-scripts allow-forms allow-downloads` geeft, en laat het dashboard via `postMessage` om tellers vragen in plaats van `localStorage` te lezen.
- **Prioriteit:** 2

### Installatiepaneel (ParseForm, ParseScraper)
- **Nu:** drie stappen, downloadknop voor de zip, handleiding (README), sneltoets, pakketinfo (versie, rechten), MCP-notitie.
- **Simpeler:** vervang het hele paneel door één knop "Toevoegen aan Chrome" naar de Web Store, en daaronder "Zo zie je dat het werkt: het ParseLab-icoon staat rechtsboven in je browser". De pakketinfo (manifest v3, `activeTab · storage · downloads`) en de MCP-notitie zijn voor beheerders, niet voor gebruikers; zet die achter "Voor IT-beheer". De README als handleiding is voor een leek onleesbaar (het is een ontwikkelaarsdocument); schrijf een gebruikershandleiding van één pagina met schermafbeeldingen.
- **Veiliger:** een losse zip die de gebruiker zelf laadt in ontwikkelaarsmodus is niet te updaten en niet te controleren. De Web Store lost beide op. Zie `parsescraper.md`.
- **Prioriteit:** 1

## Algemeen

### Taal en woordkeuze
- **Nu:** mix van Nederlands en Engelse vaktermen: flow, run, scrape, export, regexset, UTF-8, `;`.
- **Simpeler:** één woordenlijst voor de hele suite en die overal gebruiken. Voorstel: flow → *taak*, run → *ronde* of *uitvoering*, scrape → *uitlezen*, export → *bestand*, template/sjabloon → *sjabloon*, rij → *regel*. Technische details als `UTF-8 · ;` verdwijnen uit de UI; de export "werkt in Excel" en dat is wat de gebruiker wil weten.
- **Prioriteit:** 1

### Inloggen en accounts
- **Nu:** vaste gebruiker "Sanne de Vries"; er is geen login.
- **Veiliger:** een dashboard "na login" heeft een login nodig. Voor deze doelgroep: magic link per e-mail (geen wachtwoord), optioneel Microsoft- of Google-login omdat administratiekantoren daar al in werken. Tweestapsverificatie pas verplicht op Business.
- **Prioriteit:** 1

### Offline en lokaal
- **Nu:** alles draait in de browser; iframes en `localStorage` vragen één origin (geen `file://`).
- **Simpeler:** "0 bytes verlaten je computer" is een sterke belofte en klopt nu voor de tools. Zodra ParseLab een backend krijgt (accounts, scrapen vanuit de tool), maak dan per taak zichtbaar wat lokaal blijft en wat naar ParseLab gaat, met een slotje-icoon en één zin. Vertrouwen is voor deze doelgroep het hele product.
- **Prioriteit:** 1
