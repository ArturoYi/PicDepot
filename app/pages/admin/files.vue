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
  <div class="flex h-full min-h-0 flex-col gap-1.5 sm:gap-2">
    <div class="flex shrink-0 items-center gap-2">
      <AdminFilesFilters
        v-model:filter-q="filterQ"
        v-model:filter-dir="filterDir"
        v-model:filter-type="filterType"
        :directory-stats="directoryStats"
        :list-loading="listLoading"
        class="min-w-0 flex-1"
        @apply="applyFilters"
      />
      <UCheckbox
        v-if="files.length"
        :model-value="selectAll"
        aria-label="全选"
        class="shrink-0"
        @update:model-value="toggleSelectAll(!!$event)"
      >
        <template #label>
          <span class="hidden sm:inline">全选</span>
        </template>
      </UCheckbox>
      <UButton
        to="/"
        icon="i-lucide-upload"
        aria-label="上传"
        color="primary"
        variant="soft"
        size="sm"
        class="shrink-0 max-sm:px-2"
      >
        <span class="hidden sm:inline">上传</span>
      </UButton>
    </div>

    <div
      class="ui-frame relative min-h-0 flex-1"
      :class="{ 'opacity-60 pointer-events-none': listLoading && files.length }"
    >
      <div
        class="ui-frame-clip absolute inset-0"
        :class="selectedIds.size ? 'pb-14' : ''"
      >
        <div
          v-if="listLoading && !files.length"
          class="grid size-full grid-cols-2 gap-2.5 p-2 md:grid-cols-3 lg:grid-cols-4"
        >
          <USkeleton
            v-for="n in 8"
            :key="n"
            class="aspect-square rounded-lg"
          />
        </div>

        <div
          v-else-if="!listLoading && !files.length"
          class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <UIcon
            name="i-lucide-images"
            class="size-10 text-muted"
          />
          <p class="text-sm text-muted">
            暂无上传记录
          </p>
          <UButton
            to="/"
            icon="i-lucide-upload"
            label="上传第一个文件"
            color="primary"
            variant="soft"
            size="sm"
          />
        </div>

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

      <div
        v-if="selectedIds.size"
        class="absolute inset-x-2 bottom-2 z-20 h-10"
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

    <div
      v-if="total > 0 || listLoading"
      class="flex shrink-0 items-center justify-between gap-2"
    >
      <p class="hidden text-xs text-muted sm:block">
        共 {{ total }} 条 · 每页 {{ limit }} · 第 {{ page }} / {{ totalPages }} 页
      </p>
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
