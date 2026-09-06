import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const map = path.join(here, 'proef');
execFileSync(process.execPath, [path.join(here, 'webflow-proef.mjs'), map], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(here, '..', 'webflow', 'bouw-pagina.mjs'), path.join(map, 'ParsePDF.html')], { stdio: 'inherit' });

const TYPE = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.pdf':'application/pdf' };
const srv = http.createServer((req, res) => {
  if (req.url.startsWith('/favicon.ico')) { res.writeHead(204); return res.end(); }
  const p = path.join(map, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(map) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('nee'); }
  res.writeHead(200, { 'content-type': TYPE[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => srv.listen(8123, '127.0.0.1', r));
const BASIS = 'http://127.0.0.1:8123/index.html';

const res = []; const errs = [];
function ok(n, c, x) { res.push((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  -> ' + String(x).slice(0, 160) : '')); console.log(res.at(-1)); }

const exe = fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const b = await chromium.launch({ ...exe, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('[pageerror] ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_/.test(m.text())) errs.push('[console] ' + m.text().slice(0, 140)); });

// 1. zonder sessie hoort de bezoeker naar de inlogpagina
await p.goto(BASIS + '?ingelogd=0', { waitUntil: 'load' });
await p.waitForURL(/inloggen\.html/, { timeout: 5000 }).catch(() => {});
ok('zonder sessie stuurt de pagina door naar inloggen', /inloggen\.html/.test(p.url()), p.url());

// 2. ingelogd: kop, verbruiksmeter en de standaardregels
await p.goto(BASIS + '?gebruikt=120&limiet=2500', { waitUntil: 'load' });
await p.waitForSelector('.pld-title', { timeout: 8000 });
await p.evaluate(() => localStorage.removeItem('pl_parsepdf_regels'));
await p.reload({ waitUntil: 'load' });
await p.waitForSelector('.plp-drop', { timeout: 8000 });
ok('titel en ondertitel staan er', await p.textContent('.pld-title') === 'ParsePDF');
const meter = await p.evaluate(() => {
  const b = document.querySelector('.pld-bar');
  return { num: document.querySelector('.pld-num').textContent, now: b && b.getAttribute('aria-valuenow'), max: b && b.getAttribute('aria-valuemax'), rol: b && b.getAttribute('role') };
});
ok('verbruiksmeter toont gebruik van limiet', meter.num.includes('120') && meter.num.includes('2.500') && meter.now === '120' && meter.max === '2500' && meter.rol === 'progressbar', JSON.stringify(meter));
const regels0 = await p.evaluate(() => window.PLP_S.regels.map(r => r.naam).join(','));
ok('sjabloon Facturen staat klaar als eerste regelset', regels0 === 'Factuurnummer,Datum,Totaal,BTW,Bestand', regels0);
ok('terugknop wijst naar het dashboard', (await p.getAttribute('.pld-head a', 'href')).includes('dashboard'));

// 3. uitlezen van twee facturen
await p.setInputFiles('input[type=file]', [path.join(map, 'factuur-a.pdf'), path.join(map, 'factuur-b.pdf')]);
await p.waitForSelector('.plp-file', { timeout: 5000 });
ok('gekozen bestanden staan in de lijst', (await p.$$('.plp-file')).length === 2);
await p.click('button:has-text("Uitlezen starten")');
await p.waitForSelector('.plp-table', { timeout: 30000 });
const tabel = await p.evaluate(() => [...document.querySelectorAll('.plp-table tr')].map(tr => [...tr.children].map(td => td.textContent)));
ok('kopregel: bestand, pagina\'s en elke veldregel', tabel[0].join('|') === "Bestand|Pagina's|Factuurnummer|Datum|Totaal|BTW|Bestand", tabel[0].join('|'));
ok('twee rijen, één per document', tabel.length === 3, tabel.length);
const a = tabel[1];
ok('factuurnummer uit het label gehaald', a[2] === '2026-118', a[2]);
ok('datum opgeschoond tot alleen de datum', a[3] === '12-03-2026', a[3]);
ok('Totaal pakt het eindbedrag, niet het subtotaal', a[4] === '1.506,45', a[4]);
ok('BTW-bedrag los van het percentage', a[5] === '262,28', a[5]);
ok('bestandsnaam als eigen kolom', a[6] === 'factuur-a.pdf', a[6]);
ok('paginateller klopt (twee pagina\'s)', a[1] === '2', a[1]);
ok('tweede document ook gelezen', tabel[2][4] === '968,00' && tabel[2][1] === '1', tabel[2].join('|'));

// 4. verbruik is geboekt vóór het lezen, met het juiste aantal pagina's
const aanroep = await p.evaluate(() => JSON.stringify(window.PL_STUB_CALLS));
ok('record_usage is aangeroepen met drie pagina\'s', /record_usage/.test(aanroep) && /"p_pages":3/.test(aanroep), aanroep);
ok('de meter loopt meteen mee (120 + 3)', (await p.textContent('.pld-num')).includes('123'), await p.textContent('.pld-num'));

// 5. CSV: puntkomma's, BOM en dezelfde kolommen
const [dl] = await Promise.all([
  p.waitForEvent('download'),
  p.click('button:has-text("Download CSV")')
]);
const csvPad = path.join(map, 'uit.csv');
await dl.saveAs(csvPad);
const csv = fs.readFileSync(csvPad);
const tekst = csv.toString('utf8').replace(/^\uFEFF/, '');
ok('CSV heet parselab-export.csv', dl.suggestedFilename() === 'parselab-export.csv', dl.suggestedFilename());
ok('CSV begint met een UTF-8 BOM', csv[0] === 0xEF && csv[1] === 0xBB && csv[2] === 0xBF);
ok('CSV scheidt met puntkomma\'s', tekst.split('\r\n')[0] === "Bestand;Pagina's;Factuurnummer;Datum;Totaal;BTW;Bestand", tekst.split('\r\n')[0]);
ok('CSV bevat het eindbedrag', tekst.includes(';1.506,45;'), tekst.split('\r\n')[1]);

// 6. regels bewaren en terughalen uit deze browser
await p.evaluate(() => { window.PLP_S.regels = [{ naam: 'Kenmerk', type: 'regex', waarde: 'NL\\d{2}[A-Z]{4}\\d+', filter: 'geen' }]; window.PLP_UI.teken(); });
await p.click('button:has-text("Regels bewaren")');
await p.reload({ waitUntil: 'load' });
await p.waitForSelector('.plp-drop', { timeout: 8000 });
const bewaard = await p.evaluate(() => window.PLP_S.regels.map(r => r.naam).join(','));
ok('bewaarde regels komen terug na herladen', bewaard === 'Kenmerk', bewaard);

// 7. patroon met haakjesgroep leest de IBAN van pagina twee
await p.setInputFiles('input[type=file]', [path.join(map, 'factuur-a.pdf')]);
await p.waitForSelector('.plp-file', { timeout: 5000 });
await p.click('button:has-text("Uitlezen starten")');
await p.waitForSelector('.plp-table', { timeout: 30000 });
const iban = await p.evaluate(() => document.querySelectorAll('.plp-table tbody td')[2].textContent);
ok('regex vindt de IBAN op de tweede pagina', iban === 'NL91ABNA0417164300', iban);

// 8. document zonder tekstlaag geeft een nette melding
await p.setInputFiles('input[type=file]', [path.join(map, 'gescand.pdf')]);
await p.waitForSelector('.plp-file', { timeout: 5000 });
await p.click('button:has-text("Uitlezen starten")');
await p.waitForSelector('.pld-msg--warn', { timeout: 30000 });
const melding = await p.textContent('.pld-msg--warn');
ok('melding over ontbrekende tekstlaag', /tekstlaag/.test(melding), melding);

// 9. limietbewaking: te grote batch wordt vooraf tegengehouden
await p.goto(BASIS + '?gebruikt=49&limiet=50', { waitUntil: 'load' });
await p.waitForSelector('.plp-drop', { timeout: 8000 });
await p.setInputFiles('input[type=file]', [path.join(map, 'factuur-a.pdf'), path.join(map, 'factuur-b.pdf')]);
await p.click('button:has-text("Uitlezen starten")');
await p.waitForSelector('.pld-card--navy', { timeout: 30000 });
const kaart = await p.textContent('.pld-card--navy');
ok('limietkaart noemt batch en rest', /3 pagina/.test(kaart) && /1 over/.test(kaart.replace(/\s+/g, ' ')), kaart.replace(/\s+/g, ' ').slice(0, 120));
const naLimiet = await p.evaluate(() => window.PL_STUB_CALLS.filter(c => c.naam === 'record_usage').length);
ok('bij overschrijding wordt niets geboekt', naLimiet === 0, naLimiet);
ok('startknop is weer bruikbaar na de weigering', await p.evaluate(() => !([...document.querySelectorAll('button')].find(b => /Uitlezen starten/.test(b.textContent)) || {}).disabled));

// 10. andere taal uit het profiel
await p.goto(BASIS + '?taal=en', { waitUntil: 'load' });
await p.waitForSelector('.plp-drop', { timeout: 8000 });
ok('profieltaal en stuurt de teksten en het lang-attribuut', (await p.textContent('.pld-sub')).startsWith('Pull fields') && await p.evaluate(() => document.documentElement.lang) === 'en');

// 11. smal scherm: geen horizontale schuif, velden onder elkaar, tabel scrolt zelf
await p.goto(BASIS, { waitUntil: 'load' });
await p.waitForSelector('.plp-drop', { timeout: 8000 });
await p.setViewportSize({ width: 375, height: 900 });
await p.waitForTimeout(300);
const smal = await p.evaluate(() => ({
  schuif: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  kolommen: getComputedStyle(document.querySelector('.plp-rule')).gridTemplateColumns.split(' ').length,
  knop: Math.round(document.querySelector('.pld-btn').getBoundingClientRect().height)
}));
ok('geen horizontale schuif op 375px', smal.schuif <= 0, smal.schuif);
ok('regelvelden staan onder elkaar op 375px', smal.kolommen === 1, smal.kolommen);
ok('knoppen blijven minstens 44px hoog', smal.knop >= 44, smal.knop);

// 12. de losse pagina uit bouw-pagina.mjs: zelfde embeds, echte cdn-adressen.
// Die adressen zijn hier onbereikbaar, dus ze worden onderweg vervangen door de lokale kopie.
const p2 = await ctx.newPage();
const fouten2 = [];
p2.on('pageerror', e => fouten2.push(e.message));
async function stuurOm(patroon, bestand, type) {
  await p2.route(patroon, r => r.fulfill({ status: 200, contentType: type, body: fs.readFileSync(path.join(map, bestand)) }));
}
await stuurOm('**/@supabase/**', 'supabase-stub.js', 'text/javascript');
await stuurOm('**/pdf.min.js', 'pdf.min.js', 'text/javascript');
await stuurOm('**/pdf.worker.min.js', 'pdf.worker.min.js', 'text/javascript');
await p2.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p2.goto('http://127.0.0.1:8123/ParsePDF.html?gebruikt=10&limiet=100', { waitUntil: 'load' });
await p2.evaluate(() => localStorage.removeItem('pl_parsepdf_regels'));
await p2.reload({ waitUntil: 'load' });
await p2.waitForSelector('.plp-drop', { timeout: 8000 });
ok('losse pagina toont ParsePDF met verbruiksmeter', await p2.textContent('.pld-title') === 'ParsePDF' && (await p2.textContent('.pld-num')).includes('10 van 100'));
ok('losse pagina staat niet in Google', await p2.getAttribute('meta[name=robots]', 'content') === 'noindex, nofollow');
await p2.setInputFiles('input[type=file]', [path.join(map, 'factuur-b.pdf')]);
await p2.click('button:has-text("Uitlezen starten")');
await p2.waitForSelector('.plp-table', { timeout: 30000 });
const los = await p2.evaluate(() => [...document.querySelectorAll('.plp-table tbody td')].map(td => td.textContent).join('|'));
ok('losse pagina leest een factuur uit', los.includes('2026-119') && los.includes('968,00'), los);
ok('geen JS-fouten op de losse pagina', fouten2.length === 0, fouten2.slice(0, 2).join(' || '));

ok('geen JS-fouten', errs.length === 0, errs.slice(0, 3).join(' || '));
await b.close();
srv.close();
const fout = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fout.length) + '/' + res.length + ' goed');
process.exit(fout.length ? 1 : 0);
