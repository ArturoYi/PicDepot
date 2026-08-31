/**
 * 禁止移动端浏览器把双指捏合当成整页缩放。
 * iOS Safari 会忽略 viewport 的 user-scalable=no，需拦截非标准 gesture 事件。
 */
export default defineNuxtPlugin(() => {
  const prevent = (event: Event) => {
    event.preventDefault()
  }

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
})
