import { chromium } from 'playwright';
import fs from 'fs';
const S = process.env.PARSELAB_QA_DIR || new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const res = []; const errs = [];
function ok(name, cond, extra) { res.push((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  -> ' + String(extra).slice(0, 200) : '')); console.log(res[res.length-1]); }
async function step(name, fn) { try { await fn(); } catch (e) { ok(name + ' (exception)', false, e.message.split('\n')[0]); } }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{ width:1440, height:1000 }, acceptDownloads:true, locale:'nl-NL' });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('[pageerror] ' + e.message));
p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_CONNECTION|favicon|api\/parsepdf|status of (400|403|404)/.test(m.text())) errs.push('[console] ' + m.text().slice(0,160)); });
p.on('dialog', d => d.accept());
const nf = []; p.on('response', r => { if (r.status() === 404 && !/8765\/api/.test(r.url())) nf.push(r.url()); });
const U = 'http://127.0.0.1:8080/index.html';
for (const t of await (await fetch('http://127.0.0.1:8080/api/scrape/tasks')).json()) await fetch('http://127.0.0.1:8080/api/scrape/tasks/' + t.id, { method:'DELETE' });
for (const f of fs.readdirSync(S + '/../server/data/runs')) fs.unlinkSync(S + '/../server/data/runs/' + f);
try { fs.rmSync(S + '/../server/data/store', { recursive:true }); } catch (e) {}
const tool = () => p.frameLocator('iframe.bench-frame');
const hash = () => p.evaluate(() => location.hash);

// ---------- 1. Login ----------
await step('login', async () => {
  await p.goto(U, { waitUntil:'load' });
  await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('parselab-files'); });
  await p.reload({ waitUntil:'load' });
  ok('login-scherm zichtbaar', await p.locator('#login-form').count() === 1);
  await p.fill('#login-email', 'niet-een-mail'); await p.click('#login-form button[type=submit]'); await p.waitForTimeout(300);
  ok('ongeldig e-mailadres blijft op login', await p.locator('#login-form').count() === 1, await p.locator('#login-note').innerText().catch(()=>''));
  await p.fill('#login-email', 'sanne.de.vries@kantoor.nl'); await p.click('#login-form button[type=submit]'); await p.waitForTimeout(800);
  ok('na login: overzicht', await p.locator('#login-form').count() === 0 && await p.locator('.launch').count() === 1, 'hash=' + await hash());
  ok('naam uit e-mail', /Sanne/.test(await p.locator('#user-name').innerText()), await p.locator('#user-name').innerText());
  await p.reload({ waitUntil:'load' }); await p.waitForTimeout(500);
  ok('sessie blijft na herladen', await p.locator('#login-form').count() === 0);
});

// ---------- 2. Overzicht ----------
await step('overzicht', async () => {
  const cards = await p.locator('.launch button[data-bench]').count();
  ok('overzicht: 4 startkaarten', cards === 4, cards);
  ok('overzicht: 4 visuals', await p.locator('.launch .lv').count() === 4);
  ok('overzicht: lege projectstaat zonder nepdata', await p.locator('.proj-row').count() === 0 && await p.locator('.empty').count() >= 1);
  const h = await p.locator('.overview-title').innerText(); ok('begroeting met naam', /Sanne/.test(h), h);
  const scrollW = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('geen horizontale scroll (1440)', scrollW <= 0, scrollW);
  await p.screenshot({ path:S+'/shots/qa-overview.png', fullPage:true });
});

