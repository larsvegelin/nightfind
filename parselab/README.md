# ParseLab Dashboard

Eén app-shell (navy zijbalk + crème werkgebied) voor alle ParseLab-software, gebouwd volgens `App — ParseLab Dashboard` en de tokens uit `DESIGN-parselab.md`. De verbeterpunten uit `docs/` (simpeler voor mensen zonder IT-achtergrond, veiliger, één taal) zijn toegepast; per element staat de status in het betreffende md-bestand.

## Bestanden

| Pad | Wat |
|---|---|
| `index.html` | Het dashboard: login, Overzicht, Bestanden, Hulp en per tool een detailweergave plus werkbank. `state.view` = `overview` \| `files` \| `help` \| `form` \| `scrape` \| `pdf` \| `board`; `#<tool>/<sectie>` opent de echte tool op die sectie. Tooldata in `toolDefs()`, instellingen in `CONFIG`. |
| `tools/parsepdf.html` | ParsePDF, ingebed in de werkbank. Vier stappen: Uploaden, Aanwijzen, Controleren, Downloaden. |
| `tools/parseboard.html` | ParseBoard (bestand → overzicht), ingebed in de werkbank. |
| `tools/extension/` | Browserextensie "ParseLab" voor ParseForm en ParseScraper (uitgepakt). |
| `tools/parselab-extension.zip` | Dezelfde extensie als download voor IT-beheer. |
| `docs/` | Per tool de analyse en de status van toepassing. Begin bij `docs/00-overzicht.md`. |

## Draaien

Statisch serveren (iframes en opslag willen één origin):

```
cd parselab && python3 -m http.server 8080
```

Open `http://localhost:8080/`. Log in met een e-mailadres; zonder backend start de sessie direct op deze computer (zie hieronder).

## Wat werkt zonder backend, en wat niet

- **Werkt:** alle navigatie, de vier tools in de werkbank, tellers uit de tools, zoeken, ronde-details, Bestanden, Hulp, extensie-detectie, uitloggen.
- **Wacht op een backend** (de UI zegt dat ter plekke): de inloglink echt versturen, Microsoft/Google-login, teamleden, opnieuw downloaden van bestanden, delen als link, AI-herkenning in ParsePDF (`window.PARSELAB_API`, standaard `/api/parsepdf/detect`), scrapen van openbare websites vanuit het dashboard.
- **Wacht op een Web Store-vermelding:** vul `CONFIG.webstoreUrl` in `index.html` in; tot die tijd toont het installatiepaneel de IT-route met de zip.

## Koppelingen tussen dashboard en tools

Alles loopt via `postMessage`; de tools lezen geen opslag van het dashboard en andersom alleen als terugval.

| Bericht | Richting | Betekenis |
|---|---|---|
| `{ source:"parselab-dashboard", type:"parselab:nav", section }` | dashboard → tool | Ga naar deze sectie (bijv. `check`, `3`). |
| `{ source:"parselab-dashboard", type:"parselab:lang", lang }` | dashboard → tool | Volg de taal van het dashboard. |
| `{ source:"parselab-tool", type:"parselab:section", section, max? }` | tool → dashboard | De tool staat nu op deze sectie; `max` = hoogste bereikbare stap. |
| `{ source:"parselab-tool", type:"parselab:stats", tool, … }` | tool → dashboard | Tellers voor zijbalk en kaarten. |
| `{ source:"parselab-tool", type:"parselab:open", view, section }` | tool → dashboard | Open een andere tool (bijv. "Vul hiermee een formulier in"). |
| `{ source:"parselab-extension", type:"parselab:extension", version }` | extensie → dashboard | De extensie is aanwezig in deze browser (via `bridge.js`, alleen op dashboard-origins). |

De iframe heeft een `sandbox`-attribuut (`allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-modals`). Voor productie horen de tools op een eigen subdomein, zodat `allow-same-origin` kan vervallen.
