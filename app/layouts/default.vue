<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { adminNavItems } from '~/utils/adminNav'

const config = useRuntimeConfig()
const route = useRoute()
const colorMode = useColorMode()
const { user, loaded, isAdmin, logout } = useAuthSession()
const toast = useToast()
const { cycleBackground, currentIndex, images, loading: backgroundLoading } = usePageBackground()
const backgroundLabel = computed(() =>
  `切换背景 ${currentIndex.value + 1}/${images.value.length}`
)
const backgroundCount = computed(() =>
  `${currentIndex.value + 1}/${images.value.length}`
)

function onCycleBackground() {
  if (!images.value.length) return
  cycleBackground()
  toast.add({
    title: `已切换背景 ${currentIndex.value + 1}/${images.value.length}`,
    icon: 'i-lucide-image',
    color: 'neutral'
  })
}

const menuOpen = ref(false)

const isUploadPage = computed(() => route.path === '/')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isFilesPage = computed(() => route.path.startsWith('/admin/files'))

const containerClass = computed(() => {
  if (isAdminRoute.value) return 'max-w-[1440px] w-full h-full flex flex-col'
  if (isUploadPage.value) return 'max-w-none w-full h-full'
  return 'w-full h-full flex flex-col'
})

const isDark = computed(() => colorMode.value === 'dark')
/** 主题存在 localStorage，SSR 侧未知；挂载后再同步图标，避免 hydration class mismatch */
const displayDark = ref(false)
const themeReady = ref(false)

onMounted(() => {
  themeReady.value = true
  displayDark.value = isDark.value
})
watch(isDark, (value) => {
  if (themeReady.value) displayDark.value = value
})

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

function selectEventClick(event: Event): MouseEvent | undefined {
  if (event instanceof MouseEvent) return event
  const detail = 'detail' in event ? event.detail : null
  if (detail && typeof detail === 'object' && 'originalEvent' in detail) {
    const original = (detail as { originalEvent?: Event }).originalEvent
    if (original instanceof MouseEvent) return original
  }
  return undefined
}

function isModifiedClick(event: Event) {
  const click = selectEventClick(event)
  if (!click) return false
  return click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || click.button !== 0
}

/**
 * 移动端菜单点选后会立刻卸载 Modal 里的链接，原生跳转经常被取消。
 * 改为拦截点击、编程导航，再关菜单。
 */
function goTo(to: string) {
  return (event: Event) => {
    if (isModifiedClick(event)) return
    event.preventDefault()
    selectEventClick(event)?.preventDefault()
    if (route.path !== to) {
      void navigateTo(to)
    }
    closeMenu()
  }
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
        onSelect: goTo(item.to)
      })
    }
    items.push({
      label: '返回上传',
      icon: 'i-lucide-upload',
      to: '/',
      onSelect: goTo('/')
    })
  } else if (isUploadPage.value) {
    if (loaded.value && isAdmin.value) {
      items.push({
        label: '后台管理',
        icon: 'i-lucide-layout-dashboard',
        to: '/admin/files',
        onSelect: goTo('/admin/files')
      })
    }
  } else if (loaded.value && isAdmin.value) {
    items.push({
      label: '后台管理',
      icon: 'i-lucide-layout-dashboard',
      to: '/admin/files',
      onSelect: goTo('/admin/files')
    })
  }

  return items
})

/** 操作项：主题 / 退出（移动端菜单内展示） */
const actionItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = []

  if (isUploadPage.value) {
    items.push({
      label: backgroundLabel.value,
      icon: 'i-lucide-image',
      onSelect: onCycleBackground
    })
  }

  items.push({
    label: displayDark.value ? '浅色模式' : '深色模式',
    icon: displayDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: toggleColorMode
  })

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

watch(menuOpen, (open) => {
  if (!open || !loaded.value || !isAdmin.value) return
  for (const item of adminNavItems) {
    void preloadRouteComponents(item.to)
  }
})
</script>

<template>
  <div class="app-shell flex flex-col pb-[env(safe-area-inset-bottom)]">
    <AppPageBackground v-if="isUploadPage" />

    <UHeader
      v-model:open="menuOpen"
      class="shrink-0 pt-[env(safe-area-inset-top)] border-b transition-all duration-200"
      :class="isUploadPage
        ? 'bg-default/60 backdrop-blur-xl border-default/30 shadow-xs'
        : 'bg-default/80 backdrop-blur-md border-default/70 shadow-2xs'"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="group flex min-w-0 items-center gap-2.5 font-semibold text-highlighted"
        >
          <div class="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-green-500 to-teal-400 text-white shadow-sm shadow-emerald-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <UIcon
              name="i-lucide-image"
              class="size-4.5"
            />
            <span class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-default animate-pulse" />
          </div>
          <span class="truncate text-base font-bold tracking-tight text-highlighted">{{ config.public.siteName }}</span>
          <span
            class="shrink-0 rounded-md border border-default/60 bg-elevated/70 px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums text-muted"
            :title="`版本 ${config.public.appVersion}`"
          >v{{ config.public.appVersion }}</span>
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
        <div
          v-if="loaded && user"
          class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-elevated/70 px-2.5 py-1 text-xs border border-default/60"
        >
          <span class="size-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span class="max-w-[8rem] truncate font-medium text-highlighted">{{ user.username }}</span>
          <UBadge
            v-if="isAdmin"
            size="xs"
            color="primary"
            variant="soft"
            class="text-[10px] px-1 py-0"
          >
            Admin
          </UBadge>
        </div>

        <UButton
          v-if="isUploadPage"
          color="neutral"
          variant="soft"
          icon="i-lucide-image"
          :label="backgroundCount"
          :loading="backgroundLoading"
          :aria-label="backgroundLabel"
          :title="backgroundLabel"
          class="rounded-lg bg-default/70 backdrop-blur-md border border-default/40 hover:bg-default/90 text-xs shadow-xs"
          @click="onCycleBackground"
        />

        <UButton
          class="hidden lg:inline-flex rounded-lg"
          color="neutral"
          variant="ghost"
          square
          :icon="displayDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          :aria-label="displayDark ? '浅色模式' : '深色模式'"
          @click="toggleColorMode"
        />

        <UButton
          v-if="loaded && user"
          class="hidden lg:inline-flex rounded-lg text-muted hover:text-error hover:bg-error/10"
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-log-out"
          aria-label="退出登录"
          title="退出登录"
          @click="handleLogout"
        />
      </template>

      <template #body>
        <div class="space-y-4 py-1">
          <div
            v-if="loaded && user"
            class="flex items-center justify-between rounded-xl bg-elevated/60 p-3 border border-default/70 sm:hidden"
          >
            <div class="flex items-center gap-2">
              <span class="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span class="font-semibold text-sm">{{ user.username }}</span>
            </div>
            <UBadge
              v-if="isAdmin"
              size="xs"
              color="primary"
              variant="subtle"
            >
              管理员
            </UBadge>
          </div>
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
        class="min-h-0 flex-1 py-0"
        :class="[
          containerClass,
          isUploadPage ? 'overflow-y-auto' : 'overflow-hidden',
          isFilesPage && 'max-sm:!px-2'
        ]"
      >
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