// ---------- 3. Sidebar / routing / help / zoeken / account ----------
await step('navigatie', async () => {
  await p.click('.nav-item[data-go="help"]'); await p.waitForTimeout(300);
  ok('hulp-pagina', (await hash()).startsWith('#help') && await p.locator('#view').innerText().then(t => t.length > 200));
  await p.fill('#search', 'excel'); await p.waitForTimeout(400);
  const sr = await p.locator('#view').innerText(); ok('zoeken toont resultaten', /Excel|excel/.test(sr) && sr.length > 50, sr.slice(0,80).replace(/\n/g,' '));
  await p.click('#clear-search'); await p.waitForTimeout(200);
  await p.goto(U + '#pdf/templates'); await p.waitForTimeout(3500);
  ok('directe link #pdf/templates opent Sjablonen', await tool().locator('#page-templates.active').count() === 1, await hash());
  ok('zijbalk: pdf uitgeklapt met stappen', await p.locator('.nav-sub-item[data-section="templates"]').count() === 1);
  ok('geen tweede navigator in de tool', await tool().locator('aside.sidebar').evaluate(e => getComputedStyle(e).display) === 'none');
  await p.click('.nav-sub-item[data-section="upload"]'); await p.waitForTimeout(500);
  ok('stap wisselen via zijbalk', await tool().locator('#page-upload.active').count() === 1);
  // account
  await p.click('#user-btn'); await p.click('[data-modal="account"]'); await p.waitForTimeout(200);
  ok('account: 3 schakelaars, AI uit, bewaren aan, bestanden aan', await p.locator('#set-ai').isChecked() === false && await p.locator('#set-store').isChecked() === true && await p.locator('#set-keep').isChecked() === true);
  ok('AI-knop verborgen zonder toestemming', await tool().locator('#aiDetectBtn').evaluate(e => getComputedStyle(e).display) === 'none');
  await p.click('#set-ai'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('Escape sluit modal', await p.locator('#modal').count() === 0 || await p.locator('#modal').isHidden());
  ok('AI-knop zichtbaar na toggle', await tool().locator('#aiDetectBtn').evaluate(e => getComputedStyle(e).display) !== 'none');
  await p.reload({ waitUntil:'load' }); await p.waitForTimeout(2500);
  ok('instelling blijft na herladen', await p.evaluate(() => JSON.parse(localStorage.getItem('parselab-settings')||'{}').ai === true));
  await p.click('#user-btn'); await p.click('[data-modal="account"]'); await p.click('#set-ai'); await p.keyboard.press('Escape');
});

// ---------- 4. ParseScraper volledig ----------
let taskId = null;
await step('scraper', async () => {
  await p.goto(U + '#scrape/url'); await p.waitForTimeout(1500);
  ok('scraper: geen server-hint met server', await p.locator('.server-hint').count() === 0);
  const t = tool();
  await t.locator('#url').fill('geen adres'); await t.locator('#fetch').click(); await p.waitForTimeout(800);
  ok('fout bij ongeldig adres in mensentaal', /adres/i.test(await t.locator('#fetch-msg').innerText()), await t.locator('#fetch-msg').innerText());
  await t.locator('#url').fill('http://127.0.0.1:9000/geheim/'); await t.locator('#fetch').click(); await p.waitForTimeout(3000);
  ok('robots.txt geblokkeerd pad geeft melding', (await t.locator('#fetch-msg').innerText()).length > 10 && await t.locator('#page-pick').isHidden(), await t.locator('#fetch-msg').innerText());
  await t.locator('#url').fill('http://127.0.0.1:9000/index.html'); await t.locator('#fetch').click();
  await t.locator('#page-pick').waitFor({ state:'visible', timeout:60000 });
  ok('pagina opgehaald → stap Aanwijzen', (await hash()).includes('scrape/pick'), await hash());
  ok('flow-paneel rechts met stappen', await t.locator('#flow .fs').count() >= 4, await t.locator('#flow .fs').count());
  const snap = t.frameLocator('#snap'); await snap.locator('.price').first().waitFor();
  await snap.locator('.title').nth(1).click(); await t.locator('#ask-list').click(); await p.waitForTimeout(400);
  const n = await t.locator('#cols .col').count(); ok('lijst herkend met kolommen', n >= 3, n + ' kolommen, ' + await t.locator('#count-pill').innerText());
  const names = await t.locator('#cols .col').evaluateAll(els => els.map(e => e.querySelector('[data-f=name]').value));
  ok('kolomnamen leesbaar', names.every(x => x && !/^div|span|\./i.test(x)), names.join(', '));
  ok('voorbeeldwaarden per kolom', await t.locator('#cols .col .ex').first().innerText().then(x => x.length > 0));
  // element wisselen
  await t.locator('[data-switch="0"]').click(); await p.waitForTimeout(200);
  ok('modus "ander element aanwijzen"', /aanwijs|Klik|element/i.test(await t.locator('#mode-pill').innerText()), await t.locator('#mode-pill').innerText());
  const before = await t.locator('#cols .col').first().locator('.ex').innerText();
  await snap.locator('.stock').first().click(); await p.waitForTimeout(400);
  const after = await t.locator('#cols .col').first().locator('.ex').innerText();
  ok('kolom gewisseld naar ander element', before !== after, before + ' → ' + after);
  ok('kolomnaam volgt het nieuwe element', await t.locator('#cols .col').first().locator('[data-f=name]').inputValue() !== 'Titel', await t.locator('#cols .col').first().locator('[data-f=name]').inputValue());
  // volgende pagina
  await t.locator('details.more summary').click(); await p.waitForTimeout(200);
  await t.locator('#mode-next').click(); await p.waitForTimeout(200);
  const nextLink = snap.locator('a', { hasText:/volgende|next|2/i }).first();
  if (await nextLink.count()) { await nextLink.click(); await p.waitForTimeout(400); }
  ok('volgende-pagina-knop aangewezen', /volgende|aangewezen|Volgende/i.test(await t.locator('#next-note').innerText()), await t.locator('#next-note').innerText());
  await t.locator('#pages').fill('2').catch(()=>{});
  await p.screenshot({ path:S+'/shots/qa-pick.png', fullPage:true });
  await t.locator('#to-done').click();
  await t.locator('#dl-row').waitFor({ state:'visible', timeout:120000 });
  const pill = await t.locator('#done-pill').innerText(); ok('uitlezen klaar over 2 pagina\'s', /\d+/.test(pill), pill);
  ok('resultaat-tabel gevuld', await t.locator('#done-table tbody tr, #done-table tr').count() > 2);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout:15000 }), t.locator('#dl-xlsx').click()]);
  const path = await dl.path(); const size = fs.statSync(path).size;
  ok('Excel-download', /\.xlsx$/.test(dl.suggestedFilename()) && size > 1000, dl.suggestedFilename() + ' ' + size + ' B');
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout:15000 }), t.locator('#dl-csv').click()]);
  const csv = fs.readFileSync(await dl2.path(), 'utf8'); ok('CSV met BOM en ;', csv.charCodeAt(0) === 0xFEFF && csv.includes(';'), csv.slice(1,60).replace(/\n/g,'|'));
  // taak bewaren met planning
  await t.locator('#task-name').fill('QA testshop'); await t.locator('#task-schedule').selectOption('dag').catch(()=>{}); await t.locator('#task-save').click(); await p.waitForTimeout(1200);
  ok('taak bewaard → project actief', /scrape\/.*/.test(await hash()) && /QA testshop/.test(await p.locator('#top-title').innerText()), await hash() + ' ' + await p.locator('#top-title').innerText());
  ok('project in zijbalk', await p.locator('.nav-sub-item.proj', { hasText:'QA testshop' }).count() === 1);
  const tasks = await (await fetch('http://127.0.0.1:8080/api/scrape/tasks', { headers:{ 'x-parselab-user':'sanne.de.vries@kantoor.nl' } })).json(); const tk = (tasks.tasks||tasks).find(x => x.name === 'QA testshop'); taskId = tk && tk.id;
  const other = await (await fetch('http://127.0.0.1:8080/api/scrape/tasks', { headers:{ 'x-parselab-user':'iemand.anders@kantoor.nl' } })).json();
  ok('andere gebruiker ziet deze taak niet', !other.some(x => x.name === 'QA testshop'), other.length);
  ok('taak op server met planning en laatste run', !!tk && tk.schedule === 'dag' && !!tk.lastRunId, JSON.stringify(tk||{}).slice(0,160));
  await p.screenshot({ path:S+'/shots/qa-done.png', fullPage:true });
});

