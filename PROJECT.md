# NightFind Trips — projectdocument

> Uitgebreide beschrijving van het platform: visie, doelgroep, functionaliteit, techniek, data, affiliates, roadmap en beheer. Voor de zakelijke haalbaarheid: zie `ANALYSE.md`.

---

## 1. Visie

NightFind begon als nightlife-app (bars, clubs, events per stad). De volgende stap is een **reis- en uitgaansplatform** dat mensen niet alleen vertelt *waar* ze uit kunnen gaan, maar ze helpt de **hele trip** te kiezen en te boeken: bestemming, reistype, hotel, vervoer, activiteiten en het nachtleven.

De kern: **een korte, speelse vragenflow (A/B/C/D)** die in zeven vragen een profiel opbouwt en daarmee bestemmingen en een reisopzet voorstelt. Elke suggestie is direct boekbaar via affiliate-partners. Het verdienmodel is affiliate-commissie; de gebruiker betaalt nooit extra.

Eén zin: *"Vind je reis in 7 vragen — en boek 'm meteen."*

## 2. Doelgroep

| Segment | Kenmerken | Reistypes |
|---|---|---|
| Vriendengroepen 18–30 | budgetbewust, feesten, weekend of week | Feestvakantie, uitgaansvakantie, stedentrip |
| Stellen 25–40 | cultuur + goede avond uit, comfort | Stedentrip, rondreis |
| Vrijgezellenfeesten | grote groep, één organisator, wil snel opties | Feestvakantie, stedentrip |
| Solo-reizigers | hostels, sociale activiteiten, langer weg | Rondreis, uitgaansvakantie |

De bestaande app-gebruikers (nightlife) zijn de eerste doelgroep; de site moet daarnaast SEO-verkeer trekken op zoektermen als "feestvakantie 2026", "stedentrip nachtleven", "beste steden om uit te gaan".

## 3. Reistypes

| Type | Duur | Kenmerk | Voorbeeldbestemmingen |
|---|---|---|---|
| **Stedentrip** | 2–4 dagen | één stad, mix van cultuur, eten, bars, één club | Amsterdam, Berlijn, Praag, Lissabon, Madrid |
| **Uitgaansvakantie** | 5–8 dagen | het nachtleven ís het programma | Berlijn, Barcelona, Boedapest, Londen |
| **Feestvakantie** | 7–10 dagen | strand overdag, beachclubs/festivals 's nachts | Ibiza, Malia, Algarve, Split/Hvar, Mykonos |
| **Rondreis** | 1–3 weken | meerdere steden/eilanden | Kroatië, Thailand, Italië, België |

## 4. Landen en bestemmingen

Bestemmingen staan nu hard-coded in `trips.html` (17 bestemmingen in 11 landen). Elke bestemming heeft:

- `country`, `city`, `iata` (voor vluchtlinks), `flag`
- `types` — welke reistypes passen
- `reason` — feesten / ontspannen / cultuur / avontuur
- `vibe` — strand / stad / underground / resort
- `season` — zomer / winter / voorjaar-najaar / flexibel
- `price` — 1 (goedkoop) t/m 4 (luxe)
- `train` — bereikbaar per trein vanuit NL
- `why` — één zin waarom
- `plan` — dagindeling (3–4 dagen) als tekst

Uitbreiden = een object toevoegen aan de `DEST`-array. Op termijn verhuist dit naar een Supabase-tabel `destinations` zodat het zonder code-wijziging te beheren is.

## 5. De vragenflow (onboarding)

Zeven vragen, elk met vier opties (A/B/C/D). Klikken of de toets A–D drukken gaat direct door naar de volgende vraag. Overslaan kan.

| # | Vraag | Profielsleutel | Opties |
|---|---|---|---|
| 1 | Waarom ga je op reis? | `reason` | feesten / ontspannen+avond uit / cultuur & eten / avontuur & rondreizen |
| 2 | Met wie? | `group` | vrienden / partner / solo / grote groep |
| 3 | Hoe lang? | `duration` | weekend / korte week / 1–2 weken / langer |
| 4 | Budget p.p.? | `budget` | <€300 / €300–700 / €700–1.500 / €1.500+ |
| 5 | Welke sfeer? | `vibe` | strand / grote stad / underground / resort |
| 6 | Wanneer? | `season` | zomer / winter / voorjaar-najaar / flexibel |
| 7 | Vervoer? | `transport` | vliegen / trein / auto / maakt niet uit |

Vooraf kan de gebruiker optioneel een **reistype** en een **land** kiezen. Een land werkt als hard filter; een reistype geeft extra gewicht.

### Matching (regelgebaseerd, geen AI nodig)

Score per bestemming:

- +3 reistype past, +3 reden past, +3 sfeer past
- +2 seizoen past (of bestemming is "flexibel")
- budget: +3 exact, +1 één stap verschil, −1/−3 bij groter verschil
- trein gekozen: +2 als bereikbaar, −2 als niet
- kleine bonussen: grote groep → feestbestemming, stel → cultuurbestemming, lange duur → rondreis

Top 3 wordt getoond met een matchpercentage, dagindeling, prijsindicatie en boeklinks. Reistype wordt afgeleid als de gebruiker er geen koos (lange duur/avontuur → rondreis; strand/resort → feestvakantie; week + feesten → uitgaansvakantie; anders stedentrip).

### AI-laag (optioneel, fase 2)

