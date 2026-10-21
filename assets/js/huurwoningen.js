// Huurwoningen-overzicht – leest data/huurwoningen.js (of .json) die `python -m scraper` maakt

const STATUS = {
    beschikbaar: { label: 'Beschikbaar', cls: 'st-available', rank: 0 },
    binnenkort: { label: 'Binnenkort', cls: 'st-soon', rank: 1 },
    onder_optie: { label: 'Onder optie', cls: 'st-option', rank: 2 },
    verhuurd_ovb: { label: 'Verhuurd o.v.b.', cls: 'st-ovb', rank: 3 },
    gesloten: { label: 'Reageren gesloten', cls: 'st-closed', rank: 4 },
    verhuurd: { label: 'Verhuurd', cls: 'st-rented', rank: 5 },
    offline: { label: 'Offline', cls: 'st-offline', rank: 6 }
};
const STATUS_HINT = {
    binnenkort: 'Binnenkort beschikbaar / binnenkort in de verhuur',
    verhuurd_ovb: 'Verhuurd onder voorbehoud',
    gesloten: 'Reactietermijn voorbij – woning wordt toegewezen',
    offline: 'Advertentie verdwenen – waarschijnlijk verhuurd'
};
// Bij dubbele advertenties wint: corporatie > makelaar/verhuurder zelf > Funda > Pararius > rest
const TYPE_RANK = { corporatie: 0, makelaar: 1, verhuurder: 1, platform: 2 };
const PLATFORM_ORDER = ['funda', 'pararius', 'huurwoningen', 'kamernet'];
const TYPE_LABELS = { corporatie: 'Woningcorporaties', platform: 'Huurplatforms', makelaar: 'Makelaars', verhuurder: 'Verhuurders & beleggers' };
const TYPE_ORDER = ['corporatie', 'platform', 'makelaar', 'verhuurder'];
const GEMEENTE_ORDER = ['Alkmaar', 'Dijk en Waard', 'Schagen', 'Koggenland'];
const SEGMENTS = ['Sociale huur', 'Middenhuur', 'Vrije sector'];
const DEFAULT_STATUSES = ['beschikbaar', 'binnenkort', 'onder_optie', 'verhuurd_ovb', 'gesloten', 'verhuurd'];
const DEFAULT_FILTERS = {
    q: '', statuses: DEFAULT_STATUSES, onlyNew: false, since: '', places: [], sources: [], segments: [],
    type: '', rentMin: '', rentMax: '', areaMin: '', roomsMin: '', merge: true, sort: 'published:desc', view: 'cards'
};
const STORE_KEY = 'huurwoningen.filters.v1';
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const HOUSE_SVG = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>';

const state = { data: null, groups: [], visible: [], filters: loadFilters() };
const $ = (id) => document.getElementById(id);

// ---------- Hulpjes ----------
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(u) {
    return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null;
}
function isEmpty(v) {
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
}
const euro0 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
function fmtMoney(n) {
    if (n == null || Number.isNaN(n)) return '–';
    return Number.isInteger(n) ? euro0.format(n) : euro2.format(n);
}

function parseISO(s) {
    if (!s) return null;
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}
function today0() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
}
function daysAgo(s) {
    const d = parseISO(s);
    return d ? Math.round((today0() - d) / 86400000) : null;
}
function fmtDate(s, withYear = true) {
    const d = parseISO(s);
    if (!d) return null;
    return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}
function fmtDateTime(s) {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return fmtDate(s);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function relPast(s) {
    const n = daysAgo(s);
    if (n == null) return '';
    if (n <= 0) return 'vandaag';
    if (n === 1) return 'gisteren';
    if (n < 14) return `${n} dagen geleden`;
    if (n < 60) return `${Math.round(n / 7)} weken geleden`;
    return `${Math.round(n / 30)} maanden geleden`;
}
function relFuture(s) {
    const n = daysAgo(s);
    if (n == null) return '';
    if (n > 0) return 'verlopen';
    if (n === 0) return 'vandaag';
    if (n === -1) return 'morgen';
    return `nog ${-n} dagen`;
}

// ---------- Filters bewaren (alleen gemak; werkt ook zonder opslag) ----------
function loadFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
        return saved ? { ...DEFAULT_FILTERS, ...saved } : { ...DEFAULT_FILTERS };
    } catch {
        return { ...DEFAULT_FILTERS };
    }
}
function saveFilters() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.filters)); } catch { /* geen opslag beschikbaar */ }
}

// ---------- Data ----------
async function loadData() {
    if (window.HUURWONINGEN_DATA) return window.HUURWONINGEN_DATA;
    try {
        const r = await fetch('data/huurwoningen.json', { cache: 'no-store' });
        return r.ok ? await r.json() : null;
    } catch {
        return null;
    }
}

