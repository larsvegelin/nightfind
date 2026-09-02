# WebTool Scraper — MCP-server (extranet-automatisering)

Laat een agent (bv. Claude) de invoervelden van een **ingelogde** pagina ophalen en
daarna records automatisch invullen — bijvoorbeeld **30 producten achter elkaar** in een
extranet. De browser doet het werk in **jouw eigen, ingelogde tabblad**, dus er zijn geen
wachtwoorden nodig en er gaat niets het netwerk op (alleen `localhost`).

```
Claude (MCP-client) ──stdio──▶ deze MCP-server ──ws://127.0.0.1:8765──▶ WebTool-extensie ──▶ DOM van het extranet
```

## Tools

| Tool | Wat het doet |
|---|---|
| `read_fields({ form? })` | Geeft het **schema** van de invoervelden: kolomnaam, label, type, opties (bij dropdowns) en een structuur-vingerafdruk. |
| `fill_records({ records, submit?, form?, delay? })` | Vult elk record in en drukt (optioneel) na elk record op een knop (bv. **Opslaan**). Zo verwerk je er 30 achter elkaar. |
| `ping()` | Checkt of de extensie verbonden is. |

Sleutels in `records` moeten overeenkomen met de `column`-namen uit `read_fields`.
`submit` mag `{ "text": "Opslaan" }` of `{ "selector": "#opslaan" }` zijn.

## Installeren

```bash
cd extension/mcp-server
npm install
```

## Aanzetten in de extensie

De MCP-bridge in de extensie staat standaard **uit**. Zet hem aan:
- via de knop **MCP-koppeling** onder *Meer opties* in het paneel, of
- programmatisch: `chrome.storage.local.set({ 'wt-mcp': true })`.

De extensie verbindt dan met `ws://127.0.0.1:8765`.

## Koppelen aan een MCP-client

**Claude Desktop** — voeg toe aan `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webtool-scraper": {
      "command": "node",
      "args": ["/absolute/pad/naar/extension/mcp-server/server.js"]
    }
  }
}
```

**Claude Code** — `claude mcp add webtool-scraper -- node /absolute/pad/naar/extension/mcp-server/server.js`

Poort aanpassen kan met de env-var `WEBTOOL_MCP_PORT`.

## Voorbeeld-verloop

1. Open het extranet en log in; open het "product invoeren"-formulier.
2. Zet de MCP-koppeling aan (extensie) en start de MCP-client.
3. Agent: `read_fields()` → bv. `Naam, Prijs, Aantal`.
4. Jij/agent levert 30 records met die sleutels.
5. Agent: `fill_records({ records: [...30...], submit: { text: "Opslaan" } })` → 30× ingevuld en opgeslagen.

## Belangrijk

- **Autorisatie & compliance:** automatiseren op een extranet met klantgegevens (AVG) moet
  zijn toegestaan door de eigenaar van dat extranet (security/IT) en binnen de gebruiksvoorwaarden
  vallen. Deze tool levert de techniek; de toestemming regel je zelf.
- **Alles lokaal:** de bridge luistert alleen op `127.0.0.1`. Geen cloud, geen opslag van
  inloggegevens; de bestaande browsersessie wordt gebruikt.
- **Prototype:** de MV3-service-worker kan door Chrome worden gepauzeerd; de bridge verbindt
  automatisch opnieuw. Voor productie is Chrome **Native Messaging** robuuster dan WebSocket.
