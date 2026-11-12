import { useSyncExternalStore } from 'react'
import { PLANTS } from './plants'
import { getProfile } from './profile'
import stillPreview from '../assets/preview/bouquet.png'
import stillVase from '../assets/result/still-vase.jpg'
import stillHanging from '../assets/result/still-hanging.jpg'
import groovePreview from '../assets/bouquets/grove-preview.png'
import groveResult from '../assets/bouquets/grove-result.jpg'
import ramblePreview from '../assets/bouquets/ramble-preview.png'
import rambleResult from '../assets/bouquets/ramble-result.jpg'
import rambleHero from '../assets/bouquets/ramble-hero.jpg'
import hushPreview from '../assets/bouquets/hush-preview.png'
import hushResult from '../assets/bouquets/hush-result.jpg'
import emberPreview from '../assets/bouquets/ember-preview.png'
import emberResult from '../assets/bouquets/ember-result.jpg'
// 카드 앞면 사진 (Figma 부케별 Print Complete 화면의 카드 구도 그대로 276×408 비율로 잘라둠)
import stillCard from '../assets/cards/still-card.jpg'
import groveCard from '../assets/cards/grove-card.jpg'
import rambleCard from '../assets/cards/ramble-card.jpg'
import hushCard from '../assets/cards/hush-card.jpg'
import emberCard from '../assets/cards/ember-card.jpg'
import gladeCard from '../assets/cards/glade-card.jpg'
import swayCard from '../assets/cards/sway-card.jpg'
import lushCard from '../assets/cards/lush-card.jpg'
import gladePreview from '../assets/bouquets/glade-preview.png'
import gladeResult from '../assets/bouquets/glade-result.jpg'
import swayPreview from '../assets/bouquets/sway-preview.png'
import swayResult from '../assets/bouquets/sway-result.jpg'
import lushPreview from '../assets/bouquets/lush-preview.png'
import lushResult from '../assets/bouquets/lush-result.jpg'
// 홈 My Blooms 카드용 누끼 (배경 없이 부케만)
import groveCutout from '../assets/main/grove-cutout.png'
import rambleCutout from '../assets/main/ramble-cutout.png'
import hushCutout from '../assets/main/hush-cutout.png'
import emberCutout from '../assets/main/ember-cutout.png'
import gladeCutout from '../assets/main/glade-cutout.png'
import swayCutout from '../assets/main/sway-cutout.png'
import lushCutout from '../assets/main/lush-cutout.png'

// 부케 유형: 온보딩·조건 수정에서 정한 최종 조건(추천 기준 + 저자극 + 저향)에 따라 하나가 정해짐.
// 부케 구성 화면은 이 유형의 레시피대로 담도록 안내하고, 프리뷰·완성·카드도 이 유형의 사진을 씀.
//
// when: 조건 { criteria: '유지력' | '예산', lowIrritant, lowScent }
// recipe: 구성 [식물 이름, 수량] (단계 순서는 plants.js 카테고리를 따름)
// preview: 부케 사진과 프리뷰 화면 속 자리 { image, box: [너비, 높이, 가운데 기준 x, top], listen: 입력 중 크기 [너비, 높이, top], crop: 상자 안 사진 [너비%, 높이%, 왼쪽%, 위%] }
// results: AI 프리뷰 결과(요청 순서대로)
//   size·pos: 사진 크기와 위치(가운데 기준 x, top) · bg: 바탕색
//   shade: 위쪽 그라데이션 [높이, 색, 맨 위 진하기, 진하게 유지되는 구간(기본 0%)] · fade: 아래 그라데이션 [높이, 아래로 넘친 길이, 색, 진하기, 진해지는 지점]
//   demo: 음성 인식 대신 쓰는 예시 문장(단어) · label: 홈 카드에 보일 이름
//   hero: 완성 화면 위 사진 { image, size, top, x } · heroShade: 그 위 그라데이션 (shade와 같은 형식) · card: 카드 앞면 사진

