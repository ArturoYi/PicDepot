export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const totals = await db.prepare(`
    SELECT COUNT(*) AS file_count, COALESCE(SUM(size_bytes), 0) AS total_bytes
    FROM files
  `).first<{ file_count: number, total_bytes: number }>()

  const recent = await db.prepare(`
    SELECT COUNT(*) AS uploads_7d FROM files WHERE created_at >= ?
  `).bind(sevenDaysAgo).first<{ uploads_7d: number }>()

  return {
    fileCount: Number(totals?.file_count) || 0,
    totalBytes: Number(totals?.total_bytes) || 0,
    uploadsLast7Days: Number(recent?.uploads_7d) || 0
  }
})
