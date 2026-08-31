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
/** 文件名 + 元信息 + 操作栏，预留给虚拟列表的固定底部高度 */
const cardFooterPx = 112
const rootEl = ref<HTMLElement | null>(null)
const { width } = useElementWidth(rootEl)

const lanes = computed(() => {
  const w = width.value || 360
  if (w >= 1280) return 5
  if (w >= 1024) return 4
  if (w >= 640) return 3
  if (w >= 400) return 2
  return 1
})

const laneWidth = computed(() => {
  const w = width.value || 360
  return Math.max(120, (w - (lanes.value - 1) * gap) / lanes.value)
})

/** 卡片总高：近似正方形图区 + 固定底部，避免操作栏被裁切 */
const estimateSize = computed(() => Math.round(laneWidth.value + cardFooterPx))

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
        class="group relative flex flex-col rounded-lg border border-default bg-default"
        :style="{ height: `${estimateSize}px` }"
      >
        <div class="absolute top-2 left-2 z-10 rounded-md bg-default/80 p-0.5">
          <UCheckbox
            :model-value="selectedIds.has(item.id)"
            @update:model-value="emit('toggle-row', item.id, !!$event)"
          />
        </div>

        <button
          type="button"
          class="relative min-h-0 w-full flex-1 overflow-hidden bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :aria-label="`预览 ${item.file_name}`"
          @click="onPreview(item)"
        >
          <img
            v-if="isImageFile(item) && item.url"
            :src="item.url"
            :alt="item.file_name"
            class="absolute inset-0 size-full object-cover object-center"
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

        <div
          class="flex shrink-0 flex-col"
          :style="{ height: `${cardFooterPx}px` }"
        >
          <div class="min-h-0 flex-1 px-2.5 pt-2 pb-1">
            <p
              class="text-xs font-medium leading-snug line-clamp-2"
              :title="item.file_name"
            >
              {{ item.file_name }}
            </p>
            <p class="mt-0.5 text-[10px] text-muted truncate">
              {{ formatFileBytes(item.size_bytes) }} · {{ item.directory || '根目录' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1 border-t border-default bg-muted px-1.5 py-1.5">
            <div
              v-if="item.url"
              class="min-w-0 flex-1"
            >
              <CopyLinkMenu
                :url="item.url"
                :file-name="item.file_name"
                size="sm"
                :block="laneWidth >= 180"
                :icon-only="laneWidth < 180"
              />
            </div>
            <UButton
              size="sm"
              variant="soft"
              class="shrink-0"
              icon="i-lucide-pencil"
              aria-label="编辑"
              title="编辑"
              @click="emit('edit', item)"
            />
            <UButton
              size="sm"
              variant="soft"
              color="error"
              class="shrink-0"
              icon="i-lucide-trash-2"
              aria-label="删除"
              title="删除"
              @click="emit('delete', item)"
            />
          </div>
        </div>
      </article>
    </UScrollArea>
  </div>
</template>
