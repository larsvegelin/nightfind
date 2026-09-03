# ParseLab

Eén schil voor vier tools: ParseForm, ParseScraper, ParsePDF en ParseBoard. Minimalistisch: een overzicht met vier ingangen en je projecten, en per tool een korte flow. Geen voorbeelddata; alles wat je ziet komt uit de tools zelf.

## Starten

```
cd parselab
node server/server.js
```

Open `http://localhost:8080`. De server serveert het dashboard én de serverkant van "Website uitlezen". Playwright met Chromium is nodig (`cd server && npm install` haalt het op).

Instellingen via omgevingsvariabelen:

| Variabele | Betekenis |
|---|---|
| `PARSELAB_PORT` | Poort, standaard 8080 |
| `PARSELAB_PROXIES` | Komma-gescheiden proxylijst (`http://user:pass@host:port`), of zet ze in `server/proxies.txt` (één per regel, zie `proxies.example.txt`). ParseLab wisselt per verzoek en slaat een proxy 10 minuten over na drie fouten. |
| `PARSELAB_API_TOKEN` | Zet je dit, dan vraagt de API een toegangscode (`x-parselab-token`); de tool vraagt er één keer om. |

## Mappen

| Pad | Wat |
|---|---|
| `index.html` | Het dashboard: inloggen, Overzicht, Bestanden, Hulp, en per tool de werkbank met stappen en projecten in de zijbalk. |
| `server/server.js` | Statische server + API voor Website uitlezen: pagina renderen met een echte browser, lijst uitlezen, taken plannen, Excel/CSV. |
| `tools/parsescraper.html` | ParseScraper zonder extensie: Adres → Aanwijzen → Klaar. |
| `tools/parsepdf.html` | ParsePDF: Uploaden → Aanwijzen → Controleren → Downloaden, plus Sjablonen. |
| `tools/parseboard.html` | ParseBoard: bestand → overzicht in zes stappen. |
| `tools/extension/` | Browserextensie voor ParseForm en voor ParseScraper op ingelogde pagina's. `tools/parselab-extension.zip` is dezelfde extensie als download. |
| `docs/` | Analyse per tool en status van toepassing. |

## Twee manieren van uitlezen

- **Vanuit het dashboard (server, met proxies):** voor alles wat zonder inloggen zichtbaar is. Plak een adres, klik één item aan, download of bewaar als taak die elk uur, elke dag of elke week draait terwijl je computer uit staat.
- **Met de extensie (in je eigen browser):** voor portalen waar je moet inloggen en voor formulieren invullen. Die gegevens verlaten je computer niet.

Grenzen die vaststaan in `server/server.js`: alleen http(s) naar openbare adressen, robots.txt wordt gerespecteerd, minimaal 2 seconden tussen verzoeken per website, maximaal 2 pagina's tegelijk en 25 pagina's per ronde, herkenbare user-agent. Geen omzeiling van captcha's of botbescherming.

## Projecten

Een project is wat je bewaart: een taak (ParseScraper, ParseForm), een sjabloon (ParsePDF) of een overzicht (ParseBoard). Projecten staan in de zijbalk onder de tool en op het overzicht; je geeft ze een naam bij "Nieuwe …", opent ze met één klik en hernoemt ze via "Naam". De tools melden hun projecten aan het dashboard:

| Bericht | Richting | Betekenis |
|---|---|---|
| `parselab:nav { section }` | dashboard → tool | Ga naar deze stap. |
| `parselab:load-project { project }` | dashboard → tool | Open dit project (`payload` is per tool: `taskId`, `template`, `saved`). |
| `parselab:lang { lang }` | dashboard → tool | Taal. |
| `parselab:ready` / `parselab:section { section, max? }` | tool → dashboard | De tool draait / staat op deze stap. |
| `parselab:projects { tool, list }` | tool → dashboard | Volledige projectlijst van de tool. |
| `parselab:project { tool, id, name, payload, open }` | tool → dashboard | Eén project bewaard; `open` = maak het actief. |
| `parselab:stats { tool, … }` | tool → dashboard | Tellers voor de zijbalk. |
| `parselab:open { view, section }` | tool → dashboard | Open een andere tool. |
| `parselab:extension { version }` | extensie → dashboard | De extensie is aanwezig (via `bridge.js`). |

## Wat nog een backend vraagt

De inloglink echt versturen, accounts en team, projecten synchroniseren tussen computers (nu lokaal in de browser plus de taken op de server), AI-herkenning in ParsePDF (`window.PARSELAB_API`), en de Chrome Web Store-vermelding (`CONFIG.webstoreUrl` in `index.html`).
