# Architecture

## Layout

```
app/pages/           # Upload / login / admin pages
app/components/      # UI (uploader, copy menu, library…)
app/composables/     # Session, upload progress, preferences
server/api/          # Nitro routes (health, upload, auth, admin…)
server/utils/        # Bindings, auth, settings, file records, CORS
shared/utils/        # Shared helpers (link formats)
shared/types/        # Env types
migrations/          # D1 SQL
wrangler.toml        # Workers / D1 / R2 bindings
docs/                # VitePress docs (this site)
```

## Request paths

- **Pages**: Nuxt routes; `/admin/**` is CSR-only (`routeRules` in `nuxt.config.ts`).
- **API**: `server/api/**` → `/api/**`, caching disabled.
- **File reads**: clients use R2 public URLs; no default Worker proxy.

## Binding helpers

`server/utils/env.ts`:

- `getDb(event)` → `env.DB`
- `getBucket(event)` → `env.BUCKET`
- `getPublicBaseUrl(event)` → `R2_PUBLIC_BASE_URL` or runtimeConfig fallback
- `getMaxUploadBytes(event)` → `MAX_UPLOAD_BYTES` or runtimeConfig fallback
- `getStorageQuotaBytes(event)` → `STORAGE_QUOTA_BYTES` or runtimeConfig fallback (default 10GB)

Missing bindings throw 503 so misconfiguration fails loudly.

## Auth layers

| Scenario | Mechanism |
|------|------|
| Upload / directory hints | Login session (`requireUploadAuth` → `requireUserSession`) |
| Admin APIs | Admin session (`requireAdminSession`) |
| Pages `/`, `/admin/**` | Frontend `auth` / `admin` middleware |
| Bootstrap | Allowed only when `users` is empty |

## Build output

`pnpm build` uses Nitro preset `cloudflare_module` into `.output/`.  
`pnpm deploy` runs `wrangler deploy` from `.output`.
