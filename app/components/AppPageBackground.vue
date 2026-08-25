<script setup lang="ts">
const {
  currentSrc,
  showImage
} = usePageBackground()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 -z-10 bg-zinc-100 transition-colors duration-300 dark:bg-zinc-900"
    aria-hidden="true"
  >
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
      :class="showImage ? 'opacity-100' : 'opacity-0'"
      :style="showImage && currentSrc ? { backgroundImage: `url('${currentSrc}')` } : undefined"
    />
    <!-- 轻微遮罩，保证上传块可读 -->
    <div class="absolute inset-0 bg-default/35 dark:bg-default/45" />
  </div>
</template>
