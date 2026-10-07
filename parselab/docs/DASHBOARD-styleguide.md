# ParseLab dashboard — styleguide

Versie 1.0 · 6 september 2026
Geldt voor `/dashboard` en elke toolpagina die daaronder komt te hangen (ParsePDF, ParseForm, ParseScraper, ParseBoard).

Dit document is de bron van waarheid. Wijkt de code hiervan af, dan is de code fout — niet dit document.

---

## 1. Uitgangspunten

Vier regels die alles eronder verklaren.

1. **Rustig grondvlak, één accent.** De achtergrond is warm gebroken wit, kaarten zijn wit, en donkerblauw draagt alle nadruk. Blauw en goud gebruik je spaarzaam, alleen om betekenis te geven (blauw = actief/informatie, goud = let op).
2. **Elk oppervlak declareert zijn eigen tekstkleur.** Nooit erven. Dit is geen stijlvoorkeur maar een harde regel: op de marketingsite verdween tekst omdat lichte kaarten de crèmekleur van de donkere sectie eromheen erfden. Elke `background` krijgt in dezelfde regel een `color`.
3. **Getallen zijn monospace, taal is Poppins.** Alles wat je met het oog wilt vergelijken (aantallen, bedragen, percentages, bestandsnamen, veldnamen) staat in JetBrains Mono zodat cijfers netjes onder elkaar uitlijnen.
4. **Elke toestand is ontworpen.** Leeg, laden, fout, bezig, geslaagd en over-de-limiet zijn geen randgevallen maar schermen die je expliciet bouwt.

---

## 2. Kleuren

### 2.1 Palet

| Rol | Hex | Waar |
|---|---|---|
| Inkt (primaire tekst) | `#16293F` | Alle koppen en tekst op lichte vlakken |
| Navy (primair oppervlak) | `#1F3A5F` | Primaire knop, donkere kaart, zijbalk |
| Navy diep (paneel) | `#1A3253` | Paneel binnen een donkere kaart, verbruiksblok |
| Crème (tekst op donker) | `#F2F0E7` | Tekst en iconen op navy |
| Pagina | `#FBFAF6` | Achtergrond van de dashboardpagina |
| Kaart | `#FFFFFF` | Kaartoppervlak |
| Leisteen (secundaire tekst) | `#4A5A6C` | Ondersteunende tekst, labels, monospace-meta |
| Hairline | `#E6E3D8` | Randen, scheidingslijnen, meterrail |
| Veldrand | `#8A90A5` | Rand van invoervelden |
| Blauw (accent) | `#2C6FA8` | Voortgang, actieve staat, links |
| Blauw op vlak | `#215A88` | Blauwe tekst op `#DCE8F2` (donkerder voor contrast) |
| Blauw tint | `#DCE8F2` | Informatiemelding, actieve rij, blauwe pill |
| Goud | `#C9A961` | Focusring, waarschuwingsrand, "let op"-accent |
| Zand tint | `#EDE7D5` | Waarschuwingsmelding |
| Rood-bruin | `#8A3B2E` | Onomkeerbare actie (account verwijderen) |
| Stip neutraal | `#B9C3CE` | Inactieve statusstip |

Geen andere kleuren. Heb je een nieuwe betekenis nodig, voeg hem hier eerst toe.

### 2.2 Contrastregels

Minimum is 4,5:1 voor tekst tot 18px en 3:1 voor grotere tekst en voor randen van bedieningselementen.

- `#4A5A6C` op `#FFFFFF` haalt 6,4:1 — dit is de ondergrens voor secundaire tekst. Gebruik nooit lichter dan dit op wit.
- Crème op navy zit rond 11:1. Transparante crème mag tot `rgba(242,240,231,.62)`; daaronder is het decoratief en mag er geen informatie in staan.
- Blauwe tekst op blauwe tint gebruikt `#215A88`, niet `#2C6FA8` — die laatste haalt het net niet op `#DCE8F2`.

### 2.3 Oppervlakteparen

