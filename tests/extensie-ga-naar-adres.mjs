/*
 * Test voor "Ga naar adres" met het adres uit je lijst (extensie 1.50).
 *
 *   node tests/extensie-ga-naar-adres.mjs
 *
 * Een nagebootste portaalsite met gewone .aspx-pagina's, zoals
 *   /dewaerdse/RelatieDetails.aspx?req=71105009&s=A&origin=10002
 * en een kleine web-app die op het adres reageert zonder te herladen.
 *
 * Gecontroleerd:
 *  1. adres-sjabloon met {{relatienummer}} en {{naam}}: elke regel komt op zijn eigen pagina,
 *     de server krijgt het juiste adres (ook "&" en spaties in een waarde), en een regel
 *     zonder nummer wordt overgeslagen terwijl de rest doorgaat;
 *  2. het hele adres uit een kolom van de lijst;
 *  3. de pagina wordt echt geladen (gewone .aspx-site): de uitgelezen titel hoort bij de regel;
 *  4. in een web-app blijft het zonder herladen werken (geen nieuw verzoek naar de server).
 */
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const res = [];
function ok(naam, cond, extra) { res.push((cond ? 'PASS ' : 'FAIL ') + naam + (extra !== undefined ? '  -> ' + String(extra).slice(0, 300) : '')); console.log(res[res.length - 1]); }

const hier = path.dirname(new URL(import.meta.url).pathname);
const BRON = path.resolve(hier, '..', 'extension');
const exe = process.env.PARSELAB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-nav-'));
const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-nav-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

const POORT = Number(process.env.PARSELAB_NAV_PORT || 9117);
const site = 'http://127.0.0.1:' + POORT;
const RELATIES = { '71105009': 'Jansen & Zn', '71105011': 'De Vries Holding', '71105020': 'Bakker' };
const verzoeken = [];
const HAPER = {};   // regelnummer → aantal keer een pagina zonder gegevens
const html = (titel, body) => '<!doctype html><meta charset="utf-8"><title>' + titel + '</title><body style="font:15px system-ui;margin:24px">' + body + '</body>';
const web = http.createServer((req, r2) => {
  const u = new URL(req.url, site);
  if (u.pathname !== '/favicon.ico') verzoeken.push(u.pathname + u.search);
  r2.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  if (u.pathname === '/dewaerdse/Overzicht.aspx') return r2.end(html('Relaties', '<h1>Relaties</h1><p>Startpagina van het portaal.</p>'));
  if (u.pathname === '/dewaerdse/RelatieDetails.aspx') {
    const nr = u.searchParams.get('req') || '';
    if (HAPER[nr]) { HAPER[nr]--; return r2.end(html('Relatie ' + nr, '<h1>Even geduld…</h1><p>De gegevens worden geladen.</p>')); }
    return r2.end(html('Relatie ' + nr, '<h1>Relatie ' + nr + '</h1><p><button id="bekijk" onclick="document.getElementById(\'bk\').textContent=\'bekeken\'">Bekijk</button> <span id="bk"></span></p><table><tr><td>Relatienummer</td><td>' + nr + '</td></tr><tr><td>Naam</td><td>' + (RELATIES[nr] || 'onbekend') + '</td></tr><tr><td>Zoeknaam</td><td>' + (u.searchParams.get('naam') || '') + '</td></tr></table>'));
  }
  if (u.pathname.startsWith('/app')) {
    // Een web-app: tekent de pagina opnieuw bij een adreswissel (popstate), zonder de server te vragen.
    return r2.end('<!doctype html><meta charset="utf-8"><title>App</title><body style="font:15px system-ui;margin:24px"><div id="app" data-v-app></div><script>' +
      'function teken(){var id=new URLSearchParams(location.search).get("id")||"-";document.title="Klant "+id;document.getElementById("app").innerHTML="<h1>Klant "+id+"</h1><table><tr><td>Klantnummer</td><td>"+id+"</td></tr></table>";}' +
      'addEventListener("popstate",teken);teken();</script></body>');
  }
  r2.end(html('Niet gevonden', '<h1>404</h1>'));
});
await new Promise(r => web.listen(POORT, '127.0.0.1', r));

