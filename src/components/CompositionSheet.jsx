import { forwardRef, useEffect, useRef, useState } from 'react'
import plusIcon from '../assets/compose/qty-plus.svg'
import minusIcon from '../assets/compose/qty-minus.svg'
import { CATEGORIES } from '../data/plants'
import './CompositionSheet.css'

const PEEK = 139 // 접혀 있을 때 보이는 높이 (Figma 부케 구성 하단 시트)
const won = (n) => `₩ ${n.toLocaleString('ko-KR')}`
const categoryTitle = (key) => CATEGORIES.find((c) => c.key === key)?.title ?? ''

// 70×70 썸네일 안에 카드 사진을 높이 72 기준으로 맞춰 넣음
function Thumb({ photo }) {
  if (!photo) return <span className="comp-item__thumb" />
  const scale = 72 / photo.frame[3]
  return (
    <span className="comp-item__thumb">
      <span
        className="comp-item__photo"
        style={{ width: photo.frame[2] * scale, height: photo.frame[3] * scale }}
      >
        <img
          src={photo.src}
          alt=""
          style={{
            width: `${photo.crop[0]}%`,
            height: `${photo.crop[1]}%`,
            left: `${photo.crop[2]}%`,
            top: `${photo.crop[3]}%`,
          }}
        />
      </span>
    </span>
  )
}

// 부케 구성 하단 Composition 시트 (Figma 2268:19672)
// 접힌 상태: 제목·개수만 / 펼친 상태: 담은 식물 목록(수량 조절)·총 금액·부케 제작하기
// items: [{ plant, qty }] — 담은 순서대로
// canMake: 정해진 부케 레시피의 식물을 다 담았을 때만 제작 가능 (수량은 자유롭게 조절)
// recommendable / onRecommend: 담은 수량이 추천(레시피) 수량과 다르면 "추천 수량 적용"으로 한 번에 맞춤
const CompositionSheet = forwardRef(function CompositionSheet(
  { items, onQtyChange, onMake, canMake = true, recommendable = false, onRecommend },
  ref,
) {
  const [open, setOpen] = useState(false)
  const [drag, setDrag] = useState(null) // 끄는 중의 위치 보정(px)
  const start = useRef(null)
  const sheetRef = useRef(null)

  // 목록이 넘칠 때 위·아래 어느 쪽에 더 있는지 (그쪽 끝만 흐림)
  const bodyRef = useRef(null)
  const [fade, setFade] = useState('none')
  const updateFade = () => {
    const el = bodyRef.current
    if (!el) return
    const top = el.scrollTop > 2
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2
    setFade(top && bottom ? 'both' : top ? 'top' : bottom ? 'bottom' : 'none')
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(updateFade, [items.length, open])

  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.plant.price * item.qty, 0)

  // 펼쳐져 있는 동안 뒤 화면 스크롤 잠금
  useEffect(() => {
    if (!open) return undefined
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [open])

  // 손잡이·머리 부분을 끌어 올리고 내림 (짧게 누르면 열고 닫기)
  const onPointerDown = (e) => {
    const height = sheetRef.current.offsetHeight
    start.current = { y: e.clientY, t: performance.now(), base: open ? 0 : height - PEEK, max: height - PEEK }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!start.current) return
    const { y, base, max } = start.current
    const offset = Math.min(max, Math.max(0, base + e.clientY - y))
    setDrag(offset)
  }

  const onPointerUp = (e) => {
    if (!start.current) return
    const { y, t, base, max } = start.current
    start.current = null
    const moved = e.clientY - y
    const velocity = moved / Math.max(1, performance.now() - t)
    setDrag(null)
    if (Math.abs(moved) < 6) {
      setOpen(!open)
      return
    }
    // 빠르게 튕기면 그 방향으로, 아니면 절반을 넘었는지로 결정
    if (Math.abs(velocity) > 0.4) setOpen(velocity < 0)
    else setOpen(base + moved < max / 2)
  }

  const setRefs = (node) => {
    sheetRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <>
      <div className="comp-backdrop" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />
      <section
        ref={setRefs}
        className="comp-sheet"
        data-open={open}
        data-dragging={drag !== null}
        style={drag !== null ? { transform: `translateY(${drag}px)` } : undefined}
        aria-label="Composition"
      >
        <div
          className="comp-sheet__head"
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={open ? '컴포지션 접기' : '컴포지션 펼치기'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null
            setDrag(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(!open)
            }
          }}
        >
          <span className="comp-sheet__handle" aria-hidden="true" />
          <h2 className="comp-sheet__title">Composition</h2>
          <p className="comp-sheet__count">총 {count}개의 식물이 선택되었어요</p>
          {/* 펼쳤을 때만 보임 */}
          {open && recommendable && onRecommend && (
            <button
              type="button"
              className="comp-sheet__recommend"
              // 머리 부분 끌기·열고 닫기와 겹치지 않게
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onRecommend()
              }}
            >
              추천 수량 적용
            </button>
          )}
        </div>

        <div ref={bodyRef} className="comp-sheet__body" data-fade={fade} onScroll={updateFade} aria-hidden={!open}>
          {items.length === 0 ? (
            <p className="comp-sheet__empty">
              아직 담은 식물이 없어요.
              <br />
              카드의 + 버튼으로 식물을 담아보세요.
            </p>
          ) : (
            <ul className="comp-sheet__list">
              {items.map(({ plant, qty }) => (
                <li key={plant.name} className="comp-item">
                  <Thumb photo={plant.photo} />
                  <div className="comp-item__info">
                    <p className="comp-item__name">{plant.name}</p>
                    <p className="comp-item__price">{won(plant.price)}</p>
                    <p className="comp-item__category">{categoryTitle(plant.category)}</p>
                  </div>
                  <div className="comp-item__qty">
                    <button
                      type="button"
                      className="comp-item__step"
                      aria-label={`${plant.name} 하나 빼기`}
                      onClick={() => onQtyChange(plant.name, qty - 1)}
                    >
                      <img src={minusIcon} alt="" />
                    </button>
                    <span className="comp-item__count" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="comp-item__step"
                      aria-label={`${plant.name} 하나 더하기`}
                      onClick={() => onQtyChange(plant.name, qty + 1)}
                    >
                      <img src={plusIcon} alt="" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="comp-sheet__foot" aria-hidden={!open}>
          <div className="comp-sheet__total">
            <span>Total Amount</span>
            <strong>{won(total)}</strong>
          </div>
          <button
            type="button"
            className="comp-sheet__make"
            disabled={count === 0 || !canMake}
            onClick={onMake}
          >
            부케 제작하기
          </button>
        </div>
      </section>
    </>
  )
})

export default CompositionSheet