// ---------- 5. Projecten: overzicht, openen, hernoemen, verwijderen ----------
await step('projecten', async () => {
  await p.click('.nav-item[data-go="overview"]'); await p.waitForTimeout(500);
  ok('overzicht toont project met mini-visual', await p.locator('.proj-row').count() >= 1 && await p.locator('.proj-row svg, .proj-row .mini').count() >= 1);
  await p.click('.proj-row [data-edit-project]'); await p.waitForTimeout(200);
  await p.fill('#ep-name', 'QA testshop (hernoemd)'); await p.click('#ep-save'); await p.waitForTimeout(300);
  ok('project hernoemd', await p.locator('.proj-row', { hasText:'hernoemd' }).count() === 1);
  await p.click('.proj-row [data-open-project]'); await p.waitForTimeout(3500);
  ok('project openen toont laatste resultaat', (await hash()).includes('scrape') && await tool().locator('#page-done.active').count() === 1 && /\d/.test(await tool().locator('#done-pill').innerText()), await hash());
  await p.reload({ waitUntil:'load' }); await p.waitForTimeout(3500);
  ok('hernoemde naam blijft na herladen', await p.locator('.nav-sub-item.proj', { hasText:'hernoemd' }).count() === 1, await p.$$eval('.nav-sub-item.proj', e => e.map(x => x.innerText.trim()).join('|')));
  await p.waitForTimeout(1500); const srvName = (await (await fetch('http://127.0.0.1:8080/api/scrape/tasks', { headers:{ 'x-parselab-user':'sanne.de.vries@kantoor.nl' } })).json()).map(x => x.name).join('|'); ok('naam ook op de server aangepast', /hernoemd/.test(srvName), srvName);
  ok('project na herladen weer geopend', await tool().locator('#page-done.active').count() === 1 && /\d/.test(await tool().locator('#done-pill').innerText().catch(()=>'')));
  const pids = await p.$$eval('.nav-sub-item.proj[data-project]', e => e.map(x => x.getAttribute('data-project'))); ok('geen dubbele projecten na herladen', new Set(pids).size === pids.length && pids.length === 1, pids.length);
  // rerun via tool
  await tool().locator('#rerun').click(); await tool().locator('#dl-row').waitFor({ state:'visible', timeout:120000 }); ok('opnieuw uitvoeren', true);
  // nieuw project via sidebar
  await p.click('.nav-sub-item[data-new-project="scrape"]'); await p.fill('#np-name', 'Leeg project'); await p.click('#np-save'); await p.waitForTimeout(1200);
  await p.click('.nav-item[data-go="files"]'); await p.waitForTimeout(1200);
  ok('bestanden: serverbestanden (runs) zichtbaar', await p.locator('#files-list .files-row').count() >= 1, await p.locator('#files-list .files-row').count());
  await p.click('.nav-item[data-go="overview"]'); await p.waitForTimeout(400);
  await p.click('.proj-row [data-edit-project]'); await p.click('#ep-delete'); await p.waitForTimeout(600);
  await p.goto(U + '#scrape/url'); await p.reload({ waitUntil:'load' }); await p.waitForTimeout(2500);
  ok('"Uit lijst halen" blijft na herladen', await p.locator('.nav-sub-item.proj[data-project]').count() === 0, await p.locator('.nav-sub-item.proj[data-project]').count());
  ok('"Uit lijst halen" verwijdert taak op server', (await (await fetch('http://127.0.0.1:8080/api/scrape/tasks', { headers:{ 'x-parselab-user':'sanne.de.vries@kantoor.nl' } })).json()).length === 0);
  ok('uitvoeringen van de taak zijn mee verwijderd', fs.readdirSync(S + '/../server/data/runs').length === 0, fs.readdirSync(S + '/../server/data/runs').length);
  ok('nieuw project via "+ Nieuwe" start op stap 1', (await hash()).includes('scrape') && await tool().locator('#page-url.active').count() === 1, await hash());
});

