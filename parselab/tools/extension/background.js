function stamp() { return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); }
function safeName(n) { return String(n || 'bestand').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 60); }
function inFolder(folder, name) { const f = String(folder || '').replace(/[\\:*?"<>|]/g, '').replace(/^\/+|\/+$/g, '').trim(); return (f ? f + '/' : '') + name; }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Export (JSON/CSV): direct naar de gekozen map, zonder "opslaan als"-venster.
    if (msg && msg.type === 'wt-download') {
        const url = msg.dataB64 != null
            ? 'data:' + (msg.mime || 'application/octet-stream') + ';base64,' + msg.dataB64
            : 'data:' + (msg.mime || 'application/octet-stream') + ';charset=utf-8,' + encodeURIComponent(msg.data || '');
        chrome.downloads.download({ url, filename: inFolder(msg.folder, msg.filename || 'webtool-data.txt'), saveAs: false, conflictAction: 'uniquify' },
            () => sendResponse({ ok: !chrome.runtime.lastError }));
        return true;
    }
    // Screenshot: leg de zichtbare pagina vast en bewaar als PNG in de map.
    if (msg && msg.type === 'wt-shot') {
        const winId = sender.tab ? sender.tab.windowId : undefined;
        chrome.tabs.captureVisibleTab(winId, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) { sendResponse({ ok: false }); return; }
            chrome.downloads.download({ url: dataUrl, filename: inFolder(msg.folder, safeName(msg.name || 'screenshot') + '-' + stamp() + '.png'), saveAs: false, conflictAction: 'uniquify' },
                () => sendResponse({ ok: !chrome.runtime.lastError }));
        });
        return true;
    }
    // Bestanden/afbeeldingen downloaden naar de map.
    if (msg && msg.type === 'wt-dlfiles') {
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
    // Print (Ctrl+P): druk de pagina automatisch af naar PDF en bewaar in de map,
    // via Chrome's eigen print-engine (Page.printToPDF) — geen dialoog nodig.
    if (msg && msg.type === 'wt-print') {
        const tabId = sender.tab && sender.tab.id;
        if (!tabId) { sendResponse({ ok: false }); return true; }
        const target = { tabId };
        chrome.debugger.attach(target, '1.3', () => {
            if (chrome.runtime.lastError) { sendResponse({ ok: false, err: chrome.runtime.lastError.message }); return; }
            chrome.debugger.sendCommand(target, 'Page.printToPDF', { printBackground: true }, (res) => {
                const data = res && res.data;
                chrome.debugger.detach(target, () => {});
                if (!data) { sendResponse({ ok: false }); return; }
                chrome.downloads.download({ url: 'data:application/pdf;base64,' + data, filename: inFolder(msg.folder, safeName(msg.name || 'print') + '-' + stamp() + '.pdf'), saveAs: false, conflictAction: 'uniquify' },
                    () => sendResponse({ ok: !chrome.runtime.lastError }));
            });
        });
        return true;
    }
});

// Bij klik op het extensie-icoon: zet het paneel aan/uit. De aan-status wordt in
// chrome.storage bewaard, zodat het content-script het paneel op ELKE (nieuwe)
// pagina automatisch toont zolang het aan staat — zo blijft je flow zichtbaar en
// volgbaar als je navigeert.
async function togglePanel(tab) {
    if (!tab || !tab.id) return;
    if (/^(chrome|edge|about|chrome-extension|https:\/\/chrome\.google\.com\/webstore)/i.test(tab.url || '')) return;
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
            } catch (e2) { console.warn('WebTool Scraper kon niet laden:', e2 && e2.message); }
        }
    }
}
chrome.action.onClicked.addListener(togglePanel);
// Sneltoets (standaard Alt+Shift+S) → paneel aan/uit op het actieve tabblad.
if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(async (cmd) => {
        if (cmd !== 'toggle-panel') return;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) togglePanel(tab);
    });
}

// ============================================================================
// MCP-bridge (optioneel). Verbindt met een lokale MCP-server op ws://127.0.0.1:<poort>
// en voert opdrachten uit in het ACTIEVE tabblad (jouw ingelogde sessie). Zo kan een
// agent zeggen: "haal de velden op" → "vul deze 30 records in". Er gaat niets het
// netwerk op; alleen localhost. Standaard UIT — zet aan met chrome.storage 'wt-mcp'.
const MCP_PORT = 8765;
let mcpWs = null, mcpTimer = null;

async function activeTabId() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab && tab.id;
}
function sendToTab(tabId, msg) {
    return new Promise((res) => {
        try { chrome.tabs.sendMessage(tabId, msg, (r) => res(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : r)); }
        catch (e) { res({ ok: false, error: String(e) }); }
    });
}
async function handleMcp(cmd, args) {
    args = args || {};
    const tabId = await activeTabId();
    if (!tabId) return { ok: false, error: 'geen actief tabblad' };
    if (cmd === 'read_fields') return await sendToTab(tabId, { type: 'wt-api-readfields', scope: args.form });
    if (cmd === 'fill_records') return await sendToTab(tabId, { type: 'wt-api-fill', payload: args });
    if (cmd === 'ping') return { ok: true, pong: true };
    return { ok: false, error: 'onbekend commando: ' + cmd };
}
function mcpConnect() {
    try { mcpWs = new WebSocket('ws://127.0.0.1:' + MCP_PORT); } catch (e) { return scheduleReconnect(); }
    mcpWs.onopen = () => { try { mcpWs.send(JSON.stringify({ type: 'hello', from: 'webtool-extension' })); } catch (e) {} };
    mcpWs.onmessage = async (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!m || m.id == null) return;
        const result = await handleMcp(m.cmd, m.args);
        try { mcpWs.send(JSON.stringify({ id: m.id, result })); } catch (e) {}
    };
    mcpWs.onclose = () => { mcpWs = null; scheduleReconnect(); };
    mcpWs.onerror = () => { try { mcpWs.close(); } catch (e) {} };
}
function scheduleReconnect() { clearTimeout(mcpTimer); mcpTimer = setTimeout(() => { mcpEnabled(on => { if (on) mcpConnect(); }); }, 4000); }
function mcpEnabled(cb) { try { chrome.storage.local.get('wt-mcp', r => cb(!!(r && r['wt-mcp']))); } catch (e) { cb(false); } }
// Aan/uit via storage-vlag 'wt-mcp'.
chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && ch['wt-mcp']) {
        if (ch['wt-mcp'].newValue) { if (!mcpWs) mcpConnect(); }
        else { try { mcpWs && mcpWs.close(); } catch (e) {} mcpWs = null; clearTimeout(mcpTimer); }
    }
});
mcpEnabled(on => { if (on) mcpConnect(); });
