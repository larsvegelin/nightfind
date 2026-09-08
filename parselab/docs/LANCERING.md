# ParseLab lanceren: ParsePDF als eerste

Dit is het plan om de site live te zetten met één werkende tool. ParsePDF gaat als eerste, de rest volgt. Reken op een halve dag, waarvan het meeste wachten op jezelf is: teksten, prijzen, een keer goed doorklikken.

---

## 1. Waarom ParsePDF eerst

- Hij draait volledig in de browser van de gebruiker. Geen server die je moet betalen, geen documenten die je moet bewaren, geen verwerkersovereenkomst nodig voor het uitlezen zelf.
- Het is de tool met de duidelijkste belofte: een map facturen erin, een tabel eruit.
- Hij is af en getest. ParseScraper vraagt een draaiende server met een browser erin; dat is de volgende stap, niet de eerste.

Zet de andere drie op de site op "Binnenkort". Eén tool die het doet is meer waard dan vier die half af zijn.

---

## 2. Twee manieren om hem online te zetten

**A. In Webflow, als vijf embeds.** Dit is de weg als je site al in Webflow staat en je de header, de navigatie en de login wilt hergebruiken. Alles staat in [`INTEGRATIE.md`](INTEGRATIE.md): pagina `/tools/parsepdf-tool`, lege container `pl-parsepdf-root`, de vijf embeds eronder in volgorde.

**B. Als één bestand.** `parselab/ParsePDF.html` is dezelfde tool als één pagina. Zet dat bestand op elke webhost (Netlify, GitHub Pages, je eigen server) en het werkt. Bouwen na een wijziging: `node parselab/webflow/bouw-pagina.mjs`. Gebruik dit als je nog geen Webflow-pagina wilt maken, of als tussenstap om iets te laten zien.

Beide gebruiken dezelfde Supabase erachter, dus dezelfde login en dezelfde verbruiksteller. Kies er één; twee adressen voor dezelfde tool geeft alleen verwarring.

> Wil je hem laten zien aan iemand zonder account, gebruik dan `parselab/tools/parsepdf.html`. Die versie kent geen login en geen limiet, werkt met een dubbelklik en heeft pdf.js ingebakken. Prima voor een demo, niet voor de site.

---

## 3. Wat er moet staan vóór je publiceert

| Onderdeel | Waar | Klaar? |
|---|---|---|
| Supabase-project met `profiles` (met `locale`) | database | |
| Tabel `plans` met de drie pakketten: 50, 2.500, 15.000 pagina's per maand | database | |
| Functie `record_usage(p_tool, p_pages)` die optelt en weigert bij vol | database | |
| Functie `usage_summary()` die `used` en `monthly_limit` teruggeeft | database | |
| Pagina `/inloggen` die werkt (magic link of wachtwoord) | site | |
| Pagina `/dashboard` waar de gebruiker na inloggen landt | site | |
| Prijzen ingevuld in `window.PARSELAB.prices` als je een upgradeknop toont | embed 1 | |
| Pagina uitgesloten van Google (`noindex`) | pagina-instellingen | |

De publishable key in embed 1 hoort in de browser te staan; dat is de bedoeling van zo'n sleutel. Wat je nooit in een embed zet is de service-role key. Zorg dat row level security aan staat op elke tabel, anders is die publishable key alsnog een sleutel tot alles.

---

## 4. Stappen op de dag zelf

1. Zet de database klaar volgens de tabel hierboven en test `record_usage` één keer met de hand in de SQL-editor.
2. Maak de pagina (weg A) of zet het bestand op de host (weg B).
3. Open de pagina in een incognitovenster zonder in te loggen. Je hoort meteen bij `/inloggen` uit te komen.
4. Log in en kijk of je verbruik bovenaan staat.
5. Kies het sjabloon Facturen, sleep twee echte facturen erin en lees ze uit. Controleer of de bedragen kloppen; dat is het moment waarop je merkt of je labels goed staan voor jullie facturen.
6. Download de CSV en open hem in Excel. De kolommen horen meteen goed te staan.
7. Kijk op je telefoon of de velden onder elkaar staan en de tabel binnen zijn eigen kader schuift.
8. Zet je verbruik in de database vlak onder de limiet en probeer een grote batch. Je hoort de kaart te zien die zegt hoeveel pagina's je nog hebt.
9. Zet de kaart van ParsePDF op het dashboard om van "Binnenkort" naar een knop.
10. Publiceer.