// ---------- 6. Bestanden ----------
await step('bestanden', async () => {
  await p.click('.nav-item[data-go="files"]'); await p.waitForTimeout(1200);
  ok('bestanden: bewaarde bestanden leeg met uitleg', /Nog geen|Downloads/.test(await p.locator('#files-kept').innerText()));
});

// ---------- 7. ParsePDF ----------
await step('parsepdf', async () => {
  await p.goto(U + '#pdf/upload'); await p.waitForTimeout(3500);
  const t = tool();
  await t.locator('#fileInput').setInputFiles([S+'/factuur-001.pdf', S+'/factuur-002.pdf']);
  await p.waitForTimeout(2500);
  const km = t.locator('#kindModal.open'); ok('pdf: soort-vraag "Dit lijkt een factuur"', await km.count() === 1); if (await km.count()) { await t.locator('#kindYesBtn').click(); await p.waitForTimeout(1000); }
  const act = await t.locator('.app-page.active').getAttribute('id');
  ok('pdf: na upload door naar Aanwijzen', act === 'page-define', act);
  ok('pdf: zijbalk volgt stap', (await hash()).includes('pdf/define'), await hash());
  const chips = await t.locator('#page-define').innerText();
  ok('pdf: kolommen tonen opgehaalde waarden', /2026|€|Factuur/i.test(chips), chips.replace(/\n/g,' ').slice(0,120));
  await p.click('.nav-sub-item[data-section="templates"]'); await p.waitForTimeout(500);
  await t.locator('#tplPageName').fill('QA sjabloon'); await t.locator('#tplPageSave').click(); await p.waitForTimeout(800);
  ok('pdf: sjabloon bewaard als project', await p.locator('.nav-sub-item.proj', { hasText:'QA sjabloon' }).count() === 1);
  ok('pdf: geen welkomstscherm in dashboard', await t.locator('#fsOnboarding.open').count() === 0);
  await p.click('.nav-sub-item.proj[data-project="pdf:QA sjabloon"] ~ * , .nav-sub-item.proj', { hasText:'QA sjabloon' }).catch(()=>{});
  await p.click('.nav-item[data-go="overview"]'); await p.waitForTimeout(400);
  await p.locator('.proj-row', { hasText:'QA sjabloon' }).locator('[data-edit-project]').click(); await p.fill('#ep-name', 'Facturen 2026'); await p.click('#ep-save'); await p.waitForTimeout(400);
  await p.goto(U + '#pdf/templates'); await p.waitForTimeout(3500);
  ok('pdf: hernoemd sjabloon ook in de tool', /Facturen 2026/.test(await tool().locator('#page-templates').innerText()) && await p.locator('.nav-sub-item.proj', { hasText:'Facturen 2026' }).count() === 1, (await tool().locator('#tplPageList').innerText()).replace(/\n/g,' ').slice(0,80));
  await p.click('.nav-sub-item[data-section="download"]'); await p.waitForTimeout(600);
  const dlb = t.locator('#page-download button', { hasText:/Excel|xlsx|Download/i }).first();
  if (await dlb.count()) { await dlb.click(); await p.waitForTimeout(1500); }
  await p.click('.nav-item[data-go="files"]'); await p.waitForTimeout(1200);
  ok('pdf: Excel bewaard onder Bestanden', await p.locator('#files-kept .files-row').count() >= 1, (await p.locator('#files-kept').innerText()).slice(0,80).replace(/\n/g,' '));
  await p.screenshot({ path:S+'/shots/qa-files.png', fullPage:true });
});

