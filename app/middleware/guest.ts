export default defineNuxtRouteMiddleware(async () => {
  const { user, ensureSession } = useAuthSession()
  await ensureSession()
  if (!user.value) {
    return
  }
  return navigateTo('/', { replace: true })
})
