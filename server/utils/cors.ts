import type { H3Event } from '../types/h3-event'

const UPLOAD_CORS_PATHS = ['/api/upload']

export function applyUploadCors(event: H3Event): void {
  const path = getRequestURL(event).pathname
  if (!UPLOAD_CORS_PATHS.some(p => path === p || path.startsWith(`${p}/`))) {
    return
  }

  const config = useRuntimeConfig(event)
  const allowedRaw = String(config.corsOrigins || '').trim()
  const origin = getHeader(event, 'origin')
  if (!origin) return

  if (allowedRaw) {
    const allowed = allowedRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (!allowed.includes(origin)) return
  }

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  })
}
