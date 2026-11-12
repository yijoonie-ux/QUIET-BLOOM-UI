import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import backIcon from '../assets/edit/back.svg'
import { replacePlant, setPlantQty, useCart } from '../data/bouquet'
import { useActiveBouquet } from '../data/bouquets'
import { PLANTS } from '../data/plants'
import { getBloomType, useProfile } from '../data/profile'
import { STORES, findSubstitutes, isAvailableAt, rankStores, recordSwap, storeUrl, useSwaps } from '../data/sourcing'
import { costOf, stylingFor } from '../data/styling'
import { useAppliedTune } from '../data/tune'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './Realize.css'

const won = (n) => `${n.toLocaleString('ko-KR')}원`
const roleOf = (plant) => plant.category[0].toUpperCase() + plant.category.slice(1)

// 카드 사진을 정사각 썸네일 안에 높이 기준으로 (Composition 썸네일과 같은 방식)
function Thumb({ plant, size = 44 }) {
  const { photo } = plant
  const scale = (size - 2) / photo.frame[3]
  return (
    <span className="rz-thumb" style={{ width: size, height: size }}>
      <span className="rz-thumb__photo" style={{ width: photo.frame[2] * scale, height: photo.frame[3] * scale }}>
        <img
          src={photo.src}
          alt=""
          style={{ width: `${photo.crop[0]}%`, height: `${photo.crop[1]}%`, left: `${photo.crop[2]}%`, top: `${photo.crop[3]}%` }}
        />
      </span>
    </span>
  )
}

// 예상 제작비 vs 설정 예산 (민감도 × 추천 기준별 기본 예산)
// cost: 총 제작비 { plants, styling, total } (Bloom Complete · Details와 같은 기준)
// showBudget: 추천 기준이 '예산'인 사람만 기본 예산과 비교 (유지력은 금액만)
function Budget({ cost, budget, showBudget }) {
  const { total } = cost
  const over = total > budget
  const rate = Math.round((total / budget) * 100)
  const breakdown = cost.styling > 0 && (
    <span className="rz-budget__break">
      식물 {won(cost.plants)} · 연출 소재 {won(cost.styling)}
    </span>
  )
  if (!showBudget) {
    return (
      <div className="rz-budget">
        <div className="rz-budget__sum">
          <span className="rz-budget__label">예상 제작비</span>
          <strong className="rz-budget__total">
            {total.toLocaleString('ko-KR')}
            <small>원</small>
          </strong>
          {breakdown}
        </div>
      </div>
    )
  }
  return (
    <div className="rz-budget" data-over={over}>
      <div className="rz-budget__top">
        <div className="rz-budget__sum">
          <span className="rz-budget__label">예상 제작비</span>
          <strong className="rz-budget__total">
            {total.toLocaleString('ko-KR')}
            <small>원</small>
          </strong>
          {breakdown}
        </div>
        <span className="rz-budget__state">{over ? `예산 ${won(total - budget)} 초과` : `예산의 ${rate}%`}</span>
      </div>
      <span className="rz-budget__bar">
        <i style={{ width: `${Math.min(100, rate)}%` }} />
      </span>
      <div className="rz-budget__scale">
        <span>기본 예산</span>
        <span>{won(budget)}</span>
      </div>
    </div>
  )
}

