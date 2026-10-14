# Werklijst overzicht – basisprincipes

Referentiedocument bij `dewaerdse-werklijst.html`. Bedoeld als startpunt voor een nieuw project waarin de agenda's niet geplakt, maar automatisch opgehaald worden (uit het CRM, een export-map, een API of een database). De huisstijl, het dataformaat, de parser, het datamodel, de filters en de KPI's zijn hieronder zo beschreven dat ze één op één overgenomen kunnen worden.

---

## 1. Huisstijl De Waerdse Assuradeuren

Bron: Visual Identity De Waerdse (merk & branding).

### Kleuren

| Rol | Naam | HEX | Gebruik |
|---|---|---|---|
| Primair | Groen | `#00441D` | Koppen (mega kop), tabelkoppen, CTA-knop, voetbalk, lijn onder de kop |
| Primair | Wit | `#F8F8F8` | Paginaachtergrond |
| Complementair | Groen 80% | `#316648` | Hover op tabelkop, tweede balk in grafieken |
| Complementair | Groen 60% | `#628C74` | Rustige accenten, derde balk, hover op kaders |
| Complementair | Goud 80% | `#FDCA31` | Grafieken |
| Complementair | Goud 60% | `#FBD663` | Grafieken, links op groene ondergrond |
| Accent | Accent groen | `#00913E` | Hover op CTA-knop, focus op invoervelden |
| Accent | Goud | `#FFC000` | Prioriteit middel, focusring op knoppen, "vandaag"-tegel |
| Call-to-action | Grijs | `#E6E6E6` | Hover op standaardknop |
| Semantisch (eigen toevoeging) | Rood | `#B3261E` | Verlopen, prioriteit hoog. Geen huisstijlkleur; alleen als signaalkleur |

Grafieken: eerst groen in tinten (100/80/60/40/20%), daarna goud in tinten als er meer contrast nodig is. Eventueel een zwarte omlijning om kleuren te scheiden.

### Typografie

- Alles in **Arial** (fallback Helvetica, sans-serif).
- Mega kop: Arial Medium (font-weight 500), groen, links uitgelijnd, maximaal 27 tekens. In de pagina: `h1` 30–44px.
- Kop: Arial Medium 18–80pt, zwart.
- Paragraafkop: Arial vet 12–16px, zwart. In de pagina: `h2` 16px vet, `h3` 13px vet.
- Paragraaf: Arial 11px (in de browser 13–14px voor leesbaarheid), zwart.
- Bronregels van de werklijst: Courier New (monospace) zodat de vaste kolombreedtes zichtbaar blijven.

### Elementen

- **Knoppen** hebben afgeronde hoeken (`border-radius: 10px`), geen schaduw, tekst gecentreerd, marge boven en onder even hoog als de teksthoogte.
  - Standaardknop: wit met zwarte tekst, hover naar grijs `#E6E6E6`.
  - CTA-knop: donkergroen `#00441D` met witte tekst, hover naar accentgroen `#00913E`.
- **Kaders** (tegels, tabellen, filterpaneel, tekstvak) hebben **rechte hoeken**.
- **Logo** één keer per pagina, linksboven, primaire gekleurde versie op lichte achtergrond. Houd vrije ruimte rondom. Nooit vervormen, verkleuren of op drukke achtergrond plaatsen.
- **Pictogrammen** wit in een cirkel in een primaire kleur.
- Groene balk onderaan de pagina als afsluiting.

### Schrijfstijl

- U-vorm.
- Geen afkortingen in bestanden en formulieren.
- Opsommingen met streepjes; elk onderdeel begint met een hoofdletter en eindigt op een puntkomma, het laatste op een punt.

### CSS-tokens (kopieerbaar)

```css
:root {
  --groen: #00441D; --groen-80: #316648; --groen-60: #628C74;
  --accent: #00913E; --goud: #FFC000; --goud-80: #FDCA31; --goud-60: #FBD663;
  --wit: #F8F8F8; --grijs: #E6E6E6; --zwart: #111111; --rood: #B3261E;
  --bg: var(--wit); --surface: #FFFFFF; --surface-2: #F1F3F1;
  --text: var(--zwart); --text-muted: #4E5A52;
  --line: #D5DBD7; --line-strong: #B9C3BC;
}
```

De pagina heeft ook een donker thema via `prefers-color-scheme` en `data-theme`; alle kleuren lopen via deze tokens, dus componenten kennen geen harde kleurwaarden.

---

## 2. Dataformaat: het werklijst-overzicht

De bron is de tekstexport "Werklijst overzicht" uit het CRM. Elk blad begint met een kopregel, agenda's worden gescheiden door een streepjeslijn. Linkerkolom: label (13 tekens breed). Daarna een of meer waardekolommen gescheiden door twee of meer spaties. De relatiegegevens (naam, adres, postcode/plaats) staan **rechts** naast de eerste drie velden.

