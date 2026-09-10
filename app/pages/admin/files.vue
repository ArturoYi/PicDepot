<script setup lang="ts">
import type { AdminFileRow } from '~/components/admin/files/fileUtils'
import { isPreviewableFile } from '~/components/admin/files/fileUtils'

const toast = useToast()
const listLoading = ref(true)
const files = ref<AdminFileRow[]>([])
const total = ref(0)
const totalPages = ref(1)
const page = ref(1)
const ready = ref(false)

const { width } = useWindowWidth()
const paginateReady = ref(false)
/** 默认 50；大屏适当增加，上限与 API 一致 */
const limit = computed(() => {
  if (width.value >= 1536) return 100
  if (width.value >= 1280) return 80
  if (width.value >= 1024) return 60
  return 50
})

const filterQ = ref('')
const filterDir = ref('')
const filterType = ref('')
const directoryItems = ref<string[]>([])
const directoryStats = ref<Array<{ directory: string, count: number }>>([])

const selectedIds = ref<Set<string>>(new Set())
const selectAll = ref(false)

const deleteTarget = ref<AdminFileRow | null>(null)
const deleting = ref(false)

const editTarget = ref<AdminFileRow | null>(null)
const editName = ref('')
const editDirectory = ref('')
const savingEdit = ref(false)

const batchMoveOpen = ref(false)
const batchMoveDir = ref('')
const batchWorking = ref(false)

const previewTarget = ref<AdminFileRow | null>(null)

function buildQuery() {
  return {
    page: page.value,
    limit: limit.value,
    q: filterQ.value.trim() || undefined,
    dir: filterDir.value.trim() || undefined,
    type: filterType.value.trim() || undefined
  }
}

async function loadDirectories() {
  try {
    const res = await $fetch<{
      directories: string[]
      items?: Array<{ directory: string, count: number }>
    }>('/api/admin/directories')
    directoryItems.value = res.directories
    directoryStats.value = res.items ?? res.directories.map(directory => ({ directory, count: 0 }))
  } catch {
    directoryItems.value = []
    directoryStats.value = []
  }
}

async function load() {
  listLoading.value = true
  selectedIds.value = new Set()
  selectAll.value = false
  try {
    const res = await $fetch<{
      files: AdminFileRow[]
      total: number
      totalPages: number
      page: number
    }>('/api/admin/files', { query: buildQuery() })
    files.value = res.files
    total.value = res.total
    totalPages.value = res.totalPages
    page.value = res.page
  } catch (error: unknown) {
    const err = error as { statusCode?: number, data?: { statusMessage?: string } }
    if (err.statusCode === 401) {
      await navigateTo('/login')
      return
    }
    toast.add({
      title: '加载失败',
      description: err?.data?.statusMessage || '请确认已登录且 D1 已绑定',
      color: 'error'
    })
  } finally {
    listLoading.value = false
  }
}

function toggleSelectAll(checked: boolean) {
  selectAll.value = checked
  selectedIds.value = checked ? new Set(files.value.map(f => f.id)) : new Set()
}

function toggleRow(id: string, checked: boolean) {
  const next = new Set(selectedIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedIds.value = next
  selectAll.value = files.value.length > 0 && files.value.every(f => next.has(f.id))
}

function applyFilters() {
  page.value = 1
  load()
}

async function onPageChange(p: number) {
  page.value = p
  await load()
}

function openPreview(row: AdminFileRow) {
  if (!isPreviewableFile(row)) return
  previewTarget.value = row
}

function openEdit(row: AdminFileRow) {
  editTarget.value = row
  editName.value = row.file_name
  editDirectory.value = row.directory || ''
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/files/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: '已删除', color: 'success' })
    deleteTarget.value = null
    await Promise.all([load(), loadDirectories()])
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({ title: '删除失败', description: err?.data?.statusMessage, color: 'error' })
  } finally {
    deleting.value = false
  }
}

async function saveEdit() {
  if (!editTarget.value) return
  savingEdit.value = true
  try {
    await $fetch(`/api/admin/files/${editTarget.value.id}`, {
      method: 'PATCH',
      body: { file_name: editName.value, directory: editDirectory.value }
    })
    toast.add({ title: '已保存', color: 'success' })
    editTarget.value = null
    await load()
    await loadDirectories()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({ title: '保存失败', description: err?.data?.statusMessage, color: 'error' })
  } finally {
    savingEdit.value = false
  }
}

async function batchDelete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  batchWorking.value = true
  try {
    const res = await $fetch<{ deleted: number }>('/api/admin/files/batch-delete', {
      method: 'POST',
      body: { ids }
    })
    toast.add({ title: `已删除 ${res.deleted} 个文件`, color: 'success' })
    await Promise.all([load(), loadDirectories()])
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({ title: '批量删除失败', description: err?.data?.statusMessage, color: 'error' })
  } finally {
    batchWorking.value = false
  }
}

async function batchMove() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  batchWorking.value = true
  try {
    await $fetch('/api/admin/files/batch-move', {
      method: 'POST',
      body: { ids, directory: batchMoveDir.value }
    })
    toast.add({ title: '已移动', color: 'success' })
    batchMoveOpen.value = false
    batchMoveDir.value = ''
    await load()
    await loadDirectories()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({ title: '移动失败', description: err?.data?.statusMessage, color: 'error' })
  } finally {
    batchWorking.value = false
  }
}

