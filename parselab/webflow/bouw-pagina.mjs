#!/usr/bin/env node
/*
 * Zet de vijf embeds om in één losse pagina: parselab/ParsePDF.html.
 * Die pagina is precies wat er in Webflow komt te staan, maar dan als bestand
 * dat je op elke webhost kwijt kunt (Netlify, GitHub Pages, je eigen server).
 *
 *   node parselab/webflow/bouw-pagina.mjs [uitvoerbestand]
 *
 * De embeds worden woord voor woord overgenomen. Wil je iets veranderen,
 * verander het dan in webflow/ en bouw opnieuw; anders lopen de twee uit elkaar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const uit = process.argv[2] || path.join(here, "..", "ParsePDF.html");
const EMBEDS = ["1-config-stijl.html", "2-teksten.html", "3-teksten-voorstel.html", "4-motor.html", "5-scherm.html", "6-structuur.html", "7-velden.html", "8-voorstel.html", "9-verwerken.html"];

const delen = EMBEDS.map(naam => "<!-- " + naam + " -->\n" + fs.readFileSync(path.join(here, naam), "utf8").trim());

const pagina = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>ParsePDF — ParseLab</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: #FBFAF6; font-family: Poppins, -apple-system, "Segoe UI", system-ui, sans-serif; }
  .pl-container { max-width: 1120px; margin: 0 auto; padding: 56px 24px 96px; }
  @media (max-width: 767px) { .pl-container { padding: 32px 20px 64px; } }
</style>
</head>
<body>
<div class="pl-page"><div class="pl-light"><div class="pl-container"><div class="pl-section">
<div id="pl-parsepdf-root"></div>
${delen.join("\n")}
</div></div></div></div>
</body>
</html>
`;
fs.writeFileSync(uit, pagina);
console.log("Klaar:", path.resolve(uit), "(" + Math.round(fs.statSync(uit).size / 1024) + " kB)");
