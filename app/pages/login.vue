<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const toast = useToast()
const route = useRoute()
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
  <div class="flex h-full min-h-0 items-start justify-center py-6 sm:items-center">
    <div class="w-full min-w-0 max-w-md">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-xl font-semibold">
              {{ mode === 'login' ? '登录' : '首次初始化顶级管理员' }}
            </h1>
            <p class="text-sm text-muted">
              {{ mode === 'login' ? '登录后可上传；管理员可进入后台管理' : '仅首次可用，将创建 isAdmin 顶级管理员' }}
            </p>
          </div>
        </template>

        <form
          class="space-y-4"
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
              class="w-full"
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
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            :loading="loading"
            :label="mode === 'login' ? '登录' : '创建顶级管理员'"
          />
        </form>

        <template
          v-if="bootstrapAvailable"
          #footer
        >
          <UButton
            variant="link"
            color="neutral"
            size="sm"
            :label="mode === 'login' ? '首次使用？初始化顶级管理员' : '已有账号？去登录'"
            @click="mode = mode === 'login' ? 'bootstrap' : 'login'"
          />
        </template>
      </UCard>
    </div>
  </div>
</template>
