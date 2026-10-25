/*
 * Test voor de schermindeling van het paneel: een balk tegen de rechterrand over de
 * volle schermhoogte, met de pagina die ernaast opschuift, en een versleepbare breedte.
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-balk-'));

const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-balk-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

const POORT = Number(process.env.PARSELAB_BALK_PORT || 9112);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Pagina</title>
<style>body{margin:0;font:15px system-ui}#blok{background:#DCE8F2;padding:20px}</style>
<div id="blok">Inhoud van de pagina</div>`;
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
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ' + m.text().slice(0, 300)); });
p.on('pageerror', e => console.log('PAGEERROR ' + String(e).slice(0, 300)));
await p.goto(site, { waitUntil: 'load' });
await p.bringToFront(); await p.waitForTimeout(250);
const tabId = await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t ? t.id : null; });
await sw.evaluate(async (i) => { await togglePanel({ id: i, url: undefined }); }, tabId);
await p.waitForSelector('#wt-scraper-host', { timeout: 15000 });
await p.waitForTimeout(900);

const meet = () => p.evaluate(() => {
  const h = document.getElementById('wt-scraper-host');
  const r = h.getBoundingClientRect();
  const card = h.shadowRoot.querySelector('.wt-card').getBoundingClientRect();
  const body = h.shadowRoot.querySelector('.wt-body').getBoundingClientRect();
  return {
    top: Math.round(r.top), hoogte: Math.round(r.height), breedte: Math.round(r.width),
    rechts: Math.round(window.innerWidth - r.right),
    vh: window.innerHeight, vw: window.innerWidth,
    kaart: Math.round(card.height), lijf: Math.round(body.height),
    marge: getComputedStyle(document.documentElement).marginRight,
    blok: Math.round(document.getElementById('blok').getBoundingClientRect().right)
  };
});

const m = await meet();
ok('de balk staat tegen de rechterrand', m.rechts === 0, 'afstand rechts ' + m.rechts + ' px');
ok('de balk is over de volle schermhoogte', m.top === 0 && Math.abs(m.hoogte - m.vh) <= 1, 'top ' + m.top + ', hoogte ' + m.hoogte + ' van ' + m.vh);
ok('de kaart erin vult die hoogte ook', Math.abs(m.kaart - m.vh) <= 2, m.kaart + ' van ' + m.vh);
ok('het werkgedeelte vult het grootste deel van het scherm', m.lijf > m.vh * 0.6, m.lijf + ' van ' + m.vh);
ok('de pagina schuift ernaast op', m.marge === m.breedte + 'px', 'marge ' + m.marge + ', balk ' + m.breedte + ' px');
ok('de pagina-inhoud loopt niet onder de balk door', m.blok <= m.vw - m.breedte + 1, 'inhoud tot ' + m.blok + ', balk begint op ' + (m.vw - m.breedte));

// Breedte slepen aan de greep.
const greep = await p.evaluate(() => {
  const g = document.getElementById('wt-scraper-host').shadowRoot.querySelector('.wt-grip').getBoundingClientRect();
  return { x: Math.round(g.left + g.width / 2), y: Math.round(g.top + 200) };
});
await p.mouse.move(greep.x, greep.y);
await p.mouse.down();
await p.mouse.move(greep.x - 160, greep.y, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(400);
const breed = await meet();
ok('slepen maakt de balk breder', breed.breedte >= m.breedte + 120, 'van ' + m.breedte + ' naar ' + breed.breedte + ' px');
ok('de pagina schuift mee bij het slepen', breed.marge === breed.breedte + 'px', 'marge ' + breed.marge);

// Paneel wegklappen: de pagina moet zijn volle breedte terugkrijgen.
await sw.evaluate(async (i) => { await togglePanel({ id: i, url: undefined }); }, tabId);
await p.waitForTimeout(500);
const weg = await p.evaluate(() => {
  const h = document.getElementById('wt-scraper-host');
  return {
    // Het paneel kan verborgen worden of helemaal verwijderd; beide is "weg".
    zichtbaar: h ? getComputedStyle(h).display : 'verwijderd',
    marge: getComputedStyle(document.documentElement).marginRight,
    blok: Math.round(document.getElementById('blok').getBoundingClientRect().right),
    vw: window.innerWidth
  };
});
ok('weggeklapt is het paneel weg', weg.zichtbaar === 'none' || weg.zichtbaar === 'verwijderd', weg.zichtbaar);
ok('en krijgt de pagina haar volle breedte terug', weg.blok >= weg.vw - 1, 'inhoud tot ' + weg.blok + ' van ' + weg.vw + ', marge ' + weg.marge);

fs.writeFileSync(hier + '/extensie-balk-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
