# 二次开发概览

PicDepot 是 Nuxt 全栈单体仓库：页面在 `app/`，API 在 `server/api/`，共享类型与工具在 `shared/`，D1 迁移在 `migrations/`。

## 开发环境

```bash
pnpm install
pnpm dev
```

建议同时准备：

- `wrangler login` 后的 Cloudflare 账号（远程 D1/R2 联调）
- 根目录 `wrangler.toml` 中正确的 `database_id` / `bucket_name` / `R2_PUBLIC_BASE_URL`

## 改动建议流程

1. 先看 [目录与架构](./architecture)，确认改的是 UI、API 还是绑定层。
2. Schema 变更写新的 `migrations/00xx_*.sql`，再 `pnpm db:migrate:local` / `remote`。
3. 新增 API 时复用 `server/utils/*`（`getDb` / `getBucket` / 鉴权），避免直接碰 `event.context.cloudflare`。
4. `pnpm typecheck` 与 `pnpm lint` 通过后再提交。

## 本地文档预览

```bash
cd docs
pnpm install
pnpm dev
```

文档站点独立于主应用，通过 GitHub Actions 发布到 GitHub Pages。

## 贡献

欢迎 Issue / PR。请保持改动聚焦，避免无关重构；提交前说明动机与验证方式。许可为 MIT，详见仓库根目录 `LICENSE`。
