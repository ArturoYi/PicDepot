import { DEFAULT_MAX_VIDEO_UPLOAD_BYTES } from '#shared/utils/uploadLimits'
import type { VideoSample } from 'mediabunny'

const PREVIEWABLE_CODECS = new Set(['avc', 'vp8', 'vp9', 'av1'])

type Profile = {
  container: 'webm' | 'mp4'
  videoCodec: 'vp9' | 'av1' | 'avc'
  audioCodec: 'opus' | 'aac'
  mime: string
  ext: string
}

/** VP9 / AV1 更省空间；编码不可用时再退回 H.264，保证浏览器能播 */
const PROFILES: Profile[] = [
  { container: 'webm', videoCodec: 'vp9', audioCodec: 'opus', mime: 'video/webm', ext: 'webm' },
  { container: 'webm', videoCodec: 'av1', audioCodec: 'opus', mime: 'video/webm', ext: 'webm' },
  { container: 'mp4', videoCodec: 'avc', audioCodec: 'aac', mime: 'video/mp4', ext: 'mp4' },
  { container: 'mp4', videoCodec: 'av1', audioCodec: 'aac', mime: 'video/mp4', ext: 'mp4' }
]

const QUALITY_LADDER = ['very-high', 'high'] as const

function replaceExtension(fileName: string, ext: string) {
  const base = fileName.replace(/\.[^.]+$/, '') || fileName
  return `${base}.${ext}`
}

function isPreviewContainer(file: File) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return type === 'video/mp4'
    || type === 'video/webm'
    || type === 'video/ogg'
    || name.endsWith('.mp4')
    || name.endsWith('.m4v')
    || name.endsWith('.webm')
    || name.endsWith('.ogv')
    || name.endsWith('.ogg')
}

function abortError() {
  return new DOMException('上传已取消', 'AbortError')
}

function evenDimension(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  const rounded = Math.max(2, Math.round(value))
  return rounded - (rounded % 2)
}

/**
 * VP9 硬件编码器在 macOS 上会产出能播、但画面全黑的 WebM，声音轨道却是正常的。
 * HDR / 10-bit 帧如果直接送进编码器，也会被当成极暗的 SDR。
 * 先画到不透明画布，再交给软件编码器。
 */
function createOpaqueBlitter() {
  let canvas: HTMLCanvasElement | null = null
  let context: CanvasRenderingContext2D | null = null

  return (sample: VideoSample) => {
    const width = evenDimension(sample.displayWidth)
    const height = evenDimension(sample.displayHeight)
    if (!width || !height) return sample
    if (!canvas || canvas.width !== width || canvas.height !== height) {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      context = canvas.getContext('2d', { alpha: false })
    }
    if (!canvas || !context) return sample
    context.clearRect(0, 0, width, height)
    sample.draw(context, 0, 0, width, height)
    return canvas
  }
}

function accelerationOrder(codec: Profile['videoCodec']) {
  if (codec === 'avc') return ['prefer-hardware', 'prefer-software'] as const
  return ['prefer-software'] as const
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

type Mediabunny = typeof import('mediabunny')

/**
 * 已压缩视频做数学无损重编码通常会变大，所以用编码器最高推荐画质转到更高效的格式，
 * 并保持原始分辨率。体积没有明显下降、且原片已能在浏览器播放时，保留原文件。
 */
export async function prepareUploadVideo(
  file: File,
  options?: {
    maxBytes?: number
    onProgress?: (percent: number) => void
    signal?: AbortSignal
  }
): Promise<File> {
  throwIfAborted(options?.signal)

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_VIDEO_UPLOAD_BYTES
  const mb = await import('mediabunny')
  const probed = await probeFile(mb, file)
  if (!probed) return file

  const profiles = await encodableProfiles(mb, probed.hasAudio, options?.signal)
  if (!profiles.length) {
    if (probed.previewable) return file
    throw new Error('当前浏览器无法压缩该视频，请改用 Chrome 后重试')
  }

  const limitMb = Math.floor(maxBytes / 1024 / 1024)
  let encodedOnce = false
  for (const level of QUALITY_LADDER) {
    for (const profile of profiles) {
      throwIfAborted(options?.signal)
      options?.onProgress?.(0)
      try {
        const compressed = await transcode(mb, file, profile, level, probed.hasAudio, options)
        if (!compressed) continue
        encodedOnce = true
        const fits = compressed.size <= maxBytes
        const smaller = compressed.size < file.size * 0.98
        if (fits && (smaller || !probed.previewable)) return compressed
        break
      } catch (error) {
        if (options?.signal?.aborted || error instanceof mb.ConversionCanceledError) throw abortError()
      }
    }
    if (!encodedOnce) break
    if (probed.previewable) return file
  }

  if (probed.previewable) return file
  throw new Error(encodedOnce
    ? `压缩后仍超过 ${limitMb}MB，请缩短视频后重试`
    : '视频压缩失败，请换用 MP4 后重试')
}

async function probeFile(mb: Mediabunny, file: File) {
  const input = new mb.Input({
    source: new mb.BlobSource(file),
    formats: mb.ALL_FORMATS
  })
  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack) return null
    const codec = await videoTrack.getCodec()
    return {
      previewable: !!codec && PREVIEWABLE_CODECS.has(codec) && isPreviewContainer(file),
      hasAudio: !!(await input.getPrimaryAudioTrack())
    }
  } catch {
    return null
  } finally {
    input.dispose()
  }
}

