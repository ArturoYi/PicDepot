# 项目介绍

PicDepot 是一套**仅依赖 Cloudflare** 的自建图床 / 文件托管方案。

相对传统多渠道图床，本项目刻意做减法：去掉 Telegram、Discord、S3、WebDAV、Hugging Face、Docker 等外部存储与运行时，换取更低的运维成本与更清晰的代码路径。

## 技术栈

| 组件 | 用途 |
|------|------|
| **Nuxt 4 + Nuxt UI** | 全栈 UI（上传、登录、文件库、设置） |
| **Nitro `cloudflare_module`** | 编译为 Cloudflare Workers |
| **Workers + Assets** | API + 前端静态资源，一次 `wrangler deploy` |
| **D1** | 文件元数据、配置、会话、用户 |
| **R2** | 对象存储 + 公网直链（`r2.dev` 或自定义域名） |

## 架构示意

```
Browser / Client（Nuxt UI）
        │
        ▼
┌─────────────────────────────────┐
│  Nuxt 4（Nitro）→ Cloudflare    │
│  Workers + Assets               │
│  server/api/*  +  app/pages/*   │
└───────────────┬─────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   ┌─────────┐     ┌──────────┐
   │   D1    │     │    R2    │
   │ 元数据  │     │ 文件本体 │
   │ 配置    │     │ 公网直链 │
   │ 会话    │     └──────────┘
   └─────────┘
```

## 设计原则

1. **元数据与对象分离**：列表查 D1，文件读 R2 公网直链，不扫桶列对象。
2. **读放大可控**：看图流量尽量不经 Worker，降低免费档压力。
3. **安全默认**：上传与管理均需登录会话；密码与配置存 D1，不写死在代码里。
4. **上传边界清晰**：不分片，单文件 ≤ **20MB**。

## 当前能力

- 登录后拖拽 / 点击 / 粘贴上传，上传进度
- 多格式复制（直链 / Markdown / HTML / BBCode）
- 文件库：分页、搜索筛选、改名、改目录
- 批量删除、批量移动
- 目录联想、用量统计（文件数 / 空间 / 近 7 日）
- CORS（可选 `runtimeConfig.corsOrigins`，便于带 Cookie 的客户端）
- 管理员登录、首次初始化、用户管理

## 明确不做（一期）

- 非 Cloudflare 对象存储与 Bot 渠道
- 分块上传 / 超过 20MB
- Docker / 自建 Node 运行时
- 默认经 Worker 反代读图（公开文件走 R2 直链）

下一步可阅读 [快速开始](./getting-started) 或 [部署到 Cloudflare](./deploy)。
