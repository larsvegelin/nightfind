(function () {
  "use strict";

  const app = document.getElementById("app");
  const outfits = window.OUTFITS || {};

  const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

  // Welke outfit? ?id=... of anders de eerste in de lijst
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || Object.keys(outfits)[0];
  const outfit = outfits[id];

  document.getElementById("year").textContent = new Date().getFullYear();

  if (!outfit) {
    app.innerHTML = `
      <section class="empty">
        <h1>Outfit niet gevonden</h1>
        <p>Deze look bestaat niet (meer). Check de link in mijn TikTok bio.</p>
      </section>`;
    return;
  }

  // ---------- helpers ----------

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Alleen http(s) links toestaan in href/src
  function safeUrl(url) {
    try {
      const u = new URL(url, location.href);
      return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:" ? u.href : "#";
    } catch {
      return "#";
    }
  }

  function placeholder(label) {
    return `<div class="ph" aria-hidden="true"><span>${esc(label)}</span></div>`;
  }

  function imageOrPlaceholder(src, alt, label) {
    if (!src) return placeholder(label);
    return `<img src="${esc(safeUrl(src))}" alt="${esc(alt)}" loading="lazy" data-label="${esc(label)}">`;
  }

  // Klik-tracking. Nu alleen lokaal; later te koppelen aan bijv. Supabase of Plausible.
  function trackClick(item, variant) {
    const event = {
      outfit: id,
      item: item.name,
      shop: item.shop,
      variant,
      ts: new Date().toISOString()
    };
    try {
      const log = JSON.parse(localStorage.getItem("sdl_clicks") || "[]");
      log.push(event);
      localStorage.setItem("sdl_clicks", JSON.stringify(log.slice(-200)));
    } catch { /* storage niet beschikbaar: negeren */ }
    if (window.plausible) window.plausible("Affiliate click", { props: event });
  }

  function linkAttrs(item, variant, index) {
    return `href="${esc(safeUrl(item.url))}" target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            data-track="${index}" data-variant="${variant}"`;
  }

  // ---------- render ----------

  const total = outfit.items.reduce((sum, it) => sum + (it.price || 0), 0);
  const budgetTotal = outfit.items.reduce(
    (sum, it) => sum + ((it.budget && it.budget.price) || it.price || 0), 0);
  const hasBudget = outfit.items.some((it) => it.budget);

  document.title = `${outfit.title} – Shop de look`;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", outfit.title);

  const itemsHtml = outfit.items.map((item, i) => `
    <li class="item">
      <a class="item-media" ${linkAttrs(item, "main", i)} tabindex="-1" aria-hidden="true">
        ${imageOrPlaceholder(item.image, item.name, item.category)}
      </a>
      <div class="item-body">
        <span class="item-cat">${esc(item.category)}</span>
        <h3 class="item-name">${esc(item.name)}</h3>
        <p class="item-meta">${esc(item.brand)} · ${esc(item.shop)}</p>
        <div class="item-row">
          <span class="price">${euro.format(item.price)}</span>
          <a class="btn btn-shop" ${linkAttrs(item, "main", i)}>
            Shop bij ${esc(item.shop)}
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3zM5 5h5v2H5v12h12v-5h2v7H3V5h2z"/></svg>
          </a>
        </div>
        ${item.budget ? `
        <a class="budget" ${linkAttrs(item.budget, "budget", i)}>
          <span class="budget-tag">Budget tip: bespaar ${euro.format(item.price - item.budget.price)}</span>
          <span class="budget-name">${esc(item.budget.name)} · ${esc(item.budget.shop)}</span>
          <span class="budget-price">${euro.format(item.budget.price)}</span>
        </a>` : ""}
      </div>
    </li>`).join("");

  app.innerHTML = `
    <section class="hero">
      <div class="hero-media">
        ${imageOrPlaceholder(outfit.image, outfit.title, "Outfit foto")}
      </div>
      <div class="hero-text">
        <a class="creator" href="${esc(safeUrl(outfit.tiktok.url))}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.5a2.9 2.9 0 1 1-2-2.7V9.3a6.3 6.3 0 1 0 5.4 6.2V8.7a8.2 8.2 0 0 0 3.8 1V6.7z"/></svg>
          ${esc(outfit.tiktok.handle)}
        </a>
        <h1>${esc(outfit.title)}</h1>
        <p class="subtitle">${esc(outfit.subtitle)}</p>
        <ul class="tags">${outfit.tags.map((t) => `<li>#${esc(t)}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="summary" aria-label="Totaalprijs">
      <div>
        <span class="summary-label">Complete look</span>
        <span class="summary-value">${euro.format(total)}</span>
      </div>
      ${hasBudget ? `
      <div>
        <span class="summary-label">Met budget tips</span>
        <span class="summary-value accent">${euro.format(budgetTotal)}</span>
      </div>` : ""}
      <div>
        <span class="summary-label">Items</span>
        <span class="summary-value">${outfit.items.length}</span>
      </div>
    </section>

    <p class="description">${esc(outfit.description)}</p>

    <section aria-labelledby="items-title">
      <h2 id="items-title" class="section-title">Shop de items</h2>
      <ul class="items">${itemsHtml}</ul>
    </section>

    <section class="follow">
      <p>Meer looks zien?</p>
      <a class="btn btn-dark" href="${esc(safeUrl(outfit.tiktok.url))}" target="_blank" rel="noopener">
        Volg ${esc(outfit.tiktok.handle)} op TikTok
      </a>
    </section>
  `;

  // Kapotte productfoto's vervangen door een placeholder
  app.querySelectorAll("img[data-label]").forEach((img) => {
    img.addEventListener("error", () => {
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.innerHTML = `<span>${esc(img.dataset.label)}</span>`;
      img.replaceWith(ph);
    }, { once: true });
  });

  // Klik-tracking koppelen
  app.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-track]");
    if (!link) return;
    const item = outfit.items[Number(link.dataset.track)];
    const variant = link.dataset.variant;
    trackClick(variant === "budget" ? { ...item.budget } : item, variant);
  });

  // ---------- delen ----------

  const toast = document.getElementById("toast");
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  document.getElementById("shareBtn").addEventListener("click", async () => {
    const data = { title: outfit.title, text: `Shop deze look: ${outfit.title}`, url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* geannuleerd */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Link gekopieerd");
    } catch {
      showToast("Kopiëren lukt niet, kopieer de URL handmatig");
    }
  });
})();
