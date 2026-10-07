/*
 * Test voor "Velden ophalen": de knop leest de invulvelden die nu op de pagina staan
 * (ook in webcomponenten), laat ze zien, maakt er een invulstap van, en met een
 * geüploade lijst loopt de taak één keer per regel.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';

const res = [];
function ok(naam, cond, extra) { res.push((cond ? 'PASS ' : 'FAIL ') + naam + (extra !== undefined ? '  -> ' + String(extra).slice(0, 200) : '')); console.log(res[res.length - 1]); }

const hier = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const BRON = path.resolve(hier, '..', 'tools', 'extension');
const exe = process.env.PARSELAB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-veld-'));

const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-veld-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

// Een formulier zoals in een portaal: gewone velden, een keuzelijst, een veld in een
// webcomponent, en twee velden die niet meetellen (verborgen en weggestyled).
const POORT = Number(process.env.PARSELAB_VELD_PORT || 9106);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Formulier</title>
<style>body{margin:0;font:15px system-ui;background:#FDF8EC}.kaart{max-width:720px;margin:40px auto;background:#fff;padding:24px;border-radius:8px}
 label{display:block;font-weight:600;margin:10px 0 4px}input,select{font:inherit;padding:6px;width:100%;box-sizing:border-box}
 .weg{display:none}</style>
<div class="kaart">
  <h2>Nieuwe relatie</h2>
  <form id="f">
    <label for="naam">Naam</label><input id="naam" name="naam" type="text">
    <label for="email">E-mail</label><input id="email" name="email" type="text">
    <label for="soort">Soort</label><select id="soort" name="soort"><option>Particulier</option><option>Zakelijk</option></select>
    <asr-veld id="wc"></asr-veld>
    <input type="hidden" id="token" name="token" value="x">
    <div class="weg"><label for="verborgen">Verborgen</label><input id="verborgen" name="verborgen"></div>
  </form>
</div>
<script>
customElements.define('asr-veld', class extends HTMLElement {
  connectedCallback() {
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = ${JSON.stringify('<style>label{display:block;font-weight:600;margin:10px 0 4px}input{font:inherit;padding:6px;width:100%;box-sizing:border-box}</style>' +
      '<label for="pc">Postcode</label><input id="pc" name="postcode" type="text">')};
  }
});
<\/script>`;
const web = http.createServer((req, r2) => { r2.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r2.end(PAGINA); });
await new Promise(r => web.listen(POORT, '127.0.0.1', r));
const site = 'http://127.0.0.1:' + POORT + '/';

const start = exe ? { executablePath: exe } : { channel: 'chromium' };
const ctx = await chromium.launchPersistentContext(profiel, Object.assign({
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-sandbox'],
  viewport: { width: 1280, height: 900 }
}, start));
let sw = ctx.serviceWorkers()[0];
if (!sw) {
  try { sw = await ctx.waitForEvent('serviceworker', { timeout: 30000 }); }
  catch (e) { ok('extensie geladen', false, 'geen service worker'); await ctx.close(); web.close(); process.exit(1); }
}

const p = await ctx.newPage();
await p.goto(site, { waitUntil: 'load' });
await p.bringToFront(); await p.waitForTimeout(250);
const tabId = await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t ? t.id : null; });
await sw.evaluate(async (i) => { await togglePanel({ id: i, url: undefined }); }, tabId);
await p.waitForSelector('#wt-scraper-host', { timeout: 15000 });
await p.waitForTimeout(800);

const paneel = (sel) => p.evaluate((s) => {
  const el = document.getElementById('wt-scraper-host').shadowRoot.querySelector(s);
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
}, sel);
const klik = (sel) => p.evaluate((s) => {
  const el = document.getElementById('wt-scraper-host').shadowRoot.querySelector(s);
  if (!el) return false; el.click(); return true;
}, sel);

ok('knop "Velden ophalen" staat in het paneel', await p.evaluate(() => !!document.getElementById('wt-scraper-host').shadowRoot.querySelector('#flow-scan')));
ok('klik op Velden ophalen', await klik('#flow-scan'));
await p.waitForTimeout(500);

const kolommen = await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  return [...r.querySelectorAll('#flow-fields [data-veld]')].map(c => c.parentElement.querySelector('b').textContent.trim());
});
ok('de zichtbare velden zijn gevonden', kolommen.length === 4, kolommen.join(', '));
ok('het veld uit de webcomponent zit erbij', kolommen.some(k => /postcode/i.test(k)), kolommen.join(', '));
ok('de keuzelijst zit erbij', kolommen.some(k => /soort/i.test(k)), kolommen.join(', '));
ok('verborgen velden tellen niet mee', !kolommen.some(k => /verborgen|token/i.test(k)), kolommen.join(', '));

// "Laat zien waar dit veld staat" moet het veld in de webcomponent aanwijzen.
const pcIdx = kolommen.findIndex(k => /postcode/i.test(k));
await p.evaluate((i) => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  r.querySelector('[data-veldtoon="' + i + '"]').click();
}, pcIdx);
await p.waitForTimeout(500);
{
  const v = await p.evaluate(() => { const i = document.getElementById('wc').shadowRoot.querySelector('input'); const r = i.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const k = await p.evaluate(() => { const o = document.querySelector('.wt-ovl'); if (!o) return null; const r = o.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, zichtbaar: getComputedStyle(o).display !== 'none' }; });
  const afw = k ? Math.round(Math.max(Math.abs(k.x - v.x), Math.abs(k.y - v.y), Math.abs(k.w - v.w), Math.abs(k.h - v.h))) : -1;
  ok('"toon" wijst het veld in de webcomponent aan', !!k && k.zichtbaar && afw <= 2, 'afwijking ' + afw + ' px');
}

// Invulstap maken van de gevonden velden.
ok('klik op Maak invulstap', await klik('#velden-stap'));
await p.waitForTimeout(500);
const stapTekst = await paneel('#flow-steps');
ok('er staat een invulstap met alle velden', /4\/4 velden/.test(stapTekst || ''), (stapTekst || '').slice(0, 120));

// Lijst uploaden met twee regels en de taak draaien: één keer per regel.
const csv = kolommen.join(';') + '\n' +
  ['Jan Jansen', 'jan@example.nl', 'Particulier', '1234 AB'].join(';') + '\n' +
  ['Els de Vries', 'els@example.nl', 'Zakelijk', '5678 CD'].join(';') + '\n';
const csvPad = path.join(os.tmpdir(), 'pl-lijst.csv');
fs.writeFileSync(csvPad, csv);
await p.locator('#flow-file').setInputFiles(csvPad);
await p.waitForTimeout(700);
ok('de lijst is geladen', /2 regels|2 rijen|2 /.test(await paneel('#flow-csvinfo') || ''), await paneel('#flow-csvinfo'));

await klik('#flow-run');
// Bij de eerste keer invullen op een site vraagt ParseLab toestemming; die geven we.
await p.waitForTimeout(700);
const gevraagd = await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = [...r.querySelectorAll('button')].find(x => /^(ja|yes|oui|sí|si)$/i.test(x.textContent.trim()));
  if (!b) return false; b.click(); return true;
});
ok('toestemming voor deze site gevraagd en gegeven', gevraagd);

await p.waitForTimeout(6000);
const waarden = await p.evaluate(() => ({
  naam: document.getElementById('naam').value,
  email: document.getElementById('email').value,
  soort: document.getElementById('soort').value,
  pc: document.getElementById('wc').shadowRoot.querySelector('input').value
}));
ok('de laatste regel is ingevuld in de gewone velden', waarden.naam === 'Els de Vries' && waarden.email === 'els@example.nl', JSON.stringify(waarden));
ok('ook de keuzelijst en het veld in de webcomponent zijn gevuld', waarden.soort === 'Zakelijk' && waarden.pc === '5678 CD', JSON.stringify(waarden));

fs.writeFileSync(hier + '/extensie-velden-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
