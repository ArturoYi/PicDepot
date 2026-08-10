// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nitro-cloudflare-dev', '@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 仅服务端；生产以 Cloudflare vars / secrets 为准
    r2PublicBaseUrl: 'https://pub-76500580e79f4ca683b12ae9254508a1.r2.dev',
    maxUploadBytes: 20 * 1024 * 1024,
    /** 逗号分隔；空则回显请求 Origin（便于 PicGo 等） */
    corsOrigins: '',
    public: {
      siteName: 'PicDepot',
      maxUploadMb: 20
    }
  },

  routeRules: {
    '/api/**': { cache: false },
    '/admin/**': { ssr: false }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module',
    typescript: {
      tsConfig: {
        include: ['../worker-configuration.d.ts']
      }
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: true
    },
    serverBundle: {
      collections: ['lucide']
    }
  }
})
