export default defineNuxtRouteMiddleware(async (to) => {
  const { user, ensureSession } = useAuthSession()
  await ensureSession()
  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  if (!user.value.isAdmin) {
    return navigateTo('/')
  }
})
