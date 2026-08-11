/// <reference path="../../worker-configuration.d.ts" />

/**
 * Cloudflare bindings + vars。
 * 生产配置来自 wrangler / Dashboard，不依赖仓库 `.env`。
 * Secrets（如 RESET_KEY、bootstrap 辅助账号）不写进 wrangler.toml 明文，故标为可选。
 */
export type CfImgBedEnv = Partial<Env> & {
  ASSETS?: Fetcher
  RESET_KEY?: string
  BOOTSTRAP_ADMIN_USER?: string
  BOOTSTRAP_ADMIN_PASS?: string
}
