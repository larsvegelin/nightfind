#!/usr/bin/env python3
"""ParseLab-website bouwen: alle pagina's, sitemap en robots.txt.

Gebruik:  python3 site-src/build.py   (vanuit de hoofdmap van de repository)

Merknaam, domein en prijzen staan in CONFIG. Een nieuwe use-casepagina = één blok
in USE_CASES erbij; de toepassingen-hub, de sitemap en de interne links volgen vanzelf.
"""
import html
import json
import os
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONFIG = {
    'BRAND': 'ParseLab',                 # werknaam in het projectdocument: Flowdeck
    'DOMAIN': 'https://parselab.nl',     # nog bevestigen (merkenregister en domein)
    'VERSIE': '1.48',
    'PRIJS_PRO': '€10',                  # eerste prijstest, ijkpunt uit het projectdocument
    'PRIJS_BUSINESS': '€50',
    'PRIJS_VAULT': '€29',
    'CREDITS_PRO': '2.000',
    'CREDITS_BUSINESS': '15.000',
}
B = CONFIG['BRAND']
VANDAAG = date.today().isoformat()
e = html.escape

LOGO_SVG = ('<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="4.4" cy="4.2" r="2.3" fill="#03140b"/>'
            '<circle cx="4.4" cy="13.8" r="2.3" fill="#03140b"/><circle cx="13.8" cy="9" r="2.3" fill="#03140b"/>'
            '<path d="M4.4 6.4v5.2M6.3 5.2l5.6 2.8M6.3 12.8l5.6-2.8" stroke="#03140b" stroke-width="1.7" stroke-linecap="round"/></svg>')

IC = {
    'klok': '<svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.2" stroke="currentColor" stroke-width="1.4"/><path d="M7 4.2V7l2 1.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'lees': '<svg viewBox="0 0 14 14" fill="none"><rect x="1.8" y="2.3" width="10.4" height="9.4" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 5.8h10.4M5.3 5.8v5.9" stroke="currentColor" stroke-width="1.4"/></svg>',
    'opslaan': '<svg viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4 6.3 7 9.3l3-3M2.5 12h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'pagina': '<svg viewBox="0 0 14 14" fill="none"><rect x="1.8" y="2.3" width="10.4" height="9.4" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 5h10.4" stroke="currentColor" stroke-width="1.4"/></svg>',
    'lus': '<svg viewBox="0 0 14 14" fill="none"><path d="M11.5 5.5A4.6 4.6 0 0 0 3 4.4M2.5 8.5A4.6 4.6 0 0 0 11 9.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 1.8v2.6h2.6M11 12.2V9.6H8.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'bel': '<svg viewBox="0 0 14 14" fill="none"><path d="M3.5 9.8V6.5a3.5 3.5 0 0 1 7 0v3.3l1 1.2h-9l1-1.2ZM5.8 12.3h2.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'lijst': '<svg viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5h9M2.5 7h9M2.5 10.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'vul': '<svg viewBox="0 0 14 14" fill="none"><rect x="1.8" y="3.5" width="10.4" height="7" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M4.3 7h3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    'klik': '<svg viewBox="0 0 14 14" fill="none"><path d="M3.5 2.3 10.5 6.5l-3 .8-1.6 3.2-2.4-8.2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    'map': '<svg viewBox="0 0 14 14" fill="none"><path d="M1.8 3.6h3.6l1.2 1.4h5.6v6.2H1.8V3.6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
}
# soort stap → (kleurklasse, icoon, label)
SOORT = {
    'pagina': ('s-pg', 'pagina', 'Pagina'), 'lees': ('s-ui', 'lees', 'Uitlezen'), 'vul': ('s-in', 'vul', 'Invullen'),
    'klik': ('s-kl', 'klik', 'Klikken'), 'lus': ('s-he', 'lus', 'Herhalen'), 'plan': ('s-he', 'klok', 'Planning'),
    'opslaan': ('s-op', 'opslaan', 'Opslaan'), 'map': ('s-op', 'map', 'Opslaan'), 'melding': ('s-op', 'bel', 'Melding'),
    'lijst': ('s-ui', 'lijst', 'Lijst'),
}

