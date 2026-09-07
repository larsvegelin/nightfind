# ParsePDF gebruiken

*Deze tekst is bedoeld voor op de site, als hulppagina naast de tool. Neem hem over zoals hij is of kort hem in; hij is geschreven voor iemand die de tool voor het eerst opent.*

---

## In het kort

Sleep je PDF's erin, klik op **Kijk wat erin staat**, vink aan wat je wilt hebben en download een tabel. Je documenten blijven op je eigen computer: het uitlezen gebeurt in je browser, er wordt geen bestand verstuurd.

---

## 0. Eerst even proberen

Klik op **Hoe werkt ParsePDF?** voor de uitleg in vijf stappen. Onderaan elke stap staat **Probeer het met een voorbeeld**: een verzonnen factuur van één pagina gaat dan meteen open, zodat je ziet wat de tool eruit haalt voordat je je eigen documenten kiest.

## 1. Documenten kiezen

Sleep ze in het vlak of klik op **Bestanden kiezen**. Alleen PDF, maximaal 25 MB per bestand en 100 bestanden per keer. Wat daarbuiten valt wordt overgeslagen, met de reden erbij.

Wil je zeker weten dat het gaat werken: open eerst één document met **Kijk wat erin staat**.

## 2. Kijk wat erin staat

De tool tekent je document en arceert alles wat hij eruit kan halen:

- **blauw** is een waarde die in je tabel komt,
- **goud** is het label waaraan hij die waarde herkende.

Zweef over een vlak en je ziet welke naam hij voorstelt. Klik erop om het veld aan of uit te zetten. Rechts staat dezelfde lijst met vinkjes; daar pas je de namen aan zoals jij ze in je tabel wilt.

Mist er iets? Klik op **Toon alle tekst**. Dan komt élk stukje tekst uit het document in de lijst, plus de gegevens van het bestand zelf: titel, auteur, aanmaakdatum en de bestandsnaam. Vink aan wat je nodig hebt en laat de rest staan.

Klaar? **Neem over als veldregels**, en daarna **Uitlezen starten**.

## 3. Meerdere soorten documenten: mappen met sjablonen

Facturen van je softwareleverancier zien er anders uit dan die van je wijnhandel. Daarom werk je met mappen:

1. Maak een map, bijvoorbeeld *Facturen*.
2. Open een document van leverancier A, kies je velden en klik **Bewaar als sjabloon**. Geef het een naam, bijvoorbeeld *Wijnleverancier*.
3. Doe hetzelfde voor leverancier B.

Sleep daarna gerust dertig facturen van vijf leveranciers tegelijk erin. De tool kijkt per document welk sjabloon erbij hoort en zet alles in één tabel, met een kolom **Sjabloon** erbij. Een document dat nergens op lijkt heet *onbekend*; maak daar dan een nieuw sjabloon van.

## 4. Opschonen

Per veld kies je wat er uit de gevonden tekst gehaald wordt:

| Opschonen | Wat het doet | Voorbeeld |
|---|---|---|
| Niets | precies wat er staat | `Totaal te voldoen EUR 1.506,45` |
| Bedrag | alleen het bedrag | `1.506,45` |
| Datum | alleen de datum | `12-03-2026` |

## 5. Regeltabellen

Staat er een tabel met artikelregels in je factuur, dan meldt de tool dat: *Regeltabel gevonden — 3 regels met 6 kolommen*. Zet **Eén rij per tabelregel** aan als je elke regel apart in je tabel wilt, met de gegevens van de factuur erbij herhaald. Laat hem uit als je één regel per document wilt.

## 5b. Parsen op eisen

Soms weet je precies wat je zoekt, maar staat het elke keer ergens anders. Onder **Handmatig parsen** staat daarvoor de kaart *Parsen op eisen*. Je zegt niet wáár iets staat, maar wát het is:

- **Bij het woord**: het label of woord dat bij de waarde hoort, bijvoorbeeld *Geboortedatum* of *Totaal*. De tool kijkt in dezelfde cel, in de cel rechts ervan en in de cel erboven. *Totaal* pakt daarbij niet *Subtotaal*: het woord moet los staan.
- **Soort waarde**: datum, bedrag, IBAN, e-mailadres, kenmerk, postcode of telefoonnummer. De tool haalt dan alleen dat stuk uit de cel.
- **Pagina** en **Kolom**: alleen op die pagina, of alleen in die kolom (geteld van links).

