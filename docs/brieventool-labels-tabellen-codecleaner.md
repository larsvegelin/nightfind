# Brieventool – plan: labellijst, codecleaner, Arial 11 en tabellen in X-BRF

Dit document beschrijft de uitbreiding van `brieven.html` vóórdat de code wordt aangepast.
Het is geschreven als werkdocument: wat er komt, waarom, hoe het werkt en hoe het getest wordt.

---

## 1. Aanleiding

De vraag bestaat uit vier onderdelen:

1. **Codecleaner** – de HTML-code van alle brieven moet worden opgeschoond, zodat er alleen nette, voorspelbare code naar het briefsysteem gaat.
2. **Altijd Arial 11** – de brieven gebruiken voortaan altijd Arial 11.
3. **Labellijst koppelen** – een export van alle ANVA-labels (`Labels_anva_uit_sql_1.csv`) moet binnen de brief te gebruiken zijn: labels opzoeken, invoegen en herkennen.
4. **Tabellen in X-BRF** – onder X-BRF moeten tabellen kunnen worden opgebouwd én herkend. Het voorbeeld is een brief over de herbeoordeling van de premie voor een Aansprakelijkheidsverzekering Bedrijven, met een tabel "Jaaromzet / Aantal medewerkers".

---

## 2. De labellijst (ANVA)

### 2.1 Inhoud van het bestand

| Eigenschap | Waarde |
|---|---|
| Bestand | `Labels_anva_uit_sql_1.csv` |
| Codering | UTF-8 met BOM, Windows-regeleinden |
| Scheidingsteken | puntkomma (`;`), velden met `;` erin staan tussen aanhalingstekens |
| Aantal labels | 9.850 (nummers 1 t/m 99999, geen dubbele) |
| Kolommen | `Label`, `Omschrijving`, `CodeVan`, `Code`, `Conversie`, `Lengte` |

Betekenis van de kolommen (afgeleid uit de inhoud):

| Kolom | Betekenis | Voorbeeld |
|---|---|---|
| `Label` | labelnummer | `10078` |
| `Omschrijving` | naam van het gegeven | `Geschatte jaaromzet dit jaar,bedrag` |
| `CodeVan` | label waarvan de codetabel wordt gebruikt (0 = eigen) | `11204` |
| `Code` | `J` = waarde komt uit een codetabel, `N` = vrije waarde | `N` |
| `Conversie` | opmaaktype van de waarde | `00053` |
| `Lengte` | maximale lengte | `16` |

### 2.2 Van labelnummer naar code in de brief

In de brief staat een label als `@L` + labelnummer met voorloopnullen tot 5 cijfers + `@`:

| Label | Code in de brief | Omschrijving |
|---|---|---|
| 84 | `@L00084@` | Relatienummer incl. voorloopnullen |
| 97020 | `@L97020@` | Systeemdatum |
| 99906 | `@L99906@` | Adresseringregel aanhef |
| 60004 | `@L60004@` | Polisnummer pakket |
| 10078 | `@L10078@` | Geschatte jaaromzet dit jaar,bedrag |
| 12409 | `@L12409@` | Aantal personeelsleden (totaal) |
| 10019 | `@L10019@` | Incassobedrag |
| 10007 | `@L10007@` | Termijn |

Velden zoals `@ondertek_naam@` en `@ondertek_tel@` staan niet in de lijst; die blijven zoals ze nu in de tool staan.

### 2.3 Conversietypen → voorbeeldwaarden in de preview

Met "Voorbeeldgegevens invullen" toont de preview een voorbeeldwaarde. Voor labels uit de lijst wordt die afgeleid uit het conversietype:

| Conversie | Aantal | Soort | Voorbeeld in preview |
|---|---|---|---|
| 00001 | 4.171 | tekst | `‹omschrijving›` |
| 00067 | 1.898 | ja/nee | `J` |
| 00053, 00055, 00031, 00051, 00034, 00049 | ~1.400 | bedrag | `1.234,56` |
| 00002, 00065, 00070 | ~430 | datum | datum van vandaag |
| 00045, 00050, 00058 | ~380 | percentage / promillage | `2,50` |
| 00005, 00003 | ~260 | termijn / klein getal | `1` |
| 00011, 00010, 00013, 00040 | ~370 | aantal | `12` |
| 00008 | 131 | jaar | huidig jaar |
| 00063 | 129 | postcode | `1234 AB` |
| 00014 | 100 | huisnummer | `12` |
| 00020 | 35 | relatienummer | `123456` |
| 00086 | 40 | IBAN | `NL00BANK0123456789` |
| overig | | | `‹omschrijving›` |

