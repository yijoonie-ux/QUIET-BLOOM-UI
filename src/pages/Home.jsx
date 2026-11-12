import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import heroFlower from '../assets/main/hero-flower.png'
import logoMask from '../assets/main/logo-mask.png'
import dot from '../assets/main/dot.svg'
import arrowUpRight from '../assets/main/arrow-up-right.svg'
import profileCard from '../assets/main/profile-card.svg'
import divider from '../assets/main/divider.svg'
import emptyIcon from '../assets/main/empty-icon.svg'
import hangingCutout from '../assets/main/bloom-hanging.png'
import arrowGreen from '../assets/main/arrow-up-right-green.svg'
import bouquetImg from '../assets/preview/bouquet.png'
import ChipScroller from '../components/ChipScroller'
import ExitConfirm from '../components/ExitConfirm'
import ScentRange from '../components/ScentRange'
import SlideToStart from '../components/SlideToStart'
import TabBar from '../components/TabBar'
import { useMadeBloom } from '../data/blooms'
import { useProfile } from '../data/profile'
import { findBouquet, findResult } from '../data/bouquets'
import { useInView } from '../hooks/useInView'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './Home.css'

const TAGLINES = ['Quiet Comfort', 'Guided Structure', 'Lasting Bloom']

// 진입 애니메이션은 앱을 처음 열었을 때 한 번만 (다른 화면에서 돌아올 땐 생략)
let introPlayed = false

