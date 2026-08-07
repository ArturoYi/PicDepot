const STORAGE_KEY = 'picdepot-upload-prefs'

interface UploadPrefs {
  directory: string
}

function readPrefs(): UploadPrefs {
  if (!import.meta.client) {
    return { directory: '' }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { directory: '' }
    }
    const parsed = JSON.parse(raw) as Partial<UploadPrefs & { authCode?: string }>
    return {
      directory: parsed.directory || ''
    }
  } catch {
    return { directory: '' }
  }
}

function writePrefs(prefs: UploadPrefs) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ directory: prefs.directory }))
}

export function useUploadPreferences() {
  const initial = readPrefs()
  const directory = ref(initial.directory)

  watch(directory, () => {
    writePrefs({ directory: directory.value })
  })

  return { directory }
}
