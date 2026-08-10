export default defineNuxtPlugin(async () => {
  const { ensureSession } = useAuthSession()
  await ensureSession()
})
