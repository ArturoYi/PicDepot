import { SESSION_COOKIE } from '../../utils/users'

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
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  deleteCookie(event, 'admin_session', { path: '/' })
  return { ok: true }
})
