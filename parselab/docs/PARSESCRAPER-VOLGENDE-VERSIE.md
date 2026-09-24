# ParseScraper: wat het doet, hoe het eruitziet en wat het nog moet worden

ParseScraper haalt lijsten van websites: producten, prijzen, adressen, vacatures. Je plakt een adres, wijst één item aan, en de tool zoekt de rest. Dit stuk beschrijft wat er nu staat, waar het schuurt, hoe de vormgeving hoort te zijn en welke functies erbij moeten — inclusief de AI-hulp die er sinds vandaag in zit.

---

## 1. Wat er nu is

**De flow: Adres → Aanwijzen → Klaar.**

1. **Adres.** Je plakt een webadres. De server haalt de pagina op met een echte browser (Playwright), zodat pagina's die hun inhoud met JavaScript laden ook werken. Optioneel via een proxy.
2. **Aanwijzen.** De opgehaalde pagina staat in een iframe. Klik één item aan; de tool vraagt: *dit ene item of de hele lijst?* Kiest je de lijst, dan zoekt hij items met hetzelfde patroon en stelt kolommen voor: titel, prijs, voorraad, afbeelding, link.
3. **Klaar.** Uitlezen, downloaden als Excel of CSV, of bewaren als taak die elk uur, elke dag of elke week draait terwijl je computer uit staat.

**Wat er onder de motorkap vastligt** (in `server/server.js`, bewust en niet te omzeilen):

| Grens | Waarde |
|---|---|
| Protocollen | alleen http en https, geen privé-adressen (SSRF-slot) |
| robots.txt | wordt gerespecteerd; een geblokkeerd pad geeft een uitleg |
| Snelheid | minimaal 2 seconden tussen verzoeken per website |
| Tegelijk | 2 pagina's |
| Per ronde | 25 pagina's, 5.000 rijen |
| User-agent | herkenbaar, met een adres erbij |

Geen omzeiling van captcha's of botbescherming. Sites achter een login zijn werk voor de extensie, in je eigen browser.

**Wat er al goed werkt:** het aanwijzen zelf, kolommen hernoemen, per kolom een ander element kiezen, de volgende-knop aanwijzen, doorscrollende lijsten, taken plannen, Excel met opmaak en CSV met puntkomma's.

---

## 2. Waar het schuurt

1. **Je moet zelf begrijpen wat een "item" is.** De vraag *dit item of de hele lijst?* is helder, maar als de pagina geen nette lijst heeft (een tabel, een kaartenraster met reclame ertussen) valt de herkenning terug op iets willekeurigs.
2. **Kolomnamen komen uit de HTML.** Je krijgt "Titel" en "Prijs" als de site nette klassen heeft, en anders "Kolom 3". *Sinds vandaag helpt de AI daarbij; zie §5.*
3. **Geen voorbeeld vooraf.** Je ziet pas na het uitlezen of het klopt. Een voorbeeldtabel van drie rijen tijdens het aanwijzen zou de helft van de missers wegnemen.
4. **Detailpagina's zitten er niet in.** Je kunt de link van een item meenemen, maar niet automatisch die pagina openen en daar nog vier velden ophalen. Dat is de meestgevraagde stap.
5. **Taken zijn stil.** Ze draaien, maar melden niets. Geen mail bij een fout, geen "er zijn 12 nieuwe rijen".
6. **Wijzigingen zie je niet.** Twee ronden van dezelfde taak leveren twee losse bestanden; wat er veranderd is moet je zelf uitzoeken.
7. **Eén tabel per taak.** Een site met twee lijsten op één pagina vraagt twee taken.

---

## 3. Vormgeving

De tool volgt `DASHBOARD-styleguide.md`. Wat daarvan hier het meest telt:

**Kleur.** Navy `#1F3A5F` voor de hoofdknop, crème `#F2F0E7` op donker, inkt `#16293F` voor tekst, `#4A5A6C` voor bijschriften (haalt 4,5:1 op wit), goud `#C9A961` alleen voor aandacht en de focusring, blauw `#2C6FA8` voor voortgang. Rood `#8A3B2E` alleen bij een fout die je moet oplossen.

