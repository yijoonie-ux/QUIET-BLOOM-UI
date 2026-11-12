import { useEffect, useRef } from 'react'
import './BouquetLoader.css'


const DRIFT = 1400 // 가운데에서 파티클 구름이 맴도는 시간 (로딩)
const APPEAR = 700 // 파티클이 하나둘 나타나는 시간
const SCATTER_DELAY = 500 // 파티클마다 출발을 엇갈리는 최대 시간
const FLIGHT = 1500 // 파티클이 실루엣 자리로 흘러가는 시간
const REVEAL = 650 // 실루엣이 실제 이미지로 바뀌는 시간
const STEP = 3.4 // 실루엣에서 점을 뽑는 간격(px)
const ORBIT = 0.0011 // 구름이 맴도는 속도(rad/ms)

const SAGE = [122, 147, 89] // #7a9359 부드럽고 약간 진한 세이지 그린

const easeOutCubic = (t) => 1 - (1 - t) ** 3
// 흘러가기: 맴돌던 속도 그대로 바로 출발해 길게 미끄러지며 자리를 잡음
const easeOutQuint = (t) => 1 - (1 - t) ** 5
const clamp01 = (t) => Math.min(1, Math.max(0, t))

// 부케 제작하기 → 프리뷰 사이 로딩 (파티클만)
// 가운데에 작은 파티클들이 하나둘 나타나 먼지구름처럼 숨 쉬며 맴돌다가
// → 같은 방향으로 휘어 흘러가 부케 실루엣을 이루고 → 실제 부케 이미지로 바뀜
// box: 프리뷰의 부케 이미지 자리 [너비, 높이, 가운데 기준 x, top] (bouquets.js preview.box)
// crop: 상자 안 사진 배치 [너비%, 높이%, 왼쪽%, 위%] (없으면 꽉 채움)
function BouquetLoader({ image, box, crop, onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const BOUQUET = { width: box[0], height: box[1], offsetX: box[2], top: box[3] }
    // 상자 안에서 사진을 그릴 자리
    const place = crop
      ? [
          (crop[2] / 100) * box[0],
          (crop[3] / 100) * box[1],
          (crop[0] / 100) * box[0],
          (crop[1] / 100) * box[1],
        ]
      : [0, 0, box[0], box[1]]
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let doneTimer = 0
    let cancelled = false

    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const vw = canvas.clientWidth
    const vh = canvas.clientHeight
    canvas.width = vw * dpr
    canvas.height = vh * dpr
    ctx.scale(dpr, dpr)

    const bx = (vw - BOUQUET.width) / 2 + BOUQUET.offsetX
    const by = BOUQUET.top
    // 구름은 화면 정가운데에서 맴돎 (부케 이미지가 옆으로 비켜 있어도 쏠려 보이지 않게)
    const cx = vw / 2
    const cy = by + BOUQUET.height / 2

    const img = new Image()
    img.onload = () => {
      if (cancelled) return

      // 부케 이미지를 프리뷰와 같은 크기로 그려 불투명한 곳만 파티클의 도착 자리로
      const sample = document.createElement('canvas')
      sample.width = BOUQUET.width
      sample.height = BOUQUET.height
      const sctx = sample.getContext('2d', { willReadFrequently: true })
      sctx.drawImage(img, place[0], place[1], place[2], place[3])
      const { data } = sctx.getImageData(0, 0, BOUQUET.width, BOUQUET.height)
      const particles = []
      for (let y = 0; y < BOUQUET.height; y += STEP) {
        for (let x = 0; x < BOUQUET.width; x += STEP) {
          const jx = x + (Math.random() - 0.5) * STEP
          const jy = y + (Math.random() - 0.5) * STEP
          const px = Math.min(BOUQUET.width - 1, Math.max(0, Math.round(jx)))
          const py = Math.min(BOUQUET.height - 1, Math.max(0, Math.round(jy)))
          if (data[(py * BOUQUET.width + px) * 4 + 3] < 140) continue
          // 가운데에 가까운 자리부터 출발 → 실루엣이 안쪽에서 바깥으로 피어나듯 채워짐
          const dist = Math.hypot(bx + jx - cx, by + jy - cy) / (BOUQUET.height / 2)
          // 구름 속 자리: 구멍 없이 가운데가 조금 더 촘촘하고 바깥으로 갈수록 성긴 둥근 먼지구름
          const cloud = 2 + 76 * Math.random() ** 0.8
          particles.push({
            tx: bx + jx,
            ty: by + jy,
            angle: Math.random() * Math.PI * 2,
            cloud,
            // 안쪽 파티클이 조금 더 빨리 돌아 소용돌이 결이 생김
            spin: ORBIT * (0.7 + 0.6 * (1 - cloud / 76)),
            phase: Math.random() * Math.PI * 2,
            show: Math.random() * APPEAR,
            delay: Math.min(1, dist) * SCATTER_DELAY * 0.75 + Math.random() * SCATTER_DELAY * 0.25,
            // 맴돌던 방향으로 모두 같은 쪽으로 휘어 흐름
            swirl: 50 + Math.random() * 90,
            r: 0.7 + Math.random() * 0.6,
            shade: 0.55 + Math.random() * 0.45,
          })
        }
      }

      // 구름 속 파티클 위치: 천천히 맴돌며 반지름이 살짝 숨 쉬듯 늘었다 줄었다
      const cloudPos = (p, t) => {
        const a = p.angle + t * p.spin
        const breathe = 1 + 0.08 * Math.sin(t / 520 + p.phase)
        return { x: cx + Math.cos(a) * p.cloud * breathe, y: cy + Math.sin(a) * p.cloud * breathe }
      }

      const start = performance.now()
      const total = DRIFT + SCATTER_DELAY + FLIGHT + REVEAL
      ctx.fillStyle = `rgb(${SAGE[0]}, ${SAGE[1]}, ${SAGE[2]})`

      const draw = (now) => {
        const t = now - start
        const ft = t - DRIFT
        ctx.clearRect(0, 0, vw, vh)

        // 실루엣이 다 모이면 실제 부케 이미지로 부드럽게 바뀜
        const reveal = clamp01((ft - SCATTER_DELAY - FLIGHT + 150) / REVEAL)
        const particleAlpha = 1 - reveal

        if (particleAlpha > 0) {
          for (const p of particles) {
            const appear = easeOutCubic(clamp01((t - p.show) / 500))
            if (appear <= 0) continue
            const s = cloudPos(p, t)
            const k = clamp01((ft - p.delay) / FLIGHT)
            let x = s.x
            let y = s.y
            let size = 0.6
            // 맴도는 동안은 옅게, 흘러가며 점점 또렷해짐
            let tone = 0.55
            if (k > 0) {
              const e = easeOutQuint(k)
              const dx = p.tx - s.x
              const dy = p.ty - s.y
              const len = Math.hypot(dx, dy) || 1
              const bend = Math.sin(e * Math.PI) * p.swirl
              x = s.x + dx * e + (-dy / len) * bend
              y = s.y + dy * e + (dx / len) * bend
              size = 0.6 + 0.4 * e
              tone = 0.55 + 0.45 * e
            }
            ctx.globalAlpha = appear * tone * p.shade * particleAlpha
            ctx.beginPath()
            ctx.arc(x, y, p.r * size, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1
        }

        if (reveal > 0) {
          ctx.globalAlpha = reveal
          ctx.drawImage(img, bx + place[0], by + place[1], place[2], place[3])
          ctx.globalAlpha = 1
        }

        if (t < total) {
          frame = requestAnimationFrame(draw)
        } else {
          onDone()
        }
      }

      if (reduceMotion) {
        ctx.drawImage(img, bx + place[0], by + place[1], place[2], place[3])
        doneTimer = setTimeout(onDone, 600)
      } else {
        frame = requestAnimationFrame(draw)
      }
    }
    img.src = image

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      clearTimeout(doneTimer)
    }
    // box·crop은 부케 유형마다 고정이라 배열 내용이 같으면 다시 시작하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, onDone, box.join(), crop?.join()])

  return (
    <div className="bl fit-screen" role="status" aria-label="부케를 만들고 있어요">
      <canvas ref={canvasRef} className="bl__canvas" aria-hidden="true" />
    </div>
  )
}

export default BouquetLoader
