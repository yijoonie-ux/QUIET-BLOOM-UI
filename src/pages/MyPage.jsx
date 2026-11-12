import { useState } from 'react'
import { useLocation } from 'react-router'
import bg from '../assets/mypage/bg.jpg'
import chevron from '../assets/mypage/chevron.svg'
import divider from '../assets/mypage/divider.svg'
import bellIcon from '../assets/mypage/bell.svg'
import globeIcon from '../assets/mypage/globe.svg'
import globeGlow from '../assets/mypage/globe-shadow.svg'
import infoIcon from '../assets/mypage/info.svg'
import infoGlow from '../assets/mypage/info-shadow.svg'
import faqIcon from '../assets/mypage/faq.svg'
import faqGlow from '../assets/mypage/faq-shadow.svg'
import shieldIcon from '../assets/mypage/shield.svg'
import shieldGlow from '../assets/mypage/shield-shadow.svg'
import TabBar from '../components/TabBar'
import { getProfileSummary, useProfile } from '../data/profile'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './MyPage.css'

// 원형 배경 위 흰 아이콘 (번진 그림자 + 선명한 아이콘을 겹쳐 은은하게 빛나 보이게)
function RowIcon({ icon, glow }) {
  return (
    <span className="mypage-row__icon" aria-hidden="true">
      {glow && <img className="mypage-row__glow" src={glow} alt="" />}
      <img src={icon} alt="" />
    </span>
  )
}

const INFO_ROWS = [
  { label: '공지사항', icon: infoIcon, glow: infoGlow },
  { label: '자주 묻는 질문', icon: faqIcon, glow: faqGlow },
  { label: '개인정보 처리방침', icon: shieldIcon, glow: shieldGlow },
]

// 마이페이지 (Figma 2168:2678)
function MyPage() {
  usePageBackground('#d9e4c8')
  const profile = useProfile()
  const [leaving, leave] = usePageLeave(320)
  const [notify, setNotify] = useState(true)
  // 하단 탭으로 넘어왔으면 탭바는 그대로 두고 화면만 전환
  const viaTab = useLocation().state?.via === 'tab'
  const [leavingByTab, setLeavingByTab] = useState(false)
  const { badge } = getProfileSummary(profile)
  // '저자극·저향 · 유지력 우선' → '저자극 · 저향'
  const sensitivity = badge.split(' · ')[0].replace('·', ' · ')

  const handleTabChange = (key) => {
    setLeavingByTab(true)
    const to = key === 'home' ? '/' : '/make'
    setTimeout(() => leave(to, { state: { via: 'tab' } }), 260)
  }

  return (
    <div className="mypage" data-leaving={leaving} data-tab-nav={viaTab || leavingByTab}>
      <div className="mypage__bg" aria-hidden="true">
        <img src={bg} alt="" />
      </div>

      <div className="mypage__content">
        <header className="mypage__header">
          <h1 className="mypage__title">MyPage</h1>
          <p className="mypage__desc">나의 설정을 관리해보세요</p>
        </header>

        <button
          type="button"
          className="mypage-profile"
          onClick={() => leave('/edit', { state: { from: 'mypage' } })}
        >
          <span className="mypage-profile__avatar" aria-hidden="true">
            <img src={bg} alt="" />
          </span>
          <span className="mypage-profile__text">
            <span className="mypage-profile__name">My Bloom Profile</span>
            <span className="mypage-profile__summary">{sensitivity}</span>
          </span>
        </button>

        <section className="mypage-card mypage-card--settings" aria-label="설정">
          <div className="mypage-row">
            <RowIcon icon={bellIcon} />
            <span className="mypage-row__label">알림 설정</span>
            <button
              type="button"
              role="switch"
              aria-checked={notify}
              aria-label="알림 설정"
              className="mypage-toggle"
              onClick={() => setNotify(!notify)}
            >
              <span className="mypage-toggle__knob" />
            </button>
          </div>
          <img className="mypage-card__divider" src={divider} alt="" />
          <button type="button" className="mypage-row">
            <RowIcon icon={globeIcon} glow={globeGlow} />
            <span className="mypage-row__label">언어 설정</span>
            <img className="mypage-row__chevron" src={chevron} alt="" />
          </button>
        </section>

        <section className="mypage-card mypage-card--info" aria-label="안내">
          {INFO_ROWS.map((row, i) => (
            <div key={row.label} className="mypage-card__item">
              {i > 0 && <img className="mypage-card__divider" src={divider} alt="" />}
              <button type="button" className="mypage-row">
                <RowIcon icon={row.icon} glow={row.glow} />
                <span className="mypage-row__label">{row.label}</span>
                <img className="mypage-row__chevron" src={chevron} alt="" />
              </button>
            </div>
          ))}
        </section>
      </div>

      <TabBar active="mypage" onChange={handleTabChange} />
    </div>
  )
}

export default MyPage
