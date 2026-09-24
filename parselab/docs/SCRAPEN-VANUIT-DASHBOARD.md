# Websites uitlezen vanuit het dashboard: zo werkt het wél

Je zag in het dashboard *Er ging iets mis (405)* zodra je een website wilde uitlezen. Dit document legt uit waarom dat gebeurde, hoe ParseLab in elkaar zit, en beschrijft stap voor stap elke manier om het werkend te krijgen: op je eigen computer, met een server bij Railway, Render of Fly.io, met Docker op een eigen server, en met de extensie. Achterin staan de controles, een foutentabel en de grenzen van de server.

Kort: **het dashboard is een statische website, het uitlezen gebeurt op een server.** Op GitHub Pages staat alleen de website. Je zet de server ergens neer (tien minuten), vult in het dashboard onder *Account → Serveradres* het adres in, en vanaf dat moment werkt Website uitlezen vanuit het dashboard, ook op `https://larsvegelin.github.io/nightfind/`.

---

## 1. Wat er gebeurde: de 405 uitgelegd

ParseLab bestaat uit twee delen:

| Deel | Wat het is | Waar het draait |
|---|---|---|
| **De website** (dashboard, ParsePDF, ParseBoard, docs) | gewone HTML-bestanden; alles gebeurt in je browser | overal: GitHub Pages, Webflow, een los bestand, of de ParseLab-server zelf |
| **De ParseLab-server** (`server/server.js`) | een Node.js-programma met een echte browser (Chromium) erin. Die haalt de webpagina op, laat jou aanwijzen wat je wilt, leest de lijst uit, bladert door de pagina's en maakt er Excel of CSV van | op je computer, of op een server bij Railway, Render, Fly.io of een eigen machine |

Documenten uitlezen (ParsePDF) en overzichten maken (ParseBoard) gebeuren helemaal in de browser. Daar is geen server voor nodig. **Websites uitlezen kan niet in de browser**: een browser mag geen andere websites ophalen namens jou (dat blokkeert elke browser, het heet *same-origin policy*), en een webshop met tien pagina's netjes doorbladeren met pauzes vraagt een programma dat blijft draaien. Daarom doet de server dat.

Toen je op GitHub Pages op *Ophalen* klikte, stuurde ParseScraper een verzoek naar `https://larsvegelin.github.io/nightfind/api/scrape/snapshot`. GitHub Pages is een statische host: die kan bestanden teruggeven, maar kan geen programma draaien. Een `POST`-verzoek naar een statische host levert *405 Method Not Allowed* op (soms *404 Not Found*). Dat is de 405 die je zag. Er was dus niets kapot; er stond alleen geen server op dat adres.

Het dashboard wist tot nu toe niet dat de server ergens anders kon staan: het probeerde altijd hetzelfde adres als de website zelf. Dat is nu anders.

### Wat er veranderd is

1. **Instelbaar serveradres.** Onder *Account → Serveradres* vul je het adres van jouw server in. Het dashboard geeft dat door aan ParseScraper, ParsePDF (AI-knoppen) en ParseBoard (AI-knop). Het adres blijft bewaard in de browser en gaat mee met je instellingen naar de server (`/api/store/settings`), zodat je het op een andere computer terugziet.
2. **`?api=` in de adresbalk.** Open je het dashboard met `https://larsvegelin.github.io/nightfind/?api=https://jouw-server` dan wordt dat adres meteen gebruikt en bewaard. Handig om een collega een link te sturen.
3. **De server staat verzoeken van andere websites toe (CORS).** Een browser laat een website alleen met een server op een ander adres praten als die server dat expliciet toestaat. De ParseLab-server doet dat nu; met `PARSELAB_ALLOW_ORIGIN` beperk je het tot jouw dashboard.
4. **Duidelijke meldingen.** Op een statische host probeert het dashboard niet meer stilletjes een server die er niet is. Het zegt *Deze website heeft geen ParseLab-server* met een knop *Serveradres instellen*. Krijgt de tool toch een 404 of 405 terug, dan zegt hij nu op welk adres hij het probeerde en wat je moet doen, in plaats van *Er ging iets mis (405)*.

---

## 2. Hoe het samen werkt

