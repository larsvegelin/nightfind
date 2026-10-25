# WebTool Scraper — volledige flow van de tool

Een Chrome/Edge/Brave **Manifest V3-extensie** die op elke pagina waarden kan
**scrapen**, formulieren kan **vullen** en knoppen kan **drukken** — in één flow, per
CSV-rij herhaald. Alles draait **lokaal** in je browser; er gaat niets het netwerk op
(behalve een Webhook-stap of de optionele MCP-bridge naar `localhost`, allebei door jou
aangezet).

---

## 1. Bestanden

| Bestand | Rol |
|---|---|
| `manifest.json` | MV3-manifest: rechten, content-script, background, sneltoets, icoon. |
| `panel.js` | **De kern** (content-script, ~1840 regels): UI-paneel (shadow DOM), scraper, invuller, run-engine, veld-herkenning, export, i18n, MCP-API. |
| `panel.css` | Stijl van de aanwijs-overlay op de echte pagina (buiten de shadow DOM) + print-regels. |
| `background.js` | Service worker: downloads, screenshot, print-naar-PDF, paneel togglen, MCP-WebSocket-bridge. |
| `icons/` | Toolbar-icoon (16/48/128). |
| `mcp-server/` | Node MCP-server om de tool door een AI-agent te laten aansturen (optioneel). |

---

## 2. Levenscyclus (boot)

```
manifest.content_scripts  →  panel.js draait op ELKE pagina (document_idle)
        │
        ├─ IIFE start; definieert alle helpers (module-niveau)
        ├─ leest chrome.storage 'wt-active'
        │      true  → buildPanel()  (paneel tonen)
        │      false → niets (paneel blijft dicht)
        ├─ luistert op runtime-berichten (wt-set, wt-api-*)
        └─ luistert op storage-wijzigingen ('wt-active' → aan/uit)

toolbar-klik of Alt+Shift+S  →  background.togglePanel()  →  zet 'wt-active'  →  buildPanel()/removePanel()
```

- Het paneel is **"aan/uit"-status** wordt in `chrome.storage.local` bewaard, zodat het
  op elke nieuwe pagina automatisch terugkomt zolang je het niet met ✕ sluit.
- `buildPanel()` maakt één host-`<div>` met **shadow DOM** (geïsoleerde stijl), en zet die
  via de **Popover-API in de browser-top-layer** zodat hij boven élke pagina-modaal blijft
  en klikbaar is (fallback: laatste-in-DOM).

---

## 3. Het flow-model

Eén flow = een array `steps[]`. Elke stap is een object met een `type`:

| type | Wat het doet |
|---|---|
| `scrape` (element) | Leest één element (tekst/href/src/…), met opschoning (trim/getal/regex) → een **kolom**. |
| `scrape` (list) | Herkent automatisch een herhalende lijst/tabel (Octoparse-stijl) → meerdere rijen. |
| `fill` | Vult een heel formulier uit een CSV-rij; per veld aan/uit via aanvinklijst. |
| `setval` | Vult één invoerveld (met `{{kolom}}` of `{{Prijs*1.21}}`). |
| `select` | Kiest een dropdown-optie (native `<select>`, MudBlazor/ARIA-combobox). |
| `click` | Drukt een knop in (volledige muis-sequence, MudButton-resolutie). |
| `type` / `key` | Typt tekst / stuurt een toets. |
| `hover` / `scroll` / `scrollload` | Hover, scrollen, oneindig scrollen. |
| `waitfor` / `wait` / `cond` | Wachten tot element er is / vaste pauze / voorwaarde (bestaat/bevat). |
| `shot` / `print` / `images` / `webhook` | Screenshot, print-naar-PDF, bestanden downloaden, rij POST-en. |

Stappen worden gebouwd via **+ Stap toevoegen** (aanwijzen op de pagina) of via de
**opdracht-chat** (`scrape de prijs`, `klik Opslaan`, `wacht 2s`, `herhaal 5`, `start`).

---

## 4. Aanwijzen (element kiezen)

```
beginPick(handler)  →  picking = true
   mousemove (capture)  →  overlay volgt e.target (blauwe omlijning, top-layer popover)
   pointerdown/mousedown (capture)  →  geblokkeerd (pagina reageert niet: dropdown gaat niet open)
   click (capture)  →  preventDefault + handler(e.target)  →  endPick()
```

Bij een klik op een icoon/label/wrapper verwijst **`resolveField(el)`** door naar het
echte invoerveld eronder.

---

## 5. Veld-herkenning (overleeft refresh)

Moderne web-apps (MudBlazor/React) geven velden bij **elke pagina-load een nieuw
willekeurig id**. Daarom koppelt de tool **niet op naam/id** maar op **HTML-structuur**:

- `structSelector(el)` → structuurpad `tag + :nth-of-type`, verankerd op een stabiel id/`<form>`, vluchtige id's overgeslagen (bv. `#form>div>input`).
- `fingerprint(el)` → `{ tag, type, stabiele klassen, placeholder, structuurpad, outerHTML }`.
- Bij het draaien zoekt `targetEl(step)` eerst met het structuurpad; lukt dat niet, dan
  scoort `findByFingerprint` alle kandidaten op type + klassen + placeholder + HTML-gelijkenis.

Zo werkt de flow ook na een refresh, en meldt **🔗 Check koppelingen** per stap goed/fout.

---

## 6. De run-engine (herstartbaar, loopt door over paginawissels)