Alles wat je invult moet kloppen; wat je leeg laat telt niet mee. Vind de tool meer dan één cel die voldoet, dan wint de bovenste. Met **Eis toevoegen** wordt het een regel met de kolomnaam die je opgaf; die regel werkt in sjablonen net als de andere.

Liever in gewone taal? Typ een zin als *het totaalbedrag onderaan pagina 1* en klik op **Eis maken met AI**. De AI vult de vier velden in, jij controleert en klikt op Eis toevoegen. Daar gaat alleen je zin heen, nooit je document, en het hoort net als het andere AI-gebruik bij Pro en Business.

## 5c. Controleer alle documenten

Heb je meerdere documenten klaarstaan, dan staat onder de regels de knop **Controleer alle documenten**. Elke regel krijgt dan een stand als *gevonden in 5 van 5*. Vindt een regel in een document niets, dan staat erbij in welke bestanden hij mist, zodat je de regel of het sjabloon kunt bijstellen vóór je uitleest. Neem je een voorstel over terwijl er meer dan één document klaarstaat, dan draait deze controle vanzelf. Deze controle leest lokaal en kost geen pagina's van je tegoed.

## 6. Uitlezen met AI

Naast de gewone herkenning kun je Claude laten meekijken. Die geeft velden een duidelijkere naam, vult aan wat de tool miste en waarschuwt als een bedrag niet klopt met de optelling.

- Er gebeurt niets voordat je zelf op **Ja, een keer lezen** klikt. In dat venster staat precies wat er verstuurd wordt: de tekst van dát ene document, niet de rest van je stapel. Het document zelf blijft op je computer en de tekst wordt niet bewaard.
- AI-hulp hoort bij **Pro en Business**, omdat het op onze Claude-tegoeden draait. Met het gratis pakket werkt alles gewoon door op de structuurcheck; die kost niets en is voor de meeste documenten genoeg.
- Eén controle is één AI-tegoed. Je gebruikt de AI om een sjabloon goed te krijgen; de honderd documenten daarna leest de tool zonder AI.

## 7. Downloaden

**Download CSV** geeft een bestand met puntkomma's en een UTF-8 BOM. Nederlandse Excel zet de kolommen daarmee meteen goed; dubbelklikken is genoeg.

## 8. Wat de tool (nog) niet kan

- **Gescande documenten.** Een scan is een foto: er zit geen tekst in om uit te lezen. Je krijgt per bestand de melding dat er geen tekstlaag is. Tekstherkenning staat op de lijst.
- **PDF's met een wachtwoord** kunnen niet worden geopend.
- **Sjablonen delen met een collega** kan nog niet; ze staan in jouw browser.

## 9. Als er iets misgaat

| Wat je ziet | Wat je kunt doen |
|---|---|
| Het document opent niet, of je ziet alleen een melding | Controleer of het een PDF is en geen scan of foto met de extensie `.pdf`. Open het bestand ook eens in je eigen pdf-lezer: kun je daar tekst selecteren? Zo nee, dan zit er geen tekstlaag in. |
| "De PDF-motor kon niet worden geladen" | Je adblocker of netwerk blokkeert het script van cdnjs. Zet je blocker uit voor deze pagina of probeer een ander netwerk. |
| Openen duurt lang | Grote documenten met veel pagina's kosten tijd; de teller onder de knop loopt mee. Boven de 25 MB slaat de tool het bestand over. |
| Alle cellen leeg | Je sjabloon zoekt naar labels die in dít document niet staan. Open het met **Kijk wat erin staat** en maak er een eigen sjabloon van. |
| Kolommen op één hoop in Excel | Je Excel staat op een andere lijstscheiding. Het bestand gebruikt puntkomma's, wat op Nederlandse instellingen goed gaat. |
| Verbruik loopt niet op | Meld het bij ons; dan kijken we in de logs mee. |

## 10. Wat er met je documenten gebeurt

Niets, buiten je browser. De PDF wordt in je eigen browser geopend en uitgelezen; hij gaat niet naar onze server en wordt niet bewaard. Wat wij bijhouden is hoeveel pagina's je hebt gelezen, om je pakket te kunnen tellen. Alleen als je zelf op **Uitlezen met AI** klikt en daar ja op zegt, gaat de tekst van dat ene document naar onze server en van daar naar het AI-model.
