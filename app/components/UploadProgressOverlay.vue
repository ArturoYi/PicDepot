<script setup lang="ts">
import type { UploadQueueItem } from './uploadQueue'

const props = defineProps<{
  open: boolean
  items: UploadQueueItem[]
}>()

const emit = defineEmits<{
  cancel: []
}>()

const active = computed(() => {
  return props.items.find(item => item.status === 'converting' || item.status === 'uploading')
    || props.items.find(item => item.status === 'queued')
    || null
})

const activeIndex = computed(() => {
  if (!active.value) return 0
  const index = props.items.findIndex(item => item.id === active.value?.id)
  return index < 0 ? 0 : index
})

const stage = computed(() => {
  const item = active.value
  if (!item || item.status === 'queued') {
    return {
      title: '正在准备',
      detail: '马上开始处理'
    }
  }
  if (item.status === 'uploading') {
    return {
      title: item.previewKind === 'video' ? '正在上传视频' : '正在上传',
      detail: '完成后即可在线预览'
    }
  }
  if (item.previewKind === 'video') {
    return {
      title: '正在压缩视频',
      detail: '保持原始分辨率，并转为可在线播放的格式'
    }
  }
  return {
    title: '正在转换图片',
    detail: '转为浏览器可以直接打开的格式'
  }
})

