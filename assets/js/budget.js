// Budget tracker - inkomsten & uitgaven per dag, maand en jaar (Supabase)

const SUPABASE_URL = 'https://wwsxjoavjccajwrcrtfg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3c3hqb2F2amNjYWp3cmNydGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzUwMTYsImV4cCI6MjA2OTkxMTAxNn0.9w25Fw0q7vNfH3KC5XphzgJP_S2jM7E89tb2OrKr8pE';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_CATEGORIES = [
    { name: 'Boodschappen', type: 'expense', color: '#d95926' },
    { name: 'Wonen', type: 'expense', color: '#3987e5' },
    { name: 'Vervoer', type: 'expense', color: '#c98500' },
    { name: 'Uitgaan', type: 'expense', color: '#9085e9' },
    { name: 'Abonnementen', type: 'expense', color: '#d55181' },
    { name: 'Terras', type: 'expense', color: '#e66767' },
    { name: 'Voetbal', type: 'expense', color: '#2fb5a0' },
    { name: 'Kleding', type: 'expense', color: '#b07ce8' },
    { name: 'Amusement', type: 'expense', color: '#e8c547' },
    { name: 'Overig', type: 'expense', color: '#8a8a85' },
    { name: 'Salaris', type: 'income', color: '#199e70' },
    { name: 'Overig', type: 'income', color: '#008300' }
];

const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const UNCATEGORIZED_COLOR = '#555555';

const state = {
    user: null,
    period: 'month',
    anchor: new Date(),
    categories: [],
    transactions: [],
    // '' = alles, 'income' / 'expense' = alle inkomsten/uitgaven, 'none' = zonder categorie, anders categorie-id
    group: '',
    editingId: null,
    txType: 'expense',
    authReady: false
};

const $ = (id) => document.getElementById(id);
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const fmt = (n) => euro.format(n);

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Datum helpers (lokale datums als YYYY-MM-DD) ----------
function toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function fromISO(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function periodRange() {
    const a = state.anchor;
    if (state.period === 'all') return null;
    if (state.period === 'day') {
        return { start: toISO(a), end: toISO(a) };
    }
    if (state.period === 'month') {
        return {
            start: toISO(new Date(a.getFullYear(), a.getMonth(), 1)),
            end: toISO(new Date(a.getFullYear(), a.getMonth() + 1, 0))
        };
    }
    return { start: `${a.getFullYear()}-01-01`, end: `${a.getFullYear()}-12-31` };
}

function periodLabel() {
    const a = state.anchor;
    if (state.period === 'all') return 'Alle tijd';
    if (state.period === 'day') {
        return a.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (state.period === 'month') {
        return a.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    }
    return String(a.getFullYear());
}

function shiftPeriod(dir) {
    if (state.period === 'all') return;
    const a = state.anchor;
    if (state.period === 'day') state.anchor = new Date(a.getFullYear(), a.getMonth(), a.getDate() + dir);
    else if (state.period === 'month') state.anchor = new Date(a.getFullYear(), a.getMonth() + dir, 1);
    else state.anchor = new Date(a.getFullYear() + dir, 0, 1);
    loadTransactions();
}

// ---------- UI helpers ----------
let toastTimer;
function toast(msg, isError = false) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.toggle('error', isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

function categoryById(id) {
    return state.categories.find((c) => c.id === id);
}

// ---------- Auth ----------
async function initAuth() {
    const { data: { session } } = await db.auth.getSession();
    handleSession(session);
    db.auth.onAuthStateChange((_event, session) => handleSession(session));
}

function handleSession(session) {
    const user = session?.user ?? null;
    if (state.authReady && user?.id === state.user?.id) return;
    state.authReady = true;
    state.user = user;
    $('authView').hidden = !!user;
    $('appView').hidden = !user;
    $('userBar').hidden = !user;
    if (user) {
        $('userEmail').textContent = user.email;
        loadAll();
    }
}

$('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = e.submitter?.dataset.mode || 'login';
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const msg = $('authMsg');
    msg.classList.remove('error');
    msg.textContent = mode === 'login' ? 'Bezig met inloggen…' : 'Account aanmaken…';

    const { data, error } = mode === 'login'
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } });

    if (error) {
        msg.classList.add('error');
        msg.textContent = error.message;
        return;
    }
    if (mode === 'signup' && !data.session) {
        msg.textContent = 'Check je e-mail om je account te bevestigen en log daarna in.';
    } else {
        msg.textContent = '';
    }
});

