import { useEffect, useRef } from 'react'

// 홈 슬라이더와 같은 파티클 색: 흰색과 연한 라임이 고르게 섞임
const COLORS = ['255, 255, 255', '255, 255, 255', '232, 252, 190', '196, 240, 106', '178, 226, 92']
const PAD = 90 // 카드 바깥으로 파티클이 퍼질 여유
const rand = (a, b) => a + Math.random() * (b - a)

// 카드가 나타날 때 카드 아래쪽에서 반짝이는 파티클이 피어올라 둘레로 퍼짐
// width/height: 카드 크기, delay/duration: 파티클이 나오는 시간(ms)
function CardSparkles({ width, height, delay = 300, duration = 1300 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = width + PAD * 2
    const H = height + PAD * 2
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const particles = []
    let frame = 0
    let last = performance.now()
    const start = last

    const spawn = (count) => {
      for (let i = 0; i < count; i++) {
        // 대부분 카드 아래 가장자리에서, 일부는 양옆 아래쪽에서
        const fromSide = Math.random() < 0.25
        const side = Math.random() < 0.5 ? 0 : 1
        particles.push({
          x: fromSide ? PAD + side * width + rand(-6, 6) : PAD + rand(0.05, 0.95) * width,
          y: fromSide ? PAD + height * rand(0.55, 1) : PAD + height + rand(-8, 10),
          vx: fromSide ? (side ? 1 : -1) * rand(0.01, 0.05) : rand(-0.035, 0.035),
          vy: -rand(0.03, 0.11),
          r: rand(1.2, 3.2),
          life: rand(900, 1700),
          age: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          twinkle: rand(0.006, 0.014),
          phase: rand(0, Math.PI * 2),
        })
      }
    }

    const draw = (now) => {
      const dt = Math.min(40, now - last)
      last = now
      const t = now - start - delay
      // 카드가 도는 동안 파티클이 피어오름 (처음에 많이, 갈수록 잦아듦)
      if (t > 0 && t < duration) spawn(Math.round(11 * (1 - t / duration)) + 2)

      ctx.clearRect(0, 0, W, H)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.age += dt
        if (p.age >= p.life) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy *= 0.995
        const k = p.age / p.life
        const twinkle = 0.75 + 0.25 * Math.sin(p.phase + p.age * p.twinkle)
        const alpha = Math.min(1, Math.pow(1 - k, 1.35) * twinkle * 1.05) * Math.min(1, p.age / 120)
        const r = p.r * (1 - 0.45 * k)
        ctx.shadowColor = `rgba(${p.color}, ${alpha})`
        ctx.shadowBlur = r * 6
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (t < duration || particles.length > 0) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, W, H)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [width, height, delay, duration])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -PAD,
        left: -PAD,
        width: width + PAD * 2,
        height: height + PAD * 2,
        zIndex: 1, // 카드 아래 가장자리에서 피어오르는 파티클이 카드에 가려지지 않게
        pointerEvents: 'none',
      }}
    />
  )
}

export default CardSparkles
