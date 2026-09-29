<script setup lang="ts">
import { needsClientImageConvert } from '~/utils/needsClientImageConvert'
import { resolveUploadDirectory } from '~/utils/uploadDirectory'
import type { UploadQueueItem } from './uploadQueue'

const props = withDefaults(defineProps<{
  directoriesEndpoint?: string
  compact?: boolean
  showResult?: boolean
}>(), {
  directoriesEndpoint: '/api/directories',
  compact: false,
  showResult: false
})

const emit = defineEmits<{
  uploaded: []
}>()

const config = useRuntimeConfig()
const toast = useToast()
const { directory } = useUploadPreferences()

const uploading = ref(false)
const directoryItems = ref<string[]>([])
const folderInputRef = ref<HTMLInputElement | null>(null)
const picked = ref<File[] | null>(null)
const items = ref<UploadQueueItem[]>([])

const maxMb = computed(() => Number(config.public.maxUploadMb) || 20)

function canPreview(file: File) {
  return file.type.startsWith('image/') && !needsClientImageConvert(file)
}

function revokePreview(item: UploadQueueItem) {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
    item.previewUrl = null
  }
}

function revokeAll() {
  for (const item of items.value) revokePreview(item)
}

function createItem(file: File): UploadQueueItem {
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    previewUrl: canPreview(file) ? URL.createObjectURL(file) : null,
    progress: 0,
    status: 'queued'
  }
}

async function loadDirectories() {
  try {
    const res = await $fetch<{ directories: string[] }>(props.directoriesEndpoint)
    directoryItems.value = res.directories
  } catch {
    directoryItems.value = []
  }
}

onMounted(() => {
  if (!props.compact) {
    loadDirectories()
  }
})

onUnmounted(revokeAll)

async function uploadOne(item: UploadQueueItem, file: File) {
  if (file.size > maxMb.value * 1024 * 1024) {
    throw new Error(`「${file.name}」超过 ${maxMb.value}MB 限制`)
  }

  let prepared = file
  if (needsClientImageConvert(file)) {
    item.status = 'converting'
    item.progress = 0
    prepared = await (await import('~/utils/prepareUploadFile.client')).prepareUploadFile(file)
    if (prepared.size > maxMb.value * 1024 * 1024) {
      throw new Error(`「${file.name}」转换后超过 ${maxMb.value}MB 限制`)
    }
    revokePreview(item)
    item.fileName = prepared.name !== file.name ? `${file.name} → ${prepared.name}` : prepared.name
    item.previewUrl = URL.createObjectURL(prepared)
  }

  item.status = 'uploading'
  item.progress = 0

  const targetDir = resolveUploadDirectory(prepared, directory.value)
  const result = await uploadFileWithProgress(prepared, {
    directory: targetDir,
    onProgress: (percent) => {
      item.progress = percent
    }
  })

  item.progress = 100
  item.status = 'success'
  item.result = {
    url: result.url,
    fileName: result.fileName,
    size: result.size,
    id: result.id
  }
}

async function uploadFiles(raw: File[]) {
  const list = raw.filter(f => f.name && !f.name.startsWith('.'))
  if (!list.length) return

  if (uploading.value) {
    toast.add({
      title: '请等待当前上传完成',
      color: 'warning'
    })
    return
  }

  revokeAll()
  items.value = list.map(createItem)
  uploading.value = true
  let successCount = 0

  try {
    for (let i = 0; i < list.length; i++) {
      const file = list[i]!
      const item = items.value[i]!
      try {
        await uploadOne(item, file)
        successCount++
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '未知错误'
        item.status = 'error'
        item.error = message
        toast.add({
          title: `上传失败：${file.name}`,
          description: message,
          color: 'error'
        })
      }
    }

    if (successCount > 0) {
      toast.add({
        title: successCount > 1 ? `已完成 ${successCount} 个文件` : '上传成功',
        color: 'success'
      })
      emit('uploaded')
      if (!props.compact) {
        await loadDirectories()
      }
    }
  } finally {
    uploading.value = false
    picked.value = null
  }
}

function onSelect(file: File[] | null | undefined) {
  const list = file ?? []
  if (!list.length) return
  uploadFiles(list)
}

function onCreateDirectory(name: string) {
  const next = name.trim()
  directory.value = next
  if (next && !directoryItems.value.includes(next)) {
    directoryItems.value = [...directoryItems.value, next]
  }
}

function onFolderPick(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? [...input.files] : []
  input.value = ''
  if (files.length) uploadFiles(files)
}

defineExpose({ loadDirectories, uploadFiles })
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4">
    <UFormField
      v-if="!compact"
      label="目录（可选）"
      hint="留空则图片入 image、视频入 video；填写后所有文件使用该目录"
    >
      <UInputMenu
        v-model="directory"
        mode="autocomplete"
        :items="directoryItems"
        placeholder="留空按类型自动归类"
        icon="i-lucide-folder"
        create-item
        class="w-full"
        @create="onCreateDirectory"
      />
    </UFormField>

    <UFileUpload
      v-model="picked"
      multiple
      accept="image/*,.heic,.heif,.tif,.tiff,video/*,audio/*,.pdf,.zip"
      :label="uploading ? '正在上传…' : compact ? '拖拽或点击上传' : '拖拽、点击或粘贴上传'"
      :description="compact ? undefined : '支持多文件；HEIC、TIFF 会自动转为 WebP/JPEG 以便预览'"
      :disabled="uploading"
      :preview="false"
      icon="i-lucide-image-plus"
      class="w-full shrink-0"
      :ui="{ base: items.length ? 'min-h-20 sm:min-h-24' : 'min-h-28 sm:min-h-40' }"
      @update:model-value="onSelect"
    />

    <div
      v-if="!compact"
      class="flex shrink-0 flex-wrap gap-2"
    >
      <UButton
        icon="i-lucide-folder-up"
        label="选择文件夹上传"
        color="neutral"
        variant="soft"
        :disabled="uploading"
        @click="folderInputRef?.click()"
      />
      <input
        ref="folderInputRef"
        type="file"
        class="hidden"
        multiple
        webkitdirectory
        @change="onFolderPick"
      >
    </div>

    <FileUploadQueue
      :items="items"
      :show-result="showResult"
      class="min-h-0"
    />
  </div>
</template>
