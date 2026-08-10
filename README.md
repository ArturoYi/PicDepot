# PicDepot

![IMG20260808181351.heic](https://filebed.de5.net/files/2026/08/7bbcb631cf4061c8b5d9.heic)

基于架构方案与功能取舍文档：

- [docs/cloudflare-only-architecture.md](./docs/cloudflare-only-architecture.md)
- [docs/cf-imgbed-lite-features.md](./docs/cf-imgbed-lite-features.md)

初始化项目能力概要：

- **Nuxt 4 + Nuxt UI**
- **Cloudflare Workers**（Nitro `cloudflare_module`）
- **D1** 元数据 / 会话 / 配置
- **R2** 文件存储 + **公网直链**
- 单文件 ≤ **20MB**，未配置上传码禁止上传

当前为 **Phase 0 骨架 + P0/P1 核心能力**：删除、多格式复制、上传进度、列表分页与筛选、批量操作、统计、目录联想、粘贴上传、CORS（可选 `runtimeConfig.corsOrigins`）。需自行创建并绑定 D1/R2 后才能真正上传。

## 本地开发

```bash
npm install
npm run dev
```

健康检查：<http://localhost:3000/api/health>

本地模拟 Cloudflare 绑定依赖 `nitro-cloudflare-dev` + 根目录 `wrangler.toml`。未绑定 D1/R2 时，上传/后台接口会返回 503 提示。

**直链 404**：`R2_PUBLIC_BASE_URL` 指向云端 `pub-*.r2.dev` 时，本地 dev 若写入「模拟 R2」，对象不在公网桶里会 404。本仓库 `wrangler.toml` 已对 R2 设置 `remote = true`，需 `wrangler login` 后重启 dev，再重新上传。并确认 **Public Development URL 是在 `imgbed` 这个桶上开启的**。

## 配置 Cloudflare

1. 开通 R2（通常需绑卡）、创建 bucket，开启 `r2.dev` 或自定义域名公网访问  
2. 创建 D1，执行迁移：

```bash
wrangler d1 create imgbed
# 将 database_id 填入 wrangler.toml 并取消注释绑定
wrangler d1 migrations apply imgbed --remote
```

3. 填写 `wrangler.toml`：

- `[[d1_databases]]` / `[[r2_buckets]]`
- `R2_PUBLIC_BASE_URL`（无尾斜杠）

4. 部署（Nitro 产物在 `.output`）：

```bash
npm run build
npm run deploy
# 等价于：wrangler --cwd .output deploy
```

5. 打开 `/login` →「首次初始化」创建管理员 → 在「设置」中配置上传认证码。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 构建 Workers 产物 |
| `npm run deploy` | `wrangler deploy` |
| `npm run typecheck` | 类型检查 |

## 目录要点

```
app/pages/           # 上传 / 登录 / 文件库 / 设置
app/components/      # CopyLinkMenu 等多格式复制
app/composables/     # 上传进度、localStorage 偏好
server/api/          # health、upload、auth、admin、directories
server/utils/        # env、auth、password、settings、fileRecords、cors
shared/utils/        # linkFormats
migrations/          # D1 SQL
wrangler.toml        # Workers / D1 / R2 绑定
```

### 主要 API（需管理员会话除非注明）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传（authCode；支持 CORS） |
| GET | `/api/directories` | 目录联想（authCode） |
| GET | `/api/admin/files` | 列表分页、搜索筛选 |
| DELETE | `/api/admin/files/:id` | 删除 |
| PATCH | `/api/admin/files/:id` | 改文件名 / 目录 |
| POST | `/api/admin/files/batch-delete` | 批量删 |
| POST | `/api/admin/files/batch-move` | 批量改目录 |
| GET | `/api/admin/stats` | 文件数 / 空间 / 7 日上传 |
| GET | `/api/admin/directories` | 目录列表（管理端） |
