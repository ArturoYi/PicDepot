export interface AdminFileRow {
  id: string
  file_name: string
  directory: string
  size_bytes: number
  content_type?: string
  visibility?: string
  url?: string | null
  uploader_ip?: string
  created_at?: number
  object_key?: string
}

export function formatFileBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function formatFileTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function fileContentType(row: AdminFileRow) {
  return row.content_type || '—'
}

export function isImageFile(row: AdminFileRow) {
  return (row.content_type || '').startsWith('image/')
}

export function isVideoFile(row: AdminFileRow) {
  return (row.content_type || '').startsWith('video/')
}

export function isPreviewableFile(row: AdminFileRow) {
  return !!row.url && (isImageFile(row) || isVideoFile(row))
}
