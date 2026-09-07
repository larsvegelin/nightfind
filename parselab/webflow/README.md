# ParsePDF als Webflow-pagina

Deze zestien bestanden zijn de embeds die op de Webflow-pagina `/tools/parsepdf-tool` staan. Ze horen bij het Webflow-dashboard met Supabase erachter, niet bij het dashboard in `parselab/index.html`. Beide versies van ParsePDF blijven bestaan: die in `tools/parsepdf.html` draait naast de ParseLab-server, deze draait naast Supabase.

Plaatsing, wat de gebruiker ziet en wat er nog niet in zit staat in [`../docs/INTEGRATIE.md`](../docs/INTEGRATIE.md). Kort:

| Bestand | Wat het doet |
|---|---|
| `1-config-stijl.html` | Supabase-client, `window.PARSELAB`, alle `pld-` en `plp-` stijlen |
| `2-teksten.html` | Teksten in nl, en, de plus drie startsjablonen |
| `3-teksten-voorstel.html` | Teksten voor doorkijken, voorstel en AI |
| `3b-teksten-labels.html` | Teksten voor labels, selectie, OCR, mappen, eisen en de documentcontrole |
| `4-motor.html` | Uitleesmotor: pdf.js, cellen met x en y, regels toepassen, CSV |
| `4b-ocr.html` | Tekstherkenning voor documenten zonder tekstlaag |
| `5-scherm.html` | Upload bovenaan, verbruiksmeter, mappen, Handmatig parsen, resultaattabel |
| `5b-eisen.html` | Parsen op eisen: bij een woord, soort waarde, pagina, kolom; met een AI die een zin omzet in zo'n eis |
| `6-structuur.html` | Cellen, kolommen en patronen: de basis van de herkenning |
| `7-velden.html` | Velden voorstellen: kandidaatvormen, ontdubbelen, regeltabel |
| `8-voorstel.html` | Doorkijkscherm en het voorstel |
| `9-labels.html` | Labels per vlak, alles selecteren, goedkeuren en het OCR-aanbod |
| `9b-uitleg.html` | "Hoe werkt ParsePDF?" in vijf stappen, met een voorbeeld dat je meteen kunt proberen |
| `10-ai.html` | Uitlezen met AI: pakketcontrole, toestemming en tegoeden |
| `11-sjablonen.html` | Mappen met sjablonen en het herkennen van documenten |
| `12-verwerken.html` | Verwerking, limietbewaking, controle over alle documenten en opstarten |

Wat het doorkijkscherm doet en hoe de herkenning werkt staat in [`../docs/PARSEPDF-DOORKIJKEN.md`](../docs/PARSEPDF-DOORKIJKEN.md).

De volgorde ligt vast: embed 12 gebruikt wat 1 tot en met 11 klaarzetten. Ze staan onder de lege container `<div id="pl-parsepdf-root">`. Elk bestand blijft onder de embedlimiet van ongeveer 10.000 tekens; splits je iets, zet het nieuwe deel dan vóór embed 11.

## Eén embed in plaats van zestien

```
node parselab/webflow/bouw-bundel.mjs     # maakt parselab/dist/parsepdf.js en embed-loader.html
```

Publiceer `parsepdf.js` op een vast adres (GitHub Pages doet dat al) en plaats in Webflow alleen `embed-loader.html`. Dat scheelt vijftien blokken en de limiet van 10.000 tekens per embed speelt niet meer. Bij een nieuwe versie bouw je opnieuw en publiceer je het script; de pagina blijft ongemoeid.

## Dezelfde tool als één bestand

```
node parselab/webflow/bouw-pagina.mjs      # maakt parselab/ParsePDF.html
```

`parselab/ParsePDF.html` is de vijf embeds achter elkaar in één pagina, met dezelfde Supabase erachter. Zet dat bestand op elke webhost en de tool werkt; handig als je nog geen Webflow-pagina wilt maken. Verander je iets in `webflow/`, bouw dan opnieuw, anders lopen de twee uit elkaar. De lancering zelf staat in [`../docs/LANCERING.md`](../docs/LANCERING.md).

## Zelf uitproberen zonder Webflow

```
node parselab/tests/webflow-proef.mjs            # bouwt parselab/tests/proef/
cd parselab/tests/proef && python3 -m http.server 8123
```

Open `http://localhost:8123/`. De proefpagina zet drie dingen om en laat de embeds verder woord voor woord staan: Supabase komt uit een namaakbestand, pdf.js uit de kopie die al in `tools/parsepdf.html` zit (de testomgeving heeft geen internet), en de twee paden wijzen naar twee proefpagina's. Er staan drie proef-PDF's klaar: twee facturen en één zonder tekstlaag.

Met de adresregel stel je de namaak-Supabase in: `?ingelogd=0` (geen sessie), `?gebruikt=49&limiet=50` (bijna vol), `?taal=en`, `?weigeren=1` (`record_usage` geeft een fout terug).

## Testen

`node parselab/tests/webflow.mjs` bouwt de proefpagina, start er zelf een server bij en loopt 89 controles af: doorsturen naar inloggen, verbruiksmeter, sjablonen, uitlezen van twee facturen, labels die `Totaal` niet met `Subtotaal` verwarren, opschonen tot bedrag en datum, regex met haakjesgroep, bestand zonder tekstlaag, CSV met puntkomma's en BOM, regels bewaren, limietbewaking, taalkeuze, het smalle scherm, het doorkijkscherm met voorstel en AI-toestemming, mappen met sjablonen die per document herkend worden, en de losse pagina uit `bouw-pagina.mjs`.

## Nog met de hand te doen in Webflow

Op `/dashboard` staat de kaart van ParsePDF nog op "Binnenkort". Die moet een knop worden naar `/tools/parsepdf-tool`, en de pill eraf. Dat zit in de dashboard-embed van Webflow, niet in deze repo.
