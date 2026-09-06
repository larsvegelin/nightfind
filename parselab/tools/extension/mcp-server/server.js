#!/usr/bin/env node
/**
 * ParseLab — MCP-server (extensie-bridge). Alleen voor IT-beheer / ontwikkelaars.
 *
 * Deze server doet twee dingen:
 *  1) Hij is een MCP-server (praat via stdio met een MCP-client zoals Claude) en biedt
 *     de tools `read_fields`, `fill_records` en `ping` aan.
 *  2) Hij draait een lokale WebSocket-server (127.0.0.1:8765) waar de ParseLab-extensie
 *     mee verbindt. Tool-aanroepen worden doorgestuurd naar de extensie, die ze uitvoert
 *     in JOUW actieve, ingelogde tabblad. Er gaat niets het netwerk op — alleen localhost.
 *
 * Beveiliging: gedeeld geheim. De extensie toont onder Gevorderd → "Voor IT-beheer" een code
 * (6 groepen). Zet die in de omgevingsvariabele PARSELAB_MCP_TOKEN. Elke verbinding moet als
 * eerste bericht {type:'hello', token} sturen; klopt de code niet (of blijft hij uit), dan
 * sluit de server de verbinding. Pas na {type:'hello_ok'} voert de extensie opdrachten uit.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { WebSocketServer } from 'ws';
import { timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PARSELAB_MCP_PORT || process.env.WEBTOOL_MCP_PORT || 8765);
const TOKEN = String(process.env.PARSELAB_MCP_TOKEN || process.env.WEBTOOL_MCP_TOKEN || '').trim();
const norm = (s) => String(s || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

if (!TOKEN) {
    console.error('[parselab-mcp] Geen PARSELAB_MCP_TOKEN gezet. Zet de koppeling in de extensie aan (Gevorderd → Voor IT-beheer), kopieer de code en start opnieuw met PARSELAB_MCP_TOKEN=<code>.');
    process.exit(2);
}
function tokenOk(t) {
    const a = Buffer.from(norm(t)), b = Buffer.from(norm(TOKEN));
    return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

// ---- WebSocket-brug naar de extensie ----
let extClient = null;
let seq = 1;
const pending = new Map(); // id -> {resolve, timer}

const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT });
wss.on('connection', (ws) => {
    let authed = false;
    const helloTimer = setTimeout(() => { if (!authed) { try { ws.close(4001, 'geen handshake'); } catch (e) {} } }, 5000);
    ws.on('message', (data) => {
        let m; try { m = JSON.parse(data.toString()); } catch (e) { return; }
        if (!m) return;
        if (!authed) {
            if (m.type === 'hello' && tokenOk(m.token)) {
                authed = true; clearTimeout(helloTimer);
                if (extClient && extClient !== ws) { try { extClient.close(4002, 'vervangen'); } catch (e) {} }
                extClient = ws;
                try { ws.send(JSON.stringify({ type: 'hello_ok' })); } catch (e) {}
                console.error('[parselab-mcp] extensie verbonden.');
            } else {
                try { ws.send(JSON.stringify({ type: 'hello_fail' })); } catch (e) {}
                try { ws.close(4003, 'ongeldige code'); } catch (e) {}
                console.error('[parselab-mcp] verbinding geweigerd: ongeldige of ontbrekende code.');
            }
            return;
        }
        if (m.id != null && pending.has(m.id)) {
            const { resolve, timer } = pending.get(m.id);
            clearTimeout(timer); pending.delete(m.id); resolve(m.result);
        }
    });
    ws.on('close', () => { clearTimeout(helloTimer); if (extClient === ws) { extClient = null; console.error('[parselab-mcp] extensie losgekoppeld.'); } });
});
wss.on('error', (e) => { console.error('[parselab-mcp] ws-fout:', e.message); });

function callExtension(cmd, args, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        if (!extClient || extClient.readyState !== extClient.OPEN) {
            return reject(new Error('Geen extensie verbonden. Open het ParseLab-paneel in Chrome, zet onder Gevorderd → Voor IT-beheer de koppeling aan en controleer dat de code overeenkomt met PARSELAB_MCP_TOKEN.'));
        }
        const id = seq++;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('time-out: geen antwoord van de extensie')); }, timeoutMs);
        pending.set(id, { resolve, timer });
        try { extClient.send(JSON.stringify({ id, cmd, args })); } catch (e) { clearTimeout(timer); pending.delete(id); reject(e); }
    });
}

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

// ---- MCP-server + tools ----
const server = new McpServer({ name: 'parselab', version: '0.2.0' });

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
    'Vul een reeks records in op de huidige pagina — telkens invullen en (optioneel) op een opslaan-/volgende-knop drukken. Sleutels van elk record moeten overeenkomen met de kolomnamen uit read_fields. Elke aanroep wordt in het ParseLab-logboek vastgelegd (tijd, aantal records).',
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
console.error('[parselab-mcp] MCP-server actief. Bridge op ws://127.0.0.1:' + PORT + ' — wacht op de extensie (met code)…');
