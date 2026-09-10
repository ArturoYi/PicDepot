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
  return 'primary'
})

const usageBarValue = computed(() => {
  const percent = stats.value.usagePercent
  if (percent == null) return 0
  return Math.min(100, percent)
})

const typeRows = computed(() => [
  { key: 'image', label: '图片', icon: 'i-lucide-image', color: 'emerald', barColor: 'bg-emerald-500', ...stats.value.types.image },
  { key: 'video', label: '视频', icon: 'i-lucide-video', color: 'purple', barColor: 'bg-purple-500', ...stats.value.types.video },
  { key: 'audio', label: '音频', icon: 'i-lucide-audio-lines', color: 'amber', barColor: 'bg-amber-500', ...stats.value.types.audio },
  { key: 'other', label: '其他', icon: 'i-lucide-file', color: 'sky', barColor: 'bg-sky-500', ...stats.value.types.other }
].map(row => ({
  ...row,
  share: typeShare(row.bytes)
})))

const runtimeRows = computed(() => [
  { label: 'Cloudflare D1 数据库', desc: '元数据与用户鉴权', ok: stats.value.runtime.db },
  { label: 'Cloudflare R2 存储桶', desc: '对象存储与分片', ok: stats.value.runtime.bucket },
  { label: 'R2 公网 CDN 直链', desc: '外部访问加速', ok: stats.value.runtime.r2PublicBaseUrlConfigured }
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
  <div class="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain pr-1 space-y-4">
    <!-- 顶部核心 KPI 卡片群 -->
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 存储空间大卡 -->
      <UCard
        class="sm:col-span-2 relative overflow-hidden bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ body: 'p-4 sm:p-5 flex flex-col justify-between h-full' }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon
                  name="i-lucide-hard-drive"
                  class="size-4"
                />
              </div>
              <span class="text-xs font-semibold text-muted tracking-wide uppercase">存储容量使用</span>
            </div>
            <div class="pt-1">
              <USkeleton
                v-if="statsLoading"
                class="h-8 w-40"
              />
              <div
                v-else
                class="flex items-baseline gap-2"
              >
                <span class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-highlighted">
                  {{ formatFileBytes(stats.totalBytes) }}
                </span>
                <span
                  v-if="stats.quotaBytes > 0"
                  class="text-xs text-muted"
                >
                  / 配额 {{ formatFileBytes(stats.quotaBytes) }}
                </span>
              </div>
            </div>
          </div>

          <UBadge
            v-if="!statsLoading && stats.usagePercent != null"
            :color="usageColor"
            variant="subtle"
            size="lg"
            class="font-mono font-bold"
          >
            {{ formatPercent(stats.usagePercent) }}
          </UBadge>
        </div>

        <div class="mt-4">
          <template v-if="statsLoading">
            <USkeleton class="h-2 w-full rounded-full" />
            <USkeleton class="mt-2 h-3.5 w-48" />
          </template>
          <template v-else-if="stats.quotaBytes > 0">
            <div class="h-2 w-full overflow-hidden rounded-full bg-elevated/80 border border-default/40">
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                :style="{ width: `${usageBarValue}%` }"
              />
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-muted">
              <span>已用 {{ formatFileBytes(stats.totalBytes) }}</span>
              <span>剩余 {{ formatFileBytes(Math.max(0, stats.quotaBytes - stats.totalBytes)) }} 可用</span>
            </div>
          </template>
          <p
            v-else
            class="text-xs text-muted"
          >
            未设置硬性配额上限，存储空间由 R2 按需自动弹性扩展
          </p>
        </div>
      </UCard>

      <!-- 文件总数卡 -->
      <UCard
        class="bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ body: 'p-4 sm:p-5 flex flex-col justify-between h-full' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UIcon
                name="i-lucide-files"
                class="size-4"
              />
            </div>
            <span class="text-xs font-semibold text-muted tracking-wide uppercase">文件总数</span>
          </div>
        </div>
        <div class="mt-3">
          <USkeleton
            v-if="statsLoading"
            class="h-8 w-20"
          />
          <p
            v-else
            class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-highlighted"
          >
            {{ stats.fileCount.toLocaleString() }}
          </p>
          <p
            v-if="!statsLoading"
            class="mt-1 text-xs text-muted"
          >
            平均 {{ formatFileBytes(stats.averageBytes) }} / 份
          </p>
        </div>
      </UCard>

      <!-- 目录统计卡 -->
      <UCard
        class="bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ body: 'p-4 sm:p-5 flex flex-col justify-between h-full' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <UIcon
                name="i-lucide-folder-tree"
                class="size-4"
              />
            </div>
            <span class="text-xs font-semibold text-muted tracking-wide uppercase">存储目录</span>
          </div>
        </div>
        <div class="mt-3">
          <USkeleton
            v-if="statsLoading"
            class="h-8 w-16"
          />
          <p
            v-else
            class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-highlighted"
          >
            {{ stats.directoryCount }}
          </p>
          <p
            v-if="!statsLoading"
            class="mt-1 text-xs text-muted"
          >
            近 24h 上传 {{ stats.uploadsLast24Hours }} 个
          </p>
        </div>
      </UCard>
    </div>

    <!-- 活跃度与趋势指标条 -->
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <div class="flex items-center gap-3.5 rounded-xl border border-default/70 bg-default/70 p-3.5 backdrop-blur-md shadow-2xs">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <UIcon
            name="i-lucide-clock"
            class="size-5"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-muted">
            近 24 小时上传
          </p>
          <div class="flex items-baseline gap-1.5 mt-0.5">
            <span class="font-mono text-lg font-bold text-highlighted">{{ statsLoading ? '—' : stats.uploadsLast24Hours }}</span>
            <span class="text-[11px] text-muted">个文件</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3.5 rounded-xl border border-default/70 bg-default/70 p-3.5 backdrop-blur-md shadow-2xs">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
          <UIcon
            name="i-lucide-calendar"
            class="size-5"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-muted">
            近 7 日上传量
          </p>
          <div class="flex items-baseline gap-1.5 mt-0.5">
            <span class="font-mono text-lg font-bold text-highlighted">{{ statsLoading ? '—' : stats.uploadsLast7Days }}</span>
            <span class="text-[11px] text-muted">个 ({{ formatFileBytes(stats.bytesLast7Days) }})</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3.5 rounded-xl border border-default/70 bg-default/70 p-3.5 backdrop-blur-md shadow-2xs">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
          <UIcon
            name="i-lucide-calendar-days"
            class="size-5"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-muted">
            近 30 日上传总量
          </p>
          <div class="flex items-baseline gap-1.5 mt-0.5">
            <span class="font-mono text-lg font-bold text-highlighted">{{ statsLoading ? '—' : stats.uploadsLast30Days }}</span>
            <span class="text-[11px] text-muted">个文件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细分析与运行环境 -->
    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <!-- 类型分布 -->
      <UCard
        class="bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ header: 'p-4 border-b border-default/40', body: 'p-4 sm:p-5' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-pie-chart"
              class="size-4 text-primary"
            />
            <h3 class="text-sm font-bold text-highlighted">
              文件类型分布
            </h3>
          </div>
        </template>

        <div
          v-if="statsLoading"
          class="space-y-4"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-12 w-full rounded-lg"
          />
        </div>
        <ul
          v-else
          class="space-y-3.5"
        >
          <li
            v-for="row in typeRows"
            :key="row.key"
            class="space-y-1.5 rounded-lg p-2 transition-colors hover:bg-elevated/40"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="row.icon"
                  class="size-4"
                  :class="`text-${row.color}-500`"
                />
                <span class="font-semibold text-highlighted">{{ row.label }}</span>
              </div>
              <span class="font-mono text-muted">{{ row.count }} 个 · {{ row.share }}%</span>
            </div>

            <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="row.barColor"
                :style="{ width: `${row.share}%` }"
              />
            </div>

            <div class="flex items-center justify-between text-[11px] text-muted">
              <span>空间占用</span>
              <span class="font-mono">{{ formatFileBytes(row.bytes) }}</span>
            </div>
          </li>
        </ul>
      </UCard>

      <!-- 目录排行 -->
      <UCard
        class="bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ header: 'p-4 border-b border-default/40', body: 'p-4 sm:p-5' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-folder"
              class="size-4 text-primary"
            />
            <h3 class="text-sm font-bold text-highlighted">
              目录占用排行
            </h3>
          </div>
        </template>

        <div
          v-if="statsLoading"
          class="space-y-4"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-11 w-full rounded-lg"
          />
        </div>
        <div
          v-else-if="!stats.topDirectories.length"
          class="flex h-40 flex-col items-center justify-center gap-2 text-center text-muted"
        >
          <UIcon
            name="i-lucide-folder-open"
            class="size-8 opacity-50"
          />
          <p class="text-xs">
            暂无目录数据
          </p>
        </div>
        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="(item, idx) in stats.topDirectories.slice(0, 5)"
            :key="item.directory || '__root__'"
            class="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-elevated/40 text-xs"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold"
                :class="idx === 0 ? 'bg-amber-500/15 text-amber-500' : idx === 1 ? 'bg-zinc-500/15 text-zinc-400' : idx === 2 ? 'bg-orange-500/15 text-orange-500' : 'bg-elevated text-muted'"
              >
                {{ idx + 1 }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-semibold text-highlighted">
                  {{ item.directory || '根目录' }}
                </p>
                <p class="text-[11px] text-muted">
                  {{ item.count }} 个文件
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="font-mono font-medium text-highlighted">
                {{ formatFileBytes(item.bytes) }}
              </p>
              <p class="text-[10px] text-muted font-mono">
                {{ typeShare(item.bytes) }}%
              </p>
            </div>
          </li>
        </ul>
      </UCard>

      <!-- 运行环境与基础设施 -->
      <UCard
        class="bg-default/80 backdrop-blur-md border border-default/80 shadow-xs"
        :ui="{ header: 'p-4 border-b border-default/40', body: 'p-4 sm:p-5' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-server"
              class="size-4 text-primary"
            />
            <h3 class="text-sm font-bold text-highlighted">
              运行环境与架构
            </h3>
          </div>
        </template>

        <div
          v-if="statsLoading"
          class="space-y-3"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-10 w-full rounded-lg"
          />
        </div>
        <div
          v-else
          class="space-y-3.5"
        >
          <div
            v-for="row in runtimeRows"
            :key="row.label"
            class="flex items-center justify-between gap-3 rounded-lg border border-default/60 bg-elevated/30 p-2.5"
          >
            <div class="min-w-0">
              <p class="text-xs font-semibold text-highlighted">
                {{ row.label }}
              </p>
              <p class="text-[11px] text-muted truncate">
                {{ row.desc }}
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                class="size-2 rounded-full"
                :class="row.ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
              />
              <UBadge
                :color="row.ok ? 'primary' : 'error'"
                variant="subtle"
                size="xs"
                :label="row.ok ? '正常运行' : '未就绪'"
              />
            </div>
          </div>

          <div class="flex items-center justify-between rounded-lg border border-default/60 bg-elevated/30 p-2.5 text-xs">
            <div class="min-w-0">
              <p class="font-semibold text-highlighted">
                单文件体积上限
              </p>
              <p class="text-[11px] text-muted">
                Cloudflare Workers 限制
              </p>
            </div>
            <span class="font-mono font-bold text-primary">{{ formatFileBytes(stats.runtime.maxUploadBytes) }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
