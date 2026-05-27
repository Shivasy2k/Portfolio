#!/usr/bin/env node
/* =========================================================
   Portfolio site — content builder
   ---------------------------------------------------------
   Reads files from /content and writes /data/*.json.
   The site's existing renderer (assets/js/main.js) reads
   data/*.json at page load, so this script is the single
   source of truth for what the site displays.

   Runs:
     - Locally:        node scripts/build.js
     - GitHub Actions: as a step before Pages upload

   Zero dependencies (intentional — runs on a bare Node 18+).
   ========================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DATA = path.join(ROOT, "data");

/* ---------- tiny helpers ---------- */

const exists = p => { try { fs.accessSync(p); return true; } catch { return false; } };

function readFile(p) { return fs.readFileSync(p, "utf8"); }

function writeJSON(name, payload) {
  if (!exists(DATA)) fs.mkdirSync(DATA, { recursive: true });
  const out = path.join(DATA, name);
  fs.writeFileSync(out, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote data/${name}`);
}

function listFiles(dir, { exts = null, sorted = true } = {}) {
  if (!exists(dir)) return [];
  let files = fs.readdirSync(dir)
    .filter(n => !n.startsWith(".") && !n.startsWith("_") && !n.toLowerCase().includes("readme"))
    .map(n => path.join(dir, n))
    .filter(p => fs.statSync(p).isFile());
  if (exts) files = files.filter(p => exts.includes(path.extname(p).toLowerCase()));
  if (sorted) files.sort((a, b) => path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }));
  return files;
}

function listDirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter(n => !n.startsWith(".") && !n.startsWith("_"))
    .map(n => path.join(dir, n))
    .filter(p => fs.statSync(p).isDirectory())
    .sort();
}

/* ---------- frontmatter parser (simple YAML key: value) ---------- */
// Supports:
//   key: value
//   key: "value with: colons"
//   key: [a, b, c]
//   multi-line indented values are NOT supported (keep it flat — easier to author).
function parseFrontmatter(text) {
  const result = { data: {}, body: text || "" };
  if (!text || !text.startsWith("---")) return result;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return result;
  const fmBlock = text.slice(3, end).trim();
  result.body = text.slice(end + 4).replace(/^\n/, "");
  for (const rawLine of fmBlock.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map(s => stripQuotes(s.trim())).filter(Boolean);
    } else {
      val = stripQuotes(val);
    }
    result.data[m[1]] = val;
  }
  return result;
}

function stripQuotes(v) {
  if (typeof v !== "string") return v;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// Frontmatter:  draft: true  -> excluded from the build (staged content)
function isDraft(data) {
  if (!data) return false;
  const v = data.draft;
  if (v === true) return true;
  if (typeof v === "string") return ["true", "1", "yes", "on"].includes(v.toLowerCase());
  return false;
}

// Walk a directory of .md files, parse each, drop drafts, hand back {file, data, body}.
function readMarkdownDir(dir) {
  return listFiles(dir, { exts: [".md"] })
    .map(f => ({ file: f, ...parseFrontmatter(readFile(f)) }))
    .filter(item => !isDraft(item.data));
}

/* ---------- line-based files (.txt) ---------- */
// Skip blank lines and lines starting with #.
function parseLines(text) {
  return (text || "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));
}

// "Label | value | maybe more" -> ["Label", "value", "maybe more"]
function splitPipes(line) {
  return line.split("|").map(s => s.trim()).filter(Boolean);
}

/* ---------- markdown body → plain paragraphs (very light) ---------- */
function mdToParagraphs(body) {
  return (body || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

/* ---------- filename helpers ---------- */
function humanizeFilename(file) {
  return path.basename(file, path.extname(file))
    .replace(/^\d+[-_.\s]+/, "")            // strip leading "01-"
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function deriveBadge(file) {
  const base = path.basename(file, path.extname(file));
  // Find the longest run of uppercase letters (ACRONYMS like AAIML, ICCR)
  const matches = base.match(/[A-Z][A-Z0-9]{2,}/g) || [];
  return matches.sort((a, b) => b.length - a.length)[0] || "";
}

/* ---------- meta sibling file: "file.pdf.meta.json" overrides defaults ---------- */
function loadSiblingMeta(file) {
  const meta = file + ".meta.json";
  if (exists(meta)) {
    try { return JSON.parse(readFile(meta)); }
    catch (e) { console.warn(`  ! invalid JSON in ${path.relative(ROOT, meta)}: ${e.message}`); }
  }
  return {};
}

/* ---------- section builders ---------- */

function buildSite() {
  const dir = path.join(CONTENT, "site");
  if (!exists(dir)) return;

  // Existing site.json is preserved as a base, then overlaid with content/
  let payload = {};
  if (exists(path.join(DATA, "site.json"))) {
    try { payload = JSON.parse(readFile(path.join(DATA, "site.json"))); } catch {}
  }

  const profilePath = path.join(dir, "profile.md");
  if (exists(profilePath)) {
    const { data } = parseFrontmatter(readFile(profilePath));
    Object.assign(payload, data);
  }

  const socialsPath = path.join(dir, "socials.txt");
  if (exists(socialsPath)) {
    payload.socials = parseLines(readFile(socialsPath))
      .map(l => splitPipes(l))
      .filter(p => p.length >= 2)
      .map(([label, url]) => ({ label, url }));
  }

  const navPath = path.join(dir, "footer-nav.txt");
  if (exists(navPath)) {
    payload.footerNav = parseLines(readFile(navPath))
      .map(l => splitPipes(l))
      .filter(p => p.length >= 2)
      .map(([label, url]) => ({ label, url }));
  }

  writeJSON("site.json", payload);
}

function buildHome() {
  const dir = path.join(CONTENT, "home");
  const stats = exists(path.join(dir, "stats.txt"))
    ? parseLines(readFile(path.join(dir, "stats.txt")))
        .map(l => splitPipes(l))
        .filter(p => p.length >= 2)
        .map(([value, label]) => ({ value, label }))
    : [];
  const highlights = exists(path.join(dir, "highlights.txt"))
    ? parseLines(readFile(path.join(dir, "highlights.txt")))
    : [];
  writeJSON("home.json", { stats, highlights });
}

function buildAbout() {
  const dir = path.join(CONTENT, "about");
  const bioPath = path.join(dir, "bio.md");
  let bio = [];
  if (exists(bioPath)) {
    const { body } = parseFrontmatter(readFile(bioPath));
    bio = mdToParagraphs(body);
  }
  const expDir = path.join(dir, "experience");
  const experience = readMarkdownDir(expDir).map(({ file: f, data, body }) => ({
    period: data.period || "",
    role: data.role || humanizeFilename(f),
    org: data.org || "",
    location: data.location || "",
    summary: data.summary || mdToParagraphs(body)[0] || ""
  }));
  writeJSON("about.json", { bio, experience });
}

function buildSimpleCards(section, outName, mapper) {
  const dir = path.join(CONTENT, section);
  const items = readMarkdownDir(dir).map(({ file, data, body }) => mapper(data, body, file));
  writeJSON(outName, { items });
}

function buildTalks() {
  buildSimpleCards("talks", "talks.json", (data, body, f) => ({
    title: data.title || humanizeFilename(f),
    tag: data.tag || "",
    description: data.description || mdToParagraphs(body)[0] || "",
    image: data.image || "",
    alt: data.alt || data.title || "",
    link: data.link || "",
    cta: data.cta || ""
  }));
}

function buildInterviews() {
  buildSimpleCards("interviews", "interviews.json", (data, body, f) => ({
    date: data.date || "",
    title: data.title || humanizeFilename(f),
    outlet: data.outlet || "",
    summary: data.summary || mdToParagraphs(body)[0] || "",
    link: data.link || ""
  }));
}

function buildConferences() {
  buildSimpleCards("conferences", "conferences.json", (data, body, f) => ({
    year: data.year || "",
    title: data.title || humanizeFilename(f),
    venue: data.venue || "",
    format: data.format || "",
    link: data.link || ""
  }));
}

function buildInnovation() {
  // Top-level array shape (not wrapped in {items})
  const dir = path.join(CONTENT, "innovation");
  const items = readMarkdownDir(dir).map(({ file: f, data, body }) => ({
    title: data.title || humanizeFilename(f),
    description: data.description || mdToParagraphs(body)[0] || "",
    year: data.year || "",
    tag: data.tag || "",
    link: data.link || ""
  }));
  writeJSON("innovation.json", items);
}

function buildBlogs() {
  // Top-level array shape
  const dir = path.join(CONTENT, "blogs");
  const items = readMarkdownDir(dir).map(({ file: f, data, body }) => ({
    title: data.title || humanizeFilename(f),
    date: data.date || "",
    summary: data.summary || mdToParagraphs(body)[0] || "",
    tag: data.tag || "",
    link: data.link || "",
    cta: data.cta || ""
  }));
  writeJSON("blogs.json", items);
}

function buildLeadership() {
  const dir = path.join(CONTENT, "leadership");
  let intro = "";
  if (exists(path.join(dir, "intro.md"))) {
    const { body } = parseFrontmatter(readFile(path.join(dir, "intro.md")));
    intro = mdToParagraphs(body).join("\n\n");
  }
  const expertise = exists(path.join(dir, "expertise.txt"))
    ? parseLines(readFile(path.join(dir, "expertise.txt")))
    : [];
  const engDir = path.join(dir, "engagements");
  const engagements = readMarkdownDir(engDir).map(({ file: f, data, body }) => ({
    period: data.period || "",
    title: data.title || humanizeFilename(f),
    org: data.org || "",
    description: data.description || mdToParagraphs(body)[0] || ""
  }));
  writeJSON("leadership.json", { intro, engagements, expertise });
}

function buildResearch() {
  const dir = path.join(CONTENT, "research");
  const profiles = exists(path.join(dir, "profiles.txt"))
    ? parseLines(readFile(path.join(dir, "profiles.txt")))
        .map(l => splitPipes(l))
        .filter(p => p.length >= 2)
        .map(([label, url]) => ({ label, url }))
    : [];
  const pubDir = path.join(dir, "publications");
  const publications = readMarkdownDir(pubDir).map(({ file: f, data, body }) => ({
    title: data.title || humanizeFilename(f),
    journal: data.journal || "",
    year: data.year || "",
    authors: data.authors || "",
    link: data.link || "",
    doi: data.doi || ""
  }));
  writeJSON("research.json", { profiles, publications });
}

/* ---------- Inspiration & Recognitions (tabbed) ---------- */
function buildInspiration() {
  const root = path.join(CONTENT, "inspiration");
  if (!exists(root)) {
    writeJSON("inspiration.json", { tabs: [] });
    return;
  }

  // Tab order: read _tabs.txt if present, else use directory order
  const orderPath = path.join(root, "_tabs.txt");
  let order;
  if (exists(orderPath)) {
    order = parseLines(readFile(orderPath));
  } else {
    order = listDirs(root).map(d => path.basename(d));
  }

  const tabs = order.map(tabId => buildInspirationTab(path.join(root, tabId), tabId)).filter(Boolean);
  writeJSON("inspiration.json", { tabs });
}

function buildInspirationTab(tabDir, tabId) {
  if (!exists(tabDir)) return null;

  // Per-tab config (optional)
  const cfgPath = path.join(tabDir, "_config.json");
  let cfg = {};
  if (exists(cfgPath)) {
    try { cfg = JSON.parse(readFile(cfgPath)); }
    catch (e) { console.warn(`  ! invalid JSON in ${path.relative(ROOT, cfgPath)}: ${e.message}`); }
  }
  const label = cfg.label || humanizeFilename(tabId);
  const heading = cfg.heading || label;
  const description = cfg.description || "";
  const type = cfg.type || "certs";

  let items;
  if (type === "articles") {
    items = readMarkdownDir(tabDir).map(({ file: f, data, body }) => ({
      title: data.title || humanizeFilename(f),
      outlet: data.outlet || "",
      summary: data.summary || mdToParagraphs(body)[0] || "",
      link: data.link || ""
    }));
  } else {
    // certs tab: accepts a mix of
    //   * file entries — .pdf/.png/.jpg/.jpeg/.webp (with optional .meta.json sibling)
    //   * link entries — standalone .json files (NOT .meta.json) with { title, org, year, badge, link }
    const FILE_EXTS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const allFiles = listFiles(tabDir).filter(f => {
      const lower = f.toLowerCase();
      if (lower.endsWith(".meta.json")) return false;       // siblings, not entries
      return FILE_EXTS.includes(path.extname(lower)) || lower.endsWith(".json");
    });
    items = allFiles.map(f => {
      const rel = path.relative(ROOT, f).split(path.sep).join("/");
      if (f.toLowerCase().endsWith(".json")) {
        // Link entry — may optionally include an external image URL (e.g., Credly badge)
        let data = {};
        try { data = JSON.parse(readFile(f)); }
        catch (e) { console.warn(`  ! invalid JSON in ${path.relative(ROOT, f)}: ${e.message}`); }
        if (isDraft(data)) return null;
        const title = data.title || humanizeFilename(f);
        return {
          title,
          org: data.org || "",
          year: data.year || "",
          badge: data.badge || deriveBadge(f) || "",
          image: data.image || "",   // if set, renderer shows it as the thumbnail
          alt: data.alt || title,
          link: data.link || ""
        };
      }
      // File entry (PDF or image)
      const meta = loadSiblingMeta(f);
      const title = meta.title || humanizeFilename(f);
      return {
        title,
        org: meta.org || "",
        year: meta.year || "",
        badge: meta.badge || deriveBadge(f) || "",
        image: rel,
        alt: meta.alt || title,
        link: meta.link || ""
      };
    }).filter(Boolean);
  }

  return { id: tabId, label, heading, description, type, items };
}

/* ---------- main ---------- */
function main() {
  console.log("Building site data from content/ …");
  const builders = [
    ["site",        buildSite],
    ["home",        buildHome],
    ["about",       buildAbout],
    ["talks",       buildTalks],
    ["interviews",  buildInterviews],
    ["conferences", buildConferences],
    ["innovation",  buildInnovation],
    ["blogs",       buildBlogs],
    ["leadership",  buildLeadership],
    ["research",    buildResearch],
    ["inspiration", buildInspiration]
  ];
  let failures = 0;
  for (const [name, fn] of builders) {
    try { fn(); }
    catch (e) { failures++; console.error(`  ✗ ${name}: ${e.message}`); }
  }
  if (failures) {
    console.error(`\nBuild finished with ${failures} error(s).`);
    process.exit(1);
  }
  console.log("\nBuild complete.");
}

main();
