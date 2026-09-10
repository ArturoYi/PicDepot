<script setup lang="ts">
import type { UploadQueueItem } from './uploadQueue'

const props = defineProps<{
  items: UploadQueueItem[]
  showResult?: boolean
}>()

const { width } = useWindowWidth()
const isMobile = computed(() => width.value < 640)
const carousel = useTemplateRef<{
  emblaApi?: { scrollTo: (index: number) => void } | { value?: { scrollTo: (index: number) => void } }
}>('carousel')

const batchKey = computed(() => props.items.map(item => item.id).join('|'))
const currentIndex = ref(0)

function resolveItem(item: UploadQueueItem) {
  return props.items.find(entry => entry.id === item.id) || item
}

function emblaScrollTo(index: number) {
  const api = carousel.value?.emblaApi
  if (!api) return
  if (typeof (api as { scrollTo?: unknown }).scrollTo === 'function') {
    (api as { scrollTo: (index: number) => void }).scrollTo(index)
    return
  }
  const inner = (api as { value?: { scrollTo: (index: number) => void } }).value
  inner?.scrollTo?.(index)
}

watch(batchKey, () => {
  currentIndex.value = 0
})

watch(
  () => props.items.map(item => item.status).join(),
  () => {
    if (!isMobile.value || props.items.length < 2) return
    const index = props.items.findIndex(item =>
      item.status === 'converting' || item.status === 'uploading'
    )
    if (index < 0) return
    nextTick(() => emblaScrollTo(index))
  }
)
</script>

<template>
  <div
    v-if="items.length"
    class="min-w-0 pt-1"
  >
    <ClientOnly>
      <template v-if="isMobile">
        <div
          v-if="items.length > 1"
          class="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted font-medium"
        >
          <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>文件 {{ currentIndex + 1 }} / {{ items.length }}</span>
        </div>

        <UCarousel
          :key="batchKey"
          ref="carousel"
          v-slot="{ item }"
          :items="items"
          :dots="items.length > 1"
          align="center"
          class="w-full"
          :ui="{
            dots: 'relative inset-x-0 bottom-0 mt-3'
          }"
          @select="currentIndex = $event"
        >
          <FileUploadQueueItemCard
            :item="resolveItem(item)"
            :show-result="showResult"
          />
        </UCarousel>
      </template>

      <div
        v-else
        class="grid max-h-[min(28rem,50dvh)] gap-3.5 overflow-y-auto overscroll-contain p-0.5"
        :class="items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'"
      >
        <FileUploadQueueItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :show-result="showResult"
        />
      </div>

      <template #fallback>
        <USkeleton class="aspect-square w-full rounded-2xl" />
      </template>
    </ClientOnly>
  </div>
</template>
