# Het ParseLab-dashboard: opbouw, vormgeving en wat er nog bij moet

Het dashboard is de schil om de vier tools heen: inloggen, overzicht, je projecten, bestanden, hulp, en per tool een werkbank. Dit stuk beschrijft hoe het in elkaar zit, hoe het eruit hoort te zien, en welke functies eraan ontbreken — inclusief de AI-hulp per tool.

---

## 1. Hoe het in elkaar zit

**Eén bestand, geen framework.** `parselab/index.html` is het hele dashboard: vanilla HTML, CSS en JavaScript. De tools draaien in een iframe eronder (`tools/parsescraper.html`, `parsepdf.html`, `parseboard.html`) en praten met de schil via `postMessage`.

**Routering** loopt via de hash: `#overview`, `#scrape/url`, `#pdf/upload/sjabloon-3`, `#board/6`. Dat betekent: elke stap is een adres dat je kunt delen en waar de terugknop van je browser op werkt.

**De berichten tussen schil en tool** (uit `README.md`, hier compleet):

| Bericht | Richting | Betekenis |
|---|---|---|
| `parselab:nav {section}` | schil → tool | ga naar deze stap |
| `parselab:load-project {project}` | schil → tool | open dit project |
| `parselab:lang {lang}` | schil → tool | taal |
| `parselab:settings {…}` | schil → tool | de schakelaars uit Account |
| `parselab:user {email}` | schil → tool | wie er is ingelogd |
| `parselab:rename-project` / `parselab:delete-project` | schil → tool | naam of verwijdering uit de zijbalk |
| `parselab:ready` / `parselab:section {section, max}` | tool → schil | de tool draait / staat hier |
| `parselab:projects {tool, list}` | tool → schil | volledige projectlijst |
| `parselab:project {tool, id, name, payload, open}` | tool → schil | één project bewaard |
| `parselab:stats {tool, …}` | tool → schil | tellers voor de zijbalk |
| `parselab:open {view, section}` | tool → schil | open een andere tool |
| `parselab:file {…}` | tool → schil | een bestand voor Bestanden |
| `parselab:extension {version}` | extensie → schil | de extensie is aanwezig |

**Opslag.** `parselab-projects`, `parselab-project-overrides` (een naam of verwijdering uit de schil wint van wat de tool zegt), `parselab-settings`, `parselab-session`, en IndexedDB `parselab-files` voor bewaarde documenten. Met server erbij gaat hetzelfde via `/api/store/:key`, gesleuteld op het e-mailadres, zodat je het op een tweede computer terugziet.

---

## 2. Waar het schuurt

1. **Inloggen is een formaliteit.** Je typt een adres en je bent binnen; er wordt geen link verstuurd. Alles wat "per gebruiker" heet is daarmee scheiding, geen beveiliging.
2. **Geen team.** Eén persoon, één browser. Een collega ziet niets van jouw projecten, en dat is voor een kantoor de eerste vraag.
3. **Het overzicht telt, maar vertelt niets.** Je ziet hoeveel taken en sjablonen je hebt, niet wat er gisteren gebeurde: welke taak liep, wat er misging, wat er nieuw is.
4. **Zoeken is één veld over namen.** Niet over de inhoud van projecten, niet over bestanden.
5. **Bestanden is een lijst.** Geen mappen, geen labels, geen zoeken in de inhoud.
6. **Geen geschiedenis.** Wat er drie ronden geleden uitkwam is weg zodra je het bestand kwijt bent.
7. **Vier tools, één maat.** Elke tool krijgt dezelfde werkbank, terwijl ParseBoard eigenlijk het hele scherm wil en ParseForm vooral uitleg is.

---

## 3. Vormgeving

Alles staat in `DASHBOARD-styleguide.md`; dit is wat er in de praktijk toe doet en wat de tests bewaken.

**Palet.** Navy `#1F3A5F`, inkt `#16293F`, crème `#F2F0E7`, off-white `#FBFAF6`, goud `#C9A961`, blauw `#2C6FA8` (op tint: `#215A88`), bijschrift `#4A5A6C`, veldrand `#8A90A5`, rood `#8A3B2E`, uit-stip `#B9C3CE`. Elke tekstkleur haalt 4,5:1 op zijn ondergrond; dat wordt gerekend in `tests/styleguide.mjs`, niet op gevoel beoordeeld.