Gebruik alleen deze combinaties. Links het oppervlak, rechts de verplichte tekstkleuren.

| Oppervlak | Primaire tekst | Secundaire tekst |
|---|---|---|
| `#FBFAF6` pagina | `#16293F` | `#4A5A6C` |
| `#FFFFFF` kaart | `#16293F` | `#4A5A6C` |
| `#1F3A5F` navy kaart | `#F2F0E7` | `rgba(242,240,231,.82)` |
| `#1A3253` diep paneel | `#F2F0E7` | `rgba(242,240,231,.82)` |
| `#DCE8F2` info | `#16293F` | `#215A88` |
| `#EDE7D5` waarschuwing | `#16293F` | `#4A5A6C` |

---

## 3. Typografie

Twee families, meer niet.

- **Poppins** — interface, koppen, knoppen, lopende tekst. Gewichten 400, 500, 600, 700.
- **JetBrains Mono** — getallen, percentages, bestandsnamen, veldnamen, technische waarden. Gewicht 400.

Fallback: `Poppins, -apple-system, "Segoe UI", system-ui, sans-serif` en `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.

### 3.1 Schaal

| Naam | Grootte | Regelafstand | Gewicht | Letterafstand | Gebruik |
|---|---|---|---|---|---|
| Paginatitel | 34px | 1.1 | 700 | -0.01em | "Hoi Lars" bovenaan |
| Sectietitel | 24px | 1.2 | 600 | -0.01em | Kop boven een blok binnen een pagina |
| Kaartgetal | 30px | 1.1 | 700 | -0.01em | Het grote getal in een kaart |
| Body | 16px | 1.55 | 400 | 0 | Lopende tekst |
| Body klein | 15px | 1.5 | 400 | 0 | Meldingen, tabelcellen |
| Kapitaal | 13px | 1.2 | 500 | 0.02em, uppercase | Label boven een waarde |
| Mono | 13px | 1.5 | 400 | 0.02em | Getallen, technische waarden |
| Veldlabel | 13px | 1.4 | 500 | 0 | Label boven een invoerveld |

Op schermen smaller dan 480px zakt de paginatitel naar 28px en het kaartgetal naar 26px. De rest blijft gelijk; kleiner dan 13px komt nergens voor.

### 3.2 Regels

- Koppen krijgen nooit `text-transform`, behalve de kapitaalstijl.
- Lopende tekst maximaal 66 tekens breed (`max-width: 66ch`).
- Getallen altijd met Nederlandse scheiding via `toLocaleString`, dus 2.500 en niet 2500 of 2,500. Volgt de taal van het profiel.

---

## 4. Ruimte, hoeken, schaduw

### 4.1 Spatiëring

Schaal in pixels: **4, 6, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64**. Niets daartussen.

- Binnenruimte kaart: 28px, bij een compacte kaart 20px.
- Ruimte tussen kaarten: 24px.
- Ruimte tussen elementen in een kaart: 12px.
- Ruimte boven een nieuwe sectie: 40px, met 16px onder de sectiekop.
- Binnenruimte knop: 15px verticaal, 24px horizontaal; klein 10px en 16px.

### 4.2 Hoekradius

| Waarde | Waarvoor |
|---|---|
| 20px | Kaarten en panelen |
| 14px | Knoppen, invoervelden, meldingen, tegels |
| 12px | Kleine tegels, selects |
| 9px | Iconenblokje |
| 999px | Pills, stippen, meters, avatars |

### 4.3 Schaduw

Twee stuks, meer niet.

- Vlakke kaart: `0 18px 44px rgba(6,18,35,.10)`
- Verhoogde of donkere kaart: `0 24px 60px rgba(6,18,35,.28)`

Geen randen op kaarten. De schaduw doet het scheidingswerk. Randen zijn er alleen voor invoervelden en tabelrijen.

---

## 5. Layout

### 5.1 Pagina

De dashboardpagina bestaat uit één kolom, gecentreerd, met een maximale breedte van 1120px en 24px zijmarge. Daarbinnen:

```
kop (titel + acties)          ← 32px onder
meldingenstrook                ← alleen als er iets te melden is
kaartenraster                  ← statistiek en pakket
tool-inhoud                    ← per pagina anders
profielsectie                  ← alleen op /dashboard
gevarenzone                    ← alleen op /dashboard
```

### 5.2 Raster

Kaarten liggen in een raster dat zichzelf indeelt:

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
gap: 24px;
```