const start = exe ? { executablePath: exe } : { channel: 'chromium' };
const ctx = await chromium.launchPersistentContext(profiel, Object.assign({
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-sandbox'],
  viewport: { width: 1400, height: 950 }
}, start));
let sw = ctx.serviceWorkers()[0];
if (!sw) {
  try { sw = await ctx.waitForEvent('serviceworker', { timeout: 30000 }); }
  catch (e) { ok('extensie geladen', false, 'geen service worker'); await ctx.close(); web.close(); process.exit(1); }
}
const p = await ctx.newPage();
p.on('pageerror', e => console.log('  [pagina-fout] ' + e.message));
if (process.env.PL_DEBUG) p.on('console', m => console.log('  [console] ' + m.text().slice(0, 200)));

const paneel = sel => p.evaluate(s => { const h = document.getElementById('wt-scraper-host'); const el = h && h.shadowRoot.querySelector(s); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const klik = sel => p.evaluate(s => { const h = document.getElementById('wt-scraper-host'); const el = h && h.shadowRoot.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
async function openPaneel(url) {
  await p.goto(url, { waitUntil: 'load' });
  await p.bringToFront(); await p.waitForTimeout(250);
  const zichtbaar = () => p.evaluate(() => { const h = document.getElementById('wt-scraper-host'); return !!h && getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().width > 0; });
  if (!(await zichtbaar())) {
    const tabId = await sw.evaluate(async u => { const t = (await chrome.tabs.query({})).find(x => (x.url || '').startsWith(u)); return t ? t.id : null; }, url);
    const uit = await sw.evaluate(async i => { try { await togglePanel({ id: i, url: undefined }); return 'ok'; } catch (e) { return 'fout: ' + e.message; } }, tabId);
    if (process.env.PL_DEBUG) console.log('  [toggle] tab ' + tabId + ': ' + uit);
  }
  for (let k = 0; k < 30 && !(await zichtbaar()); k++) {
    await p.waitForTimeout(500);
    if (k === 10) { const tabId = await sw.evaluate(async u => { const t = (await chrome.tabs.query({})).find(x => (x.url || '').startsWith(u)); return t ? t.id : null; }, url); await sw.evaluate(async i => { try { await togglePanel({ id: i, url: undefined }); } catch (e) {} }, tabId); }
  }
  if (!(await zichtbaar())) throw new Error('paneel niet zichtbaar op ' + url + ': ' + await p.evaluate(() => { const h = document.getElementById('wt-scraper-host'); return h ? 'host display=' + getComputedStyle(h).display + ' breedte=' + h.getBoundingClientRect().width : 'geen host'; }));
  await p.waitForTimeout(800);
}
async function lijst(regels) {
  const pad = path.join(os.tmpdir(), 'pl-nav-lijst.csv');
  fs.writeFileSync(pad, regels.join('\n') + '\n');
  await p.locator('#flow-file').setInputFiles(pad);
  await p.waitForTimeout(800);
}
async function wisFlow() {
  if (!(await klik('#flow-alleweg'))) return;
  await p.waitForTimeout(200);
  await klik('#wt-ask .wt-btn.primary');
  await p.waitForTimeout(300);
}
// Start en wacht tot de run klaar is (de run gaat over volledige paginawissels heen). Na afloop
// wist ParseLab de runstatus; het resultaat staat dan in het paneel en het verloop in het logboek.
async function draai(maxMs) {
  await sw.evaluate(async () => { await chrome.storage.local.remove('wt-run'); });
  await klik('#flow-run');
  const t0 = Date.now(); let gezien = false, klaar = false;
  while (Date.now() - t0 < maxMs) {
    await p.waitForTimeout(500);
    // Een bevestigingsvraag vóór de start (bv. "Ja, starten") beantwoorden.
    await p.evaluate(() => { const h = document.getElementById('wt-scraper-host'); if (!h) return; const ask = h.shadowRoot.querySelector('#wt-ask'); if (ask && ask.style.display !== 'none') { const b = ask.querySelector('.wt-btn.primary'); if (b && /ja|start|doorgaan|begin/i.test(b.textContent)) b.click(); } }).catch(() => {});
    const run = await sw.evaluate(async () => (await chrome.storage.local.get('wt-run'))['wt-run'] || null);
    if (run) gezien = true;
    if (gezien && (!run || run.running === false)) {
      const logTekst = await paneel('#flow-log').catch(() => null);
      if (logTekst && /\d+ (regels|regel|rondes|ronde) gedaan, \d+ om na te kijken|Gestopt —/.test(logTekst)) { klaar = true; break; }
    }
  }
  const logTekst = (await paneel('#flow-log').catch(() => null)) || '';
  // Het logboek in het paneel begint na elke paginalading opnieuw; het runlogboek (pl-runs) bewaart per stap de fout.
  await p.waitForTimeout(300);
  const fouten = await sw.evaluate(async () => { const r = ((await chrome.storage.local.get('pl-runs'))['pl-runs'] || [])[0]; return r ? r.steps.filter(x => x.err).map(x => 'regel ' + x.regel + ': ' + x.err) : []; });
  let results = [];
  try { const j = JSON.parse(await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelector('#flow-result').textContent)); results = Array.isArray(j) ? j : [j]; } catch (e) {}
  return { klaar, results, log: logTekst, fouten: fouten.join(' | ') };
}
const titels = st => st.results.map(r => r['Pagina titel'] || '');

// ---------- 1. Adres-sjabloon met {{kolom}} ----------
await openPaneel(site + '/dewaerdse/Overzicht.aspx');
await wisFlow();
await lijst(['relatienummer,naam,link',
  '71105009,Jansen & Zn,' + site + '/dewaerdse/RelatieDetails.aspx?req=71105009&s=A&origin=10002',
  ',Zonder nummer,',
  '71105011,De Vries Holding,' + site + '/dewaerdse/RelatieDetails.aspx?req=71105011&s=A&origin=10002']);
ok('de lijst is geladen', /3/.test(await paneel('#flow-csvinfo') || ''), await paneel('#flow-csvinfo'));

ok('klik op Pagina → Ga naar adres', await klik('[data-quick="goto"]'));
await p.waitForTimeout(300);
const standaard = await p.evaluate(() => { const r = document.getElementById('wt-scraper-host').shadowRoot; const s = r.querySelector('#wt-ask-urlkol'); return s ? s.value : null; });
ok('de kolom met adressen wordt vanzelf voorgesteld', standaard === 'link', standaard);
const SJABLOON = site + '/dewaerdse/RelatieDetails.aspx?req={{relatienummer}}&s=A&origin=10002&naam={{naam}}';
await p.evaluate(tpl => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const s = r.querySelector('#wt-ask-urlkol'); s.value = ''; s.dispatchEvent(new Event('change'));
  const i = r.querySelector('#wt-ask-url'); i.value = tpl; i.dispatchEvent(new Event('input'));
}, SJABLOON);
const vb = await paneel('#wt-ask-navvb') || '';
ok('vooruitblik ronde 1 toont het adres van regel 1', /ronde 1: 127\.0\.0\.1:\d+\/dewaerdse\/RelatieDetails\.aspx\?req=71105009&s=A&origin=10002&naam=Jansen %26 Zn/.test(vb), vb);
ok('vooruitblik ronde 2 meldt dat het nummer ontbreekt', /ronde 2: geen “relatienummer” in deze regel/.test(vb), vb);
ok('vooruitblik ronde 3 toont het adres van regel 3', /ronde 3: .*req=71105011/.test(vb), vb);
await klik('#wt-ask .wt-btn.primary');
await p.waitForTimeout(400);
ok('klik op Uitlezen → Hele pagina', await klik('[data-quick="rd-pagina"]'));
await p.waitForTimeout(400);
const flow = await paneel('#flow-steps') || '';
ok('de stap heet “Naar RelatieDetails.aspx met relatienummer, naam”', /Naar RelatieDetails\.aspx met relatienummer, naam/.test(flow), flow.slice(0, 200));

verzoeken.length = 0;
let st = await draai(60000);
const detail = verzoeken.filter(v => v.startsWith('/dewaerdse/RelatieDetails.aspx'));
ok('de run is klaar', st.klaar, st.log.slice(-200));
ok('de server kreeg precies de adressen van regel 1 en 3', detail.length === 2 && /req=71105009&s=A&origin=10002&naam=Jansen%20%26%20Zn$/.test(detail[0]) && /req=71105011&s=A&origin=10002&naam=De%20Vries%20Holding$/.test(detail[1]), detail.join(' | '));
ok('per regel de pagina van die regel uitgelezen', JSON.stringify(titels(st)) === JSON.stringify(['Relatie 71105009', '', 'Relatie 71105011']), JSON.stringify(titels(st)));
ok('regel 2 staat in het resultaat met de fout erbij', /overgeslagen bij stap 1/.test((st.results[1] || {}).Fout || ''), JSON.stringify(st.results[1]));
ok('de naam met “&” kwam heel aan', st.results[0] && st.results[0]['Zoeknaam'] === 'Jansen & Zn', st.results[0] && st.results[0]['Zoeknaam']);
ok('regel 2 (zonder nummer) is overgeslagen en gemeld', /1 overgeslagen: ronde 2 \(Zonder nummer\) bij stap 1/.test(st.log), (st.log.match(/\d+ overgeslagen:.{0,100}/) || [''])[0]);
ok('het runlogboek zegt waarom', /regel 2: .*geen waarde voor “relatienummer” in deze regel/.test(st.fouten), st.fouten);

// ---------- 2. Hele adres uit een kolom ----------
await openPaneel(site + '/dewaerdse/Overzicht.aspx');
await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const s = r.querySelector('#flow-steps [data-f="navKol"]');
  if (s) { s.value = 'link'; s.dispatchEvent(new Event('change')); }
});
await p.waitForTimeout(300);
let flow2 = await paneel('#flow-steps') || '';
if (!/elke ronde het adres uit de kolom “link”/.test(flow2)) {
  // De instellingen van de stap staan dicht: open de stap en kies de kolom.
  await p.evaluate(() => { const r = document.getElementById('wt-scraper-host').shadowRoot; const k = r.querySelector('#flow-steps .strow, #flow-steps [data-open], #flow-steps .stnaam'); if (k) k.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const r = document.getElementById('wt-scraper-host').shadowRoot; const s = r.querySelector('#flow-steps [data-f="navKol"]'); if (s) { s.value = 'link'; s.dispatchEvent(new Event('change')); } });
  await p.waitForTimeout(300);
  flow2 = await paneel('#flow-steps') || '';
}
ok('de stap neemt nu het adres uit de kolom “link”', /elke ronde het adres uit de kolom “link”/.test(flow2), flow2.slice(0, 200));
const hint = flow2.match(/Ronde 1: [^ ]+/);
ok('de stap toont het adres van ronde 1', !!hint && /req=71105009/.test(hint[0]), hint && hint[0]);
verzoeken.length = 0;
st = await draai(60000);
const detail2 = verzoeken.filter(v => v.startsWith('/dewaerdse/RelatieDetails.aspx'));
ok('uit de kolom: de server kreeg de adressen van regel 1 en 3', detail2.length === 2 && /req=71105009&s=A&origin=10002$/.test(detail2[0]) && /req=71105011&s=A&origin=10002$/.test(detail2[1]), detail2.join(' | '));
ok('uit de kolom: per regel de juiste pagina uitgelezen', JSON.stringify(titels(st)) === JSON.stringify(['Relatie 71105009', '', 'Relatie 71105011']), JSON.stringify(titels(st)));
ok('uit de kolom: lege link gemeld in het runlogboek', /regel 2: .*geen waarde voor “link” in deze regel/.test(st.fouten), st.fouten);

