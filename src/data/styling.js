import { findResult } from './bouquets'
import { PLANTS } from './plants'

// 총 제작비 = 식물 + 연출 소재 — 완성 · 실제 제작 · 저장한 부케 상세 모두 이 기준
// items: [{ name, qty }] / styling: stylingFor() 결과
export function costOf(items, styling) {
  const plants = items.reduce((sum, { name, qty }) => sum + (PLANTS.find((p) => p.name === name)?.price ?? 0) * qty, 0)
  const extra = styling.reduce((sum, s) => sum + s.price, 0)
  return { plants, styling: extra, total: plants + extra }
}

// 연출 소재: AI Preview에서 고른 연출(화병 · 행잉 · 다발 포장)과 장식(진주 · 큐빅 · 레이스)을
// 실제로 만들 때 필요한 물건으로 — 식물처럼 구할 수 있는 곳을 연결 (Quiet Bloom은 판매하지 않음)
// TODO: 실제 상품·가격 데이터 연동 전까지 쓰는 예시 값
// shop: 네이버 검색 결과 안 쇼핑 묶음 이름표 — 검색어마다 묶음 종류가 달라 따로 지정 (lis: 상품 목록 / tli: 인기상품)
const ITEMS = {
  vase: { name: '유리 화병', note: '입구가 좁은 투명 화병', price: 8000, query: '유리 화병 꽃', shop: 'shp_lis_root' },
  hanging: { name: '행잉 바구니', note: '마크라메 행거 + 작은 화분', price: 13000, query: '마크라메 행잉 화분', shop: 'shp_lis_root' },
  wrap: { name: '다발 포장지', note: '포장지 + 리본 끈', price: 3000, query: '꽃다발 포장지', shop: 'shp_tli_root' },
  pearl: { name: '진주 장식', note: '진주 스티커', price: 1000, query: '진주 스티커', shop: 'shp_tli_root' },
  cubic: { name: '큐빅 장식', note: '꽃 핀 · 큐빅 와이어', price: 2000, query: '꽃 큐빅 핀', shop: 'shp_lis_root' },
  lace: { name: '레이스 리본', note: '폭 2~3cm 레이스', price: 1500, query: '레이스 리본', shop: 'shp_tli_root' },
}

// 장식 3가지 (인상 다듬기에서 여러 개 고름) — 요청 문장에 그 말이 있으면 처음부터 들어간 장식
export const DECOR = [
  { key: 'pearl', label: '진주 포인트', word: '진주' },
  { key: 'cubic', label: '큐빅 포인트', word: '큐빅' },
  { key: 'lace', label: '레이스 포인트', word: '레이스' },
]

// AI 결과에 이미 들어간 장식 (요청 문장 기준)
// 결과에 decor가 정해져 있으면 그대로 (예: 행잉은 첫 요청의 진주를 이어받음 — 문장엔 없어도 사진엔 진주)
export function decorOf(resultKey) {
  const result = findResult(resultKey)
  if (result?.decor) return result.decor
  const words = result?.demo.join(' ') ?? ''
  return DECOR.filter((d) => words.includes(d.word)).map((d) => d.key)
}

// 연출 3가지 (인상 다듬기에서 고름) — 결과 키 끝(still-vase → vase)과 같은 이름
export const FORMS = [
  { key: 'wrap', label: '다발' },
  { key: 'vase', label: '화병' },
  { key: 'hanging', label: '행잉' },
]

export const formOf = (resultKey) => (resultKey ? resultKey.split('-').pop() : null)

// 결과 키(예: still-vase, ember-wrap) · 인상 다듬기에서 고른 장식(없으면 결과 그대로) · 고른 연출 → 필요한 연출 소재 목록
export function stylingFor(resultKey, tuneDecor, tuneForm) {
  if (!findResult(resultKey)) return []
  const keys = []
  const kind = tuneForm ?? formOf(resultKey)
  if (ITEMS[kind]) keys.push(kind)
  keys.push(...(tuneDecor ?? decorOf(resultKey)))
  return keys.map((key) => ({
    key,
    ...ITEMS[key],
    // 네이버 모바일 통합검색의 쇼핑 묶음으로 바로 — 열자마자 상품 목록이 맨 위
    // (네이버 쇼핑 페이지는 외부 링크로 들어오면 접속 제한·보안 확인이 떠서 쓰지 않음)
    url: `https://m.search.naver.com/search.naver?query=${encodeURIComponent(ITEMS[key].query)}#${ITEMS[key].shop}`,
  }))
}
