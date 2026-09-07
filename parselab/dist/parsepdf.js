(function(){var s=document.createElement('style');s.textContent="\n#pl-parsepdf-root{font-family:Poppins,-apple-system,\"Segoe UI\",system-ui,sans-serif;color:#16293F}\n.pld-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:32px}\n.pld-title{margin:0;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-.01em}\n.pld-sub{margin:6px 0 0;color:#4A5A6C;font-size:16px;line-height:1.55}\n.pld-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}\n.pld-card{background:#FFF;color:#16293F;border-radius:20px;padding:28px;box-shadow:0 18px 44px rgba(6,18,35,.10);display:flex;flex-direction:column;gap:12px;min-width:0}\n.pld-card--navy{background:#1F3A5F;color:#F2F0E7;box-shadow:0 24px 60px rgba(6,18,35,.28)}\n.pld-caps{margin:0;font-size:13px;font-weight:500;letter-spacing:.02em;text-transform:uppercase;color:#4A5A6C}\n.pld-card--navy .pld-caps{color:rgba(242,240,231,.82)}\n.pld-num{margin:0;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:-.01em}\n.pld-text{margin:0;color:#4A5A6C;font-size:16px;line-height:1.55}\n.pld-card--navy .pld-text{color:rgba(242,240,231,.82)}\n.pld-pill{display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:600;background:#F2F0E7;color:#16293F;align-self:flex-start}\n.pld-pill--on{background:#DCE8F2;color:#215A88}\n.pld-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:44px;padding:15px 24px;border:0;border-radius:14px;font:600 16px/1 inherit;cursor:pointer;text-decoration:none;background:#1F3A5F;color:#F2F0E7}\n.pld-btn:hover{filter:brightness(1.08)}\n.pld-btn:focus-visible{outline:2px solid #C9A961;outline-offset:3px}\n.pld-btn:disabled{opacity:.6;cursor:default;filter:none}\n.pld-btn--cream{background:#F2F0E7;color:#16293F}\n.pld-btn--ghost{background:transparent;color:#1F3A5F;border:1px solid #1F3A5F}\n.pld-btn--sm{min-height:36px;padding:10px 16px;font-size:14px}\n.pld-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n.pld-msg{margin:0 0 24px;padding:14px 18px;border-radius:14px;font-size:15px;line-height:1.5;background:#DCE8F2;color:#16293F}\n.pld-msg--warn{background:#EDE7D5;color:#16293F;border-left:3px solid #C9A961}\n.pld-bar{height:10px;border-radius:999px;background:#E6E3D8;overflow:hidden}\n.pld-bar>span{display:block;height:100%;background:#2C6FA8;border-radius:999px;transition:width .4s ease-out}\n.pld-bar--hot>span{background:#C9A961}\n.pld-in,.pld-sel{width:100%;min-height:44px;padding:12px 14px;border:1px solid #8A90A5;border-radius:12px;font:15px/1.4 inherit;color:#16293F;background:#FFF}\n.pld-in:focus,.pld-sel:focus{border-color:#2C6FA8;outline:2px solid #C9A961;outline-offset:2px}\n.pld-lbl{display:block;margin:0 0 6px;font-size:13px;font-weight:500;color:#4A5A6C}\n.pld-sect{margin:40px 0 16px}\n.plp-drop{border:2px dashed #8A90A5;border-radius:20px;background:#FFF;color:#16293F;padding:48px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}\n.plp-drop--over{border-color:#2C6FA8;background:#DCE8F2}\n.plp-rule{display:grid;grid-template-columns:1.2fr 1fr 1.6fr 1fr auto;gap:12px;align-items:end}\n.plp-scroll{overflow-x:auto;min-width:0}\n.plp-table{width:100%;border-collapse:collapse;font-size:15px;color:#16293F}\n.plp-table th{text-align:left;padding:0 12px 12px 0;font-size:13px;font-weight:500;letter-spacing:.02em;text-transform:uppercase;color:#4A5A6C;white-space:nowrap}\n.plp-table td{padding:12px 12px 12px 0;border-top:1px solid #E6E3D8;vertical-align:top}\n.plp-table tbody tr:hover{background:#FBFAF6}\n.plp-mono{font-family:\"JetBrains Mono\",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;letter-spacing:.02em;color:#4A5A6C}\n.plp-file{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #E6E3D8}\n.plp-file:first-of-type{border-top:0}\n.plp-skel{height:14px;border-radius:999px;background:#E6E3D8;animation:plp-pulse 1.2s ease-in-out infinite}\n@keyframes plp-pulse{0%,100%{opacity:1}50%{opacity:.5}}\n@media (prefers-reduced-motion:reduce){.plp-skel{animation:none}.pld-bar>span{transition:none}}\n.plp-doorkijk{position:fixed;inset:0;z-index:9999;background:rgba(6,18,35,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px}\n.plp-blad{background:#FBFAF6;border-radius:20px;max-width:1600px;width:100%;padding:28px;display:flex;flex-direction:column;gap:20px;box-shadow:0 24px 60px rgba(6,18,35,.28)}\n.plp-twee{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:24px;align-items:start}\n.plp-twee>div:first-child{position:sticky;top:24px}\n.plp-pagina{position:relative;background:#FFF;border-radius:14px;border:1px solid #E6E3D8;overflow:hidden;line-height:0}\n.plp-pagina canvas{width:100%;height:auto;display:block}\n.plp-vlak{position:absolute;border-radius:3px;background:rgba(44,111,168,.18);border:1px solid rgba(44,111,168,.55);cursor:pointer}\n.plp-vlak--uit{background:rgba(138,144,165,.12);border-color:rgba(138,144,165,.45)}\n.plp-vlak--label{background:rgba(201,169,97,.16);border-color:rgba(201,169,97,.5);cursor:default}\n.plp-vlak:hover,.plp-vlak--warm{background:rgba(44,111,168,.34);border-color:#215A88}\n.plp-label{position:absolute;z-index:4;background:#FFF;border-radius:14px;padding:14px;width:250px;display:flex;flex-direction:column;gap:8px;box-shadow:0 24px 60px rgba(6,18,35,.28);line-height:1.4}\n.plp-label .pld-in{width:100%}\n.plp-tip{position:absolute;z-index:3;background:#1F3A5F;color:#F2F0E7;font-size:13px;line-height:1.3;padding:6px 10px;border-radius:9px;pointer-events:none;white-space:nowrap;transform:translate(-50%,-100%)}\n.plp-mapkies{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n.plp-mapkies>.pld-sel,.plp-mapkies>.pld-in{flex:1 1 220px;min-width:0;width:auto}\n.plp-lijst{display:flex;flex-direction:column;gap:10px;max-height:78vh;overflow:auto}\n.plp-veldrij{display:grid;grid-template-columns:auto minmax(0,1.1fr) minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #E6E3D8}\n.plp-veldrij:first-child{border-top:0}\n.plp-veldrij input[type=checkbox]{width:20px;height:20px;accent-color:#2C6FA8}\n.plp-bron{font-size:13px;color:#4A5A6C;white-space:nowrap}\n.plp-bron--ai{color:#215A88;font-weight:600}\n.plp-modal{position:fixed;inset:0;z-index:10000;background:rgba(6,18,35,.55);display:flex;align-items:center;justify-content:center;padding:24px}\n.plp-modal-blad{background:#FFF;border-radius:20px;max-width:560px;width:100%;padding:28px;display:flex;flex-direction:column;gap:16px;box-shadow:0 24px 60px rgba(6,18,35,.28)}\n.plp-uit{background:transparent;border:0;font:inherit;color:#4A5A6C;cursor:pointer;padding:8px;min-height:44px}\n@media (max-width:991px){.plp-twee{grid-template-columns:1fr}.plp-mapkies{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n.plp-mapkies>.pld-sel,.plp-mapkies>.pld-in{flex:1 1 220px;min-width:0;width:auto}\n.plp-lijst{max-height:none}}\n@media (max-width:767px){.plp-veldrij{grid-template-columns:auto 1fr;row-gap:6px}.plp-blad{padding:20px}}\n@media (max-width:767px){.plp-rule{grid-template-columns:1fr 1fr}.pld-card{padding:24px}}\n@media (max-width:479px){.pld-title{font-size:28px}.pld-num{font-size:26px}.plp-rule{grid-template-columns:1fr}.pld-card{padding:20px}.pld-btn{width:100%}}\n\n";document.head.appendChild(s);})();
/* ParseLab — ParsePDF, gebouwd uit parselab/webflow/. Niet met de hand wijzigen. */
(function(){

/* ---- 2-teksten.html ---- */

window.PLP_T={
nl:{title:"ParsePDF",sub:"Haal velden uit je PDF's met regels die je één keer instelt. Alles gebeurt in je eigen browser; er wordt geen document verstuurd.",
back:"Terug naar dashboard",loading:"Bezig met laden…",
usage:"Verbruik deze maand",of:"van",pages:"pagina's",left:"nog over deze maand",
rules:"Veldregels",rulesHint:"Elke regel wordt één kolom in je tabel. Begin met een sjabloon en pas het aan.",
preset:"Sjabloon",presetInvoice:"Facturen",presetBank:"Bankafschrift",presetBlank:"Leeg",
fname:"Kolomnaam",ftype:"Zoek op",fvalue:"Waarde",ffilter:"Opschonen",
tLabel:"Label in de tekst",tRegex:"Patroon (regex)",tFile:"Bestandsnaam",
xNone:"Niets",xAmount:"Bedrag",xDate:"Datum",
add:"Regel toevoegen",del:"Verwijderen",save:"Regels bewaren",saved:"Regels bewaard in deze browser.",
drop:"Sleep je PDF's hierheen",dropBtn:"Bestanden kiezen",dropHint:"Alleen PDF · maximaal 25 MB per bestand · 100 bestanden per keer",
files:"Gekozen bestanden",clear:"Lijst legen",
start:"Uitlezen starten",counting:"Pagina's tellen…",reading:"Uitlezen…",
results:"Resultaat",download:"Download CSV",csvName:"parselab-export.csv",
colFile:"Bestand",colPages:"Pagina's",
empty:"Nog geen resultaat. Kies je bestanden en start het uitlezen.",
errNoFiles:"Kies eerst een of meer PDF-bestanden.",
errNoRules:"Stel eerst minstens één veldregel in.",
errBig:"is groter dan 25 MB en is overgeslagen.",
errType:"is geen PDF en is overgeslagen.",
errRead:"kon niet worden gelezen. Mogelijk is het bestand beveiligd of beschadigd.",
errLib:"De PDF-motor kon niet worden geladen. Controleer je verbinding en probeer opnieuw.",
errUsage:"Het verbruik kon niet worden bijgewerkt. Probeer het opnieuw.",
limitTitle:"Niet genoeg pagina's over",limitText:"Deze batch is {n} pagina's, je hebt er nog {r} over deze maand. Kies minder bestanden of upgrade je pakket.",
upgrade:"Pakket bekijken",
scanned:"bevat geen tekstlaag. Gescande documenten worden nog niet ondersteund."},

en:{title:"ParsePDF",sub:"Pull fields out of your PDFs with rules you set once. Everything happens in your own browser; no document is uploaded.",
back:"Back to dashboard",loading:"Loading…",
usage:"Usage this month",of:"of",pages:"pages",left:"left this month",
rules:"Field rules",rulesHint:"Each rule becomes one column in your table. Start from a template and adjust it.",
preset:"Template",presetInvoice:"Invoices",presetBank:"Bank statement",presetBlank:"Blank",
fname:"Column name",ftype:"Find by",fvalue:"Value",ffilter:"Clean up",
tLabel:"Label in the text",tRegex:"Pattern (regex)",tFile:"File name",
xNone:"Nothing",xAmount:"Amount",xDate:"Date",
add:"Add rule",del:"Remove",save:"Save rules",saved:"Rules saved in this browser.",
drop:"Drag your PDFs here",dropBtn:"Choose files",dropHint:"PDF only · max 25 MB per file · 100 files at a time",
files:"Selected files",clear:"Clear list",
start:"Start extraction",counting:"Counting pages…",reading:"Extracting…",
results:"Result",download:"Download CSV",csvName:"parselab-export.csv",
colFile:"File",colPages:"Pages",
empty:"No result yet. Choose your files and start the extraction.",
errNoFiles:"Choose one or more PDF files first.",
errNoRules:"Set at least one field rule first.",
errBig:"is larger than 25 MB and was skipped.",
errType:"is not a PDF and was skipped.",
errRead:"could not be read. The file may be protected or damaged.",
errLib:"The PDF engine failed to load. Check your connection and try again.",
errUsage:"Usage could not be updated. Please try again.",
limitTitle:"Not enough pages left",limitText:"This batch is {n} pages and you have {r} left this month. Choose fewer files or upgrade your plan.",
upgrade:"View plans",
scanned:"has no text layer. Scanned documents are not supported yet."},

de:{title:"ParsePDF",sub:"Hole Felder aus deinen PDFs mit Regeln, die du einmal festlegst. Alles läuft in deinem Browser; kein Dokument wird hochgeladen.",
back:"Zurück zum Dashboard",loading:"Wird geladen…",
usage:"Verbrauch diesen Monat",of:"von",pages:"Seiten",left:"diesen Monat übrig",
rules:"Feldregeln",rulesHint:"Jede Regel wird eine Spalte in deiner Tabelle. Beginne mit einer Vorlage und passe sie an.",
preset:"Vorlage",presetInvoice:"Rechnungen",presetBank:"Kontoauszug",presetBlank:"Leer",
fname:"Spaltenname",ftype:"Suchen nach",fvalue:"Wert",ffilter:"Bereinigen",
tLabel:"Label im Text",tRegex:"Muster (Regex)",tFile:"Dateiname",
xNone:"Nichts",xAmount:"Betrag",xDate:"Datum",
add:"Regel hinzufügen",del:"Entfernen",save:"Regeln speichern",saved:"Regeln in diesem Browser gespeichert.",
drop:"Ziehe deine PDFs hierher",dropBtn:"Dateien wählen",dropHint:"Nur PDF · max. 25 MB pro Datei · 100 Dateien pro Durchgang",
files:"Gewählte Dateien",clear:"Liste leeren",
start:"Auslesen starten",counting:"Seiten zählen…",reading:"Wird ausgelesen…",
results:"Ergebnis",download:"CSV herunterladen",csvName:"parselab-export.csv",
colFile:"Datei",colPages:"Seiten",
empty:"Noch kein Ergebnis. Wähle deine Dateien und starte das Auslesen.",
errNoFiles:"Wähle zuerst eine oder mehrere PDF-Dateien.",
errNoRules:"Lege zuerst mindestens eine Feldregel fest.",
errBig:"ist größer als 25 MB und wurde übersprungen.",
errType:"ist keine PDF und wurde übersprungen.",
errRead:"konnte nicht gelesen werden. Die Datei ist möglicherweise geschützt oder beschädigt.",
errLib:"Die PDF-Engine konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
errUsage:"Der Verbrauch konnte nicht aktualisiert werden. Bitte erneut versuchen.",
limitTitle:"Nicht genug Seiten übrig",limitText:"Dieser Stapel hat {n} Seiten, du hast noch {r} übrig. Wähle weniger Dateien oder wechsle das Paket.",
upgrade:"Pakete ansehen",
scanned:"hat keine Textebene. Gescannte Dokumente werden noch nicht unterstützt."}};

window.PLP_PRESETS={
invoice:[{naam:"Factuurnummer",type:"label",waarde:"Factuurnummer",filter:"geen"},
{naam:"Datum",type:"label",waarde:"Factuurdatum",filter:"datum"},
{naam:"Totaal",type:"label",waarde:"Totaal",filter:"bedrag"},
{naam:"BTW",type:"label",waarde:"BTW",filter:"bedrag"},
{naam:"Bestand",type:"bestand",waarde:"",filter:"geen"}],
bank:[{naam:"Rekening",type:"regex",waarde:"[A-Z]{2}\\d{2}[A-Z0-9]{10,}",filter:"geen"},
{naam:"Periode",type:"label",waarde:"Periode",filter:"geen"},
{naam:"Eindsaldo",type:"label",waarde:"Eindsaldo",filter:"bedrag"}],
blank:[{naam:"Veld 1",type:"label",waarde:"",filter:"geen"}]};


/* ---- 3-teksten-voorstel.html ---- */

(function(){var T=window.PLP_T;if(!T)return;
var EXTRA={
nl:{look:"Kijk wat erin staat",lookHint:"De tool opent het document, arceert wat hij kan uitlezen en stelt namen voor. Zweef over een vlak om de naam te zien.",
proposal:"Voorstel",proposalHint:"Dit vond de tool zelf. Vink aan wat je wilt hebben en pas de namen aan.",
fName:"Naam",fValue:"Waarde",source:"Gevonden via",
srcKolomkop:"kolomkop",srcRechts:"label links",srcInline:"label in de cel",srcOnder:"label erboven",srcPatroon:"patroon",srcAi:"AI",
takeOver:"Neem over als veldregels",taken:"Overgenomen. Je kunt nu uitlezen starten.",
withAi:"Uitlezen met AI",aiTitle:"AI mag dit document lezen?",
aiText:"Om te helpen benoemen stuurt ParseLab de tekst van dit ene document naar de eigen server, die het aan het AI-model voorlegt. Het document zelf blijft hier; de tekst wordt niet bewaard. De andere documenten in je lijst gaan niet mee.",
aiYes:"Ja, een keer lezen",aiNo:"Nee, laat maar",
aiBusy:"De AI kijkt mee...",aiOff:"AI-hulp is niet beschikbaar op deze server. Het voorstel komt uit de structuur van het document.",
aiDone:"De AI heeft namen aangevuld en de waarden nagelopen.",
tableFound:"Regeltabel gevonden",tableHint:"{n} regels met {k} kolommen. Zet aan om per regel een rij te maken in plaats van per document.",
tableUse:"Een rij per tabelregel",cancel:"Annuleren",page:"Pagina",noFields:"De tool vond geen velden. Het document heeft mogelijk geen tekstlaag.",
tCel:"Automatisch (uit voorstel)",
folders:"Mappen met sjablonen",foldersHint:"Zet sjablonen bij elkaar per soort document. Bij het uitlezen kiest de tool zelf welk sjabloon bij welk document hoort.",
folder:"Map",newFolder:"Nieuwe map",folderName:"Naam van de map",delFolder:"Map verwijderen",
noFolders:"Nog geen mappen. Maak er een en bewaar je eerste sjabloon vanuit het voorstel.",
noTemplates:"Nog geen sjablonen in deze map. Open een document met \"Kijk wat erin staat\" en bewaar het voorstel hier.",
templates:"Sjablonen in deze map",fields:"velden",used:"keer gebruikt",delTemplate:"Verwijderen",
saveTemplate:"Bewaar als sjabloon",templateName:"Naam van het sjabloon",saveIn:"Bewaren in",
savedTemplate:"Sjabloon bewaard in {map}.",
colTemplate:"Sjabloon",unknown:"onbekend",
recognised:"Herkend: {lijst}",oneUnknown:"1 document paste bij geen enkel sjabloon; die kolommen blijven leeg.",
manyUnknown:"{n} documenten pasten bij geen enkel sjabloon; die kolommen blijven leeg.",
useFolder:"Gebruik de sjablonen uit deze map",useRules:"Gebruik de veldregels hieronder",
showAll:"Toon alle tekst ({n})",hideAll:"Alleen de herkende velden",allHint:"Alles wat in het document staat, plus de gegevens van het bestand zelf. Vink aan wat je wilt en laat de rest staan.",fromFile:"uit het bestand",srcPlek:"plek op de pagina",srcMeta:"bestandsgegeven",srcBestand:"bestandsnaam",
docOf:"Document {i} van {n}",prevDoc:"Vorige",nextDoc:"Volgende",notFound:"niet gevonden",checkHint:"Blader door je documenten en zie per veld of het gevonden wordt.",
aiPlan:"AI-hulp hoort bij Pro en Business",aiPlanText:"Uitlezen met AI draait op onze Claude-tegoeden en zit daarom bij een betaald pakket. Je gratis pakket leest gewoon door op de structuurcheck; die kost niets en werkt op de meeste documenten.",aiUpgrade:"Pakketten bekijken",aiCredits:"Deze controle kostte 1 AI-tegoed."},
en:{look:"See what is in it",lookHint:"The tool opens the document, highlights what it can read and suggests names. Hover a box to see the name.",
proposal:"Proposal",proposalHint:"This is what the tool found by itself. Tick what you want and adjust the names.",
fName:"Name",fValue:"Value",source:"Found via",
srcKolomkop:"column header",srcRechts:"label on the left",srcInline:"label in the cell",srcOnder:"label above",srcPatroon:"pattern",srcAi:"AI",
takeOver:"Use these as field rules",taken:"Taken over. You can start the extraction now.",
withAi:"Extract with AI",aiTitle:"May AI read this document?",
aiText:"To help with naming, ParseLab sends the text of this one document to its own server, which passes it to the AI model. The document itself stays here and the text is not stored. The other documents in your list are not included.",
aiYes:"Yes, read it once",aiNo:"No thanks",
aiBusy:"The AI is having a look...",aiOff:"AI help is not available on this server. The proposal comes from the structure of the document.",
aiDone:"The AI added names and checked the values.",
tableFound:"Line table found",tableHint:"{n} lines with {k} columns. Turn on to make one row per line instead of one per document.",
tableUse:"One row per table line",cancel:"Cancel",page:"Page",noFields:"The tool found no fields. The document may have no text layer.",
tCel:"Automatic (from proposal)",
folders:"Folders with templates",foldersHint:"Group templates by kind of document. When extracting, the tool picks the matching template per document itself.",
folder:"Folder",newFolder:"New folder",folderName:"Folder name",delFolder:"Delete folder",
noFolders:"No folders yet. Create one and save your first template from the proposal.",
noTemplates:"No templates in this folder yet. Open a document with \"See what is in it\" and save the proposal here.",
templates:"Templates in this folder",fields:"fields",used:"times used",delTemplate:"Remove",
saveTemplate:"Save as template",templateName:"Template name",saveIn:"Save in",
savedTemplate:"Template saved in {map}.",
colTemplate:"Template",unknown:"unknown",
recognised:"Recognised: {lijst}",oneUnknown:"1 document matched no template; those columns stay empty.",
manyUnknown:"{n} documents matched no template; those columns stay empty.",
useFolder:"Use the templates in this folder",useRules:"Use the field rules below",
showAll:"Show all text ({n})",hideAll:"Only the recognised fields",allHint:"Everything in the document, plus the details of the file itself. Tick what you want and leave the rest.",fromFile:"from the file",srcPlek:"place on the page",srcMeta:"file detail",srcBestand:"file name",
docOf:"Document {i} of {n}",prevDoc:"Previous",nextDoc:"Next",notFound:"not found",checkHint:"Page through your documents and see per field whether it is found.",
aiPlan:"AI help is part of Pro and Business",aiPlanText:"Extracting with AI runs on our Claude credits and is therefore part of a paid plan. Your free plan keeps working on the structure check; that costs nothing and handles most documents.",aiUpgrade:"View plans",aiCredits:"This check used 1 AI credit."},
de:{look:"Sieh nach, was drinsteht",lookHint:"Das Werkzeug oeffnet das Dokument, hebt hervor was es lesen kann und schlaegt Namen vor. Fahre ueber ein Feld, um den Namen zu sehen.",
proposal:"Vorschlag",proposalHint:"Das hat das Werkzeug selbst gefunden. Hake an, was du willst, und passe die Namen an.",
fName:"Name",fValue:"Wert",source:"Gefunden ueber",
srcKolomkop:"Spaltenkopf",srcRechts:"Label links",srcInline:"Label in der Zelle",srcOnder:"Label darueber",srcPatroon:"Muster",srcAi:"KI",
takeOver:"Als Feldregeln uebernehmen",taken:"Uebernommen. Du kannst jetzt auslesen.",
withAi:"Mit KI auslesen",aiTitle:"Darf die KI dieses Dokument lesen?",
aiText:"Zum Benennen schickt ParseLab den Text dieses einen Dokuments an den eigenen Server, der ihn dem KI-Modell vorlegt. Das Dokument selbst bleibt hier, der Text wird nicht gespeichert. Die anderen Dokumente in deiner Liste gehen nicht mit.",
aiYes:"Ja, einmal lesen",aiNo:"Nein, danke",
aiBusy:"Die KI schaut mit...",aiOff:"KI-Hilfe ist auf diesem Server nicht verfuegbar. Der Vorschlag kommt aus der Struktur des Dokuments.",
aiDone:"Die KI hat Namen ergaenzt und die Werte geprueft.",
tableFound:"Positionstabelle gefunden",tableHint:"{n} Zeilen mit {k} Spalten. Einschalten, um eine Zeile pro Position statt pro Dokument zu erzeugen.",
tableUse:"Eine Zeile pro Tabellenzeile",cancel:"Abbrechen",page:"Seite",noFields:"Das Werkzeug hat keine Felder gefunden. Das Dokument hat vielleicht keine Textebene.",
tCel:"Automatisch (aus dem Vorschlag)",
folders:"Ordner mit Vorlagen",foldersHint:"Fasse Vorlagen je Dokumentart zusammen. Beim Auslesen waehlt das Werkzeug selbst die passende Vorlage pro Dokument.",
folder:"Ordner",newFolder:"Neuer Ordner",folderName:"Name des Ordners",delFolder:"Ordner loeschen",
noFolders:"Noch keine Ordner. Lege einen an und speichere deine erste Vorlage aus dem Vorschlag.",
noTemplates:"Noch keine Vorlagen in diesem Ordner. Oeffne ein Dokument mit \"Sieh nach, was drinsteht\" und speichere den Vorschlag hier.",
templates:"Vorlagen in diesem Ordner",fields:"Felder",used:"mal benutzt",delTemplate:"Entfernen",
saveTemplate:"Als Vorlage speichern",templateName:"Name der Vorlage",saveIn:"Speichern in",
savedTemplate:"Vorlage in {map} gespeichert.",
colTemplate:"Vorlage",unknown:"unbekannt",
recognised:"Erkannt: {lijst}",oneUnknown:"1 Dokument passte zu keiner Vorlage; diese Spalten bleiben leer.",
manyUnknown:"{n} Dokumente passten zu keiner Vorlage; diese Spalten bleiben leer.",
useFolder:"Die Vorlagen aus diesem Ordner verwenden",useRules:"Die Feldregeln unten verwenden",
showAll:"Allen Text zeigen ({n})",hideAll:"Nur die erkannten Felder",allHint:"Alles im Dokument, dazu die Angaben der Datei selbst. Hake an, was du willst, und lass den Rest stehen.",fromFile:"aus der Datei",srcPlek:"Stelle auf der Seite",srcMeta:"Dateiangabe",srcBestand:"Dateiname",
docOf:"Dokument {i} von {n}",prevDoc:"Zurueck",nextDoc:"Weiter",notFound:"nicht gefunden",checkHint:"Blaettere durch deine Dokumente und sieh pro Feld, ob es gefunden wird.",
aiPlan:"KI-Hilfe gehoert zu Pro und Business",aiPlanText:"Auslesen mit KI laeuft ueber unsere Claude-Guthaben und gehoert deshalb zu einem bezahlten Paket. Dein kostenloses Paket arbeitet weiter mit der Strukturpruefung; die kostet nichts und reicht fuer die meisten Dokumente.",aiUpgrade:"Pakete ansehen",aiCredits:"Diese Pruefung hat 1 KI-Guthaben gekostet."}
};
Object.keys(EXTRA).forEach(function(taal){
  if(!T[taal])return;
  Object.keys(EXTRA[taal]).forEach(function(k){T[taal][k]=EXTRA[taal][k];});
});
})();


/* ---- 4-motor.html ---- */

window.PLP=(function(){
var LIB="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
var WORKER="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
var MAXBYTES=25*1024*1024, MAXFILES=100;
var laden=null;

function motor(){
  if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=WORKER;return Promise.resolve(window.pdfjsLib);}
  if(laden)return laden;
  laden=new Promise(function(ok,fout){
    var s=document.createElement("script");s.src=LIB;s.async=true;
    s.onload=function(){
      if(!window.pdfjsLib){fout(new Error("pdfjs"));return;}
      window.pdfjsLib.GlobalWorkerOptions.workerSrc=WORKER;ok(window.pdfjsLib);
    };
    s.onerror=function(){laden=null;fout(new Error("pdfjs"));};
    document.head.appendChild(s);
  });
  return laden;
}

function buffer(file){
  return new Promise(function(ok,fout){
    var r=new FileReader();
    r.onload=function(){ok(r.result);};
    r.onerror=function(){fout(new Error("read"));};
    r.readAsArrayBuffer(file);
  });
}

function open(file){
  return motor().then(function(pdfjs){
    return buffer(file).then(function(buf){
      return pdfjs.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;
    });
  });
}

// Alleen het aantal pagina's, om vooraf tegen de limiet te kunnen toetsen.
function tel(file){
  return open(file).then(function(doc){var n=doc.numPages;doc.destroy();return n;});
}

// Tekstfragmenten terugbrengen tot leesbare regels: groeperen op hoogte, sorteren op x.
function regels(tc){
  var rijen={};
  tc.items.forEach(function(it){
    if(!it.str||!it.str.trim())return;
    var y=Math.round(it.transform[5]/2)*2;
    (rijen[y]=rijen[y]||[]).push({x:it.transform[4],s:it.str});
  });
  return Object.keys(rijen).map(Number).sort(function(a,b){return b-a;}).map(function(y){
    return rijen[y].sort(function(a,b){return a.x-b.x;}).map(function(o){return o.s;})
      .join(" ").replace(/\s+/g," ").trim();
  }).filter(Boolean);
}

// Tekstfragmenten worden cellen: fragmenten die tegen elkaar aan staan horen bij
// elkaar, een gat zo breed als een spatie betekent een nieuwe cel. Zo blijven twee
// kolommen naast elkaar ook twee cellen, in plaats van één lange regel.
function cellen(tc,pagina){
  var los=[];
  tc.items.forEach(function(it){
    if(!it.str||!it.str.trim())return;
    var h=Math.abs(it.height)||Math.abs(it.transform[3])||10;
    los.push({t:it.str,x:it.transform[4],y:it.transform[5],b:it.width||0,h:h});
  });
  if(!los.length)return [];
  var tol=Math.max(2,los.reduce(function(a,c){return a+c.h;},0)/los.length*0.5);
  var rijen=[];
  los.sort(function(a,b){return b.y-a.y||a.x-b.x;}).forEach(function(c){
    var r=rijen[rijen.length-1];
    if(r&&Math.abs(r.y-c.y)<=tol){r.cellen.push(c);r.y=(r.y+c.y)/2;}
    else rijen.push({y:c.y,cellen:[c]});
  });
  var uit=[];
  rijen.forEach(function(r,ri){
    r.cellen.sort(function(a,b){return a.x-b.x;});
    var open=null;
    r.cellen.forEach(function(c){
      var gat=open?c.x-(open.x+open.b):0;
      if(open&&gat<Math.max(1.5,open.h*0.4)){
        open.t+=(gat>open.h*0.12?" ":"")+c.t;open.b=c.x+c.b-open.x;open.h=Math.max(open.h,c.h);
      }else{
        if(open)uit.push(open);
        open={t:c.t,x:c.x,y:c.y,b:c.b,h:c.h,rij:ri,pagina:pagina};
      }
    });
    if(open)uit.push(open);
  });
  return uit.map(function(c){c.t=c.t.replace(/\s+/g," ").trim();return c;}).filter(function(c){return c.t;});
}

function lees(file){
  return open(file).then(function(doc){
    var uit=[],alleCellen=[],maten=[],meta=null,keten=doc.getMetadata().then(function(m){
      var i=(m&&m.info)||{};
      meta={Titel:i.Title||"",Auteur:i.Author||"",Onderwerp:i.Subject||"",Trefwoorden:i.Keywords||"",
            Programma:i.Producer||i.Creator||"",Gemaakt:datumUitPdf(i.CreationDate)};
    }).catch(function(){meta={};});
    for(var i=1;i<=doc.numPages;i++){
      (function(p){
        keten=keten.then(function(){return doc.getPage(p);})
                   .then(function(pg){
                     var v=pg.getViewport({scale:1});
                     maten[p-1]={breed:v.width,hoog:v.height};
                     return pg.getTextContent();
                   })
                   .then(function(tc){
                     uit.push(regels(tc));
                     alleCellen.push(cellen(tc,p-1));
                   });
      })(i);
    }
    return keten.then(function(){
      var alle=[].concat.apply([],uit);
      doc.destroy();
      return {naam:file.naam||file.name,paginas:uit.length,regels:alle,tekst:alle.join("\n"),
              cellen:[].concat.apply([],alleCellen),maten:maten,meta:meta||{},
              grootte:file.size||0,gewijzigd:file.lastModified?new Date(file.lastModified):null};
    });
  });
}

function esc(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}

// PDF-datums staan als D:20260321143000+02'00'; daar maken we 21-03-2026 van.
function datumUitPdf(d){
  var m=String(d||"").match(/^D:(\d{4})(\d{2})(\d{2})/);
  return m?m[3]+"-"+m[2]+"-"+m[1]:"";
}

var BEDRAG=/-?(?:€\s*)?\d{1,3}(?:[.\s]\d{3})*,\d{2}|-?\d+[.,]\d{2}/;
var DATUM=/\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}|\d{1,2}\s+(?:jan|feb|mrt|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?\s+\d{4}/i;

function schoon(waarde,filter){
  if(!waarde)return "";
  if(filter==="bedrag"){var m=String(waarde).match(BEDRAG);return m?m[0].replace(/€\s*/,"").trim():"";}
  if(filter==="datum"){var d=String(waarde).match(DATUM);return d?d[0].trim():"";}
  return String(waarde).trim();
}

function pasToe(regel,doc){
  if(regel.type==="bestand")return doc.naam;
  // Uit het voorstel: de vindregel weet zelf waar de waarde staat.
  if(regel.type==="cel")return window.PLP_ST?schoon(window.PLP_ST.pas(doc,regel.vindregel),regel.filter):"";
  if(regel.type==="regex"){
    if(!regel.waarde)return "";
    var re;try{re=new RegExp(regel.waarde,"i");}catch(e){return "";}
    var m=doc.tekst.match(re);
    if(!m)return "";
    return schoon(m[1]!==undefined?m[1]:m[0],regel.filter);
  }
  if(regel.type==="label"){
    if(!regel.waarde)return "";
    var lab=esc(regel.waarde), teken="A-Za-z0-9\u00C0-\u024F", grens="(?!["+teken+"])";
    // Eerst regels die met het label beginnen, daarna het label ergens op de regel.
    // Voor en achter het label moet een woordgrens staan, anders pakt "Totaal" ook "Subtotaal".
    var patronen=[
      new RegExp("^\\s*"+lab+grens+"\\s*[:\\-–]?\\s*(.*)","i"),
      new RegExp("(?:^|[^"+teken+"])"+lab+grens+"\\s*[:\\-–]?\\s*(.*)","i")
    ];
    for(var p=0;p<patronen.length;p++){
      for(var i=0;i<doc.regels.length;i++){
        var t=doc.regels[i].match(patronen[p]);
        if(!t)continue;
        var rest=(t[1]||"").trim();
        // Staat er achter het label niets bruikbaars (bijvoorbeeld "BTW 21%" of
        // "Totaal te voldoen"), kijk dan op de regel eronder.
        var w=schoon(rest,regel.filter);
        if(!w)w=schoon((doc.regels[i+1]||"").trim(),regel.filter);
        if(w)return w;
      }
    }
    return "";
  }
  return "";
}

function rij(doc,regelset){
  var velden={};
  regelset.forEach(function(r,i){velden["k"+i]=pasToe(r,doc);});
  return {naam:doc.naam,paginas:doc.paginas,velden:velden,leeg:doc.regels.length===0};
}

function csv(regelset,rijen,kopBestand,kopPaginas){
  var S=";";
  function cel(v){v=v==null?"":String(v);return /[";\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
  var uit=[[kopBestand,kopPaginas].concat(regelset.map(function(r){return r.naam;})).map(cel).join(S)];
  rijen.forEach(function(r){
    uit.push([r.naam,r.paginas].concat(regelset.map(function(x,i){return r.velden["k"+i];})).map(cel).join(S));
  });
  return "﻿"+uit.join("\r\n");
}

function bewaar(naam,tekst){
  var blob=new Blob([tekst],{type:"text/csv;charset=utf-8;"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");a.href=url;a.download=naam;a.style.display="none";
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);a.remove();},0);
}

return {tel:tel,lees:lees,rij:rij,csv:csv,bewaar:bewaar,open:open,motor:motor,MAXBYTES:MAXBYTES,MAXFILES:MAXFILES};
})();


/* ---- 4b-ocr.html ---- */

(function(){
var P=window.PLP;if(!P)return;
var open=P.open;
// Tekstherkenning voor documenten zonder tekstlaag. Draait ook in de browser: de
// pagina wordt getekend en tesseract.js leest er woorden uit, met hun plek.
var OCRLIB="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js";
var ocrLaden=null;
function ocrMotor(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(ocrLaden)return ocrLaden;
  ocrLaden=new Promise(function(ok,fout){
    var s=document.createElement("script");s.src=OCRLIB;s.async=true;
    s.onload=function(){window.Tesseract?ok(window.Tesseract):fout(new Error("ocr"));};
    s.onerror=function(){ocrLaden=null;fout(new Error("ocr"));};
    document.head.appendChild(s);
  });
  return ocrLaden;
}
function ocr(file,melden){
  return Promise.all([open(file),ocrMotor()]).then(function(paar){
    var pdf=paar[0],T=paar[1],uit=[],keten=Promise.resolve(),maten=[];
    for(var i=1;i<=Math.min(pdf.numPages,10);i++)(function(nr){
      keten=keten.then(function(){return pdf.getPage(nr);}).then(function(pg){
        var vp=pg.getViewport({scale:2});                 // groter tekenen leest beter
        var doek=document.createElement("canvas");
        doek.width=vp.width;doek.height=vp.height;
        maten[nr-1]={breed:vp.width/2,hoog:vp.height/2};
        if(melden)melden(nr,Math.min(pdf.numPages,10));
        return pg.render({canvasContext:doek.getContext("2d"),viewport:vp}).promise.then(function(){
          return T.recognize(doek,"nld+eng");
        }).then(function(res){
          ((res&&res.data&&res.data.words)||[]).forEach(function(w){
            if(!w.text||!w.text.trim()||(w.confidence||0)<40)return;
            var b=w.bbox||{};
            // top is hier bekend uit het woordvak zelf; de weergave gebruikt dat rechtstreeks.
            uit.push({t:w.text.trim(),x:b.x0/2,y:maten[nr-1].hoog-b.y1/2,top:b.y0/2,
                      b:(b.x1-b.x0)/2,h:(b.y1-b.y0)/2,rij:Math.round((maten[nr-1].hoog-b.y1/2)/-6),pagina:nr-1});
          });
        });
      });
    })(i);
    return keten.then(function(){
      pdf.destroy();
      // Woorden op dezelfde hoogte worden weer cellen, net als bij een tekstlaag.
      uit.sort(function(a,b){return a.pagina-b.pagina||b.y-a.y||a.x-b.x;});
      var cellen=[],open2=null,rij=0,vorigeY=null,vorigePagina=-1;
      uit.forEach(function(w){
        if(vorigeY===null||w.pagina!==vorigePagina||Math.abs(w.y-vorigeY)>w.h*0.6){
          if(open2)cellen.push(open2);
          open2=null;rij++;vorigeY=w.y;vorigePagina=w.pagina;
        }
        if(open2&&w.x-(open2.x+open2.b)<Math.max(3,open2.h*0.6)){
          open2.t+=" "+w.t;open2.b=w.x+w.b-open2.x;
        }else{
          if(open2)cellen.push(open2);
          open2={t:w.t,x:w.x,y:w.y,top:w.top,b:w.b,h:w.h,rij:rij,pagina:w.pagina};
        }
      });
      if(open2)cellen.push(open2);
      return {cellen:cellen,maten:maten,paginas:maten.length};
    });
  });
}
P.ocr=ocr;
})();


/* ---- 5-scherm.html ---- */

window.PLP_S={regels:[],bestanden:[],rijen:[],kolommen:null,verbruik:null,taal:"nl",t:null,root:null};
window.PLP_UI=(function(){
var S=window.PLP_S,P=window.PLP,CFG=window.PARSELAB;
var LOC={nl:"nl-NL",en:"en-GB",de:"de-DE"};
function el(a,b,c){var n=document.createElement(a);if(b)n.className=b;if(c!=null)n.textContent=c;return n;}
function nr(n){return Number(n||0).toLocaleString(LOC[S.taal]||"nl-NL");}
function veld(l,i){var w=el("div");w.appendChild(el("label","pld-lbl",l));w.appendChild(i);return w;}
function melding(tekst,soort){var p=el("p","pld-msg"+(soort==="warn"?" pld-msg--warn":""),tekst);p.setAttribute("role",soort==="warn"?"alert":"status");return p;}
function meld(tekst,soort){S.root.insertBefore(melding(tekst,soort),S.root.firstChild);window.scrollTo({top:0,behavior:"smooth"});}
function over(){if(!S.verbruik)return Infinity;return Math.max(0,Number(S.verbruik.monthly_limit||0)-Number(S.verbruik.used||0));}
function bewaarRegels(){try{localStorage.setItem("pl_parsepdf_regels",JSON.stringify(S.regels));}catch(e){}}
function laadRegels(){try{var r=JSON.parse(localStorage.getItem("pl_parsepdf_regels")||"null");if(r&&r.length)return r;}catch(e){}
return JSON.parse(JSON.stringify(window.PLP_PRESETS.invoice));}

function teken(){
var t=S.t,root=S.root;root.innerHTML="";
var kop=el("div","pld-head"),links=el("div");
links.appendChild(el("h1","pld-title",t.title));
links.appendChild(el("p","pld-sub",t.sub));
kop.appendChild(links);
var knoppen=el("div","pld-row");
if(window.PLP_TOUR){
  var uitleg=el("button","pld-btn pld-btn--ghost",window.PLP_TOUR.titel());uitleg.type="button";
  uitleg.addEventListener("click",window.PLP_TOUR.toon);
  knoppen.appendChild(uitleg);
}
var terug=el("a","pld-btn pld-btn--ghost",t.back);terug.href=CFG.dashboardPath;
knoppen.appendChild(terug);
kop.appendChild(knoppen);root.appendChild(kop);
if(S.verbruik){
var vk=el("div","pld-card");
vk.appendChild(el("p","pld-caps",t.usage));
var lim=Number(S.verbruik.monthly_limit||0),gebr=Number(S.verbruik.used||0);
var pct=lim?Math.min(100,Math.round(gebr/lim*100)):0;
vk.appendChild(el("p","pld-num",nr(gebr)+" "+t.of+" "+nr(lim)));
var bar=el("div","pld-bar"+(pct>=80?" pld-bar--hot":""));
bar.setAttribute("role","progressbar");bar.setAttribute("aria-valuemin","0");
bar.setAttribute("aria-valuemax",String(lim));bar.setAttribute("aria-valuenow",String(gebr));
var vul=el("span");vul.style.width=pct+"%";bar.appendChild(vul);vk.appendChild(bar);
vk.appendChild(el("p","pld-text",nr(over())+" "+t.pages+" "+t.left));
root.appendChild(vk);}
if(window.PLP_SJ&&window.PLP_SJ.kaart){
root.appendChild(el("p","pld-caps pld-sect",t.folders));
root.appendChild(window.PLP_SJ.kaart());}
root.appendChild(el("p","pld-caps pld-sect",t.rules));
root.appendChild(regelKaart());
root.appendChild(el("p","pld-caps pld-sect",t.files));
root.appendChild(bestandKaart());
root.appendChild(el("p","pld-caps pld-sect",t.results));
root.appendChild(resultaatKaart());
}

function regelKaart(){
var t=S.t,k=el("div","pld-card");
k.appendChild(el("p","pld-text",t.rulesHint));
var kies=el("select","pld-sel");
[["","— "+t.preset+" —"],["invoice",t.presetInvoice],["bank",t.presetBank],["blank",t.presetBlank]]
.forEach(function(o){var op=el("option","",o[1]);op.value=o[0];kies.appendChild(op);});
kies.addEventListener("change",function(){var p=window.PLP_PRESETS[kies.value];if(!p)return;
S.regels=JSON.parse(JSON.stringify(p));bewaarRegels();teken();});
k.appendChild(veld(t.preset,kies));
S.regels.forEach(function(r,i){
var rij=el("div","plp-rule");
var naam=el("input","pld-in");naam.value=r.naam||"";
naam.addEventListener("input",function(){r.naam=naam.value;});
var type=el("select","pld-sel");
[["label",t.tLabel],["regex",t.tRegex],["bestand",t.tFile],["cel",t.tCel]].forEach(function(o){
var op=el("option","",o[1]);op.value=o[0];if(o[0]===r.type)op.selected=true;type.appendChild(op);});
var waarde=el("input","pld-in");waarde.value=r.waarde||"";waarde.disabled=r.type==="bestand"||r.type==="cel";
waarde.addEventListener("input",function(){r.waarde=waarde.value;});
type.addEventListener("change",function(){r.type=type.value;waarde.disabled=r.type==="bestand"||r.type==="cel";if(r.type!=="cel")delete r.vindregel;});
var filter=el("select","pld-sel");
[["geen",t.xNone],["bedrag",t.xAmount],["datum",t.xDate]].forEach(function(o){
var op=el("option","",o[1]);op.value=o[0];if(o[0]===r.filter)op.selected=true;filter.appendChild(op);});
filter.addEventListener("change",function(){r.filter=filter.value;});
var weg=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.del);weg.type="button";
weg.addEventListener("click",function(){S.regels.splice(i,1);bewaarRegels();teken();});
rij.appendChild(veld(t.fname,naam));rij.appendChild(veld(t.ftype,type));
rij.appendChild(veld(t.fvalue,waarde));rij.appendChild(veld(t.ffilter,filter));
rij.appendChild(weg);k.appendChild(rij);});
var rij2=el("div","pld-row");
var plus=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.add);plus.type="button";
plus.addEventListener("click",function(){S.regels.push({naam:"",type:"label",waarde:"",filter:"geen"});bewaarRegels();teken();});
var opslaan=el("button","pld-btn pld-btn--sm",t.save);opslaan.type="button";
var gemeld=el("p","pld-text");
opslaan.addEventListener("click",function(){bewaarRegels();gemeld.textContent=t.saved;});
rij2.appendChild(plus);rij2.appendChild(opslaan);rij2.appendChild(gemeld);
k.appendChild(rij2);return k;}

function bestandKaart(){
var t=S.t,k=el("div","pld-card");
var zone=el("div","plp-drop");
zone.appendChild(el("p","pld-num",t.drop));
var invoer=document.createElement("input");
invoer.type="file";invoer.accept="application/pdf,.pdf";invoer.multiple=true;
invoer.style.cssText="position:absolute;width:1px;height:1px;opacity:0";
var knop=el("button","pld-btn",t.dropBtn);knop.type="button";
knop.addEventListener("click",function(){invoer.click();});
invoer.addEventListener("change",function(){voegToe(invoer.files);invoer.value="";});
zone.appendChild(knop);zone.appendChild(invoer);
zone.appendChild(el("p","pld-text",t.dropHint));
["dragenter","dragover"].forEach(function(e){zone.addEventListener(e,function(ev){ev.preventDefault();zone.classList.add("plp-drop--over");});});
["dragleave","drop"].forEach(function(e){zone.addEventListener(e,function(ev){ev.preventDefault();zone.classList.remove("plp-drop--over");});});
zone.addEventListener("drop",function(ev){if(ev.dataTransfer&&ev.dataTransfer.files)voegToe(ev.dataTransfer.files);});
k.appendChild(zone);
if(S.bestanden.length){
S.bestanden.forEach(function(f,i){
var r=el("div","plp-file"),l=el("div");
l.appendChild(el("p","pld-text",f.name));
l.appendChild(el("p","plp-mono",(f.size/1048576).toFixed(1)+" MB"));
var knoppen=el("div","pld-row");
var kijk=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.look);kijk.type="button";
kijk.addEventListener("click",function(){if(window.PLP_V)window.PLP_V.open(S.bestanden,i);});
var w=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.del);w.type="button";
w.addEventListener("click",function(){S.bestanden.splice(i,1);teken();});
knoppen.appendChild(kijk);knoppen.appendChild(w);
r.appendChild(l);r.appendChild(knoppen);k.appendChild(r);});
var rij=el("div","pld-row");
var start=el("button","pld-btn",t.start);start.type="button";
start.addEventListener("click",function(){if(window.PLP_RUN)window.PLP_RUN(start,rij);});
var leeg=el("button","pld-btn pld-btn--ghost",t.clear);leeg.type="button";
leeg.addEventListener("click",function(){S.bestanden=[];teken();});
rij.appendChild(start);rij.appendChild(leeg);k.appendChild(rij);}
return k;}