**Ritme.** Kaarten met radius 20 en 28px binnenruimte, knoppen radius 14 en minstens 44px hoog, velden radius 12. Twee schaduwen, niet meer: `0 18px 44px rgba(6,18,35,.10)` voor een kaart, `0 24px 60px rgba(6,18,35,.28)` voor iets dat boven de pagina zweeft.

**Tekst.** 34px paginatitel, 30px cijfer, 24px kaarttitel, 16px lopende tekst, 15px in velden, 13px voor labels en bijschriften. Onder 480px zakt de titel naar 28px.

**De drie eigen onderdelen van deze tool:**

| Onderdeel | Hoe het hoort te zijn |
|---|---|
| **Aanwijskader** | De opgehaalde pagina in een iframe met een balk erboven: welke modus je aan hebt en welk adres je ziet. Een item onder de muis krijgt een blauwe rand van 2px; het gekozen item goud. Nooit de site zelf herkleuren. |
| **Kolomlijst** | Per kolom: vinkje, naam (bewerkbaar), drie voorbeeldwaarden in `JetBrains Mono` 13px, en "Ander element aanwijzen". Voorbeeldwaarden zijn wat de gebruiker overtuigt; die mogen nooit ontbreken. |
| **Flow rechts** | Vier stappen (adres, item, kolommen, volgende pagina) met per stap wat er gekozen is en een knop om het te wijzigen. Klaar is een vinkje, niet een kleur alleen. |

**Toestanden die ontworpen moeten zijn**, niet alleen de gelukkige: leeg (nog niets aangewezen), bezig (de pagina wordt opgehaald — met de reden zichtbaar: "we wachten 2 seconden, dat hoort zo"), gelukt, mislukt (met wat je nu kunt doen), en geweigerd (robots.txt: uitleggen, niet verontschuldigen).

---

## 4. Functies die erbij moeten

In volgorde van wat het meeste oplevert.

### 4.1 Voorbeeld van drie rijen tijdens het aanwijzen
Onder de kolomlijst een tabelletje met de eerste drie items, live bijgewerkt bij elke wijziging. Kost weinig: de gegevens staan al in `samples`. Neemt de meeste teleurstellingen weg.

### 4.2 Detailpagina's meenemen
Zet een schakelaar bij een kolom met een link: *"open deze pagina en haal daar ook velden op"*. Je wijst dan op één detailpagina de extra velden aan; de tool doet dat voor elk item, met dezelfde 2 seconden ertussen en een eigen paginagrens (standaard 25). Rijen worden breder, niet talrijker.

### 4.3 Verschillen tussen ronden
Bewaar per taak een vingerafdruk per rij (de sleutelkolom, of anders alle waarden gehasht). Bij de volgende ronde: *12 nieuw, 3 gewijzigd, 1 weg*. Toon dat in de taaklijst en zet het in het Excel-bestand als kolom **Status**. Dit maakt van een scraper een bewakingstool, en dat is waar mensen voor betalen.

### 4.4 Melding bij een taak
Per taak instelbaar: mailen bij elke ronde, alleen bij wijzigingen, of alleen bij een fout. Vraagt een mailweg op de server (dezelfde die de inloglink gaat versturen).

### 4.5 Tabellen herkennen
Staat er een `<table>` op de pagina, sla dan het aanwijzen over en stel de kolommen meteen voor uit de koprij. Dat is een veelvoorkomend geval dat nu onnodig omslachtig is.

### 4.6 Twee lijsten op één pagina
Sta een tweede itemselectie toe binnen dezelfde taak, met een eigen tabblad in het Excel-bestand.

### 4.7 Opschonen per kolom
Wat ParsePDF al heeft: bedrag, datum, getal, tekst schoonvegen (spaties, valutatekens, duizendtallen). Nu komt "€ 28,95" als tekst binnen en moet Excel het gokken.

### 4.8 Proefronde
Een knop *"probeer op 3 pagina's"* voordat je een taak van 25 pagina's plant. Scheelt tijd en verkeerde taken.

---

## 5. AI-hulp