export const BOUQUETS = [
  {
    key: 'still',
    when: { criteria: '유지력', lowIrritant: true, lowScent: true },
    name: 'Still',
    tags: '저자극 · 저향',
    lasting: '20 days',
    water: '2~3일 교체',
    summary: '향과 자극 부담은 낮추고, 오래 감상할 수 있도록 구성했어요.',
    desc: '연밥으로 단단한 구조를 잡고 살랄로 볼륨을 채웠어요. 대나무로 곧은 흐름을 더하고 세로그라피카로 은은한 질감을 살렸어요.',
    recipe: [
      ['연밥', 7],
      ['살랄', 1],
      ['대나무', 3],
      ['세로그라피카', 1],
    ],
    // Figma 2845:25478 / 말하는 중 2845:24527
    preview: { image: stillPreview, box: [234, 417, 10, 214], listen: [209, 372, 221] },
    results: [
      {
        key: 'still-vase',
        label: 'Vase Preview',
        image: stillVase,
        size: [679, 940],
        pos: [-0.5, -85],
        bg: '#aab08a',
        shade: null,
        fade: [294, 0, '155, 149, 140', 0.6, '66.876%'],
        demo: ['진주로', '꾸며서', '화병에', '꽂아줘'],
        hero: { image: stillVase, size: [541, 749], top: -190 },
        heroShade: [220, '97, 88, 80', 0.52],
        card: stillVase,
      },
      {
        key: 'still-hanging',
        label: 'Hanging Preview',
        image: stillHanging,
        size: [683, 911],
        pos: [-0.5, -46],
        bg: '#fff',
        shade: [229, '97, 88, 80', 0.52],
        fade: [263, 89, '97, 88, 80', 0.8, '74.241%'],
        demo: ['벽에', '걸', '수', '있는', '스타일로', '보여줘'],
        // 첫 요청(진주로 꾸며서)의 진주를 이어받은 사진 — 연출 소재에 진주 장식 포함
        decor: ['pearl'],
        hero: { image: stillHanging, size: [517, 690], top: -76.49 },
        heroShade: [220, '97, 88, 80', 0.52],
        card: stillCard,
      },
    ],
  },

  // 유지력 + 저자극 (Figma 2845:25557 줄) — 곧게 선 대나무 숲 같은 부케
  {
    key: 'grove',
    when: { criteria: '유지력', lowIrritant: true, lowScent: false },
    name: 'Grove',
    tags: '저자극',
    lasting: '21 days',
    water: '3~4일 교체',
    summary: '자극 부담은 낮추고, 오래 감상할 수 있도록 구성했어요.',
    desc: '대나무로 곧게 선 흐름을 세우고 스틸그라스로 부드러운 곡선을 그렸어요. 하이포에스테스로 은은한 색감을 더하고 트리펀으로 풍성한 볼륨을 채웠어요.',
    recipe: [
      ['대나무', 5],
      ['스틸그라스', 7],
      ['하이포에스테스', 2],
      ['트리펀', 3],
    ],
    preview: { image: groovePreview, box: [278, 396, 30, 224], listen: [262, 372, 224], crop: [105.25, 106.17, -5.21, -0.71] },
    results: [
      {
        key: 'grove-wrap',
        label: 'Wrap Preview',
        image: groveResult,
        size: [753, 1158],
        pos: [-0.5, -187],
        bg: '#aab08a',
        shade: [229, '98, 98, 89', 0.41],
        fade: [220, 0, '98, 98, 89', 0.9, '95.981%'],
        demo: ['진주랑', '큐빅으로', '꾸며서', '다발로', '묶어줘'],
        hero: { image: groveResult, size: [421, 647], top: -102.49, x: -0.5 },
        heroShade: [229, '98, 98, 89', 0.5],
        card: groveCard,
        cutout: groveCutout,
      },
    ],
  },

  // 예산 + 무필터 (Figma 2845:25479 줄) — 덩굴이 자유롭게 흘러내리는 부케
  {
    key: 'ramble',
    when: { criteria: '예산', lowIrritant: false, lowScent: false },
    name: 'Ramble',
    tags: '무필터',
    lasting: '12 days',
    water: '1~2일 교체',
    summary: '민감도 제한 없이, 부담 없는 가격으로 풍성하게 구성했어요.',
    desc: '칼라디움의 무늬진 잎으로 중심을 잡고 아이비 덩굴로 자유롭게 흘러내리는 선을 더했어요. 레몬버베나로 산뜻한 볼륨을 채우고 나선골풀로 감기는 질감을 살렸어요.',
    recipe: [
      ['칼라디움', 3],
      ['아이비', 2],
      ['나선골풀', 2],
      ['레몬버베나', 1],
    ],
    preview: { image: ramblePreview, box: [358, 392, 0, 226], listen: [335, 367, 229] },
    results: [
      {
        key: 'ramble-vase',
        label: 'Vase Preview',
        image: rambleResult,
        size: [632, 949],
        pos: [0, -105],
        bg: '#bcb4ac',
        shade: [294, '188, 180, 172', 1, '18.663%'],
        fade: [263, 89, '188, 180, 172', 1, '81.337%'],
        demo: ['레이스랑', '진주로', '꾸며서', '화병에', '꽂아줘'],
        hero: { image: rambleHero, size: [417, 521], top: -30.49, x: -0.5 },
        heroShade: [212, '188, 180, 172', 1],
        card: rambleCard,
        cutout: rambleCutout,
      },
    ],
  },

  // 예산 + 저자극 + 저향 (Figma 2845:25505 줄) — 연잎 사이로 틸란드시아가 떠오른 조용한 부케
  {
    key: 'hush',
    when: { criteria: '예산', lowIrritant: true, lowScent: true },
    name: 'Hush',
    tags: '저자극 · 저향',
    lasting: '10 days',
    water: '매일 교체',
    summary: '향과 자극 부담은 낮추고, 예산에 맞춰 가볍게 구성했어요.',
    desc: '연잎으로 넓은 구조를 잡고 살랄로 단정한 볼륨을 더했어요. 시페루스로 가볍게 퍼지는 선을 그리고 이오난사로 연못 위에 피어난 듯한 질감을 살렸어요.',
    recipe: [
      ['연잎', 5],
      ['살랄', 1],
      ['이오난사', 1],
      ['시페루스', 2],
    ],
    preview: { image: hushPreview, box: [302, 396, 0, 224], listen: [277, 362, 234], crop: [101.48, 104.23, 0, -2.25] },
    results: [
      {
        key: 'hush-vase',
        label: 'Vase Preview',
        image: hushResult,
        size: [719, 873],
        pos: [-20.5, -71],
        bg: '#e9dbc9',
        shade: [229, '97, 88, 80', 0.42],
        fade: [420, 198, '97, 88, 80', 1, '74.241%'],
        demo: ['레이스랑', '진주로', '꾸며서', '화병에', '꽂아줘'],
        hero: { image: hushResult, size: [423, 513], top: -55.49, x: -16.5 },
        heroShade: [229, '97, 88, 80', 0.43],
        card: hushCard,
        cutout: hushCutout,
      },
    ],
  },

  // 예산 + 저자극 (Figma 2845:25531 줄) — 붉은 잎이 타오르는 듯한 부케
  {
    key: 'ember',
    when: { criteria: '예산', lowIrritant: true, lowScent: false },
    name: 'Ember',
    tags: '저자극',
    lasting: '14 days',
    water: '2~3일 교체',
    summary: '자극 부담은 낮추고, 예산에 맞춰 선명하게 구성했어요.',
    desc: '엽란의 짙은 잎으로 뒤를 받치고 홍가시의 붉은 잎으로 중심을 채웠어요. 스틸그라스로 가볍게 퍼지는 선을 더하고 나선골풀로 감기는 질감을 살렸어요.',
    // 스틸그라스는 사진 속 양이 1단쯤이라 20줄기로 잡음
    recipe: [
      ['홍가시', 5],
      ['스틸그라스', 20],
      ['엽란', 2],
      ['나선골풀', 2],
    ],
    preview: { image: emberPreview, box: [297, 396, -0.5, 224], listen: [279, 372, 224] },
    results: [
      {
        key: 'ember-wrap',
        label: 'Wrap Preview',
        image: emberResult,
        size: [633, 844],
        pos: [-0.5, 0],
        bg: '#62625a',
        shade: [229, '98, 98, 89', 0.5],
        fade: [220, 0, '98, 98, 89', 0.9, '95.981%'],
        demo: ['진주랑', '큐빅으로', '꾸며서', '다발로', '묶어줘'],
        hero: { image: emberResult, size: [391, 521], top: -32.49, x: 0.5 },
        heroShade: [229, '98, 98, 89', 0.5],
        card: emberCard,
        cutout: emberCutout,
      },
    ],
  },

  // 예산 + 저향 (Figma 2849:27121 줄) — 그늘진 숲 바닥처럼 넓은 잎과 고사리가 어우러진 부케
  {
    key: 'glade',
    when: { criteria: '예산', lowIrritant: false, lowScent: true },
    name: 'Glade',
    tags: '저향',
    lasting: '12 days',
    water: '2~3일 교체',
    summary: '향 부담은 낮추고, 예산에 맞춰 싱그럽게 구성했어요.',
    desc: '아스플레니움의 물결치는 잎으로 구조를 세우고 호스타의 넓은 잎으로 볼륨을 채웠어요. 스틸그라스로 둥글게 감기는 선을 그리고 보스턴펀으로 가벼운 결을 더했어요.',
    recipe: [
      ['아스플레니움', 2],
      ['호스타', 4],
      ['스틸그라스', 6],
      ['보스턴펀', 1],
    ],
    preview: { image: gladePreview, box: [196, 396, 0, 224], listen: [184, 372, 224], crop: [137.76, 102.02, -21.94, -0.76] },
    results: [
      {
        key: 'glade-vase',
        label: 'Vase Preview',
        image: gladeResult,
        size: [813, 1084],
        pos: [-0.5, -145],
        bg: '#aab08a',
        shade: [229, '98, 98, 89', 0.41],
        fade: [220, 0, '98, 98, 89', 0.9, '95.981%'],
        demo: ['진주랑', '큐빅으로', '꾸며서', '다발로', '묶어줘'],
        hero: { image: gladeResult, size: [448, 598], top: -70 },
        heroShade: [274, '98, 98, 89', 0.6],
        card: gladeCard,
        cutout: gladeCutout,
      },
    ],
  },

  // 유지력 + 저향 (Figma 2860:39731 줄) — 파인애플 위로 틸란드시아가 늘어져 흔들리는 행잉 부케
  {
    key: 'sway',
    when: { criteria: '유지력', lowIrritant: false, lowScent: true },
    name: 'Sway',
    tags: '저향',
    lasting: '18 days',
    water: '3~4일 교체',
    summary: '향 부담은 낮추고, 오래 감상할 수 있도록 구성했어요.',
    desc: '파인애플로 시선을 모으는 중심을 세우고 홍가시의 붉은 잎으로 색을 더했어요. 베어그라스로 둥글게 감기는 선을 그리고 수염틸란드시아를 늘어뜨려 흔들리는 결을 살렸어요.',
    // 베어그라스 한 단 = 20줄기로 잡음 (Ember 스틸그라스와 같게)
    recipe: [
      ['파인애플', 2],
      ['홍가시', 2],
      ['베어그라스', 20],
      ['수염틸란드시아', 1],
    ],
    preview: { image: swayPreview, box: [274, 419, 0, 224], listen: [243, 372, 224], crop: [141.98, 101.58, -22.78, -0.03] },
    results: [
      {
        key: 'sway-hanging',
        label: 'Hanging Preview',
        image: swayResult,
        size: [660, 1147],
        pos: [0, -111],
        bg: '#d8d0c4',
        shade: [229, '98, 98, 89', 0.41],
        fade: [220, 0, '98, 98, 89', 0.9, '95.981%'],
        demo: ['진주랑', '큐빅으로', '꾸며서', '다발로', '묶어줘'],
        hero: { image: swayResult, size: [419, 727], top: -98, x: -0.5 },
        heroShade: [274, '98, 98, 89', 0.6],
        card: swayCard,
        cutout: swayCutout,
      },
    ],
  },

  // 유지력 + 무필터 (Figma 2881:3678 줄) — 무늬 잎과 붉은 베고니아가 어우러진 화려한 부케
  {
    key: 'lush',
    when: { criteria: '유지력', lowIrritant: false, lowScent: false },
    name: 'Lush',
    tags: '무필터',
    lasting: '16 days',
    water: '2~3일 교체',
    summary: '민감도 제한 없이, 오래 감상할 수 있도록 풍성하게 구성했어요.',
    desc: '자비타의 무늬진 잎과 드라세나로 구조를 잡고 렉스 베고니아로 선명한 색을 더했어요. 운룡버들로 동그랗게 말린 곡선을 높이 세워 화려한 분위기를 냈어요.',
    recipe: [
      ['드라세나', 1],
      ['자비타', 2],
      ['운룡버들', 2],
      ['렉스 베고니아', 2],
    ],
    preview: { image: lushPreview, box: [314, 419, 0, 224], listen: [279, 372, 224] },
    results: [
      {
        key: 'lush-wrap',
        label: 'Wrap Preview',
        image: lushResult,
        size: [563, 844],
        pos: [-23.5, 0],
        bg: '#62625a',
        shade: [229, '98, 98, 89', 0.41],
        fade: [220, 0, '98, 98, 89', 0.9, '95.981%'],
        demo: ['레이스로', '꾸며서', '다발로', '묶어줘'],
        hero: { image: lushResult, size: [390, 584], top: -50 },
        heroShade: [274, '98, 98, 89', 0.6],
        card: lushCard,
        cutout: lushCutout,
      },
    ],
  },
]

