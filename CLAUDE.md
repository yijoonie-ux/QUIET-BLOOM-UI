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

The owner rejects anything that looks "AI-made". Aim for refined, minimal, sensory. Reference: rondesignlab (Instagram): large light numerals, generous whitespace, hairline dividers, few boxes. English section headings follow the existing screens (18px semibold, title case like "About This Bloom"), not small uppercase letter-spaced labels (owner found them inconsistent).

- Do not use: vague drop shadows, gradients on selected states, orange text, decorative leaf shapes / leaf line art / lime dots / leaf-shaped knobs or icons (all tried and rejected).
- Inactive cards may use translucent glass only (`.glass-card` in `src/index.css`); selected = white with a sage inset border.
- The brand logo (four-leaf silhouette) appears only as icons: Compose tab icon (`tab-logo.png`), the Home slider knob (arrow turns 180° into the line logo `logo-line.svg`), and the empty My Blooms icon (`empty-icon.svg`).
- When the owner says "기능은 빼", change wording only, not behavior.

Product decisions to keep:

- Flow: AI preview → "부케 제작하기" → Make This Bloom (`/realize`: cost, store recommendation, substitutes, styling materials) → "완성하기" → Bloom Complete → "Bloom Card로 저장하기" → `/saved`.
- No profile type names (e.g. "고요한 오래감상형"); show conditions like "저자극 · 저향". The onboarding result card's bottom line shows "제외 식물" (names, "외 N종" past two, only one name if two don't fit on the line, or "없음"), not the plant count.
- Fine-tune sheet can be dragged by its handle. "더 풍성하게" adds one volume plant; "더 가볍게" removes one structure plant (Grove has none, so 트리펀 3→2).
- Stores (`src/data/sourcing.js`, sample data): 양재 꽃시장 / 고속터미널 꽃시장 / 온라인 꽃 도매몰. Plants the chosen store lacks must be substituted before "완성하기" is enabled. Every bouquet has all its plants at one market (`FULL_STORE`, alternating 양재/고터: Still·Grove·Hush·Ember 양재, Lush·Sway·Ramble·Glade 고터), which becomes the recommended store, so no substitute is needed by default; substituting would require new bouquet photos. `SOLD_OUT` is empty. Substitutes carry through to Complete and Details as "OO 대신" and never show "이번 주 품절".
- Make This Bloom plant sheet shows only the chosen store (one-store shopping): if the plant is there, that store with "위치 보기" (markets, map) or "상품 보기" (online); if not, one line "OO에서는 이번 주 구하기 어려워요." then Alternatives. The sheet scrolls inside the white panel and locks the page behind. Substitute cards show only photo, name, price and "바꾸기".
- Changing the store reverts substitutes made for the previous store; returning to a store re-applies the substitutes made there. Store order is fixed (ranked by the original recipe) and each store's count reflects the composition it would have if chosen.
- Share buttons (Details, Complete) always toast "링크를 복사했어요".
- The AI preview mic never uses real speech recognition: tapping it always types the preset demo sentence (`demo` in `src/data/bouquets.js`, e.g. "진주랑 큐빅으로 꾸며서…") so the demo is predictable.
- Refreshing any screen restarts at `/onboarding` (`src/data/onboarding.js`); opening a link fresh (e.g. a shared `/blooms/still`) keeps that screen.
- Sway uses 베어그라스 (not 스틸그라스). Grove has 트리펀 2.
- Bouquet styles (AI preview result): Still 화기→행잉, Lush 다발, Grove 화기, Sway 행잉, Hush 화기, Ramble 화기, Ember 다발, Glade 화기. Demo sentences mention only decorations actually visible in the photo (no 큐빅 anywhere; Grove has none: "잘 정돈해서 화기에 꽂아줘").
- Use "화기" (not "화병") everywhere in Korean; English label is "Vessel Preview".
- Fine-tune sheet has a fixed height (700px, max 90%); content scrolls inside and the apply button stays at the bottom.
- AI preview result bar: "부케 제작하기" (was "실제 제작 준비하기") + a round sage Fine-tune (인상 다듬기) icon button next to it; there is no mic re-request on the result screen. The first AI preview screen guides the mic ("마이크를 눌러 원하는 연출을 말해보세요" + soft ring).
- Still demo guide: vase result → "인상을 다듬어 행잉으로 바꿔볼까요?" (ring on the Fine-tune button, then on the 행잉 chip, then on 수정 적용하기) → after applying, "이제 실제로 만들어볼까요?" with a ring on 부케 제작하기.
- Lush (유지력 + 무필터): recipe has 운룡버들 1 (Figma originally 2). The mic gives the first result `lush-wrap` (Figma 3833:458, one willow); Fine-tune "더 높고 길게" adds one Line plant (운룡버들 1→2, guide "Line 역할을 하는 운룡버들을 하나 더 넣고…") and switches to `lush-tall-wrap` (the original two-willow photo). Results with `tune: {...}` appear only through Fine-tune, never from the mic. "더 높고 길게" adds one Line plant for every bouquet. Lush preview image (Bloom Preview / AI preview) is the one-willow version (Figma 2881:3646). Lush demo guide: "인상을 다듬어 더 높고 길게 해볼까요?" → ring at the right end of the height slider → 수정 적용하기 → 부케 제작하기 (same pattern as Still; config `DEMO_GUIDE` in `BloomPreview.jsx`). The home My Blooms cutout is still the two-willow image.
- Final Preview subtitle states what changed (e.g. "행잉 연출로 바꿨어요."); no tag chip under it.
- Styling cost always follows the current result's form plus Fine-tune choices (Still vase 9,000 vs hanging 14,000), for every bouquet.
- Make This Bloom shows only the estimated cost (no budget comparison/over-budget line, even for 예산 순).
- Bloom Complete / Details: Composition is one list (plants with qty, tap → detail popup) + the store chosen in Make This Bloom (passed as `state.store`, saved with the bloom; default = recommended store) + 연출 소재; links use ↗ only on this page.
- Bloom names: pencil on Complete/Details edits the name inline; it shows on Bloom Card, My Blooms, the home card and the saved toast. Completing a new make resets that bouquet's name to the default. Long names fade at the side margins and can be dragged sideways (`src/hooks/fadeEdges.js`).
- Compose: plants outside the current bouquet's recipe are not added; tapping their + (or 추가하기 in the detail popup) softly shows "안내해 드린 식물부터 천천히 담아볼까요?" in the bottom hint for ~3s (no popup, + stays visible). A plant once added can always be removed and re-added.
- Every plant opens the detail popup (`src/data/plantDetails.js`: two-line description, lasting days, water). 저자극/향 노출 come from the filter values in `plants.js`; lasting days follow the 유지력 order within each step (sample values). Air plants use "주 1회 분무".

