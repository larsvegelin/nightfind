# ParsePDF, volgende versie: sjablonen in mappen, automatische veldherkenning en een AI-controle

Dit stuk beschrijft hoe ParsePDF van "regels intikken en hopen" naar "document erin, velden eruit" gaat. Het is geschreven om uitgevoerd te worden: elk onderdeel heeft een algoritme, een datamodel of een schermbeschrijving.

---

## 1. Waar het nu op stukloopt

Als proef een echte webshopfactuur (Lekkerflesjewijn, INV10632) door de huidige tool gehaald, met het sjabloon Facturen. Dit kwam eruit:

| Kolom | Wat de tool gaf | Wat er hoort te staan |
|---|---|---|
| Factuurnummer | `Ordernummer Klantnummer Datum` | `INV10632` |
| Datum | leeg | `21 Juni 2026` |
| Totaal | `32,15` | `38,90` |
| BTW | `6,75` | `6,75` |

Eén van de vier goed, en twee fouten die je niet ziet als je niet controleert. De oorzaken zijn structureel, niet toevallig:

1. **De layout wordt weggegooid.** De tool plakt alles wat op dezelfde hoogte staat aan elkaar tot één regel. Op deze factuur staan de labels op één rij en de waarden op de rij eronder, elk in een eigen kolom:

   ```
   y=588   x50 "Factuurnummer"   x134 "Ordernummer"   x218 "Klantnummer"   x429 "Datum"
   y=576   x50 "INV10632"        x134 "ORD10093"      x218 "227521416"     x429 "Zondag 21 Juni 2026"
   ```

   De x-posities lopen exact gelijk. Die informatie zit in het document en wordt nu weggegooid; daarna is niet meer te zien welke waarde bij welk label hoort.

2. **Zoeken op één label is te dom.** "Totaal" komt drie keer voor: `Total discount`, `Totaal excl. BTW`, `Totaal incl. BTW`. Wie het eerste bedrag pakt, pakt het verkeerde.

3. **Je moet zelf verzinnen wat erin staat.** De tool vraagt nooit wat je wilt hebben en stelt nooit iets voor. Terwijl een factuur van drie kolommen en zeven kolomkoppen zichzelf grotendeels uitlegt.

4. **Eén sjabloon voor alles.** Facturen van je softwareleverancier zien er anders uit dan die van je wijnhandel. Nu passen ze in dezelfde vijf regels, dus werkt het voor geen van beide goed.

5. **Eén rij per document.** De regeltabel op deze factuur (drie artikelregels met aantal, prijs, btw) is niet te krijgen.

6. **Geen AI, terwijl het profiel wel bestaat.** In het dashboard staat een schakelaar "AI-herkenning gebruiken" en de server heeft `POST /api/parsepdf/detect`, maar de Webflow-versie gebruikt daar niets van.

> Deze factuur staat als `parselab/tests/pdfs/factuur-webshop.pdf` in de repo, nagebouwd met dezelfde kolomposities maar zonder persoonsgegevens. Hij geeft precies dezelfde vier uitkomsten hierboven, dus je kunt de vooruitgang meten.

---

## 2. Wat er verandert, in vier zinnen

1. **De parser leest de pagina als een raster**, niet als een reeks regels: hij houdt x- en y-posities vast en werkt met cellen.
2. **Je uploadt eerst, dan pas praat je over velden**: de tool laat zien wat hij gevonden heeft en jij vinkt aan wat je wilt.
3. **Sjablonen staan in mappen** (Facturen → Softwarefacturen, Wijnleverancier, Verzekeraars), en de tool herkent zelf welk sjabloon bij een nieuw document hoort.
4. **AI is een tweede paar ogen**, geen motor: de structuurcheck doet het werk, de AI benoemt en vult aan wat de structuur niet zeker weet.

---

## 3. Het nieuwe model: map → sjabloon → veld

