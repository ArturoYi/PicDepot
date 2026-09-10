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
    toast.add({ title: '用户已成功创建', color: 'success' })
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
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getAvatarInitial(name: string) {
  return (name || 'U').charAt(0).toUpperCase()
}

onMounted(load)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3.5 lg:flex-row lg:gap-4">
    <!-- 用户列表区 -->
    <div class="ui-frame flex min-h-0 min-w-0 flex-1 flex-col bg-default/80 backdrop-blur-md border-default/80 shadow-xs">
      <div class="shrink-0 flex items-center justify-between border-b border-default/60 px-4 py-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-users"
            class="size-4 text-primary"
          />
          <h2 class="text-sm font-bold text-highlighted">
            账号成员 ({{ users.length }})
          </h2>
        </div>
        <UBadge
          variant="subtle"
          color="primary"
          size="xs"
          class="font-mono"
        >
          D1 Auth
        </UBadge>
      </div>

      <div
        v-if="loading"
        class="flex-1 p-4 space-y-3"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-14 w-full rounded-xl"
        />
      </div>

      <UScrollArea
        v-else
        class="min-h-0 flex-1"
        :ui="{ viewport: 'p-3' }"
      >
        <ul class="space-y-2 text-sm">
          <li
            v-for="u in users"
            :key="u.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-default/60 bg-elevated/30 p-3 transition-colors hover:bg-elevated/60"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-white shadow-2xs font-mono text-xs">
                {{ getAvatarInitial(u.username) }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-highlighted truncate">{{ u.username }}</span>
                  <UBadge
                    v-if="u.isAdmin"
                    color="primary"
                    variant="subtle"
                    size="xs"
                    class="rounded-md font-medium text-[10px]"
                  >
                    管理员
                  </UBadge>
                </div>
                <p class="text-[11px] text-muted font-mono truncate mt-0.5">
                  ID: {{ u.id.slice(0, 8) }}...
                </p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-xs text-muted font-mono">{{ formatTime(u.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </UScrollArea>
    </div>

    <!-- 添加用户表单 -->
    <form
      class="ui-frame w-full shrink-0 space-y-4 p-4 sm:p-5 lg:w-80 bg-default/80 backdrop-blur-md border-default/80 shadow-xs flex flex-col justify-between"
      @submit.prevent="addUser"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-2 border-b border-default/60 pb-3">
          <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon
              name="i-lucide-user-plus"
              class="size-4"
            />
          </div>
          <h2 class="text-sm font-bold text-highlighted">
            创建新成员
          </h2>
        </div>

        <UFormField
          label="用户名"
          required
        >
          <UInput
            v-model="newUsername"
            icon="i-lucide-user"
            placeholder="输入成员用户名"
            autocomplete="off"
            class="w-full rounded-xl"
          />
        </UFormField>

        <UFormField
          label="初始密码"
          required
        >
          <UInput
            v-model="newPassword"
            type="password"
            icon="i-lucide-lock"
            placeholder="输入初始密码"
            autocomplete="new-password"
            class="w-full rounded-xl"
          />
        </UFormField>
      </div>

      <div class="pt-2">
        <UButton
          type="submit"
          :loading="saving"
          label="确认创建用户"
          icon="i-lucide-check"
          color="primary"
          variant="solid"
          block
          class="rounded-xl shadow-xs font-semibold"
        />
      </div>
    </form>
  </div>
</template>
