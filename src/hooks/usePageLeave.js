import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

// 퇴장 애니메이션을 재생한 뒤 다음 화면으로 이동
export function usePageLeave(duration = 300) {
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  // options: react-router navigate 옵션 (예: { state: { from: 'profile' } })
  const leave = (to, options) => {
    if (leaving) return
    setLeaving(true)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(() => navigate(to, options), reduceMotion ? 0 : duration)
  }

  return [leaving, leave]
}