function priority(l) {
    const i = PLATFORM_ORDER.indexOf(l.source);
    return (TYPE_RANK[l.source_type] ?? 3) * 100 + (i < 0 ? 50 : i);
}

function byType(items, typeOf) {
    const groups = {};
    for (const it of items) (groups[typeOf(it)] = groups[typeOf(it)] || []).push(it);
    const order = [...TYPE_ORDER, ...Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t)).sort()];
    return order.filter((t) => groups[t]).map((t) => [t, groups[t]]);
}

// Zelfde adres op meerdere sites -> één woning met "Ook op"
function buildGroups(listings, merge) {
    const buckets = new Map();
    for (const l of listings) {
        const key = merge && l.address_key ? 'a:' + l.address_key : 'i:' + l.id;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(l);
    }
    const today = today0();
    return [...buckets.values()].map((members) => {
        members.sort((a, b) => (a.status === 'offline') - (b.status === 'offline') || priority(a) - priority(b));
        const primary = members[0];
        const view = {};
        for (const m of members) {
            for (const [k, v] of Object.entries(m)) {
                if (isEmpty(view[k]) && !isEmpty(v)) view[k] = v;
            }
        }
        for (const k of ['id', 'status', 'status_text', 'url', 'source', 'source_name', 'status_history', 'offline_since', 'closing_date']) {
            view[k] = primary[k];
        }
        view.published_at = members.map((m) => m.published_at).filter(Boolean).sort()[0] || null;
        view.first_seen = members.map((m) => m.first_seen).filter(Boolean).sort()[0] || null;
        view.is_new = primary.status === 'beschikbaar' && members.some((m) => m.is_new);
        view.members = members;
        view.ppm = view.rent_total && view.area_m2 ? view.rent_total / view.area_m2 : null;
        const closing = parseISO(view.closing_date);
        view.closing_open = closing && closing >= today ? view.closing_date : null;
        view.search = [
            view.title, view.street, view.house_number, view.postcode, view.city, view.neighbourhood,
            view.landlord, view.property_type, view.description, view.allocation_model, ...members.map((m) => m.source_name)
        ].filter(Boolean).join(' ').toLowerCase();
        return view;
    });
}

// ---------- Filteren & sorteren ----------
function matches(v, f, ignore = '') {
    if (ignore !== 'status') {
        if (f.statuses.length && !f.statuses.includes(v.status)) return false;
        if (f.onlyNew && !v.is_new) return false;
    }
    if (f.q) {
        const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.every((t) => v.search.includes(t))) return false;
    }
    if (f.since !== '') {
        const n = daysAgo(v.published_at);
        if (n == null || n > Number(f.since)) return false;
    }
    if (ignore !== 'place' && f.places.length && !f.places.includes(v.city)) return false;
    if (ignore !== 'source' && f.sources.length && !v.members.some((m) => f.sources.includes(m.source))) return false;
    if (ignore !== 'segment' && f.segments.length && !f.segments.includes(v.segment)) return false;
    if (f.type && (v.property_type || '') !== f.type) return false;
    const rent = v.rent_total;
    if (f.rentMin !== '' && (rent == null || rent < Number(f.rentMin))) return false;
    if (f.rentMax !== '' && (rent == null || rent > Number(f.rentMax))) return false;
    if (f.areaMin !== '' && (v.area_m2 == null || v.area_m2 < Number(f.areaMin))) return false;
    if (f.roomsMin !== '' && (v.rooms == null || v.rooms < Number(f.roomsMin))) return false;
    return true;
}

function sortValue(v, key) {
    switch (key) {
        case 'published': return v.published_at || (v.first_seen || '').slice(0, 10);
        case 'rent': return v.rent_total;
        case 'area': return v.area_m2;
        case 'ppm': return v.ppm;
        case 'closing': return v.closing_open;
        case 'city': return `${v.city || ''} ${v.street || ''}`;
        case 'address': return `${v.street || ''} ${String(v.house_number || '').padStart(5, '0')}`;
        case 'status': return STATUS[v.status]?.rank ?? 9;
        case 'rooms': return v.rooms;
        case 'label': return v.energy_label;
        case 'type': return v.property_type;
        case 'source': return v.source_name;
        default: return null;
    }
}

function sortGroups(list, sort) {
    const [key, dir] = sort.split(':');
    const mul = dir === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
        const x = sortValue(a, key);
        const y = sortValue(b, key);
        const ex = x == null || x === '';
        const ey = y == null || y === '';
        if (ex && ey) return 0;
        if (ex) return 1;
        if (ey) return -1;
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * mul;
        return String(x).localeCompare(String(y), 'nl', { numeric: true }) * mul;
    });
}

function countBy(list, fn) {
    const out = {};
    for (const v of list) {
        const k = fn(v);
        if (k != null) out[k] = (out[k] || 0) + 1;
    }
    return out;
}

