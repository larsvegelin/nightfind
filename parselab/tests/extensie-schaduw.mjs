/*
 * Test voor velden in een webcomponent (shadow DOM), zoals verzekeraarsportalen die
 * gebruiken. Zo'n veld zit niet in de gewone pagina: een klik levert de buitenkant op en
 * document.querySelector kijkt er niet in. Deze test controleert dat het aanwijzen toch
 * het échte veld pakt, dat er een stap komt, en dat de stap het veld later terugvindt.
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-sch-'));

// activeTab geldt alleen bij een echte klik op het icoon; daarom een kopie met de testsite
// vast in het manifest. De geteste code is dezelfde.
const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-sch-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

// Het veld uit de praktijk: een zoekveld met role="combobox" in een webcomponent.
const VELD = '<input data-validation-target="" data-testid="input" aria-describedby="error description" id="id-87923b44-b7c0-46d9-874f-437dae247826" class="asr-text-md" type="search" inputmode="search" autocomplete="off" aria-invalid="false" role="combobox" aria-haspopup="listbox" aria-autocomplete="list" aria-expanded="false" aria-controls="results-listbox">';
const POORT = Number(process.env.PARSELAB_SCHADUW_PORT || 9104);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Portaal met webcomponenten</title>
<style>body{margin:0;font:15px system-ui;background:#FDF8EC} .kaart{max-width:760px;margin:40px auto;background:#fff;padding:24px;border-radius:8px}
 input{font:inherit}</style>
<div class="kaart">
  <h2>Zoek een relatie</h2>
  <asr-zoekveld id="zoek"></asr-zoekveld>
  <p><label for="gewoon">Gewoon veld</label><input id="gewoon" name="postcode" type="text"></p>
</div>
<script>
customElements.define('asr-zoekveld', class extends HTMLElement {
  connectedCallback() {
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = ${JSON.stringify(
      '<style>.wrap{border:1px solid #333;border-radius:4px;padding:10px;display:flex;gap:8px;align-items:center}' +
      'label{display:block;font-weight:600;margin-bottom:6px}input{flex:1;border:0;outline:0;font:inherit}</style>' +
      '<label for="id-87923b44-b7c0-46d9-874f-437dae247826">Zoek op naam of nummer</label>' +
      '<div class="wrap"><span class="icoon">&#128269;</span>' + VELD + '</div>')};
  }
});
<\/script>`;
const web = http.createServer((req, r2) => { r2.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r2.end(PAGINA); });
await new Promise(r => web.listen(POORT, '127.0.0.1', r));
const site = 'http://127.0.0.1:' + POORT + '/';

const start = exe ? { executablePath: exe } : { channel: 'chromium' };
const ctx = await chromium.launchPersistentContext(profiel, Object.assign({
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-sandbox'],
  viewport: { width: 1280, height: 800 }
}, start));
let sw = ctx.serviceWorkers()[0];
if (!sw) {
  try { sw = await ctx.waitForEvent('serviceworker', { timeout: 30000 }); }
  catch (e) { ok('extensie geladen', false, 'geen service worker; draait dit op de headless shell?'); await ctx.close(); web.close(); process.exit(1); }
}

const p = await ctx.newPage();
await p.goto(site, { waitUntil: 'load' });
await p.bringToFront(); await p.waitForTimeout(250);
const tabId = await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t ? t.id : null; });
await sw.evaluate(async (i) => { await togglePanel({ id: i, url: undefined }); }, tabId);
await p.waitForSelector('#wt-scraper-host', { timeout: 15000 });
await p.waitForTimeout(800);
ok('paneel staat op de pagina', await p.locator('#wt-scraper-host').count() === 1);

// Waar staat het veld binnen de webcomponent?
const vakje = () => p.evaluate(() => {
  const i = document.getElementById('zoek').shadowRoot.querySelector('input');
  const r = i.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
});
async function kiesInvullen() {
  return await p.evaluate(() => {
    const r = document.getElementById('wt-scraper-host').shadowRoot;
    const t = r.querySelector('#flow-add'); if (!t) return 'geen knop toevoegen';
    t.click();
    const v = r.querySelector('[data-add="input"]'); if (!v) return 'geen knop Invullen';
    v.click(); return 'ok';
  });
}
const kader = () => p.evaluate(() => {
  const o = document.querySelector('.wt-ovl'); if (!o) return null;
  const r = o.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, zichtbaar: getComputedStyle(o).display !== 'none' };
});
const stappen = () => p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps [data-show]').length);
const logtekst = () => p.evaluate(() => (document.getElementById('wt-scraper-host').shadowRoot.querySelector('#flow-log')?.textContent || '').replace(/\s+/g, ' ').trim());

ok('menu: Invullen aangeklikt', (await kiesInvullen()) === 'ok');
await p.waitForTimeout(350);

const v = await vakje();
await p.mouse.move(v.x + v.w / 2, v.y + v.h / 2);
await p.waitForTimeout(250);
{
  const k = await kader();
  const afw = k ? Math.round(Math.max(Math.abs(k.x - v.x), Math.abs(k.y - v.y), Math.abs(k.w - v.w), Math.abs(k.h - v.h))) : -1;
  ok('kader ligt op het veld in de webcomponent (max 2 px)', !!k && k.zichtbaar && afw <= 2,
     k ? 'veld ' + Math.round(v.x) + ',' + Math.round(v.y) + ' ' + Math.round(v.w) + '×' + Math.round(v.h) + ' · kader ' + Math.round(k.x) + ',' + Math.round(k.y) + ' ' + Math.round(k.w) + '×' + Math.round(k.h) : 'geen kader');
}

const voor = await stappen();
await p.mouse.click(v.x + v.w / 2, v.y + v.h / 2);
await p.waitForTimeout(600);
const na = await stappen();
ok('klik op het veld in de webcomponent geeft een stap', na === voor + 1, 'stappen ' + voor + ' → ' + na);
ok('geen melding "Geen invoerveld herkend"', !/Geen invoerveld herkend/i.test(await logtekst()), (await logtekst()).slice(0, 80));

const tekst = await p.evaluate(() => {
  const k = [...document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps [data-show]')].map(b => b.closest('[data-i], .wt-step') || b.parentElement);
  return k.length ? k[k.length - 1].textContent.replace(/\s+/g, ' ').trim() : '';
});
ok('de stap gebruikt het label uit de webcomponent', /zoek op naam/i.test(tekst), tekst.slice(0, 90));

// "Toon" moet het veld terugvinden — dat lukt alleen als de selector de grens van de
// webcomponent oversteekt.
await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = [...r.querySelectorAll('[data-show]')].pop(); if (b) b.click();
});
await p.waitForTimeout(500);
{
  const k = await kader(); const v2 = await vakje();
  const afw = k ? Math.round(Math.max(Math.abs(k.x - v2.x), Math.abs(k.y - v2.y), Math.abs(k.w - v2.w), Math.abs(k.h - v2.h))) : -1;
  ok('de stap vindt het veld later terug (Toon)', !!k && k.zichtbaar && afw <= 2, 'afwijking ' + afw + ' px');
}

// Ook op de buitenkant van de component klikken hoort te werken: dat is wat je in de
// praktijk raakt als je net naast het invoervak klikt.
await p.waitForTimeout(400);
ok('menu opnieuw: Invullen', (await kiesInvullen()) === 'ok');
await p.waitForTimeout(300);
{
  const voor2 = await stappen();
  const b = await p.locator('#zoek').boundingBox();
  await p.mouse.move(b.x + 6, b.y + 6);
  await p.waitForTimeout(150);
  await p.mouse.click(b.x + 6, b.y + 6);
  await p.waitForTimeout(600);
  ok('klik op de rand van de component geeft ook een stap', (await stappen()) === voor2 + 1, await logtekst());
}

// Een gewoon veld op dezelfde pagina blijft werken.
await kiesInvullen();
await p.waitForTimeout(300);
{
  const voor3 = await stappen();
  const b = await p.locator('#gewoon').boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await p.waitForTimeout(150);
  const k = await kader();
  const afw = k ? Math.round(Math.max(Math.abs(k.x - b.x), Math.abs(k.y - b.y))) : -1;
  await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await p.waitForTimeout(600);
  ok('gewoon veld: kader klopt nog steeds', afw >= 0 && afw <= 2, 'afwijking ' + afw + ' px');
  ok('gewoon veld: klik geeft een stap', (await stappen()) === voor3 + 1);
}

fs.writeFileSync(hier + '/extensie-schaduw-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
