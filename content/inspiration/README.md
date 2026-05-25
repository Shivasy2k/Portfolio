# `inspiration/` — Inspiration & Recognitions (tabbed page)

Each subfolder here is a tab. Drop files into the tab's folder and they appear automatically — sorted by filename.

## Tab folders

- `mentorship/` — certificates type
- `memberships/` — certificates type
- `peer-review/` — certificates type
- `publications/` — certificates type
- `articles/` — articles type (.md files with frontmatter)
- `certifications/` — certificates type

## `_tabs.txt` (optional) — control tab order

If present, lists tab folder names in display order (one per line). If absent, tabs appear in alphabetical order.

```
mentorship
memberships
peer-review
publications
articles
certifications
```

## `_config.json` per tab (optional) — friendly label / heading

Drop a `_config.json` inside any tab folder to override defaults:

```json
{
  "label": "Peer Review",
  "heading": "Technical Program Committee & Peer Review",
  "description": "Reviewer and TPC roles for IEEE-affiliated conferences.",
  "type": "certs"
}
```

- `type` defaults to `certs` (image/PDF gallery). Set to `"articles"` to render an article-row list (Articles tab).
- If `_config.json` is missing entirely, the folder name is humanized (e.g. `peer-review` → "Peer Review") and `type` defaults to `certs`.

## Cert tabs (default `type: certs`)

Drop any `.pdf`, `.png`, `.jpg`, `.jpeg`, or `.webp` file directly into the tab folder. The build script:

1. Derives a friendly title from the filename (e.g. `Reviewer_Certificate_AAIML.pdf` → "Reviewer Certificate AAIML")
2. Pulls an acronym for the PDF badge label (e.g. `AAIML`)
3. Renders the file as a clickable card. PDFs open in a new tab; images open in a lightbox.

To override the auto-derived title/org/year/badge, drop a sibling `.meta.json` file next to it:

```
peer-review/
├── Reviewer_Certificate_AAIML.pdf
└── Reviewer_Certificate_AAIML.pdf.meta.json
```

`Reviewer_Certificate_AAIML.pdf.meta.json`:

```json
{
  "title": "AAIML — Reviewer Certificate",
  "org": "International Conference on Applied AI & ML",
  "year": "2025",
  "badge": "AAIML",
  "link": "https://example.com/conference-page"
}
```

## Articles tab (`type: articles`)

Drop `.md` files with frontmatter:

```md
---
title: Secure Log Tokenization Using Aho–Corasick
outlet: DZone
summary: Approved technical article on high-throughput tokenization.
link: https://dzone.com/articles/secure-log-tokenization-aho-corasick-spring
---
```
