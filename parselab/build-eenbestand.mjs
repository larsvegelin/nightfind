#!/usr/bin/env node
/*
 * Maakt ParseLab.html: één bestand met het dashboard en alle vier de tools erin.
 * Dubbelklikken is genoeg; ParsePDF en ParseBoard werken volledig, ParseForm toont de extensie-uitleg.
 * Websites uitlezen vraagt de ParseLab-server; het dashboard zegt dat erbij.
 *
 *   node build-eenbestand.mjs            → ParseLab.html naast dit script
 *   node build-eenbestand.mjs /pad/naam.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, "ParseLab.html");
const TOOLS = ["parsescraper.html", "parsepdf.html", "parseboard.html"];
// Een sluittag mag niet letterlijk in dit bestand staan; hij wordt vervangen door dit teken en bij het openen hersteld.
const TOKEN = "<\\/script";

let dash = fs.readFileSync(path.join(here, "index.html"), "utf8");

// De werkbank laadt de tool niet meer van schijf, maar uit een tekstblok in dit bestand.
const iframeOld = '<iframe class="bench-frame" data-tool="${t.key}" src="${esc(b.src)}?embed=1&section=${esc(state.section || "")}"';
if (!dash.includes(iframeOld)) { console.error("index.html is veranderd: de iframe-regel is niet gevonden."); process.exit(1); }
const iframeNew = '<iframe class="bench-frame" data-tool="${t.key}" data-src="${esc(b.src)}" srcdoc="${esc(PL_INLINE[b.src.replace("tools/", "")] || "")}"';
dash = dash.replace(iframeOld, () => iframeNew);

const blocks = TOOLS.map(name => {
  const html = fs.readFileSync(path.join(here, "tools", name), "utf8").replaceAll("</script", TOKEN);
  return `<script type="text/plain" id="pl-inline-${name.replace(".html", "")}">${html}</script>`;
});

// Zonder eigen webadres kan de browser localStorage blokkeren; dan valt de tool terug op geheugen.
const shim = '<script>(function(){try{window.localStorage.setItem("__pl","1");window.localStorage.removeItem("__pl");}catch(e){var m={};var s={getItem:function(k){return k in m?m[k]:null;},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){return Object.keys(m)[i]||null;}};Object.defineProperty(s,"length",{get:function(){return Object.keys(m).length;}});try{Object.defineProperty(window,"localStorage",{value:s,configurable:true});}catch(e2){}}})();</script>';
// In het bestand mag geen letterlijke </script staan; bij het uitvoeren is het weer een echte sluittag.
const shimLiteral = JSON.stringify(shim).replace(/<\//g, "<\\/");

const loader = `<script>
window.PL_INLINE = {};
${JSON.stringify(TOOLS)}.forEach(function (n) {
  var el = document.getElementById("pl-inline-" + n.replace(".html", ""));
  if (!el) return;
  var html = el.textContent.split(${JSON.stringify(TOKEN)}).join("</scr" + "ipt");
  var shim = ${shimLiteral};
  window.PL_INLINE[n] = html.replace(/<head([^>]*)>/i, function (m, a) { return "<head" + a + ">" + shim; });
});
</script>`;

const head = blocks.join("\n") + "\n" + loader + "\n</head>";
dash = dash.replace("</head>", () => head);
fs.writeFileSync(out, dash);
console.log("Klaar:", out, "(" + Math.round(fs.statSync(out).size / 1024) + " kB)");
