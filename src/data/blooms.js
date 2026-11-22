import { useSyncExternalStore } from 'react'
import { BOUQUETS, bouquetPrice, findBouquet } from './bouquets'
import { planTune } from './tune'

// TODO: 부케 저장 기능 연동 전까지 쓰는 예시 데이터 — 부케를 하나 만들었다고 보고 부케 유형 6가지를 모두 보여줌
// card: My Blooms 카드(268×397) 안 사진 배치 [너비, 높이, 왼쪽, 위] %
// hero: 상세 화면 위쪽 사진 · heroShade: 그 위 그라데이션 (bouquets.js와 같은 형식)

// 부케 유형 데이터(bouquets.js)에서 이름·설명·구성·금액과 '최종본' 사진을 가져옴
// 최종본 = 결과 목록의 마지막 (인상 다듬기까지 마친 모습: Still 행잉 · Lush 운룡버들 2대 · Grove 정돈 · Sway 장식 없음)
// 그 결과가 인상 다듬기 전용(tune)이면 구성·장식도 다듬은 대로 (예: Grove 팔손이·필리카 빠짐, Sway 장식 없음)
const fromBouquet = (key) => {
  const b = findBouquet(key)
  const result = b.results[b.results.length - 1]
  const { decor, ...axes } = result.tune ?? {}
  const recipe = result.tune
    ? planTune(
        b.recipe.map(([name, qty]) => ({ name, qty })),
        { volume: 0, height: 0, order: 0, ...axes },
      )
        .next.filter(({ qty }) => qty > 0)
        .map(({ name, qty }) => [name, qty])
    : b.recipe
  return {
    id: b.key,
    name: b.name,
    tags: b.tags,
    criteria: b.when.criteria,
    lasting: b.lasting,
    water: b.water,
    price: bouquetPrice({ ...b, recipe }),
    summary: b.summary,
    desc: b.desc,
    plants: recipe.map(([name]) => name),
    recipe,
    // 카드 사진은 이미 카드 비율(276×408)로 잘려 있어 꽉 채워 넣음
    // AI Preview 결과 키 — 연출 소재(화기·행잉·포장·장식) 목록에 씀 (decor: 다듬어서 바꾼 장식, 없으면 결과 그대로)
    result: result.key,
    decor,
    image: result.card,
    card: [100, 100, 0, 0],
    hero: result.hero,
    heroShade: result.heroShade,
  }
}

// 순서대로 이어서 넘어감 (끝에서 처음으로) — 처음엔 Still이 가운데
export const SAVED_BLOOMS = [fromBouquet('still'), ...BOUQUETS.filter((b) => b.key !== 'still').map((b) => fromBouquet(b.key))]

export const findBloom = (id) => SAVED_BLOOMS.find((bloom) => bloom.id === id)

// 이번에 만든 부케 (카드 출력까지 마치면 저장) — 홈 My Blooms 카드가 빈 상태 대신 최근 부케를 보여줌.
// result: AI 프리뷰 결과 키, 프리뷰 없이 완성했으면 null
// plantCount: 쓴 식물 총 개수 (홈 카드 'N Greenary') — 담은 구성이 없으면 레시피 기준
// items: 실제로 쓴 구성 (대체 식물로 바꾼 것 포함) · decor·form: 인상 다듬기에서 고른 장식·연출
// TODO: 사용자 데이터 연동 전까지 이 탭(sessionStorage)에만 저장
const STORAGE_KEY = 'qb-made-bloom'
// 새로고침하면 온보딩부터 다시 시작하므로(onboarding.js) 만든 부케도 비움 → 홈은 "저장한 부케가 없어요"부터
let madeBloom = (() => {
  try {
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? null
  } catch {
    return null
  }
})()
const listeners = new Set()

// swaps: 대체 식물로 바꾼 것 { 바꾼 식물: 원래 식물 } / store: Make This Bloom에서 고른 구매처 키
export function saveMadeBloom(bouquet, result, items, tune, swaps, store) {
  const list = items?.length
    ? items.map(({ name, qty }) => ({ name, qty }))
    : bouquet.recipe.map(([name, qty]) => ({ name, qty }))
  const plantCount = list.reduce((sum, { qty }) => sum + qty, 0)
  madeBloom = {
    name: bouquet.name,
    bouquet: bouquet.key,
    result: result ?? null,
    plantCount,
    items: list,
    decor: tune?.decor,
    form: tune?.form,
    swaps: swaps ?? {},
    store: store ?? null,
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(madeBloom))
  } catch {
    // 저장 공간을 못 쓰면 메모리에만
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMadeBloom() {
  return useSyncExternalStore(subscribe, () => madeBloom)
}

// 부케 이름 바꾸기 (Bloom Complete · Bloom Details의 연필 버튼) — 부케 유형(id)마다 하나
// 바꾼 이름은 Bloom Card · My Blooms · 홈 카드에 같이 쓰임. 비우면 원래 이름(Still 등)으로
// TODO: 사용자 데이터 연동 전까지 이 탭(sessionStorage)에만 저장 — 새로고침하면 처음 이름으로
const NAMES_KEY = 'qb-bloom-names'
let bloomNames = (() => {
  try {
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
      sessionStorage.removeItem(NAMES_KEY)
      return {}
    }
    return JSON.parse(sessionStorage.getItem(NAMES_KEY)) ?? {}
  } catch {
    return {}
  }
})()
const nameListeners = new Set()

export function setBloomName(id, name) {
  const next = { ...bloomNames }
  const trimmed = name.trim()
  if (trimmed) next[id] = trimmed
  else delete next[id]
  bloomNames = next
  try {
    sessionStorage.setItem(NAMES_KEY, JSON.stringify(bloomNames))
  } catch {
    // 저장 공간을 못 쓰면 메모리에만
  }
  nameListeners.forEach((listener) => listener())
}

// 바꾼 이름이 있으면 그 이름, 없으면 원래 이름
export const bloomNameOf = (id, fallback) => bloomNames[id] ?? fallback

export function useBloomNames() {
  return useSyncExternalStore(
    (listener) => {
      nameListeners.add(listener)
      return () => nameListeners.delete(listener)
    },
    () => bloomNames,
  )
}