function voegToe(lijst){
var t=S.t,fouten=[],begin=S.bestanden.length;
Array.prototype.slice.call(lijst).forEach(function(f){
if(S.bestanden.length>=P.MAXFILES)return;
if(!(/\.pdf$/i.test(f.name)||f.type==="application/pdf")){fouten.push(f.name+" "+t.errType);return;}
if(f.size>P.MAXBYTES){fouten.push(f.name+" "+t.errBig);return;}
S.bestanden.push(f);});
teken();
if(fouten.length)meld(fouten.join(" "),"warn");
// Meteen laten zien wat er in het eerste document staat; wachten op een knop hoeft niet.
if(S.bestanden.length>begin&&window.PLP_V&&!document.querySelector(".plp-doorkijk"))
  window.PLP_V.open(S.bestanden,begin);}

function resultaatKaart(){
var t=S.t,k=el("div","pld-card"),kol=(S.kolommen&&S.kolommen.length)?S.kolommen:S.regels;
if(!S.rijen.length){k.appendChild(el("p","pld-text",t.empty));return k;}
var wrap=el("div","plp-scroll"),tab=el("table","plp-table"),thead=el("thead"),tr=el("tr");
[t.colFile,t.colPages].concat(kol.map(function(r){return r.naam||"—";}))
.forEach(function(h){tr.appendChild(el("th","",h));});
thead.appendChild(tr);tab.appendChild(thead);
var tb=el("tbody");
S.rijen.forEach(function(r){
var row=el("tr");
row.appendChild(el("td","",r.naam));
row.appendChild(el("td","plp-mono",String(r.paginas)));
kol.forEach(function(x,i){
row.appendChild(el("td",(x.filter==="bedrag"||x.filter==="datum")?"plp-mono":"",r.velden["k"+i]||"—"));});
tb.appendChild(row);});
tab.appendChild(tb);wrap.appendChild(tab);k.appendChild(wrap);
var dl=el("button","pld-btn",t.download);dl.type="button";
dl.addEventListener("click",function(){P.bewaar(t.csvName,P.csv(kol,S.rijen,t.colFile,t.colPages));});
k.appendChild(dl);return k;}

