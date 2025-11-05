# NightFind Website

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
