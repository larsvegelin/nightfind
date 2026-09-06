# ParsePDF in het dashboard zetten

Vijf embeds op één nieuwe Webflow-pagina. Reken op twintig minuten.
Alles draait in de browser van de gebruiker; er wordt geen document verstuurd.

---

## 1. Wat je krijgt

| Bestand | Wat het doet |
|---|---|
| `1-config-stijl.html` | Supabase-client, `window.PARSELAB`, alle `pld-` en `plp-` stijlen |
| `2-teksten.html` | Teksten in nl, en, de plus drie startsjablonen |
| `3-teksten-voorstel.html` | Teksten voor doorkijken, voorstel en AI |
| `4-motor.html` | Uitleesmotor: pdf.js, cellen met x en y, regels toepassen, CSV maken |
| `5-scherm.html` | Schermopbouw: verbruiksmeter, regelkaart, dropzone, resultaattabel |
| `6-structuur.html` | Cellen, kolommen en patronen: de basis van de herkenning |
| `7-velden.html` | Velden voorstellen: kandidaatvormen, ontdubbelen, regeltabel |
| `8-voorstel.html` | Doorkijkscherm met gearceerde velden, het voorstel en de AI-knop |
| `9-verwerken.html` | Verwerking, limietbewaking en opstarten |

Elk bestand blijft onder de embedlimiet van ongeveer 10.000 tekens. Splits je later iets bij, houd die grens aan.

---

## 2. De pagina maken

1. Webflow Designer → **Pages** → **+** → naam `ParsePDF tool`, slug `parsepdf-tool`.
   Wil je hem onder het dashboard hangen, maak dan eerst een folder `tools` en kies die als parent; het pad wordt dan `/tools/parsepdf-tool`.
2. Page settings → SEO → zet **Exclude from search results** aan. Dit is een pagina achter de login en hoort niet in Google.
3. Titel: `ParsePDF — ParseLab`. Beschrijving mag leeg blijven.

## 3. De opbouw plaatsen

Bouw op de pagina exact deze volgorde. Neem de header en footer over van `/dashboard`, zodat de navigatie gelijk blijft.

```
Body
└── Div  · klasse: pl-page
    ├── Div · klasse: pl-dark      → kopieer de header van /dashboard
    └── Div · klasse: pl-light
        └── Div · klasse: pl-container
            └── Div · klasse: pl-section pl-section-pb
                ├── Div  · id: pl-parsepdf-root      ← leeg laten
                ├── Embed 1-config-stijl
                ├── Embed 2-teksten
                ├── Embed 3-teksten-voorstel
                ├── Embed 4-motor
                ├── Embed 5-scherm
                ├── Embed 6-structuur
                ├── Embed 7-velden
                ├── Embed 8-voorstel
                └── Embed 9-verwerken
```

De id `pl-parsepdf-root` moet exact zo geschreven zijn. Zonder die container doet de tool niets en verschijnt er een melding in de console.

De volgorde van de embeds is niet vrij. Embed 9 gebruikt wat 1 tot en met 8 klaarzetten.

## 4. Koppelen aan het dashboard

Zet op `/dashboard` de kaart van ParsePDF om van "Binnenkort" naar een werkende knop, met een link naar de nieuwe pagina. Zeg het als je wilt dat ik dat in de dashboard-embed aanpas; dan haal ik meteen de "Binnenkort"-pill weg voor deze tool.

---

## 5. Hoe het werkt voor de gebruiker

1. **Veldregels instellen.** Elke regel wordt één kolom. Er zijn drie manieren om te zoeken:
   - *Label in de tekst* — zoekt de regel die met dat woord begint en neemt wat erachter staat. Staat er niets achter, dan pakt hij de volgende regel. Het zoeken is woordgrens-bewust, dus `Totaal` pakt niet `Subtotaal`.
   - *Patroon (regex)* — voor gestructureerde waarden zoals een IBAN of een kenmerk. Staat er een haakjesgroep in, dan wordt die groep de waarde. Een ongeldig patroon levert een lege cel op en geen foutmelding.
   - *Bestandsnaam* — zet simpelweg de naam van het document in de kolom.
2. **Opschonen** haalt uit het gevonden stuk tekst alleen het bedrag of alleen de datum. Handig bij regels als `Totaal te voldoen EUR 1.506,45`, waar je alleen `1.506,45` wilt.
3. **Sjablonen.** Facturen, bankafschrift en leeg. Een sjabloon overschrijft de huidige regels.
4. **Bestanden kiezen.** Slepen of via de knop. Alleen PDF, maximaal 25 MB per bestand en 100 bestanden per keer. Bestanden die daarbuiten vallen worden overgeslagen met een melding erbij.
5. **Uitlezen.** Eerst worden de pagina's geteld en getoetst aan je resterende maandlimiet. Past het niet, dan gebeurt er niets en verschijnt er een kaart met hoeveel pagina's je nog hebt.
6. **Resultaat.** Een tabel met één rij per document, en een knop om te downloaden als CSV met puntkomma's en een UTF-8 BOM, zodat Nederlandse Excel de kolommen meteen goed zet.

