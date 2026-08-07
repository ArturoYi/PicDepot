<script setup lang="ts">
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const users = ref<Array<{ id: string, username: string, isAdmin: boolean, createdAt: number }>>([])

const newUsername = ref('')
const newPassword = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ users: typeof users.value }>('/api/admin/users')
    users.value = res.users
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err.statusCode === 401 || err.statusCode === 403) {
      await navigateTo('/login')
      return
    }
    toast.add({ title: '无法读取用户列表', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function addUser() {
  if (!newUsername.value.trim() || !newPassword.value) {
    toast.add({ title: '请填写用户名和密码', color: 'warning' })
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        username: newUsername.value.trim(),
        password: newPassword.value
      }
    })
    newUsername.value = ''
    newPassword.value = ''
    toast.add({ title: '用户已创建', color: 'success' })
    await load()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({
      title: '创建失败',
      description: err?.data?.statusMessage,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN')
}

onMounted(load)
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        用户管理
      </h1>
      <p class="text-sm text-muted mt-1">
        对应主项目「用户管理」：账号由管理员手动创建，登录后可上传与管理（管理员）。
      </p>
    </div>

    <UCard v-if="!loading">
      <div class="space-y-3">
        <h2 class="font-medium">
          已有用户
        </h2>
        <ul class="divide-y divide-default text-sm">
          <li
            v-for="u in users"
            :key="u.id"
            class="py-2 flex items-center justify-between gap-2"
          >
            <div>
              <span class="font-medium">{{ u.username }}</span>
              <UBadge
                v-if="u.isAdmin"
                class="ml-2"
                color="primary"
                variant="subtle"
                label="管理员"
              />
            </div>
            <span class="text-muted text-xs">{{ formatTime(u.createdAt) }}</span>
          </li>
        </ul>
      </div>
    </UCard>
    <USkeleton
      v-else
      class="h-40"
    />

    <UCard v-if="!loading">
      <form
        class="space-y-4"
        @submit.prevent="addUser"
      >
        <h2 class="font-medium">
          添加用户
        </h2>
        <UFormField
          label="用户名"
          required
        >
          <UInput
            v-model="newUsername"
            autocomplete="off"
          />
        </UFormField>
        <UFormField
          label="初始密码"
          required
        >
          <UInput
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>
        <UButton
          type="submit"
          :loading="saving"
          label="创建用户"
          block
        />
      </form>
    </UCard>
  </div>
</template>
