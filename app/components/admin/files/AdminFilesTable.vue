<script setup lang="ts">
import type { AdminFileRow } from './fileUtils'
import {
  formatFileBytes,
  formatFileTime,
  fileContentType,
  isImageFile,
  isPreviewableFile,
  isVideoFile
} from './fileUtils'

defineProps<{
  files: AdminFileRow[]
  selectedIds: Set<string>
  selectAll: boolean
}>()

const emit = defineEmits<{
  'toggle-all': [checked: boolean]
  'toggle-row': [id: string, checked: boolean]
  preview: [row: AdminFileRow]
  edit: [row: AdminFileRow]
  delete: [row: AdminFileRow]
}>()

const tableColumns = [
  { accessorKey: 'select', header: '', meta: { class: { th: 'w-10', td: 'w-10' } } },
  { accessorKey: 'preview', header: '预览', meta: { class: { th: 'w-14', td: 'w-14' } } },
  { accessorKey: 'file_name', header: '文件名', meta: { class: { th: 'min-w-[12rem]', td: 'min-w-[12rem] max-w-[20rem]' } } },
  { accessorKey: 'content_type', header: '类型', meta: { class: { th: 'min-w-[7rem]', td: 'min-w-[7rem]' } } },
  { accessorKey: 'size_bytes', header: '大小', meta: { class: { th: 'w-24 whitespace-nowrap', td: 'w-24 whitespace-nowrap' } } },
  { accessorKey: 'directory', header: '目录', meta: { class: { th: 'min-w-[6rem]', td: 'min-w-[6rem]' } } },
  { accessorKey: 'created_at', header: '上传时间', meta: { class: { th: 'min-w-[9rem] whitespace-nowrap', td: 'min-w-[9rem] whitespace-nowrap' } } },
  { accessorKey: 'uploader_ip', header: '上传 IP', meta: { class: { th: 'min-w-[7rem]', td: 'min-w-[7rem]' } } },
  { accessorKey: 'copy', header: '复制', meta: { class: { th: 'w-24', td: 'w-24' } } },
  { accessorKey: 'actions', header: '操作', meta: { class: { th: 'w-24', td: 'w-24' } } }
]
</script>

<template>
  <div class="hidden lg:block w-full overflow-x-auto">
    <UTable
      sticky
      :data="files"
      :columns="tableColumns"
      class="w-full min-w-[1080px]"
    >
      <template #select-header>
        <UCheckbox
          :model-value="selectAll"
          @update:model-value="emit('toggle-all', !!$event)"
        />
      </template>
      <template #select-cell="{ row }">
        <UCheckbox
          :model-value="selectedIds.has(String(row.original.id))"
          @update:model-value="emit('toggle-row', String(row.original.id), !!$event)"
        />
      </template>
      <template #preview-cell="{ row }">
        <button
          v-if="isPreviewableFile(row.original as AdminFileRow)"
          type="button"
          class="block rounded-md overflow-hidden ring-1 ring-default hover:ring-primary"
          @click="emit('preview', row.original as AdminFileRow)"
        >
          <img
            v-if="isImageFile(row.original as AdminFileRow)"
            :src="String(row.original.url)"
            :alt="String(row.original.file_name)"
            class="size-10 object-cover bg-elevated"
            loading="lazy"
          >
          <span
            v-else
            class="flex size-10 items-center justify-center bg-elevated text-primary"
          >
            <UIcon
              name="i-lucide-play"
              class="size-5"
            />
          </span>
        </button>
        <UIcon
          v-else
          name="i-lucide-file"
          class="size-5 text-muted"
        />
      </template>
      <template #file_name-cell="{ row }">
        <div class="min-w-0">
          <p
            class="font-medium truncate"
            :title="String(row.original.file_name)"
          >
            {{ row.original.file_name }}
          </p>
          <p
            v-if="row.original.id"
            class="text-[11px] text-muted truncate"
            :title="String(row.original.id)"
          >
            ID {{ row.original.id }}
          </p>
        </div>
      </template>
      <template #content_type-cell="{ row }">
        <span
          class="text-xs truncate block max-w-[10rem]"
          :title="fileContentType(row.original as AdminFileRow)"
        >{{ fileContentType(row.original as AdminFileRow) }}</span>
      </template>
      <template #size_bytes-cell="{ row }">
        {{ formatFileBytes(Number(row.original.size_bytes) || 0) }}
      </template>
      <template #directory-cell="{ row }">
        <span class="text-sm truncate block max-w-[8rem]">{{ row.original.directory || '根目录' }}</span>
      </template>
      <template #created_at-cell="{ row }">
        <span class="text-xs text-muted">{{ formatFileTime(Number(row.original.created_at)) }}</span>
      </template>
      <template #uploader_ip-cell="{ row }">
        <span class="text-xs font-mono">{{ row.original.uploader_ip || '—' }}</span>
      </template>
      <template #copy-cell="{ row }">
        <CopyLinkMenu
          v-if="row.original.url"
          :url="String(row.original.url)"
          :file-name="String(row.original.file_name)"
        />
        <span
          v-else
          class="text-xs text-muted"
        >无直链</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-0.5">
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-pencil"
            @click="emit('edit', row.original as AdminFileRow)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            @click="emit('delete', row.original as AdminFileRow)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
