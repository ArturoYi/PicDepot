<script setup lang="ts">
import type { AdminFileRow } from './fileUtils'
import { formatFileBytes, isImageFile, isPreviewableFile, isVideoFile } from './fileUtils'

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
  <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 p-1">
    <div
      v-for="file in files"
      :key="file.id"
      class="relative rounded-lg ring-1 ring-default overflow-hidden bg-elevated/30"
    >
      <div class="absolute top-2 left-2 z-10">
        <UCheckbox
          :model-value="selectedIds.has(file.id)"
          @update:model-value="emit('toggle-row', file.id, !!$event)"
        />
      </div>
      <button
        type="button"
        class="block w-full aspect-square bg-elevated"
        @click="isPreviewableFile(file) ? emit('preview', file) : undefined"
      >
        <img
          v-if="isImageFile(file) && file.url"
          :src="file.url"
          :alt="file.file_name"
          class="size-full object-cover"
          loading="lazy"
        >
        <div
          v-else
          class="flex size-full items-center justify-center text-muted"
        >
          <UIcon
            :name="isVideoFile(file) ? 'i-lucide-play-circle' : 'i-lucide-file'"
            class="size-10"
          />
        </div>
      </button>
      <div class="p-2 space-y-1.5">
        <p
          class="text-xs font-medium line-clamp-2"
          :title="file.file_name"
        >
          {{ file.file_name }}
        </p>
        <p class="text-[10px] text-muted">
          {{ formatFileBytes(file.size_bytes) }}
        </p>
        <CopyLinkMenu
          v-if="file.url"
          :url="file.url"
          :file-name="file.file_name"
          size="xs"
        />
        <div class="flex gap-1">
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
      </div>
    </div>
  </div>
</template>
