import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import backIcon from '../assets/edit/back.svg'
import { SAVED_BLOOMS } from '../data/blooms'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './MyBlooms.css'

const COUNT = SAVED_BLOOMS.length
const DRAG_PX = 220 // 손가락을 이만큼 옆으로 밀면 카드 한 장
const PULL_COMMIT = 120 // 카드를 이만큼 아래로 내리면 자세히 보기
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const lerp = (a, b, t) => a + (b - a) * t
const mod = (n, m) => ((n % m) + m) % m
// 끝없이 이어지는 캐러셀: 가운데에서 몇 장 떨어졌는지를 -COUNT/2 ~ COUNT/2 사이로
const wrap = (d) => mod(d + COUNT / 2, COUNT) - COUNT / 2

// 카드 8장을 세운 원(링)의 반지름 — 중심축을 기준으로 원 전체가 돌아감
const RING_R = 200

// 넘기는 위치(d: 가운데에서 몇 장 떨어졌는지)에 따른 카드 자리.
// 레퍼런스(카카오뱅크 모임 체크카드): 카드들이 하나의 원 위에 서서 중심축으로 돌고,
// 맨 앞 카드만 크고 또렷, 옆·뒤 카드는 원을 따라 돌아 들어가며 작아지고 흐려짐
function carouselPose(d) {
  // 원 위의 각도 (0 = 맨 앞): 레퍼런스의 3장 원처럼 바로 옆 카드는 120° 뒤쪽 양옆에 서고,
  // 나머지 카드는 그 뒤(120°~180°)에 차곡차곡 숨어 차례가 오면 원을 따라 앞으로 돌아 나옴
  const ad = Math.abs(d)
  const s = Math.sign(d)
  const deg = s * Math.min(180, ad <= 1 ? ad * 120 : 120 + (ad - 1) * 20)
  const th = (deg * Math.PI) / 180
  const depth = (1 - Math.cos(th)) / 2 // 0 = 맨 앞, 1 = 맨 뒤
  return {
    tx: Math.sin(th) * RING_R,
    ty: 0,
    tz: (Math.cos(th) - 1) * RING_R,
    // 원을 따라 바깥쪽을 보며 돌되, 늘 카메라 쪽 면이 보이게 최대 35°까지만 틀어짐
    ry: Math.sin(th) * 35,
    rz: 0,
    scale: 1,
    // 뒤로 갈수록 초점이 나가고(블러) 옅어짐
    blur: depth * 5,
    fade: 1 - depth * 0.3,
  }
}

// 들어올 때 처음 모양: 가운데 카드 뒤로 살짝 부채꼴로 겹쳐 쌓인 카드 묶음
function stackPose(d) {
  const ad = Math.abs(d)
  return { tx: d * 12, ty: -ad * 14, tz: -ad * 30, ry: 0, rz: d * 6, scale: 1 - 0.05 * ad }
}

// 부드러운 곡선: 출발·도착 모두 천천히 / 감속만
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// 간단한 스프링 한 단계 (값, 속도) → 목표를 향해
function springStep(state, target, stiffness, damping, dt) {
  const force = (target - state.x) * stiffness - state.v * damping
  state.v += force * dt
  state.x += state.v * dt
}

