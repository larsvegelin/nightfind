# Tests

`qa.mjs` doorloopt het hele dashboard met Playwright: inloggen, overzicht, zoeken, account-instellingen, ParseScraper (adres → aanwijzen → element wisselen → volgende pagina → uitlezen → Excel/CSV → taak bewaren → hernoemen → verwijderen), Bestanden, ParsePDF (uploaden, sjabloon, Excel bewaren), ParseBoard (CSV → dashboard → opslaan), ParseForm-installatiepaneel, mobiel, uitloggen en het dashboard zonder server.

Vooraf, in drie terminals:

```
cd parselab && PARSELAB_ALLOW_PRIVATE=1 node server/server.js          # ParseLab op 8080 (lokale testsite toestaan)
cd parselab/tests/site && python3 -m http.server 9000                   # testwinkel
cd .. && python3 -m http.server 8765                                    # map boven parselab, voor "zonder server"
```

Dan: `cd parselab/tests && node qa.mjs`. Resultaat staat in `qa-result.txt`, schermafbeeldingen in `shots/`. Playwright moet vindbaar zijn (`npm install` in `parselab`).

`styleguide.mjs` controleert het dashboard tegen `docs/DASHBOARD-styleguide.md`: palet, contrast, typografie, raster, knophoogte, focusring, laadtoestand en de drie breedtes. Vraagt dezelfde servers als `qa.mjs`.

`webflow.mjs` test de vijf ParsePDF-embeds uit `parselab/webflow/`. Die test start zelf wat hij nodig heeft: hij bouwt met `webflow-proef.mjs` een proefpagina in `proef/` (namaak-Supabase, pdf.js uit `tools/parsepdf.html`, drie proef-PDF's), zet daar een server op 8123 bij en sluit alles weer af. Los draaien: `node webflow.mjs`.

De extensie heeft een eigen test in `tools/extension/` (zie README daar).
