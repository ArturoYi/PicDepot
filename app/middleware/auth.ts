export default defineNuxtRouteMiddleware(async () => {
  const { user, loaded, refresh } = useAuthSession()
  if (!loaded.value) {
    await refresh()
  }
  if (!user.value) {
    return navigateTo('/login')
  }
})
