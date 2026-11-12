import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import introBg from '../assets/onboarding/intro-bg.jpg'
// 온보딩 인트로 로고: 뒤 번짐(레이어 블러) 3 — 다른 곳은 4 (logo-clover.svg)
import logoMask from '../assets/logo-clover-intro.svg'
import logoMark from '../assets/logo-clover.svg'
import cardFrame from '../assets/make/profile-card.svg'
import divider from '../assets/make/divider.svg'
import bulb from '../assets/make/bulb.svg'
import glow from '../assets/onboarding/glow.svg'
import budgetIcon from '../assets/onboarding/icon-budget.svg'
import sproutIcon from '../assets/onboarding/icon-sprout.svg'
import ScentRange from '../components/ScentRange'
import { markOnboarded } from '../data/onboarding'
import { getRecommendedPlants } from '../data/plants'
import { getBloomType, getProfileSummary, updateProfile } from '../data/profile'
import { usePageBackground } from '../hooks/usePageBackground'
import { useTilt } from '../hooks/useTilt'
import './Onboarding.css'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const STEPS = [
  { title: '민감도 조건을 알려주세요', desc: '향과 자극을 줄이기 위한 기본 조건을 설정해주세요.' },
  { title: '피하고 싶은 식물을 알려주세요', desc: '피하고 싶은 식물을 제외해 안전하게 구성해드릴게요.' },
  { title: '추천 기준을 선택해주세요', desc: '부케 구성 시 선택한 기준을 우선하여 식물을 추천해드려요.' },
]

const CRITERIA = [
  { key: '예산', icon: budgetIcon, desc: ['예산에 맞춰 부담이 적은', '식물을 우선 추천해드려요.'] },
  { key: '유지력', icon: sproutIcon, desc: ['싱그러움을 오래 유지하는', '식물을 추천해드려요.'] },
]

// 블룸 유형 지도의 칸 (민감도 조합 4가지)
const TYPE_COLS = [
  { label: '저자극·저향', irritant: true, scent: true },
  { label: '저자극', irritant: true, scent: false },
  { label: '저향', irritant: false, scent: true },
  { label: '무필터', irritant: false, scent: false },
]

// 조건 설정 → 유형 카드 사이 분석 로딩 (단계 번호 2와 3 사이)
const ANALYZING = 2.5
const ANALYZE_MS = 2800
const ANALYZE_STEPS = ['민감도 조건을 확인하고 있어요', '피하고 싶은 식물을 정리하고 있어요', '추천 기준을 반영하고 있어요']

// 단계별 진행 바 색 (Figma 2268:20554 / 20756 / 20710)
const BAR_COLORS = ['#fff', '#f4ffe4', '#e9ffcc']

