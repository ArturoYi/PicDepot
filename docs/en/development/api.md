# API Reference

Admin endpoints require an **admin session** unless noted.

| Method | Path | Auth | Description |
|------|------|------|------|
| GET | `/api/health` | none | Health check |
| POST | `/api/upload` | session | Upload file; CORS / OPTIONS supported |
| GET | `/api/directories` | session | Directory autocomplete |
| GET | `/api/auth/setup` | none | Whether bootstrap is needed |
| POST | `/api/auth/bootstrap` | none* | Create first admin (only if no users) |
| POST | `/api/auth/login` | none | Login |
| POST | `/api/auth/logout` | session | Logout |
| GET | `/api/auth/session` | session | Current session |
| GET | `/api/admin/files` | admin | List / search / filter |
| DELETE | `/api/admin/files/:id` | admin | Delete one file |
| PATCH | `/api/admin/files/:id` | admin | Rename / change directory |
| POST | `/api/admin/files/batch-delete` | admin | Batch delete |
| POST | `/api/admin/files/batch-move` | admin | Batch move |
| GET | `/api/admin/stats` | admin | Counts / usage % / type & directory breakdown / 24h·7d·30d uploads / runtime bindings |
| GET | `/api/admin/directories` | admin | Directory list |
| GET | `/api/admin/users` | admin | User list |
| POST | `/api/admin/users` | admin | Create user |

\* bootstrap returns 409 after the system is initialized.

## Upload contract

- `Content-Type: multipart/form-data`
- Field `file`: binary
- Field `directory`: optional
- Auth: browser session cookie (`xhr.withCredentials = true`)

Success returns JSON including the public URL; failures use explicit HTTP statuses (400 / 403 / 413 / 503, etc.).
