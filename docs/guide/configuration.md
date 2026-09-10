# 配置说明

配置分三层，优先级从高到低大致为：

1. **Cloudflare Worker 绑定 / vars / secrets**（生产真相来源）
2. **`wrangler.toml` 的 `[vars]` 与 `[[d1_databases]]` / `[[r2_buckets]]`**
3. **Nuxt `runtimeConfig` / 本地 `.env`**（本地开发回退）

## 需要手动创建的云资源

| 资源 | Binding 名 | 说明 |
|------|------------|------|
| D1 | `DB` | 元数据、用户、会话、设置 |
| R2 | `BUCKET` | 文件本体 |

没有这两项，应用能启动，但上传与管理 API 会 503。

## `wrangler.toml` 变量

| 变量 | 说明 |
|------|------|
| `R2_PUBLIC_BASE_URL` | R2 公网根 URL，无尾斜杠 |
| `MAX_UPLOAD_BYTES` | 单文件字节上限，默认 `20971520`（20MB） |
| `STORAGE_QUOTA_BYTES` | 存储配额（系统状态用量百分比）。默认 `10737418240`（10GB，R2 免费额度）；`0` 则不展示百分比 |

可选 Secrets / vars（见代码注释）：

| 变量 | 说明 |
|------|------|
| `BOOTSTRAP_ADMIN_USER` / `BOOTSTRAP_ADMIN_PASS` | 可用环境变量辅助首次管理员创建 |
| `RESET_KEY` | 预留运维能力（如有实现） |
| `CLOUDFLARE_API_TOKEN` | **仅本地/CI CLI**，不要写入生产 Worker vars，也不要提交进 Git |

## Nuxt `runtimeConfig`

见根目录 `nuxt.config.ts`：

| 键 | 说明 |
|----|------|
| `r2PublicBaseUrl` | 本地回退公网根地址 |
| `maxUploadBytes` | 本地回退大小上限 |
| `storageQuotaBytes` | 本地回退存储配额（默认 10GB） |
| `corsOrigins` | 逗号分隔；空则回显请求 Origin（便于 PicGo 等） |
| `public.siteName` | 站点名 |
| `public.maxUploadMb` | 前端展示用上限（MB） |

本地可用 `.env` 覆盖，例如：

```bash
# .env —— 仅本地开发，不会也不应提交到 Git
NUXT_R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
NUXT_MAX_UPLOAD_BYTES=20971520
```

### `.env` 与生产的关系

| 场景 | 是否需要 `.env` |
|------|----------------|
| `pnpm dev` 本地开发 | 可选，方便覆盖 runtimeConfig |
| Cloudflare 手动部署一次 | **不需要** |
| GitHub Actions 部署 Worker | 用 Secrets，不要用仓库里的 `.env` |

生产请始终以 Dashboard / `wrangler.toml` 为准。

# CORS

上传接口支持 CORS。`corsOrigins` 为空时回显请求的 `Origin`；生产建议收紧为明确白名单。带 Cookie 的跨域客户端还需正确处理 `credentials`。
