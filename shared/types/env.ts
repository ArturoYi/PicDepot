/// <reference path="../../worker-configuration.d.ts" />

/** Cloudflare bindings + vars；secrets 不在 wrangler.toml 中，故单独标为可选 */
export type CfImgBedEnv = Partial<Env> & {
  ASSETS?: Fetcher
  RESET_KEY?: string
  BOOTSTRAP_ADMIN_USER?: string
  BOOTSTRAP_ADMIN_PASS?: string
}