// 레시피 합계 금액 (plants.js 단가 기준)
export const priceOf = (recipe) =>
  recipe.reduce((sum, [name, qty]) => sum + (PLANTS.find((p) => p.name === name)?.price ?? 0) * qty, 0)

// 상세·완성 화면에 보일 금액: Figma 상세 화면에 정한 금액이 있으면 그 값, 없으면 레시피 합계
// TODO: 레시피 합계와 다름 (Grove 27,600 · Ember 15,700 · Glade 15,400 · Sway 36,000) — 확정되면 정리
const DETAIL_PRICE = { grove: 24600, ember: 9900, glade: 13800, sway: 31200 }
export const bouquetPrice = (bouquet) => DETAIL_PRICE[bouquet.key] ?? priceOf(bouquet.recipe)

const keyOf = ({ criteria, lowIrritant, lowScent }) => `${criteria}|${!!lowIrritant}|${!!lowScent}`

// 프로필(최종 조건)에 맞는 부케 유형
export function pickBouquet(profile) {
  const want = keyOf({ criteria: profile.criteria[0] ?? '유지력', lowIrritant: profile.lowIrritant, lowScent: profile.lowScent })
  // 조건 8가지 모두 부케가 있음
  return BOUQUETS.find((b) => keyOf(b.when) === want) ?? BOUQUETS[0]
}