$('logoutBtn').addEventListener('click', async () => {
    await db.auth.signOut();
    state.categories = [];
    state.transactions = [];
});

// ---------- Data ----------
async function loadAll() {
    await loadCategories();
    await loadTransactions();
}

async function loadCategories() {
    let { data, error } = await db.from('budget_categories').select('*').order('name');
    if (error) return toast('Categorieën laden mislukt: ' + error.message, true);

    if (data.length === 0) {
        const seeded = await db.from('budget_categories').insert(DEFAULT_CATEGORIES).select();
        if (seeded.error) return toast('Standaardcategorieën aanmaken mislukt: ' + seeded.error.message, true);
        data = seeded.data.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    }
    state.categories = data;
    renderCategories();
}

async function loadTransactions() {
    $('periodLabel').textContent = periodLabel();
    const isAll = state.period === 'all';
    ['prevBtn', 'nextBtn', 'todayBtn'].forEach((id) => { $(id).disabled = isAll; });

    let query = db.from('budget_transactions').select('*');
    const range = periodRange();
    if (range) query = query.gte('date', range.start).lte('date', range.end);
    const { data, error } = await query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) return toast('Transacties laden mislukt: ' + error.message, true);
    state.transactions = data.map((t) => ({ ...t, amount: Number(t.amount) }));
    renderDashboard();
}

// ---------- Groepen (filter op categorie of type) ----------
function matchesGroup(t) {
    const g = state.group;
    if (!g) return true;
    if (g === 'income' || g === 'expense') return t.type === g;
    if (g === 'none') return !t.category_id;
    return t.category_id === g;
}

function visibleTransactions() {
    return state.transactions.filter(matchesGroup);
}

// Welk type een groep bevat (null = beide)
function groupType() {
    const g = state.group;
    if (g === 'income' || g === 'expense') return g;
    return categoryById(g)?.type ?? null;
}

function groupLabel() {
    const g = state.group;
    if (g === 'income') return 'Alle inkomsten';
    if (g === 'expense') return 'Alle uitgaven';
    if (g === 'none') return 'Zonder categorie';
    return categoryById(g)?.name ?? '';
}

function setGroup(group) {
    state.group = group;
    $('groupSelect').value = group;
    renderDashboard();
}

// ---------- Render: dashboard ----------
function renderDashboard() {
    const tx = visibleTransactions();
    const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    $('kpiIncome').textContent = fmt(income);
    $('kpiExpense').textContent = fmt(expense);
    $('kpiBalance').textContent = (balance > 0 ? '+' : '') + fmt(balance);

    const type = groupType();
    $('kpiIncomeCard').hidden = type === 'expense';
    $('kpiExpenseCard').hidden = type === 'income';
    $('kpiBalanceCard').hidden = !!type;
    $('kpiCount').textContent = String(tx.length);
    $('legendIncome').hidden = type === 'expense';
    $('legendExpense').hidden = type === 'income';
    $('expenseBreakdownCard').hidden = type === 'income';
    $('incomeBreakdownCard').hidden = type === 'expense';

    const banner = $('groupBanner');
    banner.hidden = !state.group;
    if (state.group) {
        const cat = categoryById(state.group);
        $('groupBannerDot').style.background = cat?.color || (state.group === 'income' ? 'var(--income)' : state.group === 'expense' ? 'var(--expense)' : UNCATEGORIZED_COLOR);
        $('groupBannerName').textContent = groupLabel();
    }

    renderChart();
    renderBreakdown('expense', $('expenseBreakdown'));
    renderBreakdown('income', $('incomeBreakdown'));
    renderTransactions();
}