```
Facturen                          (map)
├── Softwarefacturen              (sjabloon)   herkent: "Adobe", "Microsoft", KvK 12345678
│   ├── Factuurnummer             (veld)       kolomkop "Invoice number"
│   ├── Datum                     (veld)       kolomkop "Date", opschonen: datum
│   └── Totaal incl. btw          (veld)       label rechts, opschonen: bedrag
├── Wijnleverancier               (sjabloon)   herkent: "Lekkerflesjewijn", IBAN NL71RABO…
│   ├── Factuurnummer, Ordernummer, Klantnummer, Datum
│   ├── Totaal excl. BTW, BTW 21%, Totaal incl. BTW
│   └── Regels (tabel)            (veldgroep)  Beschrijving, Artikelcode, Aantal, Prijs, Subtotaal
└── Onbekend                      (sjabloon)   vangnet: alles wat nergens op lijkt

Bankafschriften                   (map)
Polissen                          (map)
```

Wat dit oplevert:

- Je kiest bij het uitlezen een **map**, niet een sjabloon. Sleep dertig facturen van vijf leveranciers erin; de tool verdeelt ze zelf over de sjablonen in die map en zet ze in één tabel.
- Een veld heeft een **naam die jij kiest** en een **vindregel die de tool voorstelt**. Dezelfde naam in twee sjablonen betekent dezelfde kolom in de uitvoer. Zo krijg je één tabel over leveranciers heen, met per leverancier zijn eigen manier van vinden.
- Een sjabloon dat nergens bij past belandt in **Onbekend**, met een knop "maak hier een sjabloon van".

---

## 4. De flow van A tot Z

```
1. Kies map            Facturen ▾            (of: nieuwe map)
2. Sleep documenten    23 PDF's
3. Herkennen           18 × Wijnleverancier · 4 × Softwarefacturen · 1 × onbekend
                       ↓ (bij het onbekende document:)
4. Wat wil je eruit?    ○ Alles wat de tool kan vinden
                        ○ Alleen deze velden: [ Factuurnummer ] [ Datum ] [ Totaal ] + eigen veld
                        ○ Ook de regeltabel
5. Voorstel            De tool toont 11 gevonden velden met de waarde uit dít document,
                       elk met een vinkje en een naam die je kunt wijzigen.
6. Controleren         Waarden staan naast het documentbeeld; twijfelgevallen zijn gemarkeerd.
7. Opslaan             "Bewaar als sjabloon in Facturen" → naam: Wijnleverancier
8. Uitlezen            Alle 23 documenten in één tabel, download als CSV of Excel.
```

Stap 4 is de vraag die er nu niet is. Drie antwoorden volstaan, en "alles wat de tool kan vinden" is de standaard: dat is sneller dan kiezen en je gooit achteraf kolommen weg.

Stap 3 en 5 zijn nieuw en dragen de hele belofte. De rest bestaat al.

---

## 5. De structuurcheck: velden vinden zonder AI

Dit is het hart. Het draait volledig in de browser, kost niets en werkt op elk document met een tekstlaag.

### 5.1 Van tekstfragmenten naar cellen

pdf.js geeft per fragment `str`, `transform[4]` (x), `transform[5]` (y), `width` en `height`. Nu wordt alleen y gebruikt. Nieuw:

```
cellen = fragmenten
  groepeer op y (tolerantie: halve regelhoogte)
  binnen een rij: sorteer op x
  plak twee fragmenten alleen aan elkaar als het gat kleiner is dan één spatiebreedte
→ cel = { tekst, x, y, breedte, hoogte, rij, pagina }
```

Het verschil met nu: `"Factuurnummer"` en `"Ordernummer"` blijven twee cellen in plaats van één regel.

### 5.2 Kolommen vinden

```
kolomranden = alle unieke x-waarden van cellen, geclusterd binnen 3 punten
een kolom is "echt" als minstens 3 rijen een cel op die x hebben
```

