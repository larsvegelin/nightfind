# ParseLab — Simpeler, gebruiksvriendelijker, veiliger

Opdracht: ga per tool na waar het simpeler en gebruiksvriendelijker kan voor mensen zonder IT-achtergrond, waar de scraper vanuit de tool kan werken in plaats van als extensie, en waar het veiliger en simpeler kan. Per element staat het antwoord in het bestand van die tool.

| Bestand | Onderdeel | Basis van de analyse |
|---|---|---|
| `dashboard.md` | ParseLab Dashboard (de shell) | `parselab/index.html` |
| `parseform.md` | ParseForm (formulieren invullen) | `tools/extension/` (panel, README, manifest) |
| `parsescraper.md` | ParseScraper, inclusief "scraper zonder extensie" | `tools/extension/`, `mcp-server/` |
| `parsepdf.md` | ParsePDF | `tools/parsepdf.html` |
| `parseboard.md` | ParseBoard | `tools/parseboard.html` |

Elk element krijgt vier regels: **Nu** (wat er staat), **Simpeler** (voor iemand zonder IT-achtergrond), **Veiliger** (waar dat speelt) en **Prioriteit** (1 = eerst doen, 3 = later).

## Status

| Winstpunt | Status |
|---|---|
| 1. Eén taal | Toegepast in dashboard, extensie en ParsePDF (namen, woordenlijst, jargon achter "Gevorderd") |
| 2. Web Store | Voorbereid: één knop "Toevoegen aan Chrome" in het dashboard (`CONFIG.webstoreUrl`), IT-route eronder; de vermelding zelf moet worden ingediend |
| 3. Openbare sites vanuit het dashboard | Gebouwd en getest (`tests/qa.mjs`): `server/server.js` + `tools/parsescraper.html` (echte browser op de server, roterende proxies, robots.txt, planning). De extensie blijft voor ingelogde pagina's |
| 4. Geen API-sleutels in de browser | Toegepast: sleutelopslag verwijderd uit ParsePDF, herkenning loopt via een ParseLab-endpoint met opt-in per document |
| 5. Minder rechten | Toegepast in `manifest.json`: sitetoegang per website na toestemming, `debugger` optioneel |

## De vijf grootste winstpunten, over alle tools heen

1. **Eén taal in de hele suite.** Het dashboard zegt ParseForm, ParseScraper, ParsePDF en ParseBoard; de tools zelf heten nog "WebTool Scraper", "PDF Scraper" en "Paneel". Voor een gebruiker zijn dat zeven producten. Hernoem de tools, en schrap woorden als *regex*, *selector*, *attribuut*, *structuurpad*, *MCP*, *manifest* uit alles wat een gebruiker ziet. Prioriteit 1.
2. **Installatie via de Chrome Web Store in plaats van ontwikkelaarsmodus.** "Zip uitpakken, chrome://extensions, ontwikkelaarsmodus aan, uitgepakte extensie laden" is de grootste drempel in de hele suite. Eén knop "Toevoegen aan Chrome" haalt die weg. Dit is ook veiliger: de store controleert de code, updates gaan automatisch en niemand werkt met een oude kopie. Prioriteit 1.
3. **Openbare websites scrapen vanuit het dashboard, zonder extensie.** Voor alles wat zonder inloggen te zien is (webshops, vacaturesites, openbare registers) kan ParseLab de pagina zelf ophalen en laten aanwijzen in het dashboard. De extensie blijft alleen nodig voor ingelogde portalen en formulieren. Zie `parsescraper.md`, sectie "Scraper vanuit de tool". Prioriteit 1.
4. **Geen API-sleutels in de browser.** ParsePDF bewaart een Claude-sleutel in `localStorage` en roept de API rechtstreeks aan. Laat dat via ParseLab lopen (de gebruiker heeft dan gewoon een ParseLab-account, geen sleutel) of laat die functie weg. Prioriteit 1.
5. **Minder rechten in de extensie.** `<all_urls>` als host-permission plus een content-script op elke pagina plus `debugger` is veel voor een tool die "alleen werkt op de pagina waar jij op klikt". Vraag toegang per site wanneer de gebruiker het paneel opent, en zet print-naar-PDF (de reden voor `debugger`) achter een optionele toestemming. Prioriteit 1.

## Wat het dashboard al goed doet en zo moet blijven

- Eén navigatie, dezelfde opbouw per tool, één cijfer per kaart.
- "Vraagt aandacht" in mensentaal in plaats van foutcodes.
- Verbruik altijd zichtbaar zonder banner.
- De echte tools openen in dezelfde schil, met dezelfde kleuren.

## Volgorde van aanpak

| Fase | Wat | Waarom eerst |
|---|---|---|
| 1 | Naamgeving, Web Store-installatie, API-sleutel weg uit de browser, rechten inperken | Grootste drempel en grootste risico, weinig bouwwerk |
| 2 | Scrapen van openbare sites vanuit het dashboard; wizard-taal in alle tools; één gedeelde export | Haalt de extensie uit het pad van de meeste gebruikers |
| 3 | Sjablonen delen tussen tools (ParsePDF-velden → ParseForm-flow → ParseBoard-bron), accounts en teamrechten | Maakt van vier tools één product |
