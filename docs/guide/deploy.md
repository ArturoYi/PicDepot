# 部署到 Cloudflare

生产目标是 **Cloudflare Workers + Assets**（Nitro preset：`cloudflare_module`）。

> **不要**把本项目当成 Cloudflare Pages（Pages Functions）来部署。  
> 仓库里的 GitHub Pages Action（`.github/workflows/docs.yml`）只发布**文档站**，与应用 Worker 无关。

本项目维护者当前使用的是 **方式 3：Cloudflare 控制台（Workers Builds / 连接 Git）**。下文三种方式均在文档中说明；仓库**不会**附带应用部署用的 GitHub Actions，需要 CI 时请自行添加。

---

## 部署方式对照

| 方式 | 名称 | 推荐度 | 适用场景 |
|------|------|--------|----------|
| **方式 1** | 本地 Wrangler CLI | **不推荐**（仅排障 / 临时） | 本机一次性发布、调试产物 |
| **方式 2** | GitHub Actions | 可选 | 希望用自建 CI 控制构建与密钥（需自行配置 workflow） |
| **方式 3** | Cloudflare 控制台（Workers Builds / 连接 Git） | **推荐（本项目实际使用）** | 在官网连接仓库，由 Cloudflare 自动构建并部署 Worker |

三种方式共用同一套前置条件；差别只在「谁来执行 `build` + 把 `.output` 发布到 Worker」。

---

## 部署前清单

以下步骤与选哪种部署方式无关，**必须先完成**。

### 1. 创建云资源

在 Cloudflare 账号中创建：

1. **D1 数据库**（示例名：`picdepot`）
2. **R2 存储桶**（示例名：`imgbed`），并开启公网访问（`r2.dev` Public Development URL 或自定义域名）
3. （可选）稍后给 Worker 绑定自定义域名

Dashboard 路径示例：

- D1：Workers & Pages → D1 → Create
- R2：R2 Object Storage → Create bucket → Settings → 开启公开访问

也可用 CLI（仅用于建资源，不等于采用方式 1 部署应用）：

```bash
wrangler login
wrangler d1 create picdepot
wrangler r2 bucket create imgbed
```

记下 D1 的 `database_id`。

### 2. 配置 `wrangler.toml`

```toml
name = "picdepot"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# 公网访问根地址，勿尾斜杠 —— 生产以本段 / Dashboard Variables 为准，不需要 .env
R2_PUBLIC_BASE_URL = "https://pub-xxxx.r2.dev"
MAX_UPLOAD_BYTES = "20971520"

[[d1_databases]]
binding = "DB"
database_name = "picdepot"
database_id = "<你的 database_id>"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "imgbed"
```

也可在 Worker 创建后，到 **Worker → Settings → Bindings / Variables** 配置同等绑定与变量。

### 3. 应用 D1 迁移

在任意一台已登录 Cloudflare 的机器上执行一次（或之后有新 migration 时再执行）：

```bash
pnpm db:migrate:remote
# 等价：wrangler d1 migrations apply picdepot --remote
```

> 方式 3（Workers Builds）默认**不会**替你跑迁移，请在首次上线前手动执行。

### 4. 关于 `.env`

| 场景 | 是否需要 `.env` |
|------|----------------|
| 本地 `pnpm dev` | 可选 |
| **方式 1 / 2 / 3 部署应用** | **不需要** |

生产配置来自 `wrangler.toml`、Dashboard Variables/Secrets，或你自建 CI 的 Secrets。  
**切勿**把 API Token 写进仓库或提交 `.env`。

---

## 方式 1：本地 Wrangler

本机构建后用 Wrangler 推到 Cloudflare。**不推荐**用于日常发布。

### 为何不推荐

- 依赖本机环境与登录态，难复现
- 易与生产配置混用  
适合：排障、对照 `.output`、CI/控制台不可用时的临时发布。

### 步骤

```bash
pnpm install
pnpm build          # 生成 .output（Workers + Assets）
pnpm deploy         # 等价：wrangler --cwd .output deploy
```

