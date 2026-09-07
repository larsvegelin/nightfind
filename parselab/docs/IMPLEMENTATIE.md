# ParseLab implementeren

Alles wat er is, hoe je het live zet, en in welke volgorde. Eén document om vanuit te werken; per onderdeel staat erbij waar het uitgebreider beschreven is.

---

## 1. Wat je in handen hebt

| Bestand | Wat het is | Waar het voor is |
|---|---|---|
| `parselab/ParseLab.html` | Het hele dashboard met de drie webtools erin, 2,8 MB | Dubbelklikken en werken, zonder installatie. Website uitlezen vraagt de server. |
| `parselab/ParsePDF.html` | ParsePDF als losse pagina, 101 kB | Op elke webhost te zetten; werkt met de Supabase-login. |
| `parselab/dist/parsepdf.js` + `embed-loader.html` | Dezelfde ParsePDF als één script | **De makkelijkste weg voor Webflow:** één embed in plaats van veertien. |
| `parselab/webflow/*.html` | De zestien embeds, elk onder de 10.000 tekens | De plakweg, als je liever geen extern script laadt. |
| `parselab/tools/parsescraper.html` | ParseScraper als los bestand | Werkt met de ParseLab-server ernaast; zonder server zegt hij dat. |
| `parselab/tools/parseboard.html` | ParseBoard als los bestand | Werkt volledig in de browser, geen server nodig. |
| `parselab/tools/parselab-extension.zip` | De browserextensie | Formulieren invullen en uitlezen op pagina's waar je moet inloggen. |
| `parselab/server/server.js` | De server | Website uitlezen, taken plannen, en alle AI-eindpunten. |

---

## 2. De snelste weg naar iets werkends

**Vandaag, zonder server:** stuur `ParseLab.html` naar jezelf en dubbelklik. ParsePDF en ParseBoard werken volledig, ParseForm toont de extensie-uitleg, Website uitlezen zegt dat de server niet draait. Goed genoeg om iemand te laten zien wat het is.

**Deze week, op de site:** zet ParsePDF op je Webflow-pagina volgens §3, met de loader. Zet de server erbij volgens §4 zodra je Website uitlezen of de AI-knoppen wilt.

---

## 3. ParsePDF op de site

### 3.1 Met één embed (aanbevolen)

1. Publiceer `parselab/dist/parsepdf.js` op een plek met een vast adres. De GitHub Pages-workflow in deze repo doet dat al: `https://larsvegelin.github.io/nightfind/parselab/dist/parsepdf.js`.
2. Maak in Webflow de pagina `/tools/parsepdf-tool`, zet **Exclude from search results** aan.
3. Plaats een lege `<div id="pl-parsepdf-root"></div>` en daaronder één embed: de inhoud van `parselab/dist/embed-loader.html`. Pas daarin het adres van `parsepdf.js` aan als je het ergens anders neerzet.
4. Klaar. Bij elke nieuwe versie bouw je opnieuw (`node parselab/webflow/bouw-bundel.mjs`) en publiceer je het script; de pagina hoef je niet aan te raken.

### 3.2 Met de losse embeds

Zestien blokken in deze volgorde onder dezelfde lege container: `1-config-stijl`, `2-teksten`, `3-teksten-voorstel`, `3b-teksten-labels`, `4-motor`, `4b-ocr`, `5-scherm`, `5b-eisen`, `6-structuur`, `7-velden`, `8-voorstel`, `9-labels`, `9b-uitleg`, `10-ai`, `11-sjablonen`, `12-verwerken`. De volgorde ligt vast: de laatste gebruikt wat de rest klaarzet. Details in [`INTEGRATIE.md`](INTEGRATIE.md).

### 3.3 Wat de gebruiker dan kan

