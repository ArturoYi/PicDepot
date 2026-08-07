/** 生成不可猜测的短 ID（用于 object_key / 文件 id） */
export function createFileId(length = 20): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}

export function buildObjectKey(id: string, fileName: string): string {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const ext = fileName.includes('.')
    ? fileName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
    : 'bin'
  return `files/${yyyy}/${mm}/${id}.${ext || 'bin'}`
}
