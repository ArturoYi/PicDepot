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
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
    <UInput
      v-model="filterQ"
      placeholder="搜索文件名"
      icon="i-lucide-search"
      class="w-full"
      @keyup.enter="$emit('apply')"
    />
    <UInputMenu
      v-model="filterDir"
      :items="directoryItems"
      placeholder="目录筛选"
      icon="i-lucide-folder"
      class="w-full"
    />
    <UInput
      v-model="filterType"
      placeholder="MIME 前缀，如 image/"
      class="w-full"
      @keyup.enter="$emit('apply')"
    />
    <UButton
      label="筛选"
      class="w-full sm:w-auto justify-center"
      :loading="listLoading"
      @click="$emit('apply')"
    />
  </div>
</template>
