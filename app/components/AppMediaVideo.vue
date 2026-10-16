<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  fit?: 'cover' | 'contain'
}>(), {
  fit: 'cover'
})

const videoEl = ref<HTMLVideoElement | null>(null)
const failed = ref(false)

watch(() => props.src, () => {
  failed.value = false
})

function showPoster() {
  const el = videoEl.value
  if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return
  const target = Math.min(0.12, el.duration / 10)
  if (el.currentTime >= target) return
  try {
    el.currentTime = target
  } catch {
    // 部分浏览器在元数据未稳定时拒绝 seek
  }
}
</script>

<template>
  <div class="relative size-full overflow-hidden bg-black">
    <div
      v-if="failed"
      class="absolute inset-0 flex items-center justify-center text-white/70"
    >
      <UIcon
        name="i-lucide-clapperboard"
        class="size-8"
      />
    </div>
    <video
      v-else
      ref="videoEl"
      :src="src"
      muted
      playsinline
      preload="metadata"
      class="pointer-events-none absolute inset-0 size-full"
      :class="fit === 'contain' ? 'object-contain' : 'object-cover'"
      @loadedmetadata="showPoster"
      @error="failed = true"
    />
  </div>
</template>
