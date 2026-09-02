# ParsePDF — per element

Basis: `tools/parsepdf.html` (de "PDF Scraper"). Alles draait in de browser: PDF-parsing, regels, export, en optioneel structuurherkenning via de Claude API.

## Onboarding

### Branchekeuze ("In welke branche werk je?")
- **Nu:** negen keuzes (Verzekeringen, Accountancy, Juridisch, Zorg, HR, Financieel advies, Overheid, Anders) om passende voorbeelden voor te stellen; Overslaan mogelijk.
- **Simpeler:** goed idee, maar het staat vóór de eerste ervaring. Zet het na de eerste upload: "Dit lijkt een factuur. Klopt dat?" leert meer dan een branche.
- **Prioriteit:** 2

### "Wat wil je als eerste doen?" (Direct documenten scrapen · Zelf kolommen instellen · Eerst rondkijken)
- **Nu:** drie routes.
- **Simpeler:** twee routes: *Documenten uitlezen* (standaard) en *Eerst rondkijken*. "Zelf kolommen instellen" is een stap in de eerste route, geen aparte ingang.
- **Prioriteit:** 2

### Instel-wizard en rondleiding
- **Nu:** "Onboarding — PDF Scraper instellen", "Start rondleiding".
- **Simpeler:** één rondleiding van drie stappen, in de tool zelf (upload, aanwijzen, exporteren), en niet als apart scherm. Naam "PDF Scraper" wordt overal "ParsePDF".
- **Prioriteit:** 2

## Navigatie in de tool (Home · Documenten · Kolommen & templates · Resultaten & export · Automatiseren)

### Vijf pagina's in de zijbalk van de tool
- **Nu:** vijf secties; "Kolommen & templates" is het hart, "Automatiseren" is een aparte pagina.
- **Simpeler:** volg de volgorde waarin een gebruiker werkt en noem ze zo: **1 Uploaden → 2 Aanwijzen → 3 Controleren → 4 Downloaden**. "Home" vervalt (dat is het dashboard). "Automatiseren" wordt een knop op de laatste stap: "Dit voortaan automatisch doen".
- **Prioriteit:** 1

## Documenten

### Uploaden (meerdere PDF's, tot 500 per batch)
- **Nu:** upload-knop; documenten in IndexedDB.
- **Simpeler:** sleepvlak met "Sleep je PDF's hierheen" plus "of kies een map". Laat meteen een miniatuur en de herkende soort zien.
- **Veiliger:** de documenten blijven in de browser (IndexedDB) en dat is goed. Zeg het: "Deze bestanden blijven op jouw computer." Voeg "Alles verwijderen" toe die de IndexedDB leegt, zichtbaar en zonder omweg; nu is onduidelijk of geüploade dossiers achterblijven.
- **Prioriteit:** 1

### Documentvoorbeeld, pagina tonen, labels toekennen
- **Nu:** modal "Documentvoorbeeld", labels per document, opgeslagen onder `pdfScraperDocLabels`.
- **Simpeler:** labels zijn handig om soorten documenten uit elkaar te houden, maar vraag het niet aan de gebruiker: herken factuur/bon/rapport automatisch en laat corrigeren.
- **Prioriteit:** 3

## Kolommen & templates

### Kolom toevoegen: kolomnaam, "Waarde die je in de PDF ziet", pagina-keuze (alle, eerste, laatste, een-na-laatste, even, oneven, pagina…)
- **Nu:** de gebruiker geeft een voorbeeldwaarde en de tool leidt de regel af; paginabereik apart instelbaar.
- **Simpeler:** "Waarde die je in de PDF ziet" is de beste vraag in de hele suite, houd die. De paginakeuze met "een-na-laatste" en "oneven pagina's" is voor 95% overbodig; verberg onder "Alleen op bepaalde pagina's".
- **Prioriteit:** 2

### Regex (patroon), "eerste groep = waarde"
- **Nu:** zichtbaar als invoerveld naast label.
- **Simpeler:** regex nooit tonen aan een leek. De tool maakt het patroon zelf uit het voorbeeld; wie het wil zien klikt "Toon het patroon (gevorderd)".
- **Prioriteit:** 1

### Extractiemodus: Eerste / Laatste / N-de / Alle (gescheiden door ;), Aantal woorden, Aantal tekens, Bepaald teken, Einde regel
- **Nu:** keuzelijsten met technische opties.
- **Simpeler:** vervang door een voorbeeld-preview: toon direct in drie documenten wat er gevonden wordt, en biedt twee knoppen: "Dit is goed" en "Niet dit, maar …" waarna de gebruiker de juiste waarde in het document aanklikt. De opties bestaan dan nog wel, maar de tool kiest ze.
- **Prioriteit:** 1