function limietKaart(n,r){
var t=S.t,k=el("div","pld-card pld-card--navy");
k.appendChild(el("p","pld-caps",t.limitTitle));
k.appendChild(el("p","pld-text",t.limitText.replace("{n}",nr(n)).replace("{r}",nr(r))));
var a=el("a","pld-btn pld-btn--cream",t.upgrade);a.href=CFG.dashboardPath;
k.appendChild(a);k.style.marginBottom="24px";return k;}

return {el:el,nr:nr,teken:teken,meld:meld,over:over,laadRegels:laadRegels,limietKaart:limietKaart};
})();


/* ---- 6-structuur.html ---- */


window.PLP_ST=(function(){
// Patronen die zichzelf verraden. "sterk": mag ook zonder label een veld worden.
var PAT=[
{naam:"iban",toon:"Rekeningnummer",sterk:true,re:"[A-Z]{2}\\d{2} ?(?:[A-Z0-9]{4} ?){2,7}[A-Z0-9]{1,4}"},
{naam:"btwnl",toon:"Btw-nummer",sterk:true,re:"NL ?\\d{9} ?B ?\\d{2}"},
{naam:"kvk",toon:"KvK-nummer",sterk:true,re:"\\d{8}(?![\\d-])"},
{naam:"email",toon:"E-mailadres",sterk:true,re:"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"},
{naam:"url",toon:"Website",sterk:true,re:"(?:https?://|www\\.)[A-Za-z0-9.-]+\\.[A-Za-z]{2,}(?:/\\S*)?"},
{naam:"telefoon",toon:"Telefoonnummer",sterk:true,re:"(?:\\+31|0)[\\s-]?\\d(?:[\\s-]?\\d){7,9}"},
{naam:"postcode",toon:"Postcode",sterk:true,re:"\\d{4} ?[A-Z]{2}(?![A-Za-z0-9])"},
{naam:"bedrag",toon:"Bedrag",sterk:false,re:"-?\\u20AC ?-?\\d{1,3}(?:[.\\s]\\d{3})*,\\d{2}|-?\\d{1,3}(?:[.\\s]\\d{3})*,\\d{2}|-?\\u20AC ?\\d+[.,]\\d{2}"},
{naam:"datum",toon:"Datum",sterk:false,re:"\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2} (?:jan|feb|mrt|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\\.? \\d{4}"},
{naam:"percentage",toon:"Percentage",sterk:false,re:"\\d{1,3}(?:[.,]\\d{1,2})? ?%"},
{naam:"kenmerk",toon:"Kenmerk",sterk:false,re:"[A-Za-z]{0,6}[-/]?\\d{4,}(?:[-/][A-Za-z0-9]+)*"}
];
function re(p,heel){return new RegExp((heel?"^(?:":"")+p.re+(heel?")$":""),"i");}
function vind(t){for(var i=0;i<PAT.length;i++){var m=String(t).match(re(PAT[i]));if(m)return {patroon:PAT[i],waarde:m[0]};}return null;}
function isWaarde(t){var v=vind(t);return !!v;}

// Een label is kort, begint met een hoofdletter of eindigt op een dubbele punt,
// en is zelf geen waarde.
function labelachtig(t){
  t=String(t).trim();
  if(!t||t.length>36)return false;
  if(t.split(/\s+/).length>4)return false;
  if(/^[\d\W]+$/.test(t))return false;
  var v=vind(t);
  if(v&&v.waarde.length>=t.length-1)return false;
  return /^[A-Z\u00C0-\u017F]/.test(t)||/:$/.test(t);
}
function schoonLabel(t){return String(t).replace(/[\s:\-–]+$/,"").trim();}
function overlapt(a,b){return a.x<b.x+b.b+2&&b.x<a.x+a.b+2;}
// Een waarde mag op een label lijken zolang er iets herkenbaars in staat.
function bruikbaar(t){return !labelachtig(t)||!!vind(t);}
// Een cel met label én waarde erin ("IBAN NL71 …") hoort niet bij het label erboven.
function eigenPaar(t){
  for(var i=0;i<PAT.length;i++){
    // kenmerk en percentage zijn te gretig om een cel op te knippen.
    if(!PAT[i].sterk&&PAT[i].naam!=="bedrag")continue;
    var m=String(t).match(new RegExp("^(.{2,36}?)[\\s:\\-–]+("+PAT[i].re+")$","i"));
    if(m&&labelachtig(schoonLabel(m[1]))&&!STOP.test(schoonLabel(m[1])))return true;
  }
  return false;
}
// Woorden die nooit een veldnaam zijn.
var STOP=/^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|van|tot|per|nr|blad|pagina)$/i;

function perRij(cellen){
  var rijen={};
  cellen.forEach(function(c){var k=c.pagina+":"+c.rij;(rijen[k]=rijen[k]||[]).push(c);});
  return Object.keys(rijen).sort(function(a,b){
    var A=a.split(":").map(Number),B=b.split(":").map(Number);return A[0]-B[0]||A[1]-B[1];
  }).map(function(k){return rijen[k].sort(function(a,b){return a.x-b.x;});});
}

// Kolommen: x-posities waar meerdere rijen een cel beginnen.
function kolommen(cellen){
  var groepen=[];
  cellen.slice().sort(function(a,b){return a.x-b.x;}).forEach(function(c){
    var g=groepen[groepen.length-1];
    if(g&&Math.abs(g.x-c.x)<=4){g.leden.push(c);g.x=(g.x*(g.leden.length-1)+c.x)/g.leden.length;}
    else groepen.push({x:c.x,leden:[c]});
  });
  return groepen.filter(function(g){
    var rijen={};g.leden.forEach(function(c){rijen[c.pagina+":"+c.rij]=1;});
    return Object.keys(rijen).length>=3;
  }).map(function(g){
    return {x:g.x,breed:Math.max.apply(null,g.leden.map(function(c){return c.b;})),aantal:g.leden.length};
  });
}

// Een bewaarde vindregel opnieuw toepassen op een volgend document.
function pas(doc,vr){
  if(!vr||!vr.type)return "";
  var cellen=doc.cellen||[],rijen=perRij(cellen);
  if(vr.type==="bestand")return doc.naam||"";
  if(vr.type==="meta")return (doc.meta||{})[vr.sleutel]||"";
  if(vr.type==="plek"){
    // Dezelfde plek op de pagina, met wat speling voor tekst die verschuift.
    var beste=null,best=1e9;
    cellen.forEach(function(c){
      if(c.pagina!==vr.pagina)return;
      var d=Math.abs(c.x-vr.x)+Math.abs(c.y-vr.y)*1.5;
      if(d<best&&Math.abs(c.x-vr.x)<26&&Math.abs(c.y-vr.y)<14){best=d;beste=c;}
    });
    return beste?beste.t:"";
  }
  if(vr.type==="patroon"){
    for(var i=0;i<PAT.length;i++)if(PAT[i].naam===vr.patroon){var m=(doc.tekst||"").match(re(PAT[i]));return m?m[0]:"";}
    return "";
  }
  var lab=null;
  for(var c=0;c<cellen.length;c++){
    if(schoonLabel(cellen[c].t).toLowerCase()===String(vr.label).toLowerCase()){lab=cellen[c];break;}
  }
  if(vr.type==="inline"){
    // Zonder het patroon pakt het label "BTW" ook een kolomkop.
    var staart="(.+)",pt=null;
    for(var q=0;q<PAT.length;q++)if(PAT[q].naam===vr.patroon)pt=PAT[q];
    if(pt)staart="("+pt.re+")";
    var kern=new RegExp("^"+String(vr.label).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"[\\s:\\-–]+"+staart+"$","i");
    for(var d=0;d<cellen.length;d++){
      var m2=cellen[d].t.match(kern);
      if(m2)return m2[1].trim();
    }
    return "";
  }
  if(!lab)return "";
  if(!lab)return "";
  var eigen=rijen.filter(function(rij){return rij[0].pagina===lab.pagina&&rij[0].rij===lab.rij;})[0]||[];
  if(vr.type==="rechts"){
    for(var e=0;e<eigen.length-1;e++)if(eigen[e]===lab)return eigen[e+1].t;
    return "";
  }
  var volgende=rijen.filter(function(rij){return rij[0].pagina===lab.pagina&&rij[0].rij===lab.rij+1;})[0]||[];
  var w=volgende.filter(function(c){return vr.type==="kolomkop"?overlapt(lab,c):Math.abs(c.x-lab.x)<=4;});
  return w.length?w[0].t:"";
}

return {pas:pas,labelachtig:labelachtig,re:re,bruikbaar:bruikbaar,eigenPaar:eigenPaar,schoonLabel:schoonLabel,
overlapt:overlapt,perRij:perRij,kolommen:kolommen,patronen:PAT,vind:vind,isWaarde:isWaarde,STOP:STOP};
})();


