# Werkbank — alle tools in één werkstroom

De Werkbank is de voorkant van ParseLab: één plek waar een PDF, een website en een rommelige
Excel dezelfde weg afleggen. Bron → nette tabel → uitvoer. De tools zelf blijven aparte
pagina's (`tools/parsepdf.html`, `tools/parsescraper.html`, `tools/parsesheet.html`,
`tools/parseboard.html`); de Werkbank is waar hun opbrengst samenkomt.

Openen: in het dashboard links bovenaan **Werkbank**, of `index.html#werk`.

## Stap 1 — Waar komt het vandaan?

| Knop | Tool | Waarvoor |
|---|---|---|
| Document (PDF) | ParsePDF | facturen, bonnen, polisbladen, rapporten |
| Website | ParseScraper | een lijst of tabel van een pagina |
| Rommelige Excel | ParseSheet | een export met een logo erboven, lege regels, samengevoegde cellen |

Elke knop opent die tool op zijn eigen pagina, in dezelfde schil. Zodra de tool een tabel
heeft, meldt hij die aan de Werkbank (bericht `parselab:dataset`). Dat gebeurt vanzelf; je
hoeft niets door te sturen.

## Stap 2 — Je gegevens

Alle tabellen staan onder elkaar met hun herkomst, aantal regels en kolommen, en het
tijdstip. Ze worden bewaard in de browser (`localStorage`, sleutel
`parselab-datasets-v1`), maximaal twaalf tabellen van elk 5.000 regels. Een tabel met
dezelfde naam uit dezelfde tool vervangt de vorige, zodat de lijst niet volloopt.

Per tabel: **Excel**, **CSV**, **Dashboard** (opent ParseBoard met deze rijen) en **Weg**.

## Stap 3 — Wat wil je ermee?

- **Excel of CSV.** Per tabel, met de knoppen uit stap 2. Getallen blijven getallen
  (`€ 1.234,56` wordt `1234,56`), datums worden `dd-mm-jjjj`.
- **Dashboard.** Stuurt de rijen naar ParseBoard, dat direct naar stap 2 springt.
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
| `parselab:dataset` | elke tool | tabel komt in de Werkbank |
| `parselab:handover` | ParsePDF, ParseScraper, ParseSheet | tabel komt in de Werkbank én gaat naar de gekozen tool |
| `parselab:stats` | elke tool | tellers in de navigatie |

Wil je een nieuwe bron toevoegen, dan is dat één object in `toolDefs()` plus één regel in de
tool zelf: `postMessage({ source:"parselab-tool", type:"parselab:dataset", naam, kolommen, rijen })`.

## Getest

`tests/werkbank.mjs` (29 controles) loopt de hele weg af: rommelige Excel opschonen, de
tabel in de Werkbank zien verschijnen, Excel en CSV downloaden, het rapport als `.md` en
`.html` maken en nakijken (kolommen, kerncijfers, som), en de rijen doorgeven aan ParseBoard.
