// 옆으로 넘기는 긴 이름표: 글자가 양옆 여백 선에서 흐릿하게 사라지게 (CSS의 --fade-l / --fade-r 로 마스크)
// - 처음(맨 왼쪽)엔 왼쪽 흐림 없음, 끝까지 밀면 오른쪽 흐림 없음, 이름이 짧으면 양쪽 다 없음
// 쓰는 법: <span ref={fadeEdges} className="..."> (React 19 ref 콜백 — 돌려준 함수로 정리)
export function fadeEdges(el) {
  if (!el) return undefined
  const update = () => {
    const max = el.scrollWidth - el.clientWidth
    el.style.setProperty('--fade-l', el.scrollLeft > 1 ? '0' : '1')
    el.style.setProperty('--fade-r', el.scrollLeft < max - 1 ? '0' : '1')
  }
  update()
  el.addEventListener('scroll', update, { passive: true })
  // 글꼴이 늦게 불러와져 글자 폭이 바뀌어도 다시 계산
  const observer = new ResizeObserver(update)
  observer.observe(el)
  if (el.firstElementChild) observer.observe(el.firstElementChild)
  return () => {
    el.removeEventListener('scroll', update)
    observer.disconnect()
  }
}
