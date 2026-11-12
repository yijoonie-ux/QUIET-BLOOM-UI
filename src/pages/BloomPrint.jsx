import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import CardSparkles from '../components/CardSparkles'
import { saveMadeBloom } from '../data/blooms'
import { clearCart, useCart } from '../data/bouquet'
import { getActiveBouquet } from '../data/bouquets'
import { useSwaps } from '../data/sourcing'
import { useAppliedTune } from '../data/tune'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import { useTilt } from '../hooks/useTilt'
import { CardFront } from './BloomCard'
import './BloomCard.css'
import './BloomPrint.css'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Bloom Card 생성 — Bloom Complete의 "카드로 만들기"에서 바로 이어짐.
// 실물 출력 없이: 흐릿한 카드가 빛이 지나가며 또렷하게 만들어진 뒤 My Blooms에 저장
function BloomPrint() {
  usePageBackground('#ffffff')
  const [leaving, leave] = usePageLeave(280)
  const location = useLocation()
  const resultKey = location.state?.result
  const [done, setDone] = useState(reduceMotion)
  // 완료 후 살짝 떠오르는 움직임까지 끝나면 애니메이션을 걷어내 사진을 원래 해상도로 그림
  const [settled, setSettled] = useState(reduceMotion)
  const cardRef = useTilt()
  const bouquet = getActiveBouquet()

  // 카드가 만들어지면 부케 하나를 완성한 것 → My Blooms에 저장 (담은 수량 기준 식물 개수도 함께)
  // 한 번만 저장 (홈으로 갈 때 담은 식물을 비워도 저장한 개수는 그대로)
  const cart = useCart()
  const appliedTune = useAppliedTune()
  const swaps = useSwaps()
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    saveMadeBloom(bouquet, resultKey, cart, appliedTune, swaps)
  }, [done, bouquet, resultKey, cart, appliedTune, swaps])

  const goHome = () => {
    // 부케 구성이 끝났으니 담은 식물은 비움
    clearCart()
    leave('/')
  }

  const goBlooms = () => {
    clearCart()
    leave('/blooms')
  }

  return (
    <div className="bpr fit-screen" data-done={done} data-settled={settled} data-leaving={leaving}>
      <header className="bpr__header" key={done ? 'done' : 'creating'}>
        <h1 className="bpr__title">{done ? 'Bloom Card Created' : 'Creating'}</h1>
        <p className="bpr__desc">
          {done ? 'My Blooms에 저장했어요. 언제든 다시 볼 수 있어요.' : 'Bloom Card를 만들고 있어요. 잠시만 기다려주세요.'}
        </p>
      </header>

      <div className="bpr__paper">
        {done && <CardSparkles width={276} height={408} delay={0} duration={900} />}
        <div
          className="bpr__card"
          onAnimationEnd={(e) => {
            if (e.animationName === 'bpr-create') setDone(true)
            if (e.animationName === 'bpr-settle') setSettled(true)
          }}
        >
          {/* 다 만들어지면 끌어서 기울여볼 수 있음 */}
          <div ref={cardRef} className="bpr__card-inner">
            <CardFront resultKey={resultKey} />
          </div>
          {/* 만들어지는 동안 카드 위를 위에서 아래로 훑고 지나가는 빛 */}
          <span className="bpr__sheen" aria-hidden="true" />
        </div>

        {/* 저장 표시: 카드 아래 가장자리에 붙는 작은 배지 */}
        <span className="bpr__saved" aria-hidden={!done}>
          <span className="bpr__saved-check">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Saved to My Blooms
        </span>
      </div>

      <div className="bpr__actions" aria-hidden={!done}>
        <button type="button" className="bpr__home" onClick={goHome} disabled={!done}>
          홈으로 가기
        </button>
        <button type="button" className="bpr__blooms" onClick={goBlooms} disabled={!done}>
          My Blooms 보기
        </button>
      </div>
    </div>
  )
}

export default BloomPrint
