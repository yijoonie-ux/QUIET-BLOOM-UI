import { useSyncExternalStore } from 'react'
import { PLANTS } from './plants'

// 인상 다듬기: 일상어(형용사) → 단계(역할)별 식물 수량 + 만드는 방법.
// 세 축이 각각 한 단계의 식물을 다듬음 (한 번에 1대씩, 0이 되면 구성에서 빠짐)
// - 더 가볍게 / 더 풍성하게 → Texture 식물 하나 빼기 / 하나 더 (결을 덜거나 더해 정돈)
// - 더 낮고 안정적으로 / 더 높고 길게 → Line 식물 하나 빼기 / 하나 더 (Lush 운룡버들 1 → 2)
// - 더 정돈되게 → Structure(없으면 Volume) 식물 하나 빼기 / 더 자연스럽게 → Volume(없으면 Structure) 식물 하나 더
// 뺄 때는 그 단계에서 가장 적게 담긴 식물(포인트 소재)부터, 더할 때는 가장 많이 담긴 식물에
// 그 단계 식물이 없는 부케는 fallback 단계에서 (Texture가 없으면 Volume)
const AXIS_EFFECT = {
  volume: {
    plus: { role: 'texture', fallback: 'volume', dir: 1 },
    minus: { role: 'texture', fallback: 'volume', dir: -1 },
  },
  height: {
    plus: { role: 'line', dir: 1 },
    minus: { role: 'line', dir: -1, min: 1 },
  },
  order: {
    plus: { role: 'volume', fallback: 'structure', dir: 1 },
    minus: { role: 'structure', fallback: 'volume', dir: -1 },
  },
}

const ROLE_LABEL = { structure: 'Structure', volume: 'Volume', line: 'Line', texture: 'Texture' }

// 받침에 따라 을/를
const withObject = (word) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return `${word}${code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를'}`
}

// 바뀐 식물이 없을 때(그 단계 식물이 없는 부케 등) 쓰는 만드는 방법
const AXIS_GUIDE = {
  volume: {
    plus: '잎과 잎 사이를 조금 더 채워 풍성하게 묶어요.',
    minus: '겹친 잎을 조금 정리해 가볍게 묶어요.',
  },
  height: {
    plus: '줄기를 길게 남기고, 선이 있는 소재를 위로 세워 꽂아요.',
    minus: '줄기를 2~3cm 더 짧게 잘라 낮게 묶어요.',
  },
  order: {
    plus: '길이를 조금씩 다르게 두고, 바깥으로 흐르듯 꽂아요.',
    minus: '높이를 맞춰 잘라 정돈해요.',
  },
}

// 바뀐 식물로 만드는 방법 한 문장 — 어느 단계의 어떤 식물을 빼거나 더해서 어떻게 다듬는지
function guideOf(axis, dir, change) {
  if (!change) return AXIS_GUIDE[axis][dir > 0 ? 'plus' : 'minus']
  const who = `${ROLE_LABEL[change.role]} 단계의 ${withObject(change.name)}`
  const less = change.to === 0 ? '빼서' : '하나 줄여'
  if (axis === 'volume') {
    return dir > 0 ? `${who} 하나 더 넣어, 결을 풍성하게 채워요.` : `${who} ${less} 결을 가볍게 정돈해요.`
  }
  if (axis === 'height') {
    return dir > 0
      ? `${who} 하나 더 넣고, 줄기를 길게 남겨 위로 세워 꽂아요.`
      : `${who} ${less} 줄기를 2~3cm 짧게 잘라 낮게 묶어요.`
  }
  return dir > 0
    ? `${who} 하나 더 넣고, 길이를 조금씩 다르게 두어 흐르듯 꽂아요.`
    : `${who} ${less} 높이를 맞춰 정돈해요.`
}

// 고른 인상 → 만드는 방법 문장 (changes: 바뀐 수량, 축마다 하나)
export function guidesFor(values, changes = []) {
  return Object.keys(AXIS_GUIDE)
    .map((axis) => (values[axis] ? guideOf(axis, values[axis], changes.find((c) => c.axis === axis)) : null))
    .filter(Boolean)
}

// items: [{ name, qty }] (처음 구성), values: { volume, height, order } (-1 · 0 · 1)
// → 축마다 정해진 단계의 식물 하나를 1대 빼거나 더함 (changes에 축·단계·전후 수량)
export function planTune(items, values) {
  const withRole = items
    .map((item) => ({ ...item, role: PLANTS.find((p) => p.name === item.name)?.category }))
    .filter((item) => item.role)

  const next = items.map((item) => ({ ...item }))
  const changes = []
  Object.entries(values).forEach(([axis, v]) => {
    if (!v || !AXIS_EFFECT[axis]) return
    const { role: want, fallback, dir, min = 0 } = AXIS_EFFECT[axis][v > 0 ? 'plus' : 'minus']
    // 이미 다른 축에서 바뀐 식물은 건너뜀 (한 식물이 두 번 바뀌지 않게)
    const inRole = (r) =>
      withRole.filter((item) => item.role === r && !changes.some((c) => c.name === item.name))
    const role = inRole(want).length || !fallback ? want : fallback
    const pool = inRole(role)
    if (!pool.length) return
    // 더할 땐 가장 많이 담긴 식물, 뺄 땐 가장 적게 담긴 식물(같으면 목록에서 뒤쪽 — 포인트로 더한 소재)
    const main =
      dir > 0
        ? [...pool].sort((a, b) => b.qty - a.qty)[0]
        : [...pool].reverse().sort((a, b) => a.qty - b.qty)[0]
    const target = next.find((item) => item.name === main.name)
    const to = Math.max(min, target.qty + dir)
    if (to === target.qty) return
    changes.push({ axis, name: target.name, role, from: target.qty, to })
    target.qty = to
  })

  const priceOf = (list) =>
    list.reduce((sum, { name, qty }) => sum + (PLANTS.find((p) => p.name === name)?.price ?? 0) * qty, 0)
  // 0이 된 식물은 구성에서 빠짐 (담은 식물 수량을 0으로 두면 목록에서 지워짐)
  return { next, changes, guides: guidesFor(values, changes), priceFrom: priceOf(items), priceTo: priceOf(next) }
}

// 이번 부케에 적용한 인상 (장식 선택은 연출 소재 목록에도 쓰임) — 부케를 다 만들면 비움
let applied = null
const listeners = new Set()

export function setAppliedTune(tune) {
  applied = tune
  listeners.forEach((listener) => listener())
}

export const getAppliedTune = () => applied

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAppliedTune() {
  return useSyncExternalStore(subscribe, getAppliedTune)
}