**Wat er nu in zit: kolommen benoemen.** Op de aanwijsstap staat **Kolommen benoemen met AI**. Er gebeurt pas iets nadat je expliciet ja klikt; er gaan alleen de kolomnamen en drie voorbeeldwaarden per kolom naar de eigen server, niet de hele pagina. Claude geeft elke kolom een Nederlandse naam die zegt wat erin staat, en zet kolommen uit die niets toevoegen (navigatie, lege kolommen, losse iconen).

```
browser → POST /api/scrape/kolommen
          { titel, kolommen:[{naam, voorbeelden:[…]}] }
server  → Claude (PARSELAB_AI_MODEL, standaard claude-opus-5)
antwoord→ { kolommen:[{nummer, naam, houden}] }
```

De sleutel staat op de server, nooit in de browser. Zonder sleutel antwoordt de server met 501 en zegt de tool dat netjes; alles blijft werken. Staan `PARSELAB_SUPABASE_URL` en `PARSELAB_SUPABASE_KEY` ingesteld, dan eist het eindpunt een ingelogde gebruiker wiens pakket het toelaat (databasefunctie `ai_allowed`), net als bij ParsePDF.

**Wat er daarna moet komen:**

1. **"Wat wil je van deze pagina?"** — je typt *"alle producten met prijs en voorraad"*, de AI kijkt naar de opgehaalde pagina en stelt het item en de kolommen voor. Dat vervangt het aanwijzen voor wie het te ingewikkeld vindt, zonder het weg te nemen voor wie het wél snapt.
2. **Zelf herstellen als een site verandert.** Draait een taak leeg, dan mag de AI één keer kijken of de selector verschoven is en een nieuwe voorstellen. Jij krijgt het als voorstel te zien, de taak wijzigt niet stiekem.
3. **Opschonen voorstellen.** Aan de voorbeeldwaarden zie je of een kolom een bedrag, datum of getal is; laat de AI dat invullen als de vorm het niet zeker zegt.
4. **Samenvatting bij een ronde.** Eén zin bij het resultaat: *"38 producten, 6 goedkoper dan vorige week, 2 uitverkocht."* Dat is precies wat iemand in een mail wil lezen.

Steeds dezelfde regels: één document of één pagina per aanroep, alleen na een duidelijke ja, en het model doet het benoemen — niet het uitlezen zelf.

---

## 6. Bouwvolgorde

| Fase | Wat | Waarom eerst |
|---|---|---|
| 1 | Voorbeeld van drie rijen, opschonen per kolom, proefronde | Klein werk, direct minder missers |
| 2 | Verschillen tussen ronden + Status-kolom | Maakt er een bewakingstool van |
| 3 | Detailpagina's | Meestgevraagd, maar raakt de paginagrenzen; goed testen |
| 4 | Meldingen per mail | Vraagt de mailweg die er toch moet komen |
| 5 | AI: "wat wil je van deze pagina?" en zelfherstel | Bouwt op wat er nu al staat |

---

## 7. Waaraan je meet of het klopt

`tests/qa.mjs` doorloopt de tool al met een testwinkel op poort 9000: adres, aanwijzen, element wisselen, volgende pagina, uitlezen, Excel en CSV, taak bewaren, hernoemen, verwijderen, en de AI-knop met toestemming. Wat erbij hoort te komen per functie:

- **voorbeeldtabel**: drie rijen zichtbaar zodra er kolommen zijn, en ze wijzigen mee als je een kolom uitvinkt;
- **detailpagina's**: een taak op de testwinkel die per product ook de omschrijving van de detailpagina haalt, met de 2 seconden per verzoek aantoonbaar aangehouden;
- **verschillen**: twee ronden op een gewijzigde testpagina geven 1 nieuw, 1 gewijzigd, 1 weg;
- **robots.txt**: blijft weigeren, ook via de nieuwe wegen;
- **AI**: zonder sleutel een nette melding, met een namaakantwoord de nieuwe kolomnamen overgenomen.

---

## 8. Wat het bewust niet gaat doen

- Inloggen op sites of captcha's omzeilen. Dat is de extensie, in je eigen browser, met jouw account.
- Sneller dan 2 seconden per website. Dat is geen instelling maar een principe.
- Persoonsgegevens verzamelen als doel. De tool haalt wat openbaar staat; wat je ermee doet valt onder de AVG en dat blijft jouw verantwoordelijkheid.