function buildBuckets() {
    const a = state.anchor;
    if (state.period === 'all') return buildAllTimeBuckets();
    if (state.period === 'month') {
        const days = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(a.getFullYear(), a.getMonth(), i + 1);
            return {
                key: toISO(d),
                axis: String(i + 1),
                title: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }),
                income: 0, expense: 0
            };
        });
    }
    if (state.period === 'year') {
        return MONTHS_SHORT.map((m, i) => ({
            key: `${a.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
            axis: m,
            title: new Date(a.getFullYear(), i, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }),
            income: 0, expense: 0
        }));
    }
    return null;
}

// Alle tijd: per maand, of per jaar als het meer dan 2 jaar beslaat
function buildAllTimeBuckets() {
    const dates = visibleTransactions().map((t) => t.date).sort();
    if (dates.length === 0) return [];
    const first = fromISO(dates[0]);
    const last = fromISO(dates[dates.length - 1]);
    const months = (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1;

    if (months > 24) {
        const years = [];
        for (let y = first.getFullYear(); y <= last.getFullYear(); y++) {
            years.push({ key: String(y), axis: String(y), title: String(y), income: 0, expense: 0 });
        }
        return years;
    }
    return Array.from({ length: months }, (_, i) => {
        const d = new Date(first.getFullYear(), first.getMonth() + i, 1);
        return {
            key: toISO(d).slice(0, 7),
            axis: `${MONTHS_SHORT[d.getMonth()]}${d.getMonth() === 0 || i === 0 ? ' ' + String(d.getFullYear()).slice(2) : ''}`,
            title: d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }),
            income: 0, expense: 0
        };
    });
}

// Ronde stapgrootte zodat de as 4 nette intervallen krijgt
function niceStep(max) {
    const raw = Math.max(max, 1) / 4;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

function renderChart() {
    const card = $('chartCard');
    const buckets = buildBuckets();
    if (!buckets) { card.hidden = true; return; }
    card.hidden = false;
    const keyLen = buckets[0]?.key.length ?? 7;
    $('chartTitle').textContent = keyLen === 10 ? 'Per dag' : keyLen === 4 ? 'Per jaar' : 'Per maand';

    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const t of visibleTransactions()) {
        const b = byKey.get(t.date.slice(0, keyLen));
        if (b) b[t.type] += t.amount;
    }

    const el = $('chart');
    const hasData = buckets.some((b) => b.income || b.expense);
    if (!hasData) {
        el.innerHTML = '<div class="chart-empty">Nog geen transacties in deze periode</div>';
        return;
    }

    const W = el.clientWidth || 800;
    const H = el.clientHeight || 260;
    const pad = { top: 8, right: 4, bottom: 22, left: 56 };
    const iw = W - pad.left - pad.right;
    const ih = H - pad.top - pad.bottom;
    const step = niceStep(Math.max(...buckets.map((b) => Math.max(b.income, b.expense))));
    const max = step * 4;
    const y = (v) => pad.top + ih - (v / max) * ih;

    const slot = iw / buckets.length;
    const gap = 2;
    const barW = Math.max(1.5, Math.min(18, (slot * 0.7 - gap) / 2));
    const r = Math.min(4, barW / 2);

    const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
    const compact = new Intl.NumberFormat('nl-NL', { notation: 'compact', maximumFractionDigits: 1 });

    // Staaf met afgeronde bovenkant, platte basis op de nullijn
    const barPath = (x, v) => {
        const h = Math.max(0, y(0) - y(v));
        if (h === 0) return '';
        const rr = Math.min(r, h);
        const top = y(v);
        const base = y(0);
        return `M${x},${base}V${top + rr}Q${x},${top} ${x + rr},${top}H${x + barW - rr}Q${x + barW},${top} ${x + barW},${top + rr}V${base}Z`;
    };

    // Toon zoveel aslabels als er passen (ongeveer één per 40px)
    const labelEvery = Math.max(1, Math.ceil(buckets.length / Math.max(1, Math.floor(iw / 40))));

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Inkomsten en uitgaven ${escapeHtml(periodLabel())}">`;
    for (const t of ticks) {
        svg += `<line class="grid-line" x1="${pad.left}" x2="${W - pad.right}" y1="${y(t)}" y2="${y(t)}"/>`;
        svg += `<text class="axis-text" x="${pad.left - 8}" y="${y(t) + 4}" text-anchor="end">€${compact.format(t)}</text>`;
    }
    buckets.forEach((b, i) => {
        const cx = pad.left + slot * i + slot / 2;
        const x1 = cx - gap / 2 - barW;
        const x2 = cx + gap / 2;
        svg += `<path class="bar-income" d="${barPath(x1, b.income)}"/>`;
        svg += `<path class="bar-expense" d="${barPath(x2, b.expense)}"/>`;
        if (i % labelEvery === 0) {
            svg += `<text class="axis-text" x="${cx}" y="${H - 6}" text-anchor="middle">${b.axis}</text>`;
        }
        svg += `<rect class="hit" data-i="${i}" x="${pad.left + slot * i}" y="${pad.top}" width="${slot}" height="${ih}"/>`;
    });
    svg += '</svg>';
    el.innerHTML = svg;

    const tip = $('tooltip');
    el.querySelectorAll('.hit').forEach((rect) => {
        rect.addEventListener('mouseenter', () => {
            const b = buckets[Number(rect.dataset.i)];
            const net = b.income - b.expense;
            tip.innerHTML = `<strong>${escapeHtml(b.title)}</strong>
                <div class="row"><span><i class="dot dot-income"></i>Inkomsten</span><span>${fmt(b.income)}</span></div>
                <div class="row"><span><i class="dot dot-expense"></i>Uitgaven</span><span>${fmt(b.expense)}</span></div>
                <div class="row"><span>Saldo</span><span>${fmt(net)}</span></div>`;
            tip.hidden = false;
        });
        rect.addEventListener('mousemove', (e) => {
            const box = card.getBoundingClientRect();
            let left = e.clientX - box.left + 14;
            if (left + tip.offsetWidth > box.width - 8) left = e.clientX - box.left - tip.offsetWidth - 14;
            tip.style.left = left + 'px';
            tip.style.top = (e.clientY - box.top + 14) + 'px';
        });
        rect.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
}

function renderBreakdown(type, el) {
    const totals = new Map();
    for (const t of visibleTransactions()) {
        if (t.type !== type) continue;
        const key = t.category_id || '';
        totals.set(key, (totals.get(key) || 0) + t.amount);
    }
    if (totals.size === 0) {
        el.innerHTML = `<p class="empty">Geen ${type === 'income' ? 'inkomsten' : 'uitgaven'} in deze periode</p>`;
        return;
    }
    const total = [...totals.values()].reduce((s, v) => s + v, 0);
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const max = rows[0][1];

    el.innerHTML = rows.map(([id, amount]) => {
        const cat = categoryById(id);
        const color = cat?.color || UNCATEGORIZED_COLOR;
        const name = cat?.name || 'Zonder categorie';
        const pct = Math.round((amount / total) * 100);
        return `<button type="button" class="bd-row" data-group="${id || 'none'}" title="Alleen ${escapeHtml(name)} bekijken">
            <div class="bd-top">
                <span class="bd-name"><i class="dot" style="background:${color}"></i><span>${escapeHtml(name)}</span></span>
                <span class="bd-amount">${fmt(amount)} · ${pct}%</span>
            </div>
            <div class="bd-track"><div class="bd-fill" style="width:${(amount / max) * 100}%;background:${color}"></div></div>
        </button>`;
    }).join('');
}

function renderTransactions() {
    const list = $('txList');
    const rows = visibleTransactions();

    if (rows.length === 0) {
        list.innerHTML = '<li class="empty">Geen transacties gevonden. Voeg er een toe met “+ Transactie”.</li>';
        return;
    }

    list.innerHTML = rows.map((t) => {
        const cat = categoryById(t.category_id);
        const sign = t.type === 'income' ? '+' : '−';
        const d = fromISO(t.date);
        const dateText = state.period === 'all'
            ? d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })
            : state.period === 'year'
                ? d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                : d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
        return `<li class="tx">
            <span class="tx-date">${dateText}</span>
            <div class="tx-main">
                <div class="tx-desc">${escapeHtml(t.description || cat?.name || (t.type === 'income' ? 'Inkomst' : 'Uitgave'))}</div>
                <div class="tx-cat"><i class="dot" style="background:${cat?.color || UNCATEGORIZED_COLOR}"></i>${escapeHtml(cat?.name || 'Zonder categorie')}</div>
            </div>
            <span class="tx-amount"><i class="dot ${t.type === 'income' ? 'dot-income' : 'dot-expense'}"></i> ${sign} ${fmt(t.amount)}</span>
            <div class="tx-actions">
                <button data-edit="${t.id}" aria-label="Bewerken">Bewerken</button>
                <button data-delete="${t.id}" aria-label="Verwijderen">Verwijderen</button>
            </div>
        </li>`;
    }).join('');
}

// ---------- Render: categorieën ----------
function renderCategories() {
    const render = (type) => {
        const cats = state.categories.filter((c) => c.type === type);
        if (cats.length === 0) return '<li class="empty">Nog geen categorieën</li>';
        return cats.map((c) => `<li>
            <input type="color" value="${c.color}" data-color="${c.id}" aria-label="Kleur van ${escapeHtml(c.name)}">
            <span class="name">${escapeHtml(c.name)}</span>
            <span class="cat-actions">
                <button data-group="${c.id}">Bekijken</button>
                <button data-rename="${c.id}">Hernoemen</button>
                <button data-delcat="${c.id}">Verwijderen</button>
            </span>
        </li>`).join('');
    };
    $('expenseCats').innerHTML = render('expense');
    $('incomeCats').innerHTML = render('income');

    const options = (type) => state.categories
        .filter((c) => c.type === type)
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    const select = $('groupSelect');
    select.innerHTML = `<option value="">Alles</option>
        <option value="income">Alle inkomsten</option>
        <option value="expense">Alle uitgaven</option>
        <optgroup label="Uitgaven per categorie">${options('expense')}</optgroup>
        <optgroup label="Inkomsten per categorie">${options('income')}</optgroup>
        <option value="none">Zonder categorie</option>`;
    select.value = state.group;
    if (select.value !== state.group) state.group = '';
}

$('catForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('catName').value.trim();
    if (!name) return;
    const { data, error } = await db.from('budget_categories')
        .insert({ name, type: $('catType').value, color: $('catColor').value })
        .select()
        .single();
    if (error) {
        return toast(error.code === '23505' ? 'Deze categorie bestaat al' : 'Opslaan mislukt: ' + error.message, true);
    }
    state.categories.push(data);
    state.categories.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    $('catName').value = '';
    renderCategories();
    toast('Categorie toegevoegd');
});

document.addEventListener('change', async (e) => {
    const id = e.target.dataset?.color;
    if (!id) return;
    const color = e.target.value;
    const { error } = await db.from('budget_categories').update({ color }).eq('id', id);
    if (error) return toast('Kleur opslaan mislukt: ' + error.message, true);
    categoryById(id).color = color;
    renderDashboard();
});

document.addEventListener('click', async (e) => {
    const t = e.target;
    const groupBtn = t.closest('[data-group]');
    if (groupBtn) {
        setGroup(groupBtn.dataset.group);
        $('appView').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    if (t.dataset.rename) {
        const cat = categoryById(t.dataset.rename);
        const name = prompt('Nieuwe naam', cat.name)?.trim();
        if (!name || name === cat.name) return;
        const { error } = await db.from('budget_categories').update({ name }).eq('id', cat.id);
        if (error) return toast(error.code === '23505' ? 'Deze naam bestaat al' : 'Hernoemen mislukt: ' + error.message, true);
        cat.name = name;
        renderCategories();
        renderDashboard();
    } else if (t.dataset.delcat) {
        const cat = categoryById(t.dataset.delcat);
        if (!confirm(`Categorie "${cat.name}" verwijderen? Bestaande transacties blijven bewaard zonder categorie.`)) return;
        const { error } = await db.from('budget_categories').delete().eq('id', cat.id);
        if (error) return toast('Verwijderen mislukt: ' + error.message, true);
        state.categories = state.categories.filter((c) => c.id !== cat.id);
        if (state.group === cat.id) state.group = '';
        state.transactions.forEach((tx) => { if (tx.category_id === cat.id) tx.category_id = null; });
        renderCategories();
        renderDashboard();
    } else if (t.dataset.edit) {
        openTxDialog(state.transactions.find((x) => x.id === t.dataset.edit));
    } else if (t.dataset.delete) {
        if (!confirm('Deze transactie verwijderen?')) return;
        const { error } = await db.from('budget_transactions').delete().eq('id', t.dataset.delete);
        if (error) return toast('Verwijderen mislukt: ' + error.message, true);
        state.transactions = state.transactions.filter((x) => x.id !== t.dataset.delete);
        renderDashboard();
        toast('Transactie verwijderd');
    }
});

// ---------- Transactie dialoog ----------
function setTxType(type, selectedCategory) {
    state.txType = type;
    document.querySelectorAll('.type-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.type === type));
    const cats = state.categories.filter((c) => c.type === type);
    $('txCategory').innerHTML = '<option value="">Zonder categorie</option>'
        + cats.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    $('txCategory').value = selectedCategory ?? (cats[0]?.id || '');
}

function openTxDialog(tx) {
    state.editingId = tx?.id || null;
    $('txDialogTitle').textContent = tx ? 'Transactie bewerken' : 'Nieuwe transactie';
    $('txMsg').textContent = '';
    $('txAmount').value = tx ? String(tx.amount.toFixed(2)).replace('.', ',') : '';
    $('txDate').value = tx?.date || (state.period === 'day' ? toISO(state.anchor) : toISO(new Date()));
    $('txDescription').value = tx?.description || '';
    if (tx) {
        setTxType(tx.type, tx.category_id || '');
    } else {
        // Nieuwe transactie vanuit een groep: die categorie/type alvast kiezen
        const groupCat = categoryById(state.group);
        setTxType(groupType() || state.txType, groupCat ? groupCat.id : state.group === 'none' ? '' : undefined);
    }
    $('txDialog').showModal();
    $('txAmount').focus();
}

document.querySelectorAll('.type-toggle button').forEach((b) => {
    b.addEventListener('click', () => setTxType(b.dataset.type));
});

$('addTxBtn').addEventListener('click', () => openTxDialog(null));
$('txCancel').addEventListener('click', () => $('txDialog').close());

$('txForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('txMsg');
    msg.classList.add('error');

    const raw = $('txAmount').value.trim().replace(/\s|€/g, '');
    // "1.234,56", "2.500" (duizendtallen), "12,5" of "1234.56"
    const normalized = raw.includes(',')
        ? raw.replace(/\./g, '').replace(',', '.')
        : /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw;
    const amount = Math.round(Number(normalized) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
        msg.textContent = 'Vul een geldig bedrag in (groter dan 0).';
        return;
    }
    const date = $('txDate').value;
    if (!date) {
        msg.textContent = 'Kies een datum.';
        return;
    }

    const payload = {
        type: state.txType,
        amount,
        date,
        category_id: $('txCategory').value || null,
        description: $('txDescription').value.trim() || null
    };

    const submitBtn = e.submitter;
    if (submitBtn) submitBtn.disabled = true;
    const { error } = state.editingId
        ? await db.from('budget_transactions').update(payload).eq('id', state.editingId)
        : await db.from('budget_transactions').insert(payload);
    if (submitBtn) submitBtn.disabled = false;

    if (error) {
        msg.textContent = 'Opslaan mislukt: ' + error.message;
        return;
    }
    $('txDialog').close();
    toast(state.editingId ? 'Transactie bijgewerkt' : 'Transactie opgeslagen');
    await loadTransactions();
});

// ---------- Periode bediening ----------
document.querySelectorAll('[data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
        state.period = btn.dataset.period;
        document.querySelectorAll('[data-period]').forEach((b) => b.classList.toggle('active', b === btn));
        loadTransactions();
    });
});
$('prevBtn').addEventListener('click', () => shiftPeriod(-1));
$('nextBtn').addEventListener('click', () => shiftPeriod(1));
$('todayBtn').addEventListener('click', () => { state.anchor = new Date(); loadTransactions(); });
$('groupSelect').addEventListener('change', (e) => setGroup(e.target.value));
$('groupClear').addEventListener('click', () => setGroup(''));

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.user) renderChart(); }, 150);
});

initAuth();
