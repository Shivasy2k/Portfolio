# Siva — Portfolio Site

Static portfolio site (no framework, no build server, no database). You author
your content as plain files in `/content`, a small Node script builds them into
`/data/*.json`, and the site renders them in the browser. GitHub Pages
re-deploys automatically on every push.

> **TL;DR for authoring:** drop a file in `/content/<section>/`, commit, push.
> The site updates itself within ~60 seconds.

---

## 🧠 Mental model

```
content/   ← you edit this  (markdown, txt, pdfs, images)
    │
    │  scripts/build.js runs on push (GitHub Actions)
    ▼
data/      ← auto-generated JSON, do NOT edit by hand
    │
    │  loaded by the browser at runtime
    ▼
*.html / assets/js/main.js  ← renders the site
```

That's the whole pipeline.

---

## 📁 Repo layout

```
.
├── content/                  ← AUTHOR HERE
│   ├── site/                   brand name, socials, footer links
│   ├── home/                   hero stats + highlights
│   ├── about/                  bio + experience timeline
│   ├── talks/                  Talks & Media cards
│   ├── interviews/             interview rows
│   ├── conferences/            conference timeline
│   ├── innovation/             Invention & Innovation page
│   ├── blogs/                  Blogs page
│   ├── leadership/             Leadership & Consulting page
│   ├── research/               Research page
│   └── inspiration/            Inspiration & Recognitions (tabbed)
│       ├── _tabs.txt             tab order
│       └── <tab>/                one folder per tab — drop files here
├── data/                     ← auto-generated JSON (do not edit)
├── assets/
│   ├── css/style.css         theme (Indigo + Teal, Inter + Space Grotesk)
│   ├── js/main.js            dynamic content loader + tab logic + lightbox
│   └── img/                  shared images you reference from frontmatter
├── scripts/
│   └── build.js              the only build step — zero dependencies
├── *.html                    one file per page
├── .github/workflows/
│   └── pages.yml             builds + deploys on push to main
├── package.json              just to give you `npm run build` / `npm run dev`
└── README.md                 this file
```

Every folder in `/content` has its own README explaining the exact file format.

---

## ✍️ Adding content — by section

| To update… | Edit / drop into | Format |
|---|---|---|
| Your name, role, email, social links | `content/site/` | `profile.md`, `socials.txt` |
| Homepage stats / hero highlights | `content/home/` | `stats.txt`, `highlights.txt` |
| Bio + work history | `content/about/` | `bio.md`, `experience/*.md` |
| Conference / podcast appearances | `content/talks/` | one `.md` per talk |
| Press / interviews | `content/interviews/` | one `.md` per interview |
| Conference timeline | `content/conferences/` | one `.md` per event |
| Patents / inventions | `content/innovation/` | one `.md` per item |
| Blog posts | `content/blogs/` | one `.md` per post |
| Leadership / consulting | `content/leadership/` | `intro.md`, `expertise.txt`, `engagements/*.md` |
| Academic profiles / papers | `content/research/` | `profiles.txt`, `publications/*.md` |
| Certificates, awards, articles (tabbed) | `content/inspiration/<tab>/` | drop PDFs/images or `.md` files |

For the exact frontmatter fields each `.md` accepts, open the `README.md` inside
the relevant folder. They're short and copy-pasteable.

### Example: add a new talk

1. Create `content/talks/2026-06-keynote.md`:
   ```md
   ---
   title: Designing Trust into AI Products
   tag: Keynote
   description: How product teams bake transparency and oversight into AI features.
   link: https://example.com/event
   ---
   ```
2. `git add content/talks/2026-06-keynote.md && git commit -m "Add June keynote" && git push`
3. Done. The Actions workflow builds, deploys, and the new card appears.

### Example: add a peer-review certificate

1. Drop the PDF: `content/inspiration/peer-review/Reviewer_Certificate_NEWCONF.pdf`
2. (Optional) Override the auto-derived title with a sibling JSON:
   `content/inspiration/peer-review/Reviewer_Certificate_NEWCONF.pdf.meta.json`
   ```json
   { "title": "NEWCONF — Reviewer", "org": "IEEE NEWCONF 2026", "badge": "NEWCONF" }
   ```
3. Commit & push. The tile appears in the Peer Review tab. Click opens the PDF.

---

## 🛠️ Running locally

```bash
# Generate /data from /content
npm run build

# Serve the site on http://localhost:8080
npm run serve

# Or both at once
npm run dev
```

Node 18+ required. No npm dependencies to install.

---

## 🚀 Deploying

The first time only:

1. Create the repo `Shivasy2k/Portfolio` on GitHub.
2. `cd` into this folder, then:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial portfolio site"
   git remote add origin https://github.com/Shivasy2k/Portfolio.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

After that, every `git push` to `main` rebuilds and redeploys automatically.

Live URL: **https://shivasy2k.github.io/Portfolio/**

---

## 🧩 How a single tab works (Inspiration & Recognitions)

The tabbed Inspiration page is the most flexible piece. Each tab is a folder
under `content/inspiration/`:

```
content/inspiration/
├── _tabs.txt                 ← controls order (optional)
└── peer-review/
    ├── _config.json          ← label/heading/description/type (optional)
    ├── Reviewer_Certificate_AAIML.pdf
    └── Reviewer_Certificate_ICCR.pdf
```

The build script:
- Reads `_tabs.txt` for tab order (alphabetical if missing).
- For each tab folder, reads `_config.json` for friendly labels.
- For `type: "certs"` tabs, walks any `.pdf` / `.png` / `.jpg` and turns each
  into a card. Derives a friendly title and acronym badge from the filename.
- For `type: "articles"` tabs, walks any `.md` and reads frontmatter
  (`title`, `outlet`, `summary`, `link`).

To add a brand-new tab, just `mkdir content/inspiration/awards/`, drop files in,
and (optionally) add `_config.json` + a line in `_tabs.txt`.

---

## 🎨 Theme

- **Background:** clean white with subtle indigo / teal washes
- **Primary:** Indigo `#4F46E5`
- **Accent:** Teal `#0D9488`
- **Headings:** Space Grotesk
- **Body:** Inter

Tokens live at the top of [`assets/css/style.css`](./assets/css/style.css).

---

## 📝 License

Personal portfolio — content © Siva. Code under MIT.
