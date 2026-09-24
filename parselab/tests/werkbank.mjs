/*
 * Test voor de Werkbank: de ene tool waarin alles samenkomt.
 * Bron (document, website, rommelige Excel) → nette tabel → uitvoer
 * (Excel, CSV, dashboard) → rapport als Markdown én als webpagina.
 * Draait tegen de ParseLab-server op 8080 (net als qa.mjs).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

const res = [];
function ok(naam, cond, extra) { res.push((cond ? 'PASS ' : 'FAIL ') + naam + (extra !== undefined ? '  -> ' + String(extra).slice(0, 200) : '')); console.log(res[res.length - 1]); }
const hier = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const exe = process.env.PARSELAB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const U = process.env.PARSELAB_URL || 'http://127.0.0.1:8080/index.html';
const SHEET = U.replace(/index\.html$/, 'tools/parsesheet.html');
const dl = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-werk-'));

const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, locale: 'nl-NL' });
const p = await ctx.newPage();
const fouten = [];
p.on('pageerror', e => fouten.push('[pageerror] ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/fonts|favicon|ERR_|status of (400|403|404|501)/.test(m.text())) fouten.push('[console] ' + m.text().slice(0, 160)); });

// ---------- 1. ParseSheet als losse pagina: rommelige export wordt één nette tabel ----------
await p.goto(SHEET, { waitUntil: 'load' });
await p.click('#voorbeeld');
await p.waitForTimeout(300);
ok('ParseSheet: kopregel herkend', await p.evaluate(() => +document.querySelector('#kopregel').value) === 3, 'regel ' + (await p.evaluate(() => +document.querySelector('#kopregel').value) + 1));
await p.click('#naar-klaar');
await p.waitForTimeout(400);
const tabel = await p.evaluate(() => {
  const kop = [...document.querySelectorAll('#netjes thead th')].map(t => t.textContent.trim());
  const rijen = [...document.querySelectorAll('#netjes tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
  return { kop, rijen };
});
ok('ParseSheet: de vier kolommen staan er', tabel.kop.join(',') === 'Relatie,Polis,Premie,Ingangsdatum', tabel.kop.join(','));
ok('ParseSheet: vier regels met gegevens', tabel.rijen.length === 4, tabel.rijen.length + ' regels');
ok('ParseSheet: herhaalde kopregel weg', !tabel.rijen.some(r => r[0] === 'Relatie'), JSON.stringify(tabel.rijen[2] || []));
ok('ParseSheet: samengevoegde cel doorgevuld', tabel.rijen[1] && tabel.rijen[1][0] === 'Jansen BV', (tabel.rijen[1] || [])[0]);
ok('ParseSheet: bedragen als getal', tabel.rijen[0] && tabel.rijen[0][2] === '1240,5', (tabel.rijen[0] || [])[2]);
ok('ParseSheet: datums gelijkgetrokken', tabel.rijen.every(r => /^\d{2}-\d{2}-\d{4}$/.test(r[3])), tabel.rijen.map(r => r[3]).join(' · '));
const typen = await p.evaluate(() => [...document.querySelectorAll('#typen .type')].map(t => t.textContent.trim()));
ok('ParseSheet: typen herkend', typen.some(t => /Premie · getal/.test(t)) && typen.some(t => /Ingangsdatum · datum/.test(t)), typen.join(' | '));

// Excel eruit halen moet een echt xlsx-bestand geven (zip met [Content_Types]).
{
  const [down] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#dl-xlsx')]);
  const pad = path.join(dl, 'sheet.xlsx'); await down.saveAs(pad);
  const kop = fs.readFileSync(pad).subarray(0, 2).toString('latin1');
  ok('ParseSheet: Excel-download is een geldig bestand', kop === 'PK' && fs.statSync(pad).size > 500, down.suggestedFilename() + ' · ' + fs.statSync(pad).size + ' bytes');
}

// ---------- 2. De werkbank in het dashboard ----------
await p.goto(U, { waitUntil: 'load' });
await p.evaluate(() => { localStorage.clear(); });
await p.reload({ waitUntil: 'load' });
await p.fill('#login-email', 'sanne.de.vries@kantoor.nl');
await p.click('#login-form button[type=submit]');
await p.waitForTimeout(800);
await p.goto(U + '#werk');
await p.waitForTimeout(600);
const bronnen = await p.evaluate(() => [...document.querySelectorAll('.werk-bron .lt')].map(e => e.textContent.trim()));
ok('Werkbank: drie bronnen', bronnen.length === 3 && /Document/.test(bronnen[0]) && /Website/.test(bronnen[1]) && /Excel/.test(bronnen[2]), bronnen.join(' · '));
ok('Werkbank: nog geen gegevens', await p.locator('.werk-set').count() === 0);
ok('Werkbank: rapportknop staat uit zonder gegevens', await p.locator('#maak-rapport').isDisabled());
ok('Werkbank staat in de navigatie', await p.locator('[data-go="werk"]').count() === 1);

// ParseSheet binnen de schil: de tabel moet vanzelf in de werkbank komen.
await p.goto(U + '#sheet/bron');
await p.waitForTimeout(1200);
const fr = p.frameLocator('iframe.bench-frame');
await fr.locator('#voorbeeld').click();
await p.waitForTimeout(400);
await fr.locator('#naar-klaar').click();
await p.waitForTimeout(600);
const sets = await p.evaluate(() => JSON.parse(localStorage.getItem('parselab-datasets-v1') || '[]'));
ok('Tool meldt zijn tabel aan de werkbank', sets.length === 1 && sets[0].rijen.length === 4, JSON.stringify((sets[0] || {}).kolommen || []));
ok('De bron staat erbij', (sets[0] || {}).bron === 'sheet', (sets[0] || {}).bron);

await p.goto(U + '#werk');
await p.waitForTimeout(600);
ok('Werkbank toont de tabel', await p.locator('.werk-set').count() === 1, await p.locator('.werk-set .pname').innerText().catch(() => ''));
ok('Werkbank noemt herkomst en omvang', /ParseSheet/.test(await p.locator('.werk-set .mono-12').innerText()), await p.locator('.werk-set .mono-12').innerText());

// Excel en CSV uit de werkbank zelf.
{
  const [down] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-xlsx]')]);
  const pad = path.join(dl, 'werk.xlsx'); await down.saveAs(pad);
  ok('Werkbank: Excel-download', fs.readFileSync(pad).subarray(0, 2).toString('latin1') === 'PK', down.suggestedFilename());
}
{
  const [down] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-csv]')]);
  const pad = path.join(dl, 'werk.csv'); await down.saveAs(pad);
  const tekst = fs.readFileSync(pad, 'utf8');
  ok('Werkbank: CSV met kopregel en vier regels', /Relatie;Polis;Premie;Ingangsdatum/.test(tekst) && tekst.trim().split('\n').length === 5, tekst.split('\n')[0]);
}

// ---------- 3. Rapport: Markdown én HTML met dezelfde inhoud ----------
{
  const wacht = [p.waitForEvent('download', { timeout: 15000 })];
  await p.click('#maak-rapport');
  const md = await wacht[0];
  const mdPad = path.join(dl, 'rapport.md'); await md.saveAs(mdPad);
  const htmlDown = await p.waitForEvent('download', { timeout: 15000 });
  const htmlPad = path.join(dl, 'rapport.html'); await htmlDown.saveAs(htmlPad);
  const mdTekst = fs.readFileSync(mdPad, 'utf8'), htmlTekst = fs.readFileSync(htmlPad, 'utf8');
  ok('Rapport: Markdown-bestand', /\.md$/.test(md.suggestedFilename()) && /^# ParseLab-rapport/m.test(mdTekst), md.suggestedFilename());
  ok('Rapport: HTML-bestand', /\.html$/.test(htmlDown.suggestedFilename()) && /^<!DOCTYPE html>/.test(htmlTekst), htmlDown.suggestedFilename());
  ok('Rapport bevat de kolommen', /Relatie/.test(mdTekst) && /Ingangsdatum/.test(mdTekst));
  ok('Rapport bevat kerncijfers', /Kerncijfers/.test(mdTekst) && /Kerncijfers/.test(htmlTekst));
  ok('Rapport rekent de som uit', /4\.821,35|4821,35/.test(mdTekst), (mdTekst.match(/\| Premie \|[^\n]*/) || [''])[0]);
  ok('Rapport: beide bestanden noemen dezelfde bron', /ParseSheet/.test(mdTekst) && /ParseSheet/.test(htmlTekst));
  ok('Rapport-HTML draait zonder losse bestanden', !/<script|src="http/.test(htmlTekst));
}

// ---------- 4. Doorgeven naar het dashboard ----------
await p.click('[data-board]');
await p.waitForTimeout(2500);
ok('Naar dashboard opent ParseBoard', /#board/.test(await p.evaluate(() => location.hash)), await p.evaluate(() => location.hash));
{
  const board = p.frameLocator('iframe.bench-frame');
  const tekst = await board.locator('body').innerText().catch(() => '');
  ok('ParseBoard heeft de rijen ontvangen', /Relatie|Premie|Voorbeeld|kolom/i.test(tekst), tekst.replace(/\s+/g, ' ').slice(0, 120));
}

ok('geen JS-fouten', fouten.length === 0, fouten.slice(0, 3).join(' || '));

fs.writeFileSync(hier + '/werkbank-result.txt', res.join('\n'));
await b.close();
const mis = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - mis.length) + '/' + res.length + ' geslaagd');
if (mis.length) process.exit(1);
