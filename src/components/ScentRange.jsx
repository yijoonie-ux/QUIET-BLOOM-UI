import { useId } from 'react'
import './ScentRange.css'

// 향 노출 2단계 표시 (Figma 2268:17869 벡터 그대로)
// off: 왼쪽 흰 점만 (향 노출 제어 off) / on: 선이 이어지며 오른쪽 연두 점까지 (향 노출 제어 on)
// offTone="neutral": 꺼져 있을 때 트랙을 회색으로 (온보딩 2268:20554)
function ScentRange({ on, offTone, width = 126.919, height = 53.8523 }) {
  const id = useId().replace(/:/g, '')

  return (
    <svg
      className="scent-range"
      data-on={on}
      data-off-tone={offTone}
      width={width}
      height={height}
      viewBox="0 0 126.919 53.8523"
      preserveAspectRatio="none"
      overflow="visible"
      fill="none"
      aria-hidden="true"
    >
      <g filter={`url(#${id}-track)`}>
        <use className="scent-range__track" href={`#${id}-shape`} fill="#AFC590" />
        <use className="scent-range__track-tint" href={`#${id}-shape`} fill={`url(#${id}-track-fill)`} fillOpacity="0.5" />
      </g>
      <g filter={`url(#${id}-shadow-white)`}>
        <circle cx="26.9261" cy="23.7409" r="11" fill="white" />
        <circle cx="26.9261" cy="23.7409" r="10.0326" stroke="white" strokeWidth="1.93483" />
      </g>
      <g className="scent-range__knob-on" filter={`url(#${id}-shadow-lime)`}>
        <circle cx="99.9926" cy="23.7409" r="11" fill="#DAFFA9" />
        <circle cx="99.9926" cy="23.7409" r="10.0326" stroke="#DAFFA9" strokeWidth="1.93483" />
      </g>
      <path
        className="scent-range__line"
        d="M36.5902 23.7409H42.4252L90.9351 23.7409"
        pathLength="1"
        strokeWidth="8"
        stroke={`url(#${id}-line)`}
      />
      <defs>
        <filter id={`${id}-track`} x="10.0303" y="6.84505" width="105.962" height="34.0193" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="-0.89587" dy="-0.89587" />
          <feGaussianBlur stdDeviation="0.447935" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="-0.89587" dy="1.12343" />
          <feGaussianBlur stdDeviation="0.730227" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.486275 0 0 0 0 0.623529 0 0 0 0 0.2 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="effect1_innerShadow" result="effect2_innerShadow" />
        </filter>
        <filter id={`${id}-shadow-white`} x="0" y="0" width="53.8523" height="53.8523" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3.18523" />
          <feGaussianBlur stdDeviation="7.96307" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <filter id={`${id}-shadow-lime`} x="73.0664" y="0" width="53.8523" height="53.8523" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3.18523" />
          <feGaussianBlur stdDeviation="7.96307" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.768627 0 0 0 0 0.941176 0 0 0 0 0.415686 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <linearGradient id={`${id}-track-fill`} x1="15.7292" y1="9.43924" x2="91.7551" y2="72.4339" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9D9B4" />
          <stop offset="1" stopColor="#DAE8B2" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="35.9352" y1="23.7409" x2="95.6639" y2="23.7409" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#DAFFA9" />
        </linearGradient>
        <path
          id={`${id}-shape`}
          d="M99.9926 7.74092C108.829 7.74092 115.992 14.9043 115.993 23.7409C115.993 32.5776 108.829 39.7409 99.9926 39.7409C94.4932 39.7409 89.642 36.9666 86.7621 32.7409H40.1566C37.2767 36.9666 32.4256 39.7409 26.9262 39.7409C18.0896 39.7409 10.9262 32.5776 10.9262 23.7409C10.9263 14.9043 18.0897 7.74092 26.9262 7.74092C32.4252 7.74092 37.2756 10.5157 40.1556 14.7409H86.7631C89.6431 10.5157 94.4935 7.74092 99.9926 7.74092Z"
        />
      </defs>
    </svg>
  )
}

export default ScentRange
