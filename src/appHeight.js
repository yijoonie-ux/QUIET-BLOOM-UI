// 앱 화면 높이 → CSS 변수 --app-h, 화면 맞춤 비율 → --fit
//
// 1) --app-h
// iOS 홈 화면 앱(standalone)은 가끔 처음 켤 때 화면 높이를 상태바만큼 짧게 잡는다.
// 그러면 100dvh는 물론 position: fixed; inset: 0 까지 짧아져서 화면 아래에 빈 띠가 남는다.
// 홈 화면 앱은 항상 기기 화면 전체를 쓰므로, 그때는 기기 화면 높이(screen)를 그대로 쓴다.
// 그 외(사파리, PC 미리보기 iframe)에는 변수를 두지 않아 CSS의 100dvh가 쓰인다.
//
// 2) --fit
// 한 화면짜리 페이지(온보딩·프리뷰·My Blooms 등)는 디자인 390×844 기준으로 위·아래에서 위치를 잡는다.
// 카카오톡 같은 앱 안 브라우저나 사파리 툴바로 쓸 수 있는 높이가 짧으면 가운데에서 서로 겹치므로,
// 그때는 디자인 배치를 그대로 둔 채 화면에 맞게 통째로 줄인다 (.fit-screen, index.css).

const DESIGN_W = 390
const DESIGN_H = 844
const MIN_FIT = 0.7

const isIosStandalone = () => window.navigator.standalone === true

function fullHeight() {
  const { width, height } = window.screen
  const portrait = window.innerHeight >= window.innerWidth
  const screenH = portrait ? Math.max(width, height) : Math.min(width, height)
  return Math.max(window.innerHeight, screenH)
}

function sync() {
  const root = document.documentElement
  const standalone = isIosStandalone()
  if (standalone) root.style.setProperty('--app-h', `${fullHeight()}px`)
  else root.style.removeProperty('--app-h')

  const h = standalone ? fullHeight() : window.innerHeight
  const fit = Math.max(MIN_FIT, Math.min(1, h / DESIGN_H, window.innerWidth / DESIGN_W))
  root.style.setProperty('--fit', fit.toFixed(4))
  // 폭 350으로 고정된 카드(조건 수정 민감도 등)가 좁은 화면(좌우 여백 20)에 들어가도록 줄이는 비율
  root.style.setProperty('--narrow', Math.min(1, (window.innerWidth - 40) / 350).toFixed(4))
  // 폭 390으로 그려진 영역(홈 화면)을 좁은 화면 폭에 맞게 줄이는 비율
  root.style.setProperty('--fit-w', Math.min(1, window.innerWidth / DESIGN_W).toFixed(4))
}

export function watchAppHeight() {
  sync()
  window.addEventListener('resize', sync)
  window.addEventListener('orientationchange', () => setTimeout(sync, 300))
  // 앱으로 돌아왔을 때 다시 계산 (백그라운드에서 돌아올 때 높이가 바뀌는 경우)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync()
  })
}

// 화면 좌표로 계산하는 곳(안내 딤 등)에서 쓰는 앱 높이
export function appHeight() {
  return isIosStandalone() ? fullHeight() : window.innerHeight
}
