# Kijk wat erin staat: doorkijken, voorstel en AI

Deze optie zit sinds vandaag in de parser. Je uploadt een PDF, klikt op **Kijk wat erin staat**, en de tool laat op de pagina zelf zien wat hij kan uitlezen: elk veld is gearceerd, en als je erover zweeft zie je de naam die hij voorstelt. Aanvinken, namen aanpassen, overnemen, uitlezen. Geen veldregels meer intikken.

Wat er verandert ten opzichte van de vorige versie staat in [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md); dit stuk beschrijft wat er nu werkt en hoe.

---

## 1. De vier schermen

```
1. Sleep je PDF's erin  → het eerste document gaat meteen open
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

Naast de herkende velden staat een knop **Toon alle tekst (n)**. Die zet élk stukje tekst uit het document in de lijst, uitgevinkt, plus wat er buiten de pagina om bekend is: titel, auteur, programma en aanmaakdatum uit de eigenschappen van het pdf-bestand, en de bestandsnaam. Zo mist de tool niets en haal jij weg wat je niet wilt. Voor zo'n los stuk tekst bewaart het sjabloon de plek op de pagina; op het volgende document pakt hij de cel die daar het dichtst bij staat.

**Door je stapel bladeren.** Heb je meer documenten gekozen, dan staat bovenin *Document 1 van 5* met **Vorige** en **Volgende**. Neem je de velden over en blader je door, dan zie je per document of elk veld daar ook gevonden wordt; wat er niet in staat krijgt *niet gevonden*. Zo controleer je een stapel voordat je hem uitleest.

**Label en waarde blijven bij elkaar.** Staat er `Geboortedatum   01-01-1990` op een regel, dan is dat één veld met de naam *Geboortedatum* en de waarde *01-01-1990* — niet twee losse dingen. De tool zoekt daarvoor de labelkolom van het document: de x-positie waar drie of meer regels een label hebben met steeds op dezelfde plek de waarde ernaast. Alleen die regels worden zo gekoppeld, zodat kolomkoppen (waar de waarde eronder staat) niet per ongeluk aan hun buur worden geplakt.

Vindt de tool een regeltabel, dan verschijnt er een kaart: *Regeltabel gevonden — 3 regels met 6 kolommen*, met een schakelaar **Eén rij per tabelregel**. Aan betekent: elke artikelregel wordt een rij, met de kopvelden van het document erbij herhaald.

## 2. Hoe de tool velden vindt

De pagina wordt niet meer als losse tekstregels gelezen maar als cellen met een plek. Twee kolommen naast elkaar blijven twee cellen; dat was precies wat er misging. Op basis daarvan zoekt hij vijf vormen, elk met een eigen betrouwbaarheid:

| Vorm | Wat hij herkent | Voorbeeld | Score |
|---|---|---|---|
| Formulierregel | Label en waarde naast elkaar in de labelkolom van het document | `Geboortedatum` → `01-01-1990` | 0,95 |
| Kolomkop | Labelrij met de waarden op de rij eronder, op dezelfde x-positie | `Factuurnummer` → `INV10632` | 0,90 |
| Label links | Label en waarde naast elkaar op één rij | `Totaal incl. BTW` → `€38,90` | 0,85 |
| Label in de cel | Label en waarde in dezelfde cel, waarde herkenbaar aan zijn vorm | `IBAN NL71 RABO 0169 2708 58` | 0,80 |
| Label erboven | Label met de waarde eronder in dezelfde kolom | `Factuurnummer` ⏎ `F-2026-0442` | 0,70 |
| Patroon | Vorm die zichzelf verraadt, ook zonder label | e-mailadres, btw-nummer, KvK | 0,60 |
| Bestandsgegeven | Titel, auteur, programma, aanmaakdatum en bestandsnaam | uit de eigenschappen van het bestand | 0,50 |
| Plek op de pagina | Alle overige tekst, via **Toon alle tekst** | wat de vier vormen hierboven lieten liggen | 0,30 |

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

- **Alleen voor Pro en Business.** De AI draait op onze Claude-tegoeden, dus het zit aan een betaald pakket vast. Met het gratis pakket toont de knop een uitleg met een verwijzing naar de pakketten, en werkt de rest gewoon door op de structuurcheck. De browser bepaalt dat niet zelf: de server toetst het toegangsbewijs van de gebruiker bij Supabase en vraagt de databasefunctie `ai_allowed` of dit pakket het mag. Eén controle telt als één AI-tegoed (`record_usage('parsepdf-ai', 1)`).
- **Per document, niet per stapel.** Je gebruikt de AI om een sjabloon goed te krijgen; daarna leest de structuurcheck de andere honderd documenten zonder AI en zonder kosten.
- **De sleutel staat op de server**, nooit in de browser. Zonder `PARSELAB_ANTHROPIC_KEY` antwoordt de server met een nette 501 en zegt de tool: *AI-hulp is niet beschikbaar op deze server. Het voorstel komt uit de structuur van het document.* Er breekt niets.
- **Op de Webflow-pagina** is er geen ParseLab-server. Daar wijs je `window.PARSELAB.aiEndpoint` naar een Supabase Edge Function die hetzelfde antwoord geeft; het model en de sleutel horen daar dan thuis. Zolang dat er niet is, blijft de knop staan en zegt hij netjes dat het niet beschikbaar is.

Het antwoord dat de tool verwacht:

```json
{ "velden": [ { "naam": "Factuurnummer", "waarde": "INV10632", "zekerheid": 0.95 } ],
  "waarschuwingen": [ "Totaal incl. BTW komt niet overeen met de optelling" ] }