// My Blooms (Figma 2268:20919)
// 옆으로 슥슥 넘기면 카드가 턴테이블처럼 돌아가고, 가운데 카드를 잡아 아래로 내리면 자세히 보기
function MyBlooms() {
  usePageBackground('#ffffff')
  const [leaving, leave] = usePageLeave(280)
  // 상세 화면에서 돌아오면 보던 카드부터
  const fromId = useLocation().state?.id
  const startIndex = Math.max(0, SAVED_BLOOMS.findIndex((b) => b.id === fromId))
  const [index, setIndex] = useState(startIndex)
  const [pulling, setPulling] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const cardRefs = useRef([])
  const api = useRef({})

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const cards = cardRefs.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const pos = { x: startIndex, v: 0 } // 넘긴 위치 (카드 단위, 끝없이 늘어남)
    const spread = { x: reduce ? 1 : 0, v: 0 } // 0: 쌓인 묶음 → 1: 펼친 캐러셀
    const pull = { x: 0, v: 0 } // 가운데 카드를 아래로 내린 거리(px)
    const exit = { x: 0, v: 0 } // 자세히 보기로 넘어가는 진행 (0 → 1)
    // 쫀득한 모션: 카드가 손가락에 붙은 듯 살짝 늦게 따라오고, 놓으면 되튐 없이 매끄럽게 제자리로
    // (모양은 늘어나거나 출렁이지 않음 — 감쇠를 임계값으로 맞춘 스프링)
    const side = { x: 0, v: 0 } // 아래로 내리는 동안 손가락을 따라 옆으로 움직인 거리(px)
    let target = startIndex
    let spreadTarget = reduce ? 1 : 0
    let pullTarget = 0
    let sideTarget = 0
    let committed = false
    let drag = null
    let raf = 0
    let last = 0
    let shownIndex = startIndex
    const edge = COUNT / 2

    // 아래 입구의 세로 가운데(화면 좌표) — 카드가 이 선 아래로는 잘려 들어가 보이게
    let slotMid = Infinity
    const measure = () => {
      const slot = root.querySelector('.mb__slot')
      if (!slot) return
      const r = slot.getBoundingClientRect()
      slotMid = r.top + r.height / 2
    }

    const render = () => {
      const center = mod(Math.round(pos.x), COUNT)
      // 빠르게 넘길수록 카드가 조금 더 돌아가고(Y) 진행 방향으로 기움(Z) — 레퍼런스의 휙 넘어가는 스윙
      const spin = clamp(-pos.v * 1.4, -5, 5)
      const swing = clamp(-pos.v * 0.9, -3, 3)
      const p = Math.max(0, pull.x)
      cards.forEach((el, i) => {
        if (!el) return
        const d = wrap(i - pos.x)
        const a = stackPose(d)
        const b = carouselPose(d)
        const t = spread.x
        let tx = lerp(a.tx, b.tx, t)
        let ty = lerp(a.ty, b.ty, t)
        let tz = lerp(a.tz, b.tz, t)
        let ry = lerp(a.ry, b.ry, t) + spin * t
        const blur = (b.blur ?? 0) * t
        const fade = lerp(1, b.fade ?? 1, t)
        let rx = 0
        let scale = lerp(a.scale, b.scale, t)
        // 가운데에 가까운 카드일수록 스윙을 크게 받음
        const rz = lerp(a.rz, b.rz, t) + swing * t * clamp(1.4 - Math.abs(d), 0.3, 1)
        // 맨 끝(반대편으로 넘어가는 자리)에 가까울수록 흐려져서 자리를 바꿀 때 튀지 않음
        let opacity = clamp((edge - Math.abs(d)) / 0.4, 0, 1) * fade
        // 아래로 내리는 가운데 카드: 손가락을 살짝 늦게 따라 내려가며 작아지고 앞으로 숙음
        if (i === center) {
          ty += pull.x > 0 ? pull.x : pull.x * 0.6
          // 옆으로 끌린 만큼은 입구에 가까워질수록 줄어, 입구에 닿을 땐 정가운데로 맞춰 들어감
          tx += side.x * (1 - clamp(p / PULL_COMMIT, 0, 1))
          rx = -Math.min(p, 220) * 0.05
          scale *= 1 - Math.min(p, 260) / 260 * 0.22
        }
        // 넘어가는 중: 아래에서 둥근 면이 차오르는 동안 가운데 카드는 반듯한 채로 작아지며 사라지고,
        // 양옆 카드는 바깥으로 물러나며 흐려짐
        const e = exit.x
        if (e > 0) {
          if (i === center) {
            ty -= e * 40
            rx *= 1 - e
            scale *= 1 - 0.38 * e
            opacity *= clamp(1 - (e - 0.72) / 0.26, 0, 1)
          } else {
            tx *= 1 + 0.35 * e
            opacity *= clamp(1 - e * 1.6, 0, 1)
          }
        }
        el.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`
        // 끄는 동안 입구 선 아래로 내려간 부분은 실시간으로 안 보이게 → 투표함에 쏙 들어가듯.
        // 숙임(3D)·크기 변화까지 반영되도록 실제로 그려진 위치를 재서 자름
        let clip = ''
        if (i === center && (pull.x > 0 || exit.x > 0)) {
          // 입구도 매번 다시 잼 (화면에 들어온 직후 입구가 떠오르는 중일 때 잡아도 어긋나지 않게)
          measure()
          const r = el.getBoundingClientRect()
          if (r.bottom > slotMid && r.height > 0) {
            const hidden = ((r.bottom - slotMid) / r.height) * 397
            clip = `inset(0 0 ${Math.min(hidden, 397)}px 0 round 18px 18px 0 0)`
          }
        }
        el.style.clipPath = clip
        // 초점 흐림: 아주 작은 값은 생략(가운데 카드는 늘 또렷)
        el.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : ''
        el.style.opacity = String(opacity)
        el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10))
      })
      root.style.setProperty('--pull', String(clamp(p / PULL_COMMIT, 0, 1.4)))
      if (center !== shownIndex) {
        shownIndex = center
        setIndex(center)
      }
    }

    const step = (now) => {
      const dt = Math.min(0.032, (now - (last || now)) / 1000) || 0.016
      last = now
      // 넘김: 시간 기반 곡선 — 자동·키보드는 천천히 출발해 천천히 멈추고(ease-in-out),
      // 손을 뗀 경우는 그 속도에서 이어 부드럽게 감속(ease-out). 되튐 없음
      if (tween && (!drag || drag.mode !== 'x')) {
        const k = Math.min(1, (now - tween.start) / tween.dur)
        const prev = pos.x
        pos.x = tween.from + (tween.to - tween.from) * tween.ease(k)
        pos.v = (pos.x - prev) / dt
        if (k >= 1) {
          pos.x = tween.to
          pos.v = 0
          tween = null
        }
      }
      springStep(spread, spreadTarget, 70, 16.7, dt)
      const pulling = drag?.mode === 'y'
      // 끄는 중: 손가락에 붙은 듯 살짝 늦게 따라옴 / 놓으면: 되튐 없이 매끄럽게 감속하며 제자리로
      // (감쇠 = 2√강성 → 넘치지 않음)
      springStep(pull, pullTarget, committed ? 90 : pulling ? 360 : 200, committed ? 19 : pulling ? 38 : 28.3, dt)
      springStep(side, sideTarget, pulling ? 360 : 200, pulling ? 38 : 28.3, dt)
      if (committed) springStep(exit, 1, 42, 13, dt)
      render()
      const moving =
        drag ||
        tween ||
        Math.abs(spread.x - spreadTarget) > 0.0005 ||
        Math.abs(spread.v) > 0.001 ||
        Math.abs(pull.x - pullTarget) > 0.1 ||
        Math.abs(pull.v) > 0.5 ||
        Math.abs(side.x - sideTarget) > 0.1 ||
        Math.abs(side.v) > 0.5 ||
        (committed && exit.x < 0.999)
      if (moving) raf = requestAnimationFrame(step)
      else {
        raf = 0
        last = 0
      }
    }

    const run = () => {
      if (!raf) raf = requestAnimationFrame(step)
    }

    // 위치(끝없이 늘어나는 값)로 이동
    // flick: 손을 뗀 경우 → 감속만(ease-out), 아니면 출발·도착 모두 부드럽게(ease-in-out)
    let tween = null
    const goTo = (p, flick = false) => {
      target = p
      const dist = Math.abs(p - pos.x)
      if (dist < 0.0005) {
        tween = null
        run()
        return
      }
      tween = {
        from: pos.x,
        to: p,
        start: performance.now(),
        dur: (flick ? 620 : 980) + Math.min(dist, 2) * 120,
        ease: flick ? easeOut : easeInOut,
      }
      run()
    }

    // 카드 번호로 이동: 가까운 쪽으로 돌아감
    const goToCard = (i) => goTo(Math.round(pos.x) + Math.round(wrap(i - Math.round(pos.x))))

    // 자세히 보기로: 아래에서 둥근 면이 화면을 덮으며 차오르고, 카드는 작아지며 돌아 사라진 뒤 화면 전환
    const commit = () => {
      if (committed) return
      committed = true
      measure()
      setPulling(true)
      pullTarget = Math.max(pull.x, PULL_COMMIT) + 40
      sideTarget = 0
      run()
      const id = SAVED_BLOOMS[shownIndex].id
      setSweeping(true)
      setTimeout(() => leave(`/blooms/${id}`, { state: { via: 'pull' } }), reduce ? 0 : 480)
    }

    const onDown = (e) => {
      if (committed || drag) return
      const card = e.target.closest?.('.mb-card')
      measure()
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startPos: pos.x,
        mode: null,
        onCenter: card ? Number(card.dataset.index) === mod(Math.round(pos.x), COUNT) : false,
        tapIndex: card ? Number(card.dataset.index) : null,
        samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
      }
      stage.setPointerCapture(e.pointerId)
      pos.v = 0
      run()
    }

    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      // 화면이 줄어 있으면(.fit-screen) 손가락 이동을 화면 안 크기로 환산
      const fit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fit')) || 1
      const dx = (e.clientX - drag.x) / fit
      const dy = (e.clientY - drag.y) / fit
      if (!drag.mode && Math.hypot(dx, dy) > 6) {
        // 옆으로 밀면 넘기기, 가운데 카드를 아래로 끌면 자세히 보기
        drag.mode = Math.abs(dx) > Math.abs(dy) || !drag.onCenter || dy < 0 ? 'x' : 'y'
        if (drag.mode === 'y') setPulling(true)
      }
      const now = performance.now()
      drag.samples.push({ t: now, x: e.clientX, y: e.clientY })
      if (drag.samples.length > 6) drag.samples.shift()
      if (drag.mode === 'x') {
        const next = drag.startPos - dx / DRAG_PX
        const s = drag.samples
        const span = (s[s.length - 1].t - s[0].t) / 1000 || 0.016
        pos.v = -(s[s.length - 1].x - s[0].x) / DRAG_PX / span
        pos.x = next
      } else if (drag.mode === 'y') {
        // 아래로는 손가락을 (살짝 늦게) 따라가고, 위로는 버팀. 옆으로는 끈적하게 조금만 따라옴
        pullTarget = dy > 0 ? dy * 0.9 : -Math.pow(-dy, 0.6)
        sideTarget = 60 * Math.tanh(dx / 240)
      }
    }

    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const d = drag
      drag = null
      const s = d.samples
      const span = (s[s.length - 1].t - s[0].t) / 1000 || 0.016
      if (d.mode === 'x') {
        // 손을 뗀 속도만큼 더 나아간 곳의 카드로
        const projected = pos.x + pos.v * 0.18
        goTo(Math.round(clamp(projected, Math.round(d.startPos) - 1, Math.round(d.startPos) + 1)), true)
      } else if (d.mode === 'y') {
        // 끈 채로 잠깐 멈췄다가 놓으면 '휙 내림'이 아님 (마지막 움직임이 오래됐으면 속도 0)
        const stale = performance.now() - s[s.length - 1].t > 90
        const vy = stale ? 0 : (s[s.length - 1].y - s[0].y) / span
        if (pullTarget > PULL_COMMIT || (vy > 700 && pullTarget > 40)) commit()
        else {
          // 놓으면 매끄럽게 제자리로
          pullTarget = 0
          sideTarget = 0
          setPulling(false)
          run()
        }
      } else if (d.tapIndex != null) {
        // 탭: 옆 카드는 가운데로, 가운데 카드는 아래로 살짝 끄덕여 내려보라고 알려줌
        if (d.tapIndex !== mod(Math.round(pos.x), COUNT)) goToCard(d.tapIndex)
        else {
          pull.v = 520
          run()
        }
      }
    }

    // PC 미리보기: 휠·트랙패드로도 넘김
    let wheelLock = 0
    const onWheel = (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 12 || performance.now() < wheelLock) return
      wheelLock = performance.now() + 420
      goTo(Math.round(target) + Math.sign(delta))
    }

    api.current = {
      next: (dir) => {
        stopAuto()
        goTo(Math.round(target) + dir)
      },
      commit,
    }

    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    stage.addEventListener('wheel', onWheel, { passive: true })

    // 자동 넘김: 펼쳐진 뒤 손대기 전까지 잠깐 머물렀다 다음 카드로 (손대거나 넘기기 시작하면 멈춤)
    let auto = 0
    const stopAuto = () => {
      clearInterval(auto)
      auto = 0
    }
    const autoStart = reduce
      ? 0
      : setTimeout(() => {
          auto = setInterval(() => {
            if (!drag && !committed) goTo(Math.round(target) + 1)
          }, 3000)
        }, 1600)
    stage.addEventListener('pointerdown', stopAuto)
    stage.addEventListener('wheel', stopAuto, { passive: true })

    // 들어오면 잠깐 쌓인 채로 떠오른 뒤 부드럽게 펼쳐짐
    render()
    const spreadTimer = setTimeout(() => {
      spreadTarget = 1
      run()
    }, reduce ? 0 : 380)

    return () => {
      clearTimeout(spreadTimer)
      clearTimeout(autoStart)
      stopAuto()
      stage.removeEventListener('pointerdown', stopAuto)
      stage.removeEventListener('wheel', stopAuto)
      cancelAnimationFrame(raf)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('wheel', onWheel)
    }
    // leave는 화면을 떠날 때 한 번만 쓰임
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') api.current.next?.(-1)
    if (e.key === 'ArrowRight') api.current.next?.(1)
    if (e.key === 'Enter' || e.key === 'ArrowDown') api.current.commit?.()
  }

  const current = SAVED_BLOOMS[index]

  return (
    <div ref={rootRef} className="mb fit-screen" data-leaving={leaving} data-pulling={pulling} data-sweeping={sweeping}>
      {/* 자세히 보기로 넘어갈 때 아래에서 차오르는 둥근 면 */}
      <span className="mb__sweep" aria-hidden="true" />

      <header className="mb__header">
        <button type="button" className="mb__back" aria-label="뒤로" onClick={() => leave('/')}>
          <img src={backIcon} alt="" />
        </button>
        <h1 className="mb__title">My Blooms</h1>
        <p className="mb__desc">저장한 부케를 모아보고, 상세 구성을 확인해보세요.</p>
      </header>

      {/* 카드 무대: 옆으로 넘기기 · 가운데 카드 아래로 내리기 */}
      <div
        ref={stageRef}
        className="mb__stage"
        role="group"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`저장한 부케 ${index + 1} / ${COUNT} — ${current.name}. 좌우 화살표로 넘기고 Enter로 자세히 보기`}
        onKeyDown={onKeyDown}
      >
        {SAVED_BLOOMS.map((bloom, i) => (
          <div
            key={bloom.id}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            className="mb-card"
            data-index={i}
            data-active={i === index}
            aria-hidden={i !== index}
          >
            <img
              className="mb-card__image"
              src={bloom.image}
              alt=""
              draggable="false"
              style={{
                width: `${bloom.card[0]}%`,
                height: `${bloom.card[1]}%`,
                left: `${bloom.card[2]}%`,
                top: `${bloom.card[3]}%`,
              }}
            />
            <span className="mb-card__label">
              <strong>{bloom.name}</strong>
              {/* 민감도 · 추천 기준 (예: 저향 · 유지력 순) */}
              {bloom.criteria ? `${bloom.tags} · ${bloom.criteria} 순` : bloom.tags}
            </span>
          </div>
        ))}
      </div>

      <div className="mb__dots" aria-hidden="true">
        {SAVED_BLOOMS.map((bloom, i) => (
          <span key={bloom.id} className="mb__dot" data-active={i === index} />
        ))}
      </div>

      {/* 카드를 넣는 입구: 카드가 가까워질수록 밝아짐 */}
      <div className="mb__drop" aria-hidden="true">
        <span className="mb__chevrons">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1.5 1.5 8 8l6.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1.5 1.5 8 8l6.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="mb__slot" />
        <p className="mb__hint">카드를 아래로 내려 자세히 보기</p>
      </div>
    </div>
  )
}

export default MyBlooms