De regels werken zonder backend. De `plan.html`-route en de chatwidget gebruiken al een Supabase Edge Function (`supabase/functions/chat`) die naar Claude proxied. Dezelfde functie kan het quizprofiel omzetten in een uitgebreider reisplan (dag-tot-dag, alternatieven, tips), en de chat kan de route aanpassen ("maak het goedkoper", "voeg een strand toe").

## 6. Affiliates en boeklinks

| Partner | Wat | Programma | Commissie (indicatie) | Cookie |
|---|---|---|---|---|
| Booking.com | hotels, appartementen | Booking Affiliate Partner Programme | 25–40% van Booking's commissie ≈ 3–5% van boekingswaarde | sessie/kort |
| Hostelworld | hostels (budget/solo) | Hostelworld Affiliate (via Impact) | ca. 30–40% van hun commissie | 30 dagen |
| Skyscanner | vluchten | Skyscanner Affiliate (Impact/Travelpayouts) | ca. 50% van hun inkomsten per doorklik, effectief €0,10–0,60 per klik | n.v.t. (CPC) |
| Omio | trein/bus | Omio Partner | ca. 6–8% | 30 dagen |
| Viator | tours, boat parties, clubtickets | Viator Partner Program | 8% | 30 dagen |
| GetYourGuide | tickets, excursies | GetYourGuide Partner | 8% | 31 dagen |
| TripAdvisor | restaurants (CPC) | TripAdvisor Affiliate (CJ/Awin) | ca. 50% van hun revenue per klik | 14 dagen |

Alle ID's staan in één `AFF`-object bovenaan het script in `trips.html` (en in `assets/js/nightfind-config.js` voor `plan.html`). Zonder ID werken de links gewoon, zonder tracking. Alle uitgaande links hebben `rel="noopener sponsored"` (Google-vereiste voor betaalde links) en een zichtbare disclosure onder de resultaten.

## 7. Techniek

- **Statisch**: pure HTML/CSS/JS, geen build. `trips.html` is volledig zelfstandig (stijl en data inline) en opent lokaal met dubbelklik.
- **Huisstijl**: exact de tokens van `assets/css/style.css` — zwart `#000`, paars `#7C3AED`, indigo `#5B21B6`, grijs `#1a1a1a/#333/#666`, Inter/Poppins, radius 16px, kaarten met paarse rand en −5px hover, gradient-koppen.
- **Bestanden**
  - `trips.html` — landen, reistypes, quiz, resultaten (dit document beschrijft deze pagina)
  - `plan.html` + `assets/js/*` — stad-gebonden routeplanner (avond/dag/weekend) met Supabase-venues en chatbot
  - `supabase/functions/chat/index.ts` — Claude-proxy (chat + gestructureerde route)
  - `CLAUDE.md` — projectcontext voor Claude Code
  - `ANALYSE.md` — haalbaarheid en rendement
- **Deelbare resultaten**: het profiel wordt base64 in `?p=` gezet; de link opent direct het resultaat.
- **Toegankelijkheid**: toetsen A–D, focusbare knoppen, contrast conform de bestaande site.

## 8. Data en beheer

Nu: bestemmingen in code. Volgende stap (Supabase):

```
destinations(id, country, city, iata, types[], reason[], vibe[], season[], price, train, why, plan jsonb, image, active)
affiliate_clicks(id, created_at, destination_id, partner, profile jsonb, referrer)
quiz_sessions(id, created_at, profile jsonb, result_ids[], shared bool)
```

`affiliate_clicks` is essentieel: zonder eigen klikregistratie weet je niet welke bestemming/partner rendeert. Combineer met de partner-dashboards voor conversie en omzet.

## 9. SEO en content

De quiz alleen trekt geen verkeer. Nodig:

1. **Landingspagina per reistype** ("Feestvakantie 2026: 8 beste bestemmingen") met de quiz als CTA.
2. **Landing per land/stad** gegenereerd uit de bestemmingsdata, met bars/clubs uit de bestaande Supabase-tabellen als unieke content (dat heeft vrijwel geen concurrent).
3. **Gidsen**: "Uitgaan in Berlijn: clubs, deurbeleid, tijden", "Ibiza met €500".
4. Structured data (`TouristDestination`, `FAQPage`), snelle pagina's, hreflang NL/EN.

## 10. Roadmap

| Fase | Wat | Doel |
|---|---|---|
| 0 (nu) | `trips.html` lokaal, regelgebaseerd, links zonder ID | Concept toetsen bij 10–20 gebruikers |
| 1 | Affiliate-accounts, ID's invullen, klikregistratie in Supabase, live op nightfind.app | Eerste klikken en data |
| 2 | Bestemmingen naar Supabase, 40+ bestemmingen, landings per type/land | SEO-verkeer |
| 3 | Claude-laag: dag-tot-dag plan en chat-aanpassing; e-mail "bewaar je reis" | Conversie en retentie |
| 4 | Groepsfunctie (vrijgezellen: stemmen op opties), prijsalerts | Hogere orderwaarde |
| 5 | Directe deals met venues/clubs (tickets, guestlists) | Eigen marge naast affiliates |

## 11. Juridisch

- Affiliate-disclosure zichtbaar bij de links (staat er).
- Cookies: partners zetten cookies pas op hun eigen domein; NightFind zelf zet er geen extra. Als je klikregistratie of analytics toevoegt: cookiebanner bijwerken.
- Reisadvies is indicatief; prijzen zijn schattingen, geen aanbod. Staat in de disclaimer.
- Geen pakketreizen samenstellen die onder de Europese pakketreisrichtlijn vallen: NightFind verwijst door, boekt zelf niets.
