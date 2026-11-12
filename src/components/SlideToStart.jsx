import { useEffect, useRef, useState } from 'react'
import trackImg from '../assets/main/make-cta.png'
import arrowRight from '../assets/main/arrow-right.svg'
import logoMark from '../assets/main/logo-line.svg'
import './SlideToStart.css'

const KNOB_START = 8
const KNOB_SIZE = 40
const TRACK_WIDTH = 288
const TRACK_HEIGHT = 55
const MAX_OFFSET = TRACK_WIDTH - KNOB_START * 2 - KNOB_SIZE
const FILL_TAIL = 30 // 채움 오른쪽 끝이 옅게 사라지는 구간// 이 비율 이상 밀거나, 빠르게 튕기듯 밀면 나머지는 자동으로 미끄러져 완료
const COMPLETE_RATIO = 0.5
const FLICK_VELOCITY = 0.6 // px/ms

// 파티클 색: 흰색 → 연한 라임 (디자인의 #c4f06a 계열)
const PARTICLE_COLORS = ['255, 255, 255', '232, 252, 190', '196, 240, 106', '178, 226, 92']

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)
const rand = (min, max) => min + Math.random() * (max - min)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function SlideToStart({ label, onComplete }) {
  const [dragging, setDragging] = useState(false)

  const knobRef = useRef(null)
  const fillRef = useRef(null)
  const canvasRef = useRef(null)

  // 프레임마다 바뀌는 값은 렌더링 없이 ref로 관리
  const state = useRef({
    offset: 0,
    dragging: false,
    done: false,
    startX: 0,
    samples: [], // 놓을 때 속도 계산용 [{ x, t }]
    anim: null, // { from, to, start, duration, ease, onDone }
    particles: [],
    lastSpawnOffset: 0,
    lastTrickle: 0,
    glow: 0,
    lastFrame: 0,
    raf: 0,
    timer: 0,
  })

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = TRACK_WIDTH * dpr
    canvas.height = TRACK_HEIGHT * dpr
    canvas.getContext('2d').scale(dpr, dpr)

    const s = state.current
    s.unmounted = false
    return () => {
      s.unmounted = true
      cancelAnimationFrame(s.raf)
      s.raf = 0
      clearTimeout(s.timer)
    }
  }, [])

  const applyOffset = (x) => {
    state.current.offset = x
    if (!knobRef.current || !fillRef.current) return
    knobRef.current.style.transform = `translateX(${x}px)`
    // 미는 만큼 손잡이 속 아이콘이 반 바퀴 돌며 화살표 → 로고로 바뀜 (0~1)
    knobRef.current.style.setProperty('--p', String(x / MAX_OFFSET))
    // 손잡이 앞으로 아주 옅게 번지는 짧은 꼬리 — 글자 끝이 살짝만 부드러워짐
    fillRef.current.style.width = `${Math.min(TRACK_WIDTH - 8, x + KNOB_SIZE + 8 + FILL_TAIL)}px`
    fillRef.current.style.opacity = String(Math.min(1, x / 16))
  }

  const spawnParticles = (fromOffset, toOffset, count) => {
    const s = state.current
    for (let i = 0; i < count; i++) {
      const at = fromOffset + ((toOffset - fromOffset) * (i + Math.random())) / count
      // 손잡이 왼쪽 가장자리 뒤에서 흘러나오도록
      s.particles.push({
        x: KNOB_START + at + rand(2, 10),
        y: TRACK_HEIGHT / 2 + rand(-1, 1) * rand(3, 11),
        vx: -rand(0.01, 0.05),
        vy: rand(-0.012, 0.012),
        r: rand(0.95, 2.6),
        life: rand(750, 1300),
        age: 0,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        twinkle: rand(0.006, 0.014),
        phase: rand(0, Math.PI * 2),
      })
    }
    if (s.particles.length > 220) s.particles.splice(0, s.particles.length - 220)
  }

  const draw = (dt) => {
    const s = state.current
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT)

    // 손잡이 뒤에 은은하게 번지는 빛 (움직일수록 밝아짐)
    if (s.glow > 0.01) {
      const cx = KNOB_START + s.offset + KNOB_SIZE / 2 - 8
      const g = ctx.createRadialGradient(cx, TRACK_HEIGHT / 2, 0, cx, TRACK_HEIGHT / 2, 34)
      g.addColorStop(0, `rgba(255, 255, 240, ${0.55 * s.glow})`)
      g.addColorStop(0.5, `rgba(226, 248, 181, ${0.25 * s.glow})`)
      g.addColorStop(1, 'rgba(226, 248, 181, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT)
    }

    s.particles = s.particles.filter((p) => {
      p.age += dt
      if (p.age >= p.life) return false
      p.x += p.vx * dt
      p.y += p.vy * dt
      const k = p.age / p.life
      const twinkle = 0.75 + 0.25 * Math.sin(p.phase + p.age * p.twinkle)
      const alpha = Math.min(1, Math.pow(1 - k, 1.35) * twinkle * 1.05)
      const r = p.r * (1 - 0.45 * k)
      ctx.shadowColor = `rgba(${p.color}, ${alpha})`
      ctx.shadowBlur = r * 6
      ctx.fillStyle = `rgba(${p.color}, ${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
      return true
    })
    ctx.shadowBlur = 0
  }

  const tick = (now) => {
    const s = state.current
    // 화면 전환으로 사라진 뒤 남은 프레임은 무시
    if (s.unmounted || !canvasRef.current) {
      s.raf = 0
      return
    }
    const dt = Math.min(48, now - (s.lastFrame || now))
    s.lastFrame = now
    const prevOffset = s.offset

    if (s.anim) {
      const a = s.anim
      const t = Math.min(1, (now - a.start) / a.duration)
      applyOffset(a.from + (a.to - a.from) * a.ease(t))
      if (t >= 1) {
        s.anim = null
        a.onDone?.()
      }
      if (s.unmounted || !canvasRef.current) return
    }

    if (!prefersReducedMotion()) {
      // 앞으로 나아간 거리만큼 파티클 생성
      const moved = s.offset - s.lastSpawnOffset
      if (moved > 1.5) {
        spawnParticles(s.lastSpawnOffset, s.offset, Math.min(14, Math.ceil(moved / 1.4)))
        s.lastSpawnOffset = s.offset
      } else if (moved < 0) {
        s.lastSpawnOffset = s.offset
      }
      // 잡고 멈춰 있을 때도 조금씩 흘러나오게
      if (s.dragging && s.offset > 4 && now - s.lastTrickle > 60) {
        spawnParticles(s.offset, s.offset, 1)
        s.lastTrickle = now
      }
    }

    const speed = dt > 0 ? Math.abs(s.offset - prevOffset) / dt : 0
    const targetGlow = s.offset > 4 ? Math.min(1, 0.35 + speed * 1.5) : 0
    s.glow += (targetGlow - s.glow) * 0.12

    draw(dt)

    if (s.dragging || s.anim || s.particles.length > 0 || s.glow > 0.01) {
      s.raf = requestAnimationFrame(tick)
    } else {
      s.raf = 0
      s.lastFrame = 0
    }
  }

  const startLoop = () => {
    const s = state.current
    if (!s.raf && !s.unmounted) s.raf = requestAnimationFrame(tick)
  }

  const animateTo = (to, duration, ease, onDone) => {
    const s = state.current
    s.anim = { from: s.offset, to, start: performance.now(), duration, ease, onDone }
    startLoop()
  }

  const complete = () => {
    const s = state.current
    if (s.done) return
    s.done = true
    const remaining = MAX_OFFSET - s.offset
    // 남은 거리에 비례한 짧은 활주: 처음엔 빠르게, 끝은 부드럽게
    animateTo(MAX_OFFSET, 320 + remaining * 1.4, easeOutQuart, () => {
      // 끝에 닿는 순간 바로 화면 퇴장 모션으로 이어지게
      s.timer = setTimeout(() => onCompleteRef.current?.(), 60)
    })
  }

  const handlePointerDown = (e) => {
    const s = state.current
    if (s.done) return
    e.currentTarget.setPointerCapture(e.pointerId)
    s.anim = null
    s.dragging = true
    s.startX = e.clientX - s.offset
    s.samples = [{ x: s.offset, t: performance.now() }]
    setDragging(true)
    startLoop()
  }

  const handlePointerMove = (e) => {
    const s = state.current
    if (!s.dragging) return
    const x = Math.min(MAX_OFFSET, Math.max(0, e.clientX - s.startX))
    applyOffset(x)
    const now = performance.now()
    s.samples.push({ x, t: now })
    while (s.samples.length > 2 && now - s.samples[0].t > 100) s.samples.shift()
  }

  const handlePointerUp = () => {
    const s = state.current
    if (!s.dragging) return
    s.dragging = false
    setDragging(false)

    const first = s.samples[0]
    const last = s.samples[s.samples.length - 1]
    const velocity = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0

    if (s.offset >= MAX_OFFSET * COMPLETE_RATIO || velocity > FLICK_VELOCITY) {
      complete()
    } else {
      animateTo(0, 420, easeOutCubic)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault()
      complete()
    }
  }

  return (
    <div className="slide-to-start" data-dragging={dragging}>
      <img className="slide-to-start__track" src={trackImg} alt="" />
      {/* 이미지에 그려진 기본 손잡이를 덮으며 따라오는 빛의 궤적 */}
      <div ref={fillRef} className="slide-to-start__fill" />
      <div className="slide-to-start__particles" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <button
        ref={knobRef}
        type="button"
        className="slide-to-start__knob"
        aria-label={`밀어서 ${label}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <span className="slide-to-start__icon" aria-hidden="true">
          <img className="slide-to-start__arrow" src={arrowRight} alt="" draggable={false} />
          <span
            className="slide-to-start__logo"
            style={{ maskImage: `url("${logoMark}")`, WebkitMaskImage: `url("${logoMark}")` }}
          />
        </span>
      </button>
    </div>
  )
}

export default SlideToStart
