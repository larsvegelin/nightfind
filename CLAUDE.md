# NightFind — nightfind.app (website & affiliate-platform)

> Projectcontext voor Claude Code. Bevat huisstijl, datastructuur en de koers van de site.

## Context

- **Product:** NightFind — internationale nightlife- & uitgaansapp (iOS/Android) met website op nightfind.app.
- **Opdrachtgever/gebruiker:** Lars. Communiceert in het Nederlands, kort en direct; wil werkende output boven lange uitleg.
- **Stack website:** pure HTML/CSS/JS, geen framework. Data uit Supabase (`wwsxjoavjccajwrcrtfg`) via de anon key in de pagina's.
- **Koers:** de site verbreden van "app-landingspagina" naar een **uitgaans- en reisplatform** voor een breder publiek: landen → steden → restaurants, bars, clubs, activiteiten en hotels. Verdienmodel: **affiliate-deals** (Booking.com, Viator, TripAdvisor). Kernfeature: **AI-routebouwer** — onboarding stelt een paar vragen, de AI maakt een route (avond of dag), elke stop krijgt een affiliate-suggestie. Alles in de huidige stijl, makkelijk te navigeren, met een chatbot als begeleider.

## Huisstijl (bron: `assets/css/style.css`) — behouden

**Kleuren**
| Token | Hex | Rol |
|---|---|---|
| Zwart | `#000000` | achtergrond |
| Wit | `#ffffff` | tekst, koppen |
| Paars (primair) | `#7C3AED` | accenten, CTA, koppen in kaarten |
| Indigo | `#5B21B6` | verloop-partner van paars |
| Grijs donker | `#1a1a1a` | kaarten, footer |
| Grijs midden | `#333333` | inputs, chips |
| Grijs licht | `#666666` | secundaire tekst |

**Typografie:** Inter (Poppins als alternatief), system-ui fallback. Koppen 700, body 400, line-height 1.6.

**Componenten:** kaarten `#1a1a1a`, radius 16px, rand `rgba(124,58,237,.2)`, hover −5px met paarse gloed. Knoppen `.btn-primary` paars→indigo verloop, radius 16px. Filterchips `.filter-chip`. Gradient-tekst (paars→indigo) voor paginakoppen. Navbar fixed met blur.

**Vormtaal:** max-breedte 1100px, secties 3–4rem verticaal, radius 14–20px, veel witruimte, subtiele fade/scroll-reveal animaties.

## Bestanden

- `index.html` — home/hero, statistieken uit Supabase.
- `bars.html`, `clubs.html`, `events.html` — lijsten per stad (tabellen `venues_bars_<stad>`, `venues_clubs_<stad>`, `events_<stad>`; steden in `cities`, landen in `countries`).
- `plan.html` — **nieuw**: onboarding + AI-routebouwer + affiliate-suggesties + chatbot.
- `assets/js/nightfind-config.js` — affiliate-ID's, chat-endpoint, Supabase-config. Eén plek om aan te passen.
- `assets/js/affiliates.js` — bouwt Booking.com / Viator / TripAdvisor deeplinks met tracking-ID.
- `assets/js/route-builder.js` — onboarding-flow, routegeneratie (Supabase-data of fallback-dataset), rendering.
- `assets/js/chatbot.js` — zwevende chatwidget; praat met de Edge Function, met lokale fallback.
- `supabase/functions/chat/index.ts` — Edge Function die de chat naar Claude proxied (API-key blijft server-side).
- `help.html`, `contact.html`, `legal.html`, `privacy.html`, `terms.html`, `cookies.html` — statisch.

## Affiliates

| Partner | Programma | Link-vorm |
|---|---|---|
| Booking.com | Booking Affiliate Partner (aid) | `https://www.booking.com/searchresults.html?ss=<stad>&aid=<AID>` |
| Viator | Viator Partner (pid/mcid) | `https://www.viator.com/searchResults/all?text=<stad>&pid=<PID>&mcid=42383&medium=link` |
| TripAdvisor | TripAdvisor Affiliate via CJ/Awin | `https://www.tripadvisor.com/Search?q=<zoekterm>` met `m=<MARKER>` |

ID's staan in `nightfind-config.js`. Zolang ze leeg zijn werken de links gewoon zonder tracking.

## Werkafspraken

- Antwoorden in het Nederlands, kort en direct.
- Huisstijl exact aanhouden; nieuwe componenten via bestaande tokens (`var(--purple)` etc.), geen nieuwe kleuren.
- Geen frameworks of build-stap toevoegen; alles moet als statische site blijven werken.
- Geheimen (Claude API-key) nooit in de frontend; alleen in Supabase Edge Function secrets.
- Elke iteratie: eerst tonen, dan verfijnen op feedback.

## Vervolgstappen

1. Affiliate-accounts aanmaken en ID's invullen in `nightfind-config.js`.
2. Edge Function deployen: `supabase functions deploy chat` + `supabase secrets set ANTHROPIC_API_KEY=...`.
3. Restaurants/activiteiten/hotels als categorie toevoegen in Supabase (nu alleen bars/clubs/events).
4. Landen-/stedenpagina's (SEO) genereren uit `countries` en `cities`.
5. Routes opslaan/delen (Supabase-tabel `routes` + deelbare link).
