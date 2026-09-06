#!/usr/bin/env node
/*
 * Maakt een setje proef-PDF's om ParsePDF mee te controleren.
 * Ze hebben een echte tekstlaag (behalve gescand.pdf, dat is met opzet leeg),
 * zodat je ziet wat de tool wel en niet uit een document haalt.
 *
 *   node parselab/tests/pdfs/maak-pdfs.mjs [uitvoermap]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const uit = process.argv[2] || here;
fs.mkdirSync(uit, { recursive: true });

// Eén PDF met Helvetica en WinAnsi; het euroteken is daar byte 128.
function pdf(paginas) {
  const objs = [];
  objs[1] = "<</Type/Catalog/Pages 2 0 R>>";
  objs[2] = "<</Type/Pages/Kids[" + paginas.map((_, i) => (4 + i * 2) + " 0 R").join(" ") + "]/Count " + paginas.length + ">>";
  objs[3] = "<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>";
  paginas.forEach((pag, i) => {
    const regels = Array.isArray(pag) ? pag : pag.regels || [];
    const teken = (Array.isArray(pag) ? "" : pag.teken) || "";
    const tekst = regels.length
      ? "BT /F1 11 Tf 64 770 Td 19 TL\n" + regels.map(r =>
          "(" + String(r).replace(/([()\\])/g, "\\$1").replace(/€/g, "\\200") + ") Tj T*").join("\n") + "\nET\n"
      : "";
    const stroom = teken + tekst;
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

// Een pagina kan ook losse tekstblokken op eigen plek hebben: {x, y, t, groot}.
// Zo bouw je een kolommenlayout na, zoals webshops en boekhoudpakketten die maken.
function vrij(blokken) {
  return { teken: blokken.map(b =>
    "BT /F1 " + (b.groot || 9) + " Tf 1 0 0 1 " + b.x + " " + b.y + " Tm (" +
    String(b.t).replace(/([()\\])/g, "\\$1").replace(/€/g, "\\200") + ") Tj ET\n").join(""), regels: [] };
}

const bestanden = {
  // Rechttoe rechtaan: label en waarde op dezelfde regel.
  "factuur-alpha.pdf": [[
    "Alpha Kantoorbenodigdheden B.V.", "Havenweg 12, 1621 AB Hoorn", "KvK 34567890", "",
    "FACTUUR", "",
    "Factuurnummer: 2026-0118", "Factuurdatum: 12-03-2026", "Vervaldatum: 11-04-2026",
    "Klantnummer: KL-4471", "",
    "10 x Bureaustoel model Nova     1.244,17",
    "", "Subtotaal € 1.244,17", "BTW 21% € 261,28", "Totaal te voldoen € 1.505,45", "",
    "Gelieve te voldoen op IBAN NL91ABNA0417164300"
  ]],
  // Waarde staat op de regel eronder; zo controleer je of de tool doorleest.
  "factuur-beta.pdf": [[
    "Beta Installatietechniek", "", "Factuurnummer", "F-2026-0442", "",
    "Factuurdatum", "2 april 2026", "",
    "Omschrijving: onderhoud cv-installatie",
    "Subtotaal", "€ 890,00", "BTW 21%", "€ 186,90", "Totaal te voldoen", "€ 1.076,90"
  ], [
    "Bijlage bij factuur F-2026-0442", "Werkbon 88213", "Monteur: J. de Vries"
  ]],
  // Valkuilen: Subtotaal vóór Totaal, en een bedrag zonder euroteken.
  "factuur-gamma.pdf": [[
    "Gamma Groothandel", "Factuurnummer : 26/0993", "Factuurdatum : 28-02-2026", "",
    "Subtotaal excl. btw 12.400,00", "Korting 2% -248,00", "BTW 21% 2.551,92",
    "Totaal incl. btw 14.703,92", "",
    "Betaling binnen 30 dagen. Totaal aantal regels: 14"
  ]],
  // Voor het sjabloon Bankafschrift.
  "bankafschrift.pdf": [[
    "Rekeningafschrift", "", "Rekening NL02RABO0123456789", "Tenaamstelling: De Waerdse Assuradeuren",
    "Periode: 01-03-2026 t/m 31-03-2026", "",
    "Beginsaldo € 12.004,55", "Bij € 8.210,00", "Af € 6.998,12", "Eindsaldo € 13.216,43"
  ]],
  // Een polis: andere woorden, zelfde soort velden.
  "polis.pdf": [[
    "Polisblad aansprakelijkheidsverzekering", "", "Polisnummer: P-2026-77120",
    "Ingangsdatum: 01-01-2026", "Contractvervaldatum: 01-01-2027",
    "Verzekeringnemer: Bakkerij Van Dijk V.O.F.", "",
    "Verzekerd bedrag € 2.500.000,00", "Eigen risico € 250,00", "Premie per jaar € 1.148,76"
  ]],
  // Zes pagina's, om het tellen en de maandlimiet te zien werken.
  "factuur-groot.pdf": Array.from({ length: 6 }, (_, i) => i === 0
    ? ["Delta Logistiek", "Factuurnummer: 2026-5001", "Factuurdatum: 15-05-2026",
       "Subtotaal € 24.980,00", "BTW 21% € 5.245,80", "Totaal te voldoen € 30.225,80"]
    : ["Specificatie pagina " + (i + 1) + " van 6", "Rit " + (1000 + i) + "   Hoorn - Rotterdam   € " + (120 + i * 7) + ",50"]),
  // Nagebouwd naar een echte webshopfactuur: kolomkoppen met de waarden op de regel
  // eronder, een regeltabel, en "Totaal excl." vlak boven "Totaal incl.".
  "factuur-webshop.pdf": [vrij([
    { x: 50, y: 780, t: "Factuur INV10632", groot: 14 },
    { x: 50, y: 762, t: "Order ORD10093", groot: 10 },
    { x: 50, y: 700, t: "Wijnhandel Voorbeeld B.V." },
    { x: 50, y: 688, t: "Voorbeeldstraat 1" },
    { x: 50, y: 676, t: "1234 AB Voorbeeldstad" },
    { x: 50, y: 588, t: "Factuurnummer" }, { x: 134, y: 588, t: "Ordernummer" },
    { x: 218, y: 588, t: "Klantnummer" }, { x: 429, y: 588, t: "Datum" },
    { x: 50, y: 576, t: "INV10632" }, { x: 134, y: 576, t: "ORD10093" },
    { x: 218, y: 576, t: "227521416" }, { x: 429, y: 576, t: "Zondag 21 Juni 2026" },
    { x: 51, y: 546, t: "Beschrijving" }, { x: 319, y: 546, t: "Artikelcode" }, { x: 370, y: 546, t: "Aantal" },
    { x: 401, y: 546, t: "BTW" }, { x: 425, y: 546, t: "Item prijs" }, { x: 468, y: 546, t: "Korting" }, { x: 502, y: 546, t: "Subtotaal" },
    { x: 52, y: 530, t: "Epicuro Wijnkado Italie" }, { x: 319, y: 530, t: "29967" }, { x: 391, y: 530, t: "1x" },
    { x: 414, y: 530, t: "21" }, { x: 439, y: 530, t: "€28,95" }, { x: 476, y: 530, t: "€0,00" }, { x: 517, y: 530, t: "€28,95" },
    { x: 52, y: 514, t: "Verzending & Afhandeling" }, { x: 391, y: 514, t: "1x" },
    { x: 414, y: 514, t: "21" }, { x: 442, y: 514, t: "€9,95" }, { x: 476, y: 514, t: "€0,00" }, { x: 521, y: 514, t: "€9,95" },
    { x: 52, y: 504, t: "PostNL verzending" },
    { x: 52, y: 488, t: "Betaalkosten" }, { x: 391, y: 488, t: "1x" }, { x: 417, y: 488, t: "0" },
    { x: 442, y: 488, t: "€0,00" }, { x: 476, y: 488, t: "€0,00" }, { x: 520, y: 488, t: "€0,00" },
    { x: 400, y: 452, t: "Total discount" }, { x: 517, y: 452, t: "€ 0,00" },
    { x: 400, y: 436, t: "Totaal excl. BTW" }, { x: 517, y: 436, t: "€32,15" },
    { x: 400, y: 420, t: "BTW 21%" }, { x: 517, y: 420, t: "€6,75" },
    { x: 400, y: 404, t: "Totaal incl. BTW" }, { x: 517, y: 404, t: "€38,90" },
    { x: 50, y: 340, t: "Bedrijfsgegevens" }, { x: 250, y: 340, t: "Bankgegevens" },
    { x: 50, y: 324, t: "KvK-nummer 54284198" }, { x: 250, y: 324, t: "Rekeninghouder Wijnhandel Voorbeeld" },
    { x: 50, y: 310, t: "Btw-nummer NL002051640B39" }, { x: 250, y: 310, t: "Bank Rabobank" },
    { x: 250, y: 296, t: "IBAN NL71 RABO 0169 2708 58" }, { x: 250, y: 282, t: "BIC RABONL2U" }
  ])],
  // Geen tekstlaag, alleen een vlak: zo ziet een scan eruit voor de tool.
  "gescand.pdf": [{ teken: "0.85 0.85 0.85 rg 64 500 468 260 re f\n0.6 0.6 0.6 rg 64 460 300 20 re f\n", regels: [] }]
};

for (const [naam, paginas] of Object.entries(bestanden)) {
  fs.writeFileSync(path.join(uit, naam), pdf(paginas));
  console.log(naam);
}
