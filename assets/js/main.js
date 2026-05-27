/* =========================================================
   Siva — Portfolio site script
   Loads JSON data files from /data and renders content.
   Edit JSON in the repo to update the live site.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Config ---------- */
  const DATA_BASE = "data/"; // relative path; works on GitHub Pages and locally

  /* ---------- DOM helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (str = "") =>
    String(str).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  const safeURL = (url = "#") => {
    try {
      const u = new URL(url, window.location.href);
      if (["http:", "https:", "mailto:"].includes(u.protocol)) return u.href;
    } catch { /* relative or hash */ }
    return url;
  };

  const initials = (name = "") =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

  async function loadJSON(name) {
    const res = await fetch(`${DATA_BASE}${name}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
    return res.json();
  }

  /* ---------- Nav: active state + mobile toggle ---------- */
  function initNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a").forEach(a => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
    const toggle = $(".nav-toggle");
    const links = $(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  /* ---------- Site-wide (brand, footer, social) ---------- */
  async function applySite() {
    try {
      const site = await loadJSON("site");

      // Brand name
      $$("[data-site=brand]").forEach(el => { el.textContent = site.brand || "Portfolio"; });
      $$("[data-site=brand-mark]").forEach(el => { el.textContent = initials(site.fullName || site.brand || "S"); });
      $$("[data-site=fullName]").forEach(el => { el.textContent = site.fullName || ""; });
      $$("[data-site=role]").forEach(el => { el.textContent = site.role || ""; });
      $$("[data-site=tagline]").forEach(el => { el.textContent = site.tagline || ""; });
      $$("[data-site=year]").forEach(el => { el.textContent = new Date().getFullYear(); });
      $$("[data-site=email]").forEach(el => {
        if (site.email) {
          el.textContent = site.email;
          el.setAttribute("href", "mailto:" + site.email);
        }
      });

      // Document title
      const t = $("title");
      if (t && site.brand && t.dataset.suffix !== "off") {
        t.textContent = `${t.textContent} | ${site.brand}`;
      }

      // Socials
      const socials = Array.isArray(site.socials) ? site.socials : [];
      $$("[data-site=socials]").forEach(container => {
        container.innerHTML = socials.map(s => `
          <a class="social-pill" href="${safeURL(s.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHTML(s.label)}
          </a>
        `).join("");
      });

      // Footer nav (optional)
      $$("[data-site=footer-nav]").forEach(container => {
        const items = Array.isArray(site.footerNav) ? site.footerNav : [];
        container.innerHTML = items.map(i => `
          <li><a href="${safeURL(i.url)}">${escapeHTML(i.label)}</a></li>
        `).join("");
      });
    } catch (e) {
      console.warn("[site] could not load site.json:", e);
    }
  }

  /* ---------- Home: stats + hero highlights ---------- */
  async function renderHome() {
    const statsEl = $("[data-render=stats]");
    const highlightsEl = $("[data-render=highlights]");
    if (!statsEl && !highlightsEl) return;
    try {
      const home = await loadJSON("home");
      if (statsEl) {
        statsEl.innerHTML = (home.stats || []).map(s => `
          <div class="stat">
            <span class="stat-value">${escapeHTML(s.value)}</span>
            <span class="stat-label">${escapeHTML(s.label)}</span>
          </div>
        `).join("");
      }
      if (highlightsEl) {
        highlightsEl.innerHTML = (home.highlights || []).map(h => `<li>${escapeHTML(h)}</li>`).join("");
      }
    } catch (e) {
      console.warn("[home] could not load home.json:", e);
      if (statsEl) statsEl.innerHTML = "";
      if (highlightsEl) highlightsEl.innerHTML = "";
    }
  }

  /* ---------- Talks page ---------- */
  function cardTemplate(item) {
    const link = item.link ? safeURL(item.link) : null;
    const mediaInner = item.image
      ? `<img src="${safeURL(item.image)}" alt="${escapeHTML(item.alt || item.title || "")}" loading="lazy" onerror="this.remove();this.parentElement.classList.add('no-image');" />`
      : "";
    const fallback = `<div class="card-media-fallback" aria-hidden="true">${escapeHTML(initials(item.title || "") || "•")}</div>`;
    const tag = item.tag ? `<span class="card-meta">${escapeHTML(item.tag)}</span>` : "";
    const desc = item.description ? `<p class="card-desc">${escapeHTML(item.description)}</p>` : "";
    const cta = link
      ? `<a class="card-link" href="${link}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.cta || "View details")}</a>`
      : "";
    return `
      <article class="card">
        <div class="card-media">
          ${fallback}
          ${mediaInner}
        </div>
        <div class="card-body">
          ${tag}
          <h3 class="card-title">${escapeHTML(item.title || "")}</h3>
          ${desc}
          ${cta}
        </div>
      </article>
    `;
  }

  async function renderTalks() {
    const grid = $("[data-render=talks]");
    const interviewsEl = $("[data-render=interviews]");
    const timelineEl = $("[data-render=conferences]");

    if (grid) {
      try {
        const data = await loadJSON("talks");
        const items = Array.isArray(data) ? data : (data.items || []);
        grid.innerHTML = items.length
          ? items.map(cardTemplate).join("")
          : `<div class="empty">No talks listed yet.</div>`;
      } catch (e) {
        console.warn("[talks] error:", e);
        grid.innerHTML = `<div class="empty">Could not load talks data. Check <code>data/talks.json</code>.</div>`;
      }
    }

    if (interviewsEl) {
      try {
        const data = await loadJSON("interviews");
        const items = Array.isArray(data) ? data : (data.items || []);
        interviewsEl.innerHTML = items.length
          ? items.map(it => `
              <article class="interview">
                <div class="interview-date">${escapeHTML(it.date || "")}</div>
                <div>
                  <h4>${escapeHTML(it.title || "")}</h4>
                  <p>${escapeHTML(it.outlet || "")}${it.summary ? " — " + escapeHTML(it.summary) : ""}</p>
                </div>
                ${it.link ? `<a class="btn btn--ghost" href="${safeURL(it.link)}" target="_blank" rel="noopener noreferrer">Read</a>` : ""}
              </article>
            `).join("")
          : `<div class="empty">No interviews yet.</div>`;
      } catch (e) {
        console.warn("[interviews] error:", e);
        interviewsEl.innerHTML = `<div class="empty">Could not load <code>data/interviews.json</code>.</div>`;
      }
    }

    if (timelineEl) {
      try {
        const data = await loadJSON("conferences");
        const items = Array.isArray(data) ? data : (data.items || []);
        timelineEl.innerHTML = items.length
          ? items.map(it => `
              <li class="timeline-item">
                <span class="timeline-year">${escapeHTML(it.year || "")}</span>
                <h3 class="timeline-title">${escapeHTML(it.title || "")}</h3>
                <p class="timeline-meta">${escapeHTML(it.venue || "")}${it.format ? " • " + escapeHTML(it.format) : ""}</p>
                ${it.link ? `<a href="${safeURL(it.link)}" target="_blank" rel="noopener noreferrer">Event link</a>` : ""}
              </li>
            `).join("")
          : `<li class="empty">No conference entries yet.</li>`;
      } catch (e) {
        console.warn("[conferences] error:", e);
        timelineEl.innerHTML = `<li class="empty">Could not load <code>data/conferences.json</code>.</li>`;
      }
    }
  }

  /* ---------- About ---------- */
  async function renderAbout() {
    const bioEl = $("[data-render=bio]");
    const expEl = $("[data-render=experience]");
    if (!bioEl && !expEl) return;
    try {
      const about = await loadJSON("about");
      if (bioEl) {
        const paras = Array.isArray(about.bio) ? about.bio : [about.bio || ""];
        bioEl.innerHTML = paras.filter(Boolean).map(p => `<p>${escapeHTML(p)}</p>`).join("");
      }
      if (expEl) {
        const items = about.experience || [];
        expEl.innerHTML = items.length
          ? items.map(it => `
              <li class="timeline-item">
                <span class="timeline-year">${escapeHTML(it.period || "")}</span>
                <h3 class="timeline-title">${escapeHTML(it.role || "")}</h3>
                <p class="timeline-meta">${escapeHTML(it.org || "")}${it.location ? " • " + escapeHTML(it.location) : ""}</p>
                ${it.summary ? `<p>${escapeHTML(it.summary)}</p>` : ""}
              </li>
            `).join("")
          : "";
      }
    } catch (e) {
      console.warn("[about] error:", e);
    }
  }

  /* ---------- Innovation ---------- */
  async function renderInnovation() {
    const grid = $("[data-render=innovation]");
    if (!grid) return;
    try {
      const data = await loadJSON("innovation");
      const items = Array.isArray(data) ? data : (data.items || []);
      grid.innerHTML = items.length
        ? items.map(item => {
            const tagLabel = item.tag || "Innovation";
            const yearTag = item.year ? `<span class="card-meta">${escapeHTML(item.year)} · ${escapeHTML(tagLabel)}</span>` : `<span class="card-meta">${escapeHTML(tagLabel)}</span>`;
            const desc = item.description ? `<p class="card-desc">${escapeHTML(item.description)}</p>` : "";
            const link = item.link ? `<a class="card-link" href="${safeURL(item.link)}" target="_blank" rel="noopener noreferrer">View details</a>` : "";
            return `<article class="card"><div class="card-media"><div class="card-media-fallback" aria-hidden="true">${escapeHTML(initials(item.title || "") || "•")}</div></div><div class="card-body">${yearTag}<h3 class="card-title">${escapeHTML(item.title || "")}</h3>${desc}${link}</div></article>`;
          }).join("")
        : `<div class="empty">No innovations listed yet — edit <code>data/innovation.json</code>.</div>`;
    } catch (e) {
      console.warn("[innovation] error:", e);
      grid.innerHTML = `<div class="empty">Could not load <code>data/innovation.json</code>.</div>`;
    }
  }

  /* ---------- Leadership & Consulting ---------- */
  async function renderLeadership() {
    const introEl = $("[data-render=leadership-intro]");
    const engEl = $("[data-render=leadership-engagements]");
    const expEl = $("[data-render=leadership-expertise]");
    if (!introEl && !engEl && !expEl) return;
    try {
      const data = await loadJSON("leadership");
      if (introEl && data.intro) introEl.textContent = data.intro;
      if (engEl) {
        const items = data.engagements || [];
        engEl.innerHTML = items.length
          ? items.map(it => `
              <li class="timeline-item">
                <span class="timeline-year">${escapeHTML(it.period || "")}</span>
                <h3 class="timeline-title">${escapeHTML(it.title || "")}</h3>
                <p class="timeline-meta">${escapeHTML(it.org || "")}</p>
                ${it.description ? `<p>${escapeHTML(it.description)}</p>` : ""}
              </li>`).join("")
          : `<li class="empty">No engagements yet — edit <code>data/leadership.json</code>.</li>`;
      }
      if (expEl) {
        const items = data.expertise || [];
        expEl.innerHTML = items.map(e => `<span class="tag">${escapeHTML(e)}</span>`).join("");
      }
    } catch (e) {
      console.warn("[leadership] error:", e);
    }
  }

  /* ---------- Inspiration & Recognitions (tabbed) ---------- */

  // Renders a single certificate card.
  // Supports image files (click-to-zoom in lightbox) and PDF files (click opens in new tab).
  function certCardHTML(item) {
    const path = (item.image || "").trim();
    const hasFile = !!path;
    const isPDF = /\.pdf($|\?|#)/i.test(path);
    const fallback = escapeHTML(initials(item.title || "") || "•");

    const isLinkOnly = !hasFile && !!item.link;
    let thumbInner;
    if (isPDF) {
      const badge = escapeHTML(
        (item.badge || item.title || "").replace(/^.*?\b([A-Z][A-Z0-9]{2,})\b.*$/, "$1") || "PDF"
      );
      // Canvas gets filled by renderPdfThumb() after the card scrolls into view.
      thumbInner = `
        <div class="cert-thumb-pdf" aria-hidden="true">
          <canvas class="cert-thumb-pdf-canvas" data-pdf-src="${safeURL(path)}"></canvas>
          <span class="cert-thumb-pdf-badge">${badge}</span>
        </div>`;
    } else if (hasFile) {
      thumbInner = `
        <img src="${safeURL(path)}" alt="${escapeHTML(item.alt || item.title || "")}" loading="lazy"
             onerror="this.remove();this.parentElement.querySelector('.cert-thumb-fallback').style.display='grid';" />
        <div class="cert-thumb-fallback" style="display:none;" aria-hidden="true">${fallback}</div>`;
    } else if (isLinkOnly) {
      // Link-only entry — render a "paper" tile (document icon + acronym badge)
      const badge = escapeHTML(item.badge || fallback || "PAPER");
      thumbInner = `
        <div class="cert-thumb-link" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
            <path fill="currentColor" d="M30 4H10a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z"/>
            <path fill="rgba(255,255,255,0.55)" d="M30 4v10a2 2 0 0 0 2 2h10z"/>
            <rect x="12" y="22" width="20" height="2" fill="#fff" opacity="0.85"/>
            <rect x="12" y="28" width="20" height="2" fill="#fff" opacity="0.85"/>
            <rect x="12" y="34" width="14" height="2" fill="#fff" opacity="0.85"/>
          </svg>
          <span class="cert-thumb-pdf-badge">${badge}</span>
        </div>`;
    } else {
      thumbInner = `<div class="cert-thumb-fallback" aria-hidden="true">${fallback}</div>`;
    }

    // Attributes that drive click behavior
    let cardAttrs;
    if (isPDF) {
      cardAttrs = `data-open-href="${safeURL(path)}" data-zoom-caption="${escapeHTML(item.title || "")}"`;
    } else if (hasFile) {
      cardAttrs = `data-zoom-src="${safeURL(path)}" data-zoom-caption="${escapeHTML(item.title || "")}"`;
    } else if (isLinkOnly) {
      cardAttrs = `data-link-href="${safeURL(item.link)}"`;
    } else {
      cardAttrs = "";
    }

    let hint;
    if (isPDF) {
      hint = `<span class="cert-hint">Click to enlarge</span>`;
    } else if (isLinkOnly) {
      hint = `<span class="cert-hint">Read paper ↗</span>`;
    } else if (item.link) {
      hint = `<a class="cert-hint" href="${safeURL(item.link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Visit source ↗</a>`;
    } else if (hasFile) {
      hint = `<span class="cert-hint">Click to enlarge</span>`;
    } else {
      hint = "";
    }

    return `
      <button type="button" class="cert-card${isPDF ? " cert-card--pdf" : ""}"
              ${cardAttrs}
              aria-label="${isPDF ? "Open PDF" : "View certificate"}: ${escapeHTML(item.title || "")}">
        <div class="cert-thumb">${thumbInner}</div>
        <div class="cert-body">
          <h3 class="cert-title">${escapeHTML(item.title || "")}</h3>
          ${item.org  ? `<p class="cert-meta">${escapeHTML(item.org)}</p>` : ""}
          ${item.year ? `<p class="cert-meta">${escapeHTML(item.year)}</p>` : ""}
          ${hint}
        </div>
      </button>`;
  }

  // Renders an article row (DZone / Dev.to / TDAN / Medium etc.)
  function articleRowHTML(item) {
    const outlet = (item.outlet || "").toString();
    const outletKey = outlet.toLowerCase().replace(/[^a-z]/g, "");
    const badge = outlet.slice(0, 3).toUpperCase() || "ART";
    return `
      <article class="article-row">
        <div class="article-outlet ${outletKey}" aria-hidden="true">${escapeHTML(badge)}</div>
        <div class="article-body">
          <h4>${escapeHTML(item.title || "")}</h4>
          <p>${escapeHTML(outlet)}${item.summary ? " — " + escapeHTML(item.summary) : ""}</p>
        </div>
        ${item.link
          ? `<a class="btn btn--ghost" href="${safeURL(item.link)}" target="_blank" rel="noopener noreferrer">Read ↗</a>`
          : ""}
      </article>`;
  }

  function panelContentHTML(tab) {
    const items = Array.isArray(tab.items) ? tab.items : [];
    if (!items.length) {
      return `<div class="empty">No entries yet in <strong>${escapeHTML(tab.label || "this tab")}</strong> — add some to <code>data/inspiration.json</code>.</div>`;
    }
    if (tab.type === "articles") {
      return `<div class="article-list">${items.map(articleRowHTML).join("")}</div>`;
    }
    // default: image / certificate gallery
    return `<div class="cert-grid">${items.map(certCardHTML).join("")}</div>`;
  }

  function buildTabs(root, tabs) {
    const listId = "insp-tablist";
    const navHTML = `
      <div class="tabs" role="region" aria-label="Inspiration & Recognitions sections">
        <div class="container">
          <ul id="${listId}" class="tablist" role="tablist">
            ${tabs.map((t, i) => `
              <li role="presentation">
                <button type="button" class="tab-btn"
                        role="tab"
                        id="tab-${escapeHTML(t.id)}"
                        aria-controls="panel-${escapeHTML(t.id)}"
                        aria-selected="${i === 0 ? "true" : "false"}"
                        tabindex="${i === 0 ? "0" : "-1"}"
                        data-tab="${escapeHTML(t.id)}">
                  <span>${escapeHTML(t.label || t.id)}</span>
                  ${Array.isArray(t.items) ? `<span class="tab-count">${t.items.length}</span>` : ""}
                </button>
              </li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="container">
        <div class="tab-panels">
          ${tabs.map((t, i) => `
            <section class="tab-panel ${i === 0 ? "is-active" : ""}"
                     id="panel-${escapeHTML(t.id)}"
                     role="tabpanel"
                     aria-labelledby="tab-${escapeHTML(t.id)}"
                     ${i === 0 ? "" : "hidden"}>
              <div class="tab-panel-head">
                <h2>${escapeHTML(t.heading || t.label || "")}</h2>
                ${t.description ? `<p>${escapeHTML(t.description)}</p>` : ""}
              </div>
              ${t.type !== "articles"
                ? `<p class="tab-hint">Click a card to view the certificate full-size.</p>`
                : ""}
              ${panelContentHTML(t)}
            </section>`).join("")}
        </div>
      </div>
    `;
    root.innerHTML = navHTML;

    // Activate handler
    const buttons = $$(".tab-btn", root);
    const panels  = $$(".tab-panel", root);
    function activate(id, { focus = false } = {}) {
      buttons.forEach(btn => {
        const on = btn.dataset.tab === id;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
        if (on && focus) btn.focus();
      });
      panels.forEach(p => {
        const on = p.id === `panel-${id}`;
        p.classList.toggle("is-active", on);
        if (on) p.removeAttribute("hidden");
        else    p.setAttribute("hidden", "");
      });
      if (history.replaceState) {
        history.replaceState(null, "", `#${id}`);
      }
    }
    buttons.forEach(btn => {
      btn.addEventListener("click", () => activate(btn.dataset.tab));
    });
    // Keyboard nav
    root.addEventListener("keydown", (e) => {
      if (!e.target.classList.contains("tab-btn")) return;
      const ids = buttons.map(b => b.dataset.tab);
      const i = ids.indexOf(e.target.dataset.tab);
      let next = i;
      if (e.key === "ArrowRight") next = (i + 1) % ids.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + ids.length) % ids.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End")  next = ids.length - 1;
      else return;
      e.preventDefault();
      activate(ids[next], { focus: true });
    });
    // Deep-link via URL hash
    const initial = (location.hash || "").replace("#", "");
    if (initial && buttons.some(b => b.dataset.tab === initial)) {
      activate(initial);
    }
  }

  async function renderInspiration() {
    const root = $("[data-render=inspiration-tabs]");
    if (!root) return;
    try {
      const data = await loadJSON("inspiration");
      const tabs = Array.isArray(data.tabs) ? data.tabs : [];
      if (!tabs.length) {
        root.innerHTML = `<div class="container"><div class="empty">No tabs configured — edit <code>data/inspiration.json</code>.</div></div>`;
        return;
      }
      buildTabs(root, tabs);
      initPdfThumbs(root); // render real PDF thumbnails into the cert cards
    } catch (e) {
      console.warn("[inspiration] error:", e);
      root.innerHTML = `<div class="container"><div class="empty">Could not load <code>data/inspiration.json</code>.</div></div>`;
    }
  }

  /* ---------- PDF.js loader + thumbnail renderer ---------- */
  const PDFJS_VERSION = "3.11.174";
  const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
  let pdfJsPromise = null;
  function loadPdfJs() {
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${PDFJS_BASE}/pdf.min.js`;
      s.async = true;
      s.onload = () => {
        if (!window.pdfjsLib) return reject(new Error("pdf.js failed to expose pdfjsLib"));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error("pdf.js script failed to load"));
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }

  async function renderPdfThumb(canvas) {
    const url = canvas.dataset.pdfSrc;
    if (!url) return;
    try {
      const lib = await loadPdfJs();
      const pdf = await lib.getDocument({ url, disableRange: false }).promise;
      const page = await pdf.getPage(1);
      // Render at 2x the canvas's CSS size for retina sharpness.
      const cssWidth = canvas.parentElement.clientWidth || 320;
      const viewport1x = page.getViewport({ scale: 1 });
      const scale = (cssWidth * 2) / viewport1x.width;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      canvas.classList.add("is-loaded");
    } catch (e) {
      console.warn("[pdf-thumb] failed:", url, e);
      canvas.parentElement && canvas.parentElement.classList.add("pdf-thumb-error");
    }
  }

  function initPdfThumbs(root) {
    const canvases = (root || document).querySelectorAll("canvas[data-pdf-src]:not([data-pdf-init])");
    if (!canvases.length) return;
    if (!("IntersectionObserver" in window)) {
      canvases.forEach(c => { c.dataset.pdfInit = "1"; renderPdfThumb(c); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const c = e.target;
        c.dataset.pdfInit = "1";
        renderPdfThumb(c);
        io.unobserve(c);
      }
    }, { rootMargin: "300px 0px" });
    canvases.forEach(c => io.observe(c));
  }

  /* ---------- Lightbox (image zoom + inline PDF preview) ---------- */
  function initLightbox() {
    let box;
    function getBox() {
      if (box) return box;
      box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", "Preview");
      box.innerHTML = `
        <figure class="lightbox-figure">
          <button type="button" class="lightbox-close" aria-label="Close preview">×</button>
          <div class="lightbox-body"></div>
          <figcaption class="lightbox-caption"></figcaption>
        </figure>
      `;
      document.body.appendChild(box);
      box.addEventListener("click", (e) => {
        if (e.target === box || e.target.classList.contains("lightbox-close")) close();
      });
      return box;
    }

    function open(src, caption, opts = {}) {
      if (!src) return;
      const b = getBox();
      const body = b.querySelector(".lightbox-body");
      body.innerHTML = "";
      const isPDF = opts.type === "pdf" || /\.pdf($|\?|#)/i.test(src);
      if (isPDF) {
        const iframe = document.createElement("iframe");
        iframe.src = src + "#view=FitH";
        iframe.className = "lightbox-iframe";
        iframe.title = caption || "PDF preview";
        body.appendChild(iframe);
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = caption || "";
        img.className = "lightbox-img";
        body.appendChild(img);
      }
      b.querySelector(".lightbox-caption").innerHTML = `
        <span>${escapeHTML(caption || "")}</span>
        <a class="lightbox-open-link" href="${safeURL(src)}" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
      `;
      b.classList.add("is-open");
      document.body.classList.add("lightbox-open");
    }
    function close() {
      if (!box) return;
      box.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      // Clear iframe src to stop any media playback
      const body = box.querySelector(".lightbox-body");
      if (body) body.innerHTML = "";
    }

    document.addEventListener("click", (e) => {
      const card = e.target.closest(".cert-card");
      if (!card) return;
      if (e.target.closest("a")) return; // don't fire on inner anchor clicks
      // PDF cards: lightbox with iframe
      const pdfHref = card.dataset.openHref;
      if (pdfHref) {
        open(pdfHref, card.dataset.zoomCaption || "", { type: "pdf" });
        return;
      }
      // Link-only cards: open the external URL in a new tab
      const linkHref = card.dataset.linkHref;
      if (linkHref) {
        window.open(linkHref, "_blank", "noopener,noreferrer");
        return;
      }
      // Image cards: existing image lightbox
      const src = card.dataset.zoomSrc;
      const cap = card.dataset.zoomCaption || "";
      if (src) open(src, cap);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- Blogs ---------- */
  async function renderBlogs() {
    const grid = $("[data-render=blogs]");
    if (!grid) return;
    try {
      const data = await loadJSON("blogs");
      const items = Array.isArray(data) ? data : (data.items || []);
      grid.innerHTML = items.length
        ? items.map(item => cardTemplate({ ...item, description: item.summary })).join("")
        : `<div class="empty">No blog posts yet — edit <code>data/blogs.json</code>.</div>`;
    } catch (e) {
      console.warn("[blogs] error:", e);
      grid.innerHTML = `<div class="empty">Could not load <code>data/blogs.json</code>.</div>`;
    }
  }

  /* ---------- Research ---------- */
  async function renderResearch() {
    const profilesEl = $("[data-render=research-profiles]");
    const pubsEl = $("[data-render=publications]");
    if (!profilesEl && !pubsEl) return;
    try {
      const data = await loadJSON("research");
      if (profilesEl) {
        const profiles = data.profiles || [];
        profilesEl.innerHTML = profiles
          .filter(p => p.url)
          .map(p => `<a class="social-pill" href="${safeURL(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.label)}</a>`)
          .join("") || `<p style="color:var(--color-text-subtle);">Add your profile URLs to <code>data/research.json</code>.</p>`;
      }
      if (pubsEl) {
        const items = data.publications || [];
        pubsEl.innerHTML = items.length
          ? items.map(it => `
              <li class="timeline-item">
                <span class="timeline-year">${escapeHTML(it.year || "")}</span>
                <h3 class="timeline-title">${escapeHTML(it.title || "")}</h3>
                <p class="timeline-meta">${escapeHTML(it.journal || "")}${it.authors ? " · " + escapeHTML(it.authors) : ""}</p>
                ${it.doi ? `<p style="font-size:0.88rem;color:var(--color-text-subtle);">DOI: ${escapeHTML(it.doi)}</p>` : ""}
                ${it.link ? `<a href="${safeURL(it.link)}" target="_blank" rel="noopener noreferrer">View paper</a>` : ""}
              </li>`).join("")
          : `<li class="empty">No publications yet — edit <code>data/research.json</code>.</li>`;
      }
    } catch (e) {
      console.warn("[research] error:", e);
    }
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initLightbox();
    applySite();
    renderHome();
    renderTalks();
    renderAbout();
    renderInnovation();
    renderLeadership();
    renderInspiration();
    renderBlogs();
    renderResearch();
  });
})();
