import { useEffect, useState } from 'react'
import frame from '../assets/compose/detail-frame.svg'
import lastingIcon from '../assets/compose/icon-lasting.svg'
import waterIcon from '../assets/compose/icon-water.svg'
import './PlantDetail.css'

// 식물 상세 팝업 (Figma 2268:18608). 배경을 누르면 닫힘.
// onToggle이 없으면(완성한 부케의 Composition 등 보기만 하는 곳) 아래 버튼은 '닫기'
function PlantDetail({ plant, selected, onToggle, onClose }) {
  const [closing, setClosing] = useState(false)
  const { detail } = plant

  const close = () => {
    if (closing) return
    setClosing(true)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTimeout(onClose, reduceMotion ? 0 : 260)
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
    <div className="plant-detail" data-closing={closing} onClick={close}>
      <section
        className="plant-detail__card"
        role="dialog"
        aria-modal="true"
        aria-label={`${plant.name} 상세 정보`}
        onClick={(e) => e.stopPropagation()}
      >
        <img className="plant-detail__frame" src={frame} alt="" />

        <div className="plant-detail__visual">
          {detail.frame ? (
            // 카드 사진을 잘라 크게 보여줌 — frame: 사진 칸 [left, top, width, height] / crop: 원본 [width%, height%, left%, top%]
            <span
              className="plant-detail__image plant-detail__image--crop"
              style={{ left: detail.frame[0], top: detail.frame[1], width: detail.frame[2], height: detail.frame[3] }}
            >
              <img
                src={plant.photo.src}
                alt=""
                style={{
                  width: `${detail.crop[0]}%`,
                  height: `${detail.crop[1]}%`,
                  left: `${detail.crop[2]}%`,
                  top: `${detail.crop[3]}%`,
                }}
              />
            </span>
          ) : (
            <img className="plant-detail__image" src={detail.image} alt="" />
          )}
        </div>

        <h2 className="plant-detail__name">{plant.name}</h2>
        <p className="plant-detail__desc">
          {detail.desc.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>

        <p className="plant-detail__tags">
          <span>저자극 : {detail.lowIrritant ? 'ON' : 'OFF'}</span>
          <span>향 노출 : {detail.scent}</span>
        </p>

        <dl className="plant-detail__info">
          <div className="plant-detail__info-item">
            <span className="plant-detail__icon">
              <img src={lastingIcon} alt="" />
            </span>
            <dt>유지기간</dt>
            <dd>{detail.lasting}</dd>
          </div>
          <div className="plant-detail__info-item">
            <span className="plant-detail__icon">
              <img src={waterIcon} alt="" />
            </span>
            <dt>물교체</dt>
            <dd>{detail.water}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="plant-detail__add"
          onClick={() => {
            onToggle?.()
            close()
          }}
        >
          {!onToggle ? '닫기' : selected ? '빼기' : '추가하기'}
        </button>
      </section>
    </div>
  )
}

export default PlantDetail
