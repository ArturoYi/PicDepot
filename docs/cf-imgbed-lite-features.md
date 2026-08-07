# PicDepot — 功能特性与优化取舍

> 对照 CloudFlare ImgBed 官方功能清单，说明新项目（`picdepot`）**保留 / 简化 / 砍掉 / 优化** 的决策。  
> 架构细节见 [cloudflare-only-architecture.md](./cloudflare-only-architecture.md)。

**已拍板约束（影响功能边界）：**

| 约束 | 结论 |
|------|------|
| 运行时 | 仅 Cloudflare Workers（Nuxt） |
| 存储 | 仅 R2 + D1 |
| 读文件 | R2 公网直链为主 |
| 上传 | 不分片，单文件 ≤ **20MB** |
| 匿名上传 | **禁止**（必须 authCode / Token） |

图例：✅ 一期做 · 🔶 二期/可选 · ❌ 不做 · 🔁 换实现方式

**实现追踪（相对上面图例，另加）：**

| 符号 | 含义 |
|------|------|
| ✔️ | 已在当前仓库落地（Phase 0 骨架起） |
| 🚧 | 计划内但未完成 / 仅部分能力 |
| ⚡ | **当前可直接落实**：Nuxt + D1/R2 栈已就绪，不依赖 Cloudflare Images、Worker 反代读等新绑定 |
| 🔒 | 需新产品、安全评审或架构决策后再做 |

> **代码快照基准**：README 所称 **Phase 0 骨架**（`server/api/upload`、`admin/files`、`auth/*`、`migrations/0001_init.sql`、`app/pages/*`）。部署绑定 D1/R2 后即可联调；下列「可立即落实」指在此基础上的开发项。

---

## 1. 总览：相对 ImgBed 的优化方向

1. **渠道归零**：去掉 TG / Discord / S3 / HF / WebDAV 及负载均衡、故障切换，换取代码量与运维复杂度断崖下降。  
2. **读路径外置**：公开文件走 R2 自定义域名，不再默认经 Worker 反代读图，降低 Worker 请求与代理带宽。  
3. **元数据用 SQL**：D1 直接查询替代 KV 列表 + 分片索引重建，后台列表更简单可控。  
4. **上传边界清晰**：20MB 硬顶 + 强制鉴权，避免「未配置也能传」的安全坑。  
5. **全栈一体**：Nuxt + Nuxt UI，前后端同仓；不做 Docker / Pages 双轨。  
6. **功能分层交付**：先闭环（传/列/删/登），再增强（Token、标签、统计、画廊）。

---

## 2. 核心功能对照

### 2.1 文件上传

| ImgBed 特性 | Lite | 说明 / 优化点 |
|-------------|------|----------------|
| 常见文件（图/音视频等） | ✅ | 扩展名/MIME 白名单可配置 |
| 拖拽 / 点击上传 | ✅ | Nuxt UI `UFileUpload` |
| 粘贴上传（文件 + URL） | 🔶 | 一期文件粘贴；URL 拉取二期 |
| 批量上传 | ✅ | 前端队列串行/有限并发即可 |
| 递归文件夹上传 | 🔶 | 二期；一期可用「目录字段」手动指定 |
| 实时进度 | ✅ | XHR/`fetch` + 进度事件（单请求 ≤20MB 足够） |
| 上传前压缩 / 转 WebP | 🔶 | 浏览器端可选；不做服务端转码 |
| 分块上传（TG/R2/S3/Discord） | ❌ | **已拍板不做**；超过 20MB 直接拒绝 |
| HF LFS | ❌ | 无 HF 渠道 |
| 失败切换渠道重试 | ❌ | 仅 R2；可做**同渠道有限次重试** |

**优化点：**

- 去掉分片与多渠道状态机，上传路径变为：`鉴权 → 校验大小 → R2.put → D1.insert → 返回直链`。  
- 进度实现简单，不必维护 chunk/merge/cleanup。  
- 「未配置上传码 → 403」默认安全，优于开放上传后靠用户自觉关。

### 2.2 存储渠道

| ImgBed 渠道 | Lite |
|-------------|------|
| Telegram | ❌ |
| Cloudflare R2 | ✅ **唯一** |
| S3 兼容 | ❌ |
| Discord | ❌ |
| Hugging Face | ❌ |
| WebDAV | ❌ |

