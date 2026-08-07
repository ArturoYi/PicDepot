import type { H3Event } from '../types/h3-event'

/** 仅用于从旧版 D1 settings 迁移首个管理员账号 */
export interface SecuritySettings {
  auth: {
    admin: { adminUsername: string, adminPassword: string }
  }
}

const DEFAULT_SECURITY: SecuritySettings = {
  auth: {
    admin: { adminUsername: '', adminPassword: '' }
  }
}

export async function getSecuritySettings(event: H3Event): Promise<SecuritySettings> {
  const db = getDb(event)
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('security').first<{ value: string }>()
  if (!row?.value) {
    return structuredClone(DEFAULT_SECURITY)
  }
  try {
    const parsed = JSON.parse(row.value) as { auth?: { admin?: Partial<SecuritySettings['auth']['admin']> } }
    return {
      auth: {
        admin: {
          adminUsername: parsed.auth?.admin?.adminUsername || '',
          adminPassword: parsed.auth?.admin?.adminPassword || ''
        }
      }
    }
  } catch {
    return structuredClone(DEFAULT_SECURITY)
  }
}