```
   jouw browser                                    ergens op internet (of op je pc)
 ┌──────────────────────────────┐                ┌────────────────────────────────┐
 │ dashboard (GitHub Pages)     │  https + CORS  │ ParseLab-server                 │
 │   ParseScraper ──────────────┼────────────────┼──▶ /api/scrape/snapshot         │
 │   ParsePDF  (AI-knoppen) ────┼────────────────┼──▶ /api/parsepdf/…              │
 │   ParseBoard (AI-knop) ──────┼────────────────┼──▶ /api/board/panelen           │
 │                              │                │   Chromium haalt de webpagina   │
 │ Account → Serveradres        │                │   robots.txt, 2 s per website   │
 │   https://jouw-server        │                │   Excel / CSV terug             │
 └──────────────────────────────┘                └────────────────────────────────┘
```

Drie dingen moeten kloppen, en meer niet:

1. **Er draait ergens een ParseLab-server** die vanaf internet (of vanaf jouw computer) bereikbaar is.
2. **Het dashboard kent het adres** (Account → Serveradres, of `?api=`).
3. **De server staat het dashboard toe** (standaard staat hij alles toe; met `PARSELAB_ALLOW_ORIGIN` maak je het strikter).

Alles wat je in ParseScraper doet (adres invullen, aanwijzen, uitlezen, taken plannen, downloaden) gaat vanaf dan naar die server. ParsePDF en ParseBoard blijven in de browser werken; alleen hun AI-knoppen gebruiken de server, en alleen als daar een AI-sleutel op staat.

---

## 3. Route A: de server op je eigen computer

