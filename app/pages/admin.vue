<script setup lang="ts">
import { resolveAdminNav } from '~/utils/adminNav'

definePageMeta({ middleware: 'admin' })

const route = useRoute()

const activeNav = computed(() => resolveAdminNav(route.path))
const isFilesPage = computed(() => route.path.startsWith('/admin/files'))
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden"
    :class="isFilesPage ? 'py-2 sm:py-3' : 'py-3 sm:py-4'"
  >
    <div
      v-if="!isFilesPage"
      class="mb-3 shrink-0 flex items-baseline justify-between gap-3 px-0.5"
    >
      <div class="min-w-0">
        <h1 class="text-base sm:text-lg font-semibold text-highlighted truncate">
          {{ activeNav?.label || '后台管理' }}
        </h1>
        <p class="text-xs text-muted truncate">
          {{ activeNav?.description }}
        </p>
      </div>
    </div>

    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <NuxtPage />
    </div>
  </div>
</template>
