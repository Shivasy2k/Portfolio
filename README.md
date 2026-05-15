# Siva — Portfolio Site

A clean, professional, static portfolio site inspired by the structure of
[bala-kumaran.com/public-influencer.html](https://www.bala-kumaran.com/public-influencer.html),
rebuilt with a different palette (Indigo + Teal) and typography (Inter + Space Grotesk).

All page content is driven by JSON files in [`/data`](./data). Edit the JSON, commit, and the
live site updates automatically via GitHub Pages.

---

## ✨ What's here

```
.
├── index.html          # Home
├── talks.html          # Talks & Media (the public-influencer equivalent)
├── about.html          # About + experience timeline
├── contact.html        # Contact
├── assets/
│   ├── css/style.css   # Theme — single stylesheet
│   ├── js/main.js      # Dynamic content loader
│   └── img/            # Drop images for talks/cards here
├── data/
│   ├── site.json       # Brand, contact, social links, footer nav
│   ├── home.json       # Hero highlights + stats
│   ├── about.json      # Bio + experience entries
│   ├── talks.json      # Talks & media cards
│   ├── interviews.json # Interview rows
│   └── conferences.json# Conference & invited talks timeline
├── .github/workflows/pages.yml  # Auto-deploy to GitHub Pages
├── .nojekyll           # Tells Pages to skip Jekyll processing
└── README.md
```

---

## 🚀 Deploy to GitHub Pages (5 minutes)

The repo is `Shivasy2k/Portfolio` and the branch is `main`.

1. **Create the repo on GitHub** (if not already): https://github.com/new
   - Name: `Portfolio`
   - Owner: `Shivasy2k`
   - Visibility: Public (Pages needs this on free plans)

2. **Push these files to the `main` branch:**

   ```bash
   cd "path/to/this/folder"
   git init -b main
   git add .
   git commit -m "Initial portfolio site"
   git remote add origin https://github.com/Shivasy2k/Portfolio.git
   git push -u origin main
   ```

3. **Enable Pages with GitHub Actions:**
   - On GitHub, go to **Settings → Pages**
   - Under **Build and deployment → Source**, pick **GitHub Actions**
   - That's it — the workflow in `.github/workflows/pages.yml` does the rest.

4. **Visit your site:**
   - **https://shivasy2k.github.io/Portfolio/**
   - First deploy can take ~1–2 minutes. Re-deploys happen on every push to `main`.

---

## ✏️ Updating content

All visible content lives in `/data/*.json`. Open, edit, commit, push — the site refreshes.

### Add a new talk

Open `data/talks.json` and add a new object to the `items` array:

```json
{
  "title": "How we shipped feature X",
  "tag": "Conference Talk",
  "description": "One-sentence summary of the talk.",
  "image": "assets/img/my-talk-cover.jpg",
  "alt": "Speaking at Event Y",
  "link": "https://event-page.example.com",
  "cta": "View session"
}
```

- `image` is optional. Leave it blank (`""`) and the card shows a clean lettered fallback.
- Put image files in `assets/img/` and reference them as `assets/img/filename.jpg`.

### Add an interview / media feature

Edit `data/interviews.json`:

```json
{
  "date": "Jan 2026",
  "title": "Interview title here",
  "outlet": "Publication name",
  "summary": "One-line teaser.",
  "link": "https://outlet.example.com/article"
}
```

### Add a conference talk to the timeline

Edit `data/conferences.json`:

```json
{
  "year": "2026",
  "title": "Talk title",
  "venue": "Conference Name",
  "format": "Keynote",
  "link": "https://conference.example.com"
}
```

### Update bio / experience

Edit `data/about.json`. The `bio` field accepts either a single string or an array of paragraphs.

### Update name, social links, contact email

Edit `data/site.json`. All pages pick up changes automatically.

---

## 🎨 Theme

Designed to look 100% professional and intentionally different from the reference site (which uses
a dark background with amber/serif type).

- **Background:** clean white with subtle indigo/teal gradient washes
- **Primary:** Indigo `#4F46E5`
- **Accent:** Teal `#0D9488`
- **Headings:** Space Grotesk
- **Body:** Inter

To tweak colors or spacing, the design tokens live at the top of [`assets/css/style.css`](./assets/css/style.css)
inside `:root { ... }`.

---

## 🧪 Run locally

Because the pages fetch JSON via `fetch()`, you need a tiny local server (opening `index.html`
directly via `file://` won't work in most browsers).

```bash
# Python
python3 -m http.server 8080

# OR Node
npx serve .
```

Then visit http://localhost:8080.

---

## 📦 Tech notes

- Pure HTML / CSS / vanilla JS. No build step. No framework. No bundler.
- Fonts loaded from Google Fonts.
- Site is fully responsive, accessible-friendly, and prints cleanly.
- All user-supplied JSON values are HTML-escaped before render to prevent injection.

---

## 📝 License

Personal portfolio — content © Siva. Code under MIT.
