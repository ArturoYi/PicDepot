export default defineNuxtRouteMiddleware(async () => {
  const { user, ensureSession } = useAuthSession()
  await ensureSession()
  if (!user.value) {
    return
  }
  return navigateTo(user.value.isAdmin ? '/admin/files' : '/', { replace: true })
})
