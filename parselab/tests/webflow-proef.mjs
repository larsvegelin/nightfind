#!/usr/bin/env node
/*
 * Bouwt een proefpagina van de vijf ParsePDF-embeds, zodat ze te testen zijn
 * zonder Webflow en zonder echte Supabase.
 *
 *   node parselab/tests/webflow-proef.mjs [uitvoermap]
 *
 * Wat er verandert ten opzichte van de echte pagina, en niets anders:
 *  - de Supabase-client komt uit een namaakbestand in plaats van de cdn;
 *  - pdf.js komt uit de kopie die al in tools/parsepdf.html zit, want de
 *    testomgeving heeft geen internet;
 *  - dashboardPath en loginPath wijzen naar twee kleine proefpagina's.
 * De embeds zelf blijven woord voor woord staan.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const wortel = path.resolve(here, "..");
const uit = process.argv[2] || path.join(here, "proef");
const EMBEDS = ["1-config-stijl.html", "2-teksten.html", "3-teksten-voorstel.html", "4-motor.html", "5-scherm.html", "6-structuur.html", "7-velden.html", "8-voorstel.html", "9-verwerken.html"];

fs.mkdirSync(uit, { recursive: true });

// pdf.js en zijn worker uit de tool halen; die staan daar al ingebakken.
const tool = fs.readFileSync(path.join(wortel, "tools", "parsepdf.html"), "utf8");
function haalScript(merk) {
  const m = tool.indexOf(merk);
  if (m < 0) throw new Error("niet gevonden in parsepdf.html: " + merk);
  const start = tool.indexOf("<script>", m) + "<script>".length;
  const eind = tool.indexOf("</script>", start);
  return tool.slice(start, eind);
}
fs.writeFileSync(path.join(uit, "pdf.min.js"), haalScript("<!-- pdf.js (Mozilla"));
fs.writeFileSync(path.join(uit, "pdf.worker.min.js"), haalScript("<!-- pdf.js worker"));

// Namaak-Supabase: geeft terug wat de echte teruggeeft en onthoudt de aanroepen.
const stub = `/* Namaak-Supabase voor de proefpagina. Instellen via de adresregel:
   ?ingelogd=0  ?gebruikt=45  ?limiet=50  ?taal=en  ?weigeren=1 */
(function () {
  var q = new URLSearchParams(location.search);
  var cfg = {
    ingelogd: q.get("ingelogd") !== "0",
    gebruikt: Number(q.get("gebruikt") || 0),
    limiet: Number(q.get("limiet") || 2500),
    taal: q.get("taal") || "nl",
    weigeren: q.get("weigeren") === "1"
  };
  window.PL_STUB = cfg;
  window.PL_STUB_CALLS = [];
  function keten(data) {
    var o = {
      select: function () { return o; },
      eq: function () { return o; },
      maybeSingle: function () { return Promise.resolve({ data: data, error: null }); },
      single: function () { return Promise.resolve({ data: data, error: null }); },
      then: function (f) { return Promise.resolve({ data: data, error: null }).then(f); }
    };
    return o;
  }
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () {
            return Promise.resolve({ data: { session: cfg.ingelogd ? { user: { id: "proef-gebruiker" } } : null }, error: null });
          }
        },
        from: function () { return keten({ locale: cfg.taal }); },
        rpc: function (naam, args) {
          window.PL_STUB_CALLS.push({ naam: naam, args: args });
          if (naam === "usage_summary") {
            return Promise.resolve({ data: { used: cfg.gebruikt, monthly_limit: cfg.limiet }, error: null });
          }
          if (naam === "record_usage") {
            var n = Number((args && args.p_pages) || 0);
            if (cfg.weigeren || cfg.gebruikt + n > cfg.limiet) {
              return Promise.resolve({ data: null, error: { message: "limiet bereikt" } });
            }
            cfg.gebruikt += n;
            return Promise.resolve({ data: cfg.gebruikt, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }
      };
    }
  };
})();
`;
fs.writeFileSync(path.join(uit, "supabase-stub.js"), stub);

// De embeds inlezen en alleen de drie adressen omzetten.
const delen = EMBEDS.map(naam => {
  let s = fs.readFileSync(path.join(wortel, "webflow", naam), "utf8");
  s = s.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^"]*"><\/script>\s*/, () => "");
  s = s.replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/[\d.]+\/pdf\.min\.js/g, () => "./pdf.min.js");
  s = s.replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/[\d.]+\/pdf\.worker\.min\.js/g, () => "./pdf.worker.min.js");
  s = s.replace(/dashboardPath:"[^"]*"/, () => 'dashboardPath:"./dashboard.html"');
  s = s.replace(/loginPath:"[^"]*"/, () => 'loginPath:"./inloggen.html"');
  return "<!-- " + naam + " -->\n" + s;
});

const pagina = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ParsePDF proefpagina</title>
<style>body{margin:0;background:#FBFAF6}.pl-container{max-width:1120px;margin:0 auto;padding:48px 24px 96px}</style>
<script src="./supabase-stub.js"></script>
</head>
<body>
<div class="pl-page"><div class="pl-light"><div class="pl-container"><div class="pl-section">
<div id="pl-parsepdf-root"></div>
${delen.join("\n")}
</div></div></div></div>
</body>
</html>
`;
fs.writeFileSync(path.join(uit, "index.html"), pagina);

