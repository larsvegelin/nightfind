/*
 * ParseLab — achtergrondscript (service worker).
 * Rechten: alleen activeTab + scripting + storage + downloads. Toegang tot een site wordt
 * pas gevraagd als de gebruiker daar het paneel opent (activeTab) of een taak bewaart /
 * een ronde start (dan precies die site, via optional_host_permissions). "debugger" is een
 * vaste toestemming voor PDF opslaan (Chrome staat hem niet toe als optionele toestemming).
 */
function stamp() { return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); }
function safeName(n) { return String(n || 'bestand').replace(/[\\/:*?"<>|~]/g, '_').replace(/\s+/g, ' ').replace(/^[\s.]+|[\s.]+$/g, '').slice(0, 120) || 'bestand'; }
function inFolder(folder, name) { const f = String(folder || '').replace(/[\\:*?"<>|]/g, '').replace(/^\/+|\/+$/g, '').trim(); return (f ? f + '/' : '') + name; }
const LOG_KEY = 'pl-log', LOG_MAX = 200;

// Logboek: per ronde {host, start, einde, regels, fouten, bron} — maximaal 200 regels.
function appendLog(entry) {
    return new Promise(res => {
        try {
            chrome.storage.local.get(LOG_KEY, r => {
                const list = Array.isArray(r && r[LOG_KEY]) ? r[LOG_KEY] : [];
                list.unshift(entry);
                chrome.storage.local.set({ [LOG_KEY]: list.slice(0, LOG_MAX) }, () => res());
            });
        } catch (e) { res(); }
    });
}

// ---- Sitetoegang per origin (paneel + lopende ronde komen daar terug na navigatie) ----
function siteId(origin) { return 'pl-' + origin.replace(/[^a-z0-9]/gi, '_'); }
async function grantSite(origin) {
    if (!/^https?:\/\//.test(origin || '')) return { ok: false, err: 'geen website' };
    const pattern = origin.replace(/\/+$/, '') + '/*';
    let has = false;
    try { has = await chrome.permissions.contains({ origins: [pattern] }); } catch (e) {}
    if (!has) {
        // Vanuit de pagina mag Chrome deze vraag soms niet stellen ("user gesture"). Dan een
        // klein venster openen waarin de gebruiker zelf op "Toestemming geven" klikt.
        try { has = await chrome.permissions.request({ origins: [pattern] }); }
        catch (e) { return { ok: false, err: 'geen doorlopende toegang' }; }   // geen extra venster: niet nodig binnen een web-app
    }
    if (!has) return { ok: false, err: 'geweigerd' };
    const id = siteId(origin);
    try {
        const ex = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
        if (!ex || !ex.length) {
            await chrome.scripting.registerContentScripts([{ id, matches: [pattern], js: ['panel.js'], css: ['panel.css'], runAt: 'document_idle', persistAcrossSessions: true }]);
        }
    } catch (e) { return { ok: true, warn: e && e.message }; }
    return { ok: true };
}
async function releaseSite(origin) {
    if (!/^https?:\/\//.test(origin || '')) return { ok: true };
    const pattern = origin.replace(/\/+$/, '') + '/*';
    try { await chrome.scripting.unregisterContentScripts({ ids: [siteId(origin)] }); } catch (e) {}
    try { await chrome.permissions.remove({ origins: [pattern] }); } catch (e) {}
    return { ok: true };
}
async function hasSite(origin) {
    try { const ex = await chrome.scripting.getRegisteredContentScripts({ ids: [siteId(origin)] }); return { ok: true, registered: !!(ex && ex.length) }; }
    catch (e) { return { ok: true, registered: false }; }
}

// ---- Cloud: flows (sequences) en mappen in Supabase ----
// Toegang via een geheime teamcode (header x-pl-team). De database bewaart alleen de SHA-256 daarvan
// en laat via RLS alleen de flows van het eigen team zien. De publieke sleutel alleen geeft geen toegang.
const PL_DB = { url: 'https://gpkohiyzdjyehqdkgpdb.supabase.co', key: 'sb_publishable_Dtsp2Q9T8svTU3DmYCzzVg_hGDaztE2' };
function nieuweTeamcode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(24));
    const t = Array.from(b, x => abc[x % abc.length]).join('');
    return 'PL-' + t.match(/.{4}/g).join('-');
}
async function teamcode() {
    const r = await chrome.storage.local.get('pl-team');
    if (r && r['pl-team'] && String(r['pl-team']).length >= 20) return r['pl-team'];
    const c = nieuweTeamcode(); await chrome.storage.local.set({ 'pl-team': c }); return c;
}
// Ander adres (IT-beheer of test): chrome.storage 'pl-db-url' / 'pl-db-key'. Alleen https of een lokaal adres.
async function dbConf() {
    const r = await chrome.storage.local.get(['pl-db-url', 'pl-db-key']);
    const u = String((r && r['pl-db-url']) || '');
    return /^https:\/\/|^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u + '/') ? { url: u.replace(/\/+$/, ''), key: r['pl-db-key'] || PL_DB.key } : PL_DB;
}
async function dbFetch(pad, opt) {
    const team = await teamcode(), conf = await dbConf();
    const h = Object.assign({ apikey: conf.key, 'x-pl-team': team, 'Content-Type': 'application/json', Accept: 'application/json' }, (opt && opt.headers) || {});
    let r;
    try { r = await fetch(conf.url + '/rest/v1/' + pad, Object.assign({}, opt || {}, { headers: h })); }
    catch (e) { return { ok: false, offline: true, err: 'geen verbinding met de cloud' }; }
    const tekst = await r.text(); let data = null; try { data = tekst ? JSON.parse(tekst) : null; } catch (e) { data = tekst; }
    if (!r.ok) {
        const code = data && data.code;
        const err = r.status === 409 || code === '23505' ? 'bestaat-al' : (data && (data.message || data.hint)) || ('fout ' + r.status);
        return { ok: false, status: r.status, err };
    }
    return { ok: true, data };
}
const enc = encodeURIComponent;
async function dbBericht(m) {
    switch (m.op) {
        case 'team': return { ok: true, team: await teamcode(), url: PL_DB.url };
        case 'team-zet': {
            const c = String(m.code || '').trim();
            if (c.length < 20) return { ok: false, err: 'een teamcode heeft minstens 20 tekens' };
            await chrome.storage.local.set({ 'pl-team': c }); return { ok: true, team: c };
        }
        case 'team-nieuw': { const c = nieuweTeamcode(); await chrome.storage.local.set({ 'pl-team': c }); return { ok: true, team: c }; }
        case 'lijst': {
            const [f, mp] = await Promise.all([
                dbFetch('sequences?select=id,naam,map,host,aantal_stappen,bijgewerkt&order=map.asc,naam.asc'),
                dbFetch('sequence_mappen?select=id,pad&order=pad.asc')]);
            if (!f.ok) return f; if (!mp.ok) return mp;
            return { ok: true, flows: f.data || [], mappen: (mp.data || []).map(x => x.pad) };
        }
        case 'laad': {
            const r = await dbFetch('sequences?id=eq.' + enc(m.id) + '&select=*');
            if (!r.ok) return r; if (!r.data || !r.data.length) return { ok: false, err: 'niet gevonden' };
            return { ok: true, flow: r.data[0] };
        }
        case 'bewaar': {
            const rij = { naam: String(m.naam || '').trim().slice(0, 120), map: String(m.map || '').trim().slice(0, 200), host: m.host || null, data: m.data };
            if (m.id) {
                const r = await dbFetch('sequences?id=eq.' + enc(m.id) + '&select=id,naam,map,bijgewerkt', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rij) });
                if (!r.ok) return r;
                if (r.data && r.data.length) return { ok: true, flow: r.data[0] };
                // verdwenen (bv. door een collega verwijderd)? Dan opnieuw aanmaken.
            }
            const r = await dbFetch('sequences?select=id,naam,map,bijgewerkt', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rij) });
            return r.ok ? { ok: true, flow: r.data[0], nieuw: true } : r;
        }
        case 'wijzig': {   // alleen naam/map
            const rij = {}; if (m.naam != null) rij.naam = String(m.naam).trim().slice(0, 120); if (m.map != null) rij.map = String(m.map).trim().slice(0, 200);
            const r = await dbFetch('sequences?id=eq.' + enc(m.id) + '&select=id,naam,map,bijgewerkt', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rij) });
            return r.ok ? { ok: true, flow: (r.data || [])[0] } : r;
        }
        case 'verwijder': return dbFetch('sequences?id=eq.' + enc(m.id), { method: 'DELETE' });
        case 'map-nieuw': {
            const pad = String(m.pad || '').split('/').map(x => x.trim()).filter(Boolean).join('/').slice(0, 200);
            if (!pad) return { ok: false, err: 'geef de map een naam' };
            // ook de bovenliggende mappen (A/B/C → A, A/B, A/B/C)
            const delen = pad.split('/'), paden = delen.map((_, i) => delen.slice(0, i + 1).join('/'));
            const r = await dbFetch('sequence_mappen?on_conflict=team_hash,pad', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(paden.map(p => ({ pad: p }))) });
            return r.ok ? { ok: true, pad } : r;
        }
        case 'map-hernoem': {
            const oud = String(m.oud || ''), nieuw = String(m.nieuw || '').split('/').map(x => x.trim()).filter(Boolean).join('/');
            if (!oud || !nieuw) return { ok: false, err: 'geef de map een naam' };
            const l = await dbBericht({ op: 'lijst' }); if (!l.ok) return l;
            const binnen = p => p === oud || p.indexOf(oud + '/') === 0, om = p => nieuw + p.slice(oud.length);
            if (l.mappen.some(p => p === nieuw)) return { ok: false, err: 'bestaat-al' };
            for (const p of l.mappen.filter(binnen)) { const r = await dbFetch('sequence_mappen?pad=eq.' + enc(p), { method: 'PATCH', body: JSON.stringify({ pad: om(p) }) }); if (!r.ok) return r; }
            await dbBericht({ op: 'map-nieuw', pad: nieuw });
            for (const f of l.flows.filter(f => binnen(f.map || ''))) { const r = await dbFetch('sequences?id=eq.' + enc(f.id), { method: 'PATCH', body: JSON.stringify({ map: om(f.map) }) }); if (!r.ok) return r; }
            return { ok: true };
        }
        case 'map-weg': {
            const pad = String(m.pad || ''); const l = await dbBericht({ op: 'lijst' }); if (!l.ok) return l;
            const binnen = p => p === pad || p.indexOf(pad + '/') === 0;
            if (l.flows.some(f => binnen(f.map || ''))) return { ok: false, err: 'niet-leeg' };
            for (const p of l.mappen.filter(binnen)) { const r = await dbFetch('sequence_mappen?pad=eq.' + enc(p), { method: 'DELETE' }); if (!r.ok) return r; }
            return { ok: true };
        }
        case 'versies': {
            const r = await dbFetch('sequence_versies?sequence_id=eq.' + enc(m.id) + '&select=id,bewaard&order=bewaard.desc&limit=30');
            return r.ok ? { ok: true, versies: r.data || [] } : r;
        }
        case 'versie': {
            const r = await dbFetch('sequence_versies?id=eq.' + enc(m.vid) + '&select=data,bewaard');
            return r.ok && r.data && r.data.length ? { ok: true, data: r.data[0].data, bewaard: r.data[0].bewaard } : (r.ok ? { ok: false, err: 'niet gevonden' } : r);
        }
        // ---- Wachtrij ----
        case 'wq-tel': {
            const r = await dbFetch('rpc/pl_wachtrij_tel', { method: 'POST', body: JSON.stringify({ p_flow: m.flow_id }) });
            return r.ok ? { ok: true, tel: r.data || {} } : r;
        }
        case 'wq-pak': {
            const r = await dbFetch('rpc/pl_pak_werk', { method: 'POST', body: JSON.stringify({ p_flow: m.flow_id, p_aantal: Math.max(1, Math.min(1000, +m.aantal || 100)), p_door: m.door || null }) });
            return r.ok ? { ok: true, items: (r.data || []).map(x => ({ id: x.id, data: x.data })) } : r;
        }
        case 'wq-toevoegen': {
            const rijen = (m.rijen || []).map(d => ({ flow_id: m.flow_id, data: d })); let n = 0;
            for (let i = 0; i < rijen.length; i += 500) {
                const r = await dbFetch('wachtrij', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rijen.slice(i, i + 500)) });
                if (!r.ok) return Object.assign(r, { toegevoegd: n }); n += Math.min(500, rijen.length - i);
            }
            return { ok: true, toegevoegd: n };
        }
        case 'wq-meld': {   // status: klaar | fout | nieuw (terug in de wachtrij)
            const ids = (m.ids || []).filter(x => Number.isFinite(+x)).map(x => +x); if (!ids.length) return { ok: true };
            const rij = m.status === 'nieuw' ? { status: 'nieuw', gestart: null, door: null } : { status: m.status === 'fout' ? 'fout' : 'klaar', klaar: new Date().toISOString(), resultaat: m.resultaat || null, fout: m.fout || null };
            return dbFetch('wachtrij?id=in.(' + ids.join(',') + ')', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rij) });
        }
        case 'wq-opnieuw': return dbFetch('wachtrij?flow_id=eq.' + enc(m.flow_id) + '&status=eq.fout', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'nieuw', fout: null, gestart: null }) });
        case 'wq-opruimen': return dbFetch('wachtrij?flow_id=eq.' + enc(m.flow_id) + '&status=eq.klaar', { method: 'DELETE' });
        case 'wq-recent': {
            const r = await dbFetch('wachtrij?flow_id=eq.' + enc(m.flow_id) + '&select=id,data,status,fout,resultaat,door,aangemaakt,klaar&order=id.desc&limit=' + Math.min(200, +m.limit || 20));
            return r.ok ? { ok: true, items: r.data || [] } : r;
        }
        // ---- Run-geschiedenis ----
        case 'run-start': {
            const r = await dbFetch('runs?select=id', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ flow_id: m.flow_id || null, flow_naam: m.flow_naam || null, bron: m.bron || 'handmatig', door: m.door || null, totaal: m.totaal || null }) });
            return r.ok ? { ok: true, id: r.data && r.data[0] && r.data[0].id } : r;
        }
        case 'run-einde': return dbFetch('runs?id=eq.' + enc(m.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: m.status || 'klaar', regels: m.regels, fouten: m.fouten, overgeslagen: m.overgeslagen || null, geeindigd: new Date().toISOString() }) });
        case 'runs': {
            const r = await dbFetch('runs?select=id,flow_id,flow_naam,bron,door,status,totaal,regels,fouten,overgeslagen,gestart,geeindigd&order=gestart.desc&limit=' + Math.min(100, +m.limit || 30));
            return r.ok ? { ok: true, runs: r.data || [] } : r;
        }
    }
    return { ok: false, err: 'onbekende opdracht' };
}
globalThis.__plDb = { dbBericht, teamcode, PL_DB };

