# Cloudflare 专用图床 / 文件托管 — 逻辑方案

> 目标：重新实现一套**仅依赖 Cloudflare 能力**的自建图床（含后台），去掉 Telegram / Discord / S3 / WebDAV / Hugging Face / Docker 等外部存储与运行时。  
> 参考对象：CloudFlare-ImgBed 的产品能力与数据分层经验，但架构刻意做减法。  
> **实现仓库**：[`cf-imgbed-lite/`](../)（Nuxt 4 + Nuxt UI，Phase 0 骨架已落地）。  
> **功能对照与优化取舍**：[`cf-imgbed-lite-features.md`](./cf-imgbed-lite-features.md)（相对 ImgBed 全量特性清单）。

---

## 1. 目标与边界

### 1.1 要做什么

| 能力 | 是否纳入一期 | 说明 |
|------|--------------|------|
| 文件上传 / 访问 / 删除 | 是 | 核心 |
| Web 管理后台 | 是 | 登录、列表、设置 |
| 用户上传认证码 | 是 | 可选开启 |
| API Token | 是 | upload / list / delete |
| 目录与标签 | 是（简化） | 目录一期必做；标签可二期 |
| 图片处理（缩放） | 可选 | Cloudflare Images / 变换绑定 |
| 公开画廊 | 可选 | 二期 |
| WebDAV | 否 | 一期不做 |
| 多存储渠道 / 负载均衡 | 否 | 仅 R2 |
| Docker / 自建 Node | 否 | 仅 Workers |

### 1.2 明确不做

- 非 Cloudflare 对象存储与 Bot 渠道
- KV 作为主元数据库（可用 D1 替代；KV 仅可选作边缘缓存）
- 复杂索引重建流水线（一期用 SQL 直接查即可）
- 内容审核第三方默认集成（可留扩展点）
- Cloudflare Pages 作为主部署目标（统一 Workers + Assets）

### 1.3 成功标准

1. 单账号 Cloudflare 即可跑通：上传 → 列表 → 外链访问 → 后台删除。  
2. 密码与配置不落代码，存在 D1。  
3. 读放大可控：列表走 D1；文件走 R2 公网直链 / CDN。  
4. 免费档可个人使用；有清晰的配额与缓存策略说明。

### 1.4 实现状态

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 骨架 | **已完成（代码）** | `picdepot`：Nuxt UI 页面、API 骨架、D1 migration、wrangler 配置 |
| Phase 1 MVP | 未开始 | 绑定真实 D1/R2 后打通上传闭环；补齐删除等 |
| Phase 2+ | 未开始 | Token、批量、统计等 |

---

## 2. 技术选型（Cloudflare Only）

```
Browser / Client（Nuxt UI）
      │
      ▼
┌─────────────────────────────────────┐
│  Nuxt 4（Nitro）→ Cloudflare        │
│  Workers + Assets                  │
│  server/api/*  +  app/pages/*       │
└───────────────┬─────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   ┌─────────┐     ┌──────────┐
   │   D1    │     │    R2    │
   │ 元数据  │     │ 文件本体 │
   │ 配置    │     │ 公网直链 │
   │ 会话    │     │          │
   └─────────┘     └──────────┘
```

| 组件 | 用途 | 备注 |
|------|------|------|
| **Nuxt 4 + Nuxt UI** | 全栈 UI | 上传、登录、文件库、设置 |
| **Nitro `cloudflare_module`** | 编译为 Workers | `nitro-cloudflare-dev` 本地模拟绑定 |
| **Workers + Assets** | API + 前端静态资源 | 单一 `wrangler deploy` |
| **R2** | 对象存储 + 公网直链 | binding：`BUCKET` |
| **D1** | 元数据、配置、会话、Token | binding：`DB`；SQL 在 `migrations/` |
| **Wrangler** | 本地/CI 部署与 D1 迁移 | 根目录 `wrangler.toml` |

