/*
 * ParseLab — dashboard-brug. Draait ALLEEN op de dashboard-adressen (localhost,
 * 127.0.0.1, *.parselab.nl) en vertelt het dashboard dat de extensie er is en welke
 * versie. Verder doet dit script niets: geen toegang tot andere sites.
 */
(function () {
    'use strict';
    let version = '';
    try { version = chrome.runtime.getManifest().version; } catch (e) { return; }
    function announce() {
        try { document.documentElement.dataset.parselabExtension = version; } catch (e) {}
        try { window.postMessage({ source: 'parselab-extension', type: 'parselab:extension', version }, '*'); } catch (e) {}
    }
    window.addEventListener('message', (ev) => {
        const d = ev && ev.data;
        if (d && d.source === 'parselab-dashboard' && d.type === 'parselab:ping') announce();
    });
    announce();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', announce, { once: true });
})();
