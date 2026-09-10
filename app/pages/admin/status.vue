<script setup lang="ts">
import { formatFileBytes } from '~/components/admin/files/fileUtils'

interface TypeStat {
  count: number
  bytes: number
}

interface AdminStats {
  fileCount: number
  totalBytes: number
  averageBytes: number
  directoryCount: number
  uploadsLast24Hours: number
  uploadsLast7Days: number
  uploadsLast30Days: number
  bytesLast7Days: number
  quotaBytes: number
  usagePercent: number | null
  types: {
    image: TypeStat
    video: TypeStat
    audio: TypeStat
    other: TypeStat
  }
  topDirectories: Array<{ directory: string, count: number, bytes: number }>
  runtime: {
    db: boolean
    bucket: boolean
    r2PublicBaseUrlConfigured: boolean
    maxUploadBytes: number
  }
}

const emptyTypes = { count: 0, bytes: 0 }
const statsLoading = ref(true)
const stats = ref<AdminStats>({
  fileCount: 0,
  totalBytes: 0,
  averageBytes: 0,
  directoryCount: 0,
  uploadsLast24Hours: 0,
  uploadsLast7Days: 0,
  uploadsLast30Days: 0,
  bytesLast7Days: 0,
  quotaBytes: 0,
  usagePercent: null,
  types: {
    image: { ...emptyTypes },
    video: { ...emptyTypes },
    audio: { ...emptyTypes },
    other: { ...emptyTypes }
  },
  topDirectories: [],
  runtime: {
    db: false,
    bucket: false,
    r2PublicBaseUrlConfigured: false,
    maxUploadBytes: 0
  }
})

const usageColor = computed(() => {
  const percent = stats.value.usagePercent
  if (percent == null) return 'primary'
  if (percent >= 90) return 'error'
  if (percent >= 70) return 'warning'
  return 'success'
})

const usageBarValue = computed(() => {
  const percent = stats.value.usagePercent
  if (percent == null) return 0
  return Math.min(100, percent)
})

const typeRows = computed(() => [
  { key: 'image', label: '图片', icon: 'i-lucide-image', ...stats.value.types.image },
  { key: 'video', label: '视频', icon: 'i-lucide-video', ...stats.value.types.video },
  { key: 'audio', label: '音频', icon: 'i-lucide-audio-lines', ...stats.value.types.audio },
  { key: 'other', label: '其他', icon: 'i-lucide-file', ...stats.value.types.other }
].map(row => ({
  ...row,
  share: typeShare(row.bytes)
})))

const runtimeRows = computed(() => [
  { label: 'D1 数据库', ok: stats.value.runtime.db },
  { label: 'R2 存储桶', ok: stats.value.runtime.bucket },
  { label: '公网直链', ok: stats.value.runtime.r2PublicBaseUrlConfigured }
])

function typeShare(bytes: number) {
  if (!stats.value.totalBytes) return 0
  return Math.round((bytes / stats.value.totalBytes) * 1000) / 10
}

function formatPercent(percent: number | null) {
  if (percent == null) return '—'
  return `${percent.toFixed(1)}%`
}

