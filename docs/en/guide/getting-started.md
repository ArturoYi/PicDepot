# Quick Start

Local development needs Node.js 22+ and a package manager (pnpm recommended; npm works).

## Install & run

```bash
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

Health check: <http://localhost:3000/api/health>

Local Cloudflare bindings come from `nitro-cloudflare-dev` + root [`wrangler.toml`](https://github.com/ArturoYi/PicDepot/blob/main/wrangler.toml). **Without D1 / R2 bindings**, upload and admin APIs return 503.

## Bind D1 / R2 locally

1. Create a D1 database and R2 bucket (Dashboard or CLI):

```bash
wrangler d1 create picdepot
wrangler r2 bucket create imgbed
```

2. Put `database_id` and `bucket_name` into root `wrangler.toml`.
3. Apply migrations:

```bash
pnpm db:migrate:local
# or
pnpm db:migrate:remote
```

4. Set `R2_PUBLIC_BASE_URL` (no trailing slash) and enable a Public Development URL or custom domain on the bucket.

### About `.env`

`.env` is **only for local Nuxt development** (e.g. override `NUXT_R2_PUBLIC_BASE_URL`).  
**You do not need `.env` when deploying to Cloudflare** — production config lives in `wrangler.toml` / the Dashboard. This project recommends Workers Builds in the dashboard (Method 3). See [Configuration](./configuration) and [Deploy](./deploy).

## Public URL 404s

If `R2_PUBLIC_BASE_URL` points at a cloud `pub-*.r2.dev` URL but local `pnpm dev` writes to a simulated R2, objects will 404 on the public host.

This repo can set R2 `remote = true` in `wrangler.toml`. Run `wrangler login`, restart dev, and confirm the public URL is enabled on the **correct** bucket.

## First-time setup

1. Open `/login` → bootstrap the first admin.
2. After login, upload from the home page; admins manage files and users under `/admin`.

## Scripts

| Command | Description |
|------|------|
| `pnpm dev` | Local development |
| `pnpm build` | Build Workers output (`.output`) |
| `pnpm deploy` | `wrangler --cwd .output deploy` |
| `pnpm db:migrate:local` | Apply D1 migrations (local) |
| `pnpm db:migrate:remote` | Apply D1 migrations (remote) |
| `pnpm typecheck` | Typecheck |
| `pnpm lint` | ESLint |
