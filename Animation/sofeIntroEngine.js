// @ts-nocheck
/**
 * Sofe Node intro animation (framework-free, Web Animations API).
 *
 * Sequence (~2.6s):
 *   1. Cursor blinks at page centre, then types "Sofe Node" (title case) leaving a gap where each "o" goes.
 *   2. The logo icon drops in from the top right (spinning), bounces once on top of the word.
 *   3. It splits in two; both copies snap into the gaps (stiff ease, no float) and the lockup lights up.
 *   4. The lockup scales and glides to the navbar logo ([data-intro-target]); the hero ([data-intro-hero]) fades up.
 *
 * Only transform and opacity are animated.
 * Any wheel / touch / click / key press / resize skips straight to the final state.
 */

export const INTRO_ATTR = 'data-sofe-intro' // "pending" -> "running" -> "docking" -> removed
export const STORAGE_KEY = 'sofe_node_intro_seen'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Icon geometry (traced from the logo icon), viewBox 0 0 696 615
const ICON_W = 696
const ICON_H = 615
const ORANGE_POINTS = '0,215 223,0 412,0 412,167 182,397 182,215'
const BLUE_POINTS = '467,21 696,152 696,465 440,613 198,473 467,205'

// Icon box in em of the wordmark font size. 0.64em tall sits between x-height and cap height, like an "o".
const SLOT_H = 0.64
const SLOT_W = +((SLOT_H * ICON_W) / ICON_H).toFixed(4)
const SLOT_GAP = 0.045

const EASE_SNAP = 'cubic-bezier(0.22, 1, 0.36, 1)' // stiff, high damping, no overshoot
const EASE_DOCK = 'cubic-bezier(0.76, 0, 0.24, 1)'

const DEFAULTS = {
  fontFamily: "'Poppins', system-ui, sans-serif",
  fontWeight: 700,
  orange: '#FF8200', // "Sofe" + orange half of the icon
  blue: '#0800FF', // "Node" + blue half of the icon + cursor
  idle: '#B4BAC6', // letters while typing, before the lockup lights up
  background: '#FFFFFF', // keep in sync with the cover colour in sofe-intro.css
  targetSelector: '[data-intro-target]', // the real navbar logo
  fallbackTarget: { left: 32, top: 24, width: 150, height: 40 },
  ignoreReducedMotion: false,
  // timings in ms
  t: { blink: 350, type: 52, slot: 80, drop: 640, hold: 50, split: 360, light: 120, dock: 560, fade: 180 },
}