async function encodableProfiles(mb: Mediabunny, hasAudio: boolean, signal?: AbortSignal) {
  const quality = new mb.Quality('very-high')
  const profiles: Profile[] = []
  for (const profile of PROFILES) {
    throwIfAborted(signal)
    if (!(await mb.canEncodeVideo(profile.videoCodec, { quality }))) continue
    if (hasAudio && profile.container === 'webm' && !(await mb.canEncodeAudio(profile.audioCodec))) continue
    profiles.push(profile)
  }
  return profiles
}

async function transcode(
  mb: Mediabunny,
  file: File,
  profile: Profile,
  level: typeof QUALITY_LADDER[number],
  hasAudio: boolean,
  options?: {
    onProgress?: (percent: number) => void
    signal?: AbortSignal
  }
) {
  for (const acceleration of accelerationOrder(profile.videoCodec)) {
    throwIfAborted(options?.signal)
    const compressed = await transcodeOnce(mb, file, profile, level, hasAudio, acceleration, options)
    if (compressed) return compressed
  }
  return null
}

async function transcodeOnce(
  mb: Mediabunny,
  file: File,
  profile: Profile,
  level: typeof QUALITY_LADDER[number],
  hasAudio: boolean,
  hardwareAcceleration: 'prefer-hardware' | 'prefer-software' | 'no-preference',
  options?: {
    onProgress?: (percent: number) => void
    signal?: AbortSignal
  }
) {
  const input = new mb.Input({
    source: new mb.BlobSource(file),
    formats: mb.ALL_FORMATS
  })
  let conversion: Awaited<ReturnType<Mediabunny['Conversion']['init']>> | null = null
  const onAbort = () => {
    void conversion?.cancel()
  }

  try {
    const encodeAudio = hasAudio ? await mb.canEncodeAudio(profile.audioCodec) : false
    const blitOpaque = createOpaqueBlitter()
    const target = new mb.BufferTarget()
    const output = new mb.Output({
      format: profile.container === 'webm' ? new mb.WebMOutputFormat() : new mb.Mp4OutputFormat(),
      target
    })

    conversion = await mb.Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      video: {
        codec: profile.videoCodec,
        quality: new mb.Quality(level),
        hardwareAcceleration,
        alpha: 'discard',
        allowRotationMetadata: false,
        process: blitOpaque
      },
      audio: hasAudio
        ? (encodeAudio
            ? { codec: profile.audioCodec, quality: new mb.Quality('high') }
            : {})
        : { discard: true }
    })

    if (!conversion.isValid) return null

    conversion.onProgress = (progress: number) => {
      options?.onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))))
    }
    options?.signal?.addEventListener('abort', onAbort, { once: true })
    await conversion.execute()

    const buffer = target.buffer
    if (!buffer?.byteLength) return null
    return new File([buffer], replaceExtension(file.name, profile.ext), {
      type: profile.mime,
      lastModified: file.lastModified
    })
  } catch (error) {
    if (options?.signal?.aborted || error instanceof mb.ConversionCanceledError) throw error
    return null
  } finally {
    options?.signal?.removeEventListener('abort', onAbort)
    input.dispose()
  }
}
