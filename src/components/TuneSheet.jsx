import { useRef, useState } from 'react'
import { DECOR, FORMS } from '../data/styling'
import { planTune } from '../data/tune'
import './TuneSheet.css'

// 조형 미세조정: 일상어(형용사)로 인상을 고르면
// 풍성함 → 식물 수량이 바뀌고, 높이·정돈 → 만드는 방법(줄기 길이·꽂는 방식)이 정해짐 (data/tune.js)
const TUNE_AXES = [
  { key: 'volume', left: '더 가볍게', right: '더 풍성하게' },
  { key: 'height', left: '더 낮고 안정적으로', right: '더 높고 길게' },
  { key: 'order', left: '더 정돈되게', right: '더 자연스럽게' },
]

const EMPTY = { volume: 0, height: 0, order: 0 }

// 접었을 때 화면에 남는 시트 높이 (손잡이 + 제목)
const PEEK = 112

const won = (n) => `₩${n.toLocaleString('ko-KR')}`
const sameSet = (a, b) => a.length === b.length && a.every((k) => b.includes(k))

// 고른 값 → 화면에 보여줄 말 (처음 결과와 달라진 것만)
function describeTune(values, decor, baseDecor) {
  const words = []
  TUNE_AXES.forEach((axis) => {
    const v = values[axis.key]
    if (!v) return
    words.push(v > 0 ? axis.right : axis.left)
  })
  if (!sameSet(decor, baseDecor)) {
    words.push(decor.length ? DECOR.filter((d) => decor.includes(d.key)).map((d) => d.label).join(' · ') : '장식 없음')
  }
  return words
}

