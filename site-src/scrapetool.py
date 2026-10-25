#!/usr/bin/env python3
"""Scrapetool als losse HTML: het echte ParseLab-paneel (extension/panel.js) op een voorbeeldwebshop.

Gebruik:  python3 site-src/scrapetool.py   (vanuit de hoofdmap van de repository)

Er draait geen extensie: een klein vervangstuk voor chrome.* laat het paneel in een gewone pagina
werken. Alles wat de extensie op de achtergrond doet (cloud, planning, PDF, ZIP, verborgen tabbladen)
is hier uit of nagebootst met voorbeelddata. Het resultaat is scrapetool.html in de hoofdmap.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = os.path.join(ROOT, 'extension')

panel_js = open(os.path.join(EXT, 'panel.js'), encoding='utf-8').read()
panel_css = open(os.path.join(EXT, 'panel.css'), encoding='utf-8').read()
versie = json.load(open(os.path.join(EXT, 'manifest.json'), encoding='utf-8'))['version']
versie = re.sub(r'\.0$', '', versie)

# Voorbeeldcatalogus: zakelijke productgegevens, duidelijk voorbeelddata.
PRODUCTEN = [
    ('fietslamp-led', 'Fietslamp LED', '24,95', 18, 'Lumo', 'FL-2041', 'Heldere voorlamp met 60 lux en usb-c.'),
    ('bidon-750', 'Bidon 750 ml', '7,49', 64, 'Aqua', 'BD-0750', 'Lichte bidon zonder bpa.'),
    ('zadeltas-klein', 'Zadeltas klein', '19,00', 6, 'Packit', 'ZT-0110', 'Voor een binnenband en bandenlichters.'),
    ('kettingolie', 'Kettingolie', '8,99', 42, 'Lube', 'KO-0050', 'Voor droog en nat weer.'),
    ('fietspomp-mini', 'Fietspomp mini', '16,50', 0, 'Airo', 'FP-0300', 'Past in elke rugzak.'),
    ('handschoenen-winter', 'Handschoenen winter', '29,95', 11, 'Grip', 'HW-0802', 'Winddicht, met touchscreen-vingertop.'),
    ('fietsslot-ketting', 'Kettingslot 90 cm', '39,00', 9, 'Lockr', 'KS-0090', 'ART-2 keurmerk.'),
    ('spatbord-set', 'Spatbordset 28 inch', '21,75', 15, 'Dryy', 'SB-2800', 'Snel te monteren.'),
    ('remblokken', 'Remblokken (2 paar)', '12,49', 33, 'Stopz', 'RB-0002', 'Voor V-brakes.'),
    ('telefoonhouder', 'Telefoonhouder stuur', '17,95', 0, 'Mountr', 'TH-0100', 'Draait 360 graden.'),
    ('achterlicht', 'Achterlicht USB', '14,95', 27, 'Lumo', 'AL-1020', 'Met remlichtfunctie.'),
    ('fietsmand', 'Fietsmand voor', '34,50', 4, 'Basko', 'FM-0400', 'Klikt los met één hand.'),
]


def productpagina(p, winkel='Fietsshop (voorbeeld)'):
    slug, naam, prijs, voorraad, merk, art, oms = p
    return ('<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>' + naam + ' | ' + winkel + '</title>'
            '<meta name="description" content="' + oms + '"></head><body><header><a href="/">' + winkel + '</a></header>'
            '<main><article class="product"><h1 class="product-title">' + naam + '</h1>'
            '<div class="price-box"><span class="price">€ ' + prijs + '</span></div>'
            '<dl class="specs"><dt>Merk</dt><dd>' + merk + '</dd><dt>Artikelnummer</dt><dd>' + art + '</dd>'
            '<dt>Voorraad</dt><dd>' + (str(voorraad) + ' stuks' if voorraad else 'Niet op voorraad') + '</dd></dl>'
            '<p class="omschrijving">' + oms + ' Dit is een voorbeeldpagina met voorbeelddata voor de ParseLab-demo; '
            'de tekst is langer zodat de pagina als echte inhoud telt bij het snel ophalen.</p></article></main></body></html>')


PAGINAS = {}
for p in PRODUCTEN:
    PAGINAS['https://fietsshop.voorbeeld/product/' + p[0]] = {'snel': productpagina(p)}
# Een andere website, met dezelfde opbouw.
ander = ('wielrenbril', 'Wielrenbril', '44,00', 7, 'Visio', 'WB-0007', 'Met verwisselbare glazen.')
PAGINAS['https://anderewinkel.voorbeeld/artikel/wielrenbril'] = {'snel': productpagina(ander, 'Andere winkel (voorbeeld)')}
# Een pagina die pas met JavaScript gevuld wordt: snel is leeg, volledig (verborgen tabblad) is gevuld.
js = ('regenjas', 'Regenjas fiets', '59,95', 12, 'Dryy', 'RJ-0600', 'Ademend en reflecterend.')
PAGINAS['https://app.voorbeeld/p/regenjas'] = {
    'snel': '<!doctype html><html><head><title>App</title></head><body><div id="app"></div><script>/* vult de pagina pas in de browser */</script></body></html>',
    'volledig': productpagina(js, 'Webapp (voorbeeld)')}

LIJST_ADRESSEN = 'naam;url\n' + ''.join(
    f'{p[1]};https://fietsshop.voorbeeld/product/{p[0]}\n' for p in PRODUCTEN[:4]
) + 'Wielrenbril;https://anderewinkel.voorbeeld/artikel/wielrenbril\nRegenjas;https://app.voorbeeld/p/regenjas\nOud product;https://fietsshop.voorbeeld/product/bestaat-niet\n'
LIJST_FORMULIER = 'artikelnummer;aantal;bedrijf;levering\nFL-2041;4;Bouwbedrijf Noord (voorbeeld);Standaard\nKO-0050;12;Fietsverhuur Zuid (voorbeeld);Spoed\nZT-0110;2;Koeriersdienst West (voorbeeld);Standaard\n'

STUB = r"""
(() => {
  // Vervangt chrome.* zodat het paneel zonder extensie draait. Instellingen blijven in deze browser.
  const KEY = 'parselab-demo-store';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
  const bewaar = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  if (!('wt-active' in store)) store['wt-active'] = true;
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const luisteraars = [];
  const PAGINAS = __PAGINAS__;
  const PIX = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  function bestand(m) {
    try {
      const bytes = m.dataB64 ? Uint8Array.from(atob(m.dataB64), c => c.charCodeAt(0)) : new TextEncoder().encode(m.data || '');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: m.mime || 'application/octet-stream' }));
      a.download = m.filename || 'parselab-bestand'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
      return { ok: true };
    } catch (e) { return { ok: false, err: 'downloaden lukt hier niet' }; }
  }
  function antwoord(m) {
    switch (m.type) {
      case 'wt-perm-has': return { ok: true, granted: true };
      case 'wt-download': return bestand(m);
      case 'pl-extern': {
        const p = PAGINAS[String(m.url || '').replace(/[?#].*$/, '')];
        if (!p) return { ok: false, status: 404, err: 'fout 404' };
        const html = m.modus === 'volledig' && p.volledig ? p.volledig : p.snel;
        return { ok: true, status: 200, html, url: m.url, modus: m.modus === 'volledig' ? 'volledig' : 'snel' };
      }
      case 'pl-db': return { ok: false, err: 'De cloud staat uit in deze demo. Installeer de extensie om flows te bewaren.' };
      case 'pl-shot': return { ok: true, id: (m.runId || 'run') + '_' + m.naam };
      case 'pl-shot-get': { const r = { ok: true, shots: {} }; (m.ids || []).forEach(i => r.shots[i] = PIX); return r; }
      case 'pl-llm': return { ok: false, err: 'De AI-assistent werkt in de extensie, met je eigen sleutel.' };
      case 'wt-print': case 'pl-zip-get': return { ok: false, err: 'PDF en ZIP werken alleen in de extensie.' };
      default: return { ok: true };
    }
  }
  window.chrome = {
    runtime: { id: 'parselab-demo', lastError: null,
      sendMessage(m, cb) { const r = antwoord(m || {}); const ms = m && m.type === 'pl-extern' ? 350 : 10; setTimeout(() => cb && cb(r), ms); return Promise.resolve(r); },
      onMessage: { addListener() {} }, getURL: x => x },
    storage: { local: {
      get(k, cb) { const o = {}; (Array.isArray(k) ? k : typeof k === 'string' ? [k] : Object.keys(k || store)).forEach(x => { if (x in store) o[x] = clone(store[x]); }); setTimeout(() => cb && cb(o), 0); return Promise.resolve(o); },
      set(o, cb) {
        const oud = {}; Object.keys(o).forEach(x => oud[x] = store[x]);
        Object.assign(store, clone(o)); bewaar(); setTimeout(() => cb && cb(), 0);
        const ch = {}; Object.keys(o).forEach(x => ch[x] = { oldValue: oud[x], newValue: clone(o[x]) });
        setTimeout(() => luisteraars.forEach(f => { try { f(ch, 'local'); } catch (e) {} }), 0);
        return Promise.resolve(); },
      remove(k, cb) { (Array.isArray(k) ? k : [k]).forEach(x => delete store[x]); bewaar(); setTimeout(() => cb && cb(), 0); return Promise.resolve(); } },
      onChanged: { addListener(f) { luisteraars.push(f); } } } };
})();
"""

SHOP_JS = r"""
(() => {
  const P = __PRODUCTEN__;
  const LIJSTEN = { adressen: __LIJST_ADRESSEN__, formulier: __LIJST_FORMULIER__ };
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let pagina = 1; const PER = 6;
  function toonGrid() {
    const deel = P.slice((pagina - 1) * PER, pagina * PER);
    $('#grid').innerHTML = deel.map(p => '<div class="card"><div class="ph" aria-hidden="true"></div><h3 class="naam">' + esc(p[1]) + '</h3>' +
      '<div class="prijs">€ ' + p[2] + '</div><div class="voorraad ' + (p[3] ? 'op' : 'uit') + '">' + (p[3] ? p[3] + ' op voorraad' : 'Niet op voorraad') + '</div>' +
      '<div class="art">Art. ' + p[5] + '</div><a class="meer" href="https://fietsshop.voorbeeld/product/' + p[0] + '" data-slug="' + p[0] + '">Bekijk</a></div>').join('');
    $('#pag').textContent = 'Pagina ' + pagina + ' van ' + Math.ceil(P.length / PER);
    $('#vorige').disabled = pagina === 1; $('#volgende').disabled = pagina * PER >= P.length;
  }
  function toonProduct(slug) {
    const p = P.find(x => x[0] === slug) || P[0];
    $('#product').innerHTML = '<p class="kruim"><a href="#" data-tab="producten">Producten</a> / ' + esc(p[1]) + '</p><article class="product"><div class="ph groot" aria-hidden="true"></div><div>' +
      '<h1 class="product-title">' + esc(p[1]) + '</h1><div class="price-box"><span class="price">€ ' + p[2] + '</span></div>' +
      '<dl class="specs"><dt>Merk</dt><dd>' + esc(p[4]) + '</dd><dt>Artikelnummer</dt><dd>' + p[5] + '</dd><dt>Voorraad</dt><dd>' + (p[3] ? p[3] + ' stuks' : 'Niet op voorraad') + '</dd></dl>' +
      '<p class="omschrijving">' + esc(p[6]) + '</p></div></article>';
  }
  function tab(naam) {
    document.querySelectorAll('.shop-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === naam ? 'true' : 'false'));
    document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== 'v-' + naam);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t && !t.closest('#wt-scraper-host')) { e.preventDefault(); tab(t.dataset.tab); return; }
    const a = e.target.closest('a.meer'); if (a) { e.preventDefault(); toonProduct(a.dataset.slug); tab('product'); }
  });
  $('#vorige').onclick = () => { pagina--; toonGrid(); };
  $('#volgende').onclick = () => { pagina++; toonGrid(); };
  $('#bestel').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, li = document.createElement('li');
    li.textContent = f.artikelnummer.value + ' × ' + (f.aantal.value || 1) + ' voor ' + (f.bedrijf.value || 'onbekend') + ' (' + f.levering.value + ')';
    $('#ontvangen').prepend(li); $('#ontvangen-kop').hidden = false;
    $('#bevestiging').textContent = 'Bestelling ontvangen: ' + li.textContent; f.reset();
  });
  // Voorbeeldlijst in het paneel laden (alsof je zelf een bestand kiest).
  function laadLijst(soort) {
    const host = document.getElementById('wt-scraper-host');
    const inp = host && host.shadowRoot && host.shadowRoot.querySelector('#flow-file');
    if (!inp) { melding('Open eerst het paneel (rechtsonder).'); return; }
    const dt = new DataTransfer();
    dt.items.add(new File([LIJSTEN[soort]], soort === 'adressen' ? 'adressen.csv' : 'bestellingen.csv', { type: 'text/csv' }));
    inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
    melding(soort === 'adressen' ? 'Lijst met 7 adressen geladen. Kies in het paneel: Handmatig → Uitlezen → Andere pagina’s, en klik Start.' : 'Lijst met 3 bestellingen geladen. Open Bestelformulier en voeg de velden toe met Handmatig → Invullen.');
  }
  function melding(t) { const m = $('#demo-melding'); m.textContent = t; m.hidden = false; clearTimeout(melding.t); melding.t = setTimeout(() => m.hidden = true, 9000); }
  document.querySelectorAll('[data-lijst]').forEach(b => b.onclick = () => laadLijst(b.dataset.lijst));
  toonGrid(); toonProduct(P[0][0]); tab('producten');
})();
"""

CSS = r"""
:root { color-scheme: light; --ink:#16181d; --muted:#5b6170; --line:#e3e6ec; --bg:#f6f7f9; --card:#fff; --accent:#0b7a52; --navy:#0c0e1b; --green:#02d678; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--ink); }
.demo-bar { background: var(--navy); color: #e8eaf2; padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
.demo-bar b { color: #fff; } .demo-bar .tag { background: rgba(2,214,120,.14); color: var(--green); border: 1px solid rgba(2,214,120,.35); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
.demo-bar .sp { flex: 1; }
.demo-bar a, .demo-bar button { font: inherit; font-size: 13px; font-weight: 600; color: #e8eaf2; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.16); border-radius: 8px; padding: 6px 11px; text-decoration: none; cursor: pointer; }
.demo-bar a.groen { background: var(--green); color: #03140b; border-color: var(--green); }
.demo-bar a:hover, .demo-bar button:hover { border-color: var(--green); }
#demo-melding { background: #e8fbf2; color: #064e33; border-bottom: 1px solid #b8eed6; padding: 9px 16px; font-weight: 600; }
.uitleg { max-width: 980px; margin: 16px auto 0; padding: 0 16px; }
.uitleg details { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; }
.uitleg summary { cursor: pointer; font-weight: 700; }
.uitleg ol { margin: 10px 0 4px; padding-left: 20px; } .uitleg li { margin: 4px 0; } .uitleg p { color: var(--muted); margin: 8px 0 0; }
.shop { max-width: 980px; margin: 16px auto 40px; padding: 0 16px; }
.shop-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 0; }
.shop-head .logo { font-weight: 800; font-size: 20px; letter-spacing: -.01em; } .shop-head .logo span { color: var(--accent); }
.shop-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.shop-tabs button { font: inherit; font-weight: 600; background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; cursor: pointer; color: var(--ink); }
.shop-tabs button[aria-selected="true"] { background: var(--ink); color: #fff; border-color: var(--ink); }
.view h2 { margin: 6px 0 12px; font-size: 22px; }
#grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.ph { height: 96px; border-radius: 8px; background: linear-gradient(135deg, #dfe7f1, #eef2f7); margin-bottom: 6px; }
.ph.groot { height: 220px; width: 100%; }
.card h3 { margin: 0; font-size: 15px; } .prijs { font-weight: 800; font-size: 17px; }
.voorraad.op { color: var(--accent); font-size: 13px; } .voorraad.uit { color: #b42318; font-size: 13px; } .art { color: var(--muted); font-size: 12px; }
.meer { margin-top: 6px; align-self: flex-start; color: var(--accent); font-weight: 700; text-decoration: none; }
.pager { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.pager button { font: inherit; font-weight: 600; background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; cursor: pointer; }
.pager button:disabled { opacity: .45; cursor: default; }
.kruim { color: var(--muted); font-size: 13px; margin: 4px 0 10px; } .kruim a { color: var(--accent); }
.product { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 20px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
.product h1 { margin: 0 0 6px; font-size: 26px; } .price { font-size: 24px; font-weight: 800; }
.specs { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; margin: 14px 0; } .specs dt { color: var(--muted); } .specs dd { margin: 0; font-weight: 600; }
.omschrijving { color: var(--muted); }
form#bestel { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; max-width: 640px; }
form#bestel label { display: flex; flex-direction: column; gap: 4px; font-weight: 600; font-size: 13px; }
form#bestel input, form#bestel select { font: inherit; padding: 8px 10px; border: 1px solid #cdd2db; border-radius: 8px; background: #fff; }
form#bestel button { grid-column: 1 / -1; justify-self: start; font: inherit; font-weight: 700; background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 9px 16px; cursor: pointer; }
#bevestiging { color: var(--accent); font-weight: 600; min-height: 1.5em; }
#ontvangen { color: var(--muted); }
.klein-scherm { display: none; background: #fff7e6; color: #7a4b00; padding: 9px 16px; border-bottom: 1px solid #f3d9a4; font-weight: 600; }
@media (max-width: 900px) { .klein-scherm { display: block; } .product { grid-template-columns: minmax(0, 1fr); } form#bestel { grid-template-columns: minmax(0, 1fr); } }
"""

BODY = """
<div class="demo-bar" role="region" aria-label="ParseLab demo">
  <b>ParseLab scrapetool {V}</b><span class="tag">Demo in je browser</span>
  <span>Het echte paneel van de extensie, op een voorbeeldwebshop.</span>
  <span class="sp"></span>
  <button type="button" data-lijst="adressen">Voorbeeldlijst met adressen</button>
  <button type="button" data-lijst="formulier">Voorbeeldlijst voor het formulier</button>
  <a href="downloads/parselab-extension.zip" download>Download extensie {V}</a>
  <a class="groen" href="index.html">Naar de website</a>
</div>
<div class="klein-scherm">Op een klein scherm bedekt het paneel de pagina. Bekijk deze demo op een computer.</div>
<div id="demo-melding" role="status" hidden></div>

<div class="uitleg"><details open><summary>Probeer dit (2 minuten)</summary>
  <ol>
    <li><b>Andere pagina's uitlezen (nieuw in {V}):</b> klik hierboven <i>Voorbeeldlijst met adressen</i>. Kies in het paneel <i>Handmatig → Uitlezen → Andere pagina's</i> en klik <i>Start</i>. ParseLab haalt elk adres op, ook van een andere website en van een pagina die pas met JavaScript gevuld wordt, en zet titel, prijs, merk en tekst in het resultaat.</li>
    <li><b>Velden kiezen:</b> open de stap, klik <i>Veld aanwijzen</i> en klik op de productpagina op de titel en de prijs. Klik <i>Test op eerste adres</i> en daarna weer <i>Start</i>.</li>
    <li><b>Een lijst uitlezen:</b> <i>Handmatig → Uitlezen → Tabel / lijst</i>, klik op één product. Met <i>Volgende</i> erbij bladert ParseLab door.</li>
    <li><b>Een formulier invullen:</b> laad de <i>Voorbeeldlijst voor het formulier</i>, open <i>Bestelformulier</i> en wijs met <i>Handmatig → Invullen</i> de velden en de knop aan.</li>
  </ol>
  <p>Voorbeelddata: niets verlaat je browser. Cloud, planning, PDF, ZIP en de AI-assistent werken alleen in de geïnstalleerde extensie.</p>
</details></div>

<div class="shop">
  <div class="shop-head"><div class="logo">Fiets<span>shop</span> <small style="font-weight:500;color:#5b6170">(voorbeeld)</small></div>
    <nav class="shop-tabs" aria-label="Webshop"><button type="button" data-tab="producten">Producten</button><button type="button" data-tab="product">Productpagina</button><button type="button" data-tab="bestellen">Bestelformulier</button></nav></div>
  <section class="view" id="v-producten"><h2>Accessoires</h2><div id="grid"></div>
    <div class="pager"><button type="button" id="vorige">Vorige</button><span id="pag"></span><button type="button" id="volgende">Volgende</button></div></section>
  <section class="view" id="v-product" hidden><div id="product"></div></section>
  <section class="view" id="v-bestellen" hidden><h2>Bestelformulier</h2>
    <form id="bestel" autocomplete="off">
      <label>Artikelnummer<input name="artikelnummer" placeholder="bv. FL-2041" required></label>
      <label>Aantal<input name="aantal" type="number" min="1" value="1"></label>
      <label>Bedrijf<input name="bedrijf" placeholder="Naam bedrijf"></label>
      <label>Levering<select name="levering"><option>Standaard</option><option>Spoed</option><option>Afhalen</option></select></label>
      <button type="submit">Bestelling versturen</button>
    </form>
    <p id="bevestiging" role="status"></p><h3 id="ontvangen-kop" hidden>Ontvangen bestellingen</h3><ul id="ontvangen"></ul></section>
</div>
"""


def bouw():
    stub = STUB.replace('__PAGINAS__', json.dumps(PAGINAS, ensure_ascii=False).replace('</', '<\\/'))
    shop = (SHOP_JS.replace('__PRODUCTEN__', json.dumps(PRODUCTEN, ensure_ascii=False))
            .replace('__LIJST_ADRESSEN__', json.dumps(LIJST_ADRESSEN, ensure_ascii=False))
            .replace('__LIJST_FORMULIER__', json.dumps(LIJST_FORMULIER, ensure_ascii=False)))
    js = panel_js.replace('</script', '<\\/script')
    out = ('<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
           '<title>ParseLab scrapetool</title>\n'
           f'<meta name="description" content="Probeer het echte ParseLab-paneel {versie} in je browser, op een voorbeeldwebshop. Zonder installatie, met voorbeelddata.">\n'
           '<meta name="robots" content="noindex">\n'
           '<link rel="icon" href="assets/parselab/logo.svg" type="image/svg+xml">\n'
           '<style>' + CSS + '</style>\n<style>' + panel_css + '</style>\n</head>\n<body>\n'
           + BODY.replace('{V}', versie) +
           '\n<script>' + stub + '</script>\n<script>' + shop + '</script>\n<script>' + js + '</script>\n</body>\n</html>\n')
    pad = os.path.join(ROOT, 'scrapetool.html')
    open(pad, 'w', encoding='utf-8').write(out)
    print(f'scrapetool.html: versie {versie}, {len(out) // 1024} KB')


if __name__ == '__main__':
    bouw()