// ---- Planning: flows op vaste tijden laten starten (chrome.alarms) ----
// Planningen staan per computer in chrome.storage ('pl-planning'). Op het tijdstip opent ParseLab een
// venster met de startpagina, laadt de flow uit de cloud en start hem. Chrome moet open zijn en je
// moet op de site ingelogd zijn (het draait in je eigen browser).
const PLAN_KEY = 'pl-planning', PLAN_BEZIG = 'pl-plan-bezig';
function volgendeKeer(p, nu) {
    nu = nu || Date.now();
    const w = p.wanneer || {}, [hh, mm] = String(w.tijd || '08:00').split(':').map(x => +x || 0);
    const opTijd = (d) => { const x = new Date(d); x.setHours(hh, mm, 0, 0); return x; };
    if (w.soort === 'eenmalig') { const t = Date.parse(w.datum || ''); return t > nu ? t : null; }
    if (w.soort === 'interval') { const min = Math.max(5, +w.minuten || 15); return Math.max(nu + 30000, (p.laatst || 0) + min * 60000); }
    for (let i = 0; i < 9; i++) {
        const d = opTijd(nu + i * 86400000), dag = d.getDay();
        if (d.getTime() <= nu) continue;
        if (w.soort === 'werkdagen' && (dag === 0 || dag === 6)) continue;
        if (w.soort === 'wekelijks' && dag !== (+w.dag || 1)) continue;
        return d.getTime();
    }
    return null;
}
async function herplan() {
    const r = await chrome.storage.local.get(PLAN_KEY); const lijst = (r && r[PLAN_KEY]) || [];
    const oud = await chrome.alarms.getAll(); for (const a of oud) if (/^pl-plan:/.test(a.name) && !lijst.some(p => 'pl-plan:' + p.id === a.name && p.aan)) await chrome.alarms.clear(a.name);
    let veranderd = false;
    for (const p of lijst) {
        const v = p.aan ? volgendeKeer(p) : null;
        if (v) await chrome.alarms.create('pl-plan:' + p.id, { when: v }); else await chrome.alarms.clear('pl-plan:' + p.id);
        if ((p.volgende || null) !== v) { p.volgende = v; veranderd = true; }
    }
    if (veranderd) await chrome.storage.local.set({ [PLAN_KEY]: lijst });
}
async function planBijwerken(id, f) {
    const r = await chrome.storage.local.get(PLAN_KEY); const lijst = (r && r[PLAN_KEY]) || [];
    const p = lijst.find(x => x.id === id); if (!p) return null; f(p);
    await chrome.storage.local.set({ [PLAN_KEY]: lijst }); return p;
}
async function wachtOpPaneel(tabId, ms) {
    for (const t0 = Date.now(); Date.now() - t0 < (ms || 20000); ) { const st = await paneelStatus(tabId); if (st.aanwezig && st.open) return true; await wacht(500); }
    return false;
}
async function voerPlanUit(id, handmatig) {
    const r = await chrome.storage.local.get([PLAN_KEY, PLAN_BEZIG]); const p = ((r && r[PLAN_KEY]) || []).find(x => x.id === id);
    if (!p) return { ok: false, err: 'planning niet gevonden' };
    const bezig = (r && r[PLAN_BEZIG]) || {};
    if (bezig[id] && Date.now() - bezig[id].ts < 3 * 3600000) return { ok: false, err: 'loopt nog' };
    // Alleen als er werk is? Dan eerst de wachtrij tellen — geen venster voor niets.
    if (p.alleenMetWerk) {
        const t = await dbBericht({ op: 'wq-tel', flow_id: p.flowId });
        if (t.ok && !(+((t.tel || {}).nieuw) > 0)) { await planBijwerken(id, x => { x.laatst = Date.now(); x.laatsteStatus = 'geen werk'; }); return { ok: true, leeg: true }; }
    }
    let w;
    try { w = await chrome.windows.create({ url: p.url || 'about:blank', focused: true, state: 'normal' }); }
    catch (e) { await planBijwerken(id, x => { x.laatst = Date.now(); x.laatsteStatus = 'venster openen mislukt'; }); return { ok: false, err: e.message }; }
    const tabId = w.tabs && w.tabs[0] && w.tabs[0].id;
    bezig[id] = { ts: Date.now(), windowId: w.id, tabId }; await chrome.storage.local.set({ [PLAN_BEZIG]: bezig });
    await planBijwerken(id, x => { x.laatst = Date.now(); x.laatsteStatus = 'gestart'; });
    await wachtOpLaden(tabId); await wacht(1500);
    await chrome.storage.local.set({ 'wt-active': true });
    let st = await paneelStatus(tabId);
    if (!st.aanwezig) { try { await chrome.scripting.insertCSS({ target: { tabId }, files: ['panel.css'] }); await chrome.scripting.executeScript({ target: { tabId }, files: ['panel.js'] }); } catch (e) {} }
    else if (!st.open) { try { await chrome.tabs.sendMessage(tabId, { type: 'wt-set', active: true }); } catch (e) {} }
    if (!(await wachtOpPaneel(tabId, 20000))) { await planKlaar(id, 'paneel niet geladen (ingelogd?)'); return { ok: false, err: 'paneel niet geladen' }; }
    let ant = null; try { ant = await chrome.tabs.sendMessage(tabId, { type: 'pl-auto-run', planId: id, flowId: p.flowId, bron: 'planning' }); } catch (e) {}
    if (!ant || !ant.ok) { await planKlaar(id, 'starten mislukt' + (ant && ant.err ? ': ' + ant.err : '')); return { ok: false, err: ant && ant.err }; }
    return { ok: true };
}
async function planKlaar(id, status) {
    const r = await chrome.storage.local.get(PLAN_BEZIG); const bezig = (r && r[PLAN_BEZIG]) || {}, b = bezig[id];
    delete bezig[id]; await chrome.storage.local.set({ [PLAN_BEZIG]: bezig });
    const p = await planBijwerken(id, x => { x.laatsteStatus = status || 'klaar'; });
    // Zelf geopend venster weer sluiten (na even wachten, zodat downloads klaar zijn).
    if (b && b.windowId && p && p.sluiten !== false) setTimeout(() => { chrome.windows.remove(b.windowId).catch(() => {}); }, 20000);
    await herplan();
}
if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener(a => { if (/^pl-plan:/.test(a.name)) voerPlanUit(a.name.slice(8)).finally(() => herplan()); });
    chrome.runtime.onStartup.addListener(() => { herplan(); });
    chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch[PLAN_KEY] && !herplan.bezig) { herplan.bezig = true; herplan().finally(() => { herplan.bezig = false; }); } });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === 'pl-extern') { externOphalen(msg, sender.tab && sender.tab.id).then(sendResponse, e => sendResponse({ ok: false, err: (e && e.message) || 'fout' })); return true; }
    if (msg.type === 'pl-db') { dbBericht(msg).then(sendResponse, e => sendResponse({ ok: false, err: (e && e.message) || 'fout' })); return true; }
    if (msg.type === 'pl-plan-nu') { voerPlanUit(msg.id, true).then(sendResponse, e => sendResponse({ ok: false, err: e && e.message })); return true; }
    if (msg.type === 'pl-plan-herplan') { herplan().then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, err: e && e.message })); return true; }
    if (msg.type === 'pl-auto-klaar') { planKlaar(msg.planId, msg.status).then(() => sendResponse({ ok: true })); return true; }
    // Bestand (Excel/CSV/JSON): direct naar de gekozen map, zonder "opslaan als"-venster.
    if (msg.type === 'wt-download') {
        const url = msg.dataB64 != null
            ? 'data:' + (msg.mime || 'application/octet-stream') + ';base64,' + msg.dataB64
            : 'data:' + (msg.mime || 'application/octet-stream') + ';charset=utf-8,' + encodeURIComponent(msg.data || '');
        chrome.downloads.download({ url, filename: inFolder(msg.folder, msg.filename || 'parselab-data.txt'), saveAs: false, conflictAction: 'uniquify' },
            () => sendResponse({ ok: !chrome.runtime.lastError }));
        return true;
    }
    // Bewijskopie (afbeelding): leg de zichtbare pagina vast en bewaar als PNG.
    if (msg.type === 'wt-shot') {
        const winId = sender.tab ? sender.tab.windowId : undefined;
        // Eerst via de pagina zelf (betrouwbaar, ook vlak na een PDF); lukt dat niet, dan wat zichtbaar is.
        const tabIdS = sender.tab && sender.tab.id;
        shotVanTab(tabIdS).catch(() => null).then(cdpUrl => { const verder = (dataUrl) => {
            if (!dataUrl) { sendResponse({ ok: false, err: chrome.runtime.lastError && chrome.runtime.lastError.message }); return; }
            if (msg.zipRun) zipBewaar(msg.zipRun, (msg.folder || 'ParseLab') + '/' + safeName(msg.name || 'bewijskopie') + '-' + stamp() + '.png', dataUrl);
            chrome.downloads.download({ url: dataUrl, filename: inFolder(msg.folder, safeName(msg.name || 'bewijskopie') + '-' + stamp() + '.png'), saveAs: false, conflictAction: 'uniquify' },
                () => sendResponse({ ok: !chrome.runtime.lastError }));
        }; if (cdpUrl) verder(cdpUrl); else chrome.tabs.captureVisibleTab(winId, { format: 'png' }, u => verder(chrome.runtime.lastError ? null : u)); });
        return true;
    }
    // Bestanden/afbeeldingen downloaden naar de map.
    if (msg.type === 'wt-dlfiles') {
        const urls = Array.isArray(msg.urls) ? msg.urls.slice(0, 200) : [];
        let done = 0;
        if (!urls.length) { sendResponse({ ok: true, n: 0 }); return true; }
        urls.forEach(u => {
            let name;
            try { name = decodeURIComponent(new URL(u).pathname.split('/').pop() || 'bestand'); } catch (e) { name = 'bestand'; }
            name = safeName(name) || 'bestand';
            chrome.downloads.download({ url: u, filename: inFolder(msg.folder, name), saveAs: false, conflictAction: 'uniquify' },
                () => { if (++done === urls.length) sendResponse({ ok: true, n: done }); });
        });
        return true;
    }
    // Bewijskopie (PDF) via Chrome's eigen print-engine. Alleen als de optionele
    // debugger-permissie is gegeven; anders een nette melding.
    if (msg.type === 'wt-print') {
        const tabId = sender.tab && sender.tab.id;
        if (!tabId) { sendResponse({ ok: false, err: 'geen tabblad' }); return true; }
        printBericht(msg, tabId).then(sendResponse);
        return true;
    }
    // ---- Kaders (iframes): paneel ⇄ helper in het kader ----
    if (msg.type === 'pl-agent-event') {   // van de helper in een kader → naar het paneel (hoofdframe)
        const tabId = sender.tab && sender.tab.id; if (!tabId) return;
        try { chrome.tabs.sendMessage(tabId, Object.assign({}, msg, { type: 'pl-frame-event', url: msg.url || sender.url, frameId: sender.frameId }), { frameId: 0 }).catch(() => {}); } catch (e) {}
        return;
    }
    if (msg.type === 'pl-frames') {   // aanwijzen/opnemen starten of stoppen in alle kaders
        const tabId = sender.tab && sender.tab.id; if (!tabId) { sendResponse({ ok: false }); return true; }
        (async () => {
            if (msg.cmd === 'recStart') OPNAME_TABS.add(tabId);
            if (msg.cmd === 'recStop') OPNAME_TABS.delete(tabId);
            const kaders = await kadersVan(tabId);
            await Promise.all(kaders.map(async f => { if ((msg.cmd === 'pickStart' || msg.cmd === 'recStart') && !(await zorgVoorHelper(tabId, f.frameId))) return; await naarKader(tabId, f.frameId, { type: 'pl-agent', cmd: msg.cmd, kind: msg.kind }); }));
            sendResponse({ ok: true, n: kaders.length });
        })();
        return true;
    }
    if (msg.type === 'pl-frame-cmd') {   // stap uitvoeren / element tonen in het juiste kader
        const tabId = sender.tab && sender.tab.id; if (!tabId) { sendResponse({ ok: false, err: 'geen tabblad' }); return true; }
        (async () => {
            const frameId = await zoekKader(tabId, msg.frame);
            if (frameId == null) { sendResponse({ ok: false, err: 'het kader (' + ((msg.frame && msg.frame.host) || '?') + ') staat niet op deze pagina' }); return; }
            if (!(await zorgVoorHelper(tabId, frameId))) { sendResponse({ ok: false, err: 'ParseLab kan niet in dit kader' }); return; }
            const r = await naarKader(tabId, frameId, { type: 'pl-agent', cmd: msg.cmd, step: msg.step, ctx: msg.ctx }, 60000);
            sendResponse(r || { ok: false, err: 'geen antwoord uit het kader' });
        })();
        return true;
    }
    // ---- Logboek: schermafbeelding per stap ----
    if (msg.type === 'pl-shot') {
        const winId = sender.tab ? sender.tab.windowId : undefined;
        maakShot(winId, msg.runId || 'run', msg.naam || String(Date.now())).then(sendResponse, e => sendResponse({ ok: false, err: e && e.message }));
        return true;
    }
    if (msg.type === 'pl-zip-get') { haalZip(msg.run || '').then(lijst => sendResponse({ ok: true, lijst }), e => sendResponse({ ok: false, err: e && e.message })); return true; }
    if (msg.type === 'pl-shot-get') { haalShots(msg.ids || []).then(shots => sendResponse({ ok: true, shots }), () => sendResponse({ ok: false, shots: {} })); return true; }
    // ---- Claude (eigen API-sleutel van de gebruiker) ----
    if (msg.type === 'pl-llm') { vraagClaude(msg).then(result => sendResponse({ ok: true, result }), e => sendResponse({ ok: false, err: (e && e.message) || String(e) })); return true; }
    // Vroeger optioneel; nu vast. Oude paneelversies krijgen gewoon "ja".
    if (msg.type === 'wt-perm' || msg.type === 'wt-perm-has') { sendResponse({ ok: true, granted: true }); return true; }
    // Sitetoegang: vragen/registreren, vrijgeven, status.
    if (msg.type === 'wt-site-grant') { grantSite(msg.origin).then(sendResponse); return true; }
    if (msg.type === 'wt-site-release') { releaseSite(msg.origin).then(sendResponse); return true; }
    if (msg.type === 'wt-site-has') { hasSite(msg.origin).then(sendResponse); return true; }
    // Logboek-regel toevoegen.
    if (msg.type === 'wt-log') { appendLog(msg.entry || {}).then(() => sendResponse({ ok: true })); return true; }
});