**不推荐一期用 KV 存文件列表**：KV List 免费额度紧，且查询弱于 SQL。  
**不强制 NuxtHub**：直接 Wrangler 绑定，避免额外账号抽象。

---

## 3. 核心设计原则

1. **元数据与对象分离**  
   - D1：谁上传了什么、路径、大小、可见性、标签  
   - R2：`object_key` 对应的二进制  

2. **列表永不扫 R2**  
   - `ListObjects` 不用于业务列表；仅运维/对账脚本可用。  

3. **公开读可缓存，管理写不可缓存**  
   - `/f/{key}`：`public, max-age=...` + ETag  
   - `/api/admin/*`：`private, no-store`  

4. **密钥只存哈希**  
   - 管理员密码、上传码：PBKDF2（或同等）  
   - API Token：存 hash，明文只展示一次  

5. **公开文件优先 R2 公网直链**（已拍板）  
   - 上传成功后返回 `https://<r2-public-domain>/<object_key>`（或自定义域名）。  
   - Worker 仍负责上传、鉴权、元数据、后台；**读公开文件尽量不经过 Worker**，降低 Worker 请求与代理带宽。  
   - `private` / `blocked` 文件不放进可列举的公开前缀，或仅通过 Worker 受控读取（见 §6.3）。

---

## 4. 数据模型（D1）

### 4.1 表结构（建议）

```sql
-- 文件元数据
CREATE TABLE files (
  id TEXT PRIMARY KEY,              -- 对外文件 ID（短链或 UUID）
  object_key TEXT NOT NULL UNIQUE,  -- R2 key
  file_name TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  directory TEXT NOT NULL DEFAULT '',  -- 逻辑目录，如 'blog/2026'
  visibility TEXT NOT NULL DEFAULT 'public', -- public | private | blocked
  uploader_ip TEXT,
  created_at INTEGER NOT NULL,      -- unix ms
  updated_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]'            -- JSON 数组字符串，二期可用
);

CREATE INDEX idx_files_dir_created ON files(directory, created_at DESC);
CREATE INDEX idx_files_created ON files(created_at DESC);
CREATE INDEX idx_files_visibility ON files(visibility);

-- 系统配置（JSON 文档）
CREATE TABLE settings (
  key TEXT PRIMARY KEY,             -- 如 'security', 'site', 'upload'
  value TEXT NOT NULL,              -- JSON
  updated_at INTEGER NOT NULL
);

-- 会话
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- session id（cookie）
  type TEXT NOT NULL,               -- admin | user
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- API Token
CREATE TABLE api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  permissions TEXT NOT NULL,        -- JSON: ["upload","list","delete"]
  expires_at INTEGER,               -- null = 永不过期
  created_at INTEGER NOT NULL
);
```

### 4.2 R2 Key 约定

```
files/{yyyy}/{mm}/{id}.{ext}
# 或
files/{directory}/{id}.{ext}
```

- `id`：对外稳定标识（建议 ULID / 短随机 ID）  
- 重命名「展示名」只改 D1 `file_name`，**不改** `object_key`（避免搬对象）  
- 「移动目录」只改 D1 `directory`

### 4.3 配置文档（`settings`）

| key | 内容 |
|-----|------|
| `security` | 管理员用户名/密码哈希、上传 authCode 哈希、防盗链域名、会话策略 |
| `site` | 站点名、Logo、页脚 |
| `upload` | 允许扩展名、单文件大小上限、默认目录规则 |

首次部署：无管理员密码时，可用「初始化向导」或环境变量 `BOOTSTRAP_ADMIN_USER` / `BOOTSTRAP_ADMIN_PASS` 写入后删除。

---

## 5. 身份与权限

### 5.1 角色

| 角色 | 凭证 | 能力 |
|------|------|------|
| 匿名 | 无 | 读 `visibility=public` 的文件（若开启防盗链则校验 Referer） |
| 上传用户 | authCode 或 user session | 上传（及可选删自己的，一期可省略） |
| API 客户端 | Bearer Token | 按 permissions |
| 管理员 | admin session | 全部管理接口 |

