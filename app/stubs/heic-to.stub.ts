/** SSR stub：避免把 ~3MB WASM 打进 Cloudflare Worker */
export async function isHeic(_file: File): Promise<boolean> {
  return false
}

export async function heicTo(_args: {
  blob: Blob
  type: string
  quality?: number
}): Promise<Blob> {
  throw new Error('heic-to is client-only')
}
