export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string, password?: string }>(event)
  const username = body.username?.trim() || ''
  const password = body.password || ''

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password are required.' })
  }

  await migrateLegacyAdminIfNeeded(event)
  const db = getDb(event)
  const user = await findUserByUsername(db, username)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password.' })
  }

  await createUserSession(event, user.id)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const publicUser = mapPublicUser(user)
  return { ok: true, user: publicUser }
})
