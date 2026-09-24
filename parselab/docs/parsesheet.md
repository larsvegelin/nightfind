# ParseSheet — rommelige Excel netjes maken

`tools/parsesheet.html`. Een export uit een systeem is zelden een tabel: er staat een logo
of een titel boven, er zitten lege regels tussen, de kopregel herhaalt zich per pagina,
cellen zijn samengevoegd en bedragen staan als tekst. ParseSheet maakt daar één nette tabel
van — in je eigen browser, het bestand gaat nergens heen.

## Stappen

1. **Bestand.** Sleep een `.xlsx`, `.csv` of tab-bestand, of klik *Bestand kiezen*. Meer
   werkbladen? Dan kies je het blad. Met *Voorbeeld gebruiken* zie je het zonder bestand.
2. **Opschonen.** De regel die ParseLab als kopregel herkent staat blauw. Klopt hij niet,
   kies dan zelf een regel. Daaronder staan de schoonmaakopties.
3. **Klaar.** Kerncijfers, de herkende kolomtypen, wat er is opgeruimd, en de tabel.
   Download als Excel of CSV, of stuur hem door naar het dashboard.

## Wat het opruimt

| Optie | Doet |
|---|---|
| Lege regels weg | regels zonder enige waarde |
| Lege kolommen weg | kolommen zonder enige waarde |
| Samengevoegde cellen doorvullen | een lege cel onder een gevulde krijgt dezelfde waarde, mits de regel verder gevuld is |
| Herhaalde kopregels weg | de kopregel die per pagina opnieuw in de export staat |
| Spaties opruimen | spaties voor en na, dubbele spaties er tussenuit |
| Getallen als getal | `€ 1.234,56` → `1234,56`, `12,5%` → `0,125` |
| Datums gelijktrekken | `1-1-2026`, `2026-02-20` en `3 feb 2026` → `dd-mm-jjjj` |
| Kolomnamen netjes | regeleindes eruit, lege koppen worden `kolom 3`, dubbele namen krijgen een nummer |
| Kruistabel omzetten naar lijst | maanden of jaren náást elkaar worden regels ónder elkaar (`Categorie` + `Waarde`) — staat standaard uit |

## Hoe de kopregel wordt geraden

Per regel (de eerste 30) telt: hoeveel cellen gevuld zijn, hoeveel daarvan uniek en kort
zijn, hoeveel er juist een getal zijn (dat telt tegen), en of de regels eronder dezelfde
kolommen vullen. Staat dezelfde kop verderop nóg een keer — een export met een kop per
pagina — dan wint de bovenste: de eerste regel die vrijwel net zo goed scoort als de beste.

## Typen

Per kolom kijkt ParseSheet naar de gevulde waarden: is 80% of meer een datum, dan is het een
datumkolom; is 80% of meer een getal, dan een getalkolom; anders tekst. Dat type bepaalt hoe
er wordt omgezet, hoe de kolom in het rapport meetelt (som, gemiddelde) en hoe ParseBoard
hem oppakt.

## Techniek

- Excel lezen: een mini-uitpakker (zip) plus `DecompressionStream`, daarna
  `xl/worksheets/*.xml` met gedeelde teksten en datumopmaak uit `styles.xml`. Geen
  bibliotheek, geen netwerk.
- Excel schrijven: dezelfde mini-zip, één werkblad met `inlineStr`-cellen.
- In de schil draait de pagina in een iframe (`?embed=1&section=`) en meldt hij
  `parselab:ready`, `parselab:section`, `parselab:stats` en `parselab:dataset`.

## Getest

In `tests/werkbank.mjs`: kopregel herkennen tussen twee herhaalde koppen, vier regels
overhouden, doorgevulde cel, bedragen als getal, datums gelijkgetrokken, typen herkend, en
een geldig `.xlsx`-bestand als download.
