import { isHeicLikeFile } from './heicDetect'

/** 浏览器可稳定预览；quality=1 尽量减少二次有损压缩 */
const PREFERRED_MIME = 'image/webp' as const
const FALLBACK_MIME = 'image/jpeg' as const
const MAX_QUALITY = 1

function replaceExtension(fileName: string, ext: string): string {
  const base = fileName.replace(/\.[^.]+$/, '') || fileName
  return `${base}.${ext}`
}

function fileFromBlob(blob: Blob, fileName: string, mime: string, lastModified: number): File {
  const ext = mime === PREFERRED_MIME ? 'webp' : 'jpg'
  return new File([blob], replaceExtension(fileName, ext), {
    type: mime,
    lastModified
  })
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: typeof PREFERRED_MIME | typeof FALLBACK_MIME
): Promise<Blob | null> {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(blob => resolve(blob), mime, MAX_QUALITY)
  })
}

/** Safari 等可原生解码 HEIC 时走这条，避免加载 WASM */
async function tryNativeConvert(file: File): Promise<File | null> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0)

    for (const mime of [PREFERRED_MIME, FALLBACK_MIME] as const) {
      const blob = await encodeCanvas(canvas, mime)
      if (blob?.size) {
        return fileFromBlob(blob, file.name, mime, file.lastModified)
      }
    }
    return null
  } finally {
    bitmap.close()
  }
}

async function convertWithHeicTo(file: File): Promise<File> {
  const { heicTo, isHeic } = await import('heic-to')
  if (!(await isHeic(file))) {
    return file
  }

  for (const mime of [PREFERRED_MIME, FALLBACK_MIME] as const) {
    try {
      const blob = await heicTo({
        blob: file,
        type: mime,
        quality: MAX_QUALITY
      })
      if (blob?.size) {
        return fileFromBlob(blob, file.name, mime, file.lastModified)
      }
    } catch {
      // try next mime
    }
  }

  throw new Error('HEIC 转换失败，请改用 JPEG/PNG 后重试')
}

/**
 * 上传前预处理：HEIC/HEIF → WebP（失败则 JPEG），quality=1，便于浏览器直链预览。
 * 仅应在客户端调用。
 */
export async function prepareUploadFile(file: File): Promise<File> {
  if (!isHeicLikeFile(file)) return file

  const native = await tryNativeConvert(file)
  if (native) return native

  return convertWithHeicTo(file)
}
