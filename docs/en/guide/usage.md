# User Guide

## Upload page (`/`)

The home page is guarded by auth middleware — log in first.

1. Tap **Upload directory** to pick or type a target folder (existing names autocomplete; leave empty to auto-sort by type).
2. Drag, pick, or paste images/files.
3. Copy links in multiple formats after success.

Constraints:

- No session → uploads denied (API checks the session cookie)
- Images and other files: max 20MB (`MAX_UPLOAD_BYTES`)
- Video: max 50MB (`MAX_VIDEO_UPLOAD_BYTES`). The browser compresses video to WebM or MP4 before upload so it can be previewed. If the original already plays and compression does not shrink it, the original is uploaded
- HEIC and TIFF are converted to WebP or JPEG in the browser before upload

## Login & bootstrap (`/login`)

- **First run**: when there are no users, bootstrap creates the top admin.
- **Afterwards**: admins create accounts; everyone else logs in with username/password.

## Admin (`/admin`)

| Area | Features |
|------|------|
| Library | Pagination, search/filter, preview, rename, move, delete |
| Batch | Batch delete, batch move |
| Users | Admin account management |
| Status | Storage usage %, type/directory breakdown, 24h / 7d / 30d uploads, runtime bindings |

## Link formats

Typical copy menu:

- Raw public URL
- Markdown
- HTML `<img>`
- BBCode

The domain comes from your `R2_PUBLIC_BASE_URL`.

## Clients / API

`POST /api/upload` requires a valid login session (`credentials: include`). Clients that cannot send cookies can add API tokens later (`api_tokens` table is reserved). See [Configuration](./configuration) for CORS.
