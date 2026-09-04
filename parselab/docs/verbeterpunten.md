# Testronde en verbeterpunten

Datum: 4 september 2026. Getest met Playwright (`tests/qa.mjs`, 73 checks) plus de extensietest (38 checks) en handmatige API-checks op de server. Alles slaagt na de reparaties hieronder.

## Wat is getest en werkt

| Onderdeel | Gecontroleerd |
|---|---|
| Inloggen | Ongeldig adres blijft op het scherm; naam uit e-mail; sessie blijft na herladen; uitloggen |
| Overzicht | 4 startkaarten met visual; geen nepdata; begroeting; geen horizontale scroll (1440 en 390 px) |
| Navigatie | Directe links (`#pdf/templates`), stappen in de zijbalk, geen tweede navigator in de tools, Escape sluit dialogen |
| Zoeken | Projecten, tools én stappen |
| Account | AI uit / documenten bewaren aan / bestanden bewaren aan; AI-knop in ParsePDF volgt de schakelaar; blijft na herladen |
| ParseScraper | Fout bij ongeldig adres; robots.txt wordt gerespecteerd; lijst herkend (5 kolommen, leesbare namen, voorbeeldwaarden); element wisselen; volgende-knop; 2 pagina's; Excel (xlsx) en CSV (BOM, `;`); taak met planning op de server; project in zijbalk en overzicht; hernoemen; openen toont laatste resultaat; opnieuw uitvoeren; uit lijst halen |
| Bestanden | Uitvoeringen van de server; bewaarde Excel uit ParsePDF |
| ParsePDF | Uploaden → soortvraag → Aanwijzen met waarden; sjabloon bewaren als project; hernoemen vanuit dashboard komt in de tool; Excel bewaren |
| ParseBoard | Eigen CSV → 6 stappen → dashboard → opslaan als project → heropenen |
| ParseForm | Installatiepaneel, IT-route |
| Zonder server | Hint met startinstructie; ParsePDF werkt gewoon |
| Server-API | file:// en ftp:// geweigerd; localhost/privé-adressen geweigerd; token verplicht (401); robots.txt; browser herstart na crash |
| Extensie | Welkom, rechten, bridge, paneel, lijst laden, 2 rondes invullen, uitlezen, getal maken, taal, geen fouten |

## Gerepareerd in deze ronde

1. **Hernoemen ging verloren.** Een naam die je in het dashboard gaf, werd bij de volgende sync door de tool overschreven. Nu bewaart het dashboard jouw naam (`parselab-project-overrides`) en stuurt hij die door naar de tool: ParseScraper zet hem op de server (`PATCH /api/scrape/tasks/:id`), ParsePDF hernoemt het sjabloon, ParseBoard het overzicht.
2. **"Uit lijst halen" kwam terug.** Zelfde oorzaak; nu wordt het ook in de tool verwijderd (taak op de server, sjabloon, overzicht).
3. **Dubbel welkomstscherm in ParsePDF.** In het dashboard opende ParsePDF zijn eigen onboarding bovenop de soortvraag; die is in het dashboard nu uit.
4. **Servermap was openbaar.** `server/server.js`, `server/proxies.txt` (met proxywachtwoorden) en `package.json` waren via de statische server op te vragen. Alleen dashboard, tools en docs zijn nu bereikbaar; `server/`, `node_modules/` en dotfiles geven 404.
5. **Server herstelde niet na een browsercrash.** Elke volgende aanvraag gaf "browser has been closed". De browser wordt nu opnieuw gestart.
6. **Zoeken vond alleen projectnamen.** Zoekt nu ook tools en stappen.
7. Na inloggen stond er geen `#overzicht` in de adresbalk; `SIGTERM` stopte de server niet netjes.

## Verbeterpunten (nog open)

Prioriteit 1 = eerst doen.

| # | Onderdeel | Wat | Prioriteit |
|---|---|---|---|
| 1 | Dashboard, mobiel | Op een telefoon staat de hele zijbalk boven de inhoud (ruim een schermhoogte). Maak hem inklapbaar met een menuknop. | 1 |
| 2 | ParseForm | "Toevoegen aan Chrome" is een gewone knop zolang `CONFIG.webstoreUrl` leeg is; hij opent nu de IT-route. Zet de Web Store-vermelding erin of noem de knop tot die tijd "Installeren". | 1 |
| 3 | Server | Taken zijn niet per gebruiker: iedereen die de server bereikt ziet en verwijdert elkaars taken. Koppel taken aan een account zodra de backend er is (nu alleen `PARSELAB_API_TOKEN` als drempel). | 1 |
| 4 | ParseScraper | Na "Ander element aanwijzen" blijft de kolomnaam de oude (bijv. "Titel" met voorraadwaarden). Stel de naam opnieuw voor als hij automatisch was. | 2 |
| 5 | ParseScraper | Bestanden van een verwijderde taak verdwijnen uit Bestanden, maar blijven op de schijf van de server (`server/data/runs`). Verwijder ze mee of toon ze onder "zonder taak". | 2 |
| 6 | Server | Pagina's zonder charset worden als Windows-1252 gelezen (`€` wordt `â‚¬`). Detecteer UTF-8 als er geen charset is. | 2 |
| 7 | Server | Een te groot verzoek (> 1 MB) wordt afgebroken zonder antwoord; stuur eerst een nette 413. | 3 |
| 8 | ParsePDF | De tool meldt "2 nakijken" in de zijbalk; die teller blijft staan tot je ParsePDF opnieuw opent. Zet hem terug bij een nieuwe upload. | 3 |
| 9 | Bestanden | De knop rechtsboven heet "Wat wil je doen?"; op deze pagina past "Nieuw project" beter. | 3 |
| 10 | ParseBoard | Er kan maar één overzicht bewaard worden (`board:saved`); een tweede overschrijft het eerste zonder waarschuwing. | 2 |
| 11 | Dashboard | Projecten en instellingen staan in de browser (`localStorage`); een andere computer of browser ziet ze niet. Wacht op accounts en synchronisatie. | 2 |
| 12 | Extensie | De Chrome Web Store-vermelding moet nog worden ingediend; tot die tijd loopt installatie via ontwikkelaarsmodus. | 1 |
| 13 | Dashboard | De inloglink is een mock (geen e-mail wordt verstuurd). | 1 |
| 14 | ParsePDF | AI-herkenning wijst naar `/api/parsepdf/detect`, dat de server nog niet heeft; met AI aan geeft de knop een nette fout. | 2 |
| 15 | Tests | `tests/qa.mjs` draait tegen lokale servers; koppel hem aan CI (GitHub Actions met Playwright) zodat elke push getest wordt. | 2 |