# ------------------------------------------------------------------------------------------
# Use cases: elk = één SEO-pagina. Alleen zakelijke, niet-persoonlijke gegevens als voorbeeld.
# ------------------------------------------------------------------------------------------
USE_CASES = [
    dict(slug='tabel-naar-excel', cat='Data verzamelen', laag='Gratis',
         titel='Een tabel van een website naar Excel',
         kort='Elke tabel of lijst op een pagina met een paar klikken in Excel of CSV, ook over meerdere pagina\'s.',
         desc='Zet een tabel of lijst van een website in Excel of CSV zonder te kopiëren en plakken. Gratis, in je eigen browser, zonder code.',
         probleem='Je wilt een tabel van een website in Excel, maar kopiëren en plakken geeft rommel: samengevoegde cellen, verdwenen links en elke pagina apart.',
         stappen=[('lees', 'Wijs de tabel aan', 'Klik op één rij; ParseLab vindt alle gelijke rijen en maakt er kolommen van.'),
                  ('pagina', 'Wijs de knop "Volgende" aan', 'Optioneel: ParseLab bladert door tot het aantal pagina\'s dat je kiest.'),
                  ('opslaan', 'Exporteer', 'Bekijk de voorbeeldtabel en download Excel, CSV of JSON.')],
         kolommen=['Gemeente', 'Inwoners', 'Oppervlakte (km²)', 'Provincie'],
         rijen=[['Amersfoort', '160.000', '63,9', 'Utrecht'], ['Zwolle', '132.000', '119,3', 'Overijssel'], ['Leiden', '127.000', '23,3', 'Zuid-Holland'], ['Dordrecht', '121.000', '99,5', 'Zuid-Holland']],
         tips=['Werkt ook bij lijsten die geen echte tabel zijn, zoals kaarten of tegels.', 'Kies het maximum aantal pagina\'s, zodat een lange lijst niet eindeloos doorloopt.'],
         faq=[('Moet ik de tabel eerst selecteren?', 'Nee. Je klikt op één rij; de rest vindt ParseLab zelf.'),
              ('Blijven links behouden?', 'Ja. Een link wordt een eigen kolom met het adres.'),
              ('Kan ik de kolomnamen veranderen?', 'Ja, je geeft elk veld een naam voor je exporteert.')],
         verwant=['webshop-producten-naar-excel', 'website-inventariseren', 'dagrapport-zonder-export']),
    dict(slug='webshop-producten-naar-excel', cat='Data verzamelen', laag='Gratis',
         titel='Producten en prijzen van een webshop naar Excel',
         kort='Naam, prijs, voorraad en artikelnummer van elk product, over alle pagina\'s en categorieën.',
         desc='Haal producten, prijzen en voorraad van een webshop op in Excel. Over alle pagina\'s, zonder code, in je eigen browser.',
         probleem='Je wilt een overzicht van een assortiment: voor je eigen catalogus, een vergelijking of een inkooplijst. De webshop heeft geen export.',
         stappen=[('pagina', 'Open de categorie', 'Begin op de overzichtspagina met producten.'),
                  ('lus', 'Elk product uitlezen', 'Wijs naam, prijs en voorraad aan; ParseLab doet hetzelfde voor elk product.'),
                  ('opslaan', 'Naar Excel', 'Met de knop "Volgende" erbij krijg je de hele categorie in één bestand.')],
         kolommen=['Product', 'Prijs', 'Voorraad', 'Artikelnummer'],
         rijen=[['Fietslamp LED', '€ 24,95', '18', 'FL-2041'], ['Bidon 750 ml', '€ 7,49', '64', 'BD-0750'], ['Zadeltas klein', '€ 19,00', '6', 'ZT-0110'], ['Kettingolie', '€ 8,99', '42', 'KO-0050']],
         tips=['Lees bij twijfel ook de productpagina zelf uit; daar staan vaak meer velden.', 'Controleer de voorwaarden van de webshop voordat je regelmatig gegevens ophaalt.'],
         faq=[('Kan ik ook afbeeldingen opslaan?', 'Ja. Afbeeldingen kunnen als bestand mee, in een map per product.'),
              ('Wat als een prijs ontbreekt?', 'Dan blijft die cel leeg; de rest van de regel komt gewoon mee.'),
              ('Kan dit elke week vanzelf?', 'Ja, met de planning in Pro. Chrome moet dan open staan.')],
         verwant=['concurrentieprijzen-volgen', 'voorraad-en-levertijd-controleren', 'tabel-naar-excel']),
    dict(slug='vacatures-verzamelen', cat='Data verzamelen', laag='Gratis',
         titel='Vacatures van een vacaturesite verzamelen',
         kort='Functie, organisatie, plaats, uren en link van elke vacature in één overzicht.',
         desc='Verzamel vacatures van een vacaturesite in Excel: functie, organisatie, plaats, uren en link. Zonder code, in je eigen browser.',
         probleem='Je volgt vacatures in jouw vak of regio en wilt ze in één lijst, in plaats van elke dag dezelfde zoekopdracht te herhalen.',
         stappen=[('pagina', 'Open je zoekresultaat', 'Zoek zoals je altijd doet en begin op de resultatenpagina.'),
                  ('lus', 'Elke vacature', 'Wijs functie, organisatie, plaats en link aan.'),
                  ('opslaan', 'Naar je lijst', 'Exporteer, of laat het met de planning elke ochtend bijwerken.')],
         kolommen=['Functie', 'Organisatie', 'Plaats', 'Uren', 'Geplaatst'],
         rijen=[['Medewerker administratie', 'Bouwbedrijf (voorbeeld)', 'Zwolle', '32', 'vandaag'], ['Data-analist', 'Gemeente (voorbeeld)', 'Utrecht', '36', 'gisteren'], ['Inkoper', 'Groothandel (voorbeeld)', 'Tilburg', '40', '2 dagen'], ['Marketeer', 'Webwinkel (voorbeeld)', 'Leiden', '24', '3 dagen']],
         tips=['Haal geen namen of telefoonnummers van contactpersonen op: dat zijn persoonsgegevens.', 'Combineer met "Melding bij nieuw aanbod" om alleen nieuwe vacatures te zien.'],
         faq=[('Mag ik vacatures verzamelen?', 'Vacatureteksten zijn meestal zakelijke informatie. Lees wel de voorwaarden van de site, en laat contactpersonen weg.'),
              ('Kan ik filteren op plaats of uren?', 'Ja: gebruik de filters van de site zelf, ParseLab leest het resultaat.'),
              ('Hoe vaak kan het?', 'Handmatig zo vaak je wilt; met Pro ook vanzelf, bijvoorbeeld elke ochtend.')],
         verwant=['nieuw-aanbod-melding', 'tabel-naar-excel', 'webshop-producten-naar-excel']),
    dict(slug='paginas-uit-adressenlijst', cat='Data verzamelen', laag='Gratis',
         titel='Pagina\'s uitlezen uit een lijst met adressen',
         kort='Je hebt een lijst met links. ParseLab opent ze op de achtergrond en zet van elke pagina dezelfde velden in Excel.',
         desc='Lees een lijst met webadressen uit naar Excel: van elke pagina dezelfde velden, ook van andere websites. Zonder API, in je eigen browser.',
         probleem='Je hebt een Excel-lijst met links, bijvoorbeeld productpagina\'s of bedrijfspagina\'s, en wilt van elke pagina dezelfde gegevens. Elke link openen en overtypen kost uren.',
         stappen=[('lijst', 'Upload je lijst', 'Een kolom met adressen is genoeg. ParseLab herkent die kolom zelf.'),
                  ('lees', 'Wijs de velden één keer aan', 'Op één voorbeeldpagina: titel, prijs, link of afbeelding. Of lees de hele pagina.'),
                  ('opslaan', 'Naar Excel', 'Elke regel krijgt de velden van zijn pagina. Een adres dat niet werkt, staat apart met de reden.')],
         kolommen=['Adres', 'Titel', 'Prijs', 'Merk'],
         rijen=[['fietsshop.nl/lamp-x (voorbeeld)', 'Fietslamp X', '€ 24,95', 'Lumo'], ['fietsshop.nl/bidon (voorbeeld)', 'Bidon 750 ml', '€ 7,49', 'Aqua'], ['anderewinkel.nl/tas (voorbeeld)', 'Zadeltas klein', '€ 19,00', 'Packit'], ['anderewinkel.nl/olie (voorbeeld)', 'Kettingolie', '€ 8,99', 'Lube']],
         tips=['ParseLab haalt eerst alleen de HTML op; dat is snel. Wordt de pagina met JavaScript opgebouwd, dan opent ParseLab hem in een verborgen tabblad.', 'Houd een rustig tempo met de pauze tussen pagina\'s, en haal alleen zakelijke gegevens op.'],
         faq=[('Werkt het ook op andere websites dan waar ik nu ben?', 'Ja. De adressen mogen van elke website zijn die je in Chrome kunt openen. Je hoeft ze niet zelf te openen.'),
              ('Werkt het op pagina\'s waar ik ben ingelogd?', 'Ja. ParseLab gebruikt je eigen browser en dus je eigen inlog.'),
              ('Wat als een pagina niet bestaat?', 'Dan komt die regel als fout in het resultaat, met het adres erbij. De rest van de lijst gaat gewoon door.')],
         verwant=['webshop-producten-naar-excel', 'website-inventariseren', 'tabel-naar-excel']),
    dict(slug='concurrentieprijzen-volgen', cat='Monitoren', laag='Pro',
         titel='Prijzen van concurrenten volgen',
         kort='Elke ochtend de prijzen van je concurrenten naast die van jou, met een melding bij een verschil.',
         desc='Volg de prijzen van concurrenten automatisch. Elke ochtend een overzicht en een melding bij een prijswijziging. Zonder code.',
         probleem='Je wilt weten wanneer een concurrent zijn prijs verlaagt, zonder elke dag tien websites langs te gaan.',
         stappen=[('plan', 'Elke werkdag om 07:45', 'De planning start de flow vanzelf, zolang Chrome open staat.'),
                  ('lees', 'Prijzen uitlezen', 'Per product de prijs bij elke concurrent, uit je lijst met adressen.'),
                  ('melding', 'Melding bij verschil', 'Een bericht via een webhook, bijvoorbeeld naar Teams of Slack.')],
         kolommen=['Product', 'Jij', 'Concurrent A', 'Concurrent B', 'Verschil'],
         rijen=[['Fietslamp LED', '€ 24,95', '€ 22,50', '€ 24,95', '−€ 2,45'], ['Bidon 750 ml', '€ 7,49', '€ 7,49', '€ 6,99', '−€ 0,50'], ['Zadeltas klein', '€ 19,00', '€ 21,00', '€ 19,95', '—'], ['Kettingolie', '€ 8,99', '€ 8,99', '€ 8,99', '—']],
         tips=['Begin met tien producten en breid uit als het goed loopt.', 'Bewaar elke run; zo zie je ook het verloop over weken.'],
         faq=[('Moet mijn computer aan staan?', 'Ja. De planning draait in je eigen Chrome. Een cloud-runner die dit zonder jouw computer doet, staat op de planning.'),
              ('Hoe krijg ik de melding?', 'Via een webhook: Teams, Slack, Make of je eigen systeem.'),
              ('Wat als een site verandert?', 'ParseLab probeert het element terug te vinden en meldt het als dat niet lukt.')],
         verwant=['webshop-producten-naar-excel', 'voorraad-en-levertijd-controleren', 'nieuw-aanbod-melding']),
    dict(slug='nieuw-aanbod-melding', cat='Monitoren', laag='Pro',
         titel='Een melding bij nieuw aanbod op een website',
         kort='Nieuwe woningen, vacatures of producten op een site, elk kwartier gecontroleerd. Alleen wat nieuw is.',
         desc='Krijg een melding zodra er nieuw aanbod op een website staat: woningen, vacatures of producten. Elk kwartier gecontroleerd, zonder code.',
         probleem='Goed aanbod is snel weg. Je wilt het als eerste zien, zonder de hele dag te verversen.',
         stappen=[('plan', 'Elk kwartier', 'De planning controleert de pagina zo vaak als jij wilt.'),
                  ('lees', 'Nieuwe items vinden', 'ParseLab vergelijkt met de vorige keer en houdt alleen het nieuwe over.'),
                  ('melding', 'Melding sturen', 'Via een webhook naar je telefoon, Teams, Slack of e-mail.')],
         kolommen=['Titel', 'Plaats', 'Prijs', 'Gezien om'],
         rijen=[['Appartement 2 kamers', 'Utrecht', '€ 1.150', '09:15'], ['Studio', 'Amersfoort', '€ 865', '09:30'], ['Bovenwoning', 'Zwolle', '€ 1.025', '10:45'], ['Eengezinswoning', 'Deventer', '€ 1.390', '11:00']],
         tips=['Gebruik de zoekfilters van de site zelf; dan blijft de lijst kort.', 'Kies een redelijk tempo. Elk kwartier is voor de meeste sites ruim genoeg.'],
         faq=[('Hoe weet ParseLab wat nieuw is?', 'Het onthoudt wat het de vorige keer zag en meldt alleen wat erbij is gekomen.'),
              ('Werkt het als ik ben ingelogd op de site?', 'Ja. ParseLab gebruikt je eigen browser en sessie.'),
              ('Kan het zonder dat Chrome open staat?', 'Nog niet. Een cloud-runner staat op de planning.')],
         verwant=['vacatures-verzamelen', 'concurrentieprijzen-volgen', 'voorraad-en-levertijd-controleren']),
    dict(slug='voorraad-en-levertijd-controleren', cat='Monitoren', laag='Pro',
         titel='Voorraad en levertijden van leveranciers controleren',
         kort='Elke ochtend per artikel de voorraad en levertijd bij je leveranciers, in één overzicht.',
         desc='Controleer automatisch voorraad en levertijden bij leveranciers. Elke ochtend één overzicht, ook in portalen waar je inlogt.',
         probleem='Je bestelt bij meerdere leveranciers en zoekt elke dag in hun portalen of iets op voorraad is.',
         stappen=[('lijst', 'Je artikellijst', 'Een Excel met artikelnummers per leverancier.'),
                  ('vul', 'Artikel opzoeken', 'ParseLab zoekt elk nummer op in het portaal waar je al bent ingelogd.'),
                  ('lees', 'Voorraad en levertijd', 'Beide komen terug in je overzicht, met de tijd van controle.')],
         kolommen=['Artikel', 'Leverancier', 'Voorraad', 'Levertijd'],
         rijen=[['BD-0750', 'Leverancier A', '1.240', '1 werkdag'], ['FL-2041', 'Leverancier A', '0', '12 werkdagen'], ['ZT-0110', 'Leverancier B', '85', '2 werkdagen'], ['KO-0050', 'Leverancier C', '430', '1 werkdag']],
         tips=['Werkt in portalen met inlog, omdat ParseLab je eigen sessie gebruikt.', 'Zet "alleen starten als er werk is" aan als je de lijst via de wachtrij aanlevert.'],
         faq=[('Bewaart ParseLab mijn wachtwoord?', 'Nee. Je bent zelf ingelogd in je browser; ParseLab bewaart geen wachtwoorden.'),
              ('Hoeveel artikelen kan het aan?', 'Honderden per run. Met porties (eerste 100, daarna verder) houd je het overzichtelijk.'),
              ('Kan het resultaat naar ons systeem?', 'Ja, via een webhook of via de wachtrij-API.')],
         verwant=['concurrentieprijzen-volgen', 'excel-naar-webformulier', 'dagrapport-zonder-export']),
    dict(slug='excel-naar-webformulier', cat='Data-invoer', laag='Gratis',
         titel='Een Excel-lijst invoeren in een webformulier',
         kort='Elke regel uit je lijst in een webformulier, ook waar geen importknop is.',
         desc='Voer een Excel-lijst automatisch in op een website: regel voor regel in een webformulier. Zonder importknop en zonder code.',
         probleem='Je hebt honderd regels in Excel en een systeem dat alleen een formulier heeft. Overtypen kost uren en geeft fouten.',
         stappen=[('lijst', 'Upload je lijst', 'Excel, CSV of TXT. Elke kolom kan aan een veld gekoppeld worden.'),
                  ('vul', 'Formulier invullen', 'Tekstvelden, dropdowns en datums, per regel uit je lijst.'),
                  ('klik', 'Versturen', 'ParseLab klikt op versturen en leest de bevestiging uit.')],
         kolommen=['Regel', 'Artikel', 'Aantal', 'Status', 'Bevestiging'],
         rijen=[['1', 'BD-0750', '24', 'verstuurd', 'B-10231'], ['2', 'FL-2041', '6', 'verstuurd', 'B-10232'], ['3', 'ZT-0110', '12', 'overgeslagen', 'artikel niet gevonden'], ['4', 'KO-0050', '30', 'verstuurd', 'B-10233']],
         tips=['Test eerst de eerste 5 regels stap voor stap; daarna de rest automatisch.', 'Loopt een regel vast, dan gaat ParseLab door met de volgende en meldt welke het oversloeg.'],
         faq=[('Wat als een veld een dropdown is?', 'ParseLab kiest de optie die past bij de waarde uit je lijst, of een vaste standaardwaarde.'),
              ('Kan ik controleren voor het versturen?', 'Ja. Met de testmodus loop je stap voor stap door de eerste regels.'),
              ('Wat gebeurt er bij een fout?', 'Die regel wordt overgeslagen en apart gemeld; de rest gaat door.')],
         verwant=['gegevens-overzetten-tussen-systemen', 'voorraad-en-levertijd-controleren', 'pdf-per-regel']),
    dict(slug='gegevens-overzetten-tussen-systemen', cat='Data-invoer', laag='Gratis',
         titel='Gegevens van het ene systeem in het andere zetten',
         kort='Lees een overzicht uit in systeem A en vul het in systeem B, zonder koppeling of API.',
         desc='Zet gegevens over van het ene websysteem naar het andere zonder API: uitlezen in het ene, invullen in het andere. Zonder code.',
         probleem='Twee systemen praten niet met elkaar. Iemand neemt elke week dezelfde gegevens met de hand over.',
         stappen=[('lees', 'Uitlezen in systeem A', 'Bijvoorbeeld een lijst met nieuwe orders of aanvragen.'),
                  ('vul', 'Invullen in systeem B', 'Per regel het formulier van het andere systeem invullen.'),
                  ('opslaan', 'Verslag', 'Een lijst van wat is overgezet en wat niet lukte.')],
         kolommen=['Order', 'Datum', 'Bedrag', 'In systeem B'],
         rijen=[['O-55120', '21-10', '€ 1.240,00', 'ja'], ['O-55121', '21-10', '€ 310,50', 'ja'], ['O-55122', '22-10', '€ 98,00', 'nee: veld ontbrak'], ['O-55123', '22-10', '€ 2.015,75', 'ja']],
         tips=['Begin klein: één soort gegevens, één richting.', 'Bewaar het verslag; dan weet je altijd wat er is overgezet.'],
         faq=[('Is dit hetzelfde als een koppeling?', 'Het resultaat lijkt erop, maar het werkt via de browser. Handig als er geen API is.'),
              ('Moet ik in beide systemen ingelogd zijn?', 'Ja, in dezelfde browser. ParseLab gebruikt je sessies.'),
              ('Kan dit elke week vanzelf?', 'Ja, met de planning in Pro.')],
         verwant=['excel-naar-webformulier', 'dagrapport-zonder-export', 'tabel-naar-excel']),
    dict(slug='facturen-downloaden', cat='Bestanden', laag='Gratis',
         titel='Facturen uit een portaal downloaden als PDF',
         kort='Alle facturen uit een leveranciersportaal als PDF, in een map per maand, met één ZIP.',
         desc='Download alle facturen uit een portaal automatisch als PDF, in een map per maand en als één ZIP. Zonder code.',
         probleem='Elke maand klik je in drie portalen alle facturen open om ze op te slaan voor de boekhouding.',
         stappen=[('pagina', 'Open het facturenoverzicht', 'In het portaal waar je al bent ingelogd.'),
                  ('lus', 'Elke factuur', 'ParseLab opent elke factuur in de lijst.'),
                  ('map', 'PDF per maand', 'Met een naam uit de factuur, in een map per maand. Aan het eind één ZIP.')],
         kolommen=['Map', 'Bestand', 'Bedrag'],
         rijen=[['2026-09', 'F-2031 Leverancier A.pdf', '€ 1.240,00'], ['2026-09', 'F-2044 Leverancier A.pdf', '€ 310,50'], ['2026-10', 'F-2050 Leverancier B.pdf', '€ 98,00'], ['2026-10', 'F-2061 Leverancier B.pdf', '€ 2.015,75']],
         tips=['Kies een bestandsnaam uit de factuur, bijvoorbeeld het factuurnummer.', 'Sla het eerste blad over als dat een voorblad is.'],
         faq=[('Waar komen de bestanden?', 'In je Downloads-map, in de mappen die je kiest, en als één ZIP.'),
              ('Gaat er iets verloren als het vastloopt?', 'Nee. ParseLab downloadt bij vastlopen meteen een tussenstand-ZIP.'),
              ('Kan dit elke maand vanzelf?', 'Ja, met de planning in Pro.')],
         verwant=['pdf-per-regel', 'dagrapport-zonder-export', 'gegevens-overzetten-tussen-systemen']),
    dict(slug='pdf-per-regel', cat='Bestanden', laag='Gratis',
         titel='Per regel een PDF of screenshot bewaren',
         kort='Voor elke regel uit je lijst een pagina opzoeken en opslaan als PDF of screenshot, met datum.',
         desc='Sla voor elke regel uit je lijst een webpagina op als PDF of screenshot, met een naam en map uit je lijst. Voor dossiers en controle.',
         probleem='Voor een dossier of controle moet je van honderd dingen vastleggen hoe de pagina er vandaag uitzag.',
         stappen=[('vul', 'Opzoeken per regel', 'Het nummer uit je lijst invullen in het zoekveld.'),
                  ('klik', 'Openen', 'Het juiste resultaat openen, ook als de nul vooraan ontbreekt.'),
                  ('map', 'PDF of screenshot', 'Met een naam uit je lijst, in een map per nummer.')],
         kolommen=['Nummer', 'Bestand', 'Opgeslagen'],
         rijen=[['10045', '10045 overzicht.pdf', '22-10 09:41'], ['10046', '10046 overzicht.pdf', '22-10 09:42'], ['10047', '10047 overzicht.pdf', '22-10 09:42'], ['10048', 'overgeslagen: niet gevonden', '—']],
         tips=['Gebruik een bestandsnaam met kolommen, zoals {{nummer}} overzicht.', 'Witte of lege screenshots kun je bij het downloaden laten weglaten.'],
         faq=[('Kan ik PDF en screenshot combineren?', 'Ja, allebei in dezelfde flow.'),
              ('Hoe groot mag de lijst zijn?', 'Werk in porties, bijvoorbeeld 100 per keer; daarna gaat ParseLab verder waar het bleef.'),
              ('Staat er een datum op?', 'De bestanden krijgen de tijd van opslaan; in de geschiedenis staat elke run.')],
         verwant=['facturen-downloaden', 'excel-naar-webformulier', 'website-inventariseren']),
    dict(slug='dagrapport-zonder-export', cat='Rapporten', laag='Pro',
         titel='Een dagrapport uit een systeem zonder exportknop',
         kort='Elke ochtend de cijfers uit een webportaal in een tabel, ook als het systeem geen export heeft.',
         desc='Maak elke dag automatisch een rapport uit een websysteem zonder exportknop: cijfers uitlezen en in een tabel bewaren.',
         probleem='Je dagcijfers staan in een portaal zonder export. Elke ochtend neem je ze over in Excel.',
         stappen=[('plan', 'Elke werkdag', 'De planning start de flow op een vaste tijd.'),
                  ('lees', 'Overzicht uitlezen', 'De cijfers van het dashboard of overzicht.'),
                  ('opslaan', 'In de tabel', 'Elke run een regel erbij, of naar je eigen systeem via een webhook.')],
         kolommen=['Datum', 'Orders', 'Omzet', 'Retouren'],
         rijen=[['20-10', '112', '€ 8.420', '4'], ['21-10', '98', '€ 7.315', '6'], ['22-10', '131', '€ 9.870', '3'], ['23-10', '104', '€ 7.990', '5']],
         tips=['Lees alleen de getallen die je echt gebruikt; dan blijft het overzicht snel.', 'De geschiedenis laat zien wanneer een run niet lukte.'],
         faq=[('Waar staat het rapport?', 'Als Excel of CSV in je map, of bij je eigen systeem via een webhook.'),
              ('Kan ik een grafiek maken?', 'In Excel of je eigen dashboard. Een ingebouwd dashboard staat op de planning.'),
              ('Wat als het systeem traag is?', 'ParseLab wacht tot de pagina echt geladen is, niet een vast aantal seconden.')],
         verwant=['concurrentieprijzen-volgen', 'gegevens-overzetten-tussen-systemen', 'tabel-naar-excel']),
    dict(slug='website-inventariseren', cat='Website-beheer', laag='Gratis',
         titel='Alle pagina\'s van een website inventariseren',
         kort='Titel, beschrijving, kop en links van elke pagina in één overzicht. Handig voor SEO en verhuizingen.',
         desc='Inventariseer alle pagina\'s van een website of CMS: titel, meta description, H1 en links. Voor SEO-controle en websiteverhuizingen.',
         probleem='Je gaat een website vernieuwen of verbeteren en wilt eerst weten welke pagina\'s er zijn en wat erop staat.',
         stappen=[('pagina', 'Begin bij het menu of de sitemap', 'Eén pagina met links naar de rest.'),
                  ('lus', 'Elke pagina', 'ParseLab opent elke link binnen dezelfde website.'),
                  ('lees', 'Titel, beschrijving, kop', 'Plus het aantal links en woorden per pagina.')],
         kolommen=['Pagina', 'Titel', 'Description', 'H1'],
         rijen=[['/', 'Fietswinkel (voorbeeld)', '142 tekens', 'Alles voor je fiets'], ['/lampen', 'Fietslampen', 'ontbreekt', 'Fietslampen'], ['/tassen', 'Fietstassen', '98 tekens', 'Fietstassen'], ['/contact', 'Contact', '61 tekens', 'Neem contact op']],
         tips=['Gebruik dit vóór een verhuizing: zo mis je geen pagina\'s.', 'Lege descriptions en dubbele titels vallen meteen op in de tabel.'],
         faq=[('Gaat ParseLab ook naar andere websites?', 'Bij deze flow niet: hij volgt alleen links binnen dezelfde website. Heb je een lijst met adressen van andere websites, gebruik dan "Pagina\'s uitlezen uit een lijst met adressen".'),
              ('Werkt het met elk CMS?', 'Ja, het leest de pagina zoals je browser hem ziet.'),
              ('Hoeveel pagina\'s kan het aan?', 'Honderden. Werk bij grote sites in porties.')],
         verwant=['tabel-naar-excel', 'pdf-per-regel', 'dagrapport-zonder-export']),
]
UC = {u['slug']: u for u in USE_CASES}
CATS = []
for u in USE_CASES:
    if u['cat'] not in CATS:
        CATS.append(u['cat'])

