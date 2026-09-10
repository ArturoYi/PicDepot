<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const uploadPanelRef = ref<{ uploadFiles: (files: File[]) => void } | null>(null)
const { directory } = useUploadPreferences()
const directoryHint = computed(() =>
  directory.value.trim()
    ? `将上传到 ${directory.value.trim()}`
    : '支持多图；未选目录时按类型自动归类'
)

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})

function onPaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return
  const files: File[] = []
  for (const item of items) {
    if (item.kind === 'file') {
      const f = item.getAsFile()
      if (f) files.push(f)
    }
  }
  if (files.length) {
    event.preventDefault()
    uploadPanelRef.value?.uploadFiles(files)
  }
}
</script>

<template>
  <div class="flex w-full min-h-full items-center justify-center py-4 sm:py-6">
    <UCard
      class="w-full min-w-0 max-w-xl"
      :ui="{
        root: 'bg-default/80 backdrop-blur-md shadow-lg',
        header: 'p-3 sm:p-4',
        body: 'p-3 sm:p-6'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2.5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UIcon
                name="i-lucide-cloud-upload"
                class="size-5"
              />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-highlighted">
                上传文件
              </p>
              <p class="truncate text-xs text-muted">
                {{ directoryHint }}
              </p>
            </div>
          </div>
          <UploadDirectoryButton class="shrink-0" />
        </div>
      </template>
      <FileUploadPanel
        ref="uploadPanelRef"
        compact
        show-result
      />
    </UCard>
  </div>
</template>
