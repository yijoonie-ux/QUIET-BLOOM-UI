# Quiet Bloom UI

향과 자극에 민감한 사람을 위한 풀부케 구성 서비스 **Quiet Bloom**의 모바일 웹 UI입니다.
Figma 시안(파일 `urkl2deJCcXjkLjYasrSDG`)을 바탕으로 만들었고, iPhone 13(390×844)을 기준 화면으로 합니다.

남은 작업은 [TODO.md](TODO.md), 화면 캡처는 [docs/SCREENS.md](docs/SCREENS.md), 작업 기록은 [docs/CHANGELOG.md](docs/CHANGELOG.md)에 있습니다.

## 실행

```bash
npm install
npm run dev -- --host   # 같은 Wi-Fi의 폰에서 http://<PC IP>:5173 으로 접속
npm run lint            # oxlint
npm run build           # dist/ 에 빌드
```

- **PC 브라우저(폭 600px 이상)**: iPhone 13 목업 안에 앱이 보입니다. 목업 없이 보려면 주소 뒤에 `?frame=off`를 붙이세요.
- **폰**: 화면 폭에 맞춰 꽉 차게 보입니다. 사파리에서 **공유 → 홈 화면에 추가**하면 주소창 없는 앱처럼 실행됩니다(PWA).

## 기술 스택

- Vite 8, React 19, react-router 7
- 순수 CSS (화면별 `.css` 파일, 공통 토큰은 `src/index.css`)
- 서버 없음: 데이터는 모두 `src/data/`의 메모리 저장소와 예시 데이터

## 화면과 주소

| 주소 | 화면 | Figma |
|---|---|---|
| `/onboarding` | 온보딩 (인트로 → 민감도 → 피하고 싶은 식물 → 추천 기준 → 완료) | 2268:20585 · 20554 · 20756 · 20679 · 20710 · 20539 |
| `/` | 홈 (Bloom Profile 카드, My Blooms 카드, 하단 탭) | 2268:17172 · 만든 뒤 2268:17297 |
| `/make` | Make Quiet Bloom (조건 확인 카드) | 2268:17919 |
| `/edit` | 조건 수정 / Bloom Profile | 2268:17827 · 2268:17735 · 2350:35711 |
| `/compose` | 부케 구성 (Structure · Volume · Line · Texture, Composition 시트) | 2268:18886 · 19129 · 20043 · 19399 · 19672 |
| `/preview` | Bloom Preview → AI 프리뷰 → 생성 중 → 생성 결과 | 2268:21089 · 21057 · 20786 · 20983 · 2376:36036 · 36115 · 2268:20856 |
| `/complete` | Bloom Complete | 2268:20344 |
| `/card` | Bloom Card (현재 흐름에서는 건너뜀) | 2268:20892 |
| `/print` | 카드 출력 모션 → 출력 완료 (Bloom Complete "카드로 만들기"에서 이어짐) | (Figma 없음) |
| `/blooms` | My Blooms (3D 캐러셀 — 좌우로 넘기기, 가운데 카드를 아래로 내려 자세히 보기) | 2268:20919 |
| `/blooms/:id` | Bloom Details (`still` · `calm` · `airy`) | Still 2268:20476 · Calm 2268:20410 · Airy 없음 |
| `/mypage` | 마이페이지 | 2168:2678 |

팝업: 식물 상세(2268:18608), 부케 구성 종료 확인(2268:18353), 부케 구성 첫 진입 안내 딤.

## 전체 흐름

```
온보딩 ─▶ 홈 ─▶ Make Quiet Bloom ─▶ 부케 구성 ─▶ (로딩) ─▶ Bloom Preview
                    │                                         │
                    └▶ 조건 수정                    ┌─ 이대로 완성하기 ─┤
                                                    │                   └▶ AI 프리뷰 ─▶ 말하기/입력 ─▶ 생성 중 ─▶ 결과
                                                    │                                                      │ (다시 요청 가능)
                                                    └────────────────▶ Bloom Complete ◀── 완성하기 ─────────┘
                                                                            │ 카드로 만들기
                                                                            ▼
                                                                   카드 출력 → 출력 완료 ─▶ 홈 / My Blooms
홈 ─▶ My Blooms ─(카드를 아래로)─▶ Bloom Details
홈 ↔ 마이페이지 (하단 탭)
```