for (const [naam, titel] of [["inloggen.html", "Inloggen (proef)"], ["dashboard.html", "Dashboard (proef)"]]) {
  fs.writeFileSync(path.join(uit, naam),
    `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>${titel}</title></head><body><h1>${titel}</h1></body></html>\n`);
}

// Twee proeffacturen, met tekstlaag, zodat het uitlezen echt iets te doen heeft.
function pdf(paginas) {
  const objs = [];
  const kids = paginas.map((_, i) => (4 + i * 2) + " 0 R").join(" ");
  objs[1] = "<</Type/Catalog/Pages 2 0 R>>";
  objs[2] = "<</Type/Pages/Kids[" + kids + "]/Count " + paginas.length + ">>";
  objs[3] = "<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>";
  paginas.forEach((regels, i) => {
    const stroom = "BT /F1 12 Tf 72 760 Td 20 TL\n" +
      regels.map(r => "(" + r.replace(/([()\\])/g, "\\$1") + ") Tj T*").join("\n") + "\nET\n";
    objs[4 + i * 2] = "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 3 0 R>>>>/Contents " + (5 + i * 2) + " 0 R>>";
    objs[5 + i * 2] = { stroom };
  });
  let body = "%PDF-1.4\n";
  const pos = [];
  for (let n = 1; n < objs.length; n++) {
    pos[n] = body.length;
    const o = objs[n];
    body += typeof o === "string"
      ? n + " 0 obj " + o + " endobj\n"
      : n + " 0 obj <</Length " + Buffer.byteLength(o.stroom, "latin1") + ">> stream\n" + o.stroom + "endstream endobj\n";
  }
  const xref = body.length;
  body += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
  for (let n = 1; n < objs.length; n++) body += String(pos[n]).padStart(10, "0") + " 00000 n \n";
  body += "trailer <</Size " + objs.length + "/Root 1 0 R>>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(body, "latin1");
}

fs.writeFileSync(path.join(uit, "factuur-a.pdf"), pdf([
  ["De Waerdse Assuradeuren", "Factuurnummer: 2026-118", "Factuurdatum: 12-03-2026",
   "Subtotaal EUR 1.244,17", "BTW 21% EUR 262,28", "Totaal te voldoen EUR 1.506,45"],
  ["Bijlage bij factuur 2026-118", "Rekening NL91ABNA0417164300"]
]));
fs.writeFileSync(path.join(uit, "factuur-b.pdf"), pdf([
  ["Factuurnummer: 2026-119", "Factuurdatum: 3-04-2026",
   "Subtotaal EUR 800,00", "BTW 21% EUR 168,00", "Totaal te voldoen EUR 968,00"]
]));
// Een bestand zonder tekstlaag, om de melding over gescande documenten te kunnen tonen.
fs.writeFileSync(path.join(uit, "gescand.pdf"), pdf([[]]));

console.log("Proefpagina klaar:", uit);
