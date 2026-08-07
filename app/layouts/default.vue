<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { user, isAdmin, logout } = useAuthSession()

const containerClass = computed(() =>
  route.path.startsWith('/admin') ? 'max-w-[1440px] w-full' : ''
)

const navItems = computed(() => {
  const items = [
    {
      label: '上传',
      to: '/',
      icon: 'i-lucide-upload'
    }
  ]
  if (isAdmin.value) {
    items.push(
      {
        label: '文件管理',
        to: '/admin/files',
        icon: 'i-lucide-images'
      },
      {
        label: '用户管理',
        to: '/admin/users',
        icon: 'i-lucide-users'
      },
      {
        label: '系统状态',
        to: '/admin/status',
        icon: 'i-lucide-bar-chart-3'
      }
    )
  }
  return items
})
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <UHeader class="shrink-0">
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

        <UNavigationMenu
          :items="navItems"
          class="hidden sm:flex ml-4"
        />
      </template>

      <template #right>
        <UColorModeButton />
        <template v-if="user">
          <span class="text-sm text-muted hidden sm:inline">{{
            user.username
          }}</span>
          <UButton
            icon="i-lucide-log-out"
            label="退出"
            color="neutral"
            variant="ghost"
            @click="logout"
          />
        </template>
        <UButton
          v-else
          to="/login"
          icon="i-lucide-log-in"
          label="登录"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <UContainer
        class="min-h-0 flex-1 overflow-y-auto py-8"
        :class="containerClass"
      >
        <slot />
      </UContainer>

      <UFooter
        class="shrink-0"
        :ui="{
          container: 'h-12 py-0 flex items-center justify-between gap-x-3',
          left: 'flex items-center justify-start flex-1 gap-x-1.5 mt-0 lg:order-1'
        }"
      >
        <template #left>
          <p class="text-sm text-muted">
            Workers · R2 · D1 · © {{ new Date().getFullYear() }}
          </p>
        </template>
      </UFooter>
    </UMain>
  </div>
</template>