- **온보딩**은 앱을 새로 열거나 새로고침할 때마다 처음에 한 번 나옵니다. 홈이 아닌 주소로 바로 들어오면 건너뜁니다.
- **부케 구성 안내 딤**은 페이지를 새로 불러올 때마다 첫 진입 시 한 번 나옵니다.
- 담은 식물·수량은 화면을 오가도 유지되고, 부케 구성에서 **나가기** 또는 출력 완료에서 **홈으로 가기 / My Blooms 보기**를 누르면 비워집니다.
- 카드 출력까지 마치면 홈 My Blooms 카드가 "최근 저장한 부케"로 바뀝니다 (메모리 저장 — 새로고침하면 빈 상태).

## 폴더 구조

```
src/
  pages/        화면 (주소 하나당 하나)
  components/   여러 화면에서 쓰거나 독립된 UI
                TabBar, SlideToStart, ScentRange, ChipScroller,
                ComposeGuide(안내 딤), CompositionSheet, PlantDetail, ExitConfirm,
                BouquetLoader(파티클 로딩), BloomGenerating(생성 중), CardSparkles(카드 파티클), ...
  data/         메모리 저장소와 예시 데이터
    profile.js    민감도·제외 식물·추천 기준 (온보딩/조건 수정이 저장, 홈·추천이 읽음)
    plants.js     식물 목록·카드 사진 배치·추천 정렬
    bouquet.js    담은 식물과 수량 (부케 구성 ↔ 프리뷰 ↔ 완성 공유)
    results.js    AI 생성 예시 결과 (화병 → 행잉)
    blooms.js     My Blooms 예시 데이터(Still · Airy · Calm), 이번에 만든 부케(saveMadeBloom)
    onboarding.js 온보딩 표시 여부
  hooks/        usePageLeave(퇴장 모션 후 이동), usePageBackground(화면 바깥 배경색),
                useInView, useTilt, useDragScroll(PC 가로 넘김)
docs/           화면 캡처(SCREENS.md, screens/), 작업 기록(CHANGELOG.md)
  preview/      PC에서 보이는 iPhone 목업
  assets/       화면별 이미지·아이콘 (Figma에서 받은 것, 큰 사진은 JPG로 압축)
public/         PWA manifest, 앱 아이콘(apple-touch-icon 등)
```

## 작업 규칙

- 위치·크기는 Figma 값을 그대로 쓰고, 계산이 필요한 값은 CSS 주석에 근거를 적습니다 (예: `/* 설명 top 130 */`).
- 색은 `src/index.css`의 토큰을 우선 씁니다 (`--qb-text-strong`, `--qb-text-sub`, `--qb-toggle-off` 등).
- 모션은 `--ease-spring-soft`, `--ease-spring-gentle`, `--ease-smooth`, `--ease-leave`를 쓰고, `prefers-reduced-motion`에서는 끕니다.
- 화면 높이는 `100dvh`·`inset: 0`·`bottom` 대신 **`var(--app-h, 100dvh)`** 를 씁니다. iOS 홈 화면 앱은 가끔 첫 실행 때 화면 높이를 상태바만큼 짧게 잡아 아래에 빈 띠가 생기므로, `src/appHeight.js`가 그때 기기 화면 높이를 `--app-h`에 넣습니다. 한 화면짜리 페이지는 `position: fixed; top: 0; left: 0; right: 0; height: var(--app-h, 100dvh)`, 화면 아래에 붙는 요소는 `top: calc(var(--app-h, 100dvh) - …)`로 둡니다.
- 한 화면짜리 페이지(온보딩·프리뷰·로딩·생성 중·My Blooms·카드 출력·Bloom Card)의 최상위에는 `fit-screen` 클래스를 붙입니다. 카카오톡 인앱 브라우저·사파리 툴바처럼 쓸 수 있는 높이가 844보다 짧으면 디자인 배치를 그대로 둔 채 화면에 맞게 통째로 줄어듭니다(`--fit`, 최소 0.7). 이 안에서 손가락 이동량을 쓸 때는 `--fit`으로 나눠 환산합니다.
- 390보다 좁은 화면(갤럭시 360 등): 폭 350 카드는 `width: 100%; max-width: 350px`로 두고, 모양이 고정된 영역(홈 그림 영역·민감도 카드)은 `zoom: var(--fit-w)` / `var(--narrow)`로 폭에 맞게 줄입니다.
- 큰 사진은 화면에 그려지는 크기의 3배 이하로 줄이고, 배경이 있으면 JPG로 저장합니다.
- 주석과 화면 문구는 한국어로 씁니다.
