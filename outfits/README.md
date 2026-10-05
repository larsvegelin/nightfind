# shopdelook: outfit affiliate pagina's

Outfits uit TikTok-video's, met per item een affiliate link.
Gewone HTML/CSS/JS, zonder build-stap.

## Hoe het werkt

1. Je post een outfit op TikTok.
2. In je bio / link-in-bio staat `outfit.html?id=<outfit-id>`.
3. Volgers zien de complete look, de totaalprijs en per item een "Shop"-knop
   (en waar mogelijk een goedkoper "budget tip"-alternatief).

## Nieuwe outfit toevoegen

Open `data/outfits.js` en kopieer het voorbeeld-object. Pas de id (de sleutel),
de teksten, prijzen en **je eigen affiliate links** (`url`) aan.
Foto's zet je in `images/` en daar verwijs je naar met `image: "images/naam.jpg"`.
Laat `image` leeg voor een placeholder.

## Bestanden

```
outfits/
├── outfit.html        # outfitpagina (template, leest ?id=)
├── css/outfit.css     # styling (mobiel eerst, light/dark)
├── js/outfit.js       # rendert de outfit, klik-tracking, delen
├── data/outfits.js    # al je outfits + affiliate links
└── images/            # outfit- en productfoto's
```

## Belangrijk

- Affiliate links krijgen `rel="sponsored nofollow"` en onderaan staat een
  affiliate disclaimer. Die is wettelijk verplicht (ACM/Reclamecode), dus laat hem staan.
- Klikken worden nu lokaal gelogd (`localStorage` → `sdl_clicks`). Later te koppelen
  aan Supabase of Plausible via `trackClick()` in `js/outfit.js`.

## Lokaal bekijken

Open `outfit.html` direct in je browser, of draai bijvoorbeeld `npx serve .`
