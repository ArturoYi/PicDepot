<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const uploadPanelRef = ref<{ uploadFiles: (files: File[]) => void } | null>(null)
const { directory } = useUploadPreferences()
const directoryHint = computed(() =>
  directory.value.trim()
    ? `将上传至「${directory.value.trim()}」目录`
    : '未指定目录时将按类型自动归类'
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
  <div class="flex w-full min-h-full items-center justify-center py-6 sm:py-10">
    <div class="relative w-full min-w-0 max-w-xl">
      <!-- 背后微光光晕 -->
      <div class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 blur-xl dark:from-emerald-500/25 dark:via-teal-500/15 dark:to-emerald-500/25 opacity-70" />

      <!-- 主卡片 -->
      <UCard
        class="relative w-full min-w-0 overflow-visible glass-card rounded-2xl border border-white/40 dark:border-white/10 shadow-xl"
        :ui="{
          header: 'p-3.5 sm:p-5 border-b border-default/40',
          body: 'p-3.5 sm:p-6'
        }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 text-primary border border-primary/20 shadow-xs">
                <UIcon
                  name="i-lucide-cloud-upload"
                  class="size-5.5 text-primary"
                />
                <span class="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 ring-2 ring-default animate-pulse-glow" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm sm:text-base font-bold text-highlighted tracking-tight">
                    上传文件
                  </h2>
                  <UBadge
                    size="xs"
                    color="primary"
                    variant="subtle"
                    class="rounded-md font-mono text-[10px]"
                  >
                    Cloudflare R2
                  </UBadge>
                </div>
                <p class="truncate text-xs text-muted mt-0.5">
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

        <!-- 底部快捷提示栏 -->
        <div class="mt-4 pt-3.5 border-t border-default/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-clipboard"
              class="size-3.5 text-primary"
            />
            <span>支持 <kbd class="px-1.5 py-0.5 rounded bg-elevated border border-default/60 font-mono text-[10px] text-highlighted">Ctrl + V</kbd> 粘贴剪贴板图片</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5 text-emerald-500"
            />
            <span>HEIC 自动转码 WebP</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
