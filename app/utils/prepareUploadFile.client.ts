import type { TiffPage } from 'utif'
import { isHeicLikeFile } from './heicDetect'
import { isTiffLikeFile } from './tiffDetect'

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

/** Safari 等可原生解码 HEIC/TIFF 时走这条，避免加载解码库 */
async function tryNativeConvert(file: File): Promise<File | null> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }

  try {
    if (!bitmap.width || !bitmap.height) return null
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

function pagePixels(page: TiffPage): number {
  const width = page.t256?.[0] || page.width || 0
  const height = page.t257?.[0] || page.height || 0
  return width * height
}

function collectTiffPages(pages: TiffPage[], into: TiffPage[] = []): TiffPage[] {
  for (const page of pages) {
    into.push(page)
    if (page.subIFD?.length) collectTiffPages(page.subIFD, into)
  }
  return into
}

/** 多页、缩略图或 SubIFD 时取面积最大的一页；同尺寸则保留先出现的那页 */
function pickTiffPage(pages: TiffPage[]): TiffPage | null {
  let best: TiffPage | null = null
  let bestPixels = 0
  for (const page of collectTiffPages(pages)) {
    const pixels = pagePixels(page)
    if (pixels > bestPixels) {
      best = page
      bestPixels = pixels
    }
  }
  return best
}

async function convertWithUtif(file: File): Promise<File> {
  try {
    const mod = await import('utif') as typeof import('utif') & {
      default?: typeof import('utif')
    }
    const utif = typeof mod.decode === 'function' ? mod : mod.default
    if (!utif) {
      throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试')
    }
    const buffer = await file.arrayBuffer()
    const pages = utif.decode(buffer)
    const page = pickTiffPage(pages)
    if (!page) {
      throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试')
    }

    utif.decodeImage(buffer, page, pages)
    const width = page.width || page.t256?.[0] || 0
    const height = page.height || page.t257?.[0] || 0
    const rgba = utif.toRGBA8(page)
    if (!width || !height || rgba.length !== width * height * 4) {
      throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试')
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试')
    }
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0)

    for (const mime of [PREFERRED_MIME, FALLBACK_MIME] as const) {
      const blob = await encodeCanvas(canvas, mime)
      if (blob?.size) {
        return fileFromBlob(blob, file.name, mime, file.lastModified)
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('TIFF 转换失败')) throw error
    throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试', { cause: error })
  }

  throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试')
}

/**
 * 上传前预处理：HEIC/HEIF、TIFF → WebP（失败则 JPEG），quality=1，便于浏览器直链预览。
 * 仅应在客户端调用。
 */
export async function prepareUploadFile(file: File): Promise<File> {
  if (isHeicLikeFile(file)) {
    const native = await tryNativeConvert(file)
    if (native) return native
    return convertWithHeicTo(file)
  }

  if (isTiffLikeFile(file)) {
    try {
      return await convertWithUtif(file)
    } catch (error) {
      const native = await tryNativeConvert(file)
      if (native) return native
      throw new Error('TIFF 转换失败，请改用 JPEG/PNG 后重试', { cause: error })
    }
  }

  return file
}
