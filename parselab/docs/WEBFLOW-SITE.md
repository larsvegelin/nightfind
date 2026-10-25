# De website in Webflow — compleet draaiboek

Alles wat nodig is om de ParseLab-site in Webflow te bouwen en live te zetten: de pagina's, de
database erachter, de embeds, de teksten, de tests en wat er misgaat als het misgaat. Dit is het
enige bestand dat je nodig hebt; de andere docs zijn verdieping en staan onderaan bij *Verder lezen*.

Reken op een halve dag. Het bouwen zelf is een uur of twee; de rest is Supabase klaarzetten,
teksten kiezen en één keer goed doorklikken.

> **Twee producten, één naam.** In de app (`parselab/index.html`) heet alles ParseLab: één
> interface met drie bronnen. De Webflow-site verkoopt daar één onderdeel van als losse tool onder
> de naam **ParsePDF** — dezelfde code, andere verpakking, Supabase in plaats van de ParseLab-server.
> Die naam staat bewust nog in `parselab/webflow/`. Verander je dat, verander het dan overal in die
> map tegelijk en draai daarna `node parselab/tests/webflow.mjs`.

---

## Inhoud

1. [Wat je bouwt](#1-wat-je-bouwt)
2. [Voorbereiding](#2-voorbereiding)
3. [Supabase klaarzetten](#3-supabase-klaarzetten)
4. [Webflow-project: stijl en globale instellingen](#4-webflow-project-stijl-en-globale-instellingen)
5. [De pagina's, één voor één](#5-de-paginas-één-voor-één)
6. [De toolpagina: de embeds plaatsen](#6-de-toolpagina-de-embeds-plaatsen)
7. [Variant: één embed in plaats van drieëntwintig](#7-variant-één-embed-in-plaats-van-drieëntwintig)
8. [Teksten voor de site](#8-teksten-voor-de-site)
9. [Publiceren](#9-publiceren)
10. [Testen na plaatsen](#10-testen-na-plaatsen)
11. [Als er iets misgaat](#11-als-er-iets-misgaat)
12. [Onderhoud en wijzigen](#12-onderhoud-en-wijzigen)
13. [Veiligheid en privacy](#13-veiligheid-en-privacy)
14. [Wat het nog niet doet](#14-wat-het-nog-niet-doet)
15. [Verder lezen](#15-verder-lezen)

---

## 1. Wat je bouwt

Een site met een openbaar deel (uitleg, prijzen) en een afgeschermd deel (inloggen, dashboard, de
tool). De tool draait volledig in de browser van de bezoeker: er wordt geen document verstuurd.
Supabase doet drie dingen en niet meer — inloggen, welk pakket iemand heeft, en hoeveel pagina's
er deze maand zijn gelezen.

| Pagina | Slug | Openbaar? | Wat erop staat |
|---|---|---|---|
| Home | `/` | ja | Wat het is, voor wie, knop naar aanmelden |
| Prijzen | `/prijzen` | ja | Drie pakketten, pagina's per maand |
| Hulp | `/hulp/parsepdf` | ja | De uitleg uit `SITE-UITLEG-PARSEPDF.md` |
| Inloggen | `/inloggen` | ja | Magic link of wachtwoord via Supabase |
| Dashboard | `/dashboard` | nee | Kaarten per tool, verbruik van deze maand |
| De tool | `/tools/parsepdf-tool` | nee | De drieëntwintig embeds |

De twee paden die de embeds zelf kennen zijn `/inloggen` en `/dashboard`. Kies je andere slugs, pas
ze dan aan in `window.PARSELAB.loginPath` en `window.PARSELAB.dashboardPath` (zie §6.3). Alle andere
paden zijn vrij.

**Wat de bezoeker doet:** aanmelden → inloggen → dashboard → tool openen → veldregels instellen of
laten voorstellen → PDF's erin slepen → tabel eruit → CSV of Excel downloaden.

---

## 2. Voorbereiding

Wat je klaar moet hebben voordat je begint:

| Nodig | Waarom |
|---|---|
| Webflow-site met een betaald **Site plan** | Custom code in de `<head>` en per pagina werkt niet op een gratis staging-site |
| Supabase-project | Inloggen, pakketten, verbruiksteller |
| De map `parselab/webflow/` uit deze repo | De drieëntwintig embeds |
| Een eigen domein (of het `.webflow.io`-adres) | De magic link uit Supabase moet ergens terugkomen |
| Twee of drie echte PDF's | Om te testen met jouw soort documenten, niet met de mijne |

Je hebt **geen** server nodig. Uitlezen, tekstherkenning, Excel maken en CSV maken gebeuren in de
browser. Alleen de AI-knop (§6.6) vraagt een eigen endpoint, en die is optioneel.

---

## 3. Supabase klaarzetten

De embeds gebruiken precies vier dingen uit Supabase:

| Aanroep | Waarvoor |
|---|---|
| `auth.getSession()` | Is er iemand ingelogd? Zo nee → door naar `loginPath` |
| `from("profiles").select("locale").eq("id", …)` | Taal van de gebruiker (`nl`, `en`, `de`) |
| `rpc("usage_summary")` | Verbruik van deze maand: `used`, `monthly_limit`, `plan` |
| `rpc("record_usage", { p_tool, p_pages })` | Verbruik optellen; weigert zodra de limiet vol is |

`record_usage` wordt met twee waarden voor `p_tool` aangeroepen: `"parsepdf"` voor het uitlezen
(aantal pagina's) en `"parsepdf-ai"` voor één AI-voorstel (altijd 1).

### 3.1 Tabellen

Dit is het minimum. Draai het in de SQL-editor van Supabase. Heb je al een `profiles`-tabel, neem
dan alleen wat ontbreekt over.

```sql
-- Pakketten. De aantallen staan hier, niet in de code.
create table if not exists public.plans (
  id            text primary key,          -- 'gratis' | 'pro' | 'business'
  label         text not null,
  monthly_limit integer not null
);

insert into public.plans (id, label, monthly_limit) values
  ('gratis',   'Gratis',   50),
  ('pro',      'Pro',      2500),
  ('business', 'Business', 15000)
on conflict (id) do nothing;

-- Eén rij per gebruiker, gekoppeld aan auth.users.
create table if not exists public.profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  email   text,
  locale  text not null default 'nl',      -- 'nl' | 'en' | 'de'
  plan    text not null default 'gratis' references public.plans(id),
  created_at timestamptz not null default now()
);

-- Verbruik per gebruiker, per tool, per maand.
create table if not exists public.usage (
  id       bigserial primary key,
  user_id  uuid not null references auth.users(id) on delete cascade,
  tool     text not null,                  -- 'parsepdf' | 'parsepdf-ai'
  pages    integer not null,
  used_at  timestamptz not null default now()
);

create index if not exists usage_user_month on public.usage (user_id, used_at);
```

Nieuwe gebruikers krijgen automatisch een profiel:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 3.2 De twee functies

`usage_summary()` geeft één rij terug. De code leest `used`, `monthly_limit` en `plan`; een array met
één rij erin wordt ook geaccepteerd.

```sql
create or replace function public.usage_summary()
returns table (used integer, monthly_limit integer, plan text)
language sql security definer set search_path = public as $$
  select
    coalesce((
      select sum(u.pages)::integer from public.usage u
      where u.user_id = auth.uid()
        and u.tool = 'parsepdf'
        and u.used_at >= date_trunc('month', now())
    ), 0) as used,
    p.monthly_limit,
    pr.plan
  from public.profiles pr
  join public.plans p on p.id = pr.plan
  where pr.id = auth.uid();
$$;
```

`record_usage(p_tool, p_pages)` telt op en **weigert** zodra het niet meer past. De interface toetst
vooraf ook zelf, zodat niemand eerst staat te wachten om daarna te horen dat het niet mag.

```sql
create or replace function public.record_usage(p_tool text, p_pages integer)
returns table (used integer, monthly_limit integer)
language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
  v_used  integer;
begin
  if auth.uid() is null then
    raise exception 'niet ingelogd';
  end if;
  if p_pages is null or p_pages < 1 then
    raise exception 'ongeldig aantal';
  end if;

  select p.monthly_limit into v_limit
  from public.profiles pr join public.plans p on p.id = pr.plan
  where pr.id = auth.uid();

  select coalesce(sum(u.pages), 0)::integer into v_used
  from public.usage u
  where u.user_id = auth.uid()
    and u.tool = 'parsepdf'
    and u.used_at >= date_trunc('month', now());

  if p_tool = 'parsepdf' and v_used + p_pages > v_limit then
    raise exception 'limiet bereikt: % van % pagina''s', v_used, v_limit;
  end if;

  insert into public.usage (user_id, tool, pages)
  values (auth.uid(), p_tool, p_pages);

  return query select (v_used + case when p_tool = 'parsepdf' then p_pages else 0 end), v_limit;
end $$;
```

> **Bewust zo:** het tellen gebeurt *vóór* het uitlezen. Gaat het uitlezen daarna mis bij een bestand,
> dan zijn die pagina's wel geteld. Het alternatief is dat iemand door steeds af te breken gratis kan
> doorlezen.

### 3.3 Row level security

Dit is niet optioneel. De publishable key staat in de browser — dat hoort zo — maar zonder RLS is
het daarmee een sleutel tot alles.

```sql
alter table public.profiles enable row level security;
alter table public.usage    enable row level security;
alter table public.plans    enable row level security;

create policy "eigen profiel lezen"  on public.profiles for select using (auth.uid() = id);
create policy "eigen profiel wijzigen" on public.profiles for update using (auth.uid() = id);
create policy "eigen verbruik lezen" on public.usage    for select using (auth.uid() = user_id);
create policy "pakketten lezen"      on public.plans    for select using (true);
```

Er is met opzet **geen** insert-policy op `usage`: schrijven gaat alleen via `record_usage`, en die
draait als `security definer`. Zo kan niemand zijn eigen teller vervalsen.

### 3.4 Auth-instellingen

In Supabase → Authentication → URL Configuration:

- **Site URL**: je echte domein (`https://jouwdomein.nl`).
- **Redirect URLs**: voeg `https://jouwdomein.nl/dashboard` toe, en tijdens het bouwen ook
  `https://jouwsite.webflow.io/dashboard`. Zonder deze twee komt de magic link op een foutpagina uit.

Sleutels vind je onder Project Settings → API. Je hebt de **project URL** en de **publishable key**
nodig. De **service-role key** komt nooit in een embed, in Webflow, of waar dan ook in de browser.

### 3.5 Eén keer met de hand controleren

Draai dit in de SQL-editor terwijl je zelf bent ingelogd via de API, of test het vanaf de site nadat
je account bestaat:

```sql
select * from public.usage_summary();      -- moet used=0, monthly_limit=50, plan='gratis' geven
select * from public.record_usage('parsepdf', 3);
select * from public.usage_summary();      -- used moet nu 3 zijn
```

---

## 4. Webflow-project: stijl en globale instellingen

De embeds brengen hun eigen opmaak mee (alle `pld-` en `plp-` klassen zitten in embed 1). Je hoeft in
Webflow niets na te bouwen. Wat je wél gelijk wilt trekken is het lettertype en de kleuren van de
pagina eromheen, anders valt de tool uit de toon.

### 4.1 Lettertypen

Project settings → Fonts → Google Fonts (of via de `<head>`):

- **Poppins** — 400, 500, 600, 700. Interface, koppen, knoppen, lopende tekst.
- **JetBrains Mono** — 400. Getallen, bedragen, bestandsnamen, veldnamen.

Als code in de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

### 4.2 Kleuren

Zet deze als swatches in Webflow, met dezelfde namen:

| Naam | Hex | Waarvoor |
|---|---|---|
| Inkt | `#16293F` | Koppen en tekst op lichte vlakken |
| Navy | `#1F3A5F` | Primaire knop, donkere kaart, header |
| Navy diep | `#1A3253` | Paneel binnen een donkere kaart |
| Crème | `#F2F0E7` | Tekst en iconen op navy |
| Pagina | `#FBFAF6` | Achtergrond van de pagina |
| Kaart | `#FFFFFF` | Kaartoppervlak |
| Leisteen | `#4A5A6C` | Ondersteunende tekst, labels |
| Hairline | `#E6E3D8` | Randen en scheidingslijnen |
| Veldrand | `#8A90A5` | Rand van invoervelden |
| Blauw | `#2C6FA8` | Voortgang, actieve staat, links |
| Blauw donker | `#215A88` | Blauwe tekst op blauwe tint |
| Blauw tint | `#DCE8F2` | Informatiemelding, actieve rij |
| Goud | `#C9A961` | Focusring, waarschuwingsrand |
| Zand tint | `#EDE7D5` | Waarschuwingsmelding |
| Rood-bruin | `#8A3B2E` | Onomkeerbare actie |

Twee vuistregels uit `DASHBOARD-styleguide.md`: gebruik op wit nooit lichter dan `#4A5A6C`, en
blauwe tekst op `#DCE8F2` is `#215A88`, niet `#2C6FA8` — die laatste haalt het contrast net niet.

### 4.3 De vier klassen die de embeds verwachten

De embeds gaan ervan uit dat ze in deze schil staan. Maak ze één keer aan als Webflow-klassen:

| Klasse | Wat het is |
|---|---|
| `pl-page` | Buitenste wrapper, achtergrond `#FBFAF6` |
| `pl-dark` | Donkere strook bovenaan (`#1F3A5F`), waar de header in staat |
| `pl-light` | Lichte strook eronder |
| `pl-container` | Max. 1200px breed, gecentreerd, 24px zijruimte |
| `pl-section` | Verticale ruimte, 64px boven |
| `pl-section-pb` | Zelfde, plus 64px onder |

### 4.4 Globale custom code

Project settings → Custom code → **Head code**, op elke pagina:

```html
<style>
  :root { --pl-navy:#1F3A5F; --pl-ink:#16293F; --pl-cream:#F2F0E7; --pl-page:#FBFAF6; }
  body { background:#FBFAF6; color:#16293F; font-family:Poppins,-apple-system,"Segoe UI",system-ui,sans-serif; }
  .pl-container { max-width:1200px; margin:0 auto; padding:0 24px; }
  .pl-section { padding-top:64px; }
  .pl-section-pb { padding-bottom:64px; }
  .pl-dark { background:#1F3A5F; color:#F2F0E7; }
  .pl-light { background:#FBFAF6; }
</style>
```

Zet hier **niets** van Supabase neer. De Supabase-client hoort bij de pagina's die hem gebruiken
(inloggen, dashboard, tool), niet op de marketingpagina's.

---

## 5. De pagina's, één voor één

### 5.1 Home (`/`)

Gewone Webflow-pagina, geen code nodig. Wat erop hoort:

- Kop, ondertitel en de drie zinnen uit §8.
- Eén duidelijke knop: *Gratis beginnen* → `/inloggen`.
- Drie blokjes: wat het doet, wat het niet doet, en dat je documenten je computer niet verlaten.
- Link naar `/prijzen` en `/hulp/parsepdf`.

De andere tools (website uitlezen, formulieren invullen, dashboard) zet je op "Binnenkort". Eén tool
die het doet is meer waard dan vier die half af zijn.

### 5.2 Prijzen (`/prijzen`)

Drie kaarten met de aantallen uit §8. Twee dingen die je erbij moet zetten, anders krijg je er
e-mail over:

- Er worden **pagina's** geteld, geen documenten. Een factuur van drie kantjes is drie pagina's.
- De teller loopt per kalendermaand en begint op de eerste opnieuw.

Toon je een upgradeknop, vul dan `window.PARSELAB.prices` op de toolpagina met de bedragen (§6.3);
die verschijnen in de kaart die de gebruiker ziet als het pakket iets niet toelaat.

### 5.3 Hulp (`/hulp/parsepdf`)

Neem `docs/SITE-UITLEG-PARSEPDF.md` letterlijk over als pagina-inhoud: documenten kiezen, het
doorkijkscherm, mappen met sjablonen, opschonen, regeltabellen, de AI-knop en wat er misgaat als het
misgaat. Link ernaar vanaf de toolpagina, in de header of onder de uploadzone.

### 5.4 Inloggen (`/inloggen`)

Openbaar. De embeds sturen iedereen zonder sessie hierheen. Eén Embed-blok is genoeg:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<div id="pl-login" class="pld-card" style="max-width:420px;margin:0 auto"></div>
<script>
(function(){
  var SB = window.supabase.createClient(
    "https://wgmwpwviqhcsyvfrwual.supabase.co",
    "sb_publishable_3NaKuKqUgGfvF2q772MwIw_hfHdklwo",
    { auth:{ flowType:"pkce", detectSessionInUrl:true, persistSession:true, autoRefreshToken:true } });

  var root = document.getElementById("pl-login");

  SB.auth.getSession().then(function(r){
    if (r.data.session) { window.location.replace("/dashboard"); return; }
    root.innerHTML =
      '<h1 class="pld-title">Inloggen</h1>' +
      '<p class="pld-text">Vul je e-mailadres in. Je krijgt een link waarmee je meteen binnen bent; ' +
      'een wachtwoord heb je niet nodig.</p>' +
      '<label class="pld-lbl" for="pl-mail">E-mailadres</label>' +
      '<input class="pld-in" id="pl-mail" type="email" autocomplete="email" inputmode="email">' +
      '<button class="pld-btn" id="pl-go" type="button">Stuur de link</button>' +
      '<p class="pld-text" id="pl-zeg" role="status"></p>';

    var knop = document.getElementById("pl-go"), zeg = document.getElementById("pl-zeg");
    knop.onclick = function(){
      var mail = document.getElementById("pl-mail").value.trim();
      if (!mail) { zeg.textContent = "Vul eerst je e-mailadres in."; return; }
      knop.disabled = true; knop.textContent = "Bezig…";
      SB.auth.signInWithOtp({ email: mail, options:{ emailRedirectTo: location.origin + "/dashboard" } })
        .then(function(res){
          knop.disabled = false; knop.textContent = "Stuur de link";
          zeg.textContent = res.error
            ? "Dat lukte niet: " + res.error.message
            : "Gelukt. Kijk in je mail — de link is een uur geldig.";
        });
    };
  });
})();
</script>
```

Vervang de URL en de key door die van jouw project. `emailRedirectTo` moet exact bij de Redirect URLs
in Supabase staan (§3.4).

### 5.5 Dashboard (`/dashboard`)

Waar de gebruiker na inloggen landt. Eén kaart per tool plus het verbruik van deze maand:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<div id="pl-dash"></div>
<script>
(function(){
  var SB = window.supabase.createClient("https://wgmwpwviqhcsyvfrwual.supabase.co",
    "sb_publishable_3NaKuKqUgGfvF2q772MwIw_hfHdklwo",
    { auth:{ flowType:"pkce", detectSessionInUrl:true, persistSession:true, autoRefreshToken:true } });
  var root = document.getElementById("pl-dash");

  SB.auth.getSession().then(function(r){
    if (!r.data.session) { window.location.replace("/inloggen"); return; }
    return SB.rpc("usage_summary").then(function(res){
      var u = res.data; if (Array.isArray(u)) u = u[0];
      var used = (u && u.used) || 0, max = (u && u.monthly_limit) || 0;
      var pct = max ? Math.min(100, Math.round(used / max * 100)) : 0;
      root.innerHTML =
        '<div class="pld-grid">' +
          '<div class="pld-card pld-card--navy">' +
            '<p class="pld-caps">Deze maand</p>' +
            '<p class="pld-num">' + used + ' / ' + max + '</p>' +
            '<div class="pld-bar' + (pct > 80 ? ' pld-bar--hot' : '') + '"><span style="width:' + pct + '%"></span></div>' +
            '<p class="pld-text">pagina\'s gelezen</p>' +
          '</div>' +
          '<div class="pld-card">' +
            '<p class="pld-caps">PDF</p><p class="pld-num">ParsePDF</p>' +
            '<p class="pld-text">Velden uit je PDF\'s naar een tabel.</p>' +
            '<a class="pld-btn" href="/tools/parsepdf-tool">Openen</a>' +
          '</div>' +
          '<div class="pld-card"><p class="pld-caps">Website</p><p class="pld-num">Uitlezen</p>' +
            '<p class="pld-text">Een lijst of tabel van een externe pagina.</p>' +
            '<span class="pld-pill">Binnenkort</span></div>' +
        '</div>' +
        '<div class="pld-row" style="margin-top:32px">' +
          '<button class="pld-btn pld-btn--ghost pld-btn--sm" id="pl-uit" type="button">Uitloggen</button></div>';
      document.getElementById("pl-uit").onclick = function(){
        SB.auth.signOut().then(function(){ window.location.replace("/inloggen"); });
      };
    });
  });
})();
</script>
```

De `pld-`klassen komen hier pas mee als embed 1 op de pagina staat. Wil je het dashboard los houden,
plak dan het `<style>`-blok uit `webflow/1-config-stijl.html` ook op deze pagina, of laat de kaarten
in Webflow zelf opmaken.

> **Let op de bestaande site.** Staat er al een dashboard met een kaart voor deze tool op
> "Binnenkort", haal die pill er dan af en maak er een knop van naar `/tools/parsepdf-tool`. Dat zit
> in de dashboard-embed van Webflow, niet in deze repo.

---

## 6. De toolpagina: de embeds plaatsen

### 6.1 De pagina aanmaken

1. Webflow Designer → **Pages** → **+**. Naam: `ParsePDF tool`, slug: `parsepdf-tool`.
   Wil je hem onder het dashboard hangen, maak dan eerst een folder `tools` en kies die als parent;
   het pad wordt dan `/tools/parsepdf-tool`.
2. Page settings → SEO → **Exclude from search results** aan. Dit is een pagina achter de login en
   hoort niet in Google.
3. Titel: `ParsePDF — ParseLab`. Beschrijving mag leeg.

### 6.2 De opbouw

Neem header en footer over van `/dashboard`, zodat de navigatie gelijk blijft.

```
Body
└── Div  · klasse: pl-page
    ├── Div · klasse: pl-dark            → de header van /dashboard
    └── Div · klasse: pl-light
        └── Div · klasse: pl-container
            └── Div · klasse: pl-section pl-section-pb
                ├── Div · id: pl-parsepdf-root      ← leeg laten!
                ├── Embed  1-config-stijl
                ├── Embed  2-teksten
                ├── Embed  3-teksten-voorstel
                ├── Embed  3b-teksten-labels
                ├── Embed  3c-teksten-auto
                ├── Embed  4-motor
                ├── Embed  4b-ocr
                ├── Embed  4c-pdfmaken
                ├── Embed  5-scherm
                ├── Embed  5b-eisen
                ├── Embed  5c-resultaat
                ├── Embed  5d-opties
                ├── Embed  5e-excel
                ├── Embed  6-structuur
                ├── Embed  7-velden
                ├── Embed  8-voorstel
                ├── Embed  9-labels
                ├── Embed  9b-uitleg
                ├── Embed  10-ai
                ├── Embed  11-sjablonen
                ├── Embed  11b-groepen
                ├── Embed  11c-auto
                └── Embed  12-verwerken
```

Drie dingen die echt moeten:

- **De id `pl-parsepdf-root` exact zo geschreven**, op een lege div. Zonder die container doet de
  tool niets en staat er een melding in de console.
- **De volgorde ligt vast.** Embed 12 start de boel op en gebruikt wat 1 tot en met 11 klaarzetten.
  Letters horen direct na hun nummer: 3b en 3c na 3, 4b en 4c na 4, 5b tot en met 5e na 5, 9b na 9,
  11b en 11c na 11.
- **Alles ná de container.** De embeds staan eronder, niet erboven en niet erin.

Per embed: sleep een **Embed**-element (Add → Components → Embed), open het, en plak de complete
inhoud van het bestand — inclusief het HTML-commentaar bovenaan, dat helpt je later terugvinden waar
je bent.

### 6.3 Instellingen in embed 1

Bovenin `1-config-stijl.html` staat het enige wat je aanpast:

```js
window.PARSELAB = {
  supabaseUrl:  "https://…supabase.co",   // jouw project-URL
  supabaseKey:  "sb_publishable_…",       // de publishable key, nooit de service-role key
  dashboardPath:"/dashboard",             // waar "terug" naartoe gaat
  loginPath:    "/inloggen",              // waar iemand zonder sessie heen gaat
  aiEndpoint:   "/api/parsepdf/velden",   // optioneel, zie 6.6
  prices: { pro: "", business: "" }       // bv. "€ 19 p/m"; leeg = geen bedrag tonen
};
```

Verder niets. Alle teksten, kleuren en gedrag zitten in de andere embeds.

### 6.4 De embedlimiet van 10.000 tekens

Webflow accepteert ongeveer 10.000 tekens per Embed-blok. Alle bestanden blijven daaronder:

| Bestand | Tekens | | Bestand | Tekens |
|---|---:|---|---|---:|
| `1-config-stijl.html` | 7.952 | | `5e-excel.html` | 4.980 |
| `2-teksten.html` | 6.518 | | `6-structuur.html` | 6.198 |
| `3-teksten-voorstel.html` | 9.447 | | `7-velden.html` | 9.281 |
| `3b-teksten-labels.html` | 7.550 | | `8-voorstel.html` | 9.958 |
| `3c-teksten-auto.html` | 8.017 | | `9-labels.html` | 8.375 |
| `4-motor.html` | 8.541 | | `9b-uitleg.html` | 6.986 |
| `4b-ocr.html` | 3.662 | | `10-ai.html` | 4.401 |
| `4c-pdfmaken.html` | 4.195 | | `11-sjablonen.html` | 9.039 |
| `5-scherm.html` | 9.198 | | `11b-groepen.html` | 5.441 |
| `5b-eisen.html` | 6.388 | | `11c-auto.html` | 3.308 |
| `5c-resultaat.html` | 2.019 | | `12-verwerken.html` | 8.063 |
| `5d-opties.html` | 7.233 | | | |

`8-voorstel.html` zit met 9.958 tekens tegen de grens aan. Voeg je daar iets toe, splits hem dan in
`8-voorstel.html` en `8b-…html` en plaats het nieuwe deel er direct achter. Wordt het gedoe: neem
dan variant §7 en je hebt er nooit meer last van.

### 6.5 Wat er van buiten wordt opgehaald

De embeds laden drie dingen van een CDN. Het zijn de enige externe verzoeken die de tool doet.

| Wat | Waarvandaan | Wanneer |
|---|---|---|
| Supabase JS v2 | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | Altijd, uit embed 1 |
| pdf.js 3.11.174 (+ worker) | `cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/` | Bij het eerste document |
| tesseract.js 5.1.1 | `cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/` | Alleen bij tekstherkenning |

Er gaat geen document naar buiten. Wil je ook deze drie zelf hosten (strikte CSP, of een klant die
geen CDN wil), zet de bestanden dan op je eigen adres en pas `LIB` en `WORKER` in `4-motor.html` en
de bron in `4b-ocr.html` aan.

### 6.6 De AI-knop (optioneel)

Naast zelf veldregels intikken kan de gebruiker op **Kijk wat erin staat** klikken: de tool opent het
document, arceert wat hij kan uitlezen en stelt namen voor. Dat werkt volledig in de browser, zonder
server.

Daarnaast is er **Uitlezen met AI**. Die vraagt eerst toestemming en stuurt dan de tekst van dát ene
document naar `window.PARSELAB.aiEndpoint` (standaard `POST /api/parsepdf/velden`), met het
toegangsbewijs van de ingelogde gebruiker in de header zodat jouw server het pakket kan controleren.
Elk gebruik telt als `record_usage('parsepdf-ai', 1)`.

Wie de knop krijgt, beslist `usage_summary()`: bij `plan` gelijk aan `gratis` of `free`, of bij een
veld `ai_allowed` dat `false` is, verschijnt in plaats daarvan een pakketkaart. Geeft je functie geen
van beide velden terug, dan staat de knop voor iedereen aan — wil je dat niet, geef dan `plan` mee
(zoals in de functie in §3.2) of voeg `ai_allowed boolean` toe.

Heb je geen endpoint, laat `aiEndpoint` dan staan: het verzoek faalt stil en de tool valt terug op de
structuurcheck. Alles blijft werken. Wil je hem wel aanzetten, bouw dan een functie (Supabase Edge
Function of je eigen server) die een `{ tekst }` ontvangt en `{ velden: [...] }` teruggeeft. De
API-sleutel van het AI-model staat daar, op de server — nooit in een embed.

---

## 7. Variant: één embed in plaats van drieëntwintig

Drieëntwintig blokken plakken is eenmalig werk, maar bij elke wijziging opnieuw. Het alternatief is
één blok dat een gebouwd script ophaalt:

```
node parselab/webflow/bouw-bundel.mjs
```

Dat levert twee bestanden in `parselab/dist/`:

- `parsepdf.js` — alle embeds achter elkaar, inclusief de stijl (die voegt het script zelf toe).
- `embed-loader.html` — het enige blok dat je in Webflow plakt.

Publiceer `parsepdf.js` op een vast adres. GitHub Pages doet dat al via `.github/workflows/pages.yml`,
op `https://larsvegelin.github.io/nightfind/parselab/dist/parsepdf.js`; dat adres staat ook in de
loader. Zet je het ergens anders neer, pas dan de `src` in `embed-loader.html` aan.

In Webflow houd je dan over: de lege `<div id="pl-parsepdf-root"></div>` en daaronder één Embed met
de inhoud van `embed-loader.html`. De instellingen (`window.PARSELAB`) staan in die loader, niet in
de bundel — zo verander je de Supabase-gegevens zonder opnieuw te bouwen.

| | Drieëntwintig embeds | Eén loader |
|---|---|---|
| Plaatsen | 23 blokken, volgorde telt | 1 blok |
| Wijziging doorvoeren | opnieuw plakken in Webflow | script opnieuw publiceren, pagina blijft |
| 10.000-tekenlimiet | speelt mee | speelt niet |
| Afhankelijk van | Webflow | Webflow + de host van het script |
| Werkt zonder publiceren van de repo | ja | nee |

**Derde weg, zonder Webflow:** `node parselab/webflow/bouw-pagina.mjs` maakt
`parselab/ParsePDF.html` — dezelfde tool als één los bestand, met dezelfde Supabase erachter. Op elke
webhost te zetten (Netlify, GitHub Pages, je eigen server). Handig als tussenstap. Kies uiteindelijk
één adres; twee adressen voor dezelfde tool geeft alleen verwarring.

> Wil je hem laten zien aan iemand zonder account, gebruik dan `parselab/tools/parsepdf.html`. Die
> versie kent geen login en geen limiet, werkt met een dubbelklik en heeft pdf.js ingebakken. Prima
> voor een demo, niet voor de site.

---

## 8. Teksten voor de site

**Kop:** ParsePDF

**Ondertitel:** Haal velden uit je PDF's met regels die je één keer instelt. Alles gebeurt in je eigen
browser; er wordt geen document verstuurd.

**Voor de landingspagina, in drie zinnen:**

> Facturen, bankafschriften, polissen: allemaal dezelfde velden op net een andere plek. Stel één keer
> in wat je wilt hebben, sleep de stapel erin en download een tabel die Excel meteen goed opent. Je
> documenten blijven op je eigen computer.

**Bij de pakketten:**

| Pakket | Pagina's per maand | Voor wie |
|---|---|---|
| Gratis | 50 | Uitproberen met een eigen stapel |
| Pro | 2.500 | Eén persoon die er dagelijks mee werkt |
| Business | 15.000 | Een team of een maandelijkse verwerking |

Tel pagina's, geen documenten, en zeg dat erbij. Een factuur van drie kantjes is drie pagina's.

**Bij de privacyvraag die zeker komt:**

> Het uitlezen gebeurt in je browser met een open-source PDF-motor. Het document gaat niet naar onze
> server en wordt niet bewaard. Wat wij bijhouden is hoeveel pagina's je hebt gelezen, om je pakket
> te kunnen tellen.

**Wees eerlijk over wat het niet doet** — op de pagina, niet in de kleine lettertjes. Het scheelt
teleurgestelde eerste gebruikers. Zie §14.

**Talen.** De embeds bevatten alle teksten in Nederlands, Engels en Duits. Welke taal iemand ziet
komt uit `profiles.locale`; staat daar iets anders dan `nl`, `en` of `de`, dan wordt het Nederlands.
De Webflow-pagina's eromheen vertalen is aparte Webflow-localisatie en staat hier los van.

---

## 9. Publiceren

1. Zet de database klaar volgens §3 en test `record_usage` één keer met de hand.
2. Maak de pagina's van §5 en plaats de embeds van §6 (of de loader van §7).
3. Controleer dat `window.PARSELAB` in embed 1 jouw Supabase-gegevens heeft en dat er nergens een
   service-role key staat. Zoek in de pagina op `service_role` — dat moet nul treffers geven.
4. Controleer dat `/tools/parsepdf-tool` op noindex staat.
5. Publiceer naar de staging (`.webflow.io`) en loop §10 af.
6. Voeg het echte domein toe aan de Redirect URLs in Supabase.
7. Publiceer naar het echte domein en loop §10 daar nog één keer af.
8. Zet op `/dashboard` de kaart van de tool om van "Binnenkort" naar een werkende knop.

---

## 10. Testen na plaatsen

Doe dit in deze volgorde; elke stap controleert iets anders.

1. **Uitgelogd.** Open de toolpagina in een incognitovenster zonder ingelogd te zijn. Je hoort meteen
   op `/inloggen` uit te komen.
2. **Inloggen.** Vraag een magic link aan, klik hem in je mail. Je landt op `/dashboard`.
3. **Verbruik.** Open de tool. Bovenaan staat je verbruik van deze maand, met een balkje.
4. **Uitlezen.** Kies het sjabloon Facturen, sleep twee PDF's erin en lees ze uit. Je ziet de teller
   oplopen en daarna de tabel.
5. **Teller.** Ververs de pagina. Het verbruik is omhoog met het aantal pagina's.
6. **CSV.** Download en open in Excel. De kolommen staan meteen goed (puntkomma's en een UTF-8 BOM).
7. **Excel.** Download de `.xlsx` en controleer dat bedragen als getal binnenkomen, niet als tekst.
8. **Telefoon.** De regelvelden staan onder elkaar, de tabel schuift binnen zijn eigen kader.
9. **Limiet.** Zet je verbruik in de database vlak onder de limiet en probeer een grote batch. Je
   hoort de kaart te zien met hoeveel pagina's je nog over hebt, zónder dat er iets wordt gelezen.
10. **Geen tekstlaag.** Gooi er een gescand document in. Je hoort per bestand de melding te krijgen
    dat er geen tekstlaag is, met het aanbod om tekstherkenning te proberen.

Stap 1 tot en met 9 zijn precies wat `node parselab/tests/webflow.mjs` geautomatiseerd doet, met een
namaak-Supabase: 117 controles over doorsturen naar inloggen, de verbruiksmeter, sjablonen, twee
facturen uitlezen, labels die `Totaal` niet met `Subtotaal` verwarren, opschonen tot bedrag en datum,
regex met haakjesgroep, een bestand zonder tekstlaag, CSV met puntkomma's en BOM, regels bewaren,
limietbewaking, taalkeuze, het smalle scherm, het doorkijkscherm met voorstel en AI-toestemming,
mappen met sjablonen die per document herkend worden, en de losse pagina uit `bouw-pagina.mjs`.

Draai die test na elke wijziging aan de embeds; dan hoef je dit lijstje alleen bij de echte lancering
met de hand af.

**Zelf uitproberen zonder Webflow:**

```
node parselab/tests/webflow-proef.mjs             # bouwt parselab/tests/proef/
cd parselab/tests/proef && python3 -m http.server 8123
```

Open `http://localhost:8123/`. De proefpagina zet drie dingen om en laat de embeds verder woord voor
woord staan: Supabase komt uit een namaakbestand, pdf.js uit de kopie die al in `tools/parsepdf.html`
zit, en de twee paden wijzen naar twee proefpagina's. Met de adresregel stuur je de namaak-Supabase:
`?ingelogd=0` (geen sessie), `?gebruikt=49&limiet=50` (bijna vol), `?taal=en`, `?weigeren=1`
(`record_usage` geeft een fout).

Proefdocumenten staan in `parselab/tests/pdfs/`, met de verwachte uitkomsten in
`tests/pdfs/README.md`: onder andere een factuur waarbij de waarde op de regel ónder het label staat,
een met "Subtotaal" boven "Totaal", een van zes pagina's voor de limiet, en één zonder tekstlaag.

---

## 11. Als er iets misgaat

| Wat je ziet | Waar het aan ligt | Wat je doet |
|---|---|---|
| Lege pagina, console zegt dat onderdelen ontbreken | Een embed staat in de verkeerde volgorde of ontbreekt | Loop de lijst in §6.2 na; let op de letters |
| Lege pagina, geen melding | De div `pl-parsepdf-root` ontbreekt of is verkeerd geschreven | Exact `pl-parsepdf-root`, op een lege div, vóór de embeds |
| Meteen terug naar `/inloggen` terwijl je ingelogd bent | `loginPath`/`dashboardPath` kloppen niet, of de sessie staat op een ander domein | Controleer §6.3 en de Redirect URLs in §3.4 |
| Magic link komt op een foutpagina uit | Redirect URL niet toegestaan in Supabase | Voeg `https://…/dashboard` toe bij Authentication → URL Configuration |
| "De PDF-motor kon niet worden geladen" | cdnjs onbereikbaar, of een adblocker blokkeert het | Test zonder blocker; of host pdf.js zelf (§6.5) |
| Alle cellen leeg | De regels zoeken labels die niet in dít document staan | Zet tijdelijk een regel op *Patroon* met `.+` om te zien of er überhaupt tekst uit komt |
| Kolommen in Excel op één hoop | Excel staat op een andere lijstscheiding | Het bestand gebruikt puntkomma's; gebruik anders de `.xlsx`-knop |
| Verbruik loopt niet op | `record_usage` gaf een fout | Kijk in de Supabase-logs bij Database; meestal RLS of een ontbrekend profiel |
| "Limiet bereikt" terwijl je net begint | Geen rij in `profiles`, dus geen pakket | Controleer de trigger uit §3.1 en maak de rij met de hand aan |
| Alles werkt in de Designer, niets op de live site | Custom code publiceert niet op een gratis Site plan | Site plan nodig (§2) |
| Stijl valt weg, blokken staan los | Embed 1 ontbreekt of staat niet als eerste | Embed 1 draagt alle `pld-` en `plp-` stijlen |

---

## 12. Onderhoud en wijzigen

De code volgt `DASHBOARD-styleguide.md`. Houd je daaraan als je iets toevoegt.

| Wat je wilt | Waar |
|---|---|
| Nieuw type veldregel | `pasToe` in `3-teksten-voorstel.html` en de keuzelijst in `4-motor.html` |
| Nieuw opschoonfilter | `schoon`, in dezelfde embed |
| Tekst aanpassen | `2-teksten.html` (en de andere tekst-embeds) — in alle drie de talen |
| Kleur of maat aanpassen | `1-config-stijl.html`, en dan ook in `DASHBOARD-styleguide.md` |
| Sjabloon toevoegen | `11-sjablonen.html` |
| Een embed wordt te groot | Splits hem; nieuw deel direct achter het origineel (§6.4) |

Na elke wijziging:

```
node parselab/tests/webflow.mjs        # 117 controles
node parselab/webflow/bouw-bundel.mjs  # als je variant §7 gebruikt
node parselab/webflow/bouw-pagina.mjs  # als je ParsePDF.html publiceert
```

Vergeet de laatste twee niet: anders lopen de embeds, het gebundelde script en de losse pagina uit
elkaar en debug je een verschil dat er niet is.

Wat de gebruiker bewaart, staat in `localStorage` van díe browser — niet in de database, dus niet op
een tweede computer en niet te delen met een collega:

| Sleutel | Wat |
|---|---|
| `pl_parsepdf_regels` | De veldregels |
| `pl_parsepdf_mappen` | Mappen met sjablonen |
| `pl_parsepdf_opties` | Keuzes zoals opschonen en uitvoerformaat |

Wil je die aan het account koppelen, dan is er een tabel voor nodig; het datamodel ligt klaar in
`PARSEPDF-VOLGENDE-VERSIE.md`.

---

## 13. Veiligheid en privacy

- **De publishable key hoort in de browser.** Daar is hij voor. De **service-role key** komt nergens
  in Webflow, in een embed, of in een repo die je publiceert.
- **Row level security staat aan op elke tabel** (§3.3). Zonder RLS is die publishable key alsnog een
  sleutel tot alles.
- **Schrijven naar `usage` kan alleen via `record_usage`.** Er is geen insert-policy, dus niemand kan
  zijn eigen teller vervalsen.
- **Documenten verlaten de computer niet.** Uitlezen, tekstherkenning, Excel en CSV gebeuren in de
  browser. Alleen de optionele AI-knop stuurt de *tekst* van één document naar jouw endpoint, en pas
  nadat de gebruiker daar expliciet toestemming voor geeft.
- **AI-sleutels staan op de server**, achter `aiEndpoint`, nooit in een embed.
- **De toolpagina staat op noindex.** Hij hoort niet in Google.
- **Wat je bijhoudt is een aantal**, geen inhoud: wie, welke tool, hoeveel pagina's, wanneer. Zeg dat
  ook zo op de site.

---

## 14. Wat het nog niet doet

Zet dit op de pagina, niet in de kleine lettertjes.

- **Gescande documenten zonder tekstlaag.** Er is tekstherkenning als aanbod, maar die is trager en
  minder precies dan een echte tekstlaag. De tool meldt het per bestand.
- **Eén rij per document.** Regeltabellen uit een factuur uitlezen vraagt een ander model, met
  kolomdetectie per pagina.
- **Regels staan per browser.** Ze reizen niet mee naar een andere computer en zijn niet te delen.
- **PDF's met een wachtwoord** geven een leesfout.
- **De andere tools** (website uitlezen, formulieren invullen, dashboard) staan op "Binnenkort".
  Website uitlezen vraagt een draaiende server met een browser erin — zie
  `SCRAPEN-VANUIT-DASHBOARD.md`.

---

## 15. Verder lezen

| Bestand | Waarover |
|---|---|
| [`INTEGRATIE.md`](INTEGRATIE.md) | De embeds plaatsen, korter dan dit stuk |
| [`LANCERING.md`](LANCERING.md) | De lanceervolgorde en wat je na twee weken wilt weten |
| [`SITE-UITLEG-PARSEPDF.md`](SITE-UITLEG-PARSEPDF.md) | Kant-en-klare hulppagina voor bezoekers |
| [`PARSEPDF-DOORKIJKEN.md`](PARSEPDF-DOORKIJKEN.md) | Hoe het doorkijkscherm en de herkenning werken |
| [`PARSEPDF-VOLGENDE-VERSIE.md`](PARSEPDF-VOLGENDE-VERSIE.md) | Wat er nog komt, met datamodel |
| [`DASHBOARD-styleguide.md`](DASHBOARD-styleguide.md) | Kleuren, letters, componenten |
| [`SCRAPEN-VANUIT-DASHBOARD.md`](SCRAPEN-VANUIT-DASHBOARD.md) | Server neerzetten voor website uitlezen |
| [`../webflow/README.md`](../webflow/README.md) | De embeds zelf, bestand voor bestand |
| [`../README.md`](../README.md) | ParseLab als geheel: één tool, drie bronnen, vier formaten |
