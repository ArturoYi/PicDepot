<script setup lang="ts">
const toast = useToast()
const { refresh, needsBootstrap } = useAuthSession()
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

    const res = await $fetch<{ ok: boolean, user: { isAdmin: boolean } }>('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })
    await refresh()
    toast.add({ title: '登录成功', color: 'success' })
    await navigateTo(res.user.isAdmin ? '/admin/files' : '/')
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
  <div class="max-w-md mx-auto">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold">
            {{ mode === 'login' ? '登录' : '首次初始化顶级管理员' }}
          </h1>
          <p class="text-sm text-muted">
            {{ mode === 'login' ? '登录后可上传；管理员可管理文件与用户' : '仅首次可用，将创建 isAdmin 顶级管理员' }}
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
            autocomplete="username"
            icon="i-lucide-user"
          />
        </UFormField>
        <UFormField
          label="密码"
          required
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            icon="i-lucide-lock"
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
</template>
