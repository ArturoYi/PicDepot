<script setup lang="ts">
defineProps<{
  count: number
  batchWorking: boolean
}>()

defineEmits<{
  'batch-delete': []
  'batch-move': []
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-elevated/50"
  >
    <span class="text-sm text-muted">已选 {{ count }} 项</span>
    <UButton
      size="sm"
      color="error"
      variant="soft"
      label="批量删除"
      :loading="batchWorking"
      @click="$emit('batch-delete')"
    />
    <UButton
      size="sm"
      variant="soft"
      label="批量移动"
      @click="$emit('batch-move')"
    />
  </div>
</template>
