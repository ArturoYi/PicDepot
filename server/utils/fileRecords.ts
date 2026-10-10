import type { H3Event } from '../types/h3-event'

export interface FileListFilters {
  q?: string
  dir?: string
  type?: string
  visibility?: string
  /** 未指定 dir 时排除该分类目录 */
  excludeDir?: string
}

export function sanitizeDirectory(raw: string): string {
  return String(raw || '')
    .replace(/\.\./g, '_')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
}

export function buildFileListWhere(filters: FileListFilters): { clause: string, binds: unknown[] } {
  const parts: string[] = []
  const binds: unknown[] = []

  if (filters.dir === '__root__') {
    parts.push('(directory = \'\' OR directory IS NULL)')
  } else if (filters.dir !== undefined && filters.dir !== '') {
    parts.push('directory = ?')
    binds.push(filters.dir)
  } else if (filters.excludeDir?.trim()) {
    const hidden = sanitizeDirectory(filters.excludeDir)
    // 库里没有该分类时，NOT EXISTS 为真，条件整体放行，避免误伤其他文件
    parts.push(`(
      directory IS NULL
      OR directory != ?
      OR NOT EXISTS (SELECT 1 FROM files AS hidden_dir WHERE hidden_dir.directory = ?)
    )`)
    binds.push(hidden, hidden)
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_]/g, '')
    if (q) {
      parts.push('file_name LIKE ?')
      binds.push(`%${q}%`)
    }
  }

  if (filters.type?.trim()) {
    parts.push('content_type LIKE ?')
    binds.push(`${filters.type.trim()}%`)
  }

  if (filters.visibility?.trim()) {
    parts.push('visibility = ?')
    binds.push(filters.visibility.trim())
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, binds }
}

export async function deleteFileById(event: H3Event, id: string): Promise<boolean> {
  const db = getDb(event)
  const bucket = getBucket(event)
  const row = await db.prepare('SELECT object_key FROM files WHERE id = ?').bind(id).first<{ object_key: string }>()
  if (!row?.object_key) {
    return false
  }
  await bucket.delete(row.object_key)
  await db.prepare('DELETE FROM files WHERE id = ?').bind(id).run()
  return true
}

export async function mapFilesWithUrls(
  event: H3Event,
  rows: Record<string, unknown>[]
): Promise<Array<Record<string, unknown>>> {
  const publicBase = getPublicBaseUrl(event)
  return rows.map(row => ({
    ...row,
    url: publicBase && row.object_key ? `${publicBase}/${row.object_key}` : null
  }))
}