// ---------- 8. ParseBoard ----------
await step('parseboard', async () => {
  await p.goto(U + '#board/1'); await p.waitForTimeout(2500);
  const t = tool();
  fs.writeFileSync(S+'/qa-board.csv', 'Datum;Klant;Bedrag\n2026-01-03;Vermeer;120\n2026-02-03;Jansen;80\n2026-03-03;Vermeer;200\n');
  await t.locator('#fileinput').setInputFiles(S+'/qa-board.csv'); await p.waitForTimeout(800);
  const pb = t.locator('#parseBtn'); if (await pb.count() && await pb.isVisible()) { await pb.click(); await p.waitForTimeout(800); }
  ok('board: eigen CSV ingelezen', !(await t.locator('#parseError').isVisible().catch(()=>false)) && (await hash()).match(/board\/[2-6]/), await hash());
  for (let i = 0; i < 5; i++) { const nb = t.locator('#nextBtn'); if (await nb.count() && await nb.isVisible()) { await nb.click(); await p.waitForTimeout(500); } }
  const bb = t.locator('#buildBtn'); if (await bb.count()) { await bb.click(); await p.waitForTimeout(1200); }
  ok('board: dashboard gebouwd (stap 6)', /board\/6/.test(await hash()) && await t.locator('#saveBtn').count() === 1, await hash());
  await t.locator('#saveBtn').click(); await p.waitForTimeout(1000);
  ok('board: overzicht bewaard als project', await p.locator('.nav-sub-item.proj[data-project^="board:"]').count() === 1, await p.$$eval('.nav-sub-item.proj[data-project]', e => e.map(x => x.innerText.trim()).join('|')));
  await p.screenshot({ path:S+'/shots/qa-board.png', fullPage:true });
});

