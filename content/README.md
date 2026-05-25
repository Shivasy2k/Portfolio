# `/content` — drop your stuff here

Everything visible on the site is generated from this folder. The build script (`scripts/build.js`) reads these files and writes the JSON in `/data` that the site loads at runtime.

**Two ways the build runs:**

- **Automatically on push** — the GitHub Actions workflow runs `node scripts/build.js` before deploying to Pages. Just commit a file inside `/content` and push.
- **Locally** — run `npm run build` (or `node scripts/build.js`) to regenerate `/data` on your machine.

**Don't hand-edit `/data/*.json`** — the build will overwrite your changes on the next push. Edit files in `/content` instead.

## Folder map

| Section on the site | Folder | What to drop |
|---|---|---|
| Home — stats & highlights | `home/` | `stats.txt`, `highlights.txt` |
| Site brand / nav / socials | `site/` | `profile.md`, `socials.txt`, `footer-nav.txt` |
| About — bio + experience | `about/` | `bio.md` + `experience/*.md` |
| Talks & Media — cards | `talks/` | one `.md` per talk |
| Talks & Media — interviews | `interviews/` | one `.md` per interview |
| Talks & Media — timeline | `conferences/` | one `.md` per conference |
| Invention & Innovation | `innovation/` | one `.md` per item |
| Blogs | `blogs/` | one `.md` per post |
| Leadership & Consulting | `leadership/` | `intro.md`, `expertise.txt`, `engagements/*.md` |
| Research | `research/` | `profiles.txt` + `publications/*.md` |
| Inspiration & Recognitions | `inspiration/<tab>/` | drop PDFs / images / `.md` files per tab |

Each folder has its own `README.md` showing the exact format. Start there.
