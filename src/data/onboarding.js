// 온보딩은 페이지를 새로 불러올 때마다(새로고침·링크 재접속) 처음에 한 번 보여줌.
// 홈이 아닌 화면 주소로 바로 들어온 경우(예: /compose 새로고침)는 이미 온보딩을 거친 것으로 봄
let onboarded = !['/', '/onboarding'].includes(window.location.pathname)

export const isOnboarded = () => onboarded

export function markOnboarded() {
  onboarded = true
}
