import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import BloomInfo from '../components/BloomInfo'
import PlantDetail from '../components/PlantDetail'
import backIcon from '../assets/blooms/back-white.svg'
import editIcon from '../assets/blooms/edit.svg'
import divider from '../assets/blooms/divider.svg'
import lastingIcon from '../assets/blooms/icon-lasting.svg'
import waterIcon from '../assets/blooms/icon-water.svg'
import budgetIcon from '../assets/blooms/icon-budget.svg'
import { SAVED_BLOOMS, findBloom, useMadeBloom } from '../data/blooms'
import { useCart } from '../data/bouquet'
import { findBouquet, findResult, useActiveBouquet } from '../data/bouquets'
import { PLANTS } from '../data/plants'
import { settleSoldOut, useSwaps } from '../data/sourcing'
import { costOf, stylingFor } from '../data/styling'
import { useAppliedTune } from '../data/tune'
import { usePageBackground } from '../hooks/usePageBackground'
import { useDragScroll } from '../hooks/useDragScroll'
import { usePageLeave } from '../hooks/usePageLeave'
import './BloomDetails.css'

const won = (n) => `₩${n.toLocaleString('ko-KR')}`

// 106×106 칸 안에 카드 사진을 높이 98 기준으로, 아래에 붙여 넣음
// onOpen: 상세 정보가 있는 식물(지금은 엽란)은 눌러서 식물 상세 팝업
function PlantThumb({ plant, onOpen }) {
  const { photo } = plant
  const scale = photo ? 98 / photo.frame[3] : 1
  return (
    <li className="bd-thumb" aria-label={plant.name}>
      {onOpen && (
        <button type="button" className="bd-thumb__open" aria-label={`${plant.name} 상세 정보`} onClick={onOpen} />
      )}
      {photo && (
        <span className="bd-thumb__photo" style={{ width: photo.frame[2] * scale, height: photo.frame[3] * scale }}>
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
    </li>
  )
}

// 링크 복사: 클립보드 API가 막힌 곳(휴대폰에서 http 주소로 열었을 때 등)은 예전 방식(선택 후 복사)으로
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // 아래 방식으로
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;'
  document.body.appendChild(area)
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    document.execCommand('copy')
  } catch {
    // 복사가 막혀도 안내는 그대로
  }
  area.remove()
}

// 문장 속 식물 이름을 바꾸면서 뒤 조사도 받침에 맞게 (드라세나로 → 피토스포룸으로)
const JOSA = { 로: ['으로', '로'], 으로: ['으로', '로'], 를: ['을', '를'], 을: ['을', '를'], 가: ['이', '가'], 이: ['이', '가'], 와: ['과', '와'], 과: ['과', '와'], 는: ['은', '는'], 은: ['은', '는'] }
function replaceName(text, from, to) {
  const code = to.charCodeAt(to.length - 1) - 0xac00
  const batchim = code >= 0 && code <= 11171 ? code % 28 : 0
  // 'ㄹ' 받침은 '로'
  const pick = ([withB, without], josa) => (batchim === 0 || (batchim === 8 && josa.endsWith('로')) ? without : withB)
  return text.replace(new RegExp(`${from}(으로|로|을|를|이|가|와|과|은|는)?`, 'g'), (_, josa) =>
    josa ? to + pick(JOSA[josa], josa) : to,
  )
}

// 소개 문구 속 원래 식물 이름도 바꾼 식물로 (swaps: { 새 소재: 원래 소재 })
function withSwapText(bloom) {
  const swaps = Object.entries(bloom.swaps ?? {})
  if (!swaps.length) return bloom
  return {
    ...bloom,
    desc: swaps.reduce((text, [to, from]) => replaceName(text, from, to), bloom.desc),
    descLines: undefined,
  }
}

// 저장한 부케는 품절 소재를 이미 바꾼 뒤 완성한 것 — 남은 품절 소재는 대체 소재로 (직접 만든 기록이 없는 예시 부케)
function settled(bloom) {
  const bouquet = findBouquet(bloom.id)
  if (!bouquet || bloom.swaps) return bloom
  const profile = { lowIrritant: bouquet.when.lowIrritant, lowScent: bouquet.when.lowScent, excludedPlants: [] }
  const { recipe, swaps } = settleSoldOut(bloom.id, bloom.recipe, profile)
  return { ...bloom, recipe, plants: recipe.map(([name]) => name), swaps }
}

// 직접 만든 부케면 실제로 쓴 구성(대체 식물로 바꾼 것 포함) · 고른 결과 사진 · 장식·연출로 덮어씀
function withMade(bloom, made) {
  if (!made || made.bouquet !== bloom.id || !made.items?.length) return bloom
  const result = findResult(made.result)
  return {
    ...bloom,
    swaps: made.swaps ?? {},
    recipe: made.items.map(({ name, qty }) => [name, qty]),
    plants: made.items.map(({ name }) => name),
    result: made.result ?? bloom.result,
    decor: made.decor,
    form: made.form,
    ...(result?.hero && { hero: result.hero, heroShade: result.heroShade }),
  }
}

