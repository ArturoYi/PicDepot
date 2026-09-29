export function isTiffLikeFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return (
    name.endsWith('.tif')
    || name.endsWith('.tiff')
    || type === 'image/tiff'
    || type === 'image/tif'
    || type === 'image/x-tiff'
  )
}