FAQ_ALG = [
    ('Moet ik kunnen programmeren?', f'Nee. Je beschrijft wat je wilt, wijst het aan of neemt het op. De flow staat daarna in gewone taal in je paneel en elke stap is aan te passen.'),
    ('Is de scraper gratis?', f'Ja. De extensie leest pagina\'s in je eigen browser; dat kost ons niets, dus jou ook niet. Je betaalt pas voor gemak zoals planning, opslag in de cloud en koppelingen.'),
    ('Op welke websites werkt het?', f'Op elke website die je in Chrome kunt openen, ook in iframes en moderne webcomponenten. Er is geen API, koppeling of speciale toegang nodig: {B} werkt met de pagina zoals jij hem ziet. Met een lijst adressen leest {B} ook pagina\'s van andere websites uit, op de achtergrond. Alleen pagina\'s van Chrome zelf en de Chrome Web Store laten geen extensies toe.'),
    ('Wat is het verschil met Zapier of Make?', f'Zapier en Make koppelen apps die een API hebben. {B} werkt in je browser, dus ook op websites en portalen zonder API of export, zoals een leveranciersportaal of een oud intern systeem. Ze vullen elkaar aan: {B} stuurt resultaten via een webhook naar Zapier, Make of n8n, en die kunnen via de wachtrij werk klaarzetten voor {B}.'),
    ('Werkt het op pagina\'s waar ik ben ingelogd?', f'Ja. {B} draait in je eigen browser en gebruikt je eigen sessie. We bewaren geen wachtwoorden.'),
    ('Mag ik alles scrapen?', 'Nee. Veel websites verbieden het in hun voorwaarden, en persoonsgegevens verzamelen mag onder de AVG in de meeste gevallen niet. Gebruik het voor zakelijke gegevens zoals prijzen, producten en vacatures. Jij bent verantwoordelijk voor wat je ophaalt.'),
    ('Wat gebeurt er als een stap niet lukt?', f'{B} probeert het één keer opnieuw. Lukt het dan niet, dan slaat het die ronde over, gaat door met de volgende en meldt aan het eind wat het oversloeg. Bestanden worden altijd als ZIP gedownload.'),
    ('Moet mijn computer aan staan voor een planning?', 'Ja, voorlopig wel: de planning draait in je eigen Chrome. Een cloud-runner die zonder jouw computer werkt, staat op de planning.'),
    ('Waar staan mijn gegevens?', 'Je lijst en je resultaten blijven op je computer. Flows (de stappen) kun je in de cloud bewaren, in de EU, alleen zichtbaar voor je eigen team.'),
    ('Kan ik flows delen met collega\'s?', 'Ja. Wie dezelfde teamcode invult, ziet dezelfde flows, mappen, wachtrij en geschiedenis.'),
    ('Wat is de Automation Vault?', 'Een verzameling kant-en-klare flows per toepassing of branche, met uitleg. Je koopt een pakket één keer en past de flows aan op je eigen websites.'),
]

