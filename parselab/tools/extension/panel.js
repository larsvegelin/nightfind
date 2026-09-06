/*
 * ParseLab — paneel (ParseForm & ParseScraper)
 * Draait op de ECHTE pagina. Bouw één taak met stappen: invullen, klikken, uitlezen en
 * wachten. Klik "+ Stap toevoegen", kies wat je wilt en wijs het aan op de pagina.
 * Draai de taak één keer, of één ronde per regel uit je lijst (Excel/CSV).
 * Alles blijft in de browser; er gaat niets naar buiten.
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
        intro: { nl: 'Wijs aan wat er moet gebeuren: invullen, klikken, uitlezen of wachten. Klik + Stap toevoegen en klik daarna op de pagina.', en: 'Point at what should happen: fill in, click, read or wait. Click + Add step, then click on the page.', de: 'Zeige, was passieren soll: ausfüllen, klicken, auslesen oder warten. Klicke + Schritt hinzufügen und dann auf die Seite.', fr: 'Indiquez ce qui doit se passer : remplir, cliquer, lire ou attendre. Cliquez + Ajouter une étape, puis sur la page.', es: 'Señala lo que debe pasar: rellenar, hacer clic, leer o esperar. Pulsa + Añadir paso y luego en la página.' },
        q_input: { nl: 'Iets invullen', en: 'Fill something in', de: 'Etwas ausfüllen', fr: 'Remplir quelque chose', es: 'Rellenar algo' },
        q_click: { nl: 'Ergens op klikken', en: 'Click somewhere', de: 'Irgendwo klicken', fr: 'Cliquer quelque part', es: 'Hacer clic en algo' },
        q_wait: { nl: 'Even wachten', en: 'Wait a moment', de: 'Kurz warten', fr: 'Attendre un peu', es: 'Esperar un momento' },
        chat: { nl: 'Bouw met opdrachten (typen)', en: 'Build with typed commands', de: 'Mit getippten Befehlen bauen', fr: 'Construire par commandes tapées', es: 'Construir con comandos escritos' },
        chat_hint: { nl: 'Typ wat je wilt, bv.: lees de prijs · vul veld · klik Opslaan · wacht 2s · bewijskopie · herhaal 5 · map dossiers · start', en: 'Type what you want, e.g.: read the price · fill field · click Save · wait 2s · screenshot · repeat 5 · folder files · start', de: 'Tippe was du willst, z.B.: lies den Preis · Feld füllen · klick Speichern · warte 2s · Screenshot · wiederhole 5 · Ordner akten · start', fr: 'Écris ce que tu veux, ex.: lis le prix · remplir champ · clique Enregistrer · attends 2s · capture · répète 5 · dossier · start', es: 'Escribe lo que quieres, ej.: lee el precio · rellenar campo · clic Guardar · esperar 2s · captura · repetir 5 · carpeta · start' },
        h_steps: { nl: 'Stappen', en: 'Steps', de: 'Schritte', fr: 'Étapes', es: 'Pasos' },
        add_step: { nl: 'Stap toevoegen', en: 'Add step', de: 'Schritt hinzufügen', fr: 'Ajouter une étape', es: 'Añadir paso' },
        more_steps: { nl: 'Meer', en: 'More', de: 'Mehr', fr: 'Plus', es: 'Más' },
        h_run: { nl: 'Uitvoeren', en: 'Run', de: 'Ausführen', fr: 'Exécuter', es: 'Ejecutar' },
        start: { nl: 'Start', en: 'Start', de: 'Start', fr: 'Démarrer', es: 'Iniciar' },
        rows: { nl: 'regels', en: 'rows', de: 'Zeilen', fr: 'lignes', es: 'filas' },
        busy: { nl: 'Bezig…', en: 'Running…', de: 'Läuft…', fr: 'En cours…', es: 'En curso…' },
        stop: { nl: 'Stop', en: 'Stop', de: 'Stopp', fr: 'Arrêter', es: 'Parar' },
        pause: { nl: 'Pauze', en: 'Pause', de: 'Pause', fr: 'Pause', es: 'Pausa' },
        resume: { nl: 'Hervat', en: 'Resume', de: 'Fortsetzen', fr: 'Reprendre', es: 'Reanudar' },
        upload_data: { nl: 'Lijst uploaden', en: 'Upload list', de: 'Liste hochladen', fr: 'Importer la liste', es: 'Subir lista' },
        dl_result: { nl: 'Download bestand', en: 'Download file', de: 'Datei herunterladen', fr: 'Télécharger le fichier', es: 'Descargar archivo' },
        save_flow: { nl: 'Bewaar taak', en: 'Save task', de: 'Aufgabe speichern', fr: 'Enregistrer la tâche', es: 'Guardar tarea' },
        settings: { nl: 'Instellingen', en: 'Settings', de: 'Einstellungen', fr: 'Paramètres', es: 'Ajustes' },
        advanced: { nl: 'Gevorderd', en: 'Advanced', de: 'Erweitert', fr: 'Avancé', es: 'Avanzado' },
        tmpl_xlsx: { nl: 'Maak mijn invullijst (Excel)', en: 'Make my fill-in list (Excel)', de: 'Meine Ausfüllliste erstellen (Excel)', fr: 'Créer ma liste à remplir (Excel)', es: 'Crear mi lista para rellenar (Excel)' },
        data_hint: { nl: 'Upload je lijst (Excel of CSV): de taak draait één ronde per regel.', en: 'Upload your list (Excel or CSV): the task runs one round per row.', de: 'Lade deine Liste hoch (Excel oder CSV): die Aufgabe läuft eine Runde pro Zeile.', fr: 'Importez votre liste (Excel ou CSV) : la tâche tourne une fois par ligne.', es: 'Sube tu lista (Excel o CSV): la tarea se ejecuta una ronda por fila.' },
        clear_csv: { nl: 'Lijst wissen', en: 'Clear list', de: 'Liste löschen', fr: 'Effacer la liste', es: 'Borrar lista' },
        mcp_toggle: { nl: 'Koppeling voor een agent', en: 'Agent link', de: 'Agenten-Verbindung', fr: 'Liaison agent', es: 'Enlace de agente' },
        mcp_hint: { nl: 'Alleen voor IT-beheer: laat een AI-agent op deze computer de velden ophalen en regels automatisch invullen. Werkt alleen met de code hieronder en alleen zolang dit paneel open staat.', en: 'IT administration only: let an AI agent on this computer read the fields and fill rows automatically. Works only with the code below and only while this panel is open.', de: 'Nur für IT-Administration: ein KI-Agent auf diesem Computer liest die Felder und füllt Zeilen automatisch. Nur mit dem Code unten und nur solange dieses Panel offen ist.', fr: 'Réservé à l’administration IT : un agent IA sur cet ordinateur lit les champs et remplit les lignes. Uniquement avec le code ci-dessous et tant que ce panneau est ouvert.', es: 'Solo para administración de TI: un agente de IA en este equipo lee los campos y rellena filas automáticamente. Solo con el código de abajo y mientras este panel esté abierto.' },
        it_admin: { nl: 'Voor IT-beheer', en: 'For IT administration', de: 'Für IT-Administration', fr: 'Pour l’administration IT', es: 'Para administración de TI' },
        check_links: { nl: 'Controleer koppelingen', en: 'Check links', de: 'Verknüpfungen prüfen', fr: 'Vérifier les liens', es: 'Verificar enlaces' },
        other_formats: { nl: 'Andere formaten', en: 'Other formats', de: 'Andere Formate', fr: 'Autres formats', es: 'Otros formatos' },
        save: { nl: 'Bewaar', en: 'Save', de: 'Speichern', fr: 'Enregistrer', es: 'Guardar' },
        load: { nl: 'Laad', en: 'Load', de: 'Laden', fr: 'Charger', es: 'Cargar' },
        load_flow: { nl: 'Laad taak', en: 'Load task', de: 'Aufgabe laden', fr: 'Charger la tâche', es: 'Cargar tarea' },
        del_flow: { nl: 'Taak van deze site wissen', en: 'Remove task for this site', de: 'Aufgabe dieser Seite löschen', fr: 'Supprimer la tâche de ce site', es: 'Borrar tarea de este sitio' },
        dl_folder: { nl: 'Map in Downloads', en: 'Folder in Downloads', de: 'Ordner in Downloads', fr: 'Dossier dans Téléchargements', es: 'Carpeta en Descargas' },
        dl_group: { nl: 'Sorteer bestanden in mappen op:', en: 'Sort files into folders by:', de: 'Dateien in Ordner sortieren nach:', fr: 'Classer les fichiers en dossiers par :', es: 'Ordenar archivos en carpetas por:' },
        copy: { nl: 'Kopieer', en: 'Copy', de: 'Kopieren', fr: 'Copier', es: 'Copiar' },
        webhook_send: { nl: 'Verstuur', en: 'Send', de: 'Senden', fr: 'Envoyer', es: 'Enviar' },
        preset_saveas: { nl: 'Bewaar als', en: 'Save as', de: 'Speichern als', fr: 'Enregistrer sous', es: 'Guardar como' },
        exp_flow: { nl: 'Taakbestand', en: 'Task file', de: 'Aufgabendatei', fr: 'Fichier de tâche', es: 'Archivo de tarea' },
        importf: { nl: 'Importeer', en: 'Import', de: 'Importieren', fr: 'Importer', es: 'Importar' },
        theme: { nl: 'Donker / licht', en: 'Dark / light', de: 'Dunkel / hell', fr: 'Sombre / clair', es: 'Oscuro / claro' },
        side: { nl: 'Links / rechts', en: 'Left / right', de: 'Links / rechts', fr: 'Gauche / droite', es: 'Izquierda / derecha' },
        lang: { nl: 'Taal', en: 'Language', de: 'Sprache', fr: 'Langue', es: 'Idioma' },
        cookies: { nl: 'Cookiemeldingen automatisch sluiten', en: 'Close cookie banners automatically', de: 'Cookie-Hinweise automatisch schließen', fr: 'Fermer les bandeaux cookies automatiquement', es: 'Cerrar avisos de cookies automáticamente' },
        onerror: { nl: 'Als een regel niet lukt:', en: 'If a row fails:', de: 'Wenn eine Zeile fehlschlägt:', fr: 'Si une ligne échoue :', es: 'Si una fila falla:' },
        err_skip: { nl: 'sla over en ga door (aanbevolen)', en: 'skip it and continue (recommended)', de: 'überspringen und weiter (empfohlen)', fr: 'passer et continuer (recommandé)', es: 'omitir y continuar (recomendado)' },
        err_stop: { nl: 'stop', en: 'stop', de: 'stopp', fr: 'arrêter', es: 'parar' },
        retries: { nl: 'Opnieuw proberen', en: 'Retry', de: 'Erneut versuchen', fr: 'Réessayer', es: 'Reintentar' },
        repeat: { nl: 'Herhaal de taak', en: 'Repeat the task', de: 'Aufgabe wiederholen', fr: 'Répéter la tâche', es: 'Repetir la tarea' },
        delay: { nl: 'Pauze tussen regels', en: 'Pause between rows', de: 'Pause zwischen Zeilen', fr: 'Pause entre les lignes', es: 'Pausa entre filas' },
        logbook: { nl: 'Logboek', en: 'Log', de: 'Protokoll', fr: 'Journal', es: 'Registro' },
        m_input: { nl: 'Invullen', en: 'Fill in', de: 'Ausfüllen', fr: 'Remplir', es: 'Rellenar' },
        m_click: { nl: 'Klikken', en: 'Click', de: 'Klicken', fr: 'Cliquer', es: 'Clic' },
        m_read: { nl: 'Uitlezen', en: 'Read', de: 'Auslesen', fr: 'Lire', es: 'Leer' },
        m_wait: { nl: 'Wachten', en: 'Wait', de: 'Warten', fr: 'Attendre', es: 'Esperar' },
        d_input: { nl: 'Wijs een veld, keuzelijst of heel formulier aan; de waarden komen uit je lijst.', en: 'Point at a field, dropdown or a whole form; the values come from your list.', de: 'Zeige auf ein Feld, eine Auswahlliste oder ein ganzes Formular; die Werte kommen aus deiner Liste.', fr: 'Indiquez un champ, une liste ou un formulaire entier ; les valeurs viennent de votre liste.', es: 'Señala un campo, lista o formulario entero; los valores vienen de tu lista.' },
        d_click: { nl: 'Wijs de knop aan die ingedrukt moet worden (Opslaan, Volgende…).', en: 'Point at the button to press (Save, Next…).', de: 'Zeige auf den Button, der gedrückt werden soll (Speichern, Weiter…).', fr: 'Indiquez le bouton à presser (Enregistrer, Suivant…).', es: 'Señala el botón que hay que pulsar (Guardar, Siguiente…).' },
        d_read: { nl: 'Wijs een tekst, prijs of één item van een lijst aan; je kiest daarna: alleen dit of de hele lijst.', en: 'Point at a text, price or one item of a list; then choose: only this or the whole list.', de: 'Zeige auf einen Text, Preis oder ein Listenelement; dann wählst du: nur dies oder die ganze Liste.', fr: 'Indiquez un texte, un prix ou un élément d’une liste ; choisissez ensuite : seulement ceci ou toute la liste.', es: 'Señala un texto, precio o un elemento de una lista; después eliges: solo esto o toda la lista.' },
        d_wait: { nl: 'Wacht tot de pagina klaar is (of een vaste tijd).', en: 'Wait until the page is ready (or a fixed time).', de: 'Warte, bis die Seite fertig ist (oder eine feste Zeit).', fr: 'Attendre que la page soit prête (ou un temps fixe).', es: 'Espera a que la página esté lista (o un tiempo fijo).' },
        m_type: { nl: 'Tekst typen', en: 'Type text', de: 'Text tippen', fr: 'Taper du texte', es: 'Escribir texto' },
        d_type: { nl: 'Typ vaste tekst in een veld, eventueel met Enter erna.', en: 'Type fixed text into a field, optionally followed by Enter.', de: 'Tippe festen Text in ein Feld, optional mit Enter.', fr: 'Tapez un texte fixe dans un champ, avec Entrée si besoin.', es: 'Escribe un texto fijo en un campo, con Enter si quieres.' },
        m_key: { nl: 'Toets indrukken', en: 'Press a key', de: 'Taste drücken', fr: 'Appuyer sur une touche', es: 'Pulsar una tecla' },
        d_key: { nl: 'Stuur één toets naar de pagina, bijvoorbeeld Enter of Tab.', en: 'Send one key to the page, for example Enter or Tab.', de: 'Sende eine Taste an die Seite, z.B. Enter oder Tab.', fr: 'Envoie une touche à la page, par exemple Entrée ou Tab.', es: 'Envía una tecla a la página, por ejemplo Enter o Tab.' },
        m_hover: { nl: 'Muis erboven houden', en: 'Hover', de: 'Maus darüber halten', fr: 'Survoler', es: 'Pasar el ratón' },
        d_hover: { nl: 'Voor menu’s of info die pas verschijnen als de muis erboven staat.', en: 'For menus or info that only appear when the mouse is over them.', de: 'Für Menüs oder Infos, die erst bei Mauskontakt erscheinen.', fr: 'Pour les menus ou infos qui n’apparaissent qu’au survol.', es: 'Para menús o información que solo aparecen al pasar el ratón.' },
        m_scroll: { nl: 'Scrollen', en: 'Scroll', de: 'Scrollen', fr: 'Défiler', es: 'Desplazar' },
        d_scroll: { nl: 'Scroll naar een plek op de pagina of naar onderen.', en: 'Scroll to a spot on the page or to the bottom.', de: 'Scrolle zu einer Stelle oder nach unten.', fr: 'Défiler vers un endroit de la page ou vers le bas.', es: 'Desplázate a un punto de la página o hasta abajo.' },
        m_scrollload: { nl: 'Alles laden door te scrollen', en: 'Load everything by scrolling', de: 'Alles durch Scrollen laden', fr: 'Tout charger en défilant', es: 'Cargar todo desplazando' },
        d_scrollload: { nl: 'Voor lijsten die verder laden als je naar beneden scrolt.', en: 'For lists that keep loading as you scroll down.', de: 'Für Listen, die beim Herunterscrollen weiterladen.', fr: 'Pour les listes qui se chargent en défilant.', es: 'Para listas que siguen cargando al bajar.' },
        m_shot: { nl: 'Bewaar een bewijskopie van deze pagina (afbeelding)', en: 'Save a proof copy of this page (image)', de: 'Beweiskopie dieser Seite speichern (Bild)', fr: 'Enregistrer une copie de preuve de cette page (image)', es: 'Guardar una copia de prueba de esta página (imagen)' },
        d_shot: { nl: 'Handig voor dossiers: een afbeelding van wat je op dat moment ziet.', en: 'Handy for files: an image of what you see at that moment.', de: 'Praktisch für Akten: ein Bild dessen, was du gerade siehst.', fr: 'Pratique pour les dossiers : une image de ce que vous voyez.', es: 'Útil para expedientes: una imagen de lo que ves en ese momento.' },
        m_print: { nl: 'Bewaar een bewijskopie van deze pagina (PDF)', en: 'Save a proof copy of this page (PDF)', de: 'Beweiskopie dieser Seite speichern (PDF)', fr: 'Enregistrer une copie de preuve de cette page (PDF)', es: 'Guardar una copia de prueba de esta página (PDF)' },
        d_print: { nl: 'De hele pagina als PDF in je map. Vraagt één keer extra toestemming.', en: 'The whole page as PDF in your folder. Asks for extra permission once.', de: 'Die ganze Seite als PDF in deinem Ordner. Fragt einmal um zusätzliche Erlaubnis.', fr: 'Toute la page en PDF dans votre dossier. Demande une autorisation supplémentaire une fois.', es: 'Toda la página como PDF en tu carpeta. Pide un permiso adicional una vez.' },
        m_images: { nl: 'Download alle PDF’s op deze pagina', en: 'Download all PDFs on this page', de: 'Alle PDFs dieser Seite herunterladen', fr: 'Télécharger tous les PDF de cette page', es: 'Descargar todos los PDF de esta página' },
        d_images: { nl: 'Alle PDF-koppelingen op de pagina gaan in één keer naar je map.', en: 'All PDF links on the page go to your folder at once.', de: 'Alle PDF-Links der Seite landen auf einmal in deinem Ordner.', fr: 'Tous les liens PDF de la page vont d’un coup dans votre dossier.', es: 'Todos los enlaces PDF de la página van a tu carpeta de una vez.' },
        m_webhook: { nl: 'Regel doorsturen (webhook)', en: 'Forward row (webhook)', de: 'Zeile weiterleiten (Webhook)', fr: 'Transmettre la ligne (webhook)', es: 'Reenviar fila (webhook)' },
        d_webhook: { nl: 'Stuurt elke regel naar een eigen internetadres (alleen https). Vraagt bevestiging.', en: 'Sends each row to your own web address (https only). Asks for confirmation.', de: 'Sendet jede Zeile an eine eigene Adresse (nur https). Fragt um Bestätigung.', fr: 'Envoie chaque ligne à votre propre adresse (https uniquement). Demande confirmation.', es: 'Envía cada fila a tu propia dirección (solo https). Pide confirmación.' },
        onlyif: { nl: 'Alleen als dit er is', en: 'Only if this is present', de: 'Nur wenn das da ist', fr: 'Seulement si ceci est présent', es: 'Solo si esto está' },
        which_col: { nl: 'Welke kolom hoort hier?', en: 'Which column goes here?', de: 'Welche Spalte gehört hierher?', fr: 'Quelle colonne va ici ?', es: '¿Qué columna va aquí?' },
        empty_skip: { nl: 'Lege cel? Veld blijft zoals het is.', en: 'Empty cell? Field stays as it is.', de: 'Leere Zelle? Feld bleibt wie es ist.', fr: 'Cellule vide ? Le champ reste tel quel.', es: '¿Celda vacía? El campo se queda como está.' },
        what_get: { nl: 'Wat wil je hebben?', en: 'What do you want?', de: 'Was möchtest du?', fr: 'Que voulez-vous ?', es: '¿Qué quieres?' },
        a_text: { nl: 'de tekst', en: 'the text', de: 'den Text', fr: 'le texte', es: 'el texto' },
        a_link: { nl: 'de link', en: 'the link', de: 'den Link', fr: 'le lien', es: 'el enlace' },
        a_img: { nl: 'de afbeelding', en: 'the image', de: 'das Bild', fr: 'l’image', es: 'la imagen' },
        to_number: { nl: 'Maak er een getal van', en: 'Make it a number', de: 'Als Zahl', fr: 'En faire un nombre', es: 'Convertir en número' },
        own_pattern: { nl: 'Eigen patroon', en: 'Own pattern', de: 'Eigenes Muster', fr: 'Motif personnalisé', es: 'Patrón propio' },
        only_this: { nl: 'Alleen dit', en: 'Only this', de: 'Nur dies', fr: 'Seulement ceci', es: 'Solo esto' },
        whole_list: { nl: 'De hele lijst', en: 'The whole list', de: 'Die ganze Liste', fr: 'Toute la liste', es: 'Toda la lista' },
        ask_list: { nl: 'Alleen dit, of de hele lijst?', en: 'Only this, or the whole list?', de: 'Nur dies, oder die ganze Liste?', fr: 'Seulement ceci, ou toute la liste ?', es: '¿Solo esto o toda la lista?' },
        yes: { nl: 'Ja', en: 'Yes', de: 'Ja', fr: 'Oui', es: 'Sí' },
        no: { nl: 'Nee', en: 'No', de: 'Nein', fr: 'Non', es: 'No' },
        cancel: { nl: 'Annuleren', en: 'Cancel', de: 'Abbrechen', fr: 'Annuler', es: 'Cancelar' },
        repick: { nl: 'Wijs het opnieuw aan →', en: 'Point it out again →', de: 'Erneut anzeigen →', fr: 'Indiquez-le à nouveau →', es: 'Señálalo de nuevo →' },
        ask_scroll: { nl: 'Deze lijst laadt verder als je scrolt. Alles ophalen?', en: 'This list keeps loading as you scroll. Fetch everything?', de: 'Diese Liste lädt beim Scrollen weiter. Alles holen?', fr: 'Cette liste continue de charger en défilant. Tout récupérer ?', es: 'Esta lista sigue cargando al desplazarse. ¿Obtener todo?' },
        ask_scroll_body: { nl: 'Na het scrollen kwamen er {n} items bij. ParseLab kan eerst helemaal naar onderen scrollen tot alles er staat, en dan pas uitlezen.', en: 'After scrolling, {n} more items appeared. ParseLab can scroll all the way down first until everything is there, and only then read.', de: 'Nach dem Scrollen kamen {n} Einträge dazu. ParseLab kann erst ganz nach unten scrollen, bis alles da ist, und dann auslesen.', fr: 'Après le défilement, {n} éléments de plus sont apparus. ParseLab peut d’abord défiler jusqu’en bas, puis lire.', es: 'Tras desplazarse aparecieron {n} elementos más. ParseLab puede desplazarse primero hasta abajo y luego leer.' },
        open_panel: { nl: 'ParseLab openen', en: 'Open ParseLab', de: 'ParseLab öffnen', fr: 'Ouvrir ParseLab', es: 'Abrir ParseLab' },
        start_anyway: { nl: 'Toch starten', en: 'Start anyway', de: 'Trotzdem starten', fr: 'Démarrer quand même', es: 'Iniciar de todos modos' }
    };
    function t(k) { const e = I18N[k]; return (e && (e[LANG] || e.en || e.nl)) || k; }
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
        let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[ T].*)?$/); if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
        m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})(?:[ T].*)?$/); if (m) return m[3] + '-' + pad2(m[2]) + '-' + pad2(m[1]);
        m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2})$/); if (m) return (+m[3] < 50 ? '20' : '19') + m[3] + '-' + pad2(m[2]) + '-' + pad2(m[1]);
        return '';
    }
    function looksLikeDate(v) { return !!toISODate(v); }
    // Welke kolommen van de lijst zien eruit als datum? (≥ 60% van de gevulde cellen)
    function detectDateColumns(rows) {
        if (!rows || !rows.length) return [];
        const cols = Object.keys(rows[0] || {}), out = [];
        cols.forEach(c => {
            let n = 0, d = 0;
            rows.slice(0, 50).forEach(r => { const v = r[c]; if (v != null && String(v).trim() !== '') { n++; if (looksLikeDate(v)) d++; } });
            if (n && d / n >= 0.6) out.push(c);
        });
        return out;
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
    function toXlsx(rows, cols) {
        rows = Array.isArray(rows) ? rows : [rows];
        const keys = (cols && cols.length) ? cols.slice() : Object.keys(rows.reduce((a, r) => { Object.keys(r || {}).forEach(k => a[k] = 1); return a; }, {}));
        const cell = (c, r, v) => { if (v != null && typeof v === 'object') v = JSON.stringify(v); return '<c r="' + colRef(c) + r + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; };
        let sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        sheet += '<row r="1">' + keys.map((k, c) => cell(c, 1, k)).join('') + '</row>';
        rows.forEach((r, ri) => { sheet += '<row r="' + (ri + 2) + '">' + keys.map((k, c) => cell(c, ri + 2, r ? r[k] : '')).join('') + '</row>'; });
        sheet += '</sheetData></worksheet>';
        return xlsxPackage(sheet);
    }
    function xlsxPackage(sheet) {
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
    function downloadBytes(bytes, filename, mime) {
        try { chrome.runtime.sendMessage({ type: 'wt-download', dataB64: bytesToB64(bytes), mime, filename, folder: currentFolder }); }
        catch (e) { blobDownload(new Blob([bytes], { type: mime }), filename); }   // los bestand / test zonder extensie
    }
    function blobDownload(blob, filename) { try { const a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } catch (e) {} }
    let currentFolder = 'ParseLab';   // map in Downloads waar alles heen gaat
    function sanitizeFolder(f) { return String(f || '').replace(/[\\:*?"<>|]/g, '').replace(/^\/+|\/+$/g, '').trim(); }
    function download(data, filename) {
        const isObj = typeof data !== 'string';
        let text = isObj ? JSON.stringify(data, null, 2) : data;
        const isJson = isObj || /\.json$/i.test(filename);
        const mime = isJson ? 'application/json' : 'text/csv';
        // UTF-8 BOM voor CSV → Excel toont € en accenten goed (geen "â‚¬").
        if (!isJson && text.charCodeAt(0) !== 0xFEFF) text = '﻿' + text;
        try { chrome.runtime.sendMessage({ type: 'wt-download', data: text, filename, mime, folder: currentFolder }); }
        catch (e) { blobDownload(new Blob([text], { type: mime }), filename); }
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
        // Omhullend <label>: alleen de labeltekst, niet de tekst van het veld/de opties erin.
        const wrap = el.closest && el.closest('label');
        if (wrap) { try { const c = wrap.cloneNode(true); c.querySelectorAll('input,select,textarea,button,option').forEach(x => x.remove()); const s = txt(c); if (s) return s; } catch (e) { if (txt(wrap)) return txt(wrap); } }
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
        let best = null, bs = 0, bstruct = 0;
        cands.forEach(el => {
            let s = 0;   // structurele signalen (type, stabiele klassen, placeholder, pad)
            if (fp.typ && (attrOf(el, 'type') || '').toLowerCase() === fp.typ) s += 2;
            const cls = stableClasses(el); s += Math.min((fp.cls || []).filter(c => cls.includes(c)).length, 4);
            if (fp.ph && attrOf(el, 'placeholder') === fp.ph) s += 2;
            if (fp.path && structSelector(el) === fp.path) s += 5;
            const tot = s + htmlSim(fp.html, el.outerHTML) * 3;
            if (tot > bs) { bs = tot; bstruct = s; best = el; }
        });
        // HTML-gelijkenis alléén (attribuutnamen als name=/id= heeft elk veld) is te mager:
        // liever "niet gevonden" dan het verkeerde veld invullen.
        return bs >= 3 && bstruct >= 1 ? best : null;
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
    // ---- Excel (.xlsx) lezen: minimale zip-lezer (stored + deflate via DecompressionStream) ----
    function unzipEntries(u8) {
        const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        let eocd = -1;
        for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
        if (eocd < 0) throw new Error('geen geldig Excel-bestand');
        const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
        const files = {}, td = new TextDecoder();
        for (let i = 0; i < n; i++) {
            if (dv.getUint32(p, true) !== 0x02014b50) break;
            const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
            const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
            const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
            const lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true);
            const start = lo + 30 + lnl + lel;
            files[name] = { method, data: u8.subarray(start, start + csize) };
            p += 46 + nl + el + cl;
        }
        return files;
    }
    async function zipText(files, name) {
        const f = files[name]; if (!f) return null;
        if (f.method === 0) return new TextDecoder().decode(f.data);
        if (f.method === 8) {
            const ds = new DecompressionStream('deflate-raw');
            const w = ds.writable.getWriter(); w.write(f.data); w.close();
            return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
        }
        throw new Error('onbekende compressie in Excel-bestand');
    }
    function colIndex(ref) { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; }
    function excelSerialToDate(v) {
        const n = parseFloat(v); if (isNaN(n)) return String(v);
        const d = new Date(Math.round((n - 25569) * 86400000));
        return pad2(d.getUTCDate()) + '-' + pad2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear();
    }
    async function parseXlsx(buf) {
        const files = unzipEntries(new Uint8Array(buf));
        const xml = s => new DOMParser().parseFromString(s, 'application/xml');
        // eerste werkblad opzoeken
        let sheetName = 'xl/worksheets/sheet1.xml';
        try {
            const wb = xml(await zipText(files, 'xl/workbook.xml')), rels = xml(await zipText(files, 'xl/_rels/workbook.xml.rels'));
            const first = wb.getElementsByTagName('sheet')[0];
            const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
            const rel = rid && Array.from(rels.getElementsByTagName('Relationship')).find(r => r.getAttribute('Id') === rid);
            if (rel) sheetName = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
        } catch (e) {}
        if (!files[sheetName]) { const any = Object.keys(files).find(k => /^xl\/worksheets\/sheet\d*\.xml$/.test(k)); if (any) sheetName = any; }
        const sheetXml = await zipText(files, sheetName); if (!sheetXml) throw new Error('geen werkblad gevonden');
        const shared = [];
        const ssXml = await zipText(files, 'xl/sharedStrings.xml');
        if (ssXml) Array.from(xml(ssXml).getElementsByTagName('si')).forEach(si => shared.push(Array.from(si.getElementsByTagName('t')).map(t => t.textContent).join('')));
        // datum-opmaak herkennen via styles.xml (numFmtId 14–22 of eigen d/m/y-opmaak)
        const dateStyles = new Set();
        const stXml = await zipText(files, 'xl/styles.xml');
        if (stXml) {
            try {
                const st = xml(stXml), custom = {};
                Array.from(st.getElementsByTagName('numFmt')).forEach(f => custom[f.getAttribute('numFmtId')] = f.getAttribute('formatCode') || '');
                const xfs = st.getElementsByTagName('cellXfs')[0];
                if (xfs) Array.from(xfs.getElementsByTagName('xf')).forEach((xf, i) => {
                    const id = +xf.getAttribute('numFmtId');
                    const code = custom[id] || '';
                    if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (code && /[dy]/i.test(code.replace(/\[[^\]]*\]|"[^"]*"/g, '')) && /m/i.test(code))) dateStyles.add(i);
                });
            } catch (e) {}
        }
        const sh = xml(sheetXml);
        const grid = [];
        Array.from(sh.getElementsByTagName('row')).forEach(row => {
            const cells = [];
            Array.from(row.getElementsByTagName('c')).forEach(c => {
                const ref = c.getAttribute('r') || '', ci = ref ? colIndex(ref) : cells.length, tp = c.getAttribute('t') || '';
                let v = '';
                if (tp === 'inlineStr') { v = Array.from(c.getElementsByTagName('t')).map(t => t.textContent).join(''); }
                else {
                    const vEl = c.getElementsByTagName('v')[0]; v = vEl ? vEl.textContent : '';
                    if (tp === 's') v = shared[+v] != null ? shared[+v] : '';
                    else if (tp === 'b') v = v === '1' ? 'ja' : 'nee';
                    else if (v !== '' && tp !== 'str' && tp !== 'e') {
                        const s = c.getAttribute('s');
                        if (s != null && dateStyles.has(+s)) v = excelSerialToDate(v);
                        else if (/^-?\d+\.\d+$/.test(v)) v = String(Math.round(parseFloat(v) * 1e10) / 1e10).replace('.', ',');   // NL-notatie
                    }
                }
                cells[ci] = v;
            });
            grid.push(cells);
        });
        const clean = grid.filter(r => r.some(v => v != null && String(v).trim() !== ''));
        if (!clean.length) return [];
        const head = clean[0].map(h => String(h == null ? '' : h).trim());
        const keys = head.map((h, j) => h || ('kolom' + (j + 1)));
        return clean.slice(1).map(r => { const o = {}; keys.forEach((k, j) => o[k] = r[j] != null ? String(r[j]) : ''); return o; });
    }

    // ---- Cookiemeldingen automatisch sluiten (bekende knoppen op tekst, id of class) ----
    function dismissCookies() {
        const RE = /^(accepteer|accepteren|accepteer alles|alles accepteren|alle cookies accepteren|alle cookies toestaan|ja, ik ga akkoord|ik ga akkoord|akkoord|prima|ok|oké|accept( all)?( cookies)?|allow all( cookies)?|i agree|agree|got it|alle akzeptieren|akzeptieren|zustimmen|tout accepter|accepter|j.accepte|aceptar( todo)?|aceptar todas)$/i;
        const KNOWN = '#onetrust-accept-btn-handler,#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll,#CybotCookiebotDialogBodyButtonAccept,.cc-btn.cc-allow,.cc-accept,#didomi-notice-agree-button,.fc-cta-consent,#accept-cookies,#acceptCookies,#cookie-accept,.js-accept-cookies,button[data-cookiebanner="accept_button"],#truste-consent-button,.cmp-accept,#cmpbntyestxt,button.sp_choice_type_11,#L2AGLb';
        const vis = el => { try { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (e) { return false; } };
        let btn = null;
        try { btn = Array.from(doc.querySelectorAll(KNOWN)).find(vis) || null; } catch (e) {}
        if (!btn) {
            const cands = Array.from(doc.querySelectorAll('button,a[role="button"],[role="button"],input[type="button"],input[type="submit"]'));
            btn = cands.find(b => {
                if (!vis(b)) return false;
                const label = (txt(b) || b.value || b.getAttribute('aria-label') || '').trim();
                if (!RE.test(label) && !/alle cookies|all cookies|cookies accepteren|accept cookies/i.test(label)) return false;
                const box = b.closest('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[id*="gdpr" i],[class*="gdpr" i],[aria-label*="cookie" i],[role="dialog"],[class*="banner" i],[id*="banner" i]');
                return !!box || /cookie|consent|gdpr/i.test(label);
            }) || null;
        }
        if (!btn) return false;
        try { btn.click(); } catch (e) { return false; }
        return true;
    }

    // ---- Slim wachten: tot de pagina klaar is en er even niets meer verandert (met maximum) ----
    async function waitForIdle(maxMs) {
        const t0 = Date.now(); let last = Date.now();
        const mo = new MutationObserver(() => { last = Date.now(); });
        try { mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true }); } catch (e) {}
        while (Date.now() - t0 < maxMs) {
            if (doc.readyState === 'complete' && Date.now() - last > 500 && Date.now() - t0 >= 300) break;
            await sleep(100);
        }
        try { mo.disconnect(); } catch (e) {}
        return Date.now() - t0;
    }
    // Code van 6 groepen voor de agent-koppeling (base32-achtig, zonder verwarrende tekens).
    function genToken() {
        const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(24); crypto.getRandomValues(b);
        let s = ''; for (let i = 0; i < 24; i++) { s += A[b[i] % 32]; if (i % 4 === 3 && i < 23) s += '-'; } return s;
    }
    function fmtDur(ms) { const m = Math.round(ms / 60000); if (ms < 45000) return 'minder dan een minuut'; if (m <= 1) return 'ongeveer een minuut'; return 'ongeveer ' + m + ' minuten'; }
    function fmtTime(ts) { try { const d = new Date(ts); return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); } catch (e) { return ''; } }

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
    host.style.cssText = 'position:fixed;inset:auto;top:16px;right:16px;left:auto;bottom:auto;margin:0;padding:0;border:0;background:transparent;z-index:2147483647;width:384px;max-width:calc(100vw - 24px);';
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
        applyI18n(root); renderSteps(); renderFlow(); renderAddMenuHints();
        if (!RUNNING) setStartLabel();
    });
    function renderAddMenuHints() { $all('[data-desc]').forEach(el => { el.textContent = t(el.dataset.desc); }); }
    let ADV = false;   // "Gevorderd" open? → extra velden (eigen patroon, vaste waarde) tonen
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function flash(btn, t) { const o = btn.textContent; btn.textContent = t; setTimeout(() => btn.textContent = o, 1200); }

    window.__WT_TOGGLE__ = () => { host.style.display = host.style.display === 'none' ? 'block' : 'none'; };
    $('#wt-close').onclick = () => cleanup(true);
    $('#wt-min').onclick = () => { $('.wt-body').classList.toggle('wt-hidden'); };

    // ---- generieke pick op de echte pagina ----
    let picking = false, pickHandler = null, onPickEnd = null;
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
    function endPick() { picking = false; pickHandler = null; ovlHide(); $('#wt-pickhint').style.display = 'none'; if (typeof onPickEnd === 'function') { const f = onPickEnd; onPickEnd = null; setTimeout(f, 0); } }
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

    // Inline vraag in het paneel (geen browser-popup): titel, uitleg, knoppen.
    function askInline(o) {
        const box = $('#wt-ask'); if (!box) return;
        box.style.display = 'block';
        box.innerHTML = '<div class="ask-title">' + esc(o.title || '') + '</div>' + (o.html ? '<div class="ask-body">' + o.html + '</div>' : '') +
            '<div class="wt-row ask-btns">' + (o.buttons || []).map((b, i) => '<button class="wt-btn' + (b.primary ? ' primary' : ' alt') + '" data-ask="' + i + '">' + esc(b.label) + '</button>').join('') + '</div>';
        box.querySelectorAll('[data-ask]').forEach(btn => btn.onclick = () => { const b = o.buttons[+btn.dataset.ask]; box.style.display = 'none'; box.innerHTML = ''; if (b && b.fn) b.fn(); });
        try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
    function askPromise(o) { return new Promise(res => askInline(Object.assign({}, o, { buttons: (o.buttons || []).map(b => Object.assign({}, b, { fn: () => { if (b.fn) b.fn(); res(b.value); } })) }))); }

    // + menu
    $('#flow-add').onclick = () => { const m = $('#flow-add-menu'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; };
    const FIELD_SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea';
    const BTN_SEL = 'button,a,[role="button"],.mud-button-root,input[type="submit"],input[type="button"]';
    function fieldKind(el) {
        if (el.tagName === 'SELECT' || isPopupSelect(el)) return 'keuzelijst';
        if (el.tagName === 'INPUT' && (el.type === 'date' || isMaskLike(el.placeholder || ''))) return 'datum';
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) return 'vinkje';
        return 'tekstveld';
    }
    // Invullen: de tool ziet zelf of het een formulier, tekstveld, datum of keuzelijst is.
    function addInputStep(el) {
        const isField = (el.matches && el.matches(FIELD_SEL)) || el.isContentEditable;
        if (!isField && el.querySelectorAll && el.querySelectorAll(FIELD_SEL).length >= 2) { addFormStep(el); return; }
        const f = resolveField(el);
        if (!f || !f.matches || !(f.matches(FIELD_SEL) || f.isContentEditable)) { log('  ⚠ Geen invoerveld herkend — klik precies op het veld, de keuzelijst of het formulier.', true); return; }
        const kind = fieldKind(f);
        const n = steps.filter(s => s.type === 'setval' || s.type === 'select').length + 1;
        const col = fieldColName(f, n);
        const type = kind === 'keuzelijst' ? 'select' : 'setval';
        addStep({ type, kind, name: (kind === 'keuzelijst' ? 'Keuzelijst: ' : kind === 'datum' ? 'Datum: ' : 'Veld: ') + col.slice(0, 22), selector: stableSel(f), fp: fingerprint(f), value: '{{' + col + '}}', detail: kind + ' · ' + col });
    }
    function addFormStep(cont) {
        const form = cont.tagName === 'FORM' ? cont : cont;
        const colmap = buildColumnMap(readFormFieldsIn(form));
        const st = { type: 'fill', name: 'Formulier invullen', selector: cssPath(form), colmap };
        updateFillDetail(st); addStep(st);
    }
    function addClickStep(el) {
        const btn = (el.closest && el.closest(BTN_SEL)) || el;
        addStep({ type: 'click', name: (txt(btn) || btn.value || btn.tagName.toLowerCase()).slice(0, 24) || 'knop', selector: stableSel(btn), fp: fingerprint(btn), detail: (txt(btn) || btn.value || 'knop').slice(0, 40) });
    }
    function addWaitStep() { addStep({ type: 'wait', mode: 'smart', ms: 8000, name: 'Wachten tot de pagina klaar is' }); }
    function addElementScrape(el, nm) {
        const attr = el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text');
        const preview = nm || (txt(el) ? txt(el).slice(0, 24) : (el.getAttribute && el.getAttribute('alt')) || el.tagName.toLowerCase()) || 'waarde';
        const n = steps.filter(s => s.type === 'scrape' && s.kind === 'element').length + 1;
        addStep({ type: 'scrape', kind: 'element', name: preview, col: nm ? cleanCol(nm) : 'kolom' + n, selector: cssPath(el), attr, detail: preview });
    }
    function addListScrape(det) { addStep({ type: 'scrape', kind: 'list', name: 'Lijst uitlezen', spec: det, detail: det.count + ' items × ' + det.columns.length + ' kolommen' }); }
    // Uitlezen: na de klik vragen "Alleen dit, of de hele lijst?" met een voorbeeld van wat meekomt.
    function addReadStep(el) {
        const det = autoDetectList(el);
        const single = readValue(el, el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text'));
        if (!det) { addElementScrape(el); log('  ⓘ Geen herhalende lijst gevonden — alleen dit element toegevoegd.'); return; }
        let ex = '';
        try { const rec = doc.querySelector(det.sig); if (rec) ex = det.columns.slice(0, 4).map(c => { const v = readField(rec, c); return v ? esc(c.name) + ': ' + esc(String(v).slice(0, 30)) : ''; }).filter(Boolean).join(' · '); } catch (e) {}
        askInline({
            title: t('ask_list'),
            html: '<div><b>' + t('only_this') + ':</b> “' + esc(String(single == null ? '' : single).slice(0, 60)) + '”</div>' +
                  '<div><b>' + t('whole_list') + ':</b> ' + det.count + ' items, ' + det.columns.length + ' kolommen' + (ex ? '<br><span class="hint">bv. ' + ex + '</span>' : '') + '</div>',
            buttons: [{ label: t('only_this'), fn: () => addElementScrape(el) }, { label: t('whole_list') + ' (' + det.count + ')', primary: true, fn: () => { addListScrape(det); maybeOfferScrollLoad(det); } }, { label: t('cancel') }]
        });
    }
    // Laadt de lijst verder bij scrollen? Even naar onderen scrollen en tellen; zo ja, dan
    // vragen of ParseLab eerst alles moet laden (voegt een scrol-stap vóór het uitlezen in).
    async function maybeOfferScrollLoad(det) {
        let before = 0, after = 0;
        const sx = window.scrollX, sy = window.scrollY;
        try {
            before = doc.querySelectorAll(det.sig).length;
            if (doc.body.scrollHeight <= window.innerHeight + 40) return;   // niets om te scrollen
            window.scrollTo(0, doc.body.scrollHeight);
            await sleep(900);
            after = doc.querySelectorAll(det.sig).length;
        } catch (e) { return; }
        finally { try { window.scrollTo(sx, sy); } catch (e) {} }
        if (after <= before) return;
        askInline({
            title: t('ask_scroll'),
            html: '<div>' + esc(t('ask_scroll_body').replace('{n}', String(after - before))) + '</div>',
            buttons: [{ label: t('yes'), primary: true, fn: () => {
                let idx = steps.findIndex(s => s.type === 'scrape' && s.kind === 'list' && s.spec === det); if (idx < 0) idx = steps.length;
                insertStep(idx, { type: 'scrollload', name: 'Alles laden door te scrollen', times: 10, pause: 1000, detail: 'scrolt naar onderen tot alles er staat' });
            } }, { label: t('no') }]
        });
    }
    function addByKind(kind) {
        if (kind === 'input') beginPick(addInputStep, 'Klik het veld, de keuzelijst of het formulier dat ingevuld moet worden');
        else if (kind === 'click') beginPick(addClickStep, 'Klik op de knop die ingedrukt moet worden');
        else if (kind === 'read') beginPick(addReadStep, 'Klik op de tekst, prijs of één item van een lijst');
        else if (kind === 'wait') addWaitStep();
        else if (kind === 'print') requestPrintPermission(ok => { if (ok) addStep({ type: 'print', name: 'Bewijskopie (PDF)', detail: 'hele pagina als PDF in je map' }); });
        else if (kind === 'shot') addStep({ type: 'shot', name: 'Bewijskopie (afbeelding)', detail: 'zichtbare pagina als afbeelding in je map' });
        else if (kind === 'type') beginPick(el => { el = resolveField(el); addStep({ type: 'type', name: 'Tekst typen', selector: stableSel(el), fp: fingerprint(el), text: '', enter: false, detail: fieldColName(el, 1) }); }, 'Klik het veld waar je tekst in wilt typen');
        else if (kind === 'key') addStep({ type: 'key', name: 'Toets indrukken', key: 'Enter', detail: 'stuurt één toets' });
        else if (kind === 'hover') beginPick(el => addStep({ type: 'hover', name: 'Muis erboven', selector: cssPath(el), detail: (txt(el) || el.tagName.toLowerCase()).slice(0, 30) }), 'Klik waar de muis boven moet blijven');
        else if (kind === 'scroll') beginPick(el => addStep({ type: 'scroll', name: 'Scrollen', selector: cssPath(el), mode: 'element', detail: (txt(el) || el.tagName.toLowerCase()).slice(0, 30) }), 'Klik waar naartoe gescrold moet worden (of kies daarna "naar onderen")');
        else if (kind === 'scrollload') addStep({ type: 'scrollload', name: 'Alles laden door te scrollen', times: 5, pause: 800, detail: 'scrolt naar onderen tot alles er staat' });
        else if (kind === 'images') addStep({ type: 'images', name: 'Download alle PDF’s', pattern: '\\.pdf(\\?|$)', detail: 'alle PDF-koppelingen op de pagina → je map' });
        else if (kind === 'webhook') addStep({ type: 'webhook', name: 'Regel doorsturen', url: '', detail: 'stuurt de regel naar een https-adres' });
    }
    $all('[data-add]').forEach(b => b.onclick = () => { $('#flow-add-menu').style.display = 'none'; addByKind(b.dataset.add); });
    $all('[data-quick]').forEach(b => b.onclick = () => addByKind(b.dataset.quick));
    renderAddMenuHints();
    // Optionele toestemming voor de PDF-bewijskopie: pas bij de eerste PDF-stap, met uitleg.
    function requestPrintPermission(cb) {
        if (!IS_EXT) { cb(true); return; }
        chrome.runtime.sendMessage({ type: 'wt-perm-has', perm: 'debugger' }, r => {
            if (r && r.granted) { cb(true); return; }
            askInline({
                title: 'Toestemming voor de PDF-bewijskopie',
                html: 'Om een pagina als PDF te bewaren gebruikt ParseLab de print-functie van Chrome. Chrome vraagt daarvoor één keer om extra toestemming (Chrome noemt dat “toegang tot de debugger”). ParseLab gebruikt dit alleen om de pagina naar PDF te printen, en alleen tijdens die stap.',
                buttons: [{ label: 'Toestemming geven', primary: true, fn: () => chrome.runtime.sendMessage({ type: 'wt-perm', perm: 'debugger' }, r2 => { if (r2 && r2.granted) cb(true); else { log('  ⚠ Geen toestemming gegeven — de PDF-bewijskopie is niet toegevoegd.' + (r2 && r2.err ? ' (' + r2.err + ')' : ''), true); cb(false); } }) }, { label: t('cancel'), fn: () => cb(false) }]
            });
        });
    }

    const BADGE = { scrape: 'UITLEZEN', fill: 'INVULLEN', click: 'KLIKKEN', wait: 'WACHTEN', print: 'PDF', shot: 'FOTO',
        setval: 'INVULLEN', select: 'INVULLEN', type: 'TYPEN', key: 'TOETS', hover: 'MUIS', scroll: 'SCROLL', scrollload: 'SCROLL+', waitfor: 'WACHTEN', cond: 'ALS', images: 'BESTANDEN', webhook: 'WEBHOOK' };
    function csvCols() { return flowRows.length ? Object.keys(flowRows[0]) : []; }
    function exampleFor(col) { if (!flowRows.length || !col) return ''; const r = flowRows[0]; const k = Object.keys(r).find(x => x.toLowerCase() === String(col).toLowerCase()); const v = k != null ? r[k] : ''; return v == null || String(v).trim() === '' ? '' : String(v).slice(0, 24); }
    const opt = (v, cur, lbl) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + (lbl || v) + '</option>';
    function stepParamsHTML(s, i) {
        const t_ = s.type, tr = s.transform || {};
        let h = '';
        if (t_ === 'scrape' && s.kind === 'element') {
            const isNum = tr.mode === 'number' || !!s.num;
            const cur = s.attr || 'text';
            h = '<div class="stparams">kolom <input class="pin" data-i="' + i + '" data-f="col" placeholder="kolomnaam" value="' + esc(s.col || s.name || '') + '" title="Naam van de kolom in je bestand">' +
                ' <span>' + esc(t('what_get')) + '</span> <select data-i="' + i + '" data-f="attr">' + opt('text', cur, t('a_text')) + opt('href', cur, t('a_link')) + opt('src', cur, t('a_img')) + (['text', 'href', 'src'].indexOf(cur) === -1 ? opt(cur, cur, cur) : '') + '</select>' +
                ' <label><input type="checkbox" data-i="' + i + '" data-f="num"' + (isNum ? ' checked' : '') + '> ' + esc(t('to_number')) + '</label>' +
                (ADV ? ' <span>' + esc(t('own_pattern')) + '</span> <input class="pin" data-i="' + i + '" data-f="tpattern" placeholder="bv. (\\d+)" value="' + esc(tr.pattern || '') + '">' : '') + '</div>';
        } else if (t_ === 'fill') {
            const cm = s.colmap || [], on = cm.filter(m => m.on !== false).length;
            h = '<div class="stparams stfill">' +
                '<span>velden <b>' + on + '/' + cm.length + '</b></span> ' +
                '<button class="mini" data-fall="' + i + '">alle</button> <button class="mini" data-fnone="' + i + '">geen</button>' +
                '<div class="fcols">' + cm.map((m, j) => { const ex = exampleFor(m.col); return '<label class="fcol" title="' + esc(m.label || m.key || '') + '"><input type="checkbox" data-i="' + i + '" data-fcol="' + j + '"' + (m.on !== false ? ' checked' : '') + '> ' + esc(m.col) + (ex ? ' <span class="fex">bv. ' + esc(ex) + '</span>' : '') + '</label>'; }).join('') + '</div>' +
                (flowRows.length ? '' : '<div class="hint" style="flex-basis:100%">Upload je lijst om bij elk veld een voorbeeldwaarde te zien.</div>') + '</div>';
        } else if (t_ === 'setval' || t_ === 'select') {
            const cols = csvCols();
            const tokenMatch = /^\{\{([^}]+)\}\}$/.exec(String(s.value || ''));
            let curCol = tokenMatch ? tokenMatch[1].trim() : '';
            // Kolomkop in de lijst kan anders geschreven zijn ("naam" vs "Naam"): hoofdletter-ongevoelig koppelen.
            const same = cols.find(c => c.toLowerCase() === curCol.toLowerCase()); if (same) curCol = same;
            const ex = exampleFor(curCol);
            const colField = cols.length
                ? '<select class="pin" data-i="' + i + '" data-f="setcolname"><option value="">— kies —</option>' + cols.map(c => opt(c, curCol, c)).join('') + (curCol && cols.indexOf(curCol) === -1 ? opt(curCol, curCol, curCol + ' (niet in je lijst)') : '') + '</select>'
                : '<input class="pin" data-i="' + i + '" data-f="setcolname" placeholder="bv. postcode" value="' + esc(curCol) + '" title="Upload je lijst om een kolom te kiezen">';
            h = '<div class="stparams"><span>' + esc(t('which_col')) + '</span> ' + colField + (ex ? ' <span class="fex">bv. ' + esc(ex) + '</span>' : '') +
                ' <label><input type="checkbox" data-i="' + i + '" data-f="skipEmpty"' + (s.skipEmpty !== false ? ' checked' : '') + '> ' + esc(t('empty_skip')) + '</label>' +
                (ADV ? ' <span>vaste waarde</span> <input class="pin s" data-i="' + i + '" data-f="value" placeholder="tekst" value="' + esc(tokenMatch ? '' : (s.value || '')) + '">' : '') + '</div>';
        } else if (t_ === 'type') h = '<div class="stparams">tekst <input class="pin" data-i="' + i + '" data-f="text" value="' + esc(s.text || '') + '"> <label><input type="checkbox" data-i="' + i + '" data-f="enter"' + (s.enter ? ' checked' : '') + '> daarna Enter</label></div>';
        else if (t_ === 'key') h = '<div class="stparams">toets <input class="pin s" data-i="' + i + '" data-f="key" value="' + esc(s.key || 'Enter') + '"></div>';
        else if (t_ === 'wait') {
            const mode = s.mode || (s.selector ? 'element' : 'fixed');
            h = '<div class="stparams"><select data-i="' + i + '" data-f="mode">' + opt('smart', mode, 'tot de pagina klaar is') + opt('fixed', mode, 'een vaste tijd') + opt('element', mode, 'tot iets op de pagina staat') + '</select>' +
                (mode === 'fixed' ? ' <input class="pin s" type="number" step="0.5" min="0" data-i="' + i + '" data-f="sec" value="' + (Math.round((s.ms || 1000) / 100) / 10) + '"> seconden'
                    : ' hoogstens <input class="pin s" type="number" step="1" min="1" data-i="' + i + '" data-f="sec" value="' + Math.round((s.ms || 8000) / 1000) + '"> seconden') +
                (mode === 'element' ? ' <button class="mini" data-waitpick="' + i + '">' + (s.selector ? '✎ ' + esc((s.wname || 'aangewezen').slice(0, 20)) : 'Wijs aan →') + '</button>' : '') + '</div>';
        }
        else if (t_ === 'waitfor') h = '<div class="stparams">hoogstens <input class="pin s" type="number" data-i="' + i + '" data-f="timeout" value="' + (s.timeout || 8000) + '"> ms</div>';
        else if (t_ === 'scroll') h = '<div class="stparams"><select data-i="' + i + '" data-f="mode">' + opt('element', s.mode, 'naar de aangewezen plek') + opt('bottom', s.mode, 'naar onderen') + '</select></div>';
        else if (t_ === 'scrollload') h = '<div class="stparams">×<input class="pin s" type="number" data-i="' + i + '" data-f="times" value="' + (s.times || 5) + '"> keer, pauze <input class="pin s" type="number" data-i="' + i + '" data-f="pause" value="' + (s.pause || 800) + '"> ms</div>';
        else if (t_ === 'images') h = ADV ? '<div class="stparams">' + esc(t('own_pattern')) + ' <input class="pin" data-i="' + i + '" data-f="pattern" value="' + esc(s.pattern || '') + '" title="Welke bestandsnamen meedoen"></div>' : '';
        else if (t_ === 'webhook') h = '<div class="stparams">adres (https) <input class="pin" data-i="' + i + '" data-f="url" placeholder="https://…" value="' + esc(s.url || '') + '">' + (s.url && !/^https:\/\//i.test(s.url) ? ' <span style="color:var(--bad)">alleen https-adressen</span>' : '') + '</div>';
        else if (t_ === 'cond') h = '<div class="stparams">als <select data-i="' + i + '" data-f="test">' + opt('exists', s.test, 'bestaat') + opt('contains', s.test, 'bevat') + '</select>' +
            (s.test === 'contains' ? ' <input class="pin s" data-i="' + i + '" data-f="ctext" placeholder="tekst" value="' + esc(s.ctext || '') + '">' : '') +
            ' anders <select data-i="' + i + '" data-f="ifFalse">' + opt('skip', s.ifFalse, 'sla over') + opt('stop', s.ifFalse, 'stop') + '</select>' +
            (s.ifFalse !== 'stop' ? ' <input class="pin s" type="number" data-i="' + i + '" data-f="skip" value="' + (s.skip || 1) + '"> stap' : '') + '</div>';
        // Voorwaarde als vinkje op elke stap: "Alleen als dit er is".
        if (t_ !== 'cond') h += '<div class="stparams stonly"><label><input type="checkbox" data-onlyif="' + i + '"' + (s.onlyIf ? ' checked' : '') + '> ' + esc(t('onlyif')) + '</label>' +
            (s.onlyIf ? ' <span class="fex">' + esc((s.onlyIf.name || 'aangewezen').slice(0, 24)) + '</span> <button class="mini" data-onlyifpick="' + i + '" title="Wijs opnieuw aan">✎</button>' : '') + '</div>';
        return h;
    }
    function bindParams(box) {
        box.querySelectorAll('.stparams [data-f]').forEach(inp => inp.addEventListener((inp.tagName === 'SELECT' || inp.type === 'checkbox') ? 'change' : 'input', () => {
            const s = steps[+inp.dataset.i], f = inp.dataset.f;
            const val = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' ? +inp.value : inp.value);
            if (f === 'num') { s.num = !!val; s.transform = s.transform || {}; if (!s.transform.pattern) s.transform.mode = val ? 'number' : 'none'; }
            else if (f === 'tpattern') { s.transform = s.transform || {}; s.transform.pattern = val; s.transform.mode = val ? 'regex' : (s.num ? 'number' : 'none'); }
            else if (f === 'setcolname') { s.value = String(val).trim() ? '{{' + String(val).trim() + '}}' : ''; if (inp.tagName === 'SELECT') renderSteps(); }
            else if (f === 'sec') { s.ms = Math.max(0, Math.round((+val || 0) * 1000)); }
            else if (f === 'mode' && s.type === 'wait') {
                s.mode = val; if (val === 'smart' && (!s.ms || s.ms < 2000)) s.ms = 8000; if (val === 'fixed' && s.ms > 60000) s.ms = 1000;
                s.name = val === 'smart' ? 'Wachten tot de pagina klaar is' : val === 'fixed' ? 'Even wachten' : 'Wachten tot iets er staat'; renderSteps();
            }
            else if (f === 'url') { s.url = val; s.detail = val; }
            else { s[f] = val; if (f === 'test' || f === 'ifFalse') renderSteps(); }
            renderFlow(); persist();
        }));
        box.querySelectorAll('.stparams [data-f="url"]').forEach(inp => inp.addEventListener('change', () => renderSteps()));
        // formulier: kies welke velden meedoen
        box.querySelectorAll('.stparams [data-fcol]').forEach(cb => cb.addEventListener('change', () => {
            const s = steps[+cb.dataset.i]; s.colmap[+cb.dataset.fcol].on = cb.checked; updateFillDetail(s);
            const wrap = cb.closest('.stfill'), bEl = wrap && wrap.querySelector('b'); if (bEl) bEl.textContent = enabledCols(s).length + '/' + (s.colmap || []).length;
            const det = wrap && wrap.closest('.stprow') && wrap.closest('.stprow').querySelector('.stdet'); if (det) { det.textContent = s.detail; det.title = s.detail; }
            renderFlow(); persist();
        }));
        box.querySelectorAll('.stparams [data-fall]').forEach(b => b.addEventListener('click', () => { const s = steps[+b.dataset.fall]; (s.colmap || []).forEach(m => m.on = true); updateFillDetail(s); renderSteps(); renderFlow(); persist(); }));
        box.querySelectorAll('.stparams [data-fnone]').forEach(b => b.addEventListener('click', () => { const s = steps[+b.dataset.fnone]; (s.colmap || []).forEach(m => m.on = false); updateFillDetail(s); renderSteps(); renderFlow(); persist(); }));
        box.querySelectorAll('[data-onlyif]').forEach(cb => cb.addEventListener('change', () => {
            const s = steps[+cb.dataset.onlyif];
            if (!cb.checked) { delete s.onlyIf; renderSteps(); renderFlow(); persist(); return; }
            pickOnlyIf(s);
        }));
        box.querySelectorAll('[data-onlyifpick]').forEach(b => b.onclick = () => pickOnlyIf(steps[+b.dataset.onlyifpick]));
        box.querySelectorAll('[data-waitpick]').forEach(b => b.onclick = () => {
            const s = steps[+b.dataset.waitpick];
            beginPick(el => { s.selector = cssPath(el); s.fp = fingerprint(el); s.wname = (txt(el) || el.tagName.toLowerCase()).slice(0, 24); s.mode = 'element'; renderSteps(); renderFlow(); persist(); }, 'Klik op wat er moet staan voordat we verdergaan');
        });
    }
    function pickOnlyIf(s) {
        onPickEnd = () => { if (!s.onlyIf) renderSteps(); };   // geannuleerd → vinkje weer uit
        beginPick(el => { s.onlyIf = { selector: cssPath(el), fp: fingerprint(el), name: (txt(el) || el.tagName.toLowerCase()).slice(0, 24) }; renderSteps(); renderFlow(); persist(); }, 'Klik op wat er moet zijn om deze stap uit te voeren');
    }
    function insertPause(idx) { insertStep(idx, { type: 'wait', ms: 1000 }); }
    function inserterHTML(idx) { return '<div class="stins"><button class="stins-btn" data-ins="' + idx + '" title="Pauze tussen deze stappen (bv. wachten tot de pagina geladen is)">+ pauze</button></div>'; }
    function renderSteps() {
        const box = $('#flow-steps'); box.innerHTML = '';
        if (!steps.length) { box.innerHTML = '<div class="hint" style="padding:6px 0">Nog geen stappen. Klik <b>+ Stap toevoegen</b> en kies wat je wilt.</div>'; return; }
        let html = inserterHTML(0);
        steps.forEach((s, i) => {
            if (s.type === 'wait' && !s.name) s.name = s.mode === 'smart' ? 'Wachten tot de pagina klaar is' : 'Even wachten';
            const nameField = '<input class="stname" value="' + esc(s.name || '') + '" data-i="' + i + '" title="Klik om te hernoemen">';
            html +=
                '<div class="stprow">' +
                '<span class="ststat" data-i="' + i + '"></span>' +
                '<span class="stnum">' + (i + 1) + '</span>' +
                '<span class="stbadge b-' + s.type + '">' + BADGE[s.type] + '</span>' +
                '<div class="stmid">' + nameField + (s.detail ? '<div class="stdet" title="' + esc((s.fp && s.fp.html) ? s.fp.html : s.detail) + '">' + esc(s.detail) + (s.fp && s.fp.html ? ' · html' : '') + '</div>' : '') + '</div>' +
                '<span class="strep" title="herhaal deze stap zoveel keer">×<input class="strepn" type="number" min="1" value="' + (s.rep || 1) + '" data-i="' + i + '"></span>' +
                (s.selector || s.fp ? '<button class="mini" data-show="' + i + '" title="Toon het gekoppelde element op de pagina">' + IC('target', 'ico-sm') + '</button>' : '') +
                (s.type === 'fill' ? '<button class="mini" data-tmpl="' + i + '" title="Invullijst (Excel) van dit formulier downloaden">' + IC('file-plus', 'ico-sm') + '</button>' : '') +
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
            const cols = enabledCols(s).map(m => m.col);
            if (!cols.length) { flash(b, 'geen velden'); return; }
            downloadBytes(toXlsx([], cols), 'invullijst.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            flash(b, '✔ ' + cols.length + ' kolommen');
        });
    }
    renderSteps();

    // Controleer of elke stap met een gekoppeld element dat element op deze pagina vindt.
    function checkLinks() {
        const linked = steps.map((s, i) => ({ s, i })).filter(x => (x.s.selector || x.s.fp) && x.s.type !== 'scrape');
        const bad = [];
        linked.forEach(({ s, i }) => {
            const el = targetEl(s);
            const stat = $('.ststat[data-i="' + i + '"]');
            if (el) { if (stat) { stat.textContent = '✓'; stat.className = 'ststat done'; } }
            else { bad.push({ s, i }); if (stat) { stat.textContent = '✗'; stat.className = 'ststat err'; } }
        });
        return { total: linked.length, bad };
    }
    function stepLabel(s) { return (s.name || s.type).replace(/^(Veld|Datum|Keuzelijst): /, ''); }
    // Opnieuw aanwijzen van het doel van een bestaande stap.
    function repickStep(s) {
        const hint = s.type === 'click' ? 'Klik op de knop die ingedrukt moet worden' : (s.type === 'fill' ? 'Klik op het formulier' : 'Klik op het veld dat bij “' + stepLabel(s) + '” hoort');
        beginPick(el => {
            if (s.type === 'click') { const btn = (el.closest && el.closest(BTN_SEL)) || el; s.selector = stableSel(btn); s.fp = fingerprint(btn); }
            else if (s.type === 'fill') { const form = el.closest('form') || el; s.selector = cssPath(form); s.colmap = buildColumnMap(readFormFieldsIn(form)); updateFillDetail(s); }
            else if (s.type === 'setval' || s.type === 'select' || s.type === 'type') { const f = resolveField(el); s.selector = stableSel(f); s.fp = fingerprint(f); }
            else { s.selector = cssPath(el); s.fp = fingerprint(el); }
            renderSteps(); renderFlow(); persist(); log('  ✔ “' + stepLabel(s) + '” opnieuw gekoppeld.');
        }, hint);
    }
    if ($('#flow-check')) $('#flow-check').onclick = function () {
        const r = checkLinks();
        if (!r.total) { flash(this, 'geen gekoppelde stappen'); return; }
        flash(this, r.bad.length ? '✗ ' + r.bad.length + ' niet gevonden' : '✔ alles gevonden');
        if (r.bad.length) showLinkProblems(r.bad, null);
        else log('✅ Alle ' + r.total + ' koppelingen gevonden op deze pagina.', true);
    };
    function showLinkProblems(bad, onContinue) {
        const html = bad.map((x, k) => '<div class="ask-line">Het veld “<b>' + esc(stepLabel(x.s)) + '</b>” staat niet meer op deze pagina. <button class="wt-btn alt mini-btn" data-repick="' + k + '">' + esc(t('repick')) + '</button></div>').join('');
        const buttons = onContinue ? [{ label: t('start_anyway'), fn: () => onContinue(true) }, { label: t('cancel'), primary: true, fn: () => onContinue(false) }] : [{ label: 'Sluiten' }];
        askInline({ title: bad.length === 1 ? 'Eén koppeling klopt niet meer' : bad.length + ' koppelingen kloppen niet meer', html, buttons });
        const box = $('#wt-ask');
        box.querySelectorAll('[data-repick]').forEach(b => b.onclick = () => { const x = bad[+b.dataset.repick]; box.style.display = 'none'; box.innerHTML = ''; if (onContinue) onContinue(false); repickStep(x.s); });
    }

    // Lijst (Excel/CSV)
    function setStartLabel() {
        const rb = $('#flow-run'); if (!rb || RUNNING) return;
        rb.innerHTML = IC('play') + ' <span>' + esc(t('start')) + (flowRows.length ? ' · ' + flowRows.length + ' ' + esc(t('rows')) : '') + '</span>';
    }
    function renderGroupOptions() {
        const sel = $('#flow-group'); if (!sel) return;
        const cur = sel.value || sel.dataset.pending || '';
        const cols = csvCols();
        sel.innerHTML = '<option value="">(niet sorteren)</option>' + cols.map(c => opt(c, cur, c)).join('') + (cur && cols.indexOf(cur) === -1 ? opt(cur, cur, cur) : '');
        sel.value = cur; delete sel.dataset.pending;
    }
    function showCsvInfo(extra) {
        const cols = csvCols();
        const dates = detectDateColumns(flowRows);
        $('#flow-csvinfo').innerHTML = flowRows.length
            ? '<b>' + flowRows.length + ' regels</b> · kolommen: ' + cols.map(esc).join(', ') + ' — de taak draait ' + flowRows.length + ' rondes (1 per regel).' +
              (dates.length ? '<br>' + dates.map(d => 'Ik herken “' + esc(d) + '” als datum ✓').join(' · ') : '') + (extra ? '<br>' + extra : '')
            : 'Geen lijst geladen — de taak draait één keer.' + (extra ? '<br>' + extra : '');
        setStartLabel(); renderGroupOptions();
    }
    async function loadListFile(f) {
        const isXlsx = /\.xlsx$/i.test(f.name) || /spreadsheetml/.test(f.type || '');
        try {
            if (isXlsx) flowRows = await parseXlsx(await f.arrayBuffer());
            else flowRows = parseCSV(await f.text());
            if (!flowRows.length) showCsvInfo('<span style="color:var(--bad)">Het bestand lijkt leeg: geen regels onder de kolomkoppen.</span>');
            else showCsvInfo();
        } catch (err) { flowRows = []; $('#flow-csvinfo').textContent = 'Kon de lijst niet lezen: ' + err.message; setStartLabel(); }
        renderSteps(); renderFlow(); persistNow(); saveRows();   // meteen bewaren → overleeft paginawissel
    }
    $('#flow-file').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) loadListFile(f); };
    // Lijst wissen zodat je een nieuwe kunt uploaden.
    if ($('#flow-clearcsv')) $('#flow-clearcsv').onclick = function () {
        flowRows = []; const fi = $('#flow-file'); if (fi) fi.value = '';
        showCsvInfo(); renderSteps(); renderFlow(); persistNow(); saveRows(); flash(this, '✔ gewist');
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
        if (!cols.length) { $('#flow-csvinfo').innerHTML = '<b style="color:var(--bad)">Nog geen invulvelden.</b> Voeg eerst een <i>Invullen</i>-stap toe en wijs een veld of formulier aan.'; return; }
        downloadBytes(toXlsx([], cols), 'mijn-invullijst.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $('#flow-csvinfo').innerHTML = 'Je invullijst staat in je map Downloads/' + esc(currentFolder) + ': <b>' + cols.length + ' kolom(men)</b> — ' + cols.map(esc).join(', ') + '. Vul hem in Excel in en klik daarna op <b>Lijst uploaden</b>.';
    };

    // ===================== Opdracht-chat: bouw de flow met gewone taal =====================
    function chatLog(m) { const el = $('#chat-log'); if (el.textContent === 'Typ een opdracht of “help”.') el.textContent = ''; el.textContent += m + '\n'; el.scrollTop = el.scrollHeight; }
    function afterWord(s, w) { const re = new RegExp(w + '\\s+(.+)$', 'i'); const m = s.match(re); if (!m) return ''; return m[1].replace(/^["'“”]|["'“”]$/g, '').trim(); }
    function quoted(s) { const m = s.match(/["'“”](.+?)["'“”]/); return m ? m[1] : ''; }
    function chatHelp() {
        chatLog('Voorbeelden:');
        ['lees de prijs  (klik dan de tekst)', 'lees lijst  (klik één item)', 'vul veld  (klik het veld)', 'vul formulier', 'typ "hallo"', 'klik Opslaan', 'wacht tot klaar', 'wacht 2s', 'bewijskopie', 'pdf', 'scroll naar onder', 'alles laden', 'download pdf’s', 'herhaal 5', 'map dossiers', 'sorteer op relatienummer', 'start'].forEach(x => chatLog('  • ' + x));
    }
    const addScrapeEl = addElementScrape;
    // vertaal één zin naar een actie (met of zonder aanwijzen op de pagina)
    function interpret(raw) {
        const s = raw.trim(); const l = s.toLowerCase();
        const numM = l.match(/(\d+(?:[.,]\d+)?)/); const num = numM ? numM[1] : null;
        // ---- controle & instellingen (geen doel aanwijzen) — eerst, om woord-clashes te voorkomen ----
        if (/\b(help|opdrachten|commando)\b/.test(l)) return { run: chatHelp, done: '' };
        if (/^(start|run|draai|ga|voer uit)\b/.test(l)) return { run: () => startFlow(), done: 'run gestart' };
        if (/\b(herhaal|repeat)\b/.test(l) && num) return { run: () => { $('#flow-repeat').value = Math.max(1, +num); persist(); renderFlow(); }, done: 'herhaal ' + num + '×' };
        if (/\b(submap|groepeer|group|sorteer)\b|map per|per kolom/.test(l)) { const col = afterWord(s, 'per') || afterWord(s, 'op') || afterWord(s, 'kolom'); return { run: () => { const g = $('#flow-group'); g.dataset.pending = col; renderGroupOptions(); persist(); }, done: 'sorteer bestanden op ' + (col || '?') }; }
        if (/^map\b|^folder\b|opslaan in/.test(l)) { const f = afterWord(s, 'map') || afterWord(s, 'folder') || afterWord(s, 'in'); return { run: () => { $('#flow-folder').value = f || 'ParseLab'; syncFolder(); persist(); }, done: 'map = ' + (f || 'ParseLab') }; }
        // ---- doel aanwijzen ----
        if (/vul.*formulier|formulier.*vul|fill form/.test(l)) return { pick: el => addFormStep(el.closest('form') || el), hint: 'Klik het formulier (vink daarna aan welke velden)', done: 'formulier toegevoegd — kies de velden in de stap' };
        if (/vul|invullen|fill/.test(l)) { const val = afterWord(s, 'met') || quoted(s); return { pick: el => { addInputStep(el); if (val) { const last = steps[steps.length - 1]; if (last && (last.type === 'setval' || last.type === 'select')) { last.value = val; renderSteps(); persist(); } } }, hint: 'Klik het veld, de keuzelijst of het formulier', done: 'invullen toegevoegd' }; }
        if (/^(typ|type|tik|voer in)\b/.test(l)) { const tx = quoted(s) || afterWord(s, 'typ') || afterWord(s, 'type') || afterWord(s, 'tik'); return { pick: el => addStep({ type: 'type', name: 'Typ tekst', selector: cssPath(el), text: tx, enter: /enter/.test(l), detail: cssPath(el) }), hint: 'Klik het invoerveld', done: 'typ toegevoegd' }; }
        if (/wacht (op|tot)|wait for/.test(l)) { if (/klaar|ready|pagina/.test(l)) return { run: addWaitStep, done: 'wachten toegevoegd' }; return { pick: el => addStep({ type: 'wait', mode: 'element', name: 'Wachten tot iets er staat', selector: cssPath(el), fp: fingerprint(el), wname: (txt(el) || el.tagName.toLowerCase()).slice(0, 24), ms: 8000 }), hint: 'Klik op wat er moet staan', done: 'wachten toegevoegd' }; }
        if (/(download|pak|haal)\b.*(bestand|afbeelding|image|files|foto|pdf)/.test(l)) return { run: () => addByKind('images'), done: 'download toegevoegd' };
        if (/\b(scrape|scrapen|lees|uitlezen)\b|\bpak\b|\bhaal\b/.test(l)) {
            if (/lijst|tabel|alle|rijen|regels/.test(l)) return { pick: el => { const d = autoDetectList(el); if (d) addListScrape(d); else addScrapeEl(el); }, hint: 'Klik één item van de lijst', done: 'lijst uitlezen toegevoegd' };
            const nm = quoted(s) || afterWord(s, 'de') || afterWord(s, 'het'); return { pick: el => addScrapeEl(el, nm), hint: 'Klik wat je wilt uitlezen', done: 'uitlezen toegevoegd' };
        }
        if (/(klik|druk|press|click)/.test(l)) return { pick: addClickStep, hint: 'Klik de knop', done: 'klikken toegevoegd' };
        if (/hover|zweef|muis/.test(l)) return { pick: el => addStep({ type: 'hover', name: 'Muis erboven', selector: cssPath(el), detail: (txt(el) || '').slice(0, 30) }), hint: 'Klik het element', done: 'muis erboven toegevoegd' };
        // ---- overige losse acties ----
        if (/(oneindig|scroll.*laad|load more|meer laden|alles laden)/.test(l)) return { run: () => addByKind('scrollload'), done: 'alles laden toegevoegd' };
        if (/scroll/.test(l)) return { run: () => addStep({ type: 'scroll', name: 'Scroll naar onderen', mode: 'bottom', detail: '' }), done: 'scrollen toegevoegd' };
        if (/webhook|https?:\/\//.test(l)) { const u = (s.match(/https?:\/\/\S+/) || [])[0] || ''; return { run: () => addStep({ type: 'webhook', name: 'Regel doorsturen', url: u, detail: u }), done: 'doorsturen toegevoegd' }; }
        if (/screenshot|foto|capture|schermafbeelding|afbeelding|bewijskopie/.test(l) && !/pdf/.test(l)) return { run: () => addByKind('shot'), done: 'bewijskopie (afbeelding) toegevoegd' };
        if (/print|pdf/.test(l)) return { run: () => addByKind('print'), done: 'bewijskopie (PDF) gevraagd' };
        if (/(wacht|pauze|wait|pause)/.test(l)) { if (!num) return { run: addWaitStep, done: 'wachten toegevoegd' }; let ms = /ms/.test(l) ? +num : Math.round(parseFloat(num.replace(',', '.')) * 1000); return { run: () => addStep({ type: 'wait', mode: 'fixed', name: 'Even wachten', ms }), done: 'wachten ' + (ms / 1000) + ' s' }; }
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
        runQueue(val.split(/\n|;| en (?=klik|scrape|lees|vul|typ|wacht|druk|screenshot|bewijskopie|print|pdf|scroll|download|herhaal)/i));
    }
    $('#chat-send').onclick = sendChat;
    $('#chat-in').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } });

    // ===================== run (herstartbaar, loopt door over paginawissels) =====================
    const RUN_KEY = 'wt-run';   // globaal → overleeft navigatie, ook naar een ander domein
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function log(m, reset) { const el = $('#flow-log'); if (reset) el.textContent = ''; el.textContent += m + '\n'; el.scrollTop = el.scrollHeight; }
    function setResult(d) { $('#flow-result').textContent = d == null ? 'Nog niets uitgelezen.' : JSON.stringify(d, null, 2); }
    function saveRun(st) { try { st.ts = Date.now(); } catch (e) {} return new Promise(res => { try { chrome.storage.local.set({ [RUN_KEY]: st }, () => res()); } catch (e) { try { localStorage.setItem(RUN_KEY, JSON.stringify(st)); } catch (_) {} res(); } }); }
    function loadRun() { return new Promise(res => { try { chrome.storage.local.get(RUN_KEY, r => res(r && r[RUN_KEY])); } catch (e) { try { res(JSON.parse(localStorage.getItem(RUN_KEY) || 'null')); } catch (_) { res(null); } } }); }
    function clearRun() { try { chrome.storage.local.remove(RUN_KEY); } catch (e) { try { localStorage.removeItem(RUN_KEY); } catch (_) {} } }

    async function performStep(s, row, extraCtx) {
        if (s.type === 'scrape') {
            if (s.kind === 'list') { const d = scrapeList(s.spec); log('  🔎 ' + s.name + ': ' + d.length + ' items'); return { key: s.col || s.name, val: d }; }
            const el = targetEl(s); let v = el ? readValue(el, s.attr) : null;
            v = applyTransform(v, s.transform);
            if (s.num && s.transform && s.transform.mode === 'regex') v = applyTransform(v, { mode: 'number' });
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
            const re = (() => { try { return new RegExp(s.pattern || '\\.pdf(\\?|$)', 'i'); } catch (e) { return /\.pdf(\?|$)/i; } })();
            const urls = new Set();
            doc.querySelectorAll('img[src]').forEach(im => { if (re.test(im.src)) urls.add(im.src); });
            doc.querySelectorAll('a[href]').forEach(a => { if (re.test(a.href)) urls.add(a.href); });
            const list = Array.from(urls).slice(0, 200);
            log('  ⬇ ' + s.name + ': ' + list.length + ' bestand(en) → map "' + currentFolder + '"');
            if (list.length) await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-dlfiles', urls: list, folder: currentFolder }, () => res()); } catch (e) { res(); } });
            return { key: s.name, val: list };
        } else if (s.type === 'webhook') {
            const url = (s.url || '').trim();
            if (!url) { log('  ⚠ ' + s.name + ': geen adres'); return { ok: false }; }
            if (!/^https:\/\//i.test(url)) { log('  ⚠ ' + s.name + ': alleen https-adressen zijn toegestaan'); return { ok: false }; }
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
        } else if (s.type === 'wait') {
            const mode = s.mode || (s.selector ? 'element' : 'fixed');
            if (mode === 'smart') { const took = await waitForIdle(Math.max(500, +s.ms || 8000)); log('  ⏱ pagina klaar na ' + (took / 1000).toFixed(1) + ' s'); }
            else if (mode === 'element') {
                const to = Math.max(500, +s.ms || 8000), t0 = Date.now();
                while (Date.now() - t0 < to) { if (targetEl(s)) { log('  ⏳ ' + (s.wname || s.name) + ': staat er na ' + (Date.now() - t0) + ' ms'); return { ok: true }; } await sleep(200); }
                log('  ⚠ ' + (s.wname || s.name) + ': niet verschenen binnen ' + Math.round(to / 1000) + ' s'); return { ok: false };
            }
            else { log('  ⏱ wacht ' + ((+s.ms || 0) / 1000) + ' s'); await sleep(+s.ms || 0); }
        }
        else if (s.type === 'print') {
            log('  🖨 ' + s.name + ' → PDF in map "' + currentFolder + '"');
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // paneel niet in de PDF
            await sleep(250);                                    // even wachten tot het weg is
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-print', name: s.name, folder: currentFolder }, resp => res(resp)); } catch (e) { res(null); } });
            if (hostEl) hostEl.classList.remove('wt-capturing');
            if (!r || !r.ok) log(r && r.err === 'no-permission' ? '     ⚠ Geen toestemming voor de PDF-bewijskopie. Verwijder de stap en voeg hem opnieuw toe om toestemming te geven.' : '     ⚠ PDF-bewijskopie niet gelukt (open eventueel handmatig met Ctrl+P)');
            await sleep(150);
        }
        else if (s.type === 'shot') {
            log('  📸 ' + s.name + ' → map "' + currentFolder + '"');
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // ons paneel niet in de foto
            await sleep(250);
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-shot', name: s.name, folder: currentFolder }, resp => res(resp)); } catch (e) { res(null); } });
            if (hostEl) hostEl.classList.remove('wt-capturing');
            if (!r || !r.ok) log('     ⚠ bewijskopie (afbeelding) niet gelukt');
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
        let eta = '';
        if (st.running && st.startedAt && done > 0 && done < total) { const per = (Date.now() - st.startedAt) / done; eta = ' · nog ' + fmtDur(per * (total - done)); }
        box.innerHTML = '<div class="prog-txt"><b>' + done + '/' + total + '</b> gedaan' +
            (st.running ? ' · bezig' + (rowsLen > 1 ? ' met regel ' + (st.cursor.ri + 1) + '/' + rowsLen : '') + (repeat > 1 ? ' · herhaling ' + (st.cursor.rp + 1) + '/' + repeat : '') + eta : ' ✓') +
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

    // Toestemming per site (extranet met klantgegevens): één keer vragen, onthouden per host.
    function getConsent(host) { return new Promise(res => { try { chrome.storage.local.get('pl-consent', r => res(!!(r && r['pl-consent'] && r['pl-consent'][host]))); } catch (e) { res(true); } }); }
    function setConsent(host) { try { chrome.storage.local.get('pl-consent', r => { const c = (r && r['pl-consent']) || {}; c[host] = Date.now(); chrome.storage.local.set({ 'pl-consent': c }); }); } catch (e) {} }
    function getSetting(key, def) { return new Promise(res => { try { chrome.storage.local.get(key, r => res(r && r[key] != null ? r[key] : def)); } catch (e) { res(def); } }); }
    function siteGrant() { return new Promise(res => { if (!IS_EXT) return res({ ok: true }); try { chrome.runtime.sendMessage({ type: 'wt-site-grant', origin: location.origin }, r => res(r || { ok: false })); } catch (e) { res({ ok: false }); } }); }
    function siteRelease() { try { if (IS_EXT) chrome.runtime.sendMessage({ type: 'wt-site-release', origin: location.origin }, () => {}); } catch (e) {} }
    function writeLog(entry) { try { if (IS_EXT) chrome.runtime.sendMessage({ type: 'wt-log', entry }, () => {}); } catch (e) {} }

    async function startFlow() {
        if (RUNNING) return;
        // Gepauzeerde ronde? → hervat waar we waren.
        const prev = await loadRun();
        if (prev && prev.paused) { prev.paused = false; pauseReq = false; await saveRun(prev); log('▶ Hervat…', true); steps = prev.steps || steps; renderSteps(); renderFlow(); runFromState(prev); return; }
        if (!steps.length) { log('⚠ Nog geen stappen — klik eerst op “+ Stap toevoegen”.', true); return; }
        // 1. Automatische koppelingscheck, in gewone taal.
        const chk = checkLinks();
        if (chk.bad.length) {
            const go = await new Promise(res => showLinkProblems(chk.bad, res));
            if (!go) return;
        }
        // 2. Toestemming van de organisatie, één keer per site.
        const host = location.hostname;
        if (steps.some(s => /^(fill|setval|select|type|click|key)$/.test(s.type)) && !(await getConsent(host))) {
            const ok = await askPromise({ title: 'Even checken', html: 'Je gaat automatisch invullen op <b>' + esc(host) + '</b>. Mag dat van je organisatie?', buttons: [{ label: t('yes'), primary: true, value: true }, { label: t('no'), value: false }] });
            if (!ok) { log('■ Niet gestart: geen toestemming voor ' + host + '.', true); return; }
            setConsent(host);
        }
        // 3. Webhook: bevestiging met de eerste regel als voorbeeld.
        const wh = steps.find(s => s.type === 'webhook' && (s.url || '').trim());
        if (wh) {
            if (!/^https:\/\//i.test(wh.url.trim())) { log('⚠ De stap “' + wh.name + '” heeft geen https-adres. Alleen https is toegestaan.', true); return; }
            const sample = flowRows.length ? flowRows[0] : {};
            const ok = await askPromise({ title: 'Regels doorsturen?', html: 'Elke regel wordt gestuurd naar <b>' + esc(wh.url.trim()) + '</b>.<br>Voorbeeld (eerste regel):<pre class="wt-pre" style="max-height:90px">' + esc(JSON.stringify(sample, null, 1).slice(0, 400)) + '</pre>', buttons: [{ label: 'Ja, versturen', primary: true, value: true }, { label: t('cancel'), value: false }] });
            if (!ok) return;
        }
        // 4. Toegang tot deze site zodat de ronde doorloopt na een paginawissel.
        const g = await siteGrant();
        if (!g.ok) log('  ⓘ Geen doorlopende toegang tot deze site: de ronde stopt bij een paginawissel.' + (g.err ? ' (' + g.err + ')' : ''), true);
        // 5. Cookiemelding wegklikken.
        if (await getSetting('pl-cookies', true)) { if (dismissCookies()) { log('  🍪 Cookiemelding gesloten.', !g.ok ? false : true); await sleep(300); } }
        const rows = flowRows.length ? flowRows.slice() : [null];
        const st = {
            steps: JSON.parse(JSON.stringify(steps)), rows,
            delay: Math.max(0, +$('#flow-delay').value || 0),
            repeat: Math.max(1, +$('#flow-repeat').value || 1),
            folder: sanitizeFolder($('#flow-folder').value) || 'ParseLab',
            groupCol: ($('#flow-group').value || '').trim(),
            cursor: { rp: 0, ri: 0, si: 0 }, out: {}, results: [], running: true, startedAt: Date.now(), errRows: {}, host
        };
        log('▶ Start — ' + st.steps.length + ' stap(pen), ' + rows.length + ' ' + (flowRows.length ? 'regels' : 'keer') + (st.repeat > 1 ? ' × ' + st.repeat : '') + '.', !(g.ok === false));
        if (!flowRows.length && st.steps.some(s => s.type === 'fill' || ((s.type === 'setval' || s.type === 'select') && /\{\{/.test(s.value || '')))) log('  ⓘ Geen lijst geladen: invulstappen hebben niets om in te vullen. Upload eerst je lijst.');
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
        const baseFolder = sanitizeFolder(st.folder) || 'ParseLab';
        st.errRows = st.errRows || {};
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
            // "Alleen als dit er is": stap overslaan als het aangewezen element ontbreekt.
            if (step.onlyIf && !targetEl(step.onlyIf)) { log('  ↷ ' + (step.name || step.type) + ': overgeslagen (“' + (step.onlyIf.name || '…') + '” is er niet)'); renderRunStatus(st.cursor); continue; }
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
                if (!ok) { st.errRows[rp * rows.length + ri] = true; if (onErr === 'stop') { log('  ■ Gestopt door fout in “' + (step.name || step.type) + '”.'); ctrl = { stop: true }; } else log('     ⏭ overgeslagen na fout'); break; }
            }
            if (ctrl && ctrl.stop) { st.running = false; await saveRun(st); break; }
            if (ctrl && ctrl.skip) { st.cursor = { rp, ri, si: si + 1 + ctrl.skip }; await saveRun(st); }
            renderRunStatus(st.cursor);
        }

        // Gepauzeerd: run bewaren (niet wissen) zodat Start hem hervat.
        if (pauseReq && st.running && !stopReq) {
            st.paused = true; await saveRun(st);
            RUNNING = false; pauseReq = false;
            runBtn.disabled = false; runBtn.innerHTML = IC('play') + ' <span>' + esc(t('resume')) + '</span>';
            if ($('#flow-pause')) $('#flow-pause').disabled = true; $('#flow-stop').disabled = false;
            log('⏸ Gepauzeerd — klik ▶ ' + t('resume') + ' om verder te gaan.');
            return;
        }
        st.running = false; await saveRun(st);
        RUNNING = false; runBtn.disabled = false; setStartLabel(); $('#flow-stop').disabled = true; if ($('#flow-pause')) $('#flow-pause').disabled = true;
        results = st.results;
        setResult(st.results.length === 1 ? st.results[0] : st.results);
        const doneN = Math.min(total, st.cursor.rp * rows.length + st.cursor.ri + (st.cursor.si >= st.steps.length ? 1 : 0));
        const errN = Object.keys(st.errRows || {}).length;
        const hasRows = st.rows.length && st.rows[0] !== null;
        const unit = hasRows ? (doneN === 1 ? 'regel' : 'regels') : (doneN === 1 ? 'ronde' : 'rondes');
        if (stopReq) { renderProgress(null); log('■ Gestopt — ' + doneN + ' ' + unit + ' gedaan, ' + errN + ' om na te kijken.'); }
        else {
            const box = $('#flow-progress');
            box.style.display = 'block';
            box.innerHTML = '<div class="prog-txt"><b>' + total + ' ' + unit + ' gedaan</b>, ' + errN + ' om na te kijken' + (errN ? ' — zie hieronder welke regels' : ' ✓') + '</div><div class="prog-bar"><span style="width:100%"></span></div>';
            $all('.ststat').forEach(el => { el.textContent = '✓'; el.className = 'ststat done'; });
            log('✓ ' + total + ' ' + unit + ' gedaan, ' + errN + ' om na te kijken.' + (errN ? ' Regels: ' + Object.keys(st.errRows).map(k => +k + 1).join(', ') + '.' : '') + (results.length ? ' Klik “' + t('dl_result') + '” voor je Excel-bestand.' : ''));
        }
        writeLog({ host: st.host || location.hostname, start: st.startedAt || Date.now(), einde: Date.now(), regels: doneN, fouten: errN, bron: 'paneel' });
        currentFolder = sanitizeFolder($('#flow-folder').value) || 'ParseLab';   // bestanden weer naar de basismap
        clearRun();
    }

    // ---- bestanden ----
    // Map in Downloads waarin alles terechtkomt (instelling, standaard "ParseLab").
    function syncFolder() { currentFolder = sanitizeFolder($('#flow-folder').value) || 'ParseLab'; }
    syncFolder();
    $('#flow-folder').addEventListener('input', () => { syncFolder(); try { chrome.storage.local.set({ 'pl-folder': currentFolder }); } catch (e) {} persist(); });
    $('#flow-group').addEventListener('change', persist);
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    $('#flow-json').onclick = () => results.length && download(results.length === 1 ? results[0] : results, 'parselab-uitkomst.json');
    $('#flow-csv').onclick = () => results.length && download(toCSV(flattenForCsv(results)), 'parselab-uitkomst.csv');
    $('#flow-copy').onclick = function () { if (!results.length) return; copy(results.length === 1 ? results[0] : results); flash(this, '✔'); };
    // Primaire knoppen: Lijst uploaden en Download bestand (Excel).
    $('#flow-upload').onclick = () => $('#flow-file').click();
    $('#flow-download').onclick = function () { if (!results.length) { flash(this, 'nog niets uitgelezen'); return; } downloadBytes(toXlsx(flattenForCsv(results)), 'parselab-uitkomst.xlsx', XLSX_MIME); flash(this, '✔ Excel'); };
    function flattenForCsv(res) {
        if (!res.length) return res;
        // interne velden weglaten, maar de doorloop-teller als leesbare kolom bewaren
        const clean = res.map(o => { const c = {}; if (o._pass != null) c['regel'] = o._pass; Object.keys(o).forEach(k => { if (k !== '_pass' && k !== '_rij') c[k] = o[k]; }); return c; });
        // Precies één lijst → alle lijstregels (over alle herhalingen) onder elkaar,
        // met eventuele losse kolommen (bv. een regel-teller) ernaast.
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
        return clean;   // meerdere uitgelezen velden → één kolom per veld
    }
    // Andere formaten + webhook (onder Gevorderd)
    $('#flow-xlsx').onclick = () => { if (!results.length) return; downloadBytes(toXlsx(flattenForCsv(results)), 'parselab-uitkomst.xlsx', XLSX_MIME); };
    $('#flow-zip').onclick = function () {
        if (!results.length) return;
        const rows = flattenForCsv(results);
        const files = [
            { name: 'resultaten.json', bytes: strBytes(JSON.stringify(results.length === 1 ? results[0] : results, null, 2)) },
            { name: 'resultaten.csv', bytes: strBytes(toCSV(rows)) },
            { name: 'resultaten.xlsx', bytes: toXlsx(rows) }
        ];
        downloadBytes(zipStore(files), 'parselab-bestanden.zip', 'application/zip'); flash(this, '✔');
    };
    $('#flow-webhook-send').onclick = async function () {
        const btn = this;
        const url = $('#flow-webhook').value.trim(); if (!url || !results.length) { flash(btn, url ? 'nog niets uitgelezen' : 'geen adres'); return; }
        if (!/^https:\/\//i.test(url)) { flash(btn, 'alleen https'); log('  ⚠ Alleen https-adressen zijn toegestaan.'); return; }
        const rows = flattenForCsv(results);
        const ok = await askPromise({ title: 'Versturen?', html: rows.length + ' regel(s) gaan naar <b>' + esc(url) + '</b>.<br>Voorbeeld (eerste regel):<pre class="wt-pre" style="max-height:90px">' + esc(JSON.stringify(rows[0] || {}, null, 1).slice(0, 400)) + '</pre>', buttons: [{ label: 'Ja, versturen', primary: true, value: true }, { label: t('cancel'), value: false }] });
        if (!ok) return;
        try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results.length === 1 ? results[0] : results) }); flash(btn, r.ok ? '✔ verstuurd' : 'http ' + r.status); }
        catch (e) { flash(btn, 'fout'); log('  ⚠ doorsturen: ' + e.message); }
    };
    $('#flow-webhook').addEventListener('input', persist);

    // ---- Taken (per site, met naam). Alleen de stappen, nooit de lijst. ----
    const PRESET_KEY = 'wt-presets-' + location.hostname;
    function loadPresets(cb) { try { chrome.storage.local.get(PRESET_KEY, r => cb((r && r[PRESET_KEY]) || {})); } catch (e) { try { cb(JSON.parse(localStorage.getItem(PRESET_KEY) || '{}')); } catch (_) { cb({}); } } }
    function savePresets(obj) { try { chrome.storage.local.set({ [PRESET_KEY]: obj }); } catch (e) { try { localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); } catch (_) {} } }
    function renderPresets() { loadPresets(o => { const names = Object.keys(o); $('#flow-preset-list').innerHTML = names.length ? names.map(n => '<option>' + esc(n) + '</option>').join('') : '<option value="">(geen)</option>'; }); }
    $('#flow-preset-save').onclick = function () { const nm = ($('#flow-preset-name').value || '').trim(); if (!nm) { flash(this, 'geef een naam'); return; } loadPresets(o => { o[nm] = serialise(); savePresets(o); renderPresets(); flash(this, '✔ bewaard'); siteGrant(); }); };
    $('#flow-preset-load').onclick = function () { const nm = $('#flow-preset-list').value; if (!nm) return; loadPresets(o => { if (o[nm]) { applyState(o[nm]); flash(this, '✔ geladen'); } }); };
    $('#flow-preset-del').onclick = function () { const nm = $('#flow-preset-list').value; if (!nm) return; loadPresets(o => { delete o[nm]; savePresets(o); renderPresets(); flash(this, '✔'); }); };
    renderPresets();

    // Taakbestand (import/export, onder Gevorderd) — alleen stappen en instellingen.
    $('#flow-export').onclick = () => download(serialise(), 'parselab-taak.json');
    $('#flow-import').onchange = e => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { try { applyState(JSON.parse(rd.result)); log('↥ Taak geïmporteerd.', true); } catch (err) { log('⚠ Ongeldig taakbestand: ' + err.message, true); } };
        rd.readAsText(f);
    };

    // ---- Instellingen: thema, kant, taal, cookiemeldingen, map ----
    function applyTheme(dark) { root.querySelector('.wt-card').classList.toggle('wt-dark', !!dark); }
    function applySide(left) { host.style.left = left ? '16px' : 'auto'; host.style.right = left ? 'auto' : '16px'; }
    (function initPrefs() {
        try {
            chrome.storage.local.get(['wt-dark', 'wt-side', 'pl-cookies', 'pl-folder'], r => {
                applyTheme(r && r['wt-dark']); applySide(r && r['wt-side'] === 'left');
                if ($('#flow-cookies')) $('#flow-cookies').checked = !(r && r['pl-cookies'] === false);
                if (r && r['pl-folder'] && $('#flow-folder') && !$('#flow-folder').dataset.set) { $('#flow-folder').value = r['pl-folder']; syncFolder(); }
            });
        } catch (e) {}
    })();
    $('#flow-theme').onclick = () => { const c = root.querySelector('.wt-card'); const dark = !c.classList.contains('wt-dark'); applyTheme(dark); try { chrome.storage.local.set({ 'wt-dark': dark }); } catch (e) {} };
    $('#flow-side').onclick = () => { const left = host.style.left !== '16px'; applySide(left); try { chrome.storage.local.set({ 'wt-side': left ? 'left' : 'right' }); } catch (e) {} };
    if ($('#flow-cookies')) $('#flow-cookies').onchange = function () { try { chrome.storage.local.set({ 'pl-cookies': this.checked }); } catch (e) {} };
    // "Gevorderd" open → extra velden bij stappen tonen; logboek verversen.
    if ($('#wt-adv')) $('#wt-adv').addEventListener('toggle', function () { ADV = this.open; renderSteps(); if (ADV) renderLogbook(); });
    function renderLogbook() {
        const box = $('#pl-logbox'); if (!box) return;
        try {
            chrome.storage.local.get('pl-log', r => {
                const list = Array.isArray(r && r['pl-log']) ? r['pl-log'].slice(0, 10) : [];
                box.innerHTML = list.length ? list.map(e => '<div class="logrow"><b>' + esc(e.host || '?') + '</b> · ' + esc(fmtTime(e.start)) + (e.einde ? '–' + esc(fmtTime(e.einde).slice(-5)) : '') + ' · ' + (e.regels || 0) + ' regels, ' + (e.fouten || 0) + ' om na te kijken' + (e.bron === 'agent' ? ' · <i>agent</i>' : '') + '</div>').join('') : '<span class="hint">Nog geen rondes gedaan.</span>';
            });
        } catch (e) { box.innerHTML = '<span class="hint">Alleen beschikbaar in de extensie.</span>'; }
    }

    // ---- Voor IT-beheer: koppeling voor een agent (gedeeld geheim, alleen terwijl het paneel open is) ----
    const MCP_STATUS_TXT = { off: 'uit', connecting: 'wacht op een agent…', connected: 'Verbonden met een agent', rejected: 'geweigerd: de code klopt niet' };
    function setMcpState(on, status) {
        const s = $('#flow-mcp-state'); if (s) { s.textContent = on ? (MCP_STATUS_TXT[status] || 'aan') : 'uit'; s.style.color = on && status === 'connected' ? 'var(--good)' : (on ? 'var(--accent)' : 'var(--muted)'); }
        const c = $('#flow-mcp-code'); if (c) c.style.display = on ? 'block' : 'none';
        const st = $('#mcp-stop'); if (st) st.style.display = on ? '' : 'none';
    }
    function refreshMcp() {
        try { chrome.storage.local.get(['wt-mcp', 'wt-mcp-token', 'wt-mcp-status'], r => { const on = !!(r && r['wt-mcp']); setMcpState(on, r && r['wt-mcp-status']); const code = $('#mcp-code'); if (code) code.textContent = (r && r['wt-mcp-token']) || '—'; }); } catch (e) {}
    }
    if ($('#flow-mcp')) {
        refreshMcp();
        $('#flow-mcp').onclick = function () {
            const btn = this;
            try {
                chrome.storage.local.get(['wt-mcp', 'wt-mcp-token'], r => {
                    const on = !(r && r['wt-mcp']);
                    const upd = { 'wt-mcp': on };
                    if (on && !(r && r['wt-mcp-token'])) upd['wt-mcp-token'] = genToken();
                    if (!on) upd['wt-mcp-status'] = 'off';
                    chrome.storage.local.set(upd, refreshMcp); flash(btn, on ? 'aan' : 'uit');
                });
            } catch (e) { flash(btn, 'alleen in de extensie'); }
        };
        $('#mcp-stop').onclick = () => { try { chrome.storage.local.set({ 'wt-mcp': false, 'wt-mcp-status': 'off' }, refreshMcp); } catch (e) {} };
        $('#mcp-copy').onclick = function () { const code = $('#mcp-code').textContent; if (code && code !== '—') { copy(code); flash(this, '✔ gekopieerd'); } };
        $('#mcp-new').onclick = function () { try { chrome.storage.local.set({ 'wt-mcp-token': genToken() }, refreshMcp); flash(this, '✔ nieuwe code'); } catch (e) {} };
        try { chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && (ch['wt-mcp-status'] || ch['wt-mcp'] || ch['wt-mcp-token'])) refreshMcp(); }); } catch (e) {}
    }

    // ---- opslaan / laden (per site) ----
    // De taak (stappen + instellingen) wordt automatisch bewaard; de lijst apart, nooit ín de taak.
    const SAVE_KEY = 'wt-flow-' + location.hostname;
    const AUTO_KEY = 'wt-flow-auto-' + location.hostname;
    const ROWS_KEY = 'pl-csv-' + location.hostname;
    function serialise() {
        return JSON.parse(JSON.stringify({
            steps, delay: +$('#flow-delay').value || 600,
            repeat: +$('#flow-repeat').value || 1,
            folder: $('#flow-folder') ? $('#flow-folder').value : 'ParseLab',
            group: $('#flow-group') ? $('#flow-group').value : '',
            webhook: $('#flow-webhook') ? $('#flow-webhook').value : '',
            onerror: $('#flow-onerror') ? $('#flow-onerror').value : 'skip',
            retries: $('#flow-retries') ? +$('#flow-retries').value || 0 : 0
        }));
    }
    function applyState(d) {
        if (!d) return false;
        steps = d.steps || []; stepSeq = steps.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
        $('#flow-delay').value = d.delay || 600;
        if (d.webhook != null && $('#flow-webhook')) $('#flow-webhook').value = d.webhook;
        if (d.group != null && $('#flow-group')) { $('#flow-group').dataset.pending = d.group; renderGroupOptions(); }
        if (d.folder && $('#flow-folder')) { $('#flow-folder').value = d.folder; $('#flow-folder').dataset.set = '1'; syncFolder(); }
        if ($('#flow-repeat')) $('#flow-repeat').value = d.repeat || 1;
        if (d.onerror && $('#flow-onerror')) $('#flow-onerror').value = d.onerror;
        if (d.retries != null && $('#flow-retries')) $('#flow-retries').value = d.retries;
        renderSteps(); renderFlow();
        return true;
    }
    function saveRows() { try { if (flowRows.length) chrome.storage.local.set({ [ROWS_KEY]: flowRows }); else chrome.storage.local.remove(ROWS_KEY); } catch (e) { try { flowRows.length ? localStorage.setItem(ROWS_KEY, JSON.stringify(flowRows)) : localStorage.removeItem(ROWS_KEY); } catch (_) {} } }
    function loadRows() { return new Promise(res => { try { chrome.storage.local.get(ROWS_KEY, r => res((r && r[ROWS_KEY]) || [])); } catch (e) { try { res(JSON.parse(localStorage.getItem(ROWS_KEY) || '[]')); } catch (_) { res([]); } } }); }
    // Auto-bewaren (kort uitgesteld) bij elke wijziging.
    let saveTimer = null;
    function saveAuto() {
        const data = serialise();
        try { chrome.storage.local.set({ [AUTO_KEY]: data }); }
        catch (e) { try { localStorage.setItem(AUTO_KEY, JSON.stringify(data)); } catch (_) {} }
    }
    function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(saveAuto, 350); }
    function persistNow() { clearTimeout(saveTimer); saveAuto(); }
    // Herstel bij openen — én hervat een lopende ronde automatisch na een paginawissel.
    (async function restore() {
        const run = await loadRun();
        // Een blijven-hangen ronde (tab gesloten/gecrasht) NIET automatisch midden hervatten —
        // alleen een verse ronde (recent bijgewerkt) of een bewust gepauzeerde.
        const fresh = run && run.ts && (Date.now() - run.ts < 180000);
        if (run && run.running && !fresh && !run.paused) { clearRun(); }
        else if (run && run.running) {
            steps = run.steps || []; stepSeq = steps.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
            flowRows = (run.rows && run.rows.length && run.rows[0] !== null) ? run.rows : [];
            if ($('#flow-repeat')) $('#flow-repeat').value = run.repeat || 1;
            $('#flow-delay').value = run.delay || 600;
            renderSteps(); renderFlow(); showCsvInfo();
            renderProgress(run);
            if (run.paused) {
                const rb = $('#flow-run'); rb.innerHTML = IC('play') + ' <span>' + esc(t('resume')) + '</span>'; $('#flow-stop').disabled = false;
                log('⏸ Gepauzeerde ronde — klik ▶ ' + t('resume') + ' om verder te gaan.', true);
            } else {
                log('↩ Ronde gaat automatisch verder na de paginawissel…', true);
                if (await getSetting('pl-cookies', true)) { if (dismissCookies()) await sleep(300); }
                runFromState(run);
            }
            return;
        }
        flowRows = await loadRows();
        const done = d => { if (applyState(d)) log('↩ Vorige taak hersteld (' + (d.steps || []).length + ' stappen).', true); showCsvInfo(); };
        try { chrome.storage.local.get(AUTO_KEY, r => done(r && r[AUTO_KEY])); }
        catch (e) { try { done(JSON.parse(localStorage.getItem(AUTO_KEY) || 'null')); } catch (_) { showCsvInfo(); } }
    })();

    $('#flow-save').onclick = function () {
        const data = serialise(); const btn = this;
        try { chrome.storage.local.set({ [SAVE_KEY]: data }, () => flash(btn, '✔ Bewaard')); }
        catch (e) { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); flash(btn, '✔ Bewaard'); }
        log('💾 Taak bewaard voor ' + location.hostname + ' — alleen de stappen; je lijst blijft op deze computer en zit niet in de taak.', true);
        siteGrant().then(g => { if (g && g.ok) log('  ✔ ParseLab mag op deze site terugkomen na een paginawissel.'); });
    };
    $('#flow-load').onclick = function () {
        const apply = d => { if (!applyState(d)) { flash(this, 'niets bewaard'); return; } flash(this, '✔ Geladen'); };
        try { chrome.storage.local.get(SAVE_KEY, r => apply(r[SAVE_KEY])); }
        catch (e) { apply(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); }
    };
    if ($('#flow-delflow')) $('#flow-delflow').onclick = function () {
        steps = []; flowRows = []; renderSteps(); renderFlow(); showCsvInfo();
        try { chrome.storage.local.remove([SAVE_KEY, AUTO_KEY, ROWS_KEY, PRESET_KEY]); } catch (e) {}
        try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(AUTO_KEY); localStorage.removeItem(ROWS_KEY); } catch (e) {}
        renderPresets(); siteRelease(); flash(this, '✔ gewist'); log('🗑 Taak en lijst voor deze site gewist; ParseLab komt hier niet meer vanzelf terug.', true);
    };
    $('#flow-delay').addEventListener('input', persist);
    $('#flow-repeat').addEventListener('input', () => { persist(); renderFlow(); });
    if ($('#flow-onerror')) $('#flow-onerror').addEventListener('change', persist);
    if ($('#flow-retries')) $('#flow-retries').addEventListener('input', persist);

    // stroomschema
    function renderFlow() {
        const box = $('#wt-flow');
        if (!steps.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
        box.style.display = '';
        const rows = flowRows.length > 1;
        const repeat = Math.max(1, +($('#flow-repeat') ? $('#flow-repeat').value : 1) || 1);
        const boxes = [];
        boxes.push({ k: 'start', t: 'Start' + (flowRows.length ? ' · ' + flowRows.length + ' regels' : '') });
        if (repeat > 1) boxes.push({ k: 'loop', t: 'Herhaal ' + repeat + '×' });
        if (rows) boxes.push({ k: 'loop', t: 'Voor elke regel' });
        steps.forEach(s => {
            const base = s.name || s.type;
            boxes.push({ k: s.type, t: base + ((s.rep || 1) > 1 ? '  (' + s.rep + '×)' : '') + (s.onlyIf ? ' · alleen als…' : '') });
        });
        if (rows) boxes.push({ k: 'next', t: 'Volgende regel' });
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

    // Sluiten (✕): paneel weg, koppeling uit, en de sitetoegang weer vrijgeven.
    function cleanup(byUser) {
        try { topObs.disconnect(); } catch (e) {} clearInterval(topIv); clearTimeout(topT);
        endPick(); overlay.remove(); host.remove();
        window.__WT_PANEL__ = false; window.__WT_TOGGLE__ = null; window.__wtHost = null; window.__wtCleanup = null;
        window.__WT_BOOTED__ = false;
        if (byUser) window.__wtClosedByUser = true;   // geen hoekknop tonen na een bewuste ✕
        try { chrome.storage.local.set({ 'wt-active': false, 'wt-mcp-status': 'off' }); } catch (e) {}
        if (byUser) siteRelease();
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
  /* ParseLab: snelknoppen, stappenmenu, inline vragen, instellingen */
  .wt-quick .wt-btn { flex:1; justify-content:center; font-size:13px; padding:7px 8px; min-height:38px; }
  .addmenu { flex-direction:column; align-items:stretch; gap:6px; }
  .addmenu .main4 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .addmenu .main4 .wt-btn { justify-content:flex-start; font-size:14px; min-height:44px; flex-direction:column; align-items:flex-start; gap:2px; padding:8px 11px; }
  .addmenu .main4 .wt-btn small, .addmenu .morelist small { display:block; font:400 11px system-ui; color:var(--muted); white-space:normal; text-align:left; line-height:1.35; }
  .addmenu details > summary { cursor:pointer; font:600 13px system-ui; color:var(--ink-2); padding:6px 2px; list-style:none; }
  .addmenu details > summary::-webkit-details-marker { display:none; }
  .addmenu details > summary::before { content:'▸ '; color:var(--muted); } .addmenu details[open] > summary::before { content:'▾ '; }
  .addmenu .morelist { display:flex; flex-direction:column; gap:4px; }
  .addmenu .morelist .wt-btn { justify-content:flex-start; flex-direction:column; align-items:flex-start; gap:1px; min-height:0; padding:6px 10px; font-size:13px; }
  .wt-ask { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); border:1px solid color-mix(in srgb, var(--accent) 30%, var(--surface)); border-radius:var(--radius-ctl); padding:10px 12px; font-size:13px; color:var(--ink); }
  .wt-ask .ask-title { font:600 14px system-ui; margin-bottom:6px; }
  .wt-ask .ask-body { line-height:1.5; } .wt-ask .ask-body > div { margin:4px 0; }
  .wt-ask .ask-btns { margin-top:8px; } .wt-ask .ask-line { margin:4px 0; }
  .wt-ask .mini-btn { padding:3px 8px; min-height:28px; font-size:12px; }
  .fex { color:var(--muted); font-style:italic; font-size:11px; }
  .stonly { border-top:1px dashed var(--grid); }
  .wt-set label.row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-2); }
  .wt-set .wt-row { margin:6px 0; }
  .logrow { font-size:12px; color:var(--ink-2); padding:3px 0; border-bottom:1px solid var(--grid); }
  .mcp-code { font:600 15px ui-monospace,Menlo,monospace; letter-spacing:.06em; color:var(--ink); background:var(--surface); border:1px dashed var(--baseline); border-radius:8px; padding:6px 10px; display:inline-block; user-select:all; }
  h5 { margin:12px 0 4px; font:600 12.5px system-ui; color:var(--ink-2); }
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
  <div class="wt-head"><span class="brand">P</span><b>ParseLab</b><span class="sp"></span>
    <button class="wt-ico" id="wt-min" title="Inklappen">` + IC('min') + `</button>
    <button class="wt-ico" id="wt-close" title="Sluiten">` + IC('x') + `</button>
  </div>
  <div class="wt-body">
    <div class="hint" data-i18n="intro">Wijs aan wat er moet gebeuren.</div>
    <div class="wt-row wt-quick">
      <button class="wt-btn" data-quick="input">` + IC('edit', 'ico-sm') + ` <span data-i18n="q_input">Iets invullen</span></button>
      <button class="wt-btn" data-quick="click">` + IC('cursor', 'ico-sm') + ` <span data-i18n="q_click">Ergens op klikken</span></button>
      <button class="wt-btn" data-quick="wait">` + IC('clock', 'ico-sm') + ` <span data-i18n="q_wait">Even wachten</span></button>
    </div>
    <div class="fc" id="wt-flow"></div>
    <h4 data-i18n="h_steps">Stappen</h4>
    <div id="flow-steps"></div>
    <div class="wt-ask" id="wt-ask" style="display:none"></div>
    <div class="addmenu" id="flow-add-menu" style="display:none">
      <div class="main4">
        <button class="wt-btn alt" data-add="input"><span>` + IC('edit', 'ico-sm') + ` <span data-i18n="m_input">Invullen</span></span><small data-desc="d_input"></small></button>
        <button class="wt-btn alt" data-add="click"><span>` + IC('cursor', 'ico-sm') + ` <span data-i18n="m_click">Klikken</span></span><small data-desc="d_click"></small></button>
        <button class="wt-btn alt" data-add="read"><span>` + IC('search', 'ico-sm') + ` <span data-i18n="m_read">Uitlezen</span></span><small data-desc="d_read"></small></button>
        <button class="wt-btn alt" data-add="wait"><span>` + IC('clock', 'ico-sm') + ` <span data-i18n="m_wait">Wachten</span></span><small data-desc="d_wait"></small></button>
      </div>
      <details id="wt-more-steps"><summary data-i18n="more_steps">Meer</summary>
        <div class="morelist">
          <button class="wt-btn alt" data-add="shot"><span>` + IC('camera', 'ico-sm') + ` <span data-i18n="m_shot">Bewaar een bewijskopie van deze pagina (afbeelding)</span></span><small data-desc="d_shot"></small></button>
          <button class="wt-btn alt" data-add="print"><span>` + IC('printer', 'ico-sm') + ` <span data-i18n="m_print">Bewaar een bewijskopie van deze pagina (PDF)</span></span><small data-desc="d_print"></small></button>
          <button class="wt-btn alt" data-add="images"><span>` + IC('download', 'ico-sm') + ` <span data-i18n="m_images">Download alle PDF’s op deze pagina</span></span><small data-desc="d_images"></small></button>
          <button class="wt-btn alt" data-add="type"><span>` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_type">Tekst typen</span></span><small data-desc="d_type"></small></button>
          <button class="wt-btn alt" data-add="key"><span>` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_key">Toets indrukken</span></span><small data-desc="d_key"></small></button>
          <button class="wt-btn alt" data-add="hover"><span>` + IC('mouse', 'ico-sm') + ` <span data-i18n="m_hover">Muis erboven houden</span></span><small data-desc="d_hover"></small></button>
          <button class="wt-btn alt" data-add="scroll"><span>` + IC('move', 'ico-sm') + ` <span data-i18n="m_scroll">Scrollen</span></span><small data-desc="d_scroll"></small></button>
          <button class="wt-btn alt" data-add="scrollload"><span>` + IC('move', 'ico-sm') + ` <span data-i18n="m_scrollload">Alles laden door te scrollen</span></span><small data-desc="d_scrollload"></small></button>
        </div>
      </details>
    </div>
    <div class="wt-row"><button class="wt-btn primary" id="flow-add">` + IC('plus') + ` <span data-i18n="add_step">Stap toevoegen</span></button>
      <button class="wt-btn alt" id="flow-check" title="Controleer of alle aangewezen velden en knoppen nog op deze pagina staan">` + IC('link', 'ico-sm') + ` <span data-i18n="check_links">Controleer koppelingen</span></button></div>
    <h4 data-i18n="h_run">Uitvoeren</h4>
    <div class="wt-row wt-primary">
      <button class="wt-btn run" id="flow-run">` + IC('play') + ` <span data-i18n="start">Start</span></button>
      <button class="wt-btn alt" id="flow-pause" disabled>` + IC('pause') + ` <span data-i18n="pause">Pauze</span></button>
      <button class="wt-btn alt" id="flow-stop" disabled>` + IC('stop') + ` <span data-i18n="stop">Stop</span></button>
    </div>
    <div class="wt-row wt-primary">
      <button class="wt-btn" id="flow-upload" title="Excel (.xlsx) of CSV">` + IC('upload') + ` <span data-i18n="upload_data">Lijst uploaden</span></button>
      <button class="wt-btn" id="flow-download" title="Wat je hebt uitgelezen, als Excel-bestand">` + IC('download') + ` <span data-i18n="dl_result">Download bestand</span></button>
      <button class="wt-btn" id="flow-save" title="Bewaart alleen de stappen voor deze site, niet je lijst">` + IC('save') + ` <span data-i18n="save_flow">Bewaar taak</span></button>
    </div>
    <div class="wt-row">
      <button class="wt-btn alt" id="flow-tmpl" title="Maakt een Excel-bestand met een kolom per invulveld; vul het in en upload het">` + IC('file-plus', 'ico-sm') + ` <span data-i18n="tmpl_xlsx">Maak mijn invullijst (Excel)</span></button>
      <input type="file" id="flow-file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none">
      <button class="wt-btn alt" id="flow-clearcsv" title="Wis de geladen lijst zodat je een nieuwe kunt uploaden">` + IC('x', 'ico-sm') + ` <span data-i18n="clear_csv">Lijst wissen</span></button>
    </div>
    <div class="hint" id="flow-csvinfo">Geen lijst geladen — de taak draait één keer.</div>
    <div class="wt-prog" id="flow-progress" style="display:none"></div>
    <div class="wt-pre" id="flow-log">Nog niet gestart.</div>
    <div class="wt-pre" id="flow-result">Nog niets uitgelezen.</div>

    <details class="wt-more wt-set" id="wt-settings">
      <summary>` + IC('gear', 'ico-sm') + ` <span data-i18n="settings">Instellingen</span></summary>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-theme">` + IC('moon', 'ico-sm') + ` <span data-i18n="theme">Donker / licht</span></button>
        <button class="wt-btn alt" id="flow-side">` + IC('swap', 'ico-sm') + ` <span data-i18n="side">Links / rechts</span></button>
      </div>
      <div class="wt-row"><span class="hint" data-i18n="lang">Taal</span>
        <select id="wt-lang" class="wt-num" style="width:auto;padding:4px 6px" title="Taal / Language">` +
        Object.keys(LANGS).map(l => '<option value="' + l + '"' + (l === LANG ? ' selected' : '') + '>' + LANGS[l] + '</option>').join('') + `</select></div>
      <div class="wt-row"><label class="row"><input type="checkbox" id="flow-cookies" checked> <span data-i18n="cookies">Cookiemeldingen automatisch sluiten</span></label></div>
      <div class="wt-row"><span class="hint" data-i18n="dl_folder">Map in Downloads</span><input id="flow-folder" class="wt-num" style="width:130px" value="ParseLab"></div>
      <div class="hint">Bewijskopieën, gedownloade bestanden en je Excel-bestanden komen in deze map.</div>
    </details>

    <details class="wt-more wt-set" id="wt-adv">
      <summary>` + IC('gear', 'ico-sm') + ` <span data-i18n="advanced">Gevorderd</span></summary>
      <div class="wt-row">
        <span class="hint" data-i18n="repeat">Herhaal de taak</span><input type="number" id="flow-repeat" value="1" min="1" class="wt-num">×
        <span class="hint" data-i18n="delay">Pauze tussen regels</span><input type="number" id="flow-delay" value="600" class="wt-num"> ms
      </div>
      <div class="wt-row">
        <span class="hint" data-i18n="onerror">Als een regel niet lukt:</span>
        <select id="flow-onerror" class="wt-num" style="width:auto;max-width:100%"><option value="skip" data-i18n="err_skip">sla over en ga door (aanbevolen)</option><option value="stop" data-i18n="err_stop">stop</option></select>
      </div>
      <div class="wt-row"><span class="hint" data-i18n="retries">Opnieuw proberen</span><input type="number" id="flow-retries" class="wt-num" style="width:56px" value="1" min="0">× per stap</div>
      <div class="hint">Elke stap heeft ook een <b>×</b>-veld om alléén die stap te herhalen (bv. 5× op “Volgende” drukken).</div>
      <div class="wt-row"><span class="hint" data-i18n="dl_group">Sorteer bestanden in mappen op:</span><select id="flow-group" class="wt-num" style="width:auto;max-width:100%"><option value="">(niet sorteren)</option></select></div>
      <div class="hint">Per unieke waarde in die kolom (bv. per relatienummer) komt er een eigen submap.</div>
      <h5 data-i18n="other_formats">Andere formaten</h5>
      <div class="wt-row">
        <button class="wt-btn" id="flow-xlsx">Excel</button>
        <button class="wt-btn" id="flow-csv">CSV</button>
        <button class="wt-btn" id="flow-json">JSON</button>
        <button class="wt-btn" id="flow-zip">ZIP</button>
        <button class="wt-btn alt" id="flow-copy" data-i18n="copy">Kopieer</button>
      </div>
      <div class="hint">De CSV werkt direct in Excel (Nederlandse instellingen).</div>
      <h5>Doorsturen (webhook)</h5>
      <div class="wt-row"><input id="flow-webhook" class="wt-num" style="width:170px" placeholder="https://…"><button class="wt-btn alt" id="flow-webhook-send"><span data-i18n="webhook_send">Verstuur</span></button>
        <button class="wt-btn alt" data-add="webhook" title="Voegt een stap toe die elke regel doorstuurt">+ <span data-i18n="m_webhook">Regel doorsturen (webhook)</span></button></div>
      <div class="hint" data-desc="d_webhook"></div>
      <h5>Taken op deze site</h5>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-load" data-i18n="load_flow">Laad taak</button>
        <input id="flow-preset-name" class="wt-num" style="width:100px" placeholder="naam">
        <button class="wt-btn alt" id="flow-preset-save">` + IC('save', 'ico-sm') + ` <span data-i18n="preset_saveas">Bewaar als</span></button>
        <select id="flow-preset-list" class="wt-num" style="width:100px"></select>
        <button class="wt-btn alt" id="flow-preset-load" data-i18n="load">Laad</button>
        <button class="wt-btn alt mini danger" id="flow-preset-del" title="Verwijder deze taak">` + IC('trash', 'ico-sm') + `</button>
      </div>
      <div class="wt-row">
        <button class="wt-btn alt" id="flow-export">` + IC('download', 'ico-sm') + ` <span data-i18n="exp_flow">Taakbestand</span></button>
        <label class="wt-btn alt" style="cursor:pointer">` + IC('upload', 'ico-sm') + ` <span data-i18n="importf">Importeer</span><input type="file" id="flow-import" accept=".json" style="display:none"></label>
        <button class="wt-btn alt danger" id="flow-delflow">` + IC('trash', 'ico-sm') + ` <span data-i18n="del_flow">Taak van deze site wissen</span></button>
      </div>
      <div class="hint">Een taak bevat alleen de stappen. Je lijst en de ingevulde waarden blijven op deze computer.</div>
      <details class="wt-chat">
        <summary>` + IC('chat', 'ico-sm') + ` <span data-i18n="chat">Bouw met opdrachten (typen)</span></summary>
        <div class="hint" data-i18n="chat_hint">Typ wat je wilt.</div>
        <div class="wt-row"><input id="chat-in" style="flex:1;min-width:120px;border:1px solid var(--baseline);border-radius:var(--radius-ctl);padding:8px 10px;font:inherit;font-size:13px;min-height:40px;background:var(--surface);outline:0" placeholder="opdracht… (Enter)"><button class="wt-btn primary" id="chat-send" title="Uitvoeren">` + IC('send') + `</button></div>
        <div class="wt-pre" id="chat-log" style="max-height:110px">Typ een opdracht of “help”.</div>
        <div class="hint">In een cel van je lijst mag ook <code>{{Prijs*1.21}}</code> staan om te rekenen met een andere kolom.</div>
      </details>
      <h5 data-i18n="logbook">Logboek</h5>
      <div id="pl-logbox"><span class="hint">…</span></div>
      <h5 data-i18n="it_admin">Voor IT-beheer</h5>
      <div class="hint" data-i18n="mcp_hint">Alleen voor IT-beheer.</div>
      <div class="wt-row"><button class="wt-btn alt" id="flow-mcp">` + IC('link', 'ico-sm') + ` <span data-i18n="mcp_toggle">Koppeling voor een agent</span></button> <b id="flow-mcp-state" style="color:var(--muted)">uit</b> <button class="wt-btn alt" id="mcp-stop" style="display:none">` + IC('stop', 'ico-sm') + ` Stop</button></div>
      <div id="flow-mcp-code" style="display:none">
        <div class="hint">Code voor de agent-server (zet in <code>PARSELAB_MCP_TOKEN</code>):</div>
        <div class="wt-row"><span class="mcp-code" id="mcp-code">—</span><button class="wt-btn alt" id="mcp-copy" data-i18n="copy">Kopieer</button><button class="wt-btn alt" id="mcp-new">Nieuwe code</button></div>
      </div>
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
    try { window.__wtApi = { readFields: apiReadFields, fill: apiFill, toXlsx, parseXlsx, parseCSV, toISODate, detectDateColumns }; } catch (e) {}

    // ============================================================ boot
    // Het paneel "aan"-zetten wordt in chrome.storage bewaard, zodat het paneel op
    // ELKE nieuwe pagina automatisch weer verschijnt (en je flow terugkomt) —
    // zolang je het niet met ✕ sluit.
    function removePanel() { if (window.__wtCleanup) window.__wtCleanup(); }
    function getActive(cb) { try { chrome.storage.local.get('wt-active', r => cb(!!(r && r['wt-active']))); } catch (e) { cb(false); } }

    const IS_EXT = (() => { try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; } })();

    // Kleine hoekknop "ParseLab" op een site met een bewaarde taak terwijl het paneel dicht is
    // (dit script draait daar mee omdat de gebruiker die site toegang gaf). Eén klik opent het paneel.
    function removeBadge() { const b = doc.getElementById('wt-badge'); if (b) b.remove(); }
    function showBadge() {
        if (doc.getElementById('wt-badge') || window.__WT_PANEL__ || window.__wtClosedByUser) return;
        const b = doc.createElement('button');
        b.id = 'wt-badge'; b.type = 'button'; b.title = t('open_panel');
        b.textContent = 'ParseLab';
        b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;margin:0;border:0;border-radius:999px;padding:8px 14px;background:#1F3A5F;color:#fff;font:600 13px system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 6px 18px -8px rgba(0,0,0,.5);cursor:pointer;';
        b.onclick = () => { removeBadge(); try { chrome.storage.local.set({ 'wt-active': true }); } catch (e) { buildPanel(); } };
        (doc.body || doc.documentElement).appendChild(b);
    }
    function maybeBadge() {
        try {
            const key = 'wt-flow-' + location.hostname;
            chrome.storage.local.get(key, r => { if (r && r[key]) showBadge(); });
        } catch (e) {}
    }

    if (!window.__WT_BOOTED__) {
        window.__WT_BOOTED__ = true;
        if (!IS_EXT) {
            buildPanel();   // los bestand / test: meteen tonen
        } else {
            getActive(a => { if (a) buildPanel(); else maybeBadge(); });
            try {
                chrome.runtime.onMessage.addListener((m, sender, send) => {
                if (!m) return;
                if (m.type === 'wt-set') { if (m.active) { removeBadge(); buildPanel(); } else removePanel(); return; }
                if (m.type === 'wt-api-readfields') { try { send({ ok: true, fields: apiReadFields(m.scope) }); } catch (e) { send({ ok: false, error: String(e && e.message || e) }); } return true; }
                if (m.type === 'wt-api-fill') { apiFill(m.payload).then(r => send({ ok: true, result: r })).catch(e => send({ ok: false, error: String(e && e.message || e) })); return true; }
            });
                chrome.storage.onChanged.addListener((ch, area) => {
                    if (area === 'local' && ch['wt-active']) { if (ch['wt-active'].newValue) { removeBadge(); buildPanel(); } else { removePanel(); maybeBadge(); } }
                });
            } catch (e) {}
        }
    }
})();
