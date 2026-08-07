<script setup lang="ts">
import type { AdminFileRow } from './fileUtils'
import {
  formatFileBytes,
  formatFileTime,
  fileContentType,
  isImageFile,
  isPreviewableFile
} from './fileUtils'

defineProps<{
  files: AdminFileRow[]
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  'toggle-row': [id: string, checked: boolean]
  preview: [row: AdminFileRow]
  edit: [row: AdminFileRow]
  delete: [row: AdminFileRow]
}>()
</script>

<template>
  <div class="lg:hidden divide-y divide-default">
    <article
      v-for="file in files"
      :key="file.id"
      class="flex gap-3 p-3"
    >
      <UCheckbox
        class="mt-2 shrink-0"
        :model-value="selectedIds.has(file.id)"
        @update:model-value="emit('toggle-row', file.id, !!$event)"
      />
      <button
        v-if="isPreviewableFile(file)"
        type="button"
        class="shrink-0 rounded-md overflow-hidden ring-1 ring-default"
        @click="emit('preview', file)"
      >
        <img
          v-if="isImageFile(file)"
          :src="file.url!"
          :alt="file.file_name"
          class="size-16 object-cover bg-elevated"
          loading="lazy"
        >
        <span
          v-else
          class="flex size-16 items-center justify-center bg-elevated text-primary"
        >
          <UIcon
            name="i-lucide-play"
            class="size-7"
          />
        </span>
      </button>
      <UIcon
        v-else
        name="i-lucide-file"
        class="size-16 shrink-0 p-4 text-muted bg-elevated rounded-md"
      />
      <div class="min-w-0 flex-1 space-y-2">
        <p
          class="font-medium text-sm leading-snug break-all"
        >
          {{ file.file_name }}
        </p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-muted">
          <dt>类型</dt>
          <dd class="truncate">
            {{ fileContentType(file) }}
          </dd>
          <dt>大小</dt>
          <dd>{{ formatFileBytes(file.size_bytes) }}</dd>
          <dt>目录</dt>
          <dd class="truncate">
            {{ file.directory || '根目录' }}
          </dd>
          <dt>上传</dt>
          <dd>{{ formatFileTime(file.created_at) }}</dd>
          <dt>IP</dt>
          <dd class="font-mono">
            {{ file.uploader_ip || '—' }}
          </dd>
        </dl>
        <CopyLinkMenu
          v-if="file.url"
          :url="file.url"
          :file-name="file.file_name"
          size="sm"
        />
        <span
          v-else
          class="text-xs text-muted"
        >未配置 R2 公网 URL</span>
      </div>
      <div class="flex shrink-0 flex-col gap-1">
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-pencil"
          @click="emit('edit', file)"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          @click="emit('delete', file)"
        />
      </div>
    </article>
  </div>
</template>
