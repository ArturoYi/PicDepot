export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const db = getDb(event)
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  const totals = await db.prepare(`
    SELECT
      COUNT(*) AS file_count,
      COALESCE(SUM(size_bytes), 0) AS total_bytes,
      COALESCE(AVG(size_bytes), 0) AS avg_bytes,
      COUNT(DISTINCT CASE WHEN directory != '' THEN directory END) AS directory_count,
      COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS uploads_1d,
      COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS uploads_7d,
      COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS uploads_30d,
      COALESCE(SUM(CASE WHEN created_at >= ? THEN size_bytes ELSE 0 END), 0) AS bytes_7d,
      COALESCE(SUM(CASE WHEN content_type LIKE 'image/%' THEN 1 ELSE 0 END), 0) AS image_count,
      COALESCE(SUM(CASE WHEN content_type LIKE 'image/%' THEN size_bytes ELSE 0 END), 0) AS image_bytes,
      COALESCE(SUM(CASE WHEN content_type LIKE 'video/%' THEN 1 ELSE 0 END), 0) AS video_count,
      COALESCE(SUM(CASE WHEN content_type LIKE 'video/%' THEN size_bytes ELSE 0 END), 0) AS video_bytes,
      COALESCE(SUM(CASE WHEN content_type LIKE 'audio/%' THEN 1 ELSE 0 END), 0) AS audio_count,
      COALESCE(SUM(CASE WHEN content_type LIKE 'audio/%' THEN size_bytes ELSE 0 END), 0) AS audio_bytes
    FROM files
  `).bind(oneDayAgo, sevenDaysAgo, thirtyDaysAgo, sevenDaysAgo).first<{
    file_count: number
    total_bytes: number
    avg_bytes: number
    directory_count: number
    uploads_1d: number
    uploads_7d: number
    uploads_30d: number
    bytes_7d: number
    image_count: number
    image_bytes: number
    video_count: number
    video_bytes: number
    audio_count: number
    audio_bytes: number
  }>()

  const topDirResult = await db.prepare(`
    SELECT directory, COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS bytes
    FROM files
    GROUP BY directory
    ORDER BY bytes DESC
    LIMIT 8
  `).all()

  const fileCount = Number(totals?.file_count) || 0
  const totalBytes = Number(totals?.total_bytes) || 0
  const imageCount = Number(totals?.image_count) || 0
  const videoCount = Number(totals?.video_count) || 0
  const audioCount = Number(totals?.audio_count) || 0
  const imageBytes = Number(totals?.image_bytes) || 0
  const videoBytes = Number(totals?.video_bytes) || 0
  const audioBytes = Number(totals?.audio_bytes) || 0
  const otherCount = Math.max(0, fileCount - imageCount - videoCount - audioCount)
  const otherBytes = Math.max(0, totalBytes - imageBytes - videoBytes - audioBytes)

  const quotaBytes = getStorageQuotaBytes(event)
  const usagePercent = quotaBytes > 0
    ? Math.round((totalBytes / quotaBytes) * 1000) / 10
    : null

  const env = getCfEnv(event)

  return {
    fileCount,
    totalBytes,
    averageBytes: Number(totals?.avg_bytes) || 0,
    directoryCount: Number(totals?.directory_count) || 0,
    uploadsLast24Hours: Number(totals?.uploads_1d) || 0,
    uploadsLast7Days: Number(totals?.uploads_7d) || 0,
    uploadsLast30Days: Number(totals?.uploads_30d) || 0,
    bytesLast7Days: Number(totals?.bytes_7d) || 0,
    quotaBytes,
    usagePercent,
    types: {
      image: { count: imageCount, bytes: imageBytes },
      video: { count: videoCount, bytes: videoBytes },
      audio: { count: audioCount, bytes: audioBytes },
      other: { count: otherCount, bytes: otherBytes }
    },
    topDirectories: (topDirResult.results || []).map((row: Record<string, unknown>) => ({
      directory: String(row.directory || ''),
      count: Number(row.count) || 0,
      bytes: Number(row.bytes) || 0
    })),
    runtime: {
      db: Boolean(env.DB),
      bucket: Boolean(env.BUCKET),
      r2PublicBaseUrlConfigured: Boolean(getPublicBaseUrl(event)),
      maxUploadBytes: getMaxUploadBytes(event)
    }
  }
})
