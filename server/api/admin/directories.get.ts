export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)

  const result = await db.prepare(`
    SELECT directory, COUNT(*) AS count
    FROM files
    GROUP BY directory
    ORDER BY
      CASE WHEN directory = '' THEN 0 ELSE 1 END,
      directory ASC
    LIMIT 2000
  `).all()

  const items = (result.results || []).map((row: Record<string, unknown>) => ({
    directory: String(row.directory || ''),
    count: Number(row.count) || 0
  }))

  const directories = items
    .map(item => item.directory)
    .filter(Boolean)

  return { directories, items }
})
