#!/usr/bin/env node
/**
 * WebTool Scraper — MCP-server (Optie A: extensie-bridge).
 *
 * Deze server doet twee dingen:
 *  1) Hij is een MCP-server (praat via stdio met een MCP-client zoals Claude) en biedt
 *     de tools `read_fields`, `fill_records` en `ping` aan.
 *  2) Hij draait een lokale WebSocket-server (127.0.0.1:8765) waar de browser-extensie
 *     mee verbindt. Tool-aanroepen worden doorgestuurd naar de extensie, die ze uitvoert
 *     in JOUW actieve, ingelogde tabblad (het extranet). Er gaat niets het netwerk op —
 *     alleen localhost — en er zijn geen wachtwoorden nodig: de bestaande sessie wordt gebruikt.
 *
 * Typisch gebruik door een agent:
 *   read_fields()                          → schema van de invoervelden op de pagina
 *   (agent/gebruiker levert de waarden)
 *   fill_records({ records: [...30...], submit: { text: "Opslaan" } })
 *                                          → vult elk record in en drukt op Opslaan (30×)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.WEBTOOL_MCP_PORT || 8765);

// ---- WebSocket-brug naar de extensie ----
let extClient = null;
let seq = 1;
const pending = new Map(); // id -> {resolve, timer}

const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT });
wss.on('connection', (ws) => {
    extClient = ws;
    ws.on('message', (data) => {
        let m; try { m = JSON.parse(data.toString()); } catch (e) { return; }
        if (m && m.id != null && pending.has(m.id)) {
            const { resolve, timer } = pending.get(m.id);
            clearTimeout(timer); pending.delete(m.id); resolve(m.result);
        }
    });
    ws.on('close', () => { if (extClient === ws) extClient = null; });
});
wss.on('error', (e) => { console.error('[webtool-mcp] ws-fout:', e.message); });

function callExtension(cmd, args, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        if (!extClient || extClient.readyState !== extClient.OPEN) {
            return reject(new Error('Geen extensie verbonden. Open Chrome met de WebTool Scraper-extensie en zet de MCP-bridge aan (chrome.storage "wt-mcp": true).'));
        }
        const id = seq++;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('time-out: geen antwoord van de extensie')); }, timeoutMs);
        pending.set(id, { resolve, timer });
        try { extClient.send(JSON.stringify({ id, cmd, args })); } catch (e) { clearTimeout(timer); pending.delete(id); reject(e); }
    });
}

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

// ---- MCP-server + tools ----
const server = new McpServer({ name: 'webtool-scraper', version: '0.1.0' });

server.tool(
    'read_fields',
    'Haal de invoervelden (schema) van de huidige pagina in het actieve tabblad op: kolomnaam, label, type en een structuur-vingerafdruk per veld.',
    { form: z.string().optional().describe('CSS-selector van het formulier (optioneel; standaard het eerste <form> of de hele pagina)') },
    async ({ form }) => {
        const r = await callExtension('read_fields', { form });
        if (!r || r.ok === false) throw new Error((r && r.error) || 'read_fields mislukt');
        return asText(r.fields || r);
    }
);

server.tool(
    'fill_records',
    'Vul een reeks records in op de huidige pagina — telkens invullen en (optioneel) op een opslaan-/volgende-knop drukken. Zo automatiseer je bv. 30 producten achter elkaar. Sleutels van elk record moeten overeenkomen met de kolomnamen uit read_fields.',
    {
        records: z.array(z.record(z.any())).describe('Lijst met records; elke sleutel = kolomnaam uit read_fields, waarde = in te vullen tekst'),
        form: z.string().optional().describe('CSS-selector van het formulier (optioneel)'),
        submit: z.object({
            text: z.string().optional().describe('Tekst van de knop die na elk record wordt ingedrukt, bv. "Opslaan"'),
            selector: z.string().optional().describe('Of een CSS-selector van die knop')
        }).optional().describe('Knop die na elk record wordt ingedrukt (opslaan/volgende). Weglaten = alleen invullen.'),
        delay: z.number().optional().describe('Wachttijd (ms) tussen records; standaard 400')
    },
    async ({ records, form, submit, delay }) => {
        const r = await callExtension('fill_records', { records, form, submit, delay });
        if (!r || r.ok === false) throw new Error((r && r.error) || 'fill_records mislukt');
        return asText(r.result || r);
    }
);

server.tool('ping', 'Controleer of de extensie-bridge verbonden is.', {}, async () => {
    const r = await callExtension('ping', {}, 5000);
    return asText(r);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[webtool-mcp] MCP-server actief. WebSocket-bridge op ws://127.0.0.1:' + PORT + ' — wacht op de extensie…');