**Schaal.** 34 / 30 / 24 / 16 / 15 / 13 px. Ruimte in stappen van 4 tot 64. Radius 20 (kaart), 14 (knop), 12 (veld), 9 (klein), 999 (pil). Precies twee schaduwen. Breekpunten op 992, 768 en 480.

**Focus.** `2px solid #C9A961` met 3px afstand, op alles wat je met Tab kunt bereiken. Aanraakvlakken minstens 44px.

**Naamgeving.** Componenten dragen `pld-` namen (`pld-card`, `pld-btn`, `pld-text`, `pld-caps`, `pld-table`, `pld-in`), zodat dezelfde namen in Webflow werken. `plp-` is voor wat specifiek bij een tool hoort.

**Vijf toestanden per scherm, allemaal ontworpen:** leeg, aan het laden (een skelet, geen woord "Laden…"), gevuld, fout, en geweigerd. Bij het laden dus grijze balkjes in de vorm van wat er komt.

**Beweging** is kort en met een reden: 150–250 ms, en niets beweegt als `prefers-reduced-motion` aan staat.

---

## 4. Functies die erbij moeten

### 4.1 Echt inloggen
Een inloglink per mail (magic link), of Supabase-auth zoals de Webflow-versie van ParsePDF al gebruikt. Zolang dit er niet is, blijft "per gebruiker" een afspraak in plaats van een slot. Dit is de kop die van alle andere punten de voorwaarde is.

### 4.2 Team en rollen
Organisatie, leden, en per project wie eigenaar is. In de opslag betekent dat: `owner` wordt `org_id` plus `created_by`, en de sleutel van `/api/store/:key` wordt de organisatie in plaats van het e-mailadres. Rollen: beheerder (facturatie, leden), gebruiker (alles behalve dat), meekijker (alleen resultaten).

### 4.3 Een overzicht dat iets zegt
Bovenaan drie dingen die er gisteren gebeurden: taken die liepen (met uitkomst), documenten die uitgelezen zijn, en wat er misging. Daaronder pas de vier ingangen. Nu staat het andersom.

### 4.4 Geschiedenis per project
Elke ronde bewaren met datum, aantal rijen en het bestand. Een lijstje "laatste 10 ronden" in de zijbalk van een project, met downloadknop per ronde. Vraagt opslag op de server (nu bewaart hij alleen de laatste run).

### 4.5 Bestanden: mappen, labels en zoeken
Dezelfde mappen als in ParsePDF, plus zoeken in de inhoud van CSV's en de tekst van PDF's. Bestanden staan al in IndexedDB; er is alleen een index nodig.

### 4.6 Meldingen
Eén plek waar staat wat er is gebeurd terwijl je weg was: taken die liepen, taken die vielen, limieten die vol raakten. Met een belletje in de kop en, als de mailweg er is, een dagelijkse samenvatting.

