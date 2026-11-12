import { useState } from 'react'
import { findBouquet } from '../data/bouquets'
import { PLANTS } from '../data/plants'
import { findSubstitutes, isSoldOut, shopsFor } from '../data/sourcing'
import { stylingFor } from '../data/styling'
import './BloomInfo.css'

// TODO: 식물별 관리 정보 연동 전까지 쓰는 공통 관리 팁
const CARE_TIPS = [
  { title: '줄기 손질', desc: '받자마자 끝을 사선으로 1cm 잘라 물을 올려주세요.' },
  { title: '물 높이', desc: '화병의 1/3까지만, 잎이 물에 잠기지 않게 해주세요.' },
  { title: '두는 곳', desc: '직사광선과 냉난방 바람이 닿지 않는 곳이 좋아요.' },
  { title: '시든 잎', desc: '바로 정리하면 다른 식물이 더 오래가요.' },
]

// 작은 식물 사진 (카드 사진 crop을 칸 높이에 맞춰)
function Thumb({ plant }) {
  const { photo } = plant
  const scale = photo ? 44 / photo.frame[3] : 1
  return (
    <span className="bi-thumb" aria-hidden="true">
      {photo && (
        <span className="bi-thumb__photo" style={{ width: photo.frame[2] * scale, height: photo.frame[3] * scale }}>
          <img
            src={photo.src}
            alt=""
            style={{
              width: `${photo.crop[0]}%`,
              height: `${photo.crop[1]}%`,
              left: `${photo.crop[2]}%`,
              top: `${photo.crop[3]}%`,
            }}
          />
        </span>
      )}
    </span>
  )
}

// Bloom Details 아래쪽 정보
// 구매처(품절이면 대체 식물) · 관리 정보 (AI Preview 결과는 화면 맨 위 사진)
// careOnly: 관리 정보만 (완성 화면 — 구매처는 앞 단계 Make This Bloom에서 확인)
// recipe: 실제로 쓴 구성(대체 식물로 바꾼 것 포함) — 없으면 부케 기본 레시피
// swaps: 대체한 식물 { 새 식물: 원래 식물 } — 품절 표시 대신 'OO 대신' 으로
function BloomInfo({ bouquetKey, resultKey, recipe, swaps = {}, decor, form, careOnly = false }) {
  const bouquet = findBouquet(bouquetKey)
  const [open, setOpen] = useState(null)
  if (!bouquet) return null
  const styling = stylingFor(resultKey, decor, form)

  const profile = { lowIrritant: bouquet.when.lowIrritant, lowScent: bouquet.when.lowScent, excludedPlants: [] }
  const items = (recipe ?? bouquet.recipe)
    .map(([name, qty]) => ({ plant: PLANTS.find((p) => p.name === name), qty }))
    .filter((item) => item.plant)
  const cartNames = items.map((item) => item.plant.name)

  return (
    <>
      {!careOnly && (
        <>
          {/* 구매처: 식물을 누르면 그 식물을 구할 수 있는 곳이 펼쳐짐 (품절이면 대체 식물) */}
          <section className="bd__section bi-sec">
            <h3 className="bd__heading">Where to Buy</h3>
            <p className="bi-desc">식물을 누르면 구할 수 있는 곳을 볼 수 있어요.</p>

            <ul className="bi-group">
              {items.map(({ plant, qty }) => {
                const soldOut = isSoldOut(bouquet.key, plant.name)
                const subs = soldOut ? findSubstitutes(plant.name, { profile, cartNames, bouquetKey: bouquet.key }) : []
                const isOpen = open === plant.name
                return (
                  <li key={plant.name} className="bi-item" data-open={isOpen}>
                    <button
                      type="button"
                      className="bi-row"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : plant.name)}
                    >
                      <Thumb plant={plant} />
                      <span className="bi-row__text">
                        <span className="bi-row__name">
                          {plant.name}
                          <span>{qty}개</span>
                        </span>
                        {swaps[plant.name] && <span className="bi-row__sub">{swaps[plant.name]} 대신</span>}
                      </span>
                      <span className="bi-status" data-tone={soldOut ? 'bad' : 'ok'}>
                        {soldOut ? '이번 주 품절' : '구매 가능'}
                      </span>
                      <svg className="bi-row__chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                        <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* 펼친 내용: 높이를 부드럽게 열고 닫음 */}
                    <div className="bi-more">
                      <div className="bi-more__inner">
                        {soldOut ? (
                          <div className="bi-more__box">
                            <span className="bi-more__label">대신 이 식물을 써보세요</span>
                            {subs.map(({ plant: sub, reasons }) => (
                              <div key={sub.name} className="bi-line">
                                <span className="bi-row__text">
                                  <span className="bi-row__name">{sub.name}</span>
                                  <span className="bi-line__note">{reasons.join(' · ')}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bi-more__box">
                            {shopsFor(bouquet.key, plant.name).map((shop) => (
                              <a key={shop.name} className="bi-line" href={shop.url} target="_blank" rel="noreferrer">
                                <span className="bi-row__text">
                                  <span className="bi-row__name">{shop.name}</span>
                                  <span className="bi-line__note">{shop.note}</span>
                                </span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                  <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* 연출 소재: AI Preview 연출(화병·행잉·포장)과 장식 — 누르면 바로 구할 수 있는 곳으로 */}
            {styling.length > 0 && (
              <>
                <p className="bi-sublabel">연출 소재</p>
                <ul className="bi-group bi-styling">
                  {styling.map((s) => (
                    <li key={s.key}>
                      <a className="bi-line bi-line--styling" href={s.url} target="_blank" rel="noreferrer">
                        <span className="bi-row__text">
                          <span className="bi-row__name">{s.name}</span>
                          <span className="bi-line__note">{s.note}</span>
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {/* 관리 정보 */}
      <section className="bd__section bi-sec">
        <h3 className="bd__heading">Care Guide</h3>
        <ol className="bi-group bi-tips">
          {CARE_TIPS.map((tip, i) => (
            <li key={tip.title} className="bi-tip">
              <span className="bi-tip__num">{i + 1}</span>
              <span className="bi-row__text">
                <strong className="bi-tip__title">{tip.title}</strong>
                <span className="bi-tip__desc">{tip.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export default BloomInfo
