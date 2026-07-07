# QA Tracker

Order review tracker for monitoring AI order-taking systems.

## Deploy to GitHub Pages

```bash
npm install
npm run deploy
```

This builds and pushes to a `gh-pages` branch. Then in your repo go to **Settings → Pages → Source** → select **Deploy from a branch** → pick `gh-pages` / `/ (root)` → Save.

Your site will be at `https://<username>.github.io/<repo-name>/`

## Local dev

```bash
npm install
npm run dev
```

## Features

- Main order counter
- Dynamic branches with counters
- Notes per branch (critical/regular) with occurrence counters
- Order number tagging with optional timestamps
- Triple-confirm delete/reset safety
- Export report (critical notes first)
- Data persists in localStorage
- PWA-ready (add to iPhone home screen)
