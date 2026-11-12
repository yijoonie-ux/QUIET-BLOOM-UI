import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import closeIcon from '../assets/make/close.svg'
import cardShape from '../assets/compose/card.svg'
import plusIcon from '../assets/compose/plus.svg'
import sortChevron from '../assets/compose/sort-chevron.svg'
import ComposeGuide from '../components/ComposeGuide'
import { isGuidePending } from '../components/composeGuideState'
import CompositionSheet from '../components/CompositionSheet'
import ExitConfirm from '../components/ExitConfirm'
import PlantDetail from '../components/PlantDetail'
import { clearCart, setPlantQty, useCart } from '../data/bouquet'
import { getActiveBouquet, startBouquet, useActiveBouquet } from '../data/bouquets'
import { CATEGORIES, PLANTS, useRecommendedPlants } from '../data/plants'
import { updateProfile, useProfile } from '../data/profile'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './Compose.css'

const CRITERIA = ['유지력', '예산']

// 시연 흐름: 부케별로 담기 전에 상세 정보를 한 번 보게 할 식물 (상세 팝업이 있는 식물)
const DETAIL_TOUR = { still: '연밥' }

// 식물 이름 + 을/를 (마지막 글자 받침 유무로)
const withObject = (name) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0
  return `${name}${hasFinal ? '을' : '를'}`
}

// 단계 게이지 색 (Figma: 지난 단계는 가득, 현재 단계는 절반)
const BAR_COLORS = ['#fff', '#f4ffe4', '#e9ffcc', '#daffa9']

// 식물 카드 (170×160): 왼쪽 위 + 버튼 자리만큼 파인 카드 모양 위에 사진·이름·가격
// + 버튼: 하나 담기 ↔ 빼기 (수량은 Composition에서 조절하거나 추천 수량으로 한 번에)
// locked면 담기 막힘 (표시는 하단 안내 문구로만)
function PlantCard({ plant, selected, onToggle, onOpen, index, cardRef, addRef, locked }) {
  const { photo } = plant
  return (
    <li
      ref={cardRef}
      className="plant-card"
      data-name={plant.name}
      style={{ '--i': index }}
      onAnimationEnd={(e) => {
        // 등장 모션이 끝나면 꺼둠 — 정렬로 카드 순서가 바뀔 때(DOM 이동) 등장 모션이 다시 재생되지 않게
        if (e.target === e.currentTarget && e.animationName === 'compose-card-in') e.currentTarget.dataset.entered = 'true'
      }}
    >
      <img className="plant-card__shape" src={cardShape} alt="" />
      {photo && (
        <span
          className="plant-card__photo"
          style={{ left: photo.frame[0], top: photo.frame[1], width: photo.frame[2], height: photo.frame[3] }}
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
      )}
      {photo?.veil && (
        <span
          className="plant-card__veil"
          style={{
            left: photo.veil[0],
            top: photo.veil[1],
            width: photo.veil[2],
            height: photo.veil[3],
            filter: `blur(${photo.veil[4]}px)`,
            '--veil-solid': `${photo.veil[5]}%`,
          }}
        />
      )}
      <p className="plant-card__name">{plant.name}</p>
      <p className="plant-card__price">₩ {plant.price.toLocaleString('ko-KR')}</p>
      {/* 카드 영역을 누르면 식물 상세 (+ 버튼은 이 위에 따로) */}
      {onOpen && (
        <button type="button" className="plant-card__open" aria-label={`${plant.name} 상세 정보`} onClick={onOpen} />
      )}
      <button
        type="button"
        ref={addRef}
        className="plant-card__add"
        aria-pressed={selected}
        aria-label={`${plant.name} ${selected ? '빼기' : '담기'}`}
        disabled={locked}
        onClick={onToggle}
      >
        <img src={plusIcon} alt="" />
      </button>
    </li>
  )
}

