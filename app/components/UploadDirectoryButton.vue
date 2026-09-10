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
    title="上传目标目录"
    description="选择或输入存储目录，未填写将按媒体类型自动归类"
  >
    <UButton
      icon="i-lucide-folder"
      trailing-icon="i-lucide-chevron-down"
      color="neutral"
      variant="soft"
      size="sm"
      class="rounded-xl border border-default/80 bg-default/80 backdrop-blur-md shadow-2xs hover:border-primary/40 transition-all"
      :title="`上传目录：${directoryLabel}`"
      :aria-label="`上传目录：${directoryLabel}`"
    >
      <span class="max-w-[7.5rem] truncate text-xs font-medium sm:max-w-[10rem]">{{ directoryLabel }}</span>
    </UButton>

    <template #body>
      <div class="space-y-4">
        <UFormField label="指定目录名称">
          <UInputMenu
            :model-value="directory"
            mode="autocomplete"
            :items="directoryItems"
            placeholder="输入或选择目录（留空自动归类）"
            icon="i-lucide-folder"
            create-item
            clear
            class="w-full"
            @update:model-value="onDirectoryChange"
            @create="onCreateDirectory"
          />
        </UFormField>

        <div>
          <p class="mb-2 text-xs font-medium text-muted">
            快捷目录标签
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="chip in chips"
              :key="chip.value || '__auto__'"
              size="xs"
              :color="directory === chip.value ? 'primary' : 'neutral'"
              :variant="directory === chip.value ? 'solid' : 'subtle'"
              :label="chip.label"
              class="rounded-lg transition-transform active:scale-95"
              @click="pick(chip.value)"
            />
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="取消"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          label="确认选择"
          color="primary"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