Op de proeffactuur levert dat kolommen op x ≈ 52, 319, 391, 414, 439, 476, 517 — precies de zeven kolommen van de regeltabel.

### 5.3 Vier soorten kandidaten

De parser zoekt vier vormen, in deze volgorde. Elke vorm levert een kandidaat met een score.

| Vorm | Herkenning | Voorbeeld op de proeffactuur | Score |
|---|---|---|---|
| **Kolomkop boven waarde** | Rij A bevat 2+ cellen die op labelwoorden lijken; de rij eronder heeft cellen op dezelfde x | `Factuurnummer` ⟶ `INV10632` | 0,9 |
| **Label links, waarde rechts** | Cel eindigt op `:` of is vet/label-achtig; rechts op dezelfde rij staat een cel | `Totaal incl. BTW` ⟶ `€38,90` | 0,85 |
| **Label boven waarde** | Cel met dezelfde x direct eronder, geen andere cel ertussen | `Bank` ⟶ `Rabobank` | 0,7 |
| **Los patroon** | Tekst die zichzelf verraadt, waar hij ook staat | IBAN, btw-nummer, KvK, postcode, datum, bedrag, e-mail, telefoon | 0,6 |

Een label-achtige cel is: begint met een hoofdletter, hoogstens vier woorden, geen bedrag of datum, en staat óf in de bovenste rij van een blok óf eindigt op een dubbele punt.

### 5.4 De ingebouwde patronen

Deze horen erin te zitten, met een Nederlandse naam en een opschoning:

| Patroon | Reguliere uitdrukking (kern) | Naam die de tool voorstelt |
|---|---|---|
| IBAN | `[A-Z]{2}\d{2}[ ]?[A-Z0-9]{4}([ ]?[0-9]{4}){2,4}` | Rekeningnummer |
| Btw-nummer NL | `NL\d{9}B\d{2}` | Btw-nummer |
| KvK | `KvK[-\s]?(nummer)?\s*(\d{8})` | KvK-nummer |
| Bedrag | `-?€?\s?\d{1,3}([.\s]\d{3})*,\d{2}` | (bij het dichtstbijzijnde label) |
| Datum cijfers | `\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}` | Datum |
| Datum woorden | `(\d{1,2}) (jan…dec)[a-z]* (\d{4})`, weekdag ervoor toegestaan | Datum |
| Postcode | `\d{4}\s?[A-Z]{2}` | Postcode |
| E-mail, telefoon | standaard | E-mailadres, Telefoonnummer |
| Percentage | `\d{1,2}([.,]\d)?\s?%` | Percentage |

### 5.5 Ontdubbelen en benoemen

Meerdere kandidaten voor dezelfde waarde: hoogste score wint. Twee velden met dezelfde voorgestelde naam: de tool nummert ze (`Totaal 1`, `Totaal 2`) en zet ze náást elkaar in het voorstel, zodat je ziet dat je moet kiezen. Bij `Total discount / Totaal excl. BTW / BTW 21% / Totaal incl. BTW` levert dat vier aparte velden op met hun eigen bedrag — geen enkele twijfel meer over welk totaal je krijgt.

### 5.6 De regeltabel

```
zoek een rij met 3+ label-achtige cellen op verschillende kolommen  → kopregel
neem de rijen eronder zolang ze cellen hebben op minstens de helft van die kolommen
stop bij een lege rij van meer dan anderhalve regelhoogte, of bij een totalenblok
rijen met alleen een cel in de eerste kolom horen bij de rij erboven (doorloop, zoals "PostNL verzending")
```

Op de proeffactuur geeft dat drie regels met zeven kolommen. Twee uitvoerkeuzes per sjabloon:

- **Eén rij per document** (nu): de kopvelden, geen tabel.
- **Eén rij per regel**: elke tabelregel wordt een rij, met de kopvelden erbij herhaald. Dit is wat je wilt voor een boekhouding.