// 나의 Bloom Profile 카드 — Make Quiet Bloom의 Bloom Profile 카드와 같은 모양, 끌어서 기울이기
function BloomTypeCard({ type, criteria, lowIrritant, lowScent, excludedPlants }) {
  const ref = useTilt()
  // 부케 구성 화면과 같은 필터로 센 식물 수
  const plantCount = getRecommendedPlants({ lowIrritant, lowScent, excludedPlants, criteria: [criteria] }).length
  // 설명은 Make Quiet Bloom 카드와 같은 조건 문장
  const desc = getProfileSummary({ lowIrritant, lowScent, criteria: [criteria] }).description
  return (
    <section ref={ref} className="ob-type" aria-label="나의 Bloom Profile">
      <img className="ob-type__frame" src={cardFrame} alt="" />
      <h2 className="ob-type__heading">Bloom Profile</h2>
      <div className="ob-type__badge">
        <span className="ob-type__badge-icon">
          <img src={bulb} alt="" />
        </span>
        {type.badge}
      </div>
      <img className="ob-type__divider" src={divider} alt="" />

      <div className="ob-type__body">
        <h3 className="ob-type__name">{type.title}</h3>
        <p className="ob-type__desc">
          {desc.map((line) => (
            <span key={line} className="ob-type__line">
              {line}
            </span>
          ))}
        </p>

        {/* 민감도 4 × 추천 기준 2 — 두 줄 선택 바에서 고른 조건만 흰 탭으로 */}
        <div className="ob-seg-group" role="img" aria-label={`선택한 조건: ${type.tags}`}>
          {[
            { label: '민감도', options: TYPE_COLS.map((col) => col.label), active: TYPE_COLS.findIndex((col) => col.irritant === lowIrritant && col.scent === lowScent) },
            { label: '추천 기준', options: ['유지력', '예산'], active: criteria === '예산' ? 1 : 0 },
          ].map((row, r) => {
            // 칸 너비 비율: 긴 이름(저자극·저향) 칸만 조금 넓게 → 흰 탭 자리·너비도 같은 비율로
            const weights = row.options.map((opt) => (opt.length > 4 ? 1.4 : 1))
            const sum = weights.reduce((a, b) => a + b, 0)
            const before = weights.slice(0, row.active).reduce((a, b) => a + b, 0)
            return (
            <div key={row.label} className="ob-seg-row">
              <span className="ob-seg-row__label">{row.label}</span>
              <span
                className="ob-seg"
                style={{
                  gridTemplateColumns: weights.map((w) => `${w}fr`).join(' '),
                  '--left': before / sum,
                  '--w': weights[row.active] / sum,
                  '--d': `${0.85 + r * 0.12}s`,
                }}
              >
                <span className="ob-seg__thumb" aria-hidden="true" />
                {row.options.map((opt, i) => (
                  <span key={opt} className="ob-seg__opt" data-active={i === row.active}>
                    {opt}
                  </span>
                ))}
              </span>
            </div>
            )
          })}
        </div>

        {/* 조건(저자극·저향·제외 식물)을 거친 뒤 고를 수 있는 식물 수 — 위 조건 배지와 같은 알약 */}
        <p className="ob-type__budget">
          <span>조건에 맞는 식물</span>
          <strong>{plantCount}종</strong>
        </p>
      </div>
      {/* 기울일 때 따라 움직이는 빛 반사 */}
      <div className="ob-type__glare" aria-hidden="true" />
    </section>
  )
}