onMounted(async () => {
  try {
    stats.value = await $fetch<AdminStats>('/api/admin/stats')
  } finally {
    statsLoading.value = false
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
    <div class="grid w-full grid-cols-1 content-start gap-3 lg:grid-cols-3">
      <UCard
        class="lg:col-span-2"
        :ui="{ body: 'p-4 sm:p-5' }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">
              空间占用
            </p>
            <USkeleton
              v-if="statsLoading"
              class="mt-2 h-8 w-40"
            />
            <p
              v-else
              class="mt-2 text-3xl font-semibold tabular-nums"
            >
              {{ formatFileBytes(stats.totalBytes) }}
            </p>
          </div>
          <UBadge
            v-if="!statsLoading && stats.usagePercent != null"
            :color="usageColor"
            variant="subtle"
            size="lg"
            class="tabular-nums"
          >
            {{ formatPercent(stats.usagePercent) }}
          </UBadge>
        </div>

        <template v-if="statsLoading">
          <USkeleton class="mt-4 h-2 w-full" />
          <USkeleton class="mt-3 h-4 w-56" />
        </template>
        <template v-else-if="stats.quotaBytes > 0">
          <UProgress
            :model-value="usageBarValue"
            :color="usageColor"
            size="sm"
            class="mt-4"
          />
          <p class="mt-2 text-xs text-muted">
            已用 {{ formatFileBytes(stats.totalBytes) }} / 配额 {{ formatFileBytes(stats.quotaBytes) }}
            · 剩余 {{ formatFileBytes(Math.max(0, stats.quotaBytes - stats.totalBytes)) }}
          </p>
        </template>
        <p
          v-else
          class="mt-3 text-xs text-muted"
        >
          未配置存储配额。可在 wrangler 设置 STORAGE_QUOTA_BYTES 后显示使用百分比。
        </p>
      </UCard>

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
        <p
          v-if="!statsLoading"
          class="mt-2 text-xs text-muted"
        >
          平均 {{ formatFileBytes(stats.averageBytes) }} · {{ stats.directoryCount }} 个目录
        </p>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          近 24 小时
        </p>
        <USkeleton
          v-if="statsLoading"
          class="mt-2 h-8 w-12"
        />
        <p
          v-else
          class="mt-2 text-3xl font-semibold tabular-nums"
        >
          {{ stats.uploadsLast24Hours }}
        </p>
        <p class="mt-2 text-xs text-muted">
          新上传文件
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
        <p
          v-if="!statsLoading"
          class="mt-2 text-xs text-muted"
        >
          新增占用 {{ formatFileBytes(stats.bytesLast7Days) }}
        </p>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          近 30 日上传
        </p>
        <USkeleton
          v-if="statsLoading"
          class="mt-2 h-8 w-12"
        />
        <p
          v-else
          class="mt-2 text-3xl font-semibold tabular-nums"
        >
          {{ stats.uploadsLast30Days }}
        </p>
        <p class="mt-2 text-xs text-muted">
          新上传文件
        </p>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          类型分布
        </p>
        <div
          v-if="statsLoading"
          class="mt-3 space-y-3"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-12 w-full"
          />
        </div>
        <ul
          v-else
          class="mt-3 space-y-3"
        >
          <li
            v-for="row in typeRows"
            :key="row.key"
            class="space-y-1.5"
          >
            <div class="flex items-center gap-2">
              <UIcon
                :name="row.icon"
                class="size-4 shrink-0 text-muted"
              />
              <span class="shrink-0 text-sm">{{ row.label }}</span>
              <UProgress
                :model-value="row.share"
                size="xs"
                class="min-w-0 flex-1"
              />
            </div>
            <p class="flex flex-wrap items-center gap-x-0 gap-y-1 pl-6 text-xs text-muted">
              <span class="tabular-nums">{{ row.count }} 个文件</span>
              <span class="inline-flex items-center">
                <span
                  aria-hidden="true"
                  class="px-2 text-default/30"
                >|</span>
                <span>占用 <span class="tabular-nums">{{ formatFileBytes(row.bytes) }}</span></span>
              </span>
              <span class="inline-flex items-center">
                <span
                  aria-hidden="true"
                  class="px-2 text-default/30"
                >|</span>
                <span>占比 <span class="tabular-nums">{{ row.share }}%</span></span>
              </span>
            </p>
          </li>
        </ul>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          目录占用
        </p>
        <div
          v-if="statsLoading"
          class="mt-3 space-y-3"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-11 w-full"
          />
        </div>
        <p
          v-else-if="!stats.topDirectories.length"
          class="mt-3 text-sm text-muted"
        >
          暂无文件
        </p>
        <ul
          v-else
          class="mt-3 space-y-3"
        >
          <li
            v-for="item in stats.topDirectories"
            :key="item.directory || '__root__'"
            class="space-y-1"
          >
            <p class="truncate text-sm">
              {{ item.directory || '根目录' }}
            </p>
            <p class="flex flex-wrap items-center gap-x-0 gap-y-1 text-xs text-muted">
              <span class="tabular-nums">{{ item.count }} 个文件</span>
              <span class="inline-flex items-center">
                <span
                  aria-hidden="true"
                  class="px-2 text-default/30"
                >|</span>
                <span>占用 <span class="tabular-nums">{{ formatFileBytes(item.bytes) }}</span></span>
              </span>
              <span class="inline-flex items-center">
                <span
                  aria-hidden="true"
                  class="px-2 text-default/30"
                >|</span>
                <span>占比 <span class="tabular-nums">{{ typeShare(item.bytes) }}%</span></span>
              </span>
            </p>
          </li>
        </ul>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <p class="text-sm text-muted">
          运行环境
        </p>
        <div
          v-if="statsLoading"
          class="mt-3 space-y-2"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-7 w-full"
          />
        </div>
        <ul
          v-else
          class="mt-3 space-y-2.5 text-sm"
        >
          <li
            v-for="row in runtimeRows"
            :key="row.label"
            class="flex items-center justify-between gap-2"
          >
            <span>{{ row.label }}</span>
            <UBadge
              :color="row.ok ? 'success' : 'error'"
              variant="subtle"
              size="sm"
              :label="row.ok ? '正常' : '未配置'"
            />
          </li>
          <li class="flex items-center justify-between gap-2">
            <span>单文件上限</span>
            <span class="tabular-nums text-muted">{{ formatFileBytes(stats.runtime.maxUploadBytes) }}</span>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
