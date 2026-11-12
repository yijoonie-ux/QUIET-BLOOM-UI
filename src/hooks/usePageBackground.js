import { useLayoutEffect } from 'react'

// 페이지 맨 아래 색을 문서 바깥 배경에도 깔아 둠.
// iOS 홈 화면 앱에서 화면 높이가 실제보다 짧게 잡히거나 끝까지 당겨 스크롤할 때
// 페이지 아래로 비치는 영역이 회색 띠로 보이지 않게 함
export function usePageBackground(color) {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.backgroundColor = color
    document.body.style.backgroundColor = color
  }, [color])
}