### Kopregel

```
DE WAERDSE ASSURADEURE Werklijst overzicht           Datum 03-09-2026 Blad   1
```

- Kantoor = alles vóór "Werklijst overzicht".
- Rapportdatum = `Datum dd-mm-jjjj`. Dit is de peildatum voor verlopen/vandaag/gepland.
- Bladnummer = `Blad n`.

### Polis-agenda

```
Medewerker   Overvoer                  Rabhi-Salhi R. A.
Relnr/Volg   71209349.80001.05001      Hertzogstraat 11 A
Polisnr.                               2572 VS 'S-GRAVENHAGE
Taakdatum    01-12-2026 P1  *                    Frequentie           weken
                                                 Agenda per freq  Nee
Omschrijving Polis opmaken
Ingevoerd    26-05-2026
Mutatie      03-09-2026 door   Vegelin L.
Contactpers  M2843
Onderwerp    Nieuwe aanvraag niet via extranet
```

### Schade-agenda

```
Medewerker   Schadeafdeling            T. Elkarim
Relnr/Volg   71126943.80001.02004      Scheveningsebos 76
Schadenr.    2307594.01                2716 HX Zoetermeer
Mij/Branche  P113  De Waerdse Ass. B.V 02103 Personenauto            JF-126-J
Collect.     Provisie 20%
Schadesoort  MOT:WA/Letsel                       Sch.datum  29-09-2023
Taakdatum    25-12-2026 P2  *                    Frequentie        12 weken
                                                 Agenda per freq  Nee
Omschrijving Dossier sluiten?
Ingevoerd    16-05-2024
Mutatie      29-06-2026 door   Snoeren A.
Onderwerp    SVZ NN letsel?
```

### Veldregels

| Label | Linkerwaarde | Rechterwaarde | Opmerking |
|---|---|---|---|
| `Medewerker` | medewerker/afdeling | relatienaam | Start van een nieuwe agenda |
| `Relnr/Volg` | relatienummer.volgnummer.subnummer | adres | |
| `Polisnr.` | polisnummer (kan leeg zijn) | postcode + plaats | Markeert soort **Polis** |
| `Schadenr.` | schadenummer (`2307594.01`) | postcode + plaats | Markeert soort **Schade** |
| `Mij/Branche` | maatschappijcode, maatschappijnaam, branchecode (5 cijfers), branche | kenteken (optioneel) | Alleen schade |
| `Collect.` | provisie/collectiviteit | | Alleen schade |
| `Schadesoort` | bijv. `MOT:WA/Letsel`, `AVB:Zaakschade` | `Sch.datum dd-mm-jjjj` | Alleen schade |
| `Taakdatum` | `dd-mm-jjjj`, `P1..P4`, optioneel `*` | `Frequentie <tekst>` | Prioriteit en ster staan achter de datum |
| (vervolgregel) | | `Agenda per freq Ja/Nee` | Hoort bij Taakdatum |
| `Omschrijving` | vrije tekst | | Kan doorlopen op volgende regel |
| `Ingevoerd` | datum | | |
| `Mutatie` | datum | `door <naam>` | |
| `Contactpers` | code (bijv. `M2843`) | | Meestal alleen polis |
| `Onderwerp` | vrije tekst | | Kan doorlopen op volgende regel |

Een regel zonder bekend label wordt als vervolg van het laatste tekstveld beschouwd.

### Prioriteiten

| Code | Betekenis |
|---|---|
| P1 | Hoog |
| P2 | Middel |
| P3 | Laag |
| P4 | Slotvraag |

De `*` achter de taakdatum is een markering ("gemarkeerd"); de precieze CRM-betekenis is nog niet bevestigd.

---

## 3. Parser

De parser is regelgebaseerd en bewust eenvoudig, zodat hij ook werkt als de tekst uit Excel, PDF of een klembord komt.

```
voor elke regel:
  tabs -> spaties, trailing spaties weg
  lege regel of streepjeslijn -> overslaan
  kopregel (bevat "Werklijst overzicht") -> rapportdatum, blad, kantoor onthouden
  "Agenda per freq" -> waarde in huidige agenda zetten
  label herkend (regex ^(Medewerker|Relnr/Volg|Polisnr|Schadenr|Mij/Branche|Collect|Schadesoort|Taakdatum|Omschrijving|Ingevoerd|Mutatie|Contactpers|Onderwerp)\.?\s*(.*)$):
     Medewerker -> vorige agenda afsluiten, nieuwe beginnen
     rest splitsen op 2+ spaties in linker-/rechterkolom
     veld-specifieke extractie (datums, P-code, ster, frequentie, "door", postcode-check)
  anders -> aan laatste tekstveld plakken
```