注意：必须先 `pnpm build`，**不要**在未构建的仓库根目录直接 `wrangler deploy`。

---

## 方式 2：GitHub Actions

可选方案；仓库**默认不包含**应用部署 workflow。若需要，可自行新增 `.github/workflows/deploy.yml`，核心步骤：

1. `pnpm install`
2. `pnpm build`
3. 在 **`.output`** 目录执行 `wrangler deploy`（可用 `cloudflare/wrangler-action`）

并在 GitHub Secrets 中配置 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。

这与文档站的 `docs.yml`（GitHub Pages）完全独立，不要混用。

---

## 方式 3：Cloudflare 控制台

在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 通过官方 **Workers Builds（连接 Git）** 自动构建并部署。**推荐**，也是本项目实际使用的方式。这是官网「连接仓库即可发布 Worker」路径，**不是**创建 Pages 项目。

### 步骤

1. 完成上文「部署前清单」，并把代码推到 GitHub / GitLab（Workers Builds 当前不支持自建 Git）。
2. 打开 Dashboard → **Workers & Pages**。
3. **新建 Worker 并连接仓库**，或打开已有 Worker → **Settings → Builds → Connect**：
   - 选择 PicDepot 仓库与分支（如 `main`）
4. 配置构建（字段名以控制台为准）：

| 配置项 | 建议值 |
|--------|--------|
| 包管理器 / 安装 | pnpm（或控制台检测到的包管理器） |
| **Build command** | `pnpm build` |
| **Deploy command** | `pnpm deploy` |

`pnpm deploy` 内部为 `wrangler --cwd .output deploy`，与方式 1 产物一致。

5. 保存并触发构建；在 Worker 的 **Deployments / Build history** 查看日志。
6. 在 **Settings → Bindings / Variables** 核对 `DB`、`BUCKET`、`R2_PUBLIC_BASE_URL` 等与清单一致。

### 注意

- 选择 **Workers** + Git 集成，**不要**建成 **Pages** 应用。
- 首次仍需手动执行 D1 迁移（清单第 3 步）。
- 官方说明：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

---

## 部署后初始化

1. 访问 Worker 域名（`*.workers.dev` 或自定义域）的 `/login`
2. 「首次初始化」创建管理员
3. 登录后上传，验证 R2 直链
4. （可选）在后台创建更多用户

健康检查：`GET /api/health`

---

## 错误做法

| 错误做法 | 正确做法 |
|----------|----------|
| 当成 **Cloudflare Pages** 部署 | 使用 **Workers + Assets**（方式 1/2/3） |
| 未 `build` 就在仓库根目录 `wrangler deploy` | 先 `pnpm build`，再对 **`.output`** 部署（或 `pnpm deploy`） |
| 生产依赖仓库里的 `.env` | 用 `wrangler.toml` / Dashboard Variables / CI Secrets |
| 未创建或不绑定 D1 / R2 就上线 | 先建库建桶并绑定 `DB` / `BUCKET` |
| 未跑 D1 migration | 首次上线前执行 `pnpm db:migrate:remote` |
| 把 `docs.yml`（GitHub Pages）当成应用部署 | 应用用方式 3（或自建方式 2） |
| 将 API Token 提交进 Git | 只用 Secrets / Dashboard，不进仓库 |

---

## 常见问题

| 现象 | 可能原因 |
|------|----------|
| 上传 / 后台 503 | 未绑定 `DB` 或 `BUCKET` |
| 直链 404 | `R2_PUBLIC_BASE_URL` 错误、桶未开公网、或对象写到错误环境 |
| 无法上传 / 401 | 未登录或会话过期 |
| Builds 失败：找不到 `.output` | Build 未成功，或 Deploy 命令不是 `pnpm deploy` |
| `db:migrate:*` 找不到数据库 | `database_name` 与 Cloudflare 上 D1 名称不一致 |
| 构建体积 / 超时 | 本仓库默认关闭 Nitro minify；一般远低于 Workers 限制 |
