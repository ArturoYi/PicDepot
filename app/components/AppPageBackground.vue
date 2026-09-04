<script setup lang="ts">
const { currentSrc } = usePageBackground()

const frontSrc = ref<string | null>(null)
const backSrc = ref<string | null>(null)
const showFront = ref(true)
const pulse = ref(false)
const flash = ref(false)

let pulseTimer: ReturnType<typeof setTimeout> | null = null
let flashTimer: ReturnType<typeof setTimeout> | null = null

function preload(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function triggerPulse() {
  pulse.value = false
  flash.value = false
  requestAnimationFrame(() => {
    pulse.value = true
    flash.value = true
    if (pulseTimer) clearTimeout(pulseTimer)
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
      flash.value = false
    }, 280)
    pulseTimer = setTimeout(() => {
      pulse.value = false
    }, 800)
  })
}

watch(currentSrc, async (src, prev) => {
  if (!src) {
    frontSrc.value = null
    backSrc.value = null
    return
  }

  try {
    await preload(src)
  } catch {
    return
  }

  if (currentSrc.value !== src) return

  const firstPaint = !frontSrc.value && !backSrc.value
  if (showFront.value) {
    backSrc.value = src
  } else {
    frontSrc.value = src
  }

  if (firstPaint) {
    frontSrc.value = src
    showFront.value = true
    return
  }

  await nextTick()
  showFront.value = !showFront.value
  if (prev) triggerPulse()
}, { immediate: true })

onUnmounted(() => {
  if (pulseTimer) clearTimeout(pulseTimer)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-zinc-100 transition-colors duration-300 dark:bg-zinc-900"
    aria-hidden="true"
  >
    <div
      class="absolute inset-0 origin-center transition-transform duration-700 ease-out"
      :class="pulse ? 'scale-[1.06]' : 'scale-100'"
    >
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out"
        :class="showFront && frontSrc ? 'opacity-100' : 'opacity-0'"
        :style="frontSrc ? { backgroundImage: `url('${frontSrc}')` } : undefined"
      />
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out"
        :class="!showFront && backSrc ? 'opacity-100' : 'opacity-0'"
        :style="backSrc ? { backgroundImage: `url('${backSrc}')` } : undefined"
      />
    </div>
    <!-- 手机上遮罩更淡，背景切换才看得出 -->
    <div
      class="absolute inset-0 bg-white/40 transition-opacity duration-300 dark:bg-white/20"
      :class="flash ? 'opacity-100' : 'opacity-0'"
    />
    <div class="absolute inset-0 bg-default/15 dark:bg-default/25 sm:bg-default/35 sm:dark:bg-default/45" />
  </div>
</template>
