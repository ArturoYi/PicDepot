export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 200)

  const result = await db.prepare(`
    SELECT DISTINCT directory FROM files
    WHERE directory != ''
    ORDER BY directory ASC
    LIMIT ?
  `).bind(limit).all()

  const directories = (result.results || [])
    .map((row: Record<string, unknown>) => String(row.directory || ''))
    .filter(Boolean)

  return { directories }
})
