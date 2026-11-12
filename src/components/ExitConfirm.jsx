import { useEffect, useState } from 'react'
import './ExitConfirm.css'

// 부케 구성 종료 확인 팝업 (Figma 2268:18353). 배경이나 계속하기를 누르면 닫힘.
// 문구를 바꿔 다른 안내 팝업으로도 씀 (예: 홈 My Blooms — 저장한 부케가 없을 때)
function ExitConfirm({
  onContinue,
  onExit,
  title = '부케 구성을 종료할까요?',
  desc = '지금까지 선택한 내용은 저장되지 않아요.',
  continueLabel = '계속하기',
  exitLabel = '나가기',
}) {
  const [closing, setClosing] = useState(false)

  const close = () => {
    if (closing) return
    setClosing(true)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTimeout(onContinue, reduceMotion ? 0 : 240)
  }

  // 열려 있는 동안 뒤 화면 스크롤 잠금 + Esc로 닫기
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  })

  return (
    <div className="exit-confirm" data-closing={closing} onClick={close}>
      <section
        className="exit-confirm__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-confirm-title"
        aria-describedby="exit-confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="exit-confirm-title" className="exit-confirm__title">{title}</h2>
        <p id="exit-confirm-desc" className="exit-confirm__desc">{desc}</p>
        <button type="button" className="exit-confirm__continue" onClick={close}>
          {continueLabel}
        </button>
        <button type="button" className="exit-confirm__exit" onClick={onExit}>
          {exitLabel}
        </button>
      </section>
    </div>
  )
}

export default ExitConfirm
