import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { watchAppHeight } from './appHeight'
import DevicePreview from './preview/DevicePreview.jsx'
import './preview/embedded.css'

// 목업 iframe 안에서 실행 중인지
const isEmbedded = window.self !== window.top
// 데스크톱처럼 넓은 화면에서만 iPhone 13 목업으로 감싸서 보여줌 (모바일은 앱 그대로, ?frame=off 로 끌 수 있음)
const showDevicePreview =
  !isEmbedded &&
  window.matchMedia('(min-width: 600px)').matches &&
  new URLSearchParams(window.location.search).get('frame') !== 'off'

if (showDevicePreview) {
  document.documentElement.classList.add('device-preview-mode')
  const container = document.createElement('div')
  document.body.appendChild(container)
  createRoot(container).render(
    <StrictMode>
      <DevicePreview src={window.location.pathname} />
    </StrictMode>,
  )
} else {
  if (isEmbedded) document.documentElement.classList.add('is-embedded')
  // iOS 홈 화면 앱이 첫 실행 때 화면 높이를 짧게 잡는 문제 → 기기 화면 높이를 --app-h로
  watchAppHeight()
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
