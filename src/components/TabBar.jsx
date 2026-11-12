import { useRef, useState } from 'react'
// 부케구성 탭: 브랜드 로고 실루엣 (홈 슬라이더를 밀면 화살표가 이 로고로 바뀌며 부케 구성 시작)
// 잎 안쪽 구멍은 메우고, 가운데 대각선 틈은 남김
import tabBouquet from '../assets/main/tab-logo.png'
import tabHome from '../assets/main/tab-home.svg'
import tabMypage from '../assets/main/tab-mypage.svg'
import './TabBar.css'

const TABS = [
  { key: 'bouquet', label: '부케구성', icon: tabBouquet, iconSize: [18, 18] },
  { key: 'home', label: '홈', icon: tabHome, iconSize: [24, 24] },
  { key: 'mypage', label: '마이페이지', icon: tabMypage, iconSize: [16, 16] },
]

// 선택된 탭 뒤의 흰 칸이 스프링처럼 미끄러지고, 아이콘은 흰색 ↔ 초록으로 바뀜
function TabBar({ active, onChange }) {
  const [selected, setSelected] = useState(active)
  const pillRef = useRef(null)
  const index = TABS.findIndex((tab) => tab.key === selected)

  const select = (key) => {
    if (key === selected) return
    setSelected(key)
    // 이동하는 동안 가로로 살짝 늘어났다가 돌아오는 쫀득한 느낌
    pillRef.current?.animate(
      [{ scale: '1 1' }, { scale: '1.14 0.93', offset: 0.35 }, { scale: '1 1' }],
      { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
    onChange?.(key)
  }

  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <span ref={pillRef} className="tab-bar__pill" style={{ '--tab-index': index }} aria-hidden="true" />
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className="tab-bar__item"
          aria-current={tab.key === selected ? 'page' : undefined}
          onClick={() => select(tab.key)}
        >
          <span className="tab-bar__icon">
            <span
              className="tab-bar__glyph"
              style={{
                width: tab.iconSize[0],
                height: tab.iconSize[1],
                // 작은 SVG는 data URI로 들어오므로 따옴표로 감싸야 유효한 CSS가 됨
                maskImage: `url("${tab.icon}")`,
                WebkitMaskImage: `url("${tab.icon}")`,
              }}
            />
          </span>
          <span className="tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default TabBar
