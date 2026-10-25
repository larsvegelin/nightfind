/* ParseLab: demo-dashboard. Alles is voorbeelddata; er wordt niets gescrapet of gekoppeld. */
(function () {
  'use strict';
  var dash = document.getElementById('dash'); if (!dash) return;
  var $ = function (id) { return document.getElementById(id); };
  var stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var wacht = function (ms) { return new Promise(function (r) { setTimeout(r, stil ? 0 : ms); }); };
  var CHK = '<svg viewBox="0 0 10 10" fill="none"><path d="m2.4 5.1 1.7 1.7 3.5-3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC = {
    klok: '<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M6 3.6V6l1.7 1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    lees: '<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2" width="9" height="8" rx="1.4" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 5h9M4.5 5v5" stroke="currentColor" stroke-width="1.3"/></svg>',
    opslaan: '<svg viewBox="0 0 12 12" fill="none"><path d="M6 1.8v6M3.4 5.4 6 8l2.6-2.6M2 10.2h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    lijst: '<svg viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    vul: '<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="3" width="9" height="6" rx="1.4" stroke="currentColor" stroke-width="1.3"/><path d="M3.6 6h2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    klik: '<svg viewBox="0 0 12 12" fill="none"><path d="M3 2l6 3.6-2.6.7L5 9 3 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 12 12" fill="none"><path d="M1.5 3.2h3l1 1.2h5v5.2h-9V3.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>'
  };
  // Drie voorbeelden; de chat kiest op trefwoorden.
  var SC = [
    { sleutel: /prijs|product|webshop|catalog|excel.*shop/i, titel: 'Productprijzen ophalen', badge: 'Verzamel data',
      antwoord: 'Komt goed! Elke maandag om 9:00 lees ik alle productpagina’s van shop.nl uit en schrijf ik naam, prijs en voorraad naar een tabel.',
      nodes: [['s-he', 'klok', 'Elke maandag', 'Planning · maandag 9:00'], ['s-ui', 'lees', 'Producten uitlezen', 'shop.nl · alle pagina’s'], ['s-op', 'opslaan', 'Naar de tabel', 'producten · per run']],
      tabel: 'producten', kol: ['Product', 'Prijs', 'Voorraad'], rijen: [['Fietslamp LED', '€ 24,95', '18'], ['Bidon 750 ml', '€ 7,49', '64'], ['Zadeltas klein', '€ 19,00', '6'], ['Fietspomp mini', '€ 14,95', '31'], ['Kettingolie', '€ 8,99', '42']] },
    { sleutel: /formulier|invul|invoer|bestel|regel/i, titel: 'Bestellingen invoeren', badge: 'Vul formulieren',
      antwoord: 'Klaar: ik neem je lijst, vul per regel artikel en aantal in op het bestelformulier en klik op Versturen. Wat niet lukt, zet ik apart.',
      nodes: [['s-ui', 'lijst', 'Je lijst', 'bestellingen.csv · 4 regels'], ['s-in', 'vul', 'Formulier invullen', 'artikel · aantal'], ['s-kl', 'klik', 'Versturen', 'en bevestiging uitlezen']],
      tabel: 'bestellingen', kol: ['Artikel', 'Aantal', 'Status', 'Bevestiging'], rijen: [['BD-0750', '24', 'verstuurd', 'B-10231'], ['FL-2041', '6', 'verstuurd', 'B-10232'], ['ZT-0110', '12', 'overgeslagen', 'niet gevonden'], ['KO-0050', '30', 'verstuurd', 'B-10233']] },
    { sleutel: /factu|pdf|download|bestand/i, titel: 'Facturen als PDF', badge: 'Bewaar bestanden',
      antwoord: 'Doe ik: elke maand open ik elke factuur in het portaal en sla ik hem op als PDF in een map per maand. Aan het eind krijg je één ZIP.',
      nodes: [['s-he', 'klok', 'Elke maand', 'Planning · de 1e om 8:00'], ['s-he', 'lijst', 'Elke factuur', 'lus over de facturen'], ['s-op', 'map', 'PDF per maand', '{{maand}}/{{factuur}}.pdf · ZIP']],
      tabel: 'facturen', kol: ['Map', 'Bestand', 'Bedrag'], rijen: [['2026-09', 'F-2031.pdf', '€ 1.240,00'], ['2026-09', 'F-2044.pdf', '€ 310,50'], ['2026-10', 'F-2050.pdf', '€ 98,00'], ['2026-10', 'F-2061.pdf', '€ 2.015,75']] }
  ];
  var TABELLEN = [
    { naam: 'vacatures', sub: 'gisteren · 4 rijen', kol: ['Functie', 'Plaats', 'Uren'], rijen: [['Medewerker administratie', 'Zwolle', '32'], ['Data-analist', 'Utrecht', '36'], ['Inkoper', 'Tilburg', '40'], ['Marketeer', 'Leiden', '24']] },
    { naam: 'prijzen concurrenten', sub: 'vandaag 07:45 · 4 rijen', kol: ['Product', 'Jij', 'Concurrent A'], rijen: [['Fietslamp LED', '€ 24,95', '€ 22,50'], ['Bidon 750 ml', '€ 7,49', '€ 7,49'], ['Zadeltas klein', '€ 19,00', '€ 21,00'], ['Kettingolie', '€ 8,99', '€ 8,99']] },
    { naam: 'website-pagina’s', sub: 'vorige week · 4 rijen', kol: ['Pagina', 'Titel', 'Description'], rijen: [['/', 'Fietswinkel', '142 tekens'], ['/lampen', 'Fietslampen', 'ontbreekt'], ['/tassen', 'Fietstassen', '98 tekens'], ['/contact', 'Contact', '61 tekens']] }
  ];
  var HIST = [
    ['klaar', 'Prijzen concurrenten', 'vandaag 07:45', 'gepland', '40', '1 min'],
    ['klaar', 'Vacatures', 'gisteren 08:00', 'gepland', '23', '2 min'],
    ['fouten', 'Bestellingen invoeren', 'gisteren 14:12', 'handmatig', '38/40', '4 min'],
    ['klaar', 'Website-pagina’s', '21-10 10:30', 'handmatig', '212', '6 min']
  ];

  /* ---- onderdelen wisselen ---- */
  var knoppen = dash.querySelectorAll('.d-nav button');
  function toon(v) {
    knoppen.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.view === v ? 'true' : 'false'); });
    dash.querySelectorAll('.d-view').forEach(function (d) { d.hidden = d.dataset.view !== v; });
  }
  knoppen.forEach(function (b) { b.addEventListener('click', function () { toon(b.dataset.view); }); });

  /* ---- tabellen en geschiedenis ---- */
  var gekozen = 0;
  function tekenTabellen() {
    $('cnt-tab').textContent = TABELLEN.length;
    $('d-tlist').innerHTML = TABELLEN.map(function (t, i) { return '<button type="button" role="option" aria-selected="' + (i === gekozen) + '" data-i="' + i + '">' + esc(t.naam) + '<small>' + esc(t.sub) + '</small></button>'; }).join('');
    $('d-tlist').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { gekozen = +b.dataset.i; tekenTabellen(); }); });
    var t = TABELLEN[gekozen];
    $('d-tview').innerHTML = '<table class="r-tab"><thead><tr><th>#</th>' + t.kol.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.rijen.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function tekenHist() {
    $('d-hist').innerHTML = HIST.map(function (h) { return '<tr><td><span class="d-st' + (h[0] === 'klaar' ? '' : ' f') + '">' + esc(h[0]) + '</span></td><td>' + esc(h[1]) + '</td><td>' + esc(h[2]) + '</td><td>' + esc(h[3]) + '</td><td class="num">' + esc(h[4]) + '</td><td>' + esc(h[5]) + '</td></tr>'; }).join('');
  }
  $('d-csv').addEventListener('click', function () {
    var t = TABELLEN[gekozen], q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var csv = [t.kol.map(q).join(';')].concat(t.rijen.map(function (r) { return r.map(q).join(';'); })).join('\r\n');
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = t.naam.replace(/[^a-z0-9]+/gi, '-') + '.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); } catch (e) {}
  });
  tekenTabellen(); tekenHist();

  /* ---- chat → flow → test → publiceren ---- */
  var huidig = null, bezig = false;
  function bericht(wie, html) {
    var m = document.createElement('div'); m.className = 'msg' + (wie === 'jij' ? ' user' : '');
    m.innerHTML = (wie === 'jij' ? '' : '<span class="av" aria-hidden="true">AI</span>') + '<div>' + html + '</div>';
    $('d-msgs').appendChild(m); requestAnimationFrame(function () { m.classList.add('show'); });
    $('d-msgs').scrollTop = 1e6; return m;
  }
  function typ(el, tekst) { var i = 0; return (function v() { if (i > tekst.length) return Promise.resolve(); el.textContent = tekst.slice(0, i); i += 2; $('d-msgs').scrollTop = 1e6; return wacht(14).then(v); })(); }
  function chip(t, live) { var c = $('d-chip'); c.textContent = t; c.classList.toggle('live', !!live); }
  function vraag(tekst) {
    if (bezig) return; tekst = String(tekst || '').trim(); if (!tekst) return;
    bezig = true; toon('flows');
    bericht('jij', '<p>' + esc(tekst) + '</p>');
    var sc = null; for (var i = 0; i < SC.length; i++) if (SC[i].sleutel.test(tekst)) { sc = SC[i]; break; }
    var b = bericht('ai', '<p></p>');
    if (!sc) {
      return typ(b.querySelector('p'), 'In deze demo ken ik drie voorbeelden: producten en prijzen ophalen, een lijst invoeren in een formulier, en facturen als PDF bewaren. Kies er een hieronder. In de extensie bouw je elke taak die je in de browser doet.').then(function () { bezig = false; });
    }
    huidig = sc; $('d-result').classList.remove('show'); $('d-title').textContent = sc.titel; chip('Concept'); $('d-badge').textContent = sc.badge;
    $('d-test').disabled = true; $('d-pub').disabled = true;
    $('d-nodes').innerHTML = sc.nodes.map(function (n, i) { return (i ? '<span class="link"></span>' : '') + '<div class="node ' + n[0] + '"><span class="ic">' + IC[n[1]] + '</span><span class="nt"><b>' + (i + 1) + '. ' + esc(n[2]) + '</b><small>' + esc(n[3]) + '</small></span><span class="chk">' + CHK + '</span></div>'; }).join('');
    return typ(b.querySelector('p'), sc.antwoord).then(function () {
      var els = Array.prototype.slice.call($('d-nodes').children), k = 0;
      return (function v() { if (k >= els.length) return Promise.resolve(); els[k].classList.add('show'); k++; return wacht(260).then(v); })();
    }).then(function () { bericht('ai', '<p>De flow staat klaar. Klik op <b>Test flow</b> om hem op voorbeelddata te proberen.</p>'); $('d-test').disabled = false; bezig = false; });
  }
  $('d-test').addEventListener('click', function () {
    if (!huidig || bezig) return; bezig = true; $('d-test').disabled = true;
    var ns = Array.prototype.slice.call($('d-nodes').querySelectorAll('.node')), k = 0;
    (function v() { if (k >= ns.length) return Promise.resolve(); ns[k].classList.add('done'); k++; return wacht(320).then(v); })().then(function () {
      var sc = huidig;
      $('d-result').innerHTML = '<div class="r-head"><b>' + esc(sc.tabel) + '</b><span class="pill">' + sc.rijen.length + ' rijen · voorbeeld</span></div><table class="r-tab"><thead><tr>' + sc.kol.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        sc.rijen.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      $('d-result').classList.add('show'); chip('Getest');
      bericht('ai', '<p>Getest op voorbeelddata: ' + sc.rijen.length + ' rijen. Ziet het er goed uit? Klik op <b>Publiceren</b>.</p>');
      $('d-pub').disabled = false; bezig = false;
    });
  });
  $('d-pub').addEventListener('click', function () {
    if (!huidig) return; var sc = huidig; $('d-pub').disabled = true; chip('Live', true);
    var m = bericht('ai', '<p></p>'); m.querySelector('div').innerHTML = '<p>Live. De flow staat in je overzicht.</p><div class="ok-line"><svg viewBox="0 0 12 12" fill="none" width="12" height="12"><circle cx="6" cy="6" r="5" fill="currentColor"/><path d="m3.8 6.1 1.5 1.5 3-3" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Gebouwd, getest en live</div>';
    TABELLEN.unshift({ naam: sc.tabel, sub: 'zojuist · ' + sc.rijen.length + ' rijen', kol: sc.kol, rijen: sc.rijen }); gekozen = 0; tekenTabellen();
    HIST.unshift(['klaar', sc.titel, 'zojuist', 'test', String(sc.rijen.length), '< 1 min']); tekenHist();
  });
  $('d-form').addEventListener('submit', function (ev) { ev.preventDefault(); var v = $('d-q').value; $('d-q').value = ''; vraag(v); });
  dash.querySelectorAll('[data-q]').forEach(function (b) { b.addEventListener('click', function () { vraag(b.dataset.q); }); });
})();
