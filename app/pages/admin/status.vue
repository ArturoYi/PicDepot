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
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        系统状态
      </h1>
      <p class="text-sm text-muted mt-1">
        存储占用与近期上传量。
      </p>
    </div>

    <div class="grid gap-3 grid-cols-1 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">
          文件总数
        </p>
        <USkeleton
          v-if="statsLoading"
          class="h-7 w-16 mt-1"
        />
        <p
          v-else
          class="text-2xl font-semibold mt-1"
        >
          {{ stats.fileCount }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          占用空间
        </p>
        <USkeleton
          v-if="statsLoading"
          class="h-7 w-24 mt-1"
        />
        <p
          v-else
          class="text-2xl font-semibold mt-1"
        >
          {{ formatBytes(stats.totalBytes) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          近 7 日上传
        </p>
        <USkeleton
          v-if="statsLoading"
          class="h-7 w-12 mt-1"
        />
        <p
          v-else
          class="text-2xl font-semibold mt-1"
        >
          {{ stats.uploadsLast7Days }}
        </p>
      </UCard>
    </div>
  </div>
</template>
