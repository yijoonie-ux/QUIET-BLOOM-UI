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
- No profile type names (e.g. "고요한 오래감상형"); show conditions like "저자극 · 저향". Both Bloom Profile cards (onboarding result and Make Quiet Bloom) use the same bottom two rows split by a hairline: "민감도" (e.g. "저자극 · 저향", or "없음") and "제외 식물" (names, "외 N종" past two, only one name if two don't fit, or "없음"); no plant count. Helpers `sensitivityText` / `excludedPlantsText` in `src/data/profile.js`.
- Fine-tune sheet can be dragged by its handle. Each slider edits one step by one stem (0 removes the plant): 더 가볍게/더 풍성하게 → Texture (fallback Volume); 더 낮고 안정적으로/더 높고 길게 → Line; 더 정돈되게 → Structure (fallback Volume) / 더 자연스럽게 → Volume (fallback Structure). Removing takes the least-used plant of that step, adding goes to the most-used. Guides say which step's plant changed (e.g. "Texture 단계의 필리카를 빼서 결을 가볍게 정돈해요."), and the Final Preview sentence names it ("필리카·팔손이를 빼서 더 가볍게 · 더 정돈되게 다듬었어요."). Decreases are shown in dark text, never orange.
- Grove (유지력 + 저자극): recipe adds 팔손이 1 (Structure) and 필리카 1 (Texture). The mic gives `grove-vase` (Figma 2845:24885, with both); Fine-tune 더 가볍게 + 더 정돈되게 removes them and shows `grove-tidy-vase` (the original photo). Demo guide rings the left ends of both sliders. The Grove preview image (Bloom Preview / AI preview) includes 팔손이·필리카 (Figma 3833:547 / 3833:681).
- Stores (`src/data/sourcing.js`, sample data): 양재 꽃시장 / 고속터미널 꽃시장 / 온라인 꽃 도매몰. Plants the chosen store lacks must be substituted before "완성하기" is enabled. Every bouquet has all its plants at one market (`FULL_STORE`, alternating 양재/고터: Still·Grove·Hush·Ember 양재, Lush·Sway·Ramble·Glade 고터), which becomes the recommended store, so no substitute is needed by default; substituting would require new bouquet photos. `SOLD_OUT` is empty. Substitutes carry through to Complete and Details as "OO 대신" and never show "이번 주 품절".
- Make This Bloom plant sheet shows only the chosen store (one-store shopping): if the plant is there, that store with "위치 보기" (markets, map) or "상품 보기" (online); if not, one line "OO에서는 이번 주 구하기 어려워요." then Alternatives. The sheet scrolls inside the white panel and locks the page behind. Substitute cards show only photo, name, price and "바꾸기".
- Changing the store reverts substitutes made for the previous store; returning to a store re-applies the substitutes made there. Store order is fixed (ranked by the original recipe) and each store's count reflects the composition it would have if chosen.
- Share buttons (Details, Complete) always toast "링크를 복사했어요".
- The AI preview mic never uses real speech recognition: tapping it always types the preset demo sentence (`demo` in `src/data/bouquets.js`, e.g. "진주랑 큐빅으로 꾸며서…") so the demo is predictable.
- Demo restart: holding two fingers on any screen for ~0.7s shows "처음부터 다시 시작할까요?" (취소 / 다시 시작); 다시 시작 reloads the page, which restarts at `/onboarding` (`src/components/RestartGesture.jsx`).
- Refreshing any screen restarts at `/onboarding` (`src/data/onboarding.js`); opening a link fresh (e.g. a shared `/blooms/still`) keeps that screen.
- Sway uses 베어그라스 (not 스틸그라스). Grove has 트리펀 2.
- Bouquet styles (AI preview result): Still 화기→행잉, Lush 다발, Grove 화기, Sway 행잉, Hush 화기, Ramble 화기, Ember 다발, Glade 화기. Demo sentences mention only decorations actually visible in the photo (큐빅 only in Ember's final result; Grove has none: "잘 정돈해서 화기에 꽂아줘").
- Use "화기" (not "화병") everywhere in Korean; English label is "Vessel Preview".
- Fine-tune sheet has a fixed height (700px, max 90%); content scrolls inside and the apply button stays at the bottom.
- AI preview result bar: "부케 제작하기" (was "실제 제작 준비하기") + a round sage Fine-tune (인상 다듬기) icon button next to it; there is no mic re-request on the result screen. The first AI preview screen guides the mic ("마이크를 눌러 원하는 연출을 말해보세요" + soft ring).
- Still: recipe has 연밥 6 (Figma originally 7, `tuneTargets: { volume: '연밥' }`); preview Figma 3835:5038, vase result Figma 3835:5109 (연밥 6 + 진주). `still-hanging` is now a tune result (`tune: { volume: 1 }`): Fine-tune 더 풍성하게 (연밥 6→7) + 행잉. Demo guide: "인상을 다듬어 더 풍성한 행잉으로 바꿔볼까요?" (ring on the Fine-tune button, the volume slider's right end, the 행잉 chip, then 수정 적용하기) → after applying, "이제 실제로 만들어볼까요?" with a ring on 부케 제작하기.
- Lush (유지력 + 무필터): recipe has 운룡버들 1 (Figma originally 2). The mic gives the first result `lush-wrap` (Figma 3833:458, one willow); Fine-tune "더 높고 길게" adds one Line plant (운룡버들 1→2, guide "Line 역할을 하는 운룡버들을 하나 더 넣고…") and switches to `lush-tall-wrap` (the original two-willow photo). Results with `tune: {...}` appear only through Fine-tune, never from the mic. Lush preview image (Bloom Preview / AI preview) is the one-willow version (Figma 2881:3646). Lush demo guide: "인상을 다듬어 더 높고 길게 해볼까요?" → ring at the right end of the height slider → 수정 적용하기 → 부케 제작하기 (same pattern as Still; config `DEMO_GUIDE` in `BloomPreview.jsx`). The home My Blooms cutout is still the two-willow image.
- Sway (유지력 + 저향): the mic result `sway-hanging` has lace + pearl; Fine-tune 장식 "없음" switches to `sway-plain-hanging` (Figma 3835:3277, no decorations; styling cost = hanging only 13,000). Demo guide rings the "없음" chip. A result's `tune` can also hold `decor: [...]`, matched exactly.
- Hush (예산 + 저자극 + 저향): recipe adds 나선골풀 1 (Texture); preview is Figma 3835:3452 (with 나선골풀). The mic gives `hush-wrap` (Figma 3835:3374, 다발 + lace/pearl); Fine-tune 더 낮고 안정적으로 + 화기 removes 나선골풀 and shows `hush-vase` (the original final photo). `tuneTargets: { height: '나선골풀' }` in bouquets.js overrides the step rule for that axis (a target plant can go to 0). Demo guide rings the height slider's left end and the 화기 chip.
- Ramble (예산 + 무필터): the mic gives `ramble-hanging` (Figma 3835:3832, hanging, no decorations); Fine-tune 더 높고 길게 (아이비 2→3) + 화기 + 진주·레이스 shows `ramble-vase` (the original final photo). Demo guide rings the height slider's right end and the 화기 · 진주 · 레이스 chips.
- Ember (예산 + 저자극): recipe has 엽란 1 (Figma originally 2); preview is Figma 3835:4051. The mic gives `ember-wrap` (Figma 3835:4409, wrap only, no decorations, demo "깔끔하게 다발로 묶어줘"); Fine-tune 더 풍성하게 + 큐빅 adds 엽란 1→2 (`tuneTargets: { volume: '엽란' }`, guide "Structure 단계의 엽란을 하나 더 넣어, 부케를 풍성하게 채워요.") and shows `ember-cubic-wrap` (Figma 3835:4485). Demo guide rings the volume slider's right end and the 큐빅 chip. The home My Blooms cutout is still the old image (black leaves + lace).
- Glade (예산 + 저향): recipe adds 냉이초 1 (Texture, `tuneTargets: { volume: '냉이초' }`); preview is Figma 3835:4845 (no crop). The mic gives `glade-vase` (Figma 3835:4957, 화기, no decorations, demo "단정하게 화기에 꽂아줘"); Fine-tune 더 가볍게 + 진주 · 레이스 removes 냉이초 and shows `glade-lace-vase` (the original final photo). Demo guide rings the volume slider's left end and the 진주 · 레이스 chips.
- Decor sentence: only added → "진주 · 레이스 장식을 더했어요", only removed → "… 장식을 뺐어요", both → "… 장식으로 바꿨어요".
- "이대로 부케 제작하기" (Bloom Preview, skipping AI) makes the bouquet with no result: no styling materials, and Complete / Bloom Card / My Blooms / Details show the plain bouquet photo (fully visible in the hero; `preview.heroX` shifts it so the stem is centered, Grove 27). On Bloom Card and the My Blooms card the plain bouquet sits on the sage gradient with margins (below the name, above the saved pill, both sides) so the whole bouquet shows. A user-made bloom made with an AI result shows that result's card in My Blooms.
- My Blooms sample cards show each bouquet's final version = the last entry in `results` (Still hanging, Lush two willows, Grove tidy, Sway no decorations), with recipe/decor/price adjusted by that result's `tune`. User-made blooms keep what was actually made.
- Composition (cart) is always sorted by step: Structure → Volume → Line → Texture (same step keeps the added order).
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
