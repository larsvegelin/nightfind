# Proef-PDF's

Zeven documenten om ParsePDF mee te controleren. Ze zijn gemaakt met `maak-pdfs.mjs`, dus je kunt ze aanpassen en opnieuw genereren:

```
node parselab/tests/pdfs/maak-pdfs.mjs
```

Het zijn geen echte facturen; er staan geen gegevens van klanten in. Wat ze wel doen is elk een ander soort lastigheid nabootsen.

| Bestand | Pagina's | Waar het om gaat |
|---|---|---|
| `factuur-alpha.pdf` | 1 | Rechttoe rechtaan: label en bedrag op dezelfde regel |
| `factuur-beta.pdf` | 2 | Label en waarde staan onder elkaar, datum voluit geschreven, tweede pagina met bijlage |
| `factuur-gamma.pdf` | 1 | "Subtotaal" staat vóór "Totaal incl. btw", bedragen zonder euroteken, een negatief kortingsbedrag |
| `factuur-groot.pdf` | 6 | Zes pagina's: hiermee zie je het tellen en de maandlimiet werken |
| `bankafschrift.pdf` | 1 | Voor het sjabloon Bankafschrift: IBAN, periode, eindsaldo |
| `polis.pdf` | 1 | Andere woorden, zelfde soort velden: polisnummer, ingangsdatum, premie |
| `factuur-webshop.pdf` | 1 | Nagebouwd naar een echte webshopfactuur: kolomkoppen met de waarden op de rij eronder, een regeltabel van drie regels, en "Totaal excl." vlak boven "Totaal incl." |
| `gescand.pdf` | 1 | Geen tekstlaag, alleen een grijs vlak. Hoort de melding over gescande documenten te geven |

## Wat eruit hoort te komen

Met het sjabloon **Facturen** (Factuurnummer, Factuurdatum → datum, Totaal → bedrag, BTW → bedrag, Bestandsnaam):

| Bestand | Pagina's | Factuurnummer | Datum | Totaal | BTW |
|---|---|---|---|---|---|
| factuur-alpha.pdf | 1 | 2026-0118 | 12-03-2026 | 1.505,45 | 261,28 |
| factuur-beta.pdf | 2 | F-2026-0442 | 2 april 2026 | 1.076,90 | 186,90 |
| factuur-gamma.pdf | 1 | 26/0993 | 28-02-2026 | 14.703,92 | 2.551,92 |
| factuur-groot.pdf | 6 | 2026-5001 | 15-05-2026 | 30.225,80 | 5.245,80 |
| gescand.pdf | 1 | — | — | — | — |

Bij `gescand.pdf` hoort de melding: *bevat geen tekstlaag. Gescande documenten worden nog niet ondersteund.*

Met het sjabloon **Bankafschrift**:

| Bestand | Rekening | Periode | Eindsaldo |
|---|---|---|---|
| bankafschrift.pdf | NL02RABO0123456789 | 01-03-2026 t/m 31-03-2026 | 13.216,43 |

Met eigen regels voor de polis (Polisnummer, Ingangsdatum → datum, "Premie per jaar" → bedrag, "Eigen risico" → bedrag):

| Bestand | Polisnummer | Ingangsdatum | Premie | Eigen risico |
|---|---|---|---|---|
| polis.pdf | P-2026-77120 | 01-01-2026 | 1.148,76 | 250,00 |

Deze tabellen komen uit een echte run, niet uit een verwachting op papier. `tests/webflow.mjs` controleert alpha, beta en gamma automatisch, zodat ze niet stilletjes anders gaan uitpakken.

## De maatstaf: factuur-webshop.pdf

Dit is het document waar de huidige tool op stukloopt, en daarmee de maatstaf voor de volgende versie (zie [`../../docs/PARSEPDF-VOLGENDE-VERSIE.md`](../../docs/PARSEPDF-VOLGENDE-VERSIE.md)). Met het sjabloon Facturen komt er nu dit uit:

| Kolom | Nu | Hoort te zijn |
|---|---|---|
| Factuurnummer | `Ordernummer Klantnummer Datum` | `INV10632` |
| Datum | leeg | `21 Juni 2026` |
| Totaal | `32,15` (dat is excl. btw) | `38,90` |
| BTW | `6,75` | `6,75` |

Eén van de vier goed. De oorzaak is niet het sjabloon maar de manier van lezen: alles op dezelfde hoogte wordt aan elkaar geplakt, waardoor de kolommen verdwijnen.

## Waar ze goed voor zijn

- **Vóór de lancering:** sleep ze in de tool en vergelijk met de tabellen hierboven. Wijkt er iets af, dan zit het in de embeds en niet in jouw documenten.
- **Bij het instellen van je eigen regels:** `factuur-gamma.pdf` laat zien wat er gebeurt als een label ook in een langer woord voorkomt.
- **Voor de limiet:** `factuur-groot.pdf` is zes pagina's. Zet je verbruik in Supabase op vijf onder de limiet en probeer hem; je hoort de kaart te krijgen die zegt hoeveel je nog over hebt.
- **Voor de verwachtingen:** laat `gescand.pdf` zien aan wie denkt dat scans ook werken. Dat gesprek is beter vooraf dan achteraf.
