# `talks/` — Talks & Media cards (the main grid on talks.html)

One `.md` file per talk. Fields:

```md
---
title: Beyond Rule Engines — Real-Time Fraud Detection with Graph AI and APIs
tag: Conference Talk
description: Agentic APIs for risk management, fraud detection, and regtech.
image: assets/img/API_Days_poster.png
link: https://www.apidays.global/events/new-york
cta: View session
---
```

- `image` — path to an image you've added under `assets/img/`. Optional; the card shows a clean lettered fallback if blank.
- `link` / `cta` — optional. If `link` is set, a "View details" link appears (or your `cta` text if you set it).
- The body of the markdown file is ignored unless you omit `description` (in which case the first paragraph is used).
