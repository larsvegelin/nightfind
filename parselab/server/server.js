#!/usr/bin/env node
/*
 * ParseLab server — serveert het dashboard én de serverkant van "Website uitlezen" (ParseScraper zonder extensie).
 *
 *   node server/server.js                 → http://localhost:8080  (dashboard + API)
 *   PARSELAB_PROXIES="http://user:pass@host:port,http://…"   roterende proxies (of server/proxies.txt, één per regel)
 *   PARSELAB_API_TOKEN=geheim              optioneel: API alleen met header x-parselab-token
 *   PARSELAB_PORT=8080
 *
 * Wat de server doet:
 *   POST /api/scrape/snapshot   { url, proxy? }                 → opgeschoonde HTML van de gerenderde pagina + schermafbeelding
 *   POST /api/scrape/run        { url, rule, pages?, proxy? }   → regels volgens de aangewezen regel, over meerdere pagina's
 *   GET  /api/scrape/tasks      · POST /api/scrape/tasks · PATCH/DELETE /api/scrape/tasks/:id   (bewaarde taken met planning)
 *   POST /api/scrape/tasks/:id/run                               → taak nu uitvoeren
 *   GET  /api/scrape/runs/:id.xlsx | .csv                        → bestand van een uitvoering
 *   GET  /api/scrape/status                                      → proxies, wachtrij, planning
 *
 * Grenzen die bewust vaststaan (docs/parsescraper.md, "Wat het veiliger maakt"):
 *   - alleen http(s), geen privé-adressen (SSRF), robots.txt wordt gerespecteerd, minimaal 2 s tussen verzoeken per host,
 *     maximaal 2 pagina's tegelijk, maximaal 25 pagina's per ronde, herkenbare user-agent.
 *   - geen omzeiling van captcha's of botbescherming; sites achter een login blijven werk voor de extensie.
 */
"use strict";
const http = require("http"), https = require("https"), fs = require("fs"), path = require("path"), url = require("url"), zlib = require("zlib"), dns = require("dns").promises, crypto = require("crypto");

function loadPlaywright() {
  const candidates = ["playwright", "/opt/node22/lib/node_modules/playwright", "/usr/lib/node_modules/playwright", "/usr/local/lib/node_modules/playwright"];
  for (const c of candidates) { try { return require(c); } catch (e) {} }
  throw new Error("Playwright niet gevonden. Installeer met: cd server && npm install");
}

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(__dirname, "data");
const PORT = Number(process.env.PARSELAB_PORT || 8080);
const TOKEN = process.env.PARSELAB_API_TOKEN || "";
const ALLOW_PRIVATE = process.env.PARSELAB_ALLOW_PRIVATE === "1"; // alleen voor lokaal testen
const UA = "ParseLab/1.0 (+https://parselab.nl/uitlezen; respecteert robots.txt)";
const LIMITS = { pagesPerRun: 25, rowsPerRun: 5000, concurrent: 2, perHostMs: 2000, navTimeoutMs: 30000, snapshotBytes: 6 * 1024 * 1024 };
fs.mkdirSync(path.join(DATA, "runs"), { recursive: true });

/* ---------------- proxies: roteren, falende proxy 10 minuten overslaan ---------------- */
const proxies = (() => {
  let list = (process.env.PARSELAB_PROXIES || "").split(",").map(s => s.trim()).filter(Boolean);
  const f = path.join(__dirname, "proxies.txt");
  if (!list.length && fs.existsSync(f)) list = fs.readFileSync(f, "utf8").split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));
  return list.map(server => ({ server, fails: 0, until: 0, used: 0 }));
})();
let proxyCursor = 0;
function pickProxy() {
  if (!proxies.length) return null;
  const now = Date.now();
  for (let i = 0; i < proxies.length; i++) {
    const p = proxies[(proxyCursor + i) % proxies.length];
    if (p.until <= now) { proxyCursor = (proxyCursor + i + 1) % proxies.length; p.used++; return p; }
  }
  return null;
}
function proxyFailed(p) { if (!p) return; p.fails++; if (p.fails >= 3) { p.until = Date.now() + 10 * 60 * 1000; p.fails = 0; } }
function proxyOk(p) { if (p) p.fails = 0; }
function toPlaywrightProxy(p) {
  if (!p) return undefined;
  try { const u = new URL(p.server); const out = { server: u.protocol + "//" + u.host }; if (u.username) { out.username = decodeURIComponent(u.username); out.password = decodeURIComponent(u.password); } return out; }
  catch (e) { return { server: p.server }; }
}

