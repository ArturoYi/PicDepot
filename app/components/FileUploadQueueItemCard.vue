<script setup lang="ts">
import type { UploadQueueItem } from './uploadQueue'
import { uploadStatusMeta } from './uploadQueue'

const props = defineProps<{
  item: UploadQueueItem
  showResult?: boolean
}>()

const meta = computed(() => uploadStatusMeta[props.item.status])
const showProgress = computed(() =>
  props.item.status === 'converting' || props.item.status === 'uploading'
)
const progressValue = computed(() =>
  props.item.status === 'converting' ? null : props.item.progress
)
</script>

<template>
  <article class="ui-frame h-full">
    <div class="ui-frame-clip relative aspect-square bg-elevated">
      <AppMediaImage
        v-if="item.previewUrl"
        :src="item.previewUrl"
        :alt="item.fileName"
        fit="cover"
        eager
      />
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-2 text-muted"
      >
        <UIcon
          name="i-lucide-image"
          class="size-10"
        />
        <p class="px-4 text-center text-xs">
          {{ item.status === 'converting' ? '正在转换以便预览' : '暂无预览' }}
        </p>
      </div>

      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2.5">
        <UBadge
          :color="meta.color"
          :label="meta.label"
          variant="soft"
          size="sm"
          class="backdrop-blur-sm"
        >
          <template #leading>
            <UIcon
              :name="meta.icon"
              class="size-3.5"
              :class="item.status === 'converting' || item.status === 'uploading' ? 'animate-spin' : ''"
            />
          </template>
        </UBadge>
      </div>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 p-3">
        <p
          class="truncate text-sm font-medium text-white"
          :title="item.fileName"
        >
          {{ item.fileName }}
        </p>

        <UProgress
          v-if="showProgress"
          :model-value="progressValue"
          :max="100"
          size="sm"
          :status="item.status === 'uploading'"
          :color="item.status === 'converting' ? 'warning' : 'primary'"
        />

        <p
          v-else-if="item.status === 'success'"
          class="text-xs text-white/80"
        >
          上传完成
        </p>

        <p
          v-else-if="item.status === 'error'"
          class="line-clamp-2 text-xs text-error"
        >
          {{ item.error || '上传失败' }}
        </p>

        <p
          v-else
          class="text-xs text-white/70"
        >
          排队等待上传
        </p>

        <div
          v-if="showResult && item.result"
          class="pointer-events-auto"
        >
          <CopyLinkMenu
            :url="item.result.url"
            :file-name="item.result.fileName"
            size="sm"
            block
          />
        </div>
      </div>
    </div>
  </article>
</template>
