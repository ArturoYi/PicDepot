<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const uploadPanelRef = ref<{ uploadFiles: (files: File[]) => void } | null>(null)

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
  <div class="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-6">
    <UCard
      class="w-full min-w-0 max-w-xl"
      :ui="{
        root: 'bg-default/80 backdrop-blur-md shadow-lg',
        body: 'p-4 sm:p-6'
      }"
    >
      <FileUploadPanel
        ref="uploadPanelRef"
        compact
        show-result
      />
    </UCard>
  </div>
</template>
