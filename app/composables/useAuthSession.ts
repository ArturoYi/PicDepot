export interface SessionUser {
  id: string
  username: string
  isAdmin: boolean
  createdAt: number
}

type AuthRefreshPromise = Promise<void> | null

declare module '#app' {
  interface NuxtApp {
    _authSessionRefresh?: AuthRefreshPromise
  }
}

export function useAuthSession() {
  const nuxtApp = useNuxtApp()
  // SSR 时转发请求 Cookie，避免刷新后误判未登录
  const requestFetch = useRequestFetch()

  const user = useState<SessionUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)
  const needsBootstrap = useState('auth-needs-bootstrap', () => false)

  async function refresh() {
    if (nuxtApp._authSessionRefresh) {
      await nuxtApp._authSessionRefresh
      return
    }

    let task!: Promise<void>
    task = (async () => {
      try {
        const res = await requestFetch<{
          loggedIn: boolean
          user: SessionUser | null
          needsBootstrap: boolean
        }>('/api/auth/session')
        user.value = res.loggedIn ? res.user : null
        needsBootstrap.value = res.needsBootstrap
      } catch {
        user.value = null
        needsBootstrap.value = false
      } finally {
        loaded.value = true
        if (nuxtApp._authSessionRefresh === task) {
          nuxtApp._authSessionRefresh = null
        }
      }
    })()

    nuxtApp._authSessionRefresh = task
    await task
  }

  /** 确保会话已解析；并发调用会复用同一请求 */
  async function ensureSession() {
    if (loaded.value && !nuxtApp._authSessionRefresh) {
      return
    }
    await refresh()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    loaded.value = true
    await navigateTo('/login')
  }

  return {
    user,
    loaded,
    needsBootstrap,
    refresh,
    ensureSession,
    logout,
    isLoggedIn: computed(() => Boolean(user.value)),
    isAdmin: computed(() => Boolean(user.value?.isAdmin))
  }
}