Documenten kiezen (het eerste gaat meteen open), zien wat er uitgelezen wordt met gearceerde vlakken, per vlak een eigen labelnaam geven, alles selecteren of niets, alle tekst tonen inclusief de bestandsgegevens, door een stapel bladeren en met **Controleer alle documenten** per regel zien in hoeveel documenten hij iets vindt, parsen op eisen (bij een woord, soort waarde, pagina, kolom; ook door een zin aan de AI te geven), sjablonen in mappen bewaren die vanzelf herkend worden, tekst laten herkennen bij een scan, en met een betaald pakket de AI laten meekijken. Uitgebreid in [`PARSEPDF-DOORKIJKEN.md`](PARSEPDF-DOORKIJKEN.md); de uitleg voor bezoekers staat kant-en-klaar in [`SITE-UITLEG-PARSEPDF.md`](SITE-UITLEG-PARSEPDF.md).

---

## 4. De server

```
cd parselab
npm install            # eerste keer: Playwright met Chromium
node server/server.js  # http://localhost:8080
```

Online: `Dockerfile`, `railway.json` en `render.yaml` staan klaar. Kies de map `parselab`, zet een volume op `/app/server/data`.

| Variabele | Waarvoor |
|---|---|
| `PARSELAB_PORT` | poort, standaard 8080 |
| `PARSELAB_API_TOKEN` | zet dit zodra de server op internet staat |
| `PARSELAB_PROXIES` | proxylijst voor Website uitlezen |
| `PARSELAB_ANTHROPIC_KEY` | de sleutel waarmee de server Claude aanroept |
| `PARSELAB_AI_MODEL` | standaard `claude-opus-5` |
| `PARSELAB_SUPABASE_URL` + `PARSELAB_SUPABASE_KEY` | zet je die, dan eisen de AI-eindpunten een ingelogde gebruiker met een pakket dat het toelaat |

**De AI-eindpunten** (alle vijf dezelfde regels: sleutel op de server, pas na een duidelijke ja van de gebruiker, één document of pagina per aanroep):

| Eindpunt | Voor | Wat er heen gaat |
|---|---|---|
| `POST /api/parsepdf/velden` | ParsePDF | tekst van dat ene document plus de gevonden velden |
| `POST /api/parsepdf/regel` | ParsePDF | alleen de zin van de gebruiker ("het totaalbedrag onderaan pagina 1"); nooit het document |
| `POST /api/parsepdf/detect` | ParsePDF (tool) | tekst van dat ene document |
| `POST /api/scrape/kolommen` | ParseScraper | kolomnamen en drie voorbeeldwaarden |
| `POST /api/board/panelen` | ParseBoard | kolomnamen en drie voorbeeldrijen |

---

## 5. Supabase

Nodig voor de Webflow-versie: inloggen, verbruik tellen en de pakketcontrole.

| Onderdeel | Wat het moet doen |
|---|---|
| `profiles` | per gebruiker minstens `locale` en het pakket |
| `plans` | de drie pakketten met `monthly_limit` (50 / 2.500 / 15.000) en `ai` (false / true / true) |
| `usage_summary()` | geeft `used`, `monthly_limit` en het pakket terug |
| `record_usage(p_tool, p_pages)` | telt verbruik op en weigert boven de limiet; `parsepdf-ai` telt de AI-tegoeden |
| `ai_allowed()` | geeft terug of dit pakket de AI mag gebruiken |

```sql
create or replace function ai_allowed() returns boolean language sql security definer as $$
  select coalesce((select p.ai from profiles pr join plans p on p.id = pr.plan_id
                   where pr.id = auth.uid()), false);
$$;
```

Row level security op alles; documenten zelf worden nergens opgeslagen.

---

## 6. Website uitlezen: in het dashboard, los, of met de extensie

Drie manieren, met elk hun reden:

| Manier | Wanneer | Wat je nodig hebt |
|---|---|---|
| **In het dashboard** | dagelijks werk, taken plannen | de server; open `http://localhost:8080` of je eigen adres |
| **Los bestand** (`tools/parsescraper.html`) | snel iets uitlezen zonder de schil | de server ernaast; zonder server zegt de tool wat je moet starten |
| **Extensie** | pagina's waar je moet inloggen, en formulieren invullen | `parselab-extension.zip` in Chrome, Edge of Brave |

