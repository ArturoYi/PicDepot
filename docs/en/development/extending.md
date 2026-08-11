# Extending

Good next steps that fit the current architecture:

| Area | Notes |
|------|------|
| API tokens | `api_tokens` table exists; add issue / hash verify / permissions |
| Tags | `files.tags` JSON is ready; add UI + filters |
| Visibility | `visibility`: public / private / blocked |
| Gallery | Public read-only list via D1 + direct links |
| Cloudflare Images | Optional transforms; not MVP |
| Worker proxy reads | Only if you need hotlink protection / auth reads |
| App i18n | `@nuxtjs/i18n`; docs already ship zh + en |

## Guidelines

1. **Do not list R2 for the product UI** — keep writing to D1.
2. **Keep the 20MB / no-chunking model** unless you accept the complexity.
3. **Secrets stay in Secrets**, never committed `[vars]`.
4. New bindings (KV, Images, …) need `wrangler.toml`, `pnpm cf:types`, and docs updates.

## Docs site

- Chinese is the default (`docs/` root)
- English lives under `docs/en/`
- Config: `docs/.vitepress/config.mts`
- Publish: `.github/workflows/docs.yml` → GitHub Pages
