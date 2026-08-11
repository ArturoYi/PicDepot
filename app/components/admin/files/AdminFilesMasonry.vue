<script setup lang="ts">
import type { AdminFileRow } from './fileUtils'
import {
  formatFileBytes,
  formatFileTime,
  isImageFile,
  isPreviewableFile,
  isVideoFile
} from './fileUtils'

defineProps<{
  files: AdminFileRow[]
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  'toggle-row': [id: string, checked: boolean]
  'preview': [row: AdminFileRow]
  'edit': [row: AdminFileRow]
  'delete': [row: AdminFileRow]
}>()

const gap = 12
const rootEl = ref<HTMLElement | null>(null)
const { width } = useElementWidth(rootEl)

const lanes = computed(() => {
  const w = width.value || 360
  if (w >= 1280) return 5
  if (w >= 1024) return 4
  if (w >= 640) return 3
  return 2
})

const laneWidth = computed(() => {
  const w = width.value || 360
  return Math.max(120, (w - (lanes.value - 1) * gap) / lanes.value)
})

/** 缩略图区 + 底部信息栏的估计高度 */
const estimateSize = computed(() => Math.round(laneWidth.value + 88))

const virtualize = computed(() => ({
  gap,
  lanes: lanes.value,
  estimateSize: estimateSize.value,
  overscan: 4,
  skipMeasurement: true,
  paddingStart: 8,
  paddingEnd: 8
}))

function onPreview(file: AdminFileRow) {
  if (isPreviewableFile(file)) emit('preview', file)
}
</script>

<template>
  <div
    ref="rootEl"
    class="size-full min-h-0"
  >
    <UScrollArea
      v-slot="{ item, index }"
      :items="files"
      :virtualize="virtualize"
      shadow
      class="size-full"
    >
      <article
        class="group relative flex h-full flex-col overflow-hidden rounded-lg bg-elevated/40 ring-1 ring-default"
      >
        <div class="absolute top-2 left-2 z-10">
          <UCheckbox
            :model-value="selectedIds.has(item.id)"
            @update:model-value="emit('toggle-row', item.id, !!$event)"
          />
        </div>

        <button
          type="button"
          class="relative block w-full aspect-square bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :aria-label="`预览 ${item.file_name}`"
          @click="onPreview(item)"
        >
          <img
            v-if="isImageFile(item) && item.url"
            :src="item.url"
            :alt="item.file_name"
            class="size-full object-cover"
            :loading="index < lanes * 2 ? 'eager' : 'lazy'"
            decoding="async"
          >
          <div
            v-else
            class="flex size-full items-center justify-center text-muted"
          >
            <UIcon
              :name="isVideoFile(item) ? 'i-lucide-play-circle' : 'i-lucide-file'"
              class="size-10"
            />
          </div>
          <span
            v-if="isPreviewableFile(item)"
            class="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10"
          />
        </button>

        <div class="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
          <p
            class="text-xs font-medium leading-snug line-clamp-2"
            :title="item.file_name"
          >
            {{ item.file_name }}
          </p>
          <p class="text-[10px] text-muted truncate">
            {{ formatFileBytes(item.size_bytes) }} · {{ formatFileTime(item.created_at) }}
          </p>
          <div class="mt-auto flex items-center gap-0.5">
            <CopyLinkMenu
              v-if="item.url"
              :url="item.url"
              :file-name="item.file_name"
              size="xs"
            />
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="编辑"
              @click="emit('edit', item)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              aria-label="删除"
              @click="emit('delete', item)"
            />
          </div>
        </div>
      </article>
    </UScrollArea>
  </div>
</template>
