export interface UploadResponse {
  id: string
  url: string
  fileName: string
  size: number
  objectKey?: string
  contentType?: string
  directory?: string
}

export function uploadFileWithProgress(
  file: File,
  options: {
    directory?: string
    onProgress?: (percent: number) => void
  }
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
    if (options.directory?.trim()) {
      form.append('directory', options.directory.trim())
    }

    xhr.withCredentials = true

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      const parsed = (() => {
        try {
          return JSON.parse(xhr.responseText || '{}') as { statusMessage?: string, message?: string } & Partial<UploadResponse>
        } catch {
          return {} as { statusMessage?: string, message?: string } & Partial<UploadResponse>
        }
      })()

      if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
        resolve(parsed as UploadResponse)
        return
      }

      reject(new Error(parsed.statusMessage || parsed.message || xhr.statusText || '上传失败'))
    })

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'))
    })

    xhr.open('POST', '/api/upload')
    xhr.send(form)
  })
}
