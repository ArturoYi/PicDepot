export default defineEventHandler((event) => {
  const env = getCfEnv(event)
  return {
    ok: true,
    name: 'cf-imgbed-lite',
    phase: 0,
    bindings: {
      db: Boolean(env.DB),
      bucket: Boolean(env.BUCKET)
    },
    r2PublicBaseUrlConfigured: Boolean(getPublicBaseUrl(event)),
    maxUploadBytes: getMaxUploadBytes(event)
  }
})
