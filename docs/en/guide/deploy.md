# Deploy to Cloudflare

Production target is **Cloudflare Workers + Assets** (Nitro preset: `cloudflare_module`).

> **Do not** deploy this app as Cloudflare Pages (Pages Functions).  
> The GitHub Pages Action in this repo (`.github/workflows/docs.yml`) publishes the **docs site only**, not the Worker app.

The maintainer currently uses **Method 3: Cloudflare dashboard (Workers Builds / connect Git)**. All three methods below are documented only — this repository **does not** ship an app-deploy GitHub Actions workflow; add one yourself if you want CI.

---

## Three deployment methods

| Method | Name | Recommendation | Best for |
|------|------|--------|----------|
| **Method 1** | Local Wrangler CLI | **Not recommended** (debug / one-off) | Local smoke deploy, inspecting `.output` |
| **Method 2** | GitHub Actions | Optional | Self-managed CI (you add the workflow) |
| **Method 3** | Cloudflare dashboard (Workers Builds / connect Git) | **Recommended (what this project uses)** | Connect the repo in the dashboard; Cloudflare builds & deploys |

All three share the same prerequisites. They only differ in **who** runs `build` and publishes `.output`.

---

## Prerequisites

### 1. Create cloud resources

1. A **D1 database** (example: `picdepot`)
2. An **R2 bucket** (example: `imgbed`) with public access (`r2.dev` or custom domain)
3. (Optional) Custom domain on the Worker later

Dashboard examples:

- D1: Workers & Pages → D1 → Create
- R2: R2 Object Storage → Create bucket → enable public access

CLI is fine **only for creating resources** (it does not mean you chose Method 1):

```bash
wrangler login
wrangler d1 create picdepot
wrangler r2 bucket create imgbed
```

Save the D1 `database_id`.

### 2. Configure `wrangler.toml`

```toml
name = "picdepot"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# Public base URL, no trailing slash — production uses this / Dashboard Variables, not .env
R2_PUBLIC_BASE_URL = "https://pub-xxxx.r2.dev"
MAX_UPLOAD_BYTES = "20971520"

[[d1_databases]]
binding = "DB"
database_name = "picdepot"
database_id = "<your database_id>"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "imgbed"
```

You can also set the same bindings/vars under **Worker → Settings → Bindings / Variables**.

### 3. Apply D1 migrations

```bash
pnpm db:migrate:remote
# same as: wrangler d1 migrations apply picdepot --remote
```

> Method 3 (Workers Builds) does **not** run migrations for you — do this before first go-live.

### 4. About `.env`

| Scenario | Need `.env`? |
|------|----------------|
| Local `pnpm dev` | Optional |
| **Method 1 / 2 / 3 app deploy** | **No** |

Production config comes from `wrangler.toml`, Dashboard Variables/Secrets, or your own CI secrets.  
**Never** commit API tokens or a real `.env`.

---

## Method 1: Local Wrangler

Build locally, then push with Wrangler. **Not recommended** for routine releases.

### Why not recommended

- Machine-specific Node / login state
- Easy to mix laptop config with production  

Use for debugging, inspecting `.output`, or emergencies when the dashboard is unavailable.

### Steps

```bash
pnpm install
pnpm build          # writes Workers + Assets to .output
pnpm deploy         # same as: wrangler --cwd .output deploy
```

Always `pnpm build` first — **do not** `wrangler deploy` the unbuilt repo root.

---

## Method 2: GitHub Actions

Optional; this repo **does not** ship an app-deploy workflow. If you need one, add `.github/workflows/deploy.yml` yourself with:

1. `pnpm install`
2. `pnpm build`
3. `wrangler deploy` inside **`.output`** (e.g. via `cloudflare/wrangler-action`)

Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets.

This is separate from `docs.yml` (GitHub Pages for documentation).

---

## Method 3: Cloudflare dashboard

In the [Cloudflare Dashboard](https://dash.cloudflare.com/), use official **Workers Builds (connect Git)** so Cloudflare builds and deploys the Worker. **Recommended** — this is what the project uses. This is the website “connect repo and ship” path — **not** a Pages project.

### Steps

1. Finish the prerequisites and push to GitHub / GitLab (Workers Builds does not support self-hosted Git).
2. Open Dashboard → **Workers & Pages**.
3. **Create a Worker and connect the repo**, or open an existing Worker → **Settings → Builds → Connect**:
   - Select the PicDepot repository and branch (e.g. `main`)
4. Configure the build (labels may vary in the UI):

| Setting | Suggested value |
|--------|--------|
| Package manager / install | pnpm (or whatever the console detects) |
| **Build command** | `pnpm build` |
| **Deploy command** | `pnpm deploy` |

`pnpm deploy` runs `wrangler --cwd .output deploy`, same artifact as Method 1.

5. Save and run a build; watch **Deployments / Build history**.
6. Under **Settings → Bindings / Variables**, confirm `DB`, `BUCKET`, `R2_PUBLIC_BASE_URL`, etc.

### Notes

- Use **Workers** + Git — **do not** create a **Pages** app for this repo.
- Still run D1 migrations yourself once (prerequisite §3).
- Docs: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

---

## After deploy

1. Open `/login` on the Worker host
2. Bootstrap the first admin
3. Upload a file and verify the R2 public URL
4. (Optional) Create more users in admin

Health check: `GET /api/health`

---

## Incorrect approaches

| Incorrect | Correct |
|----------|----------|
| Deploy as **Cloudflare Pages** | Use **Workers + Assets** (Methods 1 / 2 / 3) |
| `wrangler deploy` at repo root without building | `pnpm build`, then deploy **`.output`** (`pnpm deploy`) |
| Rely on committed `.env` in production | `wrangler.toml` / Dashboard Variables / CI Secrets |
| Go live without D1 / R2 bindings | Create resources and bind `DB` / `BUCKET` first |
| Skip D1 migrations | Run `pnpm db:migrate:remote` before first use |
| Treat `docs.yml` (GitHub Pages) as the app deploy | Use Method 3 (or your own Method 2) |
| Commit API tokens to Git | Secrets / Dashboard only |

---

## FAQ

| Symptom | Likely cause |
|------|----------|
| Upload / admin 503 | Missing `DB` or `BUCKET` binding |
| Public URL 404 | Wrong `R2_PUBLIC_BASE_URL`, bucket not public, or wrong environment |
| Cannot upload / 401 | Not logged in or session expired |
| Builds fail: missing `.output` | Build failed, or deploy command is not `pnpm deploy` |
| `db:migrate:*` cannot find database | `database_name` does not match the D1 name in Cloudflare |
| Build size / timeout | Nitro minify is off here by default; usually well under Workers limits |