// ---- Klik op het icoon (of de sneltoets) ----------------------------------------------
// Het paneel hoort te openen op het tabblad waar je op dat moment staat. Daarom vragen we
// het tabblad zelf hoe het ervoor staat (wt-ping) in plaats van te vertrouwen op een
// bewaarde vlag: die is er maar één voor alle tabbladen en stond na een ander tabblad of
// een herstart soms nog "aan", waardoor een klik het paneel juist probeerde te sluiten en
// er niets gebeurde. Weet de pagina van niets, dan injecteren we altijd.
const PAGINA_VAN_BROWSER = /^(chrome|edge|brave|opera|vivaldi|about|devtools|view-source|chrome-extension|moz-extension|chrome-search|chrome-untrusted):/i;
const PAGINA_WINKEL = /^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com|microsoftedge\.microsoft\.com\/addons|addons\.mozilla\.org)/i;

// Waarom kan het hier niet? null = wel proberen (ook bij een onbekend adres).
function waaromNiet(url) {
    if (!url) return null;
    if (/^file:\/\//i.test(url)) return 'zet bij chrome://extensions onder ParseLab "Toegang tot bestands-URL\'s toestaan" aan';
    if (PAGINA_WINKEL.test(url)) return 'de browserwinkel laat geen extensies toe; open een gewone website';
    if (PAGINA_VAN_BROWSER.test(url)) return 'browserpagina\'s laten geen extensies toe; open eerst een gewone website';
    return null;
}
// Een klik die niets kan doen mag niet stil blijven: rood uitroepteken op het icoon en de
// reden in de tooltip. Verdwijnt zodra je naar een andere pagina gaat.
async function meldOpIcoon(tabId, tekst) {
    // Elk onderdeel apart: mislukt de badge (bijvoorbeeld bij een tabblad dat net weg is),
    // dan moet de uitleg in de tooltip er nog steeds komen.
    try { await chrome.action.setTitle({ tabId, title: 'ParseLab kan hier niet openen — ' + tekst }); } catch (e) {}
    try { await chrome.action.setBadgeText({ tabId, text: '!' }); } catch (e) {}
    try { await chrome.action.setBadgeBackgroundColor({ tabId, color: '#B3261E' }); } catch (e) {}
    console.info('ParseLab: ' + tekst);
}
async function wisMeldingOpIcoon(tabId) {
    try { await chrome.action.setBadgeText({ tabId, text: '' }); } catch (e) {}
    try { await chrome.action.setTitle({ tabId, title: 'ParseLab — klik om te openen' }); } catch (e) {}
}
// Staat het paneelscript al in dit tabblad, en staat het paneel open?
async function paneelStatus(tabId) {
    try {
        const r = await chrome.tabs.sendMessage(tabId, { type: 'wt-ping' });
        return { aanwezig: true, open: !!(r && r.open) };
    } catch (e) { return { aanwezig: false, open: false }; }
}

async function togglePanel(tab) {
    if (!tab || !tab.id) return;
    const reden = waaromNiet(tab.url || tab.pendingUrl || '');
    if (reden) { await meldOpIcoon(tab.id, reden); return; }
    await wisMeldingOpIcoon(tab.id);

    const st = await paneelStatus(tab.id);
    if (st.aanwezig) {
        // Het script draait hier al: gewoon omklappen, wat de bewaarde vlag ook zegt.
        const next = !st.open;
        try { await chrome.storage.local.set({ 'wt-active': next }); } catch (e) {}
        try { await chrome.tabs.sendMessage(tab.id, { type: 'wt-set', active: next }); } catch (e) {}
        return;
    }
    // Nog geen paneel in dit tabblad: eerst de vlag aan (het script leest die bij het starten),
    // daarna injecteren. activeTab geeft hiervoor toegang tot precies dit tabblad.
    try { await chrome.storage.local.set({ 'wt-active': true }); } catch (e) {}
    try {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['panel.css'] });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['panel.js'] });
    } catch (e) {
        const m = (e && e.message) || 'onbekende fout';
        console.warn('ParseLab kon niet laden:', m);
        await meldOpIcoon(tab.id, /cannot be scripted|Cannot access|blocked/i.test(m) ? 'deze pagina laat geen extensies toe' : m);
    }
}
chrome.action.onClicked.addListener(togglePanel);
if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(async (cmd) => {
        if (cmd !== 'toggle-panel') return;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) togglePanel(tab);
    });
}
// Bij een nieuwe pagina in hetzelfde tabblad is de melding niet meer waar.
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === 'loading') wisMeldingOpIcoon(tabId); });