// 결과 화면 위로 올라오는 시트. 가운데 = 처음 구성 그대로
// items: 처음(다듬기 전) 구성 [{ name, qty }] — 바뀔 수량은 늘 이 구성에서 계산
// initial: 지난번에 적용한 인상 (다시 열면 그 값에서 이어서 조정)
// baseForm: AI 결과의 원래 연출(wrap · vase · hanging) / photoForms: 사진이 준비된 연출
// baseDecor: AI 결과에 이미 들어간 장식 (예: 진주로 꾸며서 → pearl) — 처음부터 선택돼 있음
function TuneSheet({ items, initial, baseForm, photoForms, baseDecor, onApply, onClose }) {
  // 축마다 왼쪽(-1) · 가운데(0) · 오른쪽(1) 한 칸씩
  const [values, setValues] = useState(() =>
    Object.fromEntries(TUNE_AXES.map((axis) => [axis.key, Math.sign(initial?.values?.[axis.key] ?? 0)])),
  )
  const startDecor = initial?.decor ?? baseDecor
  const [decor, setDecor] = useState(startDecor)
  const toggleDecor = (key) => setDecor(decor.includes(key) ? decor.filter((k) => k !== key) : [...decor, key])
  const startForm = initial?.form ?? baseForm
  const [form, setForm] = useState(startForm)
  const formLabel = FORMS.find((f) => f.key === form)?.label
  const words = describeTune(values, decor, baseDecor)
  if (form !== baseForm && formLabel) words.unshift(`${formLabel} 연출`)
  const plan = planTune(items, values)
  // 지난번에 적용한 것과 달라졌을 때만 적용 가능 (가운데로 되돌리는 것도 변경) — 세 축 · 연출 · 장식 비교
  const before = initial?.values ?? EMPTY
  const changed =
    TUNE_AXES.some((axis) => (values[axis.key] ?? 0) !== (before[axis.key] ?? 0)) ||
    !sameSet(decor, startDecor) ||
    form !== startForm

  // 손잡이 끌기: 내리면 결과 사진이 보이게 접힘(peek) · 올리면 다시 펼침 · 더 내리면 닫힘
  const panelRef = useRef(null)
  const drag = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const peekOffset = () => (panelRef.current?.offsetHeight ?? 0) - PEEK
  const close = () => {
    setOffset(panelRef.current?.offsetHeight ?? 0)
    setTimeout(onClose, 260)
  }
  const onGrabDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, from: offset, moved: false }
    setDragging(true)
  }
  const onGrabMove = (e) => {
    if (!drag.current) return
    const dy = e.clientY - drag.current.y
    if (Math.abs(dy) > 4) drag.current.moved = true
    const to = drag.current.from + dy
    // 펼친 상태보다 위로는 살짝만 (고무줄처럼)
    setOffset(to < 0 ? to * 0.2 : to)
  }
  const onGrabUp = () => {
    if (!drag.current) return
    const { moved, from } = drag.current
    drag.current = null
    setDragging(false)
    const peek = peekOffset()
    // 탭: 펼침 ↔ 접힘
    if (!moved) return setOffset(from > 0 ? 0 : peek)
    if (offset > peek + 60) return close()
    setOffset(offset > peek / 2 ? peek : 0)
  }
  // 내릴수록 뒤 어둠을 걷어 결과 사진이 잘 보이게
  const folded = Math.min(1, Math.max(0, offset) / 400)

  return (
    <div className="tune" style={{ '--dim': 0.3 * (1 - folded * 0.8) }} onClick={close}>
      <section
        ref={panelRef}
        className="tune__panel"
        role="dialog"
        aria-modal="true"
        aria-label="인상 다듬기"
        data-dragging={dragging}
        style={{ transform: `translateY(${offset}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="tune__grab"
          aria-label={offset > 0 ? '시트 펼치기' : '시트 접기'}
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabUp}
          onPointerCancel={onGrabUp}
        >
          <span className="tune__handle" aria-hidden="true" />
        </button>
        <h2 className="tune__title">Fine-tune</h2>
        <p className="tune__desc">풍성함은 수량으로, 높이·분위기는 만드는 방법으로 바뀌어요.</p>

        <div className="tune__axes">
          {TUNE_AXES.map((axis) => (
            <div key={axis.key} className="tune-axis">
              <div className="tune-axis__labels">
                <span data-on={values[axis.key] < 0}>{axis.left}</span>
                <span data-on={values[axis.key] > 0}>{axis.right}</span>
              </div>
              <input
                id={`tune-${axis.key}`}
                className="tune-axis__range"
                type="range"
                min="-1"
                max="1"
                step="1"
                value={values[axis.key]}
                aria-label={`${axis.left} ↔ ${axis.right}`}
                onChange={(e) => setValues({ ...values, [axis.key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>

        {/* 연출: 다발 · 화병 · 행잉 중 어떤 모습으로 볼지 */}
        <h3 className="tune__label">연출</h3>
        <div className="tune__chips" data-cols="3">
          {FORMS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="tune__chip"
              aria-pressed={form === f.key}
              onClick={() => setForm(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!photoForms.includes(form) && (
          <p className="tune__note">이 연출 사진은 준비 중이에요. 필요한 소재는 제작 리스트에 반영돼요.</p>
        )}

        {/* 장식: 여러 개 고를 수 있음 — 지금 결과에 들어간 장식은 처음부터 선택 / 장식 없음은 모두 해제 */}
        <h3 className="tune__label">장식</h3>
        <div className="tune__chips" data-cols="4">
          <button type="button" className="tune__chip" aria-pressed={decor.length === 0} onClick={() => setDecor([])}>
            없음
          </button>
          {DECOR.map((d) => (
            <button
              key={d.key}
              type="button"
              className="tune__chip"
              aria-pressed={decor.includes(d.key)}
              onClick={() => toggleDecor(d.key)}
            >
              {d.word}
            </button>
          ))}
        </div>

        {/* 이렇게 바뀌어요: 풍성함 → 식물 수량 + 예상 금액 / 높이·정돈 → 만드는 방법 */}
        <div className="tune-plan" data-empty={plan.changes.length === 0 && plan.guides.length === 0} aria-live="polite">
          {plan.changes.length > 0 && (
            <>
              <ul className="tune-plan__list">
                {plan.changes.map((c) => (
                  <li key={c.name}>
                    <span className="tune-plan__name">{c.name}</span>
                    <span className="tune-plan__qty">
                      {c.from} → <strong data-up={c.to > c.from}>{c.to === 0 ? '빼요' : `${c.to}개`}</strong>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="tune-plan__price">
                예상 금액 {won(plan.priceFrom)} → <strong>{won(plan.priceTo)}</strong>
              </p>
            </>
          )}
          {plan.guides.length > 0 && (
            <div className="tune-plan__guides">
              <span className="tune-plan__label">만드는 방법</span>
              <ul>
                {plan.guides.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          )}
          {plan.changes.length === 0 && plan.guides.length === 0 && (
            <p className="tune-plan__empty">
              {words.length > 0 ? '식물 구성은 그대로예요.' :'가운데는 처음 구성 그대로예요. 바꾸고 싶은 쪽으로 옮겨보세요.'}
            </p>
          )}
        </div>

        <button
          type="button"
          className="tune__apply"
          disabled={!changed}
          onClick={() => onApply({ values, decor, form, words, changes: plan.changes, next: plan.next, guides: plan.guides })}
        >
          수정 적용하기
        </button>
      </section>
    </div>
  )
}

export default TuneSheet
