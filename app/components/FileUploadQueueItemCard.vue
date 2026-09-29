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
  <article class="ui-frame group relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg border-default/80">
    <div class="ui-frame-clip relative aspect-square bg-elevated/80">
      <!-- 预览图 -->
      <AppMediaImage
        v-if="item.previewUrl"
        :src="item.previewUrl"
        :alt="item.fileName"
        fit="cover"
        eager
        class="transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-2.5 text-muted bg-gradient-to-b from-elevated to-default"
      >
        <div class="flex size-12 items-center justify-center rounded-2xl bg-default/80 text-muted shadow-2xs">
          <UIcon
            name="i-lucide-file-image"
            class="size-6"
          />
        </div>
        <p class="px-4 text-center text-xs text-muted">
          {{ item.status === 'converting' ? '正在转换格式以便预览' : '无图片预览' }}
        </p>
      </div>

      <!-- 渐变遮罩增强文字可读性 -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      <!-- 状态微光胶囊 -->
      <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2.5">
        <UBadge
          :color="meta.color"
          :label="meta.label"
          variant="subtle"
          size="sm"
          class="backdrop-blur-md bg-black/40 border border-white/20 text-white shadow-xs"
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

      <!-- 底部文件信息与进度/结果 -->
      <div class="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 p-3 sm:p-3.5">
        <p
          class="truncate text-xs sm:text-sm font-semibold text-white drop-shadow-sm"
          :title="item.fileName"
        >
          {{ item.fileName }}
        </p>

        <div
          v-if="showProgress"
          class="space-y-1"
        >
          <UProgress
            :model-value="progressValue"
            :max="100"
            size="sm"
            :status="item.status === 'uploading'"
            :color="item.status === 'converting' ? 'warning' : 'primary'"
            class="rounded-full shadow-xs"
          />
          <div class="flex items-center justify-between text-[10px] text-white/80">
            <span>{{ item.status === 'converting' ? '转码中…' : '正在上传到 R2…' }}</span>
            <span
              v-if="item.status === 'uploading'"
              class="font-mono tabular-nums"
            >{{ item.progress }}%</span>
          </div>
        </div>

        <div
          v-else-if="item.status === 'success'"
          class="flex items-center gap-1.5 text-xs font-medium text-emerald-300"
        >
          <UIcon
            name="i-lucide-check-circle-2"
            class="size-3.5"
          />
          <span>上传完成</span>
        </div>

        <p
          v-else-if="item.status === 'error'"
          class="line-clamp-2 text-xs font-medium text-red-400"
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
          class="pointer-events-auto pt-0.5"
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