const progress = computed(() => Math.max(0, Math.min(100, active.value?.progress ?? 0)))
const indeterminate = computed(() =>
  active.value?.status === 'converting' && progress.value <= 0
)
const ringOffset = computed(() => {
  const radius = 46
  const length = 2 * Math.PI * radius
  return {
    length,
    offset: length * (1 - progress.value / 100)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="upload-overlay fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      :aria-label="stage.title"
    >
      <div class="upload-overlay-backdrop absolute inset-0" />
      <div class="upload-orb upload-orb-a" />
      <div class="upload-orb upload-orb-b" />

      <div class="upload-card relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/80 px-6 py-7 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/75">
        <div class="relative mx-auto size-40">
          <div
            class="upload-spin-ring absolute inset-2 rounded-full"
            :class="indeterminate ? 'upload-spin-ring-active' : 'opacity-40'"
          />
          <svg
            class="absolute inset-0 size-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              class="text-black/10 dark:text-white/15"
              stroke-width="3"
            />
            <circle
              v-if="!indeterminate"
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#upload-progress-gradient)"
              stroke-width="3.5"
              stroke-linecap="round"
              :stroke-dasharray="ringOffset.length"
              :stroke-dashoffset="ringOffset.offset"
              class="upload-ring-draw"
            />
            <defs>
              <linearGradient
                id="upload-progress-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stop-color="#34d399"
                />
                <stop
                  offset="100%"
                  stop-color="#2dd4bf"
                />
              </linearGradient>
            </defs>
          </svg>

          <div class="absolute inset-6 overflow-hidden rounded-full shadow-lg ring-4 ring-white/70 dark:ring-white/10">
            <AppMediaVideo
              v-if="active?.previewKind === 'video' && active.previewUrl"
              :src="active.previewUrl"
              class="upload-float size-full"
            />
            <AppMediaImage
              v-else-if="active?.previewUrl"
              :src="active.previewUrl"
              :alt="active.fileName"
              fit="cover"
              eager
              class="upload-float size-full"
            />
            <div
              v-else
              class="upload-float flex size-full items-center justify-center bg-gradient-to-br from-emerald-400/30 to-teal-500/20 text-emerald-700 dark:text-emerald-200"
            >
              <UIcon
                name="i-lucide-clapperboard"
                class="size-10"
              />
            </div>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-center gap-1.5">
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">
            {{ stage.title }}
          </h2>
          <span
            class="upload-dots inline-flex gap-0.5 pb-1"
            aria-hidden="true"
          >
            <i /><i /><i />
          </span>
        </div>
        <p class="mt-1 text-sm text-muted">
          {{ stage.detail }}
        </p>
        <p
          v-if="active"
          class="mt-3 truncate text-xs font-medium text-highlighted/80"
          :title="active.fileName"
        >
          {{ active.fileName }}
        </p>

        <p class="mt-4 font-mono text-3xl font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-300">
          <template v-if="indeterminate">
            ···
          </template>
          <template v-else>
            {{ progress }}<span class="text-lg">%</span>
          </template>
        </p>

        <div class="relative mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-300 ease-out"
            :class="indeterminate ? 'upload-indeterminate-bar w-1/3' : ''"
            :style="indeterminate ? undefined : { width: `${progress}%` }"
          />
          <div class="upload-shimmer pointer-events-none absolute inset-0" />
        </div>

        <div
          v-if="items.length > 1"
          class="mt-4 flex items-center justify-center gap-1.5"
        >
          <span
            v-for="(item, index) in items"
            :key="item.id"
            class="size-1.5 rounded-full transition-all duration-300"
            :class="index === activeIndex
              ? 'w-4 bg-emerald-500'
              : item.status === 'success'
                ? 'bg-emerald-400/80'
                : item.status === 'error'
                  ? 'bg-red-400'
                  : 'bg-black/15 dark:bg-white/20'"
          />
          <span class="ml-1 text-[11px] text-muted">
            {{ activeIndex + 1 }} / {{ items.length }}
          </span>
        </div>

        <p class="mt-4 text-[11px] text-muted">
          请保持页面打开，处理完成后会自动关闭
        </p>
        <UButton
          label="取消"
          color="neutral"
          variant="ghost"
          size="sm"
          class="mt-2"
          @click="emit('cancel')"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.upload-overlay-backdrop {
  background:
    radial-gradient(ellipse at 50% 40%, rgba(16, 185, 129, 0.18), transparent 55%),
    rgba(8, 12, 16, 0.55);
  backdrop-filter: blur(14px);
}

.upload-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(30px);
  opacity: 0.7;
  pointer-events: none;
}

.upload-orb-a {
  width: 14rem;
  height: 14rem;
  left: 18%;
  top: 22%;
  background: rgba(52, 211, 153, 0.45);
  animation: upload-drift 7s ease-in-out infinite;
}

.upload-orb-b {
  width: 12rem;
  height: 12rem;
  right: 16%;
  bottom: 18%;
  background: rgba(45, 212, 191, 0.35);
  animation: upload-drift 9s ease-in-out infinite reverse;
}

.upload-card {
  animation: upload-rise 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.upload-spin-ring {
  background: conic-gradient(from 90deg, transparent, rgba(16, 185, 129, 0.15), #34d399, transparent);
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
}

.upload-spin-ring-active {
  animation: upload-spin 1.4s linear infinite;
}

.upload-ring-draw {
  transition: stroke-dashoffset 0.3s ease-out;
}

.upload-float {
  animation: upload-float 3.2s ease-in-out infinite;
}

.upload-dots i {
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.45;
  animation: upload-dot 1.2s ease-in-out infinite;
}

.upload-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.upload-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

.upload-shimmer {
  background: linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.45), transparent 80%);
  transform: translateX(-100%);
  animation: upload-shimmer 1.8s ease-in-out infinite;
}

.upload-indeterminate-bar {
  animation: upload-indeterminate 1.3s ease-in-out infinite;
}

@keyframes upload-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes upload-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(16px, -18px, 0) scale(1.08); }
}

@keyframes upload-spin {
  to { transform: rotate(360deg); }
}

@keyframes upload-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.03); }
}

@keyframes upload-dot {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

@keyframes upload-shimmer {
  to { transform: translateX(100%); }
}

@keyframes upload-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}

@media (prefers-reduced-motion: reduce) {
  .upload-card,
  .upload-orb-a,
  .upload-orb-b,
  .upload-spin-ring-active,
  .upload-float,
  .upload-dots i,
  .upload-shimmer,
  .upload-indeterminate-bar {
    animation: none;
  }
}
</style>
