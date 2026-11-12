import { useLocation } from 'react-router'
import logoMask from '../assets/logo-clover.svg'
import CardSparkles from '../components/CardSparkles'
import { useTilt } from '../hooks/useTilt'
import { clearCart } from '../data/bouquet'
import { findResult, getActiveBouquet } from '../data/bouquets'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './BloomCard.css'

// 카드 앞면 (부케 사진) — 카드 저장 화면에서도 같은 앞면을 씀
// 사진은 결과별 카드 사진(bouquets.js card, Figma 2845:25056)을 꽉 채움
export function CardFront({ resultKey }) {
  const result = findResult(resultKey)
  // 프리뷰 없이 완성했으면 구성한 부케 사진 그대로
  const bouquet = getActiveBouquet()
  const image = result?.card ?? bouquet.preview.image

  return (
    <div className="bc__face bc__face--front" data-plain={!result}>
      <img className="bc__image" src={image} alt="완성한 부케 카드" data-cover="true" />
      {/* My Blooms 카드와 같은 이름표: 부케 이름 + 민감도 · 추천 기준 */}
      <span className="bc__label">
        <strong>{bouquet.name}</strong>
        {bouquet.tags} · {bouquet.when.criteria} 순
      </span>
    </div>
  )
}

// Bloom Card (Figma 2268:20892) — 완성한 부케를 카드로
function BloomCard() {
  usePageBackground('#d9e4c8')
  const [leaving, leave] = usePageLeave(280)
  const location = useLocation()
  const cardRef = useTilt()

  const goHome = () => {
    // 부케 구성이 끝났으니 담은 식물은 비움
    clearCart()
    leave('/')
  }

  return (
    <div className="bc fit-screen" data-leaving={leaving}>
      <header className="bc__header">
        <h1 className="bc__title">Bloom Card</h1>
        <p className="bc__desc">완성된 부케를 카드로 저장하고, My Blooms에서 다시 확인해보세요.</p>
      </header>

      {/* 카드: 뒷면에서 반 바퀴 돌아 앞면으로 나타나 자리를 잡음 → 이후 끌면 기울어짐 */}
      <div className="bc__card-wrap">
        {/* 카드가 뒤집히는 동안 카드 아래에서 피어오르는 흰색·연두 파티클 */}
        <CardSparkles width={307} height={454} delay={350} duration={1200} />
        <div
          ref={cardRef}
          className="bc__card"
          onAnimationEnd={(e) => {
            // 등장이 끝나면 애니메이션을 걷어내 작게 그려진 상태로 흐려 보이지 않게
            if (e.animationName === 'bc-card-spin') e.currentTarget.dataset.settled = 'true'
          }}
        >
          <CardFront resultKey={location.state?.result} />
          {/* 돌아가는 동안 보이는 뒷면: 세이지 바탕 + 네 잎 심볼 로고 */}
          <div className="bc__face bc__face--back" aria-hidden="true">
            <span className="bc__logo" style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }} />
          </div>
        </div>
      </div>

      <div className="bc__actions">
        {/* 실물 출력 없이 My Blooms에 디지털 카드로 저장 */}
        <button type="button" className="bc__print" onClick={() => leave('/saved', { state: location.state })}>
          카드 저장하기
        </button>
        <button type="button" className="bc__home" onClick={goHome}>
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default BloomCard