| ImgBed 周边 | Lite | 说明 |
|-------------|------|------|
| 多渠道配置 / 切换 | ❌ | — |
| 负载均衡 | ❌ | — |
| 渠道容量阈值 | 🔶 | 可对「整站 R2 用量」做软阈值（SUM `size_bytes`） |
| 故障切换 | ❌ | 改为明确错误提示 + 有限重试 |

**优化点：** 配置面从「N 套渠道凭证」缩成「一个桶 + 一个公网域名」，开通与排错成本最低。

### 2.3 文件管理

| ImgBed 特性 | Lite | 说明 / 优化点 |
|-------------|------|----------------|
| 目录分类 | ✅ | D1 `directory` 字段；不物理搬 R2 key |
| 批量复制 / 下载 | ✅ / 🔶 | 复制链接一期；打包下载二期 |
| 批量移动 | ✅ | 只改 D1 目录 |
| 标签 / 批量标签 / 自动补全 | 🔶 | schema 已留 `tags`；UI 二期 |
| 黑白名单（文件级） | 🔶 | `visibility`：public / private / blocked |
| 搜索筛选（名/目录/标签/渠道/类型/状态） | ✅ 简化 | **去掉渠道维度**；其余 SQL WHERE |
| 详细信息（大小/时间/IP） | ✅ | |
| 卡片 + 列表 + 框选 | 🔶 | 一期列表；卡片/框选二期 |

**优化点：** 无「渠道」筛选与多后端删除逻辑；删除 = `R2.delete` + `D1.delete`，语义单一。

### 2.4 多样化复制

| 格式 | Lite |
|------|------|
| 原始链接（R2 直链） | ✅ |
| Markdown | ✅ |
| HTML | ✅ |
| BBCode | ✅ |

**优化点：** 复制内容固定为公网直链，不再在「Worker 域名 / 渠道原始 URL」间混淆。

### 2.5 智能功能

| ImgBed 特性 | Lite |
|-------------|------|
| 上传偏好记忆 | ✅ | localStorage（目录、认证码可选记住） |
| 一键复制 | ✅ |
| 失败重试（同文件） | ✅ | 前端重传即可 |
| 目录建议补全 | 🔶 | 基于 D1 distinct directory |

### 2.6 文件读取与图片处理

| ImgBed 特性 | Lite | 说明 / 优化点 |
|-------------|------|----------------|
| `/file/{path}` 统一反代读 | 🔁 | **公开文件默认直链**，不经 Worker |
| GET / HEAD / Range | 🔁 | 由 **R2 公网/CDN** 提供；Worker 反代仅可选 |
| `width`/`height`/`fit` 变换 | 🔶 | 可选接 Cloudflare Images；非 MVP |
| 管理员限制允许尺寸 | 🔶 | 随 Images 一起做 |

**优化点：**

- 看图流量与 Worker 请求解耦，免费档更耐刷。  
- 放弃「全渠道统一 `/file`」抽象，换取直链性能与简单性。  
- 若以后要防盗链：再对部分路径启用 Worker 反代或 WAF（自定义域名）。

---

## 3. 国际化

| ImgBed 特性 | Lite |
|-------------|------|
| 中英双语动态切换 | 🔶 | 一期中文；可用 `@nuxtjs/i18n` 二期 |
| 语言记忆 | 🔶 |
| Element Plus 语言包联动 | ❌ | 使用 **Nuxt UI**，无 Element Plus |

**优化点：** UI 库换成 Nuxt UI，减少与旧前端仓库的耦合。

---

## 4. 界面特性

| ImgBed 特性 | Lite |
|-------------|------|
| 响应式布局 | ✅ | Nuxt UI |
| 深色模式 | ✅ | `UColorModeButton`（骨架已有） |
| 玻璃质感 / 双列卡片 / 滑动翻页 | 🔶 | 按需，不追求 1:1 复刻 |
| 壁纸：纯色 / 单图 / 轮播 / Bing | 🔶 / 部分❌ | 纯色+单图即可；Bing 非必须 |
| 品牌：Logo / 站名 / 标题 / 图标 / 页脚 | ✅ 简化 | D1 `settings.site` |
| 自定义链接前缀 | 🔁 | 本质是 `R2_PUBLIC_BASE_URL`（或展示用 CDN 前缀） |

