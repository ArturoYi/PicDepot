import { SESSION_COOKIE, getSessionCookieOptions } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, SESSION_COOKIE)
  if (sessionId) {
    try {
      const db = getDb(event)
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
    } catch {
      // binding 未配置时仍清除 cookie
    }
  }
  const cookieOptions = getSessionCookieOptions(event)
  deleteCookie(event, SESSION_COOKIE, cookieOptions)
  deleteCookie(event, 'admin_session', cookieOptions)
  return { ok: true }
})
