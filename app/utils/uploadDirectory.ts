/** 未指定目录时：图片 → image，视频 → video */
export function resolveUploadDirectory(file: File, manualDirectory: string): string {
  const manual = manualDirectory.trim()
  if (manual) return manual

  const type = file.type || ''
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  return ''
}
