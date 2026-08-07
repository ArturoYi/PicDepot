<script setup lang="ts">
import type { AdminFileRow } from '~/components/admin/files/fileUtils'
import { isPreviewableFile } from '~/components/admin/files/fileUtils'

const toast = useToast()
const listLoading = ref(true)
const files = ref<AdminFileRow[]>([])
const total = ref(0)
const totalPages = ref(1)
const page = ref(1)
const limit = 20

const filterQ = ref('')
const filterDir = ref('')
const filterType = ref('')
const directoryItems = ref<string[]>([])

const selectedIds = ref<Set<string>>(new Set())
const selectAll = ref(false)
const viewMode = ref<'list' | 'card'>('list')

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
    limit,
    q: filterQ.value.trim() || undefined,
    dir: filterDir.value.trim() || undefined,
    type: filterType.value.trim() || undefined
  }
}

async function loadDirectories() {
  try {
    const res = await $fetch<{ directories: string[] }>('/api/admin/directories')
    directoryItems.value = res.directories
  } catch {
    directoryItems.value = []
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

onMounted(async () => {
  await loadDirectories()
  await load()
})
</script>

<template>
  <div class="space-y-4 w-full max-w-none">
    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <AdminFilesFilters
        v-model:filter-q="filterQ"
        v-model:filter-dir="filterDir"
        v-model:filter-type="filterType"
        :directory-items="directoryItems"
        :list-loading="listLoading"
        @apply="applyFilters"
      />

      <AdminFilesBatchBar
        v-if="selectedIds.size"
        :count="selectedIds.size"
        :batch-working="batchWorking"
        @batch-delete="batchDelete"
        @batch-move="batchMoveOpen = true"
      />

      <div class="flex flex-col min-h-[420px]">
        <div
          class="relative flex-1 min-h-[320px] rounded-lg ring-1 ring-default overflow-hidden"
          :class="{ 'opacity-60 pointer-events-none': listLoading && files.length }"
        >
          <div
            v-if="listLoading"
            class="absolute inset-0 z-10 flex items-center justify-center bg-default/50"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-primary"
            />
          </div>

          <div
            v-if="!listLoading && !files.length"
            class="flex h-full min-h-[280px] items-center justify-center p-6 text-center text-sm text-muted"
          >
            暂无文件
          </div>

          <div
            v-else-if="viewMode === 'card'"
            class="h-full overflow-y-auto p-2"
          >
            <AdminFilesCardGrid
              :files="files"
              :selected-ids="selectedIds"
              @toggle-row="toggleRow"
              @preview="openPreview"
              @edit="openEdit"
              @delete="deleteTarget = $event"
            />
          </div>

          <div
            v-else
            class="h-full overflow-y-auto"
          >
            <AdminFilesMobileList
              :files="files"
              :selected-ids="selectedIds"
              @toggle-row="toggleRow"
              @preview="openPreview"
              @edit="openEdit"
              @delete="deleteTarget = $event"
            />
            <AdminFilesTable
              :files="files"
              :selected-ids="selectedIds"
              :select-all="selectAll"
              @toggle-all="toggleSelectAll"
              @toggle-row="toggleRow"
              @preview="openPreview"
              @edit="openEdit"
              @delete="deleteTarget = $event"
            />
          </div>
        </div>

        <div
          v-if="total > 0 || listLoading"
          class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 mt-4 border-t border-default"
        >
          <p class="text-xs text-muted">
            共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页
          </p>
          <UPagination
            :page="page"
            :total="total"
            :items-per-page="limit"
            :disabled="listLoading"
            @update:page="onPageChange"
          />
        </div>
      </div>
    </UCard>

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