/* ---- 7-velden.html ---- */

(function(){
var ST=window.PLP_ST;if(!ST)return;
var PAT=ST.patronen,STOP=ST.STOP;
var labelachtig=ST.labelachtig,bruikbaar=ST.bruikbaar,eigenPaar=ST.eigenPaar,vind=ST.vind,re=ST.re;
var schoonLabel=ST.schoonLabel,overlapt=ST.overlapt,perRij=ST.perRij;
// Een formulier heeft een kolom met labels en er rechts van de waarden. Vinden we zo'n
// kolom, dan hoort elke regel daar bij elkaar, ook als de waarde op een label lijkt.
function labelKolom(rijen){
  var tel={};
  rijen.forEach(function(rij){
    if(rij.length!==2||!labelachtig(rij[0].t))return;
    var k=Math.round(rij[0].x/4)*4+":"+(Math.round(rij[1].x/4)*4);
    tel[k]=(tel[k]||0)+1;
  });
  var beste=null;
  Object.keys(tel).forEach(function(k){if(tel[k]>=3&&(beste===null||tel[k]>tel[beste]))beste=k;});
  if(beste===null)return null;
  var d=beste.split(":");
  return {x:Number(d[0]),waardeX:Number(d[1])};
}

// Staat er onder deze cel, in dezelfde kolom, een waarde? Dan is het een kolomkop
// en hoort hij niet bij het label links van hem.
function waardeOnder(c,rijen){
  for(var i=0;i<rijen.length-1;i++){
    if(rijen[i][0].pagina!==c.pagina||rijen[i][0].rij!==c.rij)continue;
    var onder=rijen[i+1];
    if(!onder||onder[0].pagina!==c.pagina||onder[0].rij!==c.rij+1)return false;
    return onder.some(function(x){return overlapt(c,x)&&(!labelachtig(x.t)||!!ST.vind(x.t));});
  }
  return false;
}
function kandidaat(naam,waarde,score,vak,vindregel,label){
  return {naam:naam,waarde:String(waarde).trim(),score:score,vak:vak,vindregel:vindregel,labelvak:label||null};
}
function analyse(doc){
  var cellen=doc.cellen||[],rijen=perRij(cellen),uit=[],labKol=labelKolom(rijen);

  // 1. Kolomkop boven de waarde: dezelfde x-posities op twee rijen.
  for(var r=0;r<rijen.length-1;r++){
    var kop=rijen[r],waardeRij=rijen[r+1];
    if(kop.length<2||kop[0].pagina!==waardeRij[0].pagina)continue;
    // Een regel uit de labelkolom is geen kolomkop; die hoort met de cel ernaast bij elkaar.
    if(labKol&&kop.length===2&&Math.abs(kop[0].x-labKol.x)<=4&&Math.abs(kop[1].x-labKol.waardeX)<=4)continue;
    if(waardeRij[0].rij!==kop[0].rij+1)continue;
    var labels=kop.filter(function(c){return labelachtig(c.t);});
    if(labels.length<2)continue;
    labels.forEach(function(lab){
      var w=waardeRij.filter(function(c){return overlapt(lab,c)&&bruikbaar(c.t)&&!eigenPaar(c.t);});
      if(w.length!==1)return;
      uit.push(kandidaat(schoonLabel(lab.t),w[0].t,0.9,w[0],{type:"kolomkop",label:schoonLabel(lab.t)},lab));
    });
  }

  // 2. Label links, waarde rechts op dezelfde rij. Staat er op een regel niets anders
  // dan een label en één waarde ("Geboortedatum   01-01-1990"), dan hoort dat bij elkaar,
  // ook als die waarde op een label lijkt ("Voorletters   J.M.").
  rijen.forEach(function(rij){
    for(var i=0;i<rij.length-1;i++){
      var lab=rij[i],w=rij[i+1];
      if(!labelachtig(lab.t)||eigenPaar(w.t))continue;
      if(w.x-(lab.x+lab.b)>260)continue;
      var alleen=rij.length===2&&labKol&&Math.abs(lab.x-labKol.x)<=4&&Math.abs(w.x-labKol.waardeX)<=4;
      if(!alleen&&labelachtig(w.t))continue;
      uit.push(kandidaat(schoonLabel(lab.t),w.t,alleen?0.95:0.85,w,{type:"rechts",label:schoonLabel(lab.t)},lab));
    }
  });

  // 3. Label en waarde in dezelfde cel.
  cellen.forEach(function(c){
    for(var i=0;i<PAT.length;i++){
      var m=c.t.match(new RegExp("^(.{2,36}?)[\\s:\\-–]+("+PAT[i].re+")$","i"));
      if(!m)continue;
      var lab=schoonLabel(m[1]);
      if(!labelachtig(lab)||STOP.test(lab))break;
      uit.push(kandidaat(lab,m[2],0.8,c,{type:"inline",label:lab,patroon:PAT[i].naam},c));
      break;
    }
  });

  // 4. Label met de waarde eronder, in dezelfde kolom.
  for(var q=0;q<rijen.length-1;q++){
    var boven=rijen[q],onder=rijen[q+1];
    if(boven.length>2||boven[0].pagina!==onder[0].pagina||onder[0].rij!==boven[0].rij+1)continue;
    boven.forEach(function(lab){
      if(!labelachtig(lab.t)||vind(lab.t)||/:/.test(lab.t))return;
      var w=onder.filter(function(c){return Math.abs(c.x-lab.x)<=4&&bruikbaar(c.t)&&!/:/.test(c.t)&&!eigenPaar(c.t);});
      if(w.length!==1)return;
      uit.push(kandidaat(schoonLabel(lab.t),w[0].t,0.7,w[0],{type:"onder",label:schoonLabel(lab.t)},lab));
    });
  }

  // 5. Sterke patronen mogen los een veld zijn.
  cellen.forEach(function(c){
    PAT.forEach(function(p){
      if(!p.sterk)return;
      var m=c.t.match(re(p));
      if(!m)return;
      uit.push(kandidaat(p.toon,m[0],0.6,c,{type:"patroon",patroon:p.naam},null));
    });
  });

  return {velden:ontdubbel(uit),kolommen:ST.kolommen(cellen),tabel:tabel(rijen)};
}

// Zelfde waarde op dezelfde plek: de hoogste score wint. Zelfde naam: nummeren.
function ontdubbel(lijst){
  var perVak={};
  lijst.forEach(function(k){
    if(!k.naam||!k.waarde)return;
    var sleutel=k.vak.pagina+":"+Math.round(k.vak.x)+":"+Math.round(k.vak.y);
    if(!perVak[sleutel]||perVak[sleutel].score<k.score)perVak[sleutel]=k;
  });
  var perWaarde={};
  Object.keys(perVak).forEach(function(s){
    var k=perVak[s],w=k.vak.pagina+":"+k.waarde.toLowerCase();
    if(!perWaarde[w]||perWaarde[w].score<k.score)perWaarde[w]=k;
  });
  var uit=Object.keys(perWaarde).map(function(s){return perWaarde[s];})
    .sort(function(a,b){return b.score-a.score||a.vak.pagina-b.vak.pagina||b.vak.y-a.vak.y;});
  var geteld={};
  uit.forEach(function(k){
    geteld[k.naam]=(geteld[k.naam]||0)+1;
    if(geteld[k.naam]>1)k.naam=k.naam+" "+geteld[k.naam];
  });
  return uit;
}

// Regeltabel: kopregel met 3+ labels, daaronder rijen op diezelfde kolommen.
function tabel(rijen){
  var beste=null;
  for(var r=0;r<rijen.length-1;r++){
    var kop=rijen[r];
    var labels=kop.filter(function(c){return labelachtig(c.t);});
    if(labels.length<3)continue;
    var rows=[],leeg=0,vorigeY=kop[0].y,stap=0;
    for(var i=r+1;i<rijen.length;i++){
      var rij=rijen[i];
      if(rij[0].pagina!==kop[0].pagina)break;
      var raak=labels.filter(function(lab){return rij.some(function(c){return overlapt(lab,c);});}).length;
      var gat=vorigeY-rij[0].y;
      if(rows.length&&stap&&gat>stap*2.2)break;
      var eersteKolom=rij.some(function(c){return overlapt(labels[0],c);});
      if(raak>=Math.ceil(labels.length/2)&&eersteKolom){
        if(!stap||gat<stap)stap=gat;
        vorigeY=rij[0].y;
        rows.push(labels.map(function(lab){
          var c=rij.filter(function(x){return overlapt(lab,x);});
          return c.length?c.map(function(x){return x.t;}).join(" "):"";
        }));
        leeg=0;
      }else if(rows.length){ if(++leeg>1)break; }
    }
    if(rows.length>=2){
      var kandidaatTabel={kop:labels.map(function(c){return schoonLabel(c.t);}),rijen:rows};
      if(!beste||labels.length>beste.kop.length||(labels.length===beste.kop.length&&rows.length>beste.rijen.length))beste=kandidaatTabel;
    }
  }
  return beste;
}

// Een gevonden waarde krijgt meteen de juiste opschoning mee.
function filterVoor(v){
  var p=v.vindregel&&v.vindregel.patroon;
  if(p==="bedrag"||/^\s*-?€/.test(v.waarde)||/\d,\d{2}$/.test(v.waarde))return "bedrag";
  var g=vind(v.waarde);
  if(p==="datum"||(g&&g.patroon.naam==="datum"))return "datum";
  return "geen";
}

// Alles wat de slimme herkenning liet liggen: elke cel op de pagina, plus wat er
// buiten de pagina om bekend is (bestandsnaam en de eigenschappen van het pdf-bestand).
// De gebruiker vinkt weg wat hij niet wil.
function alles(doc,gekozen){
  var bezet={};
  (gekozen||[]).forEach(function(v){
    [v.vak,v.labelvak].forEach(function(k){if(k)bezet[k.pagina+":"+Math.round(k.x)+":"+Math.round(k.y)]=1;});
  });
  var uit=[],n=0,rijen=perRij(doc.cellen||[]);
  var meta=doc.meta||{};
  Object.keys(meta).forEach(function(k){
    if(meta[k])uit.push(kandidaat(k,meta[k],0.5,{pagina:-1,x:0,y:0,b:0,h:0},{type:"meta",sleutel:k},null));
  });
  uit.push(kandidaat("Bestandsnaam",doc.naam,0.5,{pagina:-1,x:0,y:0,b:0,h:0},{type:"bestand"},null));
  rijen.forEach(function(rij){
    rij.forEach(function(c,i){
      if(bezet[c.pagina+":"+Math.round(c.x)+":"+Math.round(c.y)])return;
      n++;
      uit.push(kandidaat(naamVoor(c,rij,i,n),c.t,0.3,c,
        {type:"plek",pagina:c.pagina,x:Math.round(c.x),y:Math.round(c.y)},null));
    });
  });
  return uit;
}
// Een naam voorstellen voor een losse cel: het label ervoor of erboven, anders het
// patroon, anders geteld. Van een cel die zelf label en waarde bevat pakken we het label.
function labelDeel(t){
  for(var i=0;i<PAT.length;i++){
    if(!PAT[i].sterk&&PAT[i].naam!=="bedrag")continue;
    var m=String(t).match(new RegExp("^(.{2,36}?)[\\s:\\-–]+("+PAT[i].re+")$","i"));
    if(m&&labelachtig(schoonLabel(m[1])))return schoonLabel(m[1]);
  }
  return labelachtig(t)?schoonLabel(t):"";
}
function naamVoor(c,rij,i,n){
  for(var j=i-1;j>=0;j--){
    var lab=labelDeel(rij[j].t);
    if(lab&&lab.toLowerCase()!==String(c.t).toLowerCase())return lab;
  }
  var v=vind(c.t);
  if(v&&v.waarde.length>=String(c.t).length-1)return v.patroon.toon;
  var eigen=labelDeel(c.t);
  if(eigen&&eigen.toLowerCase()!==String(c.t).toLowerCase())return eigen;
  return "Tekst "+n;
}
ST.analyse=analyse;ST.filterVoor=filterVoor;ST.alles=alles;
})();


