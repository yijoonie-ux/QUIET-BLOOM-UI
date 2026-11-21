import { findBouquet } from '../data/bouquets'
import { PLANTS } from '../data/plants'
import { storeFor, storeUrl } from '../data/sourcing'
import { stylingFor } from '../data/styling'
import './BloomInfo.css'

// TODO: 식물별 관리 정보 연동 전까지 쓰는 공통 관리 팁
const CARE_TIPS = [
  { title: '줄기 손질', desc: '받자마자 끝을 사선으로 1cm 잘라 물을 올려주세요.' },
  { title: '물 높이', desc: '화기의 1/3까지만, 잎이 물에 잠기지 않게 해주세요.' },
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
// Composition(식물 · 고른 구매처) · 연출 소재 · 관리 정보 (AI Preview 결과는 화면 맨 위 사진)
// careOnly: 관리 정보만 (완성 화면 — 구매처는 앞 단계 Make This Bloom에서 확인)
// recipe: 실제로 쓴 구성(대체 식물로 바꾼 것 포함) — 없으면 부케 기본 레시피
// swaps: 대체한 식물 { 새 식물: 원래 식물 } — 'OO 대신' 으로
// storeKey: Make This Bloom에서 고른 구매처 (없으면 추천 구매처)
// onOpenPlant: 식물 줄을 누르면 식물 상세 팝업
function BloomInfo({ bouquetKey, resultKey, recipe, swaps = {}, storeKey, onOpenPlant, decor, form, careOnly = false }) {
  const bouquet = findBouquet(bouquetKey)
  if (!bouquet) return null
  const styling = stylingFor(resultKey, decor, form)
  const store = storeFor(bouquet.key, storeKey)

  const items = (recipe ?? bouquet.recipe)
    .map(([name, qty]) => ({ plant: PLANTS.find((p) => p.name === name), qty }))
    .filter((item) => item.plant)

  return (
    <>
      {!careOnly && (
        <>
          {/* Composition: 식물(누르면 상세) + 구매처(Make This Bloom에서 고른 한 곳, 고른 적 없으면 추천 구매처)
              — 고른 곳에서 모두 구할 수 있으니 식물마다 펼치지 않음 */}
          <section className="bd__section bi-sec">
            <h3 className="bd__heading">Composition</h3>

            <ul className="bi-group">
              {items.map(({ plant, qty }) => (
                <li key={plant.name} className="bi-plant">
                  <button
                    type="button"
                    className="bi-row"
                    aria-label={`${plant.name} 상세 정보`}
                    onClick={onOpenPlant && plant.detail ? () => onOpenPlant(plant) : undefined}
                  >
                    <Thumb plant={plant} />
                    <span className="bi-row__text">
                      <span className="bi-row__name">
                        {plant.name}
                        <span>{qty}개</span>
                      </span>
                      {swaps[plant.name] && <span className="bi-row__sub">{swaps[plant.name]} 대신</span>}
                    </span>
                  </button>
                  {/* 온라인 구매처면 식물마다 상품 링크 ↗ */}
                  {!store.url && (
                    <a
                      className="bi-plant__link"
                      href={storeUrl(store, plant.name)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${plant.name} 상품 보기`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <p className="bi-sublabel">구매처</p>
            <ul className="bi-group">
              <li>
                {store.url ? (
                  <a className="bi-line bi-store" href={store.url} target="_blank" rel="noreferrer">
                    <span className="bi-row__text">
                      <span className="bi-row__name">{store.name}</span>
                      <span className="bi-line__note">{store.note}</span>
                    </span>
                    {/* 꽃시장은 지도에서 위치 (아래 연출 소재처럼 ↗ 만) */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ) : (
                  <div className="bi-line bi-store">
                    <span className="bi-row__text">
                      <span className="bi-row__name">{store.name}</span>
                      <span className="bi-line__note">{store.note}</span>
                    </span>
                  </div>
                )}
              </li>
            </ul>

            {/* 연출 소재: AI Preview 연출(화기·행잉·포장)과 장식 — 누르면 바로 구할 수 있는 곳으로 */}
            {styling.length > 0 && (
              <>
                <p className="bi-sublabel">연출 소재</p>
                <ul className="bi-group bi-styling">
                  {styling.map((s) => (
                    <li key={s.key}>
                      <a className="bi-line bi-line--styling" href={s.url} target="_blank" rel="noreferrer">
                        <span className="bi-row__text">
                          <span className="bi-row__name">{s.name}</span>
                          {s.note && <span className="bi-line__note">{s.note}</span>}
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