---

## 6. De AI-controle

De structuurcheck vindt *waar iets staat*. De AI is beter in *wat het betekent* en in documenten die van het stramien afwijken. Daarom precies deze rolverdeling:

**Wat de AI wél doet**

1. **Benoemen.** Structuurcheck vindt `Zondag 21 Juni 2026` naast `Datum`; de AI zegt dat dit de factuurdatum is en niet de vervaldatum, kijkend naar de rest van het document.
2. **Aanvullen.** Velden die je vroeg maar die de structuurcheck niet vond, zoekt de AI in de platte tekst.
3. **Toetsen.** De AI krijgt de gevonden waarden en mag ze afkeuren: klopt `Totaal incl. BTW = 38,90` met `32,15 + 6,75`? Zo niet, dan wordt het veld gemarkeerd in plaats van stil doorgelaten.
4. **Sjabloon voorstellen bij het eerste document van een leverancier.**

**Wat de AI niet doet**

- Niet elk document. Alleen bij het maken of bijwerken van een sjabloon, dus één keer per leverancier in plaats van bij elke factuur. Duizend facturen door de AI halen kost geld en tijd zonder iets toe te voegen: het stramien is dan al bekend.
- Nooit als de gebruiker de schakelaar uit heeft staan. Dan draait alles op de structuurcheck en verdwijnt alleen het benoemen.

**Hoe het technisch loopt**

```
browser  → POST /api/parsepdf/velden
           { tekst: "eerste 2 pagina's als platte tekst",
             cellen: [ {t,x,y} … ],          ← alleen posities, geen beeld
             gevraagd: ["factuurnummer","datum","totaal","btw"] | "alles",
             gevonden: [ {naam,waarde,score} … ] }

server   → Anthropic, model uit PARSELAB_AI_MODEL (claude-opus-5),
           antwoord afgedwongen als JSON

antwoord → { velden: [ { naam, waarde, herkomst: "structuur"|"ai",
                         vindregel: {type:"kolomkop", label:"Factuurnummer"},
                         zekerheid: 0.0-1.0 } ],
             tabel: { kolommen:[…], gevonden: true|false },
             waarschuwingen: ["Totaal incl. BTW komt niet overeen met de optelling"] }
```

De sleutel staat op de server, nooit in de browser: dat werkt al zo in `server/server.js`. Wat er heen gaat is de tekst van één document, niet de hele stapel. Zet dat er in de interface bij, met de knop ernaast — mensen mogen dat weten voor ze klikken.

**Kosten.** Eén sjabloon maken is één aanroep van ongeveer 3.000 tokens in en 800 uit. Bij honderd leveranciers per jaar is dat verwaarloosbaar. Zet er een grens op: hoogstens twee AI-aanroepen per sjabloon per dag.

**Als de AI niet beschikbaar is** (geen sleutel, geen verbinding, foutmelding): de tool doet gewoon het structuurvoorstel en zet er één regel bij: *AI-controle overgeslagen, velden komen uit de structuur.* Nooit een blokkade.

---

## 7. Welk sjabloon hoort bij dit document?

Bij elke upload: welk sjabloon in de gekozen map past?

**Vingerafdruk per sjabloon** (opgeslagen bij het maken):

- de vijf meest voorkomende vaste teksten die geen waarde zijn (`Factuurnummer`, `Artikelcode`, `Totaal incl. BTW`, …)
- de x-posities van de gevonden kolommen, genormaliseerd naar paginabreedte
- harde kenmerken die de leverancier verraden: KvK-nummer, btw-nummer, IBAN, domeinnaam

**Score:** 3 punten per hard kenmerk, 1 per vaste tekst, 2 als het kolompatroon binnen 5 % past. Hoogste score boven de 6 wint.

