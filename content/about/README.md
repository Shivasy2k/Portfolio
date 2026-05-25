# `about/` — bio + experience timeline

## `bio.md` — paragraphs (no frontmatter needed)

Separate paragraphs with a blank line. Each becomes a `<p>` on the About page.

```md
I'm Sivakumar, a Software Architect with 18+ years of experience…

When I'm not behind a keyboard you'll find me speaking at conferences…
```

## `experience/` — one `.md` file per role

File names like `01-equifax.md`, `02-tcs.md` control the order (numeric sort).

```md
---
period: 2019 — Present
role: Lead Developer / Product Lead
org: Equifax Inc
location: Atlanta, GA
summary: Leading the platform group — API strategy, cloud architecture, AI-powered customer experiences.
---
```

`summary` is optional. If you omit it, the first paragraph of the file body is used.
