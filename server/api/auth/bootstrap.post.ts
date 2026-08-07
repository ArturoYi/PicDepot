/**
 * 首次初始化：仅当 users 表为空时创建顶级管理员（is_admin = 1）。
 */
export default defineEventHandler(async (event) => {
  if (!(await needsBootstrap(event))) {
    throw createError({
      statusCode: 409,
      statusMessage: 'System already initialized. Ask an admin to create your account.'
    })
  }

  const env = getCfEnv(event)
  const body = await readBody<{ username?: string, password?: string }>(event)

  const username = (body.username || env.BOOTSTRAP_ADMIN_USER || '').trim()
  const password = body.password || env.BOOTSTRAP_ADMIN_PASS || ''

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'username and password are required for bootstrap.'
    })
  }

  const db = getDb(event)
  await createUserAccount(db, { username, password, isAdmin: true })

  return { ok: true, message: 'Admin bootstrapped. Please log in.' }
})