Stap 3 tot en met 8 zijn precies de controles die `node parselab/tests/webflow.mjs` geautomatiseerd doet, met een namaak-Supabase. Draai die test na elke wijziging aan de embeds; dan hoef je dit lijstje alleen bij de echte lancering met de hand af.

---

## 5. Teksten voor de site

**Kop:** ParsePDF

**Ondertitel:** Haal velden uit je PDF's met regels die je één keer instelt. Alles gebeurt in je eigen browser; er wordt geen document verstuurd.

**Voor de landingspagina, in drie zinnen:**
> Facturen, bankafschriften, polissen: allemaal dezelfde velden op net een andere plek. Stel één keer in wat je wilt hebben, sleep de stapel erin en download een tabel die Excel meteen goed opent. Je documenten blijven op je eigen computer.

**Bij de pakketten:**

| Pakket | Pagina's per maand | Voor wie |
|---|---|---|
| Gratis | 50 | Uitproberen met een eigen stapel |
| Pro | 2.500 | Eén persoon die er dagelijks mee werkt |
| Business | 15.000 | Een team of een maandelijkse verwerking |

Tel pagina's, geen documenten, en zeg dat er ook bij. Een factuur van drie kantjes is drie pagina's.

**Bij de privacyvraag die zeker komt:**
> Het uitlezen gebeurt in je browser met een open-source PDF-motor. Het document gaat niet naar onze server en wordt niet bewaard. Wat wij bijhouden is hoeveel pagina's je hebt gelezen, om je pakket te kunnen tellen.

---

## 6. Wees eerlijk over wat het niet doet

Zet dit op de pagina, niet in de kleine lettertjes. Het scheelt teleurgestelde eerste gebruikers.

- **Gescande documenten werken niet.** Zonder tekstlaag valt er niets uit te lezen. De tool zegt dat per bestand. Tekstherkenning is een aparte stap die er nog niet is.
- **Eén rij per document.** Regeltabellen uit een factuur halen kan nog niet.
- **Regels staan per browser.** Ze reizen niet mee naar een andere computer en zijn niet te delen met een collega.
- **PDF's met een wachtwoord** geven een leesfout.

---

## 7. Wat je na de lancering wilt weten

Drie dingen, meer niet:

1. Hoeveel mensen maken een account en lezen daadwerkelijk iets uit? Wie inlogt en niets uitleest, liep vast; vraag die persoon wat er misging.
2. Hoeveel pagina's per gebruiker per maand? Dat vertelt of 50 gratis pagina's te ruim of te krap is.
3. Hoe vaak komt de melding over een ontbrekende tekstlaag? Komt die veel, dan is tekstherkenning de volgende bouwstap en niet ParseScraper.

Kijk daar na twee weken naar en beslis dan pas wat er als tweede komt.

---

## 8. Daarna

Hoe ParsePDF zelf beter wordt — sjablonen in mappen, automatische veldherkenning en de AI-controle — staat apart in [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md). Fase 1 en 2 daarvan wegen zwaarder dan alles hieronder, want ze halen het intikwerk weg.

De volgorde die ik zou aanhouden:

1. **Regels aan het account koppelen** in plaats van aan de browser. Kleine tabel, groot verschil zodra iemand een tweede computer heeft.
2. **ParseScraper**, want die vraagt een server met Chromium erin en dus een echte hostingrekening. `Dockerfile`, `railway.json` en `render.yaml` staan klaar.
3. **Tekstherkenning** voor gescande documenten, als punt 3 hierboven daarom vraagt.
4. **ParseForm** met de extensie in de Chrome Web Store; dat is een aanmeldproces met wachttijd, dus begin er vroeg mee als je hem wilt.

ParseBoard kan mee zodra je zin hebt; die draait net als ParsePDF volledig in de browser en heeft geen server nodig.
