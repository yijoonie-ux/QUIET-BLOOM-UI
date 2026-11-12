import { useEffect, useRef } from 'react'

// 가로 스크롤 줄을 마우스로 끌어도 넘어가게 (터치는 브라우저 기본 스크롤 그대로)
// PC 목업 미리보기에서도 옆으로 넘겨볼 수 있도록
export function useDragScroll() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let start = null

    // 5px 넘게 움직였을 때만 끌기로 봄 → 그냥 누른 건 안의 칸 클릭으로 그대로 전달
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      start = { x: e.clientX, left: el.scrollLeft, id: e.pointerId, dragging: false }
    }
    const onMove = (e) => {
      if (!start) return
      if (!start.dragging) {
        if (Math.abs(e.clientX - start.x) < 5) return
        start.dragging = true
        el.setPointerCapture(start.id)
        el.style.cursor = 'grabbing'
        // 끄는 동안은 칸에 딱 맞춰 멈추는 기능을 잠시 끔
        el.style.scrollSnapType = 'none'
      }
      el.scrollLeft = start.left - (e.clientX - start.x)
    }
    // 끌었다 놓은 직후의 클릭은 무시 (칸 상세가 열리지 않게)
    const swallowClick = (e) => {
      e.stopPropagation()
      e.preventDefault()
    }
    const onUp = () => {
      if (!start) return
      if (start.dragging) {
        el.addEventListener('click', swallowClick, { capture: true, once: true })
        setTimeout(() => el.removeEventListener('click', swallowClick, { capture: true }), 0)
      }
      start = null
      el.style.cursor = ''
      el.style.scrollSnapType = ''
    }
    // 마우스 휠(세로)도 가로로 넘김
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  return ref
}