function Compose() {
  usePageBackground('#ffffff')
  const profile = useProfile()
  const [leaving, leave] = usePageLeave(280)
  const [step, setStep] = useState(0)
  // 담은 식물과 수량 (담은 순서대로, 프리뷰에 다녀와도 유지)
  const cart = useCart()
  const [detailPlant, setDetailPlant] = useState(null)
  // 상세 보기 안내(DETAIL_TOUR)의 식물 상세를 한 번 열었는지
  const [tourSeen, setTourSeen] = useState(false)
  const openDetail = (plant) => {
    setDetailPlant(plant)
    if (plant.name === DETAIL_TOUR[getActiveBouquet().key]) setTourSeen(true)
  }
  const [confirmingExit, setConfirmingExit] = useState(false)
  // 첫 안내 딤이 떠 있는 동안 (끝나면 하단 안내 문구가 나타남)
  const [guiding, setGuiding] = useState(isGuidePending)
  const category = CATEGORIES[step]
  const plants = useRecommendedPlants(category.key)
  const criteria = profile.criteria[0] ?? CRITERIA[0]
  // 안내 딤에서 비춰줄 요소들
  const stepsRef = useRef(null)
  const firstCardRef = useRef(null)
  const firstAddRef = useRef(null)
  const sheetRef = useRef(null)
  const guideTargets = useMemo(
    () => ({ steps: stepsRef, card: firstCardRef, add: firstAddRef, sheet: sheetRef }),
    [],
  )

  const inCart = (name) => cart.some((item) => item.name === name)

  const setQty = setPlantQty

  // 부케 유형: 들어올 때의 최종 조건(온보딩·조건 수정)으로 정해짐 → 그 레시피대로 담도록 안내
  const bouquet = useActiveBouquet()
  useEffect(() => {
    // 조건이 바뀌어 다른 부케가 되었으면 이전 부케로 담던 식물은 비움
    if (startBouquet(profile)) clearCart()
    // 들어올 때 한 번만 (부케 구성 중 정렬을 바꿔도 부케는 그대로)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const recipeQty = (name) => bouquet.recipe.find(([n]) => n === name)?.[1] ?? 0
  const cartQty = (name) => cart.find((item) => item.name === name)?.qty ?? 0
  // 아직 담지 않은 다음 식물 (단계 순서대로) — 담은 뒤 수량은 Composition에서 자유롭게 조절
  const stepOf = (name) => CATEGORIES.findIndex((c) => c.key === PLANTS.find((p) => p.name === name)?.category)
  const nextItem = [...bouquet.recipe]
    .sort((a, b) => stepOf(a[0]) - stepOf(b[0]))
    .find(([name]) => cartQty(name) === 0)
  const nextStep = nextItem ? stepOf(nextItem[0]) : -1
  const recipeDone = !nextItem

  // 카드의 + 버튼: 하나 담기 ↔ 빼기 (수량은 Composition에서 조절하거나 추천 수량으로 한 번에)
  const toggle = (name) => setQty(name, inCart(name) ? 0 : 1)

  // Composition의 "추천 수량 적용": 담은 식물 중 레시피에 있는 것은 레시피 수량으로 한 번에 맞춤
  const recommendable = cart.some(({ name, qty }) => recipeQty(name) > 0 && qty !== recipeQty(name))
  const applyRecommended = () =>
    cart.forEach(({ name }) => {
      if (recipeQty(name) > 0) setQty(name, recipeQty(name))
    })

  // 시연 흐름: 이 부케는 담기 전에 식물 상세를 한 번 보게 안내 (유지력+저자극+저향 Still → 연밥)
  const tourPlant = DETAIL_TOUR[bouquet.key]
  const detailPrompt = !!tourPlant && !tourSeen && nextItem?.[0] === tourPlant && nextStep === step

  // 안내 문구를 누르면 다음에 누를 곳으로 이동 (상세 보기 안내면 바로 상세 열기)
  const goToHint = () => {
    if (detailPrompt) {
      openDetail(PLANTS.find((p) => p.name === tourPlant))
      return
    }
    if (nextItem && nextStep !== step) {
      goToStep(nextStep)
      return
    }
    const card = gridRef.current?.querySelector(`[data-name="${nextItem?.[0]}"]`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const sheetItems = cart.map(({ name, qty }) => ({ plant: PLANTS.find((p) => p.name === name), qty }))

  // 단계 이동: 목록은 새 단계의 맨 위부터 보이게
  const goToStep = (next) => {
    if (next === step) return
    setStep(next)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  // 정렬 선택 목록 (바깥을 누르거나 Esc로 닫힘)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  useEffect(() => {
    if (!sortOpen) return undefined
    const onDown = (e) => {
      if (!sortRef.current?.contains(e.target)) setSortOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setSortOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  const chooseCriteria = (next) => {
    updateProfile({ criteria: [next] })
    setSortOpen(false)
  }

  // 정렬이 바뀌면 카드가 순간이동하지 않고 원래 자리에서 새 자리로 미끄러져 감 (FLIP)
  const gridRef = useRef(null)
  const lastLayout = useRef({ category: null, pos: new Map() })
  const order = plants.map((p) => p.name).join('|')
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const cards = [...grid.children]
    const pos = new Map(cards.map((el) => [el.dataset.name, { x: el.offsetLeft, y: el.offsetTop }]))
    const prev = lastLayout.current
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // 단계를 바꾼 경우는 목록이 새로 그려지므로 제외
    if (prev.category === category.key && !reduceMotion) {
      cards.forEach((el, i) => {
        const from = prev.pos.get(el.dataset.name)
        const to = pos.get(el.dataset.name)
        if (!from) return
        const dx = from.x - to.x
        const dy = from.y - to.y
        if (!dx && !dy) return
        // 두 줄 넘게 멀리 가는 카드는 다른 카드 위를 가로지르지 않도록
        // 원래 자리에서 작아지며 사라졌다가 새 자리에서 다시 피어남
        const far = Math.abs(dy) > 340
        el.animate(
          far
            ? [
                { translate: `${dx}px ${dy}px`, scale: 1, opacity: 1 },
                { translate: `${dx}px ${dy}px`, scale: 0.92, opacity: 0, offset: 0.28 },
                { translate: '0 0', scale: 0.92, opacity: 0, offset: 0.4 },
                { translate: '0 0', scale: 1, opacity: 1 },
              ]
            : [{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }],
          {
            duration: far ? 640 : 560,
            delay: Math.min(i, 8) * 18,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          },
        )
      })
    }
    lastLayout.current = { category: category.key, pos }
  }, [order, category.key])

  return (
    <div className="compose" data-leaving={leaving}>
      <header className="compose__header">
        <div className="compose__heading" key={category.key}>
          <h1 className="compose__title">{category.title}</h1>
          <p className="compose__desc">{category.desc}</p>
        </div>
        <button type="button" className="compose__close" aria-label="닫기" onClick={() => setConfirmingExit(true)}>
          <img src={closeIcon} alt="" />
        </button>

        <nav ref={stepsRef} className="compose__steps" aria-label="구성 단계">
          {CATEGORIES.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className="compose__step"
              aria-current={i === step ? 'step' : undefined}
              data-done={i < step}
              style={{ '--bar-color': BAR_COLORS[i] }}
              onClick={() => goToStep(i)}
            >
              {item.title}
              <span className="compose__bar" aria-hidden="true" />
            </button>
          ))}
        </nav>
      </header>

      <div className="compose__toolbar">
        <div ref={sortRef} className="compose__sort-wrap">
          <button
            type="button"
            className="compose__sort"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen(!sortOpen)}
          >
            {/* 기준이 바뀌면 글자가 살짝 떠오르며 교체 */}
            <span key={criteria} className="compose__sort-label">
              {criteria} 순
            </span>
            <img src={sortChevron} alt="" />
          </button>
          {sortOpen && (
            <ul className="compose__sort-menu" role="listbox" aria-label="정렬 기준">
              {CRITERIA.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item === criteria}
                    className="compose__sort-option"
                    onClick={() => chooseCriteria(item)}
                  >
                    {item} 순
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ul ref={gridRef} className="compose__grid" key={category.key}>
        {plants.map((plant, i) => (
          <PlantCard
            key={plant.name}
            plant={plant}
            index={i}
            selected={inCart(plant.name)}
            onToggle={() => toggle(plant.name)}
            onOpen={plant.detail ? () => openDetail(plant) : undefined}
            cardRef={i === 0 ? firstCardRef : undefined}
            addRef={i === 0 ? firstAddRef : undefined}
            locked={!recipeQty(plant.name) && !inCart(plant.name)}
          />
        ))}
      </ul>

      {/* 프로토타입처럼 다음에 누를 곳 안내 (누르면 그 자리로 이동) — 첫 안내 딤이 끝난 뒤에 나타남 */}
      {!guiding && !detailPlant && (
        <button type="button" className="compose__hint" key={nextItem?.[0] ?? 'done'} onClick={goToHint}>
          <span className="compose__hint-dot" aria-hidden="true" />
          {nextItem
            ? nextStep !== step
              ? `${CATEGORIES[nextStep].title} 단계로 넘어가 주세요`
              : detailPrompt
                ? `${withObject(nextItem[0])} 눌러 상세 정보를 봐보세요`
                : `${withObject(nextItem[0])} 담아주세요`
            : recommendable
              ? (
                  // 추천 수량 안내: 왜 맞추면 좋은지 한 줄 더
                  <span className="compose__hint-text">
                    Composition에서 추천 수량을 적용해요
                    <span className="compose__hint-sub">추천 수량이면 더 완성도 있는 부케가 돼요</span>
                  </span>
                )
              : '아래 Composition을 열어 부케를 제작해요'}
        </button>
      )}

      <CompositionSheet
        ref={sheetRef}
        items={sheetItems}
        onQtyChange={setQty}
        canMake={recipeDone}
        recommendable={recommendable}
        onRecommend={applyRecommended}
        onMake={() => leave('/preview', { state: { building: true } })}
      />

      <ComposeGuide
        targets={guideTargets}
        bouquet={{ tags: bouquet.tags, criteria: bouquet.when.criteria }}
        onClose={() => setGuiding(false)}
      />

      {confirmingExit && (
        <ExitConfirm
          onContinue={() => setConfirmingExit(false)}
          onExit={() => {
            setConfirmingExit(false)
            // 나가면 지금까지 담은 내용은 저장하지 않음
            clearCart()
            leave('/make')
          }}
        />
      )}

      {detailPlant && (
        <PlantDetail
          plant={detailPlant}
          selected={inCart(detailPlant.name)}
          onToggle={() => toggle(detailPlant.name)}
          onClose={() => setDetailPlant(null)}
        />
      )}
    </div>
  )
}

export default Compose
