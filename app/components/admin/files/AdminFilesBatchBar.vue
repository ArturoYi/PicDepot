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
    class="flex h-full flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-default bg-default/90 px-2.5 shadow-lg backdrop-blur-md"
  >
    <UBadge
      color="primary"
      variant="subtle"
      size="sm"
      :label="`已选 ${count}`"
    />
    <div class="ml-auto flex items-center gap-1.5">
      <UButton
        size="xs"
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="删除"
        :loading="batchWorking"
        @click="$emit('batch-delete')"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        icon="i-lucide-folder-input"
        label="移动"
        @click="$emit('batch-move')"
      />
    </div>
  </div>
</template>
