<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  fit?: 'cover' | 'contain'
  eager?: boolean
}>(), {
  fit: 'cover',
  eager: false
})

const loaded = ref(false)
const failed = ref(false)
const imgEl = ref<HTMLImageElement | null>(null)

watch(() => props.src, () => {
  loaded.value = false
  failed.value = false
})

function markLoaded() {
  loaded.value = true
}

watch(imgEl, (el) => {
  if (el?.complete && el.naturalWidth > 0) markLoaded()
}, { flush: 'post' })
</script>

<template>
  <div class="relative size-full overflow-hidden bg-elevated">
    <USkeleton
      v-if="!loaded && !failed"
      class="absolute inset-0 size-full rounded-none"
    />
    <div
      v-if="failed"
      class="absolute inset-0 flex items-center justify-center text-muted"
    >
      <UIcon
        name="i-lucide-image-off"
        class="size-8"
      />
    </div>
    <img
      v-else
      ref="imgEl"
      :src="src"
      :alt="alt || ''"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="size-full transition-opacity duration-300"
      :class="[
        fit === 'contain' ? 'object-contain' : 'object-cover object-center',
        loaded ? 'opacity-100' : 'opacity-0'
      ]"
      draggable="false"
      @load="markLoaded"
      @error="failed = true"
    >
  </div>
</template>
