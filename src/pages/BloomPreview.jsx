import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import backIcon from '../assets/edit/back.svg'
import closeIcon from '../assets/make/close.svg'
import micIcon from '../assets/preview/mic.svg'
import micActiveIcon from '../assets/preview/mic-active.svg'
import keyboardIcon from '../assets/preview/keyboard.svg'
import BloomGenerating from '../components/BloomGenerating'
import BouquetLoader from '../components/BouquetLoader'
import TuneSheet from '../components/TuneSheet'
import { setPlantQty, useCart } from '../data/bouquet'
import { decorOf, formOf } from '../data/styling'
import { setAppliedTune } from '../data/tune'
import { getActiveBouquet, useActiveBouquet } from '../data/bouquets'
import barShape from '../assets/result/bar.svg'
import closeWhiteIcon from '../assets/result/close-white.svg'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './BloomPreview.css'

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// 음성 인식을 쓸 수 없는 환경(일부 브라우저·홈 화면 앱)에서도 같은 흐름이 이어지도록 쓰는 예시 문장은 results.js의 demo
const WORD_GAP = 800 // 단어가 하나씩 나오는 간격

// 인식 결과를 띄어쓰기 단위 단어로 (확정된 결과는 final, 아직 듣는 중인 결과는 흐리게)
const toWords = (results) =>
  Array.from(results).flatMap((r) =>
    r[0].transcript
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ w, final: r.isFinal })),
  )

