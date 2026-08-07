import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)
  const query = getQuery(event)

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const page = Math.max(Number(query.page) || 1, 1)
  const offset = (page - 1) * limit

  const filters = {
    q: typeof query.q === 'string' ? query.q : undefined,
    dir: typeof query.dir === 'string' ? query.dir : undefined,
    type: typeof query.type === 'string' ? query.type : undefined,
    visibility: typeof query.visibility === 'string' ? query.visibility : undefined
  }

  const { clause, binds } = buildFileListWhere(filters)

  const countRow = await db.prepare(`SELECT COUNT(*) AS total FROM files ${clause}`)
    .bind(...binds)
    .first<{ total: number }>()

  const result = await db.prepare(`
    SELECT id, object_key, file_name, content_type, size_bytes, directory, visibility, uploader_ip, created_at
    FROM files ${clause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).bind(...binds, limit, offset).all()

  const files = await mapFilesWithUrls(event, (result.results || []) as Record<string, unknown>[])

  return {
    files,
    total: Number(countRow?.total) || 0,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((Number(countRow?.total) || 0) / limit))
  }
})
