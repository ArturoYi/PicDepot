<script setup lang="ts">
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'zh-CN'
  }
})

const config = useRuntimeConfig()
const description = 'Cloudflare Workers + R2 + D1 轻量图床（Nuxt + Nuxt UI）'

useSeoMeta({
  title: config.public.siteName,
  description,
  ogTitle: config.public.siteName,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      color="var(--ui-primary)"
      error-color="var(--ui-error, #ef4444)"
      :height="3"
      :throttle="0"
      :duration="2000"
      :hide-delay="280"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
