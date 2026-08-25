<script setup lang="ts">
import { copyFormatLabels, formatLink, type CopyFormat } from '#shared/utils/linkFormats'

const props = defineProps<{
  url: string
  fileName?: string
  size?: 'xs' | 'sm' | 'md'
  /** 在卡片操作栏中拉满剩余宽度 */
  block?: boolean
}>()

const toast = useToast()

const items = computed(() =>
  (Object.keys(copyFormatLabels) as CopyFormat[]).map(key => ({
    label: copyFormatLabels[key],
    onSelect: () => copy(key)
  }))
)

async function copy(format: CopyFormat) {
  await navigator.clipboard.writeText(formatLink(props.url, format, props.fileName))
  toast.add({ title: `已复制 ${copyFormatLabels[format]}`, color: 'success' })
}
</script>

<template>
  <UDropdownMenu :items="[items]">
    <UButton
      :size="size || 'xs'"
      variant="soft"
      icon="i-lucide-copy"
      label="复制"
      :block="block"
    />
  </UDropdownMenu>
</template>