- **Boven de 6:** direct toepassen, met de sjabloonnaam bij het document in de lijst.
- **Tussen 3 en 6:** toepassen maar markeren — *"Lijkt op Wijnleverancier. Klopt dat?"* met een knop om het te bevestigen of een nieuw sjabloon te maken.
- **Onder de 3:** onbekend. Het document komt in de tabel met lege kolommen en een knop "maak hier een sjabloon van".

Bevestigen voegt de kenmerken van dit document toe aan de vingerafdruk. Het sjabloon wordt dus scherper naarmate je het gebruikt.

---

## 8. Controleren en corrigeren

Elk veld krijgt een zekerheid, en die is zichtbaar:

| Zekerheid | Waar het vandaan komt | Hoe het eruitziet |
|---|---|---|
| Zeker | Structuurcheck, score ≥ 0,85, past bij het sjabloon | gewone cel |
| Twijfel | Score tussen 0,5 en 0,85, of de AI is het er niet mee eens | gele rand, tooltip met de reden |
| Leeg | Niets gevonden | streepje, klikbaar: "wijs aan in het document" |

"Wijs aan in het document" toont de pagina met de cellen als klikvlakken. Eén klik op de juiste cel en de tool leidt daaruit de vindregel af (welke kolom, welk label, welke afstand) en past het sjabloon aan. Dat is het verschil tussen een tool die je één keer instelt en een tool waar je in blijft rommelen.

Corrigeer je een veld in drie documenten op dezelfde manier, dan stelt de tool voor de vindregel in het sjabloon te wijzigen.

---

## 9. Datamodel (Supabase)

```sql
create table folders (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  naam text not null,
  aangemaakt timestamptz default now()
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references folders on delete cascade,
  owner uuid not null references auth.users on delete cascade,
  naam text not null,
  uitvoer text not null default 'document',      -- 'document' | 'regel'
  vingerafdruk jsonb not null default '{}',      -- vaste teksten, kolommen, harde kenmerken
  gebruikt_op timestamptz,
  aantal_gebruikt int default 0
);

create table template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates on delete cascade,
  naam text not null,
  volgorde int not null default 0,
  soort text not null,                           -- 'kop' | 'tabel'
  vindregel jsonb not null,                      -- {type, label, kolom, richting, patroon}
  opschonen text not null default 'geen',        -- 'geen' | 'bedrag' | 'datum' | 'getal'
  verplicht boolean default false
);

create table extraction_runs (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  folder_id uuid references folders on delete set null,
  documenten int not null,
  paginas int not null,
  gestart timestamptz default now()
);
```

Row level security op alle vier: `owner = auth.uid()`. Documenten zelf worden niet opgeslagen — dat blijft de belofte van de tool.

Migratie vanaf nu: de regels die in `localStorage` staan onder `pl_parsepdf_regels` worden bij de eerste keer inloggen omgezet naar een sjabloon "Mijn regels" in een map "Facturen".

---

## 10. Wat waar draait

| Onderdeel | Waar | Waarom |
|---|---|---|
| PDF lezen, cellen, kolommen, structuurcheck | browser | documenten blijven bij de gebruiker |
| Sjabloon toepassen, tabel bouwen, CSV/Excel | browser | geen serverkosten, werkt bij duizend documenten |
| Sjablonen, mappen, velden bewaren | Supabase | zodat ze mee reizen naar een andere computer |
| Verbruik tellen | Supabase (`record_usage`) | bestaat al |
| AI-controle | server (`/api/parsepdf/velden`) | de sleutel hoort niet in de browser |

De enige nieuwe servercode is dat ene AI-eindpunt. De rest is browserwerk plus vier tabellen.

---

## 11. Schermen

