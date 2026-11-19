// 새로고침하면 어느 화면에 있었든 온보딩부터 다시 시작.
// 공유받은 링크(예: /blooms/still)를 처음 열 때는 새로고침이 아니라서 그 화면을 그대로 보여줌
const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload'
if (isReload && window.location.pathname !== '/onboarding') {
  window.history.replaceState(null, '', '/onboarding' + window.location.search)
}

// 온보딩은 페이지를 새로 불러올 때마다(새로고침·링크 재접속) 처음에 한 번 보여줌.
// 홈이 아닌 화면 주소로 바로 들어온 경우(예: 공유 링크)는 이미 온보딩을 거친 것으로 봄
let onboarded = !['/', '/onboarding'].includes(window.location.pathname)

export const isOnboarded = () => onboarded

export function markOnboarded() {
  onboarded = true
}
