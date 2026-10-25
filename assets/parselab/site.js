/* ParseLab: gedeelde scripts voor alle pagina's. Geen externe bibliotheken. */
(function () {
  'use strict';
  var stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  // Wachtlijst: alleen invoegen; de database laat niemand de lijst uitlezen (RLS).
  var DB = { url: 'https://gpkohiyzdjyehqdkgpdb.supabase.co', key: 'sb_publishable_Dtsp2Q9T8svTU3DmYCzzVg_hGDaztE2' };

  /* ---- menu en inloggen ---- */
  var nav = $('nav'), menu = $('menu-btn'), login = $('login-btn'), pop = $('login-pop');
  if (menu) {
    menu.addEventListener('click', function () { var o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    nav.querySelectorAll('.tabs a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }); });
  }
  if (login && pop) {
    login.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; login.setAttribute('aria-expanded', pop.hidden ? 'false' : 'true'); });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) { pop.hidden = true; login.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (pop) pop.hidden = true; if (nav) nav.classList.remove('open'); } });

  /* ---- is de extensie geïnstalleerd? (bridge.js in de extensie antwoordt) ---- */
  function gevonden(v) {
    document.documentElement.classList.add('has-ext');
    var t = 'ParseLab ' + v + ' is geïnstalleerd in deze browser.';
    document.querySelectorAll('[data-ext-ok]').forEach(function (el) { el.textContent = t + ' Open hem met Alt+Shift+S.'; });
    document.querySelectorAll('[data-cta]').forEach(function (b) { b.textContent = 'Je hebt ParseLab al'; });
  }
  window.addEventListener('message', function (ev) { var d = ev && ev.data; if (d && d.source === 'parselab-extension' && d.type === 'parselab:extension' && d.version) gevonden(String(d.version).slice(0, 12)); });
  if (document.documentElement.dataset.parselabExtension) gevonden(document.documentElement.dataset.parselabExtension);
  try { window.postMessage({ source: 'parselab-dashboard', type: 'parselab:ping' }, '*'); } catch (e) {}

  /* ---- netwerk-achtergrond (hero en paginakoppen) ---- */
  document.querySelectorAll('canvas.net').forEach(function (cv) {
    var ctx = cv.getContext && cv.getContext('2d'); if (!ctx) return;
    var pts = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function maat() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); var n = Math.round(Math.min(70, W * H / 16000)); pts = []; for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18 }); }
    function teken() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (var j = i + 1; j < pts.length; j++) { var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 150) { ctx.strokeStyle = 'rgba(2,214,120,' + (0.16 * (1 - d / 150)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
        ctx.fillStyle = 'rgba(2,214,120,.55)'; ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
      }
    }
    function stap() { pts.forEach(function (p) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }); teken(); if (!document.hidden) requestAnimationFrame(stap); }
    maat(); teken();
    window.addEventListener('resize', function () { maat(); teken(); });
    if (!stil) { requestAnimationFrame(stap); document.addEventListener('visibilitychange', function () { if (!document.hidden) requestAnimationFrame(stap); }); }
  });

  /* ---- wachtlijst- en vraagformulieren ---- */
  document.querySelectorAll('form[data-wachtlijst]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = f.querySelector('.form-st'), knop = f.querySelector('button[type="submit"]');
      var email = (f.elements.email.value || '').trim(), taak = f.elements.taak ? f.elements.taak.value.trim() : '';
      st.className = 'form-st'; st.textContent = '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { st.className = 'form-st bad'; st.textContent = 'Vul een geldig e-mailadres in.'; f.elements.email.focus(); return; }
      if (f.elements.website && f.elements.website.value) { st.className = 'form-st ok'; st.textContent = 'Dank je, je staat op de lijst.'; f.reset(); return; }   // robotveld
      knop.disabled = true; st.textContent = 'Versturen…';
      fetch(DB.url + '/rest/v1/wachtlijst', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ email: email, taak: taak || null, soort: f.dataset.wachtlijst || 'wachtlijst', bron: (location.pathname || '/').slice(0, 200) }) })
        .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); st.className = 'form-st ok'; st.textContent = f.dataset.wachtlijst === 'vraag' ? 'Dank je. We antwoorden per e-mail.' : 'Dank je, je staat op de lijst. We mailen je zodra er nieuws is.'; f.reset(); })
        .catch(function () { st.className = 'form-st bad'; st.textContent = 'Versturen lukte niet. Probeer het later opnieuw.'; })
        .then(function () { knop.disabled = false; });
    });
  });

  /* ---- filters op de toepassingen-pagina ---- */
  var fb = document.querySelectorAll('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.dataset.cat;
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-cat-item]').forEach(function (k) { k.hidden = !(cat === 'alle' || k.dataset.catItem === cat); });
    });
  });
})();