### 4.7 Verbruik zichtbaar
Wat de Webflow-versie van ParsePDF al toont (pagina's van je maandlimiet) hoort in de schil te staan, voor alle tools samen: pagina's, uitleesronden en AI-tegoeden, met een balk en een grens.

### 4.8 Werkbank per tool
ParseBoard krijgt het volle scherm zodra hij een overzicht toont; ParseForm krijgt uitleg plus de extensieknop in plaats van een lege werkbank. Kleine ingreep, groot verschil in hoe af het voelt.

---

## 5. AI-hulp in het dashboard

De regel is overal dezelfde: **de sleutel staat op de server, er gaat niets weg zonder een duidelijke ja, en het is één document of één pagina per aanroep.** In Account staat de schakelaar *AI-herkenning gebruiken*, standaard uit; staat hij uit, dan zie je de knoppen niet.

**Wat er nu werkt:**

| Waar | Knop | Wat er heen gaat | Eindpunt |
|---|---|---|---|
| ParsePDF (Webflow) | Uitlezen met AI | de tekst van dat ene document plus de al gevonden velden | `POST /api/parsepdf/velden` |
| ParsePDF (tool) | Laat ParseLab de velden herkennen | de tekst van dat ene document | `POST /api/parsepdf/detect` |
| ParseScraper | Kolommen benoemen met AI | kolomnamen en drie voorbeeldwaarden | `POST /api/scrape/kolommen` |
| ParseBoard | Overzicht voorstellen met AI | kolomnamen en drie voorbeeldrijen | `POST /api/board/panelen` |

ParseBoard krijgt terug welke kolom de datum is, waarop te groeperen, welke twee tot vier cijfers de moeite waard zijn en welke grafiek daarbij past, plus één zin over wat je ziet. Dat vult stap 3 en 4 in; je kunt alles daarna gewoon aanpassen.

**Instellingen op de server:**

| Variabele | Waarvoor |
|---|---|
| `PARSELAB_ANTHROPIC_KEY` | de Anthropic-sleutel waarmee de server Claude aanroept |
| `PARSELAB_AI_MODEL` | welk model, standaard `claude-opus-5` |
| `PARSELAB_SUPABASE_URL` + `PARSELAB_SUPABASE_KEY` | zet je die, dan eist elk AI-eindpunt een ingelogde gebruiker wiens pakket het toelaat |

Zonder sleutel antwoorden de eindpunten met 501 en zeggen de tools dat netjes; niets breekt. De pakketcontrole doet de database, met een functie in deze geest:

```sql
create or replace function ai_allowed() returns boolean language sql security definer as $$
  select coalesce((select p.ai from profiles pr join plans p on p.id = pr.plan_id
                   where pr.id = auth.uid()), false);
$$;
```

**Wat er daarna bij hoort:**

1. **AI-tegoeden in de schil.** Nu telt ParsePDF ze met `record_usage('parsepdf-ai', 1)`; de schil hoort te tonen hoeveel je er nog hebt, naast de pagina's.
2. **Eén AI-paneel per tool in Account.** Wat mag de AI zien, hoeveel is er gebruikt, en een knop om het per tool uit te zetten.
3. **"Wat wil je?" in ParseScraper**, zie [`PARSESCRAPER-VOLGENDE-VERSIE.md`](PARSESCRAPER-VOLGENDE-VERSIE.md) §5.
4. **Uitleg bij een fout.** Draait een taak stuk, dan mag de AI de foutmelding vertalen naar één zin met een voorstel. Kleine moeite, scheelt supportvragen.

---

## 6. Bouwvolgorde

| Fase | Wat | Waarom in deze volgorde |
|---|---|---|
| 1 | Echt inloggen (mail of Supabase) | alles daaronder hangt eraan |
| 2 | Verbruik en AI-tegoeden zichtbaar in de schil | mensen willen weten wat ze opmaken |
| 3 | Overzicht dat vertelt wat er gebeurd is + meldingen | maakt van een menu een werkplek |
| 4 | Geschiedenis per project | vraagt opslag, verdient een eigen ronde |
| 5 | Team en rollen | pas zinnig als inloggen echt is |
| 6 | Bestanden met mappen en zoeken | fijn, niet blokkerend |

---

## 7. Waaraan je meet of het klopt

`tests/qa.mjs` loopt nu 86 controles af over de hele schil: inloggen, overzicht, zoeken, account, elke tool, bestanden, mobiel, uitloggen, en het dashboard zonder server. `tests/styleguide.mjs` rekent 16 controles op de vormgeving: palet, contrastverhoudingen, typografie, raster, knophoogte, focusring, skelet bij het laden en de drie breedtes.

Wat per nieuwe functie erbij hoort:

- **inloggen**: met een verlopen link kom je niet binnen, en een tweede browser ziet niets van je projecten;
- **verbruik**: de balk loopt mee met een uitleesronde en de grens houdt echt tegen;
- **overzicht**: een taak die vannacht liep staat er 's ochtends, met uitkomst;
- **geschiedenis**: drie ronden geven drie bestanden, en de oudste blijft downloadbaar;
- **team**: een collega ziet een gedeeld project en een meekijker kan het niet wijzigen;
- **stijl**: elke nieuwe kaart of knop haalt dezelfde 16 controles.

---

## 8. Wat het dashboard bewust niet wordt

Geen bouwpakket met widgets die je zelf sleept, geen tweede ParseBoard, geen instellingenscherm met veertig schakelaars. Het is een schil: vier ingangen, je projecten, en per tool een korte flow. Alles wat daar niet aan bijdraagt hoort in een tool thuis, niet in de schil.
