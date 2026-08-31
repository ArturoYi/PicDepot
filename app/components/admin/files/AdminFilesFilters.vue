<script setup lang="ts">
const filterQ = defineModel<string>('filterQ', { required: true })
const filterDir = defineModel<string>('filterDir', { required: true })
const filterType = defineModel<string>('filterType', { required: true })

const props = defineProps<{
  directoryStats: Array<{ directory: string, count: number }>
  listLoading: boolean
}>()

const emit = defineEmits<{ apply: [] }>()

const dirFilterItems = computed(() =>
  props.directoryStats.map(item => ({
    label: `${item.directory || '根目录'}（${item.count}）`,
    value: item.directory || '__root__'
  }))
)

const typeItems = [
  { label: '全部类型', value: '' },
  { label: '图片', value: 'image/' },
  { label: '视频', value: 'video/' },
  { label: '音频', value: 'audio/' }
]

function onDirChange(value: string | null | undefined) {
  filterDir.value = value || ''
  emit('apply')
}

function onTypeChange(value: string | null | undefined) {
  filterType.value = value || ''
  emit('apply')
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
    <UInput
      v-model="filterQ"
      placeholder="搜索文件名"
      icon="i-lucide-search"
      size="sm"
      class="col-span-2 min-w-0 w-full sm:w-44 sm:flex-none"
      @keyup.enter="$emit('apply')"
    />
    <USelectMenu
      :model-value="filterDir || undefined"
      :items="dirFilterItems"
      value-key="value"
      placeholder="全部目录"
      icon="i-lucide-folder"
      clear
      size="sm"
      :search-input="dirFilterItems.length > 8 ? { placeholder: '搜索目录' } : false"
      class="min-w-0 w-full sm:w-52"
      @update:model-value="onDirChange"
    />
    <USelect
      :model-value="filterType"
      :items="typeItems"
      value-key="value"
      size="sm"
      class="min-w-0 w-full sm:w-32"
      @update:model-value="onTypeChange"
    />
    <UButton
      label="筛选"
      size="sm"
      class="col-span-2 justify-self-start sm:col-auto"
      :loading="listLoading"
      @click="$emit('apply')"
    />
  </div>
</template>
