# ParseLab

Website van **ParseLab**: verzamel data en automatiseer wat je in je browser doet. Neem een taak één keer op of beschrijf hem, en ParseLab herhaalt hem voor elke regel uit je lijst, op elke website, in je eigen browser.

## Wat er staat

Eerste versie van de complete site, gebouwd volgens het projectdocument (werknaam Flowdeck). De gratis scraper in de browser is de ingang, use cases staan voorop, met eerlijke voorbeelddata en zakelijke gegevens in plaats van persoonsgegevens.

| Pagina | Bestand |
|---|---|
| Home (hero-loop, scraper, toepassingen, flow van de week, wachtlijst) | `index.html` |
| Hoe het werkt | `hoe-het-werkt.html` |
| Toepassingen: hub met filters + 13 use-casepagina's | `toepassingen/` |
| Prijzen (gratis, Pro, Business, credits) | `prijzen.html` |
| Automation Vault | `vault.html` |
| FAQ | `faq.html` |
| Help en installatie (download van de extensie) | `help.html` |
| Inloggen (via de extensie; webapp volgt) | `inloggen.html` |
| Demo-dashboard (Copilot-chat, flow, tabellen, geschiedenis, apps) | `app.html` |
| Scrapetool proberen: het echte paneel op een voorbeeldwebshop | `scrapetool.html` |
| Privacy en voorwaarden (concept) | `privacy.html`, `voorwaarden.html` |
| 404, sitemap, robots | `404.html`, `sitemap.xml`, `robots.txt` |

## Bouwen

Alle pagina's komen uit één script. Pas teksten, use cases of instellingen aan in `site-src/build.py` en draai:

```
python3 site-src/build.py
```

- `CONFIG` bovenin: merknaam (`ParseLab`, of `Flowdeck`), domein, prijzen en credits.
- `USE_CASES`: elke toepassing is één blok. Een blok erbij geeft een nieuwe pagina, een kaart op de hub, een sitemap-regel en interne links.
- De scrapetool-demo komt uit de extensie zelf: `python3 site-src/scrapetool.py` bouwt `scrapetool.html` uit `extension/panel.js`. Draai dit na elke wijziging aan de extensie.
- Gedeelde opmaak en scripts: `assets/parselab/site.css`, `site.js` (menu, wachtlijst, extensie-herkenning, filters), `hero.js` (hero-loop) en `app.js` (demo).

## Koppelingen

- **Wachtlijst en vragen** gaan naar de tabel `wachtlijst` in het Supabase-project `scraper` (EU). Bezoekers kunnen alleen invoegen; via de API kan niemand de lijst lezen. Bekijk de aanmeldingen in het Supabase-dashboard.
- **Extensie:** de site ziet via `bridge.js` of ParseLab geïnstalleerd is (op `larsvegelin.github.io`, `*.parselab.nl` en localhost) en past dan de knoppen aan.
- `downloads/parselab-extension.zip` is de huidige extensie (1.48), gezipt uit `extension/`.

## De extensie (`extension/`)

