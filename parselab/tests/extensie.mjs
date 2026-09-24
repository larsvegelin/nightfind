/*
 * Test voor de browserextensie: opent het paneel bij een klik op het icoon, ook als de
 * bewaarde vlag nog van een ander tabblad of een vorige sessie komt. Draait met een echte
 * Chromium met de extensie erin geladen; de klik op het icoon bootsen we na door dezelfde
 * functie aan te roepen die de browser bij een klik aanroept (togglePanel).
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-ext-'));

// activeTab geldt alleen bij een echte muisklik op het icoon; een test kan die klik niet
// geven. Daarom draait de test op een kopie die de testsite vast in het manifest heeft.
// De code die we testen (welke tak een klik kiest) is in beide gevallen dezelfde.
const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-ext-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

// Een gewone website in een tabblad. Een data:-URL kan niet, dus zetten we zelf een
// minimale pagina neer; zo heeft de test niets van buiten nodig.
const POORT = Number(process.env.PARSELAB_EXT_PORT || 9100);
const web = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><title>Testsite</title><h1>Testpagina</h1><form><input name="naam"></form>');
});
await new Promise(r => web.listen(POORT, '127.0.0.1', r));
const site = 'http://127.0.0.1:' + POORT + '/';

// Belangrijk: de standaard headless-browser van Playwright ("headless shell") laadt geen
// extensies. Met een eigen pad pakken we de volle Chromium; anders vragen we met channel om
// de volle Chromium in plaats van die shell. Zonder dit start de service worker nooit.
const start = exe ? { executablePath: exe } : { channel: 'chromium' };
const ctx = await chromium.launchPersistentContext(profiel, Object.assign({
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-sandbox'],
  viewport: { width: 1280, height: 900 }
}, start));

// De service worker van de extensie; die draait het achtergrondscript.
let sw = ctx.serviceWorkers()[0];
if (!sw) {
  try { sw = await ctx.waitForEvent('serviceworker', { timeout: 30000 }); }
  catch (e) {
    ok('extensie geladen (service worker draait)', false, 'geen service worker; draait dit op de headless shell in plaats van de volle Chromium?');
    await ctx.close(); web.close(); process.exit(1);
  }
}
ok('extensie geladen (service worker draait)', !!sw, sw && sw.url());

const p = await ctx.newPage();
await p.goto(site, { waitUntil: 'load' });

// Zonder het "tabs"-recht komen tabbladen zonder adres terug; de browser geeft bij een
// echte klik het adres wel mee (activeTab). We bootsen beide vormen na.
async function actiefTabId(page) {
  await page.bringToFront();
  await page.waitForTimeout(250);
  return await sw.evaluate(async () => {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    return t ? t.id : null;
  });
}
async function klikOpIcoon(id, url) { await sw.evaluate(async ([i, u]) => { await togglePanel({ id: i, url: u }); }, [id, url]); }
async function zetVlag(v) { await sw.evaluate(async (x) => { await chrome.storage.local.set({ 'wt-active': x }); }, v); }
async function leesVlag() { return await sw.evaluate(async () => (await chrome.storage.local.get('wt-active'))['wt-active']); }
const paneelZichtbaar = async () => (await p.locator('#wt-scraper-host').count()) === 1 && await p.locator('#wt-scraper-host').isVisible();

const id = await actiefTabId(p);
ok('tabblad gevonden', !!id, id);

// De gemelde fout: de vlag staat nog "aan" van elders, het paneel draait hier niet.
await zetVlag(true);
await klikOpIcoon(id, site);
await p.waitForTimeout(1200);
ok('klik opent het paneel ondanks een blijven hangen "aan"-vlag', await paneelZichtbaar());

// Tweede klik sluit het, derde klik opent het weer.
await klikOpIcoon(id, site); await p.waitForTimeout(600);
ok('tweede klik sluit het paneel', !(await paneelZichtbaar()));
await klikOpIcoon(id, site); await p.waitForTimeout(800);
ok('derde klik opent het paneel weer', await paneelZichtbaar());

// Na een herstart van de browser staat de vlag nog aan; een verse pagina moet gewoon openen.
const p2 = await ctx.newPage();
await p2.goto(site + '?tweede', { waitUntil: 'load' });
const id2 = await actiefTabId(p2);
await klikOpIcoon(id2, undefined); await p2.waitForTimeout(1500);
ok('nieuw tabblad via sneltoets (adres onbekend): paneel opent', (await p2.locator('#wt-scraper-host').count()) === 1);

// Precies één paneel, ook na herhaald injecteren.
await klikOpIcoon(id2, site); await p2.waitForTimeout(500);
await klikOpIcoon(id2, site); await p2.waitForTimeout(900);
ok('geen dubbel paneel na open/dicht/open', (await p2.locator('#wt-scraper-host').count()) === 1);

// Een browserpagina kan niet: dat moet zichtbaar zijn op het icoon, niet stil falen.
const melding = await sw.evaluate(async () => {
  const nep = { id: -1, url: 'chrome://settings/' };
  let gezien = null;
  const echt = chrome.action.setTitle;
  chrome.action.setTitle = async (o) => { gezien = o.title; };
  await togglePanel(nep);
  chrome.action.setTitle = echt;
  return gezien;
});
ok('browserpagina: uitleg op het icoon', /kan hier niet openen/i.test(melding || ''), melding);

ok('vlag blijft consistent', typeof (await leesVlag()) === 'boolean');

fs.writeFileSync(hier + '/extensie-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
