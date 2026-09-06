/*
 * ParseLab — achtergrondscript (service worker).
 * Rechten: alleen activeTab + scripting + storage + downloads. Toegang tot een site wordt
 * pas gevraagd als de gebruiker daar het paneel opent (activeTab) of een taak bewaart /
 * een ronde start (dan precies die site, via optional_host_permissions). "debugger" is
 * optioneel en wordt pas gevraagd bij de eerste PDF-bewijskopie.
 */
function stamp() { return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); }
function safeName(n) { return String(n || 'bestand').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 60); }
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
        try { has = await chrome.permissions.request({ origins: [pattern] }); }
        catch (e) { return { ok: false, err: e && e.message }; }
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg) return;
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
        chrome.tabs.captureVisibleTab(winId, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) { sendResponse({ ok: false, err: chrome.runtime.lastError && chrome.runtime.lastError.message }); return; }
            chrome.downloads.download({ url: dataUrl, filename: inFolder(msg.folder, safeName(msg.name || 'bewijskopie') + '-' + stamp() + '.png'), saveAs: false, conflictAction: 'uniquify' },
                () => sendResponse({ ok: !chrome.runtime.lastError }));
        });
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
        const target = { tabId };
        chrome.permissions.contains({ permissions: ['debugger'] }, (has) => {
            if (!has) { sendResponse({ ok: false, err: 'no-permission' }); return; }
            chrome.debugger.attach(target, '1.3', () => {
                if (chrome.runtime.lastError) { sendResponse({ ok: false, err: chrome.runtime.lastError.message }); return; }
                chrome.debugger.sendCommand(target, 'Page.printToPDF', { printBackground: true }, (res) => {
                    const data = res && res.data;
                    chrome.debugger.detach(target, () => {});
                    if (!data) { sendResponse({ ok: false }); return; }
                    chrome.downloads.download({ url: 'data:application/pdf;base64,' + data, filename: inFolder(msg.folder, safeName(msg.name || 'bewijskopie') + '-' + stamp() + '.pdf'), saveAs: false, conflictAction: 'uniquify' },
                        () => sendResponse({ ok: !chrome.runtime.lastError }));
                });
            });
        });
        return true;
    }
    // Optionele permissie vragen (debugger) — vanuit een klik in het paneel.
    if (msg.type === 'wt-perm') {
        const perms = { permissions: [msg.perm || 'debugger'] };
        chrome.permissions.contains(perms, (has) => {
            if (has) { sendResponse({ ok: true, granted: true }); return; }
            try { chrome.permissions.request(perms, (g) => sendResponse({ ok: true, granted: !!g, err: chrome.runtime.lastError && chrome.runtime.lastError.message })); }
            catch (e) { sendResponse({ ok: false, granted: false, err: e && e.message }); }
        });
        return true;
    }
    if (msg.type === 'wt-perm-has') {
        chrome.permissions.contains({ permissions: [msg.perm || 'debugger'] }, (has) => sendResponse({ ok: true, granted: !!has }));
        return true;
    }
    // Sitetoegang: vragen/registreren, vrijgeven, status.
    if (msg.type === 'wt-site-grant') { grantSite(msg.origin).then(sendResponse); return true; }
    if (msg.type === 'wt-site-release') { releaseSite(msg.origin).then(sendResponse); return true; }
    if (msg.type === 'wt-site-has') { hasSite(msg.origin).then(sendResponse); return true; }
    // Logboek-regel toevoegen.
    if (msg.type === 'wt-log') { appendLog(msg.entry || {}).then(() => sendResponse({ ok: true })); return true; }
});

// Klik op het icoon (of de sneltoets): paneel aan/uit op het actieve tabblad. activeTab geeft
// op dat moment toegang tot precies dat tabblad; het paneel wordt dan geïnjecteerd.
async function togglePanel(tab) {
    if (!tab || !tab.id) return;
    if (/^(chrome|edge|about|chrome-extension|devtools|https:\/\/chrome\.google\.com\/webstore|https:\/\/chromewebstore)/i.test(tab.url || '')) return;
    const cur = await chrome.storage.local.get('wt-active');
    const next = !(cur && cur['wt-active']);
    await chrome.storage.local.set({ 'wt-active': next });
    try {
        await chrome.tabs.sendMessage(tab.id, { type: 'wt-set', active: next });
    } catch (e) {
        if (next) {
            try {
                await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['panel.css'] });
                await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['panel.js'] });
            } catch (e2) { console.warn('ParseLab kon niet laden:', e2 && e2.message); }
        }
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
