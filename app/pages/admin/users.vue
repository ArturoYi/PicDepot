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
  <div class="flex h-full min-h-0 flex-col gap-3 lg:flex-row lg:gap-4">
    <div class="min-h-0 flex-1 overflow-hidden rounded-lg border border-default flex flex-col">
      <div class="shrink-0 px-3 py-2 border-b border-default">
        <h2 class="text-sm font-medium">
          已有用户
        </h2>
      </div>
      <div
        v-if="loading"
        class="flex-1 p-3"
      >
        <USkeleton class="h-full min-h-32" />
      </div>
      <UScrollArea
        v-else
        class="min-h-0 flex-1"
        :ui="{ viewport: 'p-2' }"
      >
        <ul class="divide-y divide-default text-sm">
          <li
            v-for="u in users"
            :key="u.id"
            class="py-2.5 px-1 flex items-center justify-between gap-2 min-w-0"
          >
            <div class="min-w-0">
              <span class="font-medium truncate">{{ u.username }}</span>
              <UBadge
                v-if="u.isAdmin"
                class="ml-2"
                color="primary"
                variant="subtle"
                size="sm"
                label="管理员"
              />
            </div>
            <span class="text-muted text-xs shrink-0 truncate max-w-[45%] sm:max-w-none">{{ formatTime(u.createdAt) }}</span>
          </li>
        </ul>
      </UScrollArea>
    </div>

    <form
      class="shrink-0 w-full lg:w-72 space-y-3 rounded-lg border border-default p-3 sm:p-4"
      @submit.prevent="addUser"
    >
      <h2 class="text-sm font-medium">
        添加用户
      </h2>
      <UFormField
        label="用户名"
        required
      >
        <UInput
          v-model="newUsername"
          size="sm"
          autocomplete="off"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="初始密码"
        required
      >
        <UInput
          v-model="newPassword"
          type="password"
          size="sm"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        :loading="saving"
        label="创建用户"
        block
        size="sm"
      />
    </form>
  </div>
</template>