/* ---- 8-voorstel.html ---- */

window.PLP_V=(function(){
var S=window.PLP_S,P=window.PLP,ST=window.PLP_ST,CFG=window.PARSELAB;
function el(a,b,c){var n=document.createElement(a);if(b)n.className=b;if(c!=null)n.textContent=c;return n;}
var BRON={kolomkop:"srcKolomkop",rechts:"srcRechts",inline:"srcInline",onder:"srcOnder",patroon:"srcPatroon",
  ai:"srcAi",plek:"srcPlek",meta:"srcMeta",bestand:"srcBestand"};
function open(bestanden,index){
  var lijst=Array.isArray(bestanden)?bestanden:[bestanden],nu=index||0,file=lijst[nu];
  var t=S.t,laag=el("div","plp-doorkijk"),blad=el("div","plp-blad");
  laag.appendChild(blad);document.body.appendChild(laag);
  laag.addEventListener("click",function(e){if(e.target===laag)sluit();});
  function sluit(){laag.remove();document.removeEventListener("keydown",toets);}
  function toets(e){if(e.key==="Escape")sluit();}
  document.addEventListener("keydown",toets);

  var kop=el("div","pld-head"),links=el("div");
  links.appendChild(el("h2","pld-title",t.look));
  links.appendChild(el("p","pld-sub",lijst.length>1?t.checkHint:t.lookHint));
  if(lijst.length>1){
    var nav=el("div","pld-row");
    var vorige=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.prevDoc);vorige.type="button";
    var volgende=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.nextDoc);volgende.type="button";
    vorige.disabled=nu===0;volgende.disabled=nu>=lijst.length-1;
    vorige.addEventListener("click",function(){sluit();open(lijst,nu-1);});
    volgende.addEventListener("click",function(){sluit();open(lijst,nu+1);});
    nav.appendChild(vorige);
    nav.appendChild(el("span","plp-mono",t.docOf.replace("{i}",nu+1).replace("{n}",lijst.length)+" · "+file.name));
    nav.appendChild(volgende);
    links.appendChild(nav);
  }
  var dicht=el("button","pld-btn pld-btn--ghost",t.cancel);dicht.type="button";
  dicht.addEventListener("click",sluit);
  kop.appendChild(links);kop.appendChild(dicht);blad.appendChild(kop);
  var laden=el("p","pld-text",t.loading);blad.appendChild(laden);

  P.lees(file).then(function(doc){
    laden.remove();
    var analyse=ST.analyse(doc),velden=analyse.velden.map(function(v){
      return {aan:true,slim:true,naam:v.naam,waarde:v.waarde,bron:v.vindregel.type,vak:v.vak,labelvak:v.labelvak,
              vindregel:v.vindregel,filter:ST.filterVoor(v)};
    });
    if(!doc.cellen.length&&window.PLP_L&&window.PLP_L.ocrAanbod){
      window.PLP_L.ocrAanbod(blad,file,doc,function(doc2,a2,v2){bouw(blad,file,doc2,a2,v2,sluit);});
      return;
    }
    if(!velden.length){blad.appendChild(el("p","pld-msg pld-msg--warn",t.noFields));return;}
    // Alles wat de slimme herkenning liet liggen staat er ook in, uitgevinkt.
    // Bij een volgend document blijven de gekozen velden staan; je ziet per veld of het
    // ook daar gevonden wordt. Wat de tool hier extra vindt komt er uitgevinkt bij.
    if(S.regels&&S.regels.length&&nu>0){
      var namen={};velden.forEach(function(v){namen[v.naam.toLowerCase()]=1;});
      S.regels.filter(function(r){return r.type==="cel"&&r.vindregel;}).reverse().forEach(function(r){
        if(namen[String(r.naam).toLowerCase()])return;
        var w=ST.pas(doc,r.vindregel);
        velden.unshift({aan:true,slim:true,naam:r.naam,waarde:w||t.notFound,bron:r.vindregel.type,
                        vak:{pagina:-1,x:0,y:0,b:0,h:0},labelvak:null,vindregel:r.vindregel,filter:r.filter||"geen"});
      });
    }
    ST.alles(doc,analyse.velden).forEach(function(v){
      velden.push({aan:false,slim:false,naam:v.naam,waarde:v.waarde,bron:v.vindregel.type,vak:v.vak,
                   labelvak:null,vindregel:v.vindregel,filter:ST.filterVoor(v)});
    });
    bouw(blad,file,doc,analyse,velden,sluit);
  }).catch(function(e){
    console.error(e);laden.remove();
    blad.appendChild(el("p","pld-msg pld-msg--warn",t.errRead));
  });
}

