import type { H3Event } from '../types/h3-event'
import type { CfImgBedEnv } from '../../shared/types/env'

export function getCfEnv(event: H3Event): CfImgBedEnv {
  return ((event.context as { cloudflare?: { env?: CfImgBedEnv } }).cloudflare?.env || {}) as CfImgBedEnv
}

export function getDb(event: H3Event): D1Database {
  const db = getCfEnv(event).DB
  if (!db) {
    throw createError({
      statusCode: 503,
      statusMessage: 'D1 binding DB is not configured. Create a D1 database and bind it in wrangler.toml.'
    })
  }
  return db
}

export function getBucket(event: H3Event): R2Bucket {
  const bucket = getCfEnv(event).BUCKET
  if (!bucket) {
    throw createError({
      statusCode: 503,
      statusMessage: 'R2 binding BUCKET is not configured. Create an R2 bucket and bind it in wrangler.toml.'
    })
  }
  return bucket
}

export function getPublicBaseUrl(event: H3Event): string {
  const env = getCfEnv(event)
  const fromEnv = env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') || ''
  if (fromEnv) return fromEnv
  const config = useRuntimeConfig(event)
  return String(config.r2PublicBaseUrl || '').replace(/\/$/, '')
}

export function getMaxUploadBytes(event: H3Event): number {
  const env = getCfEnv(event)
  if (env.MAX_UPLOAD_BYTES) {
    const n = Number(env.MAX_UPLOAD_BYTES)
    if (Number.isFinite(n) && n > 0) return n
  }
  return Number(useRuntimeConfig(event).maxUploadBytes) || 20 * 1024 * 1024
}
