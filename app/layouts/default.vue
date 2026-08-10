<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { adminNavItems } from '~/utils/adminNav'

const config = useRuntimeConfig()
const route = useRoute()
const colorMode = useColorMode()
const { user, loaded, isAdmin, logout } = useAuthSession()
const { cycleBackground } = usePageBackground()

const menuOpen = ref(false)

const isUploadPage = computed(() => route.path === '/')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const containerClass = computed(() => {
  if (isAdminRoute.value) return 'max-w-[1440px] w-full h-full flex flex-col'
  if (isUploadPage.value) return 'max-w-none w-full h-full flex flex-col'
  return 'w-full h-full flex flex-col'
})

const isDark = computed(() => colorMode.value === 'dark')

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

async function handleLogout() {
  menuOpen.value = false
  await logout()
}

function closeMenu() {
  menuOpen.value = false
}

/** 主导航（桌面顶栏 + 移动端菜单共用） */
const primaryItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = []

  if (isAdminRoute.value && isAdmin.value) {
    for (const item of adminNavItems) {
      items.push({
        label: item.label,
        icon: item.icon,
        to: item.to,
        active: route.path.startsWith(item.to),
        onSelect: closeMenu
      })
    }
    items.push({
      label: '返回上传',
      icon: 'i-lucide-upload',
      to: '/',
      onSelect: closeMenu
    })
  } else if (isUploadPage.value) {
    items.push({
      label: '切换背景',
      icon: 'i-lucide-image',
      onSelect: () => {
        cycleBackground()
      }
    })
    if (loaded.value && isAdmin.value) {
      items.push({
        label: '后台管理',
        icon: 'i-lucide-settings',
        to: '/admin/files',
        onSelect: closeMenu
      })
    }
  } else if (loaded.value && isAdmin.value) {
    items.push({
      label: '后台管理',
      icon: 'i-lucide-settings',
      to: '/admin/files',
      onSelect: closeMenu
    })
  }

  return items
})

/** 操作项：主题 / 退出（移动端菜单内展示） */
const actionItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: isDark.value ? '浅色模式' : '深色模式',
      icon: isDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: toggleColorMode
    }
  ]

  if (loaded.value && user.value) {
    items.push({
      label: '退出登录',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout
    })
  }

  return items
})

const mobileMenuItems = computed<NavigationMenuItem[][]>(() => {
  return primaryItems.value.length
    ? [primaryItems.value, actionItems.value]
    : [actionItems.value]
})

watch(() => route.fullPath, () => {
  menuOpen.value = false
})
</script>

<template>
  <div class="relative flex h-dvh flex-col overflow-hidden">
    <AppPageBackground v-if="isUploadPage" />

    <UHeader
      v-model:open="menuOpen"
      class="shrink-0"
      :ui="isUploadPage
        ? { root: 'bg-default/55 backdrop-blur-md border-default/40' }
        : undefined"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold text-highlighted"
        >
          <UIcon
            name="i-lucide-image"
            class="size-5 text-primary"
          />
          <span>{{ config.public.siteName }}</span>
        </NuxtLink>
      </template>

      <!-- 桌面端：主导航展开在顶栏中央 -->
      <UNavigationMenu
        v-if="primaryItems.length"
        :key="`desktop-${isAdminRoute ? 'admin' : 'upload'}-${loaded}-${isAdmin}`"
        :items="primaryItems"
        class="hidden lg:flex"
      />

      <template #right>
        <span
          v-if="loaded && user"
          class="hidden sm:inline text-xs text-muted truncate max-w-[10rem]"
        >
          {{ user.username }}
        </span>
        <UButton
          class="hidden lg:inline-flex"
          color="neutral"
          variant="ghost"
          square
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          :aria-label="isDark ? '浅色模式' : '深色模式'"
          @click="toggleColorMode"
        />
        <UButton
          v-if="loaded && user"
          class="hidden lg:inline-flex"
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-log-out"
          aria-label="退出登录"
          @click="handleLogout"
        />
      </template>

      <template #body>
        <div class="space-y-4">
          <p
            v-if="loaded && user"
            class="px-2.5 text-sm text-muted sm:hidden"
          >
            {{ user.username }}
          </p>
          <UNavigationMenu
            :key="`mobile-${isAdminRoute ? 'admin' : 'upload'}-${loaded}-${isAdmin}`"
            :items="mobileMenuItems"
            orientation="vertical"
            class="-mx-2.5"
          />
        </div>
      </template>
    </UHeader>

    <UMain class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <UContainer
        class="min-h-0 flex-1 overflow-hidden py-0"
        :class="containerClass"
      >
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