Elke kaart krijgt `min-width: 0`, anders duwt lange inhoud het raster uit beeld. Dit is de meest gemaakte fout; zonder deze regel ontstaat horizontaal scrollen.

### 5.3 Breekpunten

| Breekpunt | Gedrag |
|---|---|
| ≥ 992px | Volledig raster, kop en acties naast elkaar |
| 768–991px | Raster valt terug naar twee kolommen, kaartpadding 24px |
| 480–767px | Eén kolom, kop en acties onder elkaar, knoppen op volle breedte |
| < 480px | Titel 28px, kaartpadding 20px, tabellen scrollen horizontaal binnen hun eigen kader |

Brede inhoud, dus tabellen en lange technische waarden, scrolt binnen een eigen container met `overflow-x: auto`. De pagina zelf scrolt nooit horizontaal.

---

## 6. Componenten

Alle klassen beginnen met `pld-`. Een nieuwe component krijgt dat voorvoegsel ook.

### 6.1 Kaart — `pld-card`

Wit, 20px rond, 28px binnenruimte, vlakke schaduw, inhoud onder elkaar met 12px ertussen, expliciet `color: #16293F`.

Variant `pld-card--navy`: navy achtergrond, crème tekst, verhoogde schaduw. Gebruik hem voor precies één ding per scherm — het belangrijkste aanbod of de belangrijkste keuze. Twee navy kaarten naast elkaar vechten met elkaar.

### 6.2 Kaartkop — `pld-caps` en `pld-num`

Een kaart opent met een kapitaal label en daaronder de waarde in het grote getal. Het label zegt *wat*, het getal zegt *hoeveel*. Daaronder mag één regel uitleg in `pld-text`.

### 6.3 Knoppen — `pld-btn`

| Variant | Uiterlijk | Wanneer |
|---|---|---|
| standaard | navy vlak, crème tekst | De hoofdactie, één per scherm |
| `--cream` | crème vlak, inkt tekst | Hoofdactie op een navy kaart |
| `--ghost` | transparant, navy rand en tekst | Secundaire acties |
| `--danger` | transparant, roodbruine rand en tekst | Onomkeerbaar, altijd met bevestiging |
| `--sm` | 10px/16px, 14px tekst | In een rij of kaartvoet |

Gedrag: hover verhoogt de helderheid met 8 procent. Focus toont `outline: 2px solid #C9A961` met 3px afstand. Tijdens laden wordt de knop uitgeschakeld en verandert het label in "Bezig…", en het oorspronkelijke label komt terug bij een fout. Minimale aanraakhoogte 44px.

### 6.4 Pill — `pld-pill`

Statuslabel, 999px rond, 13px, gewicht 600. Neutraal is crème met inkt. Variant `--on` is blauwe tint met `#215A88` en betekent actief. Een pill is nooit klikbaar; klikbaar betekent knop.

### 6.5 Meter — `pld-bar`

Rail in `#E6E3D8`, vulling in `#2C6FA8`, hoogte 10px, volledig rond. Boven de meter staat "gebruikt van totaal" als tekst, want een balk alleen is niet afleesbaar. Vanaf 80 procent wordt de vulling goud (`pld-bar--hot`). Boven 100 procent blijft de balk vol en verschijnt eronder een waarschuwingsmelding met een upgrade-knop.

De balk krijgt `role="progressbar"` met `aria-valuenow`, `aria-valuemin` en `aria-valuemax`.

### 6.6 Melding — `pld-msg`

