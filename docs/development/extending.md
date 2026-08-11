# 扩展建议

以下方向在架构上已预留或易扩展，可按优先级二开：

| 方向 | 说明 |
|------|------|
| API Token | `migrations` 已有 `api_tokens` 表骨架；可补签发、哈希校验与权限位 |
| 标签 | `files.tags` JSON 字段已存在；补后台 UI 与筛选 |
| 可见性 | `visibility`：public / private / blocked |
| 画廊 | 公开列表页，只读查 D1 + 直链 |
| Cloudflare Images | 可选缩略图 / 变换，非 MVP |
| Worker 反代读 | 需要防盗链或鉴权读时再启用，默认仍建议直链 |
| i18n | 应用 UI 多语言可用 `@nuxtjs/i18n`；文档已中英双份 |

## 扩展时注意

1. **不要用 R2 List 做业务列表**——继续写 D1。
2. **保持上传 ≤20MB 或不做分片**，除非明确接受复杂度上升。
3. **密钥只走 Secrets**，不要写进 `[vars]` 明文仓库。
4. 新增绑定（KV、Images 等）时同步更新 `wrangler.toml`、类型生成（`pnpm cf:types`）与文档。

## 文档站扩展

- 中文为默认语言（`docs/` 根路径）
- 英文在 `docs/en/`
- 配置：`docs/.vitepress/config.mts`
- 发布：`.github/workflows/docs.yml` → GitHub Pages
