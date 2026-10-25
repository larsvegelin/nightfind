/*
 * Test voor het aanwijzen in de extensie: het blauwe kader moet precies om het element
 * liggen waar de muis boven staat, en "Invullen" moet daarna een stap opleveren.
 * Draait met een echte Chromium met de extensie erin geladen.
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-aanw-'));

const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-aanw-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

// Een pagina zoals een echt portaal: een kaart met een zoekveld bovenin, daaronder veel
// ruimte, zodat een verkeerd geplaatst kader meteen opvalt. Ook een variant waarbij de
// pagina gescrold is.
const POORT = Number(process.env.PARSELAB_AANW_PORT || 9102);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Portaal</title>
<style>
 body { margin:0; font:15px system-ui; background:#FDF8EC; }
 .kop { height:120px; }
 .kaart { max-width:900px; margin:0 auto; background:#fff; padding:24px; border-radius:8px; }
 label { display:block; font-weight:600; margin-bottom:6px; }
 input, select { width:100%; box-sizing:border-box; padding:10px 12px; font:inherit; }
 .rij { display:flex; gap:12px; margin-top:12px; }
 .zoekvak { display:flex; align-items:center; gap:8px; border:1px solid #333; padding:6px; margin-top:12px; width:420px; }
 .zoekvak input { flex:1; border:0; }
 .vulling { height:900px; background:#E8EDE3; margin-top:24px; }
</style>
<div class="kop"></div>
<div class="kaart">
  <h2>Zoek een klant</h2>
  <form id="zoek">
    <label for="q">Op naam, contractnummer of postcode</label>
    <input id="q" name="zoekterm" type="text">
    <div class="rij"><input id="pc" name="postcode" type="text" placeholder="Postcode">
      <select id="soort" name="soort"><option>Particulier</option><option>Zakelijk</option></select></div>
    <div class="zoekvak" id="vak"><span id="icoon">&#128269;</span><input id="zoek2" name="zoekterm2" type="text"></div>
    <button id="zoekknop" type="button">Zoeken</button>
  </form>
</div>
<div class="vulling"></div>
<div class="kaart"><label for="onder">Veld ver onderaan</label><input id="onder" name="onderaan" type="text"></div>
<div class="vulling"></div>`;
const web = http.createServer((req, res2) => { res2.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res2.end(PAGINA); });
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
  catch (e) { ok('extensie geladen', false, 'geen service worker'); await ctx.close(); web.close(); process.exit(1); }
}

const p = await ctx.newPage();
await p.goto(site, { waitUntil: 'load' });
await p.bringToFront(); await p.waitForTimeout(250);
const tabId = await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t ? t.id : null; });
await sw.evaluate(async (i) => { await togglePanel({ id: i, url: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].url || undefined }); }, tabId);
await p.waitForSelector('#wt-scraper-host', { timeout: 15000 });
await p.waitForTimeout(800);
ok('paneel staat op de pagina', await p.locator('#wt-scraper-host').count() === 1);

// Klik in het paneel (shadow DOM) op "+ Stap toevoegen" → "Invullen".
async function kiesInvullen() {
  return await p.evaluate(() => {
    const r = document.getElementById('wt-scraper-host').shadowRoot;
    const toe = r.querySelector('#flow-add');
    if (!toe) return 'geen knop "Stap toevoegen"';
    toe.click();
    const invul = r.querySelector('[data-add="input"]');
    if (!invul) return 'geen knop Invullen';
    invul.click();
    return 'ok';
  });
}
const gekozen = await kiesInvullen();
ok('menu: Invullen aangeklikt', gekozen === 'ok', gekozen);
await p.waitForTimeout(400);

// Waar ligt het kader ten opzichte van het element waar de muis boven staat?
async function kaderVersus(sel) {
  const doel = await p.locator(sel).boundingBox();
  await p.mouse.move(doel.x + doel.width / 2, doel.y + doel.height / 2);
  await p.waitForTimeout(250);
  const kader = await p.evaluate(() => {
    const o = document.querySelector('.wt-ovl');
    if (!o) return null;
    const r = o.getBoundingClientRect();
    const zichtbaar = getComputedStyle(o).display !== 'none';
    return { x: r.left, y: r.top, w: r.width, h: r.height, zichtbaar };
  });
  return { doel, kader };
}

for (const [naam, sel] of [['tekstveld', '#q'], ['keuzelijst', '#soort'], ['knop', '#zoekknop']]) {
  const { doel, kader } = await kaderVersus(sel);
  const afstand = kader ? Math.round(Math.max(Math.abs(kader.x - doel.x), Math.abs(kader.y - doel.y))) : -1;
  ok('kader ligt op het ' + naam + ' (max 2 px afwijking)', !!kader && kader.zichtbaar && afstand <= 2,
     kader ? 'element ' + Math.round(doel.x) + ',' + Math.round(doel.y) + ' · kader ' + Math.round(kader.x) + ',' + Math.round(kader.y) + ' · afwijking ' + afstand + ' px' : 'geen kader');
}

// Ook als de pagina gescrold is moet het kader kloppen: een veld ver onderaan opzoeken.
await p.locator('#onder').scrollIntoViewIfNeeded();
await p.waitForTimeout(300);
{
  const scroll = await p.evaluate(() => Math.round(window.scrollY));
  const { doel, kader } = await kaderVersus('#onder');
  const afstand = kader ? Math.round(Math.max(Math.abs(kader.x - doel.x), Math.abs(kader.y - doel.y))) : -1;
  ok('kader klopt ook na scrollen', !!kader && kader.zichtbaar && afstand <= 2, 'scrollY ' + scroll + ' · afwijking ' + afstand + ' px');
}
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(200);

// En klikken moet een stap opleveren.
const voor = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps .wt-step, #flow-steps [data-i]').length);
const vak = await p.locator('#q').boundingBox();
await p.mouse.move(vak.x + vak.width / 2, vak.y + vak.height / 2);
await p.waitForTimeout(150);
await p.mouse.click(vak.x + vak.width / 2, vak.y + vak.height / 2);
await p.waitForTimeout(600);
const na = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps .wt-step, #flow-steps [data-i]').length);
const stapTekst = await p.evaluate(() => {
  const b = document.getElementById('wt-scraper-host').shadowRoot.querySelector('#flow-steps');
  return (b ? b.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 300);
});
ok('klik op het veld voegt een stap toe', na > voor, 'stappen ' + voor + ' → ' + na);
ok('de stap noemt het aangeklikte veld', /veld|zoekterm|naam/i.test(stapTekst), stapTekst.slice(0, 120));

// Net naast het veld klikken hoort ook te werken: op het label, en op het zoekicoon dat
// in hetzelfde vak staat. Dat is hoe een portaal er in het echt uitziet.
async function stapViaKlik(sel) {
  await kiesInvullen();
  await p.waitForTimeout(300);
  const voor2 = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps > *').length);
  const b = await p.locator(sel).boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await p.waitForTimeout(150);
  await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await p.waitForTimeout(500);
  const na2 = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps > *').length);
  const laatste = await p.evaluate(() => {
    const k = document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps > *');
    return k.length ? k[k.length - 1].textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : '';
  });
  return { erbij: na2 > voor2, laatste };
}
{
  const r1 = await stapViaKlik('label[for="q"]');
  ok('klik op het label geeft toch een stap', r1.erbij, r1.laatste);
  const r2 = await stapViaKlik('#icoon');
  ok('klik op het zoekicoon naast het veld geeft een stap', r2.erbij, r2.laatste);
}

fs.writeFileSync(hier + '/extensie-aanwijzen-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
