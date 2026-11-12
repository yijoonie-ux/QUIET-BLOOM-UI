// Quiet Bloom 발표 1장 모션
// Still 화면: 방향키(←↑→↓) / Enter / Space / PageUp·Down / 클릭 → Hush로
// Hush 화면: ← / ↑ / PageUp / 클릭 → Still로
// R: 처음부터 다시 재생 · F: 전체화면
;(() => {
  const stage = document.getElementById('stage')
  const $ = (sel) => stage.querySelector(sel)
  const $$ = (sel) => [...stage.querySelectorAll(sel)]

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const supportsLinear = CSS.supports('animation-timing-function', 'linear(0, 1)')

  const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
  const QUART_IN_OUT = 'cubic-bezier(0.76, 0, 0.24, 1)'
  const EXPO_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'

  /* ---------- 스프링 → CSS linear() 이징 ---------- */
  // 감쇠 스프링을 시뮬레이션해 오버슈트까지 담긴 linear() 이징과 자연 지속시간을 만든다
  function spring({ stiffness = 170, damping = 26, mass = 1, velocity = 0 } = {}) {
    const dt = 1 / 120
    let x = 0
    let v = velocity
    let t = 0
    const pts = [0]
    while (t < 6) {
      const a = (-stiffness * (x - 1) - damping * v) / mass
      v += a * dt
      x += v * dt
      t += dt
      pts.push(x)
      if (Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break
    }
    if (!supportsLinear) return { easing: EXPO_OUT, duration: Math.round(t * 1000) }
    const stride = Math.max(1, Math.ceil(pts.length / 90))
    const sampled = pts.filter((_, i) => i % stride === 0)
    sampled.push(1)
    return { easing: `linear(${sampled.map((n) => +n.toFixed(4)).join(', ')})`, duration: Math.round(t * 1000) }
  }

  const SPRING = {
    soft: spring({ stiffness: 120, damping: 20 }), // 텍스트·UI 기본
    snappy: spring({ stiffness: 260, damping: 22 }), // 작은 요소 팝
    drop: spring({ stiffness: 90, damping: 15 }), // 행잉 낙하 (줄에 걸리는 반동)
    settle: spring({ stiffness: 70, damping: 11 }), // hush 줄기가 흔들리며 자리 잡음
  }

  // 감쇠 진동 키프레임 (착지 후 진자 흔들림)
  function dampedSwing(amplitude, period, decay, duration) {
    const frames = []
    const n = Math.round(duration / 33)
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * (duration / 1000)
      const deg = amplitude * Math.exp(-t / decay) * Math.sin((2 * Math.PI * t) / period)
      // offset을 명시해야 첫 프레임을 잘라도(implicit from) 타이밍이 유지됨
      frames.push({ transform: `rotate(${deg.toFixed(3)}deg)`, offset: i / n })
    }
    frames[n] = { transform: 'rotate(0deg)', offset: 1 }
    return frames
  }

  function animate(target, keyframes, options) {
    const opts = { fill: 'both', easing: EXPO_OUT, ...options }
    if (reduceMotion) {
      opts.duration = 1
      opts.delay = 0
      if (opts.iterations === Infinity) opts.iterations = 1
    }
    return target.animate(keyframes, opts)
  }

  // 끝난 애니메이션은 최종 스타일만 남기고 해제 → 합성 레이어가 풀려 이미지가 원본 해상도로 다시 그려짐
  const done = (anims) =>
    Promise.all(
      anims.flat().map((a) =>
        a.finished.then(
          () => {
            try {
              a.commitStyles()
              a.cancel()
            } catch {}
          },
          () => {},
        ),
      ),
    )

  /* ---------- 헤드라인 단어 분리 ---------- */
  $$('.headline .line > span').forEach((line) => {
    const words = line.textContent.split(/(\s+)/)
    line.textContent = ''
    words.forEach((w) => {
      if (!w) return
      if (/^\s+$/.test(w)) return line.append(w)
      const span = document.createElement('span')
      span.className = 'word'
      span.textContent = w
      line.append(span)
    })
  })

  const el = {
    logos: $$('.logo'),
    labels: $$('.label'),
    panel: $('.panel'),
    words: $$('.headline .word'),
    badges: $$('.badge'),
    icons: $$('.icon'),
    descLines: $$('.desc .line > span'),
    pills: $$('.pill'),
    card: $('.card'),
    arrow: $('.arrow'),
    still: $('.card__item--still'),
    hushItem: $('.card__item--hush'),
    hangDrop: $('.hang__drop'),
    hangSwing: $('.hang__swing'),
    hangIdle: $('.hang__idle'),
    hush: $('.hush__img'),
  }

  let step = 0 // 0 = Still(행잉), 1 = Hush(화병)
  let idleAnim = null

  // 진행 중인 애니메이션을 지금 보이는 모습 그대로 인라인 스타일로 고정하고 해제
  // → 다음 애니메이션이 첫 키프레임 없이(implicit from) 그 자리에서 이어받아, 언제 넘겨도 튀지 않음
  function freeze(...targets) {
    targets.forEach((t) =>
      t.getAnimations().forEach((a) => {
        if (a.effect.getTiming().iterations !== Infinity) {
          try {
            a.commitStyles()
          } catch {}
        }
        a.cancel()
      }),
    )
  }

  const isHidden = (t) => parseFloat(getComputedStyle(t).opacity) < 0.02
  const setStyle = (t, styles) => Object.assign(t.style, styles)

  /* ---------- 스테이지 스케일 ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080)
    stage.style.transform = `translate(-50%, -50%) scale(${s})`
  }
  addEventListener('resize', fit)
  fit()

  /* ---------- 행잉 식물 ---------- */

  function startIdle(delay) {
    idleAnim?.cancel()
    idleAnim = animate(
      el.hangIdle,
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(0.45deg)' },
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-0.45deg)' },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 7200, delay, iterations: Infinity, easing: 'ease-in-out', fill: 'none' },
    )
  }

  // 위에서 빠르게 떨어져 줄에 걸리며 살짝 튕기고 → 감쇠 진자 → 잔잔한 상시 흔들림
  // (화면 밖에 있으면 위에서 떨어지고, 올라가던 중이면 그 자리에서 다시 내려옴)
  function hangIn(delay, fromTop = false) {
    freeze(el.hangDrop, el.hangSwing)
    idleAnim?.cancel()
    const y = new DOMMatrix(getComputedStyle(el.hangDrop).transform).m42
    const offscreen = fromTop || isHidden(el.hangDrop) || y < -1000
    if (offscreen) setStyle(el.hangDrop, { transform: 'translateY(-1650px)', opacity: '0', filter: 'blur(10px)' })

    const land = Math.round(SPRING.drop.duration * 0.32)
    startIdle(delay + land + 3200)
    return [
      animate(el.hangDrop, [{ transform: 'none' }], { ...SPRING.drop, delay }),
      animate(
        el.hangDrop,
        offscreen
          ? [
              { opacity: 1, filter: 'blur(6px)', offset: 0.35 },
              { opacity: 1, filter: 'none' },
            ]
          : [{ opacity: 1, filter: 'none' }],
        { duration: land + 200, delay, easing: 'ease-out' },
      ),
      animate(el.hangSwing, dampedSwing(2.2, 1.9, 1.3, 3600).slice(1), {
        duration: 3600,
        delay: delay + land,
        easing: 'linear',
      }),
    ]
  }

  // 살짝 내려앉았다가(anticipation) 위로 쭉 끌려 올라감
  function hangOut(delay) {
    freeze(el.hangDrop, el.hangSwing)
    idleAnim?.cancel()
    return [
      animate(
        el.hangDrop,
        [
          { transform: 'translateY(36px)', filter: 'none', offset: 0.25, easing: 'cubic-bezier(0.55, 0, 0.75, 0.1)' },
          { transform: 'translateY(-1700px)', filter: 'blur(12px)' },
        ],
        { duration: 820, delay, easing: 'linear' },
      ),
      animate(
        el.hangSwing,
        [
          { transform: 'rotate(-1.2deg)', offset: 0.3 },
          { transform: 'rotate(1.6deg)' },
        ],
        { duration: 820, delay, easing: 'ease-in-out' },
      ),
    ]
  }

  /* ---------- hush 화병 ---------- */

  // 화병에서부터 위로 피어오르듯 드러나고(클립 리빌), 기울어진 줄기가 스프링으로 제자리에 선다
  function hushIn(delay) {
    freeze(el.hush)
    if (isHidden(el.hush)) {
      setStyle(el.hush, {
        clipPath: 'inset(100% -20% 0 -20%)',
        transform: 'translateY(70px) rotate(-7deg) scale(0.94)',
        opacity: '0',
        filter: 'blur(14px)',
      })
    }
    return [
      animate(el.hush, [{ clipPath: 'inset(-10% -20% 0 -20%)' }], {
        duration: 1300,
        delay,
        easing: 'cubic-bezier(0.65, 0, 0.2, 1)',
      }),
      animate(el.hush, [{ transform: 'none' }], { ...SPRING.settle, delay }),
      animate(el.hush, [{ opacity: 1, filter: 'none' }], { duration: 1000, delay, easing: 'ease-out' }),
    ]
  }

  // 화병 속으로 가라앉듯 위에서부터 닫힘
  function hushOut(delay) {
    freeze(el.hush)
    return [
      animate(
        el.hush,
        [
          {
            clipPath: 'inset(100% -20% 0 -20%)',
            transform: 'translateY(50px) rotate(5deg) scale(0.95)',
            opacity: 0,
            filter: 'blur(10px)',
          },
        ],
        { duration: 750, delay, easing: QUART_IN_OUT },
      ),
    ]
  }

  /* ---------- 토글 (피커 휠) ---------- */
  // dir 1 = 다음(위로 넘김), -1 = 이전
  function toggleSwap(from, to, dir, delay) {
    const fromThumb = from.querySelector('.card__thumb img')
    const toThumb = to.querySelector('.card__thumb img')
    freeze(from, to, fromThumb, toThumb)
    if (isHidden(to)) {
      setStyle(to, { transform: `translateY(${dir * 70}%)`, opacity: '0', filter: 'blur(8px)' })
      toThumb.style.scale = '1.25'
    }
    return [
      animate(from, [{ transform: `translateY(${-dir * 55}%)`, opacity: 0, filter: 'blur(8px)' }], {
        duration: 520,
        delay,
        easing: QUART_IN_OUT,
      }),
      animate(fromThumb, [{ scale: 0.9 }], { duration: 520, delay, easing: QUART_IN_OUT }),
      animate(to, [{ transform: 'translateY(0)', opacity: 1, filter: 'none' }], { ...SPRING.soft, delay: delay + 180 }),
      animate(toThumb, [{ scale: 1 }], { ...SPRING.soft, delay: delay + 180 }),
      animate(el.card, [{ transform: 'scale(1)' }, { transform: 'scale(0.965)' }], {
        duration: 260,
        delay,
        easing: 'ease-out',
        fill: 'none',
      }),
      animate(el.card, [{ transform: 'scale(0.965)' }, { transform: 'scale(1)' }], {
        ...SPRING.snappy,
        delay: delay + 260,
        fill: 'none',
      }),
      ...el.pills.map((p, i) =>
        animate(p, [{ transform: `translateY(${-dir * (i ? 14 : 8)}px)` }, { transform: 'translateY(0)' }], {
          ...SPRING.snappy,
          delay: delay + 120 + i * 50,
          fill: 'none',
        }),
      ),
      animate(el.arrow, [{ transform: 'scaleX(-1) translateX(14px)' }, { transform: 'scaleX(-1) translateX(0)' }], {
        ...SPRING.snappy,
        delay,
        fill: 'none',
      }),
    ]
  }

  /* ---------- 장면 ---------- */

  function intro() {
    stage.getAnimations({ subtree: true }).forEach((a) => a.cancel())
    // 이전 재생에서 고정된 인라인 스타일 제거 → CSS 초기 상태(Still 표시, Hush 숨김)로 복귀
    new Set([...Object.values(el).flat(), ...$$('.card__thumb img')]).forEach((n) => n.removeAttribute('style'))
    step = 0

    const anims = [
      // 로고: 블러 속에서 왼→오로 쓸어내듯 드러남
      ...el.logos.flatMap((logo, i) => [
        animate(logo, [{ maskPosition: '100% 0' }, { maskPosition: '0% 0' }], {
          duration: 1600,
          delay: 80 + i * 220,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }),
        animate(
          logo,
          [
            { filter: 'blur(16px)', transform: 'translateY(28px) scale(1.03)' },
            { filter: 'none', transform: 'translateY(0) scale(1)' },
          ],
          { duration: 1800, delay: 80 + i * 220 },
        ),
      ]),

      // 행잉 식물 — 가장 먼저 시선을 잡도록 초반에 낙하
      ...hangIn(320, true),

      ...el.labels.map((label, i) =>
        animate(
          label,
          [
            { opacity: 0, filter: 'blur(8px)', transform: 'translateY(14px)' },
            { opacity: 1, filter: 'none', transform: 'translateY(0)' },
          ],
          { ...SPRING.soft, delay: 900 + i * 70 },
        ),
      ),

      // 그린 패널: 아래에서 위로 클립 리빌
      animate(
        el.panel,
        [
          { clipPath: 'inset(100% 0 0 0 round 40px)', transform: 'translateY(50px)' },
          { clipPath: 'inset(0% 0 0 0 round 40px)', transform: 'translateY(0)' },
        ],
        { duration: 1100, delay: 750, easing: 'cubic-bezier(0.77, 0, 0.18, 1)' },
      ),

      // 헤드라인: 단어 단위 블러 리빌
      ...el.words.map((w, i) =>
        animate(
          w,
          [
            { opacity: 0, filter: 'blur(12px)', transform: 'translateY(45%)' },
            { opacity: 1, filter: 'none', transform: 'translateY(0)' },
          ],
          { ...SPRING.soft, delay: 1250 + i * 55 },
        ),
      ),

      ...el.badges.map((b, i) =>
        animate(
          b,
          [
            { opacity: 0, transform: 'scale(0.3)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { ...SPRING.snappy, delay: 1650 + i * 90 },
        ),
      ),
      ...el.icons.map((ic, i) =>
        animate(
          ic,
          [
            { opacity: 0, transform: 'scale(0.2) rotate(-60deg)' },
            { opacity: 1, transform: 'scale(1) rotate(0deg)' },
          ],
          { ...SPRING.snappy, delay: 1730 + i * 90 },
        ),
      ),

      ...el.descLines.map((line, i) =>
        animate(
          line,
          [
            { opacity: 0, filter: 'blur(6px)', transform: 'translateY(100%)' },
            { opacity: 1, filter: 'none', transform: 'translateY(0)' },
          ],
          { ...SPRING.soft, delay: 1550 + i * 80 },
        ),
      ),

      // 토글: 위 pill → 카드 → 아래 pill 순으로 블러와 함께 슬라이드
      ...[el.pills[0], el.card, el.pills[1]].map((t, i) =>
        animate(
          t,
          [
            { opacity: 0, filter: 'blur(10px)', transform: 'translateX(90px)' },
            { opacity: 1, filter: 'none', transform: 'translateX(0)' },
          ],
          { ...SPRING.soft, delay: 1400 + i * 80 },
        ),
      ),
      animate(
        el.arrow,
        [
          { opacity: 0, transform: 'scaleX(-1) translateX(-30px)' },
          { opacity: 1, transform: 'scaleX(-1) translateX(0)' },
        ],
        { ...SPRING.snappy, delay: 1800 },
      ),
    ]

    done(anims)
  }

  // Still → Hush: 토글이 넘어가는 순간 행잉이 끌려 올라가고, hush가 피어오르며 등장
  // 인트로·전환 도중이라도 언제든 넘길 수 있음 (진행 중인 움직임을 그 자리에서 이어받음)
  function next() {
    if (step === 1) return
    step = 1
    done([...toggleSwap(el.still, el.hushItem, 1, 0), ...hangOut(60), ...hushIn(640)])
  }

  function prev() {
    if (step === 0) return
    step = 0
    done([...toggleSwap(el.hushItem, el.still, -1, 0), ...hushOut(40), ...hangIn(420)])
  }

  const ADVANCE_KEYS = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Enter']
  const BACK_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']

  addEventListener('keydown', (e) => {
    // Still 화면에선 방향키 4개·Enter·Space 어느 것이든 Hush로 넘김, Hush 화면에선 ←/↑로 되돌림
    if (step === 0 && ADVANCE_KEYS.includes(e.key)) {
      e.preventDefault()
      next()
    } else if (step === 1 && BACK_KEYS.includes(e.key)) {
      e.preventDefault()
      prev()
    } else if (e.key === 'r' || e.key === 'R') {
      intro()
    } else if (e.key === 'f' || e.key === 'F') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
    }
  })
  addEventListener('click', () => (step === 0 ? next() : prev()))

  /* ---------- 시작: 이미지·폰트 준비 후 재생 ---------- */
  const ready = [
    ...[...stage.querySelectorAll('img')].map((img) => img.decode().catch(() => {})),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]
  // 오프라인 등으로 폰트/이미지가 늦어도 최대 2.5초 뒤엔 시작
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500))
  Promise.race([Promise.all(ready), timeout]).then(() => {
    intro()
    stage.style.visibility = 'visible'
  })
})()
