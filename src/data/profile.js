import { useSyncExternalStore } from 'react'

// TODO: 사용자 데이터 연동 전까지 사용하는 임시 프로필
// 이 탭 안에서는 새로고침해도 유지 (sessionStorage) — 고른 조건이 기본값(Still)으로 돌아가지 않게
const DEFAULT_PROFILE = {
  name: '이준',
  lowIrritant: true,
  // 향 노출 제어 (on: 저향 우선)
  lowScent: true,
  excludedPlants: ['페퍼민트', '로즈마리'],
  criteria: ['유지력'],
}
const STORE_KEY = 'qb-profile'

function loadProfile() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY))
    return saved ? { ...DEFAULT_PROFILE, ...saved } : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

let profile = loadProfile()

const listeners = new Set()

export const getProfile = () => profile

export function updateProfile(changes) {
  profile = { ...profile, ...changes }
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(profile))
  } catch {
    // 저장이 막힌 환경(사생활 보호 모드 등)에서는 메모리에만
  }
  listeners.forEach((listener) => listener())
}

export function subscribeProfile(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const subscribe = subscribeProfile

export function useProfile() {
  return useSyncExternalStore(subscribe, () => profile)
}

// 조건별 기본 예산(원): 민감도(저자극·저향 조합 4) × 추천 기준(유지력·예산 2)
// Make This Bloom에서 예산 비교 기준으로 씀
const BUDGETS = {
  '유지력|true|true': 100000,
  '유지력|true|false': 30000,
  '유지력|false|true': 40000,
  '유지력|false|false': 20000,
  '예산|true|true': 20000,
  '예산|true|false': 20000,
  '예산|false|true': 20000,
  '예산|false|false': 10000,
}

// Bloom Profile 카드: 따로 유형 이름 없이 조건 그대로 (제목 = 민감도, 배지 = 추천 기준)
// tags: 민감도 + 추천 기준 한 줄 (예: 저자극 · 저향 · 유지력 순)
export function getBloomType({ lowIrritant, lowScent, criteria }) {
  const priority = criteria[0] ?? '유지력'
  const sensitivity = lowIrritant && lowScent ? '저자극 · 저향' : lowIrritant ? '저자극' : lowScent ? '저향' : '무필터'
  return {
    title: sensitivity === '무필터' ? '민감도 제한 없음' : sensitivity,
    badge: `${priority} 순 추천`,
    tags: `${sensitivity} · ${priority} 순`,
    budget: BUDGETS[`${priority}|${!!lowIrritant}|${!!lowScent}`],
  }
}

// Make Quiet Bloom 카드 요약 문구: 현재 조건에서 만들어짐
// (기본 조건 → Figma 2268:17919, 민감도 필터 없음 → 2268:18061 문구와 동일)
export function getProfileSummary({ lowIrritant, lowScent, criteria }) {
  const sensitivity = lowIrritant && lowScent ? '저자극·저향' : lowIrritant ? '저자극' : lowScent ? '저향' : null
  const priority = criteria[0] ?? '예산'

  const description = []
  if (lowIrritant) description.push('저자극 식물을 우선 적용하고,')
  if (lowScent) description.push('향 노출은 낮게 설정하며')
  if (!sensitivity) description.push('민감도 제한 없이 식물을 구성하고,')
  description.push(priority === '유지력' ? '오래 유지되는 식물을 우선 추천해요.' : '예산을 우선 고려해 추천해요.')

  return {
    // 온보딩 Bloom Profile 카드와 같은 제목·배지 (예: 저자극 · 저향 / 유지력 순 추천)
    title: getBloomType({ lowIrritant, lowScent, criteria }).title,
    badge: getBloomType({ lowIrritant, lowScent, criteria }).badge,
    description,
  }
}

// Bloom Profile 카드 아래 두 줄 (온보딩 결과 카드 · Make Quiet Bloom 카드 공용)
// 민감도: '저자극 · 저향' / 고른 게 없으면 '없음'
export const sensitivityText = (lowIrritant, lowScent) =>
  [lowIrritant && '저자극', lowScent && '저향'].filter(Boolean).join(' · ') || '없음'

// 제외 식물: 카드 한 줄(값 자리 약 한글 11자)에 들어가는 만큼만 이름 — 두 개까지, 더 많으면 '외 N종' (안 들어가면 하나만)
const textWidth = (text) =>
  [...text].reduce((sum, ch) => sum + (/[가-힣]/.test(ch) ? 1 : /[\s·]/.test(ch) ? 0.4 : 0.6), 0)

export function excludedPlantsText(plants) {
  if (plants.length === 0) return '없음'
  for (let count = Math.min(2, plants.length); count >= 1; count--) {
    const rest = plants.length - count
    const text = plants.slice(0, count).join(' · ') + (rest ? ` 외 ${rest}종` : '')
    if (count === 1 || textWidth(text) <= 11) return text
  }
}

