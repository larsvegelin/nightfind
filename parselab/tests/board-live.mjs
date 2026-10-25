/*
 * Test voor de live-datakoppeling van de dashboardmaker: een online bestand als bron,
 * langs beide wegen. Een bron die CORS toestaat haalt de browser zelf op; een bron die
 * dat niet doet (zoals Google Sheets en SharePoint) gaat via /api/data/haal op de
 * ParseLab-server.
 *
 * Vereist een draaiende ParseLab-server met PARSELAB_ALLOW_PRIVATE=1 (poort 8080).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import http from 'http';

const res = [];
function ok(naam, cond, extra) { res.push((cond ? 'PASS ' : 'FAIL ') + naam + (extra !== undefined ? '  -> ' + String(extra).slice(0, 200) : '')); console.log(res[res.length - 1]); }

const hier = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const exe = process.env.PARSELAB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BASIS = process.env.PARSELAB_URL || 'http://127.0.0.1:8080';

const CSV = 'Datum;Klant;Bedrag\n2026-01-03;Vermeer;120\n2026-02-03;Jansen;80\n2026-03-03;Vermeer;200\n';
const CSV2 = CSV + '2026-04-03;De Wit;340\n';

// Bron A: stuurt een CORS-kop mee → de browser mag hem zelf ophalen.
let teller = 0;
const metCors = http.createServer((q, r) => {
  teller++;
  r.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'access-control-allow-origin': '*' });
  r.end(teller > 1 ? CSV2 : CSV);
});
// Bron B: géén CORS-kop → de browser wordt geweigerd en de server moet bijspringen.
const zonderCors = http.createServer((q, r) => {
  r.writeHead(200, { 'content-type': 'text/csv; charset=utf-8' });
  r.end(CSV);
});
await new Promise(r => metCors.listen(9121, '127.0.0.1', r));
await new Promise(r => zonderCors.listen(9122, '127.0.0.1', r));

const start = exe ? { executablePath: exe } : { channel: 'chromium' };
const browser = await chromium.launch(Object.assign({ args: ['--no-sandbox'] }, start));
const p = await browser.newPage({ viewport: { width: 1360, height: 1000 } });

// Draait de server? Zonder server kan de tweede weg niet getest worden.
let serverDraait = false;
try { const r = await fetch(BASIS + '/api/scrape/status'); serverDraait = r.ok; } catch (e) {}
ok('de ParseLab-server draait (nodig voor de tweede weg)', serverDraait, BASIS);

const open = async () => {
  await p.goto(BASIS + '/tools/parseboard.html', { waitUntil: 'load' });
  await p.waitForTimeout(600);
};
const veld = (sel) => p.locator(sel);

/* ---- weg 1: de browser haalt het zelf op (bron met CORS) ---- */
await open();
ok('de kaart "Live data" staat in stap 1', await veld('#liveurl').count() === 1);
await veld('#liveurl').fill('http://127.0.0.1:9121/data.csv');
await veld('#liveiv').selectOption('300');
await veld('#liveBtn').click();
await p.waitForTimeout(1500);
let st = await p.evaluate(() => ({ stap: location.hash, bron: window.__plState ? window.__plState.source : null }));
const kolommen1 = await p.evaluate(() => [...document.querySelectorAll('select[data-col]')].length);
ok('na ophalen staat de maker op de kolomstap', /#?(2|board\/2)?/.test(st.stap) && kolommen1 === 3, 'kolommen: ' + kolommen1 + ', hash ' + st.stap);
ok('de drie kolommen uit de CSV zijn overgenomen', kolommen1 === 3, String(kolommen1));

/* ---- weg 2: de bron weigert de browser, de server springt bij ---- */
if (serverDraait) {
  await open();
  await veld('#liveurl').fill('http://127.0.0.1:9122/data.csv');
  await veld('#liveBtn').click();
  await p.waitForTimeout(2500);
  const kolommen2 = await p.evaluate(() => [...document.querySelectorAll('select[data-col]')].length);
  const fout = await p.evaluate(() => (document.querySelector('#liveError') || {}).textContent || '');
  ok('een bron zonder CORS wordt via de server opgehaald', kolommen2 === 3, 'kolommen: ' + kolommen2 + (fout ? ', melding: ' + fout : ''));
}

/* ---- een link die geen tabel is, geeft een begrijpelijke melding ---- */
await open();
await veld('#liveurl').fill('niet-een-link');
await veld('#liveBtn').click();
await p.waitForTimeout(500);
ok('een onvolledige link geeft uitleg, geen stilte', /begint met https/i.test(await veld('#liveError').innerText()), await veld('#liveError').innerText());

await open();
await veld('#liveurl').fill(BASIS + '/tools/parseboard.html');
await veld('#liveBtn').click();
await p.waitForTimeout(2500);
{
  const m = await veld('#liveError').innerText();
  ok('een webpagina in plaats van data geeft uitleg', m.length > 10, m.slice(0, 120));
}

/* ---- het serverdeel los: wat geeft /api/data/haal terug? ---- */
if (serverDraait) {
  const r = await fetch(BASIS + '/api/data/haal?url=' + encodeURIComponent('http://127.0.0.1:9122/data.csv'));
  const j = await r.json().catch(() => null);
  ok('/api/data/haal geeft de inhoud terug', r.ok && j && /Datum;Klant;Bedrag/.test(j.inhoud || ''), (j && (j.inhoud || j.error) || '').slice(0, 80));
  const r2 = await fetch(BASIS + '/api/data/haal?url=' + encodeURIComponent('http://127.0.0.1:8080/tools/parseboard.html'));
  ok('/api/data/haal weigert een webpagina met uitleg', r2.status === 415, 'status ' + r2.status);
}

fs.writeFileSync(hier + '/board-live-result.txt', res.join('\n'));
await browser.close();
metCors.close(); zonderCors.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
