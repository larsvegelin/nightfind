# NightFind Trips — haalbaarheids- en rendementsanalyse

> Eerlijke beoordeling: is dit idee werkbaar, haalbaar en winstgevend? Cijfers zijn indicaties op basis van publiek bekende affiliate-voorwaarden en gangbare conversiecijfers in travel-affiliate; controleer ze in de partnerdashboards zodra er data is.

---

## 1. Samenvatting

**Werkbaar: ja.** Het concept (vragenflow → bestemming → boeklinks) is technisch simpel, staat al als werkende pagina, en kost vrijwel niets om live te zetten.

**Haalbaar: ja, met één harde voorwaarde: verkeer.** Affiliate-inkomsten zijn een percentage van wat bezoekers boeken. Zonder een verkeersbron (SEO-content, de bestaande app, social) verdient de mooiste quiz nul euro.

**Rendabel: op termijn en bescheiden, tenzij je verder gaat dan affiliates.** Realistisch beeld:

| Fase | Maandelijkse bezoekers | Verwachte affiliate-omzet/maand |
|---|---|---|
| Start (0–6 mnd) | 1.000–5.000 | € 30 – € 300 |
| Groei (6–18 mnd, consistent content) | 20.000–40.000 | € 1.000 – € 2.500 |
| Volwassen (18+ mnd, top-3 rankings NL) | 100.000+ | € 5.000 – € 10.000 |

De kosten zijn laag (hosting, Supabase, wat AI-tokens), dus vrijwel alle omzet is marge. De echte kostenpost is **tijd** voor content en SEO. Winst in geld komt pas in fase 2; in fase 1 is dit een investering.

**Advies:** doen, maar als **90-dagen-test met meetpunten**, en met vanaf dag één een plan om verkeer te halen. Zie §8.

---

## 2. Hoe het geld werkt: affiliate-economie

| Partner | Vergoeding | Wat dat in de praktijk oplevert |
|---|---|---|
| **Booking.com** | 25–40% van Booking's eigen commissie (± 15% van de boeking) | effectief **3,5–6% van de boekingswaarde**. Stedentrip 3 nachten à € 130 = € 390 → ± € 16. Feestvakantie 7 nachten à € 110 = € 770 → ± € 30 |
| **Hostelworld** | ± 30–40% van hun servicefee | ± € 1–3 per boeking |
| **Skyscanner** | CPC (kosten per klik) | ± € 0,10–0,60 per doorklik, ongeacht boeking |
| **Omio** | 6–8% van ticket | trein Amsterdam–Berlijn € 80 → € 5 |
| **Viator / GetYourGuide** | 8% van de activiteit | boat party € 60 → € 5; per persoon, dus groepen tellen op |
| **TripAdvisor** | CPC, ± 50% van hun inkomsten per klik | ± € 0,20–0,50 per klik |

**Gewogen gemiddelde per geboekte reis** (hotel + één activiteit + wat CPC-klikken): ongeveer **€ 18–35**.

### Conversietrechter (gangbare cijfers travel-affiliate)

```
100 bezoekers op trips.html
 → 30–40 maken de quiz af           (korte, speelse flow: hoog)
 → 12–20 klikken naar een partner   (± 40–50% van de afmakers)
 → 0,2–0,5 boekingen                (1–3% van klikken boekt, Booking-cookie is kort)
 → € 5 – € 15 omzet per 100 bezoekers
```

Dus **€ 50–150 per 1.000 bezoekers**. Dat is de kernformule. Alles wat je doet moet óf de bezoekers omhoog brengen, óf de omzet per 1.000 bezoekers.

---

## 3. Scenario's

Aannames: 35% quiz-afmaak, 45% klikt door, 2% van klikken boekt, gemiddeld € 25 commissie per boeking, plus € 0,25 CPC op 20% van de klikken.

| | Bezoekers/mnd | Klikken | Boekingen | Commissie | CPC | **Omzet/mnd** |
|---|---|---|---|---|---|---|
| Pessimistisch | 2.000 | 315 | 6 | € 158 | € 16 | **€ 175** |
| Basis | 15.000 | 2.360 | 47 | € 1.180 | € 118 | **€ 1.300** |
| Optimistisch | 60.000 | 9.450 | 189 | € 4.725 | € 472 | **€ 5.200** |
| Seizoenspiek (mei–juli, feestvakanties) | ×1,8 | | | | | |