// ---------- Weergave ----------
function badges(v, max = 3) {
    const out = [];
    if (v.is_new) out.push('<span class="badge st-new">Nieuw</span>');
    const st = STATUS[v.status];
    if (st) out.push(`<span class="badge ${st.cls}" title="${escapeHtml(STATUS_HINT[v.status] || v.status_text || st.label)}">${st.label}</span>`);
    if (v.allocation_model && /loting|direct/i.test(v.allocation_model)) out.push(`<span class="badge plain">${escapeHtml(v.allocation_model)}</span>`);
    return out.slice(0, max).join('');
}

function addressLine(v) {
    const parts = [v.street, v.house_number, v.house_number_addition].filter(Boolean).join(' ');
    return parts || v.title || 'Adres onbekend';
}

function placeLine(v) {
    let s = [v.postcode, v.city].filter(Boolean).join(' ');
    if (v.neighbourhood) s += ` (${v.neighbourhood})`;
    if (v.municipality && v.municipality !== v.city) s += ` · gem. ${v.municipality}`;
    return s;
}

function placedText(v) {
    if (v.published_at) return `${fmtDate(v.published_at)} · ${relPast(v.published_at)}`;
    if (v.first_seen) return `onbekend · eerst gezien ${fmtDate(v.first_seen)}`;
    return 'onbekend';
}

function sourcesText(v) {
    const names = [...new Set(v.members.map((m) => m.source_name))].join(' + ');
    return v.landlord && !names.includes(v.landlord) ? `${names} · ${v.landlord}` : names;
}

function factsList(v) {
    const facts = [];
    if (v.area_m2) facts.push(`${v.area_m2} m²`);
    if (v.rooms) facts.push(`${v.rooms} kamer${v.rooms === 1 ? '' : 's'}`);
    else if (v.bedrooms) facts.push(`${v.bedrooms} slaapk.`);
    if (v.energy_label) facts.push(`Label ${v.energy_label}`);
    if (v.property_type) facts.push(v.property_type);
    if (v.interior) facts.push(v.interior);
    return facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
}

