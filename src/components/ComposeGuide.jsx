import { useEffect, useLayoutEffect, useState } from 'react'
import { appHeight } from '../appHeight'
import { isGuidePending, markGuideSeen } from './composeGuideState'
import './ComposeGuide.css'

const STEP_COUNT = 4

const rectOf = (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

// 부케 구성 화면 안내 딤. 화면을 누를 때마다 다음 안내로 넘어가고, 마지막에 누르면 닫힘
// 0) 이번 부케 소개(조건에 맞춘 최적 구성을 안내한다는 설명)  1) 게이지  2) + 버튼·식물 카드  3) 하단 Composition 시트
// targets: { steps, card, add, sheet } ref 객체 · bouquet: 이번 부케 조건 { tags, criteria } · onClose: 안내가 다 끝나 닫혔을 때
function ComposeGuide({ targets, bouquet, delay = 1000, onClose }) {
  const [open, setOpen] = useState(isGuidePending)
  const [rects, setRects] = useState(null)
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)

  // 카드 등장 모션이 끝난 뒤 위치를 재서 표시
  useLayoutEffect(() => {
    if (!open) return undefined
    const measure = () => {
      const { steps, card, add, sheet } = targets
      if (!steps.current || !card.current || !add.current || !sheet.current) return
      setRects({
        steps: rectOf(steps.current),
        card: rectOf(card.current),
        add: rectOf(add.current),
        sheet: rectOf(sheet.current),
      })
    }
    window.scrollTo(0, 0)
    const timer = setTimeout(measure, delay)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [open, targets, delay])

  // 안내 중에는 뒤 화면 스크롤 잠금
  useEffect(() => {
    if (!open) return undefined
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [open])

  if (!open || !rects) return null

  const next = () => {
    if (closing) return
    if (step < STEP_COUNT - 1) {
      setStep(step + 1)
      return
    }
    markGuideSeen()
    setClosing(true)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => {
      setOpen(false)
      onClose?.()
    }, reduceMotion ? 0 : 400)
  }

  const { steps, card, add, sheet } = rects
  const pad = 8
  const sideX = card.x + card.w + 18

  // 단계별로 밝게 비출 영역 (스포트라이트가 부드럽게 옮겨감)
  const spots = [
    // 소개: 비추는 곳 없이 화면 가운데만 (전체 딤)
    { x: window.innerWidth / 2, y: appHeight() / 2, w: 0, h: 0, r: 0 },
    { x: steps.x - pad * 1.5, y: steps.y - pad, w: steps.w + pad * 3, h: steps.h + pad * 2, r: 16 },
    { x: card.x - pad / 2, y: card.y - pad / 2, w: card.w + pad, h: card.h + pad, r: 24 },
    // 시트는 화면 아래 끝까지 (둥근 모서리 없이)
    { x: -2, y: sheet.y, w: window.innerWidth + 4, h: appHeight() - sheet.y + 2, r: 0 },
  ]
  const spot = spots[step]
  const tipState = (i) => (i === step ? 'on' : i < step ? 'past' : 'next')

  return (
    <div
      className="guide"
      data-closing={closing}
      role="dialog"
      aria-modal="true"
      aria-label="부케 구성 안내"
      onClick={next}
    >
      <span
        className="guide__spot"
        style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, borderRadius: spot.r }}
        aria-hidden="true"
      />

      {/* 0) 이번 부케 소개: 조건에 맞는 부케를 최적 구성으로 안내 */}
      <div className="guide__tip guide__tip--intro" data-state={tipState(0)}>
        {/* 아직 부케 이름은 모르는 단계 — 조건만 보여줌 */}
        {bouquet && (
          <span className="guide__badge">
            {bouquet.tags} · {bouquet.criteria} 순
          </span>
        )}
        <p className="guide__intro-title">내 조건에 맞춘 부케를 만들어볼게요</p>
        <p className="guide__intro-sub">
          네 가지 조형 역할 중 원하는 식물만 골라보세요.
          <br />
          단계를 건너뛰거나 같은 역할을 여러 개 담아도 돼요.
        </p>
        <p className="guide__intro-next">화면을 눌러 계속</p>
      </div>

      <div
        className="guide__tip guide__tip--steps"
        data-state={tipState(1)}
        style={{ top: steps.y + steps.h + pad + 18 }}
      >
        <p className="guide__title">게이지를 눌러 다음 단계로</p>
        <p className="guide__sub">구조 · 볼륨 · 라인 · 텍스처 순서로 살펴봐요</p>
      </div>

      {/* + 버튼 강조 링 */}
      <span
        className="guide__ring"
        data-state={tipState(2)}
        style={{ left: add.x + add.w / 2, top: add.y + add.h / 2 }}
        aria-hidden="true"
      />

      <div
        className="guide__tip guide__tip--side"
        data-state={tipState(2)}
        style={{ left: sideX, top: add.y + add.h / 2 }}
      >
        <p className="guide__title">+ 를 누르면</p>
        <p className="guide__sub">아래 컴포지션에 담겨요</p>
      </div>

      <div
        className="guide__tip guide__tip--side guide__tip--later"
        data-state={tipState(2)}
        style={{ left: sideX, top: card.y + card.h * 0.72 }}
      >
        <p className="guide__title">식물을 누르면</p>
        <p className="guide__sub">상세 정보를 볼 수 있어요</p>
      </div>

      <div className="guide__tip guide__tip--sheet" data-state={tipState(3)} style={{ top: sheet.y - 18 }}>
        <p className="guide__title">담은 식물은 여기에 모여요</p>
        <svg className="guide__chevron" width="20" height="10" viewBox="0 0 20 10" aria-hidden="true">
          <path d="M1 1l9 8 9-8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default ComposeGuide
