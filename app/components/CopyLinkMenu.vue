<script setup lang="ts">
import { copyFormatLabels, formatLink, type CopyFormat } from '#shared/utils/linkFormats'

const props = defineProps<{
  url: string
  fileName?: string
  size?: 'xs' | 'sm' | 'md'
  /** 在卡片操作栏中拉满剩余宽度 */
  block?: boolean
  iconOnly?: boolean
}>()

const toast = useToast()

const items = computed(() =>
  (Object.keys(copyFormatLabels) as CopyFormat[]).map(key => ({
    label: copyFormatLabels[key],
    icon: key === 'markdown' ? 'i-simple-icons-markdown' : key === 'html' ? 'i-lucide-code-2' : key === 'bbcode' ? 'i-lucide-square-brackets' : 'i-lucide-link',
    onSelect: () => copy(key)
  }))
)

async function copy(format: CopyFormat) {
  await navigator.clipboard.writeText(formatLink(props.url, format, props.fileName))
  toast.add({
    title: `已复制 ${copyFormatLabels[format]}`,
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
}
</script>

<template>
  <UDropdownMenu :items="[items]">
    <UButton
      :size="size || 'xs'"
      color="primary"
      variant="soft"
      icon="i-lucide-copy"
      :label="iconOnly ? undefined : '复制链接'"
      :aria-label="iconOnly ? '复制链接' : undefined"
      :block="block"
      class="rounded-lg font-medium shadow-2xs transition-all hover:shadow-xs"
    />
  </UDropdownMenu>
</template>