const T = (x, y, r = 0, sx = 1, sy = 1) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`

/** Runs the intro. Returns a cleanup function (for React effects). */
export function runSofeIntro(userOptions = {}) {
  if (typeof window === 'undefined') return () => {}
  const root = document.documentElement
  if (!root.hasAttribute(INTRO_ATTR)) return () => {}

  const o = { ...DEFAULTS, ...userOptions, t: { ...DEFAULTS.t, ...(userOptions.t || {}) } }
  const t = o.t

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced && !o.ignoreReducedMotion) {
    root.removeAttribute(INTRO_ATTR)
    return () => {}
  }

  let dead = false
  const ABORT = Symbol('abort')
  const timers = new Set()
  const anims = new Set()

  const alive = () => {
    if (dead) throw ABORT
  }
  const sleep = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        timers.delete(id)
        resolve()
      }, ms)
      timers.add(id)
    })
  const run = (el, frames, options) => {
    const a = el.animate(frames, { fill: 'forwards', ...options })
    anims.add(a)
    return a
  }
  const done = async (a) => {
    try {
      await a.finished
    } catch (_) {
      /* cancelled */
    }
    alive()
  }
  const mk = (tag, style = {}, attrs = {}) => {
    const n = document.createElement(tag)
    Object.assign(n.style, style)
    for (const k in attrs) n.setAttribute(k, attrs[k])
    return n
  }

  // ---------- DOM ----------
  const overlay = mk(
    'div',
    {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    { 'aria-hidden': 'true' }
  )
  const bg = mk('div', { position: 'absolute', inset: '0', background: o.background })
  const dock = mk('div', { position: 'relative', display: 'flex', transformOrigin: '0 0', opacity: '0', willChange: 'transform, opacity' })
  const typer = mk('div', {
    position: 'relative',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    lineHeight: '1',
    fontFamily: o.fontFamily,
    fontWeight: String(o.fontWeight),
    fontSize: 'clamp(40px, 14vw, 112px)',
    willChange: 'transform',
  })

  const parts = [
    ['S', 'sofe'],
    ['slot', 'sofe'],
    ['f', 'sofe'],
    ['e', 'sofe'],
    ['space', ''],
    ['N', 'node'],
    ['slot', 'node'],
    ['d', 'node'],
    ['e', 'node'],
  ]
  const hints = []
  const toks = parts.map(([ch, group]) => {
    const isSlot = ch === 'slot'
    const isSpace = ch === 'space'
    const base = { display: 'inline-block', opacity: '0', color: o.idle, transition: 'color 220ms ease' }
    const style = isSlot
      ? { ...base, position: 'relative', width: `${SLOT_W}em`, height: `${SLOT_H}em`, margin: `0 ${SLOT_GAP}em`, verticalAlign: '-0.01em' }
      : isSpace
        ? { ...base, width: '0.26em', height: '0' }
        : base
    const n = mk('span', style, { 'data-group': group })
    if (isSlot) {
      n.dataset.slot = '1'
      const hint = mk('span', {
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '0.02em',
        borderBottom: '0.05em solid currentColor',
        opacity: '0.55',
        transition: 'opacity 140ms ease',
      })
      n.appendChild(hint)
      hints.push(hint)
    } else if (isSpace) {
      n.dataset.space = '1'
    } else {
      n.textContent = ch
    }
    return n
  })
  const slotEls = toks.filter((n) => n.dataset.slot)
  const spaceEl = toks.find((n) => n.dataset.space)

  const cursor = mk('span', {
    position: 'absolute',
    left: '0px',
    top: '0.12em',
    marginLeft: '0.04em',
    width: '0.055em',
    height: '0.78em',
    background: o.blue,
    borderRadius: '0.02em',
  })

  const poly = (points, fill) => {
    const p = document.createElementNS(SVG_NS, 'polygon')
    p.setAttribute('points', points)
    p.setAttribute('fill', fill)
    return p
  }
  const makeIcon = () => {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('viewBox', `0 0 ${ICON_W} ${ICON_H}`)
    svg.setAttribute('aria-hidden', 'true')
    svg.append(poly(ORANGE_POINTS, o.orange), poly(BLUE_POINTS, o.blue))
    Object.assign(svg.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      display: 'block',
      overflow: 'visible',
      opacity: '0',
      transformOrigin: '50% 100%',
      willChange: 'transform',
    })
    return svg
  }
  const sizeIcon = (svg, w, h) => {
    svg.style.width = `${w}px`
    svg.style.height = `${h}px`
  }
  const iconA = makeIcon()

  typer.append(...toks, cursor, iconA)
  dock.appendChild(typer)
  overlay.append(bg, dock)

  // ---------- cleanup ----------
  const listeners = []
  const teardown = () => {
    dead = true
    timers.forEach((id) => clearTimeout(id))
    timers.clear()
    anims.forEach((a) => {
      try {
        a.cancel()
      } catch (_) {}
    })
    anims.clear()
    listeners.forEach(([name, fn]) => window.removeEventListener(name, fn))
    listeners.length = 0
    overlay.remove()
  }
  const finish = () => {
    if (dead) return
    teardown()
    root.removeAttribute(INTRO_ATTR)
    clearTimeout(window.__sofeIntroFailsafe)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch (_) {}
  }

  // any real user input skips to the docked state
  ;['wheel', 'touchmove', 'pointerdown', 'keydown', 'resize'].forEach((name) => {
    const fn = () => finish()
    window.addEventListener(name, fn, { passive: true })
    listeners.push([name, fn])
  })

  const fontsReady = () =>
    document.fonts && document.fonts.load
      ? document.fonts.load(`${o.fontWeight} 64px ${o.fontFamily}`).then(() => document.fonts.ready).catch(() => {})
      : Promise.resolve()

  // ---------- timeline ----------
  const play = async () => {
    document.body.appendChild(overlay)
    void overlay.offsetWidth
    root.setAttribute(INTRO_ATTR, 'running')

    await Promise.race([fontsReady(), sleep(1500)])
    alive()

    const fs = parseFloat(getComputedStyle(typer).fontSize)
    const W = typer.offsetWidth

    // start with the (empty) text shifted so the cursor sits at page centre
    typer.style.transition = 'none'
    typer.style.transform = `translateX(${W / 2}px)`
    void typer.offsetWidth
    typer.style.transition = 'transform 70ms linear'
    dock.style.opacity = '1'

    // 1. blink, then type
    const blink = run(
      cursor,
      [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0, offset: 0.5 },
        { opacity: 0, offset: 1 },
      ],
      { duration: 1000, iterations: Infinity, fill: 'none' }
    )
    await sleep(t.blink)
    alive()
    blink.cancel()

    for (const tok of toks) {
      tok.style.opacity = '1'
      const edge = tok.offsetLeft + tok.offsetWidth
      typer.style.transform = `translateX(${(W - edge) / 2}px)`
      cursor.style.left = `${edge}px`
      await sleep(tok.dataset.slot ? t.slot : t.type)
      alive()
    }
    run(cursor, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 })

    // geometry (local to typer)
    const rects = slotEls.map((s) => ({ x: s.offsetLeft, y: s.offsetTop, w: s.offsetWidth, h: s.offsetHeight }))
    const wr0 = typer.getBoundingClientRect()
    const landX = spaceEl.offsetLeft + spaceEl.offsetWidth / 2 - rects[0].w / 2
    const landY = rects[0].y - fs * 0.8 // rests on top of the word
    const startX = window.innerWidth + 60 - wr0.left
    const startY = -wr0.top - rects[0].h * 2
    const bounce = rects[0].h * 0.55
    sizeIcon(iconA, rects[0].w, rects[0].h)

    // 2. drop from top right, roll in, one bounce
    const dropA = run(
      iconA,
      [
        { offset: 0, opacity: 1, transform: T(startX, startY, 260), easing: 'cubic-bezier(0.4, 0, 0.9, 0.55)' },
        { offset: 0.58, opacity: 1, transform: T(landX, landY, 0, 1.1, 0.86), easing: 'cubic-bezier(0.2, 0.65, 0.4, 1)' },
        { offset: 0.78, opacity: 1, transform: T(landX, landY - bounce, 0, 0.97, 1.03), easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)' },
        { offset: 1, opacity: 1, transform: T(landX, landY) },
      ],
      { duration: t.drop }
    )
    await done(dropA)
    iconA.style.opacity = '1'
    iconA.style.transform = T(landX, landY)
    dropA.cancel()
    await sleep(t.hold)
    alive()

    // 3. split in two, snap into both gaps
    const iconB = makeIcon()
    sizeIcon(iconB, rects[1].w, rects[1].h)
    iconB.style.opacity = '1'
    iconB.style.transform = T(landX, landY)
    typer.appendChild(iconB)
    hints.forEach((h) => (h.style.opacity = '0'))

    const snapA = run(iconA, [{ transform: T(landX, landY) }, { transform: T(rects[0].x, rects[0].y) }], { duration: t.split, easing: EASE_SNAP })
    const snapB = run(iconB, [{ transform: T(landX, landY) }, { transform: T(rects[1].x, rects[1].y) }], { duration: t.split, easing: EASE_SNAP })
    await done(snapA)
    await done(snapB)
    iconA.style.transform = T(rects[0].x, rects[0].y)
    iconB.style.transform = T(rects[1].x, rects[1].y)

    // lockup lights up
    toks.forEach((n) => {
      const g = n.dataset.group
      if (g === 'sofe') n.style.color = o.orange
      if (g === 'node') n.style.color = o.blue
    })
    await sleep(t.light)
    alive()

    // 4. dock into the navbar
    typer.style.transition = 'none'
    typer.style.transform = 'none'
    const wr = typer.getBoundingClientRect()
    const targetEl = document.querySelector(o.targetSelector)
    let tr = targetEl ? targetEl.getBoundingClientRect() : null
    if (!tr || !tr.width) tr = o.fallbackTarget
    const s = tr.width / wr.width
    const dx = tr.left - wr.left
    const dy = tr.top + tr.height / 2 - wr.top - (wr.height * s) / 2

    root.setAttribute(INTRO_ATTR, 'docking') // hero fades up now, navbar logo stays hidden
    run(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: t.dock * 0.7, easing: 'ease-out' })
    run(dock, [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }], {
      duration: t.dock,
      easing: EASE_DOCK,
    })
    await sleep(t.dock - t.fade)
    alive()
    root.removeAttribute(INTRO_ATTR) // real navbar logo fades in (CSS)
    run(dock, [{ opacity: 1 }, { opacity: 0 }], { duration: t.fade, easing: 'linear' })
    await sleep(t.fade + 40)
    alive()
    finish()
  }

  play().catch((err) => {
    if (err !== ABORT) {
      console.error('[SofeIntro]', err)
      finish()
    }
  })

  return teardown
}
