<script setup lang="ts">
const filterQ = defineModel<string>('filterQ', { required: true })
const filterDir = defineModel<string>('filterDir', { required: true })
const filterType = defineModel<string>('filterType', { required: true })

const props = defineProps<{
  directoryStats: Array<{ directory: string, count: number }>
  listLoading: boolean
}>()

const emit = defineEmits<{ apply: [] }>()

const filtersOpen = ref(false)

const dirFilterItems = computed(() =>
  props.directoryStats.map(item => ({
    label: `${item.directory || '根目录'}（${item.count}）`,
    value: item.directory || '__root__'
  }))
)

/** SelectItem 不能用空字符串，否则刷新时 Reka UI 会抛 500 */
const TYPE_ALL = '__all__'

const typeItems = [
  { label: '全部类型', value: TYPE_ALL },
  { label: '图片', value: 'image/' },
  { label: '视频', value: 'video/' },
  { label: '音频', value: 'audio/' }
]

const hasActiveFilters = computed(() => !!filterDir.value || !!filterType.value)

function onDirChange(value: string | null | undefined) {
  filterDir.value = value || ''
  emit('apply')
}

function onTypeChange(value: string | null | undefined) {
  filterType.value = !value || value === TYPE_ALL ? '' : value
  emit('apply')
}

function clearFilters() {
  filterDir.value = ''
  filterType.value = ''
  emit('apply')
}
</script>

<template>
  <div class="min-w-0">
    <div class="flex items-center gap-2 sm:hidden">
      <UInput
        v-model="filterQ"
        placeholder="搜索文件名"
        icon="i-lucide-search"
        size="sm"
        class="min-w-0 flex-1"
        @keyup.enter="$emit('apply')"
      />
      <UButton
        icon="i-lucide-list-filter"
        size="sm"
        square
        :color="hasActiveFilters ? 'primary' : 'neutral'"
        variant="soft"
        aria-label="筛选"
        @click="filtersOpen = true"
      />
    </div>

    <div class="hidden flex-wrap items-center gap-2 sm:flex">
      <UInput
        v-model="filterQ"
        placeholder="搜索文件名"
        icon="i-lucide-search"
        size="sm"
        class="min-w-0 w-44"
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
        class="w-52"
        @update:model-value="onDirChange"
      />
      <USelect
        :model-value="filterType || TYPE_ALL"
        :items="typeItems"
        value-key="value"
        size="sm"
        class="w-32"
        @update:model-value="onTypeChange"
      />
      <UButton
        label="筛选"
        size="sm"
        :loading="listLoading"
        @click="$emit('apply')"
      />
    </div>

    <USlideover
      v-model:open="filtersOpen"
      title="筛选"
      description="按目录或类型缩小列表"
      side="bottom"
      :ui="{ content: 'max-h-[70dvh]' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="目录">
            <USelectMenu
              :model-value="filterDir || undefined"
              :items="dirFilterItems"
              value-key="value"
              placeholder="全部目录"
              icon="i-lucide-folder"
              clear
              :search-input="dirFilterItems.length > 8 ? { placeholder: '搜索目录' } : false"
              class="w-full"
              @update:model-value="onDirChange"
            />
          </UFormField>
          <UFormField label="类型">
            <USelect
              :model-value="filterType || TYPE_ALL"
              :items="typeItems"
              value-key="value"
              class="w-full"
              @update:model-value="onTypeChange"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          label="重置"
          color="neutral"
          variant="ghost"
          :disabled="!hasActiveFilters"
          @click="clearFilters"
        />
        <UButton
          label="完成"
          @click="filtersOpen = false"
        />
      </template>
    </USlideover>
  </div>
</template>