**优化点：** 后台先「能用、干净」，不在一期堆壁纸与动效。

---

## 5. 安全功能

### 5.1 身份认证

| ImgBed 特性 | Lite |
|-------------|------|
| PBKDF2 哈希 | ✅ | 已实现方向 |
| HttpOnly Cookie 会话 | ✅ | admin session；user session 可简化为 authCode |
| Cookie Secure / 会话时长可配 | 🔶 | Phase 1 补齐 |
| 管理员认证 | ✅ |
| 上传认证码 | ✅ | **未配置则禁止上传** |
| API Token + 过期删除 | 🔶→✅ Phase 2 | 权限：upload / delete / list / manage |
| 来源域名限制（防盗链） | 🔶 | 直链模式下能力有限；强需求改 Worker 反代或 WAF |
| 文件黑白名单 | 🔶 | `visibility` |
| 图片处理尺寸限制 | 🔶 | 随 Images |
| `RESET_KEY` 重置认证 | ✅ | 环境变量方案保留 |

### 5.2 内容安全

| ImgBed 特性 | Lite |
|-------------|------|
| 第三方图片审查 | ❌ 默认 | 可留扩展钩子，不内置 Key |
| 上传 IP 记录 | ✅ | 已有字段 |
| IP 黑白名单 | 🔶 |
| IP 归属地自定义 API | 🔶 / ❌ 低优 |
| 白名单模式（仅白名单可访问） | 🔶 | 与 `visibility` 结合；直链下需谨慎设计 |

**优化点：** 安全默认「关上传直到配码」；审查/归属地不进核心路径，避免强依赖第三方。

---

## 6. 管理功能

### 6.1 文件管理

| ImgBed 特性 | Lite |
|-------------|------|
| 图库浏览（列表） | ✅ |
| 卡片视图 / 框选 | 🔶 |
| 分页 / 游标 | ✅ | 避免大 OFFSET |
| 并发批量删除 | ✅ | 有限并发 + 逐项结果 |
| 目录树移动 | 🔶 | 一期下拉/输入目录即可 |
| 标签 | 🔶 |
| 元数据编辑（名/类型） | ✅ | **不支持改 File ID / 覆盖同 key**（内容不可变） |
| 备份恢复 | 🔶 | 导出 D1 JSON；R2 用官方工具 |
| 索引重建 | ❌ | 无分片索引；SQL 即真相 |
| 公开画廊（指定目录） | 🔶 |

**优化点：** 删除「索引重建」整类运维负担；备份聚焦元数据，对象层交给 R2 生命周期/同步工具。

### 6.2 用户管理

| ImgBed 特性 | Lite |
|-------------|------|
| 上传统计 | 🔶 | 简单 COUNT 即可 |
| IP 追踪 | ✅ 基础 | 记录 IP；地图/归属地低优 |
| 多用户权限体系 | ❌ 简化 | 管理员 + 上传码/Token，不做完整多租户 |

### 6.3 系统状态

| ImgBed 特性 | Lite |
|-------------|------|
| 文件数 / 占用空间 | ✅ | `COUNT` / `SUM(size_bytes)` |
| 渠道分布 / 按渠道趋势 | ❌ | 无多渠道 |
| 按日期上传趋势 | 🔶 |
| R2/S3/WebDAV 分渠道配额 | 🔁 | 改为**整站容量软上限**（可选） |

### 6.4 系统设置

| ImgBed 特性 | Lite |
|-------------|------|
| 渠道管理 / 负载均衡 | ❌ |
| CDN 缓存 purge | 🔶 | 直链 + immutable 后较少需要；删文件时可按需 |
| 公告 | 🔶 |
| 默认上传渠道 / 命名 / 压缩 | 🔁 | 无渠道；保留默认目录、是否记住认证码等 |
| 图片处理开关 | 🔶 |

---

## 7. API 与集成

| ImgBed 特性 | Lite |
|-------------|------|
| 上传 / 列表 / 删除 / 批量删 | ✅ |
| 随机图 API | 🔶 / ❌ 低优 |
| Token 管理 API | ✅ Phase 2 |
| `/file` 二进制 + Range + 变换 | 🔁 | 公开读走直链；受控读可选 Worker |
| WebDAV | ❌ | 明确不做（架构已定） |
| PicGo | 🔶 | 提供兼容上传字段即可对接 |
| CORS | ✅ | 上传 API 按需开放 |

