export function isHeicLikeFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return (
    name.endsWith('.heic')
    || name.endsWith('.heif')
    || type === 'image/heic'
    || type === 'image/heif'
    || type === 'image/heic-sequence'
    || type === 'image/heif-sequence'
  )
}
