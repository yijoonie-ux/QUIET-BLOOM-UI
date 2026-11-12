import { useEffect, useRef } from 'react'

const MAX_ROTATE = 16 // deg
const MAX_SHIFT = 10 // px
const STIFFNESS = 170
const DAMPING = 15

// 끝으로 갈수록 저항이 커지는 매핑 (손가락을 멀리 끌어도 과하게 꺾이지 않음)
const soft = (delta, range, max) => max * Math.tanh(delta / range)

// 카드를 끌면 그 방향으로 3D로 기울고, 놓으면 스프링으로 제자리에 돌아옴.
// 결과는 CSS 변수(--tilt-*)로 요소에 기록한다.
export function useTilt() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const keys = ['rx', 'ry', 'tx', 'ty', 'lift']
    const value = { rx: 0, ry: 0, tx: 0, ty: 0, lift: 0 }
    const velocity = { rx: 0, ry: 0, tx: 0, ty: 0, lift: 0 }
    const target = { rx: 0, ry: 0, tx: 0, ty: 0, lift: 0 }
    let start = null
    let raf = 0
    let last = 0

    const write = () => {
      el.style.setProperty('--tilt-rx', `${value.rx}deg`)
      el.style.setProperty('--tilt-ry', `${value.ry}deg`)
      el.style.setProperty('--tilt-tx', `${value.tx}px`)
      el.style.setProperty('--tilt-ty', `${value.ty}px`)
      // 그림자·광택용 (-1 ~ 1)
      el.style.setProperty('--tilt-x', String(value.ry / MAX_ROTATE))
      el.style.setProperty('--tilt-y', String(-value.rx / MAX_ROTATE))
      el.style.setProperty('--tilt-lift', String(Math.max(0, value.lift)))
    }

    const step = (now) => {
      const dt = Math.min(0.032, (now - (last || now)) / 1000) || 0.016
      last = now
      let moving = false
      for (const k of keys) {
        const force = (target[k] - value[k]) * STIFFNESS - velocity[k] * DAMPING
        velocity[k] += force * dt
        value[k] += velocity[k] * dt
        if (Math.abs(target[k] - value[k]) > 0.01 || Math.abs(velocity[k]) > 0.01) moving = true
      }
      write()
      if (moving || start) {
        raf = requestAnimationFrame(step)
      } else {
        raf = 0
        last = 0
        // 멈추면 3D 변형을 완전히 해제해 글자가 원래 해상도로 또렷하게 렌더링되게 함
        el.dataset.tilting = 'false'
      }
    }

    const run = () => {
      el.dataset.tilting = 'true'
      if (!raf) raf = requestAnimationFrame(step)
    }

    const onDown = (e) => {
      // 가로 스크롤되는 칩 줄을 잡으면 카드 대신 칩을 넘김
      const scroller = e.target.closest?.('.chip-scroller')
      if (scroller && scroller.scrollWidth > scroller.clientWidth) return
      start = { x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
      target.lift = 1
      run()
    }

    const onMove = (e) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      target.ry = soft(dx, 140, MAX_ROTATE)
      target.rx = -soft(dy, 160, MAX_ROTATE)
      target.tx = soft(dx, 200, MAX_SHIFT)
      target.ty = soft(dy, 200, MAX_SHIFT)
    }

    const onUp = () => {
      if (!start) return
      start = null
      for (const k of keys) target[k] = 0
      run()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return ref
}
