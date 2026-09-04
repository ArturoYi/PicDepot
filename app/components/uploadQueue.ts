export type UploadQueueStatus = 'queued' | 'converting' | 'uploading' | 'success' | 'error'

export interface UploadQueueResult {
  url: string
  fileName: string
  size: number
  id: string
}

export interface UploadQueueItem {
  id: string
  fileName: string
  previewUrl: string | null
  progress: number
  status: UploadQueueStatus
  error?: string
  result?: UploadQueueResult
}

export const uploadStatusMeta: Record<UploadQueueStatus, {
  label: string
  color: 'neutral' | 'warning' | 'primary' | 'success' | 'error'
  icon: string
}> = {
  queued: { label: '等待中', color: 'neutral', icon: 'i-lucide-clock' },
  converting: { label: '转换中', color: 'warning', icon: 'i-lucide-refresh-cw' },
  uploading: { label: '上传中', color: 'primary', icon: 'i-lucide-loader-circle' },
  success: { label: '已完成', color: 'success', icon: 'i-lucide-check' },
  error: { label: '失败', color: 'error', icon: 'i-lucide-circle-alert' }
}
