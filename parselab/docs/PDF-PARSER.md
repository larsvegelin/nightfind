# De PDF-parser — compleet naslagwerk

Alles over `parselab/tools/parsepdf.html`: wat de tool doet, hoe elke stap werkt, welke
zoekregels er zijn, waar de gegevens blijven, wat de AI doet en wat er misgaat als het
misgaat. Eén bestand, bedoeld om naast de tool open te hebben.

> **Kort:** je sleept PDF's erin, stelt één keer in welke velden je eruit wilt, en krijgt
> een tabel terug als CSV of Excel. Het uitlezen gebeurt volledig in je eigen browser;
> er gaat geen document het netwerk op, behalve als je zelf om AI-hulp vraagt.

---

## Inhoud

1. [Twee uitvoeringen van dezelfde tool](#1-twee-uitvoeringen-van-dezelfde-tool)
2. [Openen en starten](#2-openen-en-starten)
3. [De vijf schermen](#3-de-vijf-schermen)
4. [Stap 1: Uploaden](#4-stap-1-uploaden)
5. [Soort document](#5-soort-document)
6. [Stap 2: Kolommen instellen](#6-stap-2-kolommen-instellen)
7. [De zeven zoekregels](#7-de-zeven-zoekregels)
8. [Opschonen en omzetten](#8-opschonen-en-omzetten)
9. [Aanwijzen op het document](#9-aanwijzen-op-het-document)
10. [Velden laten voorstellen](#10-velden-laten-voorstellen)
11. [AI-hulp](#11-ai-hulp)
12. [Sjablonen](#12-sjablonen)
13. [Labels en filteren](#13-labels-en-filteren)
14. [Stap 3: Nakijken](#14-stap-3-nakijken)
15. [Stap 4: Downloaden](#15-stap-4-downloaden)
16. [Waar blijven je gegevens](#16-waar-blijven-je-gegevens)
17. [Instellingen vanuit het dashboard](#17-instellingen-vanuit-het-dashboard)
18. [Koppeling met de rest van ParseLab](#18-koppeling-met-de-rest-van-parselab)
19. [Als er iets misgaat](#19-als-er-iets-misgaat)
20. [Wat de tool niet doet](#20-wat-de-tool-niet-doet)
21. [Voor ontwikkelaars](#21-voor-ontwikkelaars)

---

## 1. Twee uitvoeringen van dezelfde tool

| | `tools/parsepdf.html` | `ParsePDF.html` |
|---|---|---|
| Grootte | ±2,5 MB | ±158 kB |
| pdf.js | ingebakken | van een CDN |
| Login | geen | Supabase |
| Verbruiksteller | geen | ja (pagina's per maand) |
| Werkt offline | ja, dubbelklikken is genoeg | nee |
| Gebouwd uit | zichzelf | `webflow/` via `bouw-pagina.mjs` |

Dit document beschrijft `tools/parsepdf.html`. De Webflow-uitvoering heeft dezelfde
uitleesmotor; wat daar anders is (login, pakketten, limieten, de embeds) staat in
[`WEBFLOW-SITE.md`](WEBFLOW-SITE.md).

---

## 2. Openen en starten

Drie manieren, allemaal goed:

- **Dubbelklikken.** `tools/parsepdf.html` werkt als los bestand, zonder server en zonder
  internet. Alles zit erin.
- **Via de ParseLab-server.** `node server/server.js`, dan
  `http://localhost:8080/tools/parsepdf.html`. Nodig als je de AI-knoppen wilt gebruiken.
- **In het ParseLab-dashboard.** Open `index.html` en kies *Data uit een PDF*; de tool
  draait dan in een kader binnen het dashboard en deelt instellingen en projecten.

Eerste keer dat je hem opent krijg je een korte rondleiding (`fsOnboarding`). Die slaan we
op onder `pdfScraperTourSeen`, dus hij komt één keer.

---

## 3. De vijf schermen

De tool heeft vijf pagina's, met bovenin een voortgangsbalk die aangeeft waar je bent:

| Scherm | Id in de code | Waarvoor |
|---|---|---|
| Uploaden | `page-upload` | documenten erin, labels, soort bepalen |
| Kolommen | `page-define` | per kolom een zoekregel instellen |
| Sjablonen | `page-templates` | opgeslagen kolomsets per soort document |
| Nakijken | `page-check` | de tabel controleren vóór je downloadt |
| Downloaden | `page-download` | CSV of Excel, met keuzes |

Je kunt vooruit en terug; wat je hebt ingesteld blijft staan.

---

## 4. Stap 1: Uploaden

Slepen of kiezen. Een hele map tegelijk kan ook (`dirInput`). Alleen PDF's worden
opgepakt; de rest wordt overgeslagen met een melding erbij.

Per document zie je in de lijst: de naam, het aantal pagina's, de labels en of er al een
soort aan hangt. Klik een document aan om het te bekijken (`docModal`) — handig om te
controleren of de tekstlaag er is.

**Welke pagina's?** Met de balk *Pagina's* (`pageOptsBar`) kies je waar de parser mag
kijken: alle pagina's, alleen de eerste, de laatste, de een-na-laatste, een vast nummer,
of alleen de oneven of even pagina's. Dat scheelt tijd bij dikke documenten en voorkomt
dat een bijlage de waarden overschrijft.

**Geen tekstlaag?** Een gescande PDF is een plaatje; daar valt niets uit te lezen. De tool
zegt dat per bestand. In deze uitvoering is er geen tekstherkenning — die zit alleen in de
Webflow-uitvoering (embed `4b-ocr`).

---

## 5. Soort document

Na de eerste upload raadt de tool wat voor document het is en vraagt het je te bevestigen:
*"Dit lijkt een factuur. Klopt dat?"* (`kindModal`). Klopt het niet, dan kies je zelf:
**Factuur, Bon, Loonstrook, Rapport** of een eigen naam.

De soort doet twee dingen: je sjablonen worden per soort bewaard, en bij een stapel door
elkaar kan de tool per document het bijbehorende sjabloon pakken.

> Werk je met vaste documentstromen, dan loont het de soorten te noemen zoals je ze
> intern noemt — *Inkomende factuur*, *Offerte*, *Salarisstrook*, *Jaarrekening*,
> *Betalingsbevestiging* — in plaats van één verzamelsoort "Factuur". De sjablonen en de
> controles blijven dan uit elkaar.

---

## 6. Stap 2: Kolommen instellen

Elke kolom in je tabel is één zoekregel. Je maakt ze met **+ Kolom** (`addRuleBtn`), geeft
ze een naam, en kiest hoe de waarde gevonden moet worden.

Rechts staat een **levende voorbeeldweergave** (`livePreview`): terwijl je instelt, zie je
meteen wat er uit het eerste document komt. Klopt het niet, dan pas je de regel aan
zonder de hele stapel te hoeven draaien.

Twee knoppen die je het meeste werk besparen:

- **Velden herkennen** (`autoDetectBtn`) — de structuurcheck kijkt naar het document en
  stelt kolommen voor. Werkt zonder AI en zonder internet.
- **Kolomkoppen plakken** (`headersText` → *Toepassen*) — heb je al een Excel met de
  kolomnamen die je wilt, plak dan die kopregel; de tool maakt er lege regels van die je
  invult.

---

## 7. De zeven zoekregels

| Soort | Wat het doet | Wanneer |
|---|---|---|
| **Tekst na woord/teken** (`after`) | Zoekt een woord en neemt wat erachter staat. Staat er niets achter, dan de volgende regel. | Verreweg het meest gebruikt: `Factuurnummer:`, `IBAN`, `Totaal` |
| **Waarde onder kolomkop** (`below`) | Zoekt een kopregel en neemt de waarde eronder | Tabellen met kolommen |
| **Tekst tussen twee tekens** (`between`) | Alles tussen een begin- en eindmarkering | Een bedrag tussen haakjes, tekst tussen streepjes |
| **Eigen patroon** (`regex`) | Een reguliere uitdrukking; staat er een haakjesgroep in, dan is díe de waarde | Kenmerken met een vaste vorm |
| **Vaste plek** (`position`) | Pagina, regel en eventueel woordnummer | Documenten die er altijd exact hetzelfde uitzien |
| **Gebied op pagina** (`region`) | Een rechthoek die je op het document tekent | Een bedrag dat altijd rechtsboven staat |
| **Vaste waarde** (`fixed`) | Voor elke regel dezelfde tekst | Een kolom "Bron" of "Boekjaar" |

Het zoeken bij *na woord* is woordgrens-bewust: `Totaal` pakt niet `Subtotaal`. Met
**sectie** (`section`) beperk je een regel tot een deel van het document — handig als
hetzelfde label twee keer voorkomt, bijvoorbeeld bij *Verzekeringnemer* en *Verzekerde*.

---

## 8. Opschonen en omzetten

Per kolom kun je zeggen wat voor soort waarde je verwacht. De tool haalt dan precies dat
uit de gevonden tekst — van `Totaal te voldoen EUR 1.506,45` houd je `1.506,45` over.

Keuzes: **Automatisch** (raadt op de kolomnaam), **Geen controle**, Telefoonnummer,
Mobiel nummer, IBAN, E-mailadres, Datum, Bedrag, Postcode, Getal, Naam.

Daarnaast per kolom:

- **Zoek en vervang** — haal vaste rommel weg (`findText` → `replaceText`).
- **Hoofdlettergebruik** — alles hoofdletters, alles kleine letters, of Elk Woord.
- **Voorvoegsel en achtervoegsel** — zet er vast iets voor of achter.
- **Omzettabel** (`mapping`) — `A` wordt `Actief`, `I` wordt `Inactief`.

---

## 9. Aanwijzen op het document

In plaats van typen kun je het ook aanwijzen. Open een document, teken met **Gebied**
(`addRegionBtn`) een rechthoek om de waarde, en de tool maakt daar een regel van. Voor
terugkerende documenten met een vaste opmaak is dit vaak de snelste weg.

---

## 10. Velden laten voorstellen

**Velden herkennen** opent het venster *Herkende velden* (`detectModal`): de tool arceert
alles wat de parser eruit kan halen en stelt namen voor. Je vinkt aan wat je wilt hebben
(`detectAllToggle` zet alles tegelijk aan) en klikt op **Voeg kolommen toe**; ze staan dan
als kolommen klaar.

Dit draait op de structuurcheck — geen AI, geen netwerk.

---

## 11. AI-hulp

De AI-knoppen staan standaard **uit**. Ze verschijnen pas als *AI-herkenning gebruiken*
aanstaat in de accountinstellingen, en ze werken alleen als er een server draait met een
Anthropic-sleutel (`PARSELAB_ANTHROPIC_KEY`).

Wat er gebeurt als je op **Laat ParseLab de velden herkennen** klikt (`aiDetectBtn` — de
knop is verborgen zolang de instelling uit staat):

1. Er verschijnt eerst een venster met de naam van het document en wat er verstuurd wordt.
2. Pas als je **Ja** zegt, gaat de **tekst van dat ene document** naar
   `POST /api/parsepdf/detect` op jouw server.
3. Die server praat met Claude en geeft voorgestelde velden terug: naam, waar in de tekst
   de waarde staat, een voorbeeld en het type.
4. Jij kiest welke je overneemt.

Nooit meer dan één document tegelijk, nooit zonder dat je ja zegt, en de sleutel staat op
de server — nooit in de browser.

Zonder sleutel geeft de server netjes `501` met uitleg, en leest de tool gewoon door op de
structuurcheck.

**Andere AI-eindpunten op de server** (gebruikt door de Webflow-uitvoering en het
dashboard): `/api/parsepdf/velden` (gevonden velden benoemen en natellen, met
waarschuwingen als subtotaal plus btw niet klopt) en `/api/parsepdf/regel` (een zin als
"het totaalbedrag onderaan pagina 1" omzetten in een zoekregel).

---

## 12. Sjablonen

Een sjabloon is je set kolommen, bewaard onder een naam en gekoppeld aan een soort
document. Je maakt er een met **Sjabloon opslaan** (`tmplSaveBtn`), bijvoorbeeld
*Facturen*. De volgende stapel van dezelfde soort is dan één klik.

Er staan voorbeeldsjablonen klaar om mee te beginnen. **Sjablonen bevatten geen
documentgegevens** — alleen de regels.

Sjablonen staan per browser. Ze reizen niet mee naar een andere computer en zijn niet te
delen met een collega; daar is een tabel in de database voor nodig
([`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md) heeft het datamodel).

---

## 13. Labels en filteren

Met 🏷 geef je documenten een label (`addLabelBtn`, `labelChips`). Klik daarna op een label
om te filteren: **alleen de gefilterde documenten worden uitgelezen en herkend.** Zo
verwerk je een deel van een grote stapel zonder de rest weg te gooien.

---

## 14. Stap 3: Nakijken

De tabel met één rij per document. Hier controleer je vóór je downloadt:

- Lege cellen vallen op — meestal betekent dat dat de zoekregel een label zoekt dat in dát
  document anders heet.
- Klik een rij aan om het document ernaast te zien en te vergelijken.
- Pas een regel aan en de tabel rekent opnieuw; je hoeft niet opnieuw te uploaden.

De voortgang bij een grote stapel staat in `parseProgress`.

---

## 15. Stap 4: Downloaden

Twee formaten:

- **CSV** (`exportCsvBtn`) — met puntkomma's en een UTF-8 BOM, zodat Nederlandse Excel de
  kolommen meteen goed zet.
- **Excel** (`exportXlsxBtn`) — een echt `.xlsx`-bestand.

Keuzes erbij: **bestandsnaam als kolom** (`includeFilename`) en **labels als kolom**
(`includeLabels`). Met **Kopiëren** (`copyBtn`) zet je de tabel op het klembord om direct
in een spreadsheet te plakken.

---

## 16. Waar blijven je gegevens

| Wat | Waar | Blijft staan? |
|---|---|---|
| Je kolommen en sjablonen | `localStorage` | ja, per browser |
| Geüploade documenten | IndexedDB `pdfScraperDocs` | alleen als *Documenten bewaren* aanstaat |
| Accountinstellingen | `localStorage` `parselab-settings` | ja |
| Rondleiding gezien | `localStorage` `pdfScraperTourSeen` | ja |
| De uitgelezen tabel | alleen in het geheugen | nee, tot je downloadt |

Het uitlezen zelf gebeurt in de browser met pdf.js. Er gaat **geen document** naar een
server — behalve de tekst van één document bij AI-hulp, nadat je daar ja op hebt gezegd.

Met *Alles wissen* (`clearAllBtn`) haal je de documenten en soorten uit je browser; je
kolommen en sjablonen blijven dan staan.

---

## 17. Instellingen vanuit het dashboard

Twee schakelaars onder Account in het dashboard, die via `parselab:settings` doorkomen en
anders uit `localStorage` worden gelezen:

- **AI-herkenning gebruiken** (standaard uit) — zonder dit staan de AI-knoppen er niet.
- **Documenten bewaren op deze computer** (standaard aan) — uit betekent: geüploade
  documenten worden niet in de browser bewaard en wat er stond wordt gewist.

Taal: Nederlands, Engels of Duits (`langSelect`), of meegegeven door het dashboard met
`parselab:lang`.

---

## 18. Koppeling met de rest van ParseLab

Draait de tool in het dashboard, dan praten ze met `postMessage`:

| Bericht | Richting | Betekenis |
|---|---|---|
| `parselab:ready` | tool → dashboard | de tool draait |
| `parselab:section` | tool → dashboard | op welk scherm je bent |
| `parselab:stats` | tool → dashboard | tellers voor de zijbalk |
| `parselab:projects` / `parselab:project` | tool → dashboard | je sjablonen |
| `parselab:dataset` | tool → dashboard | de uitgelezen tabel, zodat die bij *Je gestructureerde data* komt |
| `parselab:handover` | tool → dashboard | tabel doorgeven aan een ander formaat (dashboard, rapport) |
| `parselab:nav` | dashboard → tool | ga naar dit scherm |
| `parselab:load-project` | dashboard → tool | open dit sjabloon |
| `parselab:lang` / `parselab:settings` / `parselab:api` | dashboard → tool | taal, instellingen, serveradres |

Daardoor kun je in het dashboard doorlopen van PDF naar Excel, dashboard of rapport zonder
tussendoor te downloaden.

---

## 19. Als er iets misgaat

| Wat je ziet | Waar het aan ligt | Wat je doet |
|---|---|---|
| Alle cellen leeg | De regels zoeken labels die in dít document niet staan | Zet één regel tijdelijk op *Eigen patroon* met `.+` om te zien of er überhaupt tekst uit komt |
| Eén kolom leeg, de rest goed | Het label heet net anders ("Factuurnr." tegen "Factuurnummer") | Kort het zoekwoord in, of gebruik *Gebied op pagina* |
| Verkeerde waarde, uit het verkeerde deel | Hetzelfde label komt twee keer voor | Zet een **sectie** op die regel |
| "Geen tekstlaag" | Het document is een scan | Deze uitvoering kan dat niet; gebruik de Webflow-uitvoering met tekstherkenning |
| Leesfout op één bestand | PDF met een wachtwoord | Haal de beveiliging eraf en probeer opnieuw |
| Excel zet alles in één kolom | Excel staat op een andere lijstscheiding | Gebruik de `.xlsx`-knop in plaats van CSV |
| AI-knop staat er niet | *AI-herkenning gebruiken* staat uit | Zet hem aan onder Account |
| AI-knop geeft een foutmelding | Geen server, of geen sleutel op de server | Start de server met `PARSELAB_ANTHROPIC_KEY` |
| Bedragen kloppen niet | Subtotaal plus btw is niet het totaal | De AI-controle meldt dit; kijk het document na |

---

## 20. Wat de tool niet doet

- **Gescande documenten** zonder tekstlaag — geen tekstherkenning in deze uitvoering.
- **Meerdere rijen per document.** Nu is het één rij per PDF; de regeltabel uit een
  factuur halen vraagt een ander model.
- **Sjablonen delen** met collega's of tussen computers — ze staan per browser.
- **PDF's met een wachtwoord** geven een leesfout.

---

## 21. Voor ontwikkelaars

Eén bestand, geen build, geen afhankelijkheden buiten pdf.js (ingebakken). De code is
ouderwets leesbaar JavaScript met `var` en functies; geen framework.

| Waar je moet zijn | Wat |
|---|---|
| `TYPE_LABELS` | de zeven zoekregels; een nieuwe soort voeg je hier toe plus in `summarizeRule` en de toepasser |
| `EXPECT_LABELS` / `inferExpect` | de soorten waarden voor het opschonen |
| `applyMapping`, `applyExpect` | de omzetting van gevonden tekst naar de eindwaarde |
| `plSettings()` | de twee accountinstellingen |
| `DOC_DB` (`pdfScraperDocs`) | bewaarde documenten in IndexedDB |
| `kindModal` en omgeving | de soort document |

Tests: `tests/qa.mjs` loopt de tool mee door in het dashboard (uploaden, kolommen,
nakijken, downloaden, de AI-knop met toestemming). Proefdocumenten staan in
`tests/pdfs/` met de verwachte uitkomsten in `tests/pdfs/README.md`: onder andere een
factuur waarbij de waarde op de regel ónder het label staat, een met "Subtotaal" boven
"Totaal", een van zes pagina's, en één zonder tekstlaag.

Verder lezen: [`PARSEPDF-DOORKIJKEN.md`](PARSEPDF-DOORKIJKEN.md) (hoe het doorkijkscherm
en de herkenning werken), [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md)
(wat er nog komt), [`WEBFLOW-SITE.md`](WEBFLOW-SITE.md) (de uitvoering met login en
pakketten).
