import { useState } from 'react'
import { useLocation } from 'react-router'
import backIcon from '../assets/edit/back.svg'
import sensitivityCard from '../assets/edit/sensitivity-card.svg'
import chipClose from '../assets/edit/chip-close.svg'
import budgetIcon from '../assets/edit/icon-budget.svg'
import budgetIconInactive from '../assets/edit/icon-budget-inactive.svg'
import sproutIcon from '../assets/edit/icon-sprout-active.svg'
import sproutIconInactive from '../assets/edit/icon-sprout.svg'
import { updateProfile, useProfile } from '../data/profile'
import { usePageBackground } from '../hooks/usePageBackground'
import { usePageLeave } from '../hooks/usePageLeave'
import './EditConditions.css'

// 선택: 흰 아이콘 + 발광 / 비선택: 회색 아이콘
const CRITERIA = [
  { key: '예산', icon: budgetIcon, iconInactive: budgetIconInactive },
  { key: '유지력', icon: sproutIcon, iconInactive: sproutIconInactive },
]

function EditConditions() {
  usePageBackground('#d9e4c8')
  const profile = useProfile()
  const [leaving, leave] = usePageLeave(280)

  // 홈 Bloom Profile의 ↗ 버튼으로 오면 'Bloom Profile', Make 화면의 '조건 수정하기'로 오면 'Edit Conditions'
  const from = useLocation().state?.from
  // 홈 카드 ↗ 또는 마이페이지 My Bloom Profile에서 들어오면 'Bloom Profile' 제목
  const fromProfile = from === 'profile' || from === 'mypage'
  const returnTo = { make: '/make', mypage: '/mypage' }[from] ?? '/'

  // 적용 전까지는 이 화면 안에서만 수정
  const [lowIrritant, setLowIrritant] = useState(profile.lowIrritant)
  const [lowScent, setLowScent] = useState(profile.lowScent)
  const [excluded, setExcluded] = useState(profile.excludedPlants)
  const [criteria, setCriteria] = useState(profile.criteria[0] ?? '예산')
  const [draft, setDraft] = useState('')

  const addPlant = () => {
    const name = draft.trim()
    if (name && !excluded.includes(name)) setExcluded([...excluded, name])
    setDraft('')
  }

  const apply = () => {
    updateProfile({ lowIrritant, lowScent, excludedPlants: excluded, criteria: [criteria] })
    leave(returnTo)
  }

  return (
    <div className="edit" data-leaving={leaving}>
      <header className="edit__header">
        <button type="button" className="edit__back" aria-label="뒤로" onClick={() => leave(returnTo)}>
          <img src={backIcon} alt="" />
        </button>
        {fromProfile ? (
          <>
            <h1 className="edit__title">Bloom Profile</h1>
            <p className="edit__desc">민감도 조건이 맞는지 확인해주세요.</p>
          </>
        ) : (
          <>
            <h1 className="edit__title">Edit Conditions</h1>
            <p className="edit__desc">부케 구성에 적용할 민감도와 추천 조건을 수정해보세요.</p>
          </>
        )}
      </header>

      <section className="edit__section edit__section--sensitivity">
        <h2 className="edit__section-title">Sensitivity</h2>
        <div className="sensitivity">
          <img className="sensitivity__shape" src={sensitivityCard} alt="" />
          {/* 카드 모양 그대로 덮는 유리 광택 + 옅은 질감 (모양은 SVG를 마스크로) */}
          <span
            className="sensitivity__sheen"
            style={{ maskImage: `url("${sensitivityCard}")`, WebkitMaskImage: `url("${sensitivityCard}")` }}
            aria-hidden="true"
          />

          <div className="sensitivity__row">
            <span className="sensitivity__text">
              <span className="sensitivity__label">저자극</span>
              <span key={String(lowIrritant)} className="sensitivity__caption">
                저자극 필터 {lowIrritant ? 'on' : 'off'}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lowIrritant}
              aria-label="저자극"
              className="edit-toggle"
              onClick={() => setLowIrritant(!lowIrritant)}
            >
              <span className="edit-toggle__knob" />
            </button>
          </div>

          <div className="sensitivity__row">
            <span className="sensitivity__text">
              <span className="sensitivity__label">저향</span>
              <span key={String(lowScent)} className="sensitivity__caption">
                향 노출 제어 {lowScent ? 'on' : 'off'}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lowScent}
              aria-label="저향"
              className="edit-toggle"
              onClick={() => setLowScent(!lowScent)}
            >
              <span className="edit-toggle__knob" />
            </button>
          </div>
        </div>
      </section>

      <section className="edit__section">
        <h2 className="edit__section-title">Preferences</h2>

        <div className="pref-card pref-card--exclude" data-empty={excluded.length === 0}>
          <h3 className="pref-card__title">제외 식물</h3>
          {excluded.length > 0 && (
            <div className="pref-chips">
              {excluded.map((plant) => (
                <span key={plant} className="pref-chip">
                  <span className="pref-chip__label">{plant}</span>
                  <button
                    type="button"
                    className="pref-chip__remove"
                    aria-label={`${plant} 삭제`}
                    onClick={() => setExcluded(excluded.filter((p) => p !== plant))}
                  >
                    <img src={chipClose} alt="" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* 입력칸 오른쪽에 붙은 작은 추가 버튼 (아래 '조건 적용하기'만 주인공 버튼) */}
          <div className="pref-field">
            <input
              className="pref-input"
              value={draft}
              placeholder="피하고 싶은 식물 입력"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) addPlant()
              }}
            />
            <button type="button" className="pref-add" onClick={addPlant} disabled={!draft.trim()}>
              추가
            </button>
          </div>
        </div>

        <div className="pref-card pref-card--criteria">
          <h3 className="pref-card__title">추천 기준</h3>
          <div className="criteria" role="radiogroup" aria-label="추천 기준">
            {CRITERIA.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={criteria === item.key}
                className="criteria__option"
                onClick={() => setCriteria(item.key)}
              >
                <span className="criteria__icon">
                  <img className="criteria__icon-off" src={item.iconInactive} alt="" />
                  <img className="criteria__icon-on" src={item.icon} alt="" width="16.5636" height="16.5636" />
                </span>
                {item.key}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button type="button" className="edit__apply" onClick={apply}>
        조건 적용하기
      </button>
    </div>
  )
}

export default EditConditions