// ---------- 3. Web-app: zonder herladen ----------
await openPaneel(site + '/app/start');
await wisFlow();
ok('web-app: de flow is leeg', !/Hele pagina uitlezen/.test(await paneel('#flow-steps') || ''), (await paneel('#flow-steps') || '').slice(0, 120));
await lijst(['klant', '5', '6']);
await klik('[data-quick="goto"]');
await p.waitForTimeout(300);
await p.evaluate(u => { const r = document.getElementById('wt-scraper-host').shadowRoot; const s = r.querySelector('#wt-ask-urlkol'); if (s) { s.value = ''; s.dispatchEvent(new Event('change')); } const i = r.querySelector('#wt-ask-url'); i.value = u; i.dispatchEvent(new Event('input')); }, site + '/app/klant?id={{klant}}');
await klik('#wt-ask .wt-btn.primary');
await p.waitForTimeout(300);
await klik('[data-quick="rd-pagina"]');
await p.waitForTimeout(300);
verzoeken.length = 0;
st = await draai(45000);
ok('web-app: per regel de juiste klant uitgelezen', JSON.stringify(titels(st)) === JSON.stringify(['Klant 5', 'Klant 6']), JSON.stringify(titels(st)));
ok('web-app: geen nieuwe paginalading nodig', verzoeken.filter(v => v.startsWith('/app')).length === 0, verzoeken.join(' | '));

