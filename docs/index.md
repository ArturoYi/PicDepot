---
layout: home

hero:
  name: PicDepot
  text: 仅依赖 Cloudflare 的自建图床
  tagline: Nuxt 4 · Workers · D1 · R2 — 上传、管理、直链，一条链路跑通
  image:
    src: /logo.svg
    alt: PicDepot
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 部署指南
      link: /guide/deploy
    - theme: alt
      text: GitHub
      link: https://github.com/ArturoYi/PicDepot

features:
  - title: Cloudflare Only
    details: 无 Telegram / S3 / Docker。Workers + Assets 一体部署，D1 存元数据，R2 公网直链读文件。
  - title: 安全默认
    details: 上传需登录会话；单文件上限 20MB；管理员会话保护后台接口。
  - title: 开箱管理
    details: 文件库分页筛选、批量移动/删除、多格式复制链接、粘贴上传、目录联想与用量统计。
  - title: 易于二开
    details: Nuxt 全栈同仓，API 分层清晰，migrations + wrangler 绑定，方便扩展 Token、标签与画廊。
---
