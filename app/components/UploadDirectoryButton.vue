<script setup lang="ts">
const props = withDefaults(defineProps<{
  directoriesEndpoint?: string
}>(), {
  directoriesEndpoint: '/api/directories'
})

const { directory } = useUploadPreferences()
const directoryItems = ref<string[]>([])
const open = ref(false)

const directoryLabel = computed(() => directory.value.trim() || '自动归类')

const chips = computed(() => {
  const extras = directoryItems.value
    .filter(name => name && name !== 'image' && name !== 'video')
    .slice(0, 10)
  return [
    { label: '自动归类', value: '' },
    { label: 'image', value: 'image' },
    { label: 'video', value: 'video' },
    ...extras.map(name => ({ label: name, value: name }))
  ]
})

async function loadDirectories() {
  try {
    const res = await $fetch<{ directories: string[] }>(props.directoriesEndpoint)
    directoryItems.value = res.directories
  } catch {
    directoryItems.value = []
  }
}

function applyDirectory(value: string, persistItem = false) {
  const next = value.trim()
  directory.value = next
  if (persistItem && next && !directoryItems.value.includes(next)) {
    directoryItems.value = [...directoryItems.value, next]
  }
}

function pick(value: string) {
  applyDirectory(value, true)
}

function onDirectoryChange(value: string | null | undefined) {
  directory.value = typeof value === 'string' ? value : ''
}

function onCreateDirectory(name: string) {
  applyDirectory(name, true)
}

function confirm() {
  applyDirectory(directory.value, true)
  open.value = false
}

watch(open, (value) => {
  if (value) loadDirectories()
})

onMounted(loadDirectories)
</script>

<template>
  <UModal
    v-model:open="open"
    title="上传目录"
  >
    <UButton
      icon="i-lucide-folder"
      trailing-icon="i-lucide-chevron-down"
      color="neutral"
      variant="soft"
      size="sm"
      :title="`上传目录：${directoryLabel}`"
      :aria-label="`上传目录：${directoryLabel}`"
    >
      <span class="max-w-[7.5rem] truncate sm:max-w-[10rem]">{{ directoryLabel }}</span>
    </UButton>

    <template #body>
      <div class="space-y-3">
        <p class="text-xs text-muted">
          留空则图片入 image、视频入 video；填写后所有文件使用该目录。选择会保存在本机。
        </p>
        <UInputMenu
          :model-value="directory"
          mode="autocomplete"
          :items="directoryItems"
          placeholder="输入或选择目录"
          icon="i-lucide-folder"
          create-item
          clear
          class="w-full"
          @update:model-value="onDirectoryChange"
          @create="onCreateDirectory"
        />
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="chip in chips"
            :key="chip.value || '__auto__'"
            size="xs"
            :color="directory === chip.value ? 'primary' : 'neutral'"
            :variant="directory === chip.value ? 'soft' : 'outline'"
            :label="chip.label"
            class="max-w-full"
            @click="pick(chip.value)"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <UButton
        label="完成"
        color="neutral"
        variant="ghost"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