De bestaande vaste voorbeelden (`@L97020@` datum, `@L00084@` kenmerk, `@L99906@` aanhef, `@ondertek_…@`) blijven voorgaan.

### 2.4 Hoe de lijst in de tool komt

- De volledige lijst wordt **ingebouwd** in `brieven.html` (compact: nummer, omschrijving, code J/N, conversie, lengte). Dat voegt ca. 350 kB toe; de tool blijft één los HTML-bestand dat offline werkt.
- Via **"Labellijst vervangen (.csv)"** kan een nieuwere export worden ingeladen (zelfde kolommen). Die wordt in de browser bewaard en gebruikt in plaats van de ingebouwde lijst; "Ingebouwde lijst gebruiken" zet het terug.

### 2.5 Labels koppelen binnen de brief

Nieuw blok **"Labels (ANVA)"**:

- **Zoeken** op nummer (`10078`, `L10078`, `@L10078@`) of op omschrijving (`jaaromzet`, `polisnummer pakket`). Maximaal 40 resultaten, beste treffers eerst (exact nummer, begint met, bevat).
- Per resultaat: code (`@L10078@`), omschrijving, soort (bedrag/datum/…), lengte, en of het een codetabel-veld is.
- **Klik op een label** → de code wordt ingevoegd op de cursorplek van het **laatst gebruikte invoerveld** dat labels accepteert:
  - HTML-code bij *Eigen*,
  - HTML-code bij *X-BRF eigen*,
  - cellen van de tabelbouwer (X-BRF),
  - onderwerp van de vaste kop.
  Boven de resultaten staat "Invoegen in: …". Is er geen doel, dan wordt de code naar het klembord gekopieerd.
- **Herkennen**: overal waar de tool labels toont, staat de omschrijving erbij:
  - "Uitgelezen samenvoegvelden": `@L10078@ – Geschatte jaaromzet dit jaar,bedrag (bedrag)`;
  - tooltip op de gele label-markering in de preview;
  - onbekende labels (niet in de lijst) worden apart gemeld als waarschuwing.

---

## 3. Codecleaner

### 3.1 Doel

Alle HTML die de tool maakt of inleest, gaat door één **codecleaner** voordat hij wordt getoond, gedownload of gemaild. Het resultaat moet:
- er in het briefsysteem precies hetzelfde uitzien (geen inhoudelijke wijzigingen);
- geen opmaakresten bevatten (breedtes, randen, klassen, Word-code);
- leesbaar zijn (elk blok op een eigen regel, tabellen rij per rij).

### 3.2 Regels

| # | Regel | Voorbeeld vóór | Na |
|---|---|---|---|
| 1 | Opmaakattributen weg: `style`, `width`, `height`, `border`, `cellspacing`, `cellpadding`, `class`, `id`, `lang`, `align`, `valign`, `dir` … | `<table style="width: 29.5791%;" border="0" cellspacing="0" cellpadding="0">` | `<table>` |
| 2 | Uitzondering: pagina-einde en bijeenhouden blijven staan | `<div style="break-before: page;">` | ongewijzigd |
| 3 | Links, `colspan` en `rowspan` blijven staan | `<a href="…">` | ongewijzigd |
| 4 | `span`, `font`, `o:p`, Word-commentaar en lege opmaaktags weg | `<span style="…">tekst</span>` | `tekst` |
| 5 | `b`/`i` → `strong`/`em`; aangrenzende gelijke tags samenvoegen | `<b>Wees</b><b> gerust</b>` | `<strong>Wees gerust</strong>` |
| 6 | Tabelcel met één alinea: alinea eruit | `<td><p>Jaaromzet:</p></td>` | `<td>Jaaromzet:</td>` |
| 7 | Regeleinden aan het eind van vet/cursief naar buiten de tag | `<strong>Heeft u nog vragen?<br><br></strong>` | `<strong>Heeft u nog vragen?</strong><br><br>` |
| 8 | Harde spatie tussen twee woorden → gewone spatie (niet na €, niet in `<p>&nbsp;</p>`) | `samenwerking&nbsp;met` | `samenwerking met` |
| 9 | Lege alinea's zonder inhoud weg; `<p>&nbsp;</p>` (bewuste witregel) blijft | `<p></p>` | weg |
| 10 | Witruimte en regeleinden in de broncode normaliseren | | |
| 11 | Opmaak: elk blok op een eigen regel; tabellen met `<tbody>` en elke rij op een eigen regel | | zie 3.3 |
| 12 | Tekens als entiteit in broncode/HTML-download (bestaand gedrag): `€` → `&euro;`, `é` → `&eacute;` | | |

Wat de cleaner **niet** doet: tekst wijzigen, witregels (`<br><br>`, `<p>&nbsp;</p>`) weghalen, samenvoegvelden aanpassen.

