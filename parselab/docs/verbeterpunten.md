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

## Verbeterpunten: uitgevoerd

Alle vijftien punten uit de eerste lijst zijn opgepakt; de testrun is uitgebreid naar 81 checks.

| # | Onderdeel | Wat er nu is |
|---|---|---|
| 1 | Mobiel | Zijbalk is op smalle schermen ingeklapt achter een menuknop; kiezen sluit het menu. |
| 2 | ParseForm | Zonder Web Store-adres heet de knop "Installeren" en opent hij de IT-route; met `CONFIG.webstoreUrl` wordt het "Toevoegen aan Chrome". |
| 3 | Server | Taken horen bij de ingelogde gebruiker (`x-parselab-user`); anderen zien, wijzigen of draaien ze niet. Zie README: scheiding, geen beveiliging zolang er geen accounts zijn. |
| 4 | ParseScraper | Na "Ander element aanwijzen" krijgt de kolom de naam van het nieuwe element, tenzij je de naam zelf had aangepast. |
| 5 | ParseScraper | Uitvoeringen worden mee verwijderd met de taak. |
| 6 | Server | Pagina's zonder charset worden als UTF-8 gelezen als de bytes geldige UTF-8 zijn (`€` blijft `€`). |
| 7 | Server | Te groot verzoek geeft een nette 413 met uitleg. |
| 8 | ParsePDF | De teller "nakijken" telt alleen regels van documenten die er nog zijn; na wissen staat hij op nul. |
| 9 | Bestanden | Knop "Nieuw project" met keuze uit de vier tools. |
| 10 | ParseBoard | Meerdere overzichten naast elkaar (`paneel-configs`), elk als project in het dashboard; oude enkele opslag wordt overgezet. |
| 11 | Dashboard | Projecten, namen en instellingen gaan via `/api/store` naar de server en komen terug op een andere computer met hetzelfde e-mailadres. |
| 12 | Extensie | Web Store-vermelding blijft extern werk; de knop en tekst zijn erop voorbereid. |
| 13 | Dashboard | Inloglink versturen vraagt een mailserver; nog mock. |
| 14 | ParsePDF | `POST /api/parsepdf/detect` bestaat op de server en gebruikt de Anthropic SDK met `PARSELAB_ANTHROPIC_KEY`; zonder sleutel een duidelijke 501. |
| 15 | Tests | `.github/workflows/qa.yml` draait de testrun bij elke push in `parselab/`. |

## Nog open

| # | Onderdeel | Wat | Prioriteit |
|---|---|---|---|
| 12 | Extensie | Chrome Web Store-vermelding indienen; daarna `CONFIG.webstoreUrl` invullen. | 1 |
| 13 | Dashboard | Inloglink echt versturen (mailserver) en accounts; daarmee wordt de scheiding per e-mailadres op de server ook beveiliging. | 1 |
| 16 | Server | Proxy-, taken- en store-data staan als JSON op schijf; voor meer dan één server of veel gebruikers is een database nodig. | 3 |