```

## 4b. Mappen met sjablonen

Een sjabloon is niet meer één setje regels voor alles. Onder **Mappen met sjablonen** maak je een map (bijvoorbeeld *Facturen*) en bewaar je daar per soort document een sjabloon in: *Wijnleverancier*, *Softwarefacturen*, *Polissen*. Bewaren doe je vanuit het voorstel: naam invullen, map kiezen, **Bewaar als sjabloon**.

Staat er een map actief met sjablonen erin, dan gebruikt **Uitlezen starten** die sjablonen in plaats van de veldregels in het scherm. Per document kiest de tool zelf het sjabloon dat erbij hoort:

- Bij het bewaren legt hij een **vingerafdruk** vast: de labels waarmee de velden gevonden werden, de vaste teksten op de pagina, waar de kolommen beginnen (als deel van de paginabreedte), en harde kenmerken als KvK-nummer, btw-nummer, IBAN en domeinnaam.
- Bij het uitlezen scoort hij elk sjabloon: 3 punten per hard kenmerk, 1 per gelijke vaste tekst (tot 6), 2 als het kolompatroon binnen 2 % past. Boven de 3 punten wint het beste sjabloon; daaronder heet het document *onbekend*.
- De uitvoer is **één tabel** met de kolommen van alle gebruikte sjablonen samen, plus een kolom **Sjabloon** die zegt welk sjabloon per rij gebruikt is. Velden die het andere sjabloon niet kent blijven leeg.
- Achteraf staat er een melding: *Herkend: 18 × Wijnleverancier · 4 × Softwarefacturen*, en hoeveel documenten nergens bij pasten.

Sleep dus gerust dertig facturen van vijf leveranciers in één keer erin. Mappen en sjablonen staan in `localStorage` van deze browser; ze reizen nog niet mee naar een andere computer.

## 5. Wat er in de embeds veranderde

De pagina bestaat nu uit elf embeds in plaats van vijf. Vijf zijn nieuw en twee zijn afgesplitst, omdat Webflow niet meer dan ongeveer 10.000 tekens per embed aankan.

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
| `9-ai.html` | Uitlezen met AI: pakketcontrole, toestemming, tegoed tellen | **nieuw** |
| `10-sjablonen.html` | Mappen, sjablonen, vingerafdruk en het herkennen van documenten | **nieuw** |
| `11-verwerken.html` | Verwerking, limietbewaking, opstarten, rijen per tabelregel | bijgewerkt |

De volgorde blijft leidend: 11 gebruikt wat 1 tot en met 10 klaarzetten. In Webflow plak je ze opnieuw, in deze volgorde, onder dezelfde lege `<div id="pl-parsepdf-root">`.

Er is een nieuw soort veldregel bijgekomen: **`cel`**. Die bewaart niet een woord om op te zoeken, maar hoe de waarde gevonden werd (kolomkop, label links, label in de cel, label erboven of patroon). Daardoor werkt een sjabloon dat je vandaag maakt ook op de factuur van volgende maand, ook als de bedragen verschuiven. De oude soorten (label, patroon, bestandsnaam) blijven gewoon bestaan.

## 6. Testen

`node parselab/tests/webflow.mjs` — 77 controles, waarvan nieuw:

- het voorstel vindt factuurnummer, klantnummer en datum uit de kolomkoppen, zonder instellen
- het scheidt `Totaal excl.` van `Totaal incl.`
- het herkent IBAN en btw-nummer zonder label
- er staan meer dan twintig gearceerde vlakken op een echt getekende pagina
- zweven toont "naam = waarde"
- de AI-knop vraagt eerst toestemming, en doet niets als je nee zegt
- zonder AI-sleutel komt er een melding en geen fout; met een antwoord hernoemt de AI een veld en vult er één aan
- overnemen levert een sjabloon met `cel`-regels en tabelkolommen
- uitlezen geeft 25 kolommen en één rij per tabelregel, met de juiste waarden
- het document gaat vanzelf open na het kiezen, met *Document 1 van 2* erboven
- `Geboortedatum 01-01-1990` blijft één veld, net als de andere formulierregels
- bladeren naar het tweede document toont per veld of het daar gevonden wordt
- **Toon alle tekst** zet er meer in de lijst dan de herkende velden, met de bestandsnaam en de pdf-eigenschappen erbij
- een gratis pakket krijgt bij de AI-knop een uitleg met een verwijzing naar de pakketten in plaats van het toestemmingsvenster
- twee sjablonen in één map: drie gemengde documenten geven één tabel, elk met zijn eigen sjabloon in de kolom Sjabloon, de juiste waarden per rij, en het derde document als *onbekend*

## 6b. Server: wat je moet instellen voor de AI

| Variabele | Waarvoor |
|---|---|
| `PARSELAB_ANTHROPIC_KEY` | De Anthropic-sleutel waarmee de server Claude aanroept. Staat nooit in de browser. |
| `PARSELAB_AI_MODEL` | Welk model, standaard `claude-opus-5`. |
| `PARSELAB_SUPABASE_URL` en `PARSELAB_SUPABASE_KEY` | Zet je die, dan eist het eindpunt een geldig toegangsbewijs én een pakket dat het toelaat. |

De databasefunctie `ai_allowed()` beslist. Iets in deze geest, met row level security eromheen:

```sql
create or replace function ai_allowed() returns boolean language sql security definer as $$
  select coalesce((select p.ai from profiles pr join plans p on p.id = pr.plan_id
                   where pr.id = auth.uid()), false);
$$;
```

Zet `plans.ai` op `false` voor Gratis en op `true` voor Pro en Business. Zonder deze twee variabelen blijft het eindpunt open; dat is bedoeld voor een server die alleen jij kunt bereiken.

## 7. Wat hierna nog open staat

- **Sjablonen aan het account koppelen.** Ze staan nu per browser; het datamodel voor Supabase ligt klaar in [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md).
- **Aanwijzen wat de tool miste**: klikken op een cel die niet gevonden werd en daar zelf een veld van maken.
- **De AI-endpoint op Supabase** voor de Webflow-pagina.
- **Gescande documenten** blijven buiten beeld tot er tekstherkenning is.