function cardHtml(v) {
    const img = safeUrl((v.images || [])[0]);
    const url = safeUrl(v.url);
    const faded = ['verhuurd', 'offline', 'gesloten'].includes(v.status) ? ' is-faded' : '';
    const closing = v.closing_date
        ? `<div><dt>Reageren tot</dt><dd class="${daysAgo(v.closing_date) >= -2 && daysAgo(v.closing_date) <= 0 ? 'soon' : ''}">${fmtDate(v.closing_date)} · ${relFuture(v.closing_date)}</dd></div>`
        : '';
    const available = v.available_from
        ? `<div><dt>Beschikbaar per</dt><dd>${fmtDate(v.available_from)}</dd></div>`
        : v.available_text ? `<div><dt>Beschikbaar</dt><dd>${escapeHtml(v.available_text)}</dd></div>` : '';
    const offline = v.status === 'offline' && v.offline_since
        ? `<div><dt>Offline sinds</dt><dd>${fmtDate(v.offline_since)}</dd></div>` : '';
    const net = v.rent_net && v.rent_net !== v.rent_total ? `<span class="sub">kale huur ${fmtMoney(v.rent_net)}</span>` : '';
    return `
        <article class="listing${faded}" tabindex="0" data-id="${escapeHtml(v.id)}" aria-label="${escapeHtml(addressLine(v))}, ${escapeHtml(v.city || '')}">
            <div class="listing-media">
                <div class="placeholder">${HOUSE_SVG}</div>
                ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
                <div class="badges">${badges(v)}</div>
            </div>
            <div class="listing-body">
                <div class="listing-price">${fmtMoney(v.rent_total)} <small>/mnd</small>${net}</div>
                <h3 class="listing-address">${escapeHtml(addressLine(v))}</h3>
                <p class="listing-place">${escapeHtml(placeLine(v))}</p>
                <ul class="facts">${factsList(v)}</ul>
                <dl class="dates">
                    <div><dt>Geplaatst</dt><dd>${escapeHtml(placedText(v))}</dd></div>
                    ${closing}${available}${offline}
                </dl>
                <footer class="listing-foot">
                    <span class="src" title="${escapeHtml(sourcesText(v))}">${escapeHtml(sourcesText(v))}</span>
                    ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Bekijk ↗</a>` : ''}
                </footer>
            </div>
        </article>`;
}

const TABLE_COLS = [
    { key: 'status', label: 'Status' },
    { key: 'published', label: 'Geplaatst' },
    { key: 'address', label: 'Adres' },
    { key: 'city', label: 'Plaats' },
    { key: 'rent', label: 'Huur', num: true },
    { key: 'area', label: 'm²', num: true },
    { key: 'rooms', label: 'Kamers', num: true },
    { key: 'label', label: 'Label' },
    { key: 'type', label: 'Type' },
    { key: 'closing', label: 'Reageren tot' },
    { key: 'source', label: 'Bron' }
];

function tableHtml(list) {
    const [sortKey, dir] = state.filters.sort.split(':');
    const head = TABLE_COLS.map((c) => {
        const active = c.key === sortKey;
        const arrow = active ? (dir === 'desc' ? ' ↓' : ' ↑') : '';
        return `<th class="${c.num ? 'num' : ''}" scope="col"><button type="button" data-sort="${c.key}" data-active="${active}">${c.label}${arrow}</button></th>`;
    }).join('');
    const rows = list.map((v) => {
        const url = safeUrl(v.url);
        return `<tr data-id="${escapeHtml(v.id)}">
            <td><div class="badges">${badges(v, 2)}</div></td>
            <td>${escapeHtml(fmtDate(v.published_at) || '–')}</td>
            <td><span class="addr">${escapeHtml(addressLine(v))}</span></td>
            <td>${escapeHtml(v.city || '–')}</td>
            <td class="num">${fmtMoney(v.rent_total)}</td>
            <td class="num">${v.area_m2 ?? '–'}</td>
            <td class="num">${v.rooms ?? '–'}</td>
            <td>${escapeHtml(v.energy_label || '–')}</td>
            <td>${escapeHtml(v.property_type || '–')}</td>
            <td>${escapeHtml(fmtDate(v.closing_date) || '–')}</td>
            <td>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(v.members.map((m) => m.source_name).join(' + '))} ↗</a>` : escapeHtml(v.source_name)}</td>
        </tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderKpis(base) {
    const st = countBy(base, (v) => v.status);
    const nNew = base.filter((v) => v.is_new).length;
    const rents = base.filter((v) => v.status === 'beschikbaar' && v.rent_total).map((v) => v.rent_total).sort((a, b) => a - b);
    const median = rents.length ? (rents.length % 2 ? rents[(rents.length - 1) / 2] : (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2) : null;
    const f = state.filters;
    const same = (arr) => !f.onlyNew && f.statuses.length === arr.length && arr.every((s) => f.statuses.includes(s));
    const tiles = [
        { id: 'all', label: 'Woningen', value: state.groups.filter((v) => matches(v, f)).length, pressed: same(DEFAULT_STATUSES) },
        { id: 'new', label: 'Nieuw', dot: 'st-new', value: nNew, pressed: f.onlyNew },
        { id: 'beschikbaar', label: 'Beschikbaar', dot: 'st-available', value: (st.beschikbaar || 0) + (st.binnenkort || 0), pressed: same(['beschikbaar', 'binnenkort']) },
        { id: 'optie', label: 'Onder optie', dot: 'st-option', value: (st.onder_optie || 0) + (st.verhuurd_ovb || 0), pressed: same(['onder_optie', 'verhuurd_ovb']) },
        { id: 'verhuurd', label: 'Verhuurd', dot: 'st-rented', value: st.verhuurd || 0, pressed: same(['verhuurd']) }
    ];
    $('kpis').innerHTML = tiles.map((t) => `
        <button type="button" class="kpi" data-kpi="${t.id}" aria-pressed="${t.pressed}">
            <span class="kpi-label">${t.dot ? `<i class="dot ${t.dot}"></i>` : ''}${t.label}</span>
            <span class="kpi-value">${t.value}</span>
        </button>`).join('') + `
        <div class="kpi" title="Mediaan van beschikbare woningen in de huidige selectie">
            <span class="kpi-label">Mediaan huur</span>
            <span class="kpi-value">${median ? fmtMoney(Math.round(median)) : '–'}</span>
        </div>`;
}

function renderSources() {
    const runs = state.data?.sources || [];
    if (!runs.length) {
        $('sources').innerHTML = '';
        return;
    }
    const pill = (r) => {
        const cls = r.status === 'ok' ? 'ok' : r.status === 'fout' ? 'fout' : 'leeg';
        const detail = r.status === 'ok' ? `${r.count}` : r.status === 'fout' ? 'fout' : 'leeg';
        const title = [r.description, r.url_checked === false ? 'Adres van de aanbodpagina is afgeleid – nog niet gecontroleerd' : '', r.error, ...(r.notes || []), r.scraped_at ? `Gescand: ${fmtDateTime(r.scraped_at)}` : ''].filter(Boolean).join('\n');
        const url = safeUrl(r.url);
        const name = url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>` : escapeHtml(r.name);
        return `<span class="source-pill ${cls}" title="${escapeHtml(title)}"><i class="dot"></i><strong>${name}</strong> ${escapeHtml(detail)}</span>`;
    };
    const ok = runs.filter((r) => r.status === 'ok').length;
    const err = runs.filter((r) => r.status === 'fout').length;
    const empty = runs.length - ok - err;
    const summary = [
        `<span class="source-pill ok"><i class="dot"></i>${ok} werken</span>`,
        err ? `<span class="source-pill fout"><i class="dot"></i>${err} met fout</span>` : '',
        empty ? `<span class="source-pill leeg"><i class="dot"></i>${empty} leeg</span>` : ''
    ].join('');
    $('sources').innerHTML = `
        <details class="sources-box">
            <summary><strong>${runs.length} bronnen</strong>${summary}<span class="muted">Toon alle bronnen</span></summary>
            ${byType(runs, (r) => r.type).map(([t, list]) => `
                <div class="source-group">
                    <h3>${escapeHtml(TYPE_LABELS[t] || t)} <span class="muted">(${list.length})</span></h3>
                    <div class="sources-pills">${list.map(pill).join('')}</div>
                </div>`).join('')}
        </details>`;
}