// ---------- 4. Herstel na een mislukte stap: terug naar het adres van DEZE regel ----------
// De stap "Naam uitlezen" is aangewezen op de pagina van regel 1. De pagina van regel 3 komt de eerste
// keer zonder gegevens; ParseLab moet dan opnieuw het adres van regel 3 openen, niet dat van regel 1.
await openPaneel(site + '/dewaerdse/Overzicht.aspx');
await wisFlow();
await lijst(['relatienummer', '71105009', '71105020', '71105011']);
await klik('[data-quick="goto"]');
await p.waitForTimeout(300);
await p.evaluate(u => { const r = document.getElementById('wt-scraper-host').shadowRoot; const s = r.querySelector('#wt-ask-urlkol'); if (s) { s.value = ''; s.dispatchEvent(new Event('change')); } const i = r.querySelector('#wt-ask-url'); i.value = u; i.dispatchEvent(new Event('input')); }, site + '/dewaerdse/RelatieDetails.aspx?req={{relatienummer}}&s=A&origin=10002');
await klik('#wt-ask .wt-btn.primary');
await p.waitForTimeout(1000);   // de flow wordt na 350 ms bewaard
await openPaneel(site + '/dewaerdse/RelatieDetails.aspx?req=71105009&s=A&origin=10002');
const beantwoord = () => p.evaluate(() => { const h = document.getElementById('wt-scraper-host'); const ask = h && h.shadowRoot.querySelector('#wt-ask'); if (ask && ask.style.display !== 'none') { const b = ask.querySelector('.wt-btn.primary'); if (b) { const t = b.textContent.trim(); b.click(); return t; } } return ''; });
ok('herstel: klik op Klikken → Klik', await klik('[data-quick="click"]'));
await p.waitForTimeout(500);
await p.click('#bekijk', { force: true });
await p.waitForTimeout(800);
console.log('  (vraag na klik: ' + (await beantwoord()) + ')');
await p.waitForTimeout(800);
ok('herstel: klik op Uitlezen → Onderdeel', await klik('[data-quick="rd-el"]'));
await p.waitForTimeout(500);
await p.click('td:has-text("Jansen & Zn")', { force: true });
await p.waitForTimeout(800);
console.log('  (vraag na uitlezen: ' + (await beantwoord()) + ')');
let flow4 = '';
for (let k = 0; k < 10 && !/Pagina 2.*2 stappen/.test(flow4); k++) { await p.waitForTimeout(400); flow4 = await paneel('#flow-steps') || ''; }
ok('herstel: de flow heeft naar adres, en op de detailpagina klik + uitlezen', /Pagina 1.*1 stap.*Pagina 2.*2 stappen/.test(flow4), flow4.slice(0, 260));
await p.waitForTimeout(800);
HAPER['71105011'] = 1;
verzoeken.length = 0;
st = await draai(90000);
const detail4 = verzoeken.filter(v => v.startsWith('/dewaerdse/RelatieDetails.aspx')).map(v => (v.match(/req=(\d+)/) || [])[1]);
const zonderStart = detail4[0] === '71105009' ? detail4.slice(1) : detail4;   // regel 1 staat al open
ok('herstel: na de lege pagina opnieuw het adres van regel 3 (niet dat van regel 1)', JSON.stringify(zonderStart) === JSON.stringify(['71105020', '71105011', '71105011']), detail4.join(', '));
const namen = st.results.map(r => Object.keys(r).filter(k => k[0] !== '_' && k !== 'Fout').map(k => r[k]).join(' / '));
ok('herstel: elke regel heeft de naam van zijn eigen relatie', JSON.stringify(namen) === JSON.stringify(['Jansen & Zn', 'Bakker', 'De Vries Holding']), JSON.stringify(st.results));

fs.writeFileSync(path.join(os.tmpdir(), 'extensie-ga-naar-adres-result.txt'), res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
