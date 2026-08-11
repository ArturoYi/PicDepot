# Development Overview

PicDepot is a Nuxt full-stack monorepo: UI in `app/`, APIs in `server/api/`, shared types/utils in `shared/`, D1 migrations in `migrations/`.

## Environment

```bash
pnpm install
pnpm dev
```

Also prepare:

- A Cloudflare account after `wrangler login` (for remote D1/R2)
- Correct `database_id` / `bucket_name` / `R2_PUBLIC_BASE_URL` in root `wrangler.toml`

## Suggested workflow

1. Read [Architecture](./architecture) and decide whether you are changing UI, API, or bindings.
2. Schema changes go into new `migrations/00xx_*.sql`, then `pnpm db:migrate:local` / `remote`.
3. New APIs should reuse `server/utils/*` (`getDb` / `getBucket` / auth) instead of touching `event.context.cloudflare` directly.
4. Pass `pnpm typecheck` and `pnpm lint` before opening a PR.

## Docs site locally

```bash
cd docs
pnpm install
pnpm dev
```

Docs are independent of the app and publish to GitHub Pages via Actions.

## Contributing

Issues and PRs are welcome. Keep changes focused; explain motivation and how you verified. Licensed under MIT — see root `LICENSE`.
