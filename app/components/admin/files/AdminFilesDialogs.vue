<script setup lang="ts">
import AdminFileImageZoom from './AdminFileImageZoom.vue'
import type { AdminFileRow } from './fileUtils'
import { isImageFile, isVideoFile } from './fileUtils'

defineProps<{
  deleteTarget: AdminFileRow | null
  deleting: boolean
  editTarget: AdminFileRow | null
  directoryItems: string[]
  savingEdit: boolean
  batchWorking: boolean
  previewTarget: AdminFileRow | null
}>()

const editNameModel = defineModel<string>('editName', { required: true })
const editDirectoryModel = defineModel<string>('editDirectory', { required: true })
const batchMoveOpenModel = defineModel<boolean>('batchMoveOpen', { required: true })
const batchMoveDirModel = defineModel<string>('batchMoveDir', { required: true })

defineEmits<{
  'confirm-delete': []
  'cancel-delete': []
  'save-edit': []
  'cancel-edit': []
  'batch-move': []
  'cancel-preview': []
}>()
</script>

<template>
  <!-- 删除确认弹窗 -->
  <UModal
    :open="!!deleteTarget"
    title="确认删除此文件？"
    description="该操作将永久从 Cloudflare R2 存储桶与 D1 数据库中销毁，不可撤回。"
    @update:open="(v: boolean) => { if (!v) $emit('cancel-delete') }"
  >
    <template #body>
      <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
        <p class="font-semibold break-all">
          {{ deleteTarget?.file_name }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="取消"
          color="neutral"
          variant="ghost"
          @click="$emit('cancel-delete')"
        />
        <UButton
          label="确认删除"
          color="error"
          variant="solid"
          :loading="deleting"
          @click="$emit('confirm-delete')"
        />
      </div>
    </template>
  </UModal>

  <!-- 编辑元数据弹窗 -->
  <UModal
    :open="!!editTarget"
    title="编辑文件信息"
    description="修改显示名称或所属分类目录（不影响文件实际链接）"
    @update:open="(v: boolean) => { if (!v) $emit('cancel-edit') }"
  >
    <template #body>
      <div class="space-y-4 py-1">
        <UFormField label="文件名称">
          <UInput
            v-model="editNameModel"
            icon="i-lucide-file-text"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="所属目录"
          hint="留空表示移至根目录，也可以输入新目录名称自动创建"
        >
          <UInputMenu
            v-model="editDirectoryModel"
            mode="autocomplete"
            :items="directoryItems"
            icon="i-lucide-folder"
            clear
            placeholder="输入或选择目录"
            :content="{ hideWhenEmpty: true }"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="取消"
          color="neutral"
          variant="ghost"
          @click="$emit('cancel-edit')"
        />
        <UButton
          label="保存更改"
          color="primary"
          :loading="savingEdit"
          @click="$emit('save-edit')"
        />
      </div>
    </template>
  </UModal>

  <!-- 批量移动弹窗 -->
  <UModal
    v-model:open="batchMoveOpenModel"
    title="批量移动文件"
    description="将选中的文件批量调整至目标存储目录"
  >
    <template #body>
      <div class="py-2">
        <UFormField
          label="目标目录名称"
          hint="可直接输入新目录名；留空则表示移至根目录。"
        >
          <UInputMenu
            v-model="batchMoveDirModel"
            mode="autocomplete"
            :items="directoryItems"
            icon="i-lucide-folder"
            clear
            placeholder="输入或选择目录（留空为根目录）"
            :content="{ hideWhenEmpty: true }"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="取消"
          color="neutral"
          variant="ghost"
          @click="batchMoveOpenModel = false"
        />
        <UButton
          label="确认批量移动"
          color="primary"
          :loading="batchWorking"
          @click="$emit('batch-move')"
        />
      </div>
    </template>
  </UModal>

  <!-- 媒体大图预览弹窗 -->
  <UModal
    :open="!!previewTarget"
    :title="previewTarget?.file_name || '媒体预览'"
    :ui="{
      content: 'max-w-[min(96vw,1400px)] w-[calc(100vw-1.5rem)] sm:w-full rounded-2xl',
      header: 'min-w-0 border-b border-default/40 p-4',
      wrapper: 'min-w-0',
      title: 'truncate font-semibold text-sm sm:text-base',
      body: 'p-3 sm:p-4 overflow-hidden bg-default/90'
    }"
    @update:open="(v: boolean) => { if (!v) $emit('cancel-preview') }"
  >
    <template #body>
      <div v-if="previewTarget?.url">
        <AdminFileImageZoom
          v-if="isImageFile(previewTarget)"
          :src="previewTarget.url"
          :alt="previewTarget.file_name"
        />
        <div
          v-else-if="isVideoFile(previewTarget)"
          class="ui-frame overflow-hidden rounded-xl border border-default/60"
        >
          <div
            class="ui-frame-clip flex justify-center overscroll-none bg-black/40"
            style="height: min(70dvh, 900px, calc(100dvh - 14rem))"
          >
            <video
              :src="previewTarget.url"
              controls
              class="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      </div>
      <p
        v-else
        class="text-sm text-muted text-center py-10"
      >
        无法预览：未配置公网直链 URL
      </p>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <CopyLinkMenu
          v-if="previewTarget?.url"
          :url="previewTarget.url"
          :file-name="previewTarget.file_name"
          size="sm"
        />
        <UButton
          label="关闭预览"
          color="neutral"
          variant="soft"
          class="ml-auto rounded-lg"
          @click="$emit('cancel-preview')"
        />
      </div>
    </template>
  </UModal>
</template>
