<script setup lang="ts">
const props = defineProps<{
  src: string
  alt?: string
}>()

const MIN_SCALE = 0.5
const MAX_SCALE = 5
const STEP = 0.25

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const originX = ref(0)
const originY = ref(0)
const viewportRef = ref<HTMLElement | null>(null)

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

function zoomTo(next: number, centerClientX?: number, centerClientY?: number) {
  const viewport = viewportRef.value
  const prev = scale.value
  const target = clampScale(next)
  if (target === prev) return

  if (viewport && centerClientX != null && centerClientY != null) {
    const rect = viewport.getBoundingClientRect()
    const cx = centerClientX - rect.left - rect.width / 2
    const cy = centerClientY - rect.top - rect.height / 2
    const ratio = target / prev
    offsetX.value = cx - (cx - offsetX.value) * ratio
    offsetY.value = cy - (cy - offsetY.value) * ratio
  } else if (target <= 1) {
    offsetX.value = 0
    offsetY.value = 0
  }

  scale.value = target
}

function zoomIn() {
  zoomTo(scale.value + STEP)
}

function zoomOut() {
  zoomTo(scale.value - STEP)
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -STEP : STEP
  zoomTo(scale.value + delta, event.clientX, event.clientY)
}

function onPointerDown(event: PointerEvent) {
  if (scale.value <= 1 || event.button !== 0) return
  dragging.value = true
  startX.value = event.clientX
  startY.value = event.clientY
  originX.value = offsetX.value
  originY.value = offsetY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  offsetX.value = originX.value + (event.clientX - startX.value)
  offsetY.value = originY.value + (event.clientY - startY.value)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch {
    // ignore
  }
}

function onDblClick(event: MouseEvent) {
  if (scale.value > 1) {
    resetView()
    return
  }
  zoomTo(2, event.clientX, event.clientY)
}

watch(() => props.src, () => {
  resetView()
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-xs text-muted">
        <span class="hidden sm:inline">滚轮缩放 · 拖拽平移 · 双击放大/复位</span>
        <span class="sm:hidden">双击放大/复位，或用按钮缩放</span>
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

    <div class="ui-frame">
      <div
        ref="viewportRef"
        class="ui-frame-clip relative bg-elevated/40"
        :class="dragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'"
        style="height: min(70dvh, 900px)"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="onDblClick"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <img
            :src="src"
            :alt="alt || ''"
            class="pointer-events-none max-h-full max-w-full object-contain select-none transition-transform duration-75 will-change-transform"
            :style="transformStyle"
            draggable="false"
          >
        </div>
      </div>
    </div>
  </div>
</template>
