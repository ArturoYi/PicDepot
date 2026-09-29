// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { createResolver } from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)
const { version: appVersion } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string }
const heicToStub = resolve('./app/stubs/heic-to.stub.ts')
const utifStub = resolve('./app/stubs/utif.stub.ts')

type ViteAlias
  = | Record<string, string>
    | Array<{ find: string | RegExp, replacement: string }>

export default defineNuxtConfig({
  modules: ['nitro-cloudflare-dev', '@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    /**
     * 仅服务端。本地可用 `.env` 的 `NUXT_*` 覆盖；
     * Cloudflare 手动/生产部署不依赖 `.env`，以 wrangler.toml `[vars]` / Dashboard 为准。
     * 部署前仍需自行创建并绑定 D1（DB）与 R2（BUCKET）。
     */
    r2PublicBaseUrl: 'https://pub-76500580e79f4ca683b12ae9254508a1.r2.dev',
    maxUploadBytes: 20 * 1024 * 1024,
    /** 系统状态用量百分比的分母；0 表示不展示百分比。默认 10GB（R2 免费额度）。 */
    storageQuotaBytes: 10 * 1024 * 1024 * 1024,
    /** 逗号分隔；空则回显请求 Origin（便于 PicGo 等） */
    corsOrigins: '',
    public: {
      siteName: 'PicDepot',
      /** 来自 package.json version，顶栏展示 */
      appVersion,
      maxUploadMb: 20
    }
  },

  routeRules: {
    '/api/**': { cache: false },
    '/api/auth/**': { headers: { 'Cache-Control': 'private, no-store' } },
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
      include: ['heic-to', 'utif']
    }
  },

  hooks: {
    'vite:extendConfig'(config, { isServer }) {
      if (!isServer || !config.resolve) return
      const current = config.resolve.alias
      const nextAlias: ViteAlias = Array.isArray(current)
        ? [
            ...current,
            { find: /^heic-to$/, replacement: heicToStub },
            { find: /^utif$/, replacement: utifStub }
          ]
        : {
            ...(current as Record<string, string> | undefined),
            'heic-to': heicToStub,
            'utif': utifStub
          }
      ;(config.resolve as { alias?: ViteAlias }).alias = nextAlias
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
