# Introduction

PicDepot is a **Cloudflare-only** self-hosted image / file hosting stack.

Compared with multi-channel image beds, this project deliberately cuts scope: no Telegram, Discord, S3, WebDAV, Hugging Face, or Docker. You get lower ops cost and a clearer code path.

## Stack

| Piece | Role |
|------|------|
| **Nuxt 4 + Nuxt UI** | Full-stack UI (upload, login, library, settings) |
| **Nitro `cloudflare_module`** | Compile to Cloudflare Workers |
| **Workers + Assets** | API + static UI in one `wrangler deploy` |
| **D1** | Metadata, settings, sessions, users |
| **R2** | Object storage + public URLs (`r2.dev` or custom domain) |

## Architecture

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
   │ metadata│     │  objects │
   │ config  │     │ public   │
   │ session │     │  links   │
   └─────────┘     └──────────┘
```

## Design principles

1. **Split metadata and blobs**: list via D1; read files via R2 public URLs — never list the bucket for the UI.
2. **Control read amplification**: image traffic should mostly bypass the Worker.
3. **Secure defaults**: uploads and admin require a login session; credentials live in D1, not source.
4. **Clear upload limits**: no multipart chunking; max **20MB** per file.

## Current features

- Drag / click / paste upload with progress (after login)
- Copy as raw / Markdown / HTML / BBCode
- Library: pagination, search/filter, rename, move directory
- Batch delete and batch move
- Directory autocomplete, usage stats
- Optional CORS (`runtimeConfig.corsOrigins`) for credentialed clients
- Admin login, bootstrap, user management

## Out of scope (v1)

- Non-Cloudflare storage or bot channels
- Chunked upload / files over 20MB
- Docker / self-hosted Node runtime
- Default Worker reverse-proxy for public reads (use R2 direct links)

Next: [Quick Start](./getting-started) or [Deploy](./deploy).
