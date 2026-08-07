<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const { user } = useAuthSession()
const uploadPanelRef = ref<{ uploadFiles: (files: File[]) => void } | null>(null)

const maxMb = computed(() => Number(config.public.maxUploadMb) || 20)

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
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        上传文件
      </h1>
      <p class="mt-1 text-muted text-sm">
        已登录为 {{ user?.username }} · Cloudflare R2 公网直链 · 单文件 ≤ {{ maxMb }}MB
      </p>
    </div>

    <UCard>
      <FileUploadPanel
        ref="uploadPanelRef"
        show-result
      />
    </UCard>
  </div>
</template>