**优化点：** API 面围绕「直链 URL」设计响应，客户端不必再拼 `/file/`。

---

## 8. 部署与运维

| ImgBed 特性 | Lite |
|-------------|------|
| Cloudflare Pages | ❌ 主路径 | 统一 Workers |
| Cloudflare Workers | ✅ | Nuxt Nitro |
| GitHub Actions | 🔶 | 可后加 |
| Cloudflare Images | 🔶 |
| Docker / SQLite | ❌ |
| 全球 CDN | ✅ | R2 自定义域名 + CF |
| Worker 缓存公开响应 | 🔁 | 直链侧 Cache-Control；Worker 少读文件 |
| 管理端预览优化 | 🔶 | 列表为主时压力小 |
| 多渠道故障切换 | ❌ |
| 大文件分块 | ❌ | 20MB 封顶 |

**优化点：** 部署矩阵从 3 套缩成 1 套；运维心智 =「绑 D1 + 绑 R2 + 设公网域名」。

---

## 9. 建议交付切片（与功能对齐）

### Phase 1 — MVP（必做）

| 交付项 | 计划 | 现状 | 备注 |
|--------|------|------|------|
| 拖拽/选择上传、≤20MB、强制 authCode | ✅ | ✔️ | `UFileUpload` + `requireUploadAuth`；未配码 403 |
| 上传实时进度 | ✅ | ✔️ | XHR + `UProgress` |
| R2 直链返回 | ✅ | ✔️ | `upload.post` 返回 `url` |
| Markdown / HTML / BBCode 复制 | ✅ | ✔️ | `CopyLinkMenu` + `shared/utils/linkFormats` |
| 管理员登录 / bootstrap / 安全设置 | ✅ | ✔️ | PBKDF2 + D1 `settings.security` + session |
| 文件列表、基础目录字段 | ✅ | ✔️ | `admin/files`；分页 + 筛选 |
| 文件删除 | ✅ | ✔️ | `DELETE /api/admin/files/:id` + 批量删 |
| 深色模式、响应式基础壳 | ✅ | ✔️ | `UColorModeButton` + Nuxt UI 布局 |

**Phase 1 收口**：优先补 **删除**、**多格式复制**、**上传进度** 三项即可对外称 MVP。

### Phase 2 — 好产品

| 交付项 | 计划 | 现状 | 可立即落实 |
|--------|------|------|------------|
| 批量上传队列 | Phase 2 | ✔️ | 多选 + 串行队列 |
| 批量删除 | Phase 2 | ✔️ | `batch-delete` + 勾选 |
| API Token 与权限 | Phase 2 | 🚧 | ⚡ D1 已有 `api_tokens`；鉴权文案已预留，缺 CRUD + `requireUploadAuth` 分支 |
| 搜索筛选 | Phase 2 | ✔️ | `q` / `dir` / MIME 前缀 |
| 站点品牌设置 | Phase 2 | 🚧 | ⚡ `settings` 表通用 KV；现仅 `security`，可加 `site` JSON |
| 存储统计 | Phase 2 | ✔️ | `/api/admin/stats` |
| 上传偏好记忆 | Phase 2 | ✔️ | `useUploadPreferences` localStorage |
| 目录补全 | Phase 2 | ✔️ | `/api/directories` + `UInputMenu` |

### Phase 3 — 增强（按需）

| 交付项 | 说明 | 现状 |
|--------|------|------|
| 标签、卡片视图、公开画廊 | 🔶 | schema 有 `tags`；无 UI/API |
| 粘贴 URL 转存 | 🔶 | 🔒 SSRF / 超时 / 体积需服务端策略 |
| 粘贴板上传文件 | 🔶 | ✔️ 上传页 `paste`（不含 URL 拉取） |
| 浏览器端压缩 WebP | 🔶 | 未做 |
| Cloudflare Images、IP 黑名单、公告 | 🔶 | 🔒 Images / 运营向 |
| i18n 中英 | 🔶 | 🔒 非阻塞 |
| private 文件（Worker 反代） | 🔶 | 🔒 与「直链为主」冲突，需单独设计 |
| PicGo 对接 | 🔶 | ⚡ 文档 + 现有 header `authCode` 已基本兼容 |

