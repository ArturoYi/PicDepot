import type { H3Event } from '../types/h3-event'

export async function requireUploadAuth(event: H3Event): Promise<void> {
  await requireUserSession(event)
}

export async function requireUserSession(event: H3Event): Promise<PublicUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Login required.'
    })
  }
  return user
}

export async function requireAdminSession(event: H3Event): Promise<PublicUser> {
  const user = await requireUserSession(event)
  if (!user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required.'
    })
  }
  return user
}
