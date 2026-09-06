# ParsePDF als Webflow-pagina

Deze vijf bestanden zijn de embeds die op de Webflow-pagina `/tools/parsepdf-tool` staan. Ze horen bij het Webflow-dashboard met Supabase erachter, niet bij het dashboard in `parselab/index.html`. Beide versies van ParsePDF blijven bestaan: die in `tools/parsepdf.html` draait naast de ParseLab-server, deze draait naast Supabase.

Plaatsing, wat de gebruiker ziet en wat er nog niet in zit staat in [`../docs/INTEGRATIE.md`](../docs/INTEGRATIE.md). Kort:

| Bestand | Wat het doet | Tekens |
|---|---|---|
| `1-config-stijl.html` | Supabase-client, `window.PARSELAB`, alle `pld-` en `plp-` stijlen | 5.033 |
| `2-teksten.html` | Teksten in nl, en, de plus drie startsjablonen | 6.517 |
| `3-motor.html` | Uitleesmotor: pdf.js, tekst herleiden, regels toepassen, CSV | 5.474 |
| `4-scherm.html` | Verbruiksmeter, regelkaart, dropzone, resultaattabel | 8.715 |
| `5-verwerken.html` | Verwerking, limietbewaking en opstarten | 3.111 |

De volgorde ligt vast: embed 5 gebruikt wat 1 tot en met 4 klaarzetten. Ze staan onder de lege container `<div id="pl-parsepdf-root">`. Elk bestand blijft onder de embedlimiet van ongeveer 10.000 tekens; splits je iets, zet het nieuwe deel dan vóór embed 5.

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

`node parselab/tests/webflow.mjs` bouwt de proefpagina, start er zelf een server bij en loopt 36 controles af: doorsturen naar inloggen, verbruiksmeter, sjablonen, uitlezen van twee facturen, labels die `Totaal` niet met `Subtotaal` verwarren, opschonen tot bedrag en datum, regex met haakjesgroep, bestand zonder tekstlaag, CSV met puntkomma's en BOM, regels bewaren, limietbewaking, taalkeuze, het smalle scherm en de losse pagina uit `bouw-pagina.mjs`.

## Nog met de hand te doen in Webflow

Op `/dashboard` staat de kaart van ParsePDF nog op "Binnenkort". Die moet een knop worden naar `/tools/parsepdf-tool`, en de pill eraf. Dat zit in de dashboard-embed van Webflow, niet in deze repo.