function bouw(blad,file,doc,analyse,velden,sluit){
  var t=S.t,pagina=0,tabelAan=false,alles=false;
  var twee=el("div","plp-twee"),linkerkant=el("div"),rechterkant=el("div");
  twee.appendChild(linkerkant);twee.appendChild(rechterkant);blad.appendChild(twee);
  var vlak=el("div","plp-pagina"),canvas=document.createElement("canvas");
  vlak.appendChild(canvas);linkerkant.appendChild(vlak);
  var bladeren=el("div","pld-row");linkerkant.appendChild(bladeren);
  if(doc.paginas>1){
    for(var i=0;i<doc.paginas;i++)(function(n){
      var b=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.page+" "+(n+1));b.type="button";
      b.addEventListener("click",function(){pagina=n;teken();});bladeren.appendChild(b);
    })(i);
  }

  // Past dit document bij een sjabloon uit de gekozen map, en zijn de velden te vinden?
  if(window.PLP_SJ&&window.PLP_SJ.controle){
    var d=window.PLP_SJ.lees();
    if(d.actief){
      var c=window.PLP_SJ.controle(d.actief,doc,analyse);
      var regelC=el("p","pld-msg");
      if(!c.sjabloon)regelC.textContent=t.matchNone;
      else if(c.anders)regelC.textContent=t.matchMaybe.replace("{naam}",c.sjabloon.naam).replace("{g}",c.gevonden).replace("{t}",c.totaal);
      else regelC.textContent=t.matchOn.replace("{naam}",c.sjabloon.naam).replace("{g}",c.gevonden).replace("{t}",c.totaal);
      if(c.anders)regelC.className="pld-msg pld-msg--warn";
      rechterkant.appendChild(regelC);
    }
  }
  var lijst=el("div","plp-lijst");rechterkant.appendChild(el("p","pld-caps",t.proposal));
  rechterkant.appendChild(el("p","pld-text",t.proposalHint));
  var meer=el("button","pld-btn pld-btn--ghost pld-btn--sm","");meer.type="button";
  var aantalExtra=velden.filter(function(v){return !v.slim;}).length;
  meer.textContent=t.showAll.replace("{n}",aantalExtra);
  meer.addEventListener("click",function(){
    alles=!alles;meer.textContent=alles?t.hideAll:t.showAll.replace("{n}",aantalExtra);tekenLijst();
  });
  if(aantalExtra)rechterkant.appendChild(meer);
  var balk=window.PLP_L?window.PLP_L.selectieBalk(velden,function(){tekenLijst();tekenVlakken();}):null;
  if(balk)rechterkant.appendChild(balk);
  rechterkant.appendChild(lijst);

  if(analyse.tabel){
    var kaart=el("div","pld-card");
    kaart.appendChild(el("p","pld-caps",t.tableFound));
    kaart.appendChild(el("p","pld-text",t.tableHint.replace("{n}",analyse.tabel.rijen.length).replace("{k}",analyse.tabel.kop.length)));
    var aanknop=el("label","pld-row"),vink=document.createElement("input");
    vink.type="checkbox";vink.addEventListener("change",function(){tabelAan=vink.checked;});
    aanknop.appendChild(vink);aanknop.appendChild(el("span","pld-text",t.tableUse));
    kaart.appendChild(aanknop);rechterkant.appendChild(kaart);
  }

  var knoppen=el("div","pld-row");blad.appendChild(knoppen);
  var over=el("button","pld-btn",t.takeOver);over.type="button";
  var ai=el("button","pld-btn pld-btn--ghost",t.withAi);ai.type="button";
  var melding=el("p","pld-text");
  knoppen.appendChild(over);knoppen.appendChild(ai);knoppen.appendChild(melding);
  if(window.PLP_SJ&&window.PLP_SJ.opslaanKnop)
    blad.appendChild(window.PLP_SJ.opslaanKnop(gekozenRegels,doc,analyse,melding));

  function gekozenRegels(){
    var lijst=velden.filter(function(v){return v.aan&&v.naam;}).map(function(v){
      return {naam:v.naam,type:"cel",waarde:v.vindregel.label||v.vindregel.patroon||"",filter:v.filter,vindregel:v.vindregel};
    });
    if(tabelAan&&analyse.tabel)analyse.tabel.kop.forEach(function(k,i){
      lijst.push({naam:k,type:"tabelkolom",waarde:"",kolom:i,filter:"geen"});
    });
    return lijst;
  }
  over.addEventListener("click",function(){
    var regels=gekozenRegels();
    if(!regels.length)return;
    S.regels=regels;
    try{localStorage.setItem("pl_parsepdf_regels",JSON.stringify(S.regels));}catch(e){}
    sluit();window.PLP_UI.teken();window.PLP_UI.meld(t.taken);
  });
  ai.addEventListener("click",function(){window.PLP_AI.vraag(doc,velden,function(){teken();},melding,ai);});

  function tekenLijst(){
    if(balk&&balk.bijwerken)balk.bijwerken();
    lijst.innerHTML="";
    velden.forEach(function(v,i){
      if(!alles&&!v.slim&&!v.aan)return;
      var rij=el("div","plp-veldrij");
      var vink=document.createElement("input");vink.type="checkbox";vink.checked=v.aan;
      vink.setAttribute("aria-label",v.naam);
      vink.addEventListener("change",function(){v.aan=vink.checked;tekenVlakken();});
      var naam=el("input","pld-in");naam.value=v.naam;
      naam.addEventListener("input",function(){v.naam=naam.value;});
      var waarde=el("p","plp-mono",v.waarde);
      var bron=el("span","plp-bron"+(v.bron==="ai"?" plp-bron--ai":""),t[BRON[v.bron]]||v.bron);
      rij.appendChild(vink);rij.appendChild(naam);rij.appendChild(waarde);rij.appendChild(bron);
      rij.addEventListener("mouseenter",function(){markeer(i,true);});
      rij.addEventListener("mouseleave",function(){markeer(i,false);});
      lijst.appendChild(rij);
    });
  }
  var schaal=1;
  function tekenVlakken(){window.PLP_L.vlakken(vlak,doc,velden,pagina,schaal,function(){tekenLijst();tekenVlakken();});}
  function markeer(i,aan){var b=vlak.querySelector('[data-veld="'+i+'"]');if(b)b.classList.toggle("plp-vlak--warm",aan);}
  function teken(){
    tekenLijst();
    P.open(file).then(function(pdf){return pdf.getPage(pagina+1);}).then(function(pg){
      var breed=Math.max(560,Math.min(1100,linkerkant.clientWidth||760));
      var v1=pg.getViewport({scale:1});
      schaal=breed/v1.width;
      var vp=pg.getViewport({scale:schaal});
      canvas.width=vp.width;canvas.height=vp.height;
      canvas.style.width="100%";
      return pg.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise;
    }).then(function(){
      schaal=canvas.clientWidth/canvas.width*schaal;
      tekenVlakken();
    }).catch(function(e){console.error(e);tekenVlakken();});
  }
  teken();
}

return {open:open};
})();


/* ---- 9-labels.html ---- */

(function(){var T=window.PLP_T;if(!T)return;
var EXTRA={
nl:{matchOn:"Lijkt op sjabloon {naam} · {g} van {t} velden gevonden",matchMaybe:"Lijkt op {naam}, maar de indeling wijkt af: {g} van {t} velden gevonden. Controleer het of maak er een eigen sjabloon van.",matchNone:"Past bij geen enkel sjabloon in deze map. Bewaar dit als nieuw sjabloon.",keep:"Overnemen",drop:"Weglaten",autoNamed:"naam automatisch",selectAll:"Alles selecteren",selectNone:"Niets selecteren",chosen:"{n} van {t} aan",aiChanged:"De AI wijzigde {n} velden.",approve:"Goedkeuren",undo:"Ongedaan maken",approved:"Goedgekeurd.",undone:"Teruggezet.",ocr:"Tekst herkennen (OCR)",ocrBusy:"Tekst herkennen…",ocrDone:"{n} stukken tekst herkend. Controleer ze goed; herkenning is niet altijd juist.",ocrOff:"Tekstherkenning kon niet worden geladen. Controleer je verbinding.",ocrHint:"Dit document heeft geen tekstlaag. Laat de tekst herkennen om er toch velden uit te halen."},
en:{matchOn:"Looks like template {naam} · {g} of {t} fields found",matchMaybe:"Looks like {naam}, but the layout differs: {g} of {t} fields found. Check it or save it as its own template.",matchNone:"Matches no template in this folder. Save it as a new template.",keep:"Use",drop:"Leave out",autoNamed:"named automatically",selectAll:"Select all",selectNone:"Select none",chosen:"{n} of {t} on",aiChanged:"The AI changed {n} fields.",approve:"Approve",undo:"Undo",approved:"Approved.",undone:"Reverted.",ocr:"Recognise text (OCR)",ocrBusy:"Recognising text…",ocrDone:"{n} pieces of text recognised. Check them; recognition is not always right.",ocrOff:"Text recognition could not be loaded. Check your connection.",ocrHint:"This document has no text layer. Run text recognition to pull fields out of it anyway."},
de:{matchOn:"Aehnelt Vorlage {naam} · {g} von {t} Feldern gefunden",matchMaybe:"Aehnelt {naam}, aber das Layout weicht ab: {g} von {t} Feldern gefunden. Pruefe es oder speichere eine eigene Vorlage.",matchNone:"Passt zu keiner Vorlage in diesem Ordner. Speichere es als neue Vorlage.",keep:"Uebernehmen",drop:"Weglassen",autoNamed:"automatisch benannt",selectAll:"Alles auswaehlen",selectNone:"Nichts auswaehlen",chosen:"{n} von {t} an",aiChanged:"Die KI hat {n} Felder geaendert.",approve:"Genehmigen",undo:"Rueckgaengig",approved:"Genehmigt.",undone:"Zurueckgesetzt.",ocr:"Text erkennen (OCR)",ocrBusy:"Text wird erkannt…",ocrDone:"{n} Textstuecke erkannt. Pruefe sie; die Erkennung ist nicht immer richtig.",ocrOff:"Texterkennung konnte nicht geladen werden. Pruefe deine Verbindung.",ocrHint:"Dieses Dokument hat keine Textebene. Lass den Text erkennen, um trotzdem Felder zu bekommen."}
};
Object.keys(EXTRA).forEach(function(taal){
  if(!T[taal])return;
  Object.keys(EXTRA[taal]).forEach(function(k){T[taal][k]=EXTRA[taal][k];});
});
})();


/* ---- 9-labels.html ---- */

window.PLP_L=(function(){
var S=window.PLP_S;
function el(a,b,c){var n=document.createElement(a);if(b)n.className=b;if(c!=null)n.textContent=c;return n;}

// Klik op een gearceerd vlak: een klein venster bij dat vlak waarin je het veld een
// naam geeft, de waarde ziet en het aan of uit zet. Zo benoem je in het document zelf.
function labelVenster(vlak,box,veld,klaar){
  sluitVensters(vlak);
  var v=el("div","plp-label");
  v.appendChild(el("p","pld-lbl",S.t.fName));
  var naam=el("input","pld-in");naam.value=veld.naam||"";
  v.appendChild(naam);
  v.appendChild(el("p","plp-mono",veld.waarde));
  var bron=el("p","plp-bron",(S.t[BRON[veld.bron]]||veld.bron)+(veld.slim?" · "+S.t.autoNamed:""));
  v.appendChild(bron);
  var rij=el("div","pld-row");
  var ok=el("button","pld-btn pld-btn--sm",S.t.keep);ok.type="button";
  var weg=el("button","pld-btn pld-btn--ghost pld-btn--sm",S.t.drop);weg.type="button";
  rij.appendChild(ok);rij.appendChild(weg);v.appendChild(rij);
  var links=Math.max(4,Math.min(box.offsetLeft,(vlak.clientWidth||400)-260));
  v.style.left=links+"px";
  v.style.top=(box.offsetTop+box.offsetHeight+6)+"px";
  vlak.appendChild(v);
  naam.focus();naam.select();
  function bewaar(aan){
    veld.naam=naam.value.trim()||veld.naam;
    veld.aan=aan;
    v.remove();klaar();
  }
  naam.addEventListener("keydown",function(e){
    if(e.key==="Enter"){e.preventDefault();bewaar(true);}
    if(e.key==="Escape")v.remove();
  });
  ok.addEventListener("click",function(){bewaar(true);});
  weg.addEventListener("click",function(){bewaar(false);});
}
var BRON={kolomkop:"srcKolomkop",rechts:"srcRechts",inline:"srcInline",onder:"srcOnder",patroon:"srcPatroon",
          ai:"srcAi",plek:"srcPlek",meta:"srcMeta",bestand:"srcBestand"};
function sluitVensters(vlak){
  [].slice.call(vlak.querySelectorAll(".plp-label")).forEach(function(n){n.remove();});
}

// Alles aan of alles uit, met de stand ernaast.
function selectieBalk(velden,klaar){
  var doos=el("div","pld-row");
  var alles=el("button","pld-btn pld-btn--ghost pld-btn--sm",S.t.selectAll);alles.type="button";
  var geen=el("button","pld-btn pld-btn--ghost pld-btn--sm",S.t.selectNone);geen.type="button";
  var stand=el("span","plp-bron","");
  function tel(){
    var aan=velden.filter(function(v){return v.aan;}).length;
    stand.textContent=S.t.chosen.replace("{n}",aan).replace("{t}",velden.length);
  }
  alles.addEventListener("click",function(){velden.forEach(function(v){v.aan=true;});tel();klaar();});
  geen.addEventListener("click",function(){velden.forEach(function(v){v.aan=false;});tel();klaar();});
  doos.appendChild(alles);doos.appendChild(geen);doos.appendChild(stand);
  doos.bijwerken=tel;tel();
  return doos;
}

// Wat de AI voorstelt gaat niet zomaar door: je ziet wat er verandert en keurt het goed.
function goedkeuring(velden,voorstel,klaar,melding){
  var oud=velden.map(function(v){return {naam:v.naam,aan:v.aan,bron:v.bron};});
  var raakt=0;
  voorstel.forEach(function(nw){
    var bestaand=velden.filter(function(x){return x.waarde===nw.waarde;})[0];
    if(bestaand){
      if(nw.naam&&nw.naam!==bestaand.naam){bestaand.naam=nw.naam;raakt++;}
      if(nw.houden===false&&bestaand.aan){bestaand.aan=false;raakt++;}
      if(nw.houden===true&&!bestaand.aan){bestaand.aan=true;raakt++;}
      bestaand.bron="ai";
    }else if(nw.waarde){
      velden.push({aan:true,slim:true,naam:nw.naam||S.t.fValue,waarde:nw.waarde,bron:"ai",
                   vak:{pagina:-1,x:0,y:0,b:0,h:0},labelvak:null,
                   vindregel:{type:"patroonwaarde",waarde:nw.waarde},filter:"geen"});
      raakt++;
    }
  });
  klaar();
  if(!melding)return raakt;
  melding.textContent="";
  var rij=el("div","pld-row");
  rij.appendChild(el("span","pld-text",S.t.aiChanged.replace("{n}",raakt)));
  var ok=el("button","pld-btn pld-btn--sm",S.t.approve);ok.type="button";
  var terug=el("button","pld-btn pld-btn--ghost pld-btn--sm",S.t.undo);terug.type="button";
  ok.addEventListener("click",function(){rij.remove();melding.textContent=S.t.approved;});
  terug.addEventListener("click",function(){
    velden.length=oud.length;
    oud.forEach(function(o,i){velden[i].naam=o.naam;velden[i].aan=o.aan;velden[i].bron=o.bron;});
    rij.remove();melding.textContent=S.t.undone;klaar();
  });
  rij.appendChild(ok);rij.appendChild(terug);
  melding.appendChild(rij);
  return raakt;
}


// Geen tekstlaag: aanbieden om de tekst te laten herkennen, en daarna hetzelfde
// voorstel opbouwen als bij een gewoon document.
function ocrAanbod(blad,file,doc,klaar){
  var t=S.t,P=window.PLP,ST=window.PLP_ST;
  var vraag=el("div","pld-card");
  vraag.appendChild(el("p","pld-text",t.ocrHint));
  var rij=el("div","pld-row"),knop=el("button","pld-btn",t.ocr),stand=el("p","pld-text");
  knop.type="button";rij.appendChild(knop);rij.appendChild(stand);
  vraag.appendChild(rij);blad.appendChild(vraag);
  knop.addEventListener("click",function(){
    knop.disabled=true;stand.textContent=t.ocrBusy;
    P.ocr(file,function(n,tot){stand.textContent=t.ocrBusy+" "+n+" / "+tot;}).then(function(res){
      vraag.remove();
      doc.cellen=res.cellen;doc.maten=res.maten;doc.ocr=true;
      doc.tekst=res.cellen.map(function(c){return c.t;}).join("\n");
      var a2=ST.analyse(doc);
      var v2=a2.velden.map(function(v){
        return {aan:true,slim:true,naam:v.naam,waarde:v.waarde,bron:v.vindregel.type,vak:v.vak,
                labelvak:v.labelvak,vindregel:v.vindregel,filter:ST.filterVoor(v)};
      });
      ST.alles(doc,a2.velden).forEach(function(v){
        v2.push({aan:false,slim:false,naam:v.naam,waarde:v.waarde,bron:v.vindregel.type,vak:v.vak,
                 labelvak:null,vindregel:v.vindregel,filter:ST.filterVoor(v)});
      });
      klaar(doc,a2,v2);
      window.PLP_UI.meld(t.ocrDone.replace("{n}",res.cellen.length));
    }).catch(function(){knop.disabled=false;stand.textContent=t.ocrOff;});
  });
}


// De gearceerde vlakken op de pagina: goud voor het label, blauw voor de waarde.
// Klikken opent het labelvenster, zweven toont naam en waarde.
function vlakken(vlak,doc,velden,pagina,schaal,klaar){
  [].slice.call(vlak.querySelectorAll(".plp-vlak,.plp-tip,.plp-label")).forEach(function(n){n.remove();});
  var maat=(doc.maten&&doc.maten[pagina])||{hoog:842};
  velden.forEach(function(v,i){
    [[v.labelvak,"plp-vlak plp-vlak--label"],[v.vak,"plp-vlak"+(v.aan?"":" plp-vlak--uit")]].forEach(function(paar){
      var vk=paar[0];
      if(!vk||vk.pagina!==pagina)return;
      var box=el("div",paar[1]);
      box.style.left=(vk.x*schaal-2)+"px";
      box.style.top=((maat.hoog-vk.y-vk.h)*schaal-2)+"px";
      box.style.width=(vk.b*schaal+4)+"px";
      box.style.height=(vk.h*schaal*1.35+2)+"px";
      if(paar[1].indexOf("label")<0){
        box.setAttribute("data-veld",i);
        box.title=v.naam;
        box.addEventListener("mouseenter",function(){tip(vlak,box,v.naam+" = "+v.waarde);});
        box.addEventListener("mouseleave",function(){var q=vlak.querySelector(".plp-tip");if(q)q.remove();});
        box.addEventListener("click",function(){labelVenster(vlak,box,v,klaar);});
      }
      vlak.appendChild(box);
    });
  });
}
function tip(vlak,box,tekst){
  var q=el("div","plp-tip",tekst);
  q.style.left=(box.offsetLeft+box.offsetWidth/2)+"px";q.style.top=(box.offsetTop-6)+"px";
  vlak.appendChild(q);
}

return {vlakken:vlakken,ocrAanbod:ocrAanbod,labelVenster:labelVenster,selectieBalk:selectieBalk,goedkeuring:goedkeuring,sluitVensters:sluitVensters};
})();


