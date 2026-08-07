export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file id.' })
  }

  const ok = await deleteFileById(event, id)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  }

  return { ok: true, id }
})
