import { useEffect, useRef, useState } from 'react'

// 요소가 화면에 threshold 비율 이상 들어오면 true (한 번 true가 되면 유지)
export function useInView({ threshold = 0.6 } = {}) {
  const ref = useRef(null)
  // IntersectionObserver가 없는 환경에서는 처음부터 보이는 상태로 둔다
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, inView])

  return [ref, inView]
}
