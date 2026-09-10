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
    class="flex h-full flex-nowrap items-center gap-2.5 overflow-x-auto rounded-xl border border-default/90 bg-default/90 px-3 shadow-xl backdrop-blur-xl ring-1 ring-white/20 dark:ring-white/5"
  >
    <div class="flex items-center gap-2">
      <span class="size-2 rounded-full bg-emerald-500 animate-pulse-glow" />
      <UBadge
        color="primary"
        variant="subtle"
        size="sm"
        class="font-mono font-semibold"
        :label="`已选 ${count} 项`"
      />
    </div>

    <div class="ml-auto flex items-center gap-2">
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        icon="i-lucide-folder-input"
        label="移动目录"
        class="rounded-lg font-medium"
        @click="$emit('batch-move')"
      />
      <UButton
        size="xs"
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="批量删除"
        class="rounded-lg font-medium"
        :loading="batchWorking"
        @click="$emit('batch-delete')"
      />
    </div>
  </div>
</template>