De snelste weg, en genoeg voor één persoon. Je hebt Node.js nodig (https://nodejs.org, kies de LTS-versie).

### A1. Alles lokaal (dashboard én server op je computer)

1. Download of clone de repo en open de map `parselab`.
2. Dubbelklik op `start.bat` (Windows) of `start.sh` (Mac/Linux). De eerste keer installeert dat Playwright met Chromium (een paar honderd MB, eenmalig).
3. Open `http://localhost:8080`. Het dashboard en de server staan nu op hetzelfde adres; je hoeft niets in te stellen.

Met de hand is het hetzelfde:

```
cd parselab
npm install
node server/server.js
```

### A2. Dashboard op GitHub Pages, server op je computer

Wil je het dashboard op `https://larsvegelin.github.io/nightfind/` gebruiken en alleen het uitlezen thuis laten draaien? Dat kan in Chrome, Edge en een recente Firefox: die staan toe dat een https-pagina met `http://localhost` praat.

1. Start de server zoals bij A1.
2. Open het dashboard op GitHub Pages, ga naar *Account → Serveradres* en vul in: `http://localhost:8080`. Klik *Bewaren*. Je ziet *Verbonden: de server antwoordt.*
3. Ga naar ParseScraper. De hint is weg; *Ophalen* werkt.

Sluit je de terminal, dan stopt de server en zie je in het dashboard weer *De ParseLab-server op http://localhost:8080 antwoordt niet*. Start hem opnieuw en klik *Opnieuw proberen*.

Dit werkt alleen op de computer waar de server draait. Voor collega's, of om taken op een vast tijdstip te laten lopen als je laptop dicht is, ga je naar route B.

---

## 4. Route B: een server op internet

De repo staat klaar voor Railway, Render en Fly.io (allemaal via de `Dockerfile` in `parselab/`) en voor elke machine waar Docker op draait. Alle drie geven je een https-adres, en dat heb je nodig: GitHub Pages is https, en een https-pagina mag niet met een http-server praten (behalve localhost). Reken op een paar euro per maand; de server heeft Chromium aan boord en wil minstens 1 GB geheugen.

### B1. Railway (aanbevolen: minste stappen)

1. Ga naar https://railway.app en log in met GitHub.
2. *New Project → Deploy from GitHub repo* → kies `larsvegelin/nightfind`.
3. Open de service, ga naar *Settings*:
   - **Root Directory**: `parselab`
   - **Builder**: Dockerfile (Railway vindt `parselab/Dockerfile` en `railway.json` zelf)
4. *Variables*: zet deze omgevingsvariabelen (zie hoofdstuk 6 voor de betekenis):
   - `PARSELAB_API_TOKEN` = een lang wachtwoord dat je zelf verzint (bijvoorbeeld 32 tekens uit een wachtwoordmanager)
   - `PARSELAB_ALLOW_ORIGIN` = `https://larsvegelin.github.io`
   - `PARSELAB_PORT` = `8080`
5. *Volumes → New Volume*, mount path `/app/server/data`. Zonder volume zijn je taken en runs weg bij elke nieuwe versie.
6. *Settings → Networking → Generate Domain*. Je krijgt een adres als `https://parselab-production-1a2b.up.railway.app`.
7. Wacht tot de deploy groen is. Controleer in je browser: `https://…up.railway.app/api/scrape/status` geeft JSON terug (met token: een 401 met een nette melding; dat is goed, de server leeft).
8. Dashboard: *Account → Serveradres* → het Railway-adres → *Bewaren*. Ga naar ParseScraper; bij de eerste aanroep vraagt de tool één keer om de toegangscode (je `PARSELAB_API_TOKEN`).

Elke push naar de branch die Railway volgt rolt automatisch uit. Kies bij *Settings → Source* de branch `main` (of de branch waar je aan werkt).

### B2. Render

1. https://render.com → *New → Web Service* → koppel de repo.
2. Render leest `parselab/render.yaml` als je *Blueprint* kiest; anders vul je in: **Root Directory** `parselab`, **Runtime** Docker, **Health Check Path** `/api/scrape/status`.
3. *Disks*: naam `parselab-data`, mount path `/app/server/data`, 1 GB.
4. *Environment*: `PARSELAB_API_TOKEN`, `PARSELAB_ALLOW_ORIGIN=https://larsvegelin.github.io`, `PARSELAB_PORT=8080`.
5. Deploy. Je adres wordt `https://parselab-xxxx.onrender.com`. Let op: op het gratis plan slaapt de service na een kwartier stilte en duurt de eerste aanroep daarna een halve minuut; geplande taken lopen dan niet. Neem het kleinste betaalde plan als je plant.
6. Serveradres in het dashboard invullen zoals bij B1 stap 8.

### B3. Fly.io

```
cd parselab
fly launch --no-deploy          # kies een naam en regio, geen database
fly volumes create parselab_data --size 1
```

Zet in het aangemaakte `fly.toml`:

```
[env]
  PARSELAB_PORT = "8080"
  PARSELAB_ALLOW_ORIGIN = "https://larsvegelin.github.io"

[[mounts]]
  source = "parselab_data"
  destination = "/app/server/data"

[http_service]
  internal_port = 8080
  force_https = true
```

Dan:

```
fly secrets set PARSELAB_API_TOKEN=jouw-lange-wachtwoord
fly deploy
```

Je adres is `https://<naam>.fly.dev`.

### B4. Docker op een eigen server (VPS, NAS, kantoorserver)

Op een machine met Docker:

```
git clone https://github.com/larsvegelin/nightfind.git
cd nightfind/parselab
docker build -t parselab .
docker run -d --name parselab --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -v parselab-data:/app/server/data \
  -e PARSELAB_API_TOKEN=jouw-lange-wachtwoord \
  -e PARSELAB_ALLOW_ORIGIN=https://larsvegelin.github.io \
  parselab
```

Dit luistert alleen op de machine zelf. Voor https en een adres zet je er een reverse proxy voor. Met Caddy is dat één bestand (`/etc/caddy/Caddyfile`):

```
parselab.jouwdomein.nl {
    reverse_proxy 127.0.0.1:8080
}
```

Caddy regelt het certificaat zelf. Zet een DNS-record `parselab.jouwdomein.nl` naar de server, herstart Caddy, en gebruik `https://parselab.jouwdomein.nl` als serveradres. Met nginx werkt het net zo; gebruik dan certbot voor het certificaat.

Bijwerken naar een nieuwe versie:

```
cd nightfind && git pull
cd parselab && docker build -t parselab . && docker rm -f parselab && (het docker run-commando van hierboven)
```

### B5. De server zonder Docker op een eigen machine

Kan ook, als Node.js 18+ en de systeembibliotheken van Chromium er staan:

```
cd parselab
npm install
npx playwright install-deps chromium     # eenmalig, vraagt root (Linux)
PARSELAB_API_TOKEN=… PARSELAB_ALLOW_ORIGIN=https://larsvegelin.github.io node server/server.js
```

Laat hem draaien met `pm2` of een systemd-service, en zet er dezelfde reverse proxy voor als bij B4.

---

## 5. Het serveradres instellen

Er zijn drie manieren; de laatste die je gebruikt wint.

### 5.1 Account → Serveradres

1. Klik rechtsboven op je naam → *Account*.
2. Vul bij *Serveradres* het adres in, met of zonder `https://` (zonder schema vult het dashboard `https://` aan). Geen pad erachter, dus `https://parselab.jouwdomein.nl`, niet `…/api/scrape`.
3. *Bewaren*. Het dashboard probeert de server meteen en zegt *Verbonden: de server antwoordt* of *Geen antwoord van …*.
4. Laat je het veld leeg, dan gaan de aanroepen weer naar hetzelfde adres als het dashboard (goed als je op `http://localhost:8080` werkt).

Het adres staat in de browser (`localStorage`, sleutel `parselab-api-base`) en in je instellingen op de server, samen met de AI- en bewaarschakelaars. Open je het dashboard op een andere computer en log je met hetzelfde e-mailadres in, dan komt het mee.

### 5.2 `?api=` in de adresbalk

```
https://larsvegelin.github.io/nightfind/?api=https://parselab.jouwdomein.nl#scrape/url
```

Het adres uit de link wordt bewaard alsof je het had ingevuld. Een lege waarde (`?api=`) wist de instelling.

### 5.3 De tools los

Open je `tools/parsescraper.html` los (zonder dashboard), dan kun je ook daar `?api=https://…` meegeven. Zonder `?api=` gebruikt de tool het adres waar hij zelf vandaan komt.

### Wat er gebeurt na het bewaren

Het dashboard stuurt het nieuwe adres naar elke open tool (`parselab:api`) en naar de instellingen (`parselab:settings` met `apiBase`). ParseScraper controleert dan meteen de nieuwe server (`/api/scrape/status`) en laadt je taken opnieuw. Je hoeft niets te herladen.

---

## 6. Beveiliging: welke variabelen je zet

De server heeft geen accounts. Wat hem beschermt zijn deze instellingen.

| Variabele | Wat het doet | Advies |
|---|---|---|
| `PARSELAB_API_TOKEN` | Zet je dit, dan vraagt elke API-aanroep de kop `x-parselab-token`. ParseScraper vraagt er één keer om (bewaard in `sessionStorage`, dus per tabblad-sessie). | **Altijd zetten** zodra de server op internet staat. Anders kan iedereen die het adres raadt jouw server websites laten uitlezen. |
| `PARSELAB_ALLOW_ORIGIN` | Van welke websites de browser de API mag aanspreken (CORS). Komma-gescheiden lijst, bijvoorbeeld `https://larsvegelin.github.io,https://parselab.nl`. Standaard `*` (overal vandaan). | Zet hem op het adres van je dashboard. Met `*` werkt het ook, maar dan kan een willekeurige website vanuit de browser van een ingelogde gebruiker je server aanroepen (het token beschermt nog steeds; dit is een tweede slot). |
| `PARSELAB_ALLOW_PRIVATE` | `1` staat toe dat de server privé-adressen ophaalt (`localhost`, `192.168.…`). Alleen voor de tests. | **Nooit zetten op een server op internet**; dan kan iemand je interne netwerk laten uitlezen. |
| `PARSELAB_PROXIES` | Roterende proxies voor het ophalen. | Alleen als je die hebt. |
| `PARSELAB_ANTHROPIC_KEY`, `PARSELAB_AI_MODEL` | AI-sleutel op de server voor de AI-knoppen in de tools. | Optioneel. De sleutel staat nooit in de browser. |
| `PARSELAB_SUPABASE_URL`, `PARSELAB_SUPABASE_KEY` | Dan eisen de AI-eindpunten een ingelogde Supabase-gebruiker met een pakket dat AI toestaat. | Voor de Webflow/Supabase-versie. |
| `PARSELAB_PORT` | Poort, standaard 8080. | Railway en Render geven soms zelf `PORT`; zet dan `PARSELAB_PORT` op dezelfde waarde. |

Wat de server sowieso doet, zonder instelling: alleen `http` en `https`; geen privé-adressen; `robots.txt` wordt gelezen en gerespecteerd (weigert een site het, dan krijg je een nette melding en kun je de extensie gebruiken); minstens 2 seconden tussen verzoeken naar dezelfde website; hoogstens 2 pagina's tegelijk; hoogstens 25 pagina's en 5.000 regels per ronde; een pagina van meer dan 6 MB wordt afgekapt. Deze grenzen zijn niet instelbaar; dat is met opzet.

Wat naar de server gaat: het adres dat je uitleest, wat je aanwees (de regel), en het e-mailadres waarmee je in het dashboard bent ingelogd (`x-parselab-user`), zodat jouw taken van die van anderen gescheiden blijven. Er gaat niets van je documenten (ParsePDF) of bestanden (ParseBoard) naar de server, behalve als jij op een AI-knop klikt en *ja* zegt; dan gaat dat ene document.

---

## 7. Controleren dat het werkt

Vanaf elke computer, in een terminal (vervang het adres en het token):

```
# 1. Leeft de server?  → JSON met proxies/queue, of 401 met een nette melding als er een token staat
curl -i https://parselab.jouwdomein.nl/api/scrape/status

# 2. Met token → 200 en JSON
curl -i -H "x-parselab-token: jouw-lange-wachtwoord" https://parselab.jouwdomein.nl/api/scrape/status

# 3. Staat het dashboard toe? (de voorvraag die de browser stuurt) → 204 met access-control-allow-origin
curl -i -X OPTIONS -H "Origin: https://larsvegelin.github.io" \
     -H "Access-Control-Request-Method: POST" https://parselab.jouwdomein.nl/api/scrape/status

# 4. Een echte aanroep vanaf dat dashboard → 200 en de kop access-control-allow-origin in het antwoord
curl -i -H "Origin: https://larsvegelin.github.io" -H "x-parselab-token: …" https://parselab.jouwdomein.nl/api/scrape/status
```

In het dashboard: *Account → Serveradres → Bewaren* → *Verbonden: de server antwoordt.* Daarna ParseScraper openen: de gele hint is weg, en *Ophalen* met bijvoorbeeld `https://books.toscrape.com` toont de pagina om in aan te wijzen.

In de browser zelf (F12 → Netwerk) zie je de aanroepen naar jouw serveradres gaan, niet meer naar `github.io/…/api/…`.

---

## 8. Foutentabel

| Wat je ziet | Betekenis | Wat te doen |
|---|---|---|
| *Deze website heeft geen ParseLab-server* (gele hint, knop *Serveradres instellen*) | Het dashboard staat op een statische host (github.io, pages.dev, netlify.app, vercel.app) en er is nog geen adres ingevuld. | Serveradres invullen (hoofdstuk 5). |
| *Op https://… draait geen ParseLab-server (antwoord 404)* of *(antwoord 405)* | Het ingevulde adres bestaat, maar er antwoordt geen ParseLab-server: een statische site, een verkeerd pad (`…/api/scrape` erachter), of een andere app. | Controleer het adres; het moet alleen het domein zijn. Test stap 1 uit hoofdstuk 7. |
| *De ParseLab-server op … antwoordt niet* / *Geen antwoord van …* | De browser kon geen verbinding maken. Server uit, verkeerde poort, of geblokkeerd door CORS of mixed content (zie de volgende twee regels). | Server starten; adres controleren; F12 → Console lezen voor de exacte reden. |
| Console: *blocked by CORS policy* / *No 'Access-Control-Allow-Origin' header* | De server staat dit dashboard niet toe. | `PARSELAB_ALLOW_ORIGIN` bevat niet het exacte adres van het dashboard (schema en host, zonder pad, zonder slash), of er staat een oude serverversie zonder CORS. Zet `PARSELAB_ALLOW_ORIGIN=https://larsvegelin.github.io` en herstart. |
| Console: *Mixed Content: The page at 'https://…' was loaded over HTTPS, but requested an insecure resource 'http://…'* | Het dashboard is https en het serveradres http. Browsers blokkeren dat (behalve `localhost`). | Geef de server https (Railway/Render/Fly doen dat zelf; bij een eigen server Caddy of nginx met certificaat) en vul `https://…` in. |
| *De ParseLab-server vraagt een toegangscode* (venster) | Er staat een `PARSELAB_API_TOKEN` op de server. | De code invullen. Verkeerd ingevuld? Herlaad het tabblad; de tool vraagt opnieuw. |
| *Geen toegang: de ParseLab-server vraagt een toegangscode* (401 bij *Bewaren* onder Account) | Het dashboard test alleen of de server leeft; een 401 telt als *leeft*. Zie je toch *Geen antwoord*, dan is het iets anders. | Niets; ParseScraper vraagt de code bij de eerste echte aanroep. |
| *Deze website vraagt in robots.txt om niet automatisch uitgelezen te worden* | De website verbiedt automatisch uitlezen. ParseLab respecteert dat. | Gebruik de extensie in je eigen browser als je de pagina zelf mag gebruiken. |
| *Alleen openbare websites (http of https)* | Je gaf een privé-adres of een bestand op. | Openbaar adres gebruiken. Lokaal testen kan met `PARSELAB_ALLOW_PRIVATE=1` op je eigen computer, nooit op internet. |
| Render: eerste aanroep duurt 30–60 s, daarna werkt alles | De gratis service sliep. | Betaald plan, of accepteren. |
| Railway/Render: deploy faalt op *no space* of *out of memory* | Chromium heeft ruimte nodig. | Kies een plan met minstens 1 GB geheugen. |
| Taken lopen niet op het geplande tijdstip | De server stond uit (laptop dicht, gratis plan sliep). | Zet de server op een plan dat blijft draaien. |
| Dashboard op `http://localhost:8080` zegt ineens *antwoordt niet* | Er staat een serveradres ingevuld dat niet meer bestaat (bijvoorbeeld een oude `?api=`). | *Account → Serveradres* leegmaken en *Bewaren*. |

---

## 9. Wanneer je toch de extensie gebruikt

De server leest **openbare** websites: webshops, vacaturesites, registers, alles wat je zonder inloggen ziet. Voor pagina's waar je moet inloggen (een klantportaal, een intranet, een website die robots weigert maar die jij zelf mag gebruiken) gebruik je de ParseLab-extensie in je eigen browser. Die werkt met jouw sessie, en die gegevens verlaten je computer niet. Het dashboard ziet of de extensie er is en toont dat in de werkbank van ParseScraper. Installatie: *ParseForm → Toevoegen aan Chrome*, of de IT-route in dezelfde kaart.

---

## 10. Voor wie in de code kijkt

| Bestand | Wat er is veranderd |
|---|---|
| `index.html` | `CONFIG.apiBase` komt uit `?api=` of `localStorage` (`readApiBase`, `writeApiBase`). `staticHost()` herkent een statische host; `checkServer()` probeert daar niets zonder adres. De werkbank-hint heeft drie varianten (los bestand, statische host, lokale server) en een knop *Serveradres instellen*. De tool-iframes krijgen `&api=…` in hun `src`. Onder *Account* staat de kaart *Serveradres*; bewaren stuurt `parselab:api {apiBase}` naar elke open tool en zet `apiBase` in de instellingen (`parselab:settings`). |
| `tools/parsescraper.html` | `apiBase()` in plaats van een vaste `API`; leest `?api=`, luistert naar `parselab:api` en `parselab:settings.apiBase` en controleert dan meteen de server. Een 404/405 zonder JSON geeft de melding *Op … draait geen ParseLab-server*. De hint heeft een variant voor statische hosts. Downloadlinks (Excel/CSV) wijzen naar het ingestelde adres. |
| `tools/parsepdf.html`, `tools/parseboard.html` | Lezen `?api=` en `parselab:api` voor hun AI-eindpunten. |
| `server/server.js` | `PARSELAB_ALLOW_ORIGIN`; `corsHeaders(req)`; antwoord op `OPTIONS /api/*` met 204; elke API-respons met een `Origin`-kop krijgt de CORS-koppen (ook 401 en fouten, zodat de browser de melding kan lezen). |
| `tests/qa.mjs` | Stap 13 *serveradres*: dashboard op de ene poort, server op de andere; fout adres → *Geen antwoord*; `https://` wordt aangevuld; goed adres → *Verbonden*; de tool krijgt `?api=` en bereikt de server op het andere adres; `?api=` in de adresbalk overschrijft; leeg adres herstelt. |

Berichten tussen schil en tool (`window.postMessage`): schil → tool `parselab:api {apiBase}`, en `apiBase` als veld in `parselab:settings`. Alle andere berichten staan in `docs/IMPLEMENTATIE.md`, hoofdstuk 6b.
