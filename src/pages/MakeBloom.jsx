import closeIcon from '../assets/make/close.svg'
import cardFrame from '../assets/make/profile-card.svg'
import divider from '../assets/make/divider.svg'
import bulb from '../assets/make/bulb.svg'
import ChipScroller from '../components/ChipScroller'
import { getRecommendedPlants } from '../data/plants'
import { getProfileSummary, useProfile } from '../data/profile'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import { useTilt } from '../hooks/useTilt'
import './MakeBloom.css'

function MakeBloom() {
  usePageBackground('#ffffff')
  const profile = useProfile()
  const [leaving, leave] = usePageLeave(280)
  const cardRef = useTilt()
  const summary = getProfileSummary(profile)
  const plantCount = getRecommendedPlants(profile).length

  return (
    <div className="make" data-leaving={leaving}>
      <header className="make__header">
        <h1 className="make__title">
          Make
          <br />
          Quiet Bloom
        </h1>
        <p className="make__desc">민감도 조건이 맞는지 카드를 눌러 확인해주세요.</p>
        <button type="button" className="make__close" aria-label="닫기" onClick={() => leave('/')}>
          <img src={closeIcon} alt="" />
        </button>
      </header>

      <section ref={cardRef} className="bloom-card" aria-label="Bloom Profile">
        <img className="bloom-card__frame" src={cardFrame} alt="" />
        <h2 className="bloom-card__heading">Bloom Profile</h2>
        <div className="bloom-card__badge">
          <span className="bloom-card__badge-icon">
            <img src={bulb} alt="" />
          </span>
          {summary.badge}
        </div>
        <img className="bloom-card__divider" src={divider} alt="" />

        <div className="bloom-card__body">
          {/* 온보딩에서 받은 Bloom Profile 카드와 같은 제목 (민감도 조건) */}
          <h3 className="bloom-card__title">{summary.title}</h3>
          <p className="bloom-card__text">
            {summary.description.map((line, i) => (
              <span key={i} className="bloom-card__line">
                {line}
              </span>
            ))}
          </p>

          <h4 className="bloom-card__label">제외 식물</h4>
          <ChipScroller className="bloom-card__chips">
            {profile.excludedPlants.length > 0 ? (
              profile.excludedPlants.map((plant) => (
                <span key={plant} className="bloom-card__chip">{plant}</span>
              ))
            ) : (
              <span className="bloom-card__chip">없음</span>
            )}
          </ChipScroller>
        </div>

        {/* 카드 아래 한 줄: 조건(저자극·저향·제외 식물)에 맞는 식물 수 — 부케 구성 화면과 같은 필터 */}
        <p className="bloom-card__foot">
          <span>조건에 맞는 식물</span>
          <strong>{plantCount}종</strong>
        </p>

        {/* 은은한 유리 질감 (Sensitivity 카드 · MyPage 메뉴와 같은 값) */}
        <span className="bloom-card__sheen" aria-hidden="true" />
        {/* 기울일 때 따라 움직이는 빛 반사 */}
        <div className="bloom-card__glare" aria-hidden="true" />
      </section>

      <div className="make__actions">
        <button type="button" className="make__primary" onClick={() => leave('/compose')}>
          이대로 시작하기
        </button>
        <button type="button" className="make__secondary" onClick={() => leave('/edit', { state: { from: 'make' } })}>
          조건 수정하기
        </button>
      </div>
    </div>
  )
}

export default MakeBloom
