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
  <UModal
    :open="!!deleteTarget"
    title="确认删除"
    @update:open="(v: boolean) => { if (!v) $emit('cancel-delete') }"
  >
    <template #body>
      <p class="text-sm">
        将同时删除 R2 对象与 D1 记录：<strong>{{ deleteTarget?.file_name }}</strong>
      </p>
    </template>
    <template #footer>
      <UButton
        label="取消"
        color="neutral"
        variant="ghost"
        @click="$emit('cancel-delete')"
      />
      <UButton
        label="删除"
        color="error"
        :loading="deleting"
        @click="$emit('confirm-delete')"
      />
    </template>
  </UModal>

  <UModal
    :open="!!editTarget"
    title="编辑元数据"
    @update:open="(v: boolean) => { if (!v) $emit('cancel-edit') }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField label="文件名">
          <UInput v-model="editNameModel" />
        </UFormField>
        <UFormField
          label="目录"
          hint="可输入新目录名；目录是分类标签，不会改文件链接。留空为根目录。"
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
      <UButton
        label="取消"
        color="neutral"
        variant="ghost"
        @click="$emit('cancel-edit')"
      />
      <UButton
        label="保存"
        :loading="savingEdit"
        @click="$emit('save-edit')"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="batchMoveOpenModel"
    title="批量移动目录"
  >
    <template #body>
      <UFormField
        label="目标目录"
        hint="可输入新目录名；留空表示根目录。"
      >
        <UInputMenu
          v-model="batchMoveDirModel"
          mode="autocomplete"
          :items="directoryItems"
          icon="i-lucide-folder"
          clear
          placeholder="输入或选择目录，留空为根目录"
          :content="{ hideWhenEmpty: true }"
          class="w-full"
        />
      </UFormField>
    </template>
    <template #footer>
      <UButton
        label="取消"
        color="neutral"
        variant="ghost"
        @click="batchMoveOpenModel = false"
      />
      <UButton
        label="移动"
        :loading="batchWorking"
        @click="$emit('batch-move')"
      />
    </template>
  </UModal>

  <UModal
    :open="!!previewTarget"
    :title="previewTarget?.file_name || '预览'"
    :ui="{
      content: 'max-w-[min(96vw,1400px)] w-[calc(100vw-1.5rem)] sm:w-full',
      header: 'min-w-0',
      wrapper: 'min-w-0',
      title: 'truncate',
      body: 'p-3 sm:p-4 overflow-hidden'
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
          class="ui-frame"
        >
          <div
            class="ui-frame-clip flex justify-center overscroll-none bg-elevated/40"
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
        class="text-sm text-muted text-center"
      >
        无法预览：未配置公网 URL
      </p>
    </template>
    <template #footer>
      <CopyLinkMenu
        v-if="previewTarget?.url"
        :url="previewTarget.url"
        :file-name="previewTarget.file_name"
        size="sm"
      />
      <UButton
        label="关闭"
        color="neutral"
        variant="ghost"
        @click="$emit('cancel-preview')"
      />
    </template>
  </UModal>
</template>