function chip(attrs, label, count, pressed, dotCls = '') {
    return `<button type="button" class="chip" ${attrs} aria-pressed="${pressed}">${dotCls ? `<i class="dot ${dotCls}"></i>` : ''}${escapeHtml(label)}${count != null ? ` <span class="count">${count}</span>` : ''}</button>`;
}

function renderFilterControls() {
    const f = state.filters;
    const all = state.groups;

    const baseStatus = all.filter((v) => matches(v, f, 'status'));
    const st = countBy(baseStatus, (v) => v.status);
    $('statusChips').innerHTML =
        chip('data-new="1"', 'Nieuw', baseStatus.filter((v) => v.is_new).length, f.onlyNew, 'st-new') +
        Object.entries(STATUS).map(([k, s]) => chip(`data-status="${k}"`, s.label, st[k] || 0, f.statuses.includes(k), s.cls)).join('');

    const basePlace = all.filter((v) => matches(v, f, 'place'));
    const pc = countBy(basePlace, (v) => v.city);
    const regionPlaces = state.data?.region?.plaatsen || {};
    const byGemeente = {};
    const placeNames = new Set([...Object.keys(pc), ...f.places]);
    for (const p of placeNames) {
        const g = regionPlaces[p] || 'Overig';
        (byGemeente[g] = byGemeente[g] || []).push(p);
    }
    const gemeenten = Object.keys(byGemeente).sort((a, b) => {
        const ia = GEMEENTE_ORDER.indexOf(a), ib = GEMEENTE_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'nl');
    });
    $('placeChips').innerHTML = gemeenten.length ? gemeenten.map((g) => `
        <div class="place-group">
            <h3><button type="button" data-gemeente="${escapeHtml(g)}" title="Alle plaatsen in ${escapeHtml(g)} aan/uit">${escapeHtml(g)}</button></h3>
            <div class="chips">${byGemeente[g].sort((a, b) => (pc[b] || 0) - (pc[a] || 0) || a.localeCompare(b, 'nl'))
                .map((p) => chip(`data-place="${escapeHtml(p)}"`, p, pc[p] || 0, f.places.includes(p))).join('')}</div>
        </div>`).join('') : '<p class="muted">Nog geen plaatsen</p>';

    const baseSource = all.filter((v) => matches(v, f, 'source'));
    const sc = {};
    for (const v of baseSource) for (const s of new Set(v.members.map((m) => m.source))) sc[s] = (sc[s] || 0) + 1;
    const sources = (state.data?.sources || []).filter((r) => sc[r.id] || f.sources.includes(r.id));
    $('sourceChips').innerHTML = sources.length
        ? byType(sources, (r) => r.type).map(([t, list]) => `
            <div class="place-group">
                <h3><button type="button" data-sourcetype="${escapeHtml(t)}" title="Alle ${escapeHtml((TYPE_LABELS[t] || t).toLowerCase())} aan/uit">${escapeHtml(TYPE_LABELS[t] || t)}</button></h3>
                <div class="chips">${list.sort((a, b) => (sc[b.id] || 0) - (sc[a.id] || 0) || a.name.localeCompare(b.name, 'nl'))
                    .map((r) => chip(`data-source="${escapeHtml(r.id)}"`, r.name, sc[r.id] || 0, f.sources.includes(r.id))).join('')}</div>
            </div>`).join('')
        : '<p class="muted">Nog geen bronnen</p>';

    const baseSeg = all.filter((v) => matches(v, f, 'segment'));
    const segc = countBy(baseSeg, (v) => v.segment);
    $('segmentChips').innerHTML = SEGMENTS.map((s) => chip(`data-segment="${escapeHtml(s)}"`, s, segc[s] || 0, f.segments.includes(s))).join('');

    const types = [...new Set(all.map((v) => v.property_type).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl'));
    if (f.type && !types.includes(f.type)) types.unshift(f.type);
    $('type').innerHTML = '<option value="">Alle types</option>' + types.map((t) => `<option value="${escapeHtml(t)}"${t === f.type ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('');

    $('q').value = f.q;
    $('since').value = f.since;
    $('rentMin').value = f.rentMin;
    $('rentMax').value = f.rentMax;
    $('areaMin').value = f.areaMin;
    $('roomsMin').value = f.roomsMin;
    $('mergeDupes').checked = f.merge;
    $('sort').value = [...$('sort').options].some((o) => o.value === f.sort) ? f.sort : '';
    document.querySelectorAll('.segmented [data-view]').forEach((b) => {
        const on = b.dataset.view === f.view;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
    });
}

function renderResults() {
    const f = state.filters;
    const list = sortGroups(state.groups.filter((v) => matches(v, f)), f.sort);
    state.visible = list;
    const hasData = (state.data?.listings || []).length > 0;
    $('emptyNoData').hidden = hasData;
    $('emptyFiltered').hidden = !hasData || list.length > 0;
    $('resultCount').textContent = hasData ? `${list.length} ${list.length === 1 ? 'woning' : 'woningen'}` : '';
    if (!list.length) {
        $('results').innerHTML = '';
        return;
    }
    $('results').innerHTML = f.view === 'table'
        ? tableHtml(list)
        : `<div class="grid">${list.map(cardHtml).join('')}</div>`;
}

function render() {
    renderKpis(state.groups.filter((v) => matches(v, state.filters, 'status')));
    renderFilterControls();
    renderResults();
}

function update(patch) {
    state.filters = { ...state.filters, ...patch };
    if ('merge' in patch) state.groups = buildGroups(state.data?.listings || [], state.filters.merge);
    saveFilters();
    render();
}

// ---------- Detail ----------
const FIELD_LABELS = {
    property_type: 'Type', area_m2: 'Woonoppervlakte', rooms: 'Kamers', bedrooms: 'Slaapkamers', floor: 'Verdieping',
    energy_label: 'Energielabel', build_year: 'Bouwjaar', interior: 'Interieur',
    rent_total: 'Totale huur', rent_net: 'Kale huur', service_costs: 'Servicekosten', energy_costs: 'Energiekosten',
    deposit: 'Borg', segment: 'Segment', ppm: 'Prijs per m²',
    published_at: 'Geplaatst', closing_date: 'Reageren tot', available_from: 'Beschikbaar per', available_text: 'Beschikbaar',
    allocation_model: 'Toewijzing', reactions: 'Reacties', first_seen: 'Eerst gezien', last_seen: 'Laatst gezien', offline_since: 'Offline sinds',
    target_group: 'Doelgroep', income_text: 'Inkomen', age_text: 'Leeftijd', household_text: 'Huishouden', contract: 'Huurperiode',
    landlord: 'Verhuurder', neighbourhood: 'Wijk', municipality: 'Gemeente', postcode: 'Postcode'
};

function fieldValue(v, k) {
    const x = v[k];
    if (isEmpty(x)) return null;
    if (['rent_total', 'rent_net', 'service_costs', 'energy_costs', 'deposit'].includes(k)) return fmtMoney(x);
    if (k === 'ppm') return `${euro2.format(x)} /m²`;
    if (k === 'area_m2') return `${x} m²`;
    if (k === 'published_at') return `${fmtDate(x)} (${relPast(x)})`;
    if (k === 'closing_date') return `${fmtDate(x)} (${relFuture(x)})`;
    if (k === 'available_from') return fmtDate(x);
    if (['first_seen', 'last_seen', 'offline_since'].includes(k)) return fmtDateTime(x);
    return String(x);
}

function kvSection(title, v, keys) {
    const rows = keys.map((k) => [FIELD_LABELS[k] || k, fieldValue(v, k)]).filter(([, val]) => val);
    if (!rows.length) return '';
    return `<section><h3>${title}</h3><dl class="kv">${rows.map(([l, val]) => `<dt>${escapeHtml(l)}</dt><dd>${escapeHtml(val)}</dd>`).join('')}</dl></section>`;
}

function openDetail(id) {
    const v = state.visible.find((x) => x.id === id) || state.groups.find((x) => x.id === id);
    if (!v) return;
    const imgs = (v.images || []).map(safeUrl).filter(Boolean);
    const extra = v.extra && typeof v.extra === 'object' ? Object.entries(v.extra).filter(([, x]) => !isEmpty(x)) : [];
    const history = (v.status_history || []).map((h) => `<li><span class="badge ${STATUS[h.status]?.cls || 'plain'}">${escapeHtml(STATUS[h.status]?.label || h.status)}</span> sinds ${escapeHtml(fmtDateTime(h.since) || '')}</li>`).join('');
    const members = v.members.map((m) => {
        const url = safeUrl(m.url);
        return `<li><strong>${escapeHtml(m.source_name)}</strong> <span class="badge ${STATUS[m.status]?.cls || 'plain'}">${escapeHtml(STATUS[m.status]?.label || m.status)}</span>
            ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open advertentie ↗</a>` : ''}</li>`;
    }).join('');
    const dlg = $('detail');
    dlg.innerHTML = `
        <div class="detail-inner">
            <div class="detail-head">
                <div>
                    <div class="badges">${badges(v, 4)}</div>
                    <h2 id="detailTitle">${escapeHtml(addressLine(v))}</h2>
                    <p class="muted">${escapeHtml(placeLine(v))}</p>
                </div>
                <button type="button" class="btn btn-ghost detail-close" data-close aria-label="Sluiten">×</button>
            </div>
            ${imgs.length ? `<div class="gallery">${imgs.map((u) => `<img src="${escapeHtml(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`).join('')}</div>` : ''}
            <div class="detail-price">
                <strong>${fmtMoney(v.rent_total)}</strong><span class="muted">per maand</span>
                <span class="muted">Geplaatst: ${escapeHtml(placedText(v))}</span>
            </div>
            <div class="detail-sections">
                ${kvSection('Woning', v, ['property_type', 'area_m2', 'rooms', 'bedrooms', 'floor', 'energy_label', 'build_year', 'interior', 'neighbourhood', 'municipality'])}
                ${kvSection('Huur', v, ['rent_total', 'rent_net', 'service_costs', 'energy_costs', 'deposit', 'ppm', 'segment'])}
                ${kvSection('Plaatsing & status', v, ['published_at', 'closing_date', 'available_from', 'available_text', 'allocation_model', 'reactions', 'first_seen', 'last_seen', 'offline_since'])}
                ${kvSection('Voorwaarden', v, ['target_group', 'income_text', 'age_text', 'household_text', 'contract', 'landlord'])}
                ${extra.length ? `<section><h3>Overige kenmerken</h3><dl class="kv">${extra.map(([k, x]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(typeof x === 'object' ? JSON.stringify(x) : x)}</dd>`).join('')}</dl></section>` : ''}
            </div>
            ${v.description ? `<section><h3 class="muted">Omschrijving</h3><p class="description">${escapeHtml(v.description)}</p></section>` : ''}
            <section><h3 class="muted">Advertenties</h3><ul class="sources-list">${members}</ul></section>
            ${history ? `<section><h3 class="muted">Statusgeschiedenis</h3><ul class="history">${history}</ul></section>` : ''}
        </div>`;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
}

// ---------- CSV ----------
const CSV_COLS = [
    ['status', 'Status'], ['is_new', 'Nieuw'], ['published_at', 'Geplaatst'], ['closing_date', 'Reageren tot'], ['available_from', 'Beschikbaar per'],
    ['street', 'Straat'], ['house_number', 'Huisnummer'], ['house_number_addition', 'Toevoeging'], ['postcode', 'Postcode'], ['city', 'Plaats'],
    ['municipality', 'Gemeente'], ['neighbourhood', 'Wijk'], ['rent_total', 'Totale huur'], ['rent_net', 'Kale huur'], ['service_costs', 'Servicekosten'],
    ['area_m2', 'm2'], ['rooms', 'Kamers'], ['bedrooms', 'Slaapkamers'], ['energy_label', 'Energielabel'], ['build_year', 'Bouwjaar'],
    ['property_type', 'Type'], ['interior', 'Interieur'], ['segment', 'Segment'], ['allocation_model', 'Toewijzing'], ['landlord', 'Verhuurder'],
    ['target_group', 'Doelgroep'], ['source_name', 'Bron'], ['url', 'Link'], ['first_seen', 'Eerst gezien'], ['last_seen', 'Laatst gezien']
];

function exportCsv() {
    const esc = (x) => {
        if (x == null) return '';
        let s = typeof x === 'number' ? String(x).replace('.', ',') : String(x);
        if (typeof x === 'boolean') s = x ? 'ja' : 'nee';
        return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = state.visible.map((v) => CSV_COLS.map(([k]) => esc(k === 'status' ? STATUS[v.status]?.label || v.status : k === 'source_name' ? v.members.map((m) => m.source_name).join(' + ') : v[k])).join(';'));
    const csv = '﻿' + [CSV_COLS.map(([, l]) => l).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `huurwoningen-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Events ----------
function toggleIn(arr, value) {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

function bindEvents() {
    $('filters').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const f = state.filters;
        if (b.dataset.new) update({ onlyNew: !f.onlyNew });
        else if (b.dataset.status) update({ statuses: toggleIn(f.statuses, b.dataset.status) });
        else if (b.dataset.place) update({ places: toggleIn(f.places, b.dataset.place) });
        else if (b.dataset.source) update({ sources: toggleIn(f.sources, b.dataset.source) });
        else if (b.dataset.sourcetype) {
            const ids = [...b.closest('.place-group').querySelectorAll('[data-source]')].map((x) => x.dataset.source);
            const allOn = ids.every((id) => f.sources.includes(id));
            update({ sources: allOn ? f.sources.filter((id) => !ids.includes(id)) : [...new Set([...f.sources, ...ids])] });
        }
        else if (b.dataset.segment) update({ segments: toggleIn(f.segments, b.dataset.segment) });
        else if (b.dataset.gemeente) {
            const g = b.dataset.gemeente;
            const regionPlaces = state.data?.region?.plaatsen || {};
            const inG = [...b.closest('.place-group').querySelectorAll('[data-place]')].map((x) => x.dataset.place)
                .filter((p) => (regionPlaces[p] || 'Overig') === g);
            const allOn = inG.every((p) => f.places.includes(p));
            update({ places: allOn ? f.places.filter((p) => !inG.includes(p)) : [...new Set([...f.places, ...inG])] });
        }
    });
    $('resetBtn').addEventListener('click', () => {
        const { sort, view, merge } = state.filters;
        state.filters = { ...DEFAULT_FILTERS, sort, view, merge };
        saveFilters();
        render();
    });
    $('q').addEventListener('input', (e) => update({ q: e.target.value }));
    for (const id of ['since', 'type', 'roomsMin']) $(id).addEventListener('change', (e) => update({ [id]: e.target.value }));
    for (const id of ['rentMin', 'rentMax', 'areaMin']) $(id).addEventListener('input', (e) => update({ [id]: e.target.value }));
    $('mergeDupes').addEventListener('change', (e) => update({ merge: e.target.checked }));
    $('sort').addEventListener('change', (e) => update({ sort: e.target.value }));
    document.querySelector('.segmented').addEventListener('click', (e) => {
        const b = e.target.closest('[data-view]');
        if (b) update({ view: b.dataset.view });
    });
    $('csvBtn').addEventListener('click', exportCsv);
    $('filtersToggle').addEventListener('click', () => {
        const open = $('filters').classList.toggle('open');
        $('filtersToggle').setAttribute('aria-expanded', String(open));
    });

    $('kpis').addEventListener('click', (e) => {
        const b = e.target.closest('[data-kpi]');
        if (!b) return;
        const sets = { all: DEFAULT_STATUSES, beschikbaar: ['beschikbaar', 'binnenkort'], optie: ['onder_optie', 'verhuurd_ovb'], verhuurd: ['verhuurd'] };
        if (b.dataset.kpi === 'new') update({ onlyNew: !state.filters.onlyNew });
        else update({ statuses: sets[b.dataset.kpi], onlyNew: false });
    });

    $('results').addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const th = e.target.closest('[data-sort]');
        if (th) {
            const [key, dir] = state.filters.sort.split(':');
            const next = th.dataset.sort;
            const defaultDir = ['published', 'area'].includes(next) ? 'desc' : 'asc';
            update({ sort: `${next}:${key === next ? (dir === 'asc' ? 'desc' : 'asc') : defaultDir}` });
            return;
        }
        const item = e.target.closest('[data-id]');
        if (item) openDetail(item.dataset.id);
    });
    $('results').addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = e.target.closest('.listing');
        if (item && e.target === item) {
            e.preventDefault();
            openDetail(item.dataset.id);
        }
    });
    $('detail').addEventListener('click', (e) => {
        if (e.target === e.currentTarget || e.target.closest('[data-close]')) $('detail').close();
    });
}

function renderHeader() {
    const d = state.data;
    $('updatedAt').textContent = d?.generated_at ? `Bijgewerkt ${fmtDateTime(d.generated_at)}` : 'Nog niet gescand';
    const plaatsen = d?.region?.plaatsen;
    if (plaatsen) {
        const order = ['Alkmaar', 'Heerhugowaard', 'Sint Pancras', 'Schagen', 'Tuitjenhorn', 'Obdam', 'Ursem'];
        const present = new Set((d.listings || []).map((l) => l.city));
        const extra = [...present].filter((p) => p && !order.includes(p));
        $('regionLine').textContent = [...order, ...extra.slice(0, 6)].join(' · ') + (extra.length > 6 ? ' …' : '');
    }
}

async function init() {
    state.data = (await loadData()) || { generated_at: null, sources: [], listings: [] };
    state.groups = buildGroups(state.data.listings || [], state.filters.merge);
    bindEvents();
    renderHeader();
    renderSources();
    render();
}

init();
