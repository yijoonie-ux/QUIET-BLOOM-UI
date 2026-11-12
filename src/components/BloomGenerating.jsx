import { useEffect, useState } from 'react'
// 구슬 안 로고: 레이어 블러 2 (Figma 2542:8167)
import logoMask from '../assets/logo-clover-orb.svg'
import e8124 from '../assets/preview/orb/e8124.svg'
import e8098 from '../assets/preview/orb/e8098.svg'
import e8086 from '../assets/preview/orb/e8086.svg'
import e8087 from '../assets/preview/orb/e8087.svg'
import e8088 from '../assets/preview/orb/e8088.svg'
import e8073 from '../assets/preview/orb/e8073.svg'
import e8070 from '../assets/preview/orb/e8070.svg'
import v22486 from '../assets/preview/orb/v22486.svg'
import v22487 from '../assets/preview/orb/v22487.svg'
import e8093 from '../assets/preview/orb/e8093.svg'
import './BloomGenerating.css'

const STEPS = ['Applying Request', 'Arranging Bloom', 'Rendering Preview']
const LETTER_GAP = 0.04 // 글자가 하나씩 올라오는 간격(초)

// 한 줄의 글자가 줄 아래에서 하나씩 차례로 올라옴 (줄 밖은 가려짐)
function RiseLine({ text, className = '', start = 0 }) {
  return (
    <span className={`bg-rise ${className}`} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="bg-rise__char" style={{ animationDelay: `${start + i * LETTER_GAP}s` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

// Figma 레이어처럼 상자 바깥으로 번지는 이미지 크기 (위·오른쪽·아래·왼쪽으로 넘치는 %)
const out = (t, r, b, l) => ({
  top: `-${t}%`,
  left: `-${l}%`,
  width: `${100 + l + r}%`,
  height: `${100 + t + b}%`,
})

// Bloom AI 프리뷰 생성 중 (Figma 2268:20983)
// 빛나는 유리 구슬(200×200) 안 네 잎 심볼 로고 — 구슬은 은은하게 숨 쉬고 안쪽 빛은 천천히 돎
// exiting: 결과가 뒤에 깔린 채 이 화면이 천천히 흐려지며 걷힘 (끝나면 onExited)
function BloomGenerating({ onDone, onExited, duration = 6800, exiting = false }) {
  const [step, setStep] = useState(0)

  // 생성이 끝나면 결과 화면으로
  useEffect(() => {
    if (!onDone || exiting) return undefined
    const timer = setTimeout(onDone, duration)
    return () => clearTimeout(timer)
  }, [onDone, duration, exiting])

  // 걷히는 모션이 끝나면 화면에서 뺌
  useEffect(() => {
    if (!exiting || !onExited) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(onExited, reduce ? 0 : 1100)
    return () => clearTimeout(timer)
  }, [exiting, onExited])

  // 단계 문구를 천천히 순서대로 돌림
  useEffect(() => {
    const timer = setTimeout(() => setStep((step + 1) % STEPS.length), 2400)
    return () => clearTimeout(timer)
  }, [step])

  return (
    <div className="bg-gen fit-screen" role="status" aria-live="polite" data-exiting={exiting}>
      <h1 className="bg-gen__title" aria-label="Creating Bloom Preview">
        <RiseLine text="Creating" className="bg-gen__title-sub" start={0.3} />
        <RiseLine text="Bloom Preview" start={0.3 + 8 * LETTER_GAP + 0.08} />
      </h1>

      <div className="bg-orb" aria-hidden="true">
        {/* 바깥 연두 빛 */}
        <img className="bg-orb__layer bg-orb__glow" src={e8124} alt="" style={{ left: 16.8, top: 16.81, width: 166.571, height: 166.571 }} />
        {/* 구슬 바탕 */}
        <span className="bg-orb__layer" style={{ left: 29.45, top: 29.46, width: 141.269, height: 141.269 }}>
          <img src={e8098} alt="" style={out(3.25, 3.25, 3.25, 3.25)} />
        </span>
        {/* 구슬 속 유체: 세이지·연두·흰빛이 천천히 섞이며 흐름 */}
        <span className="bg-orb__fluid">
          <span className="bg-orb__blob bg-orb__blob--a" />
          <span className="bg-orb__blob bg-orb__blob--b" />
          <span className="bg-orb__blob bg-orb__blob--c" />
        </span>
        {/* 네 잎 심볼 로고: 뒤에 두께 층을 겹쳐 돌 때 옆면이 보이는 입체감 */}
        <span className="bg-orb__layer bg-orb__logo-3d">
          {/* 뒷면 (돌아서 뒤가 보일 때도 흰 로고) */}
          <span
            className="bg-orb__logo bg-orb__logo--back"
            style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
          />
          {[4, 3, 2, 1].map((depth) => (
            <span
              key={depth}
              className="bg-orb__logo-side"
              style={{ '--z': depth, maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
            />
          ))}
          <span
            className="bg-orb__logo"
            style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
          />
        </span>
        {/* 유리 반사·테두리 빛 (천천히 도는 층) */}
        <div className="bg-orb__spin">
          <span className="bg-orb__layer" style={{ left: 29.13, top: 29.11, width: 141.743, height: 141.743 }}>
            <img src={e8086} alt="" style={out(24.88, 23.04, 24.88, 23.04)} />
          </span>
          <span className="bg-orb__layer" style={{ left: 29.13, top: 29.11, width: 141.743, height: 141.743 }}>
            <img src={e8087} alt="" style={out(24.88, 9.68, 21.2, 36.4)} />
          </span>
          <span className="bg-orb__layer bg-orb__center" style={{ left: 4.16, top: 4.14, width: 191.695, height: 191.695 }}>
            <span className="bg-orb__box" style={{ width: 141.743, height: 141.743, rotate: '-62deg' }}>
              <img src={e8088} alt="" style={out(10.32, 31.98, 31.52, 9.86)} />
            </span>
          </span>
        </div>
        <span className="bg-orb__layer" style={{ left: 29.13, top: 28.98, width: 141.743, height: 141.743 }}>
          <img src={e8073} alt="" style={out(4.86, 4.86, 4.86, 4.86)} />
        </span>
        <span className="bg-orb__layer bg-orb__center" style={{ left: 0, top: 0, width: 200, height: 200 }}>
          <span className="bg-orb__box" style={{ width: 141.743, height: 141.743, rotate: '131.14deg' }}>
            <img src={e8070} alt="" style={out(0, 0, 0, 0)} />
          </span>
        </span>
        {/* 반짝이는 하이라이트 */}
        <div className="bg-orb__shine">
          <span className="bg-orb__layer" style={{ left: 49.31, top: 126.24, width: 71.389, height: 29.487 }}>
            <img src={v22486} alt="" style={out(54.47, 22.5, 54.47, 22.5)} />
          </span>
          <span className="bg-orb__layer bg-orb__center" style={{ left: 77.77, top: 39.3, width: 72.743, height: 32.937 }}>
            <span className="bg-orb__box" style={{ width: 71.389, height: 29.487, rotate: '-177.2deg' }}>
              <img src={v22487} alt="" style={out(55.39, 22.88, 55.38, 22.88)} />
            </span>
          </span>
          <span className="bg-orb__layer bg-orb__center" style={{ left: 120.75, top: 43.38, width: 24.383, height: 20.598 }}>
            <span className="bg-orb__box" style={{ width: 7.547, height: 24.656, rotate: '-54deg' }}>
              <img src={e8093} alt="" style={out(13.25, 43.27, 13.25, 43.27)} />
            </span>
          </span>
        </div>
      </div>

      {/* 단계 알약: 안쪽에 옅은 빛이 액체처럼 흐르고, 문구가 단계별로 바뀜 */}
      <p className="bg-gen__pill">
        <span className="bg-gen__liquid" aria-hidden="true" />
        <span className="bg-gen__spinner" aria-hidden="true" />
        <span className="bg-gen__step" key={step}>
          {STEPS[step]}
          <span className="bg-gen__dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      </p>

      <p className="bg-gen__caption">Bloom AI가 부케 프리뷰를 만들고 있어요.</p>
    </div>
  )
}

export default BloomGenerating
