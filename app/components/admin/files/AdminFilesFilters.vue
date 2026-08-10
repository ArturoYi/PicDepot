<script setup lang="ts">
const filterQ = defineModel<string>('filterQ', { required: true })
const filterDir = defineModel<string>('filterDir', { required: true })
const filterType = defineModel<string>('filterType', { required: true })

defineProps<{
  directoryItems: string[]
  listLoading: boolean
}>()

defineEmits<{ apply: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UInput
      v-model="filterQ"
      placeholder="搜索文件名"
      icon="i-lucide-search"
      size="sm"
      class="w-full sm:w-44 min-w-0 flex-1 sm:flex-none"
      @keyup.enter="$emit('apply')"
    />
    <UInputMenu
      v-model="filterDir"
      :items="directoryItems"
      placeholder="目录"
      icon="i-lucide-folder"
      size="sm"
      class="w-[calc(50%-0.25rem)] sm:w-36"
    />
    <UInput
      v-model="filterType"
      placeholder="image/"
      size="sm"
      class="w-[calc(50%-0.25rem)] sm:w-28"
      @keyup.enter="$emit('apply')"
    />
    <UButton
      label="筛选"
      size="sm"
      :loading="listLoading"
      @click="$emit('apply')"
    />
  </div>
</template>
