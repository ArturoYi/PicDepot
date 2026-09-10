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
    class="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-zinc-50 transition-colors duration-500 dark:bg-zinc-950"
    aria-hidden="true"
  >
    <!-- 环境微光光斑（Nuxt 绿 + 青色氛围） -->
    <div class="absolute -top-[20%] -left-[10%] h-[60vh] w-[60vw] rounded-full bg-emerald-400/15 blur-[120px] dark:bg-emerald-500/20" />
    <div class="absolute top-[40%] -right-[15%] h-[55vh] w-[55vw] rounded-full bg-teal-400/15 blur-[130px] dark:bg-teal-500/15" />
    <div class="absolute -bottom-[20%] left-[20%] h-[50vh] w-[50vw] rounded-full bg-emerald-500/10 blur-[140px] dark:bg-emerald-600/15" />

    <!-- 壁纸层（带淡入淡出与轻微缩放动效） -->
    <div
      class="absolute inset-0 origin-center transition-transform duration-700 ease-out"
      :class="pulse ? 'scale-[1.05]' : 'scale-100'"
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

    <!-- 点阵纹理增强科技质感 -->
    <div class="dot-grid-pattern absolute inset-0 opacity-40 mix-blend-overlay dark:opacity-30" />

    <!-- 切换背景瞬间的微闪高光 -->
    <div
      class="absolute inset-0 bg-white/30 transition-opacity duration-300 dark:bg-white/15"
      :class="flash ? 'opacity-100' : 'opacity-0'"
    />

    <!-- 毛玻璃遮罩渐变层 -->
    <div class="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/40 dark:from-black/30 dark:via-black/15 dark:to-black/45" />
  </div>
</template>