De regels worden bewaard in `localStorage` van die browser. Ze reizen dus niet mee naar een ander apparaat. Wil je ze aan het account koppelen, dan is daar een tabel voor nodig; zeg het als je dat wilt.

---

## 6. Limietbewaking

Het verbruik loopt via `record_usage('parsepdf', aantal_paginas)` in de database. Die functie telt het verbruik op en weigert zodra de maandlimiet vol is. De interface toetst vooraf ook zelf, zodat een gebruiker niet eerst zit te wachten om daarna te horen dat het niet mag.

Gratis is 50 pagina's per maand, Pro 2.500 en Business 15.000. Die aantallen staan in de tabel `plans` en niet in deze code.

Belangrijk: het tellen gebeurt vóór het uitlezen. Gaat het uitlezen daarna mis bij een bestand, dan zijn die pagina's wel geteld. Dat is bewust, want het alternatief is dat iemand door steeds af te breken gratis kan doorlezen.

---

## 7. Wat het nog niet doet

- **Gescande documenten.** Zonder tekstlaag valt er niets uit te lezen. De gebruiker krijgt per bestand de melding dat het document geen tekstlaag heeft. Tekstherkenning zou een aparte stap zijn.
- **Meerdere rijen per document.** Nu is het één rij per PDF. Regeltabellen uit een factuur uitlezen vraagt een ander model, met een kolomdetectie per pagina.
- **Regels delen binnen een organisatie.** Regels staan per browser.
- **Beveiligde PDF's.** Een bestand met een wachtwoord levert een leesfout op.

---

## 6b. Kijk wat erin staat

Naast zelf veldregels intikken kan de gebruiker op **Kijk wat erin staat** klikken. De tool opent het document, arceert wat hij kan uitlezen, stelt namen voor en neemt die op verzoek over als veldregels. Er is ook een knop **Uitlezen met AI**, die eerst om toestemming vraagt en pas daarna de tekst van dat ene document naar `POST /api/parsepdf/velden` stuurt. Zonder zo'n endpoint blijft alles werken op de structuurcheck. Alles staat in [`PARSEPDF-DOORKIJKEN.md`](PARSEPDF-DOORKIJKEN.md); wijs `window.PARSELAB.aiEndpoint` naar je eigen functie als je de AI-knop wilt laten werken op Webflow.

## 7b. Proef-PDF's

In `parselab/tests/pdfs/` staan zeven documenten om de tool mee te controleren, met de uitkomsten die eruit horen te komen (`tests/pdfs/README.md`). Onder andere een factuur waarbij de waarde op de regel onder het label staat, een met "Subtotaal" boven "Totaal", een van zes pagina's voor de limiet, en één zonder tekstlaag.

## 8. Testen na plaatsen

1. Publiceer en open de pagina in een incognitovenster zonder ingelogd te zijn. Je hoort meteen naar `/inloggen` te gaan.
2. Log in en open de pagina. Bovenaan staat je verbruik van deze maand.
3. Kies het sjabloon Facturen, sleep twee PDF's erin en klik op uitlezen. Je ziet de teller oplopen en daarna de tabel.
4. Controleer dat het verbruik omhoog is gegaan met het aantal pagina's.
5. Download de CSV en open hem in Excel. De kolommen moeten meteen goed staan.
6. Test op een telefoon: de regelvelden staan dan onder elkaar en de tabel scrolt binnen zijn eigen kader.
7. Zet in de database je verbruik tijdelijk vlak onder de limiet en probeer een grote batch. Je hoort de kaart te zien met hoeveel pagina's je nog over hebt.

---

## 9. Als er iets misgaat

| Wat je ziet | Waar het aan ligt |
|---|---|
| Lege pagina, console zegt "onderdelen ontbreken" | Een embed staat in de verkeerde volgorde of ontbreekt |
| "De PDF-motor kon niet worden geladen" | cdnjs is onbereikbaar, of een adblocker blokkeert het script |
| Alle cellen leeg | De regels zoeken naar labels die niet in dit document staan. Zet tijdelijk een regel op *Patroon* met `.+` om te zien of er überhaupt tekst uit komt |
| Kolommen in Excel op één hoop | Excel staat op een andere lijstscheiding. Het bestand gebruikt puntkomma's, wat op Nederlandse instellingen goed gaat |
| Verbruik loopt niet op | `record_usage` gaf een fout. Kijk in de Supabase-logs bij de database |

---

## 10. Aanpassen

De code volgt `DASHBOARD-STYLEGUIDE.md`. Houd je daaraan als je iets toevoegt.

- Een nieuw type veldregel voeg je toe in `pasToe` in embed 3 en in de keuzelijst in embed 4.
- Een nieuw opschoonfilter voeg je toe in `schoon` in embed 3.
- Nieuwe teksten zet je in alle drie de talen in embed 2.
- Groeit een embed boven de 10.000 tekens, splits hem dan en plaats het nieuwe deel vóór embed 5.
