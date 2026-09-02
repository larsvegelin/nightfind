# ParseLab Dashboard

Eén app-shell (navy zijbalk + crème werkgebied) voor alle ParseLab-software, gebouwd volgens `App — ParseLab Dashboard` en de tokens uit `DESIGN-parselab.md`.

## Bestanden

| Pad | Wat |
|---|---|
| `index.html` | Het dashboard. `state.view` = `overview` \| `form` \| `scrape` \| `pdf` \| `board`; `#<view>/werkbank` opent de echte tool. Tooldata in `toolDefs()`. |
| `tools/parsepdf.html` | ParsePDF (de PDF Scraper), ingebed in de werkbank. |
| `tools/parseboard.html` | ParseBoard (het Paneel, CSV → dashboard), ingebed in de werkbank. |
| `tools/extension/` | Browserextensie voor ParseForm en ParseScraper (uitgepakt). |
| `tools/parselab-extension.zip` | Zelfde extensie als download vanuit het dashboard. |

## Draaien

Statisch serveren (iframes en `localStorage` willen één origin):

```
cd parselab && python3 -m http.server 8080
```

Open `http://localhost:8080/#overview`.

## Hoe de tools zijn verwerkt

- **ParsePDF** en **ParseBoard** draaien als iframe in een witte werkbank-kaart. Ingebed (`?embed=1` of in een frame) nemen ze de ParseLab-tokens over en verbergen ze hun eigen kop en voet; los geopend zien ze er uit zoals voorheen.
- **ParseForm** en **ParseScraper** zijn één Chrome-extensie. Hun werkbank is een installatiepaneel met download, handleiding en MCP-notitie.
- De zijbalk-tellers voor ParsePDF (sjablonen) en ParseBoard (opgeslagen dashboard) lezen uit de `localStorage` van de ingebedde tools; de rest is voorbeelddata tot er echte runs zijn.