# ------------------------------------------------------------------------------------------
# Bouwstenen
# ------------------------------------------------------------------------------------------
NAV = [('hoe', 'hoe-het-werkt.html', 'Hoe het werkt'), ('toepassingen', 'toepassingen/index.html', 'Toepassingen'),
       ('prijzen', 'prijzen.html', 'Prijzen'), ('faq', 'faq.html', 'FAQ'), ('help', 'help.html', 'Help')]


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace('</', '<\\/') + '</script>'


def head(path, titel, desc, R, extra_ld=(), robots='index,follow'):
    canon = CONFIG['DOMAIN'] + '/' + ('' if path == 'index.html' else path.replace('index.html', ''))
    full = titel if titel.startswith(B) else f'{titel} | {B}'
    ld = ''.join(jsonld(x) for x in extra_ld)
    return f'''<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(full)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{e(canon)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{e(B)}">
<meta property="og:title" content="{e(full)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(canon)}">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#0c0e1b">
<link rel="icon" type="image/svg+xml" href="{R}assets/parselab/logo.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="{R}assets/parselab/site.css">
{ld}
</head>'''


def header(R, actief):
    tabs = ''.join(f'<a href="{R}{href}"{" class=\"on\" aria-current=\"page\"" if key == actief else ""}>{label}</a>' for key, href, label in NAV)
    return f'''<header class="nav" id="nav">
  <div class="wrap">
    <a class="logo" href="{R}index.html" aria-label="{B}, naar de homepage"><span class="logo-mark">{LOGO_SVG}</span>{B}</a>
    <nav class="tabs" aria-label="Hoofdmenu">{tabs}</nav>
    <div class="nav-right">
      <button class="nav-login" id="login-btn" type="button" aria-expanded="false" aria-controls="login-pop">Inloggen</button>
      <a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis starten</a>
      <button class="menu-btn" id="menu-btn" type="button" aria-label="Menu openen" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    </div>
  </div>
  <div class="login-pop" id="login-pop" hidden>
    <b>Inloggen gaat via de extensie</b>
    <p>Je flows, mappen en teamcode zitten in de {B}-extensie. Open hem op elke website met het {B}-icoon of <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>. Een webapp om in te loggen komt later.</p>
    <a class="btn btn-ghost" href="{R}inloggen.html" style="padding:10px 14px;font-size:15px">Meer over inloggen</a>
  </div>
</header>'''


def footer(R):
    uc = ''.join(f'<li><a href="{R}toepassingen/{u["slug"]}.html">{e(u["titel"])}</a></li>' for u in USE_CASES[:5])
    return f'''<footer>
  <div class="wrap cols4">
    <div><a class="logo" href="{R}index.html"><span class="logo-mark">{LOGO_SVG}</span>{B}</a><p class="small">Vertel wat je wilt automatiseren; wij bouwen de flow. Gratis scraper in je eigen browser.</p></div>
    <div><h4>Product</h4><ul><li><a href="{R}hoe-het-werkt.html">Hoe het werkt</a></li><li><a href="{R}app.html">Demo</a></li><li><a href="{R}scrapetool.html">Scrapetool proberen</a></li><li><a href="{R}prijzen.html">Prijzen</a></li><li><a href="{R}vault.html">Automation Vault</a></li></ul></div>
    <div><h4>Toepassingen</h4><ul>{uc}<li><a href="{R}toepassingen/index.html">Alle toepassingen</a></li></ul></div>
    <div><h4>Hulp</h4><ul><li><a href="{R}help.html">Help en installatie</a></li><li><a href="{R}faq.html">Veelgestelde vragen</a></li><li><a href="{R}privacy.html">Privacy</a></li><li><a href="{R}voorwaarden.html">Voorwaarden</a></li></ul></div>
  </div>
  <div class="wrap base"><span>© {date.today().year} {B}</span><span>Voorbeelden op deze site gebruiken voorbeelddata.</span></div>
</footer>'''


def scripts(R, extra=()):
    return ''.join(f'\n<script src="{R}assets/parselab/{x}" defer></script>' for x in ('site.js',) + tuple(extra))


def crumbs(R, items):
    """items: [(label, href or None)] — laatste is de huidige pagina."""
    lis = []
    for label, href in items:
        lis.append(f'<li><a href="{href}">{e(label)}</a></li>' if href else f'<li><span aria-current="page">{e(label)}</span></li>')
    return '<ol class="crumbs" aria-label="Kruimelpad">' + ''.join(lis) + '</ol>'


def crumbs_ld(items):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': CONFIG['DOMAIN'] + '/' + url} for i, (label, url) in enumerate(items)]}


def faq_ld(lijst):
    return {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in lijst]}


def page_head_block(R, titel, lead, crumb_items, eyebrow=None):
    return f'''<section class="page-head"><canvas class="net" aria-hidden="true"></canvas><div class="wrap">
  {crumbs(R, crumb_items)}
  {f'<p class="eyebrow green">{e(eyebrow)}</p>' if eyebrow else ''}
  <h1>{e(titel)}</h1>
  <p class="lead">{lead}</p>
</div></section>'''


def flow_mini(stappen):
    out = []
    for i, (soort, label, _d) in enumerate(stappen):
        c, ic, _ = SOORT[soort]
        out.append(('<span class="tl"></span>' if i else '') + f'<div class="tn {c}"><span class="ti">{IC[ic]}</span>{e(label)}</div>')
    return '<div class="tpl-flow">' + ''.join(out) + '</div>'


