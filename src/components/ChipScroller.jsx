import { useEffect, useRef } from 'react'
import './ChipScroller.css'

// 칩이 영역보다 길어질 때만: 잘리는 쪽 끝을 그라데이션으로 흐리게 하고 가로 스크롤로 보여줌
function ChipScroller({ className = '', children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      el.dataset.fadeLeft = String(max > 1 && el.scrollLeft > 1)
      el.dataset.fadeRight = String(max > 1 && el.scrollLeft < max - 1)
    }

    // 데스크톱(마우스)에서도 끌어서 넘길 수 있게
    let drag = null
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || el.scrollWidth <= el.clientWidth) return
      drag = { x: e.clientX, left: el.scrollLeft }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e) => {
      if (drag) el.scrollLeft = drag.left - (e.clientX - drag.x)
    }
    const onUp = () => {
      drag = null
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    const mutation = new MutationObserver(() => {
      for (const child of el.children) observer.observe(child)
      update()
    })
    mutation.observe(el, { childList: true })

    el.addEventListener('scroll', update, { passive: true })
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      observer.disconnect()
      mutation.disconnect()
      el.removeEventListener('scroll', update)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div ref={ref} className={`chip-scroller ${className}`}>
      {children}
    </div>
  )
}

export default ChipScroller