// 온보딩: 인트로 → 민감도 → 피하고 싶은 식물 → 추천 기준 → 완료 → 홈
function Onboarding() {
  const navigate = useNavigate()
  // -1: 인트로, 0~2: 조건 설정, 2.5: 유형 분석 로딩, 3: 완료
  const [step, setStep] = useState(-1)
  // 화면별 맨 아래 색 (인트로: 진한 연두 / 단계: 흰색 / 완료: 그라데이션 끝)
  usePageBackground(step === -1 ? '#b3c996' : '#ffffff')
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(0)

  const [lowIrritant, setLowIrritant] = useState(false)
  const [lowScent, setLowScent] = useState(false)
  const [excluded, setExcluded] = useState([])
  const [noExclusion, setNoExclusion] = useState(false)
  const [draft, setDraft] = useState('')
  const [criteria, setCriteria] = useState(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  // 인트로에서 첫 단계로 막 넘어온 상태 (배경까지 바뀌므로 더 천천히, 튀지 않게 들어옴)
  const [fromIntro, setFromIntro] = useState(false)

  // 현재 화면이 살짝 사라진 뒤 다음 화면으로 (인트로는 조금 더 천천히 사라짐)
  const goTo = (next) => {
    if (leaving) return
    setLeaving(true)
    timer.current = setTimeout(
      () => {
        setFromIntro(step === -1)
        setStep(next)
        setLeaving(false)
      },
      reduceMotion() ? 0 : step === -1 ? 420 : 260,
    )
  }

  // 마지막 단계에서 다음: 설정한 조건을 프로필에 저장하고 완료 화면으로
  const finish = () => {
    updateProfile({
      lowIrritant,
      lowScent,
      excludedPlants: noExclusion ? [] : excluded,
      ...(criteria ? { criteria: [criteria] } : {}),
    })
    markOnboarded()
    goTo(ANALYZING)
  }

  // 유형 분석 로딩: 잠깐 보여준 뒤 살짝 사라지며 유형 카드로
  useEffect(() => {
    if (step !== ANALYZING) return
    const fade = setTimeout(() => setLeaving(true), reduceMotion() ? 600 : ANALYZE_MS)
    const next = setTimeout(
      () => {
        setStep(3)
        setLeaving(false)
      },
      reduceMotion() ? 600 : ANALYZE_MS + 380,
    )
    return () => {
      clearTimeout(fade)
      clearTimeout(next)
    }
  }, [step])

  // 완료 화면에서 시작하기: 문구가 살짝 사라진 뒤 홈으로 (홈 첫 진입 모션이 이어서 재생)
  const goHome = () => {
    if (leaving) return
    setLeaving(true)
    timer.current = setTimeout(() => navigate('/', { replace: true }), reduceMotion() ? 0 : 500)
  }

  const addPlant = () => {
    const name = draft.trim()
    if (!name) return
    if (!excluded.includes(name)) setExcluded([...excluded, name])
    setNoExclusion(false)
    setDraft('')
  }

  if (step === -1) {
    return (
      <div className="ob-intro fit-screen" data-leaving={leaving}>
        <img className="ob-intro__bg" src={introBg} alt="" />
        <div className="ob-intro__shade" />
        <div
          className="ob-intro__logo"
          style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
          role="img"
          aria-label="Quiet Bloom"
        />
        <div className="ob-intro__bottom">
          <h1 className="ob-intro__title">
            나에게 편안한 부케는
            <br />
            어떤 모습일까요?
          </h1>
          <p className="ob-intro__desc">
            향과 자극에 대한 민감도는 사람마다 다르게 느껴져요.
            <br />
            나에게 맞는 기준으로 풀부케를 만나보세요.
          </p>
          <button type="button" className="ob-intro__start" onClick={() => goTo(0)}>
            시작하기
          </button>
        </div>
      </div>
    )
  }

  if (step === ANALYZING) {
    return (
      <div className="ob-load fit-screen" data-leaving={leaving} role="status">
        <div className="ob-load__mark" aria-hidden="true">
          <span className="ob-load__ring" />
          <span className="ob-load__ring" />
          <span
            className="ob-load__logo"
            style={{ maskImage: `url("${logoMark}")`, WebkitMaskImage: `url("${logoMark}")` }}
          />
        </div>
        <h1 className="ob-load__title">나의 Bloom Profile을 만들고 있어요</h1>
        {/* 진행 단계 문구가 차례로 바뀜 */}
        <p className="ob-load__steps">
          {ANALYZE_STEPS.map((text, i) => (
            <span key={text} style={{ '--i': i }}>
              {text}
            </span>
          ))}
        </p>
        <div className="ob-load__bar" aria-hidden="true">
          <span />
        </div>
      </div>
    )
  }

  if (step === 3) {
    // 고른 조건 그대로 정리한 Bloom Profile (민감도 × 추천 기준) — 부케 이름은 아직 공개하지 않음
    const type = getBloomType({ lowIrritant, lowScent, criteria: [criteria ?? '유지력'] })
    return (
      <div className="ob-done" data-leaving={leaving}>
        {/* Make Quiet Bloom 화면과 같은 구성: 제목 → 카드 → 버튼 */}
        <header className="ob-done__header">
          <h1 className="ob-done__title">
            My
            <br />
            Bloom Profile
          </h1>
          <p className="ob-done__desc">설정한 조건으로 나의 Bloom Profile을 만들었어요.</p>
        </header>

        <BloomTypeCard type={type} criteria={criteria ?? '유지력'} lowIrritant={lowIrritant} lowScent={lowScent} excludedPlants={noExclusion ? [] : excluded} />

        <div className="ob-done__actions">
          {/* 조건만 정리해 보여주고 홈으로 (부케 만들기 전 조건 확인 화면과 구분) */}
          <button type="button" className="ob-done__start" onClick={goHome}>
            홈으로 가기
          </button>
        </div>
      </div>
    )
  }

  const { title, desc } = STEPS[step]
  const canNext = step !== 2 || criteria

  return (
    <div className="ob fit-screen" data-leaving={leaving} data-from-intro={fromIntro}>
      <img className="ob__glow" src={glow} alt="" />

      <div className="ob__progress" aria-hidden="true">
        {BAR_COLORS.map((color, i) => (
          <span key={color} className="ob__bar" data-filled={i <= step} style={{ '--bar-color': color }} />
        ))}
      </div>

      <div className="ob__content" key={step}>
        <p className="ob__count">
          <b>{step + 1}</b>/3
        </p>
        <h1 className="ob__title">{title}</h1>
        <p className="ob__desc">{desc}</p>

        {step === 0 && (
          <div className="ob-sense">
            <div className="ob-sense__row glass-card">
              {/* 켰을 때만 라벨 아래에 무엇이 바뀌는지 한 줄 설명이 나타남 */}
              <span className="ob-sense__text">
                <span className="ob-sense__label">저자극</span>
                <span className="ob-sense__sub" data-on={lowIrritant}>
                  <span>자극이 적은 식물만 담아요</span>
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={lowIrritant}
                aria-label="저자극"
                className="ob-toggle"
                onClick={() => setLowIrritant(!lowIrritant)}
              >
                <span className="ob-toggle__knob" />
              </button>
            </div>
            <div className="ob-sense__row glass-card">
              <span className="ob-sense__text">
                <span className="ob-sense__label">저향</span>
                <span className="ob-sense__sub" data-on={lowScent}>
                  <span>향이 강한 식물은 빼요</span>
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={lowScent}
                aria-label="저향"
                className="ob-range"
                onClick={() => setLowScent(!lowScent)}
              >
                <ScentRange on={lowScent} offTone="neutral" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="ob-exclude">
            <input
              className="ob-exclude__input"
              type="text"
              enterKeyHint="done"
              placeholder="피하고 싶은 식물을 입력해주세요"
              aria-label="피하고 싶은 식물"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // 한글 조합 중 Enter는 무시 (마지막 글자가 두 번 들어가는 것 방지)
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  addPlant()
                }
              }}
              onBlur={addPlant}
            />
            {excluded.length > 0 ? (
              <div className="ob-exclude__chips">
                {excluded.map((plant) => (
                  <button
                    key={plant}
                    type="button"
                    className="ob-chip"
                    aria-label={`${plant} 삭제`}
                    onClick={() => setExcluded(excluded.filter((p) => p !== plant))}
                  >
                    {plant}
                  </button>
                ))}
              </div>
            ) : (
              <label className="ob-check">
                <input type="checkbox" checked={noExclusion} onChange={(e) => setNoExclusion(e.target.checked)} />
                <span className="ob-check__box" aria-hidden="true" />
                피해야 할 식물이 없어요
              </label>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="ob-criteria" role="radiogroup" aria-label="추천 기준">
            {CRITERIA.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={criteria === item.key}
                className="ob-criteria__card glass-card"
                onClick={() => setCriteria(item.key)}
              >
                <span className="ob-criteria__icon">
                  <img src={item.icon} alt="" />
                </span>
                <span className="ob-criteria__name">{item.key}</span>
                <span className="ob-criteria__desc">
                  {item.desc.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" className="ob__next" disabled={!canNext} onClick={() => (step === 2 ? finish() : goTo(step + 1))}>
        다음
      </button>
    </div>
  )
}

export default Onboarding