## Deployment

`index.html` loads `/src/main.jsx` directly, so the raw repo cannot be served as a static site. Only the built `dist/` works.

- Vercel (recommended, no code changes): `vercel.json` already rewrites every path to `/index.html` so deep links like `/compose` survive a refresh. Works with a private repo. Steps: vercel.com, sign in with GitHub, Add New, Project, Import `QUIET-BLOOM-UI`, keep the Vite preset, Deploy. Every push to `main` redeploys.
- Netlify: `public/_redirects` handles the same SPA fallback.
- GitHub Pages: not set up. It would require making the repo public, setting `base: '/QUIET-BLOOM-UI/'` in `vite.config.js`, fixing absolute paths (`/favicon.png`, `/manifest.webmanifest`, router basename, `DevicePreview` iframe `src`), adding a 404 fallback, and a GitHub Actions workflow. Only do this if the owner explicitly asks for a `github.io` URL.

## Current status

Last updated 2026-11-22 (home PC session).

- 2026-11-22: Edit Conditions glass/deboss cards, plant detail popup for all 60 plants, soft nudge for off-guide plants, Still Fine-tune guide, result bar redesign, Composition + chosen store merge, bloom renaming (see the product decisions above).
- All 8 bouquet flows follow the Still flow and were captured screen by screen to the Desktop folder `Quiet Bloom 캡처/부케 8종 플로우` (capture script lives only in the home PC scratchpad). Details of this session in `docs/CHANGELOG.md` (2026-11-21).
- Toasts (home saved notice, share "링크를 복사했어요", Make This Bloom swap) were switched from black to white glass; the owner will check on a phone and decide whether to keep it.
- Open idea, not done: small "NEW" label on the home My Blooms card (owner chose the toast only).
- Deployed on Vercel (team `yijoon`, project `quiet-bloom-ui`): https://quiet-bloom-ui.vercel.app (push to `main` redeploys). Per-deployment URLs redirect to a Vercel login, so always share the production URL.
- The app icon was made from a 208×208 image (slightly soft at 512px). If the owner provides a 1024px+ original, regenerate the four icons in `public/` and bump `?v=` in `index.html` and `public/manifest.webmanifest`.

Next step: owner reviews on phone (toast style, Fine-tune sheet height, Complete fixed button), then continue with `TODO.md`.
