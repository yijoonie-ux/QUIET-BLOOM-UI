import { useEffect, useRef, useState } from 'react'
import './RestartGesture.css'

const HOLD_MS = 700 // 두 손가락을 이만큼 누르고 있으면
const MOVE_LIMIT = 14 // 이보다 많이 움직이면(스크롤·핀치) 취소

// 시연용: 어느 화면에서든 두 손가락으로 길게 누르면 '처음부터 다시 시작할까요?' (Figma 프로토타입처럼)
// 다시 시작 = 페이지 새로고침 → 새로고침이면 온보딩부터, 만든 부케·이름도 비워짐 (onboarding.js · blooms.js)
function RestartGesture() {
  const [open, setOpen] = useState(false)
  const hold = useRef(null) // { timer, points }

  useEffect(() => {
    const cancel = () => {
      if (!hold.current) return
      clearTimeout(hold.current.timer)
      hold.current = null
    }
    const onStart = (e) => {
      cancel()
      if (e.touches.length !== 2) return
      const points = [...e.touches].map((t) => [t.clientX, t.clientY])
      hold.current = {
        points,
        timer: setTimeout(() => {
          hold.current = null
          navigator.vibrate?.(12)
          setOpen(true)
        }, HOLD_MS),
      }
    }
    const onMove = (e) => {
      if (!hold.current) return
      const moved = [...e.touches].some((t, i) => {
        const [x, y] = hold.current.points[i] ?? [t.clientX, t.clientY]
        return Math.hypot(t.clientX - x, t.clientY - y) > MOVE_LIMIT
      })
      if (moved || e.touches.length !== 2) cancel()
    }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', cancel)
    document.addEventListener('touchcancel', cancel)
    return () => {
      cancel()
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', cancel)
      document.removeEventListener('touchcancel', cancel)
    }
  }, [])

  // 열려 있는 동안 Esc로 닫기
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div className="restart" onClick={() => setOpen(false)}>
      <section
        className="restart__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="restart-title" className="restart__title">
          처음부터 다시 시작할까요?
        </h2>
        <p className="restart__desc">온보딩부터 새로 시작해요.</p>
        <div className="restart__actions">
          <button type="button" className="restart__cancel" onClick={() => setOpen(false)}>
            취소
          </button>
          <button type="button" className="restart__ok" onClick={() => window.location.reload()}>
            다시 시작
          </button>
        </div>
      </section>
    </div>
  )
}

export default RestartGesture
