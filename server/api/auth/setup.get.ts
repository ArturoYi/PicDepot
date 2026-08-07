export default defineEventHandler(async (event) => {
  await migrateLegacyAdminIfNeeded(event)
  return { needsBootstrap: await needsBootstrap(event) }
})