### 5.2 认证流

```
管理员登录
  POST /api/auth/admin/login {username, password}
  → 校验 D1 settings.security
  → 写 sessions + Set-Cookie (HttpOnly, Secure, SameSite=Lax)

上传鉴权（任一）
  - Header: Authorization: Bearer <token>
  - Header/Query/Cookie: authCode
  - Cookie: user_session

管理接口
  - 仅 admin_session 或 Token(manage)
```

### 5.3 密码存放（回答你之前的问题，新项目沿用并简化）

- **位置**：D1 `settings` 表，`key = 'security'` 的 JSON 内  
- **形态**：`$pbkdf2$salt$hash`，禁止明文回传前端  
- **重置**：环境变量 `RESET_KEY` + `POST /api/auth/reset` 清空 admin/user 凭证

---

## 6. 核心业务流程

### 6.1 上传（小文件，单请求）

```
Client multipart/form-data
  → Worker 鉴权
  → 校验类型/大小/IP（可选）
  → 生成 id + object_key
  → R2.put(object_key, body, { httpMetadata: { contentType } })
  → D1 INSERT files
  → 返回 { id, url, fileName, size }
```

**失败补偿**：若 D1 写入失败，异步或同步 `R2.delete(object_key)`，避免孤儿对象。

### 6.2 上传（大文件，分片）

Workers 请求体有限制，建议：

```
1) POST /api/upload/init
     → 创建 multipart upload（R2 createMultipartUpload）
     → 在 D1 临时表或 settings 记 uploadId（或仅客户端持有 uploadId + key）

2) PUT /api/upload/part  (partNumber, uploadId, body)
     → R2 uploadPart

3) POST /api/upload/complete
     → R2 complete
     → D1 INSERT files
```

一期：**不做分片**，单文件上限 **20MB**（Worker 请求体与产品策略双重限制）。

### 6.3 文件访问方式（读路径选型）

公网直链之外，常见还有这些办法：

| 方式 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **A. R2 公网直链**（已选） | R2 桶开启公开访问 + 自定义域名 | 不经 Worker；CDN 友好；实现简单 | 难做精细防盗链/逐文件 ACL；删库后直链可能仍可访问直至对象删掉 |
| **B. Worker 反代** | `GET /f/:id` → D1 → `R2.get` | 可鉴权、防盗链、blocked、统计、统一缓存头 | 每次未命中缓存都耗 Worker + 可能耗 R2 Class B |
| **C. 短时预签名 URL** | Worker 签发有限期 GET URL | 适合 private 文件临时分享 | 公开图床体验差（链接会过期）；实现稍复杂 |
| **D. 混合** | public → 直链；private → Worker/预签名 | 兼顾性能与权限 | 两套 URL 规则，前后端要分支 |

**一期采用 A（公网直链）为主，B 作补充：**

```
上传 public 文件
  → R2.put(object_key, …)
  → D1 INSERT（保存 public_url）
  → 返回 public_url 给客户端复制

公开访问
  → 浏览器直接请求 R2 自定义域名（不经过 Worker）

需要受控访问时（后台预览 private、blocked 校验等）
  → 仍可提供 GET /f/:id 走 Worker 反代（可选，管理端用）
```

**直链下的约束（必须遵守）：**

1. `object_key` 不可猜测：使用足够长的随机 id（勿用递增序号）。  
2. 删除 = **先删 R2 再删 D1**（或事务补偿），避免「库无记录但直链仍在」。  
3. `visibility` 变更：从 public→private 时，需从公开可读策略中移除（删对象并重传私有前缀，或一期仅支持上传时选定、不支持改可见性）。  
4. 防盗链：R2 自定义域名侧能力有限；强防盗链需求应改走 Worker 反代（B）或后续加 WAF/规则。  
5. 返回给用户的外链以 **R2 公网 URL** 为准，而不是 Worker 域名（除非做 302 跳转兼容层）。

URL 形态建议：

