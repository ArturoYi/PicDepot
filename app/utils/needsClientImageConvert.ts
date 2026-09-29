import { isHeicLikeFile } from './heicDetect'
import { isTiffLikeFile } from './tiffDetect'

/** 浏览器不能稳定用 <img> 预览，上传前需转成 WebP/JPEG */
export function needsClientImageConvert(file: File): boolean {
  return isHeicLikeFile(file) || isTiffLikeFile(file)
}
