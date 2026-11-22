import { useSyncExternalStore } from 'react'
import { PLANTS } from './plants'

// 인상 다듬기: 일상어(형용사) → 실제 구성 변화.
// 풍성함·높이는 식물 수량을 바꾸고, 정돈은 수량 그대로 만드는 방법(꽂는 방식)으로 안내
// 더 풍성하게: Volume 역할 식물을 한 칸 더 / 더 가볍게: Structure 역할 식물을 한 대 덜 (0이면 구성에서 빠짐)
// 더 높고 길게: Line 역할 식물을 하나 더 (Lush 운룡버들 1 → 2) — 더 낮게는 줄기만 짧게
// fallback: 그 역할 식물이 없는 부케(Grove)는 이 역할에서 — Grove 더 가볍게 = 트리펀 3 → 2
const AXIS_EFFECT = {
  volume: {
    plus: { role: 'volume', dir: 1, min: 1 },
    minus: { role: 'structure', fallback: 'volume', dir: -1, min: 0, step: 1 },
  },
  height: {
    plus: { role: 'line', dir: 1, min: 1, step: 1 },
  },
}

// 만드는 방법 안내
const AXIS_GUIDE = {
  height: {
    plus: '줄기를 길게 남기고, 선이 있는 소재를 위로 세워 꽂아요.',
    minus: '줄기를 2~3cm 더 짧게 잘라 낮게 묶어요.',
  },
  order: {
    plus: '길이를 조금씩 다르게 두고, 바깥으로 흐르듯 꽂아요.',
    minus: '높이를 맞춰 잘라, 둥근 윤곽으로 정리해요.',
  },
}

// 받침에 따라 을/를
const withObject = (word) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return `${word}${code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를'}`
}

// 고른 인상 → 만드는 방법 문장 (changes: 바뀐 수량 — 더 높고 길게로 Line 식물을 더했으면 그 식물 이름으로 안내)
export function guidesFor(values, changes = []) {
  return Object.entries(AXIS_GUIDE)
    .map(([axis, guide]) => {
      if (!values[axis]) return null
      const line = axis === 'height' && values[axis] > 0 && changes.find((c) => c.role === 'line')
      if (line) return `Line 역할을 하는 ${withObject(line.name)} 하나 더 넣고, 줄기를 길게 남겨 위로 세워 꽂아요.`
      return guide[values[axis] > 0 ? 'plus' : 'minus']
    })
    .filter(Boolean)
}

// 역할별 한 칸의 수량: 지금 그 역할 수량의 1/4 (최소 1) — 스틸그라스 20단도, 살랄 1개도 자연스럽게
const stepOf = (qty) => Math.max(1, Math.round(qty / 4))

// items: [{ name, qty }] (처음 구성), values: { volume, height, order } (-1 · 0 · 1)
// → 풍성함은 정해진 역할에서 가장 많이 담긴 식물의 수량을 늘리고 줄임, 높이·정돈은 guides(만드는 방법)로
export function planTune(items, values) {
  const withRole = items
    .map((item) => ({ ...item, role: PLANTS.find((p) => p.name === item.name)?.category }))
    .filter((item) => item.role)

  const next = items.map((item) => ({ ...item }))
  const changes = []
  Object.entries(values).forEach(([axis, v]) => {
    if (!v || !AXIS_EFFECT[axis]) return
    const effect = AXIS_EFFECT[axis][v > 0 ? 'plus' : 'minus']
    const { dir, min, step } = effect
    const mainOf = (r) => withRole.filter((item) => item.role === r).sort((a, b) => b.qty - a.qty)[0]
    const role = mainOf(effect.role) || !effect.fallback ? effect.role : effect.fallback
    const main = mainOf(role)
    if (!main) return
    const target = next.find((item) => item.name === main.name)
    const to = Math.max(min, target.qty + dir * (step ?? stepOf(main.qty)))
    if (to === target.qty) return
    changes.push({ name: target.name, role, from: target.qty, to })
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
