# CLAUDE.md

Guidance for Claude Code when working in this repository. The same repo is worked on from two PCs (office and home), each with a different Claude account, so this file is the shared context between them. Update the "Current status" section at the end of each session.

## Project

Quiet Bloom: a mobile web UI for a bouquet-composition service aimed at people sensitive to scent and irritants. Built from Figma file `urkl2deJCcXjkLjYasrSDG`; reference screen is iPhone 13 (390×844).

- Stack: Vite 8, React 19, react-router 7, plain CSS (per-screen `.css`, shared tokens in `src/index.css`)
- No server or database. All data lives in in-memory stores and sample data under `src/data/`.
- On desktop (width ≥ 600px) `src/main.jsx` wraps the app in an iPhone mockup iframe (`src/preview/DevicePreview.jsx`). `?frame=off` disables it.
- The owner (GitHub `yijoonie-ux`) is a designer, not a developer. Explain things in Korean, in plain terms, with click-by-click steps for any UI.

Read these before making changes:

- `README.md`: routes, screen flow, Figma node IDs per screen
- `GUIDE.md`: setup on a new PC, GitHub Desktop sync, deploy notes
- `TODO.md`: remaining work (also marked with `TODO:` comments in code)
- `docs/CHANGELOG.md`, `docs/SCREENS.md`: work history and screenshots

## Commands

```bash
npm install
npm run dev -- --host   # LAN-exposed so a phone on the same Wi-Fi can open it
npm run lint            # oxlint
npm run build           # outputs dist/
```

## Conventions

- All user-facing text and docs are Korean. Get spelling and spacing right on the first pass, including small labels.
- Code identifiers and commit messages follow the existing style in the repo (Korean commit messages like `안내 문서 추가` are fine).
- The owner syncs with GitHub Desktop: Pull before starting, Commit + Push when done. Do not create a second repository.

## Deployment

`index.html` loads `/src/main.jsx` directly, so the raw repo cannot be served as a static site. Only the built `dist/` works.

- Vercel (recommended, no code changes): `vercel.json` already rewrites every path to `/index.html` so deep links like `/compose` survive a refresh. Works with a private repo. Steps: vercel.com, sign in with GitHub, Add New, Project, Import `QUIET-BLOOM-UI`, keep the Vite preset, Deploy. Every push to `main` redeploys.
- Netlify: `public/_redirects` handles the same SPA fallback.
- GitHub Pages: not set up. It would require making the repo public, setting `base: '/QUIET-BLOOM-UI/'` in `vite.config.js`, fixing absolute paths (`/favicon.png`, `/manifest.webmanifest`, router basename, `DevicePreview` iframe `src`), adding a 404 fallback, and a GitHub Actions workflow. Only do this if the owner explicitly asks for a `github.io` URL.

## Current status

Last updated 2026-11-13 (office PC session).

- Confirmed the project builds cleanly with `npm run build`. The only output is a warning that the main JS chunk is 514 kB (over 500 kB); harmless for now.
- Owner wants an external URL. Recommended Vercel and gave the steps above; not yet confirmed whether it was deployed. If a `*.vercel.app` URL exists, record it here.
- Owner asked about switching the repo from private to public. Only needed for GitHub Pages; not needed for Vercel. Not yet confirmed whether it was changed. Commit history was scanned on 2026-11-13: no `.env` files, API keys, tokens or passwords, so it is safe to make public.
- `gh` CLI is not installed on the office PC, so repo settings were changed through the GitHub web UI.

Next step: ask the owner whether the Vercel deploy is done, then continue with `TODO.md`.
