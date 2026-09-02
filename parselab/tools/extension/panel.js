/*
 * WebTool Scraper — content-script paneel (één gecombineerde flow)
 * Draait op de ECHTE pagina. Bouw één flow met stappen door elkaar heen:
 * scrapen, formulier vullen en knoppen drukken. Klik "+ Stap", kies wat je wilt,
 * en selecteer het doel op de pagina. Draai de flow één keer, of per CSV-rij.
 */
(function () {
    'use strict';
    const doc = document;
    const ACCENT = '#2563eb';

    // ============================================================ i18n (talen)
    let LANG = 'nl';
    try { LANG = localStorage.getItem('wt-lang') || (navigator.language || 'nl').slice(0, 2); } catch (e) {}
    const LANGS = { nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
    if (!LANGS[LANG]) LANG = 'en';
    const I18N = {
        intro: { nl: 'Bouw één flow: scrapen, formulier vullen en knop drukken in elke volgorde. Klik + Stap, kies wat je wilt en selecteer het op de pagina.', en: 'Build one flow: scrape, fill forms and click buttons in any order. Click + Step, pick what you want and select it on the page.', de: 'Baue einen Ablauf: scrapen, Formulare ausfüllen und Buttons klicken in beliebiger Reihenfolge. Klicke + Schritt und wähle es auf der Seite.', fr: 'Créez un flux : scraper, remplir des formulaires et cliquer, dans n’importe quel ordre. Cliquez + Étape et sélectionnez sur la page.', es: 'Crea un flujo: scrapear, rellenar formularios y hacer clic, en cualquier orden. Pulsa + Paso y selecciónalo en la página.' },
        chat: { nl: 'Bouw met opdrachten', en: 'Build with commands', de: 'Mit Befehlen bauen', fr: 'Construire par commandes', es: 'Construir con comandos' },
        chat_hint: { nl: 'Typ wat je wilt, bv.: scrape de prijs · vul veld met {{Naam}} · klik Opslaan · wacht 2s · screenshot · herhaal 5 · map shirts · submap per relatienummer · start', en: 'Type what you want, e.g.: scrape the price · fill field with {{Name}} · click Save · wait 2s · screenshot · repeat 5 · folder shirts · subfolder per id · start', de: 'Tippe was du willst, z.B.: scrape den Preis · Feld füllen mit {{Name}} · klick Speichern · warte 2s · Screenshot · wiederhole 5 · Ordner shirts · Unterordner pro id · start', fr: 'Écris ce que tu veux, ex.: scrape le prix · remplir champ avec {{Nom}} · clique Enregistrer · attends 2s · capture · répète 5 · dossier shirts · sous-dossier par id · start', es: 'Escribe lo que quieres, ej.: scrapear el precio · rellenar campo con {{Nombre}} · clic Guardar · esperar 2s · captura · repetir 5 · carpeta shirts · subcarpeta por id · start' },
        h_steps: { nl: 'Stappen', en: 'Steps', de: 'Schritte', fr: 'Étapes', es: 'Pasos' },
        add_step: { nl: 'Stap toevoegen', en: 'Add step', de: 'Schritt hinzufügen', fr: 'Ajouter une étape', es: 'Añadir paso' },
        h_data: { nl: 'Data voor invullen (optioneel)', en: 'Data for filling (optional)', de: 'Daten zum Ausfüllen (optional)', fr: 'Données de remplissage (facultatif)', es: 'Datos para rellenar (opcional)' },
        h_run: { nl: 'Uitvoeren', en: 'Run', de: 'Ausführen', fr: 'Exécuter', es: 'Ejecutar' },
        start: { nl: 'Start', en: 'Start', de: 'Start', fr: 'Démarrer', es: 'Iniciar' },
        busy: { nl: 'Bezig…', en: 'Running…', de: 'Läuft…', fr: 'En cours…', es: 'En curso…' },
        stop: { nl: 'Stop', en: 'Stop', de: 'Stopp', fr: 'Arrêter', es: 'Parar' },
        pause: { nl: 'Pauze', en: 'Pause', de: 'Pause', fr: 'Pause', es: 'Pausa' },
        resume: { nl: 'Hervat', en: 'Resume', de: 'Fortsetzen', fr: 'Reprendre', es: 'Reanudar' },
        upload_data: { nl: 'Upload data', en: 'Upload data', de: 'Daten hochladen', fr: 'Importer données', es: 'Subir datos' },
        dl_result: { nl: 'Download uitkomst', en: 'Download result', de: 'Ergebnis herunterladen', fr: 'Télécharger résultat', es: 'Descargar resultado' },
        save_flow: { nl: 'Bewaar flow', en: 'Save flow', de: 'Ablauf speichern', fr: 'Enregistrer flux', es: 'Guardar flujo' },
        more: { nl: 'Meer opties', en: 'More options', de: 'Mehr Optionen', fr: 'Plus d’options', es: 'Más opciones' },
        data_hint: { nl: 'Upload een CSV → de flow draait één keer per rij. In een cel kun je {{Naam}} of {{Prijs*1.21}} gebruiken.', en: 'Upload a CSV → the flow runs once per row. In a cell you can use {{Name}} or {{Price*1.21}}.', de: 'CSV hochladen → der Ablauf läuft einmal pro Zeile. In einer Zelle: {{Name}} oder {{Preis*1.21}}.', fr: 'Importez un CSV → le flux s’exécute une fois par ligne. Dans une cellule: {{Nom}} ou {{Prix*1.21}}.', es: 'Sube un CSV → el flujo se ejecuta una vez por fila. En una celda: {{Nombre}} o {{Precio*1.21}}.' },
        pick_csv: { nl: 'CSV kiezen…', en: 'Pick CSV…', de: 'CSV wählen…', fr: 'Choisir CSV…', es: 'Elegir CSV…' },
        clear_csv: { nl: 'CSV wissen', en: 'Clear CSV', de: 'CSV löschen', fr: 'Effacer CSV', es: 'Borrar CSV' },
        mcp_toggle: { nl: 'MCP-koppeling', en: 'MCP link', de: 'MCP-Verbindung', fr: 'Liaison MCP', es: 'Enlace MCP' },
        mcp_hint: { nl: 'MCP-koppeling: laat een AI-agent de velden ophalen en records automatisch invullen (bv. 30×) via een lokale MCP-server. Alleen localhost.', en: 'MCP link: let an AI agent read the fields and auto-fill records (e.g. 30×) via a local MCP server. Localhost only.', de: 'MCP-Verbindung: ein KI-Agent liest die Felder und füllt Datensätze automatisch (z.B. 30×) über einen lokalen MCP-Server. Nur localhost.', fr: 'Liaison MCP : un agent IA lit les champs et remplit des enregistrements (ex. 30×) via un serveur MCP local. Localhost uniquement.', es: 'Enlace MCP: un agente de IA lee los campos y rellena registros (p. ej. 30×) mediante un servidor MCP local. Solo localhost.' },
        check_links: { nl: 'Check koppelingen', en: 'Check links', de: 'Verknüpfungen prüfen', fr: 'Vérifier liens', es: 'Verificar enlaces' },
        exp_as: { nl: 'exporteer als', en: 'export as', de: 'exportieren als', fr: 'exporter en', es: 'exportar como' },
        save: { nl: 'Bewaar', en: 'Save', de: 'Speichern', fr: 'Enregistrer', es: 'Guardar' },
        load: { nl: 'Laad', en: 'Load', de: 'Laden', fr: 'Charger', es: 'Cargar' },
        h_dl: { nl: 'Downloads & resultaat', en: 'Downloads & result', de: 'Downloads & Ergebnis', fr: 'Téléchargements & résultat', es: 'Descargas y resultado' },
        dl_folder: { nl: 'map in Downloads', en: 'folder in Downloads', de: 'Ordner in Downloads', fr: 'dossier dans Téléchargements', es: 'carpeta en Descargas' },
        dl_group: { nl: 'submap per kolom', en: 'subfolder per column', de: 'Unterordner pro Spalte', fr: 'sous-dossier par colonne', es: 'subcarpeta por columna' },
        h_result: { nl: 'Flow beheren', en: 'Manage flow', de: 'Ablauf verwalten', fr: 'Gérer le flux', es: 'Gestionar flujo' },
        copy: { nl: 'Kopieer', en: 'Copy', de: 'Kopieren', fr: 'Copier', es: 'Copiar' },
        webhook_send: { nl: 'Verstuur', en: 'Send', de: 'Senden', fr: 'Envoyer', es: 'Enviar' },
        preset_saveas: { nl: 'Bewaar als', en: 'Save as', de: 'Speichern als', fr: 'Enregistrer sous', es: 'Guardar como' },
        exp_flow: { nl: 'Flow-bestand', en: 'Flow file', de: 'Ablaufdatei', fr: 'Fichier de flux', es: 'Archivo de flujo' },
        importf: { nl: 'Importeer', en: 'Import', de: 'Importieren', fr: 'Importer', es: 'Importar' },
        theme: { nl: 'Thema', en: 'Theme', de: 'Thema', fr: 'Thème', es: 'Tema' },
        side: { nl: 'Kant', en: 'Side', de: 'Seite', fr: 'Côté', es: 'Lado' },
        onerror: { nl: 'bij fout', en: 'on error', de: 'bei Fehler', fr: 'en cas d’erreur', es: 'si hay error' },
        err_skip: { nl: 'overslaan', en: 'skip', de: 'überspringen', fr: 'ignorer', es: 'omitir' },
        err_stop: { nl: 'stop', en: 'stop', de: 'stopp', fr: 'arrêter', es: 'parar' },
        m_scrape_el: { nl: 'Element scrapen', en: 'Scrape element', de: 'Element scrapen', fr: 'Scraper élément', es: 'Scrapear elemento' },
        m_scrape_list: { nl: 'Lijst scrapen', en: 'Scrape list', de: 'Liste scrapen', fr: 'Scraper liste', es: 'Scrapear lista' },
        m_fill: { nl: 'Formulier vullen', en: 'Fill form', de: 'Formular ausfüllen', fr: 'Remplir formulaire', es: 'Rellenar formulario' },
        m_setval: { nl: 'Veld invullen', en: 'Fill field', de: 'Feld ausfüllen', fr: 'Remplir champ', es: 'Rellenar campo' },
        m_select: { nl: 'Dropdown', en: 'Dropdown', de: 'Dropdown', fr: 'Liste déroulante', es: 'Desplegable' },
        m_click: { nl: 'Knop drukken', en: 'Click button', de: 'Button klicken', fr: 'Cliquer bouton', es: 'Pulsar botón' },
        m_type: { nl: 'Typ tekst', en: 'Type text', de: 'Text tippen', fr: 'Taper texte', es: 'Escribir texto' },
        m_key: { nl: 'Toets', en: 'Key', de: 'Taste', fr: 'Touche', es: 'Tecla' },
        m_hover: { nl: 'Hover', en: 'Hover', de: 'Hover', fr: 'Survol', es: 'Hover' },
        m_scroll: { nl: 'Scroll naar', en: 'Scroll to', de: 'Scrollen zu', fr: 'Défiler vers', es: 'Desplazar a' },
        m_scrollload: { nl: 'Scroll & laad', en: 'Scroll & load', de: 'Scrollen & laden', fr: 'Défiler & charger', es: 'Desplazar y cargar' },
        m_waitfor: { nl: 'Wacht op element', en: 'Wait for element', de: 'Auf Element warten', fr: 'Attendre élément', es: 'Esperar elemento' },
        m_cond: { nl: 'Voorwaarde', en: 'Condition', de: 'Bedingung', fr: 'Condition', es: 'Condición' },
        m_images: { nl: 'Bestanden', en: 'Files', de: 'Dateien', fr: 'Fichiers', es: 'Archivos' },
        m_webhook: { nl: 'Webhook', en: 'Webhook', de: 'Webhook', fr: 'Webhook', es: 'Webhook' },
        m_wait: { nl: 'Wachten', en: 'Wait', de: 'Warten', fr: 'Attendre', es: 'Esperar' },
        m_shot: { nl: 'Screenshot', en: 'Screenshot', de: 'Screenshot', fr: 'Capture', es: 'Captura' },
        m_print: { nl: 'Print', en: 'Print', de: 'Drucken', fr: 'Imprimer', es: 'Imprimir' }
    };
    function t(k) { const e = I18N[k]; return (e && (e[LANG] || e.nl)) || k; }
    function applyI18n(rt) {
        rt.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
        rt.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    }

    // ============================================================ scraper-kern
    function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function readValue(el, attr) {
        if (!el) return null;
        attr = attr || 'text';
        if (attr === 'text') return txt(el);
        if (attr === 'html') return el.innerHTML.trim();
        if (attr === 'value') {
            if (el.matches && el.matches('input[type=checkbox],input[type=radio]')) return el.checked;
            return el.value != null ? el.value : null;
        }
        if (attr in el && typeof el[attr] !== 'object' && typeof el[attr] !== 'function') return el[attr];
        return el.getAttribute(attr);
    }
    // Opschonen van een gescrapete waarde: trim, alleen het getal, of een regex.
    function applyTransform(v, t) {
        if (v == null || !t || !t.mode || t.mode === 'none') return v;
        let s = String(v);
        if (t.mode === 'trim') return s.replace(/\s+/g, ' ').trim();
        if (t.mode === 'number') {
            const m = s.replace(/\s/g, '').match(/-?\d[\d.,]*/);
            if (!m) return '';
            let n = m[0];
            if (n.indexOf(',') > -1 && n.indexOf('.') > -1) n = n.replace(/\./g, '').replace(',', '.');
            else if (n.indexOf(',') > -1) n = n.replace(',', '.');
            return n;
        }
        if (t.mode === 'regex') {
            try { const re = new RegExp(t.pattern || '', t.flags || ''); const mm = re.exec(s); if (!mm) return ''; return mm[1] != null ? mm[1] : mm[0]; }
            catch (e) { return s; }
        }
        return s;
    }
    function scrapeTable(table) {
        const rows = Array.from(table.querySelectorAll('tr')).filter(tr => tr.children.length);
        if (!rows.length) return [];
        const head = Array.from(rows[0].children);
        const hasHead = head.some(c => c.tagName === 'TH');
        const headers = head.map((c, i) => (hasHead && txt(c)) ? txt(c) : 'col' + (i + 1));
        return (hasHead ? rows.slice(1) : rows).map(tr => {
            const o = {}; Array.from(tr.children).forEach((c, i) => o[headers[i] || 'col' + (i + 1)] = txt(c)); return o;
        });
    }
    // vullen
    function setNativeValue(el, value) {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
            : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const d = Object.getOwnPropertyDescriptor(proto, 'value');
        if (d && d.set) d.set.call(el, value); else el.value = value;
    }
    function fire(el, names) { names.forEach(n => el.dispatchEvent(new Event(n, { bubbles: true }))); }
    const sleep = ms => new Promise(r => setTimeout(r, ms));   // module-niveau (ook bruikbaar in fillElement/pickFromPopup)
    const pad2 = n => String(n).padStart(2, '0');
    // Zet een datum om naar het formaat dat een <input type="date"> vereist (JJJJ-MM-DD).
    // Herkent 30-11-2002, 30/11/2002, 30.11.2002 en 2002-11-30.
    function toISODate(s) {
        s = String(s == null ? '' : s).trim();
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
        m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/); if (m) return m[3] + '-' + pad2(m[2]) + '-' + pad2(m[1]);
        return '';
    }
    // Is dit een "nep-select": een readonly invoer die een popup-lijst opent
    // (MudBlazor .mud-select-input, of een ARIA-combobox / listbox)?
    function isPopupSelect(el) {
        if (!el || el.tagName !== 'INPUT') return false;
        const cls = el.className || '';
        return /mud-select-input/.test(cls)
            || el.getAttribute('role') === 'combobox'
            || /listbox|menu|dialog/.test(el.getAttribute('aria-haspopup') || '')
            || ((el.readOnly || el.hasAttribute('readonly')) && /select|dropdown|combobox/i.test(cls));
    }
    // Open de dropdown, kies de optie die bij de waarde past (exact → hoofdletter-
    // ongevoelig → bevat), en sluit. Werkt voor MudBlazor en ARIA-listboxen.
    async function pickFromPopup(el, value) {
        const s = String(value == null ? '' : value).trim(), sl = s.toLowerCase();
        if (!s) return true;
        const clickSeq = t => ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(n => t.dispatchEvent(new MouseEvent(n, { bubbles: true, cancelable: true, view: window })));
        el.focus(); clickSeq(el);
        for (let i = 0; i < 8; i++) {   // wacht tot de opties verschijnen
            await sleep(90);
            const opts = Array.from(doc.querySelectorAll('.mud-list-item, .mud-select-item, [role="option"], li[role="menuitem"], .mud-list .mud-list-item'))
                .filter(o => o.getClientRects().length);
            if (!opts.length) continue;
            const otxt = o => (o.textContent || '').replace(/\s+/g, ' ').trim();
            const m = opts.find(o => otxt(o) === s) || opts.find(o => otxt(o).toLowerCase() === sl) || opts.find(o => otxt(o).toLowerCase().includes(sl));
            if (m) { m.scrollIntoView({ block: 'nearest' }); clickSeq(m); await sleep(120); return true; }
        }
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));   // niets gevonden → sluiten
        return false;
    }
    // Klik je bij het aanwijzen op een icoon, rand of wrapper van een veld (vaak bij
    // MudBlazor/andere component-dropdowns), pak dan het echte invoerveld eronder.
    function resolveField(el) {
        if (!el) return el;
        const FC = 'input:not([type=hidden]),select,textarea';
        if ((el.matches && el.matches(FC)) || el.isContentEditable) return el;
        // Klim omhoog: het dichtstbijzijnde blok dat een echt veld bevat, wint.
        let node = el;
        for (let i = 0; i < 5 && node && node.tagName !== 'BODY' && node.tagName !== 'HTML'; i++) {
            if (node.querySelector) { const f = node.querySelector('input.mud-select-input,' + FC); if (f) return f; }
            node = node.parentElement;
        }
        return el;
    }
    function isBlazor(el) { try { return el.getAttributeNames().some(a => a.indexOf('_bl_') === 0); } catch (e) { return false; } }
    function isMudInput(el) { return el.tagName === 'INPUT' && /(^|\s)mud-input/.test(el.className || ''); }
    // Gemaskeerde/framework-velden (o.a. MudBlazor MudMask/MudDatePicker) lezen het
    // NATIVE input-event na een echte invoer. Synthetische keydowns voegen geen tekst in,
    // dus gebruiken we execCommand('insertText') — dat voegt de tekens écht in (zoals typen)
    // en laat beforeinput/input vuren, precies wat MudMask verwerkt. Bij een datum-/getalmasker
    // typen we alleen de cijfers (het masker zet zelf de streepjes). Werkt insertText niet
    // (oude browser), dan valt hij terug op el.value + input/change.
    async function typeInto(el, text) {
        const full = String(text == null ? '' : text);
        // Volledige waarde teken voor teken typen: een masker absorbeert zelf de
        // scheidingstekens, een gewoon veld houdt ze — dus geen aannames nodig.
        const toType = full;
        try { el.focus(); } catch (e) {}
        // leegmaken: alles selecteren en verwijderen (echt, zodat het masker het volgt)
        try { el.setSelectionRange(0, (el.value || '').length); } catch (e) {}
        let cleared = false;
        try { cleared = document.execCommand('delete', false); } catch (e) {}
        if (!cleared && (el.value || '') !== '') { setNativeValue(el, ''); fire(el, ['input']); }
        let anyInsert = false;
        for (const ch of toType) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }));
            let ok = false;
            try { ok = document.execCommand('insertText', false, ch); } catch (e) {}
            if (!ok) { setNativeValue(el, (el.value || '') + ch); el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch, inputType: 'insertText' })); }
            else anyInsert = true;
            el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
            await sleep(15);
        }
        // Kwam er niets in? → hele waarde in één keer (laatste redmiddel).
        if ((el.value || '').replace(/\s/g, '') === '') { setNativeValue(el, full); fire(el, ['input']); }
        fire(el, ['change']);
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        return true;
    }
    async function fillElement(el, value) {
        if (!el) return false;
        if (el.isContentEditable) { el.textContent = String(value); fire(el, ['input']); return true; }
        if (isPopupSelect(el)) return await pickFromPopup(el, value);
        const tag = el.tagName;
        if (tag === 'SELECT') {
            // Dropdown: match op exacte waarde/optietekst, dan hoofdletter-ongevoelig,
            // dan gedeeltelijk (bevat). Zo werkt "Utrecht" ook als de optie "Utrecht (NL)" heet.
            const s = String(value).trim(), sl = s.toLowerCase();
            const opts = Array.from(el.options);
            const match = opts.find(o => o.value === s || txt(o) === s)
                || opts.find(o => o.value.toLowerCase() === sl || txt(o).toLowerCase() === sl)
                || (sl ? opts.find(o => txt(o).toLowerCase().includes(sl) || (o.value || '').toLowerCase().includes(sl)) : null);
            el.value = match ? match.value : s;
            fire(el, ['input', 'change']); return true;
        }
        if (tag === 'INPUT' && el.type === 'checkbox') {
            const want = value === true || value === 'true' || value === 1 || value === '1' || value === 'on' || value === 'ja';
            if (el.checked !== want) el.click(); return true;
        }
        if (tag === 'INPUT' && el.type === 'radio') {
            const group = el.name ? Array.from((el.form || doc).querySelectorAll('input[type=radio]' + attrSel(el.name))) : [el];
            const t = group.find(r => r.value === String(value)) || (value === true ? el : null);
            if (t && !t.checked) t.click(); return !!t;
        }
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            let v = String(value == null ? '' : value);
            if (tag === 'INPUT' && el.type === 'date') v = toISODate(v) || v;   // native datumveld wil JJJJ-MM-DD
            // MudBlazor/gemaskeerde velden: teken voor teken typen (anders verhaspelt het masker de waarde).
            if (isMudInput(el) || isBlazor(el) || (el.type === 'text' && /[dMyY#0]/.test(el.placeholder || '') && /[-\/.\s]/.test(el.placeholder || ''))) return await typeInto(el, v);
            try { el.focus(); } catch (e) {}
            // Altijd eerst leegmaken zodat oude inhoud weg is (ook als het veld al gevuld was).
            if ((el.value || '') !== '') { setNativeValue(el, ''); fire(el, ['input']); }
            setNativeValue(el, v);
            fire(el, ['input', 'change']);
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
            return true;
        }
        el.textContent = String(value); return true;
    }
    // Attribuutwaarde veilig in dubbele quotes (voor name met $, punten, spaties enz.)
    function attrSel(name) { return '[name="' + String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]'; }
    function findFieldIn(scope, key) {
        let el = scope.querySelector(attrSel(key)); if (el) return el;
        try { el = scope.querySelector('#' + CSS.escape(key)); if (el) return el; } catch (e) {}
        const low = key.toLowerCase();
        for (const lab of scope.querySelectorAll('label')) {
            if (lab.textContent.toLowerCase().includes(low)) {
                const f = lab.getAttribute('for'); if (f && doc.getElementById(f)) return doc.getElementById(f);
                const ins = lab.querySelector('input,textarea,select'); if (ins) return ins;
            }
        }
        for (const c of scope.querySelectorAll('input,textarea,select')) {
            const hay = ((c.placeholder || '') + ' ' + (c.getAttribute('aria-label') || '') + ' ' + (c.name || '') + ' ' + (c.id || '')).toLowerCase();
            if (hay.includes(low)) return c;
        }
        return null;
    }
    // export
    function toCSV(rows) {
        if (!Array.isArray(rows)) rows = [rows];
        if (!rows.length) return '';
        const keys = Object.keys(rows.reduce((a, r) => (Object.keys(r || {}).forEach(k => a[k] = 1), a), {}));
        return [keys.map(csvCell).join(';')].concat(rows.map(r => keys.map(k => csvCell(r ? r[k] : '')).join(';'))).join('\n');
    }
    // ';' = scheidingsteken (NL-Excel); alleen quoten bij ';', '"' of nieuwe regel → "€ 4,55" blijft heel.
    function csvCell(v) { if (v == null) v = ''; v = Array.isArray(v) ? v.join(' | ') : (typeof v === 'object' ? JSON.stringify(v) : String(v)); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

    // ---- binaire export: mini-ZIP (store) + eenvoudige .xlsx ----
    const CRCT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRCT[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
    function strBytes(s) { return new TextEncoder().encode(s); }
    function zipStore(files) {
        const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
        const parts = [], central = []; let offset = 0;
        files.forEach(f => {
            const nameB = strBytes(f.name), crc = crc32(f.bytes), size = f.bytes.length;
            const local = new Uint8Array([].concat([0x50, 0x4b, 0x03, 0x04], u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0)));
            parts.push(local, nameB, f.bytes);
            central.push(new Uint8Array([].concat([0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), nameB);
            offset += local.length + nameB.length + f.bytes.length;
        });
        let cenSize = 0; central.forEach(c => cenSize += c.length);
        const end = new Uint8Array([].concat([0x50, 0x4b, 0x05, 0x06], u16(0), u16(0), u16(files.length), u16(files.length), u32(cenSize), u32(offset), u16(0)));
        const all = parts.concat(central, [end]); let total = 0; all.forEach(a => total += a.length);
        const out = new Uint8Array(total); let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
        return out;
    }
    function xmlEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function colRef(n) { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
    function toXlsx(rows) {
        rows = Array.isArray(rows) ? rows : [rows];
        const keys = Object.keys(rows.reduce((a, r) => { Object.keys(r || {}).forEach(k => a[k] = 1); return a; }, {}));
        const cell = (c, r, v) => { if (v != null && typeof v === 'object') v = JSON.stringify(v); return '<c r="' + colRef(c) + r + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; };
        let sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        sheet += '<row r="1">' + keys.map((k, c) => cell(c, 1, k)).join('') + '</row>';
        rows.forEach((r, ri) => { sheet += '<row r="' + (ri + 2) + '">' + keys.map((k, c) => cell(c, ri + 2, r ? r[k] : '')).join('') + '</row>'; });
        sheet += '</sheetData></worksheet>';
        const CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
        const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
        const WB = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>';
        const WBR = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
        return zipStore([
            { name: '[Content_Types].xml', bytes: strBytes(CT) },
            { name: '_rels/.rels', bytes: strBytes(RELS) },
            { name: 'xl/workbook.xml', bytes: strBytes(WB) },
            { name: 'xl/_rels/workbook.xml.rels', bytes: strBytes(WBR) },
            { name: 'xl/worksheets/sheet1.xml', bytes: strBytes(sheet) }
        ]);
    }
    function bytesToB64(u8) { let s = ''; const c = 0x8000; for (let i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); }
    function downloadBytes(bytes, filename, mime) { chrome.runtime.sendMessage({ type: 'wt-download', dataB64: bytesToB64(bytes), mime, filename, folder: currentFolder }); }
    let currentFolder = 'webtool';   // map in Downloads waar alles heen gaat
    function sanitizeFolder(f) { return String(f || '').replace(/[\\:*?"<>|]/g, '').replace(/^\/+|\/+$/g, '').trim(); }
    function download(data, filename) {
        const isObj = typeof data !== 'string';
        let text = isObj ? JSON.stringify(data, null, 2) : data;
        const isJson = isObj || /\.json$/i.test(filename);
        const mime = isJson ? 'application/json' : 'text/csv';
        // UTF-8 BOM voor CSV → Excel toont € en accenten goed (geen "â‚¬").
        if (!isJson && text.charCodeAt(0) !== 0xFEFF) text = '﻿' + text;
        chrome.runtime.sendMessage({ type: 'wt-download', data: text, filename, mime, folder: currentFolder });
    }
    function copy(data) {
        const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        return navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.resolve();
    }
    function cssPath(el) {
        if (!el || el.nodeType !== 1) return '';
        if (el.id) return '#' + CSS.escape(el.id);
        const path = []; let n = el;
        while (n && n.nodeType === 1 && n.tagName !== 'HTML') {
            let part = n.tagName.toLowerCase();
            if (n.id) { path.unshift('#' + CSS.escape(n.id)); break; }
            const cls = Array.from(n.classList).find(c => !/^(active|hover|focus|selected|open|wt-)/.test(c));
            if (cls) {
                part += '.' + CSS.escape(cls);
                if (n.parentElement && n.parentElement.querySelectorAll(':scope > ' + part).length === 1) { path.unshift(part); n = n.parentElement; continue; }
            }
            let i = 1, s = n; while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
            part += ':nth-of-type(' + i + ')'; path.unshift(part); n = n.parentElement;
        }
        while (path.length > 1 && doc.querySelectorAll(path.slice(1).join(' > ')).length === 1) path.shift();
        return path.join(' > ');
    }

    // ============================================ Octoparse-stijl lijst-detectie
    function primaryClass(el) { return Array.from(el.classList || []).find(c => !/^(active|hover|focus|selected|open|current|wt-)/i.test(c)) || null; }
    function sigSelector(el) { const c = primaryClass(el); return el.tagName.toLowerCase() + (c ? '.' + CSS.escape(c) : ''); }
    function relSelector(root, el) {
        const parts = []; let n = el;
        while (n && n !== root && n.nodeType === 1) {
            const c = primaryClass(n); let part = n.tagName.toLowerCase(); if (c) part += '.' + CSS.escape(c);
            const same = Array.from(n.parentElement.children).filter(x => x.tagName === n.tagName);
            if (same.length > 1) part = n.tagName.toLowerCase() + ':nth-of-type(' + (same.indexOf(n) + 1) + ')';
            parts.unshift(part); n = n.parentElement;
        }
        return parts.join(' > ');
    }
    function colName(el, taken) {
        let base = primaryClass(el); if (base) base = base.replace(/[^a-z0-9_-]/gi, '');
        if (!base) base = el.tagName === 'A' ? 'link' : /^H[1-6]$/.test(el.tagName) ? 'titel' : el.tagName.toLowerCase();
        let name = base, i = 2; while (taken.has(name)) name = base + '_' + (i++); taken.add(name); return name;
    }
    function matchingRecords(node, sig) {
        let recs = node.parentElement ? Array.from(node.parentElement.children).filter(ch => { try { return ch.matches(sig); } catch (e) { return false; } }) : [];
        if (recs.length < 2) { const all = Array.from(doc.querySelectorAll(sig)); if (all.length >= 2 && all.indexOf(node) !== -1) recs = all; }
        return recs;
    }
    function detectColumns(record) {
        const cols = [], taken = new Set();
        record.querySelectorAll('*').forEach(d => {
            const isLink = d.tagName === 'A', leaf = d.children.length === 0 && txt(d).length > 0;
            if (!isLink && !leaf) return;
            const rel = relSelector(record, d); if (!rel || cols.some(c => c.rel === rel)) return;
            cols.push({ name: colName(d, taken), rel, isLink });
        });
        return cols.slice(0, 12);
    }
    function readField(rec, c) { const t = c.rel ? rec.querySelector(c.rel) : rec; if (!t) return null; return c.isLink ? (t.getAttribute('href') ? t.href : null) : txt(t); }
    function autoDetectList(el) {
        let best = null, node = el;
        for (let d = 0; node && node.nodeType === 1 && node !== doc.body && d < 9; d++, node = node.parentElement) {
            const sig = sigSelector(node); let records = matchingRecords(node, sig);
            if (records.length < 2) continue;
            const columns = detectColumns(node); if (!columns.length) continue;
            records = records.filter(r => columns.some(c => readField(r, c))); if (records.length < 2) continue;
            if (!best || records.length > best.records.length || (records.length === best.records.length && columns.length > best.columns.length))
                best = { sig, columns, count: records.length };
        }
        return best;
    }
    function scrapeList(spec) {
        const recs = Array.from(doc.querySelectorAll(spec.sig));
        const rows = [];
        recs.forEach(rec => { const row = {}; let any = false; spec.columns.forEach(c => { const v = readField(rec, c); row[c.name] = v; if (v) any = true; }); if (any) rows.push(row); });
        return rows;
    }

    // ============================================ formulier lezen / CSV
    // Leesbaar label van een veld: echte <label for>, omringende <label>, MudBlazor
    // .mud-input-label, dan aria-label/placeholder.
    function fieldLabel(el) {
        try { if (el.id) { const l = doc.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l && txt(l)) return txt(l); } } catch (e) {}
        const wrap = el.closest && el.closest('label'); if (wrap && txt(wrap)) return txt(wrap);
        const ctrl = el.closest && el.closest('.mud-input-control, .mud-form-control, .mud-input-control-input-container, .field, .form-group');
        if (ctrl) { const ml = ctrl.querySelector('.mud-input-label, label, .mud-form-control-label'); if (ml && txt(ml)) return txt(ml); }
        return (el.getAttribute && (el.getAttribute('aria-label') || el.placeholder)) || '';
    }
    function readFormFieldsIn(scope) {
        const fields = [], seen = new Set();
        scope.querySelectorAll('input,select,textarea').forEach(el => {
            if (/^(hidden|submit|button|reset|image|file)$/i.test(el.type)) return;
            // Sla hulp-invoervelden van kalenders/pickers over (bv. MudDatePicker toont een
            // kalender-popover met maand/jaar-velden). Zo blijft één datumveld ook één kolom.
            if (el.closest('.mud-picker-content,.mud-picker-calendar,.mud-popover,.mud-overlay,[role="dialog"],[role="tooltip"]')) return;
            const key = el.name || el.id; if (!key || seen.has(key)) return; seen.add(key);
            const label = fieldLabel(el);
            const selector = el.id ? '#' + CSS.escape(el.id)
                : el.name ? el.tagName.toLowerCase() + attrSel(el.name) : cssPath(el);
            fields.push({ key, label, type: (el.type || el.tagName.toLowerCase()), selector });
        });
        return fields;
    }
    function cleanCol(s) { return String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/[*:]+\s*$/, '').trim(); }
    // Automatisch gegenereerde namen (MudBlazor "mudinputx8y9", React ":r3:", lange hex/id's)
    // en formaat-maskers ("dd-MM-yyyy") zijn geen goede kolomnamen.
    function looksGenerated(s) { return !s || /mudinput|^:r|[0-9a-f]{6,}|\d{4,}/i.test(String(s)); }
    function isMaskLike(s) { s = String(s || ''); return /[dmyh#0]/i.test(s) && /^[dmyhs#0\-\/.\s:]+$/i.test(s); }
    function buildColumnMap(fields) {
        const taken = new Set();
        return fields.map((f, idx) => {
            let base = cleanCol(f.label);
            if (!base || isMaskLike(base) || looksGenerated(base)) base = (f.key && !looksGenerated(f.key)) ? f.key : ('veld' + (idx + 1));
            let col = base, i = 2;
            while (taken.has(col.toLowerCase())) col = base + ' ' + (i++);
            taken.add(col.toLowerCase());
            return { col, selector: f.selector, key: f.key, label: f.label, on: true };
        });
    }
    function enabledCols(s) { return (s.colmap || []).filter(m => m.on !== false); }
    function updateFillDetail(s) { const en = enabledCols(s), tot = (s.colmap || []).length; s.detail = en.length + '/' + tot + ' velden: ' + en.map(m => m.col).join(', '); }
    // ---- Robuuste veld-herkenning ----
    // MudBlazor/React geven velden elke pagina-load een NIEUW willekeurig id (mudinput…),
    // dus een opgeslagen "#id" werkt na een refresh niet meer. We bewaren daarom een
    // vingerafdruk (naam/placeholder/label/…) + de HTML, en zoeken het veld daarmee terug.
    function attrOf(el, a) { return (el.getAttribute && el.getAttribute(a)) || ''; }
    // Alleen stabiele klassen (geen status/gegenereerde klassen die per render veranderen).
    function stableClasses(el) {
        return Array.from(el.classList || []).filter(c => !looksGenerated(c) &&
            !/(^|-)(focused|dirty|touched|invalid|valid|active|open|selected|checked|disabled|error|hover|ng-|is-|mud-shrink|mud-error)/i.test(c));
    }
    // Structuurpad: tag + :nth-of-type, verankerd op een stabiel id/form. Geen vluchtige id's/namen.
    function nodeSel(el) {
        let s = el.tagName.toLowerCase();
        const par = el.parentElement;
        if (par) { const same = Array.from(par.children).filter(c => c.tagName === el.tagName); if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')'; }
        return s;
    }
    function structSelector(el) {
        const parts = []; let node = el, depth = 0;
        while (node && node.nodeType === 1 && node.tagName !== 'BODY' && node.tagName !== 'HTML' && depth < 8) {
            if (node.id && !looksGenerated(node.id)) { try { parts.unshift('#' + CSS.escape(node.id)); break; } catch (e) {} }
            parts.unshift(nodeSel(node)); node = node.parentElement; depth++;
        }
        return parts.join('>');
    }
    // Vingerafdruk = HTML-structuur (pad, type, stabiele klassen) + de HTML zelf. Géén naam/label.
    function fingerprint(el) {
        return {
            tag: el.tagName,
            typ: (attrOf(el, 'type') || '').toLowerCase(),
            cls: stableClasses(el).slice(0, 6),
            ph: attrOf(el, 'placeholder'),
            path: structSelector(el),
            html: (el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 500)
        };
    }
    function stableSel(el) { return structSelector(el); }
    // Grove HTML-gelijkenis op attribuut-tokens (structuur, niet inhoud).
    function htmlSim(a, b) {
        const ta = new Set(String(a || '').match(/[a-z0-9\-]+=/gi) || []); const tb = String(b || '').match(/[a-z0-9\-]+=/gi) || [];
        if (!ta.size) return 0; let hit = 0; tb.forEach(t => { if (ta.has(t)) hit++; }); return hit / Math.max(ta.size, tb.length || 1);
    }
    // Zoek het element terug op basis van HTML-STRUCTUUR (niet op naam): eerst het structuurpad,
    // anders de best scorende kandidaat op type + stabiele klassen + placeholder + HTML-gelijkenis.
    function findByFingerprint(fp, scope) {
        scope = scope || doc; if (!fp) return null;
        if (fp.path) { try { const e = scope.querySelector(fp.path); if (e) return e; } catch (_) {} }
        const cands = Array.from(scope.querySelectorAll((fp.tag || 'input').toLowerCase()));
        let best = null, bs = 0;
        cands.forEach(el => {
            let s = 0;
            if (fp.typ && (attrOf(el, 'type') || '').toLowerCase() === fp.typ) s += 2;
            const cls = stableClasses(el); s += Math.min((fp.cls || []).filter(c => cls.includes(c)).length, 4);
            if (fp.ph && attrOf(el, 'placeholder') === fp.ph) s += 2;
            if (fp.path && structSelector(el) === fp.path) s += 5;
            s += htmlSim(fp.html, el.outerHTML) * 3;
            if (s > bs) { bs = s; best = el; }
        });
        return bs >= 3 ? best : null;
    }
    // Vind het doel-element van een stap: eerst de (structuur)selector, anders de vingerafdruk.
    function targetEl(s, scope) {
        scope = scope || doc;
        let el = null;
        try { el = s.selector ? scope.querySelector(s.selector) : null; } catch (e) {}
        if (!el && s.selector) { try { el = doc.querySelector(s.selector); } catch (e) {} }
        if (!el && s.fp) el = findByFingerprint(s.fp, scope) || findByFingerprint(s.fp, doc);
        return el;
    }
    // Detecteer het scheidingsteken uit de kopregel (NL-Excel gebruikt ';', ook tab/komma).
    function detectDelim(line) {
        const strip = line.replace(/"[^"]*"/g, '');
        const c = (strip.match(/,/g) || []).length, s = (strip.match(/;/g) || []).length, t = (strip.match(/\t/g) || []).length;
        if (s >= c && s >= t && s > 0) return ';';
        if (t >= c && t > 0) return '\t';
        return ',';
    }
    function parseCSV(text) {
        text = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');   // BOM + regeleindes
        const delim = detectDelim((text.split('\n')[0] || ''));
        const rows = []; let i = 0, field = '', row = [], inQ = false;
        while (i < text.length) {
            const c = text[i];
            if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
            else if (c === '"') inQ = true;
            else if (c === delim) { row.push(field); field = ''; }
            else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
            else field += c;
            i++;
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        const clean = rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
        if (!clean.length) return [];
        const head = clean[0].map(h => h.trim());
        return clean.slice(1).map(r => { const o = {}; head.forEach((h, j) => o[h] = r[j] != null ? r[j] : ''); return o; });
    }
    // ---- Variabelen in invulwaarden: {{Naam}} = eerder gescrapete/CSV-waarde,
    //      {{Prijs*1.21}} = rekenen met een factor. ----
    function parseNum(v) {
        let s = String(v == null ? '' : v).replace(/[^\d.,-]/g, '');
        if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.');
        else if (s.indexOf(',') > -1) s = s.replace(',', '.');
        const n = parseFloat(s); return isNaN(n) ? null : n;
    }
    function safeEval(expr) {
        const toks = String(expr).match(/(\d+\.?\d*|[()+\-*/])/g); if (!toks) return null;
        const out = [], ops = [], prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
        const apply = () => { const op = ops.pop(); const b = out.pop(), a = out.pop(); if (a == null || b == null) return false; out.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b); return true; };
        for (const t of toks) {
            if (/^\d/.test(t)) out.push(parseFloat(t));
            else if (t === '(') ops.push(t);
            else if (t === ')') { while (ops.length && ops[ops.length - 1] !== '(') if (!apply()) return null; ops.pop(); }
            else { while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) if (!apply()) return null; ops.push(t); }
        }
        while (ops.length) { if (ops[ops.length - 1] === '(') return null; if (!apply()) return null; }
        return out.length === 1 ? out[0] : null;
    }
    function resolveValue(val, ctx) {
        if (val == null || String(val).indexOf('{{') === -1) return val;
        const keys = Object.keys(ctx || {}).sort((a, b) => b.length - a.length);
        return String(val).replace(/\{\{([^}]+)\}\}/g, (m, expr) => {
            expr = expr.trim();
            const direct = keys.find(k => k.toLowerCase() === expr.toLowerCase());
            if (direct != null) return ctx[direct] == null ? '' : String(ctx[direct]);
            // Een datum (30-11-2002) is geen rekensom → nooit uitrekenen (anders 30-11-2002 = -1983).
            if (/^\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}$/.test(expr)) return expr;
            let e = expr;
            keys.forEach(k => { const n = parseNum(ctx[k]); if (n != null) e = e.split(k).join('(' + n + ')'); });
            const r = safeEval(e);
            if (r == null) return m;
            return Number.isInteger(r) ? String(r) : String(Math.round(r * 100) / 100);
        });
    }

    async function fillRowWith(row, colmap, scope, ctx) {
        scope = scope || doc; ctx = ctx || row;
        const rep = { filled: [], missed: [] };
        for (const col of Object.keys(row || {})) {
            const c = col.trim();
            let m = (colmap || []).find(x => x.col.toLowerCase() === c.toLowerCase())
                || (colmap || []).find(x => (x.label || '').toLowerCase() === c.toLowerCase() || (x.key || '').toLowerCase() === c.toLowerCase());
            let el = m ? (scope.querySelector(m.selector) || doc.querySelector(m.selector)) : null;
            if (!el) el = findFieldIn(scope, c);
            const value = resolveValue(row[col], ctx);
            if (el && await fillElement(el, value)) rep.filled.push(c); else rep.missed.push(c);
        }
        return rep;
    }

    // ============================================================ paneel (shadow DOM)
    function buildPanel() {
        if (window.__WT_PANEL__) { if (window.__wtHost) window.__wtHost.style.display = 'block'; return; }
        window.__WT_PANEL__ = true;
    const host = doc.createElement('div');
    host.id = 'wt-scraper-host';
    host.style.cssText = 'position:fixed;top:16px;right:16px;left:auto;bottom:auto;inset:auto;margin:0;padding:0;border:0;background:transparent;z-index:2147483647;width:384px;max-width:calc(100vw - 24px);';
    (doc.body || doc.documentElement).appendChild(host);
    window.__wtHost = host;
    // Top layer: zet het paneel via de Popover-API in de browser-top-layer. Dat staat boven
    // ELKE page-overlay/modaal (ongeacht z-index of DOM-volgorde) en blijft klikbaar.
    let usingPopover = false;
    function showTop() {
        if (host.showPopover) {
            try {
                if (!host.hasAttribute('popover')) host.setAttribute('popover', 'manual');
                if (!host.matches(':popover-open')) host.showPopover();
                usingPopover = true;
            } catch (e) { usingPopover = false; }
        }
    }
    showTop();
    const root = host.attachShadow({ mode: 'open' });
    // Houd het paneel bovenaan én klikbaar, ook als de pagina later een modaal/overlay opent
    // (die bij gelijke z-index anders de klikken opvangt). We verplaatsen de host naar het einde
    // van de body zodat hij als LAATSTE — en dus bovenop — staat. Niet verplaatsen terwijl je in
    // het paneel typt (dat zou focus verliezen).
    let topT = null;
    function raiseNeeded() {   // staat er ná ons paneel een overlay/modaal die klikken zou opvangen?
        let n = host.nextElementSibling;
        while (n) {
            if (n.nodeType === 1 && n.id !== 'wt-scraper-host') {
                const cls = (n.className && n.className.toString && n.className.toString()) || '';
                let pos = '', z = NaN; try { const cs = getComputedStyle(n); pos = cs.position; z = parseInt(cs.zIndex, 10); } catch (e) {}
                if (/overlay|backdrop|modal|dialog|drawer|scrim|popover|mud-/i.test(cls) || pos === 'fixed' || pos === 'absolute' || z >= 1000) return true;
            }
            n = n.nextElementSibling;
        }
        return false;
    }
    function keepOnTop() {
        const b = doc.body; if (!b || !host.parentNode) return;
        if (host.style.zIndex !== '2147483647') host.style.zIndex = '2147483647';
        // Popover-modus: het paneel zit in de browser-top-layer → altijd bovenop, geen DOM-verhuizing
        // nodig. We houden 'm alleen open als de pagina hem zou hebben gesloten.
        if (usingPopover) { if (host.showPopover && !host.matches(':popover-open')) { try { host.showPopover(); } catch (e) { showTop(); } } return; }
        const a = root.activeElement; if (a && a.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
        if (b.lastElementChild !== host && raiseNeeded()) { try { b.appendChild(host); } catch (e) {} }
    }
    const topObs = new MutationObserver(() => { clearTimeout(topT); topT = setTimeout(keepOnTop, 60); });
    try { topObs.observe(doc.body || doc.documentElement, { childList: true }); } catch (e) {}
    const topIv = setInterval(keepOnTop, 1500);   // vangnet
    root.innerHTML = panelHTML();
    function $(s) { return root.querySelector(s); }
    function $all(s) { return Array.from(root.querySelectorAll(s)); }
    applyI18n(root);
    $('#wt-lang').addEventListener('change', function () {
        LANG = this.value; try { localStorage.setItem('wt-lang', LANG); chrome.storage.local.set({ 'wt-lang': LANG }); } catch (e) {}
        applyI18n(root); renderSteps(); renderFlow();
        if (!RUNNING) $('#flow-run').innerHTML = IC('play') + ' <span data-i18n="start">' + t('start') + '</span>';
    });
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function flash(btn, t) { const o = btn.textContent; btn.textContent = t; setTimeout(() => btn.textContent = o, 1200); }

    window.__WT_TOGGLE__ = () => { host.style.display = host.style.display === 'none' ? 'block' : 'none'; };
    $('#wt-close').onclick = () => cleanup();
    $('#wt-min').onclick = () => { $('.wt-body').classList.toggle('wt-hidden'); };

    // ---- generieke pick op de echte pagina ----
    let picking = false, pickHandler = null;
    const overlay = doc.createElement('div'); overlay.className = 'wt-ovl'; overlay.style.display = 'none';
    const ovlLabel = doc.createElement('div'); ovlLabel.className = 'wt-ovl-label'; overlay.appendChild(ovlLabel);
    doc.body.appendChild(overlay);
    // De highlight-/aanwijs-box in de browser-top-layer (via popover), zodat hij óók boven
    // pagina-modals/overlays zichtbaar is. position:fixed → viewport-coördinaten (geen scroll).
    function ovlShow(r) {
        overlay.style.position = 'fixed';
        overlay.style.left = r.left + 'px'; overlay.style.top = r.top + 'px';
        overlay.style.width = r.width + 'px'; overlay.style.height = r.height + 'px';
        if (overlay.showPopover) {
            try { overlay.style.display = ''; if (!overlay.hasAttribute('popover')) overlay.setAttribute('popover', 'manual'); if (!overlay.matches(':popover-open')) overlay.showPopover(); return; } catch (e) {}
        }
        overlay.style.display = 'block';
    }
    function ovlHide() {
        try { if (overlay.showPopover && overlay.matches && overlay.matches(':popover-open')) { overlay.hidePopover(); return; } } catch (e) {}
        overlay.style.display = 'none';
    }
    function beginPick(handler, hint) {
        picking = true; pickHandler = handler;
        const h = $('#wt-pickhint'); h.textContent = (hint || 'Klik op de pagina') + ' — Esc annuleert'; h.style.display = 'block';
    }
    function endPick() { picking = false; pickHandler = null; ovlHide(); $('#wt-pickhint').style.display = 'none'; }
    // Toon het gekoppelde element met een blauwe omlijning (bij klikken op een stap).
    let hlTimer = null;
    function highlightEl(el) {
        if (!el || picking) return false;
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        const r = el.getBoundingClientRect();
        ovlShow(r);
        ovlLabel.textContent = 'gekoppeld element';
        ovlLabel.style.top = (r.top < 24 ? r.height + 2 : -20) + 'px';
        clearTimeout(hlTimer); hlTimer = setTimeout(() => { if (!picking) ovlHide(); }, 1800);
        return true;
    }
    function isOurs(t) { return t === host || host.contains(t) || t === overlay || overlay.contains(t) || (t.className && String(t.className).indexOf('wt-') === 0); }
    doc.addEventListener('mousemove', e => {
        if (!picking) return;
        const t = e.target; if (!t || isOurs(t)) { ovlHide(); return; }
        const r = t.getBoundingClientRect();
        ovlShow(r);
        let d = t.tagName.toLowerCase(); if (t.id) d += '#' + t.id; else if (t.classList[0]) d += '.' + t.classList[0];
        ovlLabel.textContent = d + ' · ' + Math.round(r.width) + '×' + Math.round(r.height);
        ovlLabel.style.top = (r.top < 24 ? r.height + 2 : -20) + 'px';
    }, true);
    // Tijdens het aanwijzen: muis-neer/pointer-neer blokkeren zodat de pagina niet
    // reageert (bv. een dropdown die opengaat of een overlay die de klik opvangt).
    ['pointerdown', 'mousedown', 'mouseup'].forEach(evt => doc.addEventListener(evt, e => {
        if (!picking || !e.isTrusted) return;
        if (isOurs(e.target)) return;
        e.preventDefault(); e.stopPropagation();
    }, true));
    doc.addEventListener('click', e => {
        if (!picking || !e.isTrusted) return;
        const t = e.target; if (!t || isOurs(t)) return;
        e.preventDefault(); e.stopPropagation();
        const h = pickHandler; endPick(); if (h) h(t);
    }, true);
    doc.addEventListener('keydown', e => { if (e.key === 'Escape' && picking) endPick(); }, true);

    // ---- flow-model ----
    let steps = [];        // {id,type:'scrape'|'fill'|'click'|'wait', ...}
    let stepSeq = 1;
    let flowRows = [];     // uit CSV
    let results = [], running = false, stopReq = false, pauseReq = false;

    function fieldColName(el, fallbackIdx) {
        const lbl = cleanCol(fieldLabel(el));
        if (lbl && !looksGenerated(lbl) && !isMaskLike(lbl)) return lbl;
        const nm = el.name && !looksGenerated(el.name) ? cleanCol(el.name) : '';
        return nm || ('veld' + fallbackIdx);
    }
    function addStep(step) { step.id = stepSeq++; if (step.rep == null) step.rep = 1; steps.push(step); renderSteps(); renderFlow(); persist(); }
    function insertStep(idx, step) { step.id = stepSeq++; if (step.rep == null) step.rep = 1; steps.splice(idx, 0, step); renderSteps(); renderFlow(); persist(); }

    // + menu
    $('#flow-add').onclick = () => { const m = $('#flow-add-menu'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; };
    $all('[data-add]').forEach(b => b.onclick = () => {
        $('#flow-add-menu').style.display = 'none';
        const kind = b.dataset.add;
        const addElementScrape = el => {
            const attr = el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text');
            const preview = (txt(el) ? txt(el).slice(0, 24) : (el.getAttribute && el.getAttribute('alt')) || el.tagName.toLowerCase()) || 'waarde';
            const n = steps.filter(s => s.type === 'scrape' && s.kind === 'element').length + 1;
            addStep({ type: 'scrape', kind: 'element', name: preview, col: 'kolom' + n, selector: cssPath(el), attr, detail: preview + ' · ' + cssPath(el) });
        };
        if (kind === 'scrape-el') beginPick(addElementScrape, 'Klik precies het element dat je wilt scrapen (bv. één cel / waarde)');
        else if (kind === 'scrape-list') beginPick(el => {
            const det = autoDetectList(el);
            if (det) addStep({ type: 'scrape', kind: 'list', name: 'Scrape lijst', spec: det, detail: det.count + ' items × ' + det.columns.length + ' kol.' });
            else { log('  ⓘ Geen herhalende lijst gevonden hier — als los element toegevoegd.'); addElementScrape(el); }
        }, 'Klik één item van een lijst/tabel — de hele lijst wordt herkend');
        else if (kind === 'fill') beginPick(el => {
            const form = el.closest('form') || el;
            const fields = readFormFieldsIn(form);
            const colmap = buildColumnMap(fields);
            const st = { type: 'fill', name: 'Vul formulier', selector: cssPath(form), colmap };
            updateFillDetail(st);
            addStep(st);
        }, 'Klik op het formulier dat je wilt invullen');
        else if (kind === 'setval') beginPick(el => {
            el = resolveField(el);
            if (el.tagName === 'BODY' || el.tagName === 'HTML') { log('  ⚠ Geen invoerveld herkend — klik precies op het veld/de dropdown zelf.', true); return; }
            const n = steps.filter(s => s.type === 'setval' || s.type === 'select').length + 1;
            const col = fieldColName(el, n);
            addStep({ type: 'setval', name: 'Veld: ' + col.slice(0, 22), selector: stableSel(el), fp: fingerprint(el), value: '{{' + col + '}}', detail: (isPopupSelect(el) ? 'dropdown · ' : '') + col });
        }, 'Klik het invoerveld/de dropdown die je een waarde wilt geven');
        else if (kind === 'select') beginPick(el => {
            el = resolveField(el);
            if (el.tagName === 'BODY' || el.tagName === 'HTML') { log('  ⚠ Geen dropdown herkend — klik precies op de dropdown zelf.', true); return; }
            const n = steps.filter(s => s.type === 'setval' || s.type === 'select').length + 1;
            const col = fieldColName(el, n);
            const kindTxt = el.tagName === 'SELECT' ? 'select' : (isPopupSelect(el) ? 'dropdown' : 'veld');
            addStep({ type: 'select', name: 'Dropdown: ' + col.slice(0, 20), selector: stableSel(el), fp: fingerprint(el), value: '{{' + col + '}}', detail: kindTxt + ' · ' + col });
        }, 'Klik op de dropdown/keuzelijst die je wilt kiezen');
        else if (kind === 'click') beginPick(el => {
            const btn = (el.closest && el.closest('button,a,[role="button"],.mud-button-root,input[type="submit"],input[type="button"]')) || el;
            addStep({ type: 'click', name: (txt(btn) || btn.value || btn.tagName.toLowerCase()).slice(0, 24) || 'knop', selector: stableSel(btn), fp: fingerprint(btn), detail: cssPath(btn) });
        }, 'Klik op de knop die ingedrukt moet worden');
        else if (kind === 'wait') addStep({ type: 'wait', ms: 1000 });
        else if (kind === 'print') addStep({ type: 'print', name: 'Print (Ctrl+P)', detail: 'opent de printdialoog' });
        else if (kind === 'shot') addStep({ type: 'shot', name: 'Screenshot', detail: 'zichtbare pagina → PNG' });
        else if (kind === 'type') beginPick(el => { el = resolveField(el); addStep({ type: 'type', name: 'Typ tekst', selector: stableSel(el), fp: fingerprint(el), text: '', enter: false, detail: cssPath(el) }); }, 'Klik het invoerveld waar je tekst in wilt typen');
        else if (kind === 'key') addStep({ type: 'key', name: 'Toets', key: 'Enter', detail: 'stuur een toets' });
        else if (kind === 'hover') beginPick(el => addStep({ type: 'hover', name: 'Hover', selector: cssPath(el), detail: cssPath(el) }), 'Klik het element om overheen te zweven');
        else if (kind === 'scroll') beginPick(el => addStep({ type: 'scroll', name: 'Scroll naar', selector: cssPath(el), mode: 'element', detail: cssPath(el) }), 'Klik waar naartoe gescrold moet worden (of kies "naar onder")');
        else if (kind === 'scrollload') addStep({ type: 'scrollload', name: 'Scroll & laad', times: 5, pause: 800, detail: 'oneindig scrollen' });
        else if (kind === 'waitfor') beginPick(el => addStep({ type: 'waitfor', name: 'Wacht op element', selector: cssPath(el), timeout: 8000, detail: cssPath(el) }), 'Klik het element om op te wachten');
        else if (kind === 'cond') beginPick(el => addStep({ type: 'cond', name: 'Voorwaarde', selector: cssPath(el), test: 'exists', ctext: '', ifFalse: 'skip', skip: 1, detail: cssPath(el) }), 'Klik het element om op te controleren');
        else if (kind === 'images') addStep({ type: 'images', name: 'Bestanden downloaden', pattern: '\\.(png|jpe?g|webp|gif|pdf)(\\?|$)', detail: 'img/links → map' });
        else if (kind === 'webhook') addStep({ type: 'webhook', name: 'Webhook (POST)', url: '', detail: 'stuur rij naar URL' });
    });

    const BADGE = { scrape: 'SCRAPE', fill: 'VUL', click: 'KLIK', wait: 'WACHT', print: 'PRINT', shot: 'SHOT',
        setval: 'VELD', select: 'DROPDOWN', type: 'TYP', key: 'TOETS', hover: 'HOVER', scroll: 'SCROLL', scrollload: 'SCROLL+', waitfor: 'WACHT-OP', cond: 'ALS', images: 'FILES', webhook: 'WEBH' };
    const opt = (v, cur, lbl) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + (lbl || v) + '</option>';
    function stepParamsHTML(s, i) {
        const t = s.type, tr = s.transform || {};
        if (t === 'scrape' && s.kind === 'element') {
            return '<div class="stparams">kolom <input class="pin" data-i="' + i + '" data-f="col" placeholder="kolomnaam" value="' + esc(s.col || s.name || '') + '" title="Naam van de kolom in je export voor deze waarde">' +
                ' attr <select data-i="' + i + '" data-f="attr">' +
                ['text', 'html', 'href', 'src', 'alt', 'value'].map(a => opt(a, s.attr || 'text')).join('') + '</select>' +
                ' opschonen <select data-i="' + i + '" data-f="tmode">' + opt('none', tr.mode || 'none', 'geen') + opt('trim', tr.mode, 'trim') + opt('number', tr.mode, 'getal') + opt('regex', tr.mode, 'regex') + '</select>' +
                (tr.mode === 'regex' ? ' <input class="pin" data-i="' + i + '" data-f="tpattern" placeholder="regex bv. (\\d+)" value="' + esc(tr.pattern || '') + '">' : '') + '</div>';
        }
        if (t === 'fill') {
            const cm = s.colmap || [], on = cm.filter(m => m.on !== false).length;
            return '<div class="stparams stfill">' +
                '<span>velden <b>' + on + '/' + cm.length + '</b></span> ' +
                '<button class="mini" data-fall="' + i + '">alle</button> <button class="mini" data-fnone="' + i + '">geen</button>' +
                '<div class="fcols">' + cm.map((m, j) => '<label class="fcol" title="' + esc(m.selector || '') + '"><input type="checkbox" data-i="' + i + '" data-fcol="' + j + '"' + (m.on !== false ? ' checked' : '') + '> ' + esc(m.col) + '</label>').join('') + '</div></div>';
        }
        if (t === 'setval' || t === 'select') {
            const cols = flowRows.length ? Object.keys(flowRows[0]) : [];
            const tokenMatch = /^\{\{([^}]+)\}\}$/.exec(String(s.value || ''));
            const curCol = tokenMatch ? tokenMatch[1].trim() : '';
            const colSel = cols.length
                ? ' CSV-kolom <select class="pin s" data-i="' + i + '" data-f="setcol"><option value="">—</option>' + cols.map(c => opt('{{' + c + '}}', s.value, c)).join('') + '</select>'
                : '';
            return '<div class="stparams">kolom <input class="pin" data-i="' + i + '" data-f="setcolname" placeholder="bv. postcode" title="Naam van de CSV-kolom die dit veld invult" value="' + esc(curCol) + '">' +
                ' · vaste waarde <input class="pin s" data-i="' + i + '" data-f="value" placeholder="of tekst/{{Prijs*1.21}}" value="' + esc(tokenMatch ? '' : (s.value || '')) + '">' + colSel +
                ' <label title="Laat het veld met rust als de waarde leeg is (bv. niet-verplichte velden)"><input type="checkbox" data-i="' + i + '" data-f="skipEmpty"' + (s.skipEmpty !== false ? ' checked' : '') + '> leeg = overslaan</label></div>';
        }
        if (t === 'type') return '<div class="stparams">tekst <input class="pin" data-i="' + i + '" data-f="text" value="' + esc(s.text || '') + '"> <label><input type="checkbox" data-i="' + i + '" data-f="enter"' + (s.enter ? ' checked' : '') + '> Enter</label></div>';
        if (t === 'key') return '<div class="stparams">toets <input class="pin s" data-i="' + i + '" data-f="key" value="' + esc(s.key || 'Enter') + '"></div>';
        if (t === 'waitfor') return '<div class="stparams">time-out <input class="pin s" type="number" data-i="' + i + '" data-f="timeout" value="' + (s.timeout || 8000) + '"> ms</div>';
        if (t === 'scroll') return '<div class="stparams"><select data-i="' + i + '" data-f="mode">' + opt('element', s.mode, 'naar element') + opt('bottom', s.mode, 'naar onder') + '</select></div>';
        if (t === 'scrollload') return '<div class="stparams">×<input class="pin s" type="number" data-i="' + i + '" data-f="times" value="' + (s.times || 5) + '"> pauze <input class="pin s" type="number" data-i="' + i + '" data-f="pause" value="' + (s.pause || 800) + '"> ms</div>';
        if (t === 'images') return '<div class="stparams">patroon <input class="pin" data-i="' + i + '" data-f="pattern" value="' + esc(s.pattern || '') + '"></div>';
        if (t === 'webhook') return '<div class="stparams">URL <input class="pin" data-i="' + i + '" data-f="url" placeholder="https://…" value="' + esc(s.url || '') + '"></div>';
        if (t === 'cond') return '<div class="stparams">als <select data-i="' + i + '" data-f="test">' + opt('exists', s.test, 'bestaat') + opt('contains', s.test, 'bevat') + '</select>' +
            (s.test === 'contains' ? ' <input class="pin s" data-i="' + i + '" data-f="ctext" placeholder="tekst" value="' + esc(s.ctext || '') + '">' : '') +
            ' anders <select data-i="' + i + '" data-f="ifFalse">' + opt('skip', s.ifFalse, 'sla over') + opt('stop', s.ifFalse, 'stop') + '</select>' +
            (s.ifFalse !== 'stop' ? ' <input class="pin s" type="number" data-i="' + i + '" data-f="skip" value="' + (s.skip || 1) + '"> stap' : '') + '</div>';
        return '';
    }
    function bindParams(box) {
        box.querySelectorAll('.stparams [data-f]').forEach(inp => inp.addEventListener('input', () => {
            const s = steps[+inp.dataset.i], f = inp.dataset.f;
            const val = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' ? +inp.value : inp.value);
            if (f === 'tmode') { s.transform = s.transform || {}; s.transform.mode = val; renderSteps(); }
            else if (f === 'tpattern') { s.transform = s.transform || {}; s.transform.pattern = val; }
            else if (f === 'setcol') { if (val) s.value = val; renderSteps(); }
            else if (f === 'setcolname') { s.value = val.trim() ? '{{' + val.trim() + '}}' : ''; }   // kolomnaam → {{kolom}}
            else { s[f] = val; if (f === 'test' || f === 'ifFalse') renderSteps(); }
            renderFlow(); persist();
        }));
        // formulier: kies welke velden meedoen
        box.querySelectorAll('.stparams [data-fcol]').forEach(cb => cb.addEventListener('change', () => {
            const s = steps[+cb.dataset.i]; s.colmap[+cb.dataset.fcol].on = cb.checked; updateFillDetail(s);
            const wrap = cb.closest('.stfill'), bEl = wrap && wrap.querySelector('b'); if (bEl) bEl.textContent = enabledCols(s).length + '/' + (s.colmap || []).length;
            const det = wrap && wrap.closest('.stprow') && wrap.closest('.stprow').querySelector('.stdet'); if (det) { det.textContent = s.detail; det.title = s.detail; }
            renderFlow(); persist();
        }));
        box.querySelectorAll('.stparams [data-fall]').forEach(b => b.addEventListener('click', () => { const s = steps[+b.dataset.fall]; (s.colmap || []).forEach(m => m.on = true); updateFillDetail(s); renderSteps(); renderFlow(); persist(); }));
        box.querySelectorAll('.stparams [data-fnone]').forEach(b => b.addEventListener('click', () => { const s = steps[+b.dataset.fnone]; (s.colmap || []).forEach(m => m.on = false); updateFillDetail(s); renderSteps(); renderFlow(); persist(); }));
    }
    function insertPause(idx) { insertStep(idx, { type: 'wait', ms: 1000 }); }
    function inserterHTML(idx) { return '<div class="stins"><button class="stins-btn" data-ins="' + idx + '" title="Pauze tussen deze stappen (bv. wachten tot de pagina geladen is)">+ pauze</button></div>'; }
    function renderSteps() {
        const box = $('#flow-steps'); box.innerHTML = '';
        if (!steps.length) { box.innerHTML = '<div class="hint" style="padding:6px 0">Nog geen stappen. Klik <b>+ Stap toevoegen</b> en kies wat je wilt.</div>'; return; }
        let html = inserterHTML(0);
        steps.forEach((s, i) => {
            const nameField = s.type === 'wait'
                ? '<input class="stms" type="number" value="' + s.ms + '" data-i="' + i + '"> ms'
                : '<input class="stname" value="' + esc(s.name) + '" data-i="' + i + '" title="Klik om te hernoemen">';
            html +=
                '<div class="stprow">' +
                '<span class="ststat" data-i="' + i + '"></span>' +
                '<span class="stnum">' + (i + 1) + '</span>' +
                '<span class="stbadge b-' + s.type + '">' + BADGE[s.type] + '</span>' +
                '<div class="stmid">' + nameField + (s.detail ? '<div class="stdet" title="' + esc((s.fp && s.fp.html) ? s.fp.html : s.detail) + '">' + esc(s.detail) + (s.fp && s.fp.html ? ' · html' : '') + '</div>' : '') + '</div>' +
                '<span class="strep" title="herhaal deze stap zoveel keer">×<input class="strepn" type="number" min="1" value="' + (s.rep || 1) + '" data-i="' + i + '"></span>' +
                (s.selector || s.fp ? '<button class="mini" data-show="' + i + '" title="Toon het gekoppelde element op de pagina">' + IC('target', 'ico-sm') + '</button>' : '') +
                (s.type === 'fill' ? '<button class="mini" data-tmpl="' + i + '" title="CSV-sjabloon downloaden">' + IC('file-plus', 'ico-sm') + '</button>' : '') +
                '<button class="mini" data-up="' + i + '" title="Omhoog">' + IC('up', 'ico-sm') + '</button><button class="mini" data-down="' + i + '" title="Omlaag">' + IC('down', 'ico-sm') + '</button>' +
                '<button class="mini danger" data-del="' + i + '" title="Verwijder stap">' + IC('trash', 'ico-sm') + '</button>' +
                stepParamsHTML(s, i) +
                '</div>' + inserterHTML(i + 1);
        });
        box.innerHTML = html;
        bindParams(box);
        box.querySelectorAll('[data-ins]').forEach(b => b.onclick = () => insertPause(+b.dataset.ins));
        box.querySelectorAll('.stname').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].name = inp.value; renderFlow(); persist(); });
        box.querySelectorAll('.stms').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].ms = Math.max(0, +inp.value || 0); renderFlow(); persist(); });
        box.querySelectorAll('.strepn').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].rep = Math.max(1, +inp.value || 1); renderFlow(); persist(); });
        box.querySelectorAll('[data-show]').forEach(b => b.onclick = () => {
            const s = steps[+b.dataset.show], el = targetEl(s);
            if (el) { highlightEl(el); flash(b, '✔'); } else { flash(b, '✗ niet gevonden'); }
        });
        box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { steps.splice(+b.dataset.del, 1); renderSteps(); renderFlow(); persist(); });
        box.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]]; renderSteps(); renderFlow(); persist(); } });
        box.querySelectorAll('[data-down]').forEach(b => b.onclick = () => { const i = +b.dataset.down; if (i < steps.length - 1) { [steps[i], steps[i + 1]] = [steps[i + 1], steps[i]]; renderSteps(); renderFlow(); persist(); } });
        box.querySelectorAll('[data-tmpl]').forEach(b => b.onclick = () => {
            const s = steps[+b.dataset.tmpl];
            const q = v => /[";\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;   // ';' = NL-Excel-scheidingsteken
            const cols = enabledCols(s);
            if (!cols.length) { flash(b, 'geen velden'); return; }
            const header = cols.map(m => q(m.col)).join(';');
            download([header, '', ''].join('\n'), 'formulier-sjabloon.csv');
            flash(b, '✔ ' + cols.length + ' kol.');
        });
    }
    renderSteps();

    // Controleer of elke stap met een gekoppeld element dat element op deze pagina vindt.
    if ($('#flow-check')) $('#flow-check').onclick = function () {
        const linked = steps.map((s, i) => ({ s, i })).filter(x => x.s.selector || x.s.fp);
        if (!linked.length) { flash(this, 'geen gekoppelde stappen'); return; }
        let okN = 0, bad = [];
        linked.forEach(({ s, i }) => {
            const el = targetEl(s);
            const stat = $('.ststat[data-i="' + i + '"]');
            if (el) { okN++; if (stat) { stat.textContent = '✓'; stat.className = 'ststat done'; } }
            else { bad.push((i + 1) + '. ' + (s.name || s.type)); if (stat) { stat.textContent = '✗'; stat.className = 'ststat err'; } }
        });
        const allOk = bad.length === 0;
        flash(this, allOk ? '✔ alles gekoppeld' : '✗ ' + bad.length + ' fout');
        log((allOk ? '🔗 ✅ GOED — alle ' + okN + ' koppelingen gevonden.' : '🔗 ❌ FOUT — ' + okN + '/' + linked.length + ' gevonden. Niet gevonden: ' + bad.join(', ') + '.  Klik 🎯 bij een stap of koppel opnieuw.'), true);
    };

    // CSV data
    function showCsvInfo() {
        const cols = flowRows.length ? Object.keys(flowRows[0]) : [];
        $('#flow-csvinfo').innerHTML = flowRows.length
            ? '<b>' + flowRows.length + ' rijen</b> · kolommen: ' + cols.map(esc).join(', ') + ' — draait ' + flowRows.length + '× (1 per regel)'
            : 'Geen CSV — flow draait één keer.';
    }
    $('#flow-file').onchange = e => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
            try { flowRows = parseCSV(rd.result); showCsvInfo(); }
            catch (err) { flowRows = []; $('#flow-csvinfo').textContent = 'Kon CSV niet lezen: ' + err.message; }
            renderSteps(); renderFlow(); persistNow();   // meteen bewaren → overleeft refresh/navigatie
        };
        rd.readAsText(f);
    };
    // CSV wissen zodat je een nieuwe kunt uploaden.
    if ($('#flow-clearcsv')) $('#flow-clearcsv').onclick = function () {
        flowRows = []; const fi = $('#flow-file'); if (fi) fi.value = '';
        showCsvInfo(); renderSteps(); renderFlow(); persistNow(); flash(this, '✔ gewist');
    };

    // Verzamel de kolomkoppen die de flow uit de CSV leest: fill-velden + {{kolom}} in
    // veld/typ/webhook. Zo maakt de centrale knop één sjabloon met een kop per invoerveld.
    function tokensFrom(str) { const out = []; String(str == null ? '' : str).replace(/\{\{([^}]+)\}\}/g, (m, e) => { e.split(/[+\-*/()]/).forEach(part => { const c = part.trim(); if (c && !/^\d+([.,]\d+)?$/.test(c)) out.push(c); }); return m; }); return out; }
    function collectCsvColumns() {
        const cols = [], seen = new Set();
        const add = c => { c = String(c == null ? '' : c).trim(); if (c && !seen.has(c.toLowerCase())) { seen.add(c.toLowerCase()); cols.push(c); } };
        steps.forEach(s => {
            if (s.type === 'fill') enabledCols(s).forEach(m => add(m.col));
            ['value', 'text', 'url'].forEach(f => tokensFrom(s[f]).forEach(add));
        });
        return cols;
    }
    $('#flow-tmpl').onclick = () => {
        const cols = collectCsvColumns();
        if (!cols.length) { $('#flow-csvinfo').innerHTML = '<b style="color:#dc2626">Geen invoervelden gevonden.</b> Voeg eerst een <i>Formulier vullen</i>- of <i>Veld invullen</i>-stap toe (vink de gewenste velden aan).'; return; }
        const q = v => /[";\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;   // ';' = NL-Excel
        download([cols.map(q).join(';'), '', ''].join('\n'), 'invoervelden-sjabloon.csv');
        $('#flow-csvinfo').innerHTML = 'Sjabloon gedownload: <b>' + cols.length + ' kolom(men)</b> — ' + cols.map(esc).join(', ') + '. Vul het in en upload het hierboven.';
    };

    // ===================== Opdracht-chat: bouw de flow met gewone taal =====================
    function chatLog(m) { const el = $('#chat-log'); if (el.textContent === 'Typ een opdracht of "help".') el.textContent = ''; el.textContent += m + '\n'; el.scrollTop = el.scrollHeight; }
    function afterWord(s, w) { const re = new RegExp(w + '\\s+(.+)$', 'i'); const m = s.match(re); if (!m) return ''; return m[1].replace(/^["'“”]|["'“”]$/g, '').trim(); }
    function quoted(s) { const m = s.match(/["'“”](.+?)["'“”]/); return m ? m[1] : ''; }
    function chatHelp() {
        chatLog('Voorbeelden:');
        ['scrape de prijs  (klik dan het element)', 'scrape lijst  (klik één item)', 'vul veld met {{Naam}}', 'vul formulier', 'typ "hallo"', 'klik Opslaan', 'wacht op element', 'wacht 2s', 'screenshot', 'print', 'scroll naar onder', 'oneindig scrollen', 'download afbeeldingen', 'herhaal 5', 'map shirts', 'submap per relatienummer', 'webhook https://…', 'start'].forEach(x => chatLog('  • ' + x));
    }
    function addScrapeEl(el, nm) {
        const attr = el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text');
        const preview = nm || (txt(el) ? txt(el).slice(0, 24) : el.tagName.toLowerCase()) || 'waarde';
        const n = steps.filter(s => s.type === 'scrape' && s.kind === 'element').length + 1;
        addStep({ type: 'scrape', kind: 'element', name: preview, col: nm ? cleanCol(nm) : 'kolom' + n, selector: cssPath(el), attr, detail: preview + ' · ' + cssPath(el) });
    }
    // vertaal één zin naar een actie (met of zonder aanwijzen op de pagina)
    function interpret(raw) {
        const s = raw.trim(); const l = s.toLowerCase();
        const numM = l.match(/(\d+(?:[.,]\d+)?)/); const num = numM ? numM[1] : null;
        // ---- controle & instellingen (geen doel aanwijzen) — eerst, om woord-clashes te voorkomen ----
        if (/\b(help|opdrachten|commando)\b/.test(l)) return { run: chatHelp, done: '' };
        if (/^(start|run|draai|ga|voer uit)\b/.test(l)) return { run: () => startFlow(), done: 'run gestart' };
        if (/\b(herhaal|repeat)\b/.test(l) && num) return { run: () => { $('#flow-repeat').value = Math.max(1, +num); persist(); renderFlow(); }, done: 'herhaal ' + num + '×' };
        if (/\b(submap|groepeer|group)\b|map per|per kolom/.test(l)) { const col = afterWord(s, 'per') || afterWord(s, 'op') || afterWord(s, 'kolom'); return { run: () => { $('#flow-group').value = col; persist(); }, done: 'submap per ' + (col || '?') }; }
        if (/^map\b|^folder\b|opslaan in/.test(l)) { const f = afterWord(s, 'map') || afterWord(s, 'folder') || afterWord(s, 'in'); return { run: () => { $('#flow-folder').value = f || 'webtool'; syncFolder(); persist(); }, done: 'map = ' + (f || 'webtool') }; }
        // ---- doel aanwijzen ----
        if (/vul.*formulier|formulier.*vul|fill form/.test(l)) return { pick: el => { const form = el.closest('form') || el; const st = { type: 'fill', name: 'Vul formulier', selector: cssPath(form), colmap: buildColumnMap(readFormFieldsIn(form)) }; updateFillDetail(st); addStep(st); }, hint: 'Klik het formulier (vink daarna aan welke velden)', done: 'formulier-vul toegevoegd — kies de velden in de stap' };
        if (/vul.*veld|veld.*vul|fill field/.test(l)) { const val = afterWord(s, 'met') || quoted(s); return { pick: el => { el = resolveField(el); const n = steps.filter(x => x.type === 'setval' || x.type === 'select').length + 1; const col = fieldColName(el, n); addStep({ type: 'setval', name: 'Veld: ' + col.slice(0, 22), selector: stableSel(el), fp: fingerprint(el), value: val || ('{{' + col + '}}'), detail: col }); }, hint: 'Klik het invoerveld/de dropdown', done: 'veld-vul toegevoegd' }; }
        if (/^(typ|type|tik|voer in)\b/.test(l)) { const tx = quoted(s) || afterWord(s, 'typ') || afterWord(s, 'type') || afterWord(s, 'tik'); return { pick: el => addStep({ type: 'type', name: 'Typ tekst', selector: cssPath(el), text: tx, enter: /enter/.test(l), detail: cssPath(el) }), hint: 'Klik het invoerveld', done: 'typ toegevoegd' }; }
        if (/wacht op|wait for/.test(l)) return { pick: el => addStep({ type: 'waitfor', name: 'Wacht op element', selector: cssPath(el), timeout: 8000, detail: cssPath(el) }), hint: 'Klik het element om op te wachten', done: 'wacht-op toegevoegd' };
        if (/(download|pak|haal)\b.*(bestand|afbeelding|image|files|foto)/.test(l)) return { run: () => addStep({ type: 'images', name: 'Bestanden', pattern: '\\.(png|jpe?g|webp|gif|pdf)(\\?|$)', detail: '' }), done: 'bestanden-download toegevoegd' };
        if (/\b(scrape|scrapen|lees)\b|\bpak\b|\bhaal\b/.test(l)) {
            if (/lijst|tabel|alle|rijen/.test(l)) return { pick: el => { const d = autoDetectList(el); if (d) addStep({ type: 'scrape', kind: 'list', name: 'Scrape lijst', spec: d, detail: d.count + ' items × ' + d.columns.length + ' kol.' }); else addScrapeEl(el); }, hint: 'Klik één item van de lijst', done: 'lijst-scrape toegevoegd' };
            const nm = quoted(s) || afterWord(s, 'de') || afterWord(s, 'het'); return { pick: el => addScrapeEl(el, nm), hint: 'Klik wat je wilt scrapen', done: 'scrape toegevoegd' };
        }
        if (/(klik|druk|press|click)/.test(l)) return { pick: el => { const b = (el.closest && el.closest('button,a,[role="button"],.mud-button-root,input[type="submit"],input[type="button"]')) || el; addStep({ type: 'click', name: (txt(b) || b.value || b.tagName.toLowerCase()).slice(0, 24) || 'knop', selector: cssPath(b), detail: cssPath(b) }); }, hint: 'Klik de knop', done: 'klik toegevoegd' };
        if (/hover|zweef/.test(l)) return { pick: el => addStep({ type: 'hover', name: 'Hover', selector: cssPath(el), detail: cssPath(el) }), hint: 'Klik het element', done: 'hover toegevoegd' };
        // ---- overige losse acties ----
        if (/(oneindig|scroll.*laad|load more|meer laden)/.test(l)) return { run: () => addStep({ type: 'scrollload', name: 'Scroll & laad', times: 5, pause: 800, detail: '' }), done: 'scroll&laad toegevoegd' };
        if (/scroll/.test(l)) return { run: () => addStep({ type: 'scroll', name: 'Scroll naar onder', mode: 'bottom', detail: '' }), done: 'scroll toegevoegd' };
        if (/webhook|https?:\/\//.test(l)) { const u = (s.match(/https?:\/\/\S+/) || [])[0] || ''; return { run: () => addStep({ type: 'webhook', name: 'Webhook (POST)', url: u, detail: u }), done: 'webhook toegevoegd' }; }
        if (/screenshot|foto|capture|schermafbeelding/.test(l)) return { run: () => addStep({ type: 'shot', name: 'Screenshot', detail: '' }), done: 'screenshot toegevoegd' };
        if (/print/.test(l)) return { run: () => addStep({ type: 'print', name: 'Print (Ctrl+P)', detail: '' }), done: 'print toegevoegd' };
        if (/(wacht|pauze|wait|pause)/.test(l)) { let ms = num ? (/ms/.test(l) ? +num : Math.round(parseFloat(num.replace(',', '.')) * 1000)) : 1000; return { run: () => addStep({ type: 'wait', ms }), done: 'pauze ' + ms + ' ms' }; }
        return null;
    }
    function runQueue(cmds) {
        if (!cmds.length) return;
        const cmd = cmds.shift();
        if (!cmd.trim()) return runQueue(cmds);
        const act = interpret(cmd);
        if (!act) { chatLog('❓ niet begrepen: ' + cmd + '  (typ "help")'); return runQueue(cmds); }
        if (act.pick) { chatLog('👆 ' + act.hint + '…'); beginPick(el => { act.pick(el); if (act.done) chatLog('✔ ' + act.done); runQueue(cmds); }, act.hint); }
        else { act.run(); if (act.done) chatLog('✔ ' + act.done); runQueue(cmds); }
    }
    function sendChat() {
        const inp = $('#chat-in'); const val = inp.value.trim(); if (!val) return;
        chatLog('› ' + val); inp.value = '';
        runQueue(val.split(/\n|;| en (?=klik|scrape|vul|typ|wacht|druk|screenshot|print|scroll|download|herhaal)/i));
    }
    $('#chat-send').onclick = sendChat;
    $('#chat-in').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } });

    // ===================== run (herstartbaar, loopt door over paginawissels) =====================
    const RUN_KEY = 'wt-run';   // globaal → overleeft navigatie, ook naar een ander domein
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function log(m, reset) { const el = $('#flow-log'); if (reset) el.textContent = ''; el.textContent += m + '\n'; el.scrollTop = el.scrollHeight; }
    function setResult(d) { $('#flow-result').textContent = d == null ? 'Nog niets gescrapet.' : JSON.stringify(d, null, 2); }
    function saveRun(st) { try { st.ts = Date.now(); } catch (e) {} return new Promise(res => { try { chrome.storage.local.set({ [RUN_KEY]: st }, () => res()); } catch (e) { try { localStorage.setItem(RUN_KEY, JSON.stringify(st)); } catch (_) {} res(); } }); }
    function loadRun() { return new Promise(res => { try { chrome.storage.local.get(RUN_KEY, r => res(r && r[RUN_KEY])); } catch (e) { try { res(JSON.parse(localStorage.getItem(RUN_KEY) || 'null')); } catch (_) { res(null); } } }); }
    function clearRun() { try { chrome.storage.local.remove(RUN_KEY); } catch (e) { try { localStorage.removeItem(RUN_KEY); } catch (_) {} } }

    async function performStep(s, row, extraCtx) {
        if (s.type === 'scrape') {
            if (s.kind === 'list') { const d = scrapeList(s.spec); log('  🔎 ' + s.name + ': ' + d.length + ' items'); return { key: s.col || s.name, val: d }; }
            const el = targetEl(s); let v = el ? readValue(el, s.attr) : null;
            v = applyTransform(v, s.transform);
            log('  🔎 ' + (s.col || s.name) + ': ' + (v == null ? '(niet gevonden)' : String(v).slice(0, 40))); return { key: s.col || s.name, val: v };
        } else if (s.type === 'type') {
            const el = targetEl(s);
            if (!el) { log('  ⚠ ' + s.name + ': veld niet gevonden'); return { ok: false }; }
            const ctx = Object.assign({}, row || {}, extraCtx || {});
            const text = resolveValue(s.text, ctx);
            el.focus(); await fillElement(el, text);
            if (s.enter) { ['keydown', 'keypress', 'keyup'].forEach(t => el.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }))); if (el.form) { try { el.form.requestSubmit ? el.form.requestSubmit() : el.form.submit(); } catch (e) {} } }
            log('  ⌨ ' + s.name + ': "' + String(text).slice(0, 30) + '"' + (s.enter ? ' + Enter' : ''));
            await sleep(150);
        } else if (s.type === 'key') {
            const el = doc.activeElement || doc.body;
            const key = s.key || 'Enter';
            ['keydown', 'keypress', 'keyup'].forEach(t => el.dispatchEvent(new KeyboardEvent(t, { key, code: key, bubbles: true })));
            log('  ⌨ toets ' + key); await sleep(120);
        } else if (s.type === 'hover') {
            const el = targetEl(s);
            if (el) { ['mouseover', 'mouseenter', 'mousemove'].forEach(t => el.dispatchEvent(new MouseEvent(t, { bubbles: true }))); log('  🖱 hover: ' + s.name); }
            else { log('  ⚠ ' + s.name + ': niet gevonden'); return { ok: false }; }
            await sleep(200);
        } else if (s.type === 'scroll') {
            if (s.mode === 'bottom') { window.scrollTo({ top: doc.body.scrollHeight, behavior: 'instant' in window ? 'auto' : 'auto' }); log('  ↕ scroll naar onder'); }
            else { const el = targetEl(s); if (el) { el.scrollIntoView({ block: 'center' }); log('  ↕ scroll naar ' + s.name); } else return { ok: false }; }
            await sleep(300);
        } else if (s.type === 'scrollload') {
            const times = Math.max(1, +s.times || 5), pause = Math.max(100, +s.pause || 800);
            for (let k = 0; k < times; k++) { window.scrollTo(0, doc.body.scrollHeight); log('  ↕ laad ' + (k + 1) + '/' + times); await sleep(pause); }
        } else if (s.type === 'waitfor') {
            const to = Math.max(200, +s.timeout || 8000), t0 = Date.now();
            while (Date.now() - t0 < to) { if (targetEl(s)) { log('  ⏳ ' + s.name + ': gevonden na ' + (Date.now() - t0) + 'ms'); return { ok: true }; } await sleep(200); }
            log('  ⚠ ' + s.name + ': time-out (' + to + 'ms)'); return { ok: false };
        } else if (s.type === 'cond') {
            const el = targetEl(s);
            let ok = !!el;
            if (ok && s.test === 'contains') ok = (el.textContent || '').toLowerCase().indexOf(String(s.ctext || '').toLowerCase()) !== -1;
            log('  ❓ ' + s.name + ': ' + (ok ? 'waar' : 'niet waar'));
            if (!ok) { if (s.ifFalse === 'stop') return { stop: true }; return { skip: Math.max(1, +s.skip || 1) }; }
        } else if (s.type === 'images') {
            const re = (() => { try { return new RegExp(s.pattern || '', 'i'); } catch (e) { return /\.(png|jpe?g|webp|gif|pdf)(\?|$)/i; } })();
            const urls = new Set();
            doc.querySelectorAll('img[src]').forEach(im => { if (re.test(im.src)) urls.add(im.src); });
            doc.querySelectorAll('a[href]').forEach(a => { if (re.test(a.href)) urls.add(a.href); });
            const list = Array.from(urls).slice(0, 200);
            log('  ⬇ ' + s.name + ': ' + list.length + ' bestand(en) → map "' + currentFolder + '"');
            if (list.length) await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-dlfiles', urls: list, folder: currentFolder }, () => res()); } catch (e) { res(); } });
            return { key: s.name, val: list };
        } else if (s.type === 'webhook') {
            const url = (s.url || '').trim();
            if (!url) { log('  ⚠ ' + s.name + ': geen URL'); return { ok: false }; }
            const payload = Object.assign({}, row || {}, extraCtx || {});
            try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); log('  🔗 ' + s.name + ': ' + (r.ok ? 'ok' : 'http ' + r.status)); if (!r.ok) return { ok: false }; }
            catch (e) { log('  ⚠ ' + s.name + ': ' + e.message); return { ok: false }; }
            await sleep(100);
        } else if (s.type === 'setval' || s.type === 'select') {
            const el = targetEl(s);
            if (!el) { log('  ⚠ ' + s.name + ': veld niet gevonden'); return { ok: false }; }
            const ctx = Object.assign({}, row || {}, extraCtx || {});
            const val = resolveValue(s.value, ctx);
            if (s.skipEmpty !== false && (val == null || String(val).trim() === '')) {
                log('  ✎ ' + s.name + ': leeg → deze ronde overgeslagen'); return;
            }
            await fillElement(el, val);
            log('  ✎ ' + s.name + ' = "' + String(val).slice(0, 30) + '"');
            await sleep(80);
        } else if (s.type === 'fill') {
            const scope = doc.querySelector(s.selector) || doc;
            const ctx = Object.assign({}, row || {}, extraCtx || {});
            const rep = await fillRowWith(row || {}, enabledCols(s), scope, ctx);
            log('  ✎ ' + s.name + ': ' + rep.filled.length + ' gevuld' + (rep.missed.length ? ', niet gevonden: ' + rep.missed.join(', ') : ''));
        } else if (s.type === 'click') {
            let el = targetEl(s);
            if (!el) { log('  ⚠ knop niet gevonden: ' + s.name); return { ok: false }; }
            el = el.closest('button,a,[role="button"],.mud-button-root,input[type="submit"],input[type="button"]') || el;
            const off = el.disabled || el.getAttribute('aria-disabled') === 'true' || (el.className && /mud-disabled/.test(el.className));
            if (off) log('  ⚠ "' + s.name + '" is (nog) uitgeschakeld — is het formulier compleet/geldig ingevuld?');
            try { el.focus(); } catch (e) {}
            el.scrollIntoView && el.scrollIntoView({ block: 'center' });
            ['pointerover', 'pointerenter', 'pointerdown', 'mousedown', 'mouseup', 'click'].forEach(t =>
                el.dispatchEvent(t.indexOf('pointer') === 0 ? new PointerEvent(t, { bubbles: true, cancelable: true, view: window }) : new MouseEvent(t, { bubbles: true, cancelable: true, view: window })));
            log('  👆 ' + s.name + (off ? ' (was uitgeschakeld)' : ''));
            await sleep(300);
        } else if (s.type === 'wait') { log('  ⏱ wacht ' + s.ms + ' ms'); await sleep(s.ms); }
        else if (s.type === 'print') {
            log('  🖨 ' + s.name + ' → PDF in map "' + currentFolder + '"');
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // paneel niet in de PDF
            await sleep(250);                                    // even wachten tot het weg is
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-print', name: s.name, folder: currentFolder }, resp => res(resp)); } catch (e) { res(null); } });
            if (hostEl) hostEl.classList.remove('wt-capturing');
            if (!r || !r.ok) log('     ⚠ print-naar-PDF niet gelukt (open eventueel handmatig met Ctrl+P)');
            await sleep(150);
        }
        else if (s.type === 'shot') {
            log('  📸 ' + s.name + ' → map "' + currentFolder + '"');
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // ons paneel niet in de foto
            await sleep(250);
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-shot', name: s.name, folder: currentFolder }, resp => res(resp)); } catch (e) { res(null); } });
            if (hostEl) hostEl.classList.remove('wt-capturing');
            if (!r || !r.ok) log('     ⚠ screenshot niet gelukt');
            await sleep(150);
        }
        return null;
    }

    // Voortgang: vinkjes per stap + teller (x/total voltooid) + balk.
    function renderRunStatus(cur) {
        $all('.ststat').forEach(el => {
            const i = +el.dataset.i;
            if (!cur) { el.textContent = ''; el.className = 'ststat'; }
            else if (i < cur.si) { el.textContent = '✓'; el.className = 'ststat done'; }
            else if (i === cur.si) { el.textContent = '●'; el.className = 'ststat busy'; }
            else { el.textContent = '○'; el.className = 'ststat'; }
        });
    }
    function renderProgress(st) {
        const box = $('#flow-progress'); if (!box) return;
        if (!st) { box.style.display = 'none'; renderRunStatus(null); return; }
        const rowsLen = (st.rows && st.rows.length) ? st.rows.length : 1;
        const repeat = Math.max(1, st.repeat || 1);
        const total = rowsLen * repeat;
        const done = Math.min(total, st.cursor.rp * rowsLen + st.cursor.ri);
        box.style.display = 'block';
        box.innerHTML = '<div class="prog-txt"><b>' + done + '/' + total + '</b> voltooid' +
            (st.running ? ' · bezig' + (rowsLen > 1 ? ' rij ' + (st.cursor.ri + 1) + '/' + rowsLen : '') + (repeat > 1 ? ' · herhaling ' + (st.cursor.rp + 1) + '/' + repeat : '') : ' ✓') +
            '</div><div class="prog-bar"><span style="width:' + Math.round(done / total * 100) + '%"></span></div>';
        renderRunStatus(st.running ? st.cursor : null);
    }

    let RUNNING = false;
    $('#flow-run').onclick = startFlow;
    if ($('#flow-pause')) $('#flow-pause').onclick = () => { if (!RUNNING) return; pauseReq = true; $('#flow-pause').disabled = true; log('  ⏸ pauzeren na deze stap…'); };
    $('#flow-stop').onclick = async () => {
        stopReq = true; pauseReq = false;
        const st = await loadRun(); if (st) { st.running = false; st.paused = false; await saveRun(st); }
        if (!RUNNING) {   // was gepauzeerd → nu helemaal stoppen en opruimen
            clearRun(); renderProgress(null);
            const rb = $('#flow-run'); rb.innerHTML = IC('play') + ' <span data-i18n="start">' + t('start') + '</span>';
            $('#flow-stop').disabled = true; if ($('#flow-pause')) $('#flow-pause').disabled = true;
        }
        log('  ■ stoppen…');
    };

    async function startFlow() {
        if (RUNNING) return;
        // Gepauzeerde run? → hervat waar we waren.
        const prev = await loadRun();
        if (prev && prev.paused) { prev.paused = false; pauseReq = false; await saveRun(prev); log('▶ Hervat…', true); steps = prev.steps || steps; renderSteps(); renderFlow(); runFromState(prev); return; }
        if (!steps.length) { log('⚠ Geen stappen — klik eerst "+ Stap toevoegen".', true); return; }
        const rows = flowRows.length ? flowRows.slice() : [null];
        const st = {
            steps: JSON.parse(JSON.stringify(steps)), rows,
            delay: Math.max(0, +$('#flow-delay').value || 0),
            repeat: Math.max(1, +$('#flow-repeat').value || 1),
            folder: sanitizeFolder($('#flow-folder').value) || 'webtool',
            groupCol: ($('#flow-group').value || '').trim(),
            cursor: { rp: 0, ri: 0, si: 0 }, out: {}, results: [], running: true
        };
        log('▶ Start — ' + st.steps.length + ' stap(pen), ' + rows.length + ' ' + (flowRows.length ? 'rijen' : 'keer') + (st.repeat > 1 ? ' × ' + st.repeat : '') + '.', true);
        if (!flowRows.length && st.steps.some(s => s.type === 'fill' || ((s.type === 'setval' || s.type === 'select') && /\{\{/.test(s.value || '')))) log('  ⓘ Geen CSV: vul-/dropdown-stappen met {{kolom}} vullen niets.');
        await saveRun(st);
        runFromState(st);
    }

    async function runFromState(st) {
        if (RUNNING) return; RUNNING = true; stopReq = false; pauseReq = false;
        const runBtn = $('#flow-run'); runBtn.innerHTML = IC('play') + ' ' + esc(t('busy')); runBtn.disabled = true; $('#flow-stop').disabled = false; if ($('#flow-pause')) $('#flow-pause').disabled = false;
        $('#flow-log').scrollIntoView({ block: 'nearest' });
        const rows = st.rows.length ? st.rows : [null];
        const repeat = Math.max(1, st.repeat || 1);
        const total = rows.length * repeat;
        const baseFolder = sanitizeFolder(st.folder) || 'webtool';
        const groupCol = st.groupCol;

        while (st.running && !stopReq && !pauseReq) {
            let { rp, ri, si } = st.cursor;
            if (rp >= repeat) break;
            // Downloadmap per rij: basismap + submap op de unieke kolomwaarde (bv. relatienummer).
            const curRow = rows[ri];
            const gval = groupCol && curRow && curRow[groupCol] != null ? String(curRow[groupCol]).trim() : '';
            currentFolder = gval ? baseFolder + '/' + sanitizeFolder(gval) : baseFolder;
            if (ri >= rows.length) { st.cursor = { rp: rp + 1, ri: 0, si: 0 }; st.out = {}; await saveRun(st); continue; }
            if (si >= st.steps.length) {
                if (groupCol && curRow && curRow[groupCol] != null && st.out[groupCol] == null) st.out[groupCol] = curRow[groupCol];
                if (Object.keys(st.out).length) { const o = st.out; o._pass = rp * rows.length + ri + 1; st.results.push(o); }
                st.out = {}; st.cursor = { rp, ri: ri + 1, si: 0 }; await saveRun(st);
                renderProgress(st);
                const donePass = rp * rows.length + ri + 1;
                if (donePass < total && st.delay) await sleep(st.delay);
                continue;
            }
            const step = st.steps[si];
            renderProgress(st);
            // cursor NAAR de volgende stap en persist VÓÓR uitvoeren: een klik die de
            // pagina laadt hervat na herladen automatisch bij de volgende stap.
            st.cursor = { rp, ri, si: si + 1 };
            await saveRun(st);
            const times = Math.max(1, +step.rep || 1);
            const retries = Math.max(0, +$('#flow-retries').value || 0);
            const onErr = $('#flow-onerror') ? $('#flow-onerror').value : 'skip';
            let ctrl = null;
            for (let k = 0; k < times && !stopReq; k++) {
                let attempt = 0, ok = false;
                while (attempt <= retries && !ok && !stopReq) {
                    try {
                        const r = await performStep(step, rows[ri], st.out);
                        if (r && r.key != null) st.out[r.key] = r.val;
                        if (r && r.stop) ctrl = { stop: true };
                        if (r && r.skip) ctrl = { skip: r.skip };
                        ok = !(r && r.ok === false);
                    } catch (err) { log('  ⚠ ' + (step.name || step.type) + ': ' + err.message); ok = false; }
                    if (!ok && attempt < retries) { log('     ↻ opnieuw (' + (attempt + 1) + '/' + retries + ')'); await sleep(600); }
                    attempt++;
                }
                if (!ok) { if (onErr === 'stop') { log('  ■ Gestopt door fout in "' + (step.name || step.type) + '".'); ctrl = { stop: true }; } else log('     ⏭ overgeslagen na fout'); break; }
            }
            if (ctrl && ctrl.stop) { st.running = false; await saveRun(st); break; }
            if (ctrl && ctrl.skip) { st.cursor = { rp, ri, si: si + 1 + ctrl.skip }; await saveRun(st); }
            renderRunStatus(st.cursor);
        }

        // Gepauzeerd: run bewaren (niet wissen) zodat Start hem hervat.
        if (pauseReq && st.running && !stopReq) {
            st.paused = true; await saveRun(st);
            RUNNING = false; pauseReq = false;
            runBtn.disabled = false; runBtn.innerHTML = IC('play') + ' <span data-i18n="resume">Hervat</span>';
            if ($('#flow-pause')) $('#flow-pause').disabled = true; $('#flow-stop').disabled = false;
            log('⏸ Gepauzeerd — klik ▶ Start om te hervatten.');
            return;
        }
        st.running = false; await saveRun(st);
        RUNNING = false; runBtn.disabled = false; runBtn.innerHTML = IC('play') + ' <span data-i18n="start">' + t('start') + '</span>'; $('#flow-stop').disabled = true; if ($('#flow-pause')) $('#flow-pause').disabled = true;
        results = st.results;
        setResult(st.results.length === 1 ? st.results[0] : st.results);
        if (stopReq) { renderProgress(null); log('■ Gestopt.'); }
        else {
            const box = $('#flow-progress');
            box.style.display = 'block';
            box.innerHTML = '<div class="prog-txt"><b>' + total + '/' + total + '</b> voltooid ✓</div><div class="prog-bar"><span style="width:100%"></span></div>';
            $all('.ststat').forEach(el => { el.textContent = '✓'; el.className = 'ststat done'; });
            log('✓ Klaar — ' + st.results.length + ' resultaat(en).');
        }
        currentFolder = sanitizeFolder($('#flow-folder').value) || 'webtool';   // export weer naar de basismap
        clearRun();
    }

    // export
    // Map in Downloads waarin alles terechtkomt.
    function syncFolder() { currentFolder = sanitizeFolder($('#flow-folder').value) || 'webtool'; }
    syncFolder();
    $('#flow-folder').addEventListener('input', () => { syncFolder(); persist(); });
    $('#flow-group').addEventListener('input', persist);
    $('#flow-json').onclick = () => results.length && download(results.length === 1 ? results[0] : results, 'webtool-data.json');
    $('#flow-csv').onclick = () => results.length && download(toCSV(flattenForCsv(results)), 'webtool-data.csv');
    $('#flow-copy').onclick = function () { if (!results.length) return; copy(results.length === 1 ? results[0] : results); flash(this, '✔'); };
    // Primaire knoppen: Upload data (CSV-invoer openen) en Download uitkomst (CSV).
    $('#flow-upload').onclick = () => $('#flow-file').click();
    $('#flow-download').onclick = function () { if (!results.length) { flash(this, 'geen data'); return; } download(toCSV(flattenForCsv(results)), 'webtool-uitkomst.csv'); flash(this, '✔'); };
    function flattenForCsv(res) {
        if (!res.length) return res;
        // interne velden weglaten, maar de doorloop-teller als leesbare kolom bewaren
        const clean = res.map(o => { const c = {}; if (o._pass != null) c['rij'] = o._pass; Object.keys(o).forEach(k => { if (k !== '_pass' && k !== '_rij') c[k] = o[k]; }); return c; });
        // Precies één lijst-scrape → alle lijstrijen (over alle herhalingen) onder elkaar,
        // met eventuele scalaire kolommen (bv. een rij-teller) ernaast.
        const listKeys = steps.filter(s => s.type === 'scrape' && s.kind === 'list').map(s => s.col || s.name);
        if (listKeys.length === 1) {
            const key = listKeys[0];
            const rows = [];
            clean.forEach(o => {
                const extra = {}; Object.keys(o).forEach(k => { if (k !== key && !Array.isArray(o[k])) extra[k] = o[k]; });
                (Array.isArray(o[key]) ? o[key] : []).forEach(r => rows.push(Object.assign({}, extra, r)));
            });
            if (rows.length) return rows;
        }
        return clean;   // meerdere scrape-velden → één kolom per veld
    }

    // Excel + ZIP + webhook
    $('#flow-xlsx').onclick = () => { if (!results.length) return; downloadBytes(toXlsx(flattenForCsv(results)), 'webtool-data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); };
    $('#flow-zip').onclick = function () {
        if (!results.length) return;
        const rows = flattenForCsv(results);
        const files = [
            { name: 'resultaten.json', bytes: strBytes(JSON.stringify(results.length === 1 ? results[0] : results, null, 2)) },
            { name: 'resultaten.csv', bytes: strBytes(toCSV(rows)) },
            { name: 'resultaten.xlsx', bytes: toXlsx(rows) }
        ];
        downloadBytes(zipStore(files), 'webtool-export.zip', 'application/zip'); flash(this, '✔');
    };
    $('#flow-webhook-send').onclick = async function () {
        const url = $('#flow-webhook').value.trim(); if (!url || !results.length) { flash(this, url ? 'geen data' : 'geen URL'); return; }
        try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results.length === 1 ? results[0] : results) }); flash(this, r.ok ? '✔ verstuurd' : 'http ' + r.status); }
        catch (e) { flash(this, 'fout'); log('  ⚠ webhook: ' + e.message); }
    };
    $('#flow-webhook').addEventListener('input', persist);

    // Opgeslagen flows (presets, met naam)
    const PRESET_KEY = 'wt-presets-' + location.hostname;
    function loadPresets(cb) { try { chrome.storage.local.get(PRESET_KEY, r => cb((r && r[PRESET_KEY]) || {})); } catch (e) { try { cb(JSON.parse(localStorage.getItem(PRESET_KEY) || '{}')); } catch (_) { cb({}); } } }
    function savePresets(obj) { try { chrome.storage.local.set({ [PRESET_KEY]: obj }); } catch (e) { try { localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); } catch (_) {} } }
    function renderPresets() { loadPresets(o => { const names = Object.keys(o); $('#flow-preset-list').innerHTML = names.length ? names.map(n => '<option>' + esc(n) + '</option>').join('') : '<option value="">(geen)</option>'; }); }
    $('#flow-preset-save').onclick = function () { const nm = ($('#flow-preset-name').value || '').trim(); if (!nm) { flash(this, 'geef naam'); return; } loadPresets(o => { o[nm] = serialise(); savePresets(o); renderPresets(); flash(this, '✔ bewaard'); }); };
    $('#flow-preset-load').onclick = function () { const nm = $('#flow-preset-list').value; if (!nm) return; loadPresets(o => { if (o[nm]) { applyState(o[nm], true); flash(this, '✔ geladen'); } }); };
    $('#flow-preset-del').onclick = function () { const nm = $('#flow-preset-list').value; if (!nm) return; loadPresets(o => { delete o[nm]; savePresets(o); renderPresets(); flash(this, '✔'); }); };
    renderPresets();

    // Import/export van de flow als bestand
    $('#flow-export').onclick = () => download(serialise(), 'webtool-flow.json');
    $('#flow-import').onchange = e => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { try { applyState(JSON.parse(rd.result), true); log('↥ Flow geïmporteerd.', true); } catch (err) { log('⚠ Ongeldig flow-bestand: ' + err.message, true); } };
        rd.readAsText(f);
    };

    // Thema (licht/donker) en kant (links/rechts), onthouden per browser
    function applyTheme(dark) { root.querySelector('.wt-card').classList.toggle('wt-dark', !!dark); }
    function applySide(left) { host.style.left = left ? '16px' : 'auto'; host.style.right = left ? 'auto' : '16px'; }
    (function initPrefs() {
        try { chrome.storage.local.get(['wt-dark', 'wt-side'], r => { applyTheme(r && r['wt-dark']); applySide(r && r['wt-side'] === 'left'); }); } catch (e) {}
    })();
    $('#flow-theme').onclick = () => { const c = root.querySelector('.wt-card'); const dark = !c.classList.contains('wt-dark'); applyTheme(dark); try { chrome.storage.local.set({ 'wt-dark': dark }); } catch (e) {} };
    $('#flow-side').onclick = () => { const left = host.style.left !== '16px'; applySide(left); try { chrome.storage.local.set({ 'wt-side': left ? 'left' : 'right' }); } catch (e) {} };
    // MCP-koppeling aan/uit (zet de storage-vlag die de background-bridge activeert).
    function setMcpState(on) { const s = $('#flow-mcp-state'); if (s) { s.textContent = on ? 'aan' : 'uit'; s.style.color = on ? 'var(--accent)' : 'var(--muted)'; } }
    if ($('#flow-mcp')) {
        try { chrome.storage.local.get('wt-mcp', r => setMcpState(!!(r && r['wt-mcp']))); } catch (e) {}
        $('#flow-mcp').onclick = function () {
            const btn = this;
            try { chrome.storage.local.get('wt-mcp', r => { const on = !(r && r['wt-mcp']); chrome.storage.local.set({ 'wt-mcp': on }); setMcpState(on); flash(btn, on ? 'MCP aan' : 'MCP uit'); }); }
            catch (e) { flash(btn, 'alleen in de extensie'); }
        };
    }

    // opslaan / laden (per site) — expliciet én automatisch, zodat de flow na een
    // paginawissel of heropenen van het paneel gewoon terugkomt.
    const SAVE_KEY = 'wt-flow-' + location.hostname;
    const AUTO_KEY = 'wt-flow-auto-' + location.hostname;
    function serialise() {
        return JSON.parse(JSON.stringify({
            steps, delay: +$('#flow-delay').value || 600,
            repeat: +$('#flow-repeat').value || 1, rows: flowRows,
            folder: $('#flow-folder') ? $('#flow-folder').value : 'webtool',
            group: $('#flow-group') ? $('#flow-group').value : '',
            webhook: $('#flow-webhook') ? $('#flow-webhook').value : ''
        }));
    }
    function applyState(d, withRows) {
        if (!d) return false;
        steps = d.steps || []; stepSeq = steps.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
        $('#flow-delay').value = d.delay || 600;
        if (d.webhook != null && $('#flow-webhook')) $('#flow-webhook').value = d.webhook;
        if (d.group != null && $('#flow-group')) $('#flow-group').value = d.group;
        if (d.folder && $('#flow-folder')) { $('#flow-folder').value = d.folder; syncFolder(); }
        if ($('#flow-repeat')) $('#flow-repeat').value = d.repeat || 1;
        if (withRows && Array.isArray(d.rows)) {
            flowRows = d.rows;
            const cols = flowRows.length ? Object.keys(flowRows[0]) : [];
            $('#flow-csvinfo').innerHTML = flowRows.length
                ? '<b>' + flowRows.length + ' rijen</b> (bewaard) · kolommen: ' + cols.map(esc).join(', ')
                : 'Geen CSV — flow draait één keer.';
        }
        renderSteps(); renderFlow();
        return true;
    }
    // Auto-bewaren (kort uitgesteld) bij elke wijziging.
    let saveTimer = null;
    function saveAuto() {
        const data = serialise();
        try { chrome.storage.local.set({ [AUTO_KEY]: data }); }
        catch (e) { try { localStorage.setItem(AUTO_KEY, JSON.stringify(data)); } catch (_) {} }
    }
    function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(saveAuto, 350); }
    function persistNow() { clearTimeout(saveTimer); saveAuto(); }   // meteen (bv. na CSV-upload)
    // Herstel bij openen — én hervat een lopende run automatisch na een paginawissel.
    (async function restore() {
        const run = await loadRun();
        // Een blijven-hangen run (tab gesloten/gecrasht) NIET automatisch midden hervatten —
        // alleen een verse run (recent bijgewerkt) of een bewust gepauzeerde.
        const fresh = run && run.ts && (Date.now() - run.ts < 180000);
        if (run && run.running && !fresh && !run.paused) { clearRun(); }
        else if (run && run.running) {
            // Laad de flow uit de run-snapshot (klopt ook cross-page) en ga verder.
            steps = run.steps || []; stepSeq = steps.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
            flowRows = (run.rows && run.rows.length && run.rows[0] !== null) ? run.rows : [];
            if ($('#flow-repeat')) $('#flow-repeat').value = run.repeat || 1;
            $('#flow-delay').value = run.delay || 600;
            renderSteps(); renderFlow();
            if (flowRows.length) { const cols = Object.keys(flowRows[0] || {}); $('#flow-csvinfo').innerHTML = '<b>' + flowRows.length + ' rijen</b> (run) · ' + cols.map(esc).join(', '); }
            renderProgress(run);
            if (run.paused) {   // gepauzeerd → wachten op Start
                const rb = $('#flow-run'); rb.innerHTML = IC('play') + ' <span data-i18n="resume">Hervat</span>'; $('#flow-stop').disabled = false;
                log('⏸ Gepauzeerde run — klik ▶ Start om te hervatten.', true);
            } else {
                log('↩ Run automatisch hervat na paginawissel…', true);
                runFromState(run);
            }
            return;
        }
        const done = d => { if (applyState(d, true)) log('↩ Vorige flow hersteld (' + (d.steps || []).length + ' stappen).', true); };
        try { chrome.storage.local.get(AUTO_KEY, r => done(r && r[AUTO_KEY])); }
        catch (e) { try { done(JSON.parse(localStorage.getItem(AUTO_KEY) || 'null')); } catch (_) {} }
    })();

    $('#flow-save').onclick = function () {
        const data = serialise();
        try { chrome.storage.local.set({ [SAVE_KEY]: data }, () => flash(this, '✔ Bewaard')); }
        catch (e) { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); flash(this, '✔ Bewaard'); }
    };
    $('#flow-load').onclick = function () {
        const apply = d => { if (!applyState(d, true)) { flash(this, 'niets bewaard'); return; } flash(this, '✔ Geladen'); };
        try { chrome.storage.local.get(SAVE_KEY, r => apply(r[SAVE_KEY])); }
        catch (e) { apply(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); }
    };
    $('#flow-delay').addEventListener('input', persist);
    $('#flow-repeat').addEventListener('input', () => { persist(); renderFlow(); });

    // flowchart
    function renderFlow() {
        const box = $('#wt-flow');
        if (!steps.length) { box.style.display = 'none'; box.innerHTML = ''; return; }   // leeg → geen flowchart tonen
        box.style.display = '';
        const rows = flowRows.length > 1;
        const repeat = Math.max(1, +($('#flow-repeat') ? $('#flow-repeat').value : 1) || 1);
        const boxes = [];
        boxes.push({ k: 'start', t: 'Start' + (flowRows.length ? ' · ' + flowRows.length + ' rijen' : '') });
        if (repeat > 1) boxes.push({ k: 'loop', t: 'Herhaal ' + repeat + '×' });
        if (rows) boxes.push({ k: 'loop', t: 'Voor elke rij' });
        steps.forEach(s => {
            const base = s.type === 'wait' ? 'Wacht ' + s.ms + ' ms' : s.name;
            boxes.push({ k: s.type, t: base + ((s.rep || 1) > 1 ? '  (' + s.rep + '×)' : '') });
        });
        if (rows) boxes.push({ k: 'next', t: 'Volgende rij' });
        if (repeat > 1) boxes.push({ k: 'next', t: 'Volgende herhaling' });
        boxes.push({ k: 'done', t: 'Klaar' });
        box.innerHTML = boxes.map((b, i) => '<div class="fc-box fc-' + b.k + '">' + esc(b.t) + '</div>' + (i < boxes.length - 1 ? '<div class="fc-arw">↓</div>' : '')).join('');
    }
    renderFlow();

    // slepen
    (function () {
        const head = $('.wt-head'); let sx, sy, ox, oy, drag = false;
        head.addEventListener('mousedown', e => { if (e.target.closest('button')) return; drag = true; sx = e.clientX; sy = e.clientY; const r = host.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); });
        doc.addEventListener('mousemove', e => { if (!drag) return; host.style.left = (ox + e.clientX - sx) + 'px'; host.style.top = (oy + e.clientY - sy) + 'px'; host.style.right = 'auto'; });
        doc.addEventListener('mouseup', () => drag = false);
    })();

    function cleanup() {
        try { topObs.disconnect(); } catch (e) {} clearInterval(topIv); clearTimeout(topT);
        endPick(); overlay.remove(); host.remove();
        window.__WT_PANEL__ = false; window.__WT_TOGGLE__ = null; window.__wtHost = null; window.__wtCleanup = null;
        window.__WT_BOOTED__ = false;
        // uitzetten zodat het paneel niet meer vanzelf opent op nieuwe pagina's
        try { chrome.storage.local.set({ 'wt-active': false }); } catch (e) {}
    }
    window.__wtCleanup = cleanup;

    function IC(n, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; }
    function panelHTML() {
        return `
<style>
  :host { all: initial; }
  .wt-card {
    --page:#f9f9f7; --surface:#fcfcfb; --ink:#0b0b0b; --ink-2:#52514e; --muted:#898781;
    --grid:#e1e0d9; --baseline:#c3c2b7; --border:rgba(11,11,11,.10);
    --accent:#2a78d6; --accent-ink:#fff; --good:#006300; --bad:#d03b3b;
    --radius:16px; --radius-ctl:10px;
    --shadow-card:0 1px 2px rgba(11,11,11,.04), 0 10px 28px -18px rgba(11,11,11,.16);
    --shadow-hover:0 2px 6px rgba(11,11,11,.05), 0 18px 40px -20px rgba(11,11,11,.22);
    --ease:cubic-bezier(.2,.7,.3,1); --transition:.18s;
    --font-display:'Bricolage Grotesque', "Segoe UI", system-ui, -apple-system, sans-serif;   /* geen web-fetch: alleen als de letter lokaal aanwezig is, anders systeem */
    background:var(--surface); color:var(--ink); border:1px solid var(--border); border-radius:var(--radius);
    box-shadow:var(--shadow-hover); overflow:hidden; font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;
  }
  .wt-card * { box-sizing:border-box; }
  .wt-head { display:flex; align-items:center; gap:8px; padding:12px 14px; background:var(--surface); border-bottom:1px solid var(--grid); cursor:move; user-select:none; }
  .wt-head .brand { width:24px; height:24px; border-radius:8px; background:var(--accent); color:var(--accent-ink); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:650; font-size:13px; }
  .wt-head b { font-family:var(--font-display); font-weight:650; font-size:15px; letter-spacing:-.01em; } .wt-head .sp { flex:1; }
  .wt-ico { background:none; border:0; cursor:pointer; color:var(--muted); padding:5px; border-radius:8px; display:inline-flex; transition:background var(--transition) var(--ease), color var(--transition) var(--ease); }
  .wt-ico:hover { background:color-mix(in srgb, var(--ink) 5%, var(--surface)); color:var(--ink); }
  .wt-body { padding:16px; display:flex; flex-direction:column; gap:12px; max-height:76vh; overflow:auto; background:var(--page); }
  .wt-hidden { display:none !important; }
  .wt-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  /* knoppen: één accent (primary/run), rest secundair (rand) of ghost (kaal) */
  .ico { width:18px; height:18px; flex:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; fill:none; }
  .ico-sm { width:15px; height:15px; }
  .wt-btn { display:inline-flex; align-items:center; gap:7px; background:var(--surface); color:var(--ink); border:1px solid var(--baseline); border-radius:var(--radius-ctl); padding:9px 13px; cursor:pointer; font:600 14px system-ui; min-height:40px; transition:transform var(--transition) var(--ease), box-shadow var(--transition) var(--ease), border-color var(--transition) var(--ease), background var(--transition) var(--ease); }
  .wt-btn:hover { border-color:var(--ink-2); transform:translateY(-1px); box-shadow:var(--shadow-card); }
  .wt-btn:active { transform:none; box-shadow:none; }
  .wt-btn.primary, .wt-btn.run { background:var(--accent); color:var(--accent-ink); border-color:transparent; }
  .wt-btn.primary:hover, .wt-btn.run:hover { background:color-mix(in srgb, var(--ink) 12%, var(--accent)); border-color:transparent; }
  .wt-btn.alt { background:transparent; color:var(--ink-2); border-color:transparent; }
  .wt-btn.alt:hover { background:color-mix(in srgb, var(--ink) 5%, var(--surface)); color:var(--ink); box-shadow:none; transform:none; }
  .wt-btn:disabled { opacity:.45; cursor:default; transform:none; box-shadow:none; }
  h4 { margin:6px 0 2px; font:600 11.5px system-ui; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
  .hint { color:var(--muted); font-size:13px; line-height:1.55; }
  code { background:color-mix(in srgb, var(--accent) 8%, var(--surface)); border-radius:6px; padding:1px 5px; font-size:12px; color:var(--accent); font-family:ui-monospace,Menlo,monospace; }
  .wt-pre { background:var(--surface); border:1px solid var(--grid); border-radius:var(--radius-ctl); padding:10px; font-family:ui-monospace,Menlo,monospace; font-size:12px; line-height:1.5; white-space:pre-wrap; word-break:break-word; max-height:180px; overflow:auto; color:var(--ink-2); }
  .wt-file { font-size:12px; width:100%; }
  input, select, textarea { font:inherit; color:var(--ink); }
  .wt-num { width:64px; border:1px solid var(--baseline); border-radius:var(--radius-ctl); padding:8px 8px; font:inherit; font-size:13px; min-height:36px; background:var(--surface); outline:0; transition:border-color var(--transition) var(--ease); }
  .wt-num:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent); }
  .wt-pickhint { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); background:var(--ink); color:var(--page); font:600 13px system-ui; padding:9px 16px; border-radius:999px; box-shadow:var(--shadow-hover); z-index:2147483647; }
  .addmenu { display:flex; flex-wrap:wrap; gap:8px; padding:12px; background:var(--surface); border-radius:var(--radius); box-shadow:var(--shadow-card); }
  .addmenu .wt-btn { font-size:13px; padding:7px 11px; min-height:36px; }
  /* stappen — schaduw-eerst, geen rand */
  .stprow { display:flex; align-items:center; gap:8px; background:var(--surface); border-radius:12px; padding:8px 10px; margin-bottom:8px; box-shadow:var(--shadow-card); }
  .stnum { flex-shrink:0; width:20px; height:20px; border-radius:50%; background:color-mix(in srgb, var(--accent) 10%, var(--surface)); color:var(--accent); font:700 10px system-ui; display:flex; align-items:center; justify-content:center; }
  .stbadge { flex-shrink:0; border-radius:999px; padding:2px 9px; font:700 9px system-ui; letter-spacing:.05em; text-transform:uppercase; color:var(--accent); background:color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .b-scrape,.b-fill,.b-click,.b-wait,.b-print,.b-shot,.b-setval,.b-select,.b-type,.b-key,.b-hover,.b-scroll,.b-scrollload,.b-waitfor,.b-cond,.b-images,.b-webhook { color:var(--ink-2); background:color-mix(in srgb, var(--ink) 6%, var(--surface)); }
  .fc-webhook { color:var(--ink-2); background:color-mix(in srgb, var(--ink) 6%, var(--surface)); }
  /* donker thema (rollen omgedraaid) */
  .wt-card.wt-dark { --page:#141414; --surface:#1c1c1b; --ink:#f3f2ee; --ink-2:#b8b6ae; --muted:#8b8981; --grid:#2c2c29; --baseline:#3a3a35; --border:rgba(255,255,255,.12); }
  .fc-type,.fc-key,.fc-hover,.fc-scroll,.fc-scrollload,.fc-waitfor,.fc-cond,.fc-images,.fc-setval,.fc-select,.fc-print,.fc-shot { color:var(--ink-2); background:color-mix(in srgb, var(--ink) 6%, var(--surface)); border-color:var(--grid); }
  .wt-primary { gap:8px; }
  .wt-primary .wt-btn { flex:1; justify-content:center; min-height:44px; }
  .wt-more { margin-top:6px; }
  details.wt-more>summary, .wt-chat>summary { cursor:pointer; font:600 13px system-ui; color:var(--ink-2); list-style:none; padding:6px 0; display:flex; align-items:center; gap:6px; }
  details.wt-more>summary::-webkit-details-marker, .wt-chat>summary::-webkit-details-marker { display:none; }
  details.wt-more>summary::before, .wt-chat>summary::before { content:''; width:0; height:0; border:4px solid transparent; border-left-color:var(--muted); transition:transform var(--transition) var(--ease); }
  details[open].wt-more>summary::before, .wt-chat[open]>summary::before { transform:rotate(90deg); }
  .wt-chat { background:var(--surface); border-radius:var(--radius); padding:10px 12px; box-shadow:var(--shadow-card); }
  .wt-chat > .hint, .wt-chat > .wt-row, .wt-chat > .wt-pre { margin-top:8px; }
  .stparams { flex-basis:100%; display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:7px; padding-top:7px; border-top:1px solid var(--grid); font-size:11px; color:var(--muted); }
  .stfill .fcols { flex-basis:100%; display:flex; flex-wrap:wrap; gap:4px 8px; margin-top:5px; max-height:120px; overflow:auto; }
  .stfill .fcol { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:var(--ink-2); background:color-mix(in srgb, var(--ink) 4%, var(--surface)); border-radius:999px; padding:2px 8px 2px 5px; cursor:pointer; }
  .stfill .fcol input { margin:0; }
  .stparams select, .stparams .pin { border:1px solid var(--baseline); border-radius:8px; padding:4px 6px; font:inherit; font-size:11px; background:var(--surface); outline:0; }
  .stparams .pin { width:120px; } .stparams .pin.s { width:60px; }
  .stparams select:focus, .stparams .pin:focus { border-color:var(--accent); }
  .stmid { flex:1; min-width:0; }
  .stname { border:1px solid transparent; border-radius:8px; padding:3px 6px; font:600 13px system-ui; width:100%; background:transparent; color:var(--ink); outline:0; transition:border-color var(--transition) var(--ease); }
  .stname:hover, .stname:focus { border-color:var(--baseline); background:var(--surface); }
  .stms { width:60px; border:1px solid var(--baseline); border-radius:8px; padding:3px 6px; font:inherit; font-size:13px; background:var(--surface); outline:0; }
  .stdet { font:11px ui-monospace,monospace; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mini { background:transparent; border:0; border-radius:8px; padding:4px; color:var(--muted); cursor:pointer; display:inline-flex; transition:background var(--transition) var(--ease), color var(--transition) var(--ease); }
  .mini:hover { background:color-mix(in srgb, var(--ink) 5%, var(--surface)); color:var(--ink); }
  .mini.danger:hover { color:var(--bad); }
  .strep { flex-shrink:0; font:600 10px system-ui; color:var(--muted); display:flex; align-items:center; gap:1px; }
  .strepn { width:36px; border:1px solid var(--baseline); border-radius:8px; padding:2px 4px; font:inherit; font-size:12px; background:var(--surface); outline:0; text-align:center; }
  .strepn:focus { border-color:var(--accent); }
  .ststat { flex-shrink:0; width:16px; text-align:center; font:700 12px system-ui; color:var(--baseline); }
  .ststat.done { color:var(--good); } .ststat.busy { color:var(--accent); } .ststat.err { color:var(--bad); }
  .wt-prog { display:flex; flex-direction:column; gap:6px; }
  .prog-txt { font-size:12px; color:var(--ink-2); } .prog-txt b { color:var(--accent); font-variant-numeric:tabular-nums; }
  .prog-bar { height:6px; background:var(--grid); border-radius:999px; overflow:hidden; }
  .prog-bar span { display:block; height:100%; background:var(--accent); transition:width .35s var(--ease); }
  .stins { display:flex; justify-content:center; height:16px; margin:-2px 0; }
  .stins-btn { background:var(--surface); border:1px dashed var(--baseline); border-radius:999px; color:var(--muted); font:600 10px system-ui; padding:1px 10px; cursor:pointer; line-height:14px; opacity:.65; transition:opacity var(--transition) var(--ease), border-color var(--transition) var(--ease), color var(--transition) var(--ease); }
  .stins-btn:hover { opacity:1; border-color:var(--accent); color:var(--accent); }
  /* flowchart */
  .fc { background:var(--surface); border-radius:var(--radius); padding:12px; display:flex; flex-direction:column; align-items:center; gap:3px; box-shadow:var(--shadow-card); }
  .fc-box { width:100%; max-width:240px; text-align:center; border-radius:999px; padding:6px 12px; font:600 12px system-ui; background:color-mix(in srgb, var(--ink) 4%, var(--surface)); color:var(--ink-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .fc-start, .fc-done { background:var(--accent); color:var(--accent-ink); }
  .fc-loop, .fc-next { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); color:var(--accent); }
  .fc-scrape { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); color:var(--accent); }
  .fc-fill,.fc-click,.fc-wait { background:color-mix(in srgb, var(--ink) 5%, var(--surface)); color:var(--ink-2); }
  .fc-arw { color:var(--muted); font-size:11px; line-height:1; }
  @keyframes wt-pop { 0%{transform:scale(.6)} 60%{transform:scale(1.14)} 100%{transform:scale(1)} }
  .ststat.done { animation:wt-pop .25s var(--ease); }
  @media (prefers-reduced-motion: reduce) { .wt-card *, .wt-card *::before { transition:none !important; animation:none !important; } }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="M7 5v14l11-7z"/></symbol>
  <symbol id="i-pause" viewBox="0 0 24 24"><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></symbol>
  <symbol id="i-stop" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></symbol>
  <symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 20h14"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 5v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></symbol>
  <symbol id="i-save" viewBox="0 0 24 24"><path d="M6 4h10l4 4v12H6z"/><path d="M9 4v5h6"/><rect x="9" y="13" width="8" height="7"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></symbol>
  <symbol id="i-min" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></symbol>
  <symbol id="i-link" viewBox="0 0 24 24"><path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="21" y2="21"/></symbol>
  <symbol id="i-list" viewBox="0 0 24 24"><line x1="9" y1="7" x2="20" y2="7"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="17" x2="20" y2="17"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/></symbol>
  <symbol id="i-edit" viewBox="0 0 24 24"><path d="M4 16.5V20h3.5L18 9.5 14.5 6z"/><path d="M13 7l4 4"/></symbol>
  <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
  <symbol id="i-cursor" viewBox="0 0 24 24"><path d="M6 4l13 6.5-5.5 1.8L11 19z"/></symbol>
  <symbol id="i-keyboard" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="14" x2="17" y2="14"/></symbol>
  <symbol id="i-mouse" viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" rx="4"/><line x1="12" y1="8" x2="12" y2="11"/></symbol>
  <symbol id="i-move" viewBox="0 0 24 24"><path d="M12 4v16"/><path d="M8 8l4-4 4 4"/><path d="M8 16l4 4 4-4"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></symbol>
  <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .9-1 1.6"/><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 7l1.5-2h5L16 7"/></symbol>
  <symbol id="i-printer" viewBox="0 0 24 24"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><rect x="7" y="14" width="10" height="6"/></symbol>
  <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></symbol>
  <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/></symbol>
  <symbol id="i-swap" viewBox="0 0 24 24"><path d="M7 8h12l-3-3"/><path d="M17 16H5l3 3"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M5 5h14v10H9l-4 4z"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2-7z"/></symbol>
  <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M4.5 7l2.6 1.5M16.9 15.5L19.5 17M19.5 7l-2.6 1.5M7.1 15.5L4.5 17"/></symbol>
  <symbol id="i-trash" viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/></symbol>
  <symbol id="i-up" viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></symbol>
  <symbol id="i-down" viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></symbol>
  <symbol id="i-file-plus" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></symbol>
</defs></svg>
<div class="wt-card">
  <div class="wt-head"><span class="brand">W</span><b>WebTool Scraper</b><span class="sp"></span>
    <select id="wt-lang" class="wt-num" style="width:auto;padding:2px 4px" title="Taal / Language">` +
        Object.keys(LANGS).map(l => '<option value="' + l + '"' + (l === LANG ? ' selected' : '') + '>' + LANGS[l] + '</option>').join('') + `</select>
    <button class="wt-ico" id="wt-min" title="Inklappen">` + IC('min') + `</button>
    <button class="wt-ico" id="wt-close" title="Sluiten">` + IC('x') + `</button>
  </div>
  <div class="wt-body">
    <div class="hint" data-i18n="intro">Bouw één flow: scrapen, formulier vullen en knop drukken in elke volgorde.</div>
    <details class="wt-chat" open>
      <summary>` + IC('chat', 'ico-sm') + ` <span data-i18n="chat">Bouw met opdrachten</span></summary>
      <div class="hint" data-i18n="chat_hint">Typ wat je wilt, bv.: scrape de prijs · vul veld met {{Naam}} · klik Opslaan · wacht 2s · screenshot · herhaal 5 · map shirts · submap per relatienummer · start</div>
      <div class="wt-row"><input id="chat-in" style="flex:1;min-width:120px;border:1px solid var(--baseline);border-radius:var(--radius-ctl);padding:8px 10px;font:inherit;font-size:13px;min-height:40px;background:var(--surface);outline:0" placeholder="opdracht… (Enter)"><button class="wt-btn primary" id="chat-send" title="Uitvoeren">` + IC('send') + `</button></div>
      <div class="wt-pre" id="chat-log" style="max-height:110px">Typ een opdracht of "help".</div>
    </details>
    <div class="fc" id="wt-flow"></div>
    <h4 data-i18n="h_steps">Stappen</h4>
    <div id="flow-steps"></div>
    <div class="addmenu" id="flow-add-menu" style="display:none">
      <button class="wt-btn alt" data-add="scrape-el">` + IC('search', 'ico-sm') + ` <span data-i18n="m_scrape_el">Element scrapen</span></button>
      <button class="wt-btn alt" data-add="scrape-list">` + IC('list', 'ico-sm') + ` <span data-i18n="m_scrape_list">Lijst scrapen</span></button>
      <button class="wt-btn alt" data-add="fill">` + IC('edit', 'ico-sm') + ` <span data-i18n="m_fill">Formulier vullen</span></button>
      <button class="wt-btn alt" data-add="setval">` + IC('edit', 'ico-sm') + ` <span data-i18n="m_setval">Veld invullen</span></button>
      <button class="wt-btn alt" data-add="select">` + IC('chevron-down', 'ico-sm') + ` <span data-i18n="m_select">Dropdown</span></button>
      <button class="wt-btn alt" data-add="click">` + IC('cursor', 'ico-sm') + ` <span data-i18n="m_click">Knop drukken</span></button>
      <button class="wt-btn alt" data-add="type">` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_type">Typ tekst</span></button>
      <button class="wt-btn alt" data-add="key">` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_key">Toets</span></button>
      <button class="wt-btn alt" data-add="hover">` + IC('mouse', 'ico-sm') + ` <span data-i18n="m_hover">Hover</span></button>
      <button class="wt-btn alt" data-add="scroll">` + IC('move', 'ico-sm') + ` <span data-i18n="m_scroll">Scroll naar</span></button>
      <button class="wt-btn alt" data-add="scrollload">` + IC('move', 'ico-sm') + ` <span data-i18n="m_scrollload">Scroll &amp; laad</span></button>
      <button class="wt-btn alt" data-add="waitfor">` + IC('clock', 'ico-sm') + ` <span data-i18n="m_waitfor">Wacht op element</span></button>
      <button class="wt-btn alt" data-add="cond">` + IC('help', 'ico-sm') + ` <span data-i18n="m_cond">Voorwaarde</span></button>
      <button class="wt-btn alt" data-add="images">` + IC('download', 'ico-sm') + ` <span data-i18n="m_images">Bestanden</span></button>
      <button class="wt-btn alt" data-add="webhook">` + IC('link', 'ico-sm') + ` <span data-i18n="m_webhook">Webhook</span></button>
      <button class="wt-btn alt" data-add="wait">` + IC('clock', 'ico-sm') + ` <span data-i18n="m_wait">Wachten</span></button>
      <button class="wt-btn alt" data-add="shot">` + IC('camera', 'ico-sm') + ` <span data-i18n="m_shot">Screenshot</span></button>
      <button class="wt-btn alt" data-add="print">` + IC('printer', 'ico-sm') + ` <span data-i18n="m_print">Print</span></button>
    </div>
    <div class="wt-row"><button class="wt-btn primary" id="flow-add">` + IC('plus') + ` <span data-i18n="add_step">Stap toevoegen</span></button>
      <button class="wt-btn alt" id="flow-check" title="Controleer of alle gekoppelde velden/knoppen op deze pagina te vinden zijn">` + IC('link', 'ico-sm') + ` <span data-i18n="check_links">Check koppelingen</span></button></div>
    <h4 data-i18n="h_run">Uitvoeren</h4>
    <div class="wt-row wt-primary">
      <button class="wt-btn run" id="flow-run">` + IC('play') + ` <span data-i18n="start">Start</span></button>
      <button class="wt-btn alt" id="flow-pause" disabled>` + IC('pause') + ` <span data-i18n="pause">Pauze</span></button>
      <button class="wt-btn alt" id="flow-stop" disabled>` + IC('stop') + ` <span data-i18n="stop">Stop</span></button>
    </div>
    <div class="wt-row wt-primary">
      <button class="wt-btn" id="flow-upload">` + IC('upload') + ` <span data-i18n="upload_data">Upload data</span></button>
      <button class="wt-btn" id="flow-download">` + IC('download') + ` <span data-i18n="dl_result">Download uitkomst</span></button>
      <button class="wt-btn" id="flow-save">` + IC('save') + ` <span data-i18n="save_flow">Bewaar flow</span></button>
    </div>
    <div class="hint" id="flow-csvinfo">Geen CSV — flow draait één keer.</div>
    <div class="wt-prog" id="flow-progress" style="display:none"></div>
    <div class="wt-pre" id="flow-log">Nog niet gestart.</div>
    <div class="wt-pre" id="flow-result">Nog niets gescrapet.</div>

    <details class="wt-more">
      <summary>` + IC('gear', 'ico-sm') + ` <span data-i18n="more">Meer opties</span></summary>
      <div class="hint" data-i18n="data_hint">Upload een CSV → de flow draait één keer per rij. In een cel kun je <code>{{Naam}}</code> of <code>{{Prijs*1.21}}</code> gebruiken.</div>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-tmpl" title="Download een lege CSV met een kolomkop per gekozen invoerveld">` + IC('file-plus', 'ico-sm') + ` CSV-sjabloon van invoervelden</button>
        <label class="wt-btn alt" style="cursor:pointer">` + IC('doc', 'ico-sm') + ` <span data-i18n="pick_csv">CSV kiezen…</span><input type="file" id="flow-file" accept=".csv,text/csv" style="display:none"></label>
        <button class="wt-btn alt" id="flow-clearcsv" title="Wis de geladen CSV zodat je een nieuwe kunt uploaden">` + IC('x', 'ico-sm') + ` <span data-i18n="clear_csv">CSV wissen</span></button>
      </div>
      <div class="wt-row">
        <span class="hint">herhaal flow</span><input type="number" id="flow-repeat" value="1" min="1" class="wt-num">×
        <span class="hint">pauze</span><input type="number" id="flow-delay" value="600" class="wt-num"> ms
      </div>
      <div class="wt-row">
        <span class="hint" data-i18n="onerror">bij fout</span>
        <select id="flow-onerror" class="wt-num" style="width:100px"><option value="skip" data-i18n="err_skip">overslaan</option><option value="stop" data-i18n="err_stop">stop</option></select>
        <span class="hint">retry</span><input type="number" id="flow-retries" class="wt-num" style="width:48px" value="0" min="0">×
      </div>
      <div class="hint">Tip: elke stap heeft ook een <b>×</b>-veld om alléén die stap te herhalen (bv. 5× op "Volgende" drukken).</div>
      <div class="wt-row"><span class="hint" data-i18n="dl_folder">map in Downloads</span><input id="flow-folder" class="wt-num" style="width:120px" value="webtool"><span class="hint">/</span></div>
      <div class="wt-row"><span class="hint" data-i18n="dl_group">submap per kolom</span><input id="flow-group" class="wt-num" style="width:120px" placeholder="bv. relatienummer"></div>
      <div class="hint">Screenshots, print-PDF's en bestanden komen in deze map. Vul een kolomnaam in om per unieke waarde (bv. per relatienummer) een eigen submap te maken.</div>
      <div class="wt-row">
        <span class="hint" data-i18n="exp_as">exporteer als</span>
        <button class="wt-btn" id="flow-json">JSON</button>
        <button class="wt-btn" id="flow-csv">CSV</button>
        <button class="wt-btn" id="flow-xlsx">Excel</button>
        <button class="wt-btn" id="flow-zip">ZIP</button>
        <button class="wt-btn alt" id="flow-copy" data-i18n="copy">Kopieer</button>
      </div>
      <div class="wt-row"><input id="flow-webhook" class="wt-num" style="width:150px" placeholder="webhook-URL (POST)"><button class="wt-btn alt" id="flow-webhook-send"><span data-i18n="webhook_send">Verstuur</span></button></div>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-load" data-i18n="load">Laad flow</button>
        <input id="flow-preset-name" class="wt-num" style="width:100px" placeholder="naam">
        <button class="wt-btn alt" id="flow-preset-save">` + IC('save', 'ico-sm') + ` <span data-i18n="preset_saveas">Bewaar als</span></button>
        <select id="flow-preset-list" class="wt-num" style="width:100px"></select>
        <button class="wt-btn alt" id="flow-preset-load" data-i18n="load">Laad</button>
        <button class="wt-btn alt mini danger" id="flow-preset-del" title="Verwijder preset">` + IC('trash', 'ico-sm') + `</button>
      </div>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-export">` + IC('download', 'ico-sm') + ` <span data-i18n="exp_flow">Flow-bestand</span></button>
        <label class="wt-btn alt" style="cursor:pointer">` + IC('upload', 'ico-sm') + ` <span data-i18n="importf">Importeer</span><input type="file" id="flow-import" accept=".json" style="display:none"></label>
        <button class="wt-btn alt" id="flow-theme">` + IC('moon', 'ico-sm') + ` <span data-i18n="theme">Thema</span></button>
        <button class="wt-btn alt" id="flow-side">` + IC('swap', 'ico-sm') + ` <span data-i18n="side">Kant</span></button>
      </div>
      <div class="hint" data-i18n="mcp_hint">MCP-koppeling: laat een AI-agent de velden ophalen en records automatisch invullen (bv. 30×) via een lokale MCP-server. Alleen localhost.</div>
      <div class="wt-row"><button class="wt-btn alt" id="flow-mcp">` + IC('link', 'ico-sm') + ` <span data-i18n="mcp_toggle">MCP-koppeling</span> <b id="flow-mcp-state" style="color:var(--muted)">uit</b></button></div>
    </details>
  </div>
  <div class="wt-pickhint" id="wt-pickhint" style="display:none"></div>
</div>`;
    }
    } // einde buildPanel

    // ============================================================ programmatische API (voor MCP / agent)
    // Een agent kan zo: (1) de velden van de huidige pagina als schema ophalen, en
    // (2) een reeks records laten invullen — telkens invullen → (optioneel) opslaan/volgende →
    // wachten — bv. 30 producten achter elkaar. Draait in JOUW ingelogde tab (geen wachtwoorden nodig).
    function apiReadFields(scopeSel) {
        let root = doc; try { root = scopeSel ? (doc.querySelector(scopeSel) || doc) : (doc.querySelector('form') || doc); } catch (e) {}
        const cm = buildColumnMap(readFormFieldsIn(root));
        return cm.map(m => {
            let el = null; try { el = doc.querySelector(m.selector); } catch (e) {}
            return { column: m.col, label: m.label || '', name: m.key || '', selector: m.selector, type: (el && (el.type || el.tagName.toLowerCase())) || '', options: (el && el.tagName === 'SELECT') ? Array.from(el.options).map(o => o.value || txt(o)) : undefined, fp: el ? fingerprint(el) : null };
        });
    }
    async function apiFill(payload) {
        payload = payload || {};
        const records = Array.isArray(payload.records) ? payload.records : [];
        let scope = doc; try { scope = payload.form ? (doc.querySelector(payload.form) || doc) : doc; } catch (e) {}
        const cm = buildColumnMap(readFormFieldsIn(scope));
        const delay = Math.max(0, payload.delay != null ? payload.delay : 400);
        const results = [];
        for (let i = 0; i < records.length; i++) {
            // opnieuw scope pakken (na een opslag kan de pagina verversen)
            let sc = scope; try { if (payload.form) sc = doc.querySelector(payload.form) || doc; } catch (e) {}
            const rep = await fillRowWith(records[i], cm.length ? cm : buildColumnMap(readFormFieldsIn(sc)), sc, records[i]);
            let submitted = false;
            const sub = payload.submit;
            if (sub) {
                let btn = null;
                try { btn = sub.selector ? doc.querySelector(sub.selector) : null; } catch (e) {}
                if (!btn && sub.fp) btn = findByFingerprint(sub.fp, doc);
                if (!btn && sub.text) { const t = String(sub.text).toLowerCase(); btn = Array.from(doc.querySelectorAll('button,a,[role="button"],input[type="submit"],input[type="button"]')).find(b => (txt(b) || b.value || '').toLowerCase().includes(t)); }
                if (btn) { (btn.closest('button,a,[role="button"],.mud-button-root,input[type="submit"],input[type="button"]') || btn).click(); submitted = true; }
            }
            results.push({ index: i, filled: rep.filled, missed: rep.missed, submitted });
            await sleep(delay);
        }
        return { count: records.length, results };
    }
    // Voor tests / los gebruik zonder extensie-messaging.
    try { window.__wtApi = { readFields: apiReadFields, fill: apiFill }; } catch (e) {}

    // ============================================================ boot
    // Het paneel "aan"-zetten wordt in chrome.storage bewaard, zodat het paneel op
    // ELKE nieuwe pagina automatisch weer verschijnt (en je flow terugkomt) —
    // zolang je het niet met ✕ sluit.
    function removePanel() { if (window.__wtCleanup) window.__wtCleanup(); }
    function getActive(cb) { try { chrome.storage.local.get('wt-active', r => cb(!!(r && r['wt-active']))); } catch (e) { cb(false); } }

    const IS_EXT = (() => { try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; } })();

    if (!window.__WT_BOOTED__) {
        window.__WT_BOOTED__ = true;
        if (!IS_EXT) {
            buildPanel();   // los bestand / test: meteen tonen
        } else {
            getActive(a => { if (a) buildPanel(); });
            try {
                chrome.runtime.onMessage.addListener((m, sender, send) => {
                if (!m) return;
                if (m.type === 'wt-set') { m.active ? buildPanel() : removePanel(); return; }
                if (m.type === 'wt-api-readfields') { try { send({ ok: true, fields: apiReadFields(m.scope) }); } catch (e) { send({ ok: false, error: String(e && e.message || e) }); } return true; }
                if (m.type === 'wt-api-fill') { apiFill(m.payload).then(r => send({ ok: true, result: r })).catch(e => send({ ok: false, error: String(e && e.message || e) })); return true; }
            });
                chrome.storage.onChanged.addListener((ch, area) => {
                    if (area === 'local' && ch['wt-active']) { ch['wt-active'].newValue ? buildPanel() : removePanel(); }
                });
            } catch (e) {}
        }
    }
})();