### Gebied selecteren (teken een vak op de pagina)
- **Nu:** handmatige selectie van een gebied, "Gebied opslaan".
- **Simpeler:** dit is voor leken de meest intuïtieve manier ("hier staat het bedrag"). Maak het de standaardmanier om een kolom toe te voegen, met de voorbeeldwaarde als alternatief.
- **Prioriteit:** 1

### Templates (opslaan, laden, `pdfScraperTemplates`)
- **Nu:** lokaal opgeslagen; naam via placeholder "bijv. Facturen".
- **Simpeler:** sjablonen horen bij het account en in het dashboard onder "Sjablonen". Bied een paar kant-en-klare sjablonen (Nederlandse factuur, bon, loonstrook) zodat de eerste export in twee minuten lukt.
- **Veiliger:** een sjabloon bevat patronen, geen documentdata; dat mag gesynchroniseerd worden. Documenten zelf niet, tenzij de gebruiker het aanvinkt (zoals de pagina-spec al zegt).
- **Prioriteit:** 2

### "Structuur herkennen met AI" met Claude API-sleutel (`sk-ant-…`)
- **Nu:** de gebruiker plakt een eigen API-sleutel; die staat in `localStorage` onder `pdfScraperClaudeKey`; de browser roept `api.anthropic.com` rechtstreeks aan.
- **Simpeler:** een leek heeft geen API-sleutel en gaat die ook niet aanmaken. Maak AI-herkenning een gewone knop "Laat ParseLab de velden herkennen" die via het ParseLab-account werkt en van het verbruik afgaat.
- **Veiliger:** een sleutel in `localStorage` is leesbaar voor elk script op dezelfde origin (dus ook voor het dashboard en, bij een XSS, voor een aanvaller), gaat niet mee met een browserreset en wordt door de gebruiker vaak per e-mail rondgestuurd. Bovendien gaat de documenttekst dan van de browser van de gebruiker naar de API, wat botst met "niets verlaat je computer". Laat de aanroep via de ParseLab-backend lopen, met een duidelijke opt-in per document ("Stuur dit document naar ParseLab voor herkenning?"), en verwijder de sleutelopslag uit de tool.
- **Prioriteit:** 1

## Resultaten & export

### Resultatentabel, per rij brondocument en pagina
- **Nu:** tabel met kolommen; "Toon pagina" per rij.
- **Simpeler:** goed. Markeer lege of twijfelachtige cellen en zet bovenaan "3 regels om na te kijken →" die de tabel filtert.
- **Prioriteit:** 2

### Export: CSV-scheidingsteken (komma, puntkomma, tab), Kopiëren, Excel
- **Nu:** de gebruiker kiest het scheidingsteken.
- **Simpeler:** standaard "Download voor Excel" (xlsx). Het scheidingsteken is een implementatiedetail; wie een CSV wil, krijgt een Nederlandse (`;`) zonder keuze. "Kopiëren" blijft, met de tekst "Plak in Excel of Sheets".
- **Prioriteit:** 1

### Doorgeven aan ParseForm
- **Nu:** genoemd in de pagina-spec als feature, niet in de tool.
- **Simpeler:** één knop na de export: "Vul hiermee een formulier in" die de tabel als invullijst naar ParseForm stuurt. Dit is de reden dat de suite één product is.
- **Prioriteit:** 2

## Automatiseren

### Pagina "Automatiseren"
- **Nu:** aparte sectie.
- **Simpeler:** wordt een keuze op de laatste stap: "Elke keer dat ik hier PDF's neerzet, gebruik sjabloon X en zet het resultaat in ParseBoard". Zonder backend kan de tool alleen automatiseren zolang het tabblad open staat; benoem dat eerlijk of laat de sectie weg tot er een backend is.
- **Prioriteit:** 2

## Overig

### Taal / Language (NL, EN, DE)
- **Nu:** keuze op de homepagina van de tool.
- **Simpeler:** volgt de taal van het dashboard; de keuze verdwijnt uit de tool.
- **Prioriteit:** 3

### Ingebedde kop en navigatie
- **Nu:** in de werkbank van het dashboard is de eigen kop verborgen (embed-patch), maar de eigen zijbalk niet.
- **Simpeler:** zie `dashboard.md`, werkbank: op termijn de vier stappen als sub-items in de dashboardzijbalk.
- **Prioriteit:** 2
