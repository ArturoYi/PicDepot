export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file id.' })
  }

  const body = await readBody<{ file_name?: string, directory?: string }>(event)
  const db = getDb(event)
  const row = await db.prepare('SELECT id FROM files WHERE id = ?').bind(id).first()
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  }

  const updates: string[] = []
  const binds: unknown[] = []

  if (body.file_name !== undefined) {
    const name = String(body.file_name || '').trim()
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'file_name cannot be empty.' })
    }
    updates.push('file_name = ?')
    binds.push(name.slice(0, 512))
  }

  if (body.directory !== undefined) {
    updates.push('directory = ?')
    binds.push(sanitizeDirectory(String(body.directory)))
  }

  if (!updates.length) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update.' })
  }

  const now = Date.now()
  updates.push('updated_at = ?')
  binds.push(now, id)

  await db.prepare(`UPDATE files SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run()

  const updated = await db.prepare(`
    SELECT id, object_key, file_name, content_type, size_bytes, directory, visibility, created_at
    FROM files WHERE id = ?
  `).bind(id).first<Record<string, unknown>>()

  const [file] = updated ? await mapFilesWithUrls(event, [updated]) : []
  return { ok: true, file }
})