1. **Mappen.** Lijst met mappen, per map het aantal sjablonen en wanneer voor het laatst gebruikt. Knop: nieuwe map.
2. **Map.** De sjablonen erin, elk met naam, aantal velden, hoe vaak gebruikt. Grote dropzone erboven: *sleep documenten hierheen.*
3. **Herkennen.** Lijst van geüploade documenten met per stuk het herkende sjabloon of "onbekend", en de vraag uit stap 4 van de flow als er iets onbekends bij zit.
4. **Voorstel.** Twee kolommen: links de documentweergave, rechts de gevonden velden met vinkje, naam en waarde. Onderaan: *Bewaar als sjabloon.*
5. **Resultaat.** De tabel zoals nu, met de zekerheidsmarkeringen en een knop om een kolom te corrigeren.

Alles met de `pld-` en `plp-` componenten uit `DASHBOARD-styleguide.md`; er is niets nieuws voor nodig behalve een documentweergave en een vinkjeslijst.

---

## 12. Bouwvolgorde

**Fase 1 — cellen en kolommen** (het fundament, zonder zichtbare nieuwe knoppen)
Vervang de regelgroepering door cellen met x en y, en laat de bestaande vindregels erop draaien. Uitkomst: de huidige sjablonen blijven werken, `Factuurnummer` op de proeffactuur geeft `INV10632` in plaats van de kolomkoprij.

**Fase 2 — voorstel doen**
De structuurcheck met de vier kandidaatvormen, het voorstelscherm en "bewaar als sjabloon". Nog geen mappen, nog geen AI. Uitkomst: je uploadt een factuur en krijgt elf velden aangeboden.

**Fase 3 — mappen en herkennen**
De vier tabellen, mappen in de interface, vingerafdruk en automatische sjabloonkeuze. Uitkomst: dertig facturen van vijf leveranciers in één keer, in één tabel.

**Fase 4 — AI-controle en regeltabellen**
Het eindpunt `/api/parsepdf/velden`, het benoemen en toetsen, en de keuze "één rij per regel". Uitkomst: de regeltabel van de proeffactuur komt als drie rijen naar buiten, en de tool waarschuwt als een totaal niet klopt.

Elke fase is los bruikbaar en los te lanceren. Fase 1 en 2 samen halen het grootste deel van de klacht weg; fase 3 maakt het pas een gereedschap voor dagelijks werk.

---

## 13. Waaraan je meet of het werkt

Deze gevallen horen in `tests/webflow.mjs` te komen, met de documenten uit `tests/pdfs/`:

| Document | Wat er moet lukken |
|---|---|
| `factuur-webshop.pdf` | Factuurnummer `INV10632`, Datum `21 Juni 2026`, Totaal incl. BTW `38,90`, en drie tabelregels |
| `factuur-alpha/beta/gamma.pdf` | Blijven werken zoals nu, ook na de omslag naar cellen |
| `bankafschrift.pdf` | Herkend als ander sjabloon dan de facturen |
| `polis.pdf` | Voorstel bevat Polisnummer, Ingangsdatum en Premie zonder dat je iets intikt |
| `gescand.pdf` | Nog steeds de nette melding, geen half voorstel |
| twee sjablonen in één map | Twintig gemengde documenten geven één tabel met de juiste waarden per leverancier |

Het harde criterium voor fase 2: **op een onbekende factuur vindt de tool zonder enige instelling minstens het factuurnummer, de datum en het eindbedrag, correct.** Haalt hij dat niet, dan is de structuurcheck nog niet af.

---

## 14. Wat er bewust niet in komt

- **Tekstherkenning voor scans.** Dat is een eigen project met een eigen prijskaartje. Zolang het er niet is: de melding per bestand, zoals nu.
- **Documenten bewaren.** De tool leest en vergeet. Alleen sjablonen en tellingen blijven staan; dat is precies wat de belofte "er wordt geen document verstuurd" waard maakt.
- **Sjablonen delen binnen een organisatie.** Wel het overwegen waard zodra er meer dan één gebruiker per bedrijf is; dan wordt `owner` een `org_id`. Niet nu.
- **Handtekeningen, stempels, tabellen over pagina's heen.** Later, als de rest staat.
