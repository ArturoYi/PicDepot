export type BackgroundGroup = 'light' | 'dark'

const STORAGE_KEY = 'picdepot-bg-index'

/** 浅色 / 深色两组背景；后续可直接往数组追加图片路径 */
export const BACKGROUND_SETS: Record<BackgroundGroup, string[]> = {
  light: ['/backgrounds/light.png'],
  dark: ['/backgrounds/dark.png']
}

export const BACKGROUND_PLACEHOLDER: Record<BackgroundGroup, string> = {
  light: '#f4f4f5',
  dark: '#18181b'
}

interface BgIndexPrefs {
  light: number
  dark: number
}

function readIndexPrefs(): BgIndexPrefs {
  if (!import.meta.client) {
    return { light: 0, dark: 0 }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { light: 0, dark: 0 }
    const parsed = JSON.parse(raw) as Partial<BgIndexPrefs>
    return {
      light: Number(parsed.light) || 0,
      dark: Number(parsed.dark) || 0
    }
  } catch {
    return { light: 0, dark: 0 }
  }
}

function writeIndexPrefs(prefs: BgIndexPrefs) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

function normalizeIndex(index: number, length: number) {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (!import.meta.client) {
      resolve()
      return
    }
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function usePageBackground() {
  const colorMode = useColorMode()
  const prefs = useState<BgIndexPrefs>('page-bg-index', () => readIndexPrefs())
  const readySrc = useState<string | null>('page-bg-ready-src', () => null)
  const loading = useState('page-bg-loading', () => false)

  const group = computed<BackgroundGroup>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light'
  )

  const images = computed(() => BACKGROUND_SETS[group.value])

  const currentIndex = computed(() =>
    normalizeIndex(prefs.value[group.value], images.value.length)
  )

  const currentSrc = computed(() => images.value[currentIndex.value] || null)

  const placeholderColor = computed(() => BACKGROUND_PLACEHOLDER[group.value])

  const showImage = computed(() =>
    Boolean(currentSrc.value && readySrc.value === currentSrc.value)
  )

  async function ensureLoaded(src: string | null) {
    if (!src || !import.meta.client) {
      readySrc.value = null
      loading.value = false
      return
    }
    if (readySrc.value === src) {
      loading.value = false
      return
    }

    loading.value = true
    // 切换时先回退到纯色占位，加载完成后再展示
    readySrc.value = null
    try {
      await preloadImage(src)
      if (currentSrc.value === src) {
        readySrc.value = src
      }
    } catch {
      if (currentSrc.value === src) {
        readySrc.value = null
      }
    } finally {
      if (currentSrc.value === src) {
        loading.value = false
      }
    }
  }

  function cycleBackground() {
    const list = images.value
    if (!list.length) return
    const next = normalizeIndex(currentIndex.value + 1, list.length)
    prefs.value = {
      ...prefs.value,
      [group.value]: next
    }
    writeIndexPrefs(prefs.value)
  }

  const watcherStarted = useState('page-bg-watcher-started', () => false)
  if (import.meta.client && !watcherStarted.value) {
    watcherStarted.value = true
    watch(currentSrc, (src) => {
      ensureLoaded(src)
    }, { immediate: true })
  }

  return {
    group,
    images,
    currentIndex,
    currentSrc,
    placeholderColor,
    showImage,
    loading,
    cycleBackground
  }
}
