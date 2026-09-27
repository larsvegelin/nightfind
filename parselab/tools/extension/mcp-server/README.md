# ParseLab — MCP-server (voor IT-beheer)

Laat een AI-agent (bv. Claude) de invoervelden van een **ingelogde** pagina ophalen en
daarna records automatisch invullen — bijvoorbeeld 30 producten achter elkaar in een
extranet. De browser doet het werk in **jouw eigen, ingelogde tabblad**; er zijn geen
wachtwoorden nodig en er gaat niets het netwerk op (alleen `localhost`).

Dit onderdeel is bedoeld voor IT-beheer en ontwikkelaars, niet voor gewone gebruikers.
In het paneel zit het daarom onder **Gevorderd → Voor IT-beheer**.

```
Claude (MCP-client) ──stdio──▶ deze MCP-server ──ws://127.0.0.1:8765──▶ ParseLab-extensie ──▶ pagina in het tabblad
```

## Beveiliging: gedeelde code

Elk programma op de computer kan op poort 8765 luisteren. Daarom is er een gedeeld geheim:

1. Open het ParseLab-paneel, ga naar **Gevorderd → Voor IT-beheer** en zet de koppeling **aan**.
   De extensie toont een code van zes groepen (bv. `K7PQ-3M2A-…`). Klik **Kopieer**.
2. Start deze server met die code in `PARSELAB_MCP_TOKEN` (zie hieronder).
3. De extensie stuurt bij het verbinden `{type:"hello", token}`. Klopt de code niet, dan sluit
   de server de verbinding. Pas na `{type:"hello_ok"}` voert de extensie opdrachten uit.

Verder:
- De extensie verbindt **alleen zolang het paneel open is**. Sluit je het paneel (✕), dan valt de
  verbinding weg.
- In het paneel staat de status **"Verbonden met een agent"** met een **Stop**-knop.
- Elke `fill_records`-opdracht wordt gelogd (tijd, aantal records) in het logboek
  (Gevorderd → Logboek).
- Met **Nieuwe code** in het paneel maak je een andere code; de oude werkt dan niet meer.

## Tools

| Tool | Wat het doet |
|---|---|
| `read_fields({ form? })` | Geeft het schema van de invoervelden: kolomnaam, label, type, opties (bij keuzelijsten) en een structuur-vingerafdruk. |
| `fill_records({ records, submit?, form?, delay? })` | Vult elk record in en drukt (optioneel) na elk record op een knop (bv. **Opslaan**). |
| `ping()` | Checkt of de extensie verbonden is. |

Sleutels in `records` moeten overeenkomen met de `column`-namen uit `read_fields`.
`submit` mag `{ "text": "Opslaan" }` of `{ "selector": "#opslaan" }` zijn.

## Installeren

```bash
cd tools/extension/mcp-server
npm install
```

## Koppelen aan een MCP-client

**Claude Desktop** — voeg toe aan `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "parselab": {
      "command": "node",
      "args": ["/absolute/pad/naar/tools/extension/mcp-server/server.js"],
      "env": { "PARSELAB_MCP_TOKEN": "K7PQ-3M2A-XXXX-XXXX-XXXX-XXXX" }
    }
  }
}
```

**Claude Code** — `PARSELAB_MCP_TOKEN=K7PQ-… claude mcp add parselab -- node /absolute/pad/naar/tools/extension/mcp-server/server.js`

Poort aanpassen kan met `PARSELAB_MCP_PORT`. De oude namen `WEBTOOL_MCP_TOKEN` en
`WEBTOOL_MCP_PORT` werken nog als terugval.

## Voorbeeld-verloop

1. Open het extranet en log in; open het "product invoeren"-formulier.
2. Open het ParseLab-paneel, zet onder Gevorderd → Voor IT-beheer de koppeling aan, kopieer de code.
3. Start de MCP-client met `PARSELAB_MCP_TOKEN`. Het paneel toont "Verbonden met een agent".
4. Agent: `read_fields()` → bv. `Naam, Prijs, Aantal`.
5. Jij/agent levert 30 records met die sleutels.
6. Agent: `fill_records({ records: [...30...], submit: { text: "Opslaan" } })` → 30× ingevuld en opgeslagen.

## Belangrijk

- **Toestemming:** automatiseren op een extranet met klantgegevens moet zijn toegestaan door de
  eigenaar van dat extranet en binnen de gebruiksvoorwaarden vallen. De extensie vraagt dit bij
  de eerste ronde op een nieuw domein ook aan de gebruiker en houdt een logboek bij.
- **Alles lokaal:** de bridge luistert alleen op `127.0.0.1`. Geen cloud, geen opslag van
  inloggegevens; de bestaande browsersessie wordt gebruikt.
- **Prototype:** de MV3-service-worker kan door Chrome worden gepauzeerd; de bridge verbindt
  automatisch opnieuw zolang het paneel open is.