export const findBouquet = (key) => BOUQUETS.find((b) => b.key === key)

// 결과 키로 결과 찾기 (어느 부케의 결과든)
export function findResult(key) {
  for (const b of BOUQUETS) {
    const r = b.results.find((item) => item.key === key)
    if (r) return r
  }
  return null
}

// 지금 만들고 있는 부케 유형 — 부케 구성에 들어갈 때 최종 조건으로 정해지고, 완성·카드까지 유지됨
// 새로고침해도 이 탭에서는 유지 (없으면 지금 조건에 맞는 부케) — 중간 화면에서 Still로 돌아가지 않게
const ACTIVE_KEY = 'qb-active-bouquet'
let activeKey = (() => {
  try {
    const saved = sessionStorage.getItem(ACTIVE_KEY)
    if (saved && findBouquet(saved)) return saved
  } catch {
    // 저장이 막힌 환경
  }
  return pickBouquet(getProfile()).key
})()
const listeners = new Set()

// 부케 유형이 바뀌었으면 true (이전 부케로 담던 식물은 비워야 함)
export function startBouquet(profile) {
  const next = pickBouquet(profile).key
  if (next === activeKey) return false
  activeKey = next
  try {
    sessionStorage.setItem(ACTIVE_KEY, next)
  } catch {
    // 저장이 막힌 환경에서는 메모리에만
  }
  listeners.forEach((listener) => listener())
  return true
}

export const getActiveBouquet = () => findBouquet(activeKey) ?? BOUQUETS[0]

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useActiveBouquet() {
  return useSyncExternalStore(subscribe, getActiveBouquet)
}