- 对外：`https://img.example.com/files/{yyyy}/{mm}/{id}.{ext}`  
- 可选兼容：`https://app.example.com/f/{id}` → **302** 到公网直链（方便旧习惯，非必须）

### 6.4 列表（后台）

```
GET /api/admin/files?dir=&q=&cursor=&limit=
  → 必须 admin
  → SQL：按 directory / created_at / LIKE file_name
  → 禁止 R2.list
```

分页用 `created_at + id` 游标，避免大 OFFSET。

### 6.5 删除

```
DELETE /api/admin/files/:id
  → D1 查 object_key
  → R2.delete
  → D1 DELETE
  → purge Cache（按 URL）
```

批量删除：并发有上限（如 10），返回逐项结果。

### 6.6 管理配置

```
GET/PUT /api/admin/settings/security
GET/PUT /api/admin/settings/site
```

GET 时 mask 密码字段；PUT 时空字符串表示「不修改」。

---

## 7. API 草案（一期）

### 公开 / 半公开

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/f/:id` | （可选）Worker 反代 / 302 到直链；管理预览用 |
| POST | `/api/upload` | 上传（需 authCode 或 Token；未配置则拒绝） |
| GET | `/api/auth/session` | 会话状态 |
| POST | `/api/auth/admin/login` | 管理员登录 |
| POST | `/api/auth/logout` | 登出 |

### 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/files` | 列表/搜索 |
| PATCH | `/api/admin/files/:id` | 改名、目录、可见性 |
| DELETE | `/api/admin/files/:id` | 删除 |
| POST | `/api/admin/files/batch-delete` | 批量删 |
| GET/PUT | `/api/admin/settings/*` | 配置 |
| GET/POST/DELETE | `/api/admin/tokens` | API Token |
| GET | `/api/admin/stats` | 文件数、总容量（SUM size） |

---

## 8. 前端信息架构（后台）

一期 4 页即可：

1. **上传页**（`/`）：拖拽上传、认证码、复制链接（URL / Markdown / HTML）  
2. **登录页**（`/login`）  
3. **文件库**（`/admin/files`）：目录、搜索、多选删除、复制链接  
4. **设置**（`/admin/settings`）：账号密码、上传码、防盗链、站点名  

已选定：**Nuxt 4 + Nuxt UI**（全栈，页面在 `app/pages`，接口在 `server/api`）。不必沿用 ImgBed / Sanyue-ImgHub 前端仓库。

---

## 9. 缓存与额度策略（设计时就要定）

### 9.1 谁消耗什么

| 用户动作 | D1 | R2 |
|----------|----|----|
| 刷新后台列表 | 行读 | 无 |
| 上传 | 行写 | Class A（写） |
| 访客打开公开图（直链） | 0 | Class B（R2/CDN 侧；不经 Worker） |
| 刷新后台列表 | 行读 | 0 |
| 删文件 | 行写 | Delete（免费） |

公开直链模式下，**浏览量不再打满 Worker 请求额度**；主要盯 R2 存储与 Class B。

### 9.2 推荐缓存策略

- R2 对象 / 自定义域名：尽可能长缓存；内容不可变（id 级），可用 `Cache-Control: public, max-age=31536000, immutable`  
- 禁止覆盖同一 `object_key`；变更内容必须新 id  
- 管理 API：一律不缓存  
- 统计类：可短缓存 60s  

### 9.3 免费档心理预期（个人站）

- R2 存储 10GB、Class B 1e7/月：图床场景通常先撞存储  
- D1 主要服务后台与上传，压力更小  
- 瓶颈优先盯：**R2 容量**；Worker 请求主要来自上传与管理，而非看图

---

## 10. 安全清单

1. 所有写操作鉴权；管理员 Cookie `HttpOnly` + 可选 `Secure`  
2. 上传限制：MIME/扩展名白名单、最大体积、可选每日配额  
3. 防盗链：`allowed_domains`；空则仅同站或无限制（需产品决策）  
4. `visibility=blocked` 统一返回占位图或 403  
5. 路径穿越：`directory` 规范化，禁止 `..`  
6. CORS：仅开放需要的上传源  
7. `RESET_KEY` 用完即删  
8. 不在日志中打印密码、Token 明文  

