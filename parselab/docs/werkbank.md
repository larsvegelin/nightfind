# Data-extractie — één interface, drie stappen

Dit is de voorkant van ParseLab: één plek waar een PDF, een externe website en een
Excel/CSV-databestand dezelfde weg afleggen. **Bron → gestructureerde data → formaat.**
Er zijn geen losse productnamen meer; de drie bronnen en de uitvoer zijn stappen van één
tool. Achter de schermen houdt elke bron zijn eigen pagina
(`tools/parsepdf.html`, `tools/parsescraper.html`, `tools/parsesheet.html`,
`tools/parseboard.html`), maar de gebruiker ziet één werkstroom.

Openen: in de navigatie links bovenaan **Data-extractie**, of `index.html#start`
(oude links `#werk` en `#overview` komen daar ook uit).

## Stap 1 — Waar staat je data?

| Keuze | Waarvoor |
|---|---|
| Data uit een PDF | facturen, bonnen, polisbladen, rapporten |
| Data uit een website | een lijst of tabel van een externe pagina |
| Data uit Excel of CSV | een export met een logo erboven, lege regels, samengevoegde cellen |

Elke keuze opent die bron op zijn eigen pagina, in dezelfde schil. Zodra er een tabel is,
meldt de pagina die terug (bericht `parselab:dataset`). Dat gebeurt vanzelf; je hoeft
niets door te sturen.

## Stap 2 — Je gestructureerde data

Alle tabellen staan onder elkaar met hun herkomst, aantal regels en kolommen, en het
tijdstip. Ze worden bewaard in de browser (`localStorage`, sleutel
`parselab-datasets-v1`), maximaal twaalf tabellen van elk 5.000 regels. Een tabel met
dezelfde naam uit dezelfde bron vervangt de vorige, zodat de lijst niet volloopt.

Per tabel: **Excel**, **CSV**, **Dashboard** (opent het dashboard met deze rijen), **Rapport** en **Weg**.

## Stap 3 — In welk formaat?

- **Excel of CSV.** Per tabel, met de knoppen uit stap 2. Getallen blijven getallen
  (`€ 1.234,56` wordt `1234,56`), datums worden `dd-mm-jjjj`.
- **Dashboard.** Stuurt de rijen naar het dashboard, dat direct naar stap 2 springt.
- **Rapport.** Eén knop levert twee bestanden met dezelfde inhoud:
  `parselab-rapport-JJJJ-MM-DD.md` en `.html`.

### Wat staat er in het rapport

1. Kop met datum en het aantal bronnen.
2. Overzichtstabel: per bron de herkomst, het aantal regels en kolommen.
3. Per bron:
   - de kolommen met hun type (tekst, getal, datum);
   - **kerncijfers** van elke getalkolom: gevuld, som, gemiddelde, laagste, hoogste (in de
     HTML met een staafje voor het aandeel);
   - **verdelingen** van tekstkolommen met 2 tot 12 verschillende waarden;
   - de eerste regels (10 in Markdown, 25 in de HTML).

De HTML staat op zichzelf: geen scripts, geen externe bestanden, dus je kunt hem mailen,
in SharePoint zetten of uitprinten (er is een printstijl). De Markdown is voor een wiki,
een issue of een commit.

Met **Bekijk eerst** open je dezelfde HTML in een tabblad zonder te downloaden.

## Hoe het onder water hangt

De schil (`parselab/index.html`) luistert naar berichten van de tools:

| Bericht | Van | Gevolg |
|---|---|---|
| `parselab:dataset` | elke bron | tabel komt bij je gestructureerde data |
| `parselab:handover` | PDF, website, databestand | tabel komt erbij én gaat door naar het gekozen formaat |
| `parselab:stats` | elke bron | tellers in de navigatie |

Wil je een nieuwe bron toevoegen, dan is dat één object in `toolDefs()`, één kaart in
`renderStart()`, plus één regel in de bronpagina zelf: `postMessage({ source:"parselab-tool", type:"parselab:dataset", naam, kolommen, rijen })`.

## Getest

`tests/werkbank.mjs` (29 controles) loopt de hele weg af: rommelige Excel opschonen, de
tabel bij je gestructureerde data zien verschijnen, Excel en CSV downloaden, het rapport als `.md` en
`.html` maken en nakijken (kolommen, kerncijfers, som), en de rijen doorgeven aan het dashboard.
