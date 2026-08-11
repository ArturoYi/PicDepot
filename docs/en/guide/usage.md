# User Guide

## Upload page (`/`)

The home page is guarded by auth middleware — log in first.

1. Optionally set a directory (existing directories can autocomplete).
2. Drag, pick, or paste images/files.
3. Copy links in multiple formats after success.

Constraints:

- No session → uploads denied (API checks the session cookie)
- Max 20MB per file (overridable via `MAX_UPLOAD_BYTES`)
- HEIC may be converted client-side depending on the browser

## Login & bootstrap (`/login`)

- **First run**: when there are no users, bootstrap creates the top admin.
- **Afterwards**: admins create accounts; everyone else logs in with username/password.

## Admin (`/admin`)

| Area | Features |
|------|------|
| Library | Pagination, search/filter, preview, rename, move, delete |
| Batch | Batch delete, batch move |
| Stats | File count, storage used, last 7 days uploads |
| Users | Admin account management |
| Status | Health / runtime info |

## Link formats

Typical copy menu:

- Raw public URL
- Markdown
- HTML `<img>`
- BBCode

The domain comes from your `R2_PUBLIC_BASE_URL`.

## Clients / API

`POST /api/upload` requires a valid login session (`credentials: include`). Clients that cannot send cookies can add API tokens later (`api_tokens` table is reserved). See [Configuration](./configuration) for CORS.
