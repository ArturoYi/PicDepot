export interface SessionUser {
  id: string
  username: string
  isAdmin: boolean
  createdAt: number
}

export function useAuthSession() {
  const user = useState<SessionUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)
  const needsBootstrap = useState('auth-needs-bootstrap', () => false)

  async function refresh() {
    try {
      const res = await $fetch<{
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
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    loaded,
    needsBootstrap,
    refresh,
    logout,
    isLoggedIn: computed(() => Boolean(user.value)),
    isAdmin: computed(() => Boolean(user.value?.isAdmin))
  }
}