// Make This Bloom (AI Preview → 최종 부케 확인 → 여기)
// 소재별 구매 정보 · 구매처 확인 · 대체 소재 → 리스트 확정하면 바로 Bloom Card 저장
function Realize() {
  usePageBackground('#f3f6ed')
  const [leaving, leave] = usePageLeave(280)
  const location = useLocation()
  const profile = useProfile()
  const bouquet = useActiveBouquet()
  const cart = useCart()
  const swaps = useSwaps()
  const bloomType = getBloomType(profile)
  const [selected, setSelected] = useState(null) // 구매처 시트를 연 소재 이름
  const [showSubs, setShowSubs] = useState(false)
  const [toast, setToast] = useState(null)

  // 담은 식물이 없으면(새로고침 등) 부케 레시피 기준으로
  const items = (cart.length ? cart : bouquet.recipe.map(([name, qty]) => ({ name, qty })))
    .map(({ name, qty }) => ({ plant: PLANTS.find((p) => p.name === name), qty }))
    .filter((item) => item.plant)
  // 연출 소재: AI Preview에서 고른 연출(화병·행잉·포장)과 장식(진주·큐빅·레이스, 인상 다듬기 장식 포함)
  const appliedTune = useAppliedTune()
  const styling = stylingFor(
    // 주소로 바로 들어오면(새로고침·링크) 결과 정보가 없어서 이 부케의 첫 AI 결과 기준으로
    location.state?.result ?? bouquet.results[0]?.key,
    appliedTune?.decor,
    appliedTune?.form,
  )
  const cost = costOf(
    items.map(({ plant, qty }) => ({ name: plant.name, qty })),
    styling,
  )
  const cartNames = items.map(({ plant }) => plant.name)
  // 구매처 추천: 지금 구성 기준으로 구할 수 있는 식물이 많은 곳부터 — 처음엔 1순위를 골라 둠
  const recipeNames = bouquet.recipe.map(([name]) => name)
  const ranked = rankStores(bouquet.key, cartNames, recipeNames)
  const [storeKey, setStoreKey] = useState(null)
  const chosen = ranked.find((r) => r.store.key === storeKey) ?? ranked[0]
  const store = chosen.store
  const availableHere = (name) => isAvailableAt(store.key, bouquet.key, name, recipeNames)
  // 대체 소재: 고른 구매처에서 구할 수 있는 같은 역할 식물
  const subsFor = (name) =>
    findSubstitutes(name, { profile, cartNames, bouquetKey: bouquet.key, store: { store, recipeNames } })
  const blocked = items.filter(({ plant }) => !availableHere(plant.name))

  // 담은 식물이 없으면(새로고침 등) 레시피를 담아두고 시작 — 소재 교체가 Composition에 남도록
  useEffect(() => {
    if (cart.length === 0) bouquet.recipe.forEach(([name, qty]) => setPlantQty(name, qty))
    // 들어올 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const openSheet = (name) => {
    setSelected(name)
    setShowSubs(!availableHere(name))
  }

  // 소재 교체: Composition(담은 식물)에 바로 반영 → 예상 제작비도 다시 계산
  const swap = (from, to) => {
    replacePlant(from, to)
    recordSwap(from, to)
    setSelected(null)
    setToast(`${from} → ${to}로 바꿨어요`)
  }

  const current = items.find(({ plant }) => plant.name === selected)

  return (
    <div className="rz" data-leaving={leaving}>
      <header className="rz__header">
        <button
          type="button"
          className="rz__back"
          aria-label="뒤로"
          onClick={() => leave('/preview', { state: location.state })}
        >
          <img src={backIcon} alt="" />
        </button>
        <h1 className="rz__title">Make This Bloom</h1>
        <p className="rz__desc">
          이 부케를 실제로 만들 때 필요한 소재예요.
        </p>
      </header>

      <div className="rz__body">
        <Budget cost={cost} showBudget={(profile.criteria[0] ?? '유지력') === '예산'} budget={bloomType.budget} />

        {/* 구매처 추천: 한 곳에서 최대한 많이 — 구할 수 있는 식물 수 순 (시연용 가상 재고) */}
        <section className="rz-stores">
          <div className="rz-label">
            <h2>Where to Buy</h2>
            <span>구할 수 있는 식물 수</span>
          </div>
          {/* 흰 판 하나에 세 줄: 이름 · 짧은 설명 / 오른쪽 큰 숫자 */}
          <ul className="rz-stores__list">
            {ranked.map(({ store: s, available, missing }, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  className="rz-store"
                  aria-pressed={s.key === store.key}
                  onClick={() => setStoreKey(s.key)}
                >
                  <span className="rz-store__radio" aria-hidden="true" />
                  <span className="rz-store__text">
                    <span className="rz-store__name">{s.name}</span>
                    <span className="rz-store__note">
                      {i === 0 && '추천 · '}
                      {missing.length ? `대체 ${missing.length}종` : '모두 준비 가능'}
                    </span>
                  </span>
                  <span className="rz-store__count" aria-label={`${cartNames.length}종 중 ${available.length}종 구매 가능`}>
                    {available.length}
                    <small>/{cartNames.length}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 필요한 소재: 고른 구매처 기준으로 구매 가능 / 대체 필요 */}
        <section className="rz-group">
          <div className="rz-group__head">
            <h2>Materials</h2>
            <span>{store.name}</span>
          </div>
          <ul className="rz__list">
            {items.map(({ plant, qty }) => {
              const missing = !availableHere(plant.name)
              const swappedFrom = swaps[plant.name]
              const tone = missing ? 'bad' : swappedFrom ? 'swap' : 'ok'
              return (
                <li key={plant.name}>
                  <button
                    type="button"
                    className="rz-item"
                    data-soldout={missing}
                    onClick={() => openSheet(plant.name)}
                  >
                    <Thumb plant={plant} size={48} />
                    <span className="rz-item__text">
                      <span className="rz-item__name">
                        {plant.name}
                        <span className="rz-item__qty">{qty}개</span>
                      </span>
                      <span className="rz-item__meta">
                        {swappedFrom ? `${swappedFrom} 대신 · ` : `${roleOf(plant)} · `}
                        {won(plant.price * qty)}
                      </span>
                    </span>
                    <span className="rz-status" data-tone={tone}>
                      {missing ? '대체 필요' : swappedFrom ? '바꿨어요' : '구매 가능'}
                    </span>
                    <svg className="rz-item__more" width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
                      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
          {/* 한 곳에서 다 준비되면 한 줄 (아직이면 버튼 위 안내가 대신 알려줌) */}
          {blocked.length === 0 && (
            <p className="rz-ready" data-done="true">
              {store.name} 한 곳에서 {items.length}종 모두 준비할 수 있어요
            </p>
          )}
        </section>

        {/* 연출 소재: 누르면 바로 구할 수 있는 곳(온라인 검색)으로 */}
        {styling.length > 0 && (
          <section className="rz-group">
            <div className="rz-group__head">
              <h2>Styling</h2>
              <span>{styling.length}종</span>
            </div>
            <ul className="rz__list">
              {styling.map((s) => (
                <li key={s.key}>
                  <a className="rz-item rz-item--styling" href={s.url} target="_blank" rel="noreferrer">
                    <span className="rz-item__text">
                      <span className="rz-item__name">{s.name}</span>
                      <span className="rz-item__meta">
                        {s.note} · {won(s.price)}
                      </span>
                    </span>
                    <svg className="rz-item__out" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 인상 다듬기에서 고른 높이·분위기 → 만드는 방법 */}
        {appliedTune?.guides?.length > 0 && (
          <section className="rz-group rz-guide">
            <div className="rz-group__head">
              <h2>How to Arrange</h2>
            </div>
            <ul className="rz-guide__list">
              {appliedTune.guides.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="rz__info">소재를 누르면 구매처와 대체 소재를 볼 수 있어요. 재고는 시연용 예시예요.</p>
      </div>

      <div className="rz__actions">
        {blocked.length > 0 && (
          <p className="rz__hint">
            {store.name}에서 구하기 어려운 {blocked.length}종을 바꾸면 완성할 수 있어요
          </p>
        )}
        {/* 소재를 다 준비해 실제로 만들고 나면 완성하기 → Bloom Complete (바꾼 소재까지 반영된 구성) → 카드 */}
        <button
          type="button"
          className="rz__primary"
          disabled={blocked.length > 0}
          onClick={() => leave('/complete', { state: location.state })}
        >
          완성하기
        </button>
      </div>

      {/* 소재별 구매처 → (구매 불가) 대체 소재 */}
      {current && (
        <div className="rz-sheet" onClick={() => setSelected(null)}>
          <section
            className="rz-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${current.plant.name} 구매 정보`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="rz-sheet__handle" aria-hidden="true" />
            <div className="rz-sheet__head">
              <Thumb plant={current.plant} size={56} />
              <div>
                <h2 className="rz-sheet__title">
                  {current.plant.name} <span>× {current.qty}</span>
                </h2>
                <p className="rz-sheet__sub">
                  {roleOf(current.plant)} · 개당 {won(current.plant.price)} · 예상 {won(current.plant.price * current.qty)}
                </p>
              </div>
            </div>

            {/* 이 식물을 구할 수 있는 곳: 고른 구매처가 맨 위 */}
            <h3 className="rz-sheet__label">Where to Buy</h3>
            <ul className="rz-shops">
              {[store, ...STORES.filter((s) => s.key !== store.key)].map((s) => {
                const ok = isAvailableAt(s.key, bouquet.key, current.plant.name, recipeNames)
                return (
                  <li key={s.key}>
                    <a className="rz-shop" href={storeUrl(s, current.plant.name)} target="_blank" rel="noreferrer">
                      <span className="rz-shop__text">
                        <span className="rz-shop__name">
                          {s.name}
                          {s.key === store.key && <span className="rz-shop__mine">고른 곳</span>}
                        </span>
                        <span className="rz-shop__note">{ok ? s.note : '이번 주 구하기 어려워요'}</span>
                      </span>
                      <span className="rz-pill" data-tone={ok ? 'ok' : 'bad'}>
                        {ok ? '찾아보기' : '없음'}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>

            {!showSubs ? (
              <button type="button" className="rz-sheet__more" onClick={() => setShowSubs(true)}>
                다른 소재로 바꾸기
              </button>
            ) : (
              <>
                <h3 className="rz-sheet__label">Alternatives</h3>
                <p className="rz-sheet__why">
                  {store.name}에서 구할 수 있는 소재 중, 같은 {roleOf(current.plant)} 역할과 민감도 조건을 지키는 것만 골랐어요.
                </p>
                {subsFor(current.plant.name).length === 0 && (
                  <p className="rz-sheet__none">이 구매처에는 대신할 소재가 없어요. 위에서 다른 구매처를 골라보세요.</p>
                )}
                <ul className="rz-subs">
                  {subsFor(current.plant.name).map(({ plant, reasons }) => (
                    <li key={plant.name} className="rz-sub">
                      <div className="rz-sub__main">
                        <Thumb plant={plant} size={52} />
                        <span className="rz-sub__text">
                          <span className="rz-sub__name">
                            {plant.name}
                            <span className="rz-sub__from">{current.plant.name} 대신</span>
                          </span>
                          {/* 기존 소재와 가격 비교 (개당) */}
                          <span className="rz-sub__price">
                            개당 {won(current.plant.price)} → <strong>{won(plant.price)}</strong>
                          </span>
                        </span>
                        <button type="button" className="rz-sub__pick" onClick={() => swap(current.plant.name, plant.name)}>
                          바꾸기
                        </button>
                      </div>
                      {/* 이 소재를 고른 이유: 체크 표시와 함께 한 줄로 */}
                      <ul className="rz-sub__why">
                        {reasons.map((r) => (
                          <li key={r}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      {toast && (
        <p className="rz-toast" role="status">
          {toast}
        </p>
      )}
    </div>
  )
}

export default Realize
