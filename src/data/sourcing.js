import { useSyncExternalStore } from 'react'
import { PLANTS, isExcludedPlant, lastingRank } from './plants'

// Make This Bloom: 실제 제작에 필요한 소재를 어디서 구할 수 있는지 연결 (Quiet Bloom은 판매·결제하지 않음)
// TODO: 실제 재고·구매처 데이터 연동 전까지 쓰는 예시 데이터

// 구매처 (실제 꽃시장 이름 + 찾아볼 수 있는 링크)
const SHOPS = [
  { name: '양재 꽃시장', note: '서울 서초구 · 새벽 도매', url: 'https://map.naver.com/p/search/%EC%96%91%EC%9E%AC%20%EA%BD%83%EC%8B%9C%EC%9E%A5' },
  { name: '고속터미널 꽃시장', note: '서울 서초구 · 경부선 3층', url: 'https://map.naver.com/p/search/%EA%B3%A0%EC%86%8D%ED%84%B0%EB%AF%B8%EB%84%90%20%EA%BD%83%EC%8B%9C%EC%9E%A5' },
  { name: '온라인 꽃 도매몰', note: '택배 · 1~2일', search: true },
]

// 네이버 모바일 통합검색의 쇼핑 묶음(#shp_lis_root)으로 바로 — 열자마자 상품 목록이 맨 위
// (네이버 쇼핑 페이지는 외부 링크로 들어오면 접속 제한·보안 확인이 떠서 쓰지 않음)
const onlineUrl = (name) => `https://m.search.naver.com/search.naver?query=${encodeURIComponent(`${name} 생화`)}#shp_lis_root`

// 시연용: 부케마다 이번 주 구하기 어려운 소재 하나
const SOLD_OUT = {
  still: '살랄',
  grove: '하이포에스테스',
  sway: '홍가시',
  lush: '드라세나',
  hush: '이오난사',
  ember: '엽란',
  glade: '보스턴펀',
  ramble: '레몬버베나',
}

export const isSoldOut = (bouquetKey, name) => SOLD_OUT[bouquetKey] === name

// 구매처 추천 (시연용 가상 재고 — 실제 재고 아님)
// 한 곳에서 최대한 많이 살 수 있도록 구매처마다 구할 수 있는 식물 수를 비교
export const STORES = [
  { key: 'yangjae', name: '양재 꽃시장', note: '서울 서초구 · 새벽 도매', url: SHOPS[0].url },
  { key: 'terminal', name: '고속터미널 꽃시장', note: '서울 서초구 · 경부선 3층', url: SHOPS[1].url },
  { key: 'online', name: '온라인 꽃 도매몰', note: '택배 · 1~2일', url: null },
]

// 부케 기본 구성 중 구매처별로 구하기 어려운 식물: 양재 1종 · 고터 2종 · 온라인 3종
// (양재에서 어려운 1종 = 이번 주 품절 소재)
function storeMisses(storeKey, bouquetKey, recipeNames) {
  const soldOut = SOLD_OUT[bouquetKey]
  const others = recipeNames.filter((name) => name !== soldOut)
  if (storeKey === 'yangjae') return [soldOut]
  if (storeKey === 'terminal') return [soldOut, others[1]]
  return [soldOut, others[0], others[2]]
}

// 기본 구성에 없는 식물(대체 후보)은 이름으로 정해지는 가상 재고 — 양재는 모두, 다른 곳은 약 3/4
const hashOf = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)

// recipeNames: 이 부케의 기본 구성 식물 이름
export function isAvailableAt(storeKey, bouquetKey, name, recipeNames) {
  if (recipeNames.includes(name)) return !storeMisses(storeKey, bouquetKey, recipeNames).includes(name)
  if (storeKey === 'yangjae') return true
  return hashOf(`${storeKey}:${name}`) % 4 !== 0
}

// 구매처 추천 순위: 구매 가능 식물이 많은 순 (같으면 STORES 순서)
// names: 지금 구성(대체한 식물 포함) → [{ store, available: [이름], missing: [이름] }]
export function rankStores(bouquetKey, names, recipeNames) {
  return STORES.map((store) => {
    const available = names.filter((name) => isAvailableAt(store.key, bouquetKey, name, recipeNames))
    return { store, available, missing: names.filter((name) => !available.includes(name)) }
  }).sort((a, b) => b.available.length - a.available.length)
}

