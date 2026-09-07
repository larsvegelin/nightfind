# ParseLab — alle wijzigingen, van het begin tot nu

Dit is het complete overzicht van wat er aan ParseLab gebouwd en veranderd is, per ronde, zo precies mogelijk. De rondes staan in de volgorde waarin ze zijn gemaakt; de laatste ronde staat bovenaan onder *Wat er het laatst veranderde*. Bij elke ronde staat welke bestanden erbij horen, zodat je in de code terugvindt wat hier beschreven staat.

Alles staat op de branch `claude/parselab-dashboard-t6irh2` (pull request #1 in `larsvegelin/nightfind`). Elke ronde is met de drie testsuites gecontroleerd voordat hij is gepusht: `tests/qa.mjs` (dashboard en tools), `tests/styleguide.mjs` (vormgeving) en `tests/webflow.mjs` (ParsePDF-embeds). De teller van die suites staat bij elke ronde.

---

## Wat er het laatst veranderde (ronde 14)

**Vraag:** upload bovenaan; sjablonen netjes onder elkaar en te openen; "Regel toevoegen" boven de regels onder de kop *Handmatig parsen*; een tutorial die echt iets laat zien; alles uitvinken moet werken; parsen op specifieke eisen (positie, kolom, soort, een bepaald woord) met een AI die dat voor je invult; bij meerdere pdf's laten zien dat het op alle pdf's geparsed is; en dit document.

### Indeling van het scherm (`webflow/5-scherm.html`, `webflow/11-sjablonen.html`)

- De uploadkaart (sleepvlak, *Bestanden kiezen*, de lijst met gekozen bestanden en *Uitlezen starten*) staat nu direct onder de kop, vóór de verbruiksmeter. Eerst stond hij onderaan, onder de regels.
- De regelsectie heet *Handmatig parsen* (`t.manual`); de knop *Regel toevoegen* staat erboven en zet een nieuwe lege regel bovenaan (`S.regels.unshift`), niet onderaan.
- In de mappenkaart staan de sjablonen van de gekozen map onder elkaar, elk met *Openen*. Openen kopieert de regels van het sjabloon naar het regelvenster, onthoudt het sjabloon-id (`S.sjabloonId`), bewaart de regels in `localStorage` en meldt *Sjabloon … staat nu in het scherm*. Zo pas je een bestaand sjabloon aan en bewaar je het opnieuw.
- De teksten hiervoor staan in de nieuwe embed `3b-teksten-labels.html`; `drop` in het labelvenster botste met `drop` van het sleepvlak en heet nu `keepField`/`dropField`.

### Parsen op eisen (`webflow/5b-eisen.html`, nieuw; `4-motor.html`, `12-verwerken.html`, `server/server.js`)

- Nieuw soort veldregel **`eis`** naast `label`, `regex`, `bestand`, `cel` en `tabelkolom`. Een eis is `{woord, soort, pagina, kolom}`; wat leeg is telt niet mee, wat ingevuld is moet allemaal kloppen.
- `PLP_EIS.pas(doc, eis)` loopt alle cellen langs: pagina en kolomindex (uit `PLP_ST.kolommen`, van links geteld, 6 punten speling) filteren; `soort` is een patroon uit `6-structuur.html` (datum, bedrag, IBAN, e-mail, kenmerk, postcode, telefoon) en alleen het gematchte stuk wordt de waarde; `woord` moet op een woordgrens staan in de cel, in de cel links ervan of in de cel erboven, zodat *Totaal* niet *Subtotaal* pakt. Zonder soort wordt de rest van de cel na het woord de waarde, anders de cel rechts of eronder. Bij meer kandidaten wint de bovenste op de vroegste pagina.
- De kaart *Parsen op eisen* onder *Handmatig parsen*: kolomnaam, bij het woord, soort waarde, pagina, kolom, en *Eis toevoegen*. De regel komt bovenaan in het regelvenster met een leesbare omschrijving (*na 'Totaal' · Bedrag · pagina 1*), het opschoonfilter wordt automatisch bedrag of datum. In het regelvenster is `eis` ook als soort te kiezen.
- **Eis maken met AI**: een zin (*het totaalbedrag onderaan pagina 1*) gaat naar `POST /api/parsepdf/regel`; de server (`noemRegel`) laat Claude er `{naam, eis}` van maken, controleert soort/pagina/kolom en stuurt het terug; de vier velden worden ingevuld, de gebruiker klikt zelf op Eis toevoegen. Alleen de zin gaat heen, nooit het document. Dezelfde `magAi`-drempel als de andere AI-routes (ingelogd, pakket met AI, anders 401/402), en zonder `PARSELAB_ANTHROPIC_KEY` een nette 501.
- `4-motor.html` past `eis`-regels toe via `PLP_EIS.pas`; `12-verwerken.html` telt ze als bruikbaar.

### Controle over alle documenten (`webflow/12-verwerken.html`, `8-voorstel.html`)

- Knop **Controleer alle documenten** naast *Regels bewaren*. Elk klaargezet document wordt lokaal gelezen en de actieve regels worden erop losgelaten; per regel komt er een kaart met *gevonden in g van n* (blauwe pil als het overal lukte) en, waar hij mist, *Niet in: bestand-a.pdf, bestand-b.pdf*. Kost geen pagina's van het tegoed.
- Na **Overnemen** in het doorkijkscherm draait die controle vanzelf zodra er meer dan één document klaarstaat.

### Tutorial met voorbeeld (`webflow/9b-uitleg.html`)

- Elke stap van *Hoe werkt ParsePDF?* heeft nu **Probeer het met een voorbeeld**. Een verzonnen factuur van één pagina (ingebakken als base64, 1 kB, geen echte gegevens) wordt als bestand toegevoegd en opent meteen in het doorkijkscherm met factuurnummer, datum, klantnummer, e-mail, totaal en IBAN erin.

### Uitvinken (`webflow/8-voorstel.html`)

- Een los vinkje in de lijst werkte al door in de vlakken, maar de teller *n van t aan* liep niet mee; nu wel (`balk.bijwerken()` bij elke wijziging). *Niets selecteren*, *Alles selecteren* en *Weglaten* in het labelvenster zijn opnieuw getest.

### Overig

- `3-teksten-voorstel.html` zat op 10.081 tekens, net over de Webflow-limiet; `aiPlanText` is naar `3b` verhuisd (nu 9.447).
- Bouwscripts en het proefharnas kennen de twee nieuwe embeds; `dist/parsepdf.js`, `ParsePDF.html` en `ParseLab.html` zijn opnieuw gebouwd.
- Tests: `webflow.mjs` 92 → 101 controles (voorbeeldknop, AI vult een eis in, eis staat bovenaan en beschrijft zichzelf, controle telt 2 van 2 en noemt ontbrekende bestanden, eis leest Totaal en niet Subtotaal, los vinkje uitzetten). `qa.mjs` 98, `styleguide.mjs` 16.
- Documentatie: `INTEGRATIE.md`, `IMPLEMENTATIE.md`, `SITE-UITLEG-PARSEPDF.md` (0. Eerst even proberen, 5b. Parsen op eisen, 5c. Controleer alle documenten), `PARSEPDF-DOORKIJKEN.md` (4c), `webflow/README.md`, en dit bestand.

---

## Ronde 1 — het dashboard (`1e9cd48`, `317a223`, `ade4750`)

- `parselab/index.html`: één dashboard met hash-routing en een werkbank waarin elke tool in een iframe draait. Vier tools: ParseForm (browserextensie), ParseScraper, ParsePDF, ParseBoard.
- postMessage-protocol tussen schil en tool: schil → tool `parselab:nav`, `parselab:lang`, `parselab:settings`, `parselab:load-project`, `parselab:user`, `parselab:rename-project`, `parselab:delete-project`; tool → schil `parselab:ready`, `parselab:section`, `parselab:stats`, `parselab:projects`, `parselab:project`, `parselab:open`, `parselab:file`.
- Navigatie van de tools in de zijbalk gevouwen; per element een UX- en beveiligingsreview in `docs/` (`dashboard.md`, `parseform.md`, `parsescraper.md`, `parsepdf.md`, `parseboard.md`, `00-overzicht.md`) en de aanbevelingen daaruit toegepast.

## Ronde 2 — de tools volgens hun ontwerpdocumenten (`300987f`, `3062a89`, `4bc44c6`)

- `tools/parsepdf.html` volgens `docs/parsepdf.md`: veldregels (label, regex, bestandsnaam), opschoonfilters bedrag/datum, CSV met puntkomma en BOM, statustabel in het document.
- Extensie volgens `docs/parseform.md` en `docs/parsescraper.md`: formulieren vullen, tabellen lezen.

## Ronde 3 — server, projecten, launcher (`12777b9`, `268bf92`, `fe69c79`, `a55ffa7`)

- `server/server.js`: *Website uitlezen* aan de serverkant met proxies (`PARSELAB_ALLOW_PRIVATE` voor lokale adressen), projecten per tool op schijf, taken.
- Launcher-overzicht, sjablonentab in ParsePDF, minimale dashboardstart zonder voorbeelddata, ParseScraper in drie stappen, projecten in elke tool.
- Flow-rail met wisselen tussen elementen, accountveiligheid in instellingen, bewaarde bestanden, startscripts.
- Overzicht naar het *ParseLab Start*-ontwerp: een bewegend beeld per tool, projectrijen met minigrafieken.

## Ronde 4 — testronde en verbeterpunten (`90d6471`, `2eca920`)

- Projecten hernoemen en verwijderen synchroniseren met de tools; servermap afgeschermd; browserherstel; zoeken over tools; `tests/qa.mjs` als QA-set; `docs/verbeterpunten.md`.
- Verbeterpunten uitgevoerd: mobiel menu, taken per gebruiker (`x-parselab-user` alleen als scheiding, met `PARSELAB_API_TOKEN` als echte drempel), sync via server, AI-herkenningsendpoint `POST /api/parsepdf/detect` (alleen met `PARSELAB_ANTHROPIC_KEY`), charset, 413 bij te grote body, meerdere ParseBoard-overzichten, CI (`.github/workflows/qa.yml`).

## Ronde 5 — online zetten (`b81c21f` t/m `d42ff91`)

- GitHub Pages-workflow voor het statische deel (alleen vanaf `main`), Dockerfile met Railway/Render-config, de extensie kent het github.io-adres; CI gebruikt Chromium van Playwright als `/opt/pw-browsers` ontbreekt.

## Ronde 6 — stijlgids en één bestand (`32379d3`)

- `docs/DASHBOARD-styleguide.md` toegepast op het dashboard (kleuren, typografie, knoppen, kaarten), `tests/styleguide.mjs` met 16 controles, `build-eenbestand.mjs` maakt `ParseLab.html` als één bestand (sinds ronde 12 niet meer in git; bouw hem lokaal).

## Ronde 7 — ParsePDF voor Webflow (`8213d41`, `f78bbe4`)

- Vijf embeds in `webflow/` (`1-config-stijl`, `2-teksten`, `3-motor`, `4-scherm`, `5-verwerken`) voor de Webflow-pagina met Supabase erachter: sessiecontrole, verbruiksmeter uit `get_usage`, `record_usage` vóór het lezen, teksten in nl/en/de, drie startsjablonen, limiet 25 MB en 100 bestanden.
- `docs/INTEGRATIE.md` (plaatsing in Webflow), `tests/webflow-proef.mjs` (proefopstelling met een Supabase-namaak: `?ingelogd=0&gebruikt=&limiet=&taal=&weigeren=1&plan=`) en `tests/webflow.mjs`.
- `docs/LANCERING.md` en `webflow/bouw-pagina.mjs` → `ParsePDF.html` als losse pagina om als eerste live te gaan.

## Ronde 8 — proef-PDF's (`0a0db52`)

- `tests/pdfs/maak-pdfs.mjs` maakt acht proefdocumenten met een echte tekstlaag (factuur-alpha/beta/gamma/groot, bankafschrift, polis, later factuur-webshop, formulier en gescand) plus `README.md` met de uitkomsten die eruit horen te komen.
- Twee fouten in het uitlezen van labels verholpen: een label met de waarde op de regel eronder, en *Subtotaal* dat *Totaal* kaapte.

## Ronde 9 — de tool kijkt zelf in het document (`35aead4`, `4ba6119`)

- Ontwerp in `docs/PARSEPDF-VOLGENDE-VERSIE.md`: mappen met sjablonen, veldherkenning, AI-controle, datamodel voor Supabase.
- Embeds uitgebreid en hernummerd naar elf: `6-structuur.html` (cellen met x/y/breedte/hoogte/rij/pagina, kolommen, patronen IBAN/btw/KvK/e-mail/url/telefoon/postcode/bedrag/datum/percentage/kenmerk, `labelachtig`, `pas(doc, vindregel)` voor patroon/inline/rechts/kolomkop/onder/plek/meta/bestand), `7-velden.html` (kandidaatvormen met een score: kolomkop 0.9, label rechts 0.85, label in de cel 0.8, label erboven 0.7, patroon 0.6; ontdubbelen per vak en per waarde; regeltabel), `8-voorstel.html` (doorkijkscherm: document getekend met pdf.js, gearceerde vlakken, naam bij hover, voorstel met vinkjes, *Overnemen*), `3-teksten-voorstel.html`.
- Nieuw soort veldregel **`cel`**: bewaart hoe een waarde gevonden werd, niet waar hij stond, zodat een sjabloon ook op de factuur van volgende maand werkt.
- *Uitlezen met AI* met toestemming vooraf: `POST /api/parsepdf/velden` (`noemVelden`) benoemt de gevonden velden, vult aan en telt bedragen na.
- `docs/PARSEPDF-DOORKIJKEN.md`.

## Ronde 10 — mappen met sjablonen (`75008cc`)

- `sjablonen.html`: mappen in `localStorage` (`pl_parsepdf_mappen`), sjabloon bewaren vanuit het doorkijkscherm, vingerafdruk per sjabloon (gebruikte labels, vaste teksten, genormaliseerde kolomposities, harde kenmerken), score (3 per hard kenmerk, 1 per tekst tot 6, 2 per kolompatroon), `kies` met drempel 3 en *zeker* vanaf 6.
- `verwerken.html`: per document het sjabloon uit de map kiezen, kolommen van alle sjablonen in één tabel, kolom *Sjabloon*, samenvatting *Herkend: 1 × A · 1 × B* en *onbekend*, gebruik per sjabloon tellen.

## Ronde 11 — alle tekst, groter scherm, AI voor betaalde pakketten (`cc61be7`)

- *Toon alle tekst*: elk stukje tekst dat niet in het voorstel zat komt in de lijst, plus de gegevens van buiten de pagina (titel, auteur, maker, aanmaakdatum uit de PDF-info, bestandsnaam, grootte, gewijzigd). Wat je niet wilt vink je uit.
- Doorkijkscherm tot 1600 px breed, twee kolommen 1.35fr/1fr met een plakkende lijst.
- `10-ai.html`: pakketkaart voor gratis pakketten (`S.verbruik.plan`/`ai_allowed`), bearer-token mee naar de server, `record_usage('parsepdf-ai', 1)`. Server: `magAi` controleert het Supabase-token en de RPC `ai_allowed` als `PARSELAB_SUPABASE_URL/KEY` zijn gezet.
- `docs/SITE-UITLEG-PARSEPDF.md`: de uitleg voor bezoekers.

## Ronde 12 — document opent meteen, bladeren, label en waarde bij elkaar, AI in scraper en board (`30dfce3`)

- Het eerste nieuw gekozen document opent vanzelf in het doorkijkscherm; *Document i van n* met bladeren door de stapel.
- Formulierregels: een labelkolom met een waardekolom ernaast wordt herkend (`labelKolom`, score 0.95), zodat *Geboortedatum 01-01-1990* één veld is en *Adres* niet aan *Telefoon* gekoppeld wordt.
- ParseScraper: *Kolommen benoemen met AI* (`POST /api/scrape/kolommen`); ParseBoard: *Panelen voorstellen met AI* (`POST /api/board/panelen`).
- `docs/PARSESCRAPER-VOLGENDE-VERSIE.md`, `docs/DASHBOARD-VOLGENDE-VERSIE.md`.

## Ronde 13 — labels per vlak, selectie, goedkeuren, OCR, rondleidingen, één embed (`79b7082`)

- `9-labels.html`: klikken op een vlak opent een labelvenster (naam aanpassen, *Overnemen*, *Weglaten*, hoe de naam gevonden is); kolomkoppen krijgen automatisch een naam; *Alles selecteren* / *Niets selecteren* met teller; wat de AI verandert staat in een goedkeuringskaart met *Goedkeuren* en *Ongedaan maken*.
- `4b-ocr.html`: tekstherkenning met tesseract.js (van cdnjs) voor documenten zonder tekstlaag; de pagina wordt op schaal 2 getekend en de herkende woorden worden cellen met een eigen `top`.
- `9b-uitleg.html`: *Hoe werkt ParsePDF?* in vijf stappen; in het dashboard een rondleiding per tool (`TOUR`, modal *tour*, knoppen `[data-tour]`).
- `webflow/bouw-bundel.mjs` → `dist/parsepdf.js` en `dist/embed-loader.html`: één embed in plaats van veertien; de limiet van 10.000 tekens speelt dan niet meer.
- `docs/IMPLEMENTATIE.md`: hoe alles samen te zetten (server, Supabase, scraper los of als extensie, tests).

## Ronde 13b — vlakken op hoogte, structuurcontrole, tools aan elkaar (`e2bb4cf`)

- Vlakken worden vanaf de basislijn getekend (`top = (hoog − y − 0.8h) · schaal`, hoogte `h · 1.02`), zodat ze op een echte factuur op de tekst liggen; OCR-cellen gebruiken hun eigen `top`.
- Structuurcontrole per document (`PLP_SJ.controle`): *Lijkt op sjabloon A · 16 van 16 velden gevonden*, *Lijkt op A, maar de indeling wijkt af*, of *Past bij geen enkel sjabloon*.
- Tools aan elkaar: `parselab:handover {naar, naam, kolommen, rijen}` van tool naar schil en `parselab:data` van schil naar tool; ParseScraper en ParsePDF hebben *Naar ParseBoard*, ParseBoard laadt de rijen in stap 2.

---

## Vaste afspraken die in alle rondes gelden

- Persoonsgegevens gaan de repo niet in: de echte factuur die ter test is aangeleverd is nagebouwd als `tests/pdfs/factuur-webshop.pdf` met verzonnen gegevens.
- De Supabase publishable key mag in de browser staan; de service-role key nooit. AI-sleutels staan alleen op de server.
- AI doet nooit iets zonder een expliciete ja, stuurt één document (of bij eisen: één zin) per aanroep en hoort bij Pro en Business.
- Elke embed blijft onder de 10.000 tekens; wie daar geen zin in heeft gebruikt `dist/embed-loader.html`.
- Elke push is groen op de drie suites; CI draait ze ook.
