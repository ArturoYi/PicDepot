export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody<{ ids?: string[], directory?: string }>(event)
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).slice(0, 100) : []
  if (!ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'ids is required.' })
  }

  const directory = sanitizeDirectory(String(body.directory ?? ''))
  const db = getDb(event)
  const now = Date.now()
  const results: Array<{ id: string, ok: boolean }> = []

  for (const id of ids) {
    const row = await db.prepare('SELECT id FROM files WHERE id = ?').bind(id).first()
    if (!row) {
      results.push({ id, ok: false })
      continue
    }
    await db.prepare('UPDATE files SET directory = ?, updated_at = ? WHERE id = ?')
      .bind(directory, now, id)
      .run()
    results.push({ id, ok: true })
  }

  return { ok: true, directory, results }
})
