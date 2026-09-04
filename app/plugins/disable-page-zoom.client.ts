/**
 * 禁止移动端整页缩放，并把应用壳锁在可视区域内。
 *
 * iOS Safari / 微信会忽略 viewport 的 user-scalable=no；
 * 只拦 gesture* 不够，双指 touchmove、双击、ctrl+滚轮都会把页面放大。
 * 放大后 visualViewport 与布局视口错位，底部浏览器栏就会「飘」——刷新才复位。
 */

const VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

type SafariTouchEvent = TouchEvent & { scale?: number }

declare global {
  interface Window {
    __picdepotViewportLock?: boolean
  }
}

function prevent(event: Event) {
  event.preventDefault()
}

function isEditableTarget(event: Event) {
  const target = event.target
  return target instanceof Element
    && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function enforceViewportMeta() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (meta instanceof HTMLMetaElement) {
    meta.setAttribute('content', VIEWPORT_CONTENT)
    return
  }
  const created = document.createElement('meta')
  created.name = 'viewport'
  created.content = VIEWPORT_CONTENT
  document.head.appendChild(created)
}

function isCompactViewport() {
  return window.matchMedia('(pointer: coarse), (hover: none), (max-width: 768px)').matches
}

function syncAppFrame() {
  const root = document.documentElement
  if (!isCompactViewport()) {
    root.style.removeProperty('--app-top')
    root.style.removeProperty('--app-left')
    root.style.removeProperty('--app-width')
    root.style.removeProperty('--app-height')
    return
  }

  const vv = window.visualViewport
  if (!vv) {
    root.style.setProperty('--app-top', '0px')
    root.style.setProperty('--app-left', '0px')
    root.style.setProperty('--app-width', `${window.innerWidth}px`)
    root.style.setProperty('--app-height', `${window.innerHeight}px`)
    return
  }

  /* 整页被放大时先滚回原点；键盘弹出造成的 offset 不要强行清掉 */
  if (Math.abs(vv.scale - 1) > 0.01) {
    window.scrollTo(0, 0)
  }

  root.style.setProperty('--app-top', `${Math.round(vv.offsetTop)}px`)
  root.style.setProperty('--app-left', `${Math.round(vv.offsetLeft)}px`)
  root.style.setProperty('--app-width', `${Math.round(vv.width)}px`)
  root.style.setProperty('--app-height', `${Math.round(vv.height)}px`)
}

export default defineNuxtPlugin(() => {
  if (window.__picdepotViewportLock) return
  window.__picdepotViewportLock = true

  enforceViewportMeta()
  syncAppFrame()

  const capture = { passive: false, capture: true } as const

  for (const type of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
    document.addEventListener(type, prevent, capture)
  }

  const isPreviewPinch = (event: Event) => {
    const target = event.target
    return target instanceof Element && Boolean(target.closest('[data-allow-pinch]'))
  }

  const preventPinch = (event: SafariTouchEvent) => {
    const multi = event.touches.length > 1
      || (typeof event.scale === 'number' && event.scale !== 1)
    if (!multi) return
    /* 预览框自己处理捏合；touchstart 放行，touchmove 仍要拦住浏览器整页缩放 */
    if (event.type === 'touchstart' && isPreviewPinch(event)) return
    event.preventDefault()
  }

  document.addEventListener('touchstart', preventPinch, capture)
  document.addEventListener('touchmove', preventPinch, capture)

  let lastTap: { t: number, x: number, y: number } | null = null
  document.addEventListener('touchend', (event: TouchEvent) => {
    if (isEditableTarget(event)) return
    const touch = event.changedTouches.item(0)
    if (!touch) return
    const now = Date.now()
    const prev = lastTap
    lastTap = { t: now, x: touch.clientX, y: touch.clientY }
    if (
      prev
      && now - prev.t <= 350
      && Math.hypot(touch.clientX - prev.x, touch.clientY - prev.y) <= 24
    ) {
      event.preventDefault()
    }
  }, capture)

  document.addEventListener('wheel', (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault()
  }, capture)

  let frame = 0
  const onViewportChange = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      enforceViewportMeta()
      syncAppFrame()
    })
  }

  window.addEventListener('resize', onViewportChange, { passive: true })
  window.addEventListener('orientationchange', onViewportChange, { passive: true })
  window.addEventListener('scroll', () => {
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
  }, { passive: true })

  const vv = window.visualViewport
  vv?.addEventListener('resize', onViewportChange)
  vv?.addEventListener('scroll', onViewportChange)
})