def uc_card(u, R, met_cat_attr=False):
    attr = f' data-cat-item="{e(u["cat"])}"' if met_cat_attr else ''
    return (f'<a class="tpl" href="{R}toepassingen/{u["slug"]}.html"{attr}>{flow_mini(u["stappen"])}'
            f'<div class="tpl-body"><p class="eyebrow green">{e(u["cat"])}</p><h3>{e(u["titel"])}</h3><p class="tpl-d">{e(u["kort"])}</p>'
            f'<span class="tpl-go">Bekijk de flow <span aria-hidden="true">→</span></span></div></a>')


def wachtlijst(R, soort='wachtlijst', titel='Zet je op de wachtlijst', tekst=None, knop='Aanmelden'):
    tekst = tekst or f'We bouwen {B} in de openbaarheid. Vertel welke taak je wilt automatiseren; daar maken we de volgende flows en pagina\'s over.'
    vraag = 'Welke taak wil je automatiseren?' if soort != 'vraag' else 'Je vraag'
    plh = 'Bijvoorbeeld: elke maandag de prijzen van vijf webshops in Excel' if soort != 'vraag' else 'Waar loop je tegenaan?'
    return f'''<div class="wl" id="wachtlijst">
  <div><h2>{e(titel)}</h2><p>{tekst}</p></div>
  <form class="wl-form" data-wachtlijst="{soort}" novalidate>
    <div class="fld"><label for="wl-email-{soort}">E-mailadres</label><input id="wl-email-{soort}" name="email" type="email" autocomplete="email" required placeholder="naam@bedrijf.nl"></div>
    <div class="fld"><label for="wl-taak-{soort}">{vraag}</label><textarea id="wl-taak-{soort}" name="taak" maxlength="2000" placeholder="{e(plh)}"></textarea></div>
    <div class="hp" aria-hidden="true"><label for="wl-web-{soort}">Website</label><input id="wl-web-{soort}" name="website" tabindex="-1" autocomplete="off"></div>
    <button class="btn btn-green" type="submit">{e(knop)}</button>
    <p class="form-st" role="status" aria-live="polite"></p>
    <div class="fld"><small>We gebruiken je e-mailadres alleen hiervoor. Afmelden kan altijd. Zie <a href="{R}privacy.html">privacy</a>.</small></div>
  </form>
</div>'''


def write(path, html_text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(html_text)
    print('  ' + path)


def pagina(path, titel, desc, body, actief=None, ld=(), extra_js=(), robots='index,follow'):
    R = '../' * path.count('/')
    write(path, head(path, titel, desc, R, ld, robots) + '\n<body>\n' + header(R, actief) + '\n<main id="top">\n' + body(R) + '\n</main>\n' + footer(R) + scripts(R, extra_js) + '\n</body>\n</html>\n')


PAGES = []  # (path, prioriteit) voor de sitemap


def reg(path, prio='0.7'):
    PAGES.append((path, prio))


# ------------------------------------------------------------------------------------------
# Pagina's
# ------------------------------------------------------------------------------------------
def home():
    stage = open(os.path.join(ROOT, 'site-src', 'hero-stage.html'), encoding='utf-8').read()
    def body(R):
        cards = ''.join(uc_card(UC[s], R) for s in ['webshop-producten-naar-excel', 'concurrentieprijzen-volgen', 'excel-naar-webformulier', 'facturen-downloaden', 'nieuw-aanbod-melding', 'website-inventariseren'])
        week = UC['concurrentieprijzen-volgen']
        week_steps = ''.join(f'<div class="f3 {SOORT[s][0]}"><span class="no">{i + 1}</span><div><span class="k">{SOORT[s][2]}</span><b>{e(l)}</b><span>{e(d)}</span></div></div>' for i, (s, l, d) in enumerate(week['stappen']))
        return f'''<section class="hero">
    <canvas class="net" aria-hidden="true"></canvas>
    <div class="wrap">
      <div>
        <h1><span>Verzamel data.</span><span>Automatiseer je browser.</span><span class="g">Gewoon beschrijven.</span></h1>
        <p class="lead">Vertel wat je wilt automatiseren; wij bouwen de flow. Of wijs het aan op de pagina. {B} haalt gegevens op, vult formulieren in en slaat bestanden op, voor elke regel uit je lijst. Je ziet en test alles voordat het live gaat.</p>
        <div class="hero-cta">
          <a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis scraper installeren</a>
          <a class="btn btn-ghost" href="{R}app.html"><span class="tri" aria-hidden="true"></span>Bekijk de demo</a>
        </div>
        <p class="hero-note">Gratis Chrome-extensie · werkt in je eigen browser · je gegevens blijven op je computer</p>
        <p class="ext-ok" data-ext-ok></p>
      </div>
{stage}
    </div>
  </section>

  <section class="stats" aria-label="Kenmerken">
    <div class="wrap">
      <div class="stat"><b>0</b><span>regels code nodig</span></div>
      <div class="stat"><b>5 min</b><span>tot je eerste tabel</span></div>
      <div class="stat"><b>€0</b><span>voor de scraper</span></div>
    </div>
  </section>

  <section class="works">
    <div class="wrap">
      <p class="eyebrow">Werkt samen met</p>
      <div class="names"><span>Excel</span><span>CSV</span><span>JSON</span><span>Chrome</span><span>Webhooks</span><span>Supabase</span><span>Power Automate</span><span>Make</span><span>Zapier</span><span>n8n</span><span>PDF</span><span>ZIP</span></div>
    </div>
  </section>

  <section class="band" id="scraper">
    <div class="wrap split">
      <div>
        <p class="eyebrow green">Begin gratis</p>
        <h2 style="font-size:clamp(32px,3.8vw,48px);line-height:1.08;margin-top:14px">De scraper in je browser</h2>
        <ul>
          <li><b>Aanwijzen.</b> Klik op één rij of kaart; {B} vindt alle gelijke elementen op de pagina.</li>
          <li><b>Velden benoemen.</b> Titel, prijs, link: elk veld wordt een kolom.</li>
          <li><b>Volgende pagina.</b> Wijs de knop aan en kies hoeveel pagina's.</li>
          <li><b>Voorbeeldtabel en export.</b> Zie meteen wat eruit komt en download Excel, CSV of JSON.</li>
        </ul>
        <div class="hero-cta"><a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis installeren</a><a class="btn btn-ghost" href="{R}hoe-het-werkt.html">Hoe het werkt</a></div>
      </div>
      <div class="ex">
        <div class="ex-head"><span>Voorbeeldtabel · shop.nl/fietsen</span><small>Voorbeelddata</small></div>
        <div class="ex-scroll"><table><thead><tr><th>Product</th><th>Prijs</th><th>Voorraad</th><th>Link</th></tr></thead><tbody>
          <tr><td>Fietslamp LED</td><td class="num">€ 24,95</td><td class="num">18</td><td>/p/fl-2041</td></tr>
          <tr><td>Bidon 750 ml</td><td class="num">€ 7,49</td><td class="num">64</td><td>/p/bd-0750</td></tr>
          <tr><td>Zadeltas klein</td><td class="num">€ 19,00</td><td class="num">6</td><td>/p/zt-0110</td></tr>
          <tr><td>Fietspomp mini</td><td class="num">€ 14,95</td><td class="num">31</td><td>/p/fp-0200</td></tr>
          <tr><td>Kettingolie</td><td class="num">€ 8,99</td><td class="num">42</td><td>/p/ko-0050</td></tr>
        </tbody></table></div>
      </div>
    </div>
  </section>

  <section class="band" id="toepassingen">
    <div class="wrap">
      <div class="head">
        <p class="eyebrow green">Toepassingen</p>
        <h2>Begin met je taak, niet met de tool</h2>
        <p>Kies wat je wilt doen. Elke toepassing laat zien wat de flow doet, in drie stappen, met een voorbeeld van het resultaat.</p>
      </div>
      <div class="tpls">{cards}</div>
      <div class="hero-cta" style="margin-top:28px"><a class="btn btn-ghost" href="{R}toepassingen/index.html">Alle {len(USE_CASES)} toepassingen</a></div>
    </div>
  </section>

  <section class="band">
    <div class="wrap cols">
      <div>
        <p class="eyebrow green">Flow van de week</p>
        <h2 style="font-size:clamp(30px,3.4vw,42px);line-height:1.1;margin:14px 0 14px">{e(week['titel'])}</h2>
        <p class="lead" style="font-size:17px">{e(week['probleem'])}</p>
        <div class="flow3" style="margin-top:22px">{week_steps}</div>
        <div class="hero-cta" style="margin-top:24px"><a class="btn btn-ghost" href="{R}toepassingen/{week['slug']}.html">Bekijk deze flow</a></div>
      </div>
      <div class="side-card">
        <span class="tag pro">Pro</span>
        <h3>Betaal pas voor gemak</h3>
        <p>De scraper is gratis. Voor planning, opslag in de cloud, een wachtrij voor werk van collega's of andere systemen, en straks AI-stappen en een cloud-runner, kies je Pro.</p>
        <a class="btn btn-ghost" href="{R}prijzen.html">Bekijk de prijzen</a>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <div class="head">
        <p class="eyebrow green">Eerlijk over data</p>
        <h2>Zakelijke gegevens, in je eigen browser</h2>
      </div>
      <div class="trio">
        <div><h3>Draait bij jou</h3><p>{B} leest pagina's in je eigen browser en gebruikt de sessie waarmee je al bent ingelogd. We bewaren geen wachtwoorden.</p></div>
        <div><h3>Gemaakt voor zakelijke data</h3><p>Prijzen, producten, vacatures, bedrijfsgegevens. Persoonsgegevens verzamelen mag onder de AVG meestal niet; {B} is daar niet voor bedoeld.</p></div>
        <div><h3>Je ziet alles eerst</h3><p>Een voorbeeldtabel voor je exporteert, een testronde voor je iets verstuurt, en een lijst van wat werd overgeslagen.</p></div>
      </div>
    </div>
  </section>

  <section class="band"><div class="wrap">{wachtlijst(R)}</div></section>

  <section class="final">
    <div class="wrap">
      <h2>Vertel wat je wilt automatiseren.<br><span>Wij bouwen de flow.</span></h2>
      <div class="hero-cta"><a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis starten</a><a class="btn btn-ghost" href="{R}app.html"><span class="tri" aria-hidden="true"></span>Bekijk de demo</a></div>
    </div>
  </section>'''
    ld = [{'@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': B, 'applicationCategory': 'BusinessApplication', 'operatingSystem': 'Chrome',
           'description': 'Verzamel data en automatiseer je browser. Beschrijf wat je wilt automatiseren; ParseLab bouwt de flow.',
           'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'}, 'url': CONFIG['DOMAIN'] + '/'},
          {'@context': 'https://schema.org', '@type': 'Organization', 'name': B, 'url': CONFIG['DOMAIN'] + '/', 'logo': CONFIG['DOMAIN'] + '/assets/parselab/logo.svg'}]
    pagina('index.html', f'{B}: verzamel data en automatiseer je browser',
           'Beschrijf wat je wilt automatiseren of wijs het aan. ParseLab haalt gegevens op, vult formulieren in en bewaart bestanden. Gratis scraper voor Chrome.',
           body, ld=ld, extra_js=('hero.js',))
    reg('index.html', '1.0')


