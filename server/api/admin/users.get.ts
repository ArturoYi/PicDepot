export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)
  return { users: await listUsers(db) }
})