function Home() {
  usePageBackground('var(--qb-bg-end)')
  const profile = useProfile()
  // 부케를 하나 만들기 전엔 빈 상태, 만든 뒤엔 최근 부케
  const madeBloom = useMadeBloom()
  const madeResult = findResult(madeBloom?.result)
  const madeBouquet = madeBloom ? findBouquet(madeBloom.bouquet) : null
  // 홈 카드 사진 배치: Still 행잉은 Figma 홈 카드용 누끼 사진, 누끼가 있는 결과는 배경 없이 부케만, 그 외 결과는 꽉 채움
  const madeKind =
    madeResult?.key === 'still-hanging' ? 'hanging' : madeResult?.cutout ? 'cutout' : madeResult ? 'vase' : 'plain'
  const madeImage =
    madeKind === 'hanging'
      ? hangingCutout
      : (madeResult?.cutout ?? madeResult?.image ?? madeBouquet?.preview.image ?? bouquetImg)
  const [emptyNotice, setEmptyNotice] = useState(false)
  const openBlooms = () => (madeBloom ? leave('/blooms') : setEmptyNotice(true))
  const [leaving, leave] = usePageLeave(320)
  const [linkPressed, setLinkPressed] = useState(false)

  // 하단 탭: 흰 칸이 이동하는 걸 보여준 뒤 화면 전환 (탭끼리 오갈 땐 탭바는 그대로 두고 화면만 전환)
  const viaTab = useLocation().state?.via === 'tab'
  const [leavingByTab, setLeavingByTab] = useState(false)
  const handleTabChange = (key) => {
    if (key === 'bouquet') setTimeout(() => leave('/make'), 260)
    if (key === 'mypage') {
      setLeavingByTab(true)
      setTimeout(() => leave('/mypage', { state: { via: 'tab' } }), 260)
    }
  }

  // ↗ 버튼이 오른쪽 위로 살짝 튀어 오른 뒤 화면 전환
  const openEditConditions = () => {
    if (linkPressed) return
    setLinkPressed(true)
    setTimeout(() => leave('/edit', { state: { from: 'profile' } }), 180)
  }
  const [emptyRef, emptyInView] = useInView({ threshold: 0.6 })
  const [playIntro] = useState(() => !introPlayed)

  useEffect(() => {
    introPlayed = true
  }, [])

  return (
    <div className="home" data-intro={playIntro} data-leaving={leaving} data-tab-nav={viaTab || leavingByTab}>
      <div className="home__canvas">
        <img className="home__hero" src={heroFlower} alt="" />
        {/* 사진 아래쪽을 덮는 연두 그라데이션 (Figma 2845:20635) */}
        <span className="home__veil" aria-hidden="true" />
        <h1
          className="home__logo"
          style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
        >
          <span className="sr-only">Quiet Bloom</span>
        </h1>

        <div className="home__content">
          <ul className="home__tagline">
            {TAGLINES.map((text, i) => (
              <li key={text}>
                {i > 0 && <img src={dot} alt="" />}
                {text}
              </li>
            ))}
          </ul>

          <div className="home__cta">
            <SlideToStart label="MAKE YOUR OWN QUIET BLOOM" onComplete={() => leave('/make')} />
          </div>

          <section className="profile-card">
            <img className="profile-card__shape" src={profileCard} alt="" />
            <div className="profile-card__bottom" />

            <button
              type="button"
              className="profile-card__link"
              aria-label="Bloom Profile 수정"
              data-pressed={linkPressed}
              onClick={openEditConditions}
            >
              <img src={arrowUpRight} alt="" />
            </button>

            <div className="profile-card__head">
              <h2 className="card-title">Bloom Profile</h2>
              <p className="card-desc">나의 민감도 요약 카드</p>
            </div>
            <img className="profile-card__divider" src={divider} alt="" />

            <dl className="profile-card__grid">
              <div className="profile-card__cell profile-card__cell--inline">
                <dt className="profile-card__label">저자극</dt>
                <dd className="mini-toggle" data-on={profile.lowIrritant}>
                  <span className="mini-toggle__knob" />
                </dd>
              </div>
              <div className="profile-card__cell profile-card__cell--inline">
                <dt className="profile-card__label">저향</dt>
                <dd className="profile-card__range">
                  <ScentRange on={profile.lowScent} offTone="neutral" width={86.4124} height={36.4164} />
                </dd>
              </div>
              <div className="profile-card__cell">
                <dt className="profile-card__label">제외 식물</dt>
                <dd>
                  <ChipScroller className="chips chips--excluded">
                    {profile.excludedPlants.length > 0 ? (
                      profile.excludedPlants.map((plant) => (
                        <span key={plant} className="chip">{plant}</span>
                      ))
                    ) : (
                      <span className="chip">없음</span>
                    )}
                  </ChipScroller>
                </dd>
              </div>
              <div className="profile-card__cell">
                <dt className="profile-card__label">추천 기준</dt>
                <dd>
                  <ChipScroller className="chips chips--criteria">
                    {profile.criteria.map((item) => (
                      <span key={item} className="chip">{item}</span>
                    ))}
                  </ChipScroller>
                </dd>
              </div>
            </dl>
          </section>

          {/* 누르면 My Blooms — 아직 만든 부케가 없으면 넘어가지 않고 안내 팝업 */}
          <section
            className="blooms-card"
            role="link"
            tabIndex={0}
            aria-label="My Blooms 보기"
            onClick={openBlooms}
            onKeyDown={(e) => e.key === 'Enter' && openBlooms()}
          >
            {madeBloom ? (
              // 부케를 하나 만든 뒤 (Figma 2268:17297): 최근 부케 사진 + 목록
              <>
                <div>
                  <h2 className="card-title">My Blooms</h2>
                  <p className="card-desc">최근 저장한 부케</p>
                  <ul className="blooms-card__list">
                    <li>
                      <span className="blooms-card__thumb blooms-card__thumb--bouquet">
                        <img src={madeBouquet?.preview.image ?? bouquetImg} alt="" />
                      </span>
                      {/* 쓴 식물 총 개수 (예: 7 Greenary) */}
                      {madeBloom.plantCount} Greenary
                    </li>
                    {madeResult && (
                      <li>
                        <span className="blooms-card__thumb blooms-card__thumb--result">
                          <img src={madeResult.image} alt="" />
                        </span>
                        {madeResult.label}
                      </li>
                    )}
                  </ul>
                </div>
                <div ref={emptyRef} className="blooms-card__photo" data-revealed={emptyInView} data-kind={madeKind}>
                  <img src={madeImage} alt="" />
                  {/* 부케 이름만 (칸이 작아 민감도 줄은 사진과 겹침) — 알약 없이 글씨만, 다른 카드 이름표와 같은 굵기 */}
                  <span className="blooms-card__tag">{madeBloom.name}</span>
                </div>
                <img className="blooms-card__arrow" src={arrowGreen} alt="" />
              </>
            ) : (
              <>
                <div>
                  <h2 className="card-title">My Blooms</h2>
                  <p className="card-desc">저장한 부케가 없어요.</p>
                </div>
                <div ref={emptyRef} className="blooms-card__empty" data-revealed={emptyInView}>
                  <img src={emptyIcon} alt="" />
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <TabBar active="home" onChange={handleTabChange} />

      {emptyNotice && (
        <ExitConfirm
          title="아직 저장한 부케가 없어요"
          desc="부케를 만들면 이곳에서 내역을 볼 수 있어요."
          continueLabel="확인"
          exitLabel="부케 만들러 가기"
          onContinue={() => setEmptyNotice(false)}
          onExit={() => {
            setEmptyNotice(false)
            leave('/make')
          }}
        />
      )}
    </div>
  )
}

export default Home