watch(limit, (next, prev) => {
  if (!ready.value || next === prev) return
  page.value = 1
  load()
})

onMounted(async () => {
  paginateReady.value = true
  await loadDirectories()
  await load()
  ready.value = true
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <!-- 顶部筛选与操作工具条 -->
    <div class="flex shrink-0 items-center justify-between gap-2.5 rounded-xl border border-default/70 bg-default/70 p-1.5 backdrop-blur-md shadow-2xs">
      <AdminFilesFilters
        v-model:filter-q="filterQ"
        v-model:filter-dir="filterDir"
        v-model:filter-type="filterType"
        :directory-stats="directoryStats"
        :list-loading="listLoading"
        class="min-w-0 flex-1"
        @apply="applyFilters"
      />

      <div class="flex items-center gap-2 shrink-0">
        <UCheckbox
          v-if="files.length"
          :model-value="selectAll"
          aria-label="全选"
          class="shrink-0"
          @update:model-value="toggleSelectAll(!!$event)"
        >
          <template #label>
            <span class="hidden text-xs font-medium sm:inline">全选</span>
          </template>
        </UCheckbox>

        <UButton
          to="/"
          icon="i-lucide-upload"
          aria-label="上传文件"
          color="primary"
          variant="solid"
          size="sm"
          class="shrink-0 rounded-lg shadow-2xs font-medium max-sm:px-2.5"
        >
          <span class="hidden sm:inline">上传文件</span>
        </UButton>
      </div>
    </div>

    <!-- 核心文件容器 -->
    <div
      class="ui-frame relative min-h-0 flex-1 bg-default/40 backdrop-blur-xs border-default/80"
      :class="{ 'opacity-60 pointer-events-none': listLoading && files.length }"
    >
      <div
        class="ui-frame-clip absolute inset-0 p-1.5"
        :class="selectedIds.size ? 'pb-16' : ''"
      >
        <!-- 加载骨架屏 -->
        <div
          v-if="listLoading && !files.length"
          class="grid size-full grid-cols-2 gap-3 p-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <USkeleton
            v-for="n in 10"
            :key="n"
            class="aspect-square rounded-2xl"
          />
        </div>

        <!-- 空状态展示 -->
        <div
          v-else-if="!listLoading && !files.length"
          class="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
        >
          <div class="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
            <UIcon
              name="i-lucide-image"
              class="size-8"
            />
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-semibold text-highlighted">
              暂无上传文件
            </h3>
            <p class="text-xs text-muted max-w-sm">
              当前目录下暂无任何媒体资源，您可以随时点击下方按钮进行上传
            </p>
          </div>
          <UButton
            to="/"
            icon="i-lucide-cloud-upload"
            label="立即上传文件"
            color="primary"
            variant="solid"
            size="sm"
            class="rounded-xl shadow-xs"
          />
        </div>

        <!-- 文件瀑布流网格 -->
        <AdminFilesMasonry
          v-else-if="files.length"
          :files="files"
          :selected-ids="selectedIds"
          @toggle-row="toggleRow"
          @preview="openPreview"
          @edit="openEdit"
          @delete="deleteTarget = $event"
        />
      </div>

      <!-- 底部浮动批量操作栏 -->
      <div
        v-if="selectedIds.size"
        class="absolute inset-x-4 bottom-3 z-30 h-11 max-w-lg mx-auto"
      >
        <AdminFilesBatchBar
          class="h-full"
          :count="selectedIds.size"
          :batch-working="batchWorking"
          @batch-delete="batchDelete"
          @batch-move="batchMoveOpen = true"
        />
      </div>
    </div>

    <!-- 底部统计与分页器 -->
    <div
      v-if="total > 0 || listLoading"
      class="flex shrink-0 items-center justify-between gap-3 px-1"
    >
      <div class="hidden items-center gap-1.5 text-xs text-muted sm:flex font-mono">
        <span>共 {{ total }} 条记录</span>
        <span>·</span>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
      </div>
      <UPagination
        :page="page"
        :total="total"
        :items-per-page="limit"
        :disabled="listLoading"
        :sibling-count="paginateReady && width >= 640 ? 1 : 0"
        size="sm"
        class="mx-auto sm:mx-0 sm:ml-auto"
        @update:page="onPageChange"
      />
    </div>

    <!-- 弹窗合集 -->
    <AdminFilesDialogs
      v-model:edit-name="editName"
      v-model:edit-directory="editDirectory"
      v-model:batch-move-open="batchMoveOpen"
      v-model:batch-move-dir="batchMoveDir"
      :delete-target="deleteTarget"
      :deleting="deleting"
      :edit-target="editTarget"
      :directory-items="directoryItems"
      :saving-edit="savingEdit"
      :batch-working="batchWorking"
      :preview-target="previewTarget"
      @confirm-delete="confirmDelete"
      @cancel-delete="deleteTarget = null"
      @save-edit="saveEdit"
      @cancel-edit="editTarget = null"
      @batch-move="batchMove"
      @cancel-preview="previewTarget = null"
    />
  </div>
</template>
