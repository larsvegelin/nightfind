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
    try { LANG = localStorage.getItem('wt-lang') || 'nl'; } catch (e) {}
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
        scan_fields: { nl: 'Velden ophalen', en: 'Find fields', de: 'Felder holen', fr: 'Repérer les champs', es: 'Buscar campos' },
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
        d_print: { nl: 'De hele pagina als PDF in je map, zoals Ctrl+P → Opslaan als PDF.', en: 'The whole page as PDF in your folder. Asks for extra permission once.', de: 'Die ganze Seite als PDF in deinem Ordner. Fragt einmal um zusätzliche Erlaubnis.', fr: 'Toute la page en PDF dans votre dossier. Demande une autorisation supplémentaire une fois.', es: 'Toda la página como PDF en tu carpeta. Pide un permiso adicional una vez.' },
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
        if (attr === 'auto') return (el.matches && el.matches('input,select,textarea')) ? el.value : txt(el);
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
    // Nummers vergelijken zoals een mens: Excel haalt voorloopnullen weg (0865358741 → 865358741),
    // dus "865358741" en "0865358741" zijn hetzelfde nummer. Spaties/punten/streepjes in een nummer tellen niet.
    function nulVrij(x) { const t = String(x == null ? '' : x).trim().replace(/[\s.\-]/g, ''); return /^\d+$/.test(t) ? t.replace(/^0+(?=\d)/, '') : null; }
    function zelfdeWaarde(a, b) {
        const x = String(a == null ? '' : a).trim().toLowerCase(), y = String(b == null ? '' : b).trim().toLowerCase();
        if (x === y) return true;
        const nx = nulVrij(x), ny = nulVrij(y); return nx != null && ny != null && nx === ny;
    }
    function bevatWaarde(hooi, naald) {
        const h = String(hooi == null ? '' : hooi).toLowerCase(), n = String(naald == null ? '' : naald).trim().toLowerCase();
        // letterlijk: staat de waarde ergens in de tekst? Dan klopt het.
        if (!n || h.includes(n)) return true;
        // een nummer uit Excel zonder voorloopnul (865358741) vindt ook 0865358741, en andersom
        const n0 = nulVrij(n); if (n0 == null) return false;
        if (h.includes(n0)) return true;
        // het nummer met eventueel voorloopnullen, niet midden in een langer nummer
        if (new RegExp('(^|\\D)0*' + n0 + '(\\D|$)').test(h)) return true;
        return new RegExp('(^|\\D)0*' + n0 + '(\\D|$)').test(h.replace(/(\d)[\s.\-](?=\d)/g, '$1'));
    }
    function setNativeValue(el, value) {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
            : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const d = Object.getOwnPropertyDescriptor(proto, 'value');
        if (d && d.set) d.set.call(el, value); else el.value = value;
    }
    // composed:true voor 'input' (zoals bij echt typen): anders blijft het event in de shadow root
    // van een webcomponent (asr/lit) hangen en hoort de app de nieuwe waarde nooit.
    function fire(el, names) { names.forEach(n => el.dispatchEvent(n === 'input' ? new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }) : new Event(n, { bubbles: true }))); }
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
        // Een bewerkbaar zoekveld met suggesties (bv. asr zoekveld: type=search, role=combobox,
        // aria-autocomplete=list) is een TEKSTVELD: je typt er een waarde in.
        const bewerkbaar = !(el.readOnly || el.hasAttribute('readonly'));
        const aa = String(el.getAttribute('aria-autocomplete') || '').toLowerCase();
        if (bewerkbaar && !/mud-select-input/.test(cls) && (el.type === 'search' || el.getAttribute('inputmode') === 'search' || aa === 'list' || aa === 'both' || aa === 'inline')) return false;
        return /mud-select-input/.test(cls)
            || el.getAttribute('role') === 'combobox'
            || /listbox|menu|dialog/.test(el.getAttribute('aria-haspopup') || '')
            || ((el.readOnly || el.hasAttribute('readonly')) && /select|dropdown|combobox/i.test(cls));
    }
    // Zoekveld met suggesties (typeahead): de lijst komt PAS nadat je hebt getypt.
    // Zo'n veld alleen aanklikken levert niets op — daarom typen we eerst de waarde
    // en kiezen we daarna de suggestie. Een readonly combobox is géén typeahead.
    function isTypeahead(el) {
        if (!el || el.tagName !== 'INPUT') return false;
        if (el.readOnly || el.hasAttribute('readonly') || el.disabled) return false;
        const aa = String(el.getAttribute('aria-autocomplete') || '').toLowerCase();
        if (aa === 'list' || aa === 'both' || aa === 'inline') return true;
        if (el.getAttribute('role') === 'combobox') return true;
        return el.type === 'search' || String(el.getAttribute('inputmode') || '') === 'search';
    }
    // Waar staan de suggesties? Eerst het element waar aria-controls/aria-owns naar wijst,
    // anders de hele pagina (ook in webcomponenten).
    function suggestieBak(el) {
        const ids = String((el.getAttribute('aria-controls') || '') + ' ' + (el.getAttribute('aria-owns') || '')).trim();
        for (const id of ids.split(/\s+/).filter(Boolean)) {
            try {
                const r = (el.getRootNode && el.getRootNode()) || doc;
                const n = ((r && r.getElementById) ? r : doc).getElementById(id);
                if (n) return n;
            } catch (e) {}
        }
        return null;
    }
    const OPTIE_SEL = '[role="option"], .mud-list-item, .mud-select-item, li[role="menuitem"], [data-testid="option"], [class*="option"]';
    function zichtbareOpties(el) {
        const bak = suggestieBak(el);
        const lijst = bak ? diepAlles(bak, OPTIE_SEL) : diepAlles(doc, OPTIE_SEL);
        return lijst.filter(o => !vanOnsZelf(o) && o.getClientRects().length);
    }
    // Welke suggestie past bij de waarde? exact → hoofdletterongevoelig → bevat.
    // Niets gevonden maar er is precies één suggestie? Dan die, want een zoekveld met
    // één treffer bedoelt die treffer (bv. een klantnummer dat de naam oplevert).
    function besteOptie(opts, s) {
        const sl = s.toLowerCase();
        const otxt = o => (o.textContent || '').replace(/\s+/g, ' ').trim();
        return opts.find(o => otxt(o) === s)
            || opts.find(o => zelfdeWaarde(otxt(o), s))
            || opts.find(o => otxt(o).toLowerCase().includes(sl))
            || (opts.length === 1 ? opts[0] : null);
    }
    // Knop-achtig: echte knoppen/links, ARIA-knoppen en design-system-knoppen (<asr-button>, mud-button…).
    const KNOP_SEL = 'button,a[href],a[role="button"],[role="button"],[role="link"],[role="menuitem"],[role="tab"],.mud-button-root,input[type="submit"],input[type="button"],input[type="image"],summary,[onclick]';
    function isKnopTag(el) { return !!(el && el.tagName && /(^|-)(button|btn|link|knop)(-|$)/i.test(el.tagName)); }
    // Zoek de knop rond een element, óók over de shadow-DOM-grens heen: closest() stopt
    // bij de rand van een webcomponent, dus daarna gaan we verder bij de host.
    function knopRond(el) {
        let n = el;
        for (let i = 0; i < 8 && n; i++) {
            let k = n.closest ? n.closest(KNOP_SEL) : null;
            // Knop binnen een webcomponent (bv. <asr-button> met een <button> in de shadow root):
            // de webcomponent zelf is de knop die we onthouden; die staat gewoon in de pagina.
            if (k) { const r = k.getRootNode && k.getRootNode(); const h = r && r.host; if (h && /-/.test(h.tagName) && diepAlles(r, KNOP_SEL).length <= 1) k = h; }
            if (k) return k;
            const host = n.getRootNode && n.getRootNode().host;
            if (!host) break;
            if (isKnopTag(host)) return host;
            n = host;
        }
        return el;
    }
    // Een klik zoals een mens hem geeft. Belangrijk: composed:true, anders blijft een
    // gesimuleerde klik binnen de webcomponent hangen en hoort de app (Vue/React-listener
    // op de host) hem nooit. De eigenlijke klik gaat via el.click(): die is altijd composed
    // en doet ook het standaardgedrag (formulier versturen, link volgen).
    // Dubbelklik: twee klikken + het dblclick-event (detail 2), zoals een echte muis.
    function klikStap(s, t) {
        klikReeks(t, true);
        if (s && s.dubbel) { klikReeks(t, false); try { const r = t.getBoundingClientRect(); t.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, composed: true, view: window, detail: 2, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); } catch (_) {} }
    }
    // De herkenbare waarde van een item (bv. "Polisnr. 7552439005"): label + nummer, anders de eerste regel.
    function itemBlok(k, alle) { let n = k; while (n.parentElement && n.parentElement !== doc.body && !alle.some(x => x !== k && n.parentElement.contains(x))) n = n.parentElement; return n; }
    function kernWaarde(blok) {
        const regels = String(blok.innerText || txt(blok)).split(/\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
        const knopT = diepAlles(blok, KNOP_SEL).map(k => txt(k));
        for (const r of regels) {
            const m = /^(.*?)[:.]?\s*(\d[\d.\-\/ ]{4,}\d)\b/.exec(r);
            if (m) { const titel = regels.find(x => x !== r && knopT.indexOf(x) < 0) || ''; return { label: m[1].trim().replace(/[:.]$/, '').slice(0, 24), waarde: m[2].replace(/\s+/g, ''), titel: titel.slice(0, 40) }; }
        }
        const titel = regels.find(x => knopT.indexOf(x) < 0) || regels[0] || '';
        return { label: '', waarde: titel.slice(0, 40), titel: '' };
    }
    // Met het paneel ernaast scrolt de body (niet het venster).
    function scroller() { return doc.documentElement.classList.contains('wt-dock') && doc.body ? doc.body : null; }
    function naarOnder() { const sc = scroller(); if (sc) sc.scrollTop = sc.scrollHeight; else window.scrollTo(0, doc.body.scrollHeight); }
    // Een webcomponent-knop (asr-button) luistert vaak alleen op de knop in zijn shadow root.
    function binnensteKnop(t) {
        let n = t;
        for (let i = 0; i < 4 && n && n.shadowRoot; i++) { const b = n.shadowRoot.querySelector('button,[role="button"],a[href],input[type="submit"],input[type="button"]'); if (!b) break; n = b; }
        return n;
    }
    function klikReeks(t, scroll) {
        if (!t) return;
        if (t.shadowRoot && /-/.test(t.tagName)) { if (scroll) try { t.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {} t = binnensteKnop(t); scroll = false; }
        if (scroll) try { t.scrollIntoView && t.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {}
        let x = 0, y = 0;
        try { const r = t.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; } catch (_) {}
        const basis = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0 };
        const ptr = (n, buttons) => { try { t.dispatchEvent(new PointerEvent(n, Object.assign({}, basis, { buttons, pointerId: 1, pointerType: 'mouse', isPrimary: true }))); } catch (_) {} };
        const mus = (n, buttons) => { try { t.dispatchEvent(new MouseEvent(n, Object.assign({}, basis, { buttons }))); } catch (_) {} };
        ptr('pointerover', 0); ptr('pointerenter', 0); mus('mouseover', 0); mus('mouseenter', 0);
        ptr('pointerdown', 1); mus('mousedown', 1);
        if (scroll) try { t.focus && t.focus({ preventScroll: true }); } catch (_) {}
        ptr('pointerup', 0); mus('mouseup', 0);
        if (typeof t.click === 'function') t.click(); else mus('click', 0);
    }
    // Vul een zoekveld met suggesties: typen → wachten op de lijst → de suggestie kiezen.
    // Komt er geen lijst, dan blijft de getypte tekst staan; dat is voor een zoekveld
    // het juiste eindresultaat en geen fout.
    async function fillTypeahead(el, value) {
        const s = String(value == null ? '' : value).trim();
        if (!s) { await typeInto(el, ''); return true; }
        await typeInto(el, s, { blur: false });   // echt typen, anders haalt de pagina geen suggesties op
        const zoekveld = el.type === 'search' || String(el.getAttribute('inputmode') || '') === 'search';
        for (let i = 0; i < (zoekveld ? 6 : 20); i++) {   // suggesties komen van de server; een zoekveld wacht korter
            await sleep(150);
            const opts = zichtbareOpties(el).filter(o => !/^(geen|no |niets|niet gevonden)/i.test((o.textContent || '').trim()));
            if (!opts.length) continue;
            // Zoekveld: alleen een suggestie kiezen die echt bij de waarde past — anders laten we
            // de getypte waarde staan (daarna drukt de flow zelf op Zoeken of Enter).
            const m = zoekveld ? besteOptie(opts.filter(o => bevatWaarde(o.textContent || '', s)), s) : besteOptie(opts, s);
            if (!m) continue;
            try { m.scrollIntoView({ block: 'nearest' }); } catch (e) {}
            m.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            klikReeks(m);
            await sleep(180);
            // Sommige lijsten reageren alleen op toetsen: dan Enter op de gemarkeerde optie.
            if (zichtbareOpties(el).length) {
                ['keydown', 'keyup'].forEach(n => el.dispatchEvent(new KeyboardEvent(n, { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true, composed: true })));
                await sleep(150);
            }
            break;
        }
        // Is het veld (alsnog) leeg, bv. doordat de component opnieuw tekende? Dan de waarde vast zetten.
        if (doc.contains(el) || (el.isConnected)) { if (String(el.value || '').trim() === '') await zetWaardeVast(el, s); }
        return String(el.value || '').trim() !== '';
    }
    // Laatste redmiddel: waarde direct zetten + events zoals de browser ze geeft (composed),
    // en ook de webcomponent eromheen bijwerken als die een eigen value heeft.
    async function zetWaardeVast(el, s) {
        try { el.focus(); } catch (e) {}
        setNativeValue(el, s);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: s, inputType: 'insertText' }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        try { const h = el.getRootNode && el.getRootNode().host; if (h && /-/.test(h.tagName) && 'value' in h && h.value !== s) h.value = s; } catch (e) {}
        await sleep(60);
        if (String(el.value || '') !== s) { setNativeValue(el, s); el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: s, inputType: 'insertText' })); }
    }
    // Open de dropdown, kies de optie die bij de waarde past (exact → hoofdletter-
    // ongevoelig → bevat), en sluit. Werkt voor MudBlazor en ARIA-listboxen.
    async function pickFromPopup(el, value) {
        const s = String(value == null ? '' : value).trim(), sl = s.toLowerCase();
        if (!s) return true;
        const clickSeq = klikReeks;
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
        const DIEP = 'input.mud-select-input,' + FC;
        // Webcomponent: het echte veld zit binnen in dit element (shadow DOM).
        if (el.shadowRoot) { const s = diepZoek(el.shadowRoot, DIEP); if (s) return s; }
        // Klim omhoog: het dichtstbijzijnde blok dat een echt veld bevat, wint.
        let node = el;
        for (let i = 0; i < 5 && node && node.tagName !== 'BODY' && node.tagName !== 'HTML'; i++) {
            if (node.querySelector) {
                const f = node.querySelector(DIEP) || (node.shadowRoot ? diepZoek(node.shadowRoot, DIEP) : null);
                if (f) return f;
            }
            node = schaduwOuder(node);
        }
        return el;
    }
    // De naam van een knop. In een design system van webcomponenten (Lit/ASR) staat de
    // echte <button> in een shadow root en komt de tekst via een <slot> uit de LIGHT DOM
    // van de host. textContent van die <button> is dus leeg — daarom klimmen we over de
    // shadow-grenzen omhoog en nemen we het eerste bruikbare label dat we tegenkomen.
    function knopNaam(el) {
        if (!el) return '';
        const kand = [];
        const voeg = v => { const s = cleanCol(v); if (s && s.length <= 60) kand.push(s); };
        voeg(el.getAttribute && el.getAttribute('aria-label'));
        voeg(txt(el));
        voeg(el.value);
        voeg(el.getAttribute && el.getAttribute('title'));
        let h = el;
        for (let n = 0; n < 5; n++) {
            const r = h.getRootNode && h.getRootNode();
            h = r && r.host; if (!h) break;
            voeg(h.getAttribute && h.getAttribute('aria-label'));
            voeg(txt(h));
            voeg(h.getAttribute && h.getAttribute('label'));
            voeg(h.getAttribute && h.getAttribute('title'));
        }
        // Een naam als "button" of "knop" zegt niets; dan liever de volgende kandidaat.
        return kand.find(x => !/^(button|knop|a|span|div)$/i.test(x)) || '';
    }
    // data-testid van de knop zelf of van de dichtstbijzijnde host erboven — in deze
    // design systems is dat vaak het enige wat twee identiek uitziende knoppen onderscheidt.
    function knopTestId(el) {
        let h = el;
        for (let n = 0; n < 6 && h; n++) {
            const v = h.getAttribute && (h.getAttribute('data-testid') || h.getAttribute('data-test-id'));
            if (v) return String(v);
            if (h.id && !looksGenerated(h.id)) return '#' + h.id;
            const r = h.getRootNode && h.getRootNode();
            h = (r && r.host) || h.parentElement;
        }
        return '';
    }
    function isBlazor(el) { try { return el.getAttributeNames().some(a => a.indexOf('_bl_') === 0); } catch (e) { return false; } }
    function isMudInput(el) { return el.tagName === 'INPUT' && /(^|\s)mud-input/.test(el.className || ''); }
    // Gemaskeerde/framework-velden (o.a. MudBlazor MudMask/MudDatePicker) lezen het
    // NATIVE input-event na een echte invoer. Synthetische keydowns voegen geen tekst in,
    // dus gebruiken we execCommand('insertText') — dat voegt de tekens écht in (zoals typen)
    // en laat beforeinput/input vuren, precies wat MudMask verwerkt. Bij een datum-/getalmasker
    // typen we alleen de cijfers (het masker zet zelf de streepjes). Werkt insertText niet
    // (oude browser), dan valt hij terug op el.value + input/change.
    async function typeInto(el, text, opt) {
        const blurNa = !(opt && opt.blur === false);   // bij een suggestielijst juist NIET blurren
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
            el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true, composed: true }));
            let ok = false;
            try { ok = document.execCommand('insertText', false, ch); } catch (e) {}
            if (!ok) { setNativeValue(el, (el.value || '') + ch); el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: ch, inputType: 'insertText' })); }
            else anyInsert = true;
            el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true, composed: true }));
            await sleep(15);
        }
        // Kwam er niets in? → hele waarde in één keer (laatste redmiddel).
        if ((el.value || '').replace(/\s/g, '') === '' && full !== '') { setNativeValue(el, full); fire(el, ['input']); }
        fire(el, ['change']);
        if (blurNa) {
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        }
        return true;
    }
    async function fillElement(el, value) {
        if (!el) return false;
        if (el.isContentEditable) { el.textContent = String(value); fire(el, ['input']); return true; }
        if (isTypeahead(el)) return await fillTypeahead(el, value);
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
    // Zoek het veld dat bij een kolomnaam hoort. Belangrijk: dit is de omgekeerde weg van
    // fieldLabel() — wat "Velden ophalen" als kolomnaam opschrijft, moet hier terug te
    // vinden zijn. Daarom vergelijken we óók op het label van het veld zelf, en zoeken we
    // mee in webcomponenten (diepAlles), niet alleen in de gewone DOM.
    function findFieldIn(scope, key) {
        scope = scope || doc;
        const low = cleanCol(key).toLowerCase();
        if (!low) return null;
        let el = null;
        try { el = scope.querySelector(attrSel(key)) || diepZoek(scope, attrSel(key)); if (el) return el; } catch (e) {}
        try { el = scope.querySelector('#' + CSS.escape(key)); if (el) return el; } catch (e) {}
        const velden = diepAlles(scope, 'input:not([type=hidden]),select,textarea').filter(c => !vanOnsZelf(c));
        // 1. het label van het veld is exact de kolomnaam
        for (const c of velden) { if (cleanCol(fieldLabel(c)).toLowerCase() === low) return c; }
        // 2. een <label> waarvan de tekst de kolomnaam bevat
        for (const lab of diepAlles(scope, 'label')) {
            if (vanOnsZelf(lab)) continue;
            if ((lab.textContent || '').toLowerCase().includes(low)) {
                const f = lab.getAttribute('for');
                if (f) { try { const r = (lab.getRootNode && lab.getRootNode()) || doc; const t = ((r && r.getElementById) ? r : doc).getElementById(f); if (t) return t; } catch (e) {} }
                const ins = lab.querySelector('input,textarea,select'); if (ins) return ins;
            }
        }
        // 3. het label van het veld bevat de kolomnaam
        for (const c of velden) { const l = cleanCol(fieldLabel(c)).toLowerCase(); if (l && l.includes(low)) return c; }
        // 4. laatste redmiddel: placeholder, aria-label, naam of id bevat de kolomnaam
        for (const c of velden) {
            const hay = ((c.placeholder || '') + ' ' + (c.getAttribute('aria-label') || '') + ' ' + (c.getAttribute('title') || '') + ' ' + (c.name || '') + ' ' + (c.id || '')).toLowerCase();
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
        const nu = new Date(), DOS_T = (nu.getHours() << 11) | (nu.getMinutes() << 5) | (nu.getSeconds() >> 1), DOS_D = ((nu.getFullYear() - 1980) << 9) | ((nu.getMonth() + 1) << 5) | nu.getDate();
        const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
        const parts = [], central = []; let offset = 0;
        files.forEach(f => {
            const nameB = strBytes(f.name), crc = crc32(f.bytes), size = f.bytes.length;
            const local = new Uint8Array([].concat([0x50, 0x4b, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(DOS_T), u16(DOS_D), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0)));
            parts.push(local, nameB, f.bytes);
            central.push(new Uint8Array([].concat([0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(DOS_T), u16(DOS_D), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), nameB);
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
    // ---- Webcomponenten (shadow DOM) ----
    // Veel portalen bouwen hun velden in een webcomponent. Een klik levert dan de buitenkant
    // (de host) op in plaats van het veld, en querySelector kijkt niet in zo'n component.
    // Daarom: het echte doel uit het samengestelde pad halen, selectors met ">>>" over de
    // grens schrijven, en opzoeken dwars door de componenten heen.
    function echtDoel(e) {
        try { const pad = e.composedPath && e.composedPath(); if (pad && pad.length) return pad[0]; } catch (_) {}
        return e.target;
    }
    function inSchaduw(el) { try { const r = el.getRootNode && el.getRootNode(); return !!(r && r.host); } catch (_) { return false; } }
    function schaduwOuder(el) { return el.parentElement || (el.parentNode && el.parentNode.host) || null; }
    // Ons eigen paneel staat óók in een shadow DOM; daar hoeven we nooit in te kijken.
    function vanOnsZelf(n) {
        try { return n === window.__wtHost || n.id === 'wt-scraper-host' || (typeof n.className === 'string' && n.className.indexOf('wt-') === 0); }
        catch (_) { return false; }
    }
    function diepZoek(root, sel) {
        if (!root) return null;
        let e = null; try { e = root.querySelector(sel); } catch (_) { return null; }
        if (e) return e;
        let kinderen = []; try { kinderen = root.querySelectorAll('*'); } catch (_) { return null; }
        for (let i = 0; i < kinderen.length; i++) { const h = kinderen[i]; if (h.shadowRoot && !vanOnsZelf(h)) { const v = diepZoek(h.shadowRoot, sel); if (v) return v; } }
        return null;
    }
    function diepAlles(root, sel, uit) {
        uit = uit || [];
        if (!root) return uit;
        try { root.querySelectorAll(sel).forEach(e => uit.push(e)); } catch (_) { return uit; }
        try { root.querySelectorAll('*').forEach(h => { if (h.shadowRoot && !vanOnsZelf(h)) diepAlles(h.shadowRoot, sel, uit); }); } catch (_) {}
        return uit;
    }
    // Zoekt een selector op. ">>>" stapt een webcomponent binnen; zonder ">>>" kijkt hij eerst
    // gewoon en daarna alsnog in de componenten.
    function qs(sel, scope) {
        if (!sel) return null;
        scope = scope || doc;
        const delen = String(sel).split('>>>');
        if (delen.length === 1) { let e = null; try { e = scope.querySelector(sel); } catch (_) { return null; } return e || diepZoek(scope, sel); }
        let node = scope;
        for (let i = 0; i < delen.length; i++) {
            const d = delen[i].trim(); if (!d) return null;
            let e = null; try { e = node.querySelector(d); } catch (_) { return null; }
            if (!e) return null;
            if (i === delen.length - 1) return e;
            if (!e.shadowRoot) return null;
            node = e.shadowRoot;
        }
        return null;
    }
    function cssPath(el) {
        if (!el || el.nodeType !== 1) return '';
        if (el.id && !inSchaduw(el)) return '#' + CSS.escape(el.id);
        const stukken = []; let path = [], n = el;
        // Eén stap omhoog; staat het element onderin een webcomponent, dan sluiten we dit
        // stuk af en gaan we verder bij de host ervan.
        const omhoog = () => {
            if (n.parentElement) { n = n.parentElement; return true; }
            const gastheer = n.parentNode && n.parentNode.host;
            if (!gastheer) { n = null; return false; }
            stukken.unshift(path.join(' > ')); path = []; n = gastheer; return true;
        };
        while (n && n.nodeType === 1 && n.tagName !== 'HTML') {
            let part = n.tagName.toLowerCase();
            if (n.id && !inSchaduw(n)) { path.unshift('#' + CSS.escape(n.id)); break; }
            const cls = Array.from(n.classList).find(c => !/^(active|hover|focus|selected|open|wt-)/.test(c));
            if (cls) {
                part += '.' + CSS.escape(cls);
                const ouder = n.parentElement || n.parentNode;
                let uniek = false; try { uniek = !!(ouder && ouder.querySelectorAll && ouder.querySelectorAll(':scope > ' + part).length === 1); } catch (_) {}
                if (uniek) { path.unshift(part); if (!omhoog()) break; continue; }
            }
            let i = 1, s = n; while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
            part += ':nth-of-type(' + i + ')'; path.unshift(part); if (!omhoog()) break;
        }
        stukken.unshift(path.join(' > '));
        const uit = stukken.filter(Boolean);
        if (uit.length > 1) return uit.join('>>>');
        const p = uit[0] ? uit[0].split(' > ') : [];
        while (p.length > 1 && doc.querySelectorAll(p.slice(1).join(' > ')).length === 1) p.shift();
        return p.join(' > ');
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
            const href = d.tagName === 'A' ? (d.getAttribute('href') || '') : '';
            const nepLink = d.tagName === 'A' && (!href || href === '#' || /^javascript:/i.test(href));
            if (nepLink && txt(d).length <= 2) return;   // bv. een "i"-informatieknopje
            const isLink = d.tagName === 'A' && !nepLink, leaf = d.children.length === 0 && txt(d).length > 0;
            if (!isLink && !leaf) return;
            const rel = relSelector(record, d); if (!rel || cols.some(c => c.rel === rel)) return;
            cols.push({ name: colName(d, taken), rel, isLink });
        });
        return cols.slice(0, 12);
    }
    function readField(rec, c) { const t = c.rel ? rec.querySelector(c.rel) : rec; if (!t) return null; return c.isLink ? (t.getAttribute('href') ? t.href : null) : txt(t); }
    function autoDetectList(el, binnen) {
        let best = null, node = el;
        for (let d = 0; node && node.nodeType === 1 && node !== doc.body && node !== binnen && d < 9; d++, node = node.parentElement) {
            const sig = sigSelector(node); let records = matchingRecords(node, sig);
            if (binnen) records = records.filter(r => binnen.contains(r));   // lus in een lus: alleen tellen binnen het buitenitem
            if (records.length < 2) continue;
            const columns = detectColumns(node); if (!columns.length) continue;
            records = records.filter(r => columns.some(c => readField(r, c))); if (records.length < 2) continue;
            if (!best || records.length > best.count || (records.length === best.count && columns.length > best.columns.length))
                best = { sig, columns, count: records.length };
        }
        return best;
    }
    // Het label dat bij een waarde hoort: via data-label-id/aria-labelledby, of het label/dt/th in dezelfde regel.
    function labelBijWaarde(el) {
        let n = el;
        for (let i = 0; i < 6 && n && n.nodeType === 1; i++, n = n.parentElement) {
            const lid = n.getAttribute && (n.getAttribute('data-label-id') || n.getAttribute('aria-labelledby'));
            if (lid) { const l = doc.getElementById(lid.split(/\s+/)[0]); if (l && txt(l)) return cleanCol(txt(l)).slice(0, 60); }
        }
        const rij = el.closest && el.closest('.entry, tr, li, dl, .row, .form-group, .field');
        if (rij) { const l = rij.querySelector('label, dt, th, .label'); if (l && l !== el && !l.contains(el) && txt(l)) return cleanCol(txt(l)).slice(0, 60); }
        return '';
    }
    // Label/waarde-lijst (bv. "Product: Pakket", "Jaarbedrag: € 230,53") als één regel met kolommen.
    function paarVan(rec) {
        const l = rec.querySelector('label, dt, th, .label');
        const bladeren = Array.from(rec.querySelectorAll('*')).filter(d => d.children.length === 0 && txt(d) && !(d.tagName === 'A' && txt(d).length <= 2) && !(d.closest && d.closest('[role="alert"]')));
        const key = cleanCol(l ? txt(l) : (bladeren[0] ? txt(bladeren[0]) : ''));
        const vEl = bladeren.slice().reverse().find(d => !(l && (l === d || l.contains(d))) && cleanCol(txt(d)) !== key);
        return [key.slice(0, 60), vEl ? txt(vEl) : ''];
    }
    // Hele pagina: titel, adres, koppen, alle label → waarde-paren, invulvelden, tabellen en links.
    // Ook in webcomponenten en in kaders van hetzelfde domein.
    function paginaUitlezen(root, adres) {
        root = root || doc;
        const uit = { 'Pagina titel': (root.title || '').trim(), 'Pagina adres': adres || (root.location && root.location.href) || location.href };
        const zet = (k, v) => { k = cleanCol(String(k || '')).slice(0, 60); v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); if (k && v && v.length < 400 && !(k in uit)) uit[k] = v; };
        const koppen = diepAlles(root, 'h1,h2,h3').map(txt).filter(Boolean);
        if (koppen.length) uit['Koppen'] = koppen.slice(0, 30).join(' | ');
        diepAlles(root, 'dt').forEach(dt => { const dd = dt.nextElementSibling; if (dd && dd.tagName === 'DD') zet(txt(dt), txt(dd)); });
        diepAlles(root, 'input:not([type=hidden]):not([type=password]):not([type=submit]):not([type=button]),select,textarea').forEach(f => { try { zet(fieldLabel(f), readValue(f, 'auto')); } catch (e) {} });
        diepAlles(root, 'tr').forEach(tr => { const c = Array.from(tr.children).filter(x => /^(TH|TD)$/.test(x.tagName)); if (c.length === 2 && txt(c[0]).length < 60) zet(txt(c[0]), txt(c[1])); });
        diepAlles(root, '.label,[class*="label"]').forEach(l => { if (/^(LABEL|INPUT|BUTTON)$/.test(l.tagName)) return; const r = l.closest('.entry,.row,[class*="field"],[class*="entry"]') || l.parentElement; try { const [k, v] = paarVan(r); if (k && v) zet(k, v); } catch (e) {} });
        const tabellen = diepAlles(root, 'table'), links = diepAlles(root, 'a[href]'), knoppen = diepAlles(root, 'button,[role=button]');
        uit['Aantal tabellen'] = String(tabellen.length); uit['Aantal links'] = String(links.length); uit['Aantal knoppen'] = String(knoppen.length);
        uit['Tekst'] = txt(root.body || root.documentElement).slice(0, 4000);
        try { root.querySelectorAll('iframe').forEach(f => { let d = null; try { d = f.contentDocument; } catch (e) {} if (d && d.body) { const sub = paginaUitlezen(d); Object.keys(sub).forEach(k => { if (!/^(Pagina|Aantal|Tekst|Koppen)/.test(k)) zet(k, sub[k]); }); } }); } catch (e) {}
        return uit;
    }
    // Alle betekenisvolle elementen van een pagina (de site als DOM): koppen, links, knoppen,
    // velden, formulieren, tabellen, afbeeldingen en tekstblokken.
    function elementenVan(root, adres) {
        const uit = [], basis = adres || location.href;
        const voeg = (soort, tekst, extra) => { if (uit.length < 3000) uit.push(Object.assign({ Pagina: basis, Soort: soort, Tekst: String(tekst || '').replace(/\s+/g, ' ').trim().slice(0, 200) }, extra || {})); };
        const abs = h => { try { return new URL(h, basis).href; } catch (e) { return h || ''; } };
        diepAlles(root, 'h1,h2,h3,h4,h5,h6').forEach(h => voeg('kop ' + h.tagName.toLowerCase(), txt(h)));
        diepAlles(root, 'a[href]').forEach(a => voeg('link', txt(a) || a.getAttribute('title') || a.getAttribute('aria-label') || '', { Adres: abs(a.getAttribute('href')) }));
        diepAlles(root, 'button,[role=button],input[type=submit],input[type=button]').forEach(b => voeg('knop', txt(b) || b.value || b.getAttribute('aria-label') || ''));
        diepAlles(root, 'form').forEach(f => voeg('formulier', (f.getAttribute('name') || f.id || '') + ' · ' + f.querySelectorAll('input,select,textarea').length + ' velden', { Adres: abs(f.getAttribute('action') || '') }));
        diepAlles(root, 'input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea').forEach(f => { let l = ''; try { l = fieldLabel(f); } catch (e) {} voeg('invulveld', l || f.name || f.placeholder || '', { Type: f.type || f.tagName.toLowerCase() }); });
        diepAlles(root, 'table').forEach(t => { const kop = Array.from(t.querySelectorAll('th')).slice(0, 8).map(txt).join(' | '); voeg('tabel', kop || txt(t).slice(0, 80), { Type: t.querySelectorAll('tr').length + ' rijen' }); });
        diepAlles(root, 'img[src]').forEach(i => voeg('afbeelding', i.getAttribute('alt') || '', { Adres: abs(i.getAttribute('src')) }));
        let n = 0; diepAlles(root, 'p,li,dd,td,blockquote').forEach(e => { const t = txt(e); if (t.length >= 40 && n < 300 && !e.querySelector('p,li,table')) { n++; voeg('tekst', t); } });
        return uit;
    }
    function scrapePairs(spec) {
        const uit = {};
        Array.from(doc.querySelectorAll(spec.sig)).forEach(rec => { const [k, v] = paarVan(rec); if (k && v && !(k in uit)) uit[k] = v; });
        return uit;
    }
    // Zoek de "regel" rond een waarde die een label bevat (bv. div.entry, tr, dt/dd) en kijk of er
    // meer van zulke regels zijn. Zo ja: dat is een label/waarde-overzicht.
    function zoekParen(el) {
        let n = el;
        for (let i = 0; i < 7 && n && n.nodeType === 1 && n !== doc.body; i++, n = n.parentElement) {
            const l = n.querySelector && n.querySelector('label, dt, th, .label');
            if (!l || l === el || l.contains(el)) continue;
            const sig = sigSelector(n);
            let recs = []; try { recs = Array.from(doc.querySelectorAll(sig)); } catch (e) { continue; }
            const goed = recs.filter(r => { const [k, v] = paarVan(r); return k && v; });
            if (goed.length >= 2) return { sig, count: goed.length };
        }
        return null;
    }
    function lijktPaar(det) { try { const r = doc.querySelector(det.sig); if (!r) return false; const [k, v] = paarVan(r); return !!(k && v); } catch (e) { return false; } }
    function scrapeList(spec) {
        const recs = Array.from(doc.querySelectorAll(spec.sig));
        const rows = [];
        recs.forEach(rec => { const row = {}; let any = false; spec.columns.forEach(c => { const v = readField(rec, c); row[c.name] = v; if (v) any = true; }); if (any) rows.push(row); });
        return rows;
    }

    // ============================================ formulier lezen / CSV
    // Tekst van de elementen waar een attribuut met id's naar wijst (aria-labelledby).
    // Let op: aria-describedby gebruiken we NIET als label — daar staat de foutmelding in.
    function labelUitIds(el, attr) {
        const ids = String((el.getAttribute && el.getAttribute(attr)) || '').trim();
        if (!ids) return '';
        const r = (el.getRootNode && el.getRootNode()) || doc;
        const zoek = (r && r.getElementById) ? r : doc;
        return ids.split(/\s+/).map(id => { try { const n = zoek.getElementById(id); return n ? txt(n) : ''; } catch (e) { return ''; } })
            .filter(Boolean).join(' ').trim();
    }
    // Label dat vóór het veld staat zonder for-koppeling (veel React-formulieren doen dit).
    // strikt = alleen een echt <label>/<legend>; anders ook een korte tekstregel ervoor.
    function labelVoorVeld(el, strikt) {
        let node = el;
        for (let omhoog = 0; omhoog < 3 && node; omhoog++) {
            let zus = node.previousElementSibling;
            for (let n = 0; n < 3 && zus; n++) {
                if (!/^(SCRIPT|STYLE|INPUT|SELECT|TEXTAREA|BUTTON)$/.test(zus.tagName)) {
                    const lab = (zus.matches && zus.matches('label,legend')) ? zus : (zus.querySelector && zus.querySelector('label,legend'));
                    const bron = lab || (strikt ? null : zus);
                    const s = bron ? cleanCol(txt(bron)) : '';
                    if (s && s.length <= 60) return s;
                }
                zus = zus.previousElementSibling;
            }
            node = node.parentElement;
        }
        return '';
    }
    // Leesbaar label van een veld. In deze volgorde, want zo is de kans op de naam die de
    // gebruiker op het scherm ziet het grootst: <label for> → aria-labelledby → omhullend
    // <label> → label in het veldblok → een <label> dat ervoor staat → aria-label →
    // placeholder → title → een korte tekst die ervoor staat.
    function fieldLabel(el) {
        try { if (el.id) { const r = (el.getRootNode && el.getRootNode()) || doc; const l = (r.querySelector ? r : doc).querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l && txt(l)) return txt(l); } } catch (e) {}
        const viaIds = labelUitIds(el, 'aria-labelledby'); if (viaIds) return viaIds;
        // Omhullend <label>: alleen de labeltekst, niet de tekst van het veld/de opties erin.
        const wrap = el.closest && el.closest('label');
        if (wrap) { try { const c = wrap.cloneNode(true); c.querySelectorAll('input,select,textarea,button,option').forEach(x => x.remove()); const s = txt(c); if (s) return s; } catch (e) { if (txt(wrap)) return txt(wrap); } }
        const ctrl = el.closest && el.closest('.mud-input-control, .mud-form-control, .mud-input-control-input-container, .field, .form-group, .asr-form-field, [class*="form-field"], [class*="formfield"]');
        if (ctrl) { const ml = ctrl.querySelector('.mud-input-label, label, legend, .mud-form-control-label'); if (ml && txt(ml)) return txt(ml); }
        const ervoor = labelVoorVeld(el, true); if (ervoor) return ervoor;
        const attr = (el.getAttribute && (el.getAttribute('aria-label') || el.placeholder || el.getAttribute('title'))) || '';
        if (attr) return attr;
        return labelVoorVeld(el, false);
    }
    function readFormFieldsIn(scope) {
        const fields = [], seen = new Set();
        diepAlles(scope, 'input,select,textarea').forEach(el => {
            if (/^(hidden|submit|button|reset|image|file)$/i.test(el.type)) return;
            // Sla hulp-invoervelden van kalenders/pickers over (bv. MudDatePicker toont een
            // kalender-popover met maand/jaar-velden). Zo blijft één datumveld ook één kolom.
            if (el.closest('.mud-picker-content,.mud-picker-calendar,.mud-popover,.mud-overlay,[role="dialog"],[role="tooltip"]')) return;
            const key = el.name || el.id || cssPath(el); if (!key || seen.has(key)) return; seen.add(key);
            const label = fieldLabel(el);
            // In een webcomponent helpt "#id" niet: dan een pad dat de grens oversteekt.
            // Een willekeurig id (React/MudBlazor geven elke pagina-load een nieuw id) is
            // als selector waardeloos; dan liever een structuurpad plus een vingerafdruk.
            const selector = inSchaduw(el) ? cssPath(el)
                : (el.id && !looksGenerated(el.id)) ? '#' + CSS.escape(el.id)
                : el.name ? el.tagName.toLowerCase() + attrSel(el.name) : cssPath(el);
            fields.push({ key, label, type: (el.type || el.tagName.toLowerCase()), selector, fp: fingerprint(el) });
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
            return { col, selector: f.selector, fp: f.fp, key: f.key, label: f.label, type: f.type, on: true };
        });
    }
    // Het element van een kolom: eerst de selector, anders de vingerafdruk (voor velden
    // waarvan het id per pagina-load verandert), anders op naam/label zoeken.
    function colEl(m, scope) {
        scope = scope || doc;
        let el = null;
        try { el = m.selector ? (qs(m.selector, scope) || qs(m.selector, doc)) : null; } catch (e) {}
        if (!el && m.fp) el = findByFingerprint(m.fp, scope) || findByFingerprint(m.fp, doc);
        if (!el && m.key) { try { el = qs(attrSel(m.key), scope) || diepZoek(scope, attrSel(m.key)); } catch (e) {} }
        if (!el) el = findFieldIn(scope, m.col) || (m.label ? findFieldIn(scope, m.label) : null);
        return el;
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
        const par = el.parentElement || el.parentNode;
        if (par && par.children) { const same = Array.from(par.children).filter(c => c.tagName === el.tagName); if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')'; }
        return s;
    }
    function structSelector(el) {
        const stukken = []; let parts = [], node = el, depth = 0;
        while (node && node.nodeType === 1 && node.tagName !== 'BODY' && node.tagName !== 'HTML' && depth < 8) {
            if (node.id && !looksGenerated(node.id) && !inSchaduw(node)) { try { parts.unshift('#' + CSS.escape(node.id)); break; } catch (e) {} }
            parts.unshift(nodeSel(node));
            const op = node.parentElement;
            if (op) { node = op; depth++; continue; }
            const gastheer = node.parentNode && node.parentNode.host;
            if (!gastheer) break;
            stukken.unshift(parts.join('>')); parts = [];   // grens van de webcomponent
            node = gastheer; depth++;
        }
        stukken.unshift(parts.join('>'));
        return stukken.filter(Boolean).join('>>>');
    }
    // Vingerafdruk = HTML-structuur (pad, type, stabiele klassen) + de HTML zelf. Géén naam/label.
    function fingerprint(el) {
        return {
            tag: el.tagName,
            typ: (attrOf(el, 'type') || '').toLowerCase(),
            cls: stableClasses(el).slice(0, 6),
            ph: attrOf(el, 'placeholder'),
            path: structSelector(el),
            lab: knopNaam(el),
            tid: knopTestId(el),
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
        if (fp.path) { try { const e = qs(fp.path, scope); if (e) return e; } catch (_) {} }
        const cands = diepAlles(scope, (fp.tag || 'input').toLowerCase());
        let best = null, bs = 0, bstruct = 0;
        cands.forEach(el => {
            let s = 0;   // structurele signalen (type, stabiele klassen, placeholder, pad)
            if (fp.typ && (attrOf(el, 'type') || '').toLowerCase() === fp.typ) s += 2;
            const cls = stableClasses(el); s += Math.min((fp.cls || []).filter(c => cls.includes(c)).length, 4);
            if (fp.ph && attrOf(el, 'placeholder') === fp.ph) s += 2;
            if (fp.path && structSelector(el) === fp.path) s += 5;
            // Label en data-testid onderscheiden knoppen die er verder identiek uitzien.
            if (fp.tid && knopTestId(el) === fp.tid) s += 4;
            if (fp.lab && knopNaam(el) === fp.lab) s += 4;
            const tot = s + htmlSim(fp.html, el.outerHTML) * 3;
            if (tot > bs) { bs = tot; bstruct = s; best = el; }
        });
        // HTML-gelijkenis alléén (attribuutnamen als name=/id= heeft elk veld) is te mager:
        // liever "niet gevonden" dan het verkeerde veld invullen.
        return bs >= 3 && bstruct >= 1 ? best : null;
    }
    // Laatste redmiddel voor klik-stappen: de knop zoeken op zijn zichtbare naam.
    function knopOpNaam(naam) {
        const n = String(naam || '').trim().toLowerCase(); if (!n || /^(button|knop)$/.test(n)) return null;
        const zichtbaar = b => { try { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (_) { return false; } };
        const kand = diepAlles(doc, KNOP_SEL).filter(b => !vanOnsZelf(b) && zichtbaar(b));
        return kand.find(b => knopNaam(b).toLowerCase() === n) || kand.find(b => knopNaam(b).toLowerCase().indexOf(n) === 0) || null;
    }
    // ---- Lus "voor elk item": het item waar de lus nu is, en paden binnen zo'n item ----
    let LUS_ITEM = null, LUS_ACTIEF = false;
    function lusItems(spec) {
        if (!spec || !spec.sig) return [];
        let recs = []; try { recs = Array.from(doc.querySelectorAll(spec.sig)); } catch (_) { return []; }
        return recs.filter(r => (spec.columns || []).some(c => readField(r, c)));
    }
    function itemVan(el, spec) { const its = lusItems(spec); return its.find(it => it === el || it.contains(el)) || null; }
    // Pad van een element binnen zijn item, zodat dezelfde stap bij elk item het eigen element pakt.
    function relPath(el, root) {
        if (el === root) return ':scope';
        const parts = []; let n = el;
        while (n && n !== root && n.nodeType === 1) {
            let i = 1, z = n; while ((z = z.previousElementSibling)) if (z.tagName === n.tagName) i++;
            parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
            n = n.parentElement;
        }
        return n === root ? ':scope > ' + parts.join(' > ') : null;
    }
    // Vind het doel-element van een stap: eerst de (structuur)selector, anders de vingerafdruk.
    function targetEl(s, scope) {
        // Stap binnen een lus: altijd in het HUIDIGE item zoeken (nooit terugvallen op item 1).
        if (s && s.rel && LUS_ACTIEF) {
            if (!LUS_ITEM || !doc.contains(LUS_ITEM)) return null;
            if (s.rel === ':scope') return LUS_ITEM;
            let e = null; try { e = LUS_ITEM.querySelector(s.rel); } catch (_) {}
            if (!e && s.fp) e = findByFingerprint(s.fp, LUS_ITEM);
            return e;
        }
        scope = scope || doc;
        let el = null;
        try { el = s.selector ? qs(s.selector, scope) : null; } catch (e) {}
        if (!el && s.selector) { try { el = qs(s.selector, doc); } catch (e) {} }
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
        try { klikReeks(btn, true); } catch (e) { return false; }
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
            let el = m ? colEl(m, scope) : null;
            if (!el) el = findFieldIn(scope, c) || findFieldIn(doc, c);
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
    host.style.cssText = 'position:fixed;inset:auto;top:16px;right:16px;left:auto;bottom:auto;margin:0;padding:0;border:0;background:transparent;z-index:2147483647;width:430px;max-width:calc(100vw - 24px);';
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
    // Staat er een MODAAL venster open (<dialog>.showModal(), wat bv. asr-sheet doet)?
    // Dan maakt de browser alles buiten die dialog "inert": je ziet ons paneel nog wel,
    // maar geen enkele knop erin reageert nog op een muisklik. Ook de top-layer (popover)
    // helpt daar niet tegen — alleen staan binnen de dialog zelf helpt.
    function openModaal() {
        let ds = [];
        try { ds = diepAlles(doc, 'dialog[open]'); } catch (e) { return null; }
        for (let i = ds.length - 1; i >= 0; i--) {
            const d = ds[i];
            if (vanOnsZelf(d)) continue;
            // Let op: ook de dialog waar het paneel al in staat telt mee. Die overslaan liet
            // het paneel elke 60 ms heen en weer springen tussen body en dialog (flikkeren).
            try { if (d.matches(':modal')) return d; } catch (e) {}
        }
        return null;
    }
    // Verhuis het paneel (popover-modus even uit, want verplaatsen sluit een popover).
    let verhuisTijden = [], verhuisStop = 0;
    function verhuis(naar) {
        if (!naar || host.parentNode === naar) return;
        const nu = Date.now();
        if (nu < verhuisStop) return;
        verhuisTijden = verhuisTijden.filter(t => nu - t < 3000); verhuisTijden.push(nu);
        if (verhuisTijden.length > 6) { verhuisStop = nu + 5000; verhuisTijden = []; return; }   // te vaak → 5 s rust
        const stondOpen = usingPopover && host.matches && (() => { try { return host.matches(':popover-open'); } catch (e) { return false; } })();
        try { if (stondOpen) host.hidePopover(); } catch (e) {}
        try { naar.appendChild(host); } catch (e) { return; }
        if (usingPopover) { try { host.showPopover(); } catch (e) { showTop(); } }
    }
    function keepOnTop() {
        const b = doc.body; if (!b || !host.parentNode) return;
        if (host.style.zIndex !== '2147483647') host.style.zIndex = '2147483647';
        const a = root.activeElement; if (a && a.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
        // Modaal open → in de dialog gaan staan, zodat het paneel klikbaar blijft.
        // Modaal weer dicht → terug naar de body.
        const modaal = openModaal();
        if (modaal) { verhuis(modaal); return; }
        if (host.parentNode !== b) { verhuis(b); return; }
        // Popover-modus: het paneel zit in de browser-top-layer → altijd bovenop, geen DOM-verhuizing
        // nodig. We houden 'm alleen open als de pagina hem zou hebben gesloten.
        if (usingPopover) { if (host.showPopover && !host.matches(':popover-open')) { try { host.showPopover(); } catch (e) { showTop(); } } return; }
        if (b.lastElementChild !== host && raiseNeeded() && Date.now() >= verhuisStop) {
            const nu = Date.now(); verhuisTijden = verhuisTijden.filter(t => nu - t < 3000); verhuisTijden.push(nu);
            if (verhuisTijden.length > 6) { verhuisStop = nu + 5000; verhuisTijden = []; return; }
            try { b.appendChild(host); } catch (e) {}
        }
    }
    // Klikken, focus en toetsen in ons paneel niet laten doorlopen naar de pagina. Een
    // modaal/scherm met hoge z-index luistert vaak op document naar "klik buiten mij"
    // (en sluit dan), trekt de focus terug (focus-trap) of blokkeert scrollen. Onze eigen
    // knoppen zitten binnen de host en hebben het event dan al gehad.
    ['pointerdown', 'mousedown', 'click', 'dblclick', 'focusin', 'focusout', 'keydown', 'keyup', 'keypress', 'touchstart', 'wheel'].forEach(t =>
        host.addEventListener(t, e => { e.stopPropagation(); }, { passive: true }));
    const topObs = new MutationObserver(() => { clearTimeout(topT); topT = setTimeout(keepOnTop, 60); });
    try { topObs.observe(doc.body || doc.documentElement, { childList: true }); } catch (e) {}
    const topIv = setInterval(keepOnTop, 1500);   // vangnet
    root.innerHTML = panelHTML();
    // Geen emoji in het paneel: elk teken wordt een strak lijn-icoon (ook in meldingen en vragen).
    const EMO = { '👆': 'cursor', '🔎': 'search', '⏺': 'rec', '✨': 'spark', '📄': 'doc', '🧮': 'branch', '👣': 'ff', '✋': 'hand', '📋': 'list', '⬇': 'download', '🌐': 'globe', '🩹': 'spark',
        '🔗': 'link', '🗑': 'trash', '⏳': 'clock', '⏱': 'clock', '🖨': 'printer', '📸': 'camera', '📌': 'pin', '🔢': 'hash', '🔁': 'repeat', '📤': 'upload', '⚡': 'bolt', '❓': 'help', '🟠': 'alert', '🟡': 'alert', '🔴': 'alert',
        '🧪': 'flask', '⏩': 'ff', '⏭': 'ff', '💾': 'save', '📁': 'folder', '📍': 'pin', '✅': 'check', '🖱': 'mouse', '📝': 'edit', '📎': 'doc', '🔑': 'key', '🔀': 'flow', '⏸': 'pause',
        '✔': 'check', '✓': 'check', '⚠': 'alert', '✎': 'edit', 'ⓘ': 'info', '✗': 'x', '✕': 'x', '↻': 'repeat', '↺': 'repeat', '↪': 'goto', '↩': 'back', '➜': 'goto', '▶': 'play', '◀': 'back', '■': 'stop', '●': 'dot', '▣': 'frame', '↷': 'ff', '🍪': 'info', '👋': '' };
    const EMO_RE = new RegExp('(' + Object.keys(EMO).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\uFE0F?', 'g');
    function emojiWeg(node) {
        if (!node) return;
        const w = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT), lijst = [];
        if (node.nodeType === 3) lijst.push(node); else while (w.nextNode()) lijst.push(w.currentNode);
        lijst.forEach(n => {
            const tx = n.nodeValue; if (!tx || !EMO_RE.test(tx)) return; EMO_RE.lastIndex = 0;
            const p = n.parentNode; if (!p) return;
            if (p.closest && p.closest('option,select,textarea,style,script,title')) { n.nodeValue = tx.replace(EMO_RE, '').replace(/^\s+/, ''); return; }
            const frag = doc.createDocumentFragment(); let last = 0;
            tx.replace(EMO_RE, (m, e, off) => { if (off > last) frag.appendChild(doc.createTextNode(tx.slice(last, off))); if (EMO[e]) { const sp = doc.createElement('span'); sp.className = 'emo'; sp.innerHTML = IC(EMO[e], 'ico-sm'); frag.appendChild(sp); } last = off + m.length; return m; });
            if (last < tx.length) frag.appendChild(doc.createTextNode(tx.slice(last)));
            p.replaceChild(frag, n);
        });
    }
    emojiWeg(root);
    const emoObs = new MutationObserver(muts => { emoObs.disconnect(); muts.forEach(m => { if (m.type === 'characterData') emojiWeg(m.target); else m.addedNodes.forEach(emojiWeg); }); emoObs.observe(root, { childList: true, subtree: true, characterData: true }); });
    emoObs.observe(root, { childList: true, subtree: true, characterData: true });
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
    // ---- Grootte van het paneel ----
    const MATEN = { normaal: [680, 1], groot: [780, 1], extra: [900, 1.04] };
    // Zijbalk: vast aan de rechterkant over de volle hoogte; de website schuift opzij (geen overlap).
    function dock() {
        Object.assign(host.style, { top: '0', right: '0', left: 'auto', bottom: '0', height: '100vh', maxWidth: 'calc(100vw - 120px)' });
        const ingeklapt = $('.wt-body') && $('.wt-body').classList.contains('wt-hidden');
        const w = ingeklapt ? 0 : Math.round(host.getBoundingClientRect().width || 430);
        doc.documentElement.style.setProperty('--wt-dock', w + 'px');
        doc.documentElement.classList.toggle('wt-dock', !ingeklapt);
        DOCK_W = ingeklapt ? 0 : w;
        dockModus();
        if (ingeklapt) { host.style.height = 'auto'; host.style.bottom = 'auto'; }
    }
    // Twee manieren om naast de pagina te staan:
    // - een web-app die zelf niet scrolt (Cockpit): de body wordt het kader, dus ook vaste menu's en
    //   schermen van de site blijven links van het paneel;
    // - een gewone pagina die scrolt: marge rechts, en vaste balken/menu's die onder het paneel zouden
    //   vallen worden tot de rand van het paneel ingekort.
    let DOCK_W = 0, dockIv = null, dockObs = null;
    function dockModus() {
        const de = doc.documentElement;
        if (!DOCK_W || !de.classList.contains('wt-dock')) { de.classList.remove('wt-dock-app'); herstelVast(); return; }
        if (!de.classList.contains('wt-dock-app')) {
            const sc = doc.scrollingElement || de;
            const app = sc.scrollHeight <= window.innerHeight + 40;
            if (app) { herstelVast(); de.classList.add('wt-dock-app'); }
        }
        if (!de.classList.contains('wt-dock-app')) pasVastAan();
        if (!dockIv) dockIv = setInterval(() => { try { if (!de.classList.contains('wt-dock-app')) pasVastAan(); } catch (e) {} }, 1500);
        if (!dockObs && doc.body) { dockObs = new MutationObserver(() => { clearTimeout(dockObs._t); dockObs._t = setTimeout(() => { try { if (DOCK_W && !de.classList.contains('wt-dock-app')) pasVastAan(); } catch (e) {} }, 60); }); dockObs.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open', 'aria-expanded'] }); }
    }
    function pasVastAan() {
        if (!DOCK_W || !doc.body) return;
        const grens = window.innerWidth - DOCK_W;
        const kandidaten = [];
        const loop = (el, d) => { for (const k of el.children) { if (k === host || k.id === 'wt-scraper-host') continue; kandidaten.push(k); if (d < 3) loop(k, d + 1); } };
        loop(doc.body, 0);
        kandidaten.forEach(el => {
            let cs; try { cs = getComputedStyle(el); } catch (e) { return; }
            if (cs.position !== 'fixed') return;
            const r = el.getBoundingClientRect(); if (!r.width || r.right <= grens + 1) return;
            if (!el.hasAttribute('data-wt-vast')) el.setAttribute('data-wt-vast', JSON.stringify({ right: el.style.getPropertyValue('right'), rp: el.style.getPropertyPriority('right'), left: el.style.getPropertyValue('left'), lp: el.style.getPropertyPriority('left'), maxWidth: el.style.getPropertyValue('max-width'), mp: el.style.getPropertyPriority('max-width') }));
            if (cs.right !== 'auto' && cs.left !== 'auto') el.style.setProperty('right', (DOCK_W + (parseFloat(cs.right) || 0)) + 'px', 'important');          // over de volle breedte → inkorten
            else if (cs.right !== 'auto') el.style.setProperty('right', (DOCK_W + (parseFloat(cs.right) || 0)) + 'px', 'important');                          // rechts vast → opschuiven
            else { el.style.setProperty('max-width', Math.max(120, grens - r.left) + 'px', 'important'); if (r.left + Math.min(r.width, 120) > grens) el.style.setProperty('left', Math.max(0, grens - r.width) + 'px', 'important'); }
        });
    }
    function herstelVast() {
        try { doc.querySelectorAll('[data-wt-vast]').forEach(el => { let o = {}; try { o = JSON.parse(el.getAttribute('data-wt-vast')); } catch (e) {} el.style.setProperty('right', o.right || '', o.rp || ''); el.style.setProperty('left', o.left || '', o.lp || ''); el.style.setProperty('max-width', o.maxWidth || '', o.mp || ''); el.removeAttribute('data-wt-vast'); }); } catch (e) {}
    }
    function undock() { doc.documentElement.classList.remove('wt-dock', 'wt-dock-app'); doc.documentElement.style.removeProperty('--wt-dock'); DOCK_W = 0; herstelVast(); clearInterval(dockIv); dockIv = null; try { if (dockObs) dockObs.disconnect(); } catch (e) {} dockObs = null; }
    let HUIDIGE_MAAT = 'groot';
    function applySize(m) {
        if (MATEN[m]) HUIDIGE_MAAT = m;
        const v = MATEN[m] || MATEN.groot;
        const w = Math.max(380, Math.min(v[0], window.innerWidth - 380));
        host.style.width = w + 'px'; setTimeout(dock, 0);
        const c = root.querySelector('.wt-card'); if (c) c.classList.toggle('wt-smal', w < 600);
        const card = root.querySelector('.wt-card'); if (card) card.style.setProperty('--z', String(v[1]));
        if ($('#wt-size')) $('#wt-size').value = MATEN[m] ? m : 'groot';
    }
    applySize('groot');
    // Venster kleiner/groter: paneel opnieuw passend maken (de pagina houdt altijd ruimte).
    let maatT = null; window.addEventListener('resize', () => { if (doc.documentElement.classList.contains('wt-nodock')) return; clearTimeout(maatT); maatT = setTimeout(() => { try { if (!$('.wt-body').classList.contains('wt-hidden')) applySize(HUIDIGE_MAAT); } catch (e) {} }, 150); });
    try { chrome.storage.local.get('pl-size', r => applySize(r && r['pl-size'])); } catch (e) {}
    $('#wt-size').onchange = function () { applySize(this.value); try { chrome.storage.local.set({ 'pl-size': this.value }); } catch (e) {} };

    // ---- Rondleiding (eerste keer, en via ? in de kop) ----
    const TOUR = [
        { t: 'Welkom bij ParseLab 👋', h: '<p>ParseLab doet het klikwerk in je browser voor je. Kies bovenin hoe je stappen maakt:</p><ol><li><b>⏺ Opnemen</b> — doe je taak één keer voor, ParseLab doet het na.</li><li><b>✋ Handmatig</b> — kies Invullen, Klikken of Uitlezen en wijs aan.</li><li><b>✨ AI</b> — vraag het in gewone taal.</li></ol><p>Alle drie vullen <b>dezelfde flow</b>; die staat er altijd onder, stap voor stap. Klik een stap om hem uit te klappen.</p>' },
        { t: '⏺ Opnemen in 3 stappen', h: '<ol><li>Klik op <b>Opname starten</b>.</li><li>Doe je taak gewoon: klikken, invullen, Enter.</li><li>Klik op <b>Stop</b>.</li></ol><p>Wat je typt wordt een kolom. Wil je het voor een hele lijst doen, dan komt die waarde per regel uit je Excel.</p>' },
        { t: '▶ Start en het logboek', h: '<p>Met <b>Start</b> bovenaan voert ParseLab de stappen uit. Bij elke stap maakt hij een schermafbeelding, met het element gemarkeerd.</p><p>Onder de flow (Logboek) kijk je alles terug en sla je een rapport op. Lukt een stap niet, dan gaat ParseLab terug naar het adres van die stap en probeert het opnieuw.</p>' },
        { t: '✨ AI helpt mee', h: '<p>Verandert een knop of veld een beetje, dan zoekt ParseLab hem zelf terug (zelfherstel). Je ziet in het logboek wat er is aangepast.</p><p>Met je eigen Claude-sleutel (optioneel, in ✨ AI) begrijpt ParseLab ook opdrachten in gewone taal.</p>' }
    ];
    let tourI = 0;
    function toonTour(i) {
        tourI = Math.max(0, Math.min(TOUR.length - 1, i || 0));
        const b = $('#wt-onboard'), s = TOUR[tourI];
        b.style.display = 'block';
        b.innerHTML = '<h3>' + s.t + '</h3>' + s.h + '<div class="dots">' + TOUR.map((_, k) => '<i class="' + (k === tourI ? 'on' : '') + '"></i>').join('') + '</div>' +
            '<div class="wt-row"><button class="wt-btn alt" data-tour="skip">Overslaan</button>' + (tourI > 0 ? '<button class="wt-btn alt" data-tour="prev">Vorige</button>' : '') +
            '<span style="flex:1"></span>' + (tourI < TOUR.length - 1 ? '<button class="wt-btn primary" data-tour="next">Volgende →</button>' : '<button class="wt-btn primary" data-tour="done">Aan de slag</button>') + '</div>';
        b.querySelectorAll('[data-tour]').forEach(k => k.onclick = () => {
            const a = k.dataset.tour;
            if (a === 'next') toonTour(tourI + 1); else if (a === 'prev') toonTour(tourI - 1);
            else { b.style.display = 'none'; b.innerHTML = ''; try { chrome.storage.local.set({ 'pl-onb': 1 }); } catch (e) {} }
        });
        try { b.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
    $('#wt-help').onclick = () => toonTour(0);
    $('#wt-tour').onclick = () => toonTour(0);


    // ================= ⏺ Opnemen: doe het één keer voor =================
    let OPNAME = false;
    function recRegel(t) { const l = $('#rec-lijst'); if (!l) return; const li = doc.createElement('li'); li.textContent = t; l.appendChild(li); li.scrollIntoView({ block: 'nearest' }); }
    async function opnameStart(hervat) {
        if (OPNAME) return;
        if (picking) endPick();
        OPNAME = true;
        recStart(op => recOp(op, null));
        kaderBericht({ type: 'pl-frames', cmd: 'recStart' });
        try { chrome.storage.local.set({ 'pl-rec': { aan: true, host: location.hostname, ts: Date.now() } }); } catch (e) {}
        if (!hervat) { const l = $('#rec-lijst'); if (l) l.innerHTML = ''; siteGrant(); }   // zodat de opname doorloopt na een paginawissel
        $('#rec-start').disabled = true; $('#rec-stop').disabled = false; $('#wt-recbadge').style.display = '';
        $('#rec-status').innerHTML = hervat ? '<b>● Opname loopt door op deze pagina.</b> Ga verder met je taak.' : '<b>● Opname loopt.</b> Doe je taak nu op de pagina. Klaar? Klik op <b>■ Stop opname</b>.';
        toonTab('rec');
        if (hervat) recRegel('📄 verder op: ' + kortUrl().slice(0, 50));
    }
    function opnameStop(stil) {
        if (!OPNAME) return;
        recStop(); kaderBericht({ type: 'pl-frames', cmd: 'recStop' });
        OPNAME = false;
        try { chrome.storage.local.remove('pl-rec'); } catch (e) {}
        $('#rec-start').disabled = false; $('#rec-stop').disabled = true; $('#wt-recbadge').style.display = 'none';
        const opg = steps.filter(x => x.opgenomen && !x.opnameKlaar);
        $('#rec-status').textContent = opg.length ? 'Opname klaar: ' + opg.length + ' stappen staan in de flow. Pas ze daar aan of klik op Start.' : 'Opname gestopt — er is niets opgenomen.';
        opg.forEach(x => x.opnameKlaar = true); persistNow();
        return;
        const velden = opg.filter(x => (x.type === 'setval' || x.type === 'select') && x.bron === 'vast');
        askInline({
            title: '✔ Opname klaar — ' + opg.length + ' stappen',
            html: '<div>ParseLab heeft je taak opgeslagen als stappen (zie de flow hieronder). Met <b>Start</b> doet hij het precies zo na.</div>' +
                (velden.length ? '<div style="margin-top:6px">Wil je het voor een <b>hele lijst</b> doen? Vink de velden aan die <b>per regel uit je Excel</b> moeten komen (de waarde van nu wordt de standaard):</div>' +
                    velden.map((x, i) => '<label class="row"><input type="checkbox" id="rv' + i + '"> ' + esc(x.col) + ' <span class="hint">(nu “' + esc(String(x.value).slice(0, 30)) + '”)</span></label>').join('') : ''),
            onRender: box => box.querySelectorAll('input[type=checkbox]').forEach(c => { c.value = ''; c.onchange = () => { c.value = c.checked ? '1' : ''; }; }),
            buttons: [
                { label: '▶ Nu afspelen', primary: true, fn: v => { perRegel(v); startFlow(); } },
                { label: 'Bekijk de stappen', fn: v => { perRegel(v); toonTab('flow'); } }
            ]
        });
        function perRegel(v) {
            let n = 0;
            velden.forEach((x, i) => { if (v && v['rv' + i] === '1') { x.standaard = x.value; x.bron = 'lijst'; x.value = '{{' + x.col + '}}'; x.detail = 'kolom “' + x.col + '” · per regel, standaard “' + x.standaard + '”' + (x.frame ? ' · in kader' : ''); n++; } });
            if (n) log('  ✔ ' + n + ' veld(en) komen nu per regel uit je lijst. Maak de Excel met “Maak mijn invullijst (Excel)” in ✋ Handmatig.', true);
            renderSteps(); renderFlow(); persist();
        }
    }
    // Eén opname → één stap. Typen in hetzelfde veld wordt samengevoegd.
    function recOp(op, fr) {
        const d = op.d || {}; const inK = fr ? ' · in kader' : '';
        if (op.soort === 'pdf') { addStep({ type: 'print', name: 'PDF opslaan', detail: 'opgenomen (Ctrl+P)', folderBy: '', fileBy: '', opgenomen: true }); recRegel('🖨 PDF opslaan (Ctrl+P)'); persistNow(); return; }
        if (op.soort === 'foto') { const v = steps[steps.length - 1]; if (v && v.type === 'shot' && v.opgenomen && Date.now() - (v.id_t || 0) < 1500) return; addStep({ type: 'shot', name: 'Schermafbeelding', detail: 'opgenomen (PrintScreen)', opgenomen: true, id_t: Date.now() }); recRegel('📸 Schermafbeelding'); persistNow(); return; }
        if (op.soort === 'dubbel') {
            const a = steps[steps.length - 1], b2 = steps[steps.length - 2];
            if (a && a.type === 'click' && a.opgenomen) { if (b2 && b2.type === 'click' && b2.opgenomen && b2.selector === a.selector) steps.splice(steps.length - 2, 1); a.dubbel = true; a.name = 'Dubbelklik: ' + String(a.name || '').replace(/^Klik op /, ''); const l = $('#rec-lijst'); if (l && l.lastChild) { if (l.lastChild.previousSibling && b2 && b2.selector === a.selector) l.lastChild.previousSibling.remove(); l.lastChild.textContent = '👆👆 ' + a.name; } renderSteps(); persistNow(); }
            return;
        }
        if (op.soort === 'klik') {
            const naam = String(d.naam || 'element').slice(0, 40);
            addStep({ type: 'click', name: 'Klik op “' + naam.slice(0, 22) + '”', selector: d.selector, fp: d.fp, positie: { pad: (d.positie && d.positie.pad) || d.selector }, strat: op.strat || d.strat, wachtNa: true, opgenomen: true, detail: 'opgenomen' + inK, frame: fr || undefined });
            recRegel('👆 Klik op “' + naam + '”' + inK);
        } else if (op.soort === 'invoer') {
            const vorige = steps[steps.length - 1];
            if (vorige && vorige.opgenomen && (vorige.type === 'setval' || vorige.type === 'select') && vorige.selector === d.selector && JSON.stringify(vorige.frame || null) === JSON.stringify(fr || null)) {
                if (!op.geheim) vorige.value = op.waarde; if (op.enter) vorige.enterNa = true;
                vorige.detail = 'kolom “' + vorige.col + '” · ' + (op.geheim ? 'wachtwoord: per regel' : 'opgenomen “' + String(op.waarde).slice(0, 30) + '”') + (vorige.enterNa ? ' + Enter' : '') + inK;
                const l = $('#rec-lijst'); if (l && l.lastChild) l.lastChild.textContent = '✎ ' + vorige.col + ' = “' + (op.geheim ? '••••' : String(op.waarde).slice(0, 30)) + '”' + (vorige.enterNa ? ' + Enter' : '');
                renderSteps(); persistNow(); return;
            }
            let col = lijstSpelling(cleanCol(d.col || 'Veld') || 'Veld'); const basis = col; let k = 2; while (kolomAlBij(col) >= 0) col = basis + ' ' + (k++);
            const type = d.soort === 'keuzelijst' ? 'select' : 'setval';
            addStep({ type, kind: d.soort, name: (type === 'select' ? 'Keuzelijst: ' : 'Veld: ') + col.slice(0, 22), selector: d.selector, fp: d.fp, strat: op.strat || d.strat, col,
                bron: op.geheim ? 'lijst' : 'vast', value: op.geheim ? '{{' + col + '}}' : op.waarde, enterNa: !!op.enter, opgenomen: true, frame: fr || undefined,
                detail: 'kolom “' + col + '” · ' + (op.geheim ? 'wachtwoord: per regel (niet opgeslagen)' : 'opgenomen “' + String(op.waarde).slice(0, 30) + '”') + (op.enter ? ' + Enter' : '') + inK });
            recRegel('✎ ' + col + ' = “' + (op.geheim ? '••••' : String(op.waarde).slice(0, 30)) + '”' + (op.enter ? ' + Enter' : '') + inK);
        }
        persistNow();
    }
    $('#rec-start').onclick = () => opnameStart(false);
    $('#rec-stop').onclick = () => opnameStop(false);
    try { chrome.storage.local.get('pl-rec', r => { const x = r && r['pl-rec']; if (x && x.aan && x.host === location.hostname && Date.now() - (x.ts || 0) < 3 * 3600 * 1000) setTimeout(() => opnameStart(true), 600); }); } catch (e) {}

    // ================= ✨ AI: instellingen + chat =================
    function laadAi() {
        try { chrome.storage.local.get(['pl-ai-key', 'pl-ai-model', 'pl-ai-volg'], r => {
            AI_SLEUTEL = !!(r && r['pl-ai-key']); AI_VOLG = !(r && r['pl-ai-volg'] === false);
            if ($('#ai-volg')) $('#ai-volg').checked = AI_VOLG;
            if (r && r['pl-ai-model'] && $('#ai-model')) $('#ai-model').value = r['pl-ai-model'];
            if ($('#ai-status')) $('#ai-status').textContent = AI_SLEUTEL ? '✔ sleutel opgeslagen' : 'geen sleutel';
            if ($('#ai-key')) $('#ai-key').placeholder = AI_SLEUTEL ? '•••••••• (opgeslagen — leeg laten om te bewaren)' : 'sk-ant-…';
        }); } catch (e) {}
    }
    laadAi();
    $('#ai-volg').onchange = function () { AI_VOLG = this.checked; try { chrome.storage.local.set({ 'pl-ai-volg': this.checked }); } catch (e) {} };
    $('#ai-save').onclick = function () {
        const k = $('#ai-key').value.trim(), m = $('#ai-model').value; const zet = { 'pl-ai-model': m }; if (k) zet['pl-ai-key'] = k;
        try { chrome.storage.local.set(zet, () => { $('#ai-key').value = ''; laadAi(); flash(this, '✔ opgeslagen'); }); } catch (e) {}
    };
    $('#ai-test').onclick = async function () {
        $('#ai-status').textContent = 'testen…';
        const r = await kaderBericht({ type: 'pl-llm', taak: 'test' });
        $('#ai-status').textContent = r && r.ok ? '✔ verbinding werkt' : '✗ ' + ((r && r.err) || 'geen verbinding');
    };
    // Chat met Claude: opdracht → voorgestelde stappen → jij keurt goed.
    // Dezelfde flow voor alle drie de modi: wat er is opgenomen, handmatig gemaakt of door de AI voorgesteld.
    function herkomst(s) { return s.opgenomen ? 'opgenomen' : s.viaAi ? 'AI' : 'handmatig'; }
    function flowVoorAi() {
        return steps.map((x, i) => ({ nr: i + 1, soort: x.type, naam: x.name || x.type, kolom: (x.type === 'setval' || x.type === 'select') ? invoerKolom(x) : (x.col || ''), bron: x.bron || '', uitleg: (x.type === 'setval' || x.type === 'select') ? invoerUitleg(x) : (x.detail || ''), pagina: x.page || '', herkomst: herkomst(x) }));
    }
    function renderAiContext() {
        const c = $('#ai-context'); if (!c) return;
        const n = { opgenomen: 0, handmatig: 0, AI: 0 }; steps.forEach(x => n[herkomst(x)]++);
        c.innerHTML = steps.length ? '🔗 De AI kent je flow: <b>' + steps.length + ' stappen</b> (' + n.opgenomen + ' opgenomen, ' + n.handmatig + ' handmatig, ' + n.AI + ' via AI)' + (flowRows.length ? ' en je lijst (' + flowRows.length + ' regels: ' + esc(csvCols().slice(0, 4).join(', ')) + ')' : '') + '. Nieuwe stappen komen er achteraan.'
            : '🔗 Nog geen stappen. Wat je opneemt of handmatig maakt, ziet de AI ook.';
    }
    async function aiChat(opdracht) {
        const k = kandidatenLijst(220);
        chatLog('… Claude denkt mee');
        const r = await kaderBericht({ type: 'pl-llm', taak: 'chat', opdracht, kandidaten: k.data, stappen: flowVoorAi(), lijst: { kolommen: csvCols(), regels: flowRows.length, voorbeeld: flowRows[0] || null }, waarden: waardeOpties().map(o => o.v + ' (' + o.bron + ')') });
        if (!r || !r.ok || !r.result) { chatLog('⚠ ' + ((r && r.err) || 'geen antwoord') + ' — ik probeer het met de vaste opdrachten.'); return false; }
        const v = r.result; if (v.uitleg) chatLog('✨ ' + v.uitleg);
        const st = (v.stappen || []).filter(x => x && x.actie);
        if (!st.length) { chatLog('Geen stappen voorgesteld.'); return true; }
        const box = $('#ai-voorstel');
        box.innerHTML = '<div class="voorstel"><b>Voorstel (' + st.length + ' stappen)</b><ol>' + st.map((x, i) => '<li data-v="' + i + '">' + esc(x.label || x.actie) + (k.els[x.element] ? ' <span class="hint">→ ' + esc((txt(k.els[x.element]) || k.els[x.element].tagName).slice(0, 30)) + '</span>' : '') + '</li>').join('') + '</ol>' +
            '<div class="wt-row"><button class="wt-btn primary" data-vok="1">✓ Toevoegen</button><button class="wt-btn alt" data-vnee="1">Annuleren</button></div><div class="hint">Wijs met de muis een stap aan om het element op de pagina te zien.</div></div>';
        box.querySelectorAll('[data-v]').forEach(li => li.onmouseenter = () => { const e = k.els[st[+li.dataset.v].element]; if (e) highlightEl(e); });
        box.querySelector('[data-vnee]').onclick = () => { box.innerHTML = ''; chatLog('✗ voorstel geannuleerd'); };
        box.querySelector('[data-vok]').onclick = () => { box.innerHTML = ''; let n = 0; st.forEach(x => { if (voegAiStapToe(x, k.els[x.element])) n++; }); chatLog('✔ ' + n + ' stap(pen) toegevoegd — zie de flow hieronder.'); };
        return true;
    }
    function voegAiStapToe(x, el) {
        const a = String(x.actie || '').toLowerCase();
        if (a === 'wachten') { addWaitStep(); return true; }
        if (a === 'pdf') { addStep({ type: 'print', name: x.label || 'PDF opslaan', detail: 'zoals Ctrl+P → Opslaan als PDF', folderBy: '', fileBy: '', viaAi: true }); return true; }
        if (a === 'hele_pagina') { addStep({ type: 'scrape', kind: 'pagina', name: x.label || 'Hele pagina uitlezen', detail: 'titel, koppen, alle velden, tabellen en links', viaAi: true }); return true; }
        if (a === 'terug') { addStep({ type: 'nav', mode: 'back', name: x.label || 'Terug naar vorige pagina', detail: 'zoals de terugknop van de browser' }); return true; }
        if (!el) return false;
        if (a === 'klik' || a === 'dubbelklik') { const dub = a === 'dubbelklik' || undefined; const d = beschrijfVoorStap(el, 'click'); if (d.gebied) { addStep({ type: 'click', dubbel: dub, name: x.label || 'Klik', selector: cssPath(el), fp: fingerprint(el), strat: maakStrat(el), positie: { pad: cssPath(el) }, detail: 'via AI', viaAi: true }); } else { vasteKnop(Object.assign(d, { naam: d.naam, dubbel: dub }), null); steps[steps.length - 1].viaAi = true; } return true; }
        if (a === 'uitlezen') { addElementScrape(el, x.kolom || ''); if (steps.length) steps[steps.length - 1].viaAi = true; return true; }
        if (a === 'invullen') {
            const d = beschrijfVoorStap(el, 'input'); if (!d.isVeld) return false;
            let col = lijstSpelling(cleanCol(x.kolom || d.col || 'Veld')); const basis = col; let k = 2; while (kolomAlBij(col) >= 0) col = basis + ' ' + (k++);
            const vast = String(x.waarde || '').trim(), bron = x.bron || (vast ? 'vast' : 'lijst');
            const st = { type: d.soort === 'keuzelijst' ? 'select' : 'setval', kind: d.soort, selector: d.selector, fp: d.fp, strat: d.strat, viaAi: true };
            const v = { 'wt-ask-col': col, 'wt-ask-bron': bron, 'wt-ask-in': bron === 'vast' ? vast : '' };
            if (bron === 'eerder') v['wt-ask-eerder'] = (waardeOpties().find(o => zelfdeNaam(o.v, vast)) || waardeOpties().filter(o => o.bron !== 'lijst')[0] || {}).v || vast;
            if (bron === 'oplopend') { const m = /^(\D*)(\d+)(\D*)$/.exec(vast); v['wt-ask-ovoor'] = m ? m[1] : ''; v['wt-ask-lstart'] = m ? m[2] : '1'; v['wt-ask-ona'] = m ? m[3] : ''; v['wt-ask-lstap'] = '1'; }
            if (bron === 'logica') { v['wt-ask-lsoort'] = 'formule'; v['wt-ask-lexpr'] = vast; }
            maakInvoer(st, v); st.detail += ' · via AI'; addStep(st);
            return true;
        }
        return false;
    }

    // ---- Begeleiding: fasebalk + "wat nu?" ----
    function draait() { try { return !!RUNNING; } catch (e) { return false; } }
    function renderCoach() {
        const c = $('#wt-coach'), ph = $('#wt-phases'); if (!c) return;
        const heeftLijstNodig = steps.some(s => s.type === 'fill' || ((s.type === 'setval' || s.type === 'select') && /\{\{/.test(s.value || '')));
        const fase = draait() ? 2 : (steps.length ? 1 : 0);
        ph.innerHTML = ['① Aanwijzen', '② Start', '③ Resultaat'].map((x, k) => '<span class="ph' + (k === fase ? ' on' : k < fase ? ' done' : '') + '">' + x + '</span>').join('');
        if (draait()) { c.innerHTML = '<div class="c-title">ParseLab is bezig…</div><div class="c-body">Laat dit tabblad open. Met <b>Pauze</b> of <b>Stop</b> kun je altijd ingrijpen.</div>'; return; }
        const li = openLusIdx();
        let h = '';
        if (!steps.length) {
            h = '<div class="c-title">Stap voor stap aanwijzen</div><div class="c-body">Kies hieronder wat er moet gebeuren en klik daarna op de pagina. Liever voordoen? Gebruik <b>⏺ Opnemen</b>.</div>';
        } else if (false) {
            h = '<div class="c-title">Wat wil je doen?</div><div class="c-body">Kies een doel. ParseLab leidt je er stap voor stap doorheen.</div>' +
                '<div class="goal-grid">' +
                '<button class="goal" data-goal="pdf"><b>📄 PDF per item</b><span>Voor elke klant of regel in een lijst een PDF in een eigen map.</span></button>' +
                '<button class="goal" data-goal="read"><b>🔎 Uitlezen naar Excel</b><span>Klik op een tekst of lijst en krijg alles in Excel.</span></button>' +
                '<button class="goal" data-goal="fill"><b>✎ Invullen vanuit Excel</b><span>Een formulier regel voor regel laten invullen.</span></button>' +
                '<button class="goal" data-goal="loop"><b>↻ Herhalen per item</b><span>Je eigen stappen voor elk item in een lijst.</span></button>' +
                '</div>';
        } else if (li >= 0) {
            const n = lusItems(steps[li].spec).length;
            h = '<div class="c-title">↻ Je bouwt een lus' + (n ? ' over ' + n + ' items' : '') + '</div><div class="c-body">Alles wat je nu toevoegt, gebeurt <b>bij elk item</b>. Wijs het aan bij het eerste item.' +
                (steps.length - 1 === li ? ' Begin bijvoorbeeld met <b>Ergens op klikken</b> om het item te openen.' : '') + '</div>' +
                '<div class="wt-row"><button class="wt-btn" data-coach="add">+ Stap per item</button><button class="wt-btn primary" data-coach="endloop">↺ Lus afsluiten</button></div>';
        } else if (heeftLijstNodig && !flowRows.length) {
            h = '<div class="c-title">Nog nodig: je lijst</div><div class="c-body">Je taak vult velden in vanuit een lijst. Upload je Excel- of CSV-bestand; elke regel wordt één ronde.</div>' +
                '<div class="wt-row"><button class="wt-btn primary" data-coach="upload">Lijst uploaden</button><button class="wt-btn alt" data-coach="tmpl">Maak een lege invullijst</button></div>';
        } else {
            const pdf = steps.find(s => s.type === 'print');
            h = '<div class="c-title">✓ Klaar om te starten</div><div class="c-body">Je taak heeft ' + steps.length + ' stappen' + (flowRows.length ? ' en draait voor ' + flowRows.length + ' regels' : '') + '.' +
                (pdf ? ' PDF’s komen in <b>Downloads/' + esc(currentFolder) + (pdf.folderBy ? '/&lt;' + esc(pdf.folderBy) + '&gt;' : '') + '</b>.' : '') + ' Nog iets toevoegen? Dat kan altijd.</div>' +
                '<div class="wt-row"><button class="wt-btn run" data-coach="start">▶ Start</button><button class="wt-btn" data-coach="add">+ Nog een stap</button></div>';
        }
        c.innerHTML = h;
        c.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => kiesDoel(b.dataset.goal));
        c.querySelectorAll('[data-coach]').forEach(b => b.onclick = () => {
            const a = b.dataset.coach;
            if (a === 'add') { const m = $('#flow-add-menu'); m.style.display = 'flex'; try { m.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
            else if (a === 'endloop') sluitLus();
            else if (a === 'upload') $('#flow-file').click();
            else if (a === 'tmpl') $('#flow-tmpl').click();
            else if (a === 'start') startFlow();
        });
    }
    function kiesDoel(g) {
        if (g === 'pdf' || g === 'loop') { startLusWizard(); return; }
        if (g === 'read') { askInline({ title: 'Uitlezen naar Excel', html: '<div>Klik op wat je wilt hebben: een tekst, een prijs, of <b>één regel van een lijst</b>. Bij een lijst vraagt ParseLab of je de hele lijst wilt.</div><div class="hint">Daarna: Start → Download bestand.</div>', buttons: [{ label: 'Aanwijzen →', primary: true, fn: () => addByKind('read') }, { label: t('cancel') }] }); return; }
        if (g === 'fill') { askInline({ title: 'Invullen vanuit Excel', html: '<div>① Open het formulier. ② Klik op <b>Velden ophalen</b>: ParseLab zoekt alle invulvelden. ③ Kies <b>Invullijst (Excel)</b>, vul hem in en upload hem. ④ Wijs de Opslaan-knop aan en klik Start.</div>', buttons: [{ label: 'Velden ophalen', primary: true, fn: () => $('#flow-scan').click() }, { label: t('cancel') }] }); }
    }

    // ---- Nieuwe pagina tijdens het bouwen: laten zien en makkelijk terug kunnen ----
    function opNieuwePagina(oud) {
        try { sessionStorage.setItem('pl-laatste-url', location.href); } catch (e) {}
        if (draait()) return;
        if (OPNAME) { recRegel('📄 nieuwe pagina: ' + kortUrl().slice(0, 50)); return; }
        const bar = $('#wt-pagebar'); if (!bar) return;
        const laatste = steps[steps.length - 1];
        const naKlik = laatste && laatste.type === 'click';
        const wachtNodig = laatste && laatste.type !== 'wait';
        bar.style.display = 'block';
        bar.innerHTML = '<b>📄 Je bent op een nieuwe pagina</b>' + (naKlik ? ' (na je klik op “' + esc((laatste.name || '').slice(0, 30)) + '”)' : '') + ': <code>' + esc(kortUrl().slice(0, 60)) + '</code>' +
            '<div class="hint">Stappen die je nu toevoegt, gebeuren op deze pagina.' + (wachtNodig && steps.length ? ' Tip: voeg eerst <b>Wachten tot de pagina klaar is</b> toe.' : '') + '</div>' +
            '<div class="wt-row">' + (wachtNodig && steps.length ? '<button class="wt-btn primary" data-pb="wait">+ Wachten</button>' : '') +
            '<button class="wt-btn" data-pb="back">↩ Terug naar vorige pagina</button>' +
            (steps.length ? '<button class="wt-btn alt" data-pb="addback">+ Stap: terug</button>' : '') +
            '<button class="wt-btn alt" data-pb="x">Sluiten</button></div>';
        bar.querySelectorAll('[data-pb]').forEach(b => b.onclick = () => {
            const a = b.dataset.pb;
            if (a === 'wait') { addWaitStep(); b.remove(); }
            else if (a === 'back') { if (oud && history.length < 2) gaNaar(oud); else history.back(); }
            else if (a === 'addback') { addStep({ type: 'nav', mode: openLusIdx() >= 0 ? 'loop' : 'back', name: openLusIdx() >= 0 ? 'Terug naar de lijst' : 'Terug naar vorige pagina', detail: 'zoals de terugknop van de browser' }); bar.style.display = 'none'; }
            else bar.style.display = 'none';
        });
    }
    let laatsteUrl = location.href;
    try { const vorige = sessionStorage.getItem('pl-laatste-url'); if (vorige && vorige !== location.href) setTimeout(() => opNieuwePagina(vorige), 400); sessionStorage.setItem('pl-laatste-url', location.href); } catch (e) {}
    const urlIv = setInterval(() => { if (location.href === laatsteUrl) return; const oud = laatsteUrl; laatsteUrl = location.href; opNieuwePagina(oud); }, 600);
    $('#wt-close').onclick = () => cleanup(true);
    $('#wt-min').onclick = () => { $('.wt-body').classList.toggle('wt-hidden'); dock(); };

    // ---- generieke pick op de echte pagina ----
    let picking = false, pickHandler = null, onPickEnd = null;
    const overlay = doc.createElement('div'); overlay.className = 'wt-ovl'; overlay.style.display = 'none';
    overlay.style.setProperty('pointer-events', 'none', 'important');
    const ovlLabel = doc.createElement('div'); ovlLabel.className = 'wt-ovl-label'; overlay.appendChild(ovlLabel);
    doc.body.appendChild(overlay);
    // De highlight-/aanwijs-box in de browser-top-layer (via popover), zodat hij óók boven
    // pagina-modals/overlays zichtbaar is. position:fixed → viewport-coördinaten (geen scroll).
    // Let op: de browser geeft elk popover-element zelf "inset:0; margin:auto" mee. Samen met
    // onze left/top/width/height is de box dan overbepaald en centreert de browser hem midden
    // in het venster — het kader stond dan honderden pixels naast het element waar je boven
    // zweefde. Daarom zetten we right/bottom/margin hier expliciet uit.
    function ovlShow(r) {
        overlay.style.position = 'fixed';
        overlay.style.right = 'auto'; overlay.style.bottom = 'auto'; overlay.style.margin = '0';
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
    // kind: wat er in een kader (iframe) wordt aangewezen ('click', 'read', 'input', 'any');
    // kaderHandler(desc, frame) maakt daar de stap van. Zonder kaderHandler kan het niet in een kader.
    let pickKind = null, pickKader = null;
    function kaderBericht(m) { return new Promise(res => { if (!IS_EXT) return res(null); try { chrome.runtime.sendMessage(m, r => { void chrome.runtime.lastError; res(r || null); }); } catch (e) { res(null); } }); }
    function beginPick(handler, hint, kind, kaderHandler) {
        picking = true; pickHandler = handler; laatsteDoel = null;
        pickKind = kind || 'any'; pickKader = kaderHandler || null;

        kaderBericht({ type: 'pl-frames', cmd: 'pickStart', kind: pickKind });
        try { doc.documentElement.classList.add('wt-picking'); } catch (_) {}
        try { root.querySelector('.wt-card').classList.add('wt-kies'); host.style.height = 'auto'; host.style.bottom = 'auto'; } catch (_) {}
        const h = $('#wt-pickhint'); h.textContent = (hint || 'Klik op de pagina') + ' — Esc annuleert'; h.style.display = 'block';
    }
    function endPick() { try { root.querySelector('.wt-card').classList.remove('wt-klein', 'wt-kies'); if (!$('.wt-body').classList.contains('wt-hidden')) { host.style.height = '100vh'; host.style.bottom = '0'; } } catch (e) {} if (picking) kaderBericht({ type: 'pl-frames', cmd: 'pickEnd' }); picking = false; pickHandler = null; pickKind = null; pickKader = null; laatsteDoel = null; try { doc.documentElement.classList.remove('wt-picking'); } catch (_) {} ovlHide(); $('#wt-pickhint').style.display = 'none'; if (typeof onPickEnd === 'function') { const f = onPickEnd; onPickEnd = null; setTimeout(f, 0); } }
    function kaderRef(url) { try { const u = new URL(url); return { url: u.origin + u.pathname, host: u.host }; } catch (e) { return { url: String(url || '') }; } }
    // Aangewezen in een kader (iframe): de helper daar stuurt een beschrijving van het element.
    window.__plKaderEvent = m => {
        if (m.ev === 'rec') { if (OPNAME && m.op) recOp(m.op, kaderRef(m.url)); return; }
        if (!picking) return;
        if (m.ev === 'cancel') { endPick(); return; }
        if (m.ev !== 'picked') return;
        const kh = pickKader; endPick();
        if (!m.desc || m.desc.fout) { log('  ⚠ Aanwijzen in het kader lukte niet' + (m.desc && m.desc.fout ? ': ' + m.desc.fout : '') + '.', true); return; }
        if (!kh) { log('  ⓘ Dit kan (nog) niet in een kader. Wijs iets in de buitenste pagina aan.', true); return; }
        kh(m.desc, kaderRef(m.url));
        log('  ✔ Aangewezen in het kader (' + (kaderRef(m.url).host || '') + ').', true);
    };
    // Kader-stappen maken.
    function kaderKlik(d, fr) { addStep({ type: 'click', name: (d.naam || 'knop').slice(0, 24), selector: d.selector, fp: d.fp, detail: (d.naam || 'knop').slice(0, 40) + ' · in kader', frame: fr }); }
    function kaderVeld(d, fr) {
        if (!d.isVeld) { log('  ⚠ Geen invoerveld herkend in het kader — klik precies op het veld of de keuzelijst.', true); return; }
        const type = d.soort === 'keuzelijst' ? 'select' : 'setval';
        addStep({ type, kind: d.soort, name: (d.soort === 'keuzelijst' ? 'Keuzelijst: ' : d.soort === 'datum' ? 'Datum: ' : 'Veld: ') + d.col.slice(0, 22), selector: d.selector, fp: d.fp, value: '{{' + d.col + '}}', detail: d.soort + ' · ' + d.col + ' · in kader', frame: fr });
        invoerSnel(steps[steps.length - 1], d.waarde || '');
    }
    function kaderAlgemeen(maak) { return (d, fr) => maak({ selector: d.selector, fp: d.fp, naam: d.naam, frame: fr }); }
    // Uitlezen: alleen dit, alle velden (label → waarde) of de hele lijst — in de pagina én in een kader.
    function leesKeuze(d, fr) {
        const inK = fr ? ' · in kader' : '';
        const voegEl = () => {
            const n = steps.filter(x => x.type === 'scrape' && x.kind === 'element').length + 1;
            const naam = d.label || (d.waarde || '').slice(0, 24) || 'waarde';
            addStep({ type: 'scrape', kind: 'element', name: naam, col: d.label || ('kolom' + n), selector: d.selector, fp: d.fp, attr: d.attr, detail: (d.waarde || '').slice(0, 40) + inK, frame: fr || undefined });
        };
        const pref = LEES_SOORT; LEES_SOORT = null;
        if (pref === 'el') { voegEl(); return; }
        if (pref === 'tabel' && d.det) { addStep({ type: 'scrape', kind: 'list', name: 'Tabel uitlezen', spec: d.det, detail: d.det.count + ' regels × ' + d.det.columns.length + ' kolommen' + inK, frame: fr || undefined }); if (!fr) maybeOfferScrollLoad(d.det); return; }
        if (pref === 'velden' && d.paren && d.paren.length > 1) { addStep({ type: 'scrape', kind: 'pairs', name: 'Alle velden', spec: d.pairSpec || d.det, detail: d.paren.length + ' velden: ' + d.paren.slice(0, 4).join(', ') + '…' + inK, frame: fr || undefined }); return; }
        if (pref === 'tabel' || pref === 'velden') log('  ⓘ Hier staat ' + (pref === 'tabel' ? 'geen tabel of lijst' : 'geen rij velden (label → waarde)') + ' rond wat je aanwees. Kies hieronder wat je wél wilt.', true);
        const opties = [{ label: 'Alleen dit' + (d.label ? ' (' + d.label + ')' : ''), fn: voegEl }];
        if (d.paren && d.paren.length > 1) opties.unshift({ label: 'Alle velden (' + d.paren.length + ')', primary: true, fn: () => addStep({ type: 'scrape', kind: 'pairs', name: 'Alle velden', spec: d.pairSpec || d.det, detail: d.paren.length + ' velden: ' + d.paren.slice(0, 4).join(', ') + '…' + inK, frame: fr || undefined }) });
        if (d.det) opties.push({ label: 'Hele lijst (' + d.det.count + ')', primary: !(d.paren && d.paren.length > 1), fn: () => { addStep({ type: 'scrape', kind: 'list', name: 'Lijst uitlezen', spec: d.det, detail: d.det.count + ' items × ' + d.det.columns.length + ' kolommen' + inK, frame: fr || undefined }); if (!fr) maybeOfferScrollLoad(d.det); } });
        if (opties.length === 1) { voegEl(); return; }
        opties.push({ label: t('cancel') });
        askInline({
            title: 'Wat wil je uitlezen?',
            html: '<div><b>Alleen dit:</b> ' + (d.label ? esc(d.label) + ' = ' : '') + '“' + esc((d.waarde || '').slice(0, 60)) + '”</div>' +
                (d.paren && d.paren.length > 1 ? '<div><b>Alle velden:</b> ' + d.paren.length + ' velden als één regel in Excel' + (d.parenVb ? '<br><span class="hint">bv. ' + esc(d.parenVb) + '</span>' : '') + '</div>' : '') +
                (d.det ? '<div><b>Hele lijst:</b> ' + d.det.count + ' items, ' + d.det.columns.length + ' kolommen' + (d.voorbeeld ? '<br><span class="hint">bv. ' + esc(d.voorbeeld) + '</span>' : '') + '</div>' : ''),
            buttons: opties
        });
    }
    function kaderOpdracht(cmd, step, ctx) { return kaderBericht({ type: 'pl-frame-cmd', cmd, frame: step.frame, step: JSON.parse(JSON.stringify(step)), ctx: ctx || {} }); }
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
    // Het paneel zit zelf in een shadow DOM, en de pagina kan dat ook doen. Daarom kijken we
    // naar het samengestelde pad van de gebeurtenis in plaats van alleen naar e.target.
    function isOurs(t, e) {
        if (!t) return false;
        try { if (e && e.composedPath) { const pad = e.composedPath(); if (pad.indexOf(host) >= 0 || pad.indexOf(overlay) >= 0) return true; } } catch (_) {}
        return t === host || host.contains(t) || t === overlay || overlay.contains(t) || (t.className && String(t.className).indexOf('wt-') === 0);
    }
    // Tijdens het aanwijzen één vaste cursor (vizier), zodat hij niet heen en weer springt
    // tussen het handje van de pagina en de pijl.
    const pickCss = doc.createElement('style'); pickCss.className = 'wt-pickcss';
    pickCss.textContent = 'html.wt-picking, html.wt-picking * { cursor: crosshair !important; }';
    (doc.head || doc.documentElement).appendChild(pickCss);
    // Het element onder de muis dat NIET van ons is, ook in webcomponenten.
    function doelOnderMuis(e) {
        let t = echtDoel(e);
        if (t && !isOurs(t, e)) return t;
        let lijst = []; try { lijst = doc.elementsFromPoint(e.clientX, e.clientY); } catch (_) {}
        for (const k of lijst) {
            if (k === host || k === overlay || host.contains(k) || overlay.contains(k) || (typeof k.className === 'string' && k.className.indexOf('wt-') === 0)) continue;
            let d = k;   // in een webcomponent afdalen naar het diepste element op dat punt
            for (let i = 0; i < 6 && d && d.shadowRoot; i++) { let z = null; try { z = d.shadowRoot.elementFromPoint(e.clientX, e.clientY); } catch (_) {} if (!z || z === d) break; d = z; }
            return d;
        }
        return null;
    }
    let laatsteDoel = null;
    doc.addEventListener('mousemove', e => {
        if (!picking) return;
        const t = doelOnderMuis(e);
        if (!t) { if (laatsteDoel) { ovlHide(); laatsteDoel = null; } return; }
        if (t === laatsteDoel && overlay.style.display !== 'none') return;   // niets veranderd → niet opnieuw tekenen
        laatsteDoel = t;
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
        if (isOurs(echtDoel(e), e)) return;
        e.preventDefault(); e.stopPropagation();
    }, true));
    doc.addEventListener('click', e => {
        if (!picking || !e.isTrusted) return;
        if (isOurs(echtDoel(e), e)) return;
        const t = doelOnderMuis(e); if (!t) return;
        e.preventDefault(); e.stopPropagation();
        const h = pickHandler; endPick(); if (h) h(t);
    }, true);
    doc.addEventListener('keydown', e => { if (e.key === 'Escape' && picking) endPick(); }, true);

    // ---- flow-model ----
    let steps = [];        // {id,type:'scrape'|'fill'|'click'|'wait', ...}
    let stepSeq = 1;
    let flowRows = [];     // uit CSV
    let results = [], running = false, stopReq = false, pauseReq = false;
    let RUN_ST = null, runBase = 'ParseLab';   // lopende ronde (voor lus/terug-stappen) en de basismap

    function fieldColName(el, fallbackIdx) {
        const lbl = cleanCol(fieldLabel(el));
        if (lbl && !looksGenerated(lbl) && !isMaskLike(lbl)) return lbl;
        const nm = el.name && !looksGenerated(el.name) ? cleanCol(el.name) : '';
        return nm || ('veld' + fallbackIdx);
    }
    // Bestandsnaam uit een sjabloon: vaste tekst (bv. "personenauto") en/of {{kolom}}.
    // Alleen kolommen en allemaal leeg → '' (dan valt de stap terug op de automatische naam).
    function naamUitSjabloon(tpl, waarde) {
        let toks = 0, gevuld = 0;
        const uit = String(tpl || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, k) => { toks++; const v = String(waarde(k) || '').trim(); if (v) gevuld++; return v; });
        const vast = String(tpl || '').replace(/\{\{[^}]*\}\}/g, '').replace(/[\s\-_.,]+/g, '');
        if (toks && !gevuld && !vast) return '';
        return uit.replace(/\s+/g, ' ').replace(/^[\s\-_.,]+|[\s\-_.,]+$/g, '').trim();
    }
    function kortUrl(u) { try { const x = new URL(u || location.href); return (x.pathname + x.search + x.hash) || '/'; } catch (e) { return String(u || ''); } }
    // Index van de binnenste lus die nog niet is afgesloten (-1 = geen).
    function openLusIdx(tot) {
        const open = []; const n = tot == null ? steps.length : tot;
        for (let i = 0; i < n; i++) { if (isLusStart(steps[i])) open.push(i); else if (steps[i].type === 'endloop') open.pop(); }
        return open.length ? open[open.length - 1] : -1;
    }
    function lusKoppel(step, at) {
        if (!step.selector || isLusStart(step) || !steps[openLusIdx(at)] || !steps[openLusIdx(at)].spec) return;
        const li = openLusIdx(at); if (li < 0) return;
        let el = null; try { el = qs(step.selector); } catch (_) {}
        if (!el) return;
        const item = itemVan(el, steps[li].spec); if (!item) return;
        const rp = relPath(el, item); if (!rp) return;
        step.rel = rp; step.detail = (step.detail || step.name || '') + ' · in elk item';
    }
    function addStep(step) {
        step.id = stepSeq++; if (step.rep == null) step.rep = 1;
        if (VERVANG != null && steps[VERVANG]) {   // een bestaande stap omzetten (bv. vaste knop → knop met waarde)
            const oud = steps[VERVANG]; step.page = oud.page; step.pageUrl = oud.pageUrl; steps.splice(VERVANG, 1, step); VERVANG = null;
            renderSteps(); renderFlow(); persist(); return;
        }
        if (!step.page) { step.page = paginaSleutel(step.frame); step.pageUrl = location.href; }
        lusKoppel(step);
        steps.push(step); renderSteps(); renderFlow(); persist();
        toastStap(step);
    }
    function toastStap(step) {
        try {
            if (typeof HUIDIGE_TAB === 'undefined' || OPNAME) return;
            const t = $('#wt-toast'); if (!t) return;
            t.style.display = 'block';
            t.innerHTML = '✔ Stap ' + steps.length + ' toegevoegd: <b>' + esc(step.name || step.type) + '</b> · <a data-naarflow="1">bekijk in de flow ↓</a>';
            t.querySelector('[data-naarflow]').onclick = () => toonTab('flow');
        } catch (e) {}
    }
    // Welke "pagina" is dit? Het adres, plus de hoofdkop als een web-app van scherm wisselt zonder
    // ander adres; stappen in een kader horen bij het adres van dat kader.
    function schermKop() {
        try { const h = Array.from(doc.querySelectorAll('h1,[role="heading"][aria-level="1"]')).find(e => !vanOnsZelf(e) && zichtbaarEl(e)); return h ? txt(h).replace(/\s+/g, ' ').slice(0, 40) : ''; } catch (e) { return ''; }
    }
    function paginaSleutel(fr) {
        if (fr && fr.url) return 'kader ' + kortUrl(fr.url);
        const k = schermKop(); return kortUrl() + (k ? ' · ' + k : '');
    }
    function insertStep(idx, step) { step.id = stepSeq++; if (step.rep == null) step.rep = 1; if (!step.page) { step.page = paginaSleutel(step.frame); step.pageUrl = location.href; } lusKoppel(step, idx); steps.splice(idx, 0, step); renderSteps(); renderFlow(); persist(); }

    // Inline vraag in het paneel (geen browser-popup): titel, uitleg, knoppen.
    let HUIDIGE_TAB = 'rec';
    function toonTab(n) {
        if (n === 'flow') { const t = $('#wt-toast'); if (t) t.style.display = 'none'; const f = $('#tab-flow'); if (f) try { f.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {} return; }
        if (['rec', 'hand', 'ai'].indexOf(n) < 0) n = 'rec';
        HUIDIGE_TAB = n;
        $all('.wt-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === n));
        ['rec', 'hand', 'ai'].forEach(k => { const p = $('#tab-' + k); if (p) p.style.display = k === n ? '' : 'none'; });
        try { localStorage.setItem('pl-tab', n); } catch (e) {}
    }
    $all('.wt-tab').forEach(b => b.onclick = () => toonTab(b.dataset.tab));
    setTimeout(() => { let t = null; try { t = localStorage.getItem('pl-tab'); } catch (e) {} toonTab(t && t !== 'flow' ? t : (steps.length ? 'hand' : 'rec')); }, 0);
    function askInline(o) {
        const box = $('#wt-ask'); if (!box) return;
        box.style.display = 'block';
        box.innerHTML = '<div class="ask-title">' + esc(o.title || '') + '</div>' + (o.html ? '<div class="ask-body">' + o.html + '</div>' : '') +
            '<div class="wt-row ask-btns">' + (o.buttons || []).map((b, i) => '<button class="wt-btn' + (b.primary ? ' primary' : ' alt') + '" data-ask="' + i + '">' + esc(b.label) + '</button>').join('') + '</div>';
        box.querySelectorAll('[data-ask]').forEach(btn => btn.onclick = () => {
            const b = o.buttons[+btn.dataset.ask], vals = {};
            box.querySelectorAll('input,select,textarea').forEach(i => { if (i.id) vals[i.id] = i.value; else if (i.type === 'radio' && i.checked && i.name) vals[i.name] = i.value; });
            if (b && typeof b.check === 'function') {
                const fout = b.check(vals);
                if (fout) { let m = box.querySelector('.ask-fout'); if (!m) { m = doc.createElement('div'); m.className = 'ask-fout'; box.querySelector('.ask-btns').before(m); } m.textContent = '⚠ ' + fout; return; }
            }
            if (!b || !b.fn) VERVANG = null;
            box.style.display = 'none'; box.innerHTML = ''; if (b && b.fn) b.fn(vals);
        });
        if (typeof o.onRender === 'function') { try { o.onRender(box); } catch (e) {} }
        const eerste = box.querySelector('input'); if (eerste) setTimeout(() => { try { eerste.focus(); } catch (e) {} }, 50);
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
        invoerSnel(steps[steps.length - 1], readValue(f, 'auto'));
    }
    // Dropdown: lees de keuzes uit (native <select> of een popup-lijst), en kies daarna
    // een standaardkeuze of een kolom uit je lijst.
    async function dropdownOpties(f) {
        if (f.tagName === 'SELECT') return Array.from(f.options).filter(o => o.value !== '' && !o.disabled).map(o => txt(o)).filter(Boolean);
        let opts = [];
        try {
            f.focus(); klikReeks(f);
            for (let i = 0; i < 10 && !opts.length; i++) { await sleep(150); opts = zichtbareOpties(f); }
            opts = opts.map(o => (o.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
            ['keydown', 'keyup'].forEach(n => f.dispatchEvent(new KeyboardEvent(n, { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, composed: true })));
            await sleep(100);
            if (zichtbareOpties(f).length) klikReeks(f);   // nog open → nog eens klikken sluit hem
        } catch (e) {}
        return Array.from(new Set(opts)).slice(0, 200);
    }
    async function dropdownStap(el) {
        const f = resolveField(el);
        if (!f || !f.matches || !f.matches(FIELD_SEL)) { log('  ⚠ Geen dropdown herkend — klik precies op de keuzelijst.', true); return; }
        const opties = await dropdownOpties(f);
        const nu = readValue(f, 'auto') || '';
        const label = cleanCol(fieldLabel(f)) || 'Keuze';
        const cols = csvCols();
        const kolVoorstel = cols.find(c => zelfdeNaam(c, label)) || cols.find(c => kolomAlBij(c) < 0) || cols[0] || '';
        const o = (v, t, sel) => '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
        const maak = (bron, waarde) => {
            const col = bron === 'lijst' ? waarde : label;
            const st = { type: 'select', kind: 'keuzelijst', selector: stableSel(f), fp: fingerprint(f), opties, bron, col, value: bron === 'lijst' ? '{{' + waarde + '}}' : waarde };
            st.name = 'Dropdown: ' + (bron === 'lijst' ? waarde : label + ' = ' + waarde).slice(0, 26);
            st.detail = (bron === 'lijst' ? 'kolom “' + waarde + '”' : 'standaard “' + waarde + '”') + (opties.length ? ' · ' + opties.length + ' keuzes' : '');
            addStep(st);
        };
        askInline({
            title: 'Dropdown' + (label ? ': ' + label : ''),
            html: '<label class="kk-rij"><input type="radio" name="dd" value="vast"' + (cols.length && kolVoorstel && zelfdeNaam(kolVoorstel, label) ? '' : ' checked') + '><b>Standaard</b>' +
                    (opties.length ? '<select id="dd-vast" class="wt-num" style="width:100%">' + opties.map(x => o(x, x, x === nu)).join('') + '</select>'
                        : '<input id="dd-vast" class="wt-num" style="width:100%" placeholder="keuze" value="' + esc(nu) + '">') + '</label>' +
                '<label class="kk-rij"><input type="radio" name="dd" value="lijst"' + (cols.length && kolVoorstel && zelfdeNaam(kolVoorstel, label) ? ' checked' : '') + (cols.length ? '' : ' disabled') + '><b>Uit kolom</b>' +
                    (cols.length ? '<select id="dd-kol" class="wt-num" style="width:100%">' + cols.map(c => o(c, c, c === kolVoorstel)).join('') + '</select>' : '<span class="fex">upload eerst je lijst</span>') + '</label>',
            onRender: box => { box.querySelectorAll('#dd-vast,#dd-kol').forEach(x => x.addEventListener('change', () => { const r = box.querySelector('input[name=dd][value="' + (x.id === 'dd-kol' ? 'lijst' : 'vast') + '"]'); if (r && !r.disabled) r.checked = true; })); },
            buttons: [{ label: 'Toevoegen', primary: true, check: v => (v.dd === 'lijst' ? v['dd-kol'] : String(v['dd-vast'] || '').trim()) ? '' : 'Kies een waarde',
                fn: v => maak(v.dd === 'lijst' ? 'lijst' : 'vast', v.dd === 'lijst' ? v['dd-kol'] : String(v['dd-vast']).trim()) }, { label: t('cancel') }]
        });
    }
    function addFormStep(cont) {
        const form = cont.tagName === 'FORM' ? cont : cont;
        const colmap = buildColumnMap(readFormFieldsIn(form));
        const st = { type: 'fill', name: 'Formulier invullen', selector: cssPath(form), colmap };
        updateFillDetail(st); addStep(st);
    }
    // ---- Klikken: één knop → meteen toevoegen (vaste plek); een gebied → vragen wat je bedoelt ----
    let VERVANG = null;   // index van een stap die door de volgende addStep wordt vervangen
    function vasteKnop(d, fr) {
        addStep({ type: 'click', dubbel: d.dubbel || undefined, name: (d.dubbel ? 'Dubbelklik: ' : '') + (d.naam || 'knop').slice(0, 24), selector: d.selector, fp: d.fp, groep: d.groep, positie: d.positie || {}, detail: (d.naam || 'knop').slice(0, 30) + ' · vaste plek' + (fr ? ' · in kader' : ''), frame: fr || undefined });
    }
    function klikGekozen(d, fr) {
        if (!d) return;
        if (!d.gebied) { vasteKnop(d, fr); log('  ✔ Knop “' + (d.naam || '') + '” toegevoegd (altijd deze knop op deze plek, wat er ook op staat). Bij de stap kun je hem aan een waarde koppelen.', true); return; }
        knopKeuze(d, fr);
    }
    // Eén scherm: de waarden in het gebied (bv. polisnummers), kies er een of laat een kolom kiezen.
    function knopKeuze(d, fr) {
        const ks = d.knoppen || [], label = (ks.find(k => k.label) || {}).label || 'Waarde';
        const kols = waardeOpties().map(o => o.v);
        const o = (v, t, sel) => '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
        askInline({
            title: d.n + ' items in dit gebied',
            html: '<div class="kk-lijst">' + ks.map((k, i) => '<label class="kk-rij"><input type="radio" name="kk" value="' + i + '"' + (i ? '' : ' checked') + '><b>' + esc(k.waarde || k.naam) + '</b><span>' + esc([k.titel, k.label].filter(Boolean).join(' · ') || k.naam) + '</span></label>').join('') + '</div>' +
                '<label class="kol">Welke klikken?<select id="kk-hoe" class="wt-num" style="width:100%">' + o('vast', 'Altijd het gekozen item') +
                kols.map(c => o('kolom:' + c, 'Het item met de waarde uit “' + c + '”')).join('') +
                o('lijst', 'Elke ronde een volgend item (lijst van deze ' + ks.length + ' waarden)') + o('loop', 'Elk item één voor één, binnen één ronde') + o('regel', 'Via een regel') + '</select></label>',
            onRender: box => { box.querySelectorAll('.kk-rij').forEach(r => r.onmouseenter = () => { try { const k = ks[+r.querySelector('input').value]; const el = qs(k.selector); if (el) highlightEl(el); } catch (e) {} }); },
            buttons: [{ label: 'Toevoegen', primary: true, fn: v => {
                const keuze = v['kk-hoe'] || 'vast', i = +v.kk || 0;
                const gebiedD = Object.assign({}, d, { naam: 'gebied', groep: { binnen: d.gebiedSel, alles: true } });
                if (keuze === 'loop') return loopKlikVan(d, fr);
                if (keuze === 'regel') return regelVanGebied(d, fr);
                if (/^kolom:/.test(keuze)) return klikKlaar(gebiedD, fr, { bron: 'kolom', col: keuze.slice(6), hoe: 'bevat' });
                if (keuze === 'lijst') {
                    let col = label || 'Waarde'; if (csvCols().some(c => zelfdeNaam(c, col)) && flowRows.some(r => r[col])) col = col + ' 2';
                    const waarden = ks.map(k => k.waarde || k.naam);
                    if (!flowRows.length) flowRows = waarden.map(w => ({ [col]: w })); else { waarden.forEach((w, j) => { if (!flowRows[j]) flowRows[j] = {}; flowRows[j][col] = w; }); }
                    saveRows(); showCsvInfo();
                    return klikKlaar(gebiedD, fr, { bron: 'kolom', col, hoe: 'bevat' });
                }
                const k = ks[i]; vasteKnop(Object.assign({}, k, { naam: (k.waarde || k.naam), groep: Object.assign({}, k.groep, { sig: d.groep.sig }) }), fr);
            } }, { label: t('cancel') }]
        });
    }
    function _oudeGebiedVraag(d, fr) {
        const knoppen = d.knoppen.map((k, n) => ({ label: (n + 1) + '. ' + (k.naam || 'knop') + (k.regel && k.regel !== k.naam ? ' — ' + k.regel : ''), fn: () => vasteKnop(Object.assign({}, k, { groep: Object.assign({}, k.groep, { sig: d.groep.sig }) }), fr) }));
        askInline({
            title: 'Welke knop wil je aanklikken?',
            html: '<div>In dit gebied staan <b>' + d.n + ' knoppen/links</b>. Kies er één, of laat ParseLab in het hele gebied werken.</div>',
            buttons: knoppen.concat([
                { label: '🔎 Zoek een waarde in dit gebied en klik erop →', primary: true, fn: () => klikBron(Object.assign({}, d, { naam: 'gebied', groep: { binnen: d.gebiedSel, alles: true } }), fr) },
                { label: '↻ Elk item in dit gebied één voor één (lijst aflopen) →', primary: true, fn: () => loopKlikVan(d, fr) },
                { label: '🧮 Kies de knop met een regel →', fn: () => regelVanGebied(d, fr) },
                { label: t('cancel') }
            ])
        });
    }
    // ---- Knop kiezen met een regel: in een gebied met meerdere knoppen kiest een regel welke ----
    const OPS = [['is', 'is'], ['nietis', 'is niet'], ['bevat', 'bevat'], ['leeg', 'is leeg'], ['nietleeg', 'is niet leeg'], ['groter', 'groter dan'], ['kleiner', 'kleiner dan']];
    function regelVraag(info, fr, oud) {
        const R = (oud && oud.regelKeuze) || { regels: [], anders: -1 };
        const kols = waardeOpties(oud ? steps.indexOf(oud) : null).map(o => o.v).concat(['ronde']);
        const o = (v, cur, t) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
        const knopSel = (id, cur, leeg) => '<select id="' + id + '" class="wt-num" style="width:auto;max-width:150px">' + (leeg ? o(-1, cur, leeg) : '') + info.namen.map((n, k) => o(k, cur, (k + 1) + '. ' + String(n).slice(0, 22))).join('') + '</select>';
        const regel = k => { const x = R.regels[k] || {}; return '<div class="regelrij"><span>als</span><select id="rg-kol' + k + '" class="wt-num" style="width:auto;max-width:110px">' + o('', x.kol || '', '—') + kols.map(v => o(v, x.kol || '', v)).join('') + '</select>' +
            '<select id="rg-op' + k + '" class="wt-num" style="width:auto">' + OPS.map(y => o(y[0], x.op || 'is', y[1])).join('') + '</select><input id="rg-w' + k + '" class="wt-num" style="width:80px" value="' + esc(x.waarde || '') + '" placeholder="waarde">' +
            '<span>→ klik</span>' + knopSel('rg-k' + k, x.knop != null ? x.knop : k) + '</div>'; };
        askInline({
            title: '🧮 Welke knop? Laat een regel kiezen',
            html: '<div>In dit gebied staan <b>' + info.namen.length + ' knoppen</b>: ' + info.namen.map((n, k) => (k + 1) + '. ' + esc(String(n).slice(0, 20))).join(' · ') + '</div>' +
                '<div class="hint">De eerste regel die klopt, bepaalt de knop. Gebruik een kolom uit je lijst, een uitgelezen waarde of “ronde”.</div>' +
                [0, 1, 2].map(regel).join('') + '<div class="regelrij"><span>anders →</span>' + knopSel('rg-anders', R.anders != null ? R.anders : -1, 'niets klikken') + '</div><div class="vooruit" id="rg-vb"></div>',
            onRender: box => {
                const lees = () => { const v = {}; box.querySelectorAll('select,input').forEach(x => { if (x.id) v[x.id] = x.value; }); return maakRegel(v); };
                const toon = () => { const e = box.querySelector('#rg-vb'); if (!e) return; const RR = lees(); const n = Math.min(3, Math.max(1, flowRows.length));
                    e.innerHTML = '<b>Vooruitblik</b> · ' + Array.from({ length: n }, (_, k) => { const nr = regelKnop(RR, voorbeeldCtx(k + 1, oud ? steps.indexOf(oud) : steps.length)); return 'ronde ' + (k + 1) + ': ' + (nr >= 0 ? 'knop ' + (nr + 1) + ' “' + esc(String(info.namen[nr] || '').slice(0, 18)) + '”' : '<i>niets</i>'); }).join(' · '); };
                const lijf = box.querySelector('.ask-body') || box; lijf.addEventListener('change', toon); lijf.addEventListener('input', toon); toon();
            },
            buttons: [{ label: 'Opslaan ✓', primary: true, check: v => maakRegel(v).regels.length ? '' : 'Vul minstens één regel in (kies een kolom).',
                fn: v => {
                    const RR = maakRegel(v);
                    const st = { type: 'click', name: 'Knop kiezen met regel', regelKeuze: RR, frame: fr || undefined, wachtNa: true,
                        detail: RR.regels.map(x => (x.kol + ' ' + (OPS.find(y => y[0] === x.op) || [0, x.op])[1] + (/leeg/.test(x.op) ? '' : ' ' + x.waarde) + ' → ' + (x.knop + 1))).join('; ') + (RR.anders >= 0 ? '; anders → ' + (RR.anders + 1) : '') + (fr ? ' · in kader' : '') };
                    if (oud) { const i = steps.indexOf(oud); st.id = oud.id; st.page = oud.page; st.pageUrl = oud.pageUrl; st.rep = oud.rep || 1; if (i >= 0) steps[i] = st; renderSteps(); renderFlow(); persist(); } else addStep(st);
                } }, { label: t('cancel') }]
        });
        function maakRegel(v) {
            const regels = [0, 1, 2].map(k => ({ kol: v['rg-kol' + k] || '', op: v['rg-op' + k] || 'is', waarde: v['rg-w' + k] || '', knop: +v['rg-k' + k] || 0 })).filter(x => x.kol);
            return { gebied: info.gebied, sig: info.sig, namen: info.namen, regels, anders: v['rg-anders'] == null ? -1 : +v['rg-anders'] };
        }
    }
    async function regelVanGebied(d, fr, oud) {
        const g = d.groep || {}; const gebied = g.binnen || d.gebiedSel, sig = g.sig;
        let namen = (d.knoppen || []).map(k => k.naam || 'knop');
        if (!fr && gebied) { const items = gebiedItems({ binnen: gebied, sig }); if (items.length) namen = items.map(x => itemNaam(x) || knopTekst(x) || 'knop'); }
        if (namen.length < 2) { log('  ⓘ Hier staat maar één knop. Wijs een gebied aan met meerdere knoppen.', true); return; }
        regelVraag({ gebied, sig, namen }, fr, oud || null);
    }
    async function regelKlik(s, row, extraCtx) {
        const R = s.regelKeuze, ctx = metVast(Object.assign({}, row || {}, extraCtx || {}));
        const nr = regelKnop(R, ctx);
        if (nr < 0) { log('  ↷ ' + s.name + ': geen regel klopt → niets geklikt'); return { ok: true }; }
        const naam = R.namen[nr] || ('knop ' + (nr + 1));
        if (s.frame) {
            const r = await gebiedKlik({ gebied: R.gebied, sig: R.sig, frame: s.frame }, nr);
            if (!r || r.ok === false) { log('  ⚠ ' + s.name + ': knop ' + (nr + 1) + ' niet gevonden (kader)'); return { ok: false }; }
        } else {
            let items = gebiedItems({ binnen: R.gebied, sig: R.sig });
            for (const t0 = Date.now(); !items.length && Date.now() - t0 < 5000; ) { await sleep(250); items = gebiedItems({ binnen: R.gebied, sig: R.sig }); }
            const el = items.find(x => normTekst(itemNaam(x) || knopTekst(x)) === normTekst(naam)) || items[nr];
            if (!el) { log('  ⚠ ' + s.name + ': knop ' + (nr + 1) + ' niet gevonden'); return { ok: false }; }
            klikStap(s, knopRond(el));
        }
        log('  👆 ' + s.name + ': knop ' + (nr + 1) + ' “' + String(naam).slice(0, 30) + '”');
        await sleep(300); if (s.wachtNa) { await sleep(300); await waitForIdle(6000); }
        return { ok: true };
    }
    // ---- Klikken met uitleg: vaste knop, of de knop die past bij een waarde ----
    function klikVraag(d, fr) {
        const inK = fr ? ' · in kader' : '';
        const vast = () => addStep({ type: 'click', name: (d.naam || 'knop').slice(0, 24), selector: d.selector, fp: d.fp, detail: (d.naam || 'knop').slice(0, 40) + inK, frame: fr || undefined });
        const meer = d.groepN > 1;
        askInline({
            title: 'Welke knop moet ParseLab indrukken? · stap 1 van 4',
            html: '<div>Je wees <b>“' + esc(d.naam || 'knop') + '”</b> aan.</div>' +
                (meer ? '<div class="hint">Op deze plek staan ' + d.groepN + ' vergelijkbare knoppen: ' + esc(d.groepTeksten.join(' · ')) + '</div>' : '') +
                '<div>Is het <b>altijd deze knop</b>, of de knop waarvan de tekst past bij een <b>waarde</b> (bv. het klantnummer uit je lijst of uit een invoerveld)?</div>',
            buttons: [
                { label: 'Altijd deze knop', primary: !meer, fn: vast },
                { label: 'De knop die past bij een waarde →', primary: meer, fn: () => klikWaar(d, fr) },
                { label: '↻ Elk item hier één voor één (lijst aflopen)', fn: () => loopKlikVan(d, fr) },
                { label: t('cancel') }
            ]
        });
    }
    // Waar zoeken: bij knoppen zoals deze, of in een gebied dat je aanwijst (bv. de verzekeringen onderaan).
    function klikWaar(d, fr) {
        askInline({
            title: 'Waar moet ParseLab de waarde zoeken? · stap 2 van 4',
            html: '<div>ParseLab zoekt de <b>tekst met de waarde</b> (niet een bepaalde knop) en klikt daarop, of op de klikbare plek eromheen (de regel, link of knop waar de tekst in staat).</div>' +
                  '<div class="hint"><b>Op de hele pagina</b>, of alleen <b>in een gebied</b> dat je aanwijst — handig als dezelfde tekst ook ergens anders staat.</div>',
            buttons: [
                { label: 'Op de hele pagina' + (fr ? ' (in het kader)' : ''), primary: true, fn: () => klikBron(Object.assign({}, d, { groep: { binnen: '' } }), fr) },
                { label: 'In een gebied dat ik aanwijs →', fn: () => beginPick(el => { const g = beschrijfVoorStap(el, 'gebied'); gebiedGekozen(d, fr, g, null); }, 'Klik in het gebied waarin gezocht moet worden (bv. de lijst onderaan)', 'gebied', (g, gfr) => gebiedGekozen(d, fr, g, gfr)) },
                { label: t('cancel') }
            ]
        });
    }
    function gebiedGekozen(d, fr, g, gfr) {
        const d2 = Object.assign({}, d, { groep: { binnen: g.selector, alles: true } });
        log('  ✔ Gebied aangewezen' + (g.n ? ' (' + g.n + ' klikbare items' + (g.teksten.length ? ': ' + g.teksten.slice(0, 4).join(', ') : '') + ')' : '') + '.', true);
        klikBron(d2, fr || gfr);
    }
    function klikBron(d, fr) {
        askInline({
            title: 'Op welke waarde moet ParseLab klikken? · stap 3 van 4',
            html: '<div>Kies de kolomnaam (van een invoerveld, je lijst of een uitgelezen waarde), een invoerveld op de pagina, of een vaste tekst.</div>' +
                (waardeOpties().length ? '' : '<div class="hint">Nog geen kolomnamen: voeg eerst een invoerveld toe (daar kies je de naam) of upload je lijst.</div>') + bronKeuzeHTML('', true, true),
            onRender: bronKeuzeKoppel('Klantnummer'),
            buttons: [{ label: 'Verder →', primary: true, fn: v => {
                const bron = v['wt-ask-bron'] || 'vast', x = (v['wt-ask-in'] || '').trim();
                if (bron === 'veld') {
                    beginPick(el => { const f = resolveField(el) || el; klikHoe(d, fr, { bron: 'veld', veld: { selector: stableSel(f), fp: fingerprint(f), naam: (cleanCol(fieldLabel(f)) || txt(f) || 'veld').slice(0, 30) } }); },
                        'Klik op het invoerveld waar de waarde in staat', 'input', (vv, vfr) => klikHoe(d, fr, { bron: 'veld', veld: { selector: vv.selector, fp: vv.fp, naam: vv.col, frame: vfr } }));
                } else if (bron === 'vast') klikHoe(d, fr, { bron: 'vast', tekst: x });
                else klikHoe(d, fr, { bron: 'kolom', col: bron === 'nieuw' ? (x || 'Klantnummer') : bron.slice(6) });
            } }, { label: t('cancel') }]
        });
    }
    function klikHoe(d, fr, match) {
        const bronTekst = match.bron === 'kolom' ? '“' + match.col + '”' : match.bron === 'veld' ? 'het veld “' + (match.veld.naam || 'veld') + '”' : '“' + match.tekst + '”';
        askInline({
            title: 'Hoe moet de tekst overeenkomen? · stap 4 van 4',
            html: '<div>ParseLab zoekt ' + (d.groep && d.groep.binnen ? 'in het aangewezen gebied' : 'op de pagina') + ' de tekst die overeenkomt met ' + esc(bronTekst) + ' en klikt erop (of op de klikbare plek eromheen).</div>',
            buttons: [
                { label: 'Precies gelijk', primary: true, fn: () => klikKlaar(d, fr, Object.assign(match, { hoe: 'gelijk' })) },
                { label: 'De tekst bevat de waarde', fn: () => klikKlaar(d, fr, Object.assign(match, { hoe: 'bevat' })) },
                { label: t('cancel') }
            ]
        });
    }
    function matchOmschrijving(m) { return (m.hoe === 'bevat' ? 'klik op tekst met ' : 'klik op tekst = ') + (m.bron === 'kolom' ? 'kolom “' + m.col + '”' : m.bron === 'veld' ? 'veld “' + ((m.veld && m.veld.naam) || '?') + '”' : '“' + m.tekst + '”'); }
    // Wat staat er nu in de invoervelden van de taak? (om een knop-stap meteen te kunnen testen)
    function huidigeInvoer() {
        const o = {};
        steps.forEach(x => { if ((x.type === 'setval' || x.type === 'select') && !x.frame && invoerKolom(x)) { const el = targetEl(x); const v = el ? readValue(el, 'auto') : ''; o[invoerKolom(x)] = v || (x.bron === 'vast' ? x.value : ''); } });
        return o;
    }
    async function klikKlaar(d, fr, match) {
        const st = { type: 'click', name: 'Klik op: ' + (match.bron === 'kolom' ? match.col : match.bron === 'veld' ? (match.veld.naam || 'veld') : match.tekst).slice(0, 18), selector: d.selector, fp: d.fp, groep: d.groep, match, detail: matchOmschrijving(match) + (fr ? ' · in kader' : ''), frame: fr || undefined };
        addStep(st);
        // Meteen proberen welke knop het nu zou worden.
        const w = await matchWaarde(st, Object.assign({}, huidigeInvoer(), flowRows[0] || {}), {});
        if (!w) { log('  ✔ Knop-stap toegevoegd. (Nu nog geen waarde om te testen.)', true); return; }
        const r = await zoekKnopNu(st, w);
        log(r.ok ? '  ✔ Stap toegevoegd. Met “' + w + '” zou ParseLab nu op “' + r.tekst + '” klikken (blauw omlijnd).' : '  ⚠ Stap toegevoegd, maar “' + w + '” staat nu niet op de pagina' + (r.err ? ' — ' + r.err : ''), true);
    }
    async function zoekKnopNu(st, w) {
        const s2 = JSON.parse(JSON.stringify(st)); s2.match.waardeNu = w; s2.alleenTesten = true;
        if (s2.frame) { const r = await kaderOpdracht('run', s2, {}); return r || { ok: false }; }
        const r = knopMetWaarde(s2.groep, w, s2.match.hoe);
        if (r.el) { highlightEl(r.klik || r.el); return { ok: true, tekst: txt(r.el).slice(0, 60) }; }
        return { ok: false, err: 'wel: ' + r.opties.join(', ') };
    }
    // De waarde voor een knop-stap: uit de regel/uitgelezen waarden, een invoerveld of vaste tekst.
    async function matchWaarde(s, row, extraCtx) {
        const m = s.match || {}, ctx = Object.assign({}, row || {}, extraCtx || {});
        if (m.bron === 'vast') return String(resolveValue(m.tekst, ctx) || '').trim();
        if (m.bron === 'kolom') { const k = Object.keys(ctx).find(x => x.toLowerCase() === String(m.col || '').toLowerCase()); const v = k != null ? ctx[k] : ''; return v == null || typeof v === 'object' ? '' : String(v).trim(); }
        if (m.bron === 'veld' && m.veld) {
            if (m.veld.frame) { const r = await kaderOpdracht('run', { type: 'scrape', kind: 'element', attr: 'auto', selector: m.veld.selector, fp: m.veld.fp, frame: m.veld.frame }, {}); return r && r.val != null ? String(r.val).trim() : ''; }
            const el = targetEl(m.veld); return el ? String(readValue(el, 'auto') || '').trim() : '';
        }
        return '';
    }
    // ---- Invoer met uitleg: per regel uit de lijst (los meegeven) of een vaste/standaardwaarde ----
    // Keuzelijst met waar een waarde vandaan komt; gebruikt bij invoer en bij knoppen.
    function bronKeuzeHTML(col, metVeld, zonderNieuw) {
        const cols = csvCols(), ander = waardeOpties().filter(o => o.bron !== 'lijst');
        const zelfde = cols.find(c => c.toLowerCase() === String(col || '').toLowerCase());
        const def = zelfde ? 'kolom:' + zelfde : (zonderNieuw ? ((ander[0] && 'kolom:' + ander[0].v) || (cols[0] && 'kolom:' + cols[0]) || (metVeld ? 'veld' : 'vast')) : 'nieuw');
        const o = (v, l) => '<option value="' + esc(v) + '"' + (v === def ? ' selected' : '') + '>' + esc(l) + '</option>';
        return '<div class="wt-row"><select id="wt-ask-bron" class="wt-num" style="width:100%">' +
            o('vast', '✎ Zelf een vaste waarde invullen') +
            (metVeld ? o('veld', '👆 Een invoerveld op de pagina aanwijzen') : '') +
            (cols.length ? '<optgroup label="Kolom uit je lijst (per regel)">' + cols.map(c => o('kolom:' + c, c + (exampleFor(c) ? '  (bv. ' + exampleFor(c) + ')' : ''))).join('') + '</optgroup>' : '') +
            (ander.length ? '<optgroup label="Ingevuld, uitgelezen of uit de lus">' + ander.map(x => o('kolom:' + x.v, x.v + ' (' + x.bron + ')')).join('') + '</optgroup>' : '') +
            (zonderNieuw ? '' : o('nieuw', '＋ Nieuwe kolom in je lijst (geef de kolomnaam)')) + '</select></div>' +
            '<div class="wt-row"><span class="hint" id="wt-ask-lbl"></span><input id="wt-ask-in" class="wt-num" style="width:100%"></div>';
    }
    function bronKeuzeKoppel(col) {
        return box => {
            const sel = box.querySelector('#wt-ask-bron'), inp = box.querySelector('#wt-ask-in'), lbl = box.querySelector('#wt-ask-lbl');
            const zet = () => {
                const v = sel.value;
                inp.style.display = v === 'veld' ? 'none' : '';
                if (v === 'vast') { lbl.textContent = 'Waarde die altijd wordt gebruikt:'; inp.placeholder = 'bv. Jansen'; if (inp.dataset.m !== 'vast') inp.value = ''; }
                else if (v === 'nieuw') { lbl.textContent = 'Naam van de kolomkop in je Excel:'; inp.placeholder = 'bv. ' + (col || 'Klantnummer'); if (inp.dataset.m !== 'nieuw') inp.value = col || ''; }
                else if (v === 'veld') lbl.textContent = 'Je wijst het veld hierna aan.';
                else { lbl.textContent = 'Standaardwaarde als de cel leeg is (optioneel):'; inp.placeholder = 'optioneel'; if (inp.dataset.m !== 'kolom') inp.value = ''; }
                inp.dataset.m = v.indexOf('kolom:') === 0 ? 'kolom' : v;
            };
            sel.onchange = zet; zet();
        };
    }
    // Invoer: je geeft het veld altijd een kolomnaam. Daaronder bewaart ParseLab de ingevulde
    // waarde, zodat je hem later kunt gebruiken (bv. de knop zoeken met dezelfde tekst).
    // Waar komt de waarde vandaan? Vier keuzes, altijd met een vooruitblik op de volgende rondes.
    const BRONNEN = [
        ['lijst', '📋 Lijst automatisch aflopen — elke ronde de volgende regel uit mijn Excel/CSV/TXT'],
        ['vast', '📌 Standaardwaarde — elke ronde hetzelfde'],
        ['oplopend', '🔢 Oplopend — elke ronde één hoger (1, 2, 3… of K-1001, K-1002…)'],
        ['eerder', '🔁 Een eerder uitgelezen of ingevulde waarde'],
        ['logica', '🧮 Volgens een regel (datum, als…dan, formule)']
    ];
    let INVOER_BRON = null, LEES_SOORT = null;
    // Zonder vraag: kolomnaam = het label van het veld, bron = wat je in het menu koos. Aanpassen doe je in de flow.
    function invoerSnel(s, nu) {
        const bron = INVOER_BRON || 'lijst';
        if (bron === 'logica' || bron === 'eerder') { invoerVraag(s, bron); return; }
        INVOER_BRON = null;
        let col = lijstSpelling(invoerKolom(s) || 'Veld');
        // Lijst aflopen en de naam staat niet in je lijst? Dan de eerste kolom die nog door geen veld wordt gebruikt.
        if (bron === 'lijst' && flowRows.length && !csvCols().some(c => zelfdeNaam(c, col))) { const vrij = csvCols().filter(c => kolomAlBij(c, s) < 0); if (vrij.length) col = vrij[0]; }
        const basis = col; let k = 2; while (kolomAlBij(col, s) >= 0) col = basis + ' ' + (k++);
        const v = { 'wt-ask-col': col, 'wt-ask-bron': bron, 'wt-ask-in': bron === 'vast' ? String(nu || '') : '' };
        if (bron === 'oplopend') { v['wt-ask-lstart'] = '1'; v['wt-ask-lstap'] = '1'; }
        maakInvoer(s, v); lijstKolomErbij(s); renderSteps(); renderFlow(); persist();
    }
    function invoerVraag(s, bronStart) {
        if (!s) return;
        const voorstel = invoerKolom(s) || 'waarde';
        const cols = csvCols(), i = steps.indexOf(s);
        const eerder = waardeOpties(i).filter(o => o.bron !== 'lijst' && !zelfdeNaam(o.v, invoerKolom(s)));
        const L = s.logica || {};
        const bron0 = bronStart || INVOER_BRON || s.bron || 'lijst'; INVOER_BRON = null;
        const o = (v, cur, t) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
        const alle = waardeOpties(i).map(x => x.v);
        askInline({
            title: 'Invoerveld: naam en waarde',
            html: '<label class="kol">Kolomnaam (verplicht) <input id="wt-ask-col" class="wt-num" style="width:100%" placeholder="bv. ' + esc(voorstel) + '" value="' + esc(s.col || '') + '"></label>' +
                '<div class="wt-row"><button class="sugg" data-sugg="' + esc(voorstel) + '">gebruik “' + esc(voorstel) + '”</button>' + cols.slice(0, 5).map(c => '<button class="sugg" data-sugg="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
                '<div class="hint">De <b>enige plek</b> waar je de naam kiest: dezelfde naam staat in je Excel, bij knoppen en bij PDF-mappen.</div>' +
                '<label class="kol">Welke waarde vult ParseLab in?<select id="wt-ask-bron" class="wt-num" style="width:100%">' + BRONNEN.map(b => o(b[0], bron0, b[1])).join('') + '</select></label>' +
                '<div data-b="lijst"><div class="hint" id="wt-ask-lijstinfo"></div></div>' +
                '<div data-b="eerder">' + (eerder.length ? '<label class="kol">Welke waarde?<select id="wt-ask-eerder" class="wt-num" style="width:100%">' + eerder.map(x => o(x.v, s.eerder || '', x.v + ' (' + x.bron + ')')).join('') + '</select></label>'
                    : '<div class="hint">⚠ Er is nog niets uitgelezen of ingevuld vóór deze stap. Voeg eerst een stap <b>Iets uitlezen</b> toe, of kies een andere bron.</div>') + '</div>' +
                '<div data-b="oplopend"><div class="wt-row">tekst ervoor <input id="wt-ask-ovoor" class="wt-num" style="width:70px" placeholder="bv. K-" value="' + esc(L.voor || '') + '"> begin bij <input id="wt-ask-lstart" class="wt-num" type="number" value="' + esc(L.start != null ? L.start : 1) + '"></div>' +
                    '<div class="wt-row">elke ronde + <input id="wt-ask-lstap" class="wt-num" type="number" value="' + esc(L.stap != null ? L.stap : 1) + '"> · tekst erna <input id="wt-ask-ona" class="wt-num" style="width:70px" value="' + esc(L.na || '') + '"></div></div>' +
                '<div data-b="logica"><label class="kol">Soort regel<select id="wt-ask-lsoort" class="wt-num" style="width:100%">' +
                    o('datum', L.soort === 'teller' ? 'datum' : (L.soort || 'datum'), 'Datum: vandaag (+/- dagen)') + o('als', L.soort, 'Als … dan … anders …') + o('formule', L.soort, 'Formule / tekst met {{kolom}}') + '</select></label>' +
                    '<div data-l="datum" class="wt-row">vandaag + <input id="wt-ask-ldagen" class="wt-num" type="number" value="' + esc(L.dagen || 0) + '"> dagen</div>' +
                    '<div data-l="als"><div class="wt-row">als <select id="wt-ask-lkol" class="wt-num" style="width:auto">' + alle.concat(['ronde']).map(v => o(v, L.kol || '', v)).join('') + '</select>' +
                        '<select id="wt-ask-lop" class="wt-num" style="width:auto">' + [['leeg', 'leeg is'], ['nietleeg', 'niet leeg is'], ['is', 'gelijk is aan'], ['bevat', 'bevat'], ['groter', 'groter is dan'], ['kleiner', 'kleiner is dan']].map(x => o(x[0], L.op || 'nietleeg', x[1])).join('') + '</select>' +
                        '<input id="wt-ask-lwaarde" class="wt-num" style="width:90px" placeholder="waarde" value="' + esc(L.waarde || '') + '"></div>' +
                        '<div class="wt-row">dan <input id="wt-ask-ldan" class="wt-num" style="width:40%" value="' + esc(L.dan || '') + '"> anders <input id="wt-ask-landers" class="wt-num" style="width:40%" value="' + esc(L.anders || '') + '"></div></div>' +
                    '<div data-l="formule"><input id="wt-ask-lexpr" class="wt-num" style="width:100%" placeholder="bv. {{Polisnummer}}-{{ronde}} of {{Bedrag * 1.21}}" value="' + esc(L.expr || '') + '">' +
                        '<div class="wt-row">' + alle.concat(['ronde', 'vandaag']).slice(0, 8).map(v => '<button class="sugg" data-tok="' + esc(v) + '">{{' + esc(v) + '}}</button>').join('') + '</div></div>' +
                '</div>' +
                '<label class="kol"><span id="wt-ask-lbl">Standaardwaarde als er niets is (optioneel)</span><input id="wt-ask-in" class="wt-num" style="width:100%" value="' + esc(s.bron === 'vast' ? (s.value || '') : (s.standaard || '')) + '"></label>' +
                '<div class="vooruit" id="wt-ask-vooruit"></div>',
            onRender: box => {
                const q = x => box.querySelector(x);
                box.querySelectorAll('[data-sugg]').forEach(x => x.onclick = () => { q('#wt-ask-col').value = x.dataset.sugg; toon(); });
                box.querySelectorAll('[data-tok]').forEach(x => x.onclick = () => { const e = q('#wt-ask-lexpr'); e.value += '{{' + x.dataset.tok + '}}'; toon(); });
                const up = q('[data-upl]'); if (up) up.onclick = () => { LIJST_NA = () => toon(); $('#flow-file').click(); };
                const zf = q('[data-zelf]'); if (zf) zf.onclick = () => { const c = String(q('#wt-ask-col').value || '').trim() || 'Waarde'; if (!flowRows.length) { flowRows = [0, 1, 2].map(() => ({ [c]: '' })); } else if (!csvCols().some(k => zelfdeNaam(k, c))) flowRows.forEach(r => r[c] = ''); saveRows(); showCsvInfo('✎ Vul je lijst in de tabel hieronder in (in ✋ Handmatig).'); toon(); };
                function lees() {
                    const v = {}; box.querySelectorAll('input,select').forEach(x => { if (x.id) v[x.id] = x.value; }); return v;
                }
                function toon() {
                    if (!q('#wt-ask-vooruit')) return;
                    const v = lees(), b = v['wt-ask-bron'];
                    box.querySelectorAll('[data-b]').forEach(x => x.style.display = x.dataset.b === b ? '' : 'none');
                    box.querySelectorAll('[data-l]').forEach(x => x.style.display = x.dataset.l === v['wt-ask-lsoort'] ? '' : 'none');
                    q('#wt-ask-lbl').textContent = b === 'vast' ? 'Standaardwaarde (verplicht)' : 'Reservewaarde als er niets is (optioneel)';
                    const li = q('#wt-ask-lijstinfo');
                    if (li) { const c = String(v['wt-ask-col'] || '').trim(); li.innerHTML = flowRows.length ? (csvCols().some(k => zelfdeNaam(k, c)) ? '✔ Je lijst heeft ' + flowRows.length + ' regels en de kolom “' + esc(c) + '”. Elke ronde pakt ParseLab de volgende regel.' : '⚠ Je lijst (' + flowRows.length + ' regels) heeft geen kolom “' + esc(c || '…') + '”. Kolommen: ' + esc(csvCols().join(', '))) : 'Nog geen lijst geladen. Upload een Excel, CSV of TXT (één waarde per regel mag ook).'; }
                    const t = maakInvoer(Object.assign({}, s), v);
                    q('#wt-ask-vooruit').innerHTML = vooruitHTML(t, i < 0 ? steps.length : i);
                }
                const lijf = box.querySelector('.ask-body') || box;   // vervangen bij elke nieuwe vraag → geen oude luisteraars
                lijf.addEventListener('input', toon); lijf.addEventListener('change', toon);
                toon();
                setTimeout(() => { try { if (!q('#wt-ask-col').value) q('#wt-ask-col').focus(); } catch (e) {} }, 60);
            },
            buttons: [{ label: 'Opslaan ✓', primary: true,
                check: v => { const c = String(v['wt-ask-col'] || '').trim(); if (!c) return 'Geef een kolomnaam.'; const k = kolomAlBij(c, s); if (k >= 0) return 'De kolomnaam “' + c + '” bestaat al bij stap ' + (k + 1) + '. Kies een andere naam.';
                    if (v['wt-ask-bron'] === 'vast' && !String(v['wt-ask-in'] || '').trim()) return 'Vul de standaardwaarde in.';
                    if (v['wt-ask-bron'] === 'eerder' && !v['wt-ask-eerder']) return 'Er is nog geen eerdere waarde. Kies een andere bron.';
                    if (v['wt-ask-bron'] === 'logica' && v['wt-ask-lsoort'] === 'formule' && !String(v['wt-ask-lexpr'] || '').trim()) return 'Vul de formule in.';
                    return ''; },
                fn: v => { const nieuw = !s.col; const oud = invoerKolom(s); maakInvoer(s, v); if (oud && s.col !== oud) hernoemKolom(oud, s.col, s); lijstKolomErbij(s); renderSteps(); renderFlow(); persist(); } },
                { label: s.col ? 'Annuleren' : 'Stap weghalen', fn: () => { if (s.col) return; const k = steps.indexOf(s); if (k >= 0) { steps.splice(k, 1); renderSteps(); renderFlow(); persist(); } } }]
        });
    }
    // Zelfgemaakte lijst: krijgt automatisch de kolom van een invoerveld dat de lijst afloopt.
    function lijstKolomErbij(s) {
        if ((s.bron || 'lijst') !== 'lijst' || !flowRows.length || csvCols().some(c => zelfdeNaam(c, s.col))) return;
        const cols = csvCols(), leeg = flowRows.every(r => cols.every(c => String(r[c] == null ? '' : r[c]).trim() === ''));
        if (cols.length === 1 && cols[0] === 'Waarde' && leeg) flowRows = flowRows.map(() => ({ [s.col]: '' }));
        else flowRows.forEach(r => r[s.col] = '');
        saveRows(); showCsvInfo();
    }
    // Zet de keuzes uit de vraag op de stap (ook gebruikt voor de live vooruitblik).
    function maakInvoer(s, v) {
        const col = lijstSpelling(String(v['wt-ask-col'] || invoerKolom(s) || 'waarde').trim()), bron = v['wt-ask-bron'] || 'lijst', x = String(v['wt-ask-in'] || '').trim();
        s.col = col; s.bron = bron; delete s.eerder; delete s.logica; delete s.standaard;
        if (bron === 'vast') s.value = x;
        else if (bron === 'eerder') { s.eerder = v['wt-ask-eerder'] || ''; s.value = '{{' + s.eerder + '}}'; if (x) s.standaard = x; }
        else if (bron === 'oplopend') {
            s.logica = { soort: 'teller', start: v['wt-ask-lstart'] === '' || v['wt-ask-lstart'] == null ? 1 : +v['wt-ask-lstart'], stap: v['wt-ask-lstap'] === '' || v['wt-ask-lstap'] == null ? 1 : +v['wt-ask-lstap'], voor: v['wt-ask-ovoor'] || '', na: v['wt-ask-ona'] || '', nullen: /^0\d/.test(String(v['wt-ask-lstart'] || '')) };
            s.value = ''; if (x) s.standaard = x;
        }
        else if (bron === 'logica') {
            const so = v['wt-ask-lsoort'] || 'datum';
            s.logica = so === 'datum' ? { soort: so, dagen: +v['wt-ask-ldagen'] || 0 }
                : so === 'als' ? { soort: so, kol: v['wt-ask-lkol'] || '', op: v['wt-ask-lop'] || 'nietleeg', waarde: v['wt-ask-lwaarde'] || '', dan: v['wt-ask-ldan'] || '', anders: v['wt-ask-landers'] || '' }
                : { soort: 'formule', expr: v['wt-ask-lexpr'] || '' };
            s.value = ''; if (x) s.standaard = x;
        } else { s.value = '{{' + col + '}}'; if (x) s.standaard = x; }
        s.name = (s.kind === 'keuzelijst' ? 'Keuzelijst: ' : s.kind === 'datum' ? 'Datum: ' : 'Veld: ') + col.slice(0, 22);
        s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : '');
        return s;
    }
    function invoerUitleg(s) {
        const L = s.logica || {};
        const b = s.bron || (/^\{\{/.test(String(s.value || '')) || !s.value ? 'lijst' : 'vast');
        if (b === 'vast') return 'standaard “' + String(s.value || '').slice(0, 30) + '”';
        if (b === 'eerder') return 'waarde van “' + (s.eerder || '?') + '”';
        if (b === 'oplopend' || (b === 'logica' && L.soort === 'teller')) return 'oplopend: ' + (L.voor || '') + (L.start == null ? 1 : L.start) + (L.na || '') + ', +' + (L.stap == null ? 1 : L.stap) + ' per ronde';
        if (b === 'logica') return L.soort === 'teller' ? ''
            : L.soort === 'datum' ? 'vandaag' + (+L.dagen ? (L.dagen > 0 ? ' + ' : ' − ') + Math.abs(L.dagen) + ' dagen' : '')
            : L.soort === 'als' ? 'als ' + (L.kol || '?') + ' ' + ({ leeg: 'leeg', nietleeg: 'niet leeg', is: '= ' + L.waarde, bevat: 'bevat ' + L.waarde, groter: '> ' + L.waarde, kleiner: '< ' + L.waarde }[L.op] || '') + ' → “' + (L.dan || '') + '” anders “' + (L.anders || '') + '”'
            : 'formule ' + String(L.expr || '').slice(0, 40);
        return 'lijst aflopen: kolom “' + invoerKolom(s) + '”' + (s.standaard ? ', anders “' + s.standaard + '”' : '');
    }
    // Vooruitblik: wat vult ParseLab in bij ronde 1, 2, 3 — en wat gebeurt er daarna?
    function voorbeeldCtx(r, i) {
        const prod = {}; waardeOpties(i).forEach(o => { if (o.bron !== 'lijst') prod[o.v] = '‹' + o.v + '›'; });
        const rr = flowRows.length ? rondeRijen() : []; const rij = rr.length ? rr[(r - 1) % rr.length] : null;
        const ctx = Object.assign({}, prod, rij || {}, { ronde: r });
        if (r > 1) Object.keys(prod).forEach(k => ctx['vorige ' + k] = '‹vorige ' + k + '›');
        return ctx;
    }
    function vooruitWaarden(s, i, n) {
        const uit = [], aantal = flowRows.length ? Math.min(n || 3, flowRows.length) : (n || 3);
        for (let r = 1; r <= aantal; r++) { let v; try { v = waardeVoorVeld(s, voorbeeldCtx(r, i)); } catch (e) { v = ''; } uit.push(v == null ? '' : String(v)); }
        return uit;
    }
    // Rondeschuif: wat doet ParseLab in ronde r? Per stap de waarde die erin gaat.
    let VB_RONDE = 1;
    function aantalModus() { const m = $('#flow-aantal-modus'); return m ? m.value : 'lijst'; }
    function aantalKeer() { return Math.max(1, Math.min(10000, +($('#flow-aantal') ? $('#flow-aantal').value : 1) || 1)); }
    // De rondes: elke regel van de lijst, of een vast aantal keer (met lijst: de regels om de beurt).
    // Eén ronde per unieke waarde in een kolom (bv. klant of rondenummer): alle regels met die waarde
    // horen bij dezelfde ronde (bv. Piet met 3 auto's = 1 ronde, 1 map).
    function rondeKol() { const k = ($('#flow-rondekol') && $('#flow-rondekol').value) || ''; return k && csvCols().some(c => c === k) ? k : ''; }
    function groepen() {
        const k = rondeKol(); if (!k) return null;
        const map = new Map();
        flowRows.forEach(r => { const v = String(r[k] == null ? '' : r[k]).trim(); if (!map.has(v)) map.set(v, []); map.get(v).push(r); });
        return Array.from(map.values()).map(g => Object.assign({}, g[0], { _groep: g }));
    }
    function rondeRijen() {
        const gr = flowRows.length ? groepen() : null;
        if (aantalModus() === 'aantal') { const n = aantalKeer(), bron = gr || flowRows; return Array.from({ length: n }, (_, k) => bron.length ? Object.assign({}, bron[k % bron.length]) : null); }
        if (!flowRows.length) return [null];
        if (gr) return gr;
        const lst = steps.filter(x => (x.type === 'setval' || x.type === 'select') && (x.bron || 'lijst') === 'lijst');
        if (lst.length && lst.every(x => x.lijstModus === 'alle' || x.lijstModus === 'aantal')) {
            const n = Math.max(1, ...lst.map(x => x.lijstModus === 'alle' ? 1 : Math.ceil(flowRows.length / Math.max(1, +x.lijstAantal || 1))));
            return Array.from({ length: n }, (_, k) => flowRows[k] || null);
        }
        return flowRows.slice();
    }
    function aantalRondes() { return rondeRijen().length * Math.max(1, +($('#flow-repeat') ? $('#flow-repeat').value : 1) || 1); }
    function aantalUitleg() {
        const m = aantalModus(), inp = $('#flow-aantal'), u = $('#aantal-uitleg'); if (!u) return;
        if (inp) inp.style.display = m === 'aantal' ? '' : 'none';
        const gr = flowRows.length ? groepen() : null;
        u.textContent = m === 'aantal' ? (flowRows.length ? aantalKeer() + ' rondes, ' + (gr ? 'groepen' : 'regels') + ' om de beurt' : aantalKeer() + ' rondes') : (gr ? gr.length + ' rondes, één per ' + rondeKol() : flowRows.length ? flowRows.length + ' rondes, één per regel' : 'geen lijst: 1 ronde');
    }
    function stapVoorbeeld(st, i, r) {
        try {
            const ctx = voorbeeldCtx(r, i);
            if ((st.type === 'setval' || st.type === 'select') && (st.lijstModus === 'alle' || st.lijstModus === 'aantal') && (st.bron || 'lijst') === 'lijst') { const w = lijstWaarden(st, r); return w.length ? '✎ ' + w.length + '× ' + w.slice(0, 3).join(', ') + (w.length > 3 ? '…' : '') : '— geen waarden'; }
            if (st.type === 'setval' || st.type === 'select') { const v = waardeVoorVeld(st, ctx); return v == null || String(v).trim() === '' ? (st.skipEmpty !== false ? '— leeg, overslaan' : '“”') : '✎ “' + String(v).slice(0, 28) + '”'; }
            if (st.type === 'click' && st.regelKeuze) { const nr = regelKnop(st.regelKeuze, ctx); return nr >= 0 ? '👆 knop ' + (nr + 1) + ' “' + String(st.regelKeuze.namen[nr] || '').slice(0, 22) + '”' : '— geen knop'; }
            if (st.type === 'click' && st.match) { const m = st.match; const v = m.bron === 'vast' ? resolveValue(m.tekst, ctx) : m.bron === 'kolom' ? ctx[Object.keys(ctx).find(k => zelfdeNaam(k, m.col))] : '‹' + ((m.veld && m.veld.naam) || 'veld') + '›'; return '👆 “' + String(v == null ? '' : v).slice(0, 28) + '”'; }
            if (st.type === 'print' && st.folderBy) { const v = ctx[Object.keys(ctx).find(k => zelfdeNaam(k, st.folderBy))]; return '📁 ' + currentFolder + '/' + String(v == null ? '' : v).slice(0, 24); }
            if (st.type === 'type' && st.text) return '⌨ “' + String(resolveValue(st.text, ctx)).slice(0, 28) + '”';
        } catch (e) {}
        return '';
    }
    function renderRondes() {
        const box = $('#ronde-box'); if (!box) return;
        const n = aantalRondes();
        if (!steps.length || n < 2) { box.style.display = 'none'; return; }
        box.style.display = ''; box.style.top = '0px';
        VB_RONDE = Math.min(Math.max(1, VB_RONDE), n);
        const rr = flowRows.length ? rondeRijen() : []; const rij = rr.length ? rr[(VB_RONDE - 1) % rr.length] : null;
        const aantalM = aantalModus() === 'aantal';
        box.innerHTML = '<div class="rnd-kop"><button class="mini" data-rnd="-1" title="Vorige ronde">◀</button><b class="rnd-nr">' + VB_RONDE + '/' + n + '</b><button class="mini" data-rnd="1" title="Volgende ronde">▶</button>' +
            '<input type="range" class="rnd-schuif" min="1" max="' + n + '" value="' + VB_RONDE + '"' + (n < 2 ? ' disabled' : '') + '></div>' +
            '<div class="rnd-uitleg">' + (rij ? (rij._groep ? 'Ronde ' + VB_RONDE + ': <b>' + esc(rondeKol()) + ' = ' + esc(String(rij[rondeKol()])) + '</b> · ' + rij._groep.length + ' regel(s)' : 'Ronde ' + VB_RONDE + ' gebruikt <b>regel ' + (((VB_RONDE - 1) % flowRows.length) + 1) + '</b>: ' + esc(Object.keys(rij).filter(k => k[0] !== '_').slice(0, 4).map(k => k + ' = ' + String(rij[k]).slice(0, 18)).join(' · '))) : (n > 1 ? 'Ronde ' + VB_RONDE + ' van ' + n + (aantalM ? ' (aantal keer).' : ' (herhalen).') : 'Eén ronde. Maak of upload een lijst, of kies bij “Hoe vaak” een aantal keer.')) + '</div>';
        const zet = r => { VB_RONDE = r; renderSteps(); };
        box.querySelectorAll('[data-rnd]').forEach(b => b.onclick = () => zet(Math.min(n, Math.max(1, VB_RONDE + +b.dataset.rnd))));
        const sch = box.querySelector('.rnd-schuif'); sch.oninput = () => { VB_RONDE = +sch.value; box.querySelector('.rnd-nr').textContent = VB_RONDE + '/' + n; box.parentNode.querySelectorAll('[data-vb]').forEach(e => { const i = +e.dataset.vb; e.textContent = stapVoorbeeld(steps[i], i, VB_RONDE); }); }; sch.onchange = () => zet(+sch.value);
    }
    function vooruitHTML(s, i) {
        const w = vooruitWaarden(s, i, 3);
        const lijst = (s.bron || 'lijst') === 'lijst';
        const rondes = flowRows.length || 1;
        let h = '<b>Vooruitblik</b> · ' + w.map((v, k) => 'ronde ' + (k + 1) + ': ' + (v === '' ? '<i>leeg → overslaan</i>' : '“' + esc(v.slice(0, 26)) + '”')).join(' · ');
        if (lijst && !flowRows.length) h += '<br><span class="hint">Zonder lijst draait de taak één ronde.</span>';
        else h += '<br><span class="hint">' + (lijst || flowRows.length ? rondes + ' ronde(s): één per regel in je lijst.' : 'Het aantal rondes volgt je lijst of “Herhaal”.') + '</span>';
        const volgende = steps[i + 1];
        if (volgende) h += '<br><span class="hint">Daarna: stap ' + (i + 2) + ' — ' + esc(volgende.name || volgende.type) + '</span>';
        else h += '<br><span class="hint">Dit is de laatste stap; daarna begint de volgende ronde bij stap 1.</span>';
        return h;
    }
    // Eerst invullen, dan op de knop: staat er vlak vóór dit veld een klik op dezelfde pagina
    // (bv. "Zoeken"), dan bieden we aan om het veld ervóór te zetten.
    const zelfdeNaam = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
    // Welke invoerstap gebruikt deze kolomnaam al (behalve stap `behalve`)?
    function kolomAlBij(col, behalve) { return steps.findIndex(x => x !== behalve && (x.type === 'setval' || x.type === 'select') && zelfdeNaam(invoerKolom(x), col)); }
    // Zelfde naam als in je Excel? Dan precies die schrijfwijze gebruiken.
    function lijstSpelling(col) { return csvCols().find(c => zelfdeNaam(c, col)) || col; }
    // Waar wordt een kolomnaam gebruikt (knoppen, mappen, teksten)?
    function gebruikVan(col, behalve) {
        const uit = [];
        const re = new RegExp('\\{\\{\\s*' + String(col).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\}\\}', 'i');
        steps.forEach((x, i) => {
            if (x === behalve) return;
            if ((x.match && x.match.bron === 'kolom' && zelfdeNaam(x.match.col, col)) || zelfdeNaam(x.folderBy, col) || zelfdeNaam(x.fileBy, col) || ['text', 'standaard'].some(f => re.test(String(x[f] || ''))) || (x.type !== 'setval' && x.type !== 'select' && re.test(String(x.value || ''))))
                uit.push(i + 1);
        });
        return uit;
    }
    function hernoemKolom(oud, nieuw, behalve) {
        if (!oud || !nieuw || oud === nieuw) return 0;
        const esc_ = String(oud).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reT = new RegExp('\\{\\{\\s*' + esc_ + '\\s*\\}\\}', 'i'), reG = new RegExp('\\{\\{\\s*' + esc_ + '\\s*\\}\\}', 'gi');
        let n = 0;
        steps.forEach(x => {
            if (x === behalve) return;
            ['value', 'text', 'standaard', 'url'].forEach(f => { if (typeof x[f] === 'string' && reT.test(x[f])) { x[f] = x[f].replace(reG, '{{' + nieuw + '}}'); n++; } });
            if (x.match) {
                if (x.match.bron === 'kolom' && zelfdeNaam(x.match.col, oud)) { x.match.col = nieuw; n++; }
                if (typeof x.match.tekst === 'string' && reT.test(x.match.tekst)) { x.match.tekst = x.match.tekst.replace(reG, '{{' + nieuw + '}}'); n++; }
                if (x.match.bron === 'kolom') { x.name = 'Klik op: ' + x.match.col.slice(0, 18); x.detail = matchOmschrijving(x.match) + (x.frame ? ' · in kader' : ''); }
            }
            if (zelfdeNaam(x.folderBy, oud)) { x.folderBy = nieuw; x.detail = 'PDF → map per “' + nieuw + '”'; n++; }
            if (zelfdeNaam(x.fileBy, oud)) { x.fileBy = nieuw; n++; }
            if (x.type === 'fill' && x.colmap) x.colmap.forEach(m => { if (zelfdeNaam(m.col, oud)) { m.col = nieuw; n++; } });
        });
        const g = $('#flow-group'); if (g && zelfdeNaam(g.value, oud)) { g.dataset.pending = nieuw; renderGroupOptions(); }
        return n;
    }
    function volgordeCheck(s) {
        const i = steps.indexOf(s); if (i < 1) return;
        let k = i - 1; while (k >= 0 && (steps[k].type === 'setval' || steps[k].type === 'select' || steps[k].type === 'type')) k--;
        const knop = steps[k];
        if (!knop || knop.type !== 'click' || (knop.page && s.page && knop.page !== s.page)) return;
        askInline({
            title: 'Klopt de volgorde?',
            html: '<div>Je klikt nu eerst op <b>“' + esc(knop.name) + '”</b> en vult daarna <b>“' + esc(invoerKolom(s)) + '”</b> in.</div><div>Meestal vul je eerst het veld in en druk je daarna op de knop.</div>',
            buttons: [
                { label: 'Eerst invullen, dan “' + knop.name.slice(0, 20) + '”', primary: true, fn: () => { steps.splice(i, 1); steps.splice(k, 0, s); renderSteps(); renderFlow(); persist(); log('  ✔ Volgorde aangepast: eerst “' + invoerKolom(s) + '”, dan “' + knop.name + '”.', true); } },
                { label: 'Zo laten' }
            ]
        });
    }
    function zetInvoer(s, col, bron, x) {
        s.col = col; s.bron = bron === 'vast' ? 'vast' : 'lijst';
        if (s.bron === 'vast') { s.value = x; delete s.standaard; } else { s.value = '{{' + col + '}}'; if (x) s.standaard = x; else delete s.standaard; }
        s.name = (s.kind === 'keuzelijst' ? 'Keuzelijst: ' : s.kind === 'datum' ? 'Datum: ' : 'Veld: ') + col.slice(0, 22);
        s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : '');
        renderSteps(); renderFlow(); persist();
    }
    function addClickStep(el) {
        const btn = knopRond(el);
        const naam = knopNaam(btn) || btn.tagName.toLowerCase();
        addStep({ type: 'click', name: naam.slice(0, 24) || 'knop', selector: stableSel(btn), fp: fingerprint(btn), detail: naam.slice(0, 40) || 'knop' });
    }
    function addWaitStep() { addStep({ type: 'wait', mode: 'smart', ms: 8000, name: 'Wachten tot de pagina klaar is' }); }
    function addElementScrape(el, nm) {
        const attr = el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text');
        const preview = nm || (txt(el) ? txt(el).slice(0, 24) : (el.getAttribute && el.getAttribute('alt')) || el.tagName.toLowerCase()) || 'waarde';
        const n = steps.filter(s => s.type === 'scrape' && s.kind === 'element').length + 1;
        const lab = nm || labelBijWaarde(el);
        addStep({ type: 'scrape', kind: 'element', name: lab || preview, col: lab ? cleanCol(lab) : 'kolom' + n, selector: cssPath(el), fp: fingerprint(el), attr, detail: preview });
    }
    function addListScrape(det) { addStep({ type: 'scrape', kind: 'list', name: 'Lijst uitlezen', spec: det, detail: det.count + ' items × ' + det.columns.length + ' kolommen' }); }
    // Uitlezen: na de klik vragen "Alleen dit, of de hele lijst?" met een voorbeeld van wat meekomt.
    function addReadStep(el) { leesKeuze(beschrijfVoorStap(el, 'read'), null); }
    // Laadt de lijst verder bij scrollen? Even naar onderen scrollen en tellen; zo ja, dan
    // vragen of ParseLab eerst alles moet laden (voegt een scrol-stap vóór het uitlezen in).
    async function maybeOfferScrollLoad(det) {
        let before = 0, after = 0;
        const sc = scroller(), sx = sc ? sc.scrollLeft : window.scrollX, sy = sc ? sc.scrollTop : window.scrollY;
        try {
            before = doc.querySelectorAll(det.sig).length;
            if (doc.body.scrollHeight <= window.innerHeight + 40) return;   // niets om te scrollen
            naarOnder();
            await sleep(900);
            after = doc.querySelectorAll(det.sig).length;
        } catch (e) { return; }
        finally { try { if (sc) { sc.scrollLeft = sx; sc.scrollTop = sy; } else window.scrollTo(sx, sy); } catch (e) {} }
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
        INVOER_BRON = null; LEES_SOORT = null;
        const kies = (hint, fn) => beginPick(el => fn(beschrijfVoorStap(el, 'click'), null), hint, 'click', fn);
        if (kind === 'in-dropdown') return beginPick(dropdownStap, 'Klik op de dropdown (keuzelijst)', 'input', kaderVeld);
        if (/^in-/.test(kind)) { INVOER_BRON = { 'in-vast': 'vast', 'in-op': 'oplopend', 'in-logica': 'logica', 'in-eerder': 'eerder' }[kind]; kind = 'input'; }
        if (kind === 'dbl') return beginPick(el => vasteKnop({ naam: (txt(el) || el.tagName.toLowerCase()).slice(0, 30), selector: cssPath(el), fp: fingerprint(el), strat: maakStrat(el), positie: { pad: cssPath(el) }, dubbel: true }, null),
            'Klik op wat dubbel geklikt moet worden', 'any', kaderAlgemeen(o => vasteKnop({ naam: o.naam, selector: o.selector, fp: o.fp, positie: { pad: o.selector }, dubbel: true }, o.frame)));
        if (kind === 'shot') { addStep({ type: 'shot', name: 'Schermafbeelding', detail: 'wat je ziet als afbeelding (PNG)' }); return; }
        if (kind === 'kl-waarde') return kies('Klik op een knop, regel of tegel die bij een waarde hoort', (d, fr) => d && klikWaar(d, fr));
        if (kind === 'goto') {
            askInline({ title: 'Ga naar adres', html: '<label class="kol">Adres (URL)<input id="wt-ask-url" class="wt-num" style="width:100%" value="' + esc(location.href) + '"></label><div class="hint">ParseLab gaat naar dit adres en wacht tot de pagina klaar is.</div>',
                buttons: [{ label: 'Toevoegen', primary: true, check: v => /^https?:\/\//i.test(String(v['wt-ask-url'] || '').trim()) ? '' : 'Vul een adres in dat begint met http:// of https://',
                    fn: v => { const url = String(v['wt-ask-url']).trim(); addStep({ type: 'nav', mode: 'url', url, name: 'Naar ' + kortUrl(url).slice(0, 30), detail: url }); } }, { label: t('cancel') }] });
            return;
        }
        if (kind === 'rijlus') { addStep({ type: 'rijlus', name: 'Voor elke regel van de ronde', detail: rondeKol() ? 'alle regels met dezelfde “' + rondeKol() + '”' : 'alle regels van de ronde — kies bij de lijst “Eén ronde per …”' }); return; }
        if (kind === 'back' || kind === 'nav') { addStep(openLusIdx() >= 0 ? { type: 'nav', mode: 'loop', name: 'Terug naar de lijst', detail: 'naar de pagina waar de lus begon' } : { type: 'nav', mode: 'back', name: 'Terug naar vorige pagina', detail: 'zoals de terugknop van de browser' }); return; }
        if (kind === 'kl-regel') return kies('Klik in het gebied met de knoppen (de ruimte rond de knoppen)', (d, fr) => d && regelVanGebied(d, fr));
        if (kind === 'kl-loop') return kies('Klik in het gebied met de items (bv. de lijst met verzekeringen)', (d, fr) => d && loopKlikVan(d, fr));
        if (/^rd-/.test(kind)) {
            if (kind === 'rd-pagina') { addStep({ type: 'scrape', kind: 'pagina', name: 'Hele pagina uitlezen', detail: 'titel, koppen, alle velden, tabellen en links' }); return; }
            if (kind === 'rd-site') { siteVerkenner(); return; }
            if (kind === 'rd-extern') { externNieuw(); return; }
            LEES_SOORT = { 'rd-el': 'el', 'rd-tabel': 'tabel', 'rd-velden': 'velden' }[kind]; kind = 'read';
        }
        if (kind === 'input') beginPick(addInputStep, 'Klik het veld, de keuzelijst of het formulier dat ingevuld moet worden', 'input', kaderVeld);
        else if (kind === 'click') beginPick(el => klikGekozen(beschrijfVoorStap(el, 'click'), null), 'Klik op de knop — of in een gebied met meerdere knoppen', 'click', klikGekozen);
        else if (kind === 'read') beginPick(addReadStep, 'Klik op de tekst, prijs of één item van een lijst', 'read', leesKeuze);
        else if (kind === 'wait') addWaitStep();
        else if (kind === 'print') requestPrintPermission(ok => { if (ok) addPrintStep(); });
        else if (kind === 'loop') startLusWizard();
        else if (kind === 'endloop') sluitLus();
        else if (kind === 'nav') addNavStep();
        else if (kind === 'shot') addStep({ type: 'shot', name: 'Bewijskopie (afbeelding)', detail: 'zichtbare pagina als afbeelding in je map' });
        else if (kind === 'type') beginPick(el => { el = resolveField(el); addStep({ type: 'type', name: 'Tekst typen', selector: stableSel(el), fp: fingerprint(el), text: '', enter: false, detail: fieldColName(el, 1) }); }, 'Klik het veld waar je tekst in wilt typen');
        else if (kind === 'key') addStep({ type: 'key', name: 'Toets indrukken', key: 'Enter', detail: 'stuurt één toets' });
        else if (kind === 'hover') beginPick(el => addStep({ type: 'hover', name: 'Muis erboven', selector: cssPath(el), detail: (txt(el) || el.tagName.toLowerCase()).slice(0, 30) }), 'Klik waar de muis boven moet blijven', 'any',
            kaderAlgemeen(o => addStep({ type: 'hover', name: 'Muis erboven', selector: o.selector, fp: o.fp, detail: (o.naam || '').slice(0, 30) + ' · in kader', frame: o.frame })));
        else if (kind === 'scroll') beginPick(el => addStep({ type: 'scroll', name: 'Scrollen', selector: cssPath(el), mode: 'element', detail: (txt(el) || el.tagName.toLowerCase()).slice(0, 30) }), 'Klik waar naartoe gescrold moet worden (of kies daarna "naar onderen")');
        else if (kind === 'scrollload') addStep({ type: 'scrollload', name: 'Alles laden door te scrollen', times: 5, pause: 800, detail: 'scrolt naar onderen tot alles er staat' });
        else if (kind === 'images') addStep({ type: 'images', name: 'Download alle PDF’s', pattern: '\\.pdf(\\?|$)', detail: 'alle PDF-koppelingen op de pagina → je map' });
        else if (kind === 'webhook') addStep({ type: 'webhook', name: 'Regel doorsturen', url: '', detail: 'stuurt de regel naar een https-adres' });
    }
    $all('[data-add]').forEach(b => b.onclick = () => { $('#flow-add-menu').style.display = 'none'; addByKind(b.dataset.add); });
    $all('[data-quick]').forEach(b => b.onclick = () => addByKind(b.dataset.quick));
    renderAddMenuHints();
    // PDF opslaan heeft geen extra vraag meer nodig: de print-functie ('debugger') is een vaste
    // toestemming van de extensie (Chrome staat die niet toe als optionele toestemming).
    function requestPrintPermission(cb) { cb(true); }
    // Wacht (max 2 min) tot een recht in het toestemmingsvenster is gegeven.
    async function wachtOpRecht(check) {
        for (let t0 = Date.now(); Date.now() - t0 < 120000; ) { await sleep(1000); try { if (await check()) return true; } catch (e) {} }
        return false;
    }

    // ---- PDF opslaan (zoals Ctrl+P → Opslaan als PDF) ----
    // Welke waarden kun je gebruiken voor een mapnaam/bestandsnaam bij stap i?
    // Kolommen uit je lijst, eerder uitgelezen waarden en de kolommen van een lus eromheen.
    function waardeOpties(i) {
        const uit = []; const voeg = (v, bron) => { if (v && !uit.some(o => o.v === v)) uit.push({ v, bron }); };
        const open = [];
        for (let k = 0; k < (i == null ? steps.length : i); k++) {
            const s = steps[k];
            if (isLusStart(s)) open.push(k); else if (s.type === 'endloop') open.pop();
            if (s.type === 'scrape' && s.kind === 'element') voeg(s.col || s.name, 'uitgelezen bij stap ' + (k + 1));
            if ((s.type === 'setval' || s.type === 'select') && invoerKolom(s)) voeg(invoerKolom(s), 'ingevuld bij stap ' + (k + 1));
        }
        open.forEach(k => { if (steps[k].type === 'loopklik') voeg('Item', 'lus'); ((steps[k].spec && steps[k].spec.columns) || []).forEach(c => voeg(c.name, 'lus')); });
        csvCols().forEach(c => voeg(c, 'lijst'));
        return uit;
    }
    function voorbeeldWaarde(naam) {
        const li = openLusIdx();
        if (li >= 0) { const it = lusItems(steps[li].spec)[0]; const c = it && (steps[li].spec.columns || []).find(x => x.name === naam); if (c) { const v = readField(it, c); if (v) return String(v).slice(0, 30); } }
        return exampleFor(naam);
    }
    function addPrintStep() {
        const opties = waardeOpties();
        const st = { type: 'print', name: 'PDF opslaan', detail: 'zoals Ctrl+P → Opslaan als PDF', folderBy: '', fileBy: '' };
        addStep(st); return;
        askInline({
            title: 'Per unieke waarde een eigen map?',
            html: '<div>Kies de waarde waarop de PDF’s in mappen komen, bv. per klantnummer. Elke unieke waarde krijgt een eigen map in <b>Downloads/' + esc(currentFolder) + '</b>.</div>',
            buttons: opties.slice(0, 6).map(o => { const ex = voorbeeldWaarde(o.v); return { label: o.v + (ex ? ' (bv. ' + ex + ')' : ''), primary: true, fn: () => { st.folderBy = o.v; st.fileBy = o.v; st.detail = 'PDF → map per “' + o.v + '”'; addStep(st); } }; })
                .concat([{ label: 'Nee, alles in één map', fn: () => addStep(st) }])
        });
    }
    // ---- Naar een pagina / terug ----
    function addNavStep() {
        const li = openLusIdx();
        const knoppen = [{ label: '↩ Terug (vorige pagina)', primary: true, fn: () => addStep({ type: 'nav', mode: 'back', name: 'Terug naar vorige pagina', detail: 'zoals de terugknop van de browser' }) }];
        if (li >= 0) knoppen.push({ label: '↩ Terug naar de lijst van de lus', fn: () => addStep({ type: 'nav', mode: 'loop', name: 'Terug naar de lijst', detail: 'naar de pagina waar de lus begon' }) });
        knoppen.push({ label: '➜ Naar deze pagina', fn: () => addStep({ type: 'nav', mode: 'url', url: location.href, name: 'Naar ' + kortUrl().slice(0, 30), detail: kortUrl() }) });
        knoppen.push({ label: t('cancel') });
        askInline({ title: 'Naar welke pagina?', html: '<div>Na deze stap wacht ParseLab vanzelf tot de pagina klaar is.</div>', buttons: knoppen });
    }
    // Het grootste zichtbare kader (iframe) op de pagina, als dat minstens `drempel` van het
    // scherm beslaat. Geeft het adres terug waarop de inhoud van dat kader nu staat.
    function hoofdKader(drempel) {
        const vw = window.innerWidth, vh = window.innerHeight;
        let best = null, bestA = 0;
        diepAlles(doc, 'iframe,frame').forEach(f => {
            if (vanOnsZelf(f)) return;
            const r = f.getBoundingClientRect();
            const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            if (w * h > bestA) { bestA = w * h; best = f; }
        });
        if (!best || bestA < vw * vh * (drempel == null ? 0.3 : drempel)) return null;
        let url = '';
        try { url = best.contentWindow.location.href; } catch (e) {}   // zelfde domein: het actuele adres
        if (!/^https?:/i.test(url)) { try { url = new URL(best.getAttribute('src') || '', location.href).href; } catch (e) { url = ''; } }
        return /^https?:/i.test(url) && url !== location.href ? url : null;
    }
    // Ga naar een adres. Binnen dezelfde web-app (bv. Vue/React) zonder herladen, zodat het paneel blijft.
    function gaNaar(url) {
        let u; try { u = new URL(url, location.href); } catch (e) { return; }
        if (u.href === location.href) return;
        if (u.origin === location.origin) {
            try { history.pushState(history.state, '', u.href); window.dispatchEvent(new PopStateEvent('popstate', { state: history.state })); return; } catch (e) {}
        }
        location.href = u.href;
    }
    // ---- Lus "voor elk item in een lijst" — met uitleg per stap ----
    function toonItems(spec, ms) {
        const its = lusItems(spec);
        its.forEach((e, k) => { if (e.dataset.wtOl == null) e.dataset.wtOl = e.style.outline || ''; e.style.outline = '2px dashed #2a78d6'; e.style.outlineOffset = '2px'; });
        setTimeout(() => its.forEach(e => { if (e.dataset.wtOl != null) { e.style.outline = e.dataset.wtOl; e.style.outlineOffset = ''; delete e.dataset.wtOl; } }), ms || 3000);
        if (its[0]) try { its[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        return its.length;
    }
    function startLusWizard() {
        beginPick(lusGekozen, 'Klik op één item (regel) in de lijst', 'loopitem', lusInKader); return;
        askInline({
            title: 'Lus maken · stap 1 van 3',
            html: '<div>Een lus doet dezelfde stappen <b>voor elk item in een lijst</b>, bv. voor elke klant in een overzicht.</div><div>Wijs nu <b>één item</b> in de lijst aan, bijvoorbeeld de eerste regel. ParseLab zoekt de andere items erbij.</div>',
            buttons: [{ label: 'Wijs een item aan →', primary: true, fn: () => beginPick(lusGekozen, 'Klik op één item (regel) in de lijst', 'loopitem', lusInKader) },
                { label: 'Elke knop/link in een lijst aanklikken (ook in een kader) →', fn: () => beginPick(el => loopKlikVan(beschrijfVoorStap(el, 'click'), null), 'Klik op het eerste item (of in de lijst)', 'click', loopKlikVan) },
                { label: t('cancel') }]
        });
    }
    function lusInKader(d, fr) {
        askInline({ title: 'Lijst in een kader', html: '<div>Deze lijst staat in een kader. Je kunt hem in één keer uitlezen, of elk item één voor één laten aanklikken.</div>',
            buttons: [{ label: 'Lijst uitlezen', primary: true, fn: () => leesKeuze(d, fr) }, { label: 'Elk item aanklikken (lijst aflopen) →', fn: () => beginPick(el => loopKlikVan(beschrijfVoorStap(el, 'click'), null), 'Klik op het eerste item dat aangeklikt moet worden', 'click', loopKlikVan) }, { label: t('cancel') }] });
    }
    function lusGekozen(el) {
        // Lus in een lus: zoek de lijst binnen het item van de buitenlus (bv. de regels binnen één groep).
        const li0 = openLusIdx(); let buiten = null;
        if (li0 >= 0 && steps[li0].spec) { try { buiten = itemVan(el, steps[li0].spec); } catch (e) {} }
        const det = autoDetectList(el, buiten || undefined);
        if (!det) {
            askInline({ title: 'Geen lijst gevonden', html: '<div>Ik zie hier geen herhalende lijst. Probeer een hele regel van de lijst aan te wijzen (niet de kop).</div>',
                buttons: [{ label: 'Opnieuw aanwijzen →', primary: true, fn: () => beginPick(lusGekozen, 'Klik op één item (regel) in de lijst', 'loopitem', lusInKader) }, { label: t('cancel') }] });
            return;
        }
        const n = toonItems(det, 2500); lusToevoegen(det, 0); return;
        const eerste = lusItems(det)[0];
        const ex = eerste ? det.columns.slice(0, 3).map(c => { const v = readField(eerste, c); return v ? esc(c.name) + ': ' + esc(String(v).slice(0, 30)) : ''; }).filter(Boolean).join(' · ') : '';
        askInline({
            title: 'Lus maken · stap 2 van 3 — klopt dit?',
            html: '<div>Ik zie <b>' + n + ' items</b> (blauw omlijnd op de pagina).</div>' + (ex ? '<div class="hint">Eerste item: ' + ex + '</div>' : '') + '<div>Tip: test eerst met 3 items; daarna zet je het aantal op “alle”.</div>',
            buttons: [
                { label: 'Ja, voor alle ' + n + ' items', primary: true, fn: () => lusToevoegen(det, 0) },
                { label: 'Eerst testen met 3', fn: () => lusToevoegen(det, 3) },
                { label: 'Opnieuw aanwijzen', fn: () => beginPick(lusGekozen, 'Klik op één item (regel) in de lijst', 'loopitem', lusInKader) },
                { label: t('cancel') }
            ]
        });
    }
    function lusToevoegen(det, max) {
        addStep({ type: 'loop', name: 'Voor elk item in de lijst', spec: det, max: max || 0, detail: det.count + ' items gevonden' + (max ? ' · test: eerste ' + max : '') });
        return;
        askInline({
            title: 'Lus maken · stap 3 van 3 — wat moet er per item gebeuren?',
            html: '<div>Alles wat je nu toevoegt, gebeurt <b>bij elk item</b>. Wijs het aan bij het <b>eerste</b> item; ParseLab doet hetzelfde bij de andere items.</div>' +
                  '<div class="hint">Vaak: ① klik op het item → ② wachten → ③ PDF opslaan of uitlezen → ④ terug naar de lijst. Klaar? Klik dan op <b>Lus afsluiten</b>.</div>',
            buttons: [
                { label: '⚡ PDF per item (klik → PDF → terug)', primary: true, fn: () => snelPdfLus(det) },
                { label: 'Zelf stappen toevoegen', fn: () => { toonTab('hand'); try { $('#wt-quick').scrollIntoView({ block: 'nearest' }); } catch (e) {} } }
            ]
        });
    }
    // Snelle route: in elk item ergens op klikken, wachten, PDF in een map per waarde, terug, volgende.
    function snelPdfLus(det) {
        askInline({ title: 'Waar moet ParseLab per item op klikken?', html: '<div>Klik in het <b>eerste</b> item op de link of knop die de detailpagina opent.</div>',
            buttons: [{ label: 'Aanwijzen →', primary: true, fn: () => beginPick(el => {
                addClickStep(el);
                addStep({ type: 'wait', mode: 'smart', ms: 10000, name: 'Wachten tot de pagina klaar is' });
                const kols = det.columns.map(c => c.name);
                askInline({ title: 'Per welke waarde een eigen map?', html: '<div>Elke unieke waarde krijgt een eigen map met daarin de PDF.</div>',
                    buttons: kols.slice(0, 6).map(k => { const it = lusItems(det)[0]; const c = det.columns.find(x => x.name === k); const v = it && c ? readField(it, c) : ''; return { label: k + (v ? ' (bv. ' + String(v).slice(0, 24) + ')' : ''), primary: true, fn: () => afronden(k) }; })
                        .concat([{ label: 'Alles in één map', fn: () => afronden('') }]) });
                function afronden(k) {
                    addStep({ type: 'print', name: 'PDF opslaan', detail: k ? 'PDF → map per “' + k + '”' : 'zoals Ctrl+P → Opslaan als PDF', folderBy: k, fileBy: k });
                    addStep({ type: 'nav', mode: 'loop', name: 'Terug naar de lijst', detail: 'naar de pagina waar de lus begon' });
                    addStep({ type: 'wait', mode: 'smart', ms: 10000, name: 'Wachten tot de lijst er weer staat' });
                    addStep({ type: 'endloop', name: 'Volgende item' });
                    const go = () => askInline({ title: '✔ Je lus is klaar', html: '<div>Klik op <b>Start</b>. ParseLab doet nu voor elk item: klikken → wachten → PDF opslaan → terug.</div>', buttons: [{ label: 'Start', primary: true, fn: () => startFlow() }, { label: 'Later' }] });
                    go();
                }
            }, 'Klik in het eerste item op de link of knop die het item opent', 'click', null) }, { label: t('cancel') }] });
    }
    async function loopKlikVan(d, fr) {
        const g = d.groep || {};
        let n = 0;
        if (g.binnen) {
            if (fr) { const r = await kaderOpdracht('run', { type: 'gebiedtel', gebied: g.binnen, sig: g.sig, frame: fr }); n = (r && r.n) || 0; }
            else n = gebiedItems({ binnen: g.binnen, sig: g.sig }).length;
        }
        if (n < 2) {
            // Eén losse knop (bv. "Zoeken"): daar valt niets af te lopen. Zonder deze controle zocht de
            // lus over de hele pagina en klikte hij op willekeurige knoppen ("Geef uw mening").
            const wasOmzetten = VERVANG != null; VERVANG = null;
            askInline({
                title: 'Hier is geen lijst om af te lopen',
                html: '<div>“' + esc(d.naam || 'Deze knop') + '” is <b>één losse knop</b>. <i>Lijst aflopen</i> klikt één voor één op <b>meerdere gelijke items</b> in een lijst (bv. alle verzekeringen onderaan).</div>' +
                    '<div>Wil je gewoon op deze knop drukken? Dan is het een gewone klik-stap.</div>',
                buttons: [
                    { label: wasOmzetten ? 'Laat het een gewone klik-stap' : 'Maak er een gewone klik-stap van', primary: true, fn: () => { if (!wasOmzetten && d.selector) vasteKnop(d, fr); } },
                    { label: 'Een lijst aanwijzen →', fn: () => beginPick(el => loopKlikVan(beschrijfVoorStap(el, 'click'), null), 'Klik in de lijst (de lege ruimte rond de items)', 'click', loopKlikVan) },
                    { label: t('cancel') }
                ]
            });
            return;
        }
        d.groepN = n;
        const st = { type: 'loopklik', name: 'Elk item één voor één', sig: g.sig || '', gebied: g.binnen || '', max: 0, frame: fr || undefined, detail: (d.groepN || '?') + ' items zoals “' + (d.naam || '') + '”' + (fr ? ' · in kader' : '') };
        addStep(st);
        askInline({
            title: 'Lijst aflopen · wat moet er per item gebeuren?',
            html: '<div>ParseLab klikt straks op elk item (' + (d.groepN || '?') + ': ' + esc((d.itemNamen || d.groepTeksten || []).slice(0, 4).join(', ')) + '…), één voor één. De tekst van het item komt in de kolom <b>Item</b>.</div>' +
                  '<div class="hint">Voeg nu toe wat er na de klik moet gebeuren (wachten, uitlezen, PDF) en sluit daarna de lus af.</div>',
            buttons: [
                { label: '⚡ PDF per item (map per item, daarna terug)', primary: true, fn: () => {
                    addStep({ type: 'wait', mode: 'smart', ms: 10000, name: 'Wachten tot de pagina klaar is' });
                    addStep({ type: 'print', name: 'PDF opslaan', detail: 'PDF → map per “Item”', folderBy: 'Item', fileBy: 'Item' });
                    addStep({ type: 'nav', mode: 'loop', name: 'Terug naar de lijst', detail: 'naar de lijst waar de lus begon' });
                    addStep({ type: 'wait', mode: 'smart', ms: 10000, name: 'Wachten tot de lijst er weer staat' });
                    addStep({ type: 'endloop', name: 'Volgende item' });
                } },
                { label: 'Zelf stappen toevoegen', fn: () => { toonTab('hand'); try { $('#wt-quick').scrollIntoView({ block: 'nearest' }); } catch (e) {} } }
            ]
        });
    }
    function sluitLus() {
        const li = openLusIdx();
        if (li < 0) { log('  ⓘ Er staat geen open lus.', true); return; }
        const binnen = steps.slice(li + 1);
        const andere = binnen.some(s => s.type === 'click' || (s.type === 'nav' && s.mode !== 'loop')) && !(binnen.length && binnen[binnen.length - 1].type === 'nav');
        const sluit = () => addStep({ type: 'endloop', name: steps[li].type === 'rijlus' ? 'Volgende regel' : 'Volgende item' });
        if (!andere || steps[li].type === 'rijlus') { sluit(); return; }
        askInline({ title: 'Lus afsluiten', html: '<div>In de lus ga je naar een andere pagina. Moet ParseLab na elk item <b>terug naar de lijst</b>?</div>',
            buttons: [{ label: 'Ja, terug naar de lijst', primary: true, fn: () => { addStep({ type: 'nav', mode: 'loop', name: 'Terug naar de lijst', detail: 'naar de pagina waar de lus begon' }); addStep({ type: 'wait', mode: 'smart', ms: 10000, name: 'Wachten tot de lijst er weer staat' }); sluit(); } },
                { label: 'Nee, gewoon afsluiten', fn: sluit }, { label: t('cancel') }] });
    }

    const BADGE = { rijlus: 'LUS', pairs: 'VELDEN', loopklik: 'LUS', loop: 'LUS', endloop: 'LUS ↺', nav: 'PAGINA', scrape: 'UITLEZEN', fill: 'INVULLEN', click: 'KLIKKEN', wait: 'WACHTEN', print: 'PDF', shot: 'FOTO',
        setval: 'INVULLEN', select: 'INVULLEN', type: 'TYPEN', key: 'TOETS', hover: 'MUIS', scroll: 'SCROLL', scrollload: 'SCROLL+', waitfor: 'WACHTEN', cond: 'ALS', images: 'BESTANDEN', webhook: 'WEBHOOK' };
    function csvCols() { return flowRows.length ? Object.keys(flowRows[0]).filter(k => k[0] !== '_') : []; }
    function exampleFor(col) { if (!flowRows.length || !col) return ''; const r = flowRows[0]; const k = Object.keys(r).find(x => x.toLowerCase() === String(col).toLowerCase()); const v = k != null ? r[k] : ''; return v == null || String(v).trim() === '' ? '' : String(v).slice(0, 24); }
    const opt = (v, cur, lbl) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + (lbl || v) + '</option>';
    function stepParamsHTML(s, i) {
        const t_ = s.type, tr = s.transform || {};
        let h = '';
        if (t_ === 'scrape' && s.kind === 'extern') {
            const cols = csvCols(), mo = s.modus || 'auto', o = (v, cur, l) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>';
            const vl = (s.velden || []).map((v, j) => '<div class="ext-veld"><input class="pin" data-i="' + i + '" data-f="evcol" data-j="' + j + '" value="' + esc(v.col) + '" title="Kolomnaam"><code title="' + esc(v.sel) + '">' + esc(v.sel.slice(0, 48)) + '</code>' + (v.voorbeeld ? '<span class="fex">bv. ' + esc(v.voorbeeld.slice(0, 30)) + '</span>' : '') + '<button class="mini" data-eweg="' + i + ':' + j + '" title="Veld weghalen">' + IC('x', 'ico-sm') + '</button></div>').join('');
            h = '<div class="stparams ext"><span>adres uit</span> <select data-i="' + i + '" data-f="urlKol">' + cols.map(c => o(c, s.urlKol || '', 'kolom “' + c + '”')).join('') + o('', s.urlKol || '', 'eigen adres…') + '</select>' +
                (s.urlKol ? '' : ' <input class="pin" data-i="' + i + '" data-f="eurl" placeholder="https://… (mag {{kolom}} bevatten)" value="' + esc(s.url || '') + '">') +
                ' <span>ophalen</span> <select data-i="' + i + '" data-f="modus">' + Object.keys(EXT_MODUS).map(k => o(k, mo, EXT_MODUS[k])).join('') + '</select>' +
                ' <span>pauze</span> <input class="pin s" type="number" min="0" step="0.5" data-i="' + i + '" data-f="pauze" value="' + ((s.pauze == null ? 1000 : s.pauze) / 1000) + '"> s' +
                '<div class="ext-velden">' + (vl || '<span class="fex">Geen velden: ParseLab leest de hele pagina (titel, koppen, label-waarde-paren en tekst).</span>') + '</div>' +
                '<div class="wt-row" style="flex-basis:100%;gap:6px"><button class="mini" data-epick="' + i + '">' + IC('target', 'ico-sm') + ' Veld aanwijzen</button><button class="mini" data-etest="' + i + '">' + IC('play', 'ico-sm') + ' Test op eerste adres</button></div>' +
                '<div class="hint" style="flex-basis:100%">Velden aanwijzen: open één pagina van dezelfde soort en klik op wat je wilt hebben. Haal alleen zakelijke gegevens op en houd een rustig tempo.</div></div>';
        } else if (t_ === 'scrape' && s.kind === 'element') {
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
            const col = invoerKolom(s), cols = csvCols();
            const bron = s.bron || (/^\{\{/.test(String(s.value || '')) || !s.value ? 'lijst' : 'vast');
            const inLijst = cols.some(c => c.toLowerCase() === col.toLowerCase());
            h = '<div class="stparams">' + (bron === 'lijst' && cols.length
                    ? '<span>kolom</span> <select data-i="' + i + '" data-f="lijstkol">' + cols.map(c => opt(c, inLijst ? cols.find(x => x.toLowerCase() === col.toLowerCase()) : '', c)).join('') + (inLijst ? '' : opt('', '', '— kies een kolom —')) + '</select>'
                    : '<span>kolomnaam</span> <input class="pin" data-i="' + i + '" data-f="kolnaam" value="' + esc(col) + '" placeholder="verplicht"' + (col ? '' : ' style="border-color:var(--bad)"') + '>') +
                ' <select data-i="' + i + '" data-f="bron">' + BRONNEN.map(b => opt(b[0], bron, b[1].split(' — ')[0])).join('') + '</select>' +
                (bron === 'lijst'
                    ? '<div class="wt-row" style="flex-basis:100%;gap:6px"><span>per ronde</span> <select data-i="' + i + '" data-f="lijstModus">' + opt('volgende', s.lijstModus || 'volgende', 'de volgende waarde') + opt('alle', s.lijstModus, 'alle waarden') + opt('aantal', s.lijstModus, 'een aantal waarden') + '</select>' +
                      (s.lijstModus === 'aantal' ? ' <input class="pin s" type="number" min="1" data-i="' + i + '" data-f="lijstAantal" value="' + (+s.lijstAantal || 2) + '">' : '') +
                      (s.lijstModus === 'alle' || s.lijstModus === 'aantal' ? ' <label><input type="checkbox" data-i="' + i + '" data-f="enterNa"' + (s.enterNa ? ' checked' : '') + '> Enter na elke waarde</label>' : '') + '</div>' +
                      (gebruikVan(col, s).length ? ' <span class="fex">gebruikt bij stap ' + gebruikVan(col, s).join(', ') + '</span>' : '') +
                      (cols.length ? '' : ' <span class="fex">upload eerst je lijst (bovenaan)</span>') +
                      '<div class="wt-row" style="flex-basis:100%;gap:6px"><span>reserve als de cel leeg is</span> <input class="pin" data-i="' + i + '" data-f="standaard" placeholder="optioneel" value="' + esc(s.standaard || '') + '">' +
                      ' <label><input type="checkbox" data-i="' + i + '" data-f="skipEmpty"' + (s.skipEmpty !== false ? ' checked' : '') + '> ' + esc(t('empty_skip')) + '</label></div>'
                    : bron === 'vast' && s.opties && s.opties.length ? ' <select data-i="' + i + '" data-f="vastwaarde">' + s.opties.map(x => opt(esc(x), esc(s.value || ''), esc(x))).join('') + (s.opties.indexOf(s.value) < 0 ? opt(esc(s.value || ''), esc(s.value || ''), esc(s.value || '— kies —')) : '') + '</select>'
                    : bron === 'vast' ? ' <input class="pin" data-i="' + i + '" data-f="vastwaarde" placeholder="tekst" value="' + esc(/^\{\{/.test(String(s.value || '')) ? '' : (s.value || '')) + '">'
                    : ' <span class="fex">' + esc(invoerUitleg(s)) + '</span> <button class="mini" data-invraag="' + i + '">✎ wijzig</button>') +
                '</div>';
        } else if (t_ === 'type') h = '<div class="stparams">tekst <input class="pin" data-i="' + i + '" data-f="text" value="' + esc(s.text || '') + '"> <label><input type="checkbox" data-i="' + i + '" data-f="enter"' + (s.enter ? ' checked' : '') + '> daarna Enter</label></div>';
        else if (t_ === 'key') h = '<div class="stparams">toets <input class="pin s" data-i="' + i + '" data-f="key" value="' + esc(s.key || 'Enter') + '"></div>';
        else if (t_ === 'wait') {
            const mode = s.mode || (s.selector ? 'element' : 'fixed');
            h = '<div class="stparams"><select data-i="' + i + '" data-f="mode">' + opt('smart', mode, 'tot de pagina klaar is') + opt('fixed', mode, 'een vaste tijd') + opt('element', mode, 'tot iets op de pagina staat') + '</select>' +
                (mode === 'fixed' ? ' <input class="pin s" type="number" step="0.5" min="0" data-i="' + i + '" data-f="sec" value="' + (Math.round((s.ms || 1000) / 100) / 10) + '"> seconden'
                    : ' hoogstens <input class="pin s" type="number" step="1" min="1" data-i="' + i + '" data-f="sec" value="' + Math.round((s.ms || 8000) / 1000) + '"> seconden') +
                (mode === 'element' ? ' <button class="mini" data-waitpick="' + i + '">' + (s.selector ? '✎ ' + esc((s.wname || 'aangewezen').slice(0, 20)) : 'Wijs aan →') + '</button>' : '') + '</div>';
        }
        else if (t_ === 'click' && s.regelKeuze) {
            const R = s.regelKeuze;
            h = '<div class="stparams"><span>' + R.regels.map(x => 'als ' + esc(x.kol) + ' ' + esc((OPS.find(y => y[0] === x.op) || [0, x.op])[1]) + (/leeg/.test(x.op) ? '' : ' “' + esc(x.waarde) + '”') + ' → ' + esc(String(R.namen[x.knop] || x.knop + 1).slice(0, 18))).join('<br>') + (R.anders >= 0 ? '<br>anders → ' + esc(String(R.namen[R.anders]).slice(0, 18)) : '<br>anders → niets') + '</span> <button class="mini" data-regelwijzig="' + i + '">✎ wijzig</button></div>';
        }
        else if (t_ === 'click' && !s.match) {
            h = '<div class="stparams"><span>' + (s.positie ? 'altijd de knop op deze plek, ongeacht de tekst' : 'deze knop') + '</span>' +
                ' <button class="mini" data-kwaarde="' + i + '">🔎 klik op een waarde i.p.v. deze knop</button> <button class="mini" data-kloop="' + i + '">↻ alle items aflopen</button>' + (s.groep && s.groep.binnen ? ' <button class="mini" data-kregel="' + i + '">🧮 kies de knop met een regel</button>' : '') + '</div>';
        }
        else if (t_ === 'click' && s.match) {
            const m = s.match, opties = waardeOpties(i);
            h = '<div class="stparams"><span>Klik op de tekst die</span> <select data-i="' + i + '" data-f="hoe">' + opt('gelijk', m.hoe, 'gelijk is aan') + opt('bevat', m.hoe, 'bevat') + '</select> ' +
                (m.bron === 'kolom' ? '<select data-i="' + i + '" data-f="mcol">' + opties.map(o => opt(o.v, m.col, o.v + ' (' + o.bron + ')')).join('') + (opties.some(o => o.v === m.col) ? '' : opt(m.col, m.col, m.col + ' (?)')) + '</select>'
                    : m.bron === 'vast' ? '<input class="pin" data-i="' + i + '" data-f="mtekst" value="' + esc(m.tekst || '') + '">'
                    : '<span>veld “' + esc((m.veld && m.veld.naam) || '?') + '”</span>') +
                ' <button class="mini" data-knoptest="' + i + '">test nu</button></div>';
        }
        else if (t_ === 'print') {
            const opties = waardeOpties(i);
            const sel = (f, cur, leeg) => '<select data-i="' + i + '" data-f="' + f + '">' + opt('', cur || '', leeg) + opties.map(o => opt(o.v, cur, o.v + ' (' + o.bron + ')')).join('') + (cur && !opties.some(o => o.v === cur) ? opt(cur, cur, cur + ' (?)') : '') + '</select>';
            const kaderNu = hoofdKader(0.3);
            h = '<div class="stparams"><span>Wat printen</span> <select data-i="' + i + '" data-f="printWhat">' + opt('auto', s.printWhat || 'auto', 'automatisch') + opt('frame', s.printWhat, 'alleen het kader') + opt('page', s.printWhat, 'de hele pagina') + '</select>' +
                (kaderNu && (s.printWhat || 'auto') !== 'page' ? '<div class="hint" style="flex-basis:100%">✔ Op deze pagina staat de inhoud in een kader; ParseLab print alleen dat kader, volledig.</div>' : '') + '</div>' +
                '<div class="stparams"><span>Map per unieke waarde</span> ' + sel('folderBy', s.folderBy, '— één map —') +
                ' <span>bestandsnaam</span> ' + sel('fileBy', s.fileBy, 'naam van de stap') +
                '<div class="hint" style="flex-basis:100%">Komt in <b>Downloads/' + esc(currentFolder) + (s.folderBy ? '/&lt;' + esc(s.folderBy) + '&gt;' : '') + '/</b> — net als Ctrl+P → Opslaan als PDF.' + (opties.length ? '' : ' Wil je een map per klant? Lees eerst een waarde uit of maak een lus.') + '</div></div>';
        }
        else if (t_ === 'loopklik') {
            h = '<div class="stparams"><span>klikt elk item' + (s.frame ? ' in het kader' : '') + ' aan</span> · hoogstens <input class="pin s" type="number" min="0" data-i="' + i + '" data-f="max" value="' + (+s.max || 0) + '"> <span>(0 = alle)</span>' +
                (openLusIdx() === i ? '<div class="hint" style="flex-basis:100%">Nog open: voeg de stappen per item toe en klik daarna <b>Lus afsluiten</b>.</div>' : '') + '</div>';
        }
        else if (t_ === 'loop') {
            const n = lusItems(s.spec).length;
            h = '<div class="stparams"><span>' + (n ? n + ' items op deze pagina' : 'lijst staat niet op deze pagina') + '</span> · hoogstens <input class="pin s" type="number" min="0" data-i="' + i + '" data-f="max" value="' + (+s.max || 0) + '" title="0 = alle items"> <span>(0 = alle)</span>' +
                ' <button class="mini" data-lusshow="' + i + '">toon items</button> <button class="mini" data-luspick="' + i + '">opnieuw aanwijzen</button>' +
                (openLusIdx() === i ? '<div class="hint" style="flex-basis:100%">Nog open: voeg de stappen per item toe en klik daarna <b>Lus afsluiten</b>.</div>' : '') + '</div>';
        }
        else if (t_ === 'nav') {
            const m = s.mode || 'back';
            h = '<div class="stparams"><select data-i="' + i + '" data-f="mode">' + opt('back', m, 'terug (vorige pagina)') + opt('loop', m, 'terug naar de lijst van de lus') + opt('url', m, 'naar een vast adres') + '</select>' +
                (m === 'url' ? ' <input class="pin" data-i="' + i + '" data-f="url" value="' + esc(s.url || '') + '" placeholder="https://…">' : '') + '</div>';
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
        if (t_ !== 'cond' && !isLusStart(s) && t_ !== 'endloop') h += '<div class="stparams stonly"><label><input type="checkbox" data-onlyif="' + i + '"' + (s.onlyIf ? ' checked' : '') + '> ' + esc(t('onlyif')) + '</label>' +
            (s.onlyIf ? ' <span class="fex">' + esc((s.onlyIf.name || 'aangewezen').slice(0, 24)) + '</span> <button class="mini" data-onlyifpick="' + i + '" title="Wijs opnieuw aan">✎</button>' : '') + '</div>';
        return h;
    }
    function bindParams(box) {
        box.querySelectorAll('.stparams [data-f]').forEach(inp => inp.addEventListener((inp.tagName === 'SELECT' || inp.type === 'checkbox') ? 'change' : 'input', () => {
            const s = steps[+inp.dataset.i], f = inp.dataset.f;
            const val = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' ? +inp.value : inp.value);
            if (s.kind === 'extern' && /^(urlKol|eurl|modus|pauze|evcol)$/.test(f)) {
                if (f === 'evcol') { const j = +inp.dataset.j; if (s.velden && s.velden[j] && String(val).trim()) s.velden[j].col = String(val).trim(); }
                else if (f === 'pauze') s.pauze = Math.max(0, Math.round((+val || 0) * 1000));
                else if (f === 'urlKol') { s.urlKol = val; renderSteps(); }
                else if (f === 'eurl') s.url = val;
                else s.modus = val;
                s.detail = externUitleg(s); renderFlow(); persist(); return;
            }
            if (f === 'num') { s.num = !!val; s.transform = s.transform || {}; if (!s.transform.pattern) s.transform.mode = val ? 'number' : 'none'; }
            else if (f === 'tpattern') { s.transform = s.transform || {}; s.transform.pattern = val; s.transform.mode = val ? 'regex' : (s.num ? 'number' : 'none'); }
            else if (f === 'setcolname') { s.value = String(val).trim() ? '{{' + String(val).trim() + '}}' : ''; if (inp.tagName === 'SELECT') renderSteps(); }
            else if (f === 'kolnaam') { return; }   // wordt pas doorgevoerd bij 'change' (zie hieronder)
            else if (f === 'bron') {
                const c = invoerKolom(s); s.col = c;
                if (val === 'eerder' || val === 'logica' || val === 'oplopend') { invoerVraag(s, val); return; }
                delete s.eerder; delete s.logica;
                if (val === 'vast') s.value = s.standaard || ''; else s.value = '{{' + c + '}}';
                s.bron = val; s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : ''); renderSteps();
            }
            else if (f === 'lijstkol') { if (!val) return; const oud = invoerKolom(s); if (kolomAlBij(val, s) >= 0) { log('  De kolom “' + val + '” is al gekoppeld aan stap ' + (kolomAlBij(val, s) + 1) + '.', true); renderSteps(); return; } s.col = val; s.value = '{{' + val + '}}'; s.name = (s.kind === 'keuzelijst' ? 'Keuzelijst: ' : s.kind === 'datum' ? 'Datum: ' : 'Veld: ') + val.slice(0, 22); if (oud && oud !== val) hernoemKolom(oud, val, s); s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : ''); renderSteps(); }
            else if (f === 'lijstModus') { s.lijstModus = val; if (val === 'aantal' && !s.lijstAantal) s.lijstAantal = 2; renderSteps(); setStartLabel(); }
            else if (f === 'lijstAantal') { s.lijstAantal = Math.max(1, +val || 1); setStartLabel(); renderRondes(); }
            else if (f === 'vastwaarde') { s.value = val; s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : ''); }
            else if (f === 'standaard') { if (String(val).trim()) s.standaard = val; else delete s.standaard; }
            else if (f === 'hoe' || f === 'mcol' || f === 'mtekst') { s.match = s.match || {}; if (f === 'hoe') s.match.hoe = val; if (f === 'mcol') s.match.col = val; if (f === 'mtekst') s.match.tekst = val; s.detail = matchOmschrijving(s.match) + (s.frame ? ' · in kader' : ''); }
            else if (f === 'sec') { s.ms = Math.max(0, Math.round((+val || 0) * 1000)); }
            else if (f === 'mode' && s.type === 'wait') {
                s.mode = val; if (val === 'smart' && (!s.ms || s.ms < 2000)) s.ms = 8000; if (val === 'fixed' && s.ms > 60000) s.ms = 1000;
                s.name = val === 'smart' ? 'Wachten tot de pagina klaar is' : val === 'fixed' ? 'Even wachten' : 'Wachten tot iets er staat'; renderSteps();
            }
            else if (f === 'mode' && s.type === 'nav') { s.mode = val; s.name = val === 'back' ? 'Terug naar vorige pagina' : val === 'loop' ? 'Terug naar de lijst' : 'Naar ' + kortUrl(s.url || location.href).slice(0, 30); if (val === 'url' && !s.url) s.url = location.href; renderSteps(); }
            else if (f === 'url' && s.type === 'nav') { s.url = val; s.detail = kortUrl(val); }
            else if (f === 'folderBy' || f === 'fileBy') { s[f] = val; if (f === 'folderBy') s.detail = val ? 'PDF → map per “' + val + '”' : 'zoals Ctrl+P → Opslaan als PDF'; renderSteps(); }
            else if (f === 'url') { s.url = val; s.detail = val; }
            else { s[f] = val; if (f === 'test' || f === 'ifFalse') renderSteps(); }
            renderFlow(); persist();
        }));
        box.querySelectorAll('.stparams [data-f="url"]').forEach(inp => inp.addEventListener('change', () => renderSteps()));
        box.querySelectorAll('[data-invraag]').forEach(b => b.onclick = () => invoerVraag(steps[+b.dataset.invraag]));
        box.querySelectorAll('[data-regelwijzig]').forEach(b => b.onclick = () => { const st = steps[+b.dataset.regelwijzig]; regelVraag({ gebied: st.regelKeuze.gebied, sig: st.regelKeuze.sig, namen: st.regelKeuze.namen }, st.frame, st); });
        box.querySelectorAll('[data-kregel]').forEach(b => b.onclick = () => { const st = steps[+b.dataset.kregel]; regelVanGebied({ groep: st.groep, naam: st.name }, st.frame, st); });
        box.querySelectorAll('[data-uplst]').forEach(b => b.onclick = () => $('#flow-file').click());
        box.querySelectorAll('.stparams [data-f="vastwaarde"],.stparams [data-f="standaard"]').forEach(inp => inp.addEventListener('change', () => renderSteps()));
        box.querySelectorAll('.stparams [data-f="kolnaam"]').forEach(inp => inp.addEventListener('change', () => {
            const s = steps[+inp.dataset.i], oud = invoerKolom(s), nieuw = lijstSpelling(String(inp.value).trim());
            if (!nieuw) { log('  ⚠ Een invoerveld heeft altijd een kolomnaam nodig.', true); inp.value = oud; return; }
            const k = kolomAlBij(nieuw, s); if (k >= 0) { log('  ⚠ De kolomnaam “' + nieuw + '” bestaat al bij stap ' + (k + 1) + '.', true); inp.value = oud; return; }
            const n = hernoemKolom(oud, nieuw, s);
            s.col = nieuw; if ((s.bron || 'lijst') === 'lijst') s.value = '{{' + nieuw + '}}';
            s.name = (s.kind === 'keuzelijst' ? 'Keuzelijst: ' : s.kind === 'datum' ? 'Datum: ' : 'Veld: ') + nieuw.slice(0, 22);
            s.detail = invoerUitleg(s) + (s.frame ? ' · in kader' : '');
            if (oud && oud !== nieuw) log('  ✔ “' + oud + '” heet nu “' + nieuw + '”' + (n ? ' — ook aangepast in ' + n + ' andere verwijzing(en)' : '') + '.', true);
            renderSteps(); renderFlow(); persist();
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
        box.querySelectorAll('[data-onlyif]').forEach(cb => cb.addEventListener('change', () => {
            const s = steps[+cb.dataset.onlyif];
            if (!cb.checked) { delete s.onlyIf; renderSteps(); renderFlow(); persist(); return; }
            pickOnlyIf(s);
        }));
        box.querySelectorAll('[data-onlyifpick]').forEach(b => b.onclick = () => pickOnlyIf(steps[+b.dataset.onlyifpick]));
        box.querySelectorAll('[data-kwaarde]').forEach(b => b.onclick = () => { const i = +b.dataset.kwaarde, s = steps[i]; VERVANG = i; klikWaar({ selector: s.selector, fp: s.fp, naam: s.name, groep: s.groep || {} }, s.frame); });
        box.querySelectorAll('[data-kloop]').forEach(b => b.onclick = () => { const i = +b.dataset.kloop, s = steps[i]; VERVANG = i; loopKlikVan({ naam: s.name, groep: s.groep || {}, groepN: '?' }, s.frame); });
        box.querySelectorAll('[data-knoptest]').forEach(b => b.onclick = async () => {
            const s = steps[+b.dataset.knoptest]; const w = await matchWaarde(s, Object.assign({}, huidigeInvoer(), flowRows[0] || {}), {});
            if (!w) { flash(b, 'geen waarde'); return; }
            const r = await zoekKnopNu(s, w); flash(b, r.ok ? '✔ “' + r.tekst + '”' : '✗ “' + w + '” niet gevonden');
        });
        box.querySelectorAll('[data-lusshow]').forEach(b => b.onclick = () => { const n = toonItems(steps[+b.dataset.lusshow].spec, 3000); flash(b, n ? '✔ ' + n + ' items' : '✗ niet op deze pagina'); });
        box.querySelectorAll('[data-luspick]').forEach(b => b.onclick = () => { const s = steps[+b.dataset.luspick]; beginPick(el => { const det = autoDetectList(el); if (!det) { log('  ⚠ Geen lijst gevonden — wijs een hele regel aan.', true); return; } s.spec = det; s.detail = det.count + ' items gevonden'; toonItems(det, 2500); renderSteps(); renderFlow(); persist(); }, 'Klik op één item (regel) in de lijst'); });
        box.querySelectorAll('[data-gopage]').forEach(b => b.onclick = e => { e.stopPropagation(); const u = b.dataset.gopage; if (u) naarAdres(u); });
        box.querySelectorAll('[data-epick]').forEach(b => b.onclick = () => externVeldAanwijzen(steps[+b.dataset.epick]));
        box.querySelectorAll('[data-eweg]').forEach(b => b.onclick = () => { const [i, j] = b.dataset.eweg.split(':').map(Number); const st = steps[i]; if (st && st.velden) { st.velden.splice(j, 1); st.detail = externUitleg(st); renderSteps(); renderFlow(); persist(); } });
        box.querySelectorAll('[data-etest]').forEach(b => b.onclick = async () => {
            const st = steps[+b.dataset.etest], rij = (rondeRijen()[0]) || flowRows[0] || {};
            b.disabled = true; const oud = b.innerHTML; b.textContent = 'bezig…';
            const r = await externStap(Object.assign({}, st, { pauze: 0 }), rij, { ronde: 1 });
            let melding = '✗ niet gelukt';
            if (r && r.merge) { const ks = Object.keys(r.merge).filter(k => k !== 'Adres'); log('  🔎 Test: ' + (ks.length ? ks.slice(0, 6).map(k => k + ' = “' + String(r.merge[k]).slice(0, 40) + '”').join(' · ') + (ks.length > 6 ? ' …' : '') : 'niets gevonden'), true); melding = r.ok ? '✔ ' + ks.length + ' velden' : '✗ leeg'; }
            b.textContent = melding; setTimeout(() => { b.disabled = false; b.innerHTML = oud; }, 1400);
        });
        box.querySelectorAll('[data-waitpick]').forEach(b => b.onclick = () => {
            const s = steps[+b.dataset.waitpick];
            beginPick(el => { s.selector = cssPath(el); s.fp = fingerprint(el); delete s.frame; s.wname = (txt(el) || el.tagName.toLowerCase()).slice(0, 24); s.mode = 'element'; renderSteps(); renderFlow(); persist(); }, 'Klik op wat er moet staan voordat we verdergaan', 'any',
                kaderAlgemeen(o => { s.selector = o.selector; s.fp = o.fp; s.frame = o.frame; s.wname = (o.naam || '').slice(0, 24); s.mode = 'element'; renderSteps(); renderFlow(); persist(); }));
        });
    }
    function pickOnlyIf(s) {
        onPickEnd = () => { if (!s.onlyIf) renderSteps(); };   // geannuleerd → vinkje weer uit
        beginPick(el => { s.onlyIf = { selector: cssPath(el), fp: fingerprint(el), name: (txt(el) || el.tagName.toLowerCase()).slice(0, 24) }; renderSteps(); renderFlow(); persist(); }, 'Klik op wat er moet zijn om deze stap uit te voeren', 'any',
            kaderAlgemeen(o => { s.onlyIf = { selector: o.selector, fp: o.fp, name: (o.naam || '').slice(0, 24), frame: o.frame }; renderSteps(); renderFlow(); persist(); }));
    }
    function insertPause(idx) { insertStep(idx, { type: 'wait', ms: 1000 }); }
    function inserterHTML(idx) { return '<div class="stins"><button class="stins-btn" data-ins="' + idx + '" title="Pauze toevoegen tussen deze stappen">+</button></div>'; }
    // Elke pagina (adres) krijgt een nummer in de volgorde waarin hij in de taak voorkomt.
    function paginaNummers() {
        const nr = {}, lijst = [];
        steps.forEach(x => { if (x.page && nr[x.page] == null) { lijst.push(x.page); nr[x.page] = lijst.length; } });
        return { nr, lijst };
    }
    function renderSamenvatting() {
        const el = $('#wt-samenvatting'), lg = $('#wt-paginas'); if (!el) return;
        const pn = paginaNummers();
        el.innerHTML = steps.length ? '<b>' + steps.length + ' stappen</b> · ' + pn.lijst.length + ' pagina' + (pn.lijst.length === 1 ? '' : '’s') + (flowRows.length ? ' · ' + flowRows.length + ' regels uit je lijst' : '') + (steps.some(x => x.frame) ? ' · ▣ = in een kader' : '') : 'Nog geen stappen — kies hieronder wat je wilt doen.';
        const tn = $('#tab-n'); if (tn) tn.textContent = steps.length ? String(steps.length) : '';
        const fs = $('#wt-flowsum'); if (fs) fs.textContent = steps.length ? steps.length + ' stappen · ' + pn.lijst.length + ' pagina' + (pn.lijst.length === 1 ? '' : '’s') : '';
        if (lg) lg.innerHTML = pn.lijst.length > 1 ? pn.lijst.map((u, k) => '<b>Pagina ' + (k + 1) + '</b> = <code>' + esc(u.slice(0, 40)) + '</code>').join(' · ') : '';
    }
    // 📄 Navigeren per pagina: terug/vooruit binnen de site en direct naar de pagina van een stap.
    function renderPaginaNav() {
        const box = $('#pagina-nav'); if (!box) return;
        const pn = paginaNummers();
        if (!steps.length) { box.style.display = 'none'; return; }
        box.style.display = '';
        const hier = paginaSleutel();
        box.innerHTML = '<button class="mini" data-pn="terug" title="Vorige pagina (binnen de site of het kader)">◀ terug</button><button class="mini" data-pn="vooruit" title="Volgende pagina">vooruit ▶</button><span class="pn-sp">|</span>' +
            pn.lijst.map(pg => { const st = steps.find(x => x.page === pg); return '<button class="pchip' + (pg === hier ? ' hier' : '') + '" data-pg="' + esc(pg) + '" title="' + esc((st && st.pageUrl) || pg) + '">p.' + pn.nr[pg] + ' <small>' + esc(pg.slice(0, 18)) + '</small></button>'; }).join('');
        box.querySelectorAll('[data-pn]').forEach(b => b.onclick = async () => { await siteGrant(); if (b.dataset.pn === 'terug') history.back(); else history.forward(); setTimeout(renderPaginaNav, 900); });
        box.querySelectorAll('[data-pg]').forEach(b => b.onclick = async () => {
            const pg = b.dataset.pg, st = steps.find(x => x.page === pg);
            PG_DICHT.delete(pg); renderSteps();
            const kop = $('#flow-steps [data-pagina="' + CSS.escape(pg) + '"]'); if (kop) try { kop.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
            if (!st || !st.pageUrl || pg === paginaSleutel()) return;
            naarAdres(st.pageUrl);
        });
    }
    // Naar een opgeslagen adres: binnen dezelfde pagina via het #-deel, anders echt laden (het paneel komt terug).
    async function naarAdres(url) {
        let u; try { u = new URL(url, location.href); } catch (e) { return; }
        if (u.href === location.href) return;
        await siteGrant();
        if (u.origin + u.pathname + u.search === location.origin + location.pathname + location.search) { location.hash = u.hash; setTimeout(() => { try { renderPaginaNav(); renderSteps(); } catch (e) {} }, 300); }
        else location.href = u.href;
    }
    window.addEventListener('hashchange', () => { try { renderPaginaNav(); } catch (e) {} });
    window.addEventListener('popstate', () => { try { renderPaginaNav(); } catch (e) {} });
    let BEWERK = false; const OPEN_ST = new Set(), PG_DICHT = new Set(); let OPSLAG_KOLOMMEN = null;
    function verhuisNaarPagina(st, pg) {
        const ref = steps.find(x => x !== st && x.page === pg);
        st.page = pg; if (ref) st.pageUrl = ref.pageUrl;
        const nr = paginaNummers().nr[pg];
        log('  “' + (st.name || st.type) + '” staat nu op pagina ' + (nr || '') + ' (' + String(pg).slice(0, 40) + ').', true);
    }
    // Elke soort stap heeft een eigen kleur: invullen, klikken, uitlezen, pagina, opslaan, herhalen.
    function groepVan(t) { return /^(setval|select|fill|type|key)$/.test(t) ? 'in' : /^(click|hover)$/.test(t) ? 'kl' : t === 'scrape' ? 'ui' : /^(nav|wait|waitfor|scroll|scrollload)$/.test(t) ? 'pg' : /^(print|shot|images|webhook)$/.test(t) ? 'op' : 'he'; }
    const STAP_ICOON = { setval: 'edit', select: 'edit', fill: 'edit', type: 'keyboard', key: 'keyboard', click: 'cursor', hover: 'eye', scrape: 'search', wait: 'clock', waitfor: 'clock', print: 'printer', shot: 'camera',
        nav: 'goto', loop: 'repeat', loopklik: 'repeat', rijlus: 'list', endloop: 'repeat', scroll: 'move', scrollload: 'move', images: 'download', webhook: 'send', cond: 'branch' };
    // Stap 1 heeft altijd een startadres: leeg? Dan het adres waar stap 1 is aangewezen.
    function vulStartUrl() { const e = $('#flow-startUrl'); if (!e || e.value.trim()) return; const s0 = steps.find(x => x.pageUrl && !x.frame); if (s0) { e.value = s0.pageUrl; persist(); } }
    function renderSteps() {
        const box = $('#flow-steps'); box.innerHTML = '';
        try { vulStartUrl(); } catch (e) {}
        renderSamenvatting(); try { renderAiContext(); } catch (e) {} try { renderRondes(); } catch (e) {} try { renderPaginaNav(); } catch (e) {} try { const ae = host.shadowRoot && host.shadowRoot.activeElement; if (!(ae && ae.closest && ae.closest('#lijst-box'))) renderLijst(); } catch (e) {}
        if (!steps.length) { box.innerHTML = '<div class="hint" style="padding:6px 0">Nog geen stappen. Kies hierboven wat er moet gebeuren, of neem je taak op.</div>'; renderCoach(); return; }
        let html = '';
        let diepte = 0, vorigePagina = null, blokken = 0, pgOpen = false;
        const pnr = paginaNummers();
        const telPg = {}; steps.forEach(x => { if (x.page) telPg[x.page] = (telPg[x.page] || 0) + 1; });
        steps.forEach((s, i) => {
            if (s.type === 'wait' && !s.name) s.name = s.mode === 'smart' ? 'Wachten tot de pagina klaar is' : 'Even wachten';
            if (s.type === 'endloop') diepte = Math.max(0, diepte - 1);
            if (s.page && s.page !== vorigePagina) {
                const nr = pnr.nr[s.page], ga = s.pageUrl ? '<button class="mini" data-gopage="' + esc(s.pageUrl) + '" title="Ga naar deze pagina">' + IC('goto', 'ico-sm') + '</button>' : '';
                if (diepte === 0 && blokken === 0) {
                    if (pgOpen) html += '</div></div>';
                    const dicht = PG_DICHT.has(s.page);
                    html += '<div class="pgblok' + (dicht ? ' dicht' : '') + (s.page === paginaSleutel() ? ' hier' : '') + '" data-pagina="' + esc(s.page) + '"><div class="pgkop" data-pgtoggle="' + esc(s.page) + '">' + IC(dicht ? 'chevron-right' : 'chevron-down', 'ico-sm') + IC('doc', 'ico-sm') +
                        '<b>Pagina ' + nr + '</b><code title="' + esc(s.pageUrl || s.page) + '">' + esc(s.page.slice(0, 40)) + '</code><span class="pgn">' + telPg[s.page] + ' stap' + (telPg[s.page] === 1 ? '' : 'pen') + '</span>' + ga + '</div><div class="pginh">';
                    pgOpen = true;
                } else html += '<div class="stpage" data-pagina="' + esc(s.page) + '">' + IC('doc', 'ico-sm') + ' verder op <b>pagina ' + nr + '</b> <code>' + esc(s.page.slice(0, 32)) + '</code>' + ga + '</div>';
            }
            if (s.page) vorigePagina = s.page;
            const inspring = diepte;
            if (isLusStart(s)) { html += '<div class="lusblok' + (inspring ? ' binnen' : '') + '"><div class="luskop"><span class="luscirkel">' + IC('repeat', 'ico-sm') + '</span><b>' + (inspring ? 'Lus in de lus' : 'Lus') + '</b><span class="hint">herhaalt alles in dit kader voor elk item</span></div>'; blokken++; }
            if (isLusStart(s)) diepte++;
            const open = BEWERK || OPEN_ST.has(s.id);
            const nameField = open ? '<input class="stname" value="' + esc(s.name || '') + '" data-i="' + i + '" title="Klik om te hernoemen">' : '<span class="stname kort">' + esc(s.name || s.type) + '</span>';
            const vb = stapVoorbeeld(s, i, VB_RONDE);
            html += (i > 0 ? inserterHTML(i) : '') +
                '<div draggable="true" data-sleep="' + i + '" class="stprow g-' + groepVan(s.type) + (open ? ' open' : '') + (inspring ? ' inlus' : '') + (isLusStart(s) || s.type === 'endloop' ? ' lusrand' : '') + '">' +
                '<span class="stgrip" title="Sleep om te verplaatsen (binnen deze pagina)">' + IC('grip', 'ico-sm') + '</span>' +
                '<span class="ststat" data-i="' + i + '"></span>' +
                '<span class="stnum">' + (i + 1) + '</span>' +
                '<span class="sticoon b-' + s.type + '" title="' + esc(BADGE[s.type] || s.type) + '">' + IC(STAP_ICOON[s.type] || 'cursor', 'ico-sm') + '</span>' +
                '<div class="stmid">' + nameField + (vb ? '<div class="stvb" data-vb="' + i + '">' + esc(vb) + '</div>' : '') + (s.detail ? '<div class="stdet" title="' + esc((s.fp && s.fp.html) ? s.fp.html : s.detail) + '">' + esc(s.detail) + '</div>' : '') + '</div>' +
                (s.opgenomen ? '<span class="sther" title="opgenomen">' + IC('rec', 'ico-sm') + '</span>' : s.viaAi ? '<span class="sther" title="via AI">' + IC('spark', 'ico-sm') + '</span>' : '') + (s.frame ? '<span class="sther" title="in een kader">' + IC('frame', 'ico-sm') + '</span>' : '') +
                (/^(loop|loopklik|endloop|nav|print)$/.test(s.type) ? '' : '<span class="strep" title="herhaal deze stap zoveel keer">×<input class="strepn" type="number" min="1" value="' + (s.rep || 1) + '" data-i="' + i + '"></span>') +
                (s.selector || s.fp ? '<button class="mini" data-show="' + i + '" title="Toon het gekoppelde element op de pagina">' + IC('target', 'ico-sm') + '</button>' : '') +
                (s.type === 'fill' ? '<button class="mini" data-tmpl="' + i + '" title="Invullijst (Excel) van dit formulier downloaden">' + IC('file-plus', 'ico-sm') + '</button>' : '') +
                '<button class="mini" data-up="' + i + '" title="Omhoog">' + IC('up', 'ico-sm') + '</button><button class="mini" data-down="' + i + '" title="Omlaag">' + IC('down', 'ico-sm') + '</button>' +
                '<button class="mini danger" data-del="' + i + '" title="Verwijder stap">' + IC('trash', 'ico-sm') + '</button>' +
                '<button class="mini stpijl" data-open="' + s.id + '" title="' + (open ? 'Inklappen' : 'Uitklappen') + '">' + IC(open ? 'chevron-down' : 'chevron-right', 'ico-sm') + '</button>' +
                (open ? '<div class="stparams sturl"><span>' + IC('pin', 'ico-sm') + ' adres</span> <code title="' + esc(s.pageUrl || '') + '">' + esc(kortUrl(s.pageUrl || '') || '—') + '</code>' + (s.pageUrl ? ' <button class="mini" data-vanaf="' + i + '" title="Ga naar dit adres en start vanaf deze stap">' + IC('goto', 'ico-sm') + ' start vanaf hier</button>' : '') + '</div>' + stepParamsHTML(s, i) : '') +
                '</div>';
            if (s.type === 'endloop' && blokken > 0) { html += '</div>'; blokken--; }
        });

        if (openLusIdx() >= 0) html += '<div class="knoprij"><button class="wt-btn" data-sluitlus="1">' + IC('check', 'ico-sm') + '<span>Lus afsluiten</span></button><button class="wt-btn alt" data-quick2="loop">' + IC('repeat', 'ico-sm') + '<span>Lus in deze lus</span></button><span class="hint">Klaar met de stappen per item? Of maak een lus binnen deze lus.</span></div>';
        while (blokken > 0) { html += '</div>'; blokken--; }
        if (pgOpen) html += '</div></div>';
        { const n = aantalRondes(); const tm = { klaar: 'als de pagina klaar is', sec: 'na ' + (($('#flow-tussen-sec') && $('#flow-tussen-sec').value) || 3) + ' seconden', rustig: 'in een rustig tempo: pagina klaar, dan ' + (($('#flow-tussen-sec') && $('#flow-tussen-sec').value) || 3) + ' tot ' + 2 * ((($('#flow-tussen-sec') && $('#flow-tussen-sec').value) || 3)) + ' seconden pauze', klik: 'als je op Volgende klikt', direct: 'meteen' }[($('#flow-tussen') && $('#flow-tussen').value) || 'klaar'];
          html += '<div class="rondeinde">' + IC('repeat', 'ico-sm') + '<span><b>Einde van de ronde.</b> ' + (n > 1 ? 'Daarna begint ronde 2 van ' + n + ' (' + tm + ')' + ($('#flow-terugstart') && $('#flow-terugstart').checked ? ', weer vanaf stap 1 op de pagina van stap 1.' : ', vanaf stap 1.') : 'Er is maar één ronde.') + '</span></div>'; }
        box.innerHTML = html; box.classList.toggle('bewerk', BEWERK);
        bindParams(box);
        box.querySelectorAll('[data-open]').forEach(b => b.onclick = e => { e.stopPropagation(); const id = +b.dataset.open; if (OPEN_ST.has(id)) OPEN_ST.delete(id); else OPEN_ST.add(id); renderSteps(); });
        box.querySelectorAll('.stprow:not(.open)').forEach(r => r.onclick = e => { const t0 = e.composedPath ? e.composedPath()[0] : e.target; if (t0 && t0.closest && t0.closest('button,input,select')) return; const st = steps[+r.dataset.sleep]; if (st) { OPEN_ST.add(st.id); renderSteps(); } });
        box.querySelectorAll('[data-vanaf]').forEach(b => b.onclick = () => startVanaf(+b.dataset.vanaf));
        box.querySelectorAll('[data-pgtoggle]').forEach(k => k.onclick = e => { const t0 = e.composedPath ? e.composedPath()[0] : e.target; if (t0 && t0.closest && t0.closest('button')) return; const pg = k.dataset.pgtoggle; if (PG_DICHT.has(pg)) PG_DICHT.delete(pg); else PG_DICHT.add(pg); renderSteps(); });
        box.querySelectorAll('[data-sluitlus]').forEach(b => b.onclick = () => sluitLus());
        box.querySelectorAll('[data-quick2]').forEach(b => b.onclick = () => addByKind(b.dataset.quick2));
        // Slepen om de volgorde te veranderen (niet starten vanuit een invoerveld of knop in de stap).
        let sleepVan = null;
        box.querySelectorAll('[data-sleep]').forEach(r => {
            r.addEventListener('dragstart', e => { const t0 = e.composedPath ? e.composedPath()[0] : e.target; if (t0 && t0.closest && t0.closest('input,select,button,textarea')) { e.preventDefault(); return; } sleepVan = +r.dataset.sleep; r.classList.add('sleept'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(sleepVan)); } catch (_) {} });
            r.addEventListener('dragend', () => { r.classList.remove('sleept'); box.querySelectorAll('.sleepdoel').forEach(x => x.classList.remove('sleepdoel')); });
            r.addEventListener('dragover', e => { if (sleepVan == null) return; e.preventDefault(); r.classList.add('sleepdoel'); });
            r.addEventListener('dragleave', () => r.classList.remove('sleepdoel'));
            r.addEventListener('drop', e => { e.preventDefault(); const naar = +r.dataset.sleep; if (sleepVan == null || naar === sleepVan) return;
                const doel = steps[naar], [st] = steps.splice(sleepVan, 1);
                if ((st.page || '') !== (doel.page || '')) { verhuisNaarPagina(st, doel.page); }
                steps.splice(naar, 0, st); sleepVan = null; renderSteps(); renderFlow(); persist(); });
        });
        // Op een paginakop loslaten: de stap komt achteraan op die pagina.
        box.querySelectorAll('.pgkop').forEach(k => {
            k.addEventListener('dragover', e => { if (sleepVan == null) return; e.preventDefault(); k.classList.add('sleepdoel'); });
            k.addEventListener('dragleave', () => k.classList.remove('sleepdoel'));
            k.addEventListener('drop', e => {
                e.preventDefault(); k.classList.remove('sleepdoel'); if (sleepVan == null) return;
                const pg = k.dataset.pgtoggle, [st] = steps.splice(sleepVan, 1); sleepVan = null;
                let na = -1; steps.forEach((x, j) => { if (x.page === pg) na = j; });
                verhuisNaarPagina(st, pg); steps.splice(na + 1, 0, st); PG_DICHT.delete(pg); renderSteps(); renderFlow(); persist();
            });
        });
        renderCoach();
        box.querySelectorAll('[data-ins]').forEach(b => b.onclick = () => insertPause(+b.dataset.ins));
        box.querySelectorAll('.stname').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].name = inp.value; renderFlow(); persist(); });
        box.querySelectorAll('.stms').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].ms = Math.max(0, +inp.value || 0); renderFlow(); persist(); });
        box.querySelectorAll('.strepn').forEach(inp => inp.oninput = () => { steps[+inp.dataset.i].rep = Math.max(1, +inp.value || 1); renderFlow(); persist(); });
        box.querySelectorAll('[data-show]').forEach(b => b.onclick = () => {
            const s = steps[+b.dataset.show];
            if (s.frame) { kaderOpdracht('highlight', s).then(r => flash(b, r && r.ok ? '✔ (kader)' : '✗ niet gevonden')); return; }
            const el = targetEl(s);
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
    (function () {
        const sel = $('#flow-opslag'), vb = $('#opslag-vb');
        const ks = $('#flow-opslag-kol'), kr = $('#opslag-kol-rij');
        const uitleg = { een: 'bv. Downloads/ParseLab/…', ronde: 'bv. ParseLab/Ronde 001 - kaas/…', lus: 'bv. ParseLab/001 Opstal/…', pagina: 'bv. ParseLab/Polisoverzicht/…', apart: 'bv. ParseLab/001 PDF opslaan.pdf' };
        const toon = () => {
            kr.style.display = sel.value === 'kolom' ? '' : 'none';
            if (sel.value === 'kolom') { const r0 = flowRows[0] || {}; const k = ks.value; vb.textContent = k ? 'bv. ParseLab/' + (r0[k] != null ? String(r0[k]) : '<' + k + '>') + '/… — één map per unieke ' + k : 'Kies de kolom.'; }
            else vb.textContent = uitleg[sel.value] || '';
        };
        const n1 = $('#flow-pdfnaam'), chips = $('#pdfnaam-chips'), nvb = $('#pdfnaam-vb');
        const toonNaam = () => {
            const r0 = flowRows[0] || {}, tpl = n1.value.trim();
            if (!tpl) { nvb.textContent = 'automatisch: de ingevulde lijstwaarde, anders de stapnaam'; return; }
            const vb = naamUitSjabloon(tpl, k => { const kk = Object.keys(r0).find(x => zelfdeNaam(x, k)); return kk && String(r0[kk]).trim() !== '' ? String(r0[kk]).trim() : (zelfdeNaam(k, 'ronde') ? '1' : '<' + k + '>'); });
            nvb.textContent = 'bv. ' + vb + '.pdf';
        };
        const bewaarNaam = () => { toonNaam(); try { chrome.storage.local.set({ 'pl-pdfnaam-tpl': n1.value }); } catch (e) {} };
        const vulNaam = () => {
            const opts = waardeOpties().map(o => o.v);
            chips.innerHTML = opts.map(v => '<button class="sugg" data-naamtok="' + esc(v) + '" title="Waarde uit deze kolom in de naam">' + esc(v) + '</button>').join('');
            chips.querySelectorAll('[data-naamtok]').forEach(b => b.onclick = () => {
                const tok = '{{' + b.dataset.naamtok + '}}', p0 = n1.selectionStart != null ? n1.selectionStart : n1.value.length, p1 = n1.selectionEnd != null ? n1.selectionEnd : p0;
                n1.value = n1.value.slice(0, p0) + tok + n1.value.slice(p1); n1.focus(); try { n1.setSelectionRange(p0 + tok.length, p0 + tok.length); } catch (e) {} bewaarNaam();
            });
            toonNaam();
        };
        n1.oninput = bewaarNaam;
        try { chrome.storage.local.get(['pl-pdfnaam-tpl', 'pl-pdfnaam', 'pl-pdfnaam2'], r => {
            r = r || {};
            if (r['pl-pdfnaam-tpl'] != null) n1.value = r['pl-pdfnaam-tpl'];
            else if (r['pl-pdfnaam']) n1.value = ['{{' + r['pl-pdfnaam'] + '}}', r['pl-pdfnaam2'] ? '{{' + r['pl-pdfnaam2'] + '}}' : ''].filter(Boolean).join(' - ');   // van 1.42
            vulNaam();
        }); } catch (e) { vulNaam(); }
        OPSLAG_KOLOMMEN = () => { vulNaam(); const cur = ks.value || ks.dataset.pending || ''; const opts = waardeOpties().map(o => o.v); ks.innerHTML = opts.map(v => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>').join('') || '<option value="">(upload eerst je lijst)</option>'; toon(); };
        try { chrome.storage.local.get(['pl-opslag', 'pl-opslag-kol'], r => { if (r && r['pl-opslag']) sel.value = r['pl-opslag']; if (r && r['pl-opslag-kol']) ks.dataset.pending = r['pl-opslag-kol']; OPSLAG_KOLOMMEN(); }); } catch (e) { OPSLAG_KOLOMMEN(); }
        sel.onchange = () => { OPSLAG_KOLOMMEN(); try { chrome.storage.local.set({ 'pl-opslag': sel.value }); } catch (e) {} };
        ks.onchange = () => { ks.dataset.pending = ks.value; toon(); try { chrome.storage.local.set({ 'pl-opslag-kol': ks.value }); } catch (e) {} };
    })();
    (function () {
        const rk = $('#flow-rondekol');
        try { chrome.storage.local.get('pl-rondekol-' + location.hostname, r => { const v = r && r['pl-rondekol-' + location.hostname]; if (v) { rk.dataset.pending = v; vulRondekol(); } setStartLabel(); renderSteps(); }); } catch (e) {}
        rk.onchange = () => { rk.dataset.pending = rk.value; try { chrome.storage.local.set({ ['pl-rondekol-' + location.hostname]: rk.value }); } catch (e) {} VB_RONDE = 1; setStartLabel(); aantalUitleg(); renderSteps(); };
    })();
    (function () {
        const m = $('#flow-aantal-modus'), n = $('#flow-aantal');
        const na = () => { aantalUitleg(); setStartLabel(); renderSteps(); try { chrome.storage.local.set({ ['pl-aantal-' + location.hostname]: { m: m.value, n: aantalKeer() } }); } catch (e) {} };
        try { chrome.storage.local.get('pl-aantal-' + location.hostname, r => { const x = r && r['pl-aantal-' + location.hostname]; if (x) { m.value = x.m || 'lijst'; n.value = x.n || 1; } aantalUitleg(); setStartLabel(); }); } catch (e) { aantalUitleg(); }
        m.onchange = () => { na(); if (m.value === 'aantal') { n.focus(); n.select(); } };
        n.oninput = na;
        const tu = $('#flow-tussen'), ts = $('#flow-tussen-sec'), tl = $('#tussen-sec-lbl'), tb = $('#flow-terugstart');
        const toonT = () => { ts.style.display = tl.style.display = (tu.value === 'sec' || tu.value === 'rustig') ? '' : 'none'; tl.textContent = tu.value === 'rustig' ? 'sec of meer' : 'sec'; };
        const bewaarT = () => { toonT(); renderSteps(); try { chrome.storage.local.set({ ['pl-tussen-' + location.hostname]: { t: tu.value, s: +ts.value || 3, b: tb.checked } }); } catch (e) {} };
        try { chrome.storage.local.get('pl-tussen-' + location.hostname, r => { const x = r && r['pl-tussen-' + location.hostname]; if (x) { tu.value = x.t || 'klaar'; ts.value = x.s || 3; tb.checked = x.b !== false; } toonT(); renderSteps(); }); } catch (e) { toonT(); }
        tu.onchange = bewaarT; ts.oninput = bewaarT; tb.onchange = bewaarT;
    })();
    $('#flow-bewerk').onclick = function () { BEWERK = !BEWERK; this.textContent = BEWERK ? '✔ Klaar met aanpassen' : '✎ Aanpassen'; this.classList.toggle('primary', BEWERK); this.classList.toggle('alt', !BEWERK);
        $('#flow-uitleg').textContent = ''; if (!BEWERK) OPEN_ST.clear(); renderSteps(); };
    $('#flow-alleweg').onclick = () => {
        if (!steps.length) { flash($('#flow-alleweg'), 'er zijn geen stappen'); return; }
        askInline({ title: 'Alle ' + steps.length + ' stappen verwijderen?', html: '<div>De hele flow wordt leeggemaakt. Je lijst (Excel) blijft geladen. Dit kun je niet ongedaan maken.</div>',
            buttons: [{ label: '🗑 Ja, alles verwijderen', primary: true, fn: () => { steps.length = 0; OPEN_ST.clear(); renderSteps(); renderFlow(); persistNow(); log('  ✔ Alle stappen verwijderd.', true); } }, { label: t('cancel') }] });
    };

    // Controleer of elke stap met een gekoppeld element dat element op deze pagina vindt.
    function checkLinks() {
        const linked = steps.map((s, i) => ({ s, i })).filter(x => (x.s.selector || x.s.fp) && x.s.type !== 'scrape' && !x.s.frame && !x.s.rel);
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
            if (s.type === 'click') {
                const btn = knopRond(el);
                s.selector = stableSel(btn); s.fp = fingerprint(btn);
                const naam = knopNaam(btn); if (naam) { s.name = naam.slice(0, 24); s.detail = naam.slice(0, 40); }
            }
            else if (s.type === 'fill') { const form = el.closest('form') || el; s.selector = cssPath(form); s.colmap = buildColumnMap(readFormFieldsIn(form)); updateFillDetail(s); }
            else if (s.type === 'setval' || s.type === 'select' || s.type === 'type') { const f = resolveField(el); s.selector = stableSel(f); s.fp = fingerprint(f); }
            else { s.selector = cssPath(el); s.fp = fingerprint(el); }
            delete s.frame;
            renderSteps(); renderFlow(); persist(); log('  ✔ “' + stepLabel(s) + '” opnieuw gekoppeld.');
        }, hint, s.type === 'click' ? 'click' : (s.type === 'setval' || s.type === 'select' || s.type === 'type') ? 'input' : s.type === 'scrape' ? 'read' : 'any', s.type === 'fill' ? null : (d, fr) => {
            s.selector = d.selector; s.fp = d.fp; s.frame = fr;
            if (s.type === 'click' && d.naam) { s.name = d.naam.slice(0, 24); s.detail = d.naam.slice(0, 40) + ' · in kader'; }
            renderSteps(); renderFlow(); persist(); log('  ✔ “' + stepLabel(s) + '” opnieuw gekoppeld (in kader).');
        });
    }
    if ($('#flow-check2')) $('#flow-check2').onclick = function () { $('#flow-check').onclick.call(this); };
    if ($('#flow-check')) $('#flow-check').onclick = function () {
        const r = checkLinks();
        if (!r.total) { flash(this, 'geen gekoppelde stappen'); return; }
        flash(this, r.bad.length ? '✗ ' + r.bad.length + ' niet gevonden' : '✔ alles gevonden');
        if (r.bad.length) showLinkProblems(r.bad, null);
        else log('✅ Alle ' + r.total + ' koppelingen gevonden op deze pagina.', true);
    };
    function showLinkProblems(bad, onContinue) {
        const elders = x => x.s.pageUrl && x.s.pageUrl.split('#')[0] + '#' + (x.s.pageUrl.split('#')[1] || '') !== location.href.split('#')[0] + '#' + (location.href.split('#')[1] || '');
        const html = bad.map((x, k) => '<div class="ask-line">“<b>' + esc(stepLabel(x.s)) + '</b>” (stap ' + (x.i + 1) + ') staat niet op deze pagina.' + (elders(x) ? ' <span class="hint">Hij hoort bij <code>' + esc(kortUrl(x.s.pageUrl)) + '</code>.</span>' : '') + ' <button class="wt-btn alt mini-btn" data-repick="' + k + '">' + esc(t('repick')) + '</button></div>').join('');
        const eerste = steps[0];
        const naarStart = onContinue && eerste && eerste.pageUrl && eerste.pageUrl !== location.href ? [{ label: '↪ Naar het adres van stap 1 en starten', primary: true, fn: () => { onContinue(false); startVanaf(0); } }] : [];
        const buttons = onContinue ? naarStart.concat([{ label: t('start_anyway') + ' (ParseLab gaat bij een fout terug naar het opgeslagen adres)', fn: () => onContinue(true) }, { label: t('cancel'), primary: !naarStart.length, fn: () => onContinue(false) }]) : [{ label: 'Sluiten' }];
        askInline({ title: bad.length === 1 ? 'Eén koppeling klopt niet meer' : bad.length + ' koppelingen kloppen niet meer', html, buttons });
        const box = $('#wt-ask');
        box.querySelectorAll('[data-repick]').forEach(b => b.onclick = () => { const x = bad[+b.dataset.repick]; box.style.display = 'none'; box.innerHTML = ''; if (onContinue) onContinue(false); repickStep(x.s); });
    }

    // Lijst (Excel/CSV)
    // Welke regels (rondes) van de lijst: alles, de eerste 100/500 of van … tot … (1 = eerste regel).
    function bereik() {
        const N = rondeRijen().length, m = ($('#flow-bereik') && $('#flow-bereik').value) || 'alles';
        if (m === 'alles') return { van: 1, tot: N, N };
        if (m !== 'vantot') return { van: 1, tot: Math.min(N, +m), N };
        const v = Math.max(1, Math.floor(+$('#flow-van').value || 1)), tt = String($('#flow-tot').value || '').trim();
        return { van: v, tot: tt === '' ? N : Math.min(N, Math.max(v, Math.floor(+tt))), N };
    }
    function bereikUitleg() {
        const vt = $('#bereik-vt'), u = $('#bereik-uitleg'), m = $('#flow-bereik'); if (!m) return;
        vt.style.display = m.value === 'vantot' ? '' : 'none';
        const b = bereik(); u.textContent = !flowRows.length ? '' : b.van > b.N ? 'voorbij het eind (' + b.N + ')' : m.value === 'alles' ? '' : 'regel ' + b.van + '–' + b.tot + ' van ' + b.N;
    }
    function zelfdeUrl(a, b) { try { const x = new URL(a, location.href), y = new URL(b, location.href); const n = u => (u.origin + u.pathname).replace(/\/+$/, '') + u.search + u.hash; return n(x) === n(y); } catch (e) { return String(a) === String(b); } }
    // Wacht tot de pagina écht klaar is (geen vaste seconden): document geladen, netwerk/DOM rustig
    // en — als stap 1 iets op de pagina aanwijst — tot dat element er staat.
    async function wachtTotGeladen(st) {
        const t0 = Date.now();
        while (doc.readyState !== 'complete' && Date.now() - t0 < 60000 && !stopReq) await sleep(200);
        await waitForIdle(20000);
        const eerste = st.steps.find((x, k) => k < 3 && stapMetElement(x));
        if (eerste && !stopReq) { const el = await vindStapElement(eerste, 30000); if (!el) log('  ⓘ ' + (eerste.name || 'stap 1') + ' nog niet te zien na 30 s — toch verder'); }
        log('  pagina klaar na ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    }
    function setStartLabel() {
        const rb = $('#flow-run'); if (!rb || RUNNING) return;
        try { bereikUitleg(); } catch (e) {}
        const n = flowRows.length && aantalModus() !== 'aantal' ? (b => Math.max(0, b.tot - b.van + 1))(bereik()) : rondeRijen().length;
        rb.innerHTML = IC('play') + ' <span>' + esc(t('start')) + (aantalModus() === 'aantal' ? ' · ' + n + '×' : flowRows.length ? ' · ' + n + (n === 1 ? ' ronde' : ' rondes') : '') + '</span>';
        try { aantalUitleg(); } catch (e) {}
    }
    function renderGroupOptions() {
        const sel = $('#flow-group'); if (!sel) return;
        const cur = sel.value || sel.dataset.pending || '';
        const cols = waardeOpties().map(o => o.v);
        sel.innerHTML = '<option value="">(niet sorteren)</option>' + cols.map(c => opt(c, cur, c)).join('') + (cur && cols.indexOf(cur) === -1 ? opt(cur, cur, cur) : '');
        sel.value = cur; delete sel.dataset.pending;
    }
    // 📋 De lijst als tabel: bekijken, zelf invullen, regels/kolommen toevoegen. Uitgelezen waarden
    // staan er als grijze kolommen naast (na een ronde gevuld met wat ParseLab heeft opgehaald).
    function uitgelezenKols() {
        const lijst = csvCols().map(c => c.toLowerCase()), uit = [];
        steps.forEach((x, k) => { if (x.type === 'scrape' && x.kind === 'element') { const c = x.col || x.name; if (c && lijst.indexOf(c.toLowerCase()) < 0 && !uit.some(u => u.c === c)) uit.push({ c, stap: k + 1 }); } });
        (results || []).forEach(o => Object.keys(o || {}).forEach(c => { if (c[0] !== '_' && typeof o[c] !== 'object' && lijst.indexOf(c.toLowerCase()) < 0 && !uit.some(u => u.c === c) && !steps.some(x => (x.type === 'setval' || x.type === 'select') && zelfdeNaam(invoerKolom(x), c))) uit.push({ c, stap: null }); }));
        return uit.slice(0, 8);
    }
    function renderLijst() {
        const box = $('#lijst-box'); if (!box) return;
        if (!flowRows.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
        box.style.display = '';
        const cols = csvCols(), uit = uitgelezenKols(), toon = flowRows.slice(0, 200); let huidig = 0; try { huidig = VB_RONDE; } catch (e) {}
        const resVan = r => (results || []).find(o => o && o._pass === r + 1) || null;
        box.innerHTML = '<div class="lijstkop"><b>📋 Mijn lijst</b> <span class="hint">' + flowRows.length + ' regels = ' + flowRows.length + ' rondes</span><span class="sp"></span>' +
            '<button class="mini" data-lr="regel">+ regel</button><button class="mini" data-lr="kolom">+ kolom</button></div>' +
            '<div class="lijstscroll"><table class="lijst"><thead><tr><th>#</th>' + cols.map((c, j) => '<th><input class="lkop" data-kop="' + j + '" value="' + esc(c) + '" title="Kolomnaam — dezelfde naam als bij je invoerveld"></th>').join('') +
            uit.map(u => '<th class="lu" title="' + (u.stap ? 'Wordt uitgelezen bij stap ' + u.stap : 'Uitgelezen in de laatste ronde') + '">🔎 ' + esc(u.c) + (u.stap ? '<small>stap ' + u.stap + '</small>' : '') + '</th>').join('') + '<th></th></tr></thead><tbody>' +
            toon.map((r, i) => '<tr' + (i + 1 === huidig ? ' class="nu"' : '') + '><td class="lnr" data-lnr="' + i + '" title="Bekijk ronde ' + (i + 1) + ' in de flow">' + (i + 1) + '</td>' + cols.map(c => '<td><input class="lcel" data-r="' + i + '" data-c="' + esc(c) + '" value="' + esc(r[c] == null ? '' : r[c]) + '"></td>').join('') +
                uit.map(u => { const o = resVan(i); const v = o && o[u.c] != null ? String(o[u.c]) : ''; return '<td class="lu">' + (v ? esc(v.slice(0, 40)) : '<span class="hint">—</span>') + '</td>'; }).join('') +
                '<td><button class="mini danger" data-lweg="' + i + '" title="Regel weghalen">✕</button></td></tr>').join('') +
            '</tbody></table></div>' + (flowRows.length > 200 ? '<div class="hint">Eerste 200 van ' + flowRows.length + ' regels getoond.</div>' : '') +
            (uit.length ? '<div class="hint">🔎 = wordt door ParseLab uitgelezen (na een ronde staat hier wat er is opgehaald). Gebruik zo’n waarde verderop via <b>Invullen → Eerder element</b>.</div>' : '');
        const na = () => { saveRows(); persist(); setStartLabel(); renderSamenvatting(); clearTimeout(renderLijst._t); renderLijst._t = setTimeout(() => { renderSteps(); }, 400); };
        box.querySelectorAll('.lcel').forEach(inp => inp.oninput = () => { flowRows[+inp.dataset.r][inp.dataset.c] = inp.value; na(); });
        box.querySelectorAll('.lkop').forEach(inp => inp.onchange = () => {
            const oud = cols[+inp.dataset.kop], nieuw = String(inp.value).trim();
            if (!nieuw || cols.some(c => c !== oud && zelfdeNaam(c, nieuw))) { inp.value = oud; return; }
            flowRows = flowRows.map(r => { const o = {}; Object.keys(r).forEach(k => o[k === oud ? nieuw : k] = r[k]); return o; });
            steps.forEach(x => { if ((x.type === 'setval' || x.type === 'select') && zelfdeNaam(invoerKolom(x), oud)) { x.col = nieuw; if ((x.bron || 'lijst') === 'lijst') x.value = '{{' + nieuw + '}}'; x.name = x.name.replace(oud, nieuw); x.detail = invoerUitleg(x) + (x.frame ? ' · in kader' : ''); } });
            const n = hernoemKolom(oud, nieuw); log('  ✔ Kolom “' + oud + '” heet nu “' + nieuw + '”' + (n ? ' (ook in ' + n + ' verwijzing(en))' : '') + '.', true);
            showCsvInfo(); saveRows(); persist(); renderSteps(); renderLijst();
        });
        box.querySelectorAll('[data-lweg]').forEach(b => b.onclick = () => { flowRows.splice(+b.dataset.lweg, 1); showCsvInfo(); saveRows(); persist(); renderSteps(); renderLijst(); });
        box.querySelectorAll('[data-lnr]').forEach(b => b.onclick = () => { VB_RONDE = +b.dataset.lnr + 1; renderSteps(); renderLijst(); toonTab('flow'); });
        box.querySelectorAll('[data-lr]').forEach(b => b.onclick = () => {
            if (b.dataset.lr === 'regel') { const o = {}; cols.forEach(c => o[c] = ''); flowRows.push(o); showCsvInfo(); saveRows(); persist(); renderSteps(); renderLijst(); const l = box.querySelectorAll('tbody tr'); const r = l[l.length - 1]; if (r) { const i0 = r.querySelector('input'); if (i0) i0.focus(); } }
            else askInline({ title: 'Kolom toevoegen', html: '<label class="kol">Naam van de kolom<input id="wt-ask-nk" class="wt-num" style="width:100%" placeholder="bv. Polisnummer"></label>',
                buttons: [{ label: 'Toevoegen ✓', primary: true, check: v => { const c = String(v['wt-ask-nk'] || '').trim(); return !c ? 'Geef een naam.' : csvCols().some(x => zelfdeNaam(x, c)) ? 'Die kolom bestaat al.' : ''; },
                    fn: v => { const c = String(v['wt-ask-nk']).trim(); flowRows.forEach(r => r[c] = ''); showCsvInfo(); saveRows(); persist(); renderSteps(); renderLijst(); } }, { label: t('cancel') }] });
        });
    }
    function lijstZelf() {
        { const d = $('#lijst-details'); if (d) d.open = true; }
        if (flowRows.length) { renderLijst(); try { $('#lijst-box').scrollIntoView({ block: 'nearest' }); } catch (e) {} return; }
        let cols = collectCsvColumns(); if (!cols.length) cols = ['Waarde'];
        flowRows = [0, 1, 2].map(() => { const o = {}; cols.forEach(c => o[c] = ''); return o; });
        showCsvInfo('✎ Vul de lijst hieronder in. Elke regel is één ronde. Kolommen komen van je invoervelden (' + cols.map(esc).join(', ') + ').');
        saveRows(); persist(); renderSteps(); renderLijst();
        setTimeout(() => { const i0 = $('#lijst-box .lcel'); if (i0) i0.focus(); }, 50);
    }
    $('#flow-zelf').onclick = lijstZelf;
    function vulRondekol() {
        const sel = $('#flow-rondekol'), rij = $('#rondekol-rij'); if (!sel) return;
        const cols = csvCols(), cur = sel.value || sel.dataset.pending || '';
        sel.innerHTML = '<option value="">regel (elke regel een ronde)</option>' + cols.map(c => { const n = new Set(flowRows.map(r => String(r[c] == null ? '' : r[c]).trim())).size; return '<option value="' + esc(c) + '"' + (c === cur ? ' selected' : '') + '>unieke ' + esc(c) + ' (' + n + ')</option>'; }).join('');
        rij.style.display = cols.length ? '' : 'none';
        const k = $('#lijst-kort'); if (k) k.textContent = flowRows.length ? flowRows.length + ' regels · ' + cols.length + ' kolommen' : 'nog geen lijst';
    }
    function showCsvInfo(extra) {
        const cols = csvCols();
        const dates = detectDateColumns(flowRows);
        $('#flow-csvinfo').innerHTML = flowRows.length
            ? '<b>' + flowRows.length + ' regels</b> · kolommen: ' + cols.map(esc).join(', ') + ' — ' + (rondeKol() ? (groepen() || []).length + ' rondes (1 per ' + esc(rondeKol()) + ').' : flowRows.length + ' rondes (1 per regel).') +
              (dates.length ? '<br>' + dates.map(d => 'Ik herken “' + esc(d) + '” als datum ✓').join(' · ') : '') + (extra ? '<br>' + extra : '')
            : 'Geen lijst geladen — de taak draait één keer.' + (extra ? '<br>' + extra : '');
        setStartLabel(); renderGroupOptions(); renderSamenvatting(); try { vulRondekol(); renderLijst(); if (OPSLAG_KOLOMMEN) OPSLAG_KOLOMMEN(); } catch (e) {}
    }
    let LIJST_NA = null;   // wordt aangeroepen na een upload (bv. om de vooruitblik te verversen)
    // TXT: met scheidingstekens → als CSV; anders één waarde per regel (eerste regel is de kop als die geen cijfers heeft).
    function parseTxt(text) {
        const regels = String(text).replace(/^\uFEFF/, '').split(/\r\n?|\n/).map(x => x.trim()).filter(Boolean);
        if (!regels.length) return [];
        if (/[\t;,|]/.test(regels[0])) return parseCSV(regels.join('\n'));
        const kop = regels.length > 1 && !/\d/.test(regels[0]) ? regels.shift() : 'Waarde';
        return regels.map(v => ({ [kop]: v }));
    }
    async function loadListFile(f) {
        const isXlsx = /\.xlsx$/i.test(f.name) || /spreadsheetml/.test(f.type || '');
        const isTxt = /\.txt$/i.test(f.name) || f.type === 'text/plain';
        try {
            if (isXlsx) flowRows = await parseXlsx(await f.arrayBuffer());
            else if (isTxt) flowRows = parseTxt(await f.text());
            else flowRows = parseCSV(await f.text());
            if (!flowRows.length) showCsvInfo('<span style="color:var(--bad)">Het bestand lijkt leeg: geen regels onder de kolomkoppen.</span>');
            else showCsvInfo();
        } catch (err) { flowRows = []; $('#flow-csvinfo').textContent = 'Kon de lijst niet lezen: ' + err.message; setStartLabel(); }
        renderSteps(); renderFlow(); persistNow(); saveRows();   // meteen bewaren → overleeft paginawissel
        { const rk = $('#flow-rondekol'), cols = csvCols();
          if (rk && flowRows.length && cols.length > 1 && !rondeKol()) { const a = cols[0], n = new Set(flowRows.map(r => String(r[a] == null ? '' : r[a]).trim())).size;
            if (n < flowRows.length) log('  Tip: “' + a + '” heeft ' + n + ' unieke waarden. Kies bij de lijst “Eén ronde per” en bij Resultaat “per unieke waarde uit kolom” als je per ' + a + ' wilt werken of opslaan.', true); } }
        if (LIJST_NA) { const f2 = LIJST_NA; LIJST_NA = null; try { f2(); } catch (e) {} }
        else if (flowRows.length) { const d = $('#lijst-details'); if (d) d.open = true; setTimeout(() => { try { $('#invoer-kaart').scrollIntoView({ block: 'nearest' }); } catch (e) {} }, 60); }
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
            const intern = new Set(['ronde', 'vandaag']); steps.forEach(x => { if (x.type === 'scrape') intern.add(String(x.col || x.name || '').toLowerCase()); });
            if ((s.type === 'setval' || s.type === 'select') && (s.bron === 'eerder' || s.bron === 'logica' || s.bron === 'oplopend' || s.bron === 'vast')) return;
            ['value', 'text', 'url'].forEach(f => tokensFrom(s[f]).forEach(c => { if (!intern.has(c.toLowerCase()) && !/^vorige /i.test(c)) add(c); }));
            if (s.match && s.match.bron === 'kolom' && !steps.some(x => x.type === 'scrape' && zelfdeNaam(x.col || x.name, s.match.col))) add(s.match.col);
        });
        return cols;
    }
    // ---- Velden ophalen: wat staat er nu op deze pagina, en maak daar een invulstap van ----
    function zichtbaarVeld(el) {
        try {
            if (el.type === 'hidden') return false;
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) return false;
            const st = getComputedStyle(el);
            return st.visibility !== 'hidden' && st.display !== 'none';
        } catch (e) { return true; }
    }
    function scanPaginaVelden() {
        const velden = readFormFieldsIn(doc).filter(f => { const el = colEl(f, doc); return el ? zichtbaarVeld(el) : false; });
        const colmap = buildColumnMap(velden);
        // Staan ze allemaal in hetzelfde formulier, dan koppelen we de stap daaraan.
        let formSel = '';
        try {
            const els = colmap.map(m => colEl(m, doc)).filter(Boolean);
            const forms = els.map(e => (e.closest && e.closest('form')) || null);
            if (els.length && forms[0] && forms.every(f => f === forms[0])) formSel = cssPath(forms[0]);
        } catch (e) {}
        return { colmap, formSel };
    }
    function renderVelden(r) {
        const box = $('#flow-fields');
        box.style.display = 'block';
        if (!r.colmap.length) {
            box.innerHTML = '<div class="hint"><b style="color:var(--bad)">Geen invulvelden gevonden op deze pagina.</b> Staat het formulier achter een knop of in een venster dat nog open moet? Open het en klik opnieuw op <b>Velden ophalen</b>.</div>';
            return;
        }
        box.innerHTML = '<div class="hint"><b>' + r.colmap.length + ' invulveld(en) gevonden.</b> Vink af wat mee moet — deze namen worden de kolomkoppen van je lijst.</div>' +
            '<div style="max-height:190px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-ctl);padding:6px;margin:6px 0">' +
            r.colmap.map((m, i) => '<label class="row" style="display:flex;gap:6px;align-items:center;padding:2px 0">' +
                '<input type="checkbox" data-veld="' + i + '" checked> <b>' + esc(m.col) + '</b>' +
                '<span class="hint">' + esc(m.type || '') + (m.label && m.label !== m.col ? ' · ' + esc(m.label) : '') + '</span>' +
                '<button class="mini" data-veldtoon="' + i + '" title="Laat zien waar dit veld staat">' + IC('target', 'ico-sm') + '</button></label>').join('') +
            '</div>' +
            '<div class="wt-row"><button class="wt-btn primary" id="velden-stap">' + IC('plus', 'ico-sm') + ' Maak invulstap</button>' +
            '<button class="wt-btn alt" id="velden-tmpl">' + IC('file-plus', 'ico-sm') + ' Invullijst (Excel)</button>' +
            '<button class="wt-btn alt" id="velden-dicht">' + IC('x', 'ico-sm') + ' Sluiten</button></div>';
        const gekozen = () => r.colmap.filter((m, i) => { const c = box.querySelector('[data-veld="' + i + '"]'); return c && c.checked; });
        box.querySelectorAll('[data-veldtoon]').forEach(b => b.onclick = (e) => {
            e.preventDefault();
            const m = r.colmap[+b.dataset.veldtoon], el = colEl(m, doc);
            if (el) highlightEl(el); else flash(b, '✗ niet gevonden');
        });
        $('#velden-stap').onclick = function () {
            const cols = gekozen().map(m => Object.assign({}, m));
            if (!cols.length) { flash(this, 'niets aangevinkt'); return; }
            const st = { type: 'fill', name: 'Formulier invullen', selector: r.formSel, colmap: cols };
            updateFillDetail(st); addStep(st);
            $('#flow-csvinfo').innerHTML = 'Invulstap gemaakt met <b>' + cols.length + ' veld(en)</b>. Maak nu je <b>Invullijst (Excel)</b>, vul hem in en klik op <b>Lijst uploaden</b> — de taak draait dan één keer per regel.';
        };
        $('#velden-tmpl').onclick = function () {
            const cols = gekozen().map(m => m.col);
            if (!cols.length) { flash(this, 'niets aangevinkt'); return; }
            downloadBytes(toXlsx([], cols), 'mijn-invullijst.xlsx', XLSX_MIME);
            flash(this, '✔ ' + cols.length + ' kolommen');
            $('#flow-csvinfo').innerHTML = 'Je invullijst staat in je map Downloads/' + esc(currentFolder) + ': <b>' + cols.length + ' kolom(men)</b> — ' + cols.map(esc).join(', ') + '. Vul hem in en klik daarna op <b>Lijst uploaden</b>.';
        };
        $('#velden-dicht').onclick = () => { box.style.display = 'none'; };
    }
    $('#flow-scan').onclick = function () {
        const r = scanPaginaVelden();
        renderVelden(r);
        flash(this, r.colmap.length ? '✔ ' + r.colmap.length + ' velden' : 'geen velden');
    };
    $('#flow-tmpl').onclick = () => {
        const cols = collectCsvColumns();
        if (!cols.length) { $('#flow-csvinfo').innerHTML = '<b style="color:var(--bad)">Nog geen invulvelden.</b> Voeg eerst een <i>Invullen</i>-stap toe en wijs een veld of formulier aan.'; return; }
        downloadBytes(toXlsx([], cols), 'mijn-invullijst.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $('#flow-csvinfo').innerHTML = 'Je invullijst staat in je map Downloads/' + esc(currentFolder) + ': <b>' + cols.length + ' kolom(men)</b> — ' + cols.map(esc).join(', ') + '. Vul hem in Excel in en klik daarna op <b>Lijst uploaden</b>.';
    };

    // ===================== Opdracht-chat: bouw de flow met gewone taal =====================
    function chatLog(m) { const el = $('#chat-log'); if (el.textContent === 'Typ een opdracht of “help”.') el.textContent = ''; el.appendChild(doc.createTextNode(m + '\n')); el.scrollTop = el.scrollHeight; }
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
        if (/\b(flow|stappen)\b/.test(l) && /(wat|toon|laat|overzicht|uitleg)/.test(l)) return { run: () => chatLog(steps.length ? flowVoorAi().map(x => x.nr + '. ' + x.naam + (x.uitleg ? ' — ' + x.uitleg : '') + ' (' + x.herkomst + ')').join('\n') : 'Nog geen stappen.'), done: '' };
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
    async function sendChat() {
        const inp = $('#chat-in'); const val = inp.value.trim(); if (!val) return;
        chatLog('› ' + val); inp.value = '';
        if (AI_SLEUTEL && !/^(help|start)$/i.test(val) && await aiChat(val)) return;
        runQueue(val.split(/\n|;| en (?=klik|scrape|lees|vul|typ|wacht|druk|screenshot|bewijskopie|print|pdf|scroll|download|herhaal)/i));
    }
    $('#chat-send').onclick = sendChat;
    $('#chat-in').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } });

    // ===================== run (herstartbaar, loopt door over paginawissels) =====================
    const RUN_KEY = 'wt-run';   // globaal → overleeft navigatie, ook naar een ander domein
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let LAATSTE_MELDING = '';
    function log(m, reset) { LAATSTE_MELDING = String(m).trim(); const el = $('#flow-log'); if (reset || el.textContent === 'Nog niet gestart.') el.textContent = ''; el.appendChild(doc.createTextNode(m + '\n')); el.scrollTop = el.scrollHeight; }
    function setResult(d) { $('#flow-result').textContent = d == null ? 'Nog niets uitgelezen.' : JSON.stringify(d, null, 2); }
    function saveRun(st) { try { st.ts = Date.now(); } catch (e) {} return new Promise(res => { try { chrome.storage.local.set({ [RUN_KEY]: st }, () => res()); } catch (e) { try { localStorage.setItem(RUN_KEY, JSON.stringify(st)); } catch (_) {} res(); } }); }
    function loadRun() { return new Promise(res => { try { chrome.storage.local.get(RUN_KEY, r => res(r && r[RUN_KEY])); } catch (e) { try { res(JSON.parse(localStorage.getItem(RUN_KEY) || 'null')); } catch (_) { res(null); } } }); }
    function clearRun() { try { chrome.storage.local.remove(RUN_KEY); } catch (e) { try { localStorage.removeItem(RUN_KEY); } catch (_) {} } }

    // Stap in een kader: de helper in dat kader voert hem uit.
    async function kaderStap(s, row, extraCtx) {
        const ctx = Object.assign({}, row || {}, extraCtx || {});
        const r = await kaderOpdracht('run', s, ctx);
        if (!r) { log('  ⚠ ' + (s.name || s.type) + ': kader niet bereikbaar'); return { ok: false }; }
        if (r.err && !r.ok) { log('  ⚠ ' + (s.name || s.type) + ': ' + r.err); return { ok: false }; }
        if (s.type === 'click') { log('  👆 ' + s.name + (r.tekst && !s.opgenomen && normTekst(r.tekst) !== normTekst(s.name) ? ' (nu: “' + String(r.tekst).slice(0, 30) + '”)' : '') + ' (kader)'); if (s.wachtNa) { await sleep(600); await waitForIdle(6000); } }
        else if (s.type === 'scrape' && s.kind === 'pairs') log('  🔎 ' + s.name + ' (kader): ' + (r.n || 0) + ' velden');
        else if (s.type === 'scrape') log('  🔎 ' + (s.col || s.name) + ' (kader): ' + (r.val == null ? '(niet gevonden)' : Array.isArray(r.val) ? r.val.length + ' items' : String(r.val).slice(0, 40)));
        else if (s.type === 'setval' || s.type === 'select') { log('  ✎ ' + s.name + (r.leeg ? ': leeg → overgeslagen' : ' = "' + String(r.val || '').slice(0, 30) + '"') + ' (kader)'); if (!r.leeg && invoerKolom(s)) return { ok: r.ok !== false, key: invoerKolom(s), val: r.val }; }
        else if (s.type === 'wait') log('  ⏳ ' + (s.wname || s.name) + (r.ok ? ': staat er (kader)' : ': niet verschenen (kader)'));
        else log('  • ' + (s.name || s.type) + ' (kader)');
        if (s.type === 'scrape') return r.merge ? { merge: r.merge, ok: r.ok } : { key: r.key, val: r.val };
        return { ok: r.ok !== false };
    }
    async function bestaat(o) { if (!o) return true; if (o.frame) { const r = await kaderOpdracht('run', Object.assign({ type: 'exists' }, o)); return !!(r && r.ok); } return !!targetEl(o); }
    // Waar komen PDF's en afbeeldingen? Volgens de keuze onderin de flow.
    function opslagDoel(ctx) {
        const st = RUN_ST || {}, mode = st.opslag || ($('#flow-opslag') && $('#flow-opslag').value) || 'een';
        const naam = v => sanitizeFolder(String(v == null ? '' : v).replace(/[\/\\]+/g, '-')).slice(0, 60);
        const z3 = n => String(n).padStart(3, '0');
        const basis = runBase || currentFolder, eerste = r => { const k = r && Object.keys(r).find(x => r[x] != null && String(r[x]).trim() && typeof r[x] !== 'object'); return k ? r[k] : ''; };
        if (mode === 'kolom') {
            const k = st.opslagKol || ($('#flow-opslag-kol') && $('#flow-opslag-kol').value) || '';
            const kk = Object.keys(ctx || {}).find(x => zelfdeNaam(x, k)); const v = kk != null ? ctx[kk] : (st.out && st.out[k]);
            return { map: v != null && String(v).trim() && typeof v !== 'object' ? basis + '/' + naam(v) : basis, voor: '' };
        }
        if (mode === 'ronde') { const v = eerste((st.rows || [])[(st.cursor || {}).ri]); return { map: basis + '/Ronde ' + z3(ctx.ronde || 1) + (v ? ' - ' + naam(v) : ''), voor: '' }; }
        if (mode === 'lus' && st.lus) { const ls = st.steps[st.lus.si]; const kol = ls && ls.spec && ls.spec.columns && ls.spec.columns[0] && ls.spec.columns[0].name; const v = (st.out && (st.out.Item || (kol && st.out[kol]))) || ('item ' + (st.lus.i + 1)); return { map: basis + '/' + z3(st.lus.i + 1) + ' ' + naam(v), voor: '' }; }
        if (mode === 'lus') return { map: basis + '/Ronde ' + z3(ctx.ronde || 1), voor: '' };
        if (mode === 'pagina') return { map: basis + '/' + (naam(doc.title) || naam(kortUrl()) || 'pagina'), voor: '' };
        if (mode === 'apart') { st.bestandNr = (st.bestandNr || 0) + 1; return { map: basis, voor: z3(st.bestandNr) + ' ' }; }
        return { map: currentFolder, voor: '' };
    }
    // Waarden voor een invoerveld dat per ronde alle of een aantal waarden uit de lijst invult.
    function lijstWaarden(s, ronde, groep) {
        const col = invoerKolom(s), alle = (groep || flowRows).map(r => r && r[Object.keys(r).find(k => zelfdeNaam(k, col))]).filter(v => v != null && String(v).trim() !== '').map(String);
        if (s.lijstModus === 'alle' || groep) return groep && s.lijstModus === 'aantal' ? alle.slice(0, Math.max(1, +s.lijstAantal || 1)) : alle;
        const n = Math.max(1, +s.lijstAantal || 1), r = Math.max(1, +ronde || 1);
        return alle.slice((r - 1) * n, r * n);
    }
    // Na een PDF (print-weergave) is de pagina soms nog niet opnieuw getekend: dan wordt een
    // schermafbeelding wit. Wacht een paar frames en laat de browser de pagina opnieuw tekenen.
    async function opnieuwGetekend() {
        const raf = () => new Promise(r => requestAnimationFrame(() => r()));
        scrollHerstel();
        try { const de = doc.documentElement; de.style.setProperty('outline', '0px solid transparent'); await raf(); de.style.removeProperty('outline'); void de.offsetHeight; } catch (e) {}
        await raf(); await raf(); await sleep(VORIGE_PDF && Date.now() - VORIGE_PDF < 5000 ? 900 : 250);
    }
    let VORIGE_PDF = 0;
    // Met het paneel ernaast (web-app) scrolt alleen de body; het venster zelf hoort op 0 te staan.
    // Na een PDF (print-weergave is langer) kan het venster verschoven blijven → wit beeld.
    function scrollHerstel() {
        try { if (doc.documentElement.classList.contains('wt-dock-app') && (window.scrollY || doc.documentElement.scrollTop || doc.documentElement.scrollLeft)) { window.scrollTo(0, 0); doc.documentElement.scrollTop = 0; doc.documentElement.scrollLeft = 0; } } catch (e) {}
    }
    async function performStep(s, row, extraCtx) {
        if ((s.type === 'setval' || s.type === 'select') && (s.bron || 'lijst') === 'lijst' && (s.lijstModus === 'alle' || s.lijstModus === 'aantal')) {
            const vals = lijstWaarden(s, extraCtx && extraCtx.ronde, row && row._groep);
            if (!vals.length) { log('  ' + s.name + ': geen waarden meer in de lijst'); return { ok: true }; }
            for (const v of vals) { if (stopReq) break; const r = await performStep(Object.assign({}, s, { lijstModus: 'volgende', bron: 'vast', value: v }), row, extraCtx); if (r && r.ok === false) return r; await sleep(250); }
            return { ok: true, key: invoerKolom(s), val: vals.join(', ') };
        }
        if (s.type === 'click' && s.match) {
            const w = await matchWaarde(s, row, extraCtx);
            if (!w) { log('  ⚠ ' + s.name + ': geen waarde om de knop mee te kiezen'); return { ok: false }; }
            if (s.frame) { const s2 = JSON.parse(JSON.stringify(s)); s2.match.waardeNu = w; const r = await kaderOpdracht('run', s2, {}); if (!r || !r.ok) { log('  ⚠ ' + s.name + ': ' + ((r && r.err) || 'kader niet bereikbaar')); return { ok: false }; } log('  👆 “' + r.tekst + '” (kader)'); return { ok: true }; }
            let r = knopMetWaarde(s.groep, w, s.match.hoe);
            for (const t0 = Date.now(); !r.el && Date.now() - t0 < 5000; ) { await sleep(300); r = knopMetWaarde(s.groep, w, s.match.hoe); }
            if (!r.el) { log('  ⚠ de waarde “' + w + '” staat niet op de pagina' + (r.opties.length ? ' (wel: ' + r.opties.join(', ') + ')' : '')); return { ok: false }; }
            klikReeks(r.klik, true); log('  👆 “' + txt(r.el).slice(0, 40) + '”' + (r.klik !== r.el ? ' (klikbare plek eromheen)' : '') + (r.aantal > 1 ? ' — ' + r.aantal + ' treffers, de beste gekozen' : '')); await sleep(300); return { ok: true };
        }
        if (s.type === 'click' && s.regelKeuze) return regelKlik(s, row, extraCtx);
        if (s.frame && /^(click|scrape|setval|select|hover|wait|waitfor)$/.test(s.type)) return kaderStap(s, row, extraCtx);
        if (s.type === 'click' && s.positie && !s.rel) {
            let el = doelOpPositie(s); for (const t0 = Date.now(); !el && Date.now() - t0 < 5000; ) { await sleep(250); el = doelOpPositie(s); }
            if (!el) { log('  ⚠ knop niet gevonden op die plek: ' + s.name + ' — wijs hem opnieuw aan'); return { ok: false }; }
            el = knopRond(el); klikStap(s, el); log('  👆 ' + s.name + (s.opgenomen || normTekst(knopTekst(el)) === normTekst(s.name) ? '' : ' (nu: “' + knopTekst(el).slice(0, 30) + '”)')); await sleep(300);
            if (s.wachtNa) { await sleep(300); await waitForIdle(6000); }
            return { ok: true };
        }
        if (s.type === 'scrape' && s.kind === 'extern') return externStap(s, row, extraCtx);
        if (s.type === 'scrape' && s.kind === 'pagina') { await waitForIdle(4000); const m = paginaUitlezen(doc); log('  🔎 ' + s.name + ': ' + (Object.keys(m).length - 6) + ' velden, ' + m['Aantal tabellen'] + ' tabellen, ' + m['Aantal links'] + ' links'); return { merge: m, ok: true }; }
        if (s.type === 'scrape' && s.kind === 'pairs') { const m = scrapePairs(s.spec); log('  🔎 ' + s.name + ': ' + Object.keys(m).length + ' velden'); return { merge: m, ok: Object.keys(m).length > 0 }; }
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
            if (s.mode === 'bottom') { naarOnder(); log('  ↕ scroll naar onder'); }
            else { const el = targetEl(s); if (el) { el.scrollIntoView({ block: 'center' }); log('  ↕ scroll naar ' + s.name); } else return { ok: false }; }
            await sleep(300);
        } else if (s.type === 'scrollload') {
            const times = Math.max(1, +s.times || 5), pause = Math.max(100, +s.pause || 800);
            for (let k = 0; k < times; k++) { naarOnder(); log('  ↕ laad ' + (k + 1) + '/' + times); await sleep(pause); }
        } else if (s.type === 'waitfor') {
            const to = Math.max(200, +s.timeout || 8000), t0 = Date.now();
            while (Date.now() - t0 < to) { if (targetEl(s)) { log('  ⏳ ' + s.name + ': gevonden na ' + (Date.now() - t0) + 'ms'); return { ok: true }; } await sleep(200); }
            log('  ⚠ ' + s.name + ': time-out (' + to + 'ms)'); return { ok: false };
        } else if (s.type === 'cond') {
            const el = targetEl(s);
            let ok = !!el;
            if (ok && s.test === 'contains') ok = bevatWaarde(el.textContent || '', resolveValue(String(s.ctext || ''), metVast(Object.assign({}, row || {}, extraCtx || {}))));
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
            const val = waardeVoorVeld(s, ctx);
            if (s.skipEmpty !== false && (val == null || String(val).trim() === '')) {
                log('  ✎ ' + s.name + ': leeg → deze ronde overgeslagen'); return;
            }
            await fillElement(el, val);
            if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && String(val).trim() !== '' && String(el.value || '').trim() === '') {
                log('  ⚠ ' + s.name + ': het veld bleef leeg (' + el.tagName.toLowerCase() + (el.type ? ' type=' + el.type : '') + ') — wijs het veld opnieuw aan');
            } else if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.isContentEditable) {
                log('  ⚠ ' + s.name + ': het aangewezen element is geen invoerveld (' + el.tagName.toLowerCase() + ') — wijs het veld opnieuw aan');
            }
            if (s.enterNa) { drukEnter(el); await sleep(300); await waitForIdle(6000); }
            log('  ✎ ' + s.name + ' = "' + (/password/i.test(el.type || '') ? '••••' : String(val).slice(0, 30)) + '"' + (s.enterNa ? ' + Enter' : ''));
            await sleep(80);
            if (invoerKolom(s)) return { ok: true, key: invoerKolom(s), val: String(val) };
        } else if (s.type === 'fill') {
            const scope = qs(s.selector, doc) || doc;
            const ctx = Object.assign({}, row || {}, extraCtx || {});
            const rep = await fillRowWith(row || {}, enabledCols(s), scope, ctx);
            log('  ✎ ' + s.name + ': ' + rep.filled.length + ' gevuld' + (rep.missed.length ? ', niet gevonden: ' + rep.missed.join(', ') : ''));
        } else if (s.type === 'click') {
            // Een SPA (Vue/React) tekent knoppen soms net iets later: even geduld voordat we opgeven.
            let el = targetEl(s);
            for (let t0 = Date.now(); !el && Date.now() - t0 < 4000; ) { await sleep(250); el = targetEl(s) || knopOpNaam(s.detail || s.name); }
            if (!el) { log('  ⚠ knop niet gevonden: ' + s.name + ' — wijs hem opnieuw aan'); return { ok: false }; }
            el = knopRond(el);
            const off = el.disabled || (el.getAttribute && el.getAttribute('aria-disabled') === 'true') || (typeof el.className === 'string' && /mud-disabled/.test(el.className));
            if (off) log('  ⚠ "' + s.name + '" is (nog) uitgeschakeld — is het formulier compleet/geldig ingevuld?');
            klikStap(s, el);
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
            // Zoals Ctrl+P → Opslaan als PDF, maar zonder venster: Chrome's eigen print-engine.
            // Map en bestandsnaam per unieke waarde (kolom uit je lijst, uitgelezen waarde of lus-item).
            const ctx = Object.assign({}, row || {}, extraCtx || {});
            const waarde = k => { if (!k) return ''; let v = ctx[k]; if (v == null) { const kk = Object.keys(ctx).find(x => x.toLowerCase() === String(k).toLowerCase()); if (kk) v = ctx[kk]; } return v == null || typeof v === 'object' ? '' : String(v).trim(); };
            const mapNaam = v => sanitizeFolder(String(v).replace(/[\/\\]+/g, '-')).slice(0, 80);
            const od = opslagDoel(ctx);
            let folder = od.map;
            const fv = waarde(s.folderBy);
            if (s.folderBy) { if (fv) folder = runBase + '/' + mapNaam(fv); else log('     ⓘ geen waarde voor “' + s.folderBy + '” — PDF gaat in de hoofdmap'); }
            // Geen bestandsnaam gekozen? Dan de waarde die in deze ronde uit de lijst is ingevuld (bv. het polisnummer),
            // zodat meerdere PDF's in dezelfde map elkaar niet overschrijven.
            const stdKol = s.fileBy || ((RUN_ST && RUN_ST.steps || steps).find(x => (x.type === 'setval' || x.type === 'select') && (x.bron || 'lijst') === 'lijst' && invoerKolom(x)) || {}).col || '';
            const tpl = !s.fileBy && RUN_ST && typeof RUN_ST.pdfNaam === 'string' ? RUN_ST.pdfNaam : '';
            let nv = tpl ? naamUitSjabloon(tpl, k => zelfdeNaam(k, 'ronde') ? String(ctx.ronde || '') : waarde(k)) : waarde(stdKol);
            if (tpl && !nv) { log('     ⓘ de bestandsnaam “' + tpl + '” is leeg in deze ronde — automatische naam'); nv = waarde(stdKol); }
            if (!nv && !s.fileBy && ctx.ronde > 1) nv = s.name + ' ' + ctx.ronde;
            let bestand = od.voor + (nv ? mapNaam(nv) : (od.voor ? mapNaam(s.name) : ''));
            // Zelfde naam al gebruikt in deze map? Dan (2), (3)… erachter — niets overschrijven.
            if (RUN_ST && RUN_ST.namen) { const sl = (folder + '/' + (bestand || s.name)).toLowerCase(); const n = (RUN_ST.namen[sl] || 0) + 1; RUN_ST.namen[sl] = n; if (n > 1) bestand = (bestand || mapNaam(s.name)) + ' (' + n + ')'; }
            // Staat de inhoud in een groot kader (iframe)? Dan alleen dat kader printen — net als
            // klikken in de pagina + Ctrl+A + Ctrl+P. Anders valt de helft weg of wordt hij afgesneden.
            const wat = s.printWhat || 'auto';
            const kader = wat === 'page' ? null : hoofdKader(wat === 'frame' ? 0.05 : 0.3);
            if (wat === 'frame' && !kader) log('     ⓘ geen kader gevonden — de hele pagina wordt geprint');
            log('  🖨 ' + s.name + (kader ? ' (alleen het kader met de inhoud)' : '') + ' → ' + folder + '/' + (bestand || s.name) + '.pdf');
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // paneel niet in de PDF
            await sleep(250);                                    // even wachten tot het weg is
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-print', name: s.name, fileName: bestand, folder, frameUrl: kader || undefined, zipRun: RUN_ST && RUN_ST.runId, zonderEerste: !!(RUN_ST && RUN_ST.pdfZonderEerste) }, resp => res(resp)); } catch (e) { res(null); } });
            if (hostEl) hostEl.classList.remove('wt-capturing'); VORIGE_PDF = Date.now(); scrollHerstel(); setTimeout(scrollHerstel, 300);
            if (r && r.ok && r.terugval) log('     ⓘ ' + r.terugval + ' — daarom de hele pagina geprint. Kies bij de stap “de hele pagina” of meld dit.');
            if (r && r.ok && r.zonderEerste) log('     eerste blad weggelaten');
            if (r && r.ok && r.eenBlad) log('     ⓘ de PDF heeft maar één blad — dat blad is wel opgeslagen');
            if (r && r.ok && r.scale && r.scale < 1) log('     ↔ verkleind tot ' + Math.round(r.scale * 100) + '% zodat alles op de breedte past');
            if (!r || !r.ok) { log(r && r.err === 'no-permission' ? '     ⚠ PDF opslaan kan niet: laad de extensie opnieuw in chrome://extensions (↻).' : '     ⚠ PDF opslaan niet gelukt' + (r && r.err ? ' (' + r.err + ')' : '') + ' — staat DevTools open op dit tabblad? Sluit die dan.'); return { ok: false }; }
            await sleep(150);
        }
        else if (s.type === 'nav') {
            const van = location.href;
            if (s.mode === 'url') { log('  ➜ naar ' + kortUrl(s.url)); gaNaar(s.url); }
            else if (s.mode === 'loop') {
                const L = RUN_ST && RUN_ST.lus && RUN_ST.loops && RUN_ST.loops[RUN_ST.lus.si];
                const doel = L && L.url;
                if (L && L.kader) { log('  ↩ terug naar de lijst (kader)'); history.back(); await sleep(800); await waitForIdle(8000); return; }
                if (doel && doel === location.href) log('  ↩ staat al op de lijst');
                else {
                    log('  ↩ terug naar de lijst');
                    history.back();
                    for (let t0 = Date.now(); Date.now() - t0 < 4000 && location.href === van; ) await sleep(150);
                    if (doel && location.href !== doel) gaNaar(doel);   // terugknop bracht ons niet bij de lijst
                }
            }
            else { log('  ↩ terug naar vorige pagina'); history.back(); }
            for (let t0 = Date.now(); Date.now() - t0 < 3000 && location.href === van; ) await sleep(150);
            await sleep(300);
            await waitForIdle(8000);
        }
        else if (s.type === 'shot') {
            if (RUN_ST) { RUN_ST.shotNr = (RUN_ST.shotNr || 0) + 1; if (RUN_ST.shotNr === 1 && RUN_ST.skipEersteShot) { log('  ' + s.name + ': eerste screenshot overgeslagen (instelling)'); return null; } }
            const sctx = Object.assign({}, row || {}, extraCtx || {});
            const od = opslagDoel(sctx);
            const sw = k => { let v = sctx[k]; if (v == null) { const kk = Object.keys(sctx).find(x => x.toLowerCase() === String(k).toLowerCase()); if (kk) v = sctx[kk]; } return v == null || typeof v === 'object' ? '' : String(v).trim(); };
            const shotNaam = (RUN_ST && typeof RUN_ST.pdfNaam === 'string' && RUN_ST.pdfNaam ? naamUitSjabloon(RUN_ST.pdfNaam, k => zelfdeNaam(k, 'ronde') ? String(sctx.ronde || '') : sw(k)).replace(/[\/\\]+/g, '-') : '') || s.name;
            log('  📸 ' + s.name + ' → map "' + od.map + '"' + (shotNaam !== s.name ? ', naam “' + shotNaam + '”' : ''));
            const hostEl = window.__wtHost;
            if (hostEl) hostEl.classList.add('wt-capturing');   // ons paneel niet in de foto
            doc.documentElement.classList.add('wt-nodock');      // pagina even op volle breedte
            await opnieuwGetekend();
            const r = await new Promise(res => { try { chrome.runtime.sendMessage({ type: 'wt-shot', name: od.voor + shotNaam, folder: od.map, zipRun: RUN_ST && RUN_ST.runId }, resp => res(resp)); } catch (e) { res(null); } });
            doc.documentElement.classList.remove('wt-nodock');
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
        stopReq = true; pauseReq = false; if (STAP_RES) STAP_RES('stop');
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

    // Start vanaf stap i: eerst naar het opgeslagen adres van die stap, daarna verder vanaf daar.
    async function startVanaf(i) {
        const s0 = steps[i]; if (!s0 || RUNNING) return;
        if (s0.pageUrl && s0.pageUrl !== location.href) {
            log('↪ Naar het adres van stap ' + (i + 1) + ': ' + kortUrl(s0.pageUrl), true);
            await siteGrant();
            try { chrome.storage.local.set({ 'pl-vanaf': { i, url: s0.pageUrl, host: location.hostname, ts: Date.now() } }); } catch (e) {}
            location.href = s0.pageUrl;
            await sleep(1500); await waitForIdle(8000);   // zelfde pagina (bv. #-adres): gewoon doorgaan
            try { chrome.storage.local.remove('pl-vanaf'); } catch (e) {}
        }
        startFlow(i);
    }
    try { chrome.storage.local.get('pl-vanaf', r => { const x = r && r['pl-vanaf']; if (x && Date.now() - (x.ts || 0) < 60000) { chrome.storage.local.remove('pl-vanaf'); setTimeout(() => startFlow(x.i), 1200); } }); } catch (e) {}
    // ================= 🌐 Hele site verkennen =================
    // Loopt alle pagina's van deze site af (zelfde domein), leest per pagina alle elementen en
    // maakt een rapport: wat staat waar, en wat valt op (kapotte links, pagina's zonder titel…).
    let SITE = null;
    // ---- Andere pagina's uitlezen: per regel een adres ophalen (ook van andere websites) zonder je tabblad
    // te verlaten. Eerst snel (alleen de HTML, met je eigen inlog); komt daar niets uit, dan in een verborgen
    // tabblad met JavaScript. Velden wijs je één keer aan op een voorbeeldpagina van dezelfde soort.
    const EXT_MODUS = { auto: 'automatisch', snel: 'snel (zonder JavaScript)', volledig: 'volledig (met JavaScript)' };
    function externUitleg(s) {
        const bron = s.urlKol ? 'adres uit “' + s.urlKol + '”' : s.url ? 'adres ' + String(s.url).slice(0, 40) : 'nog geen adres';
        const n = (s.velden || []).length;
        return bron + ' · ' + (n ? n + ' veld' + (n === 1 ? '' : 'en') : 'hele pagina') + ' · ' + (EXT_MODUS[s.modus || 'auto'] || 'automatisch');
    }
    function urlKolom() {
        const cols = csvCols(); if (!flowRows.length) return '';
        let best = '', bestN = 0;
        cols.forEach(c => { const n = flowRows.slice(0, 50).filter(r => /^https?:\/\//i.test(String(r[c] == null ? '' : r[c]).trim())).length; if (n > bestN) { best = c; bestN = n; } });
        return bestN >= Math.min(3, flowRows.length) * 0.5 ? best : '';
    }
    function externNieuw() {
        const k = urlKolom();
        const st = { type: 'scrape', kind: 'extern', name: 'Andere pagina’s uitlezen', urlKol: k, url: '', modus: 'auto', pauze: 1000, velden: [] };
        st.detail = externUitleg(st); addStep(st); OPEN_ST.add(st.id); renderSteps();
        log(k ? '  ✔ Elke ronde haalt ParseLab de pagina van het adres in “' + k + '” op en leest hem uit. Wijs eventueel velden aan op een voorbeeldpagina.' : '  ⓘ Kies bij de stap de kolom met adressen, of upload een lijst met een kolom vol https://-adressen.', true);
    }
    // Een selector die ook op andere pagina's van dezelfde soort werkt: id of klassen, zo kort mogelijk.
    function draagbareSelector(el) {
        const deel = e => {
            if (e.id && !looksGenerated(e.id)) return '#' + CSS.escape(e.id);
            const c = stableClasses(e).filter(x => !/^(is-|has-|active|selected|open|show)/.test(x)).slice(0, 2);
            return e.tagName.toLowerCase() + c.map(x => '.' + CSS.escape(x)).join('');
        };
        let sel = deel(el), n = el;
        for (let i = 0; i < 5; i++) {
            try { const l = doc.querySelectorAll(sel); if (l.length === 1 && l[0] === el) return sel; if (l.length > 1 && l[0] === el && /^#|\./.test(sel)) return sel; } catch (e) {}
            n = n.parentElement; if (!n || n === doc.body || n === doc.documentElement) break;
            sel = deel(n) + ' ' + sel;
        }
        return cssPath(el);
    }
    function externVeldAanwijzen(s) {
        beginPick(el => {
            const a = el.closest && el.closest('a[href]'), img = el.tagName === 'IMG' ? el : null;
            const attr = img ? 'src' : (a && txt(a).length < 3 ? 'href' : 'text');
            const doelEl = img || (attr === 'href' ? a : el);
            const lbl = (attr === 'text' ? txt(doelEl) : doelEl.getAttribute(attr) || '').slice(0, 30) || doelEl.tagName.toLowerCase();
            s.velden = s.velden || [];
            let col = /prijs|€|\d+[,.]\d{2}/i.test(txt(doelEl)) ? 'Prijs' : doelEl.tagName === 'H1' ? 'Titel' : attr === 'href' ? 'Link' : attr === 'src' ? 'Afbeelding' : 'Veld ' + (s.velden.length + 1);
            let k = 2; const basis = col; while (s.velden.some(v => v.col === col)) col = basis + ' ' + (k++);
            s.velden.push({ col, sel: draagbareSelector(doelEl), attr, voorbeeld: (attr === 'text' ? txt(doelEl) : doelEl.getAttribute(attr) || '').slice(0, 60) });
            s.detail = externUitleg(s); renderSteps(); renderFlow(); persist();
            log('  ✔ Veld “' + col + '” toegevoegd (' + lbl.slice(0, 30) + '). Pas de kolomnaam aan bij de stap.', true);
        }, 'Klik op een waarde op deze voorbeeldpagina (titel, prijs, link…)', 'read');
    }
    function externLees(html, adres, velden) {
        const d = new DOMParser().parseFromString(html, 'text/html');
        d.querySelectorAll('script, style, noscript, template').forEach(x => x.remove());
        const abs = h => { try { return new URL(h, adres).href; } catch (e) { return h || ''; } };
        if (velden && velden.length) {
            const uit = {}; let gevuld = 0;
            velden.forEach(v => {
                let el = null; try { el = d.querySelector(v.sel); } catch (e) {}
                let w = '';
                if (el) w = v.attr === 'href' || v.attr === 'src' ? abs(el.getAttribute(v.attr) || '') : v.attr && v.attr !== 'text' ? (el.getAttribute(v.attr) || '') : String(el.textContent || '').replace(/\s+/g, ' ').trim();
                if (w) gevuld++;
                uit[v.col] = w.slice(0, 2000);
            });
            return { velden: uit, leeg: gevuld === 0, gevuld };
        }
        const p = paginaUitlezen(d, adres);
        const md = d.querySelector('meta[name="description"]'); if (md && md.getAttribute('content')) p['Beschrijving'] = md.getAttribute('content').trim().slice(0, 400);
        if (p['Tekst']) p['Tekst'] = p['Tekst'].slice(0, 1500);
        const tekst = String((d.body && d.body.textContent) || '').replace(/\s+/g, ' ').trim();
        return { velden: p, leeg: tekst.length < 200, gevuld: Object.keys(p).length };
    }
    async function externStap(s, row, extraCtx) {
        const ctx = metVast(Object.assign({}, row || {}, extraCtx || {}));
        let adres = String(resolveValue(s.urlKol ? '{{' + s.urlKol + '}}' : (s.url || ''), ctx) || '').trim();
        if (!adres || /^\{\{/.test(adres)) { log('  ↷ ' + s.name + ': geen adres in deze regel'); return { ok: true }; }
        try { adres = new URL(adres, location.href).href; } catch (e) { log('  ⚠ ' + s.name + ': “' + adres.slice(0, 60) + '” is geen geldig adres'); return { ok: false }; }
        const modus = s.modus || 'auto';
        let r = await kaderBericht({ type: 'pl-extern', url: adres, modus: modus === 'volledig' ? 'volledig' : 'snel' });
        let res = r && r.ok && r.html ? externLees(r.html, r.url || adres, s.velden) : null, hoe = r && r.modus;
        const bestaatNiet = r && (r.status === 404 || r.status === 410);   // weg is weg; een tabblad helpt dan niet
        if (modus === 'auto' && !bestaatNiet && (!res || res.leeg)) {
            const r2 = await kaderBericht({ type: 'pl-extern', url: adres, modus: 'volledig' });
            const res2 = r2 && r2.ok && r2.html ? externLees(r2.html, r2.url || adres, s.velden) : null;
            if (res2 && (!res || res2.gevuld >= res.gevuld)) { res = res2; r = r2; hoe = 'volledig'; }
        }
        if (!res) { log('  ⚠ ' + adres.replace(/^https?:\/\//, '').slice(0, 60) + ': ' + ((r && r.err) || 'niet bereikbaar')); await sleep(Math.max(0, s.pauze == null ? 1000 : +s.pauze)); return { ok: false, merge: { Adres: adres, Reden: (r && r.err) || 'niet bereikbaar' } }; }
        log('  🌐 ' + adres.replace(/^https?:\/\//, '').slice(0, 60) + ': ' + (s.velden && s.velden.length ? res.gevuld + ' van ' + s.velden.length + ' velden' : 'hele pagina') + (hoe === 'volledig' ? ' (met JavaScript)' : ''));
        if (s.velden && s.velden.length && res.leeg) { await sleep(Math.max(0, s.pauze == null ? 1000 : +s.pauze)); return { ok: false, merge: Object.assign({ Adres: adres }, res.velden, { Reden: 'velden niet gevonden op deze pagina' }) }; }
        await sleep(Math.max(0, s.pauze == null ? 1000 : +s.pauze));   // beleefd tempo
        return { ok: true, merge: Object.assign({ Adres: adres }, res.velden) };
    }
    function siteVerkenner() {
        const u = new URL(location.href);
        askInline({
            title: '🌐 Hele site uitlezen',
            html: '<div>ParseLab loopt alle pagina’s van <b>' + esc(u.host) + '</b> af via de links, leest van elke pagina <b>alle elementen</b> (koppen, links, knoppen, velden, tabellen, teksten) en maakt een rapport.</div>' +
                '<label class="kol">Begin bij<input id="wt-ask-sstart" class="wt-num" style="width:100%" value="' + esc(location.href.split('#')[0]) + '"></label>' +
                '<div class="wt-row">hoogstens <input id="wt-ask-smax" class="wt-num" type="number" min="1" max="1000" value="50"> pagina’s · <label><input type="checkbox" id="wt-ask-spad" checked> alleen onder dit pad</label></div>' +
                '<div class="hint">Werkt met jouw inlog, alleen lezen (er wordt niets geklikt of ingevuld). Web-apps die alles met JavaScript tekenen (zoals Cockpit) geven per pagina minder; gebruik daar Opnemen of een lus.</div>',
            onRender: box => { const c = box.querySelector('#wt-ask-spad'); c.value = '1'; c.onchange = () => c.value = c.checked ? '1' : ''; },
            buttons: [{ label: '▶ Verkennen', primary: true, fn: v => siteStart(v['wt-ask-sstart'], Math.max(1, Math.min(1000, +v['wt-ask-smax'] || 50)), v['wt-ask-spad'] === '1') }, { label: t('cancel') }]
        });
    }
    async function siteStart(start, max, alleenPad) {
        let u0; try { u0 = new URL(start, location.href); } catch (e) { log('⚠ Ongeldig adres.', true); return; }
        const pad = alleenPad ? u0.pathname.replace(/[^/]*$/, '') : '/';
        const norm = h => { try { const x = new URL(h, u0); x.hash = ''; return x.href; } catch (e) { return null; } };
        const binnen = h => { try { const x = new URL(h); return x.origin === u0.origin && x.pathname.indexOf(pad) === 0 && !/\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|pptx?|mp4|mp3|css|js|ico|xml|json)(\?|$)/i.test(x.pathname) && !/^(mailto|tel|javascript):/i.test(h); } catch (e) { return false; } };
        SITE = { stop: false, paginas: [], elementen: [], velden: [], kapot: [], bestanden: new Set(), start: Date.now() };
        const box = $('#site-box'); box.style.display = 'block'; toonTab('hand');
        const wacht = [norm(u0.href)], gezien = new Set(wacht);
        const teken = (klaar) => {
            const P = SITE.paginas, tel = k => P.reduce((a, x) => a + (x[k] || 0), 0);
            const opv = [];
            if (SITE.kapot.length) opv.push('🔴 ' + SITE.kapot.length + ' kapotte link(s) / pagina’s');
            const zonderTitel = P.filter(x => !x.Titel).length; if (zonderTitel) opv.push('🟠 ' + zonderTitel + ' pagina’s zonder titel');
            const zonderH1 = P.filter(x => !x.H1 && x.Status < 400).length; if (zonderH1) opv.push('🟠 ' + zonderH1 + ' pagina’s zonder hoofdkop (h1)');
            const dub = {}; P.forEach(x => { if (x.Titel) dub[x.Titel] = (dub[x.Titel] || 0) + 1; }); const nd = Object.values(dub).filter(n => n > 1).length; if (nd) opv.push('🟡 ' + nd + ' titel(s) dubbel gebruikt');
            const js = P.filter(x => x.Opmerking && /JavaScript/.test(x.Opmerking)).length; if (js) opv.push('ⓘ ' + js + ' pagina’s lijken met JavaScript getekend (weinig inhoud in de HTML)');
            if (P.some(x => x.Formulieren)) opv.push('📝 formulieren op ' + P.filter(x => x.Formulieren).length + ' pagina’s');
            if (SITE.bestanden.size) opv.push('📎 ' + SITE.bestanden.size + ' bestanden (PDF, Word, Excel…) gevonden');
            box.innerHTML = '<div class="site-kop"><b>🌐 ' + (klaar ? 'Site verkend' : 'Bezig met verkennen…') + '</b> <span class="hint">' + P.length + ' pagina’s' + (klaar ? '' : ' · nog ' + wacht.length + ' in de wachtrij') + '</span></div>' +
                '<div class="site-tel">' + [['pagina’s', P.length], ['elementen', SITE.elementen.length], ['links', tel('Links')], ['knoppen', tel('Knoppen')], ['velden', tel('Invulvelden')], ['formulieren', tel('Formulieren')], ['tabellen', tel('Tabellen')], ['afbeeldingen', tel('Afbeeldingen')]].map(x => '<span><b>' + x[1] + '</b> ' + x[0] + '</span>').join('') + '</div>' +
                (opv.length ? '<div class="site-opv"><b>Opvallend</b><br>' + opv.join('<br>') + '</div>' : '') +
                '<details><summary>Per pagina</summary><ol class="site-lijst">' + P.slice(-200).map(x => '<li' + (x.Status >= 400 ? ' class="fout"' : '') + '><b>' + esc((x.Titel || '(geen titel)').slice(0, 50)) + '</b> <span class="hint">' + esc(kortUrl(x.Adres).slice(0, 50)) + ' · ' + (x.Status >= 400 ? 'fout ' + x.Status : x.Elementen + ' elementen') + (x.Opmerking ? ' · ' + esc(x.Opmerking) : '') + '</span></li>').join('') + '</ol></details>' +
                '<div class="wt-row">' + (klaar ? '<button class="wt-btn" data-sdl="paginas">⬇ Overzicht (Excel)</button><button class="wt-btn" data-sdl="elementen">⬇ Alle elementen (Excel)</button><button class="wt-btn" data-sdl="velden">⬇ Alle velden per pagina</button><button class="wt-btn alt" data-sdl="dicht">Sluiten</button>' : '<button class="wt-btn alt" data-sdl="stop">■ Stoppen</button>') + '</div>';
            box.querySelectorAll('[data-sdl]').forEach(b => b.onclick = () => {
                const k = b.dataset.sdl;
                if (k === 'stop') { SITE.stop = true; return; }
                if (k === 'dicht') { box.style.display = 'none'; return; }
                const rows = k === 'paginas' ? SITE.paginas : k === 'elementen' ? SITE.elementen : SITE.velden;
                downloadBytes(toXlsx(rows.length ? rows : [{}]), 'parselab-site-' + k + '.xlsx', XLSX_MIME); flash(b, '✔');
            });
        };
        teken(false);
        log('🌐 Site verkennen vanaf ' + kortUrl(u0.href) + ' (max. ' + max + ' pagina’s)…', true);
        while (wacht.length && SITE.paginas.length < max && !SITE.stop) {
            const url = wacht.shift();
            let d = null, status = 200, opm = '';
            try {
                if (norm(location.href) === url) d = doc;   // de huidige pagina: zoals hij nu getekend is (ook web-apps)
                else {
                    const r = await fetch(url, { credentials: 'include', redirect: 'follow' });
                    status = r.status;
                    const ct = r.headers.get('content-type') || '';
                    if (r.ok && /html/i.test(ct)) d = new DOMParser().parseFromString(await r.text(), 'text/html');
                    else if (r.ok) { SITE.bestanden.add(url); continue; }
                }
            } catch (e) { status = 0; opm = 'niet bereikbaar'; }
            if (!d) { SITE.kapot.push(url); SITE.paginas.push({ Adres: url, Titel: '', H1: '', Status: status || 0, Elementen: 0, Opmerking: opm || 'fout ' + status }); teken(false); continue; }
            const els = elementenVan(d, url);
            const tel = soort => els.filter(e => e.Soort === soort).length;
            const links = els.filter(e => e.Soort === 'link');
            links.forEach(l => { const h = norm(l.Adres); if (!h) return; if (/\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i.test(h)) SITE.bestanden.add(h); else if (binnen(h) && !gezien.has(h)) { gezien.add(h); wacht.push(h); } });
            const tekst = txt(d.body || d.documentElement || d);
            if (d !== doc && links.length < 2 && tekst.length < 200) opm = 'weinig inhoud in de HTML — wordt waarschijnlijk met JavaScript getekend';
            const h1 = d.querySelector ? d.querySelector('h1') : null;
            SITE.paginas.push({ Adres: url, Titel: (d.title || '').trim(), H1: h1 ? txt(h1).slice(0, 120) : '', Status: status, Elementen: els.length, Links: links.length, Knoppen: tel('knop'), Invulvelden: tel('invulveld'), Formulieren: tel('formulier'), Tabellen: tel('tabel'), Afbeeldingen: tel('afbeelding'), Woorden: tekst ? tekst.split(' ').length : 0, Opmerking: opm });
            if (SITE.elementen.length < 50000) SITE.elementen.push.apply(SITE.elementen, els);
            try { SITE.velden.push(paginaUitlezen(d, url)); } catch (e) {}
            teken(false);
            await sleep(250);
        }
        teken(true);
        log('✓ Site verkend: ' + SITE.paginas.length + ' pagina’s, ' + SITE.elementen.length + ' elementen' + (SITE.kapot.length ? ', ' + SITE.kapot.length + ' kapot' : '') + (wacht.length && !SITE.stop ? ' (gestopt bij het maximum; nog ' + wacht.length + ' niet bezocht)' : '') + '.');
    }
    // Begin van het stuk flow dat op dezelfde pagina gebeurt als stap si (niet over een lus heen).
    function paginaBegin(lijst, si) {
        let k = si; const pg = lijst[si] && lijst[si].page;
        while (k > 0 && pg && lijst[k - 1].page === pg && !isLusStart(lijst[k - 1]) && lijst[k - 1].type !== 'endloop' && lijst[k - 1].type !== 'nav') k--;
        return k;
    }
    async function startFlow(vanaf, opts) {
        if (RUNNING) return;
        vanaf = typeof vanaf === 'number' && vanaf > 0 ? vanaf : 0;
        opts = opts && !opts.type ? opts : {};
        const modus = opts.modus || ($('#flow-modus') ? $('#flow-modus').value : 'alles');
        // Gepauzeerde ronde? → hervat waar we waren.
        const prev = await loadRun();
        if (prev && prev.paused) { prev.paused = false; pauseReq = false; await saveRun(prev); log('▶ Hervat…', true); steps = prev.steps || steps; renderSteps(); renderFlow(); runFromState(prev); return; }
        if (!steps.length) { log('⚠ Nog geen stappen — klik eerst op “+ Stap toevoegen”.', true); return; }
        // 1. Automatische koppelingscheck, in gewone taal.
        const chk = checkLinks();
        if (chk.bad.length) log('  ' + chk.bad.length + ' element(en) staan niet op deze pagina; ParseLab zoekt ze tijdens de ronde.', true);
        // 2. Toestemming van de organisatie, één keer per site.
        const host = location.hostname;
        if (!(await getConsent(host))) setConsent(host);
        // 3. Webhook: bevestiging met de eerste regel als voorbeeld.
        const wh = steps.find(s => s.type === 'webhook' && (s.url || '').trim());
        if (wh) {
            if (!/^https:\/\//i.test(wh.url.trim())) { log('⚠ De stap “' + wh.name + '” heeft geen https-adres. Alleen https is toegestaan.', true); return; }
            const sample = flowRows.length ? flowRows[0] : {};
            const ok = opts.planId ? true : await askPromise({ title: 'Regels doorsturen?', html: 'Elke regel wordt gestuurd naar <b>' + esc(wh.url.trim()) + '</b>.<br>Voorbeeld (eerste regel):<pre class="wt-pre" style="max-height:90px">' + esc(JSON.stringify(sample, null, 1).slice(0, 400)) + '</pre>', buttons: [{ label: 'Ja, versturen', primary: true, value: true }, { label: t('cancel'), value: false }] });
            if (!ok) return;
        }
        // 4. Toegang tot deze site zodat de ronde doorloopt na een paginawissel.
        const g = await siteGrant();
        if (!g.ok && steps.some(s => s.type === 'nav' && s.mode === 'url')) log('  ⓘ Geen doorlopende toegang tot deze site: de ronde stopt als de pagina helemaal opnieuw laadt' + (steps.some(s => s.type === 'loop' || s.type === 'nav') ? ' (binnen een web-app zoals Cockpit gaat een lus meestal gewoon door)' : '') + '.' + (g.err ? ' (' + g.err + ')' : ''), true);
        // 5. Cookiemelding wegklikken.
        if (await getSetting('pl-cookies', true)) { if (dismissCookies()) { log('  🍪 Cookiemelding gesloten.', !g.ok ? false : true); await sleep(300); } }
        // Regels uit de wachtrij (cloud): pak het volgende werk op; twee computers pakken nooit dezelfde regel.
        let wachtrij = false;
        if (bronModus() === 'wachtrij' && opts.rijVan == null) {
            if (!CLOUD || !CLOUD.id) { log('⚠ Deze flow staat nog niet in de cloud. Voeg eerst een stap toe (hij wordt vanzelf bewaard) en start daarna.', true); if (opts.planId) autoKlaar(opts.planId, 'flow niet bewaard'); return; }
            await cloudBewaar(true);
            const b0 = ($('#flow-bereik') && $('#flow-bereik').value) || 'alles', max = b0 === 'alles' ? 500 : b0 === 'vantot' ? Math.max(1, (+$('#flow-tot').value || 500) - (+$('#flow-van').value || 1) + 1) : +b0;
            const r = await db('wq-pak', { flow_id: CLOUD.id, aantal: max, door: await deurNaam() });
            if (!r || !r.ok) { log('⚠ Wachtrij niet bereikbaar' + (r && r.err ? ': ' + r.err : '') + '.', true); if (opts.planId) autoKlaar(opts.planId, 'wachtrij niet bereikbaar'); return; }
            if (!r.items.length) { log('✓ De wachtrij is leeg — niets te doen.', true); if (opts.planId) autoKlaar(opts.planId, 'geen werk'); return; }
            WQ_LIJST = flowRows; flowRows = r.items.map(i => Object.assign({}, i.data || {}, { _wq: i.id })); wachtrij = true;
            log('📥 ' + r.items.length + ' regel(s) uit de wachtrij opgepakt.', true);
        }
        const alleRijen = rondeRijen();
        const br = flowRows.length && aantalModus() !== 'aantal' && !wachtrij ? bereik() : { van: 1, tot: alleRijen.length };
        if (flowRows.length && br.van > alleRijen.length) { log('⚠ Regel ' + br.van + ' bestaat niet: je lijst heeft ' + alleRijen.length + ' regels.', true); return; }
        const rijBasis = opts.rijVan != null ? opts.rijVan : br.van - 1;
        let rows = alleRijen.slice(rijBasis, br.tot); if (!rows.length) rows = [null];
        const testN = modus === 'stap1' ? 1 : modus === 'alles' ? 0 : 5;
        const isTest = testN && rows.length > testN;
        if (testN) rows = rows.slice(0, testN);
        if (!rows.length) rows = [null];
        const st = {
            steps: JSON.parse(JSON.stringify(steps)), rows,
            delay: Math.max(0, +$('#flow-delay').value || 0),
            repeat: Math.max(1, +$('#flow-repeat').value || 1),
            folder: sanitizeFolder($('#flow-folder').value) || 'ParseLab',
            groupCol: ($('#flow-group').value || '').trim(),
            cursor: { rp: 0, ri: 0, si: vanaf }, out: {}, results: [], running: true, startedAt: Date.now(), errRows: {}, host,
            runId: 'run_' + Date.now().toString(36), logShots: !!($('#log-shots') && $('#log-shots').checked), log: [],
            stapModus: /^stap/.test(modus), modus, testN: isTest ? testN : 0, totaal: alleRijen.length, origRows: flowRows.slice(),
            tussen: ($('#flow-tussen') && $('#flow-tussen').value) || 'klaar', tussenSec: Math.max(1, +($('#flow-tussen-sec') && $('#flow-tussen-sec').value) || 3), terugStart: !($('#flow-terugstart') && !$('#flow-terugstart').checked), passBasis: rijBasis, bereikTot: br.tot, bereikAan: !!(flowRows.length && $('#flow-bereik') && $('#flow-bereik').value !== 'alles'), startUrl: (($('#flow-startUrl') && $('#flow-startUrl').value) || '').trim(), opslag: ($('#flow-opslag') && $('#flow-opslag').value) || 'een', opslagKol: ($('#flow-opslag-kol') && $('#flow-opslag-kol').value) || '', pdfNaam: (($('#flow-pdfnaam') && $('#flow-pdfnaam').value) || '').trim(), pdfZonderEerste: !!($('#pdf-eerste') && $('#pdf-eerste').checked), namen: {}, bestandNr: 0, shotNr: 0, skipEersteShot: !!($('#zip-eerste') && $('#zip-eerste').checked)
        };
        if (testN) st.repeat = 1;
        if (wachtrij) { st.wachtrij = true; st.repeat = 1; st.bereikAan = false; }
        if (opts.planId) { st.planId = opts.planId; st.tussen = st.tussen === 'klik' ? 'klaar' : st.tussen; st.stapModus = false; }
        st.bron = opts.planId ? (opts.bron || 'planning') : wachtrij ? 'wachtrij' : isTest ? 'test' : 'handmatig';
        if (CLOUD && CLOUD.id) { st.flowId = CLOUD.id; st.flowNaam = CLOUD.naam; }
        if (opts.vorige) st.results = opts.vorige.slice();
        if (testN) log(modus === 'test5' ? '🧪 Testronde: de eerste ' + rows.length + ' ronde(s). Daarna vraagt ParseLab of de rest automatisch mag.' : '👣 Stap voor stap: ' + rows.length + ' ronde(s). Gebruik ▶ / ◀ (of de pijltjestoetsen) bovenin.', true);
        if (vanaf) log('▶ Start vanaf stap ' + (vanaf + 1) + ' (' + (st.steps[vanaf].name || st.steps[vanaf].type) + ').', true);
        if (st.bereikAan) log('  Regels ' + (rijBasis + 1) + '–' + br.tot + ' van ' + alleRijen.length + '.');
        log('▶ Start — ' + st.steps.length + ' stap(pen), ' + rows.length + ' ' + (rows[0] && rows[0]._groep ? 'rondes' : flowRows.length ? 'regels' : 'keer') + (st.repeat > 1 ? ' × ' + st.repeat : '') + '.', !(g.ok === false));
        if (!flowRows.length && st.steps.some(s => s.type === 'fill' || ((s.type === 'setval' || s.type === 'select') && /\{\{/.test(s.value || '')))) log('  ⓘ Geen lijst geladen: invulstappen hebben niets om in te vullen. Upload eerst je lijst.');
        // Run-geschiedenis (cloud): begin vastleggen.
        try { const rr = await db('run-start', { flow_id: st.flowId, flow_naam: st.flowNaam || (CLOUD ? CLOUD.naam : 'Naamloos'), bron: st.bron, door: await deurNaam(), totaal: rows.length }); if (rr && rr.ok) st.runDb = rr.id; } catch (e) {}
        await saveRun(st);
        runFromState(st);
    }

    // Lus-besturing. Geeft de index van de volgende stap terug.
    function lusEinde(list, si) { let d = 0; for (let k = si; k < list.length; k++) { if (isLusStart(list[k])) d++; else if (list[k].type === 'endloop') { d--; if (d === 0) return k; } } return list.length - 1; }
    // De lus waar positie p binnen valt (of -1).
    // Items van de lus op stap si; zit hij in een andere lus, dan alleen de items binnen het huidige buitenitem.
    function lusItemsIn(st, si) {
        let items = lusItems(st.steps[si].spec);
        const o = omringendeLus(st.steps, si);
        if (o >= 0 && st.steps[o].type === 'loop' && st.loops && st.loops[o]) {
            const buiten = lusItemsIn(st, o)[st.loops[o].i];
            if (buiten) { const binnen = items.filter(x => buiten !== x && buiten.contains(x)); if (binnen.length) items = binnen; }
        }
        return items;
    }
    function omringendeLus(list, p) { let d = 0; for (let k = p - 1; k >= 0; k--) { if (list[k].type === 'endloop') d++; else if (isLusStart(list[k])) { if (d === 0) return k; d--; } } return -1; }
    function lusKlaar(st, si, L) {
        const o = omringendeLus(st.steps, si);
        if (o >= 0 && st.loops && st.loops[o]) { st.lus = { si: o, i: st.loops[o].i }; st.out = Object.assign({}, L.base); st.naBinnenlus = JSON.stringify(st.out); }
        else { st.lus = null; if (L.i > 0) st.out = {}; }
        LUS_ITEM = null;
    }
    function lusBegin(list, si) { let d = 0; for (let k = si; k >= 0; k--) { if (list[k].type === 'endloop') d++; else if (isLusStart(list[k])) { d--; if (d === 0) return k; } } return -1; }
    async function gebiedTel(step) {
        if (step.frame) { const r = await kaderOpdracht('run', { type: 'gebiedtel', gebied: step.gebied, sig: step.sig, frame: step.frame }); return (r && r.n) || 0; }
        return gebiedItems({ binnen: step.gebied, sig: step.sig }).length;
    }
    async function gebiedKlik(step, nr) {
        if (step.frame) return (await kaderOpdracht('run', { type: 'gebiedklik', gebied: step.gebied, sig: step.sig, nr, frame: step.frame })) || { ok: false, err: 'kader niet bereikbaar' };
        const el = gebiedItems({ binnen: step.gebied, sig: step.sig })[nr]; if (!el) return { ok: false, err: 'item niet gevonden' };
        const tekst = itemNaam(el); klikReeks(knopRond(el), true); await sleep(300); return { ok: true, tekst };
    }
    async function lusStap(st, si, step) {
        st.loops = st.loops || {};
        if (step.type === 'loopklik') {
            let L = st.loops[si];
            if (!L) L = st.loops[si] = { i: 0, url: location.href, base: Object.assign({}, st.out), kader: !!step.frame };
            let n = await gebiedTel(step);
            for (const t0 = Date.now(); n <= L.i && Date.now() - t0 < 10000 && !stopReq; ) { await sleep(400); n = await gebiedTel(step); }
            if (L.n == null) L.n = n;
            const totaal = +step.max ? Math.min(+step.max, L.n) : L.n;
            if (L.i >= totaal || L.i >= n) {
                log('  ↺ lus klaar: ' + L.i + ' van ' + totaal + ' items gedaan');
                delete st.loops[si]; lusKlaar(st, si, L); return lusEinde(st.steps, si) + 1;
            }
            const r = await gebiedKlik(step, L.i);
            st.lus = { si, i: L.i };
            st.out = Object.assign({}, L.base, { Item: r.tekst || ('item ' + (L.i + 1)) });
            log('  ↻ item ' + (L.i + 1) + '/' + totaal + ': ' + (r.tekst || '') + (r.ok ? '' : ' — ⚠ ' + (r.err || 'klikken lukte niet')));
            return si + 1;
        }
        if (step.type === 'rijlus') {
            const rondeRij = st.rows[st.cursor.ri] || {};
            const groep = rondeRij._groep || [rondeRij];
            let L = st.loops[si];
            if (!L) L = st.loops[si] = { i: 0, url: location.href, base: Object.assign({}, st.out) };
            if (L.i >= groep.length) { log('  ↺ alle ' + groep.length + ' regel(s) van deze ronde gedaan'); delete st.loops[si]; lusKlaar(st, si, L); return lusEinde(st.steps, si) + 1; }
            const rij = Object.assign({}, groep[L.i]); delete rij._groep;
            st.lus = { si, i: L.i };
            st.out = Object.assign({}, L.base, rij);
            log('  ↻ regel ' + (L.i + 1) + '/' + groep.length + ': ' + Object.keys(rij).slice(0, 3).map(k => rij[k]).join(' · '));
            return si + 1;
        }
        if (step.type === 'loop') {
            let L = st.loops[si];
            if (!L) L = st.loops[si] = { i: 0, url: location.href, base: Object.assign({}, st.out) };
            let items = lusItemsIn(st, si);
            // Na "terug" heeft de lijst even nodig om er weer te staan.
            for (let t0 = Date.now(); items.length <= L.i && Date.now() - t0 < 10000 && !stopReq; ) { await sleep(300); items = lusItemsIn(st, si); }
            if (L.n == null) L.n = items.length;
            const totaal = +step.max ? Math.min(+step.max, L.n) : L.n;
            if (L.i >= totaal || L.i >= items.length) {
                log('  ↺ lus klaar: ' + L.i + ' van ' + totaal + ' items gedaan' + (L.i < totaal ? ' (lijst niet meer gevonden)' : ''));
                delete st.loops[si]; lusKlaar(st, si, L);   // basiswaarden zitten al in elke item-regel
                return lusEinde(st.steps, si) + 1;
            }
            const item = items[L.i]; LUS_ITEM = item; LUS_ACTIEF = true;
            const vals = {}; (step.spec.columns || []).forEach(c => { vals[c.name] = readField(item, c); });
            st.lus = { si, i: L.i };
            st.out = Object.assign({}, L.base, vals);
            try { item.scrollIntoView({ block: 'center' }); } catch (e) {}
            const eerste = Object.values(vals).find(v => v);
            log('  ↻ item ' + (L.i + 1) + '/' + totaal + (eerste ? ': ' + String(eerste).slice(0, 40) : ''));
            return si + 1;
        }
        const b = lusBegin(st.steps, si); const L = b >= 0 ? st.loops[b] : null;
        if (!L) return si + 1;
        if (Object.keys(st.out).length && JSON.stringify(st.out) !== st.naBinnenlus) st.results.push(Object.assign({}, st.out, { _item: L.i + 1 }));
        st.naBinnenlus = null;
        L.i++; st.out = Object.assign({}, L.base); LUS_ITEM = null;
        return b;
    }

    // ---------- zelfherstel (spec §8) ----------
    let AI_VOLG = true, AI_SLEUTEL = false;
    function stapMetElement(s) { return !s.frame && !s.rel && !s.match && (s.type === 'click' || s.type === 'setval' || s.type === 'select' || s.type === 'hover' || (s.type === 'scrape' && s.kind === 'element')); }
    async function vindStapElement(s, ms) {
        const zoek = () => s.positie ? doelOpPositie(s) : targetEl(s);
        let el = zoek(); for (const t0 = Date.now(); !el && Date.now() - t0 < (ms || 3000); ) { await sleep(250); el = zoek(); }
        return el;
    }
    function stratUitStap(s) {
        const naam = String(s.name || '').replace(/^Klik op:?\s*/i, '').replace(/^(Veld|Keuzelijst|Datum):\s*/, '').replace(/[“”"]/g, '');
        return { naam, tekst: naam, label: invoerKolom(s) || '', rol: s.type === 'click' ? 'button' : (s.type === 'scrape' ? '' : 'textbox'), tag: '' };
    }
    async function herstel(s) {
        const strat = s.strat || stratUitStap(s);
        // 1) gelijkenis op de vingerafdruk (lokaal, zonder AI-dienst)
        const f = zoekOpStrategie(strat);
        if (f && f.score >= 0.75) { log('  🩹 “' + (s.name || s.type) + '” niet op de oude plek; teruggevonden via ' + f.via + ' (' + Math.round(f.score * 100) + '%).'); return { el: f.el, info: { method: 'fuzzy', confidence: Math.round(f.score * 100) / 100, reden: 'gevonden via ' + f.via, confirmedBy: 'auto' } }; }
        // 2) Claude (alleen met eigen sleutel): kiest uit een ingekorte lijst kandidaten
        if (!AI_SLEUTEL) { if (f) log('  ⓘ zelfherstel: beste kandidaat maar ' + Math.round(f.score * 100) + '% — te onzeker.'); return f ? { info: { method: 'fuzzy', confidence: Math.round(f.score * 100) / 100, reden: 'te onzeker' } } : null; }
        const k = kandidatenLijst(250);
        log('  🩹 “' + (s.name || s.type) + '” niet gevonden — Claude zoekt mee…');
        const r = await kaderBericht({ type: 'pl-llm', taak: 'herstel', stap: { label: s.name, actie: s.type, omschrijving: s.detail || '', vingerafdruk: strat }, kandidaten: k.data });
        if (!r || !r.ok || !r.result) { log('  ⚠ zelfherstel met Claude lukte niet' + (r && r.err ? ': ' + r.err : '') + '.'); return null; }
        const { candidateId, confidence, reden } = r.result; const el = k.els[candidateId];
        const info = { method: 'llm', confidence, reden, oud: s.selector || '', confirmedBy: 'auto' };
        if (!el || confidence < 0.6) { log('  ⚠ Claude vond geen passend element (' + Math.round((confidence || 0) * 100) + '%): ' + (reden || '')); return { info }; }
        if (confidence < 0.85) {
            highlightEl(el);
            const ja = await askPromise({ title: 'Is dit het goede element?', html: '<div>Stap <b>“' + esc(s.name || s.type) + '”</b> stond niet meer op de oude plek. Claude denkt dat het dit is (blauw omlijnd, ' + Math.round(confidence * 100) + '% zeker):</div><div class="hint">' + esc(reden || '') + '</div>', buttons: [{ label: 'Ja, gebruik dit', primary: true, value: true }, { label: 'Nee, sla over', value: false }] });
            if (!ja) return { info: Object.assign(info, { confirmedBy: 'gebruiker: nee' }) };
            info.confirmedBy = 'gebruiker';
        }
        log('  🩹 hersteld door Claude (' + Math.round(confidence * 100) + '%): ' + (reden || ''));
        return { el, info };
    }
    function pasStapAan(s, el) {
        const nieuw = { selector: stableSel(el), fp: fingerprint(el), strat: maakStrat(el) };
        const pas = x => { Object.assign(x, nieuw); if (x.positie) x.positie = { pad: cssPath(el) }; };
        pas(s); const g = steps.find(x => x.id === s.id); if (g && g !== s) pas(g);
        renderSteps(); persist();
    }
    // ---------- schermafbeeldingen (spec §5) ----------
    async function maakShot(st, nr, el, label) {
        try {
            if (el) { try { el.scrollIntoView({ block: 'center' }); } catch (e) {} await sleep(80); const r = el.getBoundingClientRect(); ovlShow(r); ovlLabel.textContent = label; ovlLabel.style.top = (r.top < 24 ? r.height + 2 : -20) + 'px'; }
            host.classList.add('wt-capturing'); doc.documentElement.classList.add('wt-maskeer');
            await sleep(60);
            const r = await kaderBericht({ type: 'pl-shot', runId: st.runId, naam: String(nr) });
            return r && r.ok ? r.id : null;
        } catch (e) { return null; }
        finally { host.classList.remove('wt-capturing'); doc.documentElement.classList.remove('wt-maskeer'); if (el) ovlHide(); }
    }
    // ---------- run-viewer + rapport ----------
    const STATUS_ICOON = { ok: '✓', failed: '✗', healed: '🩹', skipped: '↷', retry: '↪' };
    function renderRunlog(lijst) {
        const box = $('#wt-runlog'); if (!box) return;
        if (!lijst || !lijst.length) { box.innerHTML = '<div class="hint">Nog geen ronde gedraaid. Klik bovenaan op <b>Start</b>.</div>'; return; }
        box.innerHTML = lijst.slice(-60).map(e => '<div class="rl"><span class="st ' + e.status + '">' + (STATUS_ICOON[e.status] || '•') + '</span><div class="tx"><b>' + (e.i + 1) + '. ' + esc(e.label) + '</b>' +
            '<small>' + (e.regel ? 'regel ' + e.regel + ' · ' : '') + (e.ms != null ? e.ms + ' ms · ' : '') + esc(e.url || '') +
            (e.healing ? ' · herstel: ' + esc(e.healing.method) + ' ' + Math.round((e.healing.confidence || 0) * 100) + '%' + (e.healing.reden ? ' — ' + esc(e.healing.reden) : '') : '') +
            (e.extracted ? ' · ' + esc(JSON.stringify(e.extracted).slice(0, 80)) : '') + (e.err ? ' · ' + esc(e.err.slice(0, 100)) : '') + '</small></div>' +
            (e.shot ? '<img data-shot="' + esc(e.shot) + '" alt="schermafbeelding">' : '') + (e.shotFout ? '<img data-shot="' + esc(e.shotFout) + '" alt="fout">' : '') + '</div>').join('');
        const ids = Array.from(box.querySelectorAll('img[data-shot]')).map(i => i.dataset.shot);
        if (ids.length) kaderBericht({ type: 'pl-shot-get', ids }).then(r => { const m = (r && r.shots) || {}; box.querySelectorAll('img[data-shot]').forEach(i => { if (m[i.dataset.shot]) { i.src = m[i.dataset.shot]; i.onclick = () => { const g = $('#wt-groot'); g.innerHTML = '<img src="' + m[i.dataset.shot] + '">'; g.style.display = 'flex'; g.onclick = () => { g.style.display = 'none'; g.innerHTML = ''; }; }; } else i.remove(); }); });
    }
    let LAATSTE_RUN = null;
    function bewaarRunlog(st, status) {
        LAATSTE_RUN = { runId: st.runId, host: st.host, start: st.startedAt, einde: Date.now(), status, steps: st.log || [] };
        try { chrome.storage.local.get('pl-runs', r => { const l = (r && r['pl-runs']) || []; l.unshift(LAATSTE_RUN); chrome.storage.local.set({ 'pl-runs': l.slice(0, 10) }); }); } catch (e) {}
        renderRunlog(LAATSTE_RUN.steps);
    }
    if ($('#log-rapport')) $('#log-rapport').onclick = async function () {
        const run = LAATSTE_RUN; if (!run || !run.steps.length) { flash(this, 'nog geen ronde'); return; }
        const ids = []; run.steps.forEach(e => { if (e.shot) ids.push(e.shot); if (e.shotFout) ids.push(e.shotFout); });
        const r = ids.length ? await kaderBericht({ type: 'pl-shot-get', ids }) : null; const m = (r && r.shots) || {};
        const regels = run.steps.map(e => '<tr><td>' + (e.i + 1) + '</td><td>' + (STATUS_ICOON[e.status] || '') + ' ' + esc(e.status) + '</td><td><b>' + esc(e.label) + '</b><br><small>' + esc(e.url || '') + (e.healing ? '<br>herstel: ' + esc(JSON.stringify(e.healing)) : '') + (e.extracted ? '<br>' + esc(JSON.stringify(e.extracted)) : '') + (e.err ? '<br>fout: ' + esc(e.err) : '') + '</small></td><td>' + (e.ms || 0) + ' ms</td><td>' + (e.shot && m[e.shot] ? '<img src="' + m[e.shot] + '">' : '') + (e.shotFout && m[e.shotFout] ? '<img src="' + m[e.shotFout] + '">' : '') + '</td></tr>').join('');
        const html = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>ParseLab-rapport ' + esc(run.runId) + '</title><style>body{font:14px system-ui;margin:24px;color:#111}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;vertical-align:top;text-align:left}img{max-width:420px;border:1px solid #ccc;border-radius:6px}small{color:#666}</style></head><body>' +
            '<h1>ParseLab — rapport van een ronde</h1><p>' + esc(run.host || '') + ' · ' + new Date(run.start).toLocaleString('nl-NL') + ' – ' + new Date(run.einde).toLocaleTimeString('nl-NL') + ' · status: <b>' + esc(run.status) + '</b> · ' + run.steps.length + ' stappen</p>' +
            '<table><tr><th>#</th><th>Status</th><th>Stap</th><th>Duur</th><th>Schermafbeelding</th></tr>' + regels + '</table></body></html>';
        downloadBytes(new TextEncoder().encode(html), 'parselab-rapport-' + run.runId + '.html', 'text/html');
        flash(this, '✔ rapport opgeslagen');
    };
    if ($('#log-shots')) { try { chrome.storage.local.get('pl-log-shots', r => { if (r && r['pl-log-shots'] === false) $('#log-shots').checked = false; }); } catch (e) {} $('#log-shots').onchange = function () { try { chrome.storage.local.set({ 'pl-log-shots': this.checked }); } catch (e) {} }; }
    try { chrome.storage.local.get('pl-runs', r => { const l = r && r['pl-runs']; if (l && l[0]) { LAATSTE_RUN = l[0]; renderRunlog(l[0].steps); } }); } catch (e) {}

    // Context per ronde: eerder uitgelezen waarden (deze ronde), 'vorige …' (vorige ronde), ronde-nummer.
    function rondeCtx(st, pass) {
        const c = {}; const vorig = st.results && st.results[st.results.length - 1];
        if (vorig) Object.keys(vorig).forEach(k => { if (k[0] !== '_' && typeof vorig[k] !== 'object') c['vorige ' + k] = vorig[k]; });
        return Object.assign(c, st.out, { ronde: pass, vandaag: datumNL(new Date()) });
    }
    // 👣 Stap voor stap: toon de volgende stap met wat er gaat gebeuren en wacht op ▶ / ◀.
    let STAP_RES = null;
    function stapPauze(st, si, step, ronde) {
        const balk = $('#stap-balk'); if (!balk) return Promise.resolve('doe');
        $all('.stprow.nu').forEach(r => r.classList.remove('nu'));
        const rij = $('.stprow[data-sleep="' + si + '"]'); if (rij) { rij.classList.add('nu'); try { rij.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
        try { if (!step.frame && stapMetElement(step)) { const el = targetEl(step); if (el) highlightEl(el); } } catch (e) {}
        const vb = stapVoorbeeld(step, si, ronde);
        balk.style.display = 'block';
        balk.innerHTML = '<div><b>👣 Ronde ' + ronde + ' · stap ' + (si + 1) + '/' + st.steps.length + '</b>: ' + esc(step.name || step.type) + (vb ? ' <span class="stvb" style="display:inline">' + esc(vb) + '</span>' : '') + '</div>' +
            '<div class="wt-row"><button class="wt-btn alt" data-sb="terug"' + (si ? '' : ' disabled') + '>◀ Vorige</button><button class="wt-btn primary" data-sb="doe">▶ Voer uit</button><button class="wt-btn alt" data-sb="auto">⏩ Rest automatisch</button><button class="wt-btn alt" data-sb="stop">■ Stop</button></div>';
        return new Promise(res => {
            const klaar = k => { STAP_RES = null; clearInterval(iv); doc.removeEventListener('keydown', pijl, true); balk.style.display = 'none'; balk.innerHTML = ''; res(k); };
            STAP_RES = klaar;
            balk.querySelectorAll('[data-sb]').forEach(b => b.onclick = () => klaar(b.dataset.sb));
            const pijl = e => { const pad = e.composedPath ? e.composedPath() : [e.target]; if (pad.indexOf(window.__wtHost) >= 0 && pad[0] && pad[0].matches && pad[0].matches('input,textarea,select')) return; if (e.key === 'ArrowRight') { e.preventDefault(); klaar('doe'); } else if (e.key === 'ArrowLeft' && si) { e.preventDefault(); klaar('terug'); } };
            doc.addEventListener('keydown', pijl, true);
            const iv = setInterval(() => { if (stopReq) klaar('stop'); }, 300);
        });
    }
    // Tussen twee rondes: de flow is helemaal klaar; pas daarna begint ParseLab aan de volgende regel.
    async function tussenRondes(st, klaar0, totaal0) {
        const m = st.tussen || 'klaar', klaar = (st.passBasis || 0) + klaar0, totaal = (st.passBasis || 0) + totaal0;   // nummers zoals in je lijst
        if (m === 'klaar') { log('  Ronde ' + klaar + ' klaar — wachten tot de pagina klaar is…'); await sleep(400); await waitForIdle(15000); }
        else if (m === 'rustig') {
            // Rustig tempo voor grote lijsten: eerst tot de pagina klaar is, dan een pauze die per regel iets
            // verschilt (tussen 1× en 2× de ingestelde seconden), zodat een site niet elke paar seconden een verzoek krijgt.
            await sleep(400); await waitForIdle(15000);
            const ms = Math.round(st.tussenSec * 1000 * (1 + Math.random()));
            log('  Ronde ' + klaar + ' klaar — rustig tempo: ' + (ms / 1000).toFixed(1).replace('.', ',') + ' seconden pauze…');
            for (let t0 = Date.now(); Date.now() - t0 < ms && !stopReq; ) await sleep(200);
        }
        else if (m === 'sec') { log('  Ronde ' + klaar + ' klaar — ' + st.tussenSec + ' seconden wachten…'); for (let t0 = Date.now(); Date.now() - t0 < st.tussenSec * 1000 && !stopReq; ) await sleep(200); }
        else if (m === 'klik') {
            const balk = $('#stap-balk');
            if (balk) {
                balk.style.display = 'block';
                balk.innerHTML = '<div><b>Ronde ' + klaar + ' van ' + totaal + ' is klaar.</b> Kijk of alles goed is ingevuld.</div><div class="wt-row"><button class="wt-btn primary" data-tb="door">' + IC('play', 'ico-sm') + '<span>Volgende ronde (' + (klaar + 1) + '/' + totaal + ')</span></button><button class="wt-btn alt" data-tb="auto">' + IC('ff', 'ico-sm') + '<span>Rest automatisch</span></button><button class="wt-btn alt" data-tb="stop">' + IC('stop', 'ico-sm') + '<span>Stop</span></button></div>';
                const k = await new Promise(res => { balk.querySelectorAll('[data-tb]').forEach(b => b.onclick = () => res(b.dataset.tb)); const iv = setInterval(() => { if (stopReq) { clearInterval(iv); res('stop'); } }, 300); });
                balk.style.display = 'none'; balk.innerHTML = '';
                if (k === 'stop') { stopReq = true; return; }
                if (k === 'auto') { st.tussen = 'klaar'; log('  Rest automatisch.'); }
            }
        }
        if (st.delay) await sleep(st.delay);
        if (stopReq) return;
        // De volgende ronde begint op de pagina van stap 1 (bv. terug naar het zoekformulier).
        const s0 = st.steps.find(x => x.pageUrl && x.type !== 'nav');
        if (st.terugStart && !st.startUrl && s0 && kortUrl(s0.pageUrl) !== kortUrl()) {
            log('  Terug naar de pagina van stap 1 voor de volgende ronde: ' + kortUrl(s0.pageUrl));
            await saveRun(st);
            let u = null; try { u = new URL(s0.pageUrl); } catch (e) {}
            if (u && u.origin + u.pathname + u.search === location.origin + location.pathname + location.search) location.hash = u.hash; else location.href = s0.pageUrl;
            await sleep(1500); await waitForIdle(10000);
        }
    }
    let ZIP_RUN = null;
    function zipKnop() { const b = $('#flow-zipalles'); if (b) b.disabled = !ZIP_RUN; }
    async function downloadZip(opt) {
        opt = opt && opt.type ? {} : (opt || {});   // als klik-handler krijgt hij een event mee
        const b = $('#flow-zipalles'); if (!ZIP_RUN) return 0;
        const r = await kaderBericht({ type: 'pl-zip-get', run: ZIP_RUN });
        const lijst = (r && r.lijst) || [];
        if (!lijst.length) { if (!opt.auto) flash(b, 'geen bestanden'); return 0; }
        // Witte/lege screenshots herkennen: bijna geen verschil tussen de pixels.
        const isLeeg = data => new Promise(res => { const im = new Image(); im.onload = () => { try { const w = Math.min(im.width, 400), h = Math.max(1, Math.round(im.height * w / im.width)); const c = doc.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
                    const l0 = 0.3 * d[0] + 0.59 * d[1] + 0.11 * d[2]; let anders = 0, n = 0; for (let i = 0; i < d.length; i += 4) { n++; if (Math.abs(0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] - l0) > 24) anders++; }
                    res(anders / n < 0.0005); } catch (e) { res(false); } }; im.onerror = () => res(false); im.src = data; });
        let weg = 0;
        if ($('#zip-wit') && $('#zip-wit').checked) {
            const hou = [];
            for (const x of lijst) { if (/^data:image\//.test(x.data) && await isLeeg(x.data)) { weg++; continue; } hou.push(x); }
            lijst.length = 0; hou.forEach(x => lijst.push(x));
        }
        if (!lijst.length) { if (!opt.auto) flash(b, 'alleen lege afbeeldingen'); return 0; }
        const gezien = {};
        const files = lijst.map(x => {
            let naam = String(x.pad || 'bestand').replace(/^\/+/, '');
            if (gezien[naam]) { const n = ++gezien[naam]; naam = naam.replace(/(\.[a-z0-9]+)$/i, ' (' + n + ')$1'); } else gezien[naam] = 1;
            const b64 = String(x.data).split(',')[1] || ''; const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            return { name: naam, bytes: u8 };
        });
        const nu = new Date(), z = n => String(n).padStart(2, '0'), stempel = nu.getFullYear() + '-' + z(nu.getMonth() + 1) + '-' + z(nu.getDate()) + ' ' + z(nu.getHours()) + z(nu.getMinutes());
        const flowNaam = (typeof CLOUD !== 'undefined' && CLOUD && CLOUD.naam ? CLOUD.naam : 'bestanden').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60);
        downloadBytes(zipStore(files), 'parselab ' + flowNaam + (opt.soort ? ' ' + opt.soort : '') + ' ' + stempel + '.zip', 'application/zip');
        flash(b, '✔ ' + files.length + ' bestanden' + (weg ? ' (' + weg + ' leeg weggelaten)' : ''));
        return files.length;
    }
    $('#flow-zipalles').onclick = downloadZip;
    (function () { const c = $('#pdf-eerste'); try { chrome.storage.local.get('pl-pdf-eerste', r => { c.checked = !!(r && r['pl-pdf-eerste']); }); } catch (e) {} c.onchange = () => { try { chrome.storage.local.set({ 'pl-pdf-eerste': c.checked }); } catch (e) {} }; })();
    function bronUitleg() { const u = $('#bron-uitleg'); if (!u) return; u.textContent = bronModus() === 'wachtrij' ? 'pakt bij Start het volgende werk op (Flows → Wachtrij)' : ''; }
    $('#flow-bron').addEventListener('change', () => { bronUitleg(); persist(); });
    function bewaarBereik() { try { chrome.storage.local.set({ ['pl-bereik-' + location.hostname]: { m: $('#flow-bereik').value, van: $('#flow-van').value, tot: $('#flow-tot').value } }); } catch (e) {} }
    ['flow-bereik', 'flow-van', 'flow-tot'].forEach(id => { const e = $('#' + id); e.addEventListener(id === 'flow-bereik' ? 'change' : 'input', () => { if (id === 'flow-bereik' && e.value === 'vantot' && !$('#flow-tot').value) { const N = rondeRijen().length; if (N) $('#flow-tot').value = N; } bewaarBereik(); setStartLabel(); }); });
    try { chrome.storage.local.get('pl-bereik-' + location.hostname, r => { const b = r && r['pl-bereik-' + location.hostname]; if (b) { $('#flow-bereik').value = b.m || 'alles'; $('#flow-van').value = b.van || 1; $('#flow-tot').value = b.tot || ''; } setStartLabel(); }); } catch (e) {}
    $('#flow-startUrl').addEventListener('input', () => persist());
    $('#flow-startUrl-hier').onclick = () => { $('#flow-startUrl').value = location.href; persist(); flash($('#flow-startUrl-hier'), '✔'); };
    ['zip-eerste', 'zip-wit'].forEach(id => { const c = $('#' + id); try { chrome.storage.local.get('pl-' + id, r => { if (r && r['pl-' + id] === false) c.checked = false; }); } catch (e) {} c.onchange = () => { try { chrome.storage.local.set({ ['pl-' + id]: c.checked }); } catch (e) {} }; });
    try { chrome.storage.local.get('pl-zip-run', r => { if (r && r['pl-zip-run']) { ZIP_RUN = r['pl-zip-run']; zipKnop(); } }); } catch (e) {}
    async function runFromState(st) {
        if (RUNNING) return;
        st.runId = st.runId || 'run_' + Date.now().toString(36); st.log = st.log || [];
        if (OPNAME) opnameStop(true); RUNNING = true; stopReq = false; pauseReq = false;
        renderCoach();
        const runBtn = $('#flow-run'); runBtn.innerHTML = IC('play') + ' ' + esc(t('busy')); runBtn.disabled = true; $('#flow-stop').disabled = false; if ($('#flow-pause')) $('#flow-pause').disabled = false;
        $('#flow-log').scrollIntoView({ block: 'nearest' });
        const rows = st.rows.length ? st.rows : [null];
        const repeat = Math.max(1, st.repeat || 1);
        const total = rows.length * repeat;
        const baseFolder = sanitizeFolder(st.folder) || 'ParseLab';
        st.errRows = st.errRows || {};
        const groupCol = st.groupCol;
        RUN_ST = st; runBase = baseFolder;
        let vorigeUrl = location.href;
        // ZIP kan al tijdens de run: alles wat tot nu toe is opgeslagen.
        if (st.steps.some(x => x.type === 'print' || x.type === 'shot')) { ZIP_RUN = st.runId; try { chrome.storage.local.set({ 'pl-zip-run': ZIP_RUN }); } catch (e) {} zipKnop(); }
        st.overgeslagen = st.overgeslagen || [];

        while (st.running && !stopReq && !pauseReq) {
            let { rp, ri, si } = st.cursor;
            if (rp >= repeat) break;
            // Downloadmap per rij: basismap + submap op de unieke kolomwaarde (bv. relatienummer).
            const curRow = rows[ri];
            const gbron = groupCol ? (curRow && curRow[groupCol] != null ? curRow[groupCol] : (st.out && st.out[groupCol])) : null;
            const gval = gbron != null && typeof gbron !== 'object' ? String(gbron).trim() : '';
            currentFolder = gval ? baseFolder + '/' + sanitizeFolder(gval) : baseFolder;
            if (ri >= rows.length) { st.cursor = { rp: rp + 1, ri: 0, si: 0 }; st.out = {}; await saveRun(st); continue; }
            if (si >= st.steps.length) {
                if (groupCol && curRow && curRow[groupCol] != null && st.out[groupCol] == null) st.out[groupCol] = curRow[groupCol];
                if (st.wachtrij) await wqMeld(st, curRow, 'klaar', Object.assign({}, st.out));
                if (Object.keys(st.out).length) { const o = st.out; o._pass = (st.passBasis || 0) + rp * rows.length + ri + 1; st.results.push(o); }
                st.out = {}; st.cursor = { rp, ri: ri + 1, si: 0 }; await saveRun(st);
                renderProgress(st);
                const donePass = rp * rows.length + ri + 1;
                if (donePass < total) await tussenRondes(st, donePass, total);
                continue;
            }
            // Begin van een ronde: naar de startpagina en wachten tot die écht geladen is.
            if (si === 0 && st.startUrl && !stopReq && !(st.steps[0] && st.steps[0].type === 'nav' && st.steps[0].mode === 'url')) {
                const sl = rp + '_' + ri;
                if (!zelfdeUrl(st.startUrl, location.href) && st.startNav !== sl) {
                    st.startNav = sl; await saveRun(st);
                    log('  ↩ Naar de startpagina: ' + kortUrl(st.startUrl));
                    location.href = st.startUrl;
                    // Bij een echte paginawissel stopt dit script hier en hervat de ronde op de nieuwe pagina.
                    for (let k = 0; k < 60 && !zelfdeUrl(st.startUrl, location.href) && !stopReq; k++) await sleep(500);
                } else if (!zelfdeUrl(st.startUrl, location.href) && st.startKlaar !== sl) log('  ⓘ De startpagina stuurt door naar ' + kortUrl() + ' — daar verder');
                if (st.startKlaar !== sl) { await wachtTotGeladen(st); st.startKlaar = sl; await saveRun(st); }
            }
            const step = st.steps[si];
            renderProgress(st);
            if (st.stapModus && !stopReq) {
                const keuze = await stapPauze(st, si, step, (st.passBasis || 0) + rp * rows.length + ri + 1);
                if (keuze === 'stop') { stopReq = true; continue; }
                if (keuze === 'terug') { st.cursor = { rp, ri, si: Math.max(0, si - 1) }; await saveRun(st); continue; }
                if (keuze === 'auto') { st.stapModus = false; log('  ⏩ Rest van de test automatisch.'); }
            }
            if (location.href !== vorigeUrl) { log('  📄 nieuwe pagina: ' + kortUrl()); vorigeUrl = location.href; }
            // In een lus: het huidige item opnieuw opzoeken als de pagina is ververst.
            LUS_ACTIEF = !!st.lus;
            if (st.lus && (!LUS_ITEM || !doc.contains(LUS_ITEM))) { const ls = st.steps[st.lus.si]; LUS_ITEM = ls && ls.spec ? (lusItemsIn(st, st.lus.si)[st.lus.i] || null) : null; }
            if (isLusStart(step) || step.type === 'endloop') {
                const nxt = await lusStap(st, si, step);
                st.cursor = { rp, ri, si: nxt }; await saveRun(st); renderRunStatus(st.cursor);
                continue;
            }
            // cursor NAAR de volgende stap en persist VÓÓR uitvoeren: een klik die de
            // pagina laadt hervat na herladen automatisch bij de volgende stap.
            st.cursor = { rp, ri, si: si + 1 };
            await saveRun(st);
            // "Alleen als dit er is": stap overslaan als het aangewezen element ontbreekt.
            if (step.onlyIf && !(await bestaat(step.onlyIf))) { log('  ↷ ' + (step.name || step.type) + ': overgeslagen (“' + (step.onlyIf.name || '…') + '” is er niet)'); renderRunStatus(st.cursor); continue; }
            // Logboek: elke stap een regel, met (bij acties op de pagina) een schermafbeelding met het element gemarkeerd.
            const logE = { i: si, label: step.name || step.type, actie: step.type, url: kortUrl(), start: Date.now(), status: 'ok' };
            st.log = st.log || [];
            if (stapMetElement(step)) {
                let el = await vindStapElement(step, 3500);
                if (!el && AI_VOLG) {
                    const h = await herstel(step);
                    if (h && h.info) logE.healing = h.info;
                    if (h && h.el) { el = h.el; logE.status = 'healed'; pasStapAan(step, h.el); }
                }
                if (st.logShots) logE.shot = await maakShot(st, si, el, (si + 1) + ' · ' + logE.label);
            } else if (st.logShots && (step.frame || /^(print|scrape|nav)$/.test(step.type))) logE.shot = await maakShot(st, si, null, (si + 1) + ' · ' + logE.label);
            const times = Math.max(1, +step.rep || 1);
            const retries = Math.max(0, +$('#flow-retries').value || 0);
            const onErr = $('#flow-onerror') ? $('#flow-onerror').value : 'skip';
            let ctrl = null, naarUrl = false, rondeWeg = false;
            for (let k = 0; k < times && !stopReq; k++) {
                let attempt = 0, ok = false;
                while (attempt <= retries && !ok && !stopReq) {
                    try {
                        const r = await performStep(step, rows[ri], rondeCtx(st, (st.passBasis || 0) + rp * rows.length + ri + 1));
                        if (r && r.key != null) { st.out[r.key] = r.val; if (step.type === 'scrape') logE.extracted = { [r.key]: Array.isArray(r.val) ? r.val.length + ' items' : String(r.val == null ? '' : r.val).slice(0, 80) }; }
                        if (r && r.merge) logE.extracted = { velden: Object.keys(r.merge).length };
                        if (r && r.merge) { if (step.kind === 'pagina') Object.keys(r.merge).forEach(k => { if (!(k in st.out)) st.out[k] = r.merge[k]; }); else Object.assign(st.out, r.merge); }
                        if (r && r.stop) ctrl = { stop: true };
                        if (r && r.skip) ctrl = { skip: r.skip };
                        ok = !(r && r.ok === false);
                    } catch (err) { log('  ⚠ ' + (step.name || step.type) + ': ' + err.message); ok = false; }
                    if (!ok && attempt < retries) { log('     ↻ opnieuw (' + (attempt + 1) + '/' + retries + ')'); await sleep(600); }
                    attempt++;
                }
                // Werkt de match niet? Eén keer terug naar het adres waar dit stuk flow begint en opnieuw.
                if (!ok && step.pageUrl && step.kind !== 'extern' && !stopReq && $('#flow-urlherstel') && $('#flow-urlherstel').checked) {
                    st.hersteld = st.hersteld || {}; const sl = rp + '_' + ri + '_' + si;
                    if (!st.hersteld[sl]) {
                        st.hersteld[sl] = 1; const k0 = paginaBegin(st.steps, si), url = st.steps[k0].pageUrl || step.pageUrl;
                        log('  ↪ Lukt niet. Terug naar het adres van stap ' + (k0 + 1) + ' (' + kortUrl(url) + ') en opnieuw vanaf daar…');
                        logE.status = 'retry'; logE.healing = { method: 'terug naar adres', confidence: 1, reden: kortUrl(url) + ', opnieuw vanaf stap ' + (k0 + 1) };
                        st.cursor = { rp, ri, si: k0 }; logE.ms = Date.now() - logE.start; logE.regel = ri + 1; st.log.push(logE); await saveRun(st);
                        if (location.href === url) location.reload(); else location.href = url;
                        await sleep(1500); await waitForIdle(8000);
                        naarUrl = true; break;
                    }
                }
                if (!ok) { logE.status = 'failed'; logE.err = LAATSTE_MELDING; if (st.logShots) logE.shotFout = await maakShot(st, si + '_fout', null, 'Fout bij stap ' + (si + 1)); }
                if (!ok) { st.errRows[rp * rows.length + ri] = true; if (onErr === 'stop') { log('  ■ Gestopt door fout in “' + (step.name || step.type) + '”.'); ctrl = { stop: true }; } else rondeWeg = true; break; }
            }
            if (naarUrl) { renderRunlog(st.log); continue; }
            // Vastgelopen: de rest van deze ronde NIET doen. Terug naar stap 1 en door met de volgende ronde.
            if (rondeWeg) {
                const pass = (st.passBasis || 0) + rp * rows.length + ri + 1, rij = rows[ri];
                const wrd = rij ? String(rij._groep || Object.keys(rij).filter(k => k[0] !== '_').map(k => rij[k]).find(v => v != null && typeof v !== 'object' && String(v).trim() !== '') || '').trim() : '';
                const wat = 'stap ' + (si + 1) + ' “' + (step.name || step.type) + '”';
                st.overgeslagen.push({ ronde: pass, waarde: wrd, stap: si + 1, naam: step.name || step.type });
                log('  ⏭ Ronde ' + pass + (wrd ? ' (' + wrd + ')' : '') + ' overgeslagen: vastgelopen bij ' + wat + '. De rest van deze ronde is niet gedaan.');
                if (groupCol && rij && rij[groupCol] != null && st.out[groupCol] == null) st.out[groupCol] = rij[groupCol];
                const o = Object.assign({}, st.out, { Fout: 'overgeslagen bij ' + wat }); o._pass = pass; st.results.push(o);
                if (st.wachtrij) await wqMeld(st, rij, 'fout', Object.assign({}, st.out), 'vastgelopen bij ' + wat);
                logE.ms = Date.now() - logE.start; logE.regel = ri + 1; st.log.push(logE); if (st.log.length > 400) st.log.shift(); renderRunlog(st.log);
                st.out = {}; st.lus = null; LUS_ITEM = null; LUS_ACTIEF = false;
                st.cursor = { rp, ri: ri + 1, si: 0 }; await saveRun(st); renderProgress(st);
                // Vastgelopen: meteen een tussenstand-ZIP, voor het geval de rest ook misgaat (hoogstens elke 3 minuten).
                if (st.steps.some(x => x.type === 'print' || x.type === 'shot') && Date.now() - (st.laatsteTussenZip || 0) > 180000) {
                    st.laatsteTussenZip = Date.now(); await saveRun(st);
                    try { const mapNu = currentFolder; currentFolder = baseFolder; const n = await downloadZip({ auto: true, soort: 'tussenstand' }); currentFolder = mapNu; if (n) log('  ⬇ Tussenstand-ZIP gedownload (' + n + ' bestanden tot nu toe).'); } catch (e) {}
                }
                if (pass < (st.passBasis || 0) + total && !st.startUrl) {
                    const s0 = st.steps.find(x => x.pageUrl && x.type !== 'nav');
                    if (s0 && kortUrl(s0.pageUrl) !== kortUrl()) {
                        log('  ↩ Terug naar stap 1: ' + kortUrl(s0.pageUrl));
                        let u = null; try { u = new URL(s0.pageUrl); } catch (e) {}
                        if (u && u.origin + u.pathname + u.search === location.origin + location.pathname + location.search) location.hash = u.hash; else location.href = s0.pageUrl;
                        await sleep(1500); await waitForIdle(10000);
                    } else log('  ↩ Terug naar stap 1');
                }
                continue;
            }
            logE.ms = Date.now() - logE.start; logE.regel = ri + 1; st.log.push(logE); if (st.log.length > 400) st.log.shift();
            renderRunlog(st.log); await saveRun(st);
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
        RUN_ST = null; LUS_ITEM = null; LUS_ACTIEF = false;
        RUNNING = false; runBtn.disabled = false; setStartLabel(); renderCoach();
        { const ph = $('#wt-phases'); if (ph && !stopReq) ph.innerHTML = ['① Aanwijzen', '② Start', '③ Resultaat'].map((x, k) => '<span class="ph' + (k === 2 ? ' on' : ' done') + '">' + x + '</span>').join(''); } $('#flow-stop').disabled = true; if ($('#flow-pause')) $('#flow-pause').disabled = true;
        results = st.results; try { renderLijst(); } catch (e) {}
        setResult(st.results.length === 1 ? st.results[0] : st.results);
        const doneN = Math.min(total, st.cursor.rp * rows.length + st.cursor.ri + (st.cursor.si >= st.steps.length ? 1 : 0));
        const errN = Object.keys(st.errRows || {}).length;
        const hasRows = st.rows.length && st.rows[0] !== null && !st.rows[0]._groep;
        const unit = hasRows ? (doneN === 1 ? 'regel' : 'regels') : (doneN === 1 ? 'ronde' : 'rondes');
        const ov = st.overgeslagen || [];
        const ovTekst = ov.length ? ov.length + ' overgeslagen: ' + ov.map(x => 'ronde ' + x.ronde + (x.waarde ? ' (' + x.waarde + ')' : '') + ' bij stap ' + x.stap + ' “' + x.naam + '”').join('; ') : '';
        if (stopReq) { renderProgress(null); log('■ Gestopt — ' + doneN + ' ' + unit + ' gedaan, ' + errN + ' om na te kijken.'); if (ovTekst) log('⏭ ' + ovTekst); }
        else {
            const box = $('#flow-progress');
            box.style.display = 'block';
            box.innerHTML = '<div class="prog-txt"><b>' + total + ' ' + unit + ' gedaan</b>, ' + errN + ' om na te kijken' + (errN ? ' — zie hieronder welke regels' : ' ✓') + '</div><div class="prog-bar"><span style="width:100%"></span></div>' + (ov.length ? '<div class="hint">' + esc(ovTekst) + '</div>' : '');
            $all('.ststat').forEach(el => { el.textContent = '✓'; el.className = 'ststat done'; });
            log('✓ ' + total + ' ' + unit + ' gedaan, ' + errN + ' om na te kijken.' + (errN ? ' Regels: ' + Object.keys(st.errRows).map(k => (st.passBasis || 0) + (+k % rows.length) + 1).join(', ') + '.' : '') + (results.length ? ' Klik “' + t('dl_result') + '” voor je Excel-bestand.' : ''));
            if (ovTekst) log('⏭ ' + ovTekst);
        }
        // In porties werken: na deze batch staat de volgende klaar (vanaf de eerste regel die nog niet is gedaan).
        if (st.bereikAan && $('#flow-bereik')) {
            const volgende = (st.passBasis || 0) + doneN + 1, N = st.totaal || 0, grootte = Math.max(1, (st.bereikTot || 0) - (st.passBasis || 0));
            if (volgende <= N) {
                $('#flow-bereik').value = 'vantot'; $('#flow-van').value = volgende; $('#flow-tot').value = Math.min(N, volgende + grootte - 1);
                bewaarBereik(); setStartLabel();
                log('▶ Volgende portie klaargezet: regel ' + volgende + '–' + Math.min(N, volgende + grootte - 1) + ' van ' + N + '. Klik Start om verder te gaan.');
            } else log('✓ Alle ' + N + ' regels van de lijst zijn gedaan.');
        }
        // Wachtrij: wat niet af is, gaat terug (status 'nieuw'); de lokale lijst weer terug in beeld.
        if (st.wachtrij) {
            const gemeld = new Set(st.wqGemeld || []), terug = [];
            (st.rows || []).forEach(r => wqIds(r).forEach(id => { if (!gemeld.has(id)) terug.push(id); }));
            if (terug.length) { await db('wq-meld', { ids: terug, status: 'nieuw' }); log('  ↩ ' + terug.length + ' regel(s) terug in de wachtrij (niet afgemaakt).'); }
            try { flowRows = await loadRows(); showCsvInfo(); } catch (e) {}
        }
        if (st.runDb) { try { await db('run-einde', { id: st.runDb, status: stopReq ? 'gestopt' : (errN || ov.length) ? 'fouten' : 'klaar', regels: doneN, fouten: errN, overgeslagen: ov.length ? ov : null }); } catch (e) {} }
        if (st.planId) autoKlaar(st.planId, stopReq ? 'gestopt' : (errN || ov.length) ? doneN + ' gedaan, ' + (errN || ov.length) + ' fout' : doneN + ' gedaan');
        writeLog({ host: st.host || location.hostname, start: st.startedAt || Date.now(), einde: Date.now(), regels: doneN, fouten: errN, bron: 'paneel' });
        if (st.steps.some(x => x.type === 'print' || x.type === 'shot')) { ZIP_RUN = st.runId; try { chrome.storage.local.set({ 'pl-zip-run': ZIP_RUN }); } catch (e) {} zipKnop(); }
        // ZIP altijd automatisch aan het eind (klaar, gestopt of vastgelopen): zo gaat er nooit iets verloren.
        if (st.steps.some(x => x.type === 'print' || x.type === 'shot')) { try { currentFolder = baseFolder; const n = await downloadZip({ auto: true, soort: stopReq ? 'gestopt' : (st.overgeslagen || []).length ? 'met overgeslagen' : '' }); if (n) log('⬇ ZIP met ' + n + ' bestanden automatisch gedownload.'); } catch (e) {} }
        bewaarRunlog(st, stopReq ? 'stopped' : errN ? 'failed' : (st.log || []).some(x => x.status === 'healed') ? 'healed' : 'success');
        currentFolder = sanitizeFolder($('#flow-folder').value) || 'ParseLab';   // bestanden weer naar de basismap
        clearRun();
        $all('.stprow.nu').forEach(r => r.classList.remove('nu'));
        const totaalR = st.totaal || flowRows.length;
        if (!stopReq && st.testN && totaalR > (st.passBasis || 0) + st.testN) {
            const rest = totaalR - (st.passBasis || 0) - st.testN, vorige = st.results.slice();
            askInline({ title: (errN ? '⚠ Test klaar: ' : '✔ Test gelukt: ') + st.testN + ' ronde(s), ' + errN + ' om na te kijken',
                html: '<div>' + (errN ? 'Kijk eerst in het logboek wat er misging. ' : 'Alles liep goed. ') + 'Wil je de overige <b>' + rest + ' rondes</b> automatisch laten uitvoeren?</div>',
                buttons: [{ label: '▶ Rest automatisch (' + rest + ')', primary: !errN, fn: () => startFlow(0, { modus: 'alles', rijVan: (st.passBasis || 0) + st.testN, vorige }) },
                    { label: '↻ Test opnieuw', fn: () => startFlow(0, { modus: st.modus }) }, { label: 'Nog niet' }] });
        }
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

    // ---- Cloud: flows met naam en map, automatisch bewaard in Supabase (via de achtergrond) ----
    // Elke flow met stappen staat in de cloud; elke wijziging wordt vanzelf opgeslagen (met versies).
    // De lijst (klantgegevens) gaat alleen mee als je dat per flow aanzet.
    const CLOUD_KEY = 'pl-cloud-' + location.hostname;
    let CLOUD = null, CLOUD_LAATST = '', CLOUD_TIMER = null, CLOUD_BEZIG = false, CLOUD_LADEN = false, CLOUD_OPNIEUW = null, CLOUD_DATA = { flows: [], mappen: [] };
    const CL_OPEN = new Set(), db = (op, x) => kaderBericht(Object.assign({ type: 'pl-db', op }, x || {}));
    const INST = [['flow-aantal-modus', 'change'], ['flow-aantal', 'input'], ['flow-tussen', 'change'], ['flow-tussen-sec', 'input'], ['flow-terugstart', 'change'], ['flow-rondekol', 'change'],
        ['flow-opslag', 'change'], ['flow-opslag-kol', 'change'], ['flow-pdfnaam', 'input'], ['pdf-eerste', 'change'], ['zip-eerste', 'change'], ['zip-wit', 'change'],
        ['flow-bereik', 'change'], ['flow-van', 'input'], ['flow-tot', 'input'], ['flow-urlherstel', 'change'], ['log-shots', 'change'], ['flow-bron', 'change']];
    function leesInst() { const o = {}; INST.forEach(([id]) => { const e = $('#' + id); if (!e) return; o[id] = e.type === 'checkbox' ? e.checked : (e.value || e.dataset.pending || ''); }); return o; }
    function zetInst(o) {
        if (!o) return;
        INST.forEach(([id, ev]) => { const e = $('#' + id); if (!e || !(id in o)) return; if (e.type === 'checkbox') e.checked = !!o[id]; else { e.dataset.pending = o[id]; e.value = o[id]; } try { e.dispatchEvent(new Event(ev, { bubbles: true })); } catch (x) {} });
    }
    function volledigeStaat() {
        const d = serialise(); d.inst = leesInst(); d.meeLijst = !!(CLOUD && CLOUD.meeLijst);
        if (d.meeLijst && flowRows.length) d.lijst = flowRows;
        return d;
    }
    function zetVolledigeStaat(d) {
        CLOUD_LADEN = true;
        try {
            if (d.meeLijst && Array.isArray(d.lijst)) { flowRows = d.lijst; saveRows(); }
            applyState(d); showCsvInfo();
            try { vulRondekol(); if (OPSLAG_KOLOMMEN) OPSLAG_KOLOMMEN(); } catch (e) {}
            zetInst(d.inst);
            setStartLabel();
        } finally { CLOUD_LADEN = false; }
    }
    const tijdKort = t => { try { const d = new Date(t), z = n => String(n).padStart(2, '0'); return z(d.getDate()) + '-' + z(d.getMonth() + 1) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); } catch (e) { return ''; } };
    function clStatus(t, soort) { const e = $('#cl-stat'); if (!e) return; e.textContent = t; e.className = 'cl-stat' + (soort ? ' ' + soort : ''); }
    function clKop() {
        const t = $('#cl-titel'), p = $('#cl-pad'); if (!t) return;
        t.textContent = CLOUD ? CLOUD.naam : (steps.length ? 'Naamloos' : 'Nieuwe flow');
        p.textContent = CLOUD && CLOUD.map ? CLOUD.map.split('/').join(' / ') + ' / ' : '';
    }
    function clBewaarHuidig() { try { chrome.storage.local.set({ [CLOUD_KEY]: CLOUD }); } catch (e) {} clKop(); }
    // Na elke wijziging (kort uitgesteld) opslaan.
    function cloudPlan() { if (CLOUD_LADEN || !IS_EXT) return; clearTimeout(CLOUD_TIMER); CLOUD_TIMER = setTimeout(() => cloudBewaar(), 1500); }
    async function cloudBewaar(direct) {
        clearTimeout(CLOUD_TIMER);
        if (!IS_EXT || CLOUD_LADEN) return true;
        if (CLOUD_BEZIG) { if (!direct) CLOUD_TIMER = setTimeout(() => cloudBewaar(), 800); else for (let i = 0; i < 40 && CLOUD_BEZIG; i++) await sleep(150); if (!direct) return true; }
        if (!steps.length && !CLOUD) { clStatus(''); return true; }   // lege, nog niet bewaarde flow: niets te doen
        const data = volledigeStaat(), json = JSON.stringify(data);
        if (CLOUD && CLOUD.id && json === CLOUD_LAATST) return true;
        CLOUD_BEZIG = true; clStatus('opslaan…');
        try {
            const naam = CLOUD ? CLOUD.naam : 'Naamloos ' + tijdKort(Date.now()), map = CLOUD ? CLOUD.map || '' : '';
            let r = await db('bewaar', { id: CLOUD && CLOUD.id, naam, map, host: location.hostname, data });
            if (r && !r.ok && r.err === 'bestaat-al' && !(CLOUD && CLOUD.id)) r = await db('bewaar', { naam: naam + ' (' + Math.random().toString(36).slice(2, 5) + ')', map, host: location.hostname, data });
            if (!r || !r.ok || !r.flow) {
                clStatus(r && r.offline ? 'offline · lokaal bewaard' : 'niet opgeslagen' + (r && r.err ? ': ' + r.err : ''), 'bad');
                clearTimeout(CLOUD_OPNIEUW); CLOUD_OPNIEUW = setTimeout(() => cloudBewaar(), 30000);
                return false;
            }
            const meeLijst = !!(CLOUD && CLOUD.meeLijst);
            CLOUD = { id: r.flow.id, naam: r.flow.naam, map: r.flow.map || '', meeLijst }; CLOUD_LAATST = json; clBewaarHuidig();
            clStatus('opgeslagen ' + tijdKort(r.flow.bijgewerkt || Date.now()).slice(6), 'ok');
            if (r.nieuw) { log('☁ Flow bewaard in de cloud als “' + CLOUD.naam + '”. Klik op de naam om hem een eigen naam en map te geven.', true); if ($('#cl-paneel').style.display !== 'none' && CL_TAB === 'flows') clLijst(); }
            return true;
        } finally { CLOUD_BEZIG = false; }
    }
    // Instellingen die niet via persist() lopen: ook dan opslaan.
    root.addEventListener('change', e => { const id = e.target && e.target.id; if (id && INST.some(x => x[0] === id)) cloudPlan(); }, true);
    root.addEventListener('input', e => { const id = e.target && e.target.id; if (id && INST.some(x => x[0] === id && x[1] === 'input')) cloudPlan(); }, true);

    async function cloudLaad(id, naam) {
        if (RUNNING) { log('⚠ Eerst stoppen, dan een andere flow laden.', true); return; }
        await cloudBewaar(true);                       // de huidige flow eerst veilig opslaan
        clStatus('laden…');
        const r = await db('laad', { id });
        if (!r || !r.ok) { clStatus('laden mislukt' + (r && r.err ? ': ' + r.err : ''), 'bad'); return; }
        const f = r.flow, d = f.data || {};
        CLOUD = { id: f.id, naam: f.naam, map: f.map || '', meeLijst: !!d.meeLijst };
        zetVolledigeStaat(d);
        CLOUD_LAATST = JSON.stringify(volledigeStaat());
        clBewaarHuidig(); persistNow();
        clStatus('geladen', 'ok');
        log('☁ Flow “' + f.naam + '” geladen (' + (d.steps || []).length + ' stappen' + (d.meeLijst && d.lijst ? ', met lijst van ' + d.lijst.length + ' regels' : '') + ').', true);
        $('#cl-paneel').style.display = 'none';
    }
    async function cloudNieuw() {
        if (RUNNING) return;
        await cloudBewaar(true);
        CLOUD = null; CLOUD_LAATST = ''; clBewaarHuidig();
        steps = []; if ($('#flow-startUrl')) $('#flow-startUrl').value = '';
        renderSteps(); renderFlow(); persistNow(); clStatus('');
        log('＋ Nieuwe, lege flow. Hij wordt vanzelf bewaard zodra er een stap in staat.', true);
    }

    // Overzicht: mappen (inklapbaar, ook genest) met de flows erin.
    async function clLijst(melding) {
        const inh = clTabs('flows');
        if (!inh.querySelector('.cl-lijst')) inh.innerHTML = '<div class="cl-kop"><input id="cl-zoek" class="wt-num" placeholder="Zoek een flow…"><button class="wt-btn alt mini" id="cl-map-nieuw" title="Nieuwe map">' + IC('folder', 'ico-sm') + '<span>+ Map</span></button></div><div class="cl-melding" id="cl-melding"></div><div class="cl-lijst"><div class="hint">laden…</div></div>';
        $('#cl-zoek').oninput = () => clTeken();
        $('#cl-map-nieuw').onclick = () => clMapNieuw('');
        $('#cl-melding').textContent = melding || '';
        const r = await db('lijst');
        if (!r || !r.ok) { box.querySelector('.cl-lijst').innerHTML = '<div class="hint">' + esc(r && r.offline ? 'Geen verbinding met de cloud.' : 'Kon de flows niet ophalen' + (r && r.err ? ': ' + r.err : '') + '.') + '</div>'; return; }
        CLOUD_DATA = { flows: r.flows || [], mappen: r.mappen || [] };
        if (CLOUD && CLOUD.map) { const d = CLOUD.map.split('/'); d.forEach((_, i) => CL_OPEN.add(d.slice(0, i + 1).join('/'))); }
        clTeken();
    }
    function clTeken() {
        const box = $('#cl-paneel .cl-lijst'); if (!box) return;
        const zoek = String(($('#cl-zoek') && $('#cl-zoek').value) || '').trim().toLowerCase();
        const flows = CLOUD_DATA.flows.filter(f => !zoek || (f.naam + ' ' + (f.map || '') + ' ' + (f.host || '')).toLowerCase().includes(zoek));
        const alle = new Set(CLOUD_DATA.mappen); CLOUD_DATA.flows.forEach(f => { if (f.map) { const d = f.map.split('/'); d.forEach((_, i) => alle.add(d.slice(0, i + 1).join('/'))); } });
        const kinderen = p => [...alle].filter(x => (p ? x.indexOf(p + '/') === 0 : true) && x.slice(p ? p.length + 1 : 0).split('/').length === 1 && x !== p).sort((a, b) => a.localeCompare(b, 'nl'));
        const telIn = p => flows.filter(f => (f.map || '') === p || (f.map || '').indexOf(p + '/') === 0).length;
        const rijFlow = (f, diepte) => '<div class="cl-rij cl-flow' + (CLOUD && CLOUD.id === f.id ? ' huidig' : '') + '" style="padding-left:' + (8 + diepte * 16) + 'px" data-id="' + esc(f.id) + '">' + IC('doc', 'ico-sm') +
            '<span class="cl-n"><b>' + esc(f.naam) + '</b><small>' + (f.aantal_stappen || 0) + ' stappen' + (f.host ? ' · ' + esc(f.host) : '') + ' · ' + esc(tijdKort(f.bijgewerkt)) + '</small></span>' +
            '<span class="cl-acties"><button class="mini" data-cl="wijzig" title="Naam / map wijzigen">' + IC('edit', 'ico-sm') + '</button><button class="mini" data-cl="versies" title="Vorige versies">' + IC('clock', 'ico-sm') + '</button><button class="mini" data-cl="weg" title="Verwijderen">' + IC('trash', 'ico-sm') + '</button></span></div>';
        const rijMap = (p, diepte) => {
            const open = CL_OPEN.has(p) || !!zoek, n = telIn(p), naam = p.split('/').pop();
            if (zoek && !n) return '';
            return '<div class="cl-rij cl-map" style="padding-left:' + (4 + diepte * 16) + 'px" data-pad="' + esc(p) + '">' + IC(open ? 'chevron-down' : 'chevron-right', 'ico-sm') + IC('folder', 'ico-sm') +
                '<span class="cl-n"><b>' + esc(naam) + '</b><small>' + n + '</small></span>' +
                '<span class="cl-acties"><button class="mini" data-cl="map-sub" title="Map hierin">' + IC('plus', 'ico-sm') + '</button><button class="mini" data-cl="map-wijzig" title="Map hernoemen">' + IC('edit', 'ico-sm') + '</button><button class="mini" data-cl="map-weg" title="Lege map verwijderen">' + IC('trash', 'ico-sm') + '</button></span></div>' +
                (open ? kinderen(p).map(k => rijMap(k, diepte + 1)).join('') + flows.filter(f => (f.map || '') === p).map(f => rijFlow(f, diepte + 1)).join('') : '');
        };
        const html = kinderen('').map(p => rijMap(p, 0)).join('') + flows.filter(f => !f.map).map(f => rijFlow(f, 0)).join('');
        box.innerHTML = html || '<div class="hint">' + (zoek ? 'Niets gevonden.' : 'Nog geen flows. Zodra je flow een stap heeft, wordt hij hier vanzelf bewaard.') + '</div>';
        box.querySelectorAll('.cl-map').forEach(r => r.onclick = e => { if (e.target.closest('[data-cl]')) return; const p = r.dataset.pad; CL_OPEN.has(p) ? CL_OPEN.delete(p) : CL_OPEN.add(p); clTeken(); });
        box.querySelectorAll('.cl-flow').forEach(r => r.onclick = e => { if (e.target.closest('[data-cl]')) return; cloudLaad(r.dataset.id); });
        box.querySelectorAll('[data-cl]').forEach(b => b.onclick = e => {
            e.stopPropagation(); const rij = b.closest('.cl-rij'), wat = b.dataset.cl;
            const f = rij.dataset.id ? CLOUD_DATA.flows.find(x => x.id === rij.dataset.id) : null, p = rij.dataset.pad;
            if (wat === 'wijzig') clNaamMap(f);
            else if (wat === 'versies') clVersies(f);
            else if (wat === 'weg') clWeg(f, rij);
            else if (wat === 'map-sub') clMapNieuw(p);
            else if (wat === 'map-wijzig') clMapHernoem(p);
            else if (wat === 'map-weg') clMapWeg(p);
        });
    }
    // Kleine invoer onder de kop van het overzicht (geen pop-ups).
    function clVorm(html, knoppen) {
        const m = $('#cl-melding'); m.innerHTML = '<div class="cl-vorm">' + html + '<div class="wt-row">' + knoppen.map((k, i) => '<button class="wt-btn ' + (i ? 'alt' : 'primary') + ' mini" data-k="' + i + '">' + esc(k.t) + '</button>').join('') + '</div></div>';
        m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => knoppen[+b.dataset.k].fn(m));
        const i = m.querySelector('input'); if (i) { i.focus(); i.select(); i.onkeydown = e => { if (e.key === 'Enter') knoppen[0].fn(m); if (e.key === 'Escape') m.innerHTML = ''; }; }
    }
    const mapOpties = (cur) => '<option value="">(hoofdmap)</option>' + [...new Set(CLOUD_DATA.mappen.concat(CLOUD_DATA.flows.map(f => f.map).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'nl')).map(p => '<option value="' + esc(p) + '"' + (p === cur ? ' selected' : '') + '>' + esc(p.split('/').join(' / ')) + '</option>').join('');
    async function clNaamMap(f) {
        if (!$('#cl-paneel .cl-lijst') || $('#cl-paneel').style.display === 'none' || CL_TAB !== 'flows') await clLijst();
        const huidig = !f || (CLOUD && f.id === CLOUD.id);
        const naam = f ? f.naam : (CLOUD ? CLOUD.naam : ''), map = f ? f.map || '' : (CLOUD ? CLOUD.map : '');
        clVorm('<label class="kol">Naam<input id="cl-v-naam" class="wt-num" value="' + esc(naam) + '" placeholder="bv. Polissen printen"></label>' +
            '<label class="kol">Map<select id="cl-v-map" class="wt-num">' + mapOpties(map) + '</select></label>' +
            '<label class="kol">of nieuwe map<input id="cl-v-mapnieuw" class="wt-num" placeholder="bv. Cockpit/Polissen"></label>' +
            (huidig ? '<label class="cl-vink"><input type="checkbox" id="cl-v-lijst"' + (CLOUD && CLOUD.meeLijst ? ' checked' : '') + '> lijst ook bewaren <small>(bevat klantgegevens)</small></label>' : ''),
            [{ t: 'Opslaan', fn: async m => {
                const nm = m.querySelector('#cl-v-naam').value.trim(); if (!nm) { m.querySelector('#cl-v-naam').focus(); return; }
                const mn = m.querySelector('#cl-v-mapnieuw').value.trim(), mp = mn ? mn.split('/').map(x => x.trim()).filter(Boolean).join('/') : m.querySelector('#cl-v-map').value;
                if (mn) await db('map-nieuw', { pad: mp });
                if (huidig) {
                    const mee = !!(m.querySelector('#cl-v-lijst') && m.querySelector('#cl-v-lijst').checked);
                    if (!steps.length && !CLOUD) { m.innerHTML = '<div class="hint">Voeg eerst een stap toe; daarna wordt de flow bewaard.</div>'; return; }
                    const oud = CLOUD; CLOUD = Object.assign({}, CLOUD || {}, { naam: nm, map: mp, meeLijst: mee }); CLOUD_LAATST = '';
                    const ok = await cloudBewaar(true);
                    if (!ok) { CLOUD = oud; clKop(); return; }
                } else {
                    const r = await db('wijzig', { id: f.id, naam: nm, map: mp });
                    if (!r || !r.ok) { m.querySelector('.cl-vorm').insertAdjacentHTML('afterbegin', '<div class="ask-fout">⚠ ' + esc(r && r.err === 'bestaat-al' ? 'Er staat al een flow met die naam in deze map.' : (r && r.err) || 'niet gelukt') + '</div>'); return; }
                    if (CLOUD && CLOUD.id === f.id) { CLOUD.naam = nm; CLOUD.map = mp; clBewaarHuidig(); }
                }
                if (mp) mp.split('/').forEach((_, i, a) => CL_OPEN.add(a.slice(0, i + 1).join('/')));
                const tekst = '✔ Opgeslagen als “' + nm + '”' + (mp ? ' in ' + mp.split('/').join(' / ') : '') + '.';
                m.innerHTML = ''; if (!f) { $('#cl-paneel').style.display = 'none'; log('☁ ' + tekst.slice(2), true); } else clLijst(tekst);
            } }, { t: 'Annuleren', fn: m => { m.innerHTML = ''; } }]);
    }
    function clMapNieuw(ouder) {
        clVorm('<label class="kol">Nieuwe map' + (ouder ? ' in ' + esc(ouder.split('/').join(' / ')) : '') + '<input id="cl-v-pad" class="wt-num" placeholder="naam van de map"></label>',
            [{ t: 'Maken', fn: async m => {
                const n = m.querySelector('#cl-v-pad').value.trim().replace(/\//g, '-'); if (!n) return;
                const pad = ouder ? ouder + '/' + n : n; const r = await db('map-nieuw', { pad });
                if (!r || !r.ok) { m.innerHTML = '<div class="ask-fout">⚠ ' + esc((r && r.err) || 'niet gelukt') + '</div>'; return; }
                pad.split('/').forEach((_, i, a) => CL_OPEN.add(a.slice(0, i + 1).join('/'))); m.innerHTML = ''; clLijst('✔ Map “' + n + '” gemaakt.');
            } }, { t: 'Annuleren', fn: m => { m.innerHTML = ''; } }]);
    }
    function clMapHernoem(p) {
        clVorm('<label class="kol">Map hernoemen<input id="cl-v-pad" class="wt-num" value="' + esc(p.split('/').pop()) + '"></label>',
            [{ t: 'Hernoemen', fn: async m => {
                const n = m.querySelector('#cl-v-pad').value.trim().replace(/\//g, '-'); if (!n) return;
                const nieuw = p.split('/').slice(0, -1).concat([n]).join('/'); const r = await db('map-hernoem', { oud: p, nieuw });
                if (!r || !r.ok) { m.innerHTML = '<div class="ask-fout">⚠ ' + esc(r && r.err === 'bestaat-al' ? 'Die map bestaat al.' : (r && r.err) || 'niet gelukt') + '</div>'; return; }
                if (CLOUD && (CLOUD.map === p || (CLOUD.map || '').indexOf(p + '/') === 0)) { CLOUD.map = nieuw + CLOUD.map.slice(p.length); clBewaarHuidig(); }
                CL_OPEN.add(nieuw); m.innerHTML = ''; clLijst('✔ Map hernoemd.');
            } }, { t: 'Annuleren', fn: m => { m.innerHTML = ''; } }]);
    }
    async function clMapWeg(p) {
        const r = await db('map-weg', { pad: p });
        clLijst(r && r.ok ? '✔ Map verwijderd.' : r && r.err === 'niet-leeg' ? '⚠ Deze map is niet leeg. Verplaats of verwijder eerst de flows erin.' : '⚠ ' + ((r && r.err) || 'niet gelukt'));
    }
    function clWeg(f, rij) {
        clVorm('<div>Flow “<b>' + esc(f.naam) + '</b>” verwijderen? Dit kan niet ongedaan worden.</div>',
            [{ t: 'Verwijderen', fn: async m => {
                const r = await db('verwijder', { id: f.id });
                if (!r || !r.ok) { m.innerHTML = '<div class="ask-fout">⚠ ' + esc((r && r.err) || 'niet gelukt') + '</div>'; return; }
                if (CLOUD && CLOUD.id === f.id) { CLOUD = null; CLOUD_LAATST = ''; clBewaarHuidig(); clStatus('niet bewaard (verwijderd)'); }
                m.innerHTML = ''; clLijst('✔ “' + f.naam + '” verwijderd.');
            } }, { t: 'Annuleren', fn: m => { m.innerHTML = ''; } }]);
    }
    async function clVersies(f) {
        const r = await db('versies', { id: f.id });
        if (!r || !r.ok) { $('#cl-melding').innerHTML = '<div class="ask-fout">⚠ ' + esc((r && r.err) || 'niet gelukt') + '</div>'; return; }
        if (!r.versies.length) { $('#cl-melding').innerHTML = '<div class="hint">Nog geen eerdere versies van “' + esc(f.naam) + '”. Bij wijzigingen bewaart ParseLab hoogstens elke 5 minuten een versie.</div>'; return; }
        clVorm('<label class="kol">Versie van “' + esc(f.naam) + '” terugzetten<select id="cl-v-versie" class="wt-num">' + r.versies.map(v => '<option value="' + v.id + '">' + esc(tijdKort(v.bewaard)) + '</option>').join('') + '</select></label><div class="hint">De huidige inhoud wordt eerst zelf als versie bewaard.</div>',
            [{ t: 'Terugzetten', fn: async m => {
                if (RUNNING) return;
                const v = await db('versie', { vid: m.querySelector('#cl-v-versie').value });
                if (!v || !v.ok) { m.innerHTML = '<div class="ask-fout">⚠ ' + esc((v && v.err) || 'niet gelukt') + '</div>'; return; }
                if (!CLOUD || CLOUD.id !== f.id) await cloudLaad(f.id);
                zetVolledigeStaat(v.data); CLOUD.meeLijst = !!v.data.meeLijst; CLOUD_LAATST = ''; persistNow(); await cloudBewaar(true);
                m.innerHTML = ''; log('↺ Versie van ' + tijdKort(v.bewaard) + ' teruggezet in “' + f.naam + '”.', true); clLijst('✔ Versie van ' + tijdKort(v.bewaard) + ' teruggezet.');
            } }, { t: 'Annuleren', fn: m => { m.innerHTML = ''; } }]);
    }
    $('#cl-open').onclick = () => { const b = $('#cl-paneel'); if (b.style.display !== 'none' && b.querySelector('.cl-tabs')) { b.style.display = 'none'; return; } cloudBewaar(true).then(() => clToon(CL_TAB || 'flows')); };
    $('#cl-naam').onclick = () => clNaamMap(null);
    $('#cl-nieuw').onclick = cloudNieuw;
    // Teamcode (Instellingen): wie dezelfde code heeft, ziet dezelfde flows.
    async function clTeam() {
        const r = await db('team'); const e = $('#cl-team'); if (!e) return;
        e.value = r && r.ok ? r.team : '';
    }
    if ($('#cl-door')) { setTimeout(async () => { if (IS_EXT) $('#cl-door').value = await deurNaam(); }, 0); $('#cl-door').addEventListener('change', e => { const v = e.target.value.trim(); if (v) try { chrome.storage.local.set({ 'pl-door': v.slice(0, 60) }); } catch (x) {} }); }
    if ($('#cl-team-kopie')) $('#cl-team-kopie').onclick = function () { const v = $('#cl-team').value; try { navigator.clipboard.writeText(v); flash(this, '✔ gekopieerd'); } catch (e) { $('#cl-team').select(); } };
    if ($('#cl-team-zet')) $('#cl-team-zet').onclick = async function () {
        const c = ($('#cl-team-in').value || '').trim(); const r = await db('team-zet', { code: c });
        if (!r || !r.ok) { flash(this, (r && r.err) || 'niet gelukt'); return; }
        $('#cl-team-in').value = ''; CLOUD = null; CLOUD_LAATST = ''; clBewaarHuidig(); clTeam(); flash(this, '✔ gekoppeld');
        log('☁ Gekoppeld aan een andere teamcode. Open “Flows” om de flows van dat team te zien.', true);
        if ($('#cl-paneel').style.display !== 'none') clLijst('Flows van de nieuwe teamcode.');
    };
    setTimeout(function clStart() {   // pas na het opbouwen van het paneel (IS_EXT e.d. bestaan dan)
        if (!IS_EXT) return;
        try { chrome.storage.local.get(CLOUD_KEY, r => { CLOUD = (r && r[CLOUD_KEY]) || null; clKop(); clTeam(); setTimeout(() => cloudPlan(), 2500); }); } catch (e) {}
    }, 0);

    // ---- Wachtrij, planning en geschiedenis ----
    let WQ_LIJST = null, CL_TAB = 'flows';
    function bronModus() { const e = $('#flow-bron'); return e && e.value === 'wachtrij' ? 'wachtrij' : 'lijst'; }
    async function deurNaam() {
        try { const r = await chrome.storage.local.get('pl-door'); if (r && r['pl-door']) return r['pl-door']; const n = 'Computer ' + Math.random().toString(36).slice(2, 6).toUpperCase(); await chrome.storage.local.set({ 'pl-door': n }); return n; } catch (e) { return 'Computer'; }
    }
    function wqIds(r) { if (!r) return []; return (r._groep ? r._groep : [r]).map(x => x && x._wq).filter(x => x != null); }
    async function wqMeld(st, row, status, resultaat, fout) {
        const ids = wqIds(row); if (!ids.length) return;
        const schoon = {}; Object.keys(resultaat || {}).forEach(k => { if (k[0] !== '_') schoon[k] = resultaat[k]; });
        const json = JSON.stringify(schoon);
        try { await db('wq-meld', { ids, status, resultaat: json.length < 300000 ? schoon : { te_groot: true }, fout: fout || null }); } catch (e) {}
        st.wqGemeld = (st.wqGemeld || []).concat(ids); await saveRun(st);
    }
    function autoKlaar(planId, status) { try { kaderBericht({ type: 'pl-auto-klaar', planId, status }); } catch (e) {} }
    // Gestart door een planning (achtergrond): flow uit de cloud laden en automatisch starten.
    window.__plAutoRun = async m => {
        if (RUNNING) return { ok: false, err: 'er loopt al een ronde' };
        if (m.flowId && (!CLOUD || CLOUD.id !== m.flowId)) await cloudLaad(m.flowId);
        if (m.flowId && (!CLOUD || CLOUD.id !== m.flowId)) return { ok: false, err: 'flow niet gevonden in de cloud' };
        log('⏰ Geplande start van “' + (CLOUD ? CLOUD.naam : 'flow') + '”.', true);
        setTimeout(() => startFlow(0, { modus: 'alles', planId: m.planId, bron: m.bron || 'planning' }), 300);
        return { ok: true };
    };
    const STATUS_NL = { nieuw: 'wacht', bezig: 'bezig', klaar: 'klaar', fout: 'fout' };
    function clTabs(tab) {
        const box = $('#cl-paneel'); box.style.display = 'block';
        if (!box.querySelector('.cl-tabs')) {
            box.innerHTML = '<div class="cl-tabs">' + [['flows', 'layers', 'Flows'], ['wachtrij', 'list', 'Wachtrij'], ['planning', 'clock', 'Planning'], ['geschiedenis', 'repeat', 'Geschiedenis']].map(t => '<button data-cltab="' + t[0] + '">' + IC(t[1], 'ico-sm') + '<span>' + t[2] + '</span></button>').join('') +
                '<button class="mini" id="cl-dicht" title="Sluiten">' + IC('x', 'ico-sm') + '</button></div><div id="cl-inhoud"></div>';
            box.querySelectorAll('[data-cltab]').forEach(b => b.onclick = () => clToon(b.dataset.cltab));
            $('#cl-dicht').onclick = () => { box.style.display = 'none'; };
        }
        CL_TAB = tab; box.querySelectorAll('[data-cltab]').forEach(b => b.classList.toggle('on', b.dataset.cltab === tab));
        return $('#cl-inhoud');
    }
    function clToon(tab) { if (tab === 'flows') clLijst(); else if (tab === 'wachtrij') clWachtrij(); else if (tab === 'planning') clPlanning(); else clGeschiedenis(); }
    const korteRij = d => Object.keys(d || {}).filter(k => k[0] !== '_').slice(0, 3).map(k => String(d[k] == null ? '' : d[k]).slice(0, 24)).join(' · ');
    async function clWachtrij(melding) {
        const inh = clTabs('wachtrij');
        if (!CLOUD || !CLOUD.id) { inh.innerHTML = '<div class="hint">Open of bewaar eerst een flow; de wachtrij hoort bij een flow.</div>'; return; }
        inh.innerHTML = '<div class="hint">laden…</div>';
        const [t, rec] = await Promise.all([db('wq-tel', { flow_id: CLOUD.id }), db('wq-recent', { flow_id: CLOUD.id, limit: 15 })]);
        if (!t || !t.ok) { inh.innerHTML = '<div class="hint">' + esc(t && t.offline ? 'Geen verbinding met de cloud.' : 'Wachtrij niet bereikbaar' + (t && t.err ? ': ' + t.err : '') + '.') + '</div>'; return; }
        const tel = t.tel || {}, n = k => +tel[k] || 0, lijstN = flowRows.length;
        inh.innerHTML = '<div class="cl-melding" id="cl-melding">' + esc(melding || '') + '</div>' +
            '<div class="wq-tellers">' + ['nieuw', 'bezig', 'klaar', 'fout'].map(k => '<span class="wq-t wq-' + k + '"><b>' + n(k) + '</b>' + STATUS_NL[k] + '</span>').join('') + '</div>' +
            '<label class="cl-vink"><input type="checkbox" id="wq-bron"' + (bronModus() === 'wachtrij' ? ' checked' : '') + '> deze flow haalt zijn regels uit de wachtrij (in plaats van uit de lijst)</label>' +
            '<div class="wt-row" style="gap:6px;flex-wrap:wrap">' +
                '<button class="wt-btn alt mini" id="wq-add"' + (lijstN ? '' : ' disabled') + '>' + IC('upload', 'ico-sm') + '<span>Lijst toevoegen (' + lijstN + ')</span></button>' +
                '<button class="wt-btn alt mini" id="wq-opnieuw"' + (n('fout') ? '' : ' disabled') + '>' + IC('repeat', 'ico-sm') + '<span>Fouten opnieuw</span></button>' +
                '<button class="wt-btn alt mini" id="wq-opruim"' + (n('klaar') ? '' : ' disabled') + '>' + IC('trash', 'ico-sm') + '<span>Klaar opruimen</span></button>' +
                '<button class="wt-btn alt mini" id="wq-ververs">' + IC('repeat', 'ico-sm') + '<span>Vernieuwen</span></button></div>' +
            '<div class="wq-items">' + ((rec && rec.ok && rec.items.length) ? rec.items.map(i => '<div class="wq-item"><span class="wq-st wq-' + i.status + '">' + STATUS_NL[i.status] + '</span><span class="cl-n"><b>' + esc(korteRij(i.data) || ('#' + i.id)) + '</b><small>' +
                esc(i.fout ? i.fout : i.resultaat ? 'resultaat: ' + korteRij(i.resultaat) : (i.door ? i.door + ' · ' : '') + tijdKort(i.klaar || i.aangemaakt)) + '</small></span></div>').join('') : '<div class="hint">De wachtrij van deze flow is leeg.</div>') + '</div>' +
            '<details class="wt-more"><summary>Koppelen met andere systemen</summary><div class="hint">Andere systemen (Power Automate, Make, Zapier, een script) kunnen werk toevoegen met één HTTP-verzoek. Resultaten staan daarna in dezelfde tabel.</div><pre class="wt-pre" id="wq-curl" style="white-space:pre-wrap;font-size:11px"></pre><button class="wt-btn alt mini" id="wq-curl-kopie">' + IC('link', 'ico-sm') + '<span>Kopieer</span></button></details>';
        $('#wq-bron').onchange = e => { const s = $('#flow-bron'); if (s) { s.value = e.target.checked ? 'wachtrij' : 'lijst'; s.dispatchEvent(new Event('change', { bubbles: true })); } };
        $('#wq-add').onclick = async () => {
            const rijen = flowRows.map(r => { const o = {}; Object.keys(r).forEach(k => { if (k[0] !== '_') o[k] = r[k]; }); return o; });
            await cloudBewaar(true); const r = await db('wq-toevoegen', { flow_id: CLOUD.id, rijen });
            clWachtrij(r && r.ok ? '✔ ' + r.toegevoegd + ' regel(s) aan de wachtrij toegevoegd.' : '⚠ ' + ((r && r.err) || 'niet gelukt'));
        };
        $('#wq-opnieuw').onclick = async () => { const r = await db('wq-opnieuw', { flow_id: CLOUD.id }); clWachtrij(r && r.ok ? '✔ Fouten staan weer klaar.' : '⚠ ' + ((r && r.err) || 'niet gelukt')); };
        $('#wq-opruim').onclick = async () => { const r = await db('wq-opruimen', { flow_id: CLOUD.id }); clWachtrij(r && r.ok ? '✔ Afgeronde regels opgeruimd.' : '⚠ ' + ((r && r.err) || 'niet gelukt')); };
        $('#wq-ververs').onclick = () => clWachtrij();
        const tm = await db('team'); const voorbeeld = Object.keys((flowRows[0] || {})).filter(k => k[0] !== '_').slice(0, 2).reduce((o, k) => (o[k] = String(flowRows[0][k]), o), {});
        $('#wq-curl').textContent = 'curl -X POST "' + ((tm && tm.url) || '') + '/rest/v1/wachtrij" \\\n  -H "apikey: <publieke sleutel>" \\\n  -H "x-pl-team: ' + ((tm && tm.team) || '<teamcode>') + '" \\\n  -H "Content-Type: application/json" \\\n  -d \'' + JSON.stringify({ flow_id: CLOUD.id, data: Object.keys(voorbeeld).length ? voorbeeld : { polisnummer: '123' } }) + '\'';
        $('#wq-curl-kopie').onclick = function () { try { navigator.clipboard.writeText($('#wq-curl').textContent); flash(this, '✔'); } catch (e) {} };
    }
    const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    function wanneerTekst(w) {
        w = w || {};
        if (w.soort === 'eenmalig') return 'eenmalig ' + tijdKort(Date.parse(w.datum || ''));
        if (w.soort === 'interval') return 'elke ' + (+w.minuten || 15) + ' min';
        if (w.soort === 'werkdagen') return 'werkdagen ' + (w.tijd || '08:00');
        if (w.soort === 'wekelijks') return 'elke ' + DAGEN[+w.dag || 1] + ' ' + (w.tijd || '08:00');
        return 'elke dag ' + (w.tijd || '08:00');
    }
    const planLees = () => new Promise(res => { try { chrome.storage.local.get('pl-planning', r => res((r && r['pl-planning']) || [])); } catch (e) { res([]); } });
    const planZet = l => new Promise(res => { try { chrome.storage.local.set({ 'pl-planning': l }, () => res()); } catch (e) { res(); } });
    async function clPlanning(melding) {
        const inh = clTabs('planning'), lijst = await planLees();
        inh.innerHTML = '<div class="cl-melding" id="cl-melding">' + esc(melding || '') + '</div>' +
            '<div class="hint">Op het tijdstip opent ParseLab een venster met de startpagina en start de flow. Chrome moet open zijn en je moet op de site ingelogd zijn. Planningen gelden voor deze computer.</div>' +
            '<div class="wq-items">' + (lijst.length ? lijst.map(p => '<div class="wq-item" data-plan="' + esc(p.id) + '"><label class="pl-aan" title="aan/uit"><input type="checkbox" data-pl="aan"' + (p.aan ? ' checked' : '') + '></label><span class="cl-n"><b>' + esc(p.flowNaam || 'flow') + '</b><small>' + esc(wanneerTekst(p.wanneer)) + (p.alleenMetWerk ? ' · alleen met werk' : '') +
                (p.aan && p.volgende ? ' · volgende ' + esc(tijdKort(p.volgende)) : p.aan ? '' : ' · uit') + (p.laatst ? ' · laatst ' + esc(tijdKort(p.laatst)) + (p.laatsteStatus ? ' (' + esc(p.laatsteStatus) + ')' : '') : '') + '</small></span>' +
                '<span class="cl-acties" style="display:inline-flex"><button class="mini" data-pl="nu" title="Nu uitvoeren">' + IC('play', 'ico-sm') + '</button><button class="mini" data-pl="weg" title="Verwijderen">' + IC('trash', 'ico-sm') + '</button></span></div>').join('') : '<div class="hint">Nog geen planningen.</div>') + '</div>' +
            (CLOUD && CLOUD.id ? '<div class="cl-vorm"><b>Nieuwe planning voor “' + esc(CLOUD.naam) + '”</b>' +
                '<div class="wt-row" style="gap:6px;flex-wrap:wrap"><select id="pl-soort" class="wt-num"><option value="dagelijks">elke dag</option><option value="werkdagen">werkdagen</option><option value="wekelijks">elke week</option><option value="interval">elke … minuten</option><option value="eenmalig">één keer</option></select>' +
                '<select id="pl-dag" class="wt-num" style="display:none">' + DAGEN.map((d, i) => '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>' +
                '<input id="pl-tijd" type="time" class="wt-num" value="08:00"><input id="pl-min" type="number" min="5" value="15" class="wt-num" style="width:70px;display:none"><input id="pl-datum" type="datetime-local" class="wt-num" style="display:none"></div>' +
                '<label class="cl-vink"><input type="checkbox" id="pl-werk"' + (bronModus() === 'wachtrij' ? ' checked' : '') + '> alleen starten als er werk in de wachtrij staat</label>' +
                '<label class="cl-vink"><input type="checkbox" id="pl-sluit" checked> venster na afloop sluiten</label>' +
                '<div class="wt-row"><button class="wt-btn primary mini" id="pl-maak">' + IC('plus', 'ico-sm') + '<span>Plannen</span></button></div></div>' : '<div class="hint">Open of bewaar eerst een flow om hem te plannen.</div>');
        const soort = $('#pl-soort');
        if (soort) {
            const toon = () => { const v = soort.value; $('#pl-dag').style.display = v === 'wekelijks' ? '' : 'none'; $('#pl-tijd').style.display = v === 'interval' || v === 'eenmalig' ? 'none' : ''; $('#pl-min').style.display = v === 'interval' ? '' : 'none'; $('#pl-datum').style.display = v === 'eenmalig' ? '' : 'none'; };
            soort.onchange = toon; toon();
            $('#pl-maak').onclick = async () => {
                const v = soort.value, w = { soort: v, tijd: $('#pl-tijd').value || '08:00', dag: +$('#pl-dag').value, minuten: Math.max(5, +$('#pl-min').value || 15), datum: $('#pl-datum').value ? new Date($('#pl-datum').value).toISOString() : '' };
                if (v === 'eenmalig' && !w.datum) { $('#pl-datum').focus(); return; }
                await cloudBewaar(true);
                const url = (($('#flow-startUrl') && $('#flow-startUrl').value) || '').trim() || location.href;
                const l = await planLees(); l.push({ id: 'p' + Date.now().toString(36), flowId: CLOUD.id, flowNaam: CLOUD.naam, url, wanneer: w, aan: true, alleenMetWerk: $('#pl-werk').checked, sluiten: $('#pl-sluit').checked, gemaakt: Date.now() });
                await planZet(l); await kaderBericht({ type: 'pl-plan-herplan' }); clPlanning('✔ Gepland: ' + wanneerTekst(w) + '.');
            };
        }
        inh.querySelectorAll('[data-plan]').forEach(rij => {
            const id = rij.dataset.plan;
            rij.querySelector('[data-pl="aan"]').onchange = async e => { const l = await planLees(); const p = l.find(x => x.id === id); if (p) { p.aan = e.target.checked; await planZet(l); await kaderBericht({ type: 'pl-plan-herplan' }); clPlanning(); } };
            rij.querySelector('[data-pl="weg"]').onclick = async () => { const l = (await planLees()).filter(x => x.id !== id); await planZet(l); await kaderBericht({ type: 'pl-plan-herplan' }); clPlanning('✔ Planning verwijderd.'); };
            rij.querySelector('[data-pl="nu"]').onclick = async () => { clPlanning('Wordt gestart in een nieuw venster…'); const r = await kaderBericht({ type: 'pl-plan-nu', id }); if (r && !r.ok) clPlanning('⚠ ' + (r.err || 'niet gelukt')); else if (r && r.leeg) clPlanning('De wachtrij is leeg — niets gestart.'); };
        });
    }
    async function clGeschiedenis() {
        const inh = clTabs('geschiedenis'); inh.innerHTML = '<div class="hint">laden…</div>';
        const r = await db('runs', { limit: 30 });
        if (!r || !r.ok) { inh.innerHTML = '<div class="hint">' + esc(r && r.offline ? 'Geen verbinding met de cloud.' : 'Kon de geschiedenis niet ophalen' + (r && r.err ? ': ' + r.err : '') + '.') + '</div>'; return; }
        const duur = x => { if (!x.geeindigd) return 'loopt'; const s = Math.round((Date.parse(x.geeindigd) - Date.parse(x.gestart)) / 1000); return s < 90 ? s + ' s' : Math.round(s / 60) + ' min'; };
        const BRON = { handmatig: 'handmatig', planning: 'gepland', wachtrij: 'wachtrij', test: 'test' };
        inh.innerHTML = '<div class="wq-items">' + (r.runs.length ? r.runs.map(x => '<div class="wq-item"><span class="wq-st wq-' + (x.status === 'klaar' ? 'klaar' : x.status === 'bezig' ? 'bezig' : 'fout') + '">' + esc(x.status) + '</span><span class="cl-n"><b>' + esc(x.flow_naam || 'flow') + '</b><small>' +
            esc(tijdKort(x.gestart) + ' · ' + (BRON[x.bron] || x.bron) + ' · ' + (x.regels != null ? x.regels + '/' + (x.totaal != null ? x.totaal : '?') + ' rondes' : '') + (x.fouten ? ' · ' + x.fouten + ' fout' : '') + ' · ' + duur(x) + (x.door ? ' · ' + x.door : '')) + '</small></span></div>').join('') : '<div class="hint">Nog geen runs.</div>') + '</div>';
    }

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
    function applySide() { dock(); }   // de zijbalk staat altijd rechts
    (function initPrefs() {
        try {
            chrome.storage.local.get(['wt-dark', 'wt-side', 'pl-cookies', 'pl-folder'], r => {
                applyTheme(!(r && r['wt-dark'] === false)); applySide(r && r['wt-side'] === 'left');
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
            retries: $('#flow-retries') ? +$('#flow-retries').value || 0 : 0,
            startUrl: $('#flow-startUrl') ? $('#flow-startUrl').value.trim() : '',
            bron: $('#flow-bron') ? $('#flow-bron').value : 'lijst'
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
        if ($('#flow-startUrl')) $('#flow-startUrl').value = d.startUrl || '';
        if ($('#flow-bron')) { $('#flow-bron').value = d.bron === 'wachtrij' ? 'wachtrij' : 'lijst'; bronUitleg(); }
        renderSteps(); renderFlow();
        return true;
    }
    function saveRows() { try { if (flowRows.length) chrome.storage.local.set({ [ROWS_KEY]: flowRows }); else chrome.storage.local.remove(ROWS_KEY); } catch (e) { try { flowRows.length ? localStorage.setItem(ROWS_KEY, JSON.stringify(flowRows)) : localStorage.removeItem(ROWS_KEY); } catch (_) {} } }
    function loadRows() { return new Promise(res => { try { chrome.storage.local.get(ROWS_KEY, r => res((r && r[ROWS_KEY]) || [])); } catch (e) { try { res(JSON.parse(localStorage.getItem(ROWS_KEY) || '[]')); } catch (_) { res([]); } } }); }
    // Auto-bewaren (kort uitgesteld) bij elke wijziging.
    let saveTimer = null;
    function saveAuto() {
        try { cloudPlan(); } catch (e) {}
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
            // Eerst de bewaarde flow-instellingen (startpagina, bron, …) terug, anders gaan die na een paginawissel verloren.
            const lokaal = await new Promise(res => { try { chrome.storage.local.get(AUTO_KEY, r => res(r && r[AUTO_KEY])); } catch (e) { try { res(JSON.parse(localStorage.getItem(AUTO_KEY) || 'null')); } catch (_) { res(null); } } });
            if (lokaal) { CLOUD_LADEN = true; try { applyState(lokaal); } catch (e) {} finally { CLOUD_LADEN = false; } }
            steps = run.steps || []; stepSeq = steps.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
            flowRows = run.origRows ? run.origRows : (run.rows && run.rows.length && run.rows[0] !== null) ? run.rows : [];
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
        let d = 0;
        steps.forEach(s => {
            if (s.type === 'endloop') { d = Math.max(0, d - 1); boxes.push({ k: 'next', t: '↺ volgende item' }); return; }
            if (s.type === 'loopklik') { boxes.push({ k: 'loop', t: 'Voor elk item in het gebied' + (+s.max ? ' (eerste ' + s.max + ')' : '') }); d++; return; }
            if (s.type === 'loop') { boxes.push({ k: 'loop', t: 'Voor elk item (' + (+s.max ? 'eerste ' + s.max : lusItems(s.spec).length || (s.spec && s.spec.count) || '?') + ')' }); d++; return; }
            const base = s.name || s.type;
            boxes.push({ k: s.type, t: (d ? '↳ ' : '') + base + ((s.rep || 1) > 1 ? '  (' + s.rep + '×)' : '') + (s.onlyIf ? ' · alleen als…' : '') });
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
        head.addEventListener('mousedown', e => { if (e.target.closest('button') || true) return; drag = true; sx = e.clientX; sy = e.clientY; const r = host.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); });
        doc.addEventListener('mousemove', e => { if (!drag) return; host.style.left = (ox + e.clientX - sx) + 'px'; host.style.top = (oy + e.clientY - sy) + 'px'; host.style.right = 'auto'; });
        doc.addEventListener('mouseup', () => drag = false);
    })();

    // Sluiten (✕): paneel weg, koppeling uit, en de sitetoegang weer vrijgeven.
    function cleanup(byUser) {
        try { topObs.disconnect(); } catch (e) {} clearInterval(topIv); clearTimeout(topT); clearInterval(urlIv);
        endPick(); overlay.remove(); host.remove(); try { pickCss.remove(); } catch (e) {} undock(); try { if (OPNAME) opnameStop(true); } catch (e) {}
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
  #flow-steps:not(.bewerk) .strep, #flow-steps:not(.bewerk) [data-up], #flow-steps:not(.bewerk) [data-down] { display:none !important; }
  .stprow > .stmid { flex:1 1 0; min-width:0; }
  .stprow > .stparams { flex-basis:100%; }
  .wt-card.wt-kies .wt-body { display:none !important; }
  .wt-card.wt-kies { height:auto !important; min-height:0 !important; max-height:none !important; }
  .wt-pickhint { background:var(--accent) !important; color:#fff !important; left:auto !important; right:12px !important; top:58px !important; bottom:auto !important; transform:none !important; pointer-events:none !important; max-width:min(560px, calc(100vw - 24px)); }
  .wt-card.wt-kies { border-bottom:2px solid var(--accent); }
  .stins { display:flex; align-items:center; justify-content:center; height:14px; margin:-3px 0 3px; position:relative; }
  .stins::before { content:''; position:absolute; left:20%; right:20%; top:50%; border-top:1px dashed transparent; }
  .stins:hover::before { border-top-color:var(--grid); }
  .stins-btn { position:relative; width:18px; height:18px; border-radius:50%; border:1px solid var(--baseline); background:var(--page); color:var(--muted); font:600 12px/1 system-ui; cursor:pointer; padding:0; opacity:.55; }
  .stins-btn:hover { opacity:1; color:var(--c-pg); border-color:var(--c-pg); }
  #invoer-kaart { gap:6px; } #invoer-kaart .knoprij .wt-btn { flex:1 1 30%; }
  #lijst-details > summary { cursor:pointer; padding:2px 0; }
  .kk-lijst { display:flex; flex-direction:column; gap:3px; max-height:220px; overflow:auto; margin:4px 0; }
  .kk-rij { display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--grid); border-radius:8px; cursor:pointer; font-size:13px; }
  .kk-rij b { color:var(--c-kl, var(--accent)); min-width:90px; } .kk-rij span { color:var(--muted); font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .kk-rij:has(input:checked) { border-color:var(--c-kl, var(--accent)); background:color-mix(in srgb, var(--c-kl, var(--accent)) 10%, transparent); }
  .rondeinde { display:flex; gap:8px; align-items:flex-start; border:1px dashed var(--baseline); border-radius:10px; padding:8px 10px; font-size:12.5px; color:var(--ink-2); margin-top:4px; }
  .rondeinde .ico { flex:none; margin-top:2px; color:var(--accent); }
  .aantalrij { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .cloudbalk { display:flex; align-items:center; gap:6px; margin:6px 0 4px; }
  .cl-naam { flex:1; min-width:0; display:inline-flex; align-items:center; gap:6px; background:transparent; border:1px solid var(--grid); border-radius:8px; padding:6px 8px; color:var(--ink); cursor:pointer; text-align:left; font:inherit; }
  .cl-naam:hover { border-color:var(--accent); }
  .cl-naam b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cl-pad { color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:45%; }
  .cl-stat { font-size:11px; color:var(--muted); white-space:nowrap; } .cl-stat.ok { color:var(--good); } .cl-stat.bad { color:var(--bad); }
  .cl-paneel { border:1px solid var(--grid); border-radius:10px; padding:8px; margin:4px 0 8px; background:var(--surface); }
  .cl-kop { display:flex; gap:6px; align-items:center; } .cl-kop input { flex:1; min-width:0; }
  .cl-lijst { max-height:360px; overflow:auto; margin-top:6px; }
  .cl-rij { display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:8px; cursor:pointer; }
  .cl-rij:hover { background:var(--grid); }
  .cl-rij.huidig { outline:1px solid var(--accent); }
  .cl-n { flex:1; min-width:0; display:flex; flex-direction:column; } .cl-n b { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .cl-n small { color:var(--muted); font-size:11px; }
  .cl-map .cl-n { flex-direction:row; gap:6px; align-items:baseline; }
  .cl-acties { display:none; gap:2px; } .cl-rij:hover .cl-acties { display:inline-flex; }
  .cl-vorm { display:flex; flex-direction:column; gap:6px; padding:8px; border:1px dashed var(--grid); border-radius:8px; margin-top:6px; }
  .cl-vorm .kol { display:flex; flex-direction:column; gap:3px; font-size:12px; } .cl-vink { font-size:12px; display:flex; gap:6px; align-items:center; } .cl-vink small { color:var(--muted); }
  .cl-melding:empty { display:none; }
  .cl-tabs { display:flex; gap:2px; align-items:center; border-bottom:1px solid var(--grid); margin:-2px -2px 8px; padding-bottom:6px; overflow-x:auto; }
  .cl-tabs [data-cltab] { display:inline-flex; align-items:center; gap:4px; background:transparent; border:0; color:var(--muted); padding:5px 8px; border-radius:7px; cursor:pointer; font:inherit; font-size:12px; white-space:nowrap; }
  .cl-tabs [data-cltab].on { background:var(--grid); color:var(--ink); }
  .cl-tabs #cl-dicht { margin-left:auto; }
  .wq-tellers { display:flex; gap:6px; margin:6px 0; } .wq-t { flex:1; text-align:center; border:1px solid var(--grid); border-radius:8px; padding:6px 4px; font-size:11px; color:var(--muted); } .wq-t b { display:block; font-size:17px; color:var(--ink); }
  .wq-items { display:flex; flex-direction:column; gap:2px; margin:6px 0; max-height:300px; overflow:auto; }
  .wq-item { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:8px; } .wq-item:hover { background:var(--grid); }
  .wq-st { font-size:10px; text-transform:uppercase; letter-spacing:.04em; padding:2px 6px; border-radius:6px; border:1px solid var(--grid); color:var(--muted); min-width:44px; text-align:center; }
  .wq-st.wq-klaar, .wq-t.wq-klaar b { color:var(--good); } .wq-st.wq-fout, .wq-t.wq-fout b { color:var(--bad); } .wq-st.wq-bezig, .wq-t.wq-bezig b { color:var(--accent); }
  .pl-aan input { width:16px; height:16px; }
  .stparams.ext .ext-velden { flex-basis:100%; display:flex; flex-direction:column; gap:4px; margin-top:4px; }
  .ext-veld { display:flex; align-items:center; gap:6px; min-width:0; } .ext-veld .pin { width:110px; flex:none; }
  .ext-veld code { font:500 11px ui-monospace, Consolas, monospace; color:var(--muted); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .startpg { display:flex; align-items:center; gap:6px; margin:6px 0 8px; padding:6px 8px; border:1px solid var(--grid); border-radius:8px; }
  .startpg-l { display:inline-flex; align-items:center; gap:4px; white-space:nowrap; font-size:12px; opacity:.85; }
  .startpg .wt-num { flex:1 1 auto; width:auto; min-width:0; min-height:30px; padding:4px 8px; }
  .aantalrij .wt-num { width:auto; min-height:32px; padding:4px 8px; } .aantalrij #flow-aantal { width:72px; }
  /* --- 1.33: strakke indeling --- */
  .emo { display:inline-flex; vertical-align:-3px; margin:0 1px; } .emo .ico { width:14px; height:14px; }
  .wt-tab { display:inline-flex; align-items:center; justify-content:center; gap:6px; }
  .wt-soorten { gap:8px; }
  .wt-soorten .sk { border:1px solid var(--grid); box-shadow:none; border-radius:10px; padding:6px; gap:2px; }
  .wt-soorten .sk-kop { display:flex; align-items:center; gap:6px; font:700 12px system-ui; text-transform:uppercase; letter-spacing:.04em; color:var(--ink-2); border-bottom:1px solid var(--grid); padding:3px 4px 6px; margin-bottom:3px; }
  .wt-soorten .sk-b { display:flex; align-items:center; gap:7px; padding:5px 6px; font:500 12.5px system-ui; }
  .wt-soorten .sk-b .ico { color:var(--muted); flex:none; } .wt-soorten .sk-b:hover .ico { color:var(--accent); }
  .kaart { background:var(--surface); border:1px solid var(--grid); border-radius:12px; padding:10px; display:flex; flex-direction:column; gap:8px; }
  .kaartkop, details.kaart > summary { display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--ink); }
  .kaartkop .hint { margin-left:auto; font-size:12px; }
  details.kaart > summary { cursor:pointer; list-style:none; } details.kaart > summary::-webkit-details-marker { display:none; }
  details.kaart h5 { margin:8px 0 0; font:700 11px system-ui; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
  .knoprij { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .knoprij .wt-btn { font-size:12.5px; padding:6px 10px; min-height:34px; gap:6px; }
  #invoer-kaart .knoprij .wt-btn { flex:1 1 45%; justify-content:center; }
  .instelrij { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; color:var(--ink-2); padding:4px 0; border-bottom:1px solid color-mix(in srgb, var(--grid) 60%, transparent); }
  .instelrij .wt-num { width:auto; min-width:90px; max-width:55%; }
  .instelrij input[type=checkbox] { width:16px; height:16px; accent-color:var(--accent); }
  .flow-kop h4 { display:flex; align-items:center; gap:6px; }
  /* paginagroepen */
  .pgblok { border:1px solid var(--grid); border-radius:12px; background:var(--page); margin-bottom:10px; overflow:hidden; }
  .pgblok.hier { border-color:color-mix(in srgb, var(--accent) 55%, var(--grid)); }
  .pgkop { display:flex; align-items:center; gap:7px; padding:8px 10px; background:var(--surface); border-bottom:1px solid var(--grid); cursor:pointer; font-size:13px; }
  .pgblok.hier .pgkop { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); }
  .pgkop code { max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pgkop .pgn { margin-left:auto; font-size:12px; color:var(--muted); }
  .pgblok.dicht .pginh { display:none; } .pgblok.dicht .pgkop { border-bottom:0; }
  .pginh { padding:8px; }
  .stpage { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-2); margin:6px 2px; }
  /* stappen: duidelijke rechthoeken */
  .stprow { border:1px solid var(--grid); border-radius:10px; background:var(--surface); box-shadow:none; padding:7px 8px; margin-bottom:6px; gap:7px; }
  .stprow:not(.open) { padding:7px 8px; margin-bottom:6px; }
  .stprow:not(.open):hover { box-shadow:none; border-color:color-mix(in srgb, var(--accent) 45%, var(--grid)); }
  .stprow.open { border-color:color-mix(in srgb, var(--accent) 45%, var(--grid)); }
  .stnum { border-radius:6px; width:22px; height:22px; font-size:11px; }
  .sticoon { flex:none; width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--accent) 9%, var(--surface)); color:var(--accent); }
  .stgrip { flex:none; color:var(--baseline); cursor:grab; display:inline-flex; } .stprow:hover .stgrip { color:var(--muted); }
  .sther { color:var(--muted); display:inline-flex; }
  .stprow.sleept { opacity:.45; } .stprow.sleepdoel { border-color:var(--accent); border-style:dashed; }
  .lusblok { border-radius:12px; }
  .stins { display:flex; justify-content:center; margin:-2px 0 4px; }

  .wt-primary:has(#flow-zelf) .wt-btn { flex:1 1 45%; }
  .lijstbox { background:var(--surface); border-radius:12px; box-shadow:var(--shadow-card); padding:8px; display:flex; flex-direction:column; gap:6px; }
  .lijstkop { display:flex; align-items:center; gap:6px; font-size:13px; } .lijstkop .sp { flex:1; }
  .lijstscroll { overflow:auto; max-height:260px; border:1px solid var(--grid); border-radius:8px; }
  table.lijst { border-collapse:collapse; font-size:12px; min-width:100%; }
  table.lijst th, table.lijst td { border-bottom:1px solid var(--grid); padding:2px 4px; text-align:left; white-space:nowrap; }
  table.lijst th { position:sticky; top:0; background:var(--surface); z-index:1; font-weight:600; }
  table.lijst input { border:1px solid transparent; background:transparent; font:inherit; padding:3px 4px; width:110px; border-radius:6px; color:var(--ink); }
  table.lijst input:focus { border-color:var(--accent); outline:0; background:var(--page); }
  table.lijst .lkop { font-weight:700; }
  table.lijst .lu { background:color-mix(in srgb, var(--ink) 4%, var(--surface)); color:var(--ink-2); }
  table.lijst th.lu small { display:block; font-weight:400; color:var(--muted); }
  table.lijst .lnr { color:var(--muted); cursor:pointer; text-align:center; } table.lijst tr.nu td { background:color-mix(in srgb, var(--accent) 9%, var(--surface)); }
  .pnav { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:12px; }
  .pnav .pn-sp { color:var(--grid); }
  .pchip { border:1px solid var(--grid); background:var(--surface); border-radius:999px; padding:3px 9px; font:600 12px system-ui; color:var(--ink-2); cursor:pointer; }
  .pchip small { font-weight:400; color:var(--muted); } .pchip.hier { border-color:var(--accent); color:var(--accent); background:color-mix(in srgb, var(--accent) 8%, var(--surface)); }
  .regelrij { display:flex; flex-wrap:wrap; gap:5px; align-items:center; font-size:12.5px; margin-top:4px; }
  .lusblok { border:2px solid color-mix(in srgb, var(--accent) 45%, var(--surface)); border-radius:18px; padding:6px 6px 0; margin:4px 0 8px; background:color-mix(in srgb, var(--accent) 3%, var(--page)); }
  .lusblok.binnen { border-style:dashed; background:color-mix(in srgb, var(--accent) 6%, var(--page)); }
  .luskop { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--accent); padding:2px 4px 6px; }
  .luscirkel { width:24px; height:24px; flex:none; border-radius:50%; border:2px solid var(--accent); display:inline-flex; align-items:center; justify-content:center; font:700 14px system-ui; background:var(--surface); }
  .stprow.inlus { border-left:0; }
  .stprow.nu { outline:2px solid var(--accent); outline-offset:1px; }
  .wt-modus { border:1px solid var(--baseline); border-radius:var(--radius-ctl); padding:6px 8px; font:500 13px system-ui; background:var(--surface); color:var(--ink); width:100%; }
  .stapbalk { background:color-mix(in srgb, var(--accent) 8%, var(--surface)); border:1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius:12px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:6px; }
  .stapbalk .wt-btn { font-size:12.5px; padding:5px 9px; min-height:32px; }
  .opslag { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:13px; padding:8px 10px; background:var(--surface); border-radius:12px; box-shadow:var(--shadow-card); }
  .rnd { position:sticky; top:96px; z-index:2; background:var(--surface); border-radius:12px; box-shadow:var(--shadow-card); padding:8px 10px; display:flex; flex-direction:column; gap:4px; }
  .rnd-kop { display:flex; align-items:center; gap:8px; } .rnd-nr { font:700 14px system-ui; min-width:52px; text-align:center; } .rnd-schuif { flex:1; accent-color:var(--accent); }
  .rnd-uitleg { font-size:12px; color:var(--ink-2); }
  .stvb { font:600 12px system-ui; color:var(--accent); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .wt-site { background:var(--surface); border-radius:12px; box-shadow:var(--shadow-card); padding:10px; display:flex; flex-direction:column; gap:8px; font-size:13px; }
  .site-tel { display:flex; flex-wrap:wrap; gap:6px; } .site-tel span { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); border-radius:999px; padding:2px 9px; font-size:12px; }
  .site-opv { background:color-mix(in srgb, var(--bad) 5%, var(--surface)); border-radius:8px; padding:7px 9px; font-size:12.5px; line-height:1.6; }
  .site-lijst { margin:4px 0 0; padding-left:20px; max-height:220px; overflow:auto; font-size:12px; } .site-lijst li.fout b { color:var(--bad); }
  .sther { font-size:11px; flex:none; }
  .ai-context { background:color-mix(in srgb, var(--accent) 6%, var(--surface)); border-radius:8px; padding:7px 9px; }
  .wt-flowblok { display:flex; flex-direction:column; gap:8px; border-top:2px solid var(--grid); padding-top:10px; }
  .flow-knoppen .wt-btn { font-size:12.5px; padding:5px 9px; min-height:30px; }
  #wt-flow { display:none !important; }
  .stprow:not(.open) { cursor:pointer; padding:6px 10px; margin-bottom:5px; flex-wrap:nowrap; }
  .stprow:not(.open) .strep, .stprow:not(.open) .mini:not(.stpijl) { display:none; }
  .stprow:not(.open) .stdet { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stname.kort { display:block; font:600 13px system-ui; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stprow:not(.open):hover { box-shadow:var(--shadow-hover); }
  .stpijl { font-size:12px !important; }
  .sturl code { max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; vertical-align:middle; }
  .wt-soorten { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; }
  .wt-soorten .sk { background:var(--surface); border-radius:12px; box-shadow:var(--shadow-card); padding:8px; display:flex; flex-direction:column; gap:5px; min-width:0; }
  .wt-soorten .sk-kop { font:700 12px system-ui; color:var(--ink); padding:2px 2px 4px; border-bottom:1px solid var(--grid); margin-bottom:2px; white-space:nowrap; }
  .wt-soorten .sk-b { text-align:left; background:transparent; border:1px solid transparent; border-radius:8px; padding:6px 7px; font:500 12.5px system-ui; color:var(--ink-2); cursor:pointer; white-space:normal; line-height:1.25; }
  .wt-soorten .sk-b:hover { background:color-mix(in srgb, var(--accent) 8%, var(--surface)); color:var(--ink); border-color:color-mix(in srgb, var(--accent) 25%, transparent); }
  .wt-overig { display:flex; flex-wrap:wrap; gap:4px; }
  .wt-overig .wt-btn { font-size:12.5px; padding:6px 9px; min-height:32px; }
  .vooruit { background:color-mix(in srgb, var(--accent) 6%, var(--surface)); border-radius:8px; padding:7px 9px; font-size:12.5px; line-height:1.5; margin-top:4px; }
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
  /* ---- 1.22: groter, nooit horizontaal scrollen, begeleiding ---- */
  .wt-card { zoom:var(--z, 1); }
  .wt-body { overflow-x:hidden; overflow-y:auto; max-height:calc((100vh - 120px) / var(--z, 1)); }
  .wt-body > *, .wt-row > *, .stmid, .stparams > * { min-width:0; max-width:100%; }
  .wt-row input:not([type=checkbox]):not([type=radio]), .wt-row select, .stparams select, .stparams .pin { max-width:100%; }
  .wt-pre { overflow-x:hidden; }
  .stprow { flex-wrap:wrap; row-gap:4px; }
  .stmid { flex:1 1 0; min-width:90px; }
  .stprow .mini { padding:3px; }
  .stdet { font-size:10.5px; }
  .stdet { white-space:normal; overflow-wrap:anywhere; }
  .stprow > .stparams { max-width:100%; min-width:0; }
  .stparams select { max-width:100%; text-overflow:ellipsis; }
  .stprow.inlus { border-left:3px solid color-mix(in srgb, var(--accent) 45%, var(--surface)); }
  .stprow.lusrand { background:color-mix(in srgb, var(--accent) 7%, var(--surface)); }
  .b-loop,.b-loopklik,.b-endloop,.b-nav { color:var(--accent); background:color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .stpage { font-size:12px; color:var(--ink-2); background:color-mix(in srgb, #e9a300 12%, var(--surface)); border-radius:10px; padding:6px 10px; margin:4px 0 8px; overflow-wrap:anywhere; }
  .stpage code { font-size:11px; }
  .wt-quick { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:6px; }
  .wt-quick .wt-btn { justify-content:flex-start; font-size:13.5px; min-height:42px; padding:8px 10px; }
  .addmenu .main4 .wt-btn small { white-space:normal; }
  .wt-coach { background:var(--surface); border-radius:var(--radius); padding:12px 14px; box-shadow:var(--shadow-card); border-left:4px solid var(--accent); }
  .wt-coach .c-title { font:650 15px system-ui; margin-bottom:4px; }
  .wt-coach .c-body { font-size:13.5px; color:var(--ink-2); line-height:1.5; }
  .wt-coach .wt-row { margin-top:8px; }
  .goal-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
  .goal { text-align:left; background:var(--page); border:1px solid var(--grid); border-radius:12px; padding:10px 12px; cursor:pointer; font:inherit; color:var(--ink); transition:border-color var(--transition) var(--ease), transform var(--transition) var(--ease); }
  .goal:hover { border-color:var(--accent); transform:translateY(-1px); }
  .goal b { display:block; font:650 14px system-ui; margin-bottom:2px; } .goal span { font-size:12px; color:var(--muted); line-height:1.4; display:block; }
  .wt-phases { display:flex; gap:6px; }
  .wt-phases .ph { flex:1; text-align:center; font:600 12px system-ui; padding:6px 4px; border-radius:999px; background:color-mix(in srgb, var(--ink) 5%, var(--surface)); color:var(--muted); }
  .wt-phases .ph.on { background:var(--accent); color:var(--accent-ink); }
  .wt-phases .ph.done { background:color-mix(in srgb, var(--good) 14%, var(--surface)); color:var(--good); }
  .wt-pagebar { background:color-mix(in srgb, #e9a300 14%, var(--surface)); border:1px solid color-mix(in srgb, #e9a300 45%, var(--surface)); border-radius:var(--radius-ctl); padding:10px 12px; font-size:13.5px; overflow-wrap:anywhere; }
  .wt-pagebar .wt-row { margin-top:8px; }
  .wt-onb { background:var(--surface); border-radius:var(--radius); padding:16px; box-shadow:var(--shadow-hover); border:2px solid var(--accent); }
  .wt-onb h3 { margin:0 0 6px; font:700 18px var(--font-display); }
  .wt-onb p, .wt-onb li { font-size:14px; color:var(--ink-2); line-height:1.55; } .wt-onb ol { padding-left:20px; margin:8px 0; }
  .wt-onb .dots { display:flex; gap:5px; margin:10px 0; } .wt-onb .dots i { width:8px; height:8px; border-radius:50%; background:var(--grid); } .wt-onb .dots i.on { background:var(--accent); }
  .wt-ask .ask-btns .wt-btn { white-space:normal; text-align:left; }
  .wt-ask .ask-fout { color:var(--bad); font-weight:600; margin-top:6px; }
  .wt-ask label.kol { display:flex; flex-direction:column; gap:4px; width:100%; font-weight:600; font-size:13px; }
  .wt-ask .sugg { border:1px dashed var(--baseline); background:none; border-radius:999px; padding:1px 8px; font:inherit; font-size:12px; cursor:pointer; color:var(--accent); }
  .wt-top { background:var(--surface); border-radius:var(--radius); padding:12px; box-shadow:var(--shadow-card); display:flex; flex-direction:column; gap:10px; }
  .wt-sum { font-size:13px; color:var(--ink-2); }
  .wt-tabs { display:flex; gap:4px; border-bottom:1px solid var(--grid); }
  .wt-tab { flex:1; background:none; border:0; border-bottom:3px solid transparent; padding:10px 8px; font:650 14px system-ui; color:var(--muted); cursor:pointer; }
  .wt-tab.on { color:var(--accent); border-bottom-color:var(--accent); }
  .wt-tab small { font:600 10px system-ui; background:color-mix(in srgb, var(--ink) 7%, var(--surface)); color:var(--muted); border-radius:999px; padding:1px 6px; margin-left:4px; }
  .wt-tabpane { display:flex; flex-direction:column; gap:12px; }
  .wt-ai-in { width:100%; border:1px solid var(--baseline); border-radius:var(--radius-ctl); padding:10px; font:inherit; font-size:13px; background:var(--surface); color:var(--muted); resize:vertical; }
  .stpag { flex-shrink:0; font:700 10px system-ui; color:#8a5a00; background:color-mix(in srgb, #e9a300 18%, var(--surface)); border-radius:999px; padding:2px 7px; }
  #wt-paginas b { color:#8a5a00; }
  /* ---- 1.30: zijbalk (vast aan de rechterkant), één kolom met tabs ---- */
  .wt-card { height:100vh; border-radius:0; border-top:0; border-bottom:0; border-right:0; display:flex; flex-direction:column; }
  .wt-body { display:flex !important; flex-direction:column; gap:12px; padding:0 14px 16px; flex:1; min-height:0; height:auto !important; overflow-y:auto !important; overflow-x:hidden; max-height:none !important; }
  .wt-body.wt-hidden { display:none !important; }
  .wt-kop { position:sticky; top:0; z-index:5; background:var(--page); margin:0 -14px; width:calc(100% + 28px); max-width:none !important; box-sizing:border-box; padding:10px 14px 0; display:flex; flex-direction:column; gap:10px; border-bottom:1px solid var(--grid); }
  .wt-kop .wt-top { padding:10px; gap:8px; }
  .wt-kop .wt-tabs { border-bottom:0; }
  .wt-phases { display:none !important; }
  .wt-tab { font-size:12.5px; padding:9px 2px; white-space:nowrap; }
  .tabn { display:inline-block; min-width:18px; font:700 10px system-ui; background:var(--accent); color:var(--accent-ink); border-radius:999px; padding:1px 5px; margin-left:2px; }
  .tabn:empty { display:none; }
  .wt-btn.rec { background:#c62828; color:#fff; border-color:transparent; }
  .wt-btn.rec:disabled { background:color-mix(in srgb, #c62828 40%, var(--surface)); }
  .recbadge { font:700 11px system-ui; color:#fff; background:#c62828; border-radius:999px; padding:2px 8px; animation:wt-knipper 1.2s infinite; }
  @keyframes wt-knipper { 50% { opacity:.55; } }
  .rec-lijst { margin:0; padding-left:22px; font-size:13px; color:var(--ink-2); display:flex; flex-direction:column; gap:3px; }
  .rec-lijst li { overflow-wrap:anywhere; }
  .wt-toast { background:color-mix(in srgb, var(--good) 12%, var(--surface)); border:1px solid color-mix(in srgb, var(--good) 35%, var(--surface)); border-radius:var(--radius-ctl); padding:8px 10px; font-size:13px; }
  .wt-toast a { color:var(--accent); cursor:pointer; text-decoration:underline; }
  .wt-chatin { flex:1; min-width:120px; border:1px solid var(--baseline); border-radius:var(--radius-ctl); padding:8px 10px; font:inherit; font-size:13px; min-height:40px; background:var(--surface); outline:0; }
  .runlog { display:flex; flex-direction:column; gap:6px; }
  .rl { display:flex; gap:8px; align-items:center; background:var(--surface); border-radius:10px; padding:6px 8px; box-shadow:var(--shadow-card); font-size:12.5px; }
  .rl .st { width:18px; text-align:center; font-weight:700; } .rl .st.ok { color:var(--good); } .rl .st.failed { color:var(--bad); } .rl .st.healed { color:#b26a00; }
  .rl .tx { flex:1; min-width:0; overflow-wrap:anywhere; } .rl .tx small { display:block; color:var(--muted); }
  .rl img { width:84px; height:52px; object-fit:cover; border-radius:6px; border:1px solid var(--grid); cursor:zoom-in; flex:none; }
  .wt-groot { position:fixed; inset:0; background:rgba(0,0,0,.75); z-index:10; display:flex; align-items:center; justify-content:center; padding:16px; cursor:zoom-out; }
  .wt-groot img { max-width:100%; max-height:100%; border-radius:8px; }
  .voorstel { background:var(--surface); border-radius:var(--radius); padding:10px 12px; box-shadow:var(--shadow-card); font-size:13px; }
  .voorstel li { margin:3px 0; cursor:default; }
  .flow-kop { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
  .flow-kop h4 { font-size:13px; color:var(--ink); }
  #wt-flow { display:none !important; }
  .wt-meld { max-height:220px; }
  #flow-steps .stpage { background:none; border-top:2px solid color-mix(in srgb, #e9a300 55%, var(--surface)); border-radius:0; padding:10px 2px 4px; font-size:13px; color:var(--ink); }
  .stprow[draggable="true"] { cursor:grab; }
  .stprow.sleept { opacity:.45; }
  .stprow.sleepdoel { outline:2px dashed var(--accent); outline-offset:2px; }
  #flow-steps .stins { opacity:0; transition:opacity var(--transition) var(--ease); }
  #flow-steps:hover .stins { opacity:1; }

  /* ===== 1.36: zwart, twee kolommen, kleur per soort stap ===== */
  .wt-card.wt-dark { --page:#000; --surface:#111113; --ink:#fff; --ink-2:#d4d4d8; --muted:#8a8a93; --grid:#26262b; --baseline:#3a3a41; --border:rgba(255,255,255,.12); --accent:#4c8dff; --accent-ink:#fff; }
  .wt-card { --c-in:#4c8dff; --c-kl:#ff9f43; --c-ui:#34d399; --c-pg:#a78bfa; --c-op:#f472b6; --c-he:#22d3ee; }
  .g-in { --g:var(--c-in); } .g-kl { --g:var(--c-kl); } .g-ui { --g:var(--c-ui); } .g-pg { --g:var(--c-pg); } .g-op { --g:var(--c-op); } .g-he { --g:var(--c-he); }
  .wt-body { padding:0 !important; gap:0 !important; overflow:hidden !important; }
  .wt-cols { display:grid; grid-template-columns:minmax(0, 300px) minmax(0, 1fr); height:calc(100vh - 50px); }
  .wt-links, .wt-rechts { overflow-y:auto; overflow-x:hidden; padding:12px; display:flex; flex-direction:column; gap:10px; min-width:0; }
  .wt-links { border-right:1px solid var(--grid); background:var(--page); }
  .wt-rechts { background:var(--page); }
  .wt-card.wt-smal .wt-cols { grid-template-columns:1fr; height:auto; max-height:calc(100vh - 50px); overflow-y:auto; }
  .wt-card.wt-smal .wt-links { border-right:0; border-bottom:1px solid var(--grid); }
  .wt-kop { position:static !important; margin:0 !important; width:auto !important; padding:0 !important; border:0 !important; background:transparent !important; }
  .wt-kop .wt-top { background:var(--surface); border:1px solid var(--grid); box-shadow:none; }
  .wt-tabs { border-bottom:1px solid var(--grid); } .wt-tab { font-size:13px; padding:8px 4px; }
  .wt-head { background:var(--page); border-bottom:1px solid var(--grid); }
  .wt-onb, .wt-coach, #wt-coach, .wt-toast, #wt-phases, .wt-sum, #wt-help { display:none !important; }
  .wt-soorten { grid-template-columns:1fr 1fr; }
  .wt-soorten .sk { border:1px solid var(--grid); border-top:3px solid var(--g); background:var(--surface); }
  .wt-soorten .sk-kop { color:var(--g); border-bottom-color:var(--grid); }
  .wt-soorten .sk-b { color:var(--ink-2); } .wt-soorten .sk-b .ico { color:var(--g); }
  .wt-soorten .sk-b:hover { background:color-mix(in srgb, var(--g) 14%, transparent); color:var(--ink); border-color:transparent; }
  .kaart { background:var(--surface); border-color:var(--grid); }
  .pgblok { background:transparent; border-color:var(--grid); } .pgkop { background:var(--surface); }
  .stprow { background:var(--surface); border:1px solid var(--grid); border-left:4px solid var(--g); }
  .stprow:not(.open):hover { border-color:color-mix(in srgb, var(--g) 60%, var(--grid)); border-left-color:var(--g); }
  .stprow.open { border-color:var(--g); background:color-mix(in srgb, var(--g) 9%, var(--surface)); }
  .stprow.open .stparams { border-top-color:color-mix(in srgb, var(--g) 35%, transparent); color:var(--ink-2); }
  .sticoon { background:color-mix(in srgb, var(--g) 18%, transparent); color:var(--g); }
  .stnum { background:transparent; color:var(--muted); border:1px solid var(--grid); }
  .stdet { color:var(--muted); } .stvb { color:var(--g); }
  .lusblok { border-color:color-mix(in srgb, var(--c-he) 60%, transparent); background:color-mix(in srgb, var(--c-he) 5%, transparent); }
  .luskop, .luscirkel { color:var(--c-he); } .luscirkel { border-color:var(--c-he); background:transparent; }
  .rondeinde { border-color:var(--grid); }
  .wt-num, .wt-modus, select, input.pin { background:var(--surface); color:var(--ink); border-color:var(--baseline); }
  .wt-btn { background:var(--surface); color:var(--ink); border-color:var(--baseline); }
  .wt-btn.alt { background:transparent; color:var(--ink-2); }
  .wt-btn.primary, .wt-btn.run { background:var(--accent); color:#fff; }
  .wt-ask { background:var(--surface) !important; border:1px solid var(--accent) !important; color:var(--ink); }
  code { background:color-mix(in srgb, var(--accent) 16%, transparent); }
  .hint { color:var(--muted); }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></symbol>
  <symbol id="i-hash" viewBox="0 0 24 24"><path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/></symbol>
  <symbol id="i-branch" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10M6 12h4a6 6 0 0 0 6 0"/></symbol>
  <symbol id="i-click2" viewBox="0 0 24 24"><path d="M9 9l10 4-4 2-2 4z"/><path d="M5 2v3M2 5h3M8 3.5L6.5 5M3.5 8L5 6.5"/></symbol>
  <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>
  <symbol id="i-table" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 15h18M9 4v16"/></symbol>
  <symbol id="i-layers" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></symbol>
  <symbol id="i-goto" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-back" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>
  <symbol id="i-repeat" viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></symbol>
  <symbol id="i-flow" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="5" rx="1"/><rect x="13" y="16" width="8" height="5" rx="1"/><path d="M7 8v5a2 2 0 0 0 2 2h4"/></symbol>
  <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17v.5"/></symbol>
  <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></symbol>
  <symbol id="i-flask" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6L4.5 19a1 1 0 0 0 .9 1.5h13.2a1 1 0 0 0 .9-1.5L14 9V3"/></symbol>
  <symbol id="i-ff" viewBox="0 0 24 24"><path d="M4 6l7 6-7 6zM13 6l7 6-7 6z"/></symbol>
  <symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></symbol>
  <symbol id="i-rec" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></symbol>
  <symbol id="i-frame" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></symbol>
  <symbol id="i-grip" viewBox="0 0 24 24"><path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" stroke-width="3"/></symbol>
  <symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
  <symbol id="i-chevron-left" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
  <symbol id="i-hand" viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3 14a1.5 1.5 0 0 1 2.5-1.6L8 15"/></symbol>
  <symbol id="i-dot" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor"/></symbol>
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
<div class="wt-card wt-dark">
  <div class="wt-head"><span class="brand" aria-hidden="true"><svg viewBox="0 0 18 18" width="14" height="14" fill="none"><circle cx="4" cy="4" r="2.2" fill="currentColor"/><circle cx="4" cy="14" r="2.2" fill="currentColor"/><circle cx="14" cy="9" r="2.2" fill="currentColor"/><path d="M4 6.2v5.6M5.9 5.1 12 8M5.9 12.9 12 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><b>ParseLab</b><span class="sp"></span>
    <span class="recbadge" id="wt-recbadge" style="display:none">● Opname</span>
    <button class="wt-ico" id="wt-help" title="Uitleg / rondleiding">` + IC('help') + `</button>
    <button class="wt-ico" id="wt-min" title="Inklappen">` + IC('min') + `</button>
    <button class="wt-ico" id="wt-close" title="Sluiten">` + IC('x') + `</button>
  </div>
  <div class="wt-body">
    <div class="wt-onb" id="wt-onboard" style="display:none"></div>
    <div class="wt-cols"><div class="wt-links">
      <div class="wt-tabs" role="tablist"><button class="wt-tab on" data-tab="rec" role="tab">` + IC('rec', 'ico-sm') + `<span>Opnemen</span></button><button class="wt-tab" data-tab="hand" role="tab">` + IC('hand', 'ico-sm') + `<span>Handmatig</span></button><button class="wt-tab" data-tab="ai" role="tab">` + IC('spark', 'ico-sm') + `<span>AI</span></button></div>
    <div class="wt-pagebar" id="wt-pagebar" style="display:none"></div>
    <div class="wt-ask" id="wt-ask" style="display:none"></div>
    <div class="wt-toast" id="wt-toast" style="display:none"></div>
    <div class="wt-tabpane" id="tab-rec">
      <div class="wt-row wt-primary"><button class="wt-btn rec" id="rec-start">` + IC('rec', 'ico-sm') + `<span>Opname starten</span></button><button class="wt-btn alt" id="rec-stop" disabled>` + IC('stop', 'ico-sm') + `<span>Stop</span></button></div>
      <div class="hint" id="rec-status">Klik op Opname starten en doe je taak op de pagina.</div>
      <ol class="rec-lijst" id="rec-lijst"></ol>
    </div>
    <div class="wt-tabpane" id="tab-hand" style="display:none">
    <div class="wt-coach" id="wt-coach"></div>
    <div class="wt-soorten" id="wt-quick">
      <div class="sk g-in"><div class="sk-kop">` + IC('edit', 'ico-sm') + `<span>Invullen</span></div><button class="sk-b" data-quick="input" title="Elke ronde de volgende regel uit je invoerlijst">` + IC('list', 'ico-sm') + `<span>Lijst aflopen</span></button><button class="sk-b" data-quick="in-vast" title="Elke ronde dezelfde waarde">` + IC('pin', 'ico-sm') + `<span>Standaard&shy;waarde</span></button><button class="sk-b" data-quick="in-op" title="Elke ronde één hoger">` + IC('hash', 'ico-sm') + `<span>Oplopend</span></button><button class="sk-b" data-quick="in-logica" title="Datum, als…dan of formule">` + IC('branch', 'ico-sm') + `<span>Logica</span></button><button class="sk-b" data-quick="in-eerder" title="Een eerder uitgelezen of ingevulde waarde">` + IC('repeat', 'ico-sm') + `<span>Eerder element</span></button><button class="sk-b" data-quick="in-dropdown" title="Dropdown: een vaste keuze of de waarde uit een kolom van je lijst">` + IC('chevron-down', 'ico-sm') + `<span>Dropdown</span></button><button class="sk-b" data-quick="type">` + IC('keyboard', 'ico-sm') + `<span>Tekst typen</span></button></div>
      <div class="sk g-kl"><div class="sk-kop">` + IC('cursor', 'ico-sm') + `<span>Klikken</span></div><button class="sk-b" data-quick="click" title="Een knop of link">` + IC('cursor', 'ico-sm') + `<span>Klik</span></button><button class="sk-b" data-quick="dbl">` + IC('click2', 'ico-sm') + `<span>Dubbelklik</span></button><button class="sk-b" data-quick="hover" title="Muis erboven houden">` + IC('eye', 'ico-sm') + `<span>Hover</span></button><button class="sk-b" data-quick="kl-waarde" title="Zoek de tekst met een waarde en klik daarop">` + IC('search', 'ico-sm') + `<span>Klik op waarde</span></button><button class="sk-b" data-quick="kl-regel" title="Een regel kiest welke knop">` + IC('branch', 'ico-sm') + `<span>Knop via regel</span></button><button class="sk-b" data-quick="kl-loop" title="Elk item in een gebied één voor één">` + IC('repeat', 'ico-sm') + `<span>Items aflopen</span></button></div>
      <div class="sk g-ui"><div class="sk-kop">` + IC('search', 'ico-sm') + `<span>Uitlezen</span></div><button class="sk-b" data-quick="rd-el" title="Eén tekst, prijs of nummer">` + IC('target', 'ico-sm') + `<span>Onderdeel</span></button><button class="sk-b" data-quick="rd-tabel" title="Elke regel een rij">` + IC('table', 'ico-sm') + `<span>Tabel / lijst</span></button><button class="sk-b" data-quick="rd-velden" title="Alle label → waarde-paren">` + IC('layers', 'ico-sm') + `<span>Alle velden</span></button><button class="sk-b" data-quick="rd-pagina">` + IC('doc', 'ico-sm') + `<span>Hele pagina</span></button><button class="sk-b" data-quick="rd-site" title="Alle pagina's van de site">` + IC('globe', 'ico-sm') + `<span>Hele site</span></button><button class="sk-b" data-quick="rd-extern" title="Pagina's van adressen uit je lijst uitlezen, ook van andere websites, zonder ze te openen">` + IC('link', 'ico-sm') + `<span>Andere pagina's</span></button></div>
      <div class="sk g-pg"><div class="sk-kop">` + IC('doc', 'ico-sm') + `<span>Pagina</span></div><button class="sk-b" data-quick="goto" title="Naar een URL die je opgeeft">` + IC('goto', 'ico-sm') + `<span>Ga naar adres</span></button><button class="sk-b" data-quick="nav" title="Terug naar de vorige pagina of de lijst">` + IC('back', 'ico-sm') + `<span>Terug</span></button><button class="sk-b" data-quick="wait">` + IC('clock', 'ico-sm') + `<span>Wachten</span></button><button class="sk-b" data-quick="scrollload" title="Scrollen tot alles er staat">` + IC('move', 'ico-sm') + `<span>Alles laden</span></button></div>
      <div class="sk g-op"><div class="sk-kop">` + IC('save', 'ico-sm') + `<span>Opslaan</span></div><button class="sk-b" data-quick="print" title="Zoals Ctrl+P → Opslaan als PDF">` + IC('printer', 'ico-sm') + `<span>PDF</span></button><button class="sk-b" data-quick="shot" title="Wat je ziet als afbeelding">` + IC('camera', 'ico-sm') + `<span>Screenshot</span></button><button class="sk-b" data-quick="images" title="Alle PDF-koppelingen op de pagina">` + IC('download', 'ico-sm') + `<span>Alle PDF's</span></button></div>
      <div class="sk g-he"><div class="sk-kop">` + IC('repeat', 'ico-sm') + `<span>Herhalen</span></div><button class="sk-b" data-quick="rijlus" title="Alle regels van je lijst die bij deze ronde horen (bv. alle polissen van één klant)">` + IC('list', 'ico-sm') + `<span>Lus: elke regel van de ronde</span></button><button class="sk-b" data-quick="loop" title="Dezelfde stappen voor elk item in een lijst">` + IC('repeat', 'ico-sm') + `<span>Lus: elk item</span></button><button class="sk-b" data-quick="endloop">` + IC('check', 'ico-sm') + `<span>Lus afsluiten</span></button></div>
    </div>
    <div class="wt-site" id="site-box" style="display:none"></div>
    </div>
    <div class="wt-tabpane" id="tab-ai" style="display:none">

      <div class="hint ai-context" id="ai-context" style="display:none"></div>
      <label class="row hint"><input type="checkbox" id="ai-volg" checked> AI volgt het element als de pagina verandert (zelfherstel)</label>
      <div class="wt-pre" id="chat-log" style="max-height:220px">Typ een opdracht of “help”.</div>
      <div class="wt-row"><input id="chat-in" class="wt-chatin" placeholder="Wat moet ParseLab doen? (Enter)"><button class="wt-btn primary" id="chat-send" title="Versturen">` + IC('send') + `</button></div>
      <div id="ai-voorstel"></div>
      <details class="wt-more" id="ai-instel"><summary>🔑 Claude koppelen (optioneel)</summary>
        <div class="hint">Zonder sleutel werkt de chat met vaste opdrachten (typ “help”) en zoekt zelfherstel op gelijkenis. Met je eigen Claude API-sleutel begrijpt de chat gewone taal en herstelt ParseLab ook lastige gevallen. De sleutel blijft op deze computer. Naar Claude gaat alleen een ingekorte lijst elementen (tekst, labels, plaats) — nooit wachtwoorden of de volledige pagina.</div>
        <div class="wt-row"><input id="ai-key" type="password" class="wt-num" style="width:100%" placeholder="sk-ant-…" autocomplete="off"></div>
        <div class="wt-row"><span class="hint">Model</span><select id="ai-model" class="wt-num" style="width:auto"><option value="claude-opus-5-5">Claude Opus 5.5 (standaard)</option><option value="claude-sonnet-5-5">Claude Sonnet 5.5 (sneller)</option><option value="claude-haiku-5-5">Claude Haiku 5.5 (snelst, goedkoopst)</option></select></div>
        <div class="wt-row"><button class="wt-btn" id="ai-save">Opslaan</button><button class="wt-btn alt" id="ai-test">Test verbinding</button><span class="hint" id="ai-status"></span></div>
      </details>
    </div>
    </div><div class="wt-rechts">
    <section class="kaart" id="invoer-kaart">
      <div class="kaartkop">` + IC('table', 'ico-sm') + `<b>Lijst</b><span class="hint" id="lijst-kort">nog geen lijst</span></div>
      <div class="knoprij">
        <button class="wt-btn primary" id="flow-upload" title="Excel (.xlsx), CSV of TXT">` + IC('upload', 'ico-sm') + `<span>Lijst uploaden</span></button>
        <button class="wt-btn" id="flow-zelf" title="Typ je lijst zelf in">` + IC('edit', 'ico-sm') + `<span>Zelf maken</span></button>
        <button class="wt-btn" id="flow-tmpl" title="Excel met een kolom per invoerveld">` + IC('download', 'ico-sm') + `<span>Kolommen (Excel)</span></button>
        <button class="wt-btn alt" id="flow-clearcsv" title="Lijst wissen">` + IC('x', 'ico-sm') + `<span>Wissen</span></button>
      </div>
      <input type="file" id="flow-file" accept=".xlsx,.csv,.txt,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none">
      <div class="instelrij" id="rondekol-rij" style="display:none"><span>Eén ronde per</span><select id="flow-rondekol" class="wt-num"><option value="">regel</option></select></div>
      <div class="hint" id="flow-csvinfo">Geen lijst geladen — de taak draait één keer.</div>
      <details id="lijst-details"><summary class="hint">lijst bekijken / aanpassen</summary><div class="lijstbox" id="lijst-box"></div></details>
    </section>
    <div class="wt-kop">
    <div class="wt-top">
    <div class="wt-phases" id="wt-phases"></div>
      <div class="wt-sum" id="wt-samenvatting">Nog geen stappen.</div>
    <div class="wt-row wt-primary">
      <button class="wt-btn run" id="flow-run">` + IC('play') + ` <span data-i18n="start">Start</span></button>
      <button class="wt-btn alt" id="flow-pause" disabled>` + IC('pause') + ` <span data-i18n="pause">Pauze</span></button>
      <button class="wt-btn alt" id="flow-stop" disabled>` + IC('stop') + ` <span data-i18n="stop">Stop</span></button>
    </div>
    <div class="aantalrij"><span class="hint">Hoe vaak</span>
      <select id="flow-aantal-modus" class="wt-num"><option value="lijst">Lijst afwerken</option><option value="aantal">Aantal keer</option></select>
      <input id="flow-aantal" type="number" min="1" value="1" class="wt-num" style="display:none" title="Hoe vaak de taak wordt uitgevoerd">
      <span class="hint" id="aantal-uitleg"></span></div>
    <div class="aantalrij" id="bron-rij"><span class="hint">Regels uit</span>
      <select id="flow-bron" class="wt-num" title="Waar komen de regels vandaan?"><option value="lijst">de lijst</option><option value="wachtrij">de wachtrij (cloud)</option></select>
      <span class="hint" id="bron-uitleg"></span></div>
    <div class="aantalrij" id="bereik-rij"><span class="hint">Regels</span>
      <select id="flow-bereik" class="wt-num" title="Welke regels van je lijst? Handig om in porties te werken."><option value="alles">alles</option><option value="100">eerste 100</option><option value="500">eerste 500</option><option value="vantot">van … tot …</option></select>
      <span id="bereik-vt" style="display:none"><input id="flow-van" type="number" min="1" value="1" class="wt-num" style="width:64px" title="vanaf regel"> – <input id="flow-tot" type="number" min="1" class="wt-num" style="width:64px" placeholder="eind" title="tot en met regel (leeg = tot het eind)"></span>
      <span class="hint" id="bereik-uitleg"></span></div>
    <div class="aantalrij" id="tussen-rij"><span class="hint">Volgende ronde</span>
      <select id="flow-tussen" class="wt-num" title="Wanneer begint ParseLab aan de volgende regel?">
        <option value="klaar">als de pagina klaar is</option>
        <option value="sec">na een aantal seconden</option>
        <option value="rustig">rustig tempo (pagina klaar + pauze)</option>
        <option value="klik">als ik op Volgende klik</option>
        <option value="direct">meteen</option>
      </select>
      <input id="flow-tussen-sec" type="number" min="1" value="3" class="wt-num" style="display:none;width:64px" title="seconden"><span class="hint" id="tussen-sec-lbl" style="display:none">sec</span></div>
    <select id="flow-modus" class="wt-modus" title="Hoe wil je starten?">
      <option value="alles">▶ Alles automatisch</option>
      <option value="test5">🧪 Test: eerste 5 rondes, daarna vragen</option>
      <option value="stap5">👣 Eerste 5 rondes stap voor stap</option>
      <option value="stap1">👣 Eén testronde stap voor stap</option>
    </select>
    <div class="stapbalk" id="stap-balk" style="display:none"></div>
    <div class="wt-prog" id="flow-progress" style="display:none"></div>
    </div>

    </div>
    <div class="wt-flowblok" id="tab-flow">
    <div class="flow-kop"><h4>` + IC('flow', 'ico-sm') + `<span>Flow</span> <span class="tabn" id="tab-n"></span></h4><span class="hint" id="wt-flowsum"></span></div>
    <div class="knoprij flow-knoppen"><button class="wt-btn alt" id="flow-bewerk">` + IC('edit', 'ico-sm') + `<span>Aanpassen</span></button><button class="wt-btn alt" id="flow-alleweg">` + IC('trash', 'ico-sm') + `<span>Alles verwijderen</span></button><span class="hint" id="flow-uitleg"></span></div>
    <div class="pnav" id="pagina-nav" style="display:none"></div>
    <div class="rnd" id="ronde-box" style="display:none"></div>
    <div class="hint" id="wt-paginas" style="display:none"></div>
    <div class="cloudbalk" id="cloud-balk"><button class="cl-naam" id="cl-naam" title="Naam en map van deze flow">` + IC('folder', 'ico-sm') + `<span class="cl-pad" id="cl-pad"></span><b id="cl-titel">Nieuwe flow</b></button><span class="cl-stat" id="cl-stat"></span><button class="wt-btn alt mini" id="cl-open" title="Je flows (per map)">` + IC('layers', 'ico-sm') + `<span>Flows</span></button><button class="wt-btn alt mini" id="cl-nieuw" title="Nieuwe lege flow">` + IC('plus', 'ico-sm') + `</button></div>
    <div class="cl-paneel" id="cl-paneel" style="display:none"></div>
    <div class="startpg" id="startpg-rij"><span class="startpg-l">` + IC('globe', 'ico-sm') + `<span>Start op</span></span><input id="flow-startUrl" class="wt-num" placeholder="adres van stap 1 (https://…)" title="Elke ronde begint op deze pagina. ParseLab wacht tot hij helemaal geladen is."><button class="mini" id="flow-startUrl-hier" title="Deze pagina">` + IC('target', 'ico-sm') + `</button></div>
    <div class="fc" id="wt-flow"></div>
    <div id="flow-steps"></div>
    </div>
    <section class="kaart" id="resultaat-kaart">
      <div class="kaartkop">` + IC('download', 'ico-sm') + `<b>Resultaat</b><span class="hint">wat ParseLab heeft uitgelezen</span></div>
      <div class="knoprij"><button class="wt-btn" id="flow-zipalles" title="Alle PDF's en screenshots van de laatste ronde, met een map per uniek nummer" disabled>` + IC('folder', 'ico-sm') + `<span>Alles als ZIP</span></button></div>
      <label class="instelrij"><span>Eerste screenshot overslaan</span><input type="checkbox" id="zip-eerste" checked></label>
      <label class="instelrij"><span>Witte/lege screenshots overslaan</span><input type="checkbox" id="zip-wit" checked></label>
      <label class="instelrij"><span>Eerste blad van elke PDF overslaan</span><input type="checkbox" id="pdf-eerste"></label>
      <div class="knoprij"><button class="wt-btn primary" id="flow-download" title="Wat je hebt uitgelezen, als Excel-bestand">` + IC('download', 'ico-sm') + `<span>Download bestand (Excel)</span></button>
        <button class="wt-btn alt" id="flow-csv">CSV</button><button class="wt-btn alt" id="flow-json">JSON</button></div>
      <div class="instelrij"><span>PDF's en screenshots opslaan</span>
        <select id="flow-opslag" class="wt-num">
          <option value="een">alles in één map</option>
          <option value="kolom">per unieke waarde uit kolom…</option>
          <option value="ronde">per ronde een map</option>
          <option value="lus">per lus-item een map</option>
          <option value="pagina">per pagina een map</option>
          <option value="apart">alles los, genummerd</option>
        </select></div>
      <div class="instelrij" id="opslag-kol-rij" style="display:none"><span>Kolom</span><select id="flow-opslag-kol" class="wt-num"></select></div>
      <div class="hint" id="opslag-vb"></div>
      <div class="instelrij"><span>Bestandsnaam</span><input id="flow-pdfnaam" class="wt-num" style="flex:1;min-width:0" placeholder="automatisch" title="Typ een naam (bv. personenauto) en/of klik een kolom erin"></div>
      <div class="wt-row naam-chips" id="pdfnaam-chips" style="gap:4px;flex-wrap:wrap"></div>
      <div class="hint" id="pdfnaam-vb"></div>
      <details class="wt-more" id="flow-logs"><summary>Logboek en meldingen</summary>
        <div class="runlog" id="wt-runlog"><div class="hint">Nog geen ronde gedraaid. Klik bovenaan op <b>Start</b>.</div></div>
        <div class="knoprij"><button class="wt-btn alt" id="log-rapport">` + IC('download', 'ico-sm') + `<span>Rapport opslaan (HTML)</span></button></div>
        <h4>Meldingen</h4>
        <div class="wt-pre wt-meld" id="flow-log">Nog niet gestart.</div>
        <h4>Uitgelezen</h4>
        <div class="wt-pre" id="flow-result">Nog niets uitgelezen.</div>
      </details>
    </section>
    <details class="kaart instel" id="wt-instel"><summary>` + IC('gear', 'ico-sm') + `<b>Instellingen</b></summary>
      <h5>Bestanden</h5>
      <div class="instelrij"><span>Map in Downloads</span><input id="flow-folder" class="wt-num" value="ParseLab"></div>
      <h5>Uitvoeren</h5>
      <div class="instelrij"><span>Als een stap niet lukt</span><select id="flow-onerror" class="wt-num"><option value="skip">ronde overslaan, terug naar stap 1</option><option value="stop">stoppen</option></select></div>
      <div class="instelrij"><span>Opnieuw proberen per stap</span><input type="number" id="flow-retries" class="wt-num" value="1" min="0"></div>
      <div class="instelrij"><span>Pauze tussen rondes (ms)</span><input type="number" id="flow-delay" class="wt-num" value="600" min="0"></div>
      <div class="instelrij"><span>Hele taak herhalen</span><input type="number" id="flow-repeat" class="wt-num" value="1" min="1"></div>
      <label class="instelrij"><span>Elke ronde beginnen op de pagina van stap 1</span><input type="checkbox" id="flow-terugstart" checked></label>
      <label class="instelrij"><span>Bij een fout terug naar het opgeslagen adres</span><input type="checkbox" id="flow-urlherstel" checked></label>
      <label class="instelrij"><span>Schermafbeelding bij elke stap (logboek)</span><input type="checkbox" id="log-shots" checked></label>
      <label class="instelrij"><span>Cookiemeldingen automatisch sluiten</span><input type="checkbox" id="flow-cookies" checked></label>
      <h5>Paneel</h5>
      <div class="instelrij"><span>Grootte</span><select id="wt-size" class="wt-num"><option value="normaal">Normaal</option><option value="groot" selected>Groot</option><option value="extra">Extra groot</option></select></div>
      <div class="knoprij"><button class="wt-btn alt" id="flow-theme">` + IC('moon', 'ico-sm') + `<span>Donker / licht</span></button><button class="wt-btn alt" id="wt-tour">` + IC('help', 'ico-sm') + `<span>Rondleiding</span></button></div>
      <h5>Taak</h5>
      <div class="knoprij"><button class="wt-btn alt" id="flow-check2">` + IC('link', 'ico-sm') + `<span>Controleer koppelingen</span></button><button class="wt-btn alt" id="flow-export">` + IC('download', 'ico-sm') + `<span>Taak exporteren</span></button>
        <label class="wt-btn alt" style="cursor:pointer">` + IC('upload', 'ico-sm') + `<span>Taak importeren</span><input type="file" id="flow-import" accept=".json" style="display:none"></label>
        <button class="wt-btn alt danger" id="flow-delflow">` + IC('trash', 'ico-sm') + `<span>Taak van deze site wissen</span></button></div>
      <div class="hint">De taak wordt vanzelf bewaard. Een taak bevat alleen de stappen; je lijst blijft op deze computer.</div>
    </details>
    </div></div>
    <div class="wt-groot" id="wt-groot" style="display:none"></div>
    <div class="wt-verborgen" hidden style="display:none">
      <button id="flow-add"></button><button id="flow-check"></button><button id="flow-save"></button><button id="flow-scan"></button>
      <div id="flow-fields"></div>
      <div class="addmenu" id="flow-add-menu" style="display:none"><div class="main4">
        <button class="wt-btn alt" data-add="input"><span>` + IC('edit', 'ico-sm') + ` <span data-i18n="m_input">Invullen</span></span><small data-desc="d_input"></small></button>
        <button class="wt-btn alt" data-add="click"><span>` + IC('cursor', 'ico-sm') + ` <span data-i18n="m_click">Klikken</span></span><small data-desc="d_click"></small></button>
        <button class="wt-btn alt" data-add="read"><span>` + IC('search', 'ico-sm') + ` <span data-i18n="m_read">Uitlezen</span></span><small data-desc="d_read"></small></button>
        <button class="wt-btn alt" data-add="wait"><span>` + IC('clock', 'ico-sm') + ` <span data-i18n="m_wait">Wachten</span></span><small data-desc="d_wait"></small></button>
        <button class="wt-btn alt" data-add="print"><span>` + IC('printer', 'ico-sm') + ` <span>PDF opslaan</span></span><small>Zoals Ctrl+P → Opslaan als PDF, in een map naar keuze (ook per klant).</small></button>
        <button class="wt-btn alt" data-add="loop"><span>` + IC('swap', 'ico-sm') + ` <span>Voor elk item (lus)</span></span><small>Dezelfde stappen voor elke regel in een lijst op de pagina.</small></button>
        <button class="wt-btn alt" data-add="nav"><span>` + IC('up', 'ico-sm') + ` <span>Terug / naar pagina</span></span><small>Terug naar de vorige pagina, de lijst, of een vast adres.</small></button>
        <button class="wt-btn alt" data-add="shot"><span>` + IC('camera', 'ico-sm') + ` <span>Schermafbeelding</span></span><small>Wat je nu ziet als afbeelding (PNG).</small></button>
      </div>
      <details id="wt-more-steps"><summary data-i18n="more_steps">Meer</summary>
        <div class="morelist">
          <button class="wt-btn alt" data-add="images"><span>` + IC('download', 'ico-sm') + ` <span data-i18n="m_images">Download alle PDF’s op deze pagina</span></span><small data-desc="d_images"></small></button>
          <button class="wt-btn alt" data-add="type"><span>` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_type">Tekst typen</span></span><small data-desc="d_type"></small></button>
          <button class="wt-btn alt" data-add="key"><span>` + IC('keyboard', 'ico-sm') + ` <span data-i18n="m_key">Toets indrukken</span></span><small data-desc="d_key"></small></button>
          <button class="wt-btn alt" data-add="hover"><span>` + IC('mouse', 'ico-sm') + ` <span data-i18n="m_hover">Muis erboven houden</span></span><small data-desc="d_hover"></small></button>
          <button class="wt-btn alt" data-add="scroll"><span>` + IC('move', 'ico-sm') + ` <span data-i18n="m_scroll">Scrollen</span></span><small data-desc="d_scroll"></small></button>
          <button class="wt-btn alt" data-add="scrollload"><span>` + IC('move', 'ico-sm') + ` <span data-i18n="m_scrollload">Alles laden door te scrollen</span></span><small data-desc="d_scrollload"></small></button>
        </div>
      </details>
    </div>
    </div>
    </div>
    <div class="wt-verborgen" hidden style="display:none">
    <details class="wt-more wt-set" id="wt-settings">
      <summary>` + IC('gear', 'ico-sm') + ` <span data-i18n="settings">Instellingen</span></summary>
      <div class="wt-row">
        <button class="wt-btn alt" id="x-flow-theme">` + IC('moon', 'ico-sm') + ` <span data-i18n="theme">Donker / licht</span></button>
        <button class="wt-btn alt" id="flow-side">` + IC('swap', 'ico-sm') + ` <span data-i18n="side">Links / rechts</span></button>
      </div>
      <div class="wt-row"><span class="hint" data-i18n="lang">Taal</span>
        <select id="wt-lang" class="wt-num" style="width:auto;padding:4px 6px" title="Taal / Language">` +
        Object.keys(LANGS).map(l => '<option value="' + l + '"' + (l === LANG ? ' selected' : '') + '>' + LANGS[l] + '</option>').join('') + `</select></div>
      <div class="wt-row"><span class="hint">Grootte van het paneel</span>
        <select id="x-wt-size" class="wt-num" style="width:auto"><option value="normaal">Normaal</option><option value="groot" selected>Groot</option><option value="extra">Extra groot</option></select>
        <button class="wt-btn alt" id="x-wt-tour">` + IC('help', 'ico-sm') + ` <span>Rondleiding opnieuw</span></button></div>
      <div class="wt-row"><label class="row"><input type="checkbox" id="x-flow-cookies" checked> <span data-i18n="cookies">Cookiemeldingen automatisch sluiten</span></label></div>
      <div class="wt-row"><span class="hint" data-i18n="dl_folder">Map in Downloads</span><input id="x-flow-folder" class="wt-num" style="width:130px" value="ParseLab"></div>
      <div class="hint">Bewijskopieën, gedownloade bestanden en je Excel-bestanden komen in deze map.</div>
    </details>

    <details class="wt-more wt-set" id="wt-adv">
      <summary>` + IC('gear', 'ico-sm') + ` <span data-i18n="advanced">Gevorderd</span></summary>
      <div class="wt-row">
        <span class="hint" data-i18n="repeat">Herhaal de taak</span><input type="number" id="x-flow-repeat" value="1" min="1" class="wt-num">×
        <span class="hint" data-i18n="delay">Pauze tussen regels</span><input type="number" id="x-flow-delay" value="600" class="wt-num"> ms
      </div>
      <div class="wt-row">
        <span class="hint" data-i18n="onerror">Als een regel niet lukt:</span>
        <select id="x-flow-onerror" class="wt-num" style="width:auto;max-width:100%"><option value="skip" data-i18n="err_skip">sla over en ga door (aanbevolen)</option><option value="stop" data-i18n="err_stop">stop</option></select>
      </div>
      <div class="wt-row"><span class="hint" data-i18n="retries">Opnieuw proberen</span><input type="number" id="x-flow-retries" class="wt-num" style="width:56px" value="1" min="0">× per stap</div>
      <div class="hint">Elke stap heeft ook een <b>×</b>-veld om alléén die stap te herhalen (bv. 5× op “Volgende” drukken).</div>
      <div class="wt-row"><span class="hint" data-i18n="dl_group">Sorteer bestanden in mappen op:</span><select id="flow-group" class="wt-num" style="width:auto;max-width:100%"><option value="">(niet sorteren)</option></select></div>
      <div class="hint">Per unieke waarde in die kolom (bv. per relatienummer) komt er een eigen submap.</div>
      <h5 data-i18n="other_formats">Andere formaten</h5>
      <div class="wt-row">
        <button class="wt-btn" id="flow-xlsx">Excel</button>
        <button class="wt-btn" id="x-flow-csv">CSV</button>
        <button class="wt-btn" id="x-flow-json">JSON</button>
        <button class="wt-btn" id="flow-zip">ZIP</button>
        <button class="wt-btn alt" id="flow-copy" data-i18n="copy">Kopieer</button>
      </div>
      <div class="hint">De CSV werkt direct in Excel (Nederlandse instellingen).</div>
      <h5>Doorsturen (webhook)</h5>
      <div class="wt-row"><input id="flow-webhook" class="wt-num" style="width:170px" placeholder="https://…"><button class="wt-btn alt" id="flow-webhook-send"><span data-i18n="webhook_send">Verstuur</span></button>
        <button class="wt-btn alt" data-add="webhook" title="Voegt een stap toe die elke regel doorstuurt">+ <span data-i18n="m_webhook">Regel doorsturen (webhook)</span></button></div>
      <div class="hint" data-desc="d_webhook"></div>
      <h5>Cloud (flows bewaren)</h5>
      <div class="hint">Je flows worden vanzelf bewaard in de cloud (Supabase, EU). Wie dezelfde teamcode heeft, ziet dezelfde flows. Houd de code geheim, want hij werkt als wachtwoord.</div>
      <div class="wt-row"><input id="cl-team" class="wt-num" readonly style="flex:1;min-width:0;font-family:ui-monospace,monospace"><button class="wt-btn alt" id="cl-team-kopie">` + IC('link', 'ico-sm') + ` <span>Kopieer</span></button></div>
      <div class="wt-row"><input id="cl-team-in" class="wt-num" style="flex:1;min-width:0" placeholder="teamcode van een collega"><button class="wt-btn alt" id="cl-team-zet"><span>Koppel</span></button></div>
      <label class="kol">Naam van deze computer (zichtbaar in wachtrij en geschiedenis)<input id="cl-door" class="wt-num" placeholder="bv. Lars laptop"></label>
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
        <button class="wt-btn alt" id="x-flow-export">` + IC('download', 'ico-sm') + ` <span data-i18n="exp_flow">Taakbestand</span></button>
        <label class="wt-btn alt" style="cursor:pointer">` + IC('upload', 'ico-sm') + ` <span data-i18n="importf">Importeer</span><input type="file" id="x-flow-import" accept=".json" style="display:none"></label>
        <button class="wt-btn alt danger" id="x-flow-delflow">` + IC('trash', 'ico-sm') + ` <span data-i18n="del_flow">Taak van deze site wissen</span></button>
      </div>
      <div class="hint">Een taak bevat alleen de stappen. Je lijst en de ingevulde waarden blijven op deze computer.</div>
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
            const el = colEl(m, doc);
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
                try { btn = sub.selector ? qs(sub.selector, doc) : null; } catch (e) {}
                if (!btn && sub.fp) btn = findByFingerprint(sub.fp, doc);
                if (!btn && sub.text) { const t = String(sub.text).toLowerCase(); btn = diepAlles(doc, KNOP_SEL).find(b => !vanOnsZelf(b) && (knopNaam(b) || txt(b) || b.value || '').toLowerCase().includes(t)); }
                if (btn) { klikReeks(knopRond(btn), true); submitted = true; }
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


    // ---- Invoer: per regel uit de lijst, of een vaste waarde; met standaardwaarde als de cel leeg is ----
    // Ingebouwde waarden die elke ronde mee kunnen: ronde (1, 2, 3…) en vandaag.
    function datumNL(d) { const z = n => String(n).padStart(2, '0'); return z(d.getDate()) + '-' + z(d.getMonth() + 1) + '-' + d.getFullYear(); }
    function metVast(ctx) { const c = Object.assign({}, ctx || {}); if (c.ronde == null) c.ronde = 1; if (c.vandaag == null) c.vandaag = datumNL(new Date()); return c; }
    // Invoer volgens een regel: formule/tekst, teller, datum of als … dan … anders.
    // Klopt "als <kolom> <op> <waarde>"? Gebruikt bij logica-invoer en bij knop-kiezen-met-een-regel.
    function voorwaardeKlopt(L, ctx) {
        ctx = metVast(ctx);
        const r = x => { let v = resolveValue(x == null ? '' : x, ctx); if (v != null && /^\{\{[^}]+\}\}$/.test(String(v).trim())) v = ''; return v == null ? '' : String(v); };
        const a = r('{{' + (L.kol || '') + '}}').trim(), b = r(L.waarde).trim();
        const na = parseNum(a), nb = parseNum(b);
        return L.op === 'leeg' ? a === '' : L.op === 'nietleeg' ? a !== '' : L.op === 'is' ? zelfdeWaarde(a, b)
            : L.op === 'nietis' ? !zelfdeWaarde(a, b)
            : L.op === 'bevat' ? bevatWaarde(a, b) : L.op === 'groter' ? (na != null && nb != null && na > nb) : L.op === 'kleiner' ? (na != null && nb != null && na < nb) : false;
    }
    function regelKnop(R, ctx) { for (const x of (R.regels || [])) if (x && x.kol && voorwaardeKlopt(x, ctx)) return +x.knop; return R.anders == null ? -1 : +R.anders; }
    function logicaWaarde(L, ctx) {
        ctx = metVast(ctx);
        const r = x => { let v = resolveValue(x == null ? '' : x, ctx); if (v != null && /^\{\{[^}]+\}\}$/.test(String(v).trim())) v = ''; return v == null ? '' : String(v); };
        if (L.soort === 'teller') { const n = (+L.start || 0) + ((+ctx.ronde || 1) - 1) * (L.stap === '' || L.stap == null ? 1 : +L.stap); const w = String(L.start == null ? '' : L.start).length; return (L.voor || '') + (L.nullen ? String(n).padStart(w, '0') : String(n)) + (L.na || ''); }
        if (L.soort === 'datum') { const d = new Date(); d.setDate(d.getDate() + (+L.dagen || 0)); return datumNL(d); }
        if (L.soort === 'als') return r(voorwaardeKlopt(L, ctx) ? L.dan : L.anders);
        return r(L.expr);
    }
    function waardeVoorVeld(s, ctx) {
        ctx = metVast(ctx);
        if ((s.bron === 'logica' || s.bron === 'oplopend') && s.logica) { const lv = logicaWaarde(s.logica, ctx); return lv === '' && s.standaard ? resolveValue(s.standaard, ctx) : lv; }
        let v = resolveValue(s.value, ctx);
        if (v != null && /^\{\{[^}]+\}\}$/.test(String(v).trim())) v = '';   // kolom staat niet in de lijst
        if ((v == null || String(v).trim() === '') && s.standaard != null && String(s.standaard) !== '') v = resolveValue(s.standaard, ctx);
        return v;
    }
    function invoerKolom(s) { if (s.col) return s.col; const t = /^\{\{([^}]+)\}\}$/.exec(String(s.value || '')); return t ? t[1].trim() : (s.vastCol || ''); }
    // ---- Knop kiezen op basis van een waarde ("klik de knop met de tekst van het klantnummer") ----
    const normTekst = x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().toLowerCase();
    function zichtbaarEl(e) { try { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (_) { return false; } }
    // De "plek": knoppen die op deze lijken, binnen het kleinste blok waar er meerdere van staan.
    function knopGroep(btn) {
        const sig = sigSelector(btn);
        let c = btn.parentElement, binnen = '';
        for (let i = 0; i < 8 && c && c !== doc.body; i++, c = c.parentElement) {
            let n = 0; try { n = c.querySelectorAll(sig).length; } catch (e) {}
            if (n >= 2) { binnen = cssPath(c); break; }
        }
        return { sig, binnen };
    }
    function isLusStart(x) { return !!x && (x.type === 'loop' || x.type === 'loopklik' || x.type === 'rijlus'); }
    // Een "gebied": het blok waarin gezocht wordt (bv. de lijst met verzekeringen onderaan).
    function kiesGebied(el) {
        let n = el;
        for (let i = 0; i < 9 && n && n !== doc.body; i++) {
            let k = 0, t = 0; try { k = diepAlles(n, KNOP_SEL).length; t = Array.from(n.querySelectorAll('*')).filter(d => d.children.length === 0 && txt(d)).length; } catch (e) {}
            if (k >= 2 || t >= 4) break;
            const o = n.parentElement || (n.parentNode && n.parentNode.host) || null; if (!o) break; n = o;
        }
        return n;
    }
    // Items in een gebied: elementen zoals het voorbeeld (sig), anders alle knoppen/links.
    function gebiedItems(g) {
        let root = doc; if (g && g.binnen) { const r = qs(g.binnen); if (!r) return []; root = r; }
        let k = []; if (g && g.sig) { try { k = Array.from(root.querySelectorAll(g.sig)); } catch (e) {} }
        if (!k.length) k = diepAlles(root, KNOP_SEL);
        return k.filter((x, i, a) => a.indexOf(x) === i && !vanOnsZelf(x) && zichtbaarEl(x));
    }
    function knoppenInGroep(g) {
        if (g && g.alles) {   // zoeken in een aangewezen gebied: alle knoppen/links én teksten
            let root = doc; if (g.binnen) { const r = qs(g.binnen); if (!r) return []; root = r; }
            const k = diepAlles(root, KNOP_SEL).concat(Array.from(root.querySelectorAll('*')).filter(d => d.children.length === 0 && txt(d)));
            return k.filter((x, i, a) => a.indexOf(x) === i && !vanOnsZelf(x) && zichtbaarEl(x));
        }
        let root = doc; if (g && g.binnen) { const r = qs(g.binnen); if (r) root = r; }
        let k = []; try { k = g && g.sig ? Array.from(root.querySelectorAll(g.sig)) : []; } catch (e) {}
        if (k.length < 2) k = k.concat(diepAlles(root, KNOP_SEL));
        return k.filter((x, i, a) => a.indexOf(x) === i && !vanOnsZelf(x) && zichtbaarEl(x));
    }
    // Klikdoel bij een gevonden tekst: de knop/link zelf, of anders de knop/link in dezelfde regel.
    function klikDoelVoor(el) {
        const k = knopRond(el); if (k !== el || (el.matches && el.matches(KNOP_SEL))) return k;
        let n = el.parentElement;
        for (let i = 0; i < 5 && n && n !== doc.body; i++, n = n.parentElement) {
            const ks = Array.from(n.querySelectorAll(KNOP_SEL)).filter(zichtbaarEl);
            if (ks.length) return ks[0];
        }
        return el;
    }
    // Naam van een item in een lijst: de eerste tekst in dezelfde regel die niet de knoptekst is
    // (bij "Inboedelverzekering · P-1 · Bekijk" wordt het "Inboedelverzekering").
    function itemNaam(el) {
        const eigen = normTekst(knopTekst(el));
        const rij = el.closest && el.closest('tr, li, [role="row"], .entry, .row, article, .item, .card');
        if (rij) {
            const t = Array.from(rij.querySelectorAll('*')).filter(d => d.children.length === 0 && txt(d) && !el.contains(d) && normTekst(txt(d)) !== eigen && !(d.tagName === 'A' && txt(d).length <= 2)).map(d => txt(d))[0];
            if (t) return t.slice(0, 80);
        }
        return knopTekst(el);
    }
    // "Altijd deze knop": de knop op dezelfde plek, wat er ook op staat. Eerst het structuurpad,
    // dan het volledige pad, dan het zoveelste item van dezelfde soort op die plek — nooit op tekst.
    function doelOpPositie(s) {
        const p = s.positie || {};
        let el = null;
        try { el = s.selector ? qs(s.selector) : null; } catch (e) {}
        if (!el && p.pad) { try { el = qs(p.pad); } catch (e) {} }
        if (!el && s.groep && s.groep.binnen && p.nr != null) el = knoppenInGroep(s.groep)[p.nr] || null;   // alleen binnen een vast gebied
        return el;
    }
    function knopTekst(k) { return (knopNaam(k) || txt(k) || k.value || '').toString(); }
    // ---- Op een WAARDE klikken: zoek de tekst (niet een knop) en klik op de klikbare plek eromheen ----
    function isKlikbaar(e) {
        if (!e || e.nodeType !== 1) return false;
        try { if (e.matches(KNOP_SEL + ',[tabindex]:not([tabindex="-1"]),[onclick],[ng-click],[data-ng-click],label[for],option')) return true; } catch (_) {}
        if (isKnopTag(e)) return true;
        try { if (getComputedStyle(e).cursor === 'pointer') return true; } catch (_) {}
        return false;
    }
    // De plek om te klikken bij een gevonden tekst: de tekst zelf of de dichtstbijzijnde klikbare
    // ouder (link, knop, aanklikbare regel); anders de knop/link in dezelfde regel; anders de tekst
    // zelf (de klik "bubbelt" dan door naar een eventuele klik-afhandeling van de regel).
    function omhoog(n) { return n.parentElement || (n.parentNode && n.parentNode.host) || null; }
    function klikZone(el) {
        let n = el;
        for (let i = 0; i < 8 && n && n !== doc.body && n !== doc.documentElement; i++, n = omhoog(n)) {
            try { if (n.matches(KNOP_SEL) || isKnopTag(n)) return n; } catch (_) {}
        }
        n = el;
        for (let i = 0; i < 7 && n && n !== doc.body && n !== doc.documentElement; i++, n = omhoog(n)) {
            if (isKlikbaar(n)) return n;
        }
        const rij = el.closest && el.closest('tr, li, [role="row"], .entry, .row, .card, article, .item');
        if (rij) { const k = Array.from(rij.querySelectorAll(KNOP_SEL)).filter(zichtbaarEl)[0]; if (k) return k; }
        return el;
    }
    const OVERSLAAN = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|INPUT|TEXTAREA|SELECT|svg|path)$/i;
    function knopMetWaarde(g, waarde, hoe) {
        const w = normTekst(waarde);
        let root = doc.body || doc.documentElement;
        if (g && g.binnen) { const r = qs(g.binnen); if (r) root = r; }
        if (!w) return { el: null, klik: null, opties: [] };
        const bevat = hoe === 'bevat';
        const wEsc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const w0 = nulVrij(w);   // nummer? dan mogen er voorloopnullen voor staan (865358741 = 0865358741)
        const heelWoord = new RegExp('(^|[^0-9a-zà-ÿ])' + (w0 != null ? '0*' + w0 : wEsc) + '($|[^0-9a-zà-ÿ])', 'i');
        const treffers = [];
        diepAlles(root, '*').forEach(e => {
            if (OVERSLAAN.test(e.tagName) || vanOnsZelf(e) || (window.__wtHost && (e === window.__wtHost))) return;
            const t = normTekst(txt(e)); const lab = (e.matches && e.matches(KNOP_SEL)) ? normTekst(knopNaam(e)) : '';
            if (!t && !lab) return;
            if (t.length > 300 && !lab) return;
            const exact = t === w || lab === w || (w0 != null && (nulVrij(t) === w0 || nulVrij(lab) === w0));
            const woord = !exact && ((t.length <= 80 && heelWoord.test(t)) || heelWoord.test(lab));
            const deels = !exact && !woord && bevat && (bevatWaarde(t, w) || bevatWaarde(lab, w));
            if (!exact && !woord && !deels) return;
            if (!zichtbaarEl(e)) return;
            treffers.push({ e, exact, woord, len: t.length });
        });
        // Alleen de kleinste treffers (geen ouder van een andere treffer).
        const klein = treffers.filter(a => !treffers.some(b => b !== a && a.e.contains(b.e)));
        klein.forEach(a => { a.zone = klikZone(a.e); const knop = a.zone && a.zone.matches && (a.zone.matches(KNOP_SEL) || isKnopTag(a.zone)); a.score = (a.exact ? 100 : a.woord ? 70 : 40) + (knop ? 35 : (a.zone !== a.e || isKlikbaar(a.e) ? 25 : 0)) - Math.min(a.len, 200) / 10; });
        klein.sort((a, b) => b.score - a.score);
        const best = klein[0];
        const opties = diepAlles(root, KNOP_SEL).filter(x => !vanOnsZelf(x) && zichtbaarEl(x)).map(x => knopTekst(x)).filter(Boolean).slice(0, 8);
        let klik = best ? best.zone : null;
        if (best && klik && !isKlikbaar(klik) && !(klik.matches && (klik.matches(KNOP_SEL) || isKnopTag(klik)))) {
            for (let n = best.e.parentElement, d = 0; n && n !== doc.body && d < 6; n = n.parentElement, d++) {
                const ks = diepAlles(n, KNOP_SEL).filter(x => !vanOnsZelf(x) && zichtbaarEl(x));
                if (ks.length === 1) { klik = ks[0]; break; }
                if (ks.length > 1) break;
            }
        }
        return { el: best ? best.e : null, klik, opties, aantal: klein.length };
    }

    // ============================================================ vingerafdruk met meerdere strategieën
    // Per element bewaren we meerdere manieren om het terug te vinden (id/testid, rol + naam,
    // zichtbare tekst, label, plaats). Faalt het pad, dan zoekt "zelfherstel" hiermee opnieuw.
    function rolVan(el) {
        const r = el.getAttribute && el.getAttribute('role'); if (r) return r;
        const t = el.tagName;
        if (t === 'BUTTON' || (t === 'INPUT' && /^(button|submit|reset)$/i.test(el.type)) || isKnopTag(el)) return 'button';
        if (t === 'A') return 'link';
        if (t === 'SELECT') return 'combobox';
        if (t === 'INPUT' || t === 'TEXTAREA') return /^(checkbox|radio)$/i.test(el.type || '') ? el.type.toLowerCase() : 'textbox';
        return '';
    }
    function maakStrat(el) {
        if (!el || el.nodeType !== 1) return null;
        let lab = ''; try { lab = (el.matches('input,select,textarea') ? cleanCol(fieldLabel(el)) : labelBijWaarde(el)) || ''; } catch (e) {}
        let bbox = null; try { const r = el.getBoundingClientRect(); bbox = [Math.round(r.left), Math.round(r.top + (window.scrollY || 0)), Math.round(r.width), Math.round(r.height)]; } catch (e) {}
        const g = n => (el.getAttribute && el.getAttribute(n)) || '';
        return { id: el.id && !looksGenerated(el.id) ? el.id : '', testid: g('data-testid') || g('data-test') || g('data-qa'), rol: rolVan(el), naam: (knopNaam(el) || '').slice(0, 80),
            tekst: txt(el).slice(0, 80), tag: el.tagName.toLowerCase(), label: String(lab).slice(0, 60), ph: g('placeholder').slice(0, 60), name: g('name').slice(0, 60), bbox };
    }
    function gelijkenis(a, b) {
        a = normTekst(a); b = normTekst(b); if (!a || !b) return 0; if (a === b) return 1;
        if (a.includes(b) || b.includes(a)) return 0.55 + 0.4 * Math.min(a.length, b.length) / Math.max(a.length, b.length);
        const A = new Set(a.split(/[^0-9a-zà-ÿ]+/).filter(Boolean)), B = new Set(b.split(/[^0-9a-zà-ÿ]+/).filter(Boolean));
        let i = 0; A.forEach(x => { if (B.has(x)) i++; }); const u = A.size + B.size - i; return u ? 0.8 * i / u : 0;
    }
    // Zelfherstel stap 2: fuzzy zoeken op de vingerafdruk. Geeft {el, score (0–1), via}.
    function zoekOpStrategie(st) {
        if (!st) return null;
        try {
            if (st.testid) { const e = diepAlles(doc, '[data-testid="' + CSS.escape(st.testid) + '"],[data-test="' + CSS.escape(st.testid) + '"],[data-qa="' + CSS.escape(st.testid) + '"]').find(zichtbaarEl); if (e) return { el: e, score: 0.98, via: 'data-testid' }; }
            if (st.id) { const e = diepAlles(doc, '#' + CSS.escape(st.id)).find(zichtbaarEl); if (e) return { el: e, score: 0.95, via: 'id' }; }
        } catch (e) {}
        const veld = /^(textbox|combobox|checkbox|radio|searchbox)$/.test(st.rol || '');
        const sel = veld ? 'input,select,textarea,[role="combobox"],[role="textbox"],[contenteditable="true"]' : KNOP_SEL + ',[role],[tabindex],[onclick]' + (st.tag && /^[a-z][a-z0-9-]*$/.test(st.tag) ? ',' + st.tag : '');
        let best = null;
        diepAlles(doc, sel).forEach(e => {
            if (vanOnsZelf(e) || !zichtbaarEl(e)) return;
            const m = maakStrat(e); if (!m) return;
            let sc = 0, max = 0;
            const telOp = (w, v) => { max += w; sc += w * v; };
            if (st.naam) telOp(0.45, gelijkenis(st.naam, m.naam || m.tekst));
            if (st.tekst && st.tekst !== st.naam) telOp(0.2, gelijkenis(st.tekst, m.tekst));
            if (st.label) telOp(0.3, gelijkenis(st.label, m.label));
            if (st.ph) telOp(0.1, gelijkenis(st.ph, m.ph));
            if (st.name) telOp(0.15, st.name === m.name ? 1 : 0);
            if (st.rol) telOp(0.12, st.rol === m.rol ? 1 : 0);
            if (st.tag) telOp(0.08, st.tag === m.tag ? 1 : 0);
            if (st.bbox && m.bbox) { const d = Math.hypot(st.bbox[0] - m.bbox[0], st.bbox[1] - m.bbox[1]); telOp(0.06, Math.max(0, 1 - d / 800)); }
            const score = max ? sc / max : 0;
            if (!best || score > best.score) best = { el: e, score, via: 'gelijkenis' };
        });
        return best;
    }
    // Kandidaten voor herstel/chat met Claude: compact, met tijdelijke nummers. Nooit volledige HTML.
    function kandidatenLijst(max) {
        const els = diepAlles(doc, KNOP_SEL + ',input,select,textarea,[role],[tabindex],label,h1,h2,h3,h4,th,td,li,dt,dd,span,p')
            .filter(e => !vanOnsZelf(e) && !(window.__wtHost && window.__wtHost.contains(e)) && zichtbaarEl(e) && (e.matches('input,select,textarea') || (txt(e) && txt(e).length <= 120 && e.children.length <= 3)));
        const interactief = els.filter(e => e.matches(KNOP_SEL + ',input,select,textarea,[role],[tabindex]'));
        const rest = els.filter(e => interactief.indexOf(e) < 0);
        const lijst = interactief.concat(rest).slice(0, max || 250);
        return { els: lijst, data: lijst.map((e, i) => { const m = maakStrat(e); return { id: i, tag: m.tag, rol: m.rol, tekst: m.tekst.slice(0, 60), naam: m.naam.slice(0, 60), label: m.label, placeholder: m.ph, bbox: m.bbox }; }) };
    }

    // ============================================================ opnemen (recorder)
    // Luistert naar klikken, invoer en Enter op de pagina en maakt er "opnames" van. Werkt in de
    // pagina zelf en (via de helper) in kaders. Ruis gaat er meteen uit: typen wordt één invoer,
    // focus-klikken op velden tellen niet als klik.
    let REC = null;
    function isVanParseLab(e) {
        try { const pad = e.composedPath ? e.composedPath() : []; if (window.__wtHost && pad.indexOf(window.__wtHost) >= 0) return true; } catch (_) {}
        const t = echtDoel(e); return !t || vanOnsZelf(t);
    }
    const VELD_SEL = 'input:not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=hidden]),textarea,select';
    function recFlushVeld(enter) {
        if (!REC || !REC.veld) return;
        const f = REC.veld; REC.veld = null; clearTimeout(REC.timer);
        let d = null; try { d = beschrijfVoorStap(f, 'input'); } catch (e) { return; }
        const geheim = (f.type || '').toLowerCase() === 'password';
        const waarde = geheim ? '' : (/^(checkbox|radio)$/i.test(f.type || '') ? (f.checked ? 'ja' : 'nee') : String(f.value == null ? '' : f.value));
        REC.stuur({ soort: 'invoer', d, waarde, geheim, enter: !!enter, strat: maakStrat(f) });
    }
    function recStart(stuur) {
        if (REC) return;
        REC = { stuur, veld: null, timer: null };
        REC.click = e => {
            if (!e.isTrusted || isVanParseLab(e)) return;
            const t = echtDoel(e);
            if (t.matches && t.matches(VELD_SEL + ',option,label')) return;   // focus op een veld: dat wordt een invoer-stap
            recFlushVeld(false);
            let d = null; try { d = beschrijfVoorStap(klikZone(t), 'click'); if (d && d.gebied) d = { selector: cssPath(t), fp: fingerprint(t), naam: (txt(t) || t.tagName.toLowerCase()).slice(0, 40), positie: { pad: cssPath(t) } }; } catch (err) { return; }
            REC.stuur({ soort: 'klik', d, strat: maakStrat(knopRond(t)) });
        };
        REC.invoer = e => {
            if (!e.isTrusted || isVanParseLab(e)) return;
            const t = echtDoel(e); if (!t.matches || !t.matches(VELD_SEL)) return;
            if (REC.veld && REC.veld !== t) recFlushVeld(false);
            REC.veld = t; clearTimeout(REC.timer);
            if (e.type === 'change' && (t.tagName === 'SELECT' || /^(checkbox|radio)$/i.test(t.type || ''))) recFlushVeld(false);
            else REC.timer = setTimeout(() => recFlushVeld(false), 1500);
        };
        REC.toets = e => {
            if (!e.isTrusted || isVanParseLab(e)) return;
            if ((e.ctrlKey || e.metaKey) && /^p$/i.test(e.key)) { e.preventDefault(); e.stopPropagation(); recFlushVeld(false); REC.stuur({ soort: 'pdf' }); return; }
            if (e.key === 'PrintScreen' || ((e.metaKey || e.ctrlKey) && e.shiftKey && /^[345s]$/i.test(e.key))) { recFlushVeld(false); REC.stuur({ soort: 'foto' }); return; }
            if (e.key !== 'Enter') return;
            const t = echtDoel(e); if (t && t.matches && t.matches('input')) { REC.veld = t; recFlushVeld(true); }
        };
        doc.addEventListener('click', REC.click, true);
        doc.addEventListener('input', REC.invoer, true);
        doc.addEventListener('change', REC.invoer, true);
        doc.addEventListener('keydown', REC.toets, true);
        REC.dubbel = e => { if (e.isTrusted && !isVanParseLab(e)) REC.stuur({ soort: 'dubbel' }); };
        REC.los = e => { if (e.isTrusted && e.key === 'PrintScreen' && !isVanParseLab(e)) REC.stuur({ soort: 'foto' }); };   // Windows meldt PrintScreen alleen bij loslaten
        doc.addEventListener('dblclick', REC.dubbel, true); doc.addEventListener('keyup', REC.los, true);
    }
    function recStop() {
        if (!REC) return;
        recFlushVeld(false);
        doc.removeEventListener('click', REC.click, true); doc.removeEventListener('input', REC.invoer, true);
        doc.removeEventListener('change', REC.invoer, true); doc.removeEventListener('keydown', REC.toets, true);
        doc.removeEventListener('dblclick', REC.dubbel, true); doc.removeEventListener('keyup', REC.los, true);
        REC = null;
    }

    // ============================================================ kader-helper (iframe)
    // Het paneel staat in de buitenste pagina. In een kader (iframe) — bv. de polisgegevens in
    // Cockpit — draait alleen deze helper: hij laat je daar aanwijzen en voert stappen uit
    // (klikken, uitlezen, invullen, wachten). Opdrachten komen ALLEEN via de extensie zelf
    // binnen (chrome.runtime), nooit via de pagina.
    function beschrijfVoorStap(el, kind) {
        const naam = (txt(el) || (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'))) || el.tagName.toLowerCase()).slice(0, 40);
        if (kind === 'click') {
            const b = knopRond(el);
            const isKnop = b !== el || (el.matches && el.matches(KNOP_SEL)) || isKnopTag(el);
            if (!isKnop) {
                // In een gebied geklikt (niet op een knop): welke knoppen staan hier?
                let g = el, ks = [];
                for (let i = 0; i < 9 && g && g !== doc.documentElement; i++, g = (g.parentElement || (g.parentNode && g.parentNode.host) || null)) { ks = diepAlles(g, KNOP_SEL).filter(x => !vanOnsZelf(x) && zichtbaarEl(x)); if (ks.length) break; }
                if (ks.length >= 2) {
                    const gebiedSel = cssPath(g), sigKnop = sigSelector(ks[0]);
                    const groep = { binnen: gebiedSel, sig: sigKnop };
                    const zus = knoppenInGroep(groep);
                    return { gebied: true, gebiedSel, n: ks.length, naam: (txt(g) || '').slice(0, 40), groep, groepN: zus.length, itemNamen: zus.map(itemNaam).filter(Boolean).slice(0, 8),
                        knoppen: ks.slice(0, 30).map(k => { const kw = kernWaarde(itemBlok(k, ks)); return { selector: stableSel(k), fp: fingerprint(k), naam: (knopTekst(k) || k.tagName.toLowerCase()).slice(0, 40), regel: itemNaam(k).slice(0, 40), waarde: kw.waarde, label: kw.label, titel: kw.titel, positie: { pad: cssPath(k), nr: ks.indexOf(k) }, groep: { binnen: gebiedSel } }; }) };
                }
                if (ks.length === 1) { const k = ks[0], gg = knopGroep(k), zz = knoppenInGroep(gg); return { selector: stableSel(k), fp: fingerprint(k), naam: (knopTekst(k) || naam).slice(0, 40), groep: gg, positie: { pad: cssPath(k), nr: zz.indexOf(k) }, groepN: zz.length, itemNamen: zz.map(itemNaam).slice(0, 8) }; }
            }
            const groep = knopGroep(b), zus = knoppenInGroep(groep);
            return { selector: stableSel(b), fp: fingerprint(b), strat: maakStrat(b), naam: (knopNaam(b) || naam).slice(0, 40), groep, positie: { pad: cssPath(b), nr: zus.indexOf(b) }, groepN: zus.length, groepTeksten: zus.map(knopTekst).filter(Boolean).slice(0, 8), itemNamen: zus.map(itemNaam).filter(Boolean).slice(0, 8) };
        }
        if (kind === 'gebied') {
            const g = kiesGebied(el), items = diepAlles(g, KNOP_SEL).filter(zichtbaarEl);
            return { selector: cssPath(g), fp: fingerprint(g), naam: (txt(g) || '').slice(0, 40), n: items.length, teksten: items.map(knopTekst).filter(Boolean).slice(0, 8) };
        }
        if (kind === 'input') {
            const f = resolveField(el) || el;
            const soort = f.tagName === 'SELECT' || isPopupSelect(f) ? 'keuzelijst' : (f.tagName === 'INPUT' && (f.type === 'date' || isMaskLike(f.placeholder || ''))) ? 'datum' : 'tekstveld';
            const lbl = cleanCol(fieldLabel(f)) || (f.name && !looksGenerated(f.name) ? cleanCol(f.name) : '') || 'veld';
            return { selector: stableSel(f), fp: fingerprint(f), strat: maakStrat(f), soort, col: lbl.slice(0, 40), isVeld: !!(f.matches && f.matches('input,select,textarea')) };
        }
        if (kind === 'read' || kind === 'loopitem') {
            const attr = el.tagName === 'A' ? 'href' : (el.tagName === 'IMG' ? 'src' : 'text');
            const det = autoDetectList(el);
            let voorbeeld = '';
            if (det) { try { const rec = doc.querySelector(det.sig); if (rec) voorbeeld = det.columns.slice(0, 4).map(c => { const v = readField(rec, c); return v ? c.name + ': ' + String(v).slice(0, 30) : ''; }).filter(Boolean).join(' · '); } catch (e) {} }
            const pairSpec = zoekParen(el) || (det && lijktPaar(det) ? { sig: det.sig, count: det.count } : null);
            const paren = pairSpec ? scrapePairs(pairSpec) : null;
            return { selector: cssPath(el), fp: fingerprint(el), attr, waarde: String(readValue(el, attr) == null ? '' : readValue(el, attr)).slice(0, 80), label: labelBijWaarde(el), naam,
                det: det ? { sig: det.sig, columns: det.columns, count: det.count } : null, pairSpec, voorbeeld, paren: paren ? Object.keys(paren).slice(0, 40) : null, parenVb: paren ? Object.entries(paren).slice(0, 3).map(([k, v]) => k + ': ' + String(v).slice(0, 25)).join(' · ') : '' };
        }
        return { selector: cssPath(el), fp: fingerprint(el), naam };
    }
    function drukEnter(el) {
        const opties = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
        const neer = new KeyboardEvent('keydown', opties); el.dispatchEvent(neer);
        el.dispatchEvent(new KeyboardEvent('keypress', opties)); el.dispatchEvent(new KeyboardEvent('keyup', opties));
        try { if (!neer.defaultPrevented && el.form) { el.form.requestSubmit ? el.form.requestSubmit() : el.form.submit(); } } catch (e) {}
    }
    async function wachtOpDoel(s, ms) { let el = targetEl(s); for (const t0 = Date.now(); !el && Date.now() - t0 < (ms || 5000); ) { await sleep(250); el = targetEl(s); } return el; }
    async function voerUitInKader(s, ctx) {
        ctx = ctx || {};
        if (s.type === 'gebiedtel') { const its = gebiedItems({ binnen: s.gebied, sig: s.sig }); return { ok: true, n: its.length, teksten: its.map(itemNaam).slice(0, 8) }; }
        if (s.type === 'gebiedklik') {
            const its = gebiedItems({ binnen: s.gebied, sig: s.sig }); const el = its[s.nr];
            if (!el) return { ok: false, err: 'item ' + (s.nr + 1) + ' niet gevonden' };
            return { ok: true, tekst: itemNaam(el), _klik: knopRond(el) };
        }
        if (s.type === 'click' && s.match) {
            let r = knopMetWaarde(s.groep, s.match.waardeNu, s.match.hoe);
            for (const t0 = Date.now(); !r.el && Date.now() - t0 < 5000; ) { await sleep(300); r = knopMetWaarde(s.groep, s.match.waardeNu, s.match.hoe); }
            if (!r.el) return { ok: false, err: 'de waarde “' + s.match.waardeNu + '” staat niet in het kader (wel klikbaar: ' + r.opties.join(', ') + ')' };
            if (s.alleenTesten) { try { r.el.scrollIntoView({ block: 'center' }); } catch (e) {} return { ok: true, tekst: knopTekst(r.el) }; }
            return { ok: true, tekst: txt(r.el).slice(0, 60), _klik: r.klik };
        }
        if (s.type === 'click' && s.positie) {
            let el = doelOpPositie(s); for (const t0 = Date.now(); !el && Date.now() - t0 < 5000; ) { await sleep(250); el = doelOpPositie(s); }
            if (!el) return { ok: false, err: 'knop niet gevonden op die plek in het kader' };
            return { ok: true, tekst: knopTekst(el), _klik: knopRond(el) };
        }
        if (s.type === 'highlightpos') { const el = doelOpPositie(s); return { ok: !!el }; }
        if (s.type === 'click') {
            let el = await wachtOpDoel(s, 5000); if (!el) return { ok: false, err: 'knop niet gevonden in het kader' };
            return { ok: true, _klik: knopRond(el) };
        }
        if (s.type === 'scrape') {
            if (s.kind === 'list') { for (const t0 = Date.now(); !doc.querySelector(s.spec.sig) && Date.now() - t0 < 5000; ) await sleep(250); return { ok: true, key: s.col || s.name, val: scrapeList(s.spec) }; }
            if (s.kind === 'pairs') { for (const t0 = Date.now(); !doc.querySelector(s.spec.sig) && Date.now() - t0 < 5000; ) await sleep(250); const m = scrapePairs(s.spec); return { ok: Object.keys(m).length > 0, merge: m, n: Object.keys(m).length }; }
            const el = await wachtOpDoel(s, 5000); let v = el ? readValue(el, s.attr) : null;
            v = applyTransform(v, s.transform); if (s.num && s.transform && s.transform.mode === 'regex') v = applyTransform(v, { mode: 'number' });
            return { ok: true, key: s.col || s.name, val: v };
        }
        if (s.type === 'setval' || s.type === 'select') {
            const el = await wachtOpDoel(s, 5000); if (!el) return { ok: false, err: 'veld niet gevonden in het kader' };
            const val = waardeVoorVeld(s, ctx);
            if (s.skipEmpty !== false && (val == null || String(val).trim() === '')) return { ok: true, leeg: true };
            await fillElement(el, val);
            if (s.enterNa) drukEnter(el);
            return { ok: true, val: String(val) };
        }
        if (s.type === 'hover') { const el = await wachtOpDoel(s, 3000); if (!el) return { ok: false }; ['mouseover', 'mouseenter', 'mousemove'].forEach(t => el.dispatchEvent(new MouseEvent(t, { bubbles: true }))); return { ok: true }; }
        if (s.type === 'wait' || s.type === 'waitfor' || s.type === 'exists') { const el = await wachtOpDoel(s, s.type === 'exists' ? 300 : Math.max(500, +s.ms || +s.timeout || 8000)); return { ok: !!el }; }
        return { ok: false, err: 'stap kan niet in een kader' };
    }
    function startKaderHelper() {
        if (window.__PL_AGENT__) return; window.__PL_AGENT__ = true;
        let pickKind = null, laatste = null;
        const ovl = doc.createElement('div');
        ovl.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483647;border:2px solid #2a78d6;background:rgba(42,120,214,.08);border-radius:6px;box-sizing:border-box;display:none;margin:0;padding:0;';
        const lbl = doc.createElement('div'); lbl.style.cssText = 'position:absolute;left:-2px;top:-20px;background:#2a78d6;color:#fff;font:600 11px/1 system-ui,sans-serif;padding:3px 7px;border-radius:999px;white-space:nowrap;';
        ovl.appendChild(lbl);
        const css = doc.createElement('style'); css.textContent = 'html.wt-picking, html.wt-picking * { cursor: crosshair !important; }';
        const plaats = () => { if (!ovl.isConnected) (doc.body || doc.documentElement).appendChild(ovl); if (!css.isConnected) (doc.head || doc.documentElement).appendChild(css); };
        const toon = (el, tekst, ms) => {
            plaats(); const r = el.getBoundingClientRect();
            Object.assign(ovl.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', display: 'block' });
            lbl.textContent = tekst || ''; lbl.style.top = (r.top < 24 ? r.height + 2 : -20) + 'px';
            if (ms) setTimeout(() => { if (!pickKind) ovl.style.display = 'none'; }, ms);
        };
        const stuur = m => { try { chrome.runtime.sendMessage(Object.assign({ type: 'pl-agent-event', url: location.href }, m)); } catch (e) {} };
        const stop = () => { pickKind = null; laatste = null; ovl.style.display = 'none'; try { doc.documentElement.classList.remove('wt-picking'); } catch (e) {} };
        const doel = e => { const t = echtDoel(e); return t === ovl || ovl.contains(t) ? null : t; };
        doc.addEventListener('mousemove', e => {
            if (!pickKind) return; const t = doel(e); if (!t || t === laatste) return; laatste = t;
            let d = t.tagName.toLowerCase(); if (t.id) d += '#' + t.id; else if (t.classList && t.classList[0]) d += '.' + t.classList[0];
            const r = t.getBoundingClientRect(); toon(t, 'kader · ' + d + ' · ' + Math.round(r.width) + '×' + Math.round(r.height));
        }, true);
        ['pointerdown', 'mousedown', 'mouseup'].forEach(n => doc.addEventListener(n, e => { if (pickKind && e.isTrusted) { e.preventDefault(); e.stopPropagation(); } }, true));
        doc.addEventListener('click', e => {
            if (!pickKind || !e.isTrusted) return; const t = doel(e); if (!t) return;
            e.preventDefault(); e.stopPropagation();
            let desc = null; try { desc = beschrijfVoorStap(t, pickKind); } catch (err) { desc = { fout: String(err && err.message || err) }; }
            stop(); stuur({ ev: 'picked', desc });
        }, true);
        doc.addEventListener('keydown', e => { if (pickKind && e.key === 'Escape') { stop(); stuur({ ev: 'cancel' }); } }, true);
        chrome.runtime.onMessage.addListener((m, sender, send) => {
            if (!m || m.type !== 'pl-agent') return;
            if (m.cmd === 'ping') { send({ ok: true, url: location.href }); return; }
            if (m.cmd === 'pickStart') { pickKind = m.kind || 'any'; laatste = null; plaats(); try { doc.documentElement.classList.add('wt-picking'); } catch (e) {} send({ ok: true }); return; }
            if (m.cmd === 'pickEnd') { stop(); send({ ok: true }); return; }
            if (m.cmd === 'recStart') { recStart(op => stuur({ ev: 'rec', op })); send({ ok: true }); return; }
            if (m.cmd === 'recStop') { recStop(); send({ ok: true }); return; }
            if (m.cmd === 'highlight') { const el = targetEl(m.step); if (el) { try { el.scrollIntoView({ block: 'center' }); } catch (e) {} toon(el, 'gekoppeld element', 1800); } send({ ok: !!el }); return; }
            if (m.cmd === 'run') {
                voerUitInKader(m.step, m.ctx).then(r => {
                    const k = r && r._klik; if (r) delete r._klik; const dub = m.step && m.step.dubbel;
                    send(r);
                    // Pas NA het antwoord klikken: laadt het kader daardoor een nieuwe pagina, dan is
                    // het antwoord al onderweg.
                    if (k) setTimeout(() => { try { klikStap({ dubbel: dub }, k); } catch (e) {} }, 30);
                }, err => send({ ok: false, err: String(err && err.message || err) }));
                return true;
            }
        });
    }

    // In een kader (iframe): alleen de helper, nooit een paneel.
    let IN_KADER = false; try { IN_KADER = window.top !== window; } catch (e) { IN_KADER = true; }
    if (IN_KADER) { if (IS_EXT) startKaderHelper(); }
    else if (!window.__WT_BOOTED__) {
        window.__WT_BOOTED__ = true;
        if (!IS_EXT) {
            buildPanel();   // los bestand / test: meteen tonen
        } else {
            getActive(a => { if (a) buildPanel(); else maybeBadge(); });
            try {
                chrome.runtime.onMessage.addListener((m, sender, send) => {
                if (!m) return;
                // Het achtergrondscript vraagt hiermee of het paneel hier al draait en openstaat,
                // zodat een klik op het icoon altijd de goede kant op klapt.
                if (m.type === 'wt-ping') { try { send({ ok: true, open: !!window.__WT_PANEL__ }); } catch (e) {} return true; }
                if (m.type === 'wt-set') { if (m.active) { removeBadge(); buildPanel(); } else removePanel(); return; }
                if (m.type === 'pl-frame-event') { if (typeof window.__plKaderEvent === 'function') window.__plKaderEvent(m); return; }
                if (m.type === 'pl-auto-run') { if (typeof window.__plAutoRun === 'function') window.__plAutoRun(m).then(r => send(r), e => send({ ok: false, err: String(e && e.message || e) })); else send({ ok: false, err: 'paneel nog niet klaar' }); return true; }
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
