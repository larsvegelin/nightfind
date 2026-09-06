# Kijk wat erin staat: doorkijken, voorstel en AI

Deze optie zit sinds vandaag in de parser. Je uploadt een PDF, klikt op **Kijk wat erin staat**, en de tool laat op de pagina zelf zien wat hij kan uitlezen: elk veld is gearceerd, en als je erover zweeft zie je de naam die hij voorstelt. Aanvinken, namen aanpassen, overnemen, uitlezen. Geen veldregels meer intikken.

Wat er verandert ten opzichte van de vorige versie staat in [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md); dit stuk beschrijft wat er nu werkt en hoe.

---

## 1. De vier schermen

```
1. Sleep je PDF's erin
2. Per bestand: [ Kijk wat erin staat ]  [ Verwijderen ]
3. Doorkijkscherm
   ├── links   de pagina zoals hij is, met gearceerde vlakken
   │           blauw = waarde die de tool eruit haalt
   │           goud  = het label waaraan hij hem herkende
   │           zweven over een vlak toont "Naam = waarde"
   │           klikken zet het veld aan of uit
   └── rechts  het voorstel: vinkje, naam (aan te passen), waarde, en hoe hij het vond
   onderaan  [ Neem over als veldregels ]  [ Uitlezen met AI ]  [ Annuleren ]
4. Uitlezen starten → alle overgenomen kolommen in één tabel
```

Vindt de tool een regeltabel, dan verschijnt er een kaart: *Regeltabel gevonden — 3 regels met 6 kolommen*, met een schakelaar **Eén rij per tabelregel**. Aan betekent: elke artikelregel wordt een rij, met de kopvelden van het document erbij herhaald.

## 2. Hoe de tool velden vindt

De pagina wordt niet meer als losse tekstregels gelezen maar als cellen met een plek. Twee kolommen naast elkaar blijven twee cellen; dat was precies wat er misging. Op basis daarvan zoekt hij vijf vormen, elk met een eigen betrouwbaarheid:

| Vorm | Wat hij herkent | Voorbeeld | Score |
|---|---|---|---|
| Kolomkop | Labelrij met de waarden op de rij eronder, op dezelfde x-positie | `Factuurnummer` → `INV10632` | 0,90 |
| Label links | Label en waarde naast elkaar op één rij | `Totaal incl. BTW` → `€38,90` | 0,85 |
| Label in de cel | Label en waarde in dezelfde cel, waarde herkenbaar aan zijn vorm | `IBAN NL71 RABO 0169 2708 58` | 0,80 |
| Label erboven | Label met de waarde eronder in dezelfde kolom | `Factuurnummer` ⏎ `F-2026-0442` | 0,70 |
| Patroon | Vorm die zichzelf verraadt, ook zonder label | e-mailadres, btw-nummer, KvK | 0,60 |

Ingebouwde patronen: **IBAN, btw-nummer, KvK-nummer, e-mailadres, website, telefoonnummer, postcode, bedrag, datum, percentage en kenmerk** (letters met een reeks cijfers, zoals `INV10632`). De eerste zeven zijn sterk genoeg om zonder label een veld te worden; bedrag, datum, percentage en kenmerk komen alleen mee als er een label bij hoort, anders staat je voorstel vol losse getallen.

Twee dingen die de tool bewust niet doet:

- Een cel die zelf al label én waarde bevat (`IBAN NL71 …`) wordt niet als waarde bij het label erboven gehangen. Dat was de fout waardoor er voorstellen ontstonden als *"Polisnummer: P-2026-77120" = "Ingangsdatum: 01-01-2026"*.
- Een weekdag of maandnaam wordt nooit een veldnaam. `Zondag 21 Juni 2026` blijft de waarde van `Datum` en wordt geen veld `Zondag`.

## 3. Wat het oplevert op een echte factuur

`tests/pdfs/factuur-webshop.pdf` is een webshopfactuur met kolomkoppen, een regeltabel en een totalenblok. Zonder één instelling:

| Veld | Waarde | Gevonden via |
|---|---|---|
| Factuurnummer | INV10632 | kolomkop |
| Ordernummer | ORD10093 | kolomkop |
| Klantnummer | 227521416 | kolomkop |
| Datum | Zondag 21 Juni 2026 | kolomkop |
| Totaal excl. BTW | €32,15 | label links |
| BTW 21% | €6,75 | label links |
| Totaal incl. BTW | €38,90 | label links |
| KvK-nummer | 54284198 | label in de cel |
| Btw-nummer | NL002051640B39 | label in de cel |
| IBAN | NL71 RABO 0169 2708 58 | label in de cel |

Plus de regeltabel met zes kolommen en drie regels. Vergelijk dat met de vorige versie, die op ditzelfde document één van de vier gevraagde velden goed had.

## 4. Uitlezen met AI

De knop **Uitlezen met AI** doet niets voordat je ja zegt. Er verschijnt eerst een venster met precies wat er gebeurt:

> Om te helpen benoemen stuurt ParseLab de tekst van dit ene document naar de eigen server, die het aan het AI-model voorlegt. Het document zelf blijft hier; de tekst wordt niet bewaard. De andere documenten in je lijst gaan niet mee.

Zeg je ja, dan gaat de tekst van dat ene document plus de velden die de structuurcheck al vond naar `POST /api/parsepdf/velden`. De AI doet drie dingen: velden een duidelijkere naam geven, missers aanvullen, en waarschuwen als een bedrag of datum niet klopt. Wat terugkomt wordt in het voorstel gemerkt met **AI**, zodat je ziet wat van wie komt.

Belangrijk aan de opzet:

- **Per document, niet per stapel.** Je gebruikt de AI om een sjabloon goed te krijgen; daarna leest de structuurcheck de andere honderd documenten zonder AI en zonder kosten.
- **De sleutel staat op de server**, nooit in de browser. Zonder `PARSELAB_ANTHROPIC_KEY` antwoordt de server met een nette 501 en zegt de tool: *AI-hulp is niet beschikbaar op deze server. Het voorstel komt uit de structuur van het document.* Er breekt niets.
- **Op de Webflow-pagina** is er geen ParseLab-server. Daar wijs je `window.PARSELAB.aiEndpoint` naar een Supabase Edge Function die hetzelfde antwoord geeft; het model en de sleutel horen daar dan thuis. Zolang dat er niet is, blijft de knop staan en zegt hij netjes dat het niet beschikbaar is.

Het antwoord dat de tool verwacht:

```json
{ "velden": [ { "naam": "Factuurnummer", "waarde": "INV10632", "zekerheid": 0.95 } ],
  "waarschuwingen": [ "Totaal incl. BTW komt niet overeen met de optelling" ] }
```

## 5. Wat er in de embeds veranderde

De pagina bestaat nu uit negen embeds in plaats van vijf. Drie zijn nieuw en één is afgesplitst, omdat Webflow niet meer dan ongeveer 10.000 tekens per embed aankan.

| Embed | Wat | Nieuw? |
|---|---|---|
| `1-config-stijl.html` | Supabase, stijlen, ook die van het doorkijkscherm | bijgewerkt |
| `2-teksten.html` | Teksten en startsjablonen | ongewijzigd |
| `3-teksten-voorstel.html` | Teksten voor doorkijken, voorstel en AI, in nl/en/de | **nieuw** |
| `4-motor.html` | pdf.js, cellen met x en y, regels toepassen, CSV | bijgewerkt |
| `5-scherm.html` | Schermopbouw, plus de knop Kijk wat erin staat | bijgewerkt |
| `6-structuur.html` | Cellen, rijen, kolommen, patronen, en een bewaarde vindregel toepassen | **nieuw** |
| `7-velden.html` | De vijf kandidaatvormen, ontdubbelen en de regeltabel | **nieuw** |
| `8-voorstel.html` | Het doorkijkscherm, het voorstel en de AI-knop | **nieuw** |
| `9-verwerken.html` | Verwerking, limietbewaking, opstarten, rijen per tabelregel | bijgewerkt |

De volgorde blijft leidend: 9 gebruikt wat 1 tot en met 8 klaarzetten. In Webflow plak je ze opnieuw, in deze volgorde, onder dezelfde lege `<div id="pl-parsepdf-root">`.

Er is een nieuw soort veldregel bijgekomen: **`cel`**. Die bewaart niet een woord om op te zoeken, maar hoe de waarde gevonden werd (kolomkop, label links, label in de cel, label erboven of patroon). Daardoor werkt een sjabloon dat je vandaag maakt ook op de factuur van volgende maand, ook als de bedragen verschuiven. De oude soorten (label, patroon, bestandsnaam) blijven gewoon bestaan.

## 6. Testen

`node parselab/tests/webflow.mjs` — 57 controles, waarvan nieuw:

- het voorstel vindt factuurnummer, klantnummer en datum uit de kolomkoppen, zonder instellen
- het scheidt `Totaal excl.` van `Totaal incl.`
- het herkent IBAN en btw-nummer zonder label
- er staan meer dan twintig gearceerde vlakken op een echt getekende pagina
- zweven toont "naam = waarde"
- de AI-knop vraagt eerst toestemming, en doet niets als je nee zegt
- zonder AI-sleutel komt er een melding en geen fout; met een antwoord hernoemt de AI een veld en vult er één aan
- overnemen levert een sjabloon met `cel`-regels en tabelkolommen
- uitlezen geeft 25 kolommen en één rij per tabelregel, met de juiste waarden

## 7. Wat hierna nog open staat

- **Mappen met sjablonen** en het automatisch herkennen welk sjabloon bij een document hoort. Dat is fase 3 uit [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md) en het datamodel ligt er al.
- **Aanwijzen wat de tool miste**: klikken op een cel die niet gevonden werd en daar zelf een veld van maken.
- **De AI-endpoint op Supabase** voor de Webflow-pagina.
- **Gescande documenten** blijven buiten beeld tot er tekstherkenning is.
