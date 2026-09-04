# Tests

`qa.mjs` doorloopt het hele dashboard met Playwright: inloggen, overzicht, zoeken, account-instellingen, ParseScraper (adres → aanwijzen → element wisselen → volgende pagina → uitlezen → Excel/CSV → taak bewaren → hernoemen → verwijderen), Bestanden, ParsePDF (uploaden, sjabloon, Excel bewaren), ParseBoard (CSV → dashboard → opslaan), ParseForm-installatiepaneel, mobiel, uitloggen en het dashboard zonder server.

Vooraf, in drie terminals:

```
cd parselab && PARSELAB_ALLOW_PRIVATE=1 node server/server.js          # ParseLab op 8080 (lokale testsite toestaan)
cd parselab/tests/site && python3 -m http.server 9000                   # testwinkel
cd .. && python3 -m http.server 8765                                    # map boven parselab, voor "zonder server"
```

Dan: `cd parselab/tests && node qa.mjs`. Resultaat staat in `qa-result.txt`, schermafbeeldingen in `shots/`. Playwright moet vindbaar zijn (`npm install` in `parselab`).

De extensie heeft een eigen test in `tools/extension/` (zie README daar).
