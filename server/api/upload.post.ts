/**
 * 上传：登录会话 → 校验大小 → R2.put → D1 insert → 返回公网直链。
 * 未绑定 D1/R2 时 503；未登录时 401。生产配置来自 wrangler / Dashboard，不依赖 `.env`。
 */
export default defineEventHandler(async (event) => {
  applyUploadCors(event)
  if (event.method === 'OPTIONS') {
    return null
  }

  await requireUploadAuth(event)

  const bucket = getBucket(event)
  const db = getDb(event)
  const maxBytes = getMaxUploadBytes(event)
  const publicBase = getPublicBaseUrl(event)

  if (!publicBase) {
    throw createError({
      statusCode: 503,
      statusMessage: 'R2_PUBLIC_BASE_URL is not configured.'
    })
  }

  const form = await readMultipartFormData(event)
  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Expected multipart form data with a file field.' })
  }

  const filePart = form.find(p => p.name === 'file' && p.data && p.filename)
  if (!filePart || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field.' })
  }

  if (filePart.data.byteLength > maxBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: `File exceeds max size of ${Math.floor(maxBytes / 1024 / 1024)}MB.`
    })
  }

  const directoryPart = form.find(p => p.name === 'directory')
  const directory = sanitizeDirectory(
    directoryPart?.data ? new TextDecoder().decode(directoryPart.data) : ''
  )

  const id = createFileId(20)
  const objectKey = buildObjectKey(id, filePart.filename)
  const contentType = filePart.type || 'application/octet-stream'
  const now = Date.now()
  const size = filePart.data.byteLength

  await bucket.put(objectKey, filePart.data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    }
  })

  try {
    await db.prepare(`
      INSERT INTO files (
        id, object_key, file_name, content_type, size_bytes,
        directory, visibility, uploader_ip, created_at, updated_at, tags
      ) VALUES (?, ?, ?, ?, ?, ?, 'public', ?, ?, ?, '[]')
    `).bind(
      id,
      objectKey,
      filePart.filename,
      contentType,
      size,
      directory,
      getRequestIP(event, { xForwardedFor: true }) || '',
      now,
      now
    ).run()
  } catch (error) {
    await bucket.delete(objectKey)
    throw error
  }

  const url = `${publicBase}/${objectKey}`

  return {
    id,
    objectKey,
    fileName: filePart.filename,
    contentType,
    size,
    directory,
    url
  }
})