### Kosten per maand

| Post | Bedrag |
|---|---|
| Hosting statische site (Netlify/Vercel/GitHub Pages) | € 0 – € 20 |
| Supabase (bestaand; Pro bij groei) | € 0 – € 25 |
| Claude API voor AI-routes/chat (alleen als ingezet): ± € 0,03 per gegenereerd plan, ± € 0,01 per chatbericht | € 10 – € 150 |
| Domein, e-mail | € 5 |
| Content/SEO (eigen tijd, of freelancer € 40–80 per artikel) | € 0 – € 800 |
| **Totaal** | **€ 20 – € 1.000** |

Cash-break-even ligt dus bij een paar honderd bezoekers per dag. **Tijd-break-even** (jouw uren tegen een normaal tarief) ligt bij het basisscenario, na 6–18 maanden.

---

## 4. Wat ervoor pleit

1. **Nul voorraad, nul risico, nul klantenservice.** Je verwijst door; de partner handelt boeking, betaling en annulering af.
2. **Unieke content die concurrenten niet hebben.** De Supabase-database met bars en clubs per stad is precies wat generieke reissites missen. "Uitgaan in Boedapest" met echte venues, prijsniveaus en openingstijden is SEO-goud in een niche.
3. **Hoge orderwaarde in de niche.** Feestvakanties en vrijgezellenweekenden zijn groepsboekingen: 6–12 personen, meerdere kamers, meerdere activiteiten. Eén groep kan € 100+ commissie opleveren.
4. **De quiz verhoogt doorklik.** Een A/B/C/D-flow is speels, snel en geeft het gevoel van maatwerk. Dat verhoogt de klik naar partners ten opzichte van een lijstje links.
5. **Synergie met de app.** App-gebruikers hebben al intentie; een "plan je volgende trip"-knop in de app is gratis, warm verkeer.
6. **Uitbreidbaar naar eigen marge.** Guestlists, clubtickets, pubcrawls en groepsarrangementen kun je later direct met venues afspreken (20–30% marge, geen partner ertussen).

## 5. Wat ertegen pleit (en hoe ernstig)

| Risico | Ernst | Toelichting / mitigatie |
|---|---|---|
| **Geen verkeer** | Hoog | Het enige echte risico. Zonder SEO/app/social is de omzet nul. Mitigatie: contentplan §8, app-koppeling, TikTok/Instagram-shorts "3 dagen Berlijn voor € 250". |
| **Google reis-SERP's zijn bezet** | Hoog | Booking, TripAdvisor, Holidayguru, TUI domineren "stedentrip"/"feestvakantie". Mitigatie: niche-longtail ("techno weekend Berlijn", "beste clubs Boedapest 2026"), waar jouw venue-data wint. |
| **AI-overviews in Google verminderen klikken** | Middel | Reis-informatie wordt steeds vaker in de zoekresultaten zelf beantwoord. Mitigatie: tools (quiz, planner) en actuele data zijn niet te vervangen door een samenvatting. |
| **Korte Booking-cookie** | Middel | Booking rekent alleen af als de boeking in dezelfde sessie/korte tijd volgt. Veel klikkers vergelijken eerst. Mitigatie: "bewaar je reis"-e-mail met affiliate-links, prijsalerts. |
| **Lekkage naar de Booking-app** | Middel | Mobiele bezoekers openen vaak de app; die boeking krijg je niet. Structureel, niet op te lossen. |
| **Goedkeuring affiliate-programma's** | Laag | Booking en TripAdvisor willen een live site met inhoud en verkeer zien. Eerst content, dan aanvragen. GetYourGuide, Viator, Travelpayouts zijn laagdrempelig. |
| **Seizoensgebondenheid** | Laag | Feestvakanties pieken april–juli; stedentrips zijn jaarrond. Spreiding in de bestemmingen dempt dit. |
| **Reputatie / juridisch** | Laag | Nachtleven-content kan drankgerelateerd zijn: 18+ disclaimer (staat al in de voorwaarden), affiliate-disclosure (staat er), geen pakketreizen samenstellen (je verwijst alleen door). |