def hoe_het_werkt():
    items = [('Home', ''), ('Hoe het werkt', 'hoe-het-werkt.html')]
    def body(R):
        stappen = [
            ('s-pg', 'Installeer de extensie', 'Download de extensie en laad hem in Chrome. Twee minuten, eenmalig.', 'Gratis'),
            ('s-ui', 'Beschrijf het of wijs het aan', 'Typ in gewone taal wat je wilt, neem op wat je doet, of klik op wat je wilt hebben. Elke stap krijgt een kleur: invullen, klikken, uitlezen, pagina, opslaan of herhalen.', 'Gratis'),
            ('s-in', 'Koppel een lijst', 'Upload een Excel, CSV of TXT. Elke stap kan een kolom gebruiken. Kies of elke regel een ronde is, of één ronde per klant, project of categorie.', 'Gratis'),
            ('s-kl', 'Test eerst', 'Draai de eerste 5 regels, of loop stap voor stap door een ronde. Pas aan wat niet klopt.', 'Gratis'),
            ('s-op', 'Draai het en exporteer', 'Excel, CSV en JSON, plus PDF\'s en screenshots in mappen, met aan het eind één ZIP. Loopt iets vast, dan meldt ParseLab wat het oversloeg.', 'Gratis'),
            ('s-he', 'Plan het of laat werk binnenkomen', 'Laat de flow elke ochtend vanzelf starten, of laat collega\'s en andere systemen werk in de wachtrij zetten. Zie elke run terug in de geschiedenis.', 'Pro'),
        ]
        rows = ''.join(f'<div class="f3 {c}"><span class="no">{i + 1}</span><div><span class="k">{"Pro" if t == "Pro" else "Gratis"}</span><b>{e(h)}</b><span>{e(d)}</span></div></div>' for i, (c, h, d, t) in enumerate(stappen))
        return page_head_block(R, 'Hoe het werkt', f'Van een klus die je honderd keer doet naar één klik. {B} kijkt mee terwijl je het voordoet, of bouwt de flow uit je beschrijving.', [(l, (R + u) if u else R + 'index.html') if i < len(items) - 1 else (l, None) for i, (l, u) in enumerate(items)]) + f'''
  <section class="band"><div class="wrap cols">
    <div class="flow3">{rows}</div>
    <aside class="side-card"><span class="tag">Gratis</span><h3>Begin met de scraper</h3><p>Aanwijzen, voorbeeldtabel en export zijn gratis en blijven dat. Alles draait in je eigen browser.</p><a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis installeren</a><a class="btn btn-ghost" href="{R}app.html">Bekijk de demo</a></aside>
  </div></section>
  <section class="band"><div class="wrap">
    <div class="head"><p class="eyebrow green">Wat het niet doet</p><h2>Eerlijk over de grenzen</h2></div>
    <div class="trio">
      <div><h3>Chrome moet open zijn</h3><p>Planningen draaien in je eigen browser. Staat je computer uit, dan wacht de flow. Een cloud-runner staat op de planning.</p></div>
      <div><h3>Geen persoonsgegevens</h3><p>Gebruik {B} voor zakelijke gegevens. Namen, telefoonnummers en e-mailadressen van mensen verzamelen mag meestal niet.</p></div>
      <div><h3>Websites veranderen</h3><p>Verandert een pagina, dan zoekt {B} het element terug. Lukt dat niet, dan zie je precies welke stap aandacht nodig heeft.</p></div>
    </div>
  </div></section>
  <section class="band"><div class="wrap">{wachtlijst(R)}</div></section>'''
    pagina('hoe-het-werkt.html', 'Hoe het werkt', f'Zo werkt {B}: installeer de gratis extensie, beschrijf of wijs aan wat je wilt, koppel een lijst, test en exporteer. Planning en wachtrij met Pro.',
           body, actief='hoe', ld=[crumbs_ld(items)])
    reg('hoe-het-werkt.html', '0.9')


def toepassingen_hub():
    items = [('Home', ''), ('Toepassingen', 'toepassingen/')]
    def body(R):
        knoppen = '<button type="button" data-cat="alle" aria-pressed="true">Alle</button>' + ''.join(f'<button type="button" data-cat="{e(c)}" aria-pressed="false">{e(c)}</button>' for c in CATS)
        kaarten = ''.join(uc_card(u, R, met_cat_attr=True) for u in USE_CASES)
        return page_head_block(R, 'Toepassingen', 'Begin met je taak, niet met de tool. Elke toepassing laat zien wat de flow doet, in drie stappen, met een voorbeeld van het resultaat.', [('Home', R + 'index.html'), ('Toepassingen', None)]) + f'''
  <section class="band"><div class="wrap">
    <div class="filters" role="group" aria-label="Filter op soort">{knoppen}</div>
    <div class="tpls">{kaarten}</div>
  </div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, titel='Staat jouw taak er niet bij?', tekst='Vertel wat je wilt automatiseren. De meest gevraagde taken worden de volgende toepassingen en sjablonen.', knop='Taak doorgeven')}</div></section>'''
    ld = [crumbs_ld(items), {'@context': 'https://schema.org', '@type': 'ItemList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'url': CONFIG['DOMAIN'] + f'/toepassingen/{u["slug"]}.html', 'name': u['titel']} for i, u in enumerate(USE_CASES)]}]
    pagina('toepassingen/index.html', 'Toepassingen: wat je met browserautomatisering kunt doen',
           'Data verzamelen, prijzen volgen, formulieren invullen, facturen downloaden en meer. Bekijk per taak hoe de flow werkt, met voorbeelddata.',
           body, actief='toepassingen', ld=ld)
    reg('toepassingen/', '0.9')


def use_case(u):
    path = f'toepassingen/{u["slug"]}.html'
    items = [('Home', ''), ('Toepassingen', 'toepassingen/'), (u['titel'], path)]
    def body(R):
        stappen = ''.join(f'<div class="f3 {SOORT[s][0]}"><span class="no">{i + 1}</span><div><span class="k">{SOORT[s][2]}</span><b>{e(l)}</b><span>{e(d)}</span></div></div>' for i, (s, l, d) in enumerate(u['stappen']))
        th = ''.join(f'<th>{e(k)}</th>' for k in u['kolommen'])
        trs = ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in u['rijen'])
        tips = ''.join(f'<li>{e(t)}</li>' for t in u['tips'])
        faq = ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in u['faq'])
        rel = ''.join(f'<a class="rel" href="{UC[s]["slug"]}.html"><small>{e(UC[s]["cat"])}</small><b>{e(UC[s]["titel"])}</b><span>{e(UC[s]["kort"])}</span></a>' for s in u['verwant'])
        laag = '<span class="tag">Gratis</span>' if u['laag'] == 'Gratis' else '<span class="tag pro">Pro</span>'
        return page_head_block(R, u['titel'], e(u['probleem']), [('Home', R + 'index.html'), ('Toepassingen', R + 'toepassingen/index.html'), (u['titel'], None)], eyebrow=u['cat']) + f'''
  <section class="band"><div class="wrap cols">
    <div style="display:flex;flex-direction:column;gap:28px;min-width:0">
      <div><h2 style="font-size:28px;margin-bottom:16px">Zo werkt de flow</h2><div class="flow3">{stappen}</div></div>
      <div><h2 style="font-size:28px;margin-bottom:16px">Wat eruit komt</h2>
        <div class="ex"><div class="ex-head"><span>Resultaat</span><small>Voorbeelddata</small></div><div class="ex-scroll"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div></div></div>
      <div class="prose"><h2 style="margin-top:0">Tips</h2><ul>{tips}</ul></div>
      <div class="note"><b>Let op:</b> haal alleen zakelijke gegevens op en houd je aan de voorwaarden van de website. Persoonsgegevens verzamelen mag onder de AVG in de meeste gevallen niet.</div>
    </div>
    <aside class="side-card">{laag}<h3>{"Gratis met de scraper" if u["laag"] == "Gratis" else "Met Pro: planning en meldingen"}</h3>
      <p>{"Dit doe je met de gratis extensie, in je eigen browser." if u["laag"] == "Gratis" else "Handmatig draaien is gratis. Elke dag vanzelf, met een melding, is onderdeel van Pro."}</p>
      <a class="btn btn-green" href="{R}help.html#installeren" data-cta>Gratis installeren</a><a class="btn btn-ghost" href="{R}app.html">Bekijk de demo</a></aside>
  </div></section>
  <section class="band"><div class="wrap">
    <div class="head"><h2>Vragen over deze toepassing</h2></div>
    <div class="faq" style="margin:0">{faq}</div>
  </div></section>
  <section class="band"><div class="wrap">
    <div class="head"><h2>Ook handig</h2></div>
    <div class="related">{rel}</div>
  </div></section>'''
    pagina(path, u['titel'], u['desc'], body, actief='toepassingen', ld=[crumbs_ld(items), faq_ld(u['faq'])])
    reg(path, '0.8')