Volle breedte, 14px/18px binnenruimte, 14px rond, 24px eronder.

- Informatie: blauwe tint, inkt tekst.
- Waarschuwing (`--warn`): zand tint met een 3px gouden linkerrand.
- Een melding die een actie vraagt bevat die actie als kleine knop in dezelfde melding.

Meldingen krijgen `role="status"` en `aria-live="polite"`, behalve foutmeldingen na een handeling; die krijgen `role="alert"`.

### 6.7 Invoer — `pld-in` en `pld-sel`

Volle breedte, 12px/14px binnenruimte, 12px rond, 1px rand `#8A90A5`, witte achtergrond, inkt tekst, 15px. Label erboven in de veldlabelstijl met 6px ertussen. Bij focus wordt de rand `#2C6FA8` en verschijnt de gouden focusring.

Foutstaat: rand goud, en onder het veld één regel uitleg in 13px `#8A3B2E`. Nooit alleen kleur gebruiken om een fout aan te geven — er staat altijd tekst bij.

### 6.8 Tabel — `pld-table`

Voor resultaten en bestandslijsten. Kop in kapitaalstijl, `#4A5A6C`. Rijen gescheiden door een 1px lijn `#E6E3D8`, 12px verticale ruimte. Getalkolommen rechts uitgelijnd in mono. Rij bij aanwijzen krijgt `#FBFAF6`.

Boven de 6 kolommen of op smalle schermen zit de tabel in een container met `overflow-x: auto` en `min-width: 0` op de kaart eromheen.

### 6.9 Dropzone — `pld-drop`

Voor bestandsinvoer. Gestippelde rand van 2px in `#8A90A5`, 20px rond, 48px binnenruimte, gecentreerde tekst, witte achtergrond. Bij slepen wordt de rand `#2C6FA8` en de achtergrond `#DCE8F2`. Bevat altijd ook een gewone knop, want slepen werkt niet op mobiel en niet met toetsenbord.

Onder de zone staat één regel met de grenzen: toegestane formaten, maximale bestandsgrootte en het aantal bestanden per keer.

### 6.10 Toestandsschermen

| Toestand | Vorm |
|---|---|
| Laden | Kaart met een skeletbalk van 14px hoog in `#E6E3D8` die zacht pulseert. Bij `prefers-reduced-motion` staat de animatie uit. |
| Leeg | Kaart met kapitaal label, één zin die uitlegt wat hier komt, en de knop die de eerste stap zet |
| Fout | Waarschuwingsmelding met wat er misging en wat de gebruiker nu kan doen, plus `hallo@parselab.nl` als laatste uitweg |
| Bezig | Knop uitgeschakeld met "Bezig…", en bij lange taken een meter met verwerkte aantallen |
| Klaar | Informatiemelding met het resultaat en direct de vervolgactie, bijvoorbeeld downloaden |

---

## 7. Toegankelijkheid

- Focus is altijd zichtbaar: `outline: 2px solid #C9A961; outline-offset: 3px`. Nooit `outline: none` zonder vervanging.
- Aanraakdoelen zijn minimaal 44 bij 44 pixels.
- Kleur draagt nooit alleen de betekenis; er staat altijd tekst of een pictogram bij.
- Volgorde in de DOM is de leesvolgorde. Verplaats dingen niet met `order` als dat de logica breekt.
- `document.documentElement.lang` volgt de taal uit het profiel, zodat schermlezers goed uitspreken.
- Animaties respecteren `prefers-reduced-motion`.
- Elke afbeelding of icoon die betekenis draagt heeft een tekstalternatief; decoratieve iconen krijgen `aria-hidden="true"`.

---

## 8. Taal en teksten

Het dashboard spreekt Nederlands, Engels en Duits. De taal komt uit `profiles.locale` en is instelbaar in het profiel. Vóór het inloggen volgt de interface de browsertaal.

Toon: kort, direct, geen uitroeptekens, geen jargon. Zeg wat er gebeurde en wat de gebruiker nu kan doen.