/* ---------------- veiligheid: alleen http(s) naar openbare adressen ---------------- */
function isPrivateIp(ip) {
  if (ip.includes(":")) { const l = ip.toLowerCase(); return l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:") && isPrivateIp(l.slice(7)); }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
async function checkUrl(raw) {
  let u; try { u = new URL(String(raw || "")); } catch (e) { throw httpError(400, "Dat is geen geldig webadres. Plak een adres dat begint met https://"); }
  if (!/^https?:$/.test(u.protocol)) throw httpError(400, "Alleen adressen met http of https kunnen worden uitgelezen.");
  const host = u.hostname.toLowerCase();
  if (!ALLOW_PRIVATE && (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal"))) throw httpError(400, "Interne adressen kunnen niet vanuit ParseLab worden uitgelezen.");
  let addrs; try { addrs = await dns.lookup(host, { all: true }); } catch (e) { throw httpError(400, "Deze website is niet gevonden. Controleer het adres."); }
  if (!ALLOW_PRIVATE && addrs.some(a => isPrivateIp(a.address))) throw httpError(400, "Interne adressen kunnen niet vanuit ParseLab worden uitgelezen.");
  return u;
}

/* ---------------- robots.txt en snelheid per host ---------------- */
const robotsCache = new Map();
function fetchText(u, proxy) {
  return new Promise(resolve => {
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.get(u, { headers: { "user-agent": UA }, timeout: 8000 }, res => {
      if (res.statusCode >= 400) { res.resume(); return resolve(null); }
      let body = ""; res.setEncoding("utf8"); res.on("data", d => { if (body.length < 200000) body += d; }); res.on("end", () => resolve(body));
    });
    req.on("error", () => resolve(null)); req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}
async function robotsAllows(u) {
  const key = u.origin; let rules = robotsCache.get(key);
  if (!rules || rules.at < Date.now() - 3600e3) {
    const txt = await fetchText(new URL("/robots.txt", u.origin));
    const groups = []; let cur = null;
    (txt || "").split(/\r?\n/).forEach(line => {
      const l = line.replace(/#.*/, "").trim(); if (!l) return;
      const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) return;
      const k = m[1].toLowerCase(), v = m[2].trim();
      if (k === "user-agent") { if (!cur || cur.closed) { cur = { agents: [], disallow: [], allow: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); }
      else if (cur) { cur.closed = true; if (k === "disallow" && v) cur.disallow.push(v); if (k === "allow" && v) cur.allow.push(v); }
    });
    rules = { at: Date.now(), groups }; robotsCache.set(key, rules);
  }
  const mine = rules.groups.filter(g => g.agents.includes("parselab")); const star = rules.groups.filter(g => g.agents.includes("*"));
  const g = mine.length ? mine : star; if (!g.length) return true;
  const p = u.pathname + u.search;
  const match = rule => { const re = new RegExp("^" + rule.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\$$/, "$")); return re.test(p); };
  const dis = g.flatMap(x => x.disallow).filter(match).sort((a, b) => b.length - a.length)[0];
  const allow = g.flatMap(x => x.allow).filter(match).sort((a, b) => b.length - a.length)[0];
  if (!dis) return true; return !!(allow && allow.length >= dis.length);
}
const hostLast = new Map();
async function politeWait(host) {
  const last = hostLast.get(host) || 0, wait = last + LIMITS.perHostMs - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  hostLast.set(host, Date.now());
}

/* ---------------- browser ---------------- */
let browserP = null;
async function browser() {
  if (!browserP) {
    const pw = loadPlaywright();
    const opts = { args: ["--no-sandbox"] };
    if (process.env.PLAYWRIGHT_CHROMIUM_PATH) opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
    browserP = pw.chromium.launch(opts).then(b => { b.on("disconnected", () => { if (browserP === thisP) browserP = null; }); return b; }).catch(e => { browserP = null; throw e; });
    const thisP = browserP;
  }
  const b = await browserP;
  if (!b.isConnected()) { browserP = null; return browser(); } // browser is weggevallen: opnieuw starten
  return b;
}
let running = 0; const queue = [];
function withSlot(fn) {
  return new Promise((resolve, reject) => {
    const go = async () => { running++; try { resolve(await fn()); } catch (e) { reject(e); } finally { running--; const n = queue.shift(); if (n) n(); } };
    if (running < LIMITS.concurrent) go(); else queue.push(go);
  });
}
async function openPage(u, useProxy) {
  const proxy = useProxy ? pickProxy() : null;
  const b = await browser();
  const ctx = await b.newContext({ userAgent: UA, locale: "nl-NL", viewport: { width: 1280, height: 900 }, proxy: toPlaywrightProxy(proxy), javaScriptEnabled: true });
  await ctx.route("**/*", route => { const t = route.request().resourceType(); if (t === "media" || t === "font") return route.abort(); route.continue(); });
  const page = await ctx.newPage();
  page.setDefaultTimeout(LIMITS.navTimeoutMs);
  return { ctx, page, proxy };
}
async function dismissCookies(page) {
  try {
    await page.evaluate(() => {
      const words = /^(accepteer|accepteren|akkoord|alles accepteren|alle cookies accepteren|accept|accept all|allow all|agree|i agree|ok|oké|prima|begrepen|sluiten)/i;
      const btns = [...document.querySelectorAll("button, [role=button], a")].filter(b => words.test((b.innerText || "").trim()) && b.offsetParent);
      const el = btns.find(b => /cookie|consent|gdpr|privacy/i.test((b.closest("[id],[class]") || b).outerHTML.slice(0, 600))) || btns[0];
      if (el) el.click();
    });
  } catch (e) {}
}

/* ---------------- opschonen van de snapshot voor weergave in de werkbank ---------------- */
async function snapshotOf(page) {
  return await page.evaluate(() => {
    const doc = document.cloneNode(true);
    doc.querySelectorAll("script, noscript, iframe, object, embed, link[rel=preload], link[rel=prefetch], meta[http-equiv]").forEach(n => n.remove());
    doc.querySelectorAll("*").forEach(n => {
      [...n.attributes].forEach(a => { const k = a.name.toLowerCase(); if (k.startsWith("on") || (k === "href" && /^\s*javascript:/i.test(a.value)) || k === "srcdoc") n.removeAttribute(a.name); });
      if (n.tagName === "FORM") n.removeAttribute("action");
      if (n.tagName === "A") n.setAttribute("target", "_top");
    });
    doc.querySelectorAll("img[data-src]").forEach(i => { if (!i.getAttribute("src")) i.setAttribute("src", i.getAttribute("data-src")); });
    const base = doc.createElement("base"); base.href = location.href; (doc.head || doc.documentElement).prepend(base);
    const cs = doc.createElement("meta"); cs.setAttribute("charset", "utf-8"); (doc.head || doc.documentElement).prepend(cs);
    return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
  });
}

/* ---------------- uitlezen volgens een regel (zelfde functie staat in tools/parsescraper.html) ---------------- */
const EXTRACT_FN = `(function (rule) {
  function clean(v, col) {
    v = (v == null ? "" : String(v)).replace(/\\s+/g, " ").trim();
    if (col.number) { var m = v.replace(/\\./g, "").replace(",", ".").match(/-?\\d+(?:\\.\\d+)?/); return m ? Number(m[0]) : ""; }
    return v;
  }
  function pick(el, col) {
    if (!el) return "";
    if (col.attr === "href") { var a = el.closest ? (el.tagName === "A" ? el : el.querySelector("a[href]") || el.closest("a[href]")) : null; return a ? a.href : ""; }
    if (col.attr === "src") { var i = el.tagName === "IMG" ? el : el.querySelector("img"); return i ? (i.currentSrc || i.src) : ""; }
    return el.innerText != null ? el.innerText : el.textContent;
  }
  var items = rule.item ? Array.prototype.slice.call(document.querySelectorAll(rule.item)) : [document.body];
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i], row = {}, any = false;
    for (var c = 0; c < rule.columns.length; c++) {
      var col = rule.columns[c]; if (col.off) continue;
      var el = col.selector ? it.querySelector(col.selector) : it;
      var v = clean(pick(el, col), col); row[col.name] = v; if (v !== "") any = true;
    }
    if (any) rows.push(row);
  }
  var next = null;
  if (rule.next && rule.next.selector) { var n = document.querySelector(rule.next.selector); if (n) next = n.href || n.getAttribute("href") || null; }
  return { rows: rows, next: next, count: items.length };
})`;

async function runRule(page, rule, maxPages, onProgress) {
  const all = []; let pagesDone = 0, nextUrl = null;
  for (let p = 0; p < maxPages; p++) {
    if (rule.scroll) {
      let last = 0;
      for (let s = 0; s < 12; s++) {
        const h = await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); return document.body.scrollHeight; });
        await page.waitForTimeout(700); if (h === last) break; last = h;
      }
    }
    const res = await page.evaluate("(" + EXTRACT_FN + ")(" + JSON.stringify(rule) + ")");
    all.push(...res.rows); pagesDone++;
    if (onProgress) onProgress({ pages: pagesDone, rows: all.length });
    if (all.length >= LIMITS.rowsPerRun) break;
    nextUrl = res.next;
    if (!nextUrl || !rule.next) break;
    const nu = await checkUrl(nextUrl); if (!(await robotsAllows(nu))) break;
    await politeWait(nu.hostname);
    try { await page.goto(nu.href, { waitUntil: "domcontentloaded" }); await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {}); } catch (e) { break; }
  }
  return { rows: all.slice(0, LIMITS.rowsPerRun), pages: pagesDone };
}

/* ---------------- taken en uitvoeringen (bestanden onder server/data) ---------------- */
const TASKS = path.join(DATA, "tasks.json");
function readTasks() { try { return JSON.parse(fs.readFileSync(TASKS, "utf8")); } catch (e) { return []; } }
function writeTasks(t) { fs.writeFileSync(TASKS, JSON.stringify(t, null, 2)); }
function runPath(id) { return path.join(DATA, "runs", id.replace(/[^a-z0-9-]/gi, "") + ".json"); }
function id() { return crypto.randomBytes(8).toString("hex"); }

async function executeTask(task, progress) {
  const u = await checkUrl(task.url);
  if (!(await robotsAllows(u))) throw httpError(403, "Deze website vraagt in robots.txt om niet automatisch uitgelezen te worden. ParseLab respecteert dat. Gebruik de extensie in je eigen browser als je de pagina zelf mag gebruiken.");
  return withSlot(async () => {
    await politeWait(u.hostname);
    const { ctx, page, proxy } = await openPage(u, task.proxy !== false);
    const run = { id: id(), taskId: task.id || null, url: u.href, start: new Date().toISOString(), proxy: proxy ? proxy.server.replace(/\/\/.*@/, "//***@") : null };
    try {
      await page.goto(u.href, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await dismissCookies(page);
      const out = await runRule(page, task.rule, Math.min(task.pages || 1, LIMITS.pagesPerRun), progress);
      proxyOk(proxy);
      Object.assign(run, { end: new Date().toISOString(), rows: out.rows, pages: out.pages, columns: task.rule.columns.filter(c => !c.off).map(c => c.name), status: "klaar" });
    } catch (e) {
      proxyFailed(proxy);
      Object.assign(run, { end: new Date().toISOString(), rows: [], pages: 0, status: "fout", error: friendly(e) });
    } finally { await ctx.close().catch(() => {}); }
    fs.writeFileSync(runPath(run.id), JSON.stringify(run));
    return run;
  });
}
function friendly(e) {
  const m = String(e && e.message || e);
  if (e && e.status) return m;
  if (/timeout/i.test(m)) return "De website reageerde niet op tijd. Probeer het later opnieuw.";
  if (/net::ERR_PROXY|ERR_TUNNEL/i.test(m)) return "De proxy werkte niet. ParseLab probeert de volgende proxy bij de volgende ronde.";
  if (/net::ERR_NAME_NOT_RESOLVED/i.test(m)) return "Deze website is niet gevonden. Controleer het adres.";
  return "Uitlezen is niet gelukt: " + m.slice(0, 160);
}

/* ---------------- planning: elke minuut kijken welke taken aan de beurt zijn ---------------- */
function nextDue(task) {
  const base = task.lastRun ? new Date(task.lastRun).getTime() : 0;
  const every = { uur: 3600e3, dag: 86400e3, week: 7 * 86400e3 }[task.schedule];
  return every ? base + every : Infinity;
}
setInterval(async () => {
  for (const t of readTasks()) {
    if (!t.schedule || t.schedule === "nu" || t.busy) continue;
    if (nextDue(t) > Date.now()) continue;
    t.busy = true; updateTask(t);
    try { const run = await executeTask(t); t.lastRun = run.start; t.lastRunId = run.id; t.lastStatus = run.status; t.lastRows = run.rows.length; }
    catch (e) { t.lastStatus = "fout"; t.lastError = friendly(e); t.lastRun = new Date().toISOString(); }
    t.busy = false; updateTask(t);
  }
}, 60e3).unref();
function updateTask(t) { const all = readTasks(); const i = all.findIndex(x => x.id === t.id); if (i >= 0) all[i] = t; else all.push(t); writeTasks(all); }

/* ---------------- Excel (xlsx) zonder afhankelijkheden ---------------- */
function xlsx(columns, rows, sheet) {
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const col = n => { let s = ""; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const cell = (r, c, v) => typeof v === "number" && isFinite(v) ? `<c r="${col(c)}${r}"><v>${v}</v></c>` : `<c r="${col(c)}${r}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  const lines = [`<row r="1">${columns.map((h, c) => cell(1, c, h)).join("")}</row>`];
  rows.forEach((row, i) => lines.push(`<row r="${i + 2}">${columns.map((h, c) => cell(i + 2, c, row[h])).join("")}</row>`));
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheet || "Uitgelezen")}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${lines.join("")}</sheetData></worksheet>`
  };
  return zip(files);
}
function zip(files) {
  const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t.push(c >>> 0); } return t; })();
  const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const parts = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, "utf8"), comp = zlib.deflateRawSync(data), n = Buffer.from(name), crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6); local.writeUInt16LE(8, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, n, comp);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt16LE(0, 30); c.writeUInt16LE(0, 32); c.writeUInt16LE(0, 34); c.writeUInt16LE(0, 36); c.writeUInt32LE(0, 38); c.writeUInt32LE(offset, 42);
    central.push(c, n); offset += local.length + n.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, cd, end]);
}
function csv(columns, rows) {
  const q = v => { const s = String(v == null ? "" : v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return "﻿" + [columns.map(q).join(";"), ...rows.map(r => columns.map(c => q(typeof r[c] === "number" ? String(r[c]).replace(".", ",") : r[c])).join(";"))].join("\r\n");
}

/* ---------------- HTTP ---------------- */
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
function send(res, status, body, type) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, { "content-type": type || (isBuf ? "application/octet-stream" : "application/json; charset=utf-8"), "cache-control": "no-store" });
  res.end(isBuf || typeof body === "string" ? body : JSON.stringify(body));
}
function readBody(req) { return new Promise((resolve, reject) => { let b = ""; req.on("data", d => { b += d; if (b.length > 1e6) { reject(httpError(413, "Te groot")); req.destroy(); } }); req.on("end", () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(httpError(400, "Ongeldige JSON")); } }); }); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".zip": "application/zip", ".md": "text/markdown; charset=utf-8", ".ico": "image/x-icon" };
function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname); if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(ROOT, p));
  // Alleen het dashboard en de tools zijn openbaar; de servermap (code, proxies.txt, taken, uitvoeringen), node_modules en dotfiles nooit.
  const rel = path.relative(ROOT, file);
  if (rel.startsWith("..") || path.isAbsolute(rel) || /^(server|node_modules)(\/|\\|$)/.test(rel) || rel.split(/[\/\\]/).some(seg => seg.startsWith("."))) return send(res, 404, { error: "Niet gevonden" });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: "Niet gevonden" });
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
}
function validateRule(rule) {
  if (!rule || !Array.isArray(rule.columns) || !rule.columns.length) throw httpError(400, "Wijs eerst aan wat je wilt uitlezen.");
  const sel = s => { if (s == null) return ""; s = String(s); if (s.length > 500) throw httpError(400, "Selectie te lang"); return s; };
  return { item: sel(rule.item), scroll: !!rule.scroll, next: rule.next && rule.next.selector ? { selector: sel(rule.next.selector) } : null,
    columns: rule.columns.slice(0, 40).map((c, i) => ({ name: String(c.name || "kolom " + (i + 1)).slice(0, 60), selector: sel(c.selector), attr: ["text", "href", "src"].includes(c.attr) ? c.attr : "text", number: !!c.number, off: !!c.off })) };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    if (!u.pathname.startsWith("/api/")) return serveStatic(req, res, u.pathname);
    if (TOKEN && req.headers["x-parselab-token"] !== TOKEN) throw httpError(401, "Geen toegang: de ParseLab-server vraagt een toegangscode.");
    const m = u.pathname.match(/^\/api\/scrape\/(snapshot|run|tasks|status|runs)(?:\/([a-z0-9-]+))?(?:\/(run))?(\.xlsx|\.csv)?$/i);
    if (!m) throw httpError(404, "Onbekende opdracht");
    const [, kind, sub, action, ext] = m;

    if (kind === "status") return send(res, 200, { proxies: proxies.map(p => ({ server: p.server.replace(/\/\/.*@/, "//***@"), used: p.used, paused: p.until > Date.now() })), running, queued: queue.length, tasks: readTasks().length, limits: LIMITS, token: !!TOKEN });

    if (kind === "snapshot" && req.method === "POST") {
      const body = await readBody(req); const target = await checkUrl(body.url);
      if (!(await robotsAllows(target))) throw httpError(403, "Deze website vraagt in robots.txt om niet automatisch uitgelezen te worden. ParseLab respecteert dat. Gebruik de extensie in je eigen browser als je de pagina zelf mag gebruiken.");
      const out = await withSlot(async () => {
        await politeWait(target.hostname);
        const { ctx, page, proxy } = await openPage(target, body.proxy !== false);
        try {
          await page.goto(target.href, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
          await dismissCookies(page); await page.waitForTimeout(400);
          const html = await snapshotOf(page);
          if (html.length > LIMITS.snapshotBytes) throw httpError(413, "Deze pagina is te groot om in de werkbank te tonen.");
          const shot = await page.screenshot({ type: "jpeg", quality: 60, fullPage: false }).catch(() => null);
          proxyOk(proxy);
          return { url: page.url(), title: await page.title(), html, screenshot: shot ? "data:image/jpeg;base64," + shot.toString("base64") : null, proxy: !!proxy };
        } catch (e) { proxyFailed(proxy); throw e; } finally { await ctx.close().catch(() => {}); }
      });
      return send(res, 200, out);
    }

    if (kind === "run" && req.method === "POST") {
      const body = await readBody(req);
      const run = await executeTask({ url: body.url, rule: validateRule(body.rule), pages: Number(body.pages) || 1, proxy: body.proxy !== false });
      if (run.status === "fout") throw httpError(502, run.error);
      return send(res, 200, run);
    }

    if (kind === "tasks") {
      if (req.method === "GET") return send(res, 200, readTasks());
      if (req.method === "POST" && !sub) {
        const body = await readBody(req); const target = await checkUrl(body.url);
        const t = { id: id(), name: String(body.name || target.hostname).slice(0, 80), url: target.href, rule: validateRule(body.rule), pages: Math.min(Number(body.pages) || 1, LIMITS.pagesPerRun), schedule: ["nu", "uur", "dag", "week"].includes(body.schedule) ? body.schedule : "nu", proxy: body.proxy !== false, created: new Date().toISOString() };
        if (body.lastRunId && fs.existsSync(runPath(String(body.lastRunId)))) { try { const r = JSON.parse(fs.readFileSync(runPath(String(body.lastRunId)), "utf8")); t.lastRunId = r.id; t.lastRun = r.start; t.lastStatus = r.status; t.lastRows = r.rows.length; r.taskId = t.id; fs.writeFileSync(runPath(r.id), JSON.stringify(r)); } catch (e) {} }
        updateTask(t); return send(res, 200, t);
      }
      if (req.method === "POST" && sub && action === "run") {
        const t = readTasks().find(x => x.id === sub); if (!t) throw httpError(404, "Taak niet gevonden");
        const run = await executeTask(t); t.lastRun = run.start; t.lastRunId = run.id; t.lastStatus = run.status; t.lastRows = run.rows.length; t.lastError = run.error || null; updateTask(t);
        if (run.status === "fout") throw httpError(502, run.error);
        return send(res, 200, run);
      }
      if (req.method === "DELETE" && sub) { writeTasks(readTasks().filter(x => x.id !== sub)); return send(res, 200, { ok: true }); }
      if (req.method === "PATCH" && sub) {
        const body = await readBody(req); const t = readTasks().find(x => x.id === sub); if (!t) throw httpError(404, "Taak niet gevonden");
        if (body.name) t.name = String(body.name).slice(0, 80);
        if (["nu", "uur", "dag", "week"].includes(body.schedule)) t.schedule = body.schedule;
        updateTask(t); return send(res, 200, t);
      }
    }

    if (kind === "runs" && sub) {
      let run; try { run = JSON.parse(fs.readFileSync(runPath(sub), "utf8")); } catch (e) { throw httpError(404, "Uitvoering niet gevonden"); }
      const name = (run.taskId ? readTasks().find(t => t.id === run.taskId)?.name : null) || new URL(run.url).hostname;
      if (ext === ".xlsx") { res.setHeader("content-disposition", `attachment; filename="${name.replace(/[^a-z0-9._-]/gi, "_")}.xlsx"`); return send(res, 200, xlsx(run.columns, run.rows, name), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); }
      if (ext === ".csv") { res.setHeader("content-disposition", `attachment; filename="${name.replace(/[^a-z0-9._-]/gi, "_")}.csv"`); return send(res, 200, csv(run.columns, run.rows), "text/csv; charset=utf-8"); }
      return send(res, 200, run);
    }
    throw httpError(404, "Onbekende opdracht");
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : friendly(e) });
  }
});
server.listen(PORT, () => {
  console.log(`ParseLab draait op http://localhost:${PORT}  (proxies: ${proxies.length}, toegangscode: ${TOKEN ? "aan" : "uit"})`);
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", async () => { try { const b = await browserP; if (b) await b.close(); } catch (e) {} process.exit(0); });
