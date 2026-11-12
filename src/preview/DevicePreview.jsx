import { useLayoutEffect, useRef, useState } from 'react'
import './DevicePreview.css'

// iPhone 13 화면 기준
const SCREEN_WIDTH = 390
const SCREEN_HEIGHT = 844
const BEZEL = 14
const FRAME_WIDTH = SCREEN_WIDTH + BEZEL * 2
const FRAME_HEIGHT = SCREEN_HEIGHT + BEZEL * 2

// 무대의 실제 여유 공간(여백 제외)에 프레임 전체가 들어가도록 축소 (확대는 하지 않음)
const getScale = (stage) => {
  const style = getComputedStyle(stage)
  const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
  return Math.min(1, width / FRAME_WIDTH, height / FRAME_HEIGHT)
}

// 데스크톱 브라우저에서 앱을 iPhone 13 목업 안에 보여주는 프리뷰 래퍼.
// 앱은 390×844 iframe 안에서 실제 기기처럼(100dvh, fixed, 스크롤) 동작한다.
function DevicePreview({ src }) {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const update = () => setScale(getScale(stage))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={stageRef} className="device-stage">
      <div className="device" style={{ transform: `scale(${scale})` }}>
        <span className="device__button device__button--silent" />
        <span className="device__button device__button--vol-up" />
        <span className="device__button device__button--vol-down" />
        <span className="device__button device__button--power" />

        <div className="device__screen">
          <iframe className="device__app" src={src} title="Quiet Bloom 앱 미리보기" />
          <div className="device__notch" aria-hidden="true">
            <span className="device__speaker" />
            <span className="device__camera" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DevicePreview