// Bloom Details (Still 2268:20476 · Calm 2268:20410) / Bloom Complete (Figma 2268:20344)
// complete: 방금 완성한 부케 — 사진은 마지막 생성 결과
function BloomDetails({ variant = 'details' }) {
  const [leaving, leave] = usePageLeave(280)
  const { id } = useParams()
  const location = useLocation()
  const isComplete = variant === 'complete'
  const thumbsRef = useDragScroll()
  // Composition 식물을 누르면 식물 상세 팝업 (보기 전용)
  const [detailPlant, setDetailPlant] = useState(null)
  const [toast, setToast] = useState(null)
  // 완성 화면: 지금 만든 부케 유형(bouquets.js) / 상세 화면: 저장한 부케(blooms.js)
  const active = useActiveBouquet()
  const cart = useCart()
  const appliedTune = useAppliedTune()
  const made = useMadeBloom()
  const swaps = useSwaps()
  // 완성 화면: 제작 준비에서 확정한 구성(대체 식물 포함) — 담은 게 없으면 레시피
  const base = isComplete
    ? {
        name: active.name,
        lasting: active.lasting,
        water: active.water,
        summary: active.summary,
        desc: Object.entries(swaps).reduce((text, [to, from]) => replaceName(text, from, to), active.desc),
        plants: cart.length ? cart.map(({ name }) => name) : active.recipe.map(([name]) => name),
        recipe: cart.length ? cart.map(({ name, qty }) => [name, qty]) : active.recipe,
        swaps,
      }
    : withSwapText(settled(withMade(findBloom(id) ?? SAVED_BLOOMS[0], made)))
  // 배경은 흰색 (Figma에서 아래쪽 연두 그라데이션 뺌)
  usePageBackground('#ffffff')
  // My Blooms에서 카드를 내려 들어오면: 둥근 면이 덮은 뒤 사진이 위에서 내려옴
  const viaPull = location.state?.via === 'pull'
  const result = findResult(location.state?.result)
  // 연출 소재 기준 결과: 결과 없이 왔으면 이 부케의 첫 AI 결과 (Make This Bloom과 같은 기준)
  const stylingKey = location.state?.result ?? active.results[0]?.key
  const bloom = isComplete
    ? {
        ...base,
        hero: result?.hero ?? { image: active.preview.image, size: [300, 546], top: -40, plain: true },
      }
    : base
  // 사진 위 그라데이션: 완성 화면은 이번 결과의 것, 상세 화면은 저장한 부케의 것
  const heroShade = isComplete ? result?.heroShade : base.heroShade
  // Composition은 부케 데이터의 대표 구성 그대로 (blooms.js)
  const plants = base.plants.map((name) => PLANTS.find((p) => p.name === name)).filter(Boolean)
  // 가격 = 총 제작비(식물 + 연출 소재) — Make This Bloom과 같은 기준
  // 완성 화면: 지금 담은 수량(인상 다듬기 반영) + 이번 결과의 연출 / 상세 화면: 저장한 부케 구성 + 그 결과의 연출
  const cost = isComplete
    ? costOf(
        cart.length ? cart : active.recipe.map(([name, qty]) => ({ name, qty })),
        stylingFor(stylingKey, appliedTune?.decor, appliedTune?.form),
      )
    : costOf(base.recipe.map(([name, qty]) => ({ name, qty })), stylingFor(base.result, base.decor, base.form))
  const price = cost.total

  const stats = [
    { icon: lastingIcon, label: bloom.lasting, name: '유지기간' },
    { icon: waterIcon, label: bloom.water, name: '물교체' },
    { icon: budgetIcon, label: won(price), name: '가격' },
  ]

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  // 공유: 휴대폰은 기본 공유 창(카톡·메시지 등), 지원 안 하면 링크 복사
  const share = async () => {
    // 완성 화면 주소(/complete)는 열어도 이 부케가 안 보여서, 같은 부케의 상세 주소로 보냄
    const url = isComplete ? `${window.location.origin}/blooms/${active.key}` : window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `${bloom.name} · Quiet Bloom`, text: bloom.summary, url })
      } catch {
        // 공유 창을 닫은 경우
      }
      return
    }
    await copyText(url)
    setToast('링크를 복사했어요')
  }

  return (
    <div
      className="bd"
      data-leaving={leaving}
      data-enter={viaPull ? 'pull' : undefined}
    >
      {/* 위쪽 부케 사진 (아래 모서리 둥글게) */}
      <div className="bd__hero" data-plain={bloom.hero.plain === true}>
        <img
          className="bd__hero-image"
          src={bloom.hero.image}
          alt={`${bloom.name} 부케`}
          style={{
            width: bloom.hero.size[0],
            height: bloom.hero.size[1],
            top: bloom.hero.top,
            marginLeft: bloom.hero.x ?? 0,
          }}
        />
        {/* 밝은 사진 위: 위쪽 짙은 그라데이션으로 흰 제목이 잘 보이게 */}
        {(isComplete || bloom.hero.shade || heroShade) && (
          <span
            className="bd__hero-shade"
            data-warm={!!heroShade}
            style={
              heroShade
                ? {
                    height: heroShade[0],
                    '--shade': heroShade[1],
                    '--shade-alpha': heroShade[2] ?? 0.52,
                    '--shade-solid': heroShade[3] ?? '0%',
                  }
                : undefined
            }
          />
        )}
        <header className="bd__header" data-complete={isComplete}>
          {!isComplete && (
            <button
              type="button"
              className="bd__back"
              aria-label="뒤로"
              onClick={() => leave('/blooms', { state: { id: base.id } })}
            >
              <img src={backIcon} alt="" />
            </button>
          )}
          <button type="button" className="bd__share" aria-label="링크로 공유하기" onClick={share}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 11.5V2.5M9 2.5 5.75 5.75M9 2.5l3.25 3.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 8.5H4.75c-.7 0-1.25.55-1.25 1.25v4.5c0 .7.55 1.25 1.25 1.25h8.5c.7 0 1.25-.55 1.25-1.25v-4.5c0-.7-.55-1.25-1.25-1.25H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="bd__title">{isComplete ? 'Bloom Complete' : 'Bloom Details'}</h1>
          {/* Figma: Bloom Complete 2268:20344 / Bloom Details 2542:7600 · 8255 */}
          <p className="bd__desc">
            {isComplete ? '완성된 부케의 구성과 정보를 확인해보세요.' : '완성한 부케의 구성과 관리 정보를 확인해보세요.'}
          </p>
        </header>
      </div>

      <div className="bd__name">
        <h2>{bloom.name}</h2>
        {/* TODO: 이름 수정 */}
        <button type="button" className="bd__edit" aria-label="이름 수정">
          <img src={editIcon} alt="" />
        </button>
      </div>

      <dl className="bd__stats">
        {stats.map((stat) => (
          <div key={stat.name} className="bd__stat">
            <dt className="bd__stat-icon">
              <img src={stat.icon} alt={stat.name} />
            </dt>
            <dd>{stat.label}</dd>
          </div>
        ))}
      </dl>
      {/* 가격 내역: 식물 + 연출 소재 */}
      {cost.styling > 0 && (
        <p className="bd__cost">
          식물 {won(cost.plants)} + 연출 소재 {won(cost.styling)}
        </p>
      )}

      <img className="bd__divider" src={divider} alt="" />

      <section className="bd__section">
        <h3 className="bd__heading">About This Bloom</h3>
        <p className="bd__text">
          <span className="bd__text-lead">{bloom.summary}</span>
          {bloom.descLines
            ? bloom.descLines.map((line) => (
                <span key={line.text} className="bd__text-line" style={{ letterSpacing: line.tracking }}>
                  {line.text}
                </span>
              ))
            : bloom.desc}
        </p>
      </section>

      <section className="bd__section bd__section--composition">
        <h3 className="bd__heading">Composition</h3>
        <ul ref={thumbsRef} className="bd__thumbs">
          {plants.map((plant) => (
            <PlantThumb
              key={plant.name}
              plant={plant}
              onOpen={plant.detail ? () => setDetailPlant(plant) : undefined}
            />
          ))}
        </ul>
      </section>

      {/* 구매처(대체한 식물은 바꾼 식물로) · 연출 소재 · 관리 정보 — 완성 화면은 지금 확정한 구성·인상 다듬기 기준 */}
      {isComplete ? (
        <BloomInfo
          bouquetKey={active.key}
          resultKey={stylingKey}
          recipe={base.recipe}
          swaps={base.swaps}
          decor={appliedTune?.decor}
          form={appliedTune?.form}
        />
      ) : (
        <BloomInfo
          bouquetKey={base.id}
          resultKey={base.result}
          recipe={base.recipe}
          swaps={base.swaps}
          decor={base.decor}
          form={base.form}
        />
      )}

      {isComplete && (
        // 실제 제작 준비(구매처·대체 소재)를 마친 완성 구성 → Bloom Card로 저장
        <button type="button" className="bd__next" onClick={() => leave('/saved', { state: location.state })}>
          Bloom Card로 저장하기
        </button>
      )}

      {detailPlant && <PlantDetail plant={detailPlant} onClose={() => setDetailPlant(null)} />}
      {toast && (
        <p className="bd-toast" role="status">
          {toast}
        </p>
      )}
    </div>
  )
}

export default BloomDetails
