/*
 * Test voor knoppen in een design system van webcomponenten (Lit/ASR-stijl): elke knop
 * zit in een eigen shadow root, meerdere lagen diep, en de tekst van de knop staat in de
 * light DOM van de host (via <slot>) — niet in de shadow root waar de echte <button> staat.
 *
 * Wat hier getest wordt: een knop aanwijzen geeft een stap met een bruikbare naam, en bij
 * het draaien wordt de knop ook echt ingedrukt.
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
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-knop-'));

const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-knop-kopie-'));
fs.cpSync(BRON, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf, null, 2));

const POORT = Number(process.env.PARSELAB_KNOP_PORT || 9110);
const PAGINA = `<!doctype html><meta charset="utf-8"><title>Knoppen in webcomponenten</title>
<style>body{margin:0;font:15px system-ui;background:#FDF8EC}</style>
<asr-column><asr-box>
  <asr-input-search></asr-input-search>
  <div class="flex justify-between">
    <asr-filter data-testid="zoek-klant-filter"></asr-filter>
    <asr-button id="meer">Meer acties</asr-button>
  </div>
</asr-box></asr-column>
<div id="teller" style="margin:24px;font-weight:600">klikken: </div>
<script>
window.geklikt = [];
function meld(wat) { window.geklikt.push(wat); document.getElementById('teller').textContent = 'klikken: ' + window.geklikt.join(', '); }

// Een knop uit het design system: de echte <button> zit in de shadow root, de tekst komt
// via een <slot> uit de light DOM van de host. De host dispatcht zijn eigen event, zoals
// Lit-componenten doen.
customElements.define('asr-button', class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const r = this.attachShadow({ mode: 'open', delegatesFocus: true });
    r.innerHTML = '<style>button{font:inherit;padding:8px 16px;cursor:pointer}</style>' +
      '<button class="button asr-focus-ring variant-primary asr-text-md-regular text-center hover-grow" type="button"><slot></slot></button>';
    r.querySelector('button').addEventListener('click', (e) => {
      // Zoals veel componenten: het eigen event gaat verder, de originele klik niet.
      e.stopPropagation();
      meld(this.getAttribute('data-naam') || (this.textContent || '').trim() || this.id || 'knop');
      this.dispatchEvent(new CustomEvent('asr-click', { bubbles: true, composed: true }));
    });
  }
});
customElements.define('asr-input-search', class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = '<style>input{font:inherit;padding:8px;width:280px}.rij{display:flex;gap:8px;align-items:center;margin:16px}</style>' +
      '<div class="rij"><label class="label" id="label" for="id-ef1deb08-6d6b-4c2b-9887-6c6c667ad178">' +
      '<span class="asr-text-md-bold label-text">Zoek een klant</span></label>' +
      '<input data-testid="input" id="id-ef1deb08-6d6b-4c2b-9887-6c6c667ad178" class="asr-text-md" type="search" ' +
      'inputmode="search" autocomplete="off" role="combobox" aria-haspopup="listbox" aria-autocomplete="list" aria-expanded="false">' +
      '<asr-button class="submit-button" variant="primary" compact data-naam="Zoeken">Zoeken</asr-button>' +
      '<asr-button class="clear-button" variant="tertiary" compact label="Zoekopdracht wissen" data-naam="wissen"></asr-button>' +
      '</div>';
  }
});
// De filter: vijf shadow roots diep, met knoppen die er precies hetzelfde uitzien als
// alle andere knoppen op de pagina (zelfde klassen, zelfde interne HTML).
customElements.define('asr-button-group', class extends HTMLElement {
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }).innerHTML = '<div class="button-group vertical full-width"><slot></slot></div>'; }
});
customElements.define('ds-dropdown', class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = '<slot name="trigger" class="trigger"></slot><div class="dropdown"><slot></slot></div>';
  }
});
customElements.define('ds-filter-dropdown', class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = '<div class="wrapper"><ds-dropdown class="dropdown" placement="bottom-start">' +
      '<asr-button id="trigger-button" variant="secondary" data-testid="button-trigger" slot="trigger" data-naam="Kies filter">Kies filter</asr-button>' +
      '<div class="dropdown-main"><asr-button-group vertical>' +
      '<asr-button id="confirm-button" data-testid="button-confirm" data-naam="Filter toepassen">Filter toepassen</asr-button>' +
      '<asr-button id="clear-button" variant="secondary" data-testid="button-clear" data-naam="Wis filter">Wis filter</asr-button>' +
      '</asr-button-group></div></ds-dropdown></div>';
  }
});
customElements.define('asr-filter', class extends HTMLElement {
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }).innerHTML = '<ds-filter-dropdown id="filter"></ds-filter-dropdown>'; }
});
customElements.define('asr-box', class extends HTMLElement {
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }).innerHTML = '<div class="box"><slot></slot></div>'; }
});
customElements.define('asr-column', class extends HTMLElement {
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>'; }
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
await p.bringToFront(); await p.waitForTimeout(300);
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

// Het middelpunt van de "Zoeken"-knop, die drie shadow roots diep zit.
const midden = await p.evaluate(() => {
  const btnHost = document.querySelector('asr-input-search').shadowRoot.querySelector('asr-button.submit-button');
  const r = btnHost.shadowRoot.querySelector('button').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});

// 1. Knop aanwijzen: kies "Klikken" uit het menu, dan op de knop klikken.
const gekozen = await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = r.querySelector('[data-add="click"]');
  if (!b) return false; b.click(); return true;
});
ok('"Klikken" staat in het menu', gekozen);
await p.waitForTimeout(400);
await p.mouse.click(midden.x, midden.y);
await p.waitForTimeout(600);

const stapTekst = await paneel('#flow-steps') || '';
ok('er is een klikstap gemaakt', /knop|zoeken|button/i.test(stapTekst), stapTekst.slice(0, 160));
ok('de stap heet naar de tekst op de knop, niet "button"', /zoeken/i.test(stapTekst), stapTekst.slice(0, 160));
ok('het aanwijzen zelf heeft de knop niet ingedrukt', (await p.evaluate(() => window.geklikt.length)) === 0, JSON.stringify(await p.evaluate(() => window.geklikt)));

// 2. Draaien: de knop moet echt ingedrukt worden.
await klik('#flow-run');
await p.waitForTimeout(700);
await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = [...r.querySelectorAll('button')].find(x => /^(ja|yes|oui|sí|si)$/i.test(x.textContent.trim()));
  if (b) b.click();
});
await p.waitForTimeout(5000);

const geklikt = await p.evaluate(() => window.geklikt.slice());
ok('de knop in de webcomponent is ingedrukt', geklikt.includes('Zoeken'), JSON.stringify(geklikt));
ok('de log meldt de knop als ingedrukt', /👆/.test(await paneel('#flow-log') || ''), (await paneel('#flow-log') || '').slice(-160));
ok('er is niet op een andere knop geklikt', geklikt.length === 1, JSON.stringify(geklikt));

// 3. Een knop die vijf shadow roots diep zit, tussen knoppen die er identiek uitzien.
await p.evaluate(() => { window.geklikt.length = 0; document.getElementById('teller').textContent = 'klikken: '; });
const diep = await p.evaluate(() => {
  const dd = document.querySelector('asr-filter').shadowRoot
    .querySelector('ds-filter-dropdown').shadowRoot
    .querySelector('ds-dropdown');
  const groep = dd.querySelector('.dropdown-main asr-button-group');
  const host = groep.querySelector('#confirm-button');
  const r = host.shadowRoot.querySelector('button').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width) };
});
ok('de diepe knop is zichtbaar op de pagina', diep.w > 0, JSON.stringify(diep));

await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  [...r.querySelectorAll('[data-del]')].forEach(b => b.click());        // eerdere stap weg
  r.querySelector('[data-add="click"]').click();
});
await p.waitForTimeout(400);
await p.mouse.click(diep.x, diep.y);
await p.waitForTimeout(600);
const diepeStap = await paneel('#flow-steps') || '';
ok('de diepe knop heet naar zijn eigen tekst', /filter toepassen/i.test(diepeStap), diepeStap.slice(0, 200));

await klik('#flow-run');
await p.waitForTimeout(5500);
const diepGeklikt = await p.evaluate(() => window.geklikt.slice());
ok('de diepe knop is ingedrukt', diepGeklikt.includes('Filter toepassen'), JSON.stringify(diepGeklikt));
ok('en niet een van de knoppen die er identiek uitzien', diepGeklikt.length === 1, JSON.stringify(diepGeklikt));

// 4. Een modaal venster (asr-sheet gebruikt <dialog>.showModal()): alles buiten de dialog
// wordt "inert", dus ook ons paneel. Dan kun je in ParseLab geen knop meer indrukken.
// Let op: dit moet met een ECHTE muisklik getest worden — el.click() negeert inert.
await p.evaluate(() => {
  const d = document.createElement('dialog');
  d.id = 'sheet';
  d.innerHTML = '<div style="padding:40px">Sheet staat open</div>';
  document.body.appendChild(d);
  d.showModal();
});
await p.waitForTimeout(600);

const vakje = await p.evaluate(() => {
  const r = document.getElementById('wt-scraper-host').shadowRoot;
  const b = r.querySelector('[data-add="wait"]');
  if (!b) return null;
  const menu = r.querySelector('#flow-add-menu'); if (menu) menu.style.display = 'block';
  const q = b.getBoundingClientRect();
  return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2), w: Math.round(q.width) };
});
ok('de knop "Wachten" is in beeld terwijl het modaal open staat', !!vakje && vakje.w > 0, JSON.stringify(vakje));
const voor = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps [data-del]').length);
await p.mouse.click(vakje.x, vakje.y);
await p.waitForTimeout(600);
const na = await p.evaluate(() => document.getElementById('wt-scraper-host').shadowRoot.querySelectorAll('#flow-steps [data-del]').length);
ok('met een modaal venster open reageert het paneel nog op een echte muisklik', na > voor, 'stappen voor ' + voor + ', na ' + na);

fs.writeFileSync(hier + '/extensie-knoppen-result.txt', res.join('\n'));
await ctx.close();
web.close();
const fouten = res.filter(r => r.startsWith('FAIL'));
console.log('\n' + (res.length - fouten.length) + '/' + res.length + ' geslaagd');
if (fouten.length) process.exit(1);
