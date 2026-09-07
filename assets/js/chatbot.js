// NightFind — zwevende chatwidget. Praat met de Edge Function (Claude); valt terug op lokale antwoorden.
(function () {
  const C = window.NF_CONFIG;
  const history = [];

  const html = `
  <button class="nf-chat-fab" id="nfChatFab" aria-label="Open chat">💬</button>
  <div class="nf-chat" id="nfChat" hidden>
    <div class="nf-chat-head">
      <div><strong>NightFind assistent</strong><div class="nf-chat-sub">Vraag om tips, aanpassingen of een nieuwe route</div></div>
      <button class="nf-chat-close" id="nfChatClose" aria-label="Sluit">×</button>
    </div>
    <div class="nf-chat-msgs" id="nfChatMsgs"></div>
    <div class="nf-chat-quick" id="nfChatQuick">
      <button data-q="Maak mijn route wat rustiger">Rustiger</button>
      <button data-q="Voeg een goed restaurant toe">+ Restaurant</button>
      <button data-q="Welk hotel raad je aan?">Hotel-tip</button>
    </div>
    <form class="nf-chat-form" id="nfChatForm">
      <input id="nfChatInput" type="text" placeholder="Typ je vraag…" autocomplete="off" />
      <button type="submit" class="btn btn-primary">➤</button>
    </form>
  </div>`;

  function add(role, text) {
    const m = document.createElement('div');
    m.className = `nf-msg nf-msg-${role}`;
    m.textContent = text;
    const box = document.getElementById('nfChatMsgs');
    box.appendChild(m);
    box.scrollTop = box.scrollHeight;
    return m;
  }

  function localReply(q) {
    const p = window.NF_PROFILE || {};
    const city = p.city || 'je stad';
    const A = window.NF_AFFILIATES;
    q = q.toLowerCase();
    if (/hotel|slapen|overnacht/.test(q)) return `Voor ${city} raad ik een hotel in het centrum aan, dicht bij je laatste stop. Bekijk de opties: ${A.bookingHotels(city)}`;
    if (/restaurant|eten|diner/.test(q)) return `Goede restaurants in ${city} vind je hier, gesorteerd op reviews: ${A.tripadvisor(city, 'restaurants')}`;
    if (/activiteit|tour|boot|doen/.test(q)) return `Leuke activiteiten en tours in ${city}: ${A.viatorActivities(city)}`;
    if (/rustig|chill|relax/.test(q)) return `Kies in de onboarding de vibe "Relaxed" en laat bars zonder clubs staan — dan bouw ik een rustigere avond. Klik op "Opnieuw" bovenaan je route.`;
    if (/club|feest|dansen/.test(q)) return `Voor een echte feestavond: kies vibe "Feest" en vink Clubs aan. De beste clubs van ${city} komen dan in je route.`;
    return `Ik kan je helpen met hotels, restaurants, bars, clubs en activiteiten in ${city}. Stel je vraag, of pas je route aan via "Opnieuw".`;
  }

  async function send(text) {
    add('user', text);
    history.push({ role: 'user', content: text });
    const typing = add('bot', '…');
    let reply = null;
    if (C.chatEndpoint) {
      try {
        const r = await fetch(C.chatEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': C.supabaseAnonKey, 'Authorization': `Bearer ${C.supabaseAnonKey}` },
          body: JSON.stringify({ mode: 'chat', messages: history.slice(-12), profile: window.NF_PROFILE || null, route: (window.NF_ROUTE && window.NF_ROUTE.route) || null })
        });
        if (r.ok) { const d = await r.json(); reply = d.reply || null; }
      } catch (e) { console.warn('chat endpoint unavailable', e); }
    }
    if (!reply) reply = localReply(text);
    typing.textContent = reply;
    history.push({ role: 'assistant', content: reply });
  }

  function init() {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    const chat = document.getElementById('nfChat');
    const toggle = (open) => { chat.hidden = !open; if (open) document.getElementById('nfChatInput').focus(); };
    document.getElementById('nfChatFab').onclick = () => toggle(chat.hidden);
    document.getElementById('nfChatClose').onclick = () => toggle(false);
    document.getElementById('nfChatForm').onsubmit = (e) => {
      e.preventDefault();
      const i = document.getElementById('nfChatInput');
      const t = i.value.trim(); if (!t) return; i.value = ''; send(t);
    };
    document.getElementById('nfChatQuick').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) send(b.dataset.q); });
    add('bot', 'Hoi! Ik ben de NightFind-assistent. Vertel me waar je heen gaat, of doorloop de onboarding en ik maak een route met de beste plekken en deals.');
    document.addEventListener('nf:route', (e) => { add('bot', `Je route voor ${e.detail.profile.city} staat klaar. Wil je iets aanpassen? Vraag het hier.`); });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
