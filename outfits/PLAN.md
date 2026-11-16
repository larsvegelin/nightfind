# shopdelook: businessplan & productplan

> Werkdocument. Eerst het plan, daarna bouwen we de app.
> Cijfers met een **(schatting)** zijn aannames die we moeten meten en bijstellen.

---

## Inhoud

1. [Samenvatting](#1-samenvatting)
2. [Doelgroep](#2-doelgroep)
3. [Probleem & propositie](#3-probleem--propositie)
4. [Product: gratis vs. premium](#4-product-gratis-vs-premium)
5. [Verdienmodel & prijzen](#5-verdienmodel--prijzen)
6. [Funnel & KPI's](#6-funnel--kpis)
7. [Financieel model](#7-financieel-model)
8. [Contentstrategie TikTok & Instagram](#8-contentstrategie-tiktok--instagram)
9. [Affiliate partners](#9-affiliate-partners)
10. [Techniek & architectuur](#10-techniek--architectuur)
11. [Paywall-ontwerp](#11-paywall-ontwerp)
12. [Juridisch & compliance](#12-juridisch--compliance)
13. [Roadmap](#13-roadmap)
14. [Kosten](#14-kosten)
15. [Risico's](#15-risicos)
16. [Open beslissingen](#16-open-beslissingen)

---

## 1. Samenvatting

**Wat:** een merk dat op TikTok en Instagram business casual outfits laat zien met fashionable merken.
Elke video verwijst naar een outfitpagina (gratis, met affiliate links). Daarachter zit een betaalde
**persoonlijke stylist** (premium abonnement) die outfits samenstelt op basis van jouw kledingkast,
budget, stijl en agenda.

**Twee inkomstenbronnen:**

| Bron | Wie betaalt | Wanneer |
|---|---|---|
| Affiliate commissie | Webshop (Zalando, About You, Bol, …) | Als een bezoeker iets koopt via onze link |
| Premium abonnement | Gebruiker | €5 per week, €10 per maand of €30 per jaar |

**Waarom dit model:** gratis outfitpagina's houden de drempel laag en verdienen al geld via affiliate.
Premium verkoopt iets wat je niet gratis via Google Lens of de comments vindt: *persoonlijk* advies.
Een harde paywall op gewone outfitlinks werkt niet, want die info is overal gratis te vinden.

**Doel jaar 1 (schatting):** 2.000 betalende abonnees en €50.000 omzet (affiliate + abonnementen).

---

## 2. Doelgroep

### 2.1 Leeftijd: aangepast ten opzichte van 10–45

De wens was 10–45 jaar. Voor het **betaalde** deel passen we dat aan:

| Groep | Wat ze krijgen | Waarom |
|---|---|---|
| **< 13 jaar** | Niets. Niet op richten. | TikTok en Instagram zijn officieel 13+. Business casual past niet bij deze groep. |
| **13–17 jaar** | Alleen de gratis content en outfitpagina's | Minderjarigen kunnen in NL niet zelfstandig een abonnement afsluiten. Voor dataverwerking onder 16 is toestemming van ouders nodig (AVG/UAVG). Een paywall op deze groep geeft terugboekingen, klachten en reputatieschade. |
| **18–24 jaar** | Gratis + premium. **Kerndoelgroep.** | Studenten, stagiairs en starters: eerste baan, eerste "wat trek ik aan naar kantoor?". Zitten op TikTok, kopen online. |
| **25–35 jaar** | Gratis + premium. **Kerndoelgroep, hoogste koopkracht.** | Young professionals met hybride werk. Hebben budget voor merken en een abonnement. |
| **36–45 jaar** | Gratis + premium. Secundair. | Meer op Instagram dan TikTok. Kopen minder vaak, maar duurder. |

**Conclusie:** content maken we voor **18–35**, met 36–45 als bonus. Premium is **18+**
(leeftijdscheck bij aanmelden; via de App Store regelt Apple/Google de betaling met ouderlijk toezicht).

### 2.2 Persona's

**Sanne (22), hbo-student met stage bij een bureau**
- Budget: €50–100 per maand aan kleding
- Merken: Zara, COS, Mango, & Other Stories, Arket
- Probleem: "Ik moet er professioneel uitzien maar wil niet saai of oud overkomen."
- Wil: 5 outfits per week uit wat ze al heeft plus 1–2 slimme aankopen

**Daan (28), accountmanager, hybride werk**
- Budget: €100–200 per maand
- Merken: Scotch & Soda, Tommy Hilfiger, Suitsupply, Ralph Lauren, Filling Pieces
- Probleem: "Smart casual: wat betekent dat precies? Kan ik sneakers dragen?"
- Wil: vaste "uniform"-combinaties, capsule wardrobe, minder nadenken

**Fatima (34), teamlead in de zorgadministratie**
- Budget: €75–150 per maand
- Merken: Massimo Dutti, Mango, Claudia Sträter, Vanilia
- Probleem: weinig tijd, wil er verzorgd uitzien, ook met hoofddoek en bedekte outfits
- Wil: outfits per gelegenheid (presentatie, sollicitatie, borrel)

### 2.3 Stijlfocus: business casual met merken

- **Werk:** kantoor, hybride, stage, sollicitatie
- **Smart casual:** borrel, date, diner, bruiloft als gast
- **Merken in drie prijsniveaus per outfit:**
  - *Premium:* Ralph Lauren, Hugo Boss, Arket, COS, Massimo Dutti
  - *Mid:* Mango, Zara, Scotch & Soda, Tommy Hilfiger
  - *Budget-dupe:* H&M, Primark, Shein, C&A

Dit drie-niveausysteem is ons herkenningspunt: **"De look, voor elk budget."**

---

## 3. Probleem & propositie

**Probleem:**
1. "Business casual" is vaag. Mensen weten niet wat wel en niet kan.
2. Ze zien een outfit op TikTok, maar vinden de items niet of ze zijn te duur.
3. Ze hebben een volle kast maar "niks om aan te trekken".

**Propositie:**

> **Altijd goed gekleed voor werk, zonder nadenken en binnen je budget.**

- Gratis: elke look uit de video, met links in drie prijsniveaus.
- Premium: je eigen stylist die outfits maakt uit *jouw* kast en alleen aanvult wat ontbreekt.

---

## 4. Product: gratis vs. premium

### 4.1 Gratis (geen account nodig)

| Functie | Status |
|---|---|
| Outfitpagina per video, met itemlijst en affiliate links | **Gebouwd** (`outfit.html`) |
| Budget-alternatief per item | **Gebouwd** |
| Overzichtspagina met alle outfits (link-in-bio) | To do |
| Filter op gelegenheid (kantoor, borrel, sollicitatie), budget en stijl | To do |
| "Business casual gids": wat kan wel en niet | To do (ook goede SEO) |

### 4.2 Premium (account + abonnement)

| Functie | Wat het doet | Prioriteit |
|---|---|---|
| **Digitale kledingkast** | Foto's van je kleding uploaden; AI herkent type, kleur en stijl | MVP |
| **AI-stylist** | "Wat trek ik morgen aan naar mijn presentatie?" → outfit uit je eigen kast | MVP |
| **Weekplanner** | 5 werkoutfits voor de komende week, zonder herhaling | MVP |
| **Gat-analyse** | "Met deze 3 items maak je 15 nieuwe outfits", met links (ook affiliate) | MVP |
| Capsule wardrobe-plan | 20–30 basisitems voor jouw werk, budget en stijl | V2 |
| Prijsalerts | Melding als een item uit je wenslijst in de sale gaat | V2 |
| Lichaamsvorm & kleuradvies | Kleurtype-analyse en pasvormadvies | V2 |
| Weer-integratie | Outfit past zich aan het weer aan | V2 |

**Slim:** de gat-analyse in premium levert óók affiliate-omzet op. Betalende gebruikers kopen gericht en vaker.

---

## 5. Verdienmodel & prijzen

### 5.1 Abonnementen

| Plan | Prijs (incl. btw) | Per jaar | Rol |
|---|---|---|---|
| Wekelijks | €4,99 | €259 | Laagste instap, impulsaankoop |
| Maandelijks | €9,99 | €120 | Middenweg |
| **Jaarlijks** | **€29,99** | €30 | **Hoofdplan.** Op de paywall tonen als "€0,58 per week, bespaar 88%" |

**Advies:** test later ook een jaarprijs van €39,99. Het verschil met maandelijks blijft groot, en de
opbrengst per klant stijgt met ~30%. Optioneel: 3 dagen gratis proberen, alleen bij het jaarplan.

### 5.2 Opbrengst per betalende klant (schatting)

| Plan | Hoe lang betaalt men? | Bruto | Netto (−21% btw, −15% App Store) |
|---|---|---|---|
| Wekelijks | 4–6 weken | €20–30 | €14–21 |
| Maandelijks | ~3 maanden | ~€30 | ~€21 |
| Jaarlijks | 27% verlengt na een jaar | ~€38 | ~€27 |
| **Gemengd** (60% jaar / 25% week / 15% maand) | | **~€30** | **~€20–25** |

Via de **website met Stripe** (in plaats van de App Store) is de betaalkost ~3% in plaats van 15%.
Daarom starten we web-first.

### 5.3 Affiliate

| Aanname (schatting) | Waarde |
|---|---|
| Commissie fashion | 5–12% (Zalando, About You ~8%, Bol 2–5%) |
| Gemiddelde bestelling | €60–90 |
| Opbrengst per bestelling | €4–8 |
| Bezoekers die bestellen | 2–5% |

---

## 6. Funnel & KPI's

```
Views (TikTok/Instagram)
   │  0,2–1% klikt op link in bio / story
   ▼
Bezoek outfitpagina  ──────────────► affiliate klik (30–50%) ─► bestelling (2–5%)
   │  10–30% klikt op "Maak mijn outfits"
   ▼
Account aangemaakt (gratis kast + 3 AI-outfits)
   │  8–12% betaalt (paywall na de gratis proef-outfits)
   ▼
Betalende abonnee
```

### KPI's die we wekelijks meten

| KPI | Doel maand 3 | Doel maand 12 |
|---|---|---|
| Views per maand | 1 mln | 10 mln |
| Doorklik views → site | 0,3% | 0,7% |
| Affiliate klik per bezoeker | 30% | 45% |
| Bezoeker → account | 10% | 20% |
| Account → betaald | 6% | 10% |
| Aandeel jaarplan | 50% | 60% |
| Maandelijkse opzeggingen (maandplan) | < 30% | < 20% |
| Netto omzet per 1.000 views | €2 | €6 |

Tracking: `trackClick()` in `js/outfit.js` koppelen aan Supabase (eigen tabel) en Plausible
(privacyvriendelijk, geen cookiebanner nodig). Per video een eigen `?id=` en `utm_source`.

---

## 7. Financieel model

Per maand, in maand 12, bij drie scenario's (schatting):

| | Voorzichtig | Basis | Optimistisch |
|---|---|---|---|
| Views per maand | 2 mln | 5 mln | 15 mln |
| Doorklik | 0,3% | 0,5% | 0,8% |
| Bezoekers | 6.000 | 25.000 | 120.000 |
| Affiliate bestellingen (3% van bezoekers) | 180 | 750 | 3.600 |
| **Affiliate omzet** (€5 per bestelling) | **€900** | **€3.750** | **€18.000** |
| Accounts (15%) | 900 | 3.750 | 18.000 |
| Nieuwe betalers (8%) | 72 | 300 | 1.440 |
| **Abonnementsomzet** (× €22 netto) | **€1.580** | **€6.600** | **€31.700** |
| **Totaal per maand** | **~€2.500** | **~€10.350** | **~€49.700** |
| Kosten (zie §14) | ~€300 | ~€800 | ~€3.000 |

**Break-even:** al vanaf het voorzichtige scenario, zolang er **geen betaalde advertenties** zijn.
Met €20–25 per klant zijn advertenties lastig terug te verdienen. Groei moet organisch.

---

## 8. Contentstrategie TikTok & Instagram

### 8.1 Formats

| Format | Voorbeeld-hook | Doel |
|---|---|---|
| **3 budgetten** | "Dezelfde kantoorlook voor €80, €250 en €600" | Ons signatuurformat, deelbaar |
| **Wel/niet** | "Business casual: dit kan WEL en dit NIET" | Bereik, discussie in de comments |
| **Week outfits** | "5 werkdagen, 12 items, 0 stress" | Promoot premium (weekplanner) |
| **Dupe** | "€300 Ralph Lauren look vs. €60 dupe" | Affiliate kliks |
| **Gelegenheid** | "Wat trek je aan naar je eerste werkdag?" | Hoge koopintentie |
| **Kast-makeover** | Volger stuurt foto's van haar kast in, wij stylen | Demo van de AI-stylist |
| **Merkcheck** | "Is COS het geld waard?" | Zoekverkeer, autoriteit |

### 8.2 Ritme

- TikTok: 1–2 video's per dag (7–14 per week)
- Instagram Reels: dezelfde video's, plus 3–5 stories per dag **met linksticker** (direct klikbaar)
- Pinterest: elke outfit als pin. Langlopend verkeer met een hoge koopintentie.
- YouTube Shorts: hergebruik, gratis extra bereik

### 8.3 Link-strategie

- TikTok: klikbare bio-link pas vanaf **1.000 volgers** (zakelijk account). Tot die tijd: Instagram-stories + "link in bio op Insta".
- Elke video: "Zoek **look 042** op shopdelook.nl". Korte, onthoudbare code die direct naar `?id=` gaat.
- Comment-automatisering op Instagram (keyword "LINK" → DM met link).
- Altijd **#ad / #affiliate** waar van toepassing (zie §12).

---

## 9. Affiliate partners

| Netwerk | Shops (o.a.) | Opmerking |
|---|---|---|
| **Awin** | Zalando, About You, ASOS, Mango, Tommy Hilfiger | Belangrijkste voor fashion |
| **Daisycon** | NL-shops, Wehkamp, diverse merken | NL-focus |
| **TradeTracker** | Diverse NL/BE fashion shops | |
| **Bol Partnerprogramma** | Bol | Lagere commissie, hoge conversie |
| **Amazon Associates (.nl)** | Amazon | Lage commissie, breed aanbod |
| **Direct / LTK** | Merken die zelf met creators werken | Later, als we bereik hebben |

> Welke merken bij welk netwerk zitten verschilt per land en verandert regelmatig. Controleer dat bij aanmelden.

**Werkwijze:**
1. Aanmelden bij Awin + Daisycon zodra de site live staat (ze willen een echte site zien).
2. Per item de deeplink-generator van het netwerk gebruiken. Link in `data/outfits.js` zetten (later in de database).
3. Elke maand de best converterende shops evalueren en daar de content op richten.

---

## 10. Techniek & architectuur

### 10.1 Principes

- **Web-first.** Geen 15–30% App Store-commissie, sneller live, makkelijker A/B-testen. Een app komt pas als het product werkt.
- **Hergebruik wat er al is:** statische HTML/CSS/JS + Supabase (de repo gebruikt het al).
- **Mobiel eerst.** 95%+ van het verkeer komt van TikTok/Instagram op een telefoon.

### 10.2 Stack

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Frontend | Fase 1: statische HTML. Fase 2: Next.js of SvelteKit | Nu simpel; later routing, SEO en accounts |
| Hosting | Vercel of Netlify | Gratis tier, snelle CDN, preview per branch |
| Database + auth | **Supabase** (Postgres, Auth, Storage) | Al in gebruik; RLS voor privacy |
| Betalingen web | **Stripe Checkout + Billing** | Abonnementen, iDEAL, Apple Pay, klantportaal om op te zeggen |
| Betalingen app (later) | **RevenueCat** | Eén laag over App Store, Play Store en Stripe |
| AI-stylist | **Claude API** (Anthropic), met beeldherkenning | Kledingfoto's analyseren + outfits redeneren |
| Analytics | Plausible + eigen events in Supabase | Privacyvriendelijk |
| App (fase 4) | Capacitor (web-app inpakken) of React Native | Hergebruik van de webcode |

### 10.3 Datamodel (eerste versie)

```
outfits        (id, slug, title, description, image, occasion, style, tiktok_url, published_at)
items          (id, outfit_id, category, name, brand, shop, price, image, affiliate_url, tier: premium|mid|budget)
clicks         (id, outfit_id, item_id, tier, utm_source, created_at)          -- anoniem
profiles       (user_id, birth_year, budget, style, sizes, work_type)          -- 18+ check
wardrobe_items (id, user_id, photo, category, color, brand, tags[])           -- privé (RLS)
generated_looks(id, user_id, occasion, items[], created_at, feedback)
subscriptions  (user_id, plan, status, provider: stripe|apple|google, renews_at)
```

### 10.4 Mappenstructuur (doel)

```
outfits/
├── PLAN.md                ← dit document
├── outfit.html            ← gebouwd
├── index.html             ← overzicht / link-in-bio
├── gids/                  ← SEO: "business casual gids"
├── app/                   ← premium web-app (login, kast, stylist)
├── css/ js/ data/ images/
└── supabase/              ← migraties, edge functions (Stripe webhooks, AI-calls)
```

---

## 11. Paywall-ontwerp

**Moment:** pas *na* de eerste waarde. Gebruiker uploadt 5+ items en krijgt **3 gratis AI-outfits**.
Daarna verschijnt de paywall. Dit is een "harde paywall na proefwaarde": converteert beter
dan freemium, zonder dat mensen betalen voor iets wat ze nog niet kennen.

**Inhoud van het paywallscherm:**
1. Kop: "Elke werkdag goed gekleed, uit je eigen kast"
2. 3–4 voordelen met icoontjes (weekplanner, AI-stylist, gat-analyse, prijsalerts)
3. Plannen, met jaar vooraf geselecteerd:
   - **Jaar €29,99**, "€0,58/week · Meest gekozen · Bespaar 88%"
   - Maand €9,99
   - Week €4,99
4. Duidelijk onder de knop: "Wordt automatisch verlengd. Altijd opzegbaar in je account."
5. Social proof: aantal gebruikers en reviews (alleen echte!)
6. Sluitknop goed zichtbaar

**Niet doen:** verborgen sluitknop, nep-afteltimers, nep-reviews, opzeggen moeilijk maken.
Dat is verboden (§12) en levert terugboekingen en 1-sterreviews op.

---

## 12. Juridisch & compliance

| Onderwerp | Wat moet | Actie |
|---|---|---|
| **Bedrijf** | Inschrijving KvK (eenmanszaak of bv), btw-nummer | Voor de eerste omzet |
| **Btw** | 21% op digitale diensten aan NL-consumenten; OSS-regeling voor EU-klanten | Stripe Tax aanzetten |
| **Affiliate-disclosure** | Reclamecode Social Media & Influencer Marketing (RSM) + ACM-richtlijnen: elke betaalde of affiliate post zichtbaar markeren | `#ad` / "affiliate links" in video én beschrijving; disclaimer op de site (al gebouwd) |
| **Minderjarigen** | Onder 16 toestemming ouders voor data (UAVG); minderjarigen niet gericht reclame/abonnementen aanbieden | Premium 18+, leeftijdsvraag bij aanmelden, geen advertenties op < 18 |
| **AVG/GDPR** | Privacyverklaring, verwerkersovereenkomsten (Supabase, Stripe, Anthropic), dataminimalisatie, recht op verwijdering | Kledingfoto's privé, account + data verwijderbaar |
| **Cookies** | Toestemming nodig voor tracking cookies | Plausible gebruiken (geen toestemming nodig); affiliate cookies zitten bij de shop na de klik |
| **Abonnementen (EU)** | Duidelijke totaalprijs, verlengingsinfo vóór betalen, 14 dagen herroepingsrecht (vervalt bij directe levering, maar alleen met expliciete toestemming), **opzegknop online** | Stripe klantportaal; checkbox "direct starten, herroepingsrecht vervalt" |
| **Voorwaarden** | Algemene voorwaarden + privacyverklaring | Opstellen vóór de premium-lancering |
| **App Stores** | Digitale content in de app via in-app aankoop | Pas relevant in fase 4 |

---

## 13. Roadmap

### Fase 0: fundament (week 1–2)
- [x] Outfitpagina met affiliate links (`outfit.html`)
- [x] Plan (dit document)
- [ ] Naam + domein kiezen, TikTok/Instagram-accounts aanmaken
- [ ] KvK + zakelijke rekening
- [ ] Overzichtspagina `index.html` (link-in-bio)
- [ ] Site live op Vercel/Netlify met eigen domein

### Fase 1: content & affiliate (week 2–8)
- [ ] Aanmelden Awin, Daisycon, Bol Partner
- [ ] Outfits van `data/outfits.js` naar Supabase + simpele beheerpagina
- [ ] Kliktracking naar Supabase + Plausible
- [ ] 60+ video's posten, 3 formats testen
- [ ] "Business casual gids" voor SEO
- **Doel:** 1 mln views per maand, eerste affiliate-omzet, gemeten doorklik

### Fase 2: premium MVP (week 8–16)
- [ ] Wachtlijst + "Maak mijn outfits"-knop op elke outfitpagina (interesse meten)
- [ ] Accounts (Supabase Auth: e-mail, Google, Apple)
- [ ] Digitale kledingkast met fotoherkenning (Claude API)
- [ ] AI-stylist + weekplanner
- [ ] Stripe-abonnementen + klantportaal
- [ ] Paywall na 3 gratis outfits
- **Doel:** 100 betalende klanten, conversie account → betaald ≥ 5%

### Fase 3: optimaliseren (maand 4–9)
- [ ] A/B-tests: jaarprijs €29,99 vs €39,99, met of zonder proefperiode
- [ ] Gat-analyse + prijsalerts
- [ ] E-mailflows (welkom, inactief, voor verlenging)
- [ ] Doorverwijsprogramma ("1 maand gratis per vriend")
- **Doel:** 1.000 betalers, ≥ €5 netto per 1.000 views

### Fase 4: app (maand 9+)
- [ ] Web-app inpakken met Capacitor of herbouwen in React Native
- [ ] RevenueCat voor App Store, Play Store en Stripe samen
- [ ] Pushmeldingen ("Je outfit voor morgen staat klaar")
- **Doel:** 2.000+ betalers

---

## 14. Kosten

Per maand (schatting):

| Post | Start | Bij ~1.000 betalers |
|---|---|---|
| Domein | €1 | €1 |
| Hosting (Vercel/Netlify) | €0 | €20 |
| Supabase | €0 | €25 |
| Claude API (AI-stylist) | €0 | €150–400 (≈ €0,10–0,40 per actieve gebruiker) |
| Stripe | 1,5–3% van de omzet | ~€300 |
| Plausible | €9 | €19 |
| Kleding voor content | €100–300 | €300 (deels retour of via merken) |
| Boekhouding/KvK | €20 | €50 |
| **Totaal** | **~€150–350** | **~€900–1.150** |

---

## 15. Risico's

| Risico | Kans | Impact | Maatregel |
|---|---|---|---|
| Views leveren weinig kliks op (virale views buiten de doelgroep) | Hoog | Hoog | Meten per video; formats met hoge koopintentie (gelegenheid, dupes) |
| Mensen willen niet betalen voor styling | Middel | Hoog | Eerst wachtlijst + 3 gratis outfits; pas bouwen als ≥ 5% van de bezoekers interesse toont |
| Hoge opzeggingen bij het weekplan | Hoog | Middel | Jaarplan als standaard; waarde elke week (planner, pushes) |
| TikTok/Instagram-algoritme of accountban | Middel | Hoog | Meerdere platforms, e-maillijst opbouwen, Pinterest + SEO |
| Affiliate-commissies dalen of shops stoppen | Middel | Middel | Meerdere netwerken, abonnement als hoofdinkomen |
| AI geeft slechte of rare outfits | Middel | Middel | Regels + feedbackknop; eerste 100 outfits handmatig checken |
| Juridische fout (disclosure, minderjarigen, abonnementen) | Laag | Hoog | §12 afvinken vóór lancering |
| Kopieerbaar concept | Hoog | Middel | Merk, community en eigen data als voorsprong; snel zijn |

---

## 16. Open beslissingen

| # | Beslissing | Opties | Advies |
|---|---|---|---|
| 1 | Merknaam + domein | shopdelook, werklook, officefit, … | Kort, .nl + .com vrij, ook beschikbaar als TikTok-handle |
| 2 | Gezicht van het merk | Eigen persoon / faceless (alleen kleding) / meerdere creators | Eigen gezicht converteert beter; faceless schaalt makkelijker |
| 3 | Mannen, vrouwen of beide | | Begin met één (meer focus), voeg de ander toe in fase 3 |
| 4 | Jaarprijs | €29,99 / €39,99 | Start €29,99, test €39,99 in fase 3 |
| 5 | Proefperiode | Geen / 3 dagen / 7 dagen | 3 gratis AI-outfits in plaats van een tijdgebonden proef |
| 6 | Frontend fase 2 | Statisch houden / Next.js / SvelteKit | Next.js (grootste ecosysteem, goed op Vercel) |

---

### Volgende stap

Na akkoord op dit plan bouwen we, in deze volgorde:
1. `index.html`: overzicht van alle outfits (link-in-bio)
2. Outfits + kliks in Supabase
3. Wachtlijst-knop "Maak mijn outfits" om premium-interesse te meten
4. Premium MVP (accounts, kast, AI-stylist, Stripe)
