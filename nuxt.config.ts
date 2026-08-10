// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from 'nuxt/kit'
import type { AliasOptions } from 'vite'

const { resolve } = createResolver(import.meta.url)
const heicToStub = resolve('./app/stubs/heic-to.stub.ts')

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
    // terser 多进程在部分本地环境会提前退出；关闭后体积仍远低于 Workers 限额
    minify: false,
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

  vite: {
    optimizeDeps: {
      include: ['heic-to']
    }
  },

  hooks: {
    'vite:extendConfig'(config, { isServer }) {
      if (!isServer || !config.resolve) return
      const current = config.resolve.alias
      const nextAlias: AliasOptions = Array.isArray(current)
        ? [...current, { find: /^heic-to$/, replacement: heicToStub }]
        : { ...(current as Record<string, string> | undefined), 'heic-to': heicToStub }
      ;(config.resolve as { alias?: AliasOptions }).alias = nextAlias
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