def prijzen():
    items = [('Home', ''), ('Prijzen', 'prijzen.html')]
    faqp = [('Is de scraper echt gratis?', 'Ja. Hij draait in je eigen browser; dat kost geen servers. Gratis blijft gratis.'),
            ('Waar zijn credits voor?', 'Voor dingen die op onze servers draaien en dus geld kosten: AI-stappen en straks de cloud-runner. Scrapen in je eigen browser kost geen credits.'),
            ('Wat kost het tijdens de testfase?', 'Tijdens de testfase zijn alle functies van de extensie gratis te gebruiken. De prijzen op deze pagina zijn wat we van plan zijn; je hoort het ruim van tevoren als dat verandert.'),
            ('Kan ik maandelijks opzeggen?', 'Ja. Abonnementen lopen per maand en zijn per maand op te zeggen.')]
    def body(R):
        return page_head_block(R, 'Prijzen', 'Begin gratis met de scraper. Betaal pas voor gemak: planning, opslag in de cloud, koppelingen en straks AI-stappen.', [('Home', R + 'index.html'), ('Prijzen', None)]) + f'''
  <section class="band"><div class="wrap">
    <div class="note" style="margin-bottom:28px"><b>Testfase:</b> alle functies van de extensie zijn nu gratis te gebruiken. Hieronder staat wat we van plan zijn.</div>
    <div class="prices">
      <div class="price"><div class="pn">Gratis</div><div class="pp">€0</div><ul><li>Scraper: aanwijzen, voorbeeldtabel, export</li><li>Formulieren invullen vanuit je lijst</li><li>Excel, CSV, JSON, PDF en ZIP</li><li>Flows lokaal bewaard</li></ul><a class="btn btn-ghost" href="{R}help.html#installeren">Gratis starten</a></div>
      <div class="price top"><div class="pn">Pro <em>Meest gekozen</em></div><div class="pp">{CONFIG['PRIJS_PRO']}<small> /maand</small></div><ul><li>Alles uit Gratis</li><li>Planning: elke dag, werkdagen, elk kwartier</li><li>Flows in de cloud, met mappen en versies</li><li>Geschiedenis van elke run</li><li>{CONFIG['CREDITS_PRO']} credits per maand voor AI-stappen (binnenkort)</li></ul><a class="btn btn-green" href="#wachtlijst">Op de wachtlijst</a></div>
      <div class="price"><div class="pn">Business</div><div class="pp">{CONFIG['PRIJS_BUSINESS']}<small> /maand</small></div><ul><li>Alles uit Pro, voor 5 gebruikers</li><li>Gedeelde flows met een teamcode</li><li>Wachtrij en API voor koppelingen</li><li>{CONFIG['CREDITS_BUSINESS']} credits per maand</li><li>Cloud-runner (binnenkort)</li></ul><a class="btn btn-ghost" href="#wachtlijst">Op de wachtlijst</a></div>
    </div>
  </div></section>
  <section class="band"><div class="wrap cols">
    <div><div class="head"><p class="eyebrow green">Credits</p><h2>Wat kost een credit?</h2><p>Credits zijn er alleen voor wat op onze servers draait. In je eigen browser werken kost niets.</p></div>
      <div class="ex"><div class="ex-scroll"><table class="credit-tab"><thead><tr><th>Actie</th><th>Credits</th></tr></thead><tbody>
        <tr><td>Een rij scrapen in je eigen browser</td><td class="num">0</td></tr>
        <tr><td>Een formulier invullen in je eigen browser</td><td class="num">0</td></tr>
        <tr><td>Een AI-stap op een rij (samenvatten, indelen, velden uit tekst)</td><td class="num">1</td></tr>
        <tr><td>Een rij via de cloud-runner</td><td class="num">1</td></tr>
      </tbody></table></div></div></div>
    <aside class="side-card"><span class="tag soon">Eenmalig</span><h3>Automation Vault</h3><p>Kant-en-klare flows per toepassing, met uitleg. Je koopt een pakket één keer, vanaf {CONFIG['PRIJS_VAULT']}.</p><a class="btn btn-ghost" href="{R}vault.html">Bekijk de Vault</a></aside>
  </div></section>
  <section class="band"><div class="wrap"><div class="head c"><h2>Vragen over prijzen</h2></div><div class="faq">{''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in faqp)}</div></div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, titel='Hoor als eerste wanneer Pro start', knop='Aanmelden')}</div></section>'''
    pagina('prijzen.html', 'Prijzen', f'De {B}-scraper is gratis. Pro ({CONFIG["PRIJS_PRO"]}/maand) voegt planning, cloudopslag en geschiedenis toe; Business ({CONFIG["PRIJS_BUSINESS"]}/maand) team, wachtrij en API.',
           body, actief='prijzen', ld=[crumbs_ld(items), faq_ld(faqp)])
    reg('prijzen.html', '0.9')


def vault():
    items = [('Home', ''), ('Automation Vault', 'vault.html')]
    pakketten = [
        ('Webshop en prijzen', 'Voor webwinkels en inkopers.', ['Productcatalogus naar Excel', 'Prijzen van concurrenten volgen', 'Voorraad bij leveranciers', 'Nieuwe producten melden', 'Productafbeeldingen per map']),
        ('Administratie', 'Voor kantoor en backoffice.', ['Facturen per maand als PDF', 'Excel invoeren in een webformulier', 'Gegevens tussen systemen overzetten', 'Dagrapport zonder export', 'Per regel een PDF bewaren']),
        ('Website-beheer', 'Voor marketeers en webbeheerders.', ['Alle pagina\'s inventariseren', 'Ontbrekende titels en descriptions', 'Gebroken links vinden', 'Content naar Excel voor een verhuizing', 'Schermafbeeldingen per pagina']),
    ]
    def body(R):
        kaarten = ''.join(f'<div class="vcard"><span class="tag soon">Binnenkort</span><h3>{e(t)}</h3><p>{e(d)}</p><ul>{"".join(f"<li>{e(x)}</li>" for x in l)}</ul><a class="btn btn-ghost" href="#wachtlijst">Laat het me weten</a></div>' for t, d, l in pakketten)
        return page_head_block(R, 'Automation Vault', f'Kant-en-klare flows per toepassing, met uitleg en voorbeelddata. Koop een pakket één keer, open het in {B} en pas het aan op je eigen websites.', [('Home', R + 'index.html'), ('Automation Vault', None)]) + f'''
  <section class="band"><div class="wrap">
    <div class="head"><h2>Pakketten</h2><p>Elk pakket bevat 5 tot 10 werkende flows, een korte uitleg per flow en een voorbeeldlijst. Vanaf {CONFIG['PRIJS_VAULT']}, eenmalig.</p></div>
    <div class="vault">{kaarten}</div>
  </div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, soort='vault', titel='Welk pakket wil je als eerste?', tekst='Vertel voor welke taak of branche je een pakket wilt. Het meest gevraagde pakket maken we eerst.', knop='Doorgeven')}</div></section>'''
    pagina('vault.html', 'Automation Vault: kant-en-klare flows', f'Kant-en-klare {B}-flows per toepassing: webshop en prijzen, administratie, website-beheer. Eenmalig te koop, met uitleg en voorbeelddata.',
           body, ld=[crumbs_ld(items)])
    reg('vault.html', '0.7')


def faq_pagina():
    items = [('Home', ''), ('FAQ', 'faq.html')]
    def body(R):
        return page_head_block(R, 'Veelgestelde vragen', f'Alles over de scraper, je gegevens, prijzen en wat {B} wel en niet doet.', [('Home', R + 'index.html'), ('FAQ', None)]) + f'''
  <section class="band"><div class="wrap"><div class="faq">{''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in FAQ_ALG)}</div></div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, soort='vraag', titel='Staat je vraag er niet bij?', tekst='Stel hem hier. We antwoorden per e-mail, meestal binnen twee werkdagen.', knop='Vraag versturen')}</div></section>'''
    pagina('faq.html', 'Veelgestelde vragen', f'Antwoorden over de gratis scraper, gegevens en privacy, planning, prijzen en wat {B} wel en niet doet.',
           body, actief='faq', ld=[crumbs_ld(items), faq_ld(FAQ_ALG)])
    reg('faq.html', '0.8')


def help_pagina():
    items = [('Home', ''), ('Help', 'help.html')]
    def body(R):
        return page_head_block(R, 'Help en installatie', f'In twee minuten klaar in Chrome. Daarna je eerste tabel in vijf minuten.', [('Home', R + 'index.html'), ('Help', None)]) + f'''
  <section class="band" id="installeren"><div class="wrap">
    <div class="help">
      <div class="dl">
        <h3 style="font-size:22px">{B} voor Chrome</h3>
        <p class="ver">Versie {CONFIG['VERSIE']} · Chrome, Edge en andere Chromium-browsers</p>
        <p class="found" data-ext-ok></p>
        <a class="btn btn-green" href="{R}downloads/parselab-extension.zip" download>Download de extensie (.zip)</a>
        <p class="ver">Binnenkort ook in de Chrome Web Store.</p>
      </div>
      <div class="inst">
        <div><b>1</b><p>Pak het zipbestand uit in een vaste map.</p></div>
        <div><b>2</b><p>Open <code>chrome://extensions</code> en zet rechtsboven <strong>Ontwikkelaarsmodus</strong> aan.</p></div>
        <div><b>3</b><p>Klik op <strong>Uitgepakte extensie laden</strong> en kies de map.</p></div>
        <div><b>4</b><p>Open een website en klik op het {B}-icoon, of druk op <code>Alt+Shift+S</code>.</p></div>
      </div>
    </div>
  </div></section>
  <section class="band"><div class="wrap prose">
    <h2 style="margin-top:0">Je eerste tabel</h2>
    <ol><li>Open de pagina met de lijst of tabel die je wilt hebben.</li><li>Open {B} en kies <strong>Handmatig → Uitlezen → Lijst</strong>.</li><li>Klik op één rij of kaart. {B} vindt de rest en laat een voorbeeld zien.</li><li>Wil je meer pagina's? Voeg een stap <strong>Volgende pagina</strong> toe en wijs de knop aan.</li><li>Klik op <strong>Start</strong> en daarna op <strong>Download bestand</strong> voor Excel.</li></ol>
    <h2>Als het niet lukt</h2>
    <h3>Het icoon doet niets</h3><p>Sommige pagina's laten geen extensies toe, zoals de pagina's van Chrome zelf. Probeer een gewone website.</p>
    <h3>Een stap vindt het element niet meer</h3><p>De website is veranderd. Open de stap en wijs het element opnieuw aan. In het logboek zie je welke stap het was.</p>
    <h3>Een planning start niet</h3><p>Chrome moet open zijn en je moet op de site ingelogd zijn. In <strong>Flows → Planning</strong> zie je de laatste status.</p>
    <h3>Mijn flows staan niet op mijn andere computer</h3><p>Vul op beide computers dezelfde teamcode in (Instellingen → Cloud).</p>
  </div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, soort='vraag', titel='Vraag het ons', tekst='Kom je er niet uit? Stel je vraag hier. We antwoorden per e-mail, meestal binnen twee werkdagen.', knop='Vraag versturen')}</div></section>'''
    pagina('help.html', 'Help en installatie', f'{B} installeren in Chrome in vier stappen, je eerste tabel maken en oplossingen voor veelvoorkomende problemen.',
           body, actief='help', ld=[crumbs_ld(items)])
    reg('help.html', '0.8')


