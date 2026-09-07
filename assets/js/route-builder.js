// NightFind — onboarding + AI-routebouwer.
(function () {
  const C = window.NF_CONFIG;
  const A = window.NF_AFFILIATES;
  const sb = window.supabase ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;

  // ---------- State ----------
  const profile = { country: '', city: '', cityId: null, trip: 'night', group: 'friends', budget: '€€', interests: ['restaurant', 'bar', 'club'], vibe: 'mixed' };
  let step = 0;
  let route = null;
  let venues = { bars: [], clubs: [] };

  const FALLBACK_CITIES = [
    { country: 'Netherlands', name: 'Amsterdam' }, { country: 'Netherlands', name: 'Rotterdam' },
    { country: 'Spain', name: 'Barcelona' }, { country: 'Spain', name: 'Madrid' },
    { country: 'Germany', name: 'Berlin' }, { country: 'Portugal', name: 'Lisbon' },
    { country: 'Czechia', name: 'Prague' }, { country: 'United Kingdom', name: 'London' },
    { country: 'Hungary', name: 'Budapest' }, { country: 'Italy', name: 'Rome' }
  ];

  // ---------- Onboarding steps ----------
  const steps = [
    {
      title: 'Waar ga je heen?', subtitle: 'Kies een land en stad.',
      render: () => `
        <div class="nf-grid-2">
          <div class="form-group"><label>Land</label><select id="nfCountry"></select></div>
          <div class="form-group"><label>Stad</label><select id="nfCity"></select></div>
        </div>`,
      mount: loadPlaces,
      valid: () => !!profile.city
    },
    {
      title: 'Wat voor trip wordt het?', subtitle: 'Bepaalt de lengte en opbouw van je route.',
      render: () => chips('trip', [['night', '🌙 Avond uit'], ['day', '☀️ Hele dag'], ['weekend', '🧳 Weekend']])
    },
    {
      title: 'Met wie ga je?', subtitle: 'We stemmen de sfeer hierop af.',
      render: () => chips('group', [['friends', '👯 Vrienden'], ['couple', '💑 Partner'], ['solo', '🧍 Solo'], ['party', '🎉 Vrijgezellen/groep'], ['family', '👨‍👩‍👧 Familie']])
    },
    {
      title: 'Wat is je budget?', subtitle: 'Per persoon, ongeveer.',
      render: () => chips('budget', [['€', '€ Budget'], ['€€', '€€ Gemiddeld'], ['€€€', '€€€ Luxe']])
    },
    {
      title: 'Wat wil je doen?', subtitle: 'Kies alles wat je aanspreekt.',
      render: () => chips('interests', [['restaurant', '🍽️ Restaurants'], ['bar', '🍸 Bars'], ['club', '🪩 Clubs'], ['activity', '🎟️ Activiteiten'], ['hotel', '🏨 Hotel']], true),
      valid: () => profile.interests.length > 0
    },
    {
      title: 'Welke vibe?', subtitle: 'Laatste vraag, dan bouwen we je route.',
      render: () => chips('vibe', [['mixed', '🎲 Verras me'], ['chill', '🛋️ Relaxed'], ['party', '🔥 Feest'], ['culture', '🎨 Cultuur & eten'], ['local', '🎷 Lokaal & authentiek']])
    }
  ];

  function chips(key, options, multi = false) {
    return `<div class="nf-chips">${options.map(([v, l]) => {
      const active = multi ? profile[key].includes(v) : profile[key] === v;
      return `<button type="button" class="filter-chip nf-chip ${active ? 'active' : ''}" data-key="${key}" data-value="${v}" data-multi="${multi}">${l}</button>`;
    }).join('')}</div>`;
  }

  async function loadPlaces() {
    let cities = FALLBACK_CITIES;
    try {
      if (sb) {
        const { data: cs } = await sb.from('cities').select('id, name, country_id').order('name');
        const { data: ks } = await sb.from('countries').select('id, name');
        if (cs && cs.length) {
          const kmap = Object.fromEntries((ks || []).map(k => [k.id, k.name]));
          cities = cs.map(c => ({ id: c.id, name: c.name, country: kmap[c.country_id] || 'Other' }));
        }
      }
    } catch (e) { console.warn('cities fallback', e); }

    const countrySel = document.getElementById('nfCountry');
    const citySel = document.getElementById('nfCity');
    const countries = [...new Set(cities.map(c => c.country))].sort();
    countrySel.innerHTML = countries.map(k => `<option value="${k}">${k}</option>`).join('');
    const fillCities = () => {
      const k = countrySel.value;
      const list = cities.filter(c => c.country === k);
      citySel.innerHTML = list.map(c => `<option value="${c.name}" data-id="${c.id || ''}">${c.name}</option>`).join('');
      profile.country = k;
      profile.city = citySel.value;
      profile.cityId = citySel.selectedOptions[0]?.dataset.id || null;
    };
    countrySel.addEventListener('change', fillCities);
    citySel.addEventListener('change', () => { profile.city = citySel.value; profile.cityId = citySel.selectedOptions[0]?.dataset.id || null; });
    countrySel.value = profile.country || (countries.includes('Netherlands') ? 'Netherlands' : countries[0]);
    fillCities();
    if (profile.city) citySel.value = profile.city;
  }

  // ---------- Rendering ----------
  const el = (id) => document.getElementById(id);

  function renderStep() {
    const s = steps[step];
    el('nfProgress').style.width = `${((step + 1) / steps.length) * 100}%`;
    el('nfStepLabel').textContent = `Stap ${step + 1} van ${steps.length}`;
    el('nfStepTitle').textContent = s.title;
    el('nfStepSub').textContent = s.subtitle;
    el('nfStepBody').innerHTML = s.render();
    el('nfBack').style.visibility = step === 0 ? 'hidden' : 'visible';
    el('nfNext').textContent = step === steps.length - 1 ? '✨ Maak mijn route' : 'Volgende';
    if (s.mount) s.mount();
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.nf-chip');
    if (!chip) return;
    const { key, value, multi } = chip.dataset;
    if (multi === 'true') {
      const i = profile[key].indexOf(value);
      i >= 0 ? profile[key].splice(i, 1) : profile[key].push(value);
      chip.classList.toggle('active');
    } else {
      profile[key] = value;
      chip.parentElement.querySelectorAll('.nf-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    }
  });

  // ---------- Route generation ----------
  async function loadVenues(city) {
    venues = { bars: [], clubs: [] };
    if (!sb || !city) return;
    try {
      const [b, c] = await Promise.all([
        sb.from(`venues_bars_${city}`).select('name, price_level, area, subcategory_ids, image').order('ranking', { ascending: false }).limit(30),
        sb.from(`venues_clubs_${city}`).select('name, price_level, area, subcategory_ids, image').order('ranking', { ascending: false }).limit(30)
      ]);
      venues.bars = b.data || [];
      venues.clubs = c.data || [];
    } catch (e) { console.warn('venues fallback', e); }
  }

  function pick(list, n) {
    const budgetOk = (v) => !v.price_level || profile.budget === '€€€' || v.price_level.length <= profile.budget.length;
    const filtered = list.filter(budgetOk);
    const src = filtered.length >= n ? filtered : list;
    return src.slice(0, n);
  }

  function localRoute() {
    const city = profile.city;
    const want = (t) => profile.interests.includes(t);
    const stops = [];
    const bars = pick(venues.bars, 2);
    const clubs = pick(venues.clubs, 1);
    const vibeTxt = { mixed: 'een mix van alles', chill: 'relaxed en ontspannen', party: 'vol energie', culture: 'cultuur en goed eten', local: 'lokaal en authentiek' }[profile.vibe];

    if (profile.trip !== 'night' && want('hotel'))
      stops.push({ time: 'Check-in', type: 'hotel', name: `Hotel in ${city}`, description: `Een goed gelegen hotel in het centrum van ${city}, dicht bij het uitgaansgebied.` });
    if (profile.trip !== 'night' && want('activity'))
      stops.push({ time: '14:00', type: 'activity', name: `Ontdek ${city}`, keyword: profile.vibe === 'culture' ? 'walking tour' : 'boat tour', description: `Start de dag met een ${profile.vibe === 'culture' ? 'wandeltour langs de highlights' : 'boottocht of stadstour'} — perfect om ${city} te leren kennen.` });
    if (want('restaurant'))
      stops.push({ time: '19:00', type: 'restaurant', name: profile.budget === '€€€' ? `Fine dining in ${city}` : `Lokale keuken in ${city}`, description: `Diner ${profile.group === 'couple' ? 'voor twee' : 'met de groep'}: ${profile.budget === '€' ? 'betaalbaar en gezellig' : profile.budget === '€€€' ? 'chique en verfijnd' : 'goed en gezellig'}, ${vibeTxt}.` });
    if (want('bar')) {
      if (bars.length) bars.forEach((b, i) => stops.push({ time: i === 0 ? '21:00' : '22:30', type: 'bar', name: b.name, area: b.area, price: b.price_level, image: b.image, description: `Top-bar in ${city}${b.area ? `, ${b.area}` : ''}. Ideaal om de avond ${i === 0 ? 'te starten' : 'op te bouwen'}.` }));
      else stops.push({ time: '21:00', type: 'bar', name: `Cocktailbar in ${city}`, description: `Drankjes vooraf in een populaire bar in het centrum.` });
    }
    if (want('club') && profile.group !== 'family') {
      if (clubs.length) stops.push({ time: '00:00', type: 'club', name: clubs[0].name, area: clubs[0].area, price: clubs[0].price_level, image: clubs[0].image, description: `Afsluiten in een van de bekendste clubs van ${city}.` });
      else stops.push({ time: '00:00', type: 'club', name: `Club in ${city}`, description: `Dansen tot laat in een van de bekendste clubs van ${city}.` });
    }
    if (profile.trip === 'night' && want('hotel'))
      stops.push({ time: 'Overnachting', type: 'hotel', name: `Slapen in ${city}`, description: `Hotel op loopafstand van je laatste stop, zodat je zorgeloos kunt uitgaan.` });
    if (want('activity') && profile.trip === 'night')
      stops.push({ time: 'Extra', type: 'activity', name: `Activiteit in ${city}`, keyword: 'nightlife tour', description: `Liever begeleid? Boek een pubcrawl of nightlife-tour.` });

    return { title: `Jouw ${profile.trip === 'night' ? 'avond' : profile.trip === 'day' ? 'dag' : 'weekend'} in ${city}`, intro: `Route op maat voor ${profile.group === 'solo' ? 'jou' : 'jullie'}: ${vibeTxt}, budget ${profile.budget}.`, stops };
  }

  async function aiRoute() {
    if (!C.chatEndpoint) return null;
    try {
      const r = await fetch(C.chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': C.supabaseAnonKey, 'Authorization': `Bearer ${C.supabaseAnonKey}` },
        body: JSON.stringify({ mode: 'route', profile, venues: { bars: venues.bars.slice(0, 10).map(v => v.name), clubs: venues.clubs.slice(0, 10).map(v => v.name) } })
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data && data.stops ? data : null;
    } catch (e) { console.warn('AI route unavailable, using local', e); return null; }
  }

  const ICON = { hotel: '🏨', activity: '🎟️', restaurant: '🍽️', bar: '🍸', club: '🪩' };

  function renderRoute(r) {
    route = r;
    el('nfOnboarding').style.display = 'none';
    const out = el('nfRoute');
    out.style.display = 'block';
    out.innerHTML = `
      <div class="nf-route-head">
        <h2>${r.title}</h2>
        <p>${r.intro}</p>
        <div class="nf-route-actions">
          <button class="btn btn-secondary" id="nfRestart">↺ Opnieuw</button>
          <button class="btn btn-secondary" id="nfShare">🔗 Deel route</button>
          <a class="btn btn-primary" href="${A.bookingHotels(profile.city)}" target="_blank" rel="noopener sponsored">🏨 Hotels in ${profile.city}</a>
        </div>
      </div>
      <div class="nf-timeline">
        ${r.stops.map((s, i) => {
          const aff = A.forStop(s, profile.city);
          return `
          <div class="nf-stop card scroll-reveal revealed">
            <div class="nf-stop-time">${s.time || ''}</div>
            <div class="nf-stop-body">
              <div class="nf-stop-title"><span class="nf-stop-icon">${ICON[s.type] || '📍'}</span><h3>${s.name}</h3>${s.price ? `<span class="nf-price">${s.price}</span>` : ''}</div>
              ${s.area ? `<div class="nf-stop-area">${s.area}</div>` : ''}
              <p>${s.description || ''}</p>
              <a class="nf-aff" href="${aff.url}" target="_blank" rel="noopener sponsored">${aff.label} →<span>via ${aff.partner}</span></a>
            </div>
          </div>`;
        }).join('')}
      </div>
      <p class="nf-disclosure">Sommige links zijn affiliate-links. Boek je via zo'n link, dan ontvangt NightFind een kleine vergoeding — jij betaalt niets extra.</p>`;
    el('nfRestart').onclick = () => { step = 0; out.style.display = 'none'; el('nfOnboarding').style.display = 'block'; renderStep(); };
    el('nfShare').onclick = async () => {
      const url = `${location.origin}${location.pathname}?p=${btoa(unescape(encodeURIComponent(JSON.stringify(profile))))}`;
      try { await navigator.clipboard.writeText(url); el('nfShare').textContent = '✅ Link gekopieerd'; } catch { prompt('Kopieer deze link:', url); }
    };
    window.NF_ROUTE = { profile, route };
    document.dispatchEvent(new CustomEvent('nf:route', { detail: { profile, route } }));
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function build() {
    const btn = el('nfNext');
    btn.disabled = true; btn.textContent = '⏳ Route wordt gemaakt…';
    el('nfStepBody').innerHTML = `<div class="nf-loading"><div class="nf-spinner"></div><p>We kijken naar de beste plekken in ${profile.city}…</p></div>`;
    await loadVenues(profile.city);
    const r = (await aiRoute()) || localRoute();
    btn.disabled = false;
    renderRoute(r);
  }

  // ---------- Init ----------
  function init() {
    try {
      const p = new URLSearchParams(location.search).get('p');
      if (p) Object.assign(profile, JSON.parse(decodeURIComponent(escape(atob(p)))));
    } catch {}
    el('nfNext').addEventListener('click', () => {
      const s = steps[step];
      if (s.valid && !s.valid()) { el('nfStepBody').classList.add('nf-shake'); setTimeout(() => el('nfStepBody').classList.remove('nf-shake'), 400); return; }
      if (step < steps.length - 1) { step++; renderStep(); } else build();
    });
    el('nfBack').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
    renderStep();
    window.NF_PROFILE = profile;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
