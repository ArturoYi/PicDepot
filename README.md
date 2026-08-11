<p align="center">
  <img src="./public/logo.svg" width="96" height="96" alt="PicDepot logo" />
</p>

<h1 align="center">PicDepot</h1>

<p align="center">
  仅依赖 Cloudflare 的自建图床 / 文件托管<br/>
  Nuxt 4 · Workers · D1 · R2
</p>

<p align="center">
  <a href="https://arturoyi.github.io/PicDepot/">使用文档</a>
  ·
  <a href="https://arturoyi.github.io/PicDepot/en/">Docs (EN)</a>
  ·
  <a href="https://github.com/ArturoYi/PicDepot">GitHub</a>
</p>

---

## 这是什么

PicDepot 把上传、管理后台与公网直链收拢到 **Cloudflare Workers + Assets**：元数据在 **D1**，文件在 **R2**，读文件走公网直链，不经 Worker 反代。

- 登录后上传（拖拽 / 粘贴），单文件 ≤ **20MB**
- 文件库：筛选、改名、改目录、批量删除 / 移动
- 多格式复制链接、目录联想、用量统计
- 首次初始化管理员；后台可管理用户

完整说明（部署、配置、二开、API）：**[文档站点](https://arturoyi.github.io/PicDepot/)**（中文默认，英文 `/en/`）。

## 快速开始

```bash
pnpm install   # 或 npm install
pnpm dev
```

健康检查：<http://localhost:3000/api/health>

本地依赖根目录 `wrangler.toml` 绑定 D1 / R2（可 `remote = true`）。未绑定时空接口会返回 503。

### Cloudflare 部署要点

1. **不需要 `.env`**——生产用 `wrangler.toml` / Dashboard Variables。
2. **必须先创建** D1 与 R2，开启公网访问，并执行 `pnpm db:migrate:remote`。
3. 部署方式见文档（本项目实际使用 **方式 3：Cloudflare 控制台 Workers Builds**）：
   - 方式 1：本地 Wrangler（不推荐）
   - 方式 2：自建 GitHub Actions（可选）
   - 方式 3：Cloudflare 官网连接 Git 部署 Worker（推荐）

详情：[部署到 Cloudflare](https://arturoyi.github.io/PicDepot/guide/deploy)。
## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm build` | 构建 Workers 产物 |
| `pnpm deploy` | 部署到 Cloudflare |
| `pnpm docs:dev` | 预览 VitePress 文档 |
| `pnpm docs:build` | 构建文档（GitHub Pages 同源） |

## 目录要点

```
app/          # 页面与组件
server/       # API 与 Cloudflare 绑定封装
shared/       # 共享类型 / 工具
migrations/   # D1 SQL
docs/         # VitePress 使用说明（中 / 英）
wrangler.toml # Workers / D1 / R2
```

## 贡献

欢迎 Issue 与 Pull Request。请：

1. 保持改动聚焦，附上动机与验证方式
2. 涉及 Schema 时补充 `migrations/`
3. 文档变更放在 `docs/`（中英尽量同步）
4. 提交前运行 `pnpm lint` / `pnpm typecheck`

本地预览文档：

```bash
pnpm docs:dev
```

文档通过 GitHub Actions（`.github/workflows/docs.yml`）发布到 GitHub Pages。仓库 **Settings → Pages → Source** 需选择 **GitHub Actions**。

## 许可

[MIT](./LICENSE)