// 부케 제작하기 다음 화면
// preview: Bloom Preview (Figma 2268:21089) → ai: Bloom AI Preview (2268:21057)
// → 말하는 중/입력 중 (2268:20786): 부케가 작아지고 말한 내용이 아래에 나타남
function BloomPreview() {
  usePageBackground('#d9e4c8')
  const [leaving, leave] = usePageLeave(280)
  // Make This Bloom에서 뒤로 오면 보던 결과(인상 다듬기 포함) 그대로
  const restore = useLocation().state?.back
  const [mode, setMode] = useState(restore ? 'result' : 'preview') // 'preview' | 'ai' | 'result'
  const [resultIndex, setResultIndex] = useState(restore?.resultIndex ?? -1) // 지금 보여주는 생성 결과
  // 지금 만드는 부케 유형 (최종 조건으로 정해짐) — 부케 사진·AI 결과가 이 유형 것으로
  const bouquetType = useActiveBouquet()
  const RESULTS = bouquetType.results
  const result = RESULTS[resultIndex]
  // 부케 사진 자리 (유형마다 크기·위치가 다름) + 입력 중 줄어드는 크기·기준점
  const bouquetBox = (() => {
    const [w, h, x, top] = bouquetType.preview.box
    const [lw, , ltop] = bouquetType.preview.listen
    const s = lw / w
    return {
      '--bw': `${w}px`,
      '--bh': `${h}px`,
      '--bx': `${x}px`,
      '--by': `${top}px`,
      '--ls': s,
      '--lo': `${(ltop - top) / (1 - s)}px`,
    }
  })()
  const [input, setInput] = useState(null) // null | 'voice' | 'keyboard'
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('') // 키보드 입력
  const [words, setWords] = useState([]) // 음성 인식 단어 [{ w, final }]
  const recognition = useRef(null)
  const demoTimers = useRef([])
  const inputRef = useRef(null)

  // 부케 제작하기로 들어오면 로딩을 먼저 보여준 뒤 프리뷰 (뒤로 갔다 오는 경우 등은 바로 프리뷰)
  const location = useLocation()
  const [building, setBuilding] = useState(() => location.state?.building === true)
  // 로딩에서 넘어오면 부케는 이미 같은 자리에 그려져 있어 다시 나타나는 모션은 생략
  const [fromLoader] = useState(building)
  const finishBuilding = useCallback(() => setBuilding(false), [])

  // 들린 문장을 한 글자씩 타이핑하듯 써 내려감 (인식은 단어 단위로 와도 화면엔 글자 단위로)
  // chars: [{ c, final }] — 띄어쓰기 포함, typed: 지금까지 써진 글자 수
  const chars = useMemo(
    () => words.flatMap((item, i) => [...(i > 0 ? ' ' : ''), ...item.w].map((c) => ({ c, final: item.final }))),
    [words],
  )
  const [typed, setTyped] = useState(0)
  const shown = Math.min(typed, chars.length)
  useEffect(() => {
    const len = chars.length
    if (shown >= len) return undefined
    // 밀린 글자가 많을수록 조금 빨리 따라잡음 (사람이 치는 듯 약간 들쭉날쭉)
    const delay = (len - shown > 8 ? 34 : 62) + Math.random() * 26
    // 인식 결과가 바뀌어 짧아졌던 경우도 지금 길이에서 이어서 씀
    const t = setTimeout(() => setTyped((n) => Math.min(n, len) + 1), delay)
    return () => clearTimeout(t)
  }, [shown, chars.length])

  // 말한 내용 한 줄의 위치: 다 들어가면 가운데, 넘치면 끝이 오른쪽에 맞도록 왼쪽으로 밀기
  const lineRef = useRef(null)
  const lineTextRef = useRef(null)
  const [lineShift, setLineShift] = useState({ x: 0, overflow: false })
  useLayoutEffect(() => {
    const box = lineRef.current
    const text = lineTextRef.current
    if (!box || !text) return
    const room = box.clientWidth
    const width = text.scrollWidth
    const overflow = width > room
    setLineShift({ x: overflow ? room - width : (room - width) / 2, overflow })
  }, [shown, listening, input])

  const clearDemo = () => {
    demoTimers.current.forEach(clearTimeout)
    demoTimers.current = []
  }

  // 사용자가 마이크를 눌러 끈 것인지 (인식이 스스로 멈춘 것과 구분)
  const userStopped = useRef(false)
  const [generating, setGenerating] = useState(false)
  const generateTimer = useRef(0)
  useEffect(() => () => clearTimeout(generateTimer.current), [])

  const stopListening = () => {
    clearDemo()
    userStopped.current = true
    recognition.current?.stop()
    recognition.current = null
    setListening(false)
  }

  useEffect(
    () => () => {
      demoTimers.current.forEach(clearTimeout)
      // 화면을 떠날 땐 인식이 다시 켜지지 않게
      userStopped.current = true
      recognition.current?.abort()
    },
    [],
  )

  // 인식을 쓸 수 없을 때: 예시 문장을 단어 단위로 '듣는 중 → 확정' 순서로 이어 붙임
  const runDemo = () => {
    // 다음에 만들 결과에 맞는 예시 문장
    const DEMO_WORDS = RESULTS[Math.min(resultIndex + 1, RESULTS.length - 1)].demo
    clearDemo()
    setWords([])
    setListening(true)
    DEMO_WORDS.forEach((w, i) => {
      const at = 700 + i * WORD_GAP
      demoTimers.current.push(
        setTimeout(() => setWords((prev) => [...prev, { w, final: false }]), at),
        setTimeout(
          () => setWords((prev) => prev.map((item, j) => (j === i ? { ...item, final: true } : item))),
          at + 550,
        ),
      )
    })
    // 다 말해도 마이크는 켜진 채로 — 사용자가 마이크를 눌러 끌 때 생성으로 넘어감
  }

  // 키보드 입력으로 바뀌면 바로 입력창에 포커스
  useEffect(() => {
    if (input === 'keyboard') inputRef.current?.focus()
  }, [input])

  const startVoice = () => {
    // 듣는 중에 누르면 마이크가 꺼지고(비활성), 꺼지는 모습이 보인 뒤 바로 생성 화면으로
    if (listening) {
      stopListening()
      clearTimeout(generateTimer.current)
      generateTimer.current = setTimeout(() => setGenerating(true), 600)
      return
    }
    userStopped.current = false
    setInput('voice')
    if (!SpeechRecognition) {
      runDemo()
      return
    }
    const rec = new SpeechRecognition()
    let heard = false
    let failed = false
    rec.lang = 'ko-KR'
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (e) => {
      heard = true
      setWords(toWords(e.results))
    }
    // 인식이 막히거나 아무것도 못 들으면 문구 없이 예시 흐름으로 이어감
    rec.onerror = () => {
      failed = true
    }
    rec.onend = () => {
      if (userStopped.current) return
      if (!heard && failed) {
        recognition.current = null
        runDemo()
        return
      }
      // 말이 잠깐 끊겨 인식이 스스로 멈춰도, 마이크를 끌 때까지 계속 들음
      try {
        rec.start()
      } catch {
        recognition.current = null
        setListening(false)
      }
    }
    recognition.current = rec
    setWords([])
    setListening(true)
    try {
      rec.start()
    } catch {
      recognition.current = null
      runDemo()
    }
  }

  const startKeyboard = () => {
    stopListening()
    setInput('keyboard')
  }

  // 화면 전환: 지금 제목·버튼이 살짝 위로 흐려지며 사라진 뒤 다음 화면 요소가 아래에서 떠오름
  const [switching, setSwitching] = useState(false)
  const switchTimer = useRef(0)
  useEffect(() => () => clearTimeout(switchTimer.current), [])
  const switchMode = (next) => {
    if (switching) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setSwitching(true)
    switchTimer.current = setTimeout(
      () => {
        setMode(next)
        setSwitching(false)
      },
      reduceMotion ? 0 : 320,
    )
  }

  const closeAi = () => {
    stopListening()
    setInput(null)
    setText('')
    setWords([])
    switchMode('preview')
  }

  const active = input !== null

  // 프리뷰 생성 화면: 말하기는 마이크를 눌러 끌 때, 키보드는 입력을 마칠 때 넘어감

  const submitKeyboard = () => {
    if (text.trim()) setTimeout(() => setGenerating(true), 600)
  }

  // 조형 미세조정 (인상 다듬기): 고른 인상대로 식물 수량을 바꾸고(data/tune.js) 다시 생성
  const cart = useCart()
  const cartItems = cart.length ? cart : getActiveBouquet().recipe.map(([name, qty]) => ({ name, qty }))
  // 인상 다듬기 기준 구성: 처음 다듬기 전의 구성 — 다시 열면 지난번 값에서 이어서 조정하고, 수량은 늘 이 기준에서 계산
  const [tuneBase, setTuneBase] = useState(restore?.tuneBase ?? null)
  const tuneItems = tuneBase ?? cartItems
  const [tuneOpen, setTuneOpen] = useState(false)
  const [tuned, setTuned] = useState(restore?.tuned ?? null) // 지금 결과에 적용된 조정 { values, decor, form, words, changes, guides }
  const pendingTune = useRef(null)
  // 연출(다발 · 화병 · 행잉): 원래 결과의 연출과, 사진이 준비된 연출
  // 처음 결과(다듬기 전)의 키 — 연출·장식의 '처음 그대로' 기준
  const [tuneBaseResult, setTuneBaseResult] = useState(restore?.tuneBaseResult ?? null)
  const baseResultKey = tuneBaseResult ?? result?.key
  const baseForm = formOf(baseResultKey)
  const baseDecor = decorOf(baseResultKey)
  const photoForms = RESULTS.map((r) => formOf(r.key))
  const applyTune = (tune) => {
    if (!tuneBase) setTuneBase(cartItems.map((item) => ({ ...item })))
    if (!tuneBaseResult) setTuneBaseResult(result?.key)
    // 담은 식물 수량에 반영 (기준 구성 → 이번 인상) → Make This Bloom 제작 리스트·예상 제작비도 이 구성으로
    tune.next.forEach(({ name, qty }) => setPlantQty(name, qty))
    setAppliedTune(tune.words.length ? tune : null)
    pendingTune.current = tune
    setTuneOpen(false)
    setTimeout(() => setGenerating(true), 350)
  }

  // 생성이 끝나면 다음 결과를 뒤에 깔고, 생성 화면은 그 위에서 천천히 걷힘 (exit → 끝나면 false)
  // 인상 다듬기로 다시 생성한 경우는 같은 결과(같은 구성)에 조정 내용만 표시
  const finishGenerating = useCallback(() => {
    setGenerating('exit')
    const tune = pendingTune.current
    pendingTune.current = null
    // 가운데로 모두 되돌렸으면 조정 없음 (처음 구성 그대로)
    setTuned(tune?.words.length ? tune : null)
    if (!tune) setResultIndex((i) => Math.min(i + 1, getActiveBouquet().results.length - 1))
    // 고른 연출의 사진이 있으면 그 결과로 (없으면 사진은 그대로, 소재 목록에만 반영)
    else {
      const idx = getActiveBouquet().results.findIndex((r) => formOf(r.key) === tune.form)
      if (idx >= 0) setResultIndex(idx)
    }
    setMode('result')
    setInput(null)
    setWords([])
    setText('')
  }, [])

  const endGenerating = useCallback(() => setGenerating(false), [])

  // 결과에서 X: 다시 Bloom Preview로
  const closeResult = () => {
    stopListening()
    setInput(null)
    setWords([])
    setText('')
    // 처음부터 다시: 다음 AI 요청은 첫 번째 문장·결과부터, 인상 다듬기도 처음 구성으로
    setResultIndex(-1)
    if (tuneBase) tuneBase.forEach(({ name, qty }) => setPlantQty(name, qty))
    setTuneBase(null)
    setTuneBaseResult(null)
    setTuned(null)
    setAppliedTune(null)
    switchMode('preview')
  }

  // 실제 제작 준비하기: 지금 결과(없으면 처음 부케 그대로)로 Make This Bloom → 완성하기 후 Bloom Complete
  // back: 제작 준비에서 뒤로 올 때 이 결과 화면을 그대로 되살릴 정보
  const complete = () =>
    leave('/realize', {
      state: {
        result: result?.key ?? null,
        back: mode === 'result' ? { resultIndex, tuneBase, tuneBaseResult, tuned } : null,
      },
    })

  if (building) {
    return (
      <BouquetLoader
        image={bouquetType.preview.image}
        box={bouquetType.preview.box}
        crop={bouquetType.preview.crop}
        onDone={finishBuilding}
      />
    )
  }

  // 생성 중: 첫 생성은 로고가 두 바퀴 돈 뒤(7.4초), 두 번째부터는 한 바퀴만 돌고(3.9초) 결과로
  const generatingScreen = generating && (
    <BloomGenerating
      duration={resultIndex < 0 ? 7400 : 3900}
      exiting={generating === 'exit'}
      onDone={finishGenerating}
      onExited={endGenerating}
    />
  )

  if (generating === true) {
    return generatingScreen
  }

  return (
    <>
    {generatingScreen}
    <div className="bp fit-screen" data-mode={mode} data-active={active} data-leaving={leaving} data-from-loader={fromLoader} data-switching={switching}>
      {/* 생성 결과: 화면 가득 사진 + 위·아래 그라데이션 (Figma 2845:24692 / 24995) — 값은 results.js */}
      {mode === 'result' && result && (
        <div className="bp-result" key={result.key} style={{ background: result.bg }} aria-hidden="true">
          <img
            className="bp-result__image"
            src={result.image}
            alt=""
            style={{
              width: result.size[0],
              height: result.size[1],
              top: result.pos[1],
              marginLeft: result.pos[0],
              '--top': `${result.pos[1]}px`,
            }}
          />
          {result.shade && (
            <span
              className="bp-result__shade"
              style={{
                height: result.shade[0],
                '--shade': result.shade[1],
                '--shade-alpha': result.shade[2] ?? 0.52,
                '--shade-solid': result.shade[3] ?? '0%',
              }}
            />
          )}
          <span
            className="bp-result__fade"
            style={{
              height: result.fade[0],
              bottom: -result.fade[1],
              '--fade': result.fade[2],
              '--fade-alpha': result.fade[3],
              '--fade-end': result.fade[4],
            }}
          />
        </div>
      )}

      <div className="bp__glow" aria-hidden="true" />

      {mode === 'result' ? (
        <header className="bp__header bp__header--result" key="result">
          <h1 className="bp__title">{tuned ? 'Final Preview' : 'Preview Generated'}</h1>
          <p className="bp__desc">
            {tuned ? '조정한 인상에 맞춰 식물 수량을 바꿔 다시 그렸어요.' : '생성된 모습을 확인하고, 필요하면 다시 요청해보세요.'}
          </p>
          {/* 이번에 적용한 인상 조정 */}
          {tuned && (
            // 적용한 인상은 한 줄 요약으로만 (자세한 값은 인상 다듬기를 다시 열면 그대로 보임)
            <p className="bp__tuned" aria-label="적용한 인상">
              {tuned.words.length > 1 ? `${tuned.words[0]} 외 ${tuned.words.length - 1}개` : tuned.words[0]}
              {tuned.changes.length > 0 && ` · 식물 ${tuned.changes.length}종 수량 조정`}
            </p>
          )}
          <button type="button" className="bp__close" aria-label="결과 닫기" onClick={closeResult}>
            <img src={closeWhiteIcon} alt="" />
          </button>
        </header>
      ) : mode === 'preview' ? (
        <header className="bp__header bp__header--preview" key="preview">
          <button type="button" className="bp__back" aria-label="뒤로" onClick={() => leave('/compose')}>
            <img src={backIcon} alt="" />
          </button>
          <h1 className="bp__title">Bloom Preview</h1>
          <p className="bp__desc">구성한 풀부케를 먼저 확인해보세요.</p>
        </header>
      ) : (
        <header className="bp__header bp__header--ai" key="ai">
          <h1 className="bp__title">Bloom AI Preview</h1>
          <p className="bp__desc">원하는 부케 연출을 말하거나 직접 입력해보세요.</p>
          <button type="button" className="bp__close" aria-label="AI 프리뷰 닫기" onClick={closeAi}>
            <img src={closeIcon} alt="" />
          </button>
        </header>
      )}

      {/* 부케 이미지 246×448 (입력 중엔 224×406로 줄어듦) */}
      {mode !== 'result' && (
        <div className="bp__bouquet" style={bouquetBox}>
          <img
            src={bouquetType.preview.image}
            alt="구성한 풀부케 미리보기"
            style={
              bouquetType.preview.crop && {
                width: `${bouquetType.preview.crop[0]}%`,
                height: `${bouquetType.preview.crop[1]}%`,
                left: `${bouquetType.preview.crop[2]}%`,
                top: `${bouquetType.preview.crop[3]}%`,
              }
            }
          />
        </div>
      )}

      {/* 결과 하단: 실제 제작 준비하기 + 다시 요청하는 작은 마이크 */}
      {/* 결과 위: 인상 다듬기 (조형 미세조정) */}
      {mode === 'result' && !active && !generating && (
        <button type="button" className="bp-tune" onClick={() => setTuneOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h7M12 4h2M2 12h2M7 12h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="10.5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="5.5" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {tuned ? '인상 다시 다듬기' : '인상 다듬기'}
        </button>
      )}
      {tuneOpen && <TuneSheet items={tuneItems} initial={tuned} baseForm={baseForm} photoForms={photoForms} baseDecor={baseDecor} onApply={applyTune} onClose={() => setTuneOpen(false)} />}

      {mode === 'result' && !active && (
        <div className="bp-result__bar" key="bar">
          <img className="bp-result__bar-shape" src={barShape} alt="" />
          <button type="button" className="bp-result__done" onClick={complete}>
            실제 제작 준비하기
          </button>
          <button type="button" className="bp-result__mic" aria-label="다시 말로 요청하기" onClick={startVoice}>
            <img src={micIcon} alt="" />
          </button>
        </div>
      )}

      {mode === 'preview' && (
        <div className="bp__actions" key="actions">
          <button type="button" className="bp__ai" onClick={() => switchMode('ai')}>
            AI 프리뷰 만들기
          </button>
          <button type="button" className="bp__done" onClick={complete}>
            이대로 제작 준비하기
          </button>
        </div>
      )}

      {(mode === 'ai' || (mode === 'result' && active)) && (
        <>
          <div className="bp__prompt" aria-live="polite">
            {input === 'keyboard' ? (
              <input
                ref={inputRef}
                className="bp__input"
                type="text"
                enterKeyHint="done"
                placeholder="예: 큐빅을 붙여주고"
                aria-label="원하는 부케 연출"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.currentTarget.blur()
                    submitKeyboard()
                  }
                }}
              />
            ) : (
              input === 'voice' && (
                // 말한 내용이 한 글자씩 타이핑되듯 써지고 커서가 따라감 (듣는 중엔 흐리게, 인식이 확정되면 또렷하게)
                // 가로 한 줄: 넘치면 줄 전체가 왼쪽으로 흘러가 최신 글자가 늘 보임
                <div ref={lineRef} className="bp__said" data-overflow={lineShift.overflow}>
                  <p
                    ref={lineTextRef}
                    className="bp__said-text"
                    style={{ transform: `translateX(${lineShift.x}px)` }}
                  >
                    {chars.slice(0, shown).map((item, i) => (
                      <span key={i} className="bp-char" data-final={item.final}>
                        {item.c}
                      </span>
                    ))}
                    {listening && <span className="bp__caret" aria-hidden="true" />}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="bp__controls">
            <button
              type="button"
              className="bp-orb bp-orb--mic"
              data-on={input === 'voice' && listening}
              data-listening={listening}
              aria-pressed={listening}
              aria-label={listening ? '음성 입력 멈추기' : '말로 입력하기'}
              onClick={startVoice}
            >
              <img className="bp-orb__icon bp-orb__icon--idle" src={micIcon} alt="" />
              <img className="bp-orb__icon bp-orb__icon--on" src={micActiveIcon} alt="" />
            </button>
            <button
              type="button"
              className="bp-orb bp-orb--keyboard"
              data-on={input === 'keyboard'}
              aria-pressed={input === 'keyboard'}
              aria-label="키보드로 입력하기"
              onClick={startKeyboard}
            >
              <img className="bp-orb__icon" src={keyboardIcon} alt="" />
            </button>
          </div>
        </>
      )}
    </div>
    </>
  )
}

export default BloomPreview
