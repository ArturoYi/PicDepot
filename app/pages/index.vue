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
  <div class="flex min-h-full items-center justify-center">
    <div class="w-full max-w-xl">
      <UCard
        :ui="{
          root: 'bg-default/80 backdrop-blur-md shadow-lg ring-default/60',
          body: 'p-5 sm:p-6'
        }"
      >
        <FileUploadPanel
          ref="uploadPanelRef"
          compact
          show-result
        />
      </UCard>
    </div>
  </div>
</template>
