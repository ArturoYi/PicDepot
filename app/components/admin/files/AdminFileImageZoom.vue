<script setup lang="ts">
const props = defineProps<{
  src: string
  alt?: string
}>()

const MIN_SCALE = 0.5
const MAX_SCALE = 5
const STEP = 0.25
const DOUBLE_TAP_MS = 280
const DOUBLE_TAP_SLOP = 28

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const interacting = ref(false)
const viewportRef = ref<HTMLElement | null>(null)

type Point = { x: number, y: number }

let panOrigin: { x: number, y: number, ox: number, oy: number } | null = null
let pinchOrigin: { distance: number, scale: number, ox: number, oy: number } | null = null
let pinchedThisGesture = false
let lastPointerType = 'mouse'
let lastTap: { t: number, x: number, y: number } | null = null
let mousePointerId: number | null = null
let windowListening = false

const scaleLabel = computed(() => `${Math.round(scale.value * 100)}%`)
const transformStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`
}))

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 100) / 100))
}

function resetView() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

function bindWindow() {
  if (windowListening) return
  windowListening = true
  window.addEventListener('pointermove', onMouseMove)
  window.addEventListener('pointerup', onMouseUp)
  window.addEventListener('pointercancel', onMouseUp)
}

function unbindWindow() {
  if (!windowListening) return
  windowListening = false
  window.removeEventListener('pointermove', onMouseMove)
  window.removeEventListener('pointerup', onMouseUp)
  window.removeEventListener('pointercancel', onMouseUp)
}

function endInteraction() {
  if (scale.value <= 1) {
    offsetX.value = 0
    offsetY.value = 0
  }
  panOrigin = null
  pinchOrigin = null
  pinchedThisGesture = false
  mousePointerId = null
  interacting.value = false
  unbindWindow()
}

function viewportPoint(clientX: number, clientY: number): Point {
  const viewport = viewportRef.value
  if (!viewport) return { x: 0, y: 0 }
  const rect = viewport.getBoundingClientRect()
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2
  }
}

function zoomTo(next: number, centerClientX?: number, centerClientY?: number) {
  const prev = scale.value
  const target = clampScale(next)
  if (target === prev) {
    if (target <= 1) {
      offsetX.value = 0
      offsetY.value = 0
    }
    return
  }

  if (centerClientX != null && centerClientY != null) {
    const { x: cx, y: cy } = viewportPoint(centerClientX, centerClientY)
    const ratio = target / prev
    offsetX.value = cx - (cx - offsetX.value) * ratio
    offsetY.value = cy - (cy - offsetY.value) * ratio
  }

  scale.value = target
  if (target <= 1) {
    offsetX.value = 0
    offsetY.value = 0
  }
}

function zoomAround(
  target: number,
  clientX: number,
  clientY: number,
  fromScale: number,
  fromOx: number,
  fromOy: number
) {
  const next = clampScale(target)
  const { x: cx, y: cy } = viewportPoint(clientX, clientY)
  const ratio = next / fromScale
  offsetX.value = cx - (cx - fromOx) * ratio
  offsetY.value = cy - (cy - fromOy) * ratio
  scale.value = next
}

function zoomIn() {
  zoomTo(scale.value + STEP)
}

function zoomOut() {
  zoomTo(scale.value - STEP)
}

function touchPoint(touch: Touch): Point {
  return { x: touch.clientX, y: touch.clientY }
}

function touchAt(touches: TouchList, index: number): Point | null {
  const touch = touches.item(index)
  return touch ? touchPoint(touch) : null
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function beginPinch(a: Point, b: Point) {
  pinchedThisGesture = true
  panOrigin = null
  pinchOrigin = {
    distance: distance(a, b) || 1,
    scale: scale.value,
    ox: offsetX.value,
    oy: offsetY.value
  }
}

function beginPan(point: Point) {
  pinchOrigin = null
  if (scale.value <= 1) {
    panOrigin = null
    return
  }
  panOrigin = {
    x: point.x,
    y: point.y,
    ox: offsetX.value,
    oy: offsetY.value
  }
}

function applyPinch(a: Point, b: Point) {
  if (!pinchOrigin) return
  const mid = midpoint(a, b)
  zoomAround(
    pinchOrigin.scale * (distance(a, b) / pinchOrigin.distance),
    mid.x,
    mid.y,
    pinchOrigin.scale,
    pinchOrigin.ox,
    pinchOrigin.oy
  )
}

function applyPan(point: Point) {
  if (!panOrigin) return
  offsetX.value = panOrigin.ox + (point.x - panOrigin.x)
  offsetY.value = panOrigin.oy + (point.y - panOrigin.y)
}

function maybeDoubleTap(clientX: number, clientY: number) {
  if (pinchedThisGesture) return

  const now = performance.now()
  const prev = lastTap
  if (
    prev
    && now - prev.t <= DOUBLE_TAP_MS
    && Math.hypot(clientX - prev.x, clientY - prev.y) <= DOUBLE_TAP_SLOP
  ) {
    lastTap = null
    if (scale.value > 1) resetView()
    else zoomTo(2, clientX, clientY)
    return
  }

  lastTap = { t: now, x: clientX, y: clientY }
}

function onMouseDown(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  if (event.button !== 0) return

  lastPointerType = event.pointerType
  interacting.value = true
  mousePointerId = event.pointerId
  beginPan({ x: event.clientX, y: event.clientY })
  bindWindow()
}

function onMouseMove(event: PointerEvent) {
  if (event.pointerId !== mousePointerId) return
  applyPan({ x: event.clientX, y: event.clientY })
}

function onMouseUp(event: PointerEvent) {
  if (event.pointerId !== mousePointerId) return
  endInteraction()
}

function onTouchStart(event: TouchEvent) {
  lastPointerType = 'touch'
  interacting.value = true

  const a = touchAt(event.touches, 0)
  const b = touchAt(event.touches, 1)
  if (a && b) {
    beginPinch(a, b)
    return
  }
  if (a) beginPan(a)
}

function onTouchMove(event: TouchEvent) {
  const a = touchAt(event.touches, 0)
  const b = touchAt(event.touches, 1)
  if (a && b) {
    event.preventDefault()
    if (!pinchOrigin) beginPinch(a, b)
    applyPinch(a, b)
    return
  }
  if (a) applyPan(a)
}

function onTouchEnd(event: TouchEvent) {
  const a = touchAt(event.touches, 0)
  const b = touchAt(event.touches, 1)
  if (a && b) {
    beginPinch(a, b)
    return
  }
  if (a) {
    beginPan(a)
    return
  }

  const ended = event.changedTouches.item(0)
  if (ended) maybeDoubleTap(ended.clientX, ended.clientY)
  endInteraction()
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -STEP : STEP
  zoomTo(scale.value + delta, event.clientX, event.clientY)
}

function onDblClick(event: MouseEvent) {
  if (lastPointerType !== 'mouse') return
  if (scale.value > 1) {
    resetView()
    return
  }
  zoomTo(2, event.clientX, event.clientY)
}

watch(() => props.src, () => {
  resetView()
  endInteraction()
})

watch(viewportRef, (el, prev) => {
  prev?.removeEventListener('touchstart', onTouchStart)
  prev?.removeEventListener('touchmove', onTouchMove)
  prev?.removeEventListener('touchend', onTouchEnd)
  prev?.removeEventListener('touchcancel', onTouchEnd)

  if (!el) return
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd)
  el.addEventListener('touchcancel', onTouchEnd)
}, { immediate: true, flush: 'post' })

onUnmounted(() => {
  const el = viewportRef.value
  el?.removeEventListener('touchstart', onTouchStart)
  el?.removeEventListener('touchmove', onTouchMove)
  el?.removeEventListener('touchend', onTouchEnd)
  el?.removeEventListener('touchcancel', onTouchEnd)
  endInteraction()
})
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <p class="text-xs text-muted">
        <span class="hidden sm:inline">滚轮缩放 · 拖拽平移 · 双击放大/复位</span>
        <span class="sm:hidden">双指缩放 · 拖动平移 · 双击放大/复位</span>
      </p>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-zoom-out"
          size="xs"
          color="neutral"
          variant="soft"
          :disabled="scale <= MIN_SCALE"
          aria-label="缩小"
          @click="zoomOut"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="min-w-14 tabular-nums"
          :label="scaleLabel"
          @click="resetView"
        />
        <UButton
          icon="i-lucide-zoom-in"
          size="xs"
          color="neutral"
          variant="soft"
          :disabled="scale >= MAX_SCALE"
          aria-label="放大"
          @click="zoomIn"
        />
        <UButton
          icon="i-lucide-rotate-ccw"
          size="xs"
          color="neutral"
          variant="soft"
          aria-label="重置"
          @click="resetView"
        />
      </div>
    </div>

    <div class="ui-frame min-h-0 flex-1">
      <div
        ref="viewportRef"
        class="ui-frame-clip relative touch-none select-none overscroll-none bg-elevated/40 [-webkit-touch-callout:none]"
        :class="interacting && scale > 1 ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'"
        style="height: min(70dvh, 900px, calc(100dvh - 14rem))"
        @wheel.prevent="onWheel"
        @pointerdown="onMouseDown"
        @dblclick="onDblClick"
      >
        <div class="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img
            :src="src"
            :alt="alt || ''"
            class="pointer-events-none max-h-full max-w-full object-contain select-none will-change-transform"
            :class="{ 'transition-transform duration-75': !interacting }"
            :style="transformStyle"
            draggable="false"
          >
        </div>
      </div>
    </div>
  </div>
</template>
