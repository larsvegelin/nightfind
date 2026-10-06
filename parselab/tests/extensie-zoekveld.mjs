/*
 * Test voor een zoekveld met suggesties (typeahead-combobox), zoals portalen die
 * gebruiken: <input type="search" role="combobox" aria-autocomplete="list"> met een
 * willekeurig id, een label dat er los boven staat, en een suggestielijst die PAS
 * verschijnt nadat je hebt getypt.
 *
 * Dit is precies het geval waarin "vullen" eerder niets deed: de oude code klikte het
 * veld alleen aan en wachtte op opties die zonder typen nooit komen.
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-zoek-'));

const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-zoek-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

// De pagina: het label staat los boven het veld (geen for=), het id is willekeurig,
// en de suggesties komen alleen na een input-event met minstens 3 tekens.
const POORT = Number(process.env.PARSELAB_ZOEK_PORT || 9108);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Klant zoeken</title>
<style>body{margin:0;font:15px system-ui;background:#FDF8EC}.kaart{max-width:640px;margin:40px auto;background:#fff;padding:24px;border-radius:8px}
 .lbl{display:block;font-weight:600;margin:0 0 6px}input{font:inherit;padding:8px;width:100%;box-sizing:border-box}
 #results-listbox{list-style:none;margin:4px 0 0;padding:0;border:1px solid #ccc;display:none}
 #results-listbox[data-open="1"]{display:block}
 #results-listbox li{padding:8px;cursor:pointer}
 #gekozen{margin-top:16px;color:#215A88;font-weight:600}</style>
<div class="kaart">
  <h2>Klant zoeken</h2>
  <span class="lbl" id="lbl-klant">Zoek een klant</span>
  <input data-validation-target="" data-testid="input" aria-labelledby="lbl-klant" aria-describedby="error description"
         id="id-4724c70a-59e2-44a9-b7d8-08a6e54da571" class="asr-text-md" type="search" inputmode="search"
         autocomplete="off" aria-invalid="false" role="combobox" aria-haspopup="listbox" aria-autocomplete="list"
         aria-expanded="false" aria-controls="results-listbox">
  <ul id="results-listbox" role="listbox"></ul>
  <div id="gekozen"></div>
  <div id="description">Zoek op klantnummer of naam.</div>
  <div id="error"></div>
</div>
<script>
const KLANTEN = [
  { nr: '7552439005', naam: 'Jansen Verzekeringen BV' },
  { nr: '7552439099', naam: 'De Vries Holding' }
];
const inp = document.getElementById('id-4724c70a-59e2-44a9-b7d8-08a6e54da571');
const lijst = document.getElementById('results-listbox');
// Zoals een echte autocomplete: de lijst komt pas na getypte invoer (input-event),
// met een kleine vertraging alsof de server hem ophaalt.
let timer = null;
inp.addEventListener('input', () => {
  const q = inp.value.trim();
  clearTimeout(timer);
  if (q.length < 3) { lijst.removeAttribute('data-open'); lijst.innerHTML = ''; inp.setAttribute('aria-expanded', 'false'); return; }
  timer = setTimeout(() => {
    const treffers = KLANTEN.filter(k => k.nr.startsWith(q) || k.naam.toLowerCase().includes(q.toLowerCase()));
    lijst.innerHTML = treffers.map(k => '<li role="option" data-nr="' + k.nr + '">' + k.nr + ' — ' + k.naam + '</li>').join('');
    if (treffers.length) { lijst.setAttribute('data-open', '1'); inp.setAttribute('aria-expanded', 'true'); }
    else { lijst.removeAttribute('data-open'); inp.setAttribute('aria-expanded', 'false'); }
  }, 120);
});
lijst.addEventListener('click', e => {
  const li = e.target.closest('li[role=option]'); if (!li) return;
  const k = KLANTEN.find(x => x.nr === li.dataset.nr);
  inp.value = k.naam;
  lijst.removeAttribute('data-open'); lijst.innerHTML = '';
  inp.setAttribute('aria-expanded', 'false');
  document.getElementById('gekozen').textContent = 'Gekozen: ' + k.nr;
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

// 1. Velden ophalen moet het zoekveld vinden en de kolom naar het zichtbare label noemen.
ok('klik op Velden ophalen', await klik('#flow-scan'));
await p.waitForTimeout(500);
const kolommen = await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  return [...r.querySelectorAll('#flow-fields [data-veld]')].map(c => c.parentElement.querySelector('b').textContent.trim());
});
ok('het zoekveld is gevonden', kolommen.length === 1, kolommen.join(', '));
ok('de kolom heet naar het label op het scherm, niet naar het willekeurige id', kolommen[0] === 'Zoek een klant', kolommen[0]);

// 2. Invulstap maken en de lijst van de gebruiker uploaden (één kolom, één regel).
ok('klik op Maak invulstap', await klik('#velden-stap'));
await p.waitForTimeout(400);
ok('er staat een invulstap', /1\/1 velden/.test(await paneel('#flow-steps') || ''), (await paneel('#flow-steps') || '').slice(0, 120));

const csvPad = path.join(os.tmpdir(), 'pl-invullijst.csv');
fs.writeFileSync(csvPad, 'Zoek een klant\n7552439005\n');
await p.locator('#flow-file').setInputFiles(csvPad);
await p.waitForTimeout(700);
ok('de invullijst is geladen', /1 regel|1 rij|1 /.test(await paneel('#flow-csvinfo') || ''), await paneel('#flow-csvinfo'));

// 3. Draaien: het nummer wordt getypt, de suggestie wordt gekozen.
await klik('#flow-run');
await p.waitForTimeout(700);
await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = [...r.querySelectorAll('button')].find(x => /^(ja|yes|oui|sí|si)$/i.test(x.textContent.trim()));
  if (b) b.click();
});
await p.waitForTimeout(7000);

const st = await p.evaluate(() => ({
  waarde: document.querySelector('input[role=combobox]').value,
  gekozen: document.getElementById('gekozen').textContent,
  lijstOpen: document.getElementById('results-listbox').hasAttribute('data-open')
}));
ok('het nummer is in het zoekveld getypt en de suggestie is gekozen', st.gekozen === 'Gekozen: 7552439005', JSON.stringify(st));
ok('het veld staat op de gekozen klant', st.waarde === 'Jansen Verzekeringen BV', st.waarde);
ok('de suggestielijst is daarna weer dicht', !st.lijstOpen, String(st.lijstOpen));
ok('de taak meldt het veld als gevuld', !/niet gevuld|overgeslagen/i.test(await paneel('#flow-log') || ''), (await paneel('#flow-log') || '').slice(-160));

fs.writeFileSync(hier + '/extensie-zoekveld-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
