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
    :class="isFilesPage ? 'py-1.5 sm:py-2.5' : 'py-3 sm:py-4'"
  >
    <div
      v-if="!isFilesPage"
      class="mb-3.5 shrink-0 flex items-center justify-between gap-3 px-1"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          v-if="activeNav?.icon"
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-2xs"
        >
          <UIcon
            :name="activeNav.icon"
            class="size-4.5"
          />
        </div>
        <div class="min-w-0">
          <h1 class="text-base sm:text-lg font-bold text-highlighted truncate tracking-tight">
            {{ activeNav?.label || '后台管理' }}
          </h1>
          <p class="text-xs text-muted truncate">
            {{ activeNav?.description }}
          </p>
        </div>
      </div>
    </div>

    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <NuxtPage />
    </div>
  </div>
</template>
