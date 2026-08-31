<script setup lang="ts">
const statsLoading = ref(true)
const stats = ref({ fileCount: 0, totalBytes: 0, uploadsLast7Days: 0 })

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

onMounted(async () => {
  try {
    stats.value = await $fetch('/api/admin/stats')
  } finally {
    statsLoading.value = false
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 items-stretch">
    <div class="grid w-full grid-cols-1 content-start gap-3 sm:grid-cols-3 sm:content-center">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          文件总数
        </p>
        <USkeleton
          v-if="statsLoading"
          class="mt-2 h-8 w-16"
        />
        <p
          v-else
          class="mt-2 text-3xl font-semibold tabular-nums"
        >
          {{ stats.fileCount }}
        </p>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          占用空间
        </p>
        <USkeleton
          v-if="statsLoading"
          class="mt-2 h-8 w-24"
        />
        <p
          v-else
          class="mt-2 text-3xl font-semibold tabular-nums"
        >
          {{ formatBytes(stats.totalBytes) }}
        </p>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          近 7 日上传
        </p>
        <USkeleton
          v-if="statsLoading"
          class="mt-2 h-8 w-12"
        />
        <p
          v-else
          class="mt-2 text-3xl font-semibold tabular-nums"
        >
          {{ stats.uploadsLast7Days }}
        </p>
      </UCard>
    </div>
  </div>
</template>