- Goed: "De batch is klaar. 98 rijen uitgelezen, 3 regels vragen aandacht."
- Fout: "Succes! Uw bestanden zijn succesvol verwerkt!!"

Foutteksten benoemen nooit techniek. "Er ging iets mis bij het opslaan" en niet "500 Internal Server Error". De technische details gaan naar `console.error`.

Elke nieuwe tekst komt in alle drie de talen in het vertaalobject. Ontbreekt een taal, dan valt hij terug op Nederlands.

---

## 9. Techniek

### 9.1 Opbouw in Webflow

Het dashboard is één Webflow-pagina met een lege container met id `pl-dashboard-root`, gevolgd door vier HTML-embeds in deze volgorde:

| Volgorde | Embed | Inhoud |
|---|---|---|
| 1 | configuratie en stijl | Supabase-client, `window.PARSELAB`, alle `pld-` CSS |
| 2 | vertalingen | `window.PL_T` met nl, en, de |
| 3 | akkoordscherm | `window.PL_GATE`, getoond als de voorwaarden nog niet zijn aanvaard |
| 4 | logica | Sessiecheck, gegevens laden, scherm opbouwen |

Een embed mag maximaal ongeveer 10.000 tekens bevatten. Wordt het meer, dan splits je in een nieuwe embed die je vóór de logica plaatst. Elke embed is op zichzelf geldig JavaScript; controleer dat vóór plaatsen.

### 9.2 Naamgeving

`pld-` voor dashboardcomponenten, `pl-` voor stijlen van de marketingsite. Meng ze niet. Een variant is een tweede klasse met dubbele streep, dus `pld-btn pld-btn--ghost`.

### 9.3 Gegevens

Alles komt uit Supabase via de publieke sleutel. De regels in de database bepalen wat iemand mag zien; de interface vertrouwt nooit op zichzelf voor beveiliging.

| Bron | Levert |
|---|---|
| `profiles` | naam, e-mail, organisatie, taal, akkoord voorwaarden |
| `subscriptions` | status, pakket, einddatum, opzegging |
| `usage_summary()` | pakket, maandlimiet, verbruikt, start van de periode |
| `record_usage(tool, pagina's)` | telt verbruik en weigert boven de limiet |
| Edge Functions | afrekenen, klantportaal, account verwijderen |

Een tool schrijft verbruik altijd via `record_usage` en nooit rechtstreeks in een tabel. Die functie bewaakt de limiet en is de enige plek waar dat gebeurt.

### 9.4 Volgorde bij laden

1. Sessie ophalen. Geen sessie betekent doorsturen naar `/inloggen`.
2. Profiel, abonnement en verbruik in één keer parallel ophalen.
3. Taal instellen op basis van het profiel.
4. Voorwaarden nog niet aanvaard? Dan het akkoordscherm tonen en stoppen.
5. Scherm opbouwen.

Tussen stap 1 en 5 staat er een laadtoestand. Nooit een leeg wit vlak.

---

## 10. Checklist voor een nieuw dashboardonderdeel

Loop deze lijst af voordat je iets publiceert.

- [ ] Elk oppervlak declareert zijn eigen `color`
- [ ] Alleen kleuren uit paragraaf 2.1
- [ ] Alleen maten uit de schaal in 4.1
- [ ] Kaarten hebben `min-width: 0`; de pagina scrolt niet horizontaal
- [ ] Laden, leeg, fout, bezig en klaar zijn alle vijf ontworpen
- [ ] Knoppen schakelen uit tijdens een actie en herstellen bij een fout
- [ ] Focus is zichtbaar op alles wat bedienbaar is
- [ ] Teksten staan in nl, en en de
- [ ] Getallen gaan door `toLocaleString` met de juiste taal
- [ ] Verbruik loopt via `record_usage`
- [ ] Getest op 375px, 768px en 1440px breed
- [ ] Embed blijft onder de 10.000 tekens en is syntactisch geldig
