<script setup lang="ts">
import { isHeicLikeFile } from '~/utils/heicDetect'
import { resolveUploadDirectory } from '~/utils/uploadDirectory'

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
const uploadProgress = ref(0)
const progressLabel = ref('')
const directoryItems = ref<string[]>([])
const folderInputRef = ref<HTMLInputElement | null>(null)
const lastResult = ref<{
  url: string
  fileName: string
  size: number
  id: string
} | null>(null)

const maxMb = computed(() => Number(config.public.maxUploadMb) || 20)

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

async function uploadOne(file: File) {
  if (file.size > maxMb.value * 1024 * 1024) {
    throw new Error(`「${file.name}」超过 ${maxMb.value}MB 限制`)
  }

  uploadProgress.value = 0
  progressLabel.value = isHeicLikeFile(file)
    ? `转换 HEIC：${file.name}`
    : file.name

  const prepared = isHeicLikeFile(file)
    ? await (await import('~/utils/prepareUploadFile.client')).prepareUploadFile(file)
    : file
  if (prepared.size > maxMb.value * 1024 * 1024) {
    throw new Error(`「${file.name}」转换后超过 ${maxMb.value}MB 限制`)
  }

  progressLabel.value = prepared.name !== file.name
    ? `${file.name} → ${prepared.name}`
    : prepared.name

  const targetDir = resolveUploadDirectory(prepared, directory.value)
  const result = await uploadFileWithProgress(prepared, {
    directory: targetDir,
    onProgress: (p) => {
      uploadProgress.value = p
    }
  })
  lastResult.value = {
    url: result.url,
    fileName: result.fileName,
    size: result.size,
    id: result.id
  }
}

async function uploadFiles(raw: File[]) {
  const list = raw.filter(f => f.name && !f.name.startsWith('.'))
  if (!list.length) return

  uploading.value = true
  let successCount = 0
  try {
    for (let i = 0; i < list.length; i++) {
      const file = list[i]!
      if (list.length > 1) {
        progressLabel.value = `${file.name}（${i + 1}/${list.length}）`
      }
      try {
        await uploadOne(file)
        successCount++
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '未知错误'
        toast.add({
          title: `上传失败：${file.name}`,
          description: message,
          color: 'error'
        })
        break
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
    uploadProgress.value = 0
    progressLabel.value = ''
  }
}

function onSelect(file: File | File[] | null | undefined) {
  const list = Array.isArray(file) ? file : file ? [file] : []
  if (!list.length) return
  uploadFiles(list)
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
  <div class="space-y-4">
    <UFormField
      v-if="!compact"
      label="目录（可选）"
      hint="留空则图片入 image、视频入 video；填写后所有文件使用该目录"
    >
      <UInputMenu
        v-model="directory"
        :items="directoryItems"
        placeholder="留空按类型自动归类"
        icon="i-lucide-folder"
        create-item
        class="w-full"
      />
    </UFormField>

    <UFileUpload
      multiple
      accept="image/*,.heic,.heif,video/*,audio/*,.pdf,.zip"
      :label="compact ? '拖拽或点击上传' : '拖拽、点击或粘贴上传'"
      :description="compact ? undefined : '支持多文件；HEIC 会自动转为 WebP/JPEG 以便预览'"
      :disabled="uploading"
      @update:model-value="onSelect"
    />

    <div
      v-if="!compact"
      class="flex flex-wrap gap-2"
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

    <div
      v-if="uploading"
      class="space-y-2"
    >
      <p class="text-sm text-muted truncate">
        {{ progressLabel || '上传中…' }}
      </p>
      <UProgress
        :model-value="uploadProgress"
        :max="100"
      />
    </div>

    <div
      v-if="showResult && lastResult"
      class="rounded-lg border border-default bg-elevated/60 p-3 space-y-2"
    >
      <div class="flex min-w-0 items-start justify-between gap-2">
        <span class="text-sm font-medium min-w-0 truncate">{{ lastResult.fileName }}</span>
        <CopyLinkMenu
          :url="lastResult.url"
          :file-name="lastResult.fileName"
          size="sm"
          class="shrink-0"
        />
      </div>
      <a
        :href="lastResult.url"
        target="_blank"
        class="block text-xs text-primary break-all underline"
      >{{ lastResult.url }}</a>
    </div>
  </div>
</template>
