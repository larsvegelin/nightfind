#!/usr/bin/env node
/*
 * Zet alle embeds om in één JavaScript-bestand plus een klein laadscript.
 * Daarmee hoef je in Webflow niet meer tien blokken te plakken die elk onder de
 * 10.000 tekens moeten blijven: je plaatst één embed die dit bestand ophaalt.
 *
 *   node parselab/webflow/bouw-bundel.mjs [uitvoermap]
 *
 * Levert:
 *   parsepdf.js          alles bij elkaar, stijl wordt door het script zelf ingevoegd
 *   embed-loader.html    het enige blok dat je in Webflow plakt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const uit = process.argv[2] || path.join(here, "..", "dist");
fs.mkdirSync(uit, { recursive: true });

// Volgorde: het nummer voorop, daarna een eventuele letter (4 komt voor 4b).
const EMBEDS = fs.readdirSync(here).filter(n => /^\d+[a-z]?-.*\.html$/.test(n))
  .sort((a, b) => {
    const A = a.match(/^(\d+)([a-z]?)/), B = b.match(/^(\d+)([a-z]?)/);
    return Number(A[1]) - Number(B[1]) || A[2].localeCompare(B[2]);
  });

let js = "/* ParseLab — ParsePDF, gebouwd uit parselab/webflow/. Niet met de hand wijzigen. */\n(function(){\n";
let css = "";
for (const naam of EMBEDS) {
  const bron = fs.readFileSync(path.join(here, naam), "utf8");
  for (const m of bron.matchAll(/<style>([\s\S]*?)<\/style>/g)) css += m[1] + "\n";
  for (const m of bron.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (/<script src=/.test(m[0])) continue;
    // De instellingen komen uit het laadscript, niet uit de bundel.
    if (/window\.PARSELAB\s*=/.test(m[1])) continue;
    js += "\n/* ---- " + naam + " ---- */\n" + m[1] + "\n";
  }
}
js += "\n})();\n";

// De stijl komt uit hetzelfde bestand; zo blijft het bij één verwijzing.
const stijl = "(function(){var s=document.createElement('style');s.textContent=" +
  JSON.stringify(css).replace(/<\//g, "<\\/") + ";document.head.appendChild(s);})();\n";
fs.writeFileSync(path.join(uit, "parsepdf.js"), stijl + js);

const loader = `<!-- ParsePDF — het enige blok dat je in Webflow plaatst. Zet het onder de lege
     container <div id="pl-parsepdf-root"></div>. Vervang het adres door de plek
     waar parsepdf.js staat (GitHub Pages, je eigen server, een CDN). -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script>
window.PARSELAB = {
  supabaseUrl: "https://wgmwpwviqhcsyvfrwual.supabase.co",
  supabaseKey: "sb_publishable_3NaKuKqUgGfvF2q772MwIw_hfHdklwo",
  dashboardPath: "/dashboard",
  loginPath: "/inloggen",
  aiEndpoint: "/api/parsepdf/velden",
  prices: { pro: "", business: "" }
};
window.PARSELAB.client = window.supabase.createClient(window.PARSELAB.supabaseUrl, window.PARSELAB.supabaseKey,
  { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
</script>
<script src="https://larsvegelin.github.io/nightfind/parselab/dist/parsepdf.js" defer></script>
`;
fs.writeFileSync(path.join(uit, "embed-loader.html"), loader);
console.log("Klaar:", path.join(uit, "parsepdf.js"), "(" + Math.round(fs.statSync(path.join(uit, "parsepdf.js")).size / 1024) + " kB)",
  "en embed-loader.html uit", EMBEDS.length, "embeds");