def inloggen():
    items = [('Home', ''), ('Inloggen', 'inloggen.html')]
    def body(R):
        return page_head_block(R, 'Inloggen', f'Je account zit in de extensie. Een webapp om overal in te loggen komt later.', [('Home', R + 'index.html'), ('Inloggen', None)]) + f'''
  <section class="band"><div class="wrap cols">
    <div class="prose">
      <h2 style="margin-top:0">Zo kom je bij je flows</h2>
      <ol><li>Open een website in Chrome.</li><li>Klik op het {B}-icoon of druk op <code>Alt+Shift+S</code>.</li><li>Klik bovenaan de flow op <strong>Flows</strong>: daar staan je flows per map, je wachtrij, je planning en de geschiedenis.</li></ol>
      <h2>Op een andere computer</h2>
      <p>Vul in de extensie dezelfde teamcode in (Instellingen → Cloud). Dan zie je dezelfde flows.</p>
      <p class="ext-ok" data-ext-ok style="display:block"></p>
    </div>
    <aside class="side-card"><span class="tag soon">Binnenkort</span><h3>De webapp</h3><p>Flows, tabellen en geschiedenis in je browser, zonder extensie te openen. Bekijk alvast de demo met voorbeelddata.</p><a class="btn btn-green" href="{R}app.html">Bekijk de demo</a><a class="btn btn-ghost" href="{R}help.html#installeren">Extensie installeren</a></aside>
  </div></section>
  <section class="band"><div class="wrap">{wachtlijst(R, titel='Laat het me weten als de webapp klaar is')}</div></section>'''
    pagina('inloggen.html', 'Inloggen', f'Inloggen bij {B} gaat via de Chrome-extensie. Zo vind je je flows, en zo gebruik je ze op een andere computer.',
           body, ld=[crumbs_ld(items)], robots='noindex,follow')


def app_demo():
    items = [('Home', ''), ('Demo', 'app.html')]
    def body(R):
        return open(os.path.join(ROOT, 'site-src', 'app-body.html'), encoding='utf-8').read().replace('{R}', R).replace('{B}', B)
    pagina('app.html', 'Demo', f'Bekijk hoe {B} werkt: beschrijf een taak, zie de flow ontstaan, test hem en bekijk het resultaat. Demo met voorbeelddata.',
           body, ld=[crumbs_ld(items)], extra_js=('app.js',))
    reg('app.html', '0.6')


def privacy():
    items = [('Home', ''), ('Privacy', 'privacy.html')]
    def body(R):
        return page_head_block(R, 'Privacy', f'Wat {B} met gegevens doet, in gewone taal.', [('Home', R + 'index.html'), ('Privacy', None)]) + f'''
  <section class="band"><div class="wrap prose">
    <p class="note" style="margin-bottom:28px"><b>Concept.</b> Deze tekst is een eerste versie en wordt nog juridisch gecontroleerd.</p>
    <h2 style="margin-top:0">De extensie</h2>
    <p>De {B}-extensie leest pagina's in je eigen browser. Wat je ophaalt, je lijsten en je resultaten blijven op je computer. We bewaren geen wachtwoorden: je gebruikt de sessie waarmee je zelf bent ingelogd.</p>
    <h2>Flows in de cloud</h2>
    <p>Als je flows in de cloud bewaart, slaan we de stappen en instellingen op in een database in de EU (Frankfurt). Je lijst gaat alleen mee als je dat per flow aanzet. Toegang gaat via een geheime teamcode; de database bewaart alleen een versleutelde vorm daarvan.</p>
    <h2>Wachtlijst en vragen</h2>
    <p>Meld je je aan voor de wachtlijst of stel je een vraag, dan bewaren we je e-mailadres en wat je invult. We gebruiken dat alleen om je te informeren over {B} of je vraag te beantwoorden. Je kunt je altijd laten verwijderen.</p>
    <h2>Website</h2>
    <p>Deze website gebruikt geen advertentie- of volgcookies. Lettertypen worden geladen via Google Fonts.</p>
    <h2>Wat jij ophaalt</h2>
    <p>Je bent zelf verantwoordelijk voor wat je met {B} ophaalt. Persoonsgegevens verzamelen mag onder de AVG in de meeste gevallen niet, ook niet als ze openbaar online staan. Gebruik {B} voor zakelijke gegevens.</p>
    <h2>Je rechten</h2>
    <p>Je kunt vragen welke gegevens we van je hebben, ze laten aanpassen of verwijderen. Gebruik daarvoor het vragenformulier op de <a href="{R}help.html">helppagina</a>.</p>
    <p><small>Laatst bijgewerkt: {VANDAAG}</small></p>
  </div></section>'''
    pagina('privacy.html', 'Privacy', f'Hoe {B} met gegevens omgaat: de extensie werkt lokaal, flows in de EU, wachtlijst alleen voor informatie over {B}.',
           body, ld=[crumbs_ld(items)])
    reg('privacy.html', '0.3')


def voorwaarden():
    items = [('Home', ''), ('Voorwaarden', 'voorwaarden.html')]
    def body(R):
        return page_head_block(R, 'Voorwaarden', f'De afspraken voor het gebruik van {B}, in gewone taal.', [('Home', R + 'index.html'), ('Voorwaarden', None)]) + f'''
  <section class="band"><div class="wrap prose">
    <p class="note" style="margin-bottom:28px"><b>Concept.</b> Deze tekst is een eerste versie en wordt nog juridisch gecontroleerd.</p>
    <h2 style="margin-top:0">Gebruik</h2>
    <p>{B} helpt je taken in je browser te automatiseren. Je gebruikt het op websites waar je toegang toe hebt en binnen de voorwaarden van die websites.</p>
    <h2>Jouw verantwoordelijkheid</h2>
    <ul><li>Je haalt alleen gegevens op die je mag gebruiken.</li><li>Je verzamelt geen persoonsgegevens zonder geldige grondslag onder de AVG.</li><li>Je belast websites niet onredelijk, bijvoorbeeld door te vaak te controleren.</li><li>Je controleert het resultaat voordat je erop vertrouwt.</li></ul>
    <h2>Testfase</h2>
    <p>{B} is in ontwikkeling. Functies kunnen veranderen. Tijdens de testfase is de extensie gratis te gebruiken.</p>
    <h2>Geen garantie</h2>
    <p>Websites veranderen en een flow kan daardoor stoppen of iets missen. {B} wordt geleverd zoals het is, zonder garantie op een bepaald resultaat.</p>
    <p><small>Laatst bijgewerkt: {VANDAAG}</small></p>
  </div></section>'''
    pagina('voorwaarden.html', 'Voorwaarden', f'De gebruiksvoorwaarden van {B}: gebruik binnen de voorwaarden van websites, geen persoonsgegevens zonder grondslag, testfase.',
           body, ld=[crumbs_ld(items)])
    reg('voorwaarden.html', '0.3')


def niet_gevonden():
    def body(R):
        return f'''<section class="page-head"><canvas class="net" aria-hidden="true"></canvas><div class="wrap"><p class="eyebrow green">404</p><h1>Deze pagina bestaat niet</h1><p class="lead">Misschien is hij verhuisd. Kies hieronder waar je heen wilt.</p>
    <div class="hero-cta"><a class="btn btn-green" href="/index.html">Naar de homepage</a><a class="btn btn-ghost" href="/toepassingen/index.html">Toepassingen</a></div></div></section>'''
    # 404 staat op de hoofdmap maar wordt overal getoond: absolute links naar de assets.
    txt = head('404.html', 'Pagina niet gevonden', 'Deze pagina bestaat niet.', '/', robots='noindex') + '\n<body>\n' + header('/', None) + '\n<main id="top">\n' + body('/') + '\n</main>\n' + footer('/') + scripts('/') + '\n</body>\n</html>\n'
    write('404.html', txt)


def sitemap_en_robots():
    urls = ''.join(f'  <url><loc>{e(CONFIG["DOMAIN"])}/{"" if p == "index.html" else p}</loc><lastmod>{VANDAAG}</lastmod><priority>{pr}</priority></url>\n' for p, pr in PAGES)
    write('sitemap.xml', f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    write('robots.txt', f'User-agent: *\nAllow: /\nDisallow: /site-src/\n\nSitemap: {CONFIG["DOMAIN"]}/sitemap.xml\n')


if __name__ == '__main__':
    print(f'{B}-site bouwen in {ROOT}')
    home(); hoe_het_werkt(); toepassingen_hub()
    for u in USE_CASES:
        use_case(u)
    prijzen(); vault(); faq_pagina(); help_pagina(); inloggen(); app_demo(); privacy(); voorwaarden(); niet_gevonden()
    sitemap_en_robots()
    print(f'Klaar: {len(PAGES)} pagina\'s in de sitemap.')