De broncode van de Chrome-extensie (Manifest V3): `panel.js` (het paneel), `background.js` (downloads, PDF, cloud, planning, pagina's ophalen), `bridge.js` (herkenning door de website) en `manifest.json`. Wat er per versie bij kwam, staat in `extension/README.md`.

Nieuwe zip maken na een wijziging:

```
cd extension && zip -qr ../downloads/parselab-extension.zip . && cd ..
python3 site-src/scrapetool.py
```

Nieuw in 1.48: **Andere pagina's uitlezen**. Voor elke regel uit je lijst haalt ParseLab de pagina van het adres op, ook van andere websites, zonder je tabblad te verlaten. Eerst snel (alleen de HTML); is de pagina leeg zonder JavaScript, dan in een verborgen tabblad. Velden wijs je één keer aan op een voorbeeldpagina.

## Nog in te vullen

- Domein (`CONFIG['DOMAIN']`, nu `https://parselab.nl`) en merknaam controleren.
- Prijzen zijn een eerste test (€10 en €50 per maand, Vault vanaf €29).
- Privacy en voorwaarden zijn concepten: juridisch laten toetsen.
- Oude NightFind-pagina's (`bars.html`, `clubs.html`, `events.html`, `budget.html`, `contact.html`, `cookies.html`, `legal.html`, `terms.html`) staan er nog; ze zijn niet meer gelinkt.

---

# Vorig project: NightFind

Professional website for NightFind - an international nightlife discovery app.

## 🌟 Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Pure black background (#000000) with purple (#7C3AED) and indigo (#5B21B6) accents
- **Modern Animations**: Smooth fade-in effects, scroll reveals, and hover transitions
- **Apple App Store Ready**: Complete legal pages for compliance (Privacy, Terms, Cookies)
- **Pure HTML/CSS/JS**: No frameworks required - easy to deploy anywhere

## 📁 Project Structure

```
NightFind website/
├── index.html              # Home page with hero section
├── privacy.html            # Privacy Policy (GDPR compliant)
├── terms.html              # Terms of Service
├── cookies.html            # Cookies Policy
├── help.html               # Help & FAQ
├── contact.html            # Contact form
└── assets/
    ├── logo.svg            # SVG logo (magnifying glass + moon)
    ├── logo.png            # PNG logo (you'll need to convert from SVG)
    └── css/
        └── style.css       # Main stylesheet
```

## 🎨 Design Specifications

- **Colors**:
  - Background: `#000000` (pure black)
  - Text: `#ffffff` (white)
  - Primary accent: `#7C3AED` (purple)
  - Secondary accent: `#5B21B6` (indigo)
  - Gray shades: `#1a1a1a`, `#333333`, `#666666`

- **Typography**:
  - Primary: Inter
  - Alternative: Poppins
  - Fallback: System UI sans-serif

- **Layout**:
  - Max width: 1100px
  - Border radius: 14-20px
  - Generous spacing and padding

## 🚀 Deployment

### Option 1: GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select branch `main` and folder `/ (root)`
5. Save and wait for deployment
6. Your site will be available at `https://yourusername.github.io/repository-name/`

### Option 2: Netlify

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the entire `NightFind website` folder
3. Site will be deployed instantly
4. Optional: Configure custom domain in site settings

### Option 3: Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to project folder
3. Run `vercel` and follow prompts
4. Site will be deployed with automatic HTTPS

## 📝 Before Deploying

### 1. Convert Logo to PNG

The logo is currently in SVG format. To create a PNG version:

- **Option A**: Open `assets/logo.svg` in a design tool (Figma, Illustrator, Inkscape)
- **Option B**: Use an online converter like [CloudConvert](https://cloudconvert.com/svg-to-png)
- Save as `assets/logo.png` (recommended size: 512x512px or higher)

### 2. Update App Store Links

Replace placeholder App Store links throughout the site:

```html
<!-- Find and replace this URL: -->
https://apps.apple.com/app/nightfind

<!-- With your actual App Store URL -->
```

### 3. Add Screenshots

Replace carousel placeholders in `index.html` with actual app screenshots:

```html
<!-- Current: -->
<div class="carousel-item">
    <span>Screenshot 1<br>Discover Screen</span>
</div>

<!-- Replace with: -->
<div class="carousel-item">
    <img src="assets/screenshots/screen1.png" alt="Discover Screen">
</div>
```

### 4. Update Social Media Links

In `contact.html`, replace `#` with your actual social media URLs:

```html
<a href="#" class="social-icon">  <!-- Replace # with real URL -->
```

### 5. Configure Email Addresses

Verify all email addresses match your domain:
- support@nightfind.com
- business@nightfind.com
- venues@nightfind.com
- legal@nightfind.com
- privacy@nightfind.com

## 🔧 Customization

### Changing Colors

Edit CSS variables in `assets/css/style.css`:

```css
:root {
    --black: #000000;
    --white: #ffffff;
    --purple: #7C3AED;      /* Change this */
    --indigo: #5B21B6;      /* Change this */
    /* ... */
}
```

### Changing Fonts

Update the Google Fonts import in `style.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;600;700&display=swap');
```

### Adding Pages

1. Copy any existing HTML file as a template
2. Update navigation links in all pages
3. Add footer link to new page

## 📱 Testing

Before deployment, test on:

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iPhone, Android phones)
- ✅ Different screen sizes (use browser dev tools)

### Validation

- HTML: [W3C Validator](https://validator.w3.org/)
- CSS: [CSS Validator](https://jigsaw.w3.org/css-validator/)
- Accessibility: [WAVE Tool](https://wave.webaim.org/)

## 📋 Legal Compliance

The website includes comprehensive legal pages for:

- **Privacy Policy**: GDPR compliant, covers data collection, Supabase/Google/Apple APIs
- **Terms of Service**: Age 18+, liability limitations, premium listings
- **Cookies Policy**: Essential and analytics cookies explained

Review and customize these pages with your lawyer before going live.

## 🌐 SEO & Social Media

All pages include:
- Meta descriptions
- Open Graph tags (Facebook/LinkedIn)
- Twitter Card tags
- Proper heading hierarchy
- Semantic HTML

Update the OG images in each HTML file:

```html
<meta property="og:image" content="https://yoursite.com/assets/og-image.png">
```

## 🎯 Performance Tips

1. **Optimize Images**: Use WebP format for screenshots (fallback to PNG/JPG)
2. **Compress Assets**: Use tools like TinyPNG or ImageOptim
3. **Enable Caching**: Configure via hosting provider
4. **Use CDN**: Consider Cloudflare for faster global delivery

## 🆘 Support

For issues or questions:
- Check the [Help & FAQ](help.html) page
- Email: support@nightfind.com

## 📄 License

© 2025 NightFind • All rights reserved

---

**Ready to deploy?** Follow the deployment steps above and your NightFind website will be live! 🚀

## 💰 Budget tracker (`budget.html`)

Persoonlijke tool om inkomsten en uitgaven bij te houden, gekoppeld aan Supabase.

- **Overzicht per dag, maand en jaar** – totalen (inkomsten, uitgaven, saldo), grafiek per dag/maand en verdeling per categorie
- **Categorieën** – toevoegen, hernoemen, kleur kiezen en verwijderen (transacties blijven bewaard als "Zonder categorie"); bij de eerste login worden standaardcategorieën aangemaakt
- **Transacties** – toevoegen, bewerken, verwijderen en filteren op categorie
- **Opslag** – alles staat in Supabase (`budget_categories`, `budget_transactions`) en is per gebruiker afgeschermd met Row Level Security; inloggen gaat via Supabase Auth (e-mail + wachtwoord)

Schema: `supabase/migrations/20261002_budget_tracker.sql` (al toegepast op het `nightvibe-production` project).
Bestanden: `budget.html`, `assets/css/budget.css`, `assets/js/budget.js`.