/* ---- 9b-uitleg.html ---- */

window.PLP_TOUR=(function(){
var S=window.PLP_S;
var STAPPEN={
nl:[["Kies je documenten","Sleep je PDF's in het vlak of klik op Bestanden kiezen. Alleen PDF, tot 25 MB per bestand en 100 stuks per keer. Het eerste document gaat meteen open zodat je ziet wat erin staat."],
["Kijk wat erin staat","Je document wordt getekend en alles wat de tool kan uitlezen is gearceerd: blauw is een waarde, goud het label waaraan hij hem herkende. Zweef erover voor de naam, klik erop om het veld een eigen naam te geven of het weg te laten."],
["Vink aan wat je wilt","Rechts staat dezelfde lijst met vinkjes. Met Alles selecteren of Niets selecteren ga je snel. Mist er iets? Toon alle tekst zet elk stukje tekst in de lijst, plus de gegevens van het bestand zelf."],
["Bewaar het als sjabloon","Geef je keuze een naam en zet hem in een map, bijvoorbeeld Facturen. Bij de volgende stapel herkent de tool zelf welk sjabloon bij welk document hoort, ook als je documenten van verschillende leveranciers door elkaar sleept."],
["Uitlezen en downloaden","Klik op Uitlezen starten. Je krijgt een tabel met alle kolommen en een knop om te downloaden als CSV; Nederlandse Excel zet die meteen goed. Een scan zonder tekstlaag? Laat eerst de tekst herkennen."]],
en:[["Choose your documents","Drag your PDFs into the box or click Choose files. PDF only, up to 25 MB per file and 100 at a time. The first document opens right away so you see what is in it."],
["See what is in it","Your document is drawn and everything the tool can read is highlighted: blue is a value, gold the label it recognised it by. Hover for the name, click to give the field your own name or leave it out."],
["Tick what you want","The same list sits on the right with checkboxes. Select all and Select none move fast. Missing something? Show all text puts every piece of text in the list, plus the details of the file itself."],
["Save it as a template","Name your choice and put it in a folder, for example Invoices. Next time the tool picks the matching template per document itself, even with suppliers mixed in one batch."],
["Extract and download","Click Start extraction. You get one table with all columns and a download button for CSV. A scan without a text layer? Run text recognition first."]],
de:[["Dokumente waehlen","Ziehe deine PDFs in das Feld oder klicke auf Dateien waehlen. Nur PDF, bis 25 MB pro Datei und 100 auf einmal. Das erste Dokument oeffnet sich sofort."],
["Sieh nach, was drinsteht","Dein Dokument wird gezeichnet und alles Lesbare hervorgehoben: blau ist ein Wert, gold das Label. Fahre darueber fuer den Namen, klicke, um selbst zu benennen oder wegzulassen."],
["Hake an, was du willst","Rechts steht dieselbe Liste mit Haken. Alles auswaehlen und Nichts auswaehlen gehen schnell. Fehlt etwas? Allen Text zeigen bringt jedes Textstueck in die Liste."],
["Als Vorlage speichern","Gib deiner Auswahl einen Namen und lege sie in einen Ordner. Beim naechsten Stapel waehlt das Werkzeug die passende Vorlage pro Dokument selbst."],
["Auslesen und herunterladen","Klicke auf Auslesen starten. Du bekommst eine Tabelle mit allen Spalten und einen Download als CSV."]]};
var TITEL={nl:"Hoe werkt ParsePDF?",en:"How does ParsePDF work?",de:"Wie funktioniert ParsePDF?"};
var WOORDEN={nl:["Volgende","Klaar","Stap {i} van {n}","Vorige"],en:["Next","Done","Step {i} of {n}","Back"],de:["Weiter","Fertig","Schritt {i} von {n}","Zurueck"]};
function el(a,b,c){var n=document.createElement(a);if(b)n.className=b;if(c!=null)n.textContent=c;return n;}
function taal(){return STAPPEN[S.taal]?S.taal:"nl";}

function toon(){
  var stappen=STAPPEN[taal()],woorden=WOORDEN[taal()],i=0;
  var laag=el("div","plp-modal"),blad=el("div","plp-modal-blad");
  laag.appendChild(blad);document.body.appendChild(laag);
  function weg(){laag.remove();document.removeEventListener("keydown",toets);}
  function toets(e){if(e.key==="Escape")weg();}
  document.addEventListener("keydown",toets);
  laag.addEventListener("click",function(e){if(e.target===laag)weg();});
  function teken(){
    blad.innerHTML="";
    blad.appendChild(el("p","pld-caps",woorden[2].replace("{i}",i+1).replace("{n}",stappen.length)));
    blad.appendChild(el("h2","pld-num",stappen[i][0]));
    blad.appendChild(el("p","pld-text",stappen[i][1]));
    var balk=el("div","pld-bar"),vul=el("span");
    vul.style.width=Math.round((i+1)/stappen.length*100)+"%";balk.appendChild(vul);
    blad.appendChild(balk);
    var rij=el("div","pld-row");
    if(i>0){
      var terug=el("button","pld-btn pld-btn--ghost",woorden[3]);terug.type="button";
      terug.addEventListener("click",function(){i--;teken();});
      rij.appendChild(terug);
    }
    var door=el("button","pld-btn",i<stappen.length-1?woorden[0]:woorden[1]);door.type="button";
    door.addEventListener("click",function(){if(i<stappen.length-1){i++;teken();}else weg();});
    rij.appendChild(door);blad.appendChild(rij);
    door.focus();
  }
  teken();
}
return {toon:toon,titel:function(){return TITEL[taal()];}};
})();


/* ---- 10-ai.html ---- */

window.PLP_AI=(function(){
var S=window.PLP_S,CFG=window.PARSELAB;
function el(a,b,c){var n=document.createElement(a);if(b)n.className=b;if(c!=null)n.textContent=c;return n;}

// De AI kijkt pas mee nadat de gebruiker ja zegt.
// AI draait op onze Claude-tegoeden; daarom alleen voor een betaald pakket.
function magAi(){
  var v=S.verbruik||{};
  if(v.ai_allowed===false||v.ai===false)return false;
  if(v.plan&&/gratis|free/i.test(String(v.plan)))return false;
  return true;
}
function pakketKaart(melding){
  var t=S.t,laag=document.createElement("div");laag.className="plp-modal";
  var blad=el("div","plp-modal-blad pld-card--navy");
  blad.appendChild(el("p","pld-caps",t.aiPlan));
  blad.appendChild(el("p","pld-text",t.aiPlanText));
  var rij=el("div","pld-row");
  var naar=el("a","pld-btn pld-btn--cream",t.aiUpgrade);naar.href=(CFG&&CFG.dashboardPath)||"/dashboard";
  var weg=el("button","pld-btn pld-btn--ghost",t.cancel);weg.type="button";
  weg.addEventListener("click",function(){laag.remove();});
  rij.appendChild(naar);rij.appendChild(weg);blad.appendChild(rij);
  laag.appendChild(blad);document.body.appendChild(laag);
  laag.addEventListener("click",function(e){if(e.target===laag)laag.remove();});
  if(melding)melding.textContent=t.aiPlan;
}

function vraag(doc,velden,klaar,melding,knop){
  if(!magAi())return pakketKaart(melding);
  var t=S.t,laag=document.createElement("div");laag.className="plp-modal";
  var blad=el("div","plp-modal-blad");
  blad.appendChild(el("p","pld-caps",t.aiTitle));
  blad.appendChild(el("p","pld-text",t.aiText));
  var rij=el("div","pld-row");
  var ja=el("button","pld-btn",t.aiYes),nee=el("button","pld-btn pld-btn--ghost",t.aiNo);
  ja.type="button";nee.type="button";
  rij.appendChild(ja);rij.appendChild(nee);blad.appendChild(rij);
  laag.appendChild(blad);document.body.appendChild(laag);
  function weg(){laag.remove();}
  nee.addEventListener("click",weg);
  laag.addEventListener("click",function(e){if(e.target===laag)weg();});
  ja.addEventListener("click",function(){
    weg();knop.disabled=true;melding.textContent=t.aiBusy;
    haalAi(doc,velden).then(function(nieuw){
      knop.disabled=false;
      if(!nieuw){melding.textContent=t.aiOff;return;}
      // Eén AI-controle is één tegoed; dat telt apart van de pagina's.
      try{if(CFG&&CFG.client)CFG.client.rpc("record_usage",{p_tool:"parsepdf-ai",p_pages:1});}catch(e){}
      // Het voorstel gaat pas door nadat de gebruiker het goedkeurt.
      if(window.PLP_L)window.PLP_L.goedkeuring(velden,nieuw,klaar,melding);
      else {nieuw.forEach(function(v){
        var bestaand=velden.filter(function(x){return x.waarde===v.waarde;})[0];
        if(bestaand){if(v.naam)bestaand.naam=v.naam;bestaand.bron="ai";}
        else velden.push({aan:true,slim:true,naam:v.naam,waarde:v.waarde,bron:"ai",vak:{pagina:-1,x:0,y:0,b:0,h:0},
                          labelvak:null,vindregel:{type:"patroonwaarde",waarde:v.waarde},filter:"geen"});
      });melding.textContent=t.aiDone;klaar();}
    }).catch(function(){knop.disabled=false;melding.textContent=t.aiOff;});
  });
}

function haalAi(doc,velden){
  var eind=(CFG&&CFG.aiEndpoint)||"/api/parsepdf/velden";
  if(!/^https?:$/.test(location.protocol))return Promise.resolve(null);
  var kop={"content-type":"application/json"};
  return sessie().then(function(token){
  if(token)kop.authorization="Bearer "+token;
  return fetch(eind,{method:"POST",headers:kop,
    body:JSON.stringify({tekst:(doc.tekst||"").slice(0,20000),
      cellen:(doc.cellen||[]).slice(0,400).map(function(c){return {t:c.t,x:Math.round(c.x),y:Math.round(c.y),p:c.pagina};}),
      gevonden:velden.map(function(v){return {naam:v.naam,waarde:v.waarde,aan:!!v.aan};})})
  }).then(function(r){
    if(!r.ok)return null;
    return r.json().then(function(j){return (j&&j.velden)||null;});
  }).catch(function(){return null;});
  });
}

// Het toegangsbewijs van de ingelogde gebruiker; de server kijkt daarmee of het pakket klopt.
function sessie(){
  if(!CFG||!CFG.client)return Promise.resolve(null);
  return CFG.client.auth.getSession().then(function(r){
    return (r&&r.data&&r.data.session&&r.data.session.access_token)||null;
  }).catch(function(){return null;});
}

return {vraag:vraag,haal:haalAi,mag:magAi};
})();


/* ---- 11-sjablonen.html ---- */

