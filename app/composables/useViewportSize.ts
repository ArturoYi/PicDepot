import type { Ref } from 'vue'

/** 轻量窗口宽度；避免直接依赖 @vueuse/core */
export function useWindowWidth() {
  const width = ref(import.meta.client ? window.innerWidth : 1024)

  if (import.meta.client) {
    const onResize = () => {
      width.value = window.innerWidth
    }
    onMounted(() => {
      onResize()
      window.addEventListener('resize', onResize, { passive: true })
    })
    onUnmounted(() => {
      window.removeEventListener('resize', onResize)
    })
  }

  return { width }
}

/** 轻量元素宽度 */
export function useElementWidth(target: Ref<HTMLElement | null | undefined>) {
  const width = ref(0)

  if (import.meta.client) {
    let observer: ResizeObserver | null = null

    const disconnect = () => {
      observer?.disconnect()
      observer = null
    }

    const observe = (el: HTMLElement | null | undefined) => {
      disconnect()
      if (!el) {
        width.value = 0
        return
      }
      width.value = el.clientWidth
      observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) width.value = entry.contentRect.width
      })
      observer.observe(el)
    }

    watch(target, el => observe(el), { immediate: true, flush: 'post' })
    onUnmounted(disconnect)
  }

  return { width }
}