Belangrijke regexes:

- Datum: `(\d{2})-(\d{2})-(\d{4})`; voor sorteren omzetten naar `jjjjmmdd` als getal.
- Postcode: `^\d{4}\s?[A-Za-z]{2}\b` (als de linkerwaarde bij Polisnr./Schadenr. een postcode is, is het nummer leeg).
- Prioriteit: `\bP(\d+)\b`.
- Mij/Branche: `^(\S+)\s+(.*?)\s+(\d{5})\s+(.*?)(?:\s{2,}(\S+))?$` → code, maatschappij, branchecode, branche, kenteken.
- Schadedatum: `Sch\.?datum\s+(\d{2}-\d{2}-\d{4})`.

Afgeleide velden na het parsen:

- `soort`: Schade als er een schadenummer/schadesoort/maatschappij is; Polis bij label `Polisnr.`; anders Relatie. Overige, DDi, Email en Quantum worden herkend als een regel met dat woord begint (formaat nog niet bevestigd).
- `status`: `verlopen` (taakdatum < rapportdatum), `vandaag` (gelijk), `gepland` (later).
- `afgehandeld`, `gelezen`, `geindexeerd`: alleen waar als het woord in de agendatekst staat zonder "niet" ervoor. De huidige export bevat die kenmerken niet.

---

## 4. Datamodel

Eén record per agenda. Dit is tevens het aanbevolen schema voor een database of API in het nieuwe project.

```ts
interface Agenda {
  id: number;
  soort: 'Relatie' | 'Polis' | 'Schade' | 'Overige' | 'DDi' | 'Email' | 'Quantum';
  blad: string;

  medewerker: string;        // of afdeling, bijv. "Schadeafdeling"
  relatie: string;           // naam
  relnr: string;             // 71209349.80001.05001
  adres: string;
  postcode: string;          // "2572 VS 'S-GRAVENHAGE"

  polisnr: string;
  schadenr: string;          // 2307594.01
  mijCode: string;           // P113
  maatschappij: string;      // De Waerdse Ass. B.V
  brancheCode: string;       // 02103
  branche: string;           // Personenauto
  kenteken: string;          // JF-126-J
  collect: string;           // Provisie 20%
  schadesoort: string;       // MOT:WA/Letsel
  schadedatum: string;       // dd-mm-jjjj

  taakdatum: string;         // dd-mm-jjjj
  taakdatumSort: number;     // jjjjmmdd
  prioriteit: '' | 'P1' | 'P2' | 'P3' | 'P4';
  ster: boolean;
  frequentie: string;        // "weken", "12 weken"
  agendaPerFreq: string;     // "Ja" | "Nee"

  omschrijving: string;
  onderwerp: string;
  contactpers: string;
  ingevoerd: string;
  mutatie: string;
  mutatieDoor: string;

  status: '' | 'verlopen' | 'vandaag' | 'gepland';   // afgeleid t.o.v. rapportdatum
  afgehandeld: boolean;
  gelezen: boolean;
  geindexeerd: boolean;

  raw: string[];             // de originele regels, voor het detailpaneel
}
```

Rapportniveau: `kantoor`, `reportDate`, `pages`.

---

## 5. Filters (naar het CRM-venster "Filter werklijstitems")

Het filterpaneel volgt de indeling van het CRM. Alle filters werken op de volledige set en bepalen tegelijk de KPI's, tellingen en tabel. Toepassen met **OK**, terugzetten met **Herstel**.

| Groep | Veld | Werking |
|---|---|---|
| Status | Niet afgehandeld / Afgehandeld (radio) | `afgehandeld === false/true` |
| Status | Niet gelezen / Gelezen (vinkjes) | record telt mee als zijn toestand aangevinkt is |
| Status | Niet geïndexeerd / Geïndexeerd (vinkjes) | idem |
| Soort | Relatie, Polis, Schade, Overige, DDi, Email, Quantum | `soort` in aangevinkte set; per soort wordt het aantal getoond |
| Eigenschappen | Kantoor | vergeleken met kantoor uit de kopregel (genormaliseerd, prefix-match) |
| Eigenschappen | Afdeling | zoekt in medewerker en agendaregels |
| Eigenschappen | Gebruiker | zoekt in medewerker (keuzelijst uit de data) |
| Eigenschappen | Prioriteit | P1–P4 |
| Eigenschappen | Status | verlopen / vandaag / gepland |
| Eigenschappen | Datum vanaf t/m | op taakdatum; sneltoetsen verlopen, vandaag, week, maand, kwartaal, alles (relatief aan de rapportdatum) |

Boven de tabel staan nog drie snelle filters die niet in het CRM-venster zitten: zoeken (vrije tekst over alle velden), schadesoort en "alleen gemarkeerd (*)".