---

## 11. 部署拓扑

### 推荐：Nuxt → 单一 Worker 项目

```
cf-imgbed-lite/
  wrangler.toml
    - main = .output/server/index.mjs   # nuxt build 产物
    - assets = .output/public
    - d1_databases.binding = DB
    - r2_buckets.binding = BUCKET
```

流程：

1. 创建 D1，执行 `migrations/`  
2. 创建 R2 bucket 并开启公网（`r2.dev` 或自定义域）  
3. 填写 `R2_PUBLIC_BASE_URL`  
4. `npm run build && npm run deploy`  
5. 访问 `/login` 首次初始化管理员，再配置上传码  
6. Worker / R2 分别绑自定义域名（如 `app.` / `img.`）  

### 与 ImgBed 的差异

| ImgBed | 本方案 |
|--------|--------|
| 多渠道存储 | 仅 R2 |
| Pages Functions / 手写 Worker 路由生成 | **Nuxt Nitro** 文件路由 `server/api` |
| 复杂 index 分片 | D1 SQL |
| Docker/SQLite 双端 | 不做 |
| 独立前端仓库 | **Nuxt UI 同仓全栈** |

---

## 12. 分阶段交付

### Phase 0 — 骨架 ✅（代码已在 `cf-imgbed-lite`）

- Nuxt 4 + Nuxt UI 页面：上传 / 登录 / 文件库 / 设置  
- Nitro `cloudflare_module` + `wrangler.toml`  
- D1 `migrations/0001_init.sql`  
- API：`/api/health`、`/api/upload`、`/api/auth/*`、`/api/admin/*`  
- 本地：`npm run dev`（`nitro-cloudflare-dev`）  

### Phase 1 — MVP（核心）

- 在真实账号绑定 D1/R2，跑通上传 → 直链访问 → 列表  
- 删除文件（R2 + D1）  
- 完善会话 Secure / 错误提示  
- **未配置上传凭证 → 拒绝上传**（已实现）  

### Phase 2 — 可用产品

- API Token  
- 目录 / 重命名 / 批量删  
- 站点设置、简单统计  
- 可选：`/f/:id` 302 到直链  

### Phase 3 — 增强（按需）

- private 文件（Worker 反代或预签名）  
- 图片变换、公开画廊  
- 标签、配额、IP 黑名单  
- 分片上传（若以后放开 20MB）  

---

## 13. 目录结构（实现仓库 `cf-imgbed-lite`）

```
cf-imgbed-lite/
├── app/
│   ├── app.vue                 # Nuxt UI 壳（Header / Footer）
│   ├── app.config.ts           # 主题色
│   ├── assets/css/main.css
│   └── pages/
│       ├── index.vue           # 上传
│       ├── login.vue           # 登录 / 首次 bootstrap
│       └── admin/
│           ├── files.vue       # 文件库
│           └── settings.vue    # 安全设置
├── server/
│   ├── api/
│   │   ├── health.get.ts
│   │   ├── upload.post.ts
│   │   ├── auth/...
│   │   └── admin/...
│   └── utils/                  # env / auth / password / settings / id
├── migrations/
│   └── 0001_init.sql
├── shared/types/env.ts
├── wrangler.toml
├── nuxt.config.ts
└── README.md

docs/
└── cloudflare-only-architecture.md   # 本方案副本（与上级 docs/ 同步）
```


---

## 14. 关键决策（已拍板）

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 运行时 | **Workers + Assets**（Nuxt Nitro 部署） |
| 2 | 未配置上传码时是否允许匿名上传 | **否**（必须 authCode 或 API Token） |
| 3 | 文件 URL 内容是否不可变 | **是**（改内容用新 id；禁止覆盖同 key） |
| 4 | 文件如何对外提供 | **R2 公网直链**（自定义域名）；Worker 反代仅作可选补充 |
| 5 | 分片上传 | **否**；单文件最大 **20MB** |
| 6 | 前端 / 全栈框架 | **Nuxt 4 + Nuxt UI** |

