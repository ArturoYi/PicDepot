<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const toast = useToast()
const route = useRoute()
const config = useRuntimeConfig()
const { user, loaded, needsBootstrap } = useAuthSession()
const username = ref('')
const password = ref('')
const loading = ref(false)
const mode = ref<'login' | 'bootstrap'>('login')
const bootstrapAvailable = ref(false)

onMounted(async () => {
  try {
    const res = await $fetch<{ needsBootstrap: boolean }>('/api/auth/setup')
    bootstrapAvailable.value = res.needsBootstrap
    if (res.needsBootstrap) {
      mode.value = 'bootstrap'
    }
  } catch {
    bootstrapAvailable.value = false
  }
})

function resolvePostLoginPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/'
}

async function submit() {
  loading.value = true
  try {
    if (mode.value === 'bootstrap') {
      await $fetch('/api/auth/bootstrap', {
        method: 'POST',
        body: {
          username: username.value,
          password: password.value
        }
      })
      toast.add({ title: '初始化成功，请登录', color: 'success' })
      bootstrapAvailable.value = false
      mode.value = 'login'
      needsBootstrap.value = false
      return
    }

    const res = await $fetch<{ ok: boolean, user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: {
        username: username.value,
        password: password.value
      }
    })
    user.value = res.user
    loaded.value = true
    needsBootstrap.value = false
    const path = resolvePostLoginPath()
    // 整页跳转：手机 Safari / 微信 WebView 在 await 后 router.push 常被吞掉
    if (import.meta.client) {
      window.location.replace(path)
      return
    }
    await navigateTo(path, { replace: true, external: true })
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
    toast.add({
      title: mode.value === 'bootstrap' ? '初始化失败' : '登录失败',
      description: err?.data?.statusMessage || err?.statusMessage || err?.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 items-center justify-center p-4 sm:p-6">
    <div class="relative w-full max-w-md">
      <!-- 背后光晕 -->
      <div class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 blur-xl opacity-70" />

      <UCard
        class="relative w-full min-w-0 glass-card rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl"
        :ui="{
          header: 'p-5 sm:p-6 pb-2 border-b border-default/30',
          body: 'p-5 sm:p-6 space-y-4',
          footer: 'p-4 border-t border-default/30 text-center'
        }"
      >
        <template #header>
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-green-500 to-teal-400 text-white shadow-md shadow-emerald-500/25 ring-1 ring-white/20">
              <UIcon
                name="i-lucide-image"
                class="size-6"
              />
              <span class="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-default animate-pulse-glow" />
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight text-highlighted">
                {{ mode === 'login' ? `登录 ${config.public.siteName}` : '首次初始化管理员' }}
              </h1>
              <p class="mt-1 text-xs text-muted">
                {{ mode === 'login' ? '登录后可上传；管理员可进入后台管理' : '仅首次可用，将创建顶级管理员' }}
              </p>
            </div>
          </div>
        </template>

        <form
          class="space-y-4 pt-1"
          @submit.prevent="submit"
        >
          <UFormField
            label="用户名"
            required
          >
            <UInput
              v-model="username"
              name="username"
              autocomplete="username"
              icon="i-lucide-user"
              placeholder="请输入用户名"
              class="w-full rounded-xl"
            />
          </UFormField>

          <UFormField
            label="密码"
            required
          >
            <UInput
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              icon="i-lucide-lock"
              placeholder="请输入访问密码"
              class="w-full rounded-xl"
            />
          </UFormField>

          <div class="pt-2">
            <UButton
              type="submit"
              block
              color="primary"
              variant="solid"
              size="md"
              :loading="loading"
              :label="mode === 'login' ? '立即登录' : '创建管理员并初始化'"
              class="rounded-xl font-semibold shadow-xs"
            />
          </div>
        </form>

        <template
          v-if="bootstrapAvailable"
          #footer
        >
          <UButton
            variant="link"
            color="neutral"
            size="sm"
            :label="mode === 'login' ? '首次使用系统？初始化管理员账号' : '已有账号？返回登录'"
            @click="mode = mode === 'login' ? 'bootstrap' : 'login'"
          />
        </template>
      </UCard>
    </div>
  </div>
</template>
