/** 图片及其他文件的默认上限：20MB */
export const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/** 视频默认上限：50MB（压缩后的上传体积） */
export const DEFAULT_MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024

const VIDEO_NAME_RE = /\.(mp4|m4v|webm|mov|mkv|avi|ogv|ogg|mpeg|mpg|3gp|3g2|qt|wmv)$/i

export function isVideoUpload(name: string, contentType = ''): boolean {
  if (contentType.toLowerCase().startsWith('video/')) return true
  return VIDEO_NAME_RE.test(name)
}
