import { useSyncExternalStore } from 'react'
import { clearSwaps } from './sourcing'
import { setAppliedTune } from './tune'

// 부케 구성에서 담은 식물과 수량 (담은 순서대로).
// 화면을 오가도(구성 → 프리뷰 → 다시 구성) 유지되도록 화면 밖에 둠.
// TODO: 사용자 데이터 연동 전까지 메모리에만 저장
let cart = []
const listeners = new Set()

function emit(next) {
  cart = next
  listeners.forEach((listener) => listener())
}

// 수량 변경: 0이 되면 목록에서 빠지고, 처음 담으면 맨 뒤에 추가
export function setPlantQty(name, qty) {
  if (qty <= 0) emit(cart.filter((item) => item.name !== name))
  else if (!cart.some((item) => item.name === name)) emit([...cart, { name, qty }])
  else emit(cart.map((item) => (item.name === name ? { ...item, qty } : item)))
}

// 소재 교체 (Make This Bloom의 대체 소재): 같은 자리·같은 수량으로 바꿈
export function replacePlant(from, to) {
  emit(cart.map((item) => (item.name === from ? { name: to, qty: item.qty } : item)))
}

export function clearCart() {
  emit([])
  // 소재 교체 기록·적용한 인상도 이번 부케와 함께 비움
  clearSwaps()
  setAppliedTune(null)
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCart() {
  return useSyncExternalStore(subscribe, () => cart)
}
