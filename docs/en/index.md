---
layout: home

hero:
  name: PicDepot
  text: Cloudflare-only self-hosted image hosting
  tagline: Nuxt 4 · Workers · D1 · R2 — upload, manage, and serve public links on one stack
  image:
    src: /logo.svg
    alt: PicDepot
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/getting-started
    - theme: alt
      text: Deploy
      link: /en/guide/deploy
    - theme: alt
      text: GitHub
      link: https://github.com/ArturoYi/PicDepot

features:
  - title: Cloudflare Only
    details: No Telegram / S3 / Docker. Workers + Assets in one deploy. D1 for metadata, R2 public URLs for files.
  - title: Secure by Default
    details: Uploads require a login session. 20MB per file. Admin session protects management APIs.
  - title: Built-in Admin
    details: Paginated library, filters, batch move/delete, multi-format copy, paste upload, directory hints, and usage stats.
  - title: Easy to Extend
    details: Full-stack Nuxt monorepo with clear API layers, D1 migrations, and wrangler bindings.
---