// ---- PDF opslaan: Chrome's eigen print-engine (dezelfde als Ctrl+P → Opslaan als PDF) ----
function wacht(ms) { return new Promise(r => setTimeout(r, ms)); }
function dbg(target, method, params) {
    return new Promise((res, rej) => chrome.debugger.sendCommand(target, method, params || {}, r => {
        const e = chrome.runtime.lastError; if (e) rej(new Error(e.message)); else res(r);
    }));
}
function koppel(target) { return new Promise((res, rej) => chrome.debugger.attach(target, '1.3', () => { const e = chrome.runtime.lastError; if (e) rej(new Error(e.message)); else res(); })); }
function ontkoppel(target) { return new Promise(res => chrome.debugger.detach(target, () => { void chrome.runtime.lastError; res(); })); }
const PDF_OPTS = { printBackground: true, paperWidth: 8.27, paperHeight: 11.69, marginTop: 0.4, marginBottom: 0.4, marginLeft: 0.4, marginRight: 0.4, preferCSSPageSize: false };
const PRINT_BREEDTE = Math.round((8.27 - 0.8) * 96);   // bedrukbare breedte van A4 in CSS-pixels (± 717)
// Hoe breed wordt de pagina als hij op A4 wordt gezet? Is dat breder dan het papier, dan verkleinen
// we (net als "passend maken" bij Ctrl+P), zodat er rechts niets wegvalt.
async function pasSchaal(target) {
    try {
        await dbg(target, 'Emulation.setEmulatedMedia', { media: 'print' });
        await dbg(target, 'Emulation.setDeviceMetricsOverride', { width: PRINT_BREEDTE, height: 1100, deviceScaleFactor: 1, mobile: false });
        await wacht(400);
        const r = await dbg(target, 'Runtime.evaluate', { returnByValue: true, expression: `(() => {
            const d = document.documentElement, b = document.body;
            let w = Math.max(d.scrollWidth, b ? b.scrollWidth : 0);
            // brede tabellen/blokken die in een container met overflow verstopt zitten
            document.querySelectorAll('table, pre, [style*="width"]').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > w) w = r.right; });
            return Math.ceil(w);
        })()` });
        const w = (r && r.result && r.result.value) || PRINT_BREEDTE;
        return w > PRINT_BREEDTE + 4 ? Math.max(0.35, Math.floor(PRINT_BREEDTE / w * 100) / 100) : 1;
    } catch (e) { return 1; }
    finally {
        try { await dbg(target, 'Emulation.clearDeviceMetricsOverride'); } catch (e) {}
        try { await dbg(target, 'Emulation.setEmulatedMedia', { media: '' }); } catch (e) {}
    }
}
async function shotVanTab(tabId) {
    if (!tabId) return null;
    const target = { tabId };
    await koppel(target);
    try { const r = await dbg(target, 'Page.captureScreenshot', { format: 'png' }); return r && r.data ? 'data:image/png;base64,' + r.data : null; }
    finally { await ontkoppel(target); }
}
async function pdfVanTab(tabId, extra) {
    const target = { tabId };
    await koppel(target);
    try {
        const scale = await pasSchaal(target);
        // Eerste blad weglaten: alleen pagina 2 en verder. Heeft de PDF maar één blad, dan geeft
        // Chrome een fout → dan toch het hele (ene) blad.
        if (extra && extra.zonderEerste) {
            try { const r2 = await dbg(target, 'Page.printToPDF', Object.assign({}, PDF_OPTS, { scale, pageRanges: '2-' })); if (r2 && r2.data) return { data: r2.data, scale, zonderEerste: true }; }
            catch (e) {}
        }
        const r = await dbg(target, 'Page.printToPDF', Object.assign({}, PDF_OPTS, { scale }));
        if (!r || !r.data) throw new Error('lege PDF');
        return { data: r.data, scale, eenBlad: !!(extra && extra.zonderEerste) };
    } finally { await ontkoppel(target); }
}
// Alleen het kader: open het adres van het kader in een verborgen tabblad (zelfde inlog),
// print dat volledig en sluit het weer.
// Open een adres op de achtergrond: eerst als tabblad naast het huidige; verdwijnt dat meteen
// (sommige browserinstellingen staan dat niet toe), dan in een apart venster op de achtergrond.
async function openVerborgen(url, naastTab) {
    let index; try { if (naastTab) index = (await chrome.tabs.get(naastTab)).index + 1; } catch (e) {}
    try {
        const tab = await chrome.tabs.create({ url, active: false, index });
        await wacht(400);
        await chrome.tabs.get(tab.id);   // bestaat hij nog?
        return { tabId: tab.id, sluit: () => chrome.tabs.remove(tab.id).catch(() => {}) };
    } catch (e) {
        const w = await chrome.windows.create({ url, focused: false, type: 'normal', width: 1200, height: 900 });
        const tabId = w.tabs && w.tabs[0] && w.tabs[0].id;
        return { tabId, sluit: () => chrome.windows.remove(w.id).catch(() => {}) };
    }
}
async function wachtOpLaden(tabId) {
    await new Promise(res => {
        let klaar = false; const af = () => { if (klaar) return; klaar = true; chrome.tabs.onUpdated.removeListener(h); res(); };
        const h = (id, info) => { if (id === tabId && info.status === 'complete') af(); };
        chrome.tabs.onUpdated.addListener(h);
        chrome.tabs.get(tabId).then(t => { if (t.status === 'complete') af(); }).catch(af);
        setTimeout(af, 25000);
    });
}
// ---- Andere pagina's uitlezen (zonder je eigen tabblad te verlaten) ----
// snel: de HTML ophalen met je eigen inlog (cookies), zonder JavaScript uit te voeren.
// volledig: in een verborgen tabblad openen, wachten tot hij klaar is en de getekende pagina teruggeven.
// Het uitlezen zelf gebeurt in het paneel, met dezelfde regels als op de pagina.
async function externOphalen(msg, naastTab) {
    let url;
    try { url = new URL(String(msg.url || '')); } catch (e) { return { ok: false, err: 'geen geldig adres' }; }
    if (!/^https?:$/.test(url.protocol)) return { ok: false, err: 'alleen http- en https-adressen' };
    const max = 6000000;
    if (msg.modus !== 'volledig') {
        try {
            const r = await fetch(url.href, { credentials: 'include', redirect: 'follow' });
            const ct = r.headers.get('content-type') || '';
            if (!/html|xml|text\/plain/i.test(ct)) return { ok: false, status: r.status, err: 'geen webpagina (' + (ct.split(';')[0] || 'onbekend') + ')' };
            const html = await r.text();
            return { ok: r.ok, status: r.status, err: r.ok ? '' : 'fout ' + r.status, html: html.slice(0, max), url: r.url || url.href, modus: 'snel' };
        } catch (e) { if (msg.modus === 'snel') return { ok: false, err: (e && e.message) || 'niet bereikbaar' }; }
    }
    let v;
    try { v = await openVerborgen(url.href, naastTab); }
    catch (e) { return { ok: false, err: 'tabblad openen mislukt' }; }
    try {
        await wachtOpLaden(v.tabId);
        await wacht(Math.min(15000, Math.max(500, +msg.wachtMs || 1500)));   // scripts laten afmaken
        const [res] = await chrome.scripting.executeScript({ target: { tabId: v.tabId }, func: () => ({ html: document.documentElement.outerHTML, url: location.href, titel: document.title }) });
        const out = res && res.result;
        if (!out) return { ok: false, err: 'pagina niet leesbaar' };
        return { ok: true, status: 200, html: String(out.html || '').slice(0, max), url: out.url, modus: 'volledig' };
    } catch (e) { return { ok: false, err: (e && e.message) || 'pagina niet leesbaar' }; }
    finally { await v.sluit(); }
}
// Alleen het kader: open het adres van het kader op de achtergrond (zelfde inlog), print dat
// volledig en sluit het weer.
async function pdfVanUrl(url, naastTab, extra) {
    const v = await openVerborgen(url, naastTab);
    try {
        await wachtOpLaden(v.tabId);
        await wacht(1500);   // scripts in het kader even laten afmaken
        // Doorgestuurd naar een ander domein (bv. een inlogpagina)? Dan is dit niet de inhoud van het kader.
        const target = { tabId: v.tabId };
        await koppel(target);
        let nu = '';
        try { const r = await dbg(target, 'Runtime.evaluate', { expression: 'location.href', returnByValue: true }); nu = (r && r.result && r.result.value) || ''; }
        finally { await ontkoppel(target); }
        try { if (new URL(nu).origin !== new URL(url).origin) throw new Error('het kader opende niet los (doorgestuurd naar ' + new URL(nu).host + ')'); }
        catch (e) { if (/opende niet/.test(e.message)) throw e; }
        return await pdfVanTab(v.tabId, extra);
    } finally { await v.sluit(); }
}
// Het adres waar het kader NU op staat (ook als je erin hebt doorgeklikt): vraag Chrome de
// kaderboom van het tabblad en kies het kader van hetzelfde domein als de hint.
async function actueelKaderAdres(tabId, hint) {
    const target = { tabId };
    try {
        await koppel(target);
        const alle = [];
        // Kaders van hetzelfde domein staan in de kaderboom van het tabblad…
        const t = await dbg(target, 'Page.getFrameTree');
        (function loop(n) { (n.childFrames || []).forEach(c => { if (c.frame && /^https?:/.test(c.frame.url || '')) alle.push(c.frame.url + (c.frame.urlFragment || '')); loop(c); }); })(t.frameTree);
        // …kaders van een ander domein (eigen proces) melden zich via auto-attach, met hun actuele adres.
        const luister = (src, method, params) => {
            if (src.tabId === tabId && method === 'Target.attachedToTarget' && params.targetInfo && params.targetInfo.type === 'iframe' && /^https?:/.test(params.targetInfo.url || '')) alle.push(params.targetInfo.url);
        };
        chrome.debugger.onEvent.addListener(luister);
        try { await dbg(target, 'Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }); await wacht(400); }
        catch (e) {}
        finally { chrome.debugger.onEvent.removeListener(luister); try { await dbg(target, 'Target.setAutoAttach', { autoAttach: false, waitForDebuggerOnStart: false, flatten: true }); } catch (e) {} }
        let h; try { h = new URL(hint); } catch (e) { return hint; }
        return alle.find(u => u === hint) || alle.find(u => { try { const x = new URL(u); return x.origin === h.origin && x.pathname === h.pathname; } catch (e) { return false; } })
            || alle.find(u => { try { return new URL(u).origin === h.origin; } catch (e) { return false; } }) || hint;
    } catch (e) { return hint; }
    finally { await ontkoppel(target); }
}
// Eén PDF maken en opslaan. Geeft {ok, err, scale, frame, terugval} terug.
async function printBericht(msg, tabId) {
    try {
        let r, terugval = ''; const ex = { zonderEerste: !!msg.zonderEerste };
        if (msg.frameUrl) {
            try { r = await pdfVanUrl(await actueelKaderAdres(tabId, msg.frameUrl), tabId, ex); }
            catch (e) { terugval = (e && e.message) || 'kader niet los te openen'; r = await pdfVanTab(tabId, ex); }
        } else r = await pdfVanTab(tabId, ex);
        const naam = msg.fileName ? safeName(msg.fileName) + '.pdf' : safeName(msg.name || 'pagina') + '-' + stamp() + '.pdf';
        if (msg.zipRun) zipBewaar(msg.zipRun, (msg.folder || 'ParseLab') + '/' + naam, 'data:application/pdf;base64,' + r.data);
        return await new Promise(res => chrome.downloads.download({ url: 'data:application/pdf;base64,' + r.data, filename: inFolder(msg.folder, naam), saveAs: false, conflictAction: 'uniquify' },
            id => res({ ok: !chrome.runtime.lastError, err: chrome.runtime.lastError && chrome.runtime.lastError.message, scale: r.scale, zonderEerste: !!r.zonderEerste, eenBlad: !!r.eenBlad, frame: !!msg.frameUrl && !terugval, terugval, downloadId: id })));
    } catch (e) { return { ok: false, err: e && e.message }; }
}
globalThis.__pl = { pdfVanTab, pdfVanUrl, printBericht, actueelKaderAdres };

// ---- Kaders (iframes) ----
async function kadersVan(tabId) {
    try { const fs = await chrome.webNavigation.getAllFrames({ tabId }); return (fs || []).filter(f => f.frameId !== 0 && /^https?:/i.test(f.url || '')); }
    catch (e) { return []; }
}
function naarKader(tabId, frameId, m, ms) {
    return new Promise(res => {
        let klaar = false; const af = v => { if (!klaar) { klaar = true; res(v); } };
        setTimeout(() => af(null), ms || 1500);
        try { chrome.tabs.sendMessage(tabId, m, { frameId }).then(af, () => af(null)); } catch (e) { af(null); }
    });
}
// Draait de helper al in dit kader? Zo niet, laad hem (panel.js start in een kader als helper).
async function zorgVoorHelper(tabId, frameId) {
    const p = await naarKader(tabId, frameId, { type: 'pl-agent', cmd: 'ping' }, 500);
    if (p && p.ok) return true;
    try { await chrome.scripting.executeScript({ target: { tabId, frameIds: [frameId] }, files: ['panel.js'] }); }
    catch (e) { return false; }
    const q = await naarKader(tabId, frameId, { type: 'pl-agent', cmd: 'ping' }, 1500);
    return !!(q && q.ok);
}
// Welk kader hoort bij een stap? Zelfde adres → zelfde domein → het enige kader. Wacht even als
// het kader nog laadt (bv. net na een klik).
async function zoekKader(tabId, ref) {
    const t0 = Date.now();
    while (Date.now() - t0 < 10000) {
        const fs = await kadersVan(tabId);
        const norm = u => { try { const x = new URL(u); return { o: x.origin, p: x.origin + x.pathname }; } catch (e) { return { o: '', p: '' }; } };
        const doel = ref && ref.url ? norm(ref.url) : null;
        let f = null;
        if (doel) f = fs.find(x => norm(x.url).p === doel.p) || fs.find(x => norm(x.url).o === doel.o);
        if (!f && (!doel || fs.length === 1)) f = fs[0];
        if (f) return f.frameId;
        await wacht(400);
    }
    return null;
}

// ---- Opnemen: een kader dat naar een nieuwe pagina gaat, krijgt de helper opnieuw ----
const OPNAME_TABS = new Set();
if (chrome.webNavigation && chrome.webNavigation.onCompleted) chrome.webNavigation.onCompleted.addListener(async d => {
    if (d.frameId === 0 || !OPNAME_TABS.has(d.tabId) || !/^https?:/i.test(d.url || '')) return;
    if (await zorgVoorHelper(d.tabId, d.frameId)) naarKader(d.tabId, d.frameId, { type: 'pl-agent', cmd: 'recStart' });
});
chrome.tabs.onRemoved.addListener(id => OPNAME_TABS.delete(id));

// ---- Schermafbeeldingen: wachtrij (Chrome staat ±2 per seconde toe) + IndexedDB ----
let shotKlaar = 0, shotRij = Promise.resolve();
function db() {
    return new Promise((res, rej) => {
        const r = indexedDB.open('parselab', 1);
        r.onupgradeneeded = () => { const s = r.result.createObjectStore('shots', { keyPath: 'id' }); s.createIndex('run', 'run'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
}
async function bewaarShot(rec) {
    const d = await db();
    await new Promise((res, rej) => { const tx = d.transaction('shots', 'readwrite'); tx.objectStore('shots').put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    // Opruimen: alleen de schermafbeeldingen van de laatste 10 rondes bewaren.
    const { 'pl-shot-runs': runs = [] } = await chrome.storage.local.get('pl-shot-runs');
    if (runs[0] !== rec.run) {
        // Elke ronde maar één keer in de lijst (logboek- en zip-bestanden wisselen elkaar af).
        const lijst = runs.filter(r => r !== rec.run); lijst.unshift(rec.run); const weg = lijst.splice(20);
        await chrome.storage.local.set({ 'pl-shot-runs': lijst });
        for (const run of weg) await new Promise(res => { const tx = d.transaction('shots', 'readwrite'); const idx = tx.objectStore('shots').index('run'); const c = idx.openCursor(IDBKeyRange.only(run)); c.onsuccess = () => { const k = c.result; if (k) { k.delete(); k.continue(); } }; tx.oncomplete = res; tx.onerror = res; });
    }
}
function maakShot(winId, run, naam) {
    const taak = shotRij.then(async () => {
        const w = shotKlaar + 600 - Date.now(); if (w > 0) await wacht(w);
        const data = await new Promise((res, rej) => chrome.tabs.captureVisibleTab(winId, { format: 'jpeg', quality: 60 }, u => { const e = chrome.runtime.lastError; if (e || !u) rej(new Error(e ? e.message : 'geen afbeelding')); else res(u); }));
        shotKlaar = Date.now();
        const id = run + '_' + naam;
        await bewaarShot({ id, run, ts: Date.now(), data });
        return { ok: true, id };
    });
    shotRij = taak.catch(() => {});
    return taak;
}
// Alle PDF's en screenshots van een ronde ook bewaren, zodat je ze aan het eind als één zip kunt downloaden.
let zipTel = 0;
function zipBewaar(run, pad, data) { bewaarShot({ id: 'zip_' + run + '_' + Date.now() + '_' + (zipTel++), run: 'zip_' + run, ts: Date.now(), pad, data }).catch(() => {}); }
async function haalZip(run) {
    const d = await db();
    return new Promise(res => { const uit = []; const tx = d.transaction('shots'); const c = tx.objectStore('shots').index('run').openCursor(IDBKeyRange.only('zip_' + run)); c.onsuccess = () => { const k = c.result; if (k) { uit.push({ pad: k.value.pad, data: k.value.data, ts: k.value.ts }); k.continue(); } }; tx.oncomplete = () => res(uit.sort((a, b) => a.ts - b.ts)); tx.onerror = () => res(uit); });
}
async function haalShots(ids) {
    const d = await db(); const uit = {};
    await Promise.all(ids.slice(0, 500).map(id => new Promise(res => { const r = d.transaction('shots').objectStore('shots').get(id); r.onsuccess = () => { if (r.result) uit[id] = r.result.data; res(); }; r.onerror = res; })));
    return uit;
}

// ---- Claude: zelfherstel en chat → stappen (Messages API, gestructureerde JSON-uitvoer) ----
// Rechtstreeks via fetch: de extensie heeft geen bouwstap om de SDK mee te bundelen.
const FALLBACK_MODELLEN = ['claude-opus-5-5', 'claude-sonnet-5-5'];
async function claude(system, inhoud, schema, effort, maxTokens) {
    const { 'pl-ai-key': key, 'pl-ai-model': model = 'claude-opus-5-5' } = await chrome.storage.local.get(['pl-ai-key', 'pl-ai-model']);
    if (!key) throw new Error('geen Claude API-sleutel ingesteld (✨ AI → Claude koppelen)');
    const body = { model, max_tokens: maxTokens || 8000, system, messages: [{ role: 'user', content: inhoud }], output_config: { effort: effort || 'low', format: { type: 'json_schema', schema } } };
    const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    if (FALLBACK_MODELLEN.includes(model)) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
    if (j.stop_reason === 'refusal') throw new Error('Claude weigerde dit verzoek');
    if (j.stop_reason === 'max_tokens') throw new Error('antwoord te lang (afgebroken)');
    const tekst = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(tekst);
}
const SCHEMA_HERSTEL = { type: 'object', properties: { candidateId: { type: 'integer' }, confidence: { type: 'number' }, reden: { type: 'string' } }, required: ['candidateId', 'confidence', 'reden'], additionalProperties: false };
const SCHEMA_CHAT = { type: 'object', properties: { uitleg: { type: 'string' }, stappen: { type: 'array', items: { type: 'object', properties: {
    actie: { type: 'string', enum: ['klik', 'dubbelklik', 'invullen', 'uitlezen', 'hele_pagina', 'wachten', 'pdf', 'terug'] }, element: { type: 'integer' }, kolom: { type: 'string' }, waarde: { type: 'string' },
    bron: { type: 'string', enum: ['lijst', 'vast', 'oplopend', 'eerder', 'logica', ''] }, label: { type: 'string' } },
    required: ['actie', 'element', 'kolom', 'waarde', 'bron', 'label'], additionalProperties: false } } }, required: ['uitleg', 'stappen'], additionalProperties: false };
async function vraagClaude(msg) {
    if (msg.taak === 'test') return claude('Antwoord met ok: true.', 'test', { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false }, 'low', 200);
    if (msg.taak === 'herstel') return claude(
        'Je helpt een browser-automatisering (ParseLab) een element terug te vinden dat niet meer op de oude plek staat. Je krijgt de stap, de oude vingerafdruk (rol, naam, tekst, label, plaats) en een lijst kandidaat-elementen met een id. Kies het element dat dezelfde functie heeft. Geef confidence tussen 0 en 1 en een korte reden in het Nederlands. Past geen enkel element: candidateId -1 en confidence 0.',
        JSON.stringify({ stap: msg.stap, kandidaten: msg.kandidaten }), SCHEMA_HERSTEL, 'low', 4000);
    if (msg.taak === 'chat') return claude(
        'Je zet een opdracht in gewone taal om naar stappen voor ParseLab, een browser-automatisering die in de browser van de gebruiker werkt. Je krijgt ook de bestaande flow (stappen die de gebruiker heeft opgenomen, handmatig gemaakt of eerder via AI), de geüploade lijst (kolommen, aantal regels) en de waarden die al eerder worden uitgelezen of ingevuld. Nieuwe stappen komen achter de bestaande flow; herhaal bestaande stappen niet en gebruik dezelfde kolomnamen. Acties: klik, dubbelklik (op een element), invullen (een invoerveld; kolom = korte kolomnaam zoals het label; bron = lijst (elke ronde de volgende regel uit de lijst, waarde leeg), vast (waarde = de standaardwaarde), oplopend (waarde = beginwaarde zoals 1 of K-1001), eerder (waarde = naam van een eerder uitgelezen/ingevulde waarde) of logica (waarde = formule met {{kolom}}, {{ronde}} of {{vandaag}})), uitlezen (tekst van een element; kolom = naam van de kolom), hele_pagina (alles op de pagina uitlezen), wachten (tot de pagina klaar is), pdf (pagina als PDF opslaan), terug (vorige pagina). Gebruik alleen element-id\'s uit de lijst; voor hele_pagina/wachten/pdf/terug element = -1. Bij andere acties dan invullen is bron leeg. Vul ongebruikte velden met een lege tekst. label = korte Nederlandse omschrijving van de stap. uitleg = één of twee zinnen voor de gebruiker over wat je voorstelt of wat ontbreekt.',
        JSON.stringify({ opdracht: msg.opdracht, kandidaten: msg.kandidaten, bestaandeFlow: msg.stappen, lijst: msg.lijst || null, eerdereWaarden: msg.waarden || [] }), SCHEMA_CHAT, 'medium', 8000);
    throw new Error('onbekende AI-taak');
}

// Na installatie één keer een korte uitleg tonen.
chrome.runtime.onInstalled.addListener((d) => {
    if (d && d.reason === 'install') {
        try { chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') }); } catch (e) {}
        chrome.storage.local.get(['pl-folder', 'pl-cookies'], r => {
            const init = {};
            if (!r || r['pl-folder'] == null) init['pl-folder'] = 'ParseLab';
            if (!r || r['pl-cookies'] == null) init['pl-cookies'] = true;
            if (Object.keys(init).length) chrome.storage.local.set(init);
        });
    }
});

// ============================================================================
// Koppeling voor een AI-agent (alleen voor IT-beheer). Verbindt met een lokale server op
// ws://127.0.0.1:<poort> en voert opdrachten uit in het actieve tabblad. Beveiligd met een
// gedeeld geheim: de extensie stuurt als eerste bericht {type:'hello', token} en accepteert
// pas opdrachten na {type:'hello_ok'}. Verbindt alleen zolang het paneel open is (wt-active)
// én de koppeling aan staat (wt-mcp). Elke fill_records wordt gelogd in het logboek.
const MCP_PORT = 8765;
let mcpWs = null, mcpTimer = null, mcpAuthed = false;

function setMcpStatus(s) { try { chrome.storage.local.set({ 'wt-mcp-status': s }); } catch (e) {} }
async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab || null;
}
function sendToTab(tabId, msg) {
    return new Promise((res) => {
        try { chrome.tabs.sendMessage(tabId, msg, (r) => res(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : r)); }
        catch (e) { res({ ok: false, error: String(e) }); }
    });
}
function hostOf(url) { try { return new URL(url).hostname; } catch (e) { return '?'; } }
async function handleMcp(cmd, args) {
    args = args || {};
    const tab = await activeTab();
    const tabId = tab && tab.id;
    if (!tabId) return { ok: false, error: 'geen actief tabblad' };
    if (cmd === 'read_fields') return await sendToTab(tabId, { type: 'wt-api-readfields', scope: args.form });
    if (cmd === 'fill_records') {
        const start = Date.now();
        const r = await sendToTab(tabId, { type: 'wt-api-fill', payload: args });
        const recs = Array.isArray(args.records) ? args.records.length : 0;
        const fouten = r && r.result && Array.isArray(r.result.results) ? r.result.results.filter(x => x.missed && x.missed.length).length : (r && r.ok === false ? recs : 0);
        await appendLog({ host: hostOf(tab.url || ''), start, einde: Date.now(), regels: recs, fouten, bron: 'agent' });
        return r;
    }
    if (cmd === 'ping') return { ok: true, pong: true };
    return { ok: false, error: 'onbekend commando: ' + cmd };
}
function mcpClose() { try { mcpWs && mcpWs.close(); } catch (e) {} mcpWs = null; mcpAuthed = false; clearTimeout(mcpTimer); setMcpStatus('off'); }
function mcpConnect(token) {
    if (mcpWs) return;
    mcpAuthed = false;
    setMcpStatus('connecting');
    try { mcpWs = new WebSocket('ws://127.0.0.1:' + MCP_PORT); } catch (e) { mcpWs = null; return scheduleReconnect(); }
    const ws = mcpWs;
    ws.onopen = () => { try { ws.send(JSON.stringify({ type: 'hello', token: token || '', from: 'parselab-extension' })); } catch (e) {} };
    ws.onmessage = async (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!m) return;
        if (m.type === 'hello_ok') { mcpAuthed = true; setMcpStatus('connected'); return; }
        if (m.type === 'hello_fail') { setMcpStatus('rejected'); try { ws.close(); } catch (e) {} return; }
        if (!mcpAuthed || m.id == null) return;   // geen opdrachten zonder geldige handshake
        const result = await handleMcp(m.cmd, m.args);
        try { ws.send(JSON.stringify({ id: m.id, result })); } catch (e) {}
    };
    ws.onclose = () => { if (mcpWs === ws) { mcpWs = null; mcpAuthed = false; } scheduleReconnect(); };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
}
function scheduleReconnect() {
    clearTimeout(mcpTimer);
    mcpTimer = setTimeout(() => mcpWanted((on, token) => { if (on) mcpConnect(token); else setMcpStatus('off'); }), 4000);
}
function mcpWanted(cb) {
    try { chrome.storage.local.get(['wt-mcp', 'wt-active', 'wt-mcp-token', 'wt-mcp-status'], r => cb(!!(r && r['wt-mcp'] && r['wt-active']), r && r['wt-mcp-token'], r && r['wt-mcp-status'])); }
    catch (e) { cb(false); }
}
function mcpSync() {
    mcpWanted((on, token, status) => {
        if (on) { if (!mcpWs) mcpConnect(token); }
        else if (mcpWs || status !== 'off') mcpClose();
    });
}
chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch['wt-mcp'] || ch['wt-active']) mcpSync();
    if (ch['wt-mcp-token'] && mcpWs) { mcpClose(); mcpSync(); }   // nieuwe code → opnieuw verbinden
});
mcpSync();