关于第 4 点补充：直链之外可选 Worker 反代、预签名 URL、或 public 直链 + private 反代的混合模式；详见 §6.3。当前一期锁定直链。

---

## 15. 前置条件与开通申请

本节说明跑通 **Workers + D1 + R2 公网直链** 前要准备什么、在 Cloudflare 控制台如何开通。官方入口：[Cloudflare Dashboard](https://dash.cloudflare.com/) · 文档：[Workers](https://developers.cloudflare.com/workers/) · [R2](https://developers.cloudflare.com/r2/) · [D1](https://developers.cloudflare.com/d1/) · [R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)。

### 15.1 你需要具备的前置条件

| 类别 | 要求 | 说明 |
|------|------|------|
| 账号 | Cloudflare 账号 | [注册](https://dash.cloudflare.com/sign-up)，邮箱验证即可 |
| 本地环境 | Node.js **≥ 18**（建议 22）、npm、Git | 用于 `nuxt` / `wrangler` 开发与部署 |
| 支付方式 | **开通 R2 通常需绑定银行卡/PayPal** | 免费额度内一般不产生费用；绑卡时可能出现约 **$5 预授权**（验证用，非月费，之后由银行解冻） |
| 域名（生产直链强烈建议） | 一个可解析的域名 | **加入同一 Cloudflare 账号**（完整接入或 Partial/CNAME 接入均可）后，才能给 R2 绑自定义域名 |
| 开发期可无域名 | 可用 `*.workers.dev` + R2 `*.r2.dev` | `r2.dev` 仅适合非生产；无 WAF/完整缓存能力 |

**不需要提前申请的东西：**

- 不必单独「工单申请」Workers / D1；登录后即可创建。  
- 不必先买 Workers Paid；免费档即可做个人图床（注意日限额）。  
- 不必申请 AWS 账号；R2 的 S3 API 兼容密钥仅在你要用外部 S3 工具时才需要，**Workers 绑定桶不需要 Access Key**。

### 15.2 推荐开通顺序（清单）

```
1. 注册 / 登录 Cloudflare
2. （可选但生产需要）添加站点域名到 Cloudflare，完成 NS 或 CNAME 接入
3. 开通 R2（绑支付方式 → Purchase / Enable R2）
4. 创建 R2 Bucket
5. 配置桶的公开访问（先 r2.dev 调试，再生产绑自定义域名）
6. 创建 D1 数据库并执行 migrations
7. 安装 Wrangler，用 API Token 登录
8. 创建 / 部署 Worker，绑定 D1 + R2
9. 给 Worker 绑自定义域名（与 R2 图片域名分开，如 app. / img.）
10. 写入 R2_PUBLIC_BASE_URL 等变量，完成后台初始化管理员
```

### 15.3 分步：账号与本机

1. 打开 [注册页](https://dash.cloudflare.com/sign-up)，注册并验证邮箱。  
2. 本机安装 Node.js，然后：

```bash
cd cf-imgbed-lite
npm install
npx wrangler login
# 浏览器授权后，本机可管理该账号下的 Workers / D1 / R2
npm run dev          # 本地 UI + API
```

3. （CI/无人值守）在 Dashboard → **My Profile → API Tokens** 创建 Token，权限至少包含：  
   - Account：Workers Scripts Edit  
   - Account：Workers R2 Storage Edit（或 Workers R2 Storage Write）  
   - Account：D1 Edit  
   - Account：Account Settings Read（部分操作需要）  
   - Zone：Workers Routes Edit / DNS Edit（若要用自定义域名自动化）

### 15.4 分步：开通 R2 并创建桶

1. Dashboard 左侧进入 **R2 Object Storage**。  
2. 首次使用按提示 **绑定支付方式并启用 R2**（即使只用免费 10GB）。  
3. **Create bucket**，例如名称 `imgbed`（全球唯一约束按控制台提示）。  
4. 区域/位置按控制台默认即可（与延迟相关，个人站通常不敏感）。

**Workers 写入方式：** 在 `wrangler.toml` 绑定 `bucket_name`，代码里 `env.BUCKET.put(...)`，**无需**再创建 R2 Access Key。

**仅当**你要用 rclone / S3 SDK 从本地直传时，才在 R2 → Manage R2 API Tokens 创建密钥。

### 15.5 分步：打开公网直链（本方案必做）

R2 桶**默认私有**。公开有两种互不强制绑定的方式：

#### A. 开发调试：`r2.dev`（可先做）

1. 进入该 Bucket → **Settings**。  
2. **Public Development URL** → Enable。  
3. 确认框输入 `allow`。  
4. 得到形如 `https://pub-xxxx.r2.dev` 的地址；对象 URL = `{该地址}/{object_key}`。  
5. 将 `R2_PUBLIC_BASE_URL` 设为该地址。

注意：官方定位为 **非生产**；无完整 WAF / 自定义缓存等能力。不要自己手写 CNAME 指到 `r2.dev`。

#### B. 生产推荐：自定义域名（已拍板方向）

前置：**域名必须先作为 Zone 加到「同一个」Cloudflare 账号**。

| 域名现状 | 怎么做 |
|----------|--------|
| 已由 Cloudflare 托管（改过 NS） | 直接进入下一步绑桶 |
| 域名在别家 DNS | 用 **Partial (CNAME) setup** 把域名/子域加进本账号，再绑 R2 |
| 还没有域名 | 先购买域名 → 加到 Cloudflare → 再绑 R2 |

绑定步骤：

1. Bucket → **Settings** → **Custom Domains** → **Add**。  
2. 填写子域，例如 `img.example.com`（建议与 Worker 站点域名分开）。  
3. 确认将写入的 DNS 记录 → **Connect Domain**。  
4. 状态从 Initializing → **Active**（几分钟，可刷新或 Retry）。  
5. `R2_PUBLIC_BASE_URL=https://img.example.com`。

生产直链对象示例：`https://img.example.com/files/2026/08/{id}.png`。

### 15.6 分步：创建 D1

Dashboard → **Workers & Pages** → **D1** → **Create database**，名称如 `imgbed`。

或 CLI：

```bash
wrangler d1 create imgbed
# 把输出的 database_id 填进 wrangler.toml
wrangler d1 migrations apply imgbed --remote
```

免费档注意：库数量、单库大小、每日行列读写有上限；个人图床通常足够。

### 15.7 分步：构建并部署 Nuxt Worker

1. 在 `cf-imgbed-lite/wrangler.toml` 取消注释并填写 D1 / R2 绑定与 `R2_PUBLIC_BASE_URL`。  
2. 应用迁移：`npm run db:migrate:remote`（数据库名以 toml 为准）。  
3. 构建并部署：

```bash
cd cf-imgbed-lite
npm run build
npm run deploy
```

4. 默认会得到 `https://picdepot.<subdomain>.workers.dev`。  
5. 生产：Worker → **Settings → Domains & Routes → Custom Domain**，例如 `app.example.com`（需 Zone 在同一账号）。  
   - **建议**：`app.` 跑 Nuxt（后台/API），`img.` 跑 R2 直链，职责分离。  
6. 打开 `/login` → 首次初始化管理员 → `/admin/settings` 设置上传认证码。

### 15.8 权限与安全相关申请（可选）

| 需求 | 是否必须 | 怎么做 |
|------|----------|--------|
| Workers 子域 `workers.dev` | 部署后默认有 | Account 下启用 workers.dev |
| 自定义域名 TLS | 绑 Custom Domain 后自动签证书 | 一般无需另申请 |
| WAF / 缓存规则（直链防护） | 可选 | 仅 **R2 自定义域名** 可用；`r2.dev` 无 |
| Cloudflare Access 保护后台 | 可选 | Zero Trust 另开；或依赖应用内管理员登录即可 |
| 超额保障 | 可选 | 升级 Workers Paid；R2 按量，可在 Billing 设通知 |

### 15.9 费用与套餐预期（开通前心里有数）

| 产品 | 免费档大致能力 | 超额 |
|------|----------------|------|
| Workers | 日请求有上限（免费档约 10 万级/天，以官网为准） | Paid 按量 |
| D1 | 存储约 5GB；日行列读/写有上限 | Paid 更宽 |
| R2 | 约 10GB 存储 + Class A/B 免费操作额度；**出站免费** | 按存储与操作计费 |
| 域名 | 加站免费；Registrar 购域另计 | — |

R2：**启用时常要绑卡**，不等于马上收费；控制台出现的 R2 订阅多为 **$0/mo + usage**。建议在 Billing 打开用量告警。

### 15.10 开通验收清单

完成以下即可认为前置就绪，可进入开发：

- [ ] `wrangler whoami` 能显示账号  
- [ ] R2 桶已创建，且 **Public（r2.dev 或自定义域）已 Allowed/Active**  
- [ ] 浏览器能打开一个测试对象 URL（可先手动上传一个小文件）  
- [ ] D1 已创建，`database_id` 已写入配置  
- [ ] Worker 已部署，健康检查接口可访问  
- [ ] `R2_PUBLIC_BASE_URL` 与真实公网前缀一致  
- [ ] （生产）`app.` 与 `img.` 域名均已 Active  

### 15.11 常见卡点

| 现象 | 原因 / 处理 |
|------|-------------|
| R2 菜单要付费信息 | 正常；绑支付方式后继续，留意是否仅 $5 预授权 |
| Custom Domain 一直 Initializing | 检查 Zone 是否在同一账号；DNS 冲突；点 Retry |
| 直链 401/404 | 未 Enable public / 未 Active；或 object_key 路径不一致 |
| Worker 读不到桶 | `wrangler.toml` binding 名与代码 `env.xxx` 不一致，或未 redeploy |
| 域名在别家无法绑 R2 | 先做 Cloudflare Partial CNAME 接入该主机名 |
| 中国访问 `workers.dev` / `r2.dev` 不稳定 | 换自己的自定义域名（仍走 Cloudflare）通常更好 |

---

## 16. 一句话架构摘要

> **Nuxt（Nuxt UI）编译到 Workers：负责上传鉴权与后台；D1 存元数据与账号；R2 存文件并用自定义域名公网直链分发；列表只查 D1；单文件 ≤20MB，无凭证禁止上传。**

---

## 附录 A — 对比：从 ImgBed「砍什么」

| 保留思路 | 删除/替换 |
|----------|-----------|
| 元数据与对象分离 | 多渠道抽象层 |
| 密码哈希进库 | KV 主存储、环境变量双轨过多 |
| 管理/用户双会话 | WebDAV、随机图生态、批量索引分片 |
| 上传鉴权 + Token | Docker 适配层 |
| 防盗链 / 黑白名单（可简化） | HuggingFace 分片协议等 |
| Nuxt 全栈 | 手写 Worker 路由生成器 + 独立前端仓库 |

## 附录 B — 最小环境绑定（`cf-imgbed-lite/wrangler.toml`）

```toml
name = "picdepot"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "imgbed"
database_id = "<id>"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "imgbed"

[vars]
R2_PUBLIC_BASE_URL = "https://img.example.com"
MAX_UPLOAD_BYTES = "20971520"   # 20MB
```

> `npm run build` 后由 Nitro 生成 `.output` 内的 `main` / `assets`；部署使用 `npm run deploy`（`wrangler --cwd .output deploy`）。

## 附录 C — 常用命令

```bash
cd cf-imgbed-lite
npm install
npm run dev                 # 本地
npm run db:migrate:remote   # 远端 D1 迁移
npm run build && npm run deploy
curl https://<worker>/api/health
```