Open vragen voor exacte overeenstemming met het CRM: herkenning van DDi/Email/Quantum/Overige in de export, waar afgehandeld/gelezen/geïndexeerd in de tekst staan, wat "Afdeling" precies is, en welke waarden het CRM-veld "Status" kent.

---

## 6. KPI's en tellingen

### Schades (over de gefilterde set, soort = Schade)

| KPI | Definitie |
|---|---|
| Schade-agenda's | aantal records; subregel: unieke schadenummers |
| Verlopen | taakdatum vóór rapportdatum |
| Sluitvragen | omschrijving of onderwerp bevat "sluit" |
| Letsel | schadesoort bevat "letsel" |
| Gemiddelde leeftijd dossier | gemiddelde van (rapportdatum − schadedatum) in jaren |
| Oudste schade | laagste schadedatum, met relatie en schadenummer |
| Verdelingen | per schadesoort, per branche, per medewerker (klikbaar: zet het filter) |

### Agenda's in de werklijst (over de gefilterde set)

| Telling | Definitie |
|---|---|
| Totaal | aantal records; subregel: aantal bladen |
| Polis / Schade | per soort; subregel relatie en overig |
| Hoog / Middel / Laag / Slotvraag | per prioriteit, met aantal verlopen en gemarkeerd |
| Verlopen | met subregel vandaag en gepland |
| Verdelingen | per medewerker, per frequentie, per "Agenda per freq" |

### Tabel

Alle velden als kolommen, sorteerbaar per kolom, rij klikken opent een detailpaneel met alle velden én de originele bronregels. Export van de gefilterde set naar CSV (puntkomma, UTF-8 met BOM, zodat Excel het direct opent).

---

## 7. Van plakken naar automatisch ophalen

De huidige pagina is volledig client-side: tekst plakken → `parseLines()` → `finalize()` → `render()`. Voor een nieuw project waarin de agenda's opgehaald worden, blijven stappen 2 t/m 4 gelijk; alleen de bron verandert.

### Aanbevolen opzet

```
[CRM / export]  →  [ophaal-laag]  →  [parser]  →  [opslag: Agenda[]]  →  [API]  →  [front-end]
```

1. **Ophaal-laag**. Afhankelijk van wat het CRM biedt:
   - Exportbestand in een map (txt/xlsx): een geplande taak leest nieuwe bestanden en voert ze door de parser.
   - Database-koppeling of API van het CRM: velden rechtstreeks mappen op het datamodel uit §4; de parser is dan alleen nog nodig voor de vrije-tekstvelden.
   - Geen van beide: de huidige plak-flow blijft als handmatige fallback bestaan.
2. **Parser** in een aparte module (`parseWerklijst(text): { kantoor, reportDate, pages, records }`), met de regexes uit §3, zodat server en browser dezelfde code gebruiken. Schrijf tests op basis van de twee voorbeeldblokken in §2.
3. **Opslag** per rapportdatum, zodat historie en trends mogelijk worden (bijv. aantal verlopen per week, doorlooptijd van sluitvragen). Sleutel: `relnr + schadenr/polisnr + taakdatum + omschrijving`, omdat de export geen agenda-id bevat.
4. **API** met dezelfde filterparameters als §5 (`afgehandeld`, `gelezen`, `geindexeerd`, `soort[]`, `kantoor`, `afdeling`, `gebruiker`, `prioriteit`, `status`, `van`, `tot`), zodat de front-end alleen hoeft te renderen.
5. **Front-end** hergebruikt de huisstijl-tokens, het filterpaneel, de tegels en de tabel. Vervang in de HTML de functie `readText()` door een `fetch()` naar de API en roep daarna `finalize()` aan.

### Punten om vroeg vast te leggen

- Welke bron is leidend en hoe vaak wordt ververst (dagelijks na de nachtexport, of real-time).
- Hoe "afgehandeld", "gelezen" en "geïndexeerd" uit het CRM te halen zijn; die komen niet in de tekstexport mee.
- Een vast agenda-id uit het CRM, zodat wijzigingen en afhandeling over de tijd te volgen zijn.
- Rapportdatum als peildatum bewaren bij elke import; zonder die datum kloppen verlopen/vandaag/gepland niet.
- Authenticatie en autorisatie per medewerker of afdeling, omdat de data persoonsgegevens en schadegegevens bevat.

---

## 8. Bestanden

| Bestand | Inhoud |
|---|---|
| `dewaerdse-werklijst.html` | Volledige pagina: huisstijl-CSS, filterpaneel, parser, KPI's, tabel, CSV-export, voorbeelddata. Geen externe afhankelijkheden. |
| `WERKLIJST-BASISPRINCIPES.md` | Dit document. |
