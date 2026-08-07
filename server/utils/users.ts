import type { H3Event } from '../types/h3-event'

export interface UserRecord {
  id: string
  username: string
  password_hash: string
  is_admin: number
  created_at: number
}

export interface PublicUser {
  id: string
  username: string
  isAdmin: boolean
  createdAt: number
}

export const SESSION_COOKIE = 'user_session'
const DEFAULT_SESSION_MS = 14 * 24 * 60 * 60 * 1000

export function mapPublicUser(row: UserRecord): PublicUser {
  return {
    id: row.id,
    username: row.username,
    isAdmin: row.is_admin === 1,
    createdAt: row.created_at
  }
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS c FROM users').first<{ c: number }>()
  return Number(row?.c || 0)
}

/** 将旧版 settings.security 中的管理员迁入 users（仅当 users 为空时） */
export async function migrateLegacyAdminIfNeeded(event: H3Event): Promise<void> {
  const db = getDb(event)
  if (await countUsers(db) > 0) {
    return
  }

  const security = await getSecuritySettings(event)
  const username = security.auth.admin.adminUsername?.trim()
  const passwordHash = security.auth.admin.adminPassword
  if (!username || !passwordHash) {
    return
  }

  const id = createFileId(16)
  const now = Date.now()
  await db.prepare(`
    INSERT INTO users (id, username, password_hash, is_admin, created_at)
    VALUES (?, ?, ?, 1, ?)
  `).bind(id, username, passwordHash, now).run()
}

export async function findUserByUsername(
  db: D1Database,
  username: string
): Promise<UserRecord | null> {
  const row = await db.prepare(
    'SELECT id, username, password_hash, is_admin, created_at FROM users WHERE username = ?'
  ).bind(username.trim()).first<UserRecord>()
  return row || null
}

export async function findUserById(db: D1Database, id: string): Promise<UserRecord | null> {
  const row = await db.prepare(
    'SELECT id, username, password_hash, is_admin, created_at FROM users WHERE id = ?'
  ).bind(id).first<UserRecord>()
  return row || null
}

export async function listUsers(db: D1Database): Promise<PublicUser[]> {
  const result = await db.prepare(`
    SELECT id, username, password_hash, is_admin, created_at
    FROM users ORDER BY created_at ASC
  `).all<UserRecord>()
  return (result.results || []).map(mapPublicUser)
}

export async function createUserAccount(
  db: D1Database,
  options: {
    username: string
    password: string
    isAdmin?: boolean
    passwordHash?: string
  }
): Promise<PublicUser> {
  const username = options.username.trim()
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'username is required.' })
  }

  const existing = await findUserByUsername(db, username)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Username already exists.' })
  }

  const passwordHash = options.passwordHash || await hashPassword(options.password)
  if (!options.passwordHash && !options.password) {
    throw createError({ statusCode: 400, statusMessage: 'password is required.' })
  }

  const id = createFileId(16)
  const now = Date.now()
  await db.prepare(`
    INSERT INTO users (id, username, password_hash, is_admin, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, username, passwordHash, options.isAdmin ? 1 : 0, now).run()

  const row = await findUserById(db, id)
  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create user.' })
  }
  return mapPublicUser(row)
}

export async function createUserSession(event: H3Event, userId: string): Promise<string> {
  const sessionMs = DEFAULT_SESSION_MS
  const sessionId = createFileId(32)
  const now = Date.now()
  const expiresAt = now + sessionMs
  const db = getDb(event)

  await db.prepare(`
    INSERT INTO sessions (id, type, expires_at, created_at, user_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, 'user', expiresAt, now, userId).run()

  setCookie(event, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(sessionMs / 1000),
    secure: getRequestURL(event).protocol === 'https:'
  })

  return sessionId
}

export function defaultSessionMaxAgeMs(): number {
  return DEFAULT_SESSION_MS
}

export async function getSessionUser(event: H3Event): Promise<PublicUser | null> {
  const sessionId = getCookie(event, SESSION_COOKIE)
  if (!sessionId) {
    return null
  }

  try {
    const db = getDb(event)
    const row = await db.prepare(`
      SELECT u.id, u.username, u.password_hash, u.is_admin, u.created_at
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?
    `).bind(sessionId, Date.now()).first<UserRecord>()

    return row ? mapPublicUser(row) : null
  } catch {
    return null
  }
}

export async function needsBootstrap(event: H3Event): Promise<boolean> {
  await migrateLegacyAdminIfNeeded(event)
  const db = getDb(event)
  return (await countUsers(db)) === 0
}