De extensie werkt in je eigen browser met jouw sessie; die gegevens verlaten je computer niet. Het dashboard ziet dat de extensie er is (`parselab:extension`) en toont dat in de werkbank. De grenzen van de server liggen vast en zijn niet in te stellen: alleen http(s) naar openbare adressen, robots.txt wordt gerespecteerd, minimaal 2 seconden per website, hoogstens 2 pagina's tegelijk en 25 per ronde. Wat er nog bij moet, staat in [`PARSESCRAPER-VOLGENDE-VERSIE.md`](PARSESCRAPER-VOLGENDE-VERSIE.md).

---

## 6b. De tools aan elkaar knopen

De vier tools staan niet los van elkaar; wat de een oplevert gaat door naar de volgende.

```
Website uitlezen ─┐
                  ├─► Overzicht maken (ParseBoard) ─► bewaren als project
Documenten uitlezen ┘
                  └─► Formulieren invullen (ParseForm, via de extensie)
```

- In **ParseScraper** staat na een ronde de knop *Overzicht maken van deze rijen*.
- In **ParsePDF** staat op de downloadstap *Maak er een overzicht van*, naast *Vul hiermee een formulier in*.
- Beide sturen `parselab:handover { naar, naam, kolommen, rijen }` naar de schil. Die onthoudt het pakket, gaat naar de gekozen tool en levert het af met `parselab:data` zodra die tool `parselab:ready` meldt. ParseBoard laadt de rijen als eigen bron en springt naar stap 2, waar je de kolomtypen controleert.
- Er gaat niets over het internet: het blijft binnen de browser, van het ene iframe naar het andere via de schil.

## 7. Het dashboard

`parselab/index.html` is de schil: inloggen, overzicht, projecten, bestanden, hulp, en per tool een werkbank. Elke tool heeft nu een knop **Hoe werkt …?** met een rondleiding van vijf stappen. Opbouw, berichtenprotocol, vormgeving en wat er nog ontbreekt: [`DASHBOARD-VOLGENDE-VERSIE.md`](DASHBOARD-VOLGENDE-VERSIE.md).

Online zetten kan op twee manieren: statisch via GitHub Pages (`.github/workflows/pages.yml`, alles werkt behalve Website uitlezen), of met de server erbij op Railway, Render of Fly.io.

---

## 8. Testen

```
cd parselab && node server/server.js            # 8080
cd parselab/tests/site && python3 -m http.server 9000
cd .. && python3 -m http.server 8765            # map boven parselab

cd parselab/tests
node qa.mjs          # 98 controles over het hele dashboard en de tools
node styleguide.mjs  # 16 controles op de vormgeving
node webflow.mjs     # 101 controles op de ParsePDF-embeds (start zelf wat hij nodig heeft)
```

In `parselab/tests/pdfs/` staan acht proefdocumenten met de uitkomsten die eruit horen te komen, waaronder een webshopfactuur met kolomkoppen, een formulier met labels naast de waarden, en een scan zonder tekstlaag.

---

## 9. Volgorde die ik zou aanhouden

1. **ParsePDF live** met de loader en de Supabase-tabellen uit §5. Dat is het stuk dat af is.
2. **De server erbij** zodra je de AI-knoppen of Website uitlezen wilt aanbieden; zet meteen `PARSELAB_API_TOKEN`.
3. **Echt inloggen** in het dashboard (nu is het een formaliteit) — dat blokkeert alles wat met team en delen te maken heeft.
4. **Verbruik en AI-tegoeden zichtbaar** in de schil, zodat mensen weten wat ze opmaken.
5. **ParseScraper uitbreiden** met de voorbeeldtabel en het verschil tussen ronden; dat maakt er een bewakingstool van.
6. **Team en rollen**, pas als 3 er is.

---

## 10. Wat er bewust niet in zit

Inloggen op sites of captcha's omzeilen (dat is de extensie, met jouw eigen account), sneller uitlezen dan twee seconden per website, documenten bewaren op onze server, en een dashboard dat je zelf met widgets in elkaar sleept. De rest van de grenzen staat per tool in de documenten waarnaar hierboven verwezen wordt.
