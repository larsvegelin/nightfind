/* ParseLab: hero-loop (beschrijven → assistent → flow → resultaat). Voorbeelddata. */
(function () {
  'use strict';
  if (!document.getElementById('app')) return;
  var stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  /* ---- hero-loop: beschrijven → assistent → flow bouwt zich op → resultaat ---- */
  var IC = {
    klok: '<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M6 3.6V6l1.7 1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    lees: '<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2" width="9" height="8" rx="1.4" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 5h9M4.5 5v5" stroke="currentColor" stroke-width="1.3"/></svg>',
    opslaan: '<svg viewBox="0 0 12 12" fill="none"><path d="M6 1.8v6M3.4 5.4 6 8l2.6-2.6M2 10.2h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    lijst: '<svg viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    vul: '<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="3" width="9" height="6" rx="1.4" stroke="currentColor" stroke-width="1.3"/><path d="M3.6 6h2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    klik: '<svg viewBox="0 0 12 12" fill="none"><path d="M3 2l6 3.6-2.6.7L5 9 3 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 12 12" fill="none"><path d="M1.5 3.2h3l1 1.2h5v5.2h-9V3.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    doc: '<svg viewBox="0 0 12 12" fill="none"><path d="M3 1.5h4l2 2v7H3v-9Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    chk: '<svg viewBox="0 0 10 10" fill="none"><path d="m2.4 5.1 1.7 1.7 3.5-3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var SCENES = [
    { titel: 'Productprijzen ophalen', badge: 'Verzamel data',
      vraag: 'Haal elke maandag alle producten en prijzen van shop.nl op en zet ze in Excel',
      antwoord: 'Komt goed! Elke maandag om 9:00 lees ik alle productpagina’s uit en schrijf ik naam, prijs en voorraad naar Excel.',
      nodes: [['s-he', 'klok', '1. Elke maandag', 'Planning · maandag 9:00'], ['s-ui', 'lees', '2. Producten uitlezen', 'shop.nl · alle pagina’s'], ['s-op', 'opslaan', '3. Naar Excel', 'producten.xlsx · per run']],
      result: function () { return '<div class="r-head">' + IC.lees + '<b>producten.xlsx</b><span class="pill">286 producten</span></div><table class="r-tab"><thead><tr><th>#</th><th>Product</th><th>Prijs</th><th>Voorraad</th></tr></thead><tbody>' +
        [['1', 'Fietslamp LED', '24,95', '18'], ['2', 'Bidon 750 ml', '7,49', '64'], ['3', 'Zadeltas klein', '19,00', '6'], ['4', 'Fietspomp mini', '14,95', '31'], ['5', 'Kettingolie', '8,99', '42']].map(function (r, i) { return '<tr class="r' + i + '"><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="num">€ ' + r[2] + '</td><td class="num">' + r[3] + '</td></tr>'; }).join('') + '</tbody></table>'; },
      speel: function (res, wacht) { var rijen = res.querySelectorAll('tbody tr'); rijen.forEach(function (r) { r.style.opacity = 0; }); var k = 0; return (function volgende() { if (k >= rijen.length) return Promise.resolve(); rijen[k].style.opacity = 1; rijen[k].classList.add('new'); var vorige = rijen[k - 1]; if (vorige) vorige.classList.remove('new'); k++; return wacht(260).then(volgende); })(); } },
    { titel: 'Aanmeldingen invoeren', badge: 'Vul formulieren',
      vraag: 'Vul voor elke regel uit mijn lijst het aanmeldformulier in en klik op versturen',
      antwoord: 'Klaar: ik neem aanmeldingen.csv, vul per regel naam, e-mail en datum in en klik op Versturen. Wat niet lukt, meld ik apart.',
      nodes: [['s-ui', 'lijst', '1. Lijst', 'aanmeldingen.csv · 120 regels'], ['s-in', 'vul', '2. Formulier invullen', 'naam · e-mail · datum'], ['s-kl', 'klik', '3. Versturen', 'klik · wacht op bevestiging']],
      result: function () { return '<div class="r-head">' + IC.vul + '<b>Aanmeldingen invoeren</b><span class="pill" id="r-pill">bezig</span></div><div class="prog"><span class="big" id="r-n">Ronde 0 van 120</span><div class="bar"><span id="r-bar"></span></div></div><div class="logl" id="r-log"></div>'; },
      speel: function (res, wacht) { var n = 0, log = res.querySelector('#r-log'), namen = ['Sanne de Vries', 'Mehmet Yilmaz', 'Lotte Bakker', 'Noah Jansen', 'Eva Visser'];
        return (function tik() { if (n >= 120) { res.querySelector('#r-pill').textContent = '120 klaar'; return Promise.resolve(); } n = Math.min(120, n + (n < 10 ? 2 : 11)); res.querySelector('#r-n').textContent = 'Ronde ' + n + ' van 120'; res.querySelector('#r-bar').style.width = (n / 120 * 100) + '%';
          var regel = document.createElement('div'); regel.innerHTML = '<b>✓</b>' + namen[n % namen.length] + ' · verstuurd'; log.prepend(regel); while (log.children.length > 5) log.lastChild.remove(); return wacht(240).then(tik); })(); } },
    { titel: 'Facturen per klant', badge: 'Bewaar bestanden',
      vraag: 'Sla van elke klant in mijn lijst de facturen op als PDF in een eigen map',
      antwoord: 'Doe ik: per klant zoek ik het nummer op, open ik elke factuur en sla ik hem op als PDF in een map met de klantnaam. Aan het eind krijg je één ZIP.',
      nodes: [['s-in', 'vul', '1. Klant zoeken', 'klantnummer uit klanten.xlsx'], ['s-he', 'lijst', '2. Elke factuur', 'lus over de facturen'], ['s-op', 'map', '3. PDF per klant', '{{klant}}/{{factuur}}.pdf · ZIP']],
      result: function () { return '<div class="r-head">' + IC.map + '<b>facturen.zip</b><span class="pill">36 PDF’s</span></div><div class="files">' +
        [['Bakker Fietsen', ['F-2031.pdf', 'F-2044.pdf']], ['De Vries & Zn', ['F-1987.pdf', 'F-2050.pdf', 'F-2061.pdf']], ['Jansen Sport', ['F-2012.pdf']]].map(function (k) { return '<div class="fd">' + IC.map + k[0] + '</div>' + k[1].map(function (f) { return '<div class="fl">' + IC.doc + f + '</div>'; }).join(''); }).join('') + '</div>'; },
      speel: function (res, wacht) { var regels = res.querySelectorAll('.fd, .fl'); regels.forEach(function (r) { r.style.opacity = 0; }); var k = 0; return (function volgende() { if (k >= regels.length) return Promise.resolve(); regels[k].style.transition = 'opacity .3s ease'; regels[k].style.opacity = 1; k++; return wacht(200).then(volgende); })(); } }
  ];
  var app = $('app'), prompt = $('prompt'), promptT = $('prompt-t'), veil = $('veil'), nodes = $('nodes'), result = $('result');
  var mUser = $('m-user'), mUserT = $('m-user-t'), mBot = $('m-bot'), mBotT = $('m-bot-t'), mOk = $('m-ok');
  var token = 0;
  function wacht(ms) { var t = token; return new Promise(function (res, rej) { setTimeout(function () { t === token ? res() : rej('stop'); }, ms); }); }
  function typ(el, tekst, snel) { var i = 0; return (function volgende() { if (i > tekst.length) return Promise.resolve(); el.textContent = tekst.slice(0, i); i += 1 + (Math.random() < .3 ? 1 : 0); return wacht(snel || 34).then(volgende); })(); }
  function bouwNodes(sc) { nodes.innerHTML = sc.nodes.map(function (n, i) { return (i ? '<span class="link"></span>' : '') + '<div class="node ' + n[0] + '"><span class="ic">' + IC[n[1]] + '</span><span class="nt"><b>' + n[2] + '</b><small>' + n[3] + '</small></span><span class="chk">' + IC.chk + '</span></div>'; }).join(''); }
  function leeg(sc) {
    $('a-title').textContent = 'Nieuwe flow'; $('a-chip').textContent = 'Concept'; $('a-chip').classList.remove('live'); $('a-badge').textContent = sc.badge;
    mUser.classList.remove('show'); mBot.classList.remove('show'); mUserT.textContent = ''; mBotT.textContent = ''; mOk.hidden = true;
    bouwNodes(sc); result.classList.remove('show'); result.innerHTML = sc.result();
  }
  function eindbeeld(sc) {   // stilstaand beeld (ook voor wie geen beweging wil)
    leeg(sc); $('a-title').textContent = sc.titel; $('a-chip').textContent = 'Live'; $('a-chip').classList.add('live');
    mUserT.textContent = sc.vraag; mUser.classList.add('show'); mBotT.textContent = sc.antwoord; mBot.classList.add('show'); mOk.hidden = false;
    nodes.querySelectorAll('.node, .link').forEach(function (n) { n.classList.add('show', 'done'); });
  }
  function scene(i) {
    var sc = SCENES[i]; leeg(sc);
    return wacht(500)
      .then(function () { promptT.textContent = ''; veil.classList.add('show'); prompt.classList.add('show'); return wacht(450); })
      .then(function () { return typ(promptT, sc.vraag); })
      .then(function () { return wacht(500); })
      .then(function () { prompt.classList.add('send'); return wacht(220); })
      .then(function () { prompt.classList.remove('send', 'show'); veil.classList.remove('show'); mUserT.textContent = sc.vraag; mUser.classList.add('show'); $('a-title').textContent = sc.titel; return wacht(650); })
      .then(function () { mBot.classList.add('show'); return typ(mBotT, sc.antwoord, 16); })
      .then(function () { var els = Array.prototype.slice.call(nodes.children), k = 0; return (function volgende() { if (k >= els.length) return Promise.resolve(); els[k].classList.add('show'); k++; return wacht(els[k - 1].classList.contains('link') ? 120 : 380).then(volgende); })(); })
      .then(function () { var ns = Array.prototype.slice.call(nodes.querySelectorAll('.node')), k = 0; return (function volgende() { if (k >= ns.length) return Promise.resolve(); ns[k].classList.add('done'); k++; return wacht(320).then(volgende); })(); })
      .then(function () { mOk.hidden = false; $('a-chip').textContent = 'Live'; $('a-chip').classList.add('live'); return wacht(700); })
      .then(function () { result.classList.add('show'); return wacht(600); })
      .then(function () { return sc.speel(result, wacht); })
      .then(function () { return wacht(2600); });
  }
  function loop(i) { scene(i).then(function () { loop((i + 1) % SCENES.length); }, function () {}); }
  if (stil) { eindbeeld(SCENES[0]); result.classList.add('show'); }
  else {
    eindbeeld(SCENES[0]);
    // Start pas als de demo in beeld is; pauzeer als hij uit beeld raakt.
    var loopt = false;
    function start() { if (loopt) return; loopt = true; token++; loop(0); }
    function stop() { if (!loopt) return; loopt = false; token++; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (it) { it[0].isIntersecting ? start() : stop(); }, { threshold: .25 }).observe(app); else start();
  }
})();