### 3.3 Voorbeeld: de tabel uit de X-BRF-brief

Vóór:
```html
<table style="width: 29.5791%;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width: 50.1036%;" width="302">
<p>Jaaromzet:</p>
</td>
<td style="width: 49.7747%;" width="302">
<p>&euro; @L10078@</p>
</td>
</tr>
...
```
Na:
```html
<table>
<tbody>
<tr><td>Jaaromzet:</td><td>&euro; @L10078@</td></tr>
<tr><td>Aantal medewerkers:</td><td>@L12409@</td></tr>
</tbody>
</table>
```

### 3.4 Waar de cleaner draait

- **Altijd** bij het opbouwen van elke brief (X-OVR, X-BRF, Eigen) → preview, TXT, Word, HTML, broncode, mail.
- **Eigen** en **X-BRF eigen**: knop **"Code opschonen"** zet de opgeschoonde code ook terug in het codevak; plakken/uploaden wordt meteen opgeschoond.
- Een **rapport** in de meldingen: "Code opgeschoond: 8 opmaakattributen verwijderd, 4 tabelcellen vereenvoudigd, 1 regeleinde uit vet gehaald …".

---

## 4. Altijd Arial 11

- De keuzelijst "Arial 10 / Arial 11" verdwijnt; preview en Word-download gebruiken **altijd Arial 11**.
- Preview: 11 pt (met dezelfde correctie van ca. 1,5% als bij 10 pt, zodat de regelval overeenkomt met het briefsysteem), regelafstand 13,2 pt, 11 pt tussen alinea's.
- Word: lettergrootte 11 (`w:sz=22`), regelafstand exact 13,2 pt, 11 pt na alinea.
- De HTML/broncode bevat **geen** lettertype-opmaak (de codecleaner haalt `style` weg); het lettertype komt uit het sjabloon van het briefsysteem. Moet het lettertype óók in de HTML-code staan, dan kan dat later als optie (bijv. `<div style="font-family: Arial; font-size: 11pt;">` om de brief heen).
- **Let op**: de twee voorbeeld-PDF's uit OL Connect staan op 10 pt. Staat het briefsysteem nog op 10 pt, dan valt de paginaverdeling in de preview anders uit dan in de echte brief (met Arial 11 eerder naar een volgende pagina).

---

## 5. Tabellen in X-BRF

### 5.1 Soorten X-BRF

X-BRF krijgt een keuze **"Soort brief"**:

| Soort | Inhoud | Velden |
|---|---|---|
| **Productomzetting** (bestaand) | aanhanger/caravan… omgezet, premiestijging | maatschappij, product, premiestijging |
| **Premie herbeoordeling** (nieuw, het voorbeeld) | premie opnieuw beoordeeld op basis van opgave klant, met tabel uitgangspunten | verzekering, tabel, premie- en termijnlabel |
| **Eigen X-BRF (HTML)** (nieuw) | eigen X-BRF-code plakken; tabellen worden herkend en zijn te bewerken | HTML-code, herkende tabellen |

### 5.2 Sjabloon "Premie herbeoordeling"

```html
<p>Naar aanleiding van de gegevens die u onlangs op ons verzoek heeft verstrekt voor uw {verzekering}, is de premie voor bovengenoemde verzekering opnieuw beoordeeld.</p>
<p>Volgens uw opgave zijn de nieuwe uitgangspunten als volgt:</p>
{tabel}
<p>De premie is na actualisering &euro; @L10019@ per @L10007@ maand(en).</p>
<p>Let op dit bedrag is exclusief een eventuele reguliere premieverhoging per hoofdvervaldatum.</p>
<p><strong>Heeft u nog vragen?</strong><br><br></p>
<p>Bij vragen kunt u contact opnemen met uw verzekeringsadviseur @ondertek_naam@ via telefoonnummer @ondertek_tel@. Zij kunnen u van persoonlijk advies voorzien en helpen u graag verder.<br><br></p>
<p>Met vriendelijke groet,</p>
<p>De Waerdse Assuradeuren B.V.</p>
```
- `{verzekering}`: standaard "Aansprakelijkheidsverzekering Bedrijven", aan te passen.
- `{tabel}`: komt uit de tabelbouwer, standaard:

| Omschrijving | Waarde |
|---|---|
| Jaaromzet: | € @L10078@ |
| Aantal medewerkers: | @L12409@ |

- Onderwerp vaste kop (standaard): "Herbeoordeling premie {verzekering}".
- Bestandsnaam: `De Waerdse - X-BRF herbeoordeling ({verzekering})`.

### 5.3 Tabelbouwer