window.PLP_SJ=(function(){
var SLEUTEL="pl_parsepdf_mappen";
var ST=window.PLP_ST;

function lees(){
  try{var d=JSON.parse(localStorage.getItem(SLEUTEL)||"null");if(d&&d.mappen)return d;}catch(e){}
  return {mappen:[],actief:null};
}
function bewaar(d){try{localStorage.setItem(SLEUTEL,JSON.stringify(d));}catch(e){}return d;}
function id(){return "m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function nieuweMap(naam){
  var d=lees(),m={id:id(),naam:naam||"Nieuwe map",sjablonen:[]};
  d.mappen.push(m);d.actief=m.id;bewaar(d);return m;
}
function verwijderMap(mid){
  var d=lees();
  d.mappen=d.mappen.filter(function(m){return m.id!==mid;});
  if(d.actief===mid)d.actief=d.mappen.length?d.mappen[0].id:null;
  bewaar(d);
}
function map(mid){return lees().mappen.filter(function(m){return m.id===mid;})[0]||null;}
function kiesMap(mid){var d=lees();d.actief=mid;bewaar(d);}

function bewaarSjabloon(mid,sj){
  var d=lees(),m=d.mappen.filter(function(x){return x.id===mid;})[0];
  if(!m)return null;
  sj.id=sj.id||id();sj.gebruikt=sj.gebruikt||0;
  m.sjablonen=m.sjablonen.filter(function(x){return x.id!==sj.id;});
  m.sjablonen.push(sj);bewaar(d);return sj;
}
function verwijderSjabloon(mid,sid){
  var d=lees(),m=d.mappen.filter(function(x){return x.id===mid;})[0];
  if(!m)return;
  m.sjablonen=m.sjablonen.filter(function(x){return x.id!==sid;});bewaar(d);
}
function telGebruik(mid,sid){
  var d=lees(),m=d.mappen.filter(function(x){return x.id===mid;})[0];
  if(!m)return;
  m.sjablonen.forEach(function(s){if(s.id===sid)s.gebruikt=(s.gebruikt||0)+1;});
  bewaar(d);
}

// De vingerafdruk van een document: welke vaste teksten erin staan, waar de
// kolommen beginnen, en de nummers die de afzender verraden.
function vingerafdruk(doc,analyse){
  var cellen=doc.cellen||[],breed=(doc.maten&&doc.maten[0]&&doc.maten[0].breed)||595;
  // De labels die de herkenning gebruikte plus de vaste teksten op de pagina:
  // dat is wat bij dezelfde afzender gelijk blijft, ook als de bedragen wijzigen.
  var teksten=(analyse.velden||[]).map(function(v){return (v.vindregel&&v.vindregel.label)||"";})
    .concat(cellen.filter(function(c){return ST.labelachtig(c.t)&&!ST.vind(c.t);})
                  .map(function(c){return c.t;}))
    .map(function(t){return String(t).toLowerCase().trim();}).filter(Boolean);
  var uniek=[];teksten.forEach(function(t){if(uniek.indexOf(t)<0&&uniek.length<40)uniek.push(t);});
  var kenmerken=[];
  ST.patronen.forEach(function(p){
    if(["iban","btwnl","kvk","url"].indexOf(p.naam)<0)return;
    var m=(doc.tekst||"").match(ST.re(p));
    if(m)kenmerken.push(p.naam+":"+m[0].replace(/\s/g,"").toLowerCase());
  });
  return {teksten:uniek,
          kolommen:(analyse.kolommen||[]).map(function(k){return Math.round(k.x/breed*1000)/1000;}),
          kenmerken:kenmerken};
}

// Score: harde kenmerken wegen het zwaarst, dan de vaste teksten, dan de layout.
function score(va,vb){
  if(!va||!vb)return 0;
  var punten=0;
  (va.kenmerken||[]).forEach(function(k){if((vb.kenmerken||[]).indexOf(k)>=0)punten+=3;});
  var raak=0;
  (va.teksten||[]).forEach(function(t){if((vb.teksten||[]).indexOf(t)>=0)raak++;});
  punten+=Math.min(6,raak);
  var ka=va.kolommen||[],kb=vb.kolommen||[];
  if(ka.length&&kb.length){
    var gelijk=ka.filter(function(x){return kb.some(function(y){return Math.abs(x-y)<0.02;});}).length;
    if(gelijk/Math.max(ka.length,kb.length)>0.6)punten+=2;
  }
  return punten;
}

// Welk sjabloon uit deze map hoort bij dit document?
function kies(mid,doc,analyse){
  var m=map(mid);
  if(!m||!m.sjablonen.length)return null;
  var va=vingerafdruk(doc,analyse),beste=null,best=0;
  m.sjablonen.forEach(function(s){
    var p=score(va,s.vingerafdruk);
    if(p>best){best=p;beste=s;}
  });
  if(!beste||best<3)return null;
  return {sjabloon:beste,score:best,zeker:best>=6};
}


// De kaart in het scherm: kies een map, zie welke sjablonen erin zitten.
function kaart(){
  var S=window.PLP_S,U=window.PLP_UI,t=S.t,el=U.el;
  var d=lees(),k=el("div","pld-card");
  k.appendChild(el("p","pld-text",t.foldersHint));
  var rij=el("div","plp-mapkies");
  var kies2=el("select","pld-sel");
  var leeg=el("option","",t.useRules);leeg.value="";kies2.appendChild(leeg);
  d.mappen.forEach(function(m){
    var o=el("option","",m.naam+" ("+m.sjablonen.length+")");o.value=m.id;
    if(m.id===d.actief)o.selected=true;kies2.appendChild(o);
  });
  kies2.addEventListener("change",function(){kiesMap(kies2.value||null);U.teken();});
  var naam=el("input","pld-in");naam.placeholder=t.folderName;
  var maak=el("button","pld-btn pld-btn--sm",t.newFolder);maak.type="button";
  maak.addEventListener("click",function(){
    if(!naam.value.trim())return;
    nieuweMap(naam.value.trim());U.teken();
  });
  rij.appendChild(kies2);rij.appendChild(naam);rij.appendChild(maak);
  k.appendChild(rij);

  var m=d.actief?map(d.actief):null;
  if(!d.mappen.length){k.appendChild(el("p","pld-text",t.noFolders));return k;}
  if(!m)return k;
  k.appendChild(el("p","pld-caps",t.templates));
  if(!m.sjablonen.length)k.appendChild(el("p","pld-text",t.noTemplates));
  m.sjablonen.forEach(function(sj){
    var r=el("div","plp-file"),links=el("div");
    links.appendChild(el("p","pld-text",sj.naam));
    links.appendChild(el("p","plp-mono",sj.regels.length+" "+t.fields+" · "+(sj.gebruikt||0)+" "+t.used));
    var weg=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.delTemplate);weg.type="button";
    weg.addEventListener("click",function(){verwijderSjabloon(m.id,sj.id);U.teken();});
    r.appendChild(links);r.appendChild(weg);k.appendChild(r);
  });
  if(m.sjablonen.length)k.appendChild(el("p","pld-text",t.useFolder));
  var onder=el("div","pld-row");
  var wegMap=el("button","pld-btn pld-btn--ghost pld-btn--sm",t.delFolder);wegMap.type="button";
  wegMap.addEventListener("click",function(){verwijderMap(m.id);U.teken();});
  onder.appendChild(wegMap);k.appendChild(onder);
  return k;
}


// Vanuit het voorstel: de gekozen velden als sjabloon in een map bewaren.
function opslaanKnop(regelsVan,doc,analyse,melding){
  var S=window.PLP_S,U=window.PLP_UI,t=S.t,el=U.el;
  var doos=el("div","plp-mapkies");
  var naam=el("input","pld-in");naam.placeholder=t.templateName;
  var kies2=el("select","pld-sel"),d=lees();
  d.mappen.forEach(function(m){var o=el("option","",m.naam);o.value=m.id;if(m.id===d.actief)o.selected=true;kies2.appendChild(o);});
  var nieuw=el("option","","+ "+t.newFolder);nieuw.value="__nieuw";kies2.appendChild(nieuw);
  var knop=el("button","pld-btn pld-btn--ghost",t.saveTemplate);knop.type="button";
  knop.addEventListener("click",function(){
    var regels=regelsVan();
    if(!regels.length||!naam.value.trim())return;
    var mid=kies2.value;
    if(mid==="__nieuw"||!mid)mid=nieuweMap(naam.value.trim()).id;
    bewaarSjabloon(mid,{naam:naam.value.trim(),regels:regels,vingerafdruk:vingerafdruk(doc,analyse),
                        uitvoer:regels.some(function(r){return r.type==="tabelkolom";})?"regel":"document"});
    kiesMap(mid);
    melding.textContent=t.savedTemplate.replace("{map}",(map(mid)||{}).naam||"");
  });
  doos.appendChild(kies2);doos.appendChild(naam);doos.appendChild(knop);
  return doos;
}

// Past dit document bij een sjabloon, en zijn de velden er ook echt in te vinden?
// Twee documenten van dezelfde afzender kunnen een andere indeling hebben; dan
// herkent hij het sjabloon wel, maar blijven de velden leeg. Dat zeggen we erbij.
function controle(mid,doc,analyse){
  var keus=kies(mid,doc,analyse);
  if(!keus)return {sjabloon:null,score:0,zeker:false,gevonden:0,totaal:0};
  var regels=(keus.sjabloon.regels||[]).filter(function(r){return r.type==="cel"&&r.vindregel;});
  var gevonden=0;
  regels.forEach(function(r){if(String(ST.pas(doc,r.vindregel)||"").trim())gevonden++;});
  return {sjabloon:keus.sjabloon,score:keus.score,zeker:keus.zeker,
          gevonden:gevonden,totaal:regels.length,
          anders:regels.length>0&&gevonden<Math.ceil(regels.length/2)};
}

return {controle:controle,kaart:kaart,opslaanKnop:opslaanKnop,lees:lees,bewaar:bewaar,nieuweMap:nieuweMap,verwijderMap:verwijderMap,map:map,kiesMap:kiesMap,
        bewaarSjabloon:bewaarSjabloon,verwijderSjabloon:verwijderSjabloon,telGebruik:telGebruik,
        vingerafdruk:vingerafdruk,kies:kies,score:score};
})();


/* ---- 12-verwerken.html ---- */

(function(){
var CFG=window.PARSELAB,P=window.PLP,T=window.PLP_T,S=window.PLP_S,U=window.PLP_UI;
if(!CFG||!CFG.client||!P||!T||!S||!U){console.error("ParsePDF: onderdelen ontbreken");return;}
var sb=CFG.client;

window.PLP_RUN=function(knop,rij){
var t=S.t;
if(!S.bestanden.length){U.meld(t.errNoFiles,"warn");return;}
var SJ=window.PLP_SJ,d=SJ?SJ.lees():{mappen:[]},mapId=d.actief;
var mp=mapId&&SJ?SJ.map(mapId):null;
var perMap=!!(mp&&mp.sjablonen.length);   // sjablonen uit de map, of de regels hieronder
var actief=S.regels.filter(bruikbaar);
if(!perMap&&!actief.length){U.meld(t.errNoRules,"warn");return;}
knop.disabled=true;knop.textContent=t.counting;
var stand=U.el("p","pld-text");stand.setAttribute("role","status");rij.appendChild(stand);
var lijst=S.bestanden.slice(),totaal=0,fouten=[],keten=Promise.resolve();
lijst.forEach(function(f){
keten=keten.then(function(){return P.tel(f);})
.then(function(n){totaal+=n;})
.catch(function(){fouten.push(f.name+" "+t.errRead);});});
keten.then(function(){
if(!totaal){herstel(knop);U.meld(fouten.join(" ")||t.errLib,"warn");return null;}
var over=U.over();
if(totaal>over){herstel(knop);S.root.insertBefore(U.limietKaart(totaal,over),S.root.firstChild);
window.scrollTo({top:0,behavior:"smooth"});return null;}
return sb.rpc("record_usage",{p_tool:"parsepdf",p_pages:totaal}).then(function(r){
if(r.error)throw new Error("usage");
knop.textContent=t.reading;
var uit=[],kolommen=[],geteld={},onbekend=0,n=0,k2=Promise.resolve();
lijst.forEach(function(f){
k2=k2.then(function(){return P.lees(f);})
.then(function(doc){
var regels=actief,naam=null;
if(perMap){
  var c=SJ.controle?SJ.controle(mapId,doc,window.PLP_ST.analyse(doc)):null;
  var keus=c&&c.sjabloon?{sjabloon:c.sjabloon}:SJ.kies(mapId,doc,window.PLP_ST.analyse(doc));
  if(keus&&keus.sjabloon){
    regels=keus.sjabloon.regels.filter(bruikbaar);naam=keus.sjabloon.naam;
    SJ.telGebruik(mapId,keus.sjabloon.id);geteld[naam]=(geteld[naam]||0)+1;
    // Zelfde afzender, andere indeling: het sjabloon past wel maar de velden niet.
    if(c&&c.anders)fouten.push(f.name+" "+t.matchMaybe.replace("{naam}",naam).replace("{g}",c.gevonden).replace("{t}",c.totaal));
  }
  else {regels=[];onbekend++;}
}
regels.forEach(function(x){if(kolommen.indexOf(x.naam)<0)kolommen.push(x.naam);});
var r2=P.rij(doc,regels);
if(r2.leeg)fouten.push(f.name+" "+t.scanned);
perRegel(doc,r2,regels).forEach(function(rr){
  var op={};regels.forEach(function(x,i){op[x.naam]=rr.velden["k"+i];});
  uit.push({naam:rr.naam,paginas:rr.paginas,sjabloon:naam,opNaam:op,leeg:rr.leeg});
});
n++;stand.textContent=n+" / "+lijst.length;})
.catch(function(){fouten.push(f.name+" "+t.errRead);});});
return k2.then(function(){
if(perMap)kolommen.unshift(t.colTemplate);
// De kolommen van de uitvoer staan los van de veldregels in het scherm: bij een map
// verschillen ze per document, en je regels moeten na afloop blijven staan.
S.kolommen=kolommen.map(function(naam){return {naam:naam,filter:"geen"};});
S.rijen=uit.map(function(r){
  var velden={};
  kolommen.forEach(function(naam,i){
    velden["k"+i]=naam===t.colTemplate&&perMap?(r.sjabloon||t.unknown):(r.opNaam[naam]||"");
  });
  return {naam:r.naam,paginas:r.paginas,velden:velden,leeg:r.leeg};
});
if(S.verbruik)S.verbruik.used=Number(S.verbruik.used||0)+totaal;
S.bestanden=[];U.teken();
var uitleg=[];
if(perMap){
  var namen=Object.keys(geteld).map(function(k){return geteld[k]+" \u00D7 "+k;});
  if(namen.length)uitleg.push(t.recognised.replace("{lijst}",namen.join(" \u00B7 ")));
  if(onbekend===1)uitleg.push(t.oneUnknown);
  else if(onbekend>1)uitleg.push(t.manyUnknown.replace("{n}",onbekend));
}
if(uitleg.length)U.meld(uitleg.join(" "));
if(fouten.length)U.meld(fouten.join(" "),"warn");});});
}).catch(function(e){
console.error(e);herstel(knop);
U.meld(e&&e.message==="usage"?t.errUsage:t.errLib,"warn");});
};

function bruikbaar(r){return r.naam&&(r.type==="bestand"||r.type==="cel"||r.type==="tabelkolom"||r.waarde);}

// Staan er tabelkolommen in het sjabloon, dan wordt elke regel uit de tabel een rij,
// met de kopvelden van het document erbij herhaald.
function perRegel(doc,basis,actief){
  var kolommen=actief.filter(function(r){return r.type==="tabelkolom";});
  if(!kolommen.length||!window.PLP_ST)return [basis];
  var tab=window.PLP_ST.analyse(doc).tabel;
  if(!tab||!tab.rijen.length)return [basis];
  return tab.rijen.map(function(rij){
    var velden={};
    Object.keys(basis.velden).forEach(function(k){velden[k]=basis.velden[k];});
    actief.forEach(function(r,i){if(r.type==="tabelkolom")velden["k"+i]=rij[r.kolom]||"";});
    return {naam:basis.naam,paginas:basis.paginas,velden:velden,leeg:basis.leeg};
  });
}

function herstel(knop){knop.disabled=false;knop.textContent=S.t.start;}

function start(){
var root=document.getElementById("pl-parsepdf-root");
if(!root)return;
S.root=root;S.t=T.nl;
root.innerHTML="";
var laden=document.createElement("p");laden.className="pld-text";laden.textContent=T.nl.loading;
root.appendChild(laden);
sb.auth.getSession().then(function(r){
if(!r.data.session){window.location.replace(CFG.loginPath);return;}
return Promise.all([
sb.from("profiles").select("locale").eq("id",r.data.session.user.id).maybeSingle(),
sb.rpc("usage_summary")
]).then(function(res){
var p=(res[0]&&res[0].data)||{};
S.taal=T[p.locale]?p.locale:"nl";S.t=T[S.taal];
document.documentElement.lang=S.taal;
var u=res[1]&&res[1].data;if(Array.isArray(u))u=u[0];
S.verbruik=u||null;S.regels=U.laadRegels();U.teken();});
}).catch(function(e){
console.error(e);root.innerHTML="";
var p=document.createElement("p");p.className="pld-msg pld-msg--warn";
p.textContent=S.t.err||S.t.errRead;root.appendChild(p);});
}
document.readyState!=="loading"?start():document.addEventListener("DOMContentLoaded",start);
})();


})();
