<script setup lang="ts">
import type { AdminFileRow } from './fileUtils'
import {
  formatFileBytes,
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

const gap = 10
/** 文件名 + 元信息 + 操作栏，仅桌面卡片预留 */
const desktopFooterPx = 88
const rootEl = ref<HTMLElement | null>(null)
const { width } = useElementWidth(rootEl)

const overlayLayout = computed(() => (width.value || 360) < 640)

const lanes = computed(() => {
  const w = width.value || 360
  if (w >= 1280) return 5
  if (w >= 1024) return 4
  if (w >= 768) return 3
  return 2
})

const laneWidth = computed(() => {
  const w = width.value || 360
  return Math.max(120, (w - (lanes.value - 1) * gap) / lanes.value)
})

const cardFooterPx = computed(() => overlayLayout.value ? 0 : desktopFooterPx)

/** 卡片总高：图区接近正方形，避免操作栏挤掉缩略图 */
const estimateSize = computed(() => Math.round(laneWidth.value + cardFooterPx.value))

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
        class="ui-frame group relative"
        :class="selectedIds.has(item.id) ? '!border-primary' : ''"
        :style="{ height: `${estimateSize}px` }"
      >
        <div class="ui-frame-clip relative flex h-full flex-col bg-default">
          <div class="absolute top-2 left-2 z-10 rounded-md bg-default/80 p-0.5 backdrop-blur-sm">
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
            <AppMediaImage
              v-if="isImageFile(item) && item.url"
              :src="item.url"
              :alt="item.file_name"
              :eager="index < lanes * 2"
            />
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
            v-if="overlayLayout"
            class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 to-transparent px-2 pt-8 pb-2"
          >
            <p
              class="truncate text-[11px] font-medium text-white"
              :title="item.file_name"
            >
              {{ item.file_name }}
            </p>
            <div class="pointer-events-auto mt-1.5 flex items-center gap-1">
              <div
                v-if="item.url"
                class="min-w-0 flex-1"
              >
                <CopyLinkMenu
                  :url="item.url"
                  :file-name="item.file_name"
                  size="xs"
                  icon-only
                />
              </div>
              <UButton
                size="xs"
                color="neutral"
                variant="soft"
                class="shrink-0"
                icon="i-lucide-pencil"
                aria-label="编辑"
                title="编辑"
                @click="emit('edit', item)"
              />
              <UButton
                size="xs"
                color="error"
                variant="soft"
                class="shrink-0"
                icon="i-lucide-trash-2"
                aria-label="删除"
                title="删除"
                @click="emit('delete', item)"
              />
            </div>
          </div>

          <div
            v-else
            class="flex shrink-0 flex-col"
            :style="{ height: `${cardFooterPx}px` }"
          >
            <div class="min-h-0 flex-1 px-2.5 pt-2 pb-1">
              <p
                class="truncate text-xs font-medium"
                :title="item.file_name"
              >
                {{ item.file_name }}
              </p>
              <p class="mt-0.5 truncate text-[10px] text-muted">
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
                color="error"
                variant="soft"
                class="shrink-0"
                icon="i-lucide-trash-2"
                aria-label="删除"
                title="删除"
                @click="emit('delete', item)"
              />
            </div>
          </div>
        </div>
      </article>
    </UScrollArea>
  </div>
</template>