```
Start  →  st = { steps, rows (uit CSV of [null]), delay, repeat, folder, groupCol,
                 cursor:{rp,ri,si}, out:{}, results:[], running:true, ts }
       →  saveRun(st)  in chrome.storage 'wt-run'  (overleeft navigatie)
       →  runFromState(st)

runFromState — lus over rows × repeat:
   voor elke stap:
     cursor NAAR de volgende stap  →  saveRun  (VÓÓR uitvoeren!)   ← zo hervat een klik
        die een nieuwe pagina laadt automatisch bij de volgende stap
     performStep(step, row, out)
        retries (#flow-retries) + bij-fout (#flow-onerror: overslaan/stop)
     resultaat → st.out[kolom] = waarde
   na elke rij  →  st.results.push(out)  + voortgang (✓, "x/total voltooid")
```

- **Loop per rij:** 5 CSV-regels = 5 rondes; per rij kan een **submap** worden gemaakt op
  een unieke kolom (bv. `relatienummer`).
- **Cross-page:** de cursor wordt vóór elke stap opgeslagen; laadt een stap een nieuwe
  pagina, dan hervat `restore()` op die pagina automatisch bij de volgende stap.
- **Pauze/Stop/Hervat:** pauze bewaart de run (niet gewist); Start hervat. Een
  blijven-hangen run (tab gesloten) wordt door de tijdstempel **niet** half hervat —
  Start begint dan netjes bij het begin.

---

## 7. Invullen (robuust op frameworks)

`fillElement(el, value)` kiest per soort veld de juiste techniek:

- **Veld altijd eerst leegmaken**, dan de waarde zetten.
- Native `<input type=date>` → datum omgezet naar `JJJJ-MM-DD`.
- **MudBlazor/gemaskeerd** (o.a. `dd-MM-yyyy`) → **teken voor teken typen** via
  `execCommand('insertText')` (laat het native `input`-event vuren dat MudMask verwerkt) —
  in één keer `value` zetten zou de waarde verhaspelen (bv. `30-11-2002` → `01-01-1983`).
- **Dropdowns** (klik-open) → `pickFromPopup`: open de lijst en klik de optie die op naam past.
- **Autocomplete / zoek-combobox** (`type=search` + `role=combobox` + `aria-autocomplete`, bv. ASR
  "Zoek een klant") → `fillAutocomplete`: **eerst teken voor teken typen** zodat de app zoekt, wachten
  tot de resultatenlijst (`aria-controls`) vult, dan het resultaat klikken dat de waarde bevat (anders
  het eerste). Zo'n lijst verschijnt namelijk pas ná het typen — één keer `value` zetten vult niets.
- Variabelen: `{{kolom}}` en rekenen `{{Prijs*1.21}}` via een veilige expressie-evaluator
  (géén `eval`); een datum wordt nooit als rekensom gezien.

---

## 8. Data & export

- **CSV inlezen:** auto-scheidingsteken (`;`/`,`/tab), koppen = kolomnamen; `{{kolom}}`.
- **Sjabloon:** *CSV-sjabloon van invoervelden* maakt één CSV met een kop per veld
  (met `;` voor NL-Excel).
- **Export:** JSON, **CSV (UTF-8 BOM + `;`** → € en accenten correct), **Excel** (.xlsx),
  **ZIP**, klembord, of **Webhook** (POST naar jouw URL). Excel/ZIP worden zonder
  bibliotheken gemaakt (eigen `crc32`/`zipStore`/`toXlsx`).
- **Downloads** gaan via `background.js` naar een map in Downloads (standaard `webtool`),
  met submap per kolomwaarde.

---

## 9. Achtergrond-taken (`background.js`)

| Bericht | Actie |
|---|---|
| `wt-download` | Bestand (tekst of base64) naar de map, zonder "opslaan als"-venster. |
| `wt-shot` | `captureVisibleTab` → PNG in de map. |
| `wt-print` | `chrome.debugger` → `Page.printToPDF` → PDF in de map (paneel even verborgen). |
| `wt-dlfiles` | Reeks URL's downloaden. |
| `wt-set` | Paneel aan/uit. |
| MCP-bridge | WebSocket naar `ws://127.0.0.1:8765`; stuurt `read_fields`/`fill_records` naar het actieve tabblad. |

---

## 10. MCP-koppeling (AI-agent stuurt de tool)

```
Claude (MCP-client) ──stdio──▶ mcp-server/server.js ──ws://127.0.0.1:8765──▶ background.js ──▶ content-script (huidige tab)
```

Programmatische API in de content-script (module-niveau, werkt ook zonder paneel-UI):

- `apiReadFields(form?)` → schema van de invoervelden (kolom, label, type, opties, vingerafdruk).
- `apiFill({ records[], submit?, form?, delay? })` → vult elk record in en drukt (optioneel)
  op een knop → bv. **30 producten achter elkaar**.

Aanzetten met de knop **MCP-koppeling** (Meer opties) of `chrome.storage 'wt-mcp' = true`.
Zie `mcp-server/README.md`.

---

## 11. Rechten & privacy

`permissions: activeTab, scripting, storage, downloads, tabs, debugger` +
`host_permissions: <all_urls>`.

- `<all_urls>`/`scripting` — nodig om op elke pagina te scrapen/invullen.
- `debugger` — alleen voor print-naar-PDF (Chrome toont dan een gele balk).
- **Lokaal:** flows/CSV/resultaten in `chrome.storage.local`; niets naar een server.
  Enige uitgaande verkeer: een **Webhook**-stap (jouw URL) of de **MCP-bridge**
  (`localhost`), beide alleen als jíj ze aanzet.