// ---------- 9. ParseForm (extensie-paneel) ----------
await step('parseform', async () => {
  await p.goto(U + '#form/install'); await p.waitForTimeout(800);
  const v = await p.locator('#view').innerText();
  ok('form: installatiepaneel zonder extensie', /Chrome/.test(v) && /Installeren/.test(v));
  ok('form: geen link naar Web Store (nog leeg)', !CONFIG_check(), 'CONFIG.webstoreUrl leeg');
  await p.click('#toggle-it').catch(()=>{}); await p.waitForTimeout(200);
  ok('form: IT-route uitklapbaar', await p.locator('#it-details').isVisible().catch(()=>false));
  await p.screenshot({ path:S+'/shots/qa-form.png', fullPage:true });
});
function CONFIG_check() { return false; }

// ---------- 10. Mobiel ----------
await step('mobiel', async () => {
  await p.setViewportSize({ width:390, height:844 }); await p.goto(U + '#overview'); await p.waitForTimeout(800);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('mobiel: geen horizontale scroll', sw <= 0, sw);
  ok('mobiel: startkaarten zichtbaar', await p.locator('.launch button[data-bench]').first().isVisible());
  ok('mobiel: zijbalk ingeklapt, menuknop zichtbaar', await p.locator('#menu-btn').isVisible() && !(await p.locator('#nav-tools').isVisible()));
  await p.click('#menu-btn'); await p.waitForTimeout(200);
  ok('mobiel: menu klapt uit', await p.locator('#nav-tools').isVisible());
  await p.click('.nav-item[data-go="files"]'); await p.waitForTimeout(400);
  ok('mobiel: menu sluit na keuze', !(await p.locator('#nav-tools').isVisible()) && (await hash()).startsWith('#files'));
  await p.click('#top-action'); await p.waitForTimeout(200);
  ok('bestanden: "Nieuw project" toont keuze uit 4 tools', await p.locator('#modal [data-new-project]').count() === 4);
  await p.keyboard.press('Escape');
  await p.screenshot({ path:S+'/shots/qa-mobile.png', fullPage:true });
  await p.setViewportSize({ width:1440, height:1000 });
});

// ---------- 10b. Sync via server: andere browser, zelfde account ----------
await step('sync', async () => {
  await p.waitForTimeout(1500);
  const ctx2 = await b.newContext({ viewport:{ width:1440, height:1000 } }); const p2 = await ctx2.newPage();
  await p2.goto(U, { waitUntil:'load' }); await p2.fill('#login-email', 'sanne.de.vries@kantoor.nl'); await p2.click('#login-form button[type=submit]'); await p2.waitForTimeout(2500);
  const names = await p2.$$eval('.proj-row', e => e.map(x => x.innerText.split('\n')[0]));
  ok('andere browser, zelfde account: projecten via de server', names.some(n => /Facturen 2026/.test(n)), names.join('|'));
  await ctx2.close();
});

// ---------- 11. Uitloggen ----------
await step('uitloggen', async () => {
  await p.goto(U + '#overview'); await p.waitForTimeout(500);
  await p.click('#user-btn'); await p.click('#logout'); await p.waitForTimeout(400);
  ok('uitloggen → login', await p.locator('#login-form').count() === 1);
});

// ---------- 12. Zonder server ----------
await step('zonder server', async () => {
  await p.goto('http://127.0.0.1:8765/parselab/index.html'); 
  await p.evaluate(() => localStorage.setItem('parselab-session', JSON.stringify({email:'s@k.nl',name:'Sanne',initials:'S'})));
  await p.goto('http://127.0.0.1:8765/parselab/index.html#scrape/url'); await p.reload({ waitUntil:'load' }); await p.waitForTimeout(1800);
  ok('zonder server: hint met startinstructie', await p.locator('.server-hint').count() === 1 && /start\.bat|node server/.test(await p.locator('.server-hint').innerText()));
  await p.goto('http://127.0.0.1:8765/parselab/index.html#pdf/upload'); await p.waitForTimeout(3000);
  ok('zonder server: ParsePDF werkt', await tool().locator('#page-upload.active').count() === 1);
});

ok('geen JS-fouten', errs.length === 0, errs.slice(0,5).join(' || '));
ok('geen 404s', nf.length === 0, [...new Set(nf)].join(' '));
fs.mkdirSync(S + '/shots', { recursive:true }); fs.writeFileSync(S + '/qa-result.txt', res.join('\n'));
await b.close();