### 明确不做（相对 ImgBed）

- 多存储渠道与负载均衡 / 故障切换  
- 分块上传与 HF LFS  
- WebDAV  
- Docker 自托管  
- KV 主库 + 分片索引重建  
- 默认内置内容审核与 Bing 壁纸生态  

---

## 10. 当前可立即落实清单（开发 backlog）

按 **依赖从少到多** 排序；同一档内可并行。

### P0 — 补全 Phase 1 MVP（建议先做）

1. **删除文件**：`R2.delete(object_key)` + D1 删行；管理端单条删除 + 确认框。  
2. **多格式复制**：直链 / Markdown `![](url)` / HTML `<img>` / BBCode `[img]`（上传结果页 + 文件库）。  
3. **上传进度**：对 ≤20MB 单请求用 `XMLHttpRequest` 或带 `onUploadProgress` 的客户端，绑定 `UProgress`。  
4. **列表分页**：API 增加 `cursor`（`created_at` + `id`）或 `offset`；前端 `UPagination`（现默认 `limit=50` 无 UI）。

### P1 — Phase 2 低成本项（栈已具备）

5. **搜索筛选**：文件名 `LIKE`、目录、MIME 前缀、`visibility`；去掉文档中的「渠道」维度即可。  
6. **仪表盘统计**：文件总数、总字节、可选近 7 日上传数（`created_at` 范围 COUNT）。  
7. **批量上传**：前端队列（串行或并发 2～3），失败可重试同文件。  
8. **批量删除 / 批量改目录**：勾选 + 有限并发；移动仅 `UPDATE files SET directory`。  
9. **元数据编辑**：改 `file_name`、目录（不改 `object_key` / id）。  
10. **上传偏好 localStorage**：默认目录、是否记住 authCode（安全提示默认不记住）。  
11. **目录 distinct API**：供上传页与管理端输入联想。  
12. **站点品牌**：D1 `settings.site`（站名、标题、页脚）→ 对接 `runtimeConfig` / `app.vue`（现 `siteName` 多为 env）。  
13. **会话 Cookie**：Secure / `maxAge` 可配置（Phase 1 文档 🔶 项，改动面小）。  
14. **CORS**：上传/列表 API 按域名白名单 `appendCorsHeaders`（PicGo / 第三方页面用）。

### P2 — 表已留、工作量中等

15. **API Token**：`api_tokens` 管理 UI + 上传/删/列权限位；`requireUploadAuth` 校验 token 哈希。  
16. **粘贴板上传文件**：`paste` 事件 + 与现有 `onSelect` 复用（不含 URL 拉取）。  
17. **容量软阈值**：配置项 + 上传前 `SUM(size_bytes)` 校验（文档 🔶 渠道阈值换实现）。  
18. **导出 D1 元数据 JSON**：备份恢复的一半（R2 仍用官方工具）。

### 🔒 不建议「现在直接开干」（除非产品改方向）

- **URL 粘贴转存**、**private + Worker `/file` 反代**、**Cloudflare Images 变换**  
- **标签 UI、卡片视图、公开画廊、i18n、IP 归属地、内容审核**  
- **GitHub Actions 部署**（运维项，与功能栈无关）

### 已实现能力索引（便于对照 §2～§7）

| 能力 | 位置 |
|------|------|
| 上传闭环 | `server/api/upload.post.ts` |
| 上传鉴权 | `server/utils/auth.ts` → `requireUploadAuth` |
| 管理会话 | `server/api/auth/*`、`requireAdminSession` |
| 安全设置 | `server/api/admin/settings/security.*` |
| 文件列表 | `server/api/admin/files.get.ts`、`app/pages/admin/files.vue` |
| D1  schema | `migrations/0001_init.sql`（含 `api_tokens` 预留） |
| 壳与深色模式 | `app/app.vue` |

---

## 11. 一句话产品定义

> **PicDepot = 强制鉴权的 Cloudflare 专用图床：Nuxt 管上传与后台，D1 管元数据，R2 公网直链管分发；用砍掉多渠道与分片，换取简单、可预期、额度友好。**