---

## 6. Vergelijking met alternatieve verdienmodellen

| Model | Omzet per 1.000 bezoekers | Opmerking |
|---|---|---|
| Affiliate (dit plan) | € 50 – € 150 | laag risico, laag plafond |
| Display-advertenties (AdSense/Mediavine) | € 5 – € 25 | pas interessant vanaf 50k+ sessies |
| Eigen tickets/guestlists met venues | € 200 – € 600 | hogere marge, wel operationeel werk en afspraken |
| Premium listing voor venues (bestaat al in de app) | n.v.t. per bezoeker | B2B: € 30–100/mnd per venue, schaalt met steden |
| Groepsarrangementen (vrijgezellen) | € 500 – € 2.000 | hoogste waarde, maar je wordt organisator (aansprakelijkheid, pakketreisrichtlijn) |

**Conclusie:** affiliates zijn de juiste eerste stap (goedkoop, zonder risico), maar het plafond ligt rond enkele duizenden euro's per maand. De grotere winst zit in de combinatie: affiliate-verkeer als basis, venue-deals en premium listings als marge.

---

## 7. Wat maakt of breekt het

1. **Verkeer** — 80% van het succes. Elke week één goede gids per stad/type, 6 maanden vol.
2. **Doorklikpercentage** — de quiz moet eindigen in een concrete, aantrekkelijke boekknop ("Hotels in Barcelona vanaf € 89" werkt beter dan "Bekijk hotels"). Prijzen tonen via de Booking-API (beschikbaar na goedkeuring) verhoogt CTR aantoonbaar.
3. **Meten** — klikregistratie in Supabase per bestemming en partner; anders optimaliseer je blind.
4. **Vertrouwen** — echte venues, echte foto's, eerlijke prijsindicaties. De bestaande database is het verschil met een AI-gegenereerde reissite.

---

## 8. Aanbevolen aanpak: 90-dagen-test

| Week | Actie | Meetpunt |
|---|---|---|
| 1 | `trips.html` live op nightfind.app, klikregistratie in Supabase, GetYourGuide + Viator + Travelpayouts (Skyscanner/Hostelworld/Omio) aanvragen | site live |
| 2–3 | 6 gidsen: Berlijn, Boedapest, Barcelona, Ibiza, Praag, Lissabon — elk met venue-data uit Supabase en de quiz als CTA | 6 pagina's geïndexeerd |
| 3 | Booking.com en TripAdvisor affiliate aanvragen (nu er inhoud staat) | goedkeuring |
| 4 | "Plan je trip"-knop in de app; 10 shorts op TikTok/Instagram uit de gidsen | app-verkeer > 0 |
| 5–12 | Elke week 1 gids + 3 shorts; A/B-test knopteksten in de resultaten | quiz-afmaak > 30%, doorklik > 40% |
| 12 | Beslissing | ≥ 3.000 bezoekers/mnd en ≥ 10 boekingen → doorzetten naar fase 2 (Supabase-bestemmingen, AI-plannen, prijzen via API). Anders: verkeersstrategie herzien, niet de tool. |

**Doelstelling na 12 maanden:** 15.000–25.000 bezoekers per maand, € 1.000–2.000 affiliate-omzet, eerste drie venue-deals.

---

## 9. Eindoordeel

- **Werkbaar:** ja. Bestaat al, werkt zonder backend, kost niets om te draaien.
- **Haalbaar:** ja, mits je verkeer bouwt. Dat is content- en marketingwerk, geen techniek.
- **Rendabel:** in cash vrijwel meteen positief (kosten ≈ 0), in tijd na 6–18 maanden, en pas écht winstgevend als affiliate-verkeer wordt gecombineerd met eigen venue-deals en premium listings.

Het idee is geen goudmijn op zichzelf, maar het is een goedkope, logische verbreding van NightFind die het bestaande unieke bezit, de venue-database, eindelijk te gelde maakt. Het grootste gevaar is niet dat het niet werkt, maar dat het niet gevonden wordt.
