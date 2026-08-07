export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody<{ ids?: string[] }>(event)
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).slice(0, 50) : []
  if (!ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'ids is required.' })
  }

  const results: Array<{ id: string, ok: boolean }> = []

  for (const id of ids) {
    const ok = await deleteFileById(event, id)
    results.push({ id, ok })
  }

  return {
    ok: true,
    deleted: results.filter(r => r.ok).length,
    results
  }
})
