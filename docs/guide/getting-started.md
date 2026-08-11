# 快速开始

本地开发依赖 Node.js 22+ 与包管理器（推荐 pnpm，也可用 npm）。

## 安装与启动

```bash
pnpm install   # 或 npm install
pnpm dev       # 或 npm run dev
```

健康检查：<http://localhost:3000/api/health>

本地模拟 Cloudflare 绑定依赖 `nitro-cloudflare-dev` + 根目录 [`wrangler.toml`](https://github.com/ArturoYi/PicDepot/blob/main/wrangler.toml)。**未绑定 D1 / R2 时**，上传与后台接口会返回 503。

## 本地绑定 D1 / R2

1. 在 Cloudflare Dashboard 创建 D1 数据库与 R2 存储桶（或用 CLI）：

```bash
wrangler d1 create picdepot
wrangler r2 bucket create imgbed
```

2. 将 `database_id`、`bucket_name` 写入根目录 `wrangler.toml`。
3. 应用迁移：

```bash
pnpm db:migrate:local    # 本地模拟库
# 或
pnpm db:migrate:remote   # 远程 D1
```

4. 配置 `R2_PUBLIC_BASE_URL`（无尾斜杠），并在 R2 桶上开启 Public Development URL 或自定义域名。

### 关于 `.env`

`.env` **仅用于本地 Nuxt 开发**（例如覆盖 `NUXT_R2_PUBLIC_BASE_URL`）。  
**部署到 Cloudflare 时不需要 `.env`**——生产配置写在 `wrangler.toml` / Dashboard。本项目推荐用控制台 Workers Builds（方式 3），详见 [配置说明](./configuration) 与 [部署指南](./deploy)。

## 直链 404 排查

若 `R2_PUBLIC_BASE_URL` 指向云端 `pub-*.r2.dev`，而本地 `npm run dev` 写入的是「模拟 R2」，对象不在公网桶里会 404。

本仓库 `wrangler.toml` 可对 R2 设置 `remote = true`，需 `wrangler login` 后重启 dev，并确认 **Public URL 开在正确的桶上**。

## 首次初始化

1. 打开 `/login` →「首次初始化」创建管理员账号。
2. 登录后即可在首页上传；管理员可进入 `/admin` 管理文件与用户。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm build` | 构建 Workers 产物（`.output`） |
| `pnpm deploy` | `wrangler --cwd .output deploy` |
| `pnpm db:migrate:local` | 应用 D1 迁移（本地） |
| `pnpm db:migrate:remote` | 应用 D1 迁移（远程） |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | ESLint |
