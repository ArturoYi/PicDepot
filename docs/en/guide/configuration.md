# Configuration

Config has three layers (highest wins in practice for production):

1. **Cloudflare Worker bindings / vars / secrets**
2. **`wrangler.toml` `[vars]` and `[[d1_databases]]` / `[[r2_buckets]]`**
3. **Nuxt `runtimeConfig` / local `.env`** (local fallback)

## Cloud resources you must create

| Resource | Binding | Purpose |
|------|------------|------|
| D1 | `DB` | Metadata, users, sessions, settings |
| R2 | `BUCKET` | File blobs |

Without both, the app boots but upload/admin APIs return 503.

## `wrangler.toml` vars

| Var | Meaning |
|------|------|
| `R2_PUBLIC_BASE_URL` | R2 public root URL, no trailing slash |
| `MAX_UPLOAD_BYTES` | Max file size in bytes, default `20971520` (20MB) |

Optional secrets / vars (see code comments):

| Var | Meaning |
|------|------|
| `BOOTSTRAP_ADMIN_USER` / `BOOTSTRAP_ADMIN_PASS` | Optional env-assisted first admin |
| `RESET_KEY` | Reserved ops hook if implemented |
| `CLOUDFLARE_API_TOKEN` | **Local/CI CLI only** — do not put in production Worker vars or Git |

## Nuxt `runtimeConfig`

See root `nuxt.config.ts`:

| Key | Meaning |
|----|------|
| `r2PublicBaseUrl` | Local fallback public base |
| `maxUploadBytes` | Local fallback size limit |
| `corsOrigins` | Comma-separated; empty echoes request Origin (handy for PicGo) |
| `public.siteName` | Site name |
| `public.maxUploadMb` | Client-facing limit in MB |

Local `.env` overrides example:

```bash
# .env — local only; do not commit
NUXT_R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
NUXT_MAX_UPLOAD_BYTES=20971520
```

### `.env` vs production

| Scenario | Need `.env`? |
|------|----------------|
| `pnpm dev` | Optional |
| Manual Cloudflare deploy | **No** |
| GitHub Actions Worker deploy | Use Secrets, not a committed `.env` |

Always treat Dashboard / `wrangler.toml` as source of truth in production.

## CORS

Upload endpoints support CORS. Empty `corsOrigins` echoes `Origin`; tighten to an allowlist in production. Credentialed cross-origin clients must also handle cookies correctly.
