import type { H3Event } from '../types/h3-event'

/**
 * 上传鉴权：当前与登录会话绑定（非历史上传码模式）。
 * 匿名上传已关闭；第三方客户端需 Cookie 会话或后续扩展 API Token。
 */
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
