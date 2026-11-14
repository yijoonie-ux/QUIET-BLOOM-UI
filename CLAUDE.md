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

## Design preferences (from the home PC sessions)

The owner rejects anything that looks "AI-made". Aim for refined, minimal, sensory. Reference: rondesignlab (Instagram): large light numerals, generous whitespace, hairline dividers, few boxes, small uppercase English labels.

- Do not use: vague drop shadows, gradients on selected states, orange text, decorative leaf shapes / leaf line art / lime dots / leaf-shaped knobs or icons (all tried and rejected).
- Inactive cards may use translucent glass only (`.glass-card` in `src/index.css`); selected = white with a sage inset border.
- The brand logo (four-leaf silhouette) appears only as icons: Compose tab icon (`tab-logo.png`), the Home slider knob (arrow turns 180° into the line logo `logo-line.svg`), and the empty My Blooms icon (`empty-icon.svg`).
- When the owner says "기능은 빼", change wording only, not behavior.

Product decisions to keep:

- Flow: AI preview → "실제 제작 준비하기" → Make This Bloom (`/realize`: cost, store recommendation, substitutes, styling materials) → "완성하기" → Bloom Complete → "Bloom Card로 저장하기" → `/saved`.
- No profile type names (e.g. "고요한 오래감상형"); show conditions like "저자극 · 저향" and "조건에 맞는 식물 N종".
- Fine-tune sheet can be dragged by its handle. "더 풍성하게" adds one volume plant; "더 가볍게" removes one structure plant (Grove has none, so 트리펀 3→2).
- Stores (`src/data/sourcing.js`, sample data): 양재 꽃시장 / 고속터미널 꽃시장 / 온라인 꽃 도매몰. Plants the chosen store lacks must be substituted before "완성하기" is enabled. Substitutes carry through to Complete and Details as "OO 대신" and never show "이번 주 품절".
- Share buttons (Details, Complete) always toast "링크를 복사했어요".
- Sway uses 베어그라스 (not 스틸그라스). Grove has 트리펀 2.

## Deployment

`index.html` loads `/src/main.jsx` directly, so the raw repo cannot be served as a static site. Only the built `dist/` works.

- Vercel (recommended, no code changes): `vercel.json` already rewrites every path to `/index.html` so deep links like `/compose` survive a refresh. Works with a private repo. Steps: vercel.com, sign in with GitHub, Add New, Project, Import `QUIET-BLOOM-UI`, keep the Vite preset, Deploy. Every push to `main` redeploys.
- Netlify: `public/_redirects` handles the same SPA fallback.
- GitHub Pages: not set up. It would require making the repo public, setting `base: '/QUIET-BLOOM-UI/'` in `vite.config.js`, fixing absolute paths (`/favicon.png`, `/manifest.webmanifest`, router basename, `DevicePreview` iframe `src`), adding a 404 fallback, and a GitHub Actions workflow. Only do this if the owner explicitly asks for a `github.io` URL.

## Current status

Last updated 2026-11-13 (office PC session).

- Confirmed the project builds cleanly with `npm run build`. The only output is a warning that the main JS chunk is 514 kB (over 500 kB); harmless for now.
- Deployed on Vercel (team `yijoon`, project `quiet-bloom-ui`). Public URL: https://quiet-bloom-ui.vercel.app (verified 200, deep links like `/compose` also 200). Per-deployment URLs (`quiet-bloom-<hash>-yijoon.vercel.app`) redirect to a Vercel login because of deployment protection, so always share the production URL above. Pushing to `main` redeploys automatically.
- Owner asked about switching the repo from private to public. Only needed for GitHub Pages; not needed for Vercel. Not yet confirmed whether it was changed. Commit history was scanned on 2026-11-13: no `.env` files, API keys, tokens or passwords, so it is safe to make public.
- `gh` CLI is not installed on the office PC, so repo settings were changed through the GitHub web UI.

- UI changes this session (details in `docs/CHANGELOG.md`, 2026-11-13): new app icons (gradient clover on white, cache version `?v=5`); 저향 is now an on/off toggle like 저자극 on onboarding, Edit Conditions and the Home profile card (`ScentRange` removed); Edit Conditions no longer shows icons before 저자극/저향 (the owner's professor said the wind icon looked like a bone; after comparing alternatives the owner chose to drop both icons for consistency).
- The app icon was made from a 208×208 image, so it is slightly soft at 512px. If the owner provides a 1024px+ original, regenerate the four icons in `public/` and bump `?v=` in `index.html` and `public/manifest.webmanifest`.

Next step: continue with `TODO.md` or whatever UI change the owner asks for.