// 구매처의 식물 링크: 꽃시장은 지도, 온라인은 그 식물 쇼핑 검색
export const storeUrl = (store, name) => store.url ?? onlineUrl(name)

// 소재별 구매처 목록 (품절 소재는 모든 곳이 품절)
export function shopsFor(bouquetKey, name) {
  const soldOut = isSoldOut(bouquetKey, name)
  return SHOPS.map((shop) => ({
    ...shop,
    url: shop.search ? onlineUrl(name) : shop.url,
    soldOut,
  }))
}

// 대체 소재 추천: Quiet Bloom 식물 데이터 기준
// 1) 같은 조형 역할(카테고리)  2) 민감도 조건 유지(저자극·저향)  3) 제외 식물 빼기
// 4) 유지력 비슷 · 가격대 비슷한 순으로 2개
// store: 고른 구매처 { store, recipeNames } — 있으면 그곳에서 구할 수 있는 소재만
export function findSubstitutes(name, { profile, cartNames, bouquetKey, store }) {
  const original = PLANTS.find((p) => p.name === name)
  if (!original) return []
  const rank = lastingRank(name)
  const sensitivity =
    profile.lowIrritant && profile.lowScent ? '저자극·저향' : profile.lowIrritant ? '저자극' : profile.lowScent ? '저향' : null

  return PLANTS.filter(
    (p) =>
      p.category === original.category &&
      p.name !== name &&
      !cartNames.includes(p.name) &&
      !isSoldOut(bouquetKey, p.name) &&
      (!store || isAvailableAt(store.store.key, bouquetKey, p.name, store.recipeNames)) &&
      !(profile.lowIrritant && p.lowIrritant === false) &&
      !(profile.lowScent && p.scent === 'high') &&
      !isExcludedPlant(p.name, profile.excludedPlants),
  )
    .map((p) => {
      const lastingGap = Math.abs(lastingRank(p.name) - rank)
      const priceGap = Math.abs(p.price - original.price) / original.price
      return { plant: p, lastingGap, priceGap, score: lastingGap / 10 + priceGap }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(({ plant, lastingGap, priceGap }) => ({
      plant,
      reasons: [
        `같은 ${categoryTitle(plant.category)} 역할`,
        sensitivity ? `${sensitivity} 조건 충족` : '민감도 조건 충족',
        lastingGap <= 3 ? '유지력 비슷' : priceGap <= 0.3 ? '가격대 비슷' : '대체 가능',
        ...(store ? [`${store.store.name}에서 구매 가능`] : []),
      ],
    }))
}

const categoryTitle = (key) => key[0].toUpperCase() + key.slice(1)

// 다 만든 부케(저장한 부케): 품절 소재는 제작 준비에서 이미 바꿨어야 완성할 수 있으므로
// 남아 있는 품절 소재를 첫 번째 대체 소재로 바꾼 구성 — recipe: [[name, qty]] → { recipe, swaps: { 새 소재: 원래 소재 } }
export function settleSoldOut(bouquetKey, recipe, profile) {
  const names = recipe.map(([name]) => name)
  const swapped = {}
  const next = recipe.map(([name, qty]) => {
    if (!isSoldOut(bouquetKey, name)) return [name, qty]
    const sub = findSubstitutes(name, { profile, cartNames: names, bouquetKey })[0]?.plant
    if (!sub) return [name, qty]
    swapped[sub.name] = name
    names.push(sub.name)
    return [sub.name, qty]
  })
  return { recipe: next, swaps: swapped }
}

// 이번 제작에서 바꾼 소재 { 새 소재: 원래 소재 } — 목록에 '대체됨' 표시
let swaps = {}
const listeners = new Set()

export function recordSwap(from, to) {
  // 이미 바꾼 소재를 다시 바꾸면 처음 소재를 기억
  const origin = swaps[from] ?? from
  const next = { ...swaps }
  delete next[from]
  next[to] = origin
  swaps = next
  listeners.forEach((listener) => listener())
}

export function clearSwaps() {
  swaps = {}
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSwaps() {
  return useSyncExternalStore(subscribe, () => swaps)
}