- Een tabel is een lijst rijen; elke rij heeft cellen (bij de herbeoordeling 2: omschrijving en waarde).
- Knoppen: **+ Rij**, **× (rij verwijderen)**, **↑/↓ (rij verplaatsen)**; bij Eigen X-BRF ook **+ Kolom / − Kolom**.
- Elke cel is een invoerveld dat labels accepteert: klik in de cel, kies een label in "Labels (ANVA)" → de code komt erin. Onder de cel staat welke labels erin zitten met omschrijving.
- Uitvoer: de nette tabel uit §3.3 (geen breedtes/randen).

### 5.4 Tabellen herkennen (Eigen X-BRF)

1. Plak de HTML van een bestaande X-BRF (zoals het voorbeeld) en klik **"Inladen en herkennen"**.
2. De codecleaner schoont de code op (§3).
3. Elke `<table>` wordt herkend en verschijnt in de tabelbouwer als "Tabel 1 – 2 rijen × 2 kolommen".
4. Aanpassingen in de tabelbouwer worden direct in de HTML-code verwerkt (de rest van de brief blijft ongewijzigd).
5. Labels in de tabel worden herkend en met omschrijving getoond.

---

## 6. Wat niet verandert

- X-OVR (brief 1/2/3, Q&A op nieuwe pagina, vraag+antwoord bijeen), kantoren, pakketten, vaste kop, opgeslagen brieven, mail naar helpdesk, pagina-indeling, Word → HTML.
- Downloads (TXT, Word, HTML, broncode) – ze gebruiken alleen de opgeschoonde code en Arial 11.

---

## 7. Testplan

| # | Test | Verwacht |
|---|---|---|
| 1 | Voorbeeld-X-BRF plakken bij Eigen X-BRF → Inladen en herkennen | 1 tabel herkend, 2 rijen × 2 kolommen; code zonder `style`/`width`/`border`; `<td>` zonder `<p>` |
| 2 | Cel "Jaaromzet" wijzigen in tabelbouwer | HTML-code en preview direct bijgewerkt, rest van de brief gelijk |
| 3 | Rij toevoegen, label zoeken op "jaaromzet" en invoegen | `@L10078@` in de cel, omschrijving zichtbaar |
| 4 | Premie herbeoordeling kiezen | tekst gelijk aan voorbeeld, tabel met standaardrijen, labels herkend |
| 5 | Uitgelezen samenvoegvelden | alle labels met omschrijving uit de lijst; onbekende labels gemarkeerd |
| 6 | Voorbeeldgegevens aan | bedrag/datum/aantal-voorbeelden volgens conversietype |
| 7 | Codecleaner op X-OVR-brieven | tekst en paginaverdeling ongewijzigd |
| 8 | Arial 11 | preview 11 pt, Word `w:sz=22`; keuzelijst weg |
| 9 | Labellijst vervangen met CSV | aantal labels getoond, zoeken werkt, terugzetten werkt |
| 10 | Downloads + mail | TXT/Word/HTML/broncode bevatten opgeschoonde tabel; Word-tabel zonder randen |
| 11 | Regressie | eerdere tests (brieven 1/2/3, mail, Word → HTML, pagina-einde) blijven slagen |

---

## 8. Besluiten (open punten afgehandeld)

| # | Punt | Besluit |
|---|---|---|
| 1 | Arial 11 vs. briefsysteem op 10 pt | Eerst **Arial 11**; daarna bijgesteld: de preview moet **1:1** lopen met een echte brief (Pluijm Advies, brief 3, PDF uit OL Connect). Die PDF – net als de twee eerdere – gebruikt Arial met lettergrootte 10. Preview en Word gebruiken nu die grootte; alle regels vallen op dezelfde plek als in de PDF (binnen 0,2 pt). Er is geen keuzelijst. |
| 2 | Tabelbreedte | **Akkoord** – de codecleaner haalt breedtes weg; het briefsysteem bepaalt de breedte. |
| 3 | Afzender X-BRF | **Akkoord** – "De Waerdse Assuradeuren B.V.", plaats Heerhugowaard in de vaste kop. |

---

## 9. Controle 1:1 met de echte brief (Pluijm Advies, brief 3)

| Instelling | Regels met andere regelval | Grootste verschuiving |
|---|---|---|
| Arial 11 | 12 van 19 | 22,6 pt |
| Arial 10 pt (zoals PDF) | 0 van 19* | 0,2 pt |

\* Twee regels tellen in de meting mee als "anders", maar zijn geen opmaakverschil: de aanhef staat in de tool als samenvoegveld `@L99906@`, en de tool haalt "(keuze: Actuele polisvoorwaarden)" automatisch weg.
