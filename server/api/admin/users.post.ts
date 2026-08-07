export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody<{ username?: string, password?: string, isAdmin?: boolean }>(event)

  const username = body.username?.trim() || ''
  const password = body.password || ''

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'username and password are required.' })
  }

  if (body.isAdmin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only the first bootstrap account can be top-level admin.'
    })
  }

  const db = getDb(event)
  const user = await createUserAccount(db, {
    username,
    password,
    isAdmin: false
  })

  return { ok: true, user }
})
