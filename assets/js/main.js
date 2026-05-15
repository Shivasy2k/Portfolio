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

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    applySite();
    renderHome();
    renderTalks();
    renderAbout();
  });
})();
