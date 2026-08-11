# 目录与架构

## 仓库结构

```
app/pages/           # 上传 / 登录 / 管理后台页面
app/components/      # UI 组件（上传面板、复制菜单、文件库等）
app/composables/     # 会话、上传进度、偏好等
server/api/          # Nitro 路由（health、upload、auth、admin…）
server/utils/        # env 绑定、鉴权、设置、文件记录、CORS
shared/utils/        # 前后端共享（如链接格式）
shared/types/        # 环境类型
migrations/          # D1 SQL
wrangler.toml        # Workers / D1 / R2 绑定（本地与部署参考）
docs/                # VitePress 使用说明（本站）
```

## 请求路径

- **页面**：Nuxt 路由；`/admin/**` 关闭 SSR（见 `nuxt.config.ts` `routeRules`）。
- **API**：`server/api/**` → `/api/**`，禁用缓存。
- **文件读**：客户端拿到的是 R2 公网 URL，不经 Worker 反代。

## Cloudflare 绑定读取

`server/utils/env.ts` 统一封装：

- `getDb(event)` → `env.DB`
- `getBucket(event)` → `env.BUCKET`
- `getPublicBaseUrl(event)` → `R2_PUBLIC_BASE_URL` 或 runtimeConfig 回退
- `getMaxUploadBytes(event)` → `MAX_UPLOAD_BYTES` 或 runtimeConfig 回退

未绑定资源时抛出 503，便于本地未配置时快速发现问题。

## 鉴权分层

| 场景 | 机制 |
|------|------|
| 上传 / 目录联想 | 登录会话（`requireUploadAuth` → `requireUserSession`） |
| 管理 API | 管理员会话（`requireAdminSession`） |
| 页面 `/`、`/admin/**` | 前端 `auth` / `admin` middleware |
| 首次初始化 | `users` 为空时允许 bootstrap |

## 构建产物

`pnpm build` 使用 Nitro preset `cloudflare_module`，产物在 `.output/`。  
`pnpm deploy` 在 `.output` 目录执行 `wrangler deploy`。
