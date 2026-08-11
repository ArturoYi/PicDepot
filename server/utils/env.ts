/**
 * Cloudflare 绑定读取层。
 *
 * 生产 / 手动部署：依赖 wrangler.toml / Dashboard 中的 DB、BUCKET、vars，不需要 `.env`。
 * 本地开发：可用 `.env` 覆盖 Nuxt runtimeConfig；D1/R2 仍须在 wrangler.toml 绑定（可 remote）。
 */
import type { H3Event } from '../types/h3-event'
import type { CfImgBedEnv } from '../../shared/types/env'

export function getCfEnv(event: H3Event): CfImgBedEnv {
  return ((event.context as { cloudflare?: { env?: CfImgBedEnv } }).cloudflare?.env || {}) as CfImgBedEnv
}

/** 读取 D1；未在 Cloudflare 创建并绑定数据库时返回 503 */
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

/** 读取 R2；未在 Cloudflare 创建并绑定存储桶时返回 503 */
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

/** 公网直链根：优先 Worker 的 R2_PUBLIC_BASE_URL，其次本地 runtimeConfig / .env */
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
