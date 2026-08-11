import { defineConfig } from 'vitepress'

const zhNav = [
  { text: '指南', link: '/guide/introduction' },
  { text: '部署', link: '/guide/deploy' },
  { text: '二开', link: '/development/' },
  { text: 'GitHub', link: 'https://github.com/ArturoYi/PicDepot' }
]

const enNav = [
  { text: 'Guide', link: '/en/guide/introduction' },
  { text: 'Deploy', link: '/en/guide/deploy' },
  { text: 'Development', link: '/en/development/' },
  { text: 'GitHub', link: 'https://github.com/ArturoYi/PicDepot' }
]

const zhSidebar = {
  '/guide/': [
    {
      text: '开始使用',
      items: [
        { text: '项目介绍', link: '/guide/introduction' },
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '部署到 Cloudflare', link: '/guide/deploy' },
        { text: '配置说明', link: '/guide/configuration' },
        { text: '使用手册', link: '/guide/usage' }
      ]
    }
  ],
  '/development/': [
    {
      text: '二次开发',
      items: [
        { text: '概览', link: '/development/' },
        { text: '目录与架构', link: '/development/architecture' },
        { text: 'API 参考', link: '/development/api' },
        { text: '扩展建议', link: '/development/extending' }
      ]
    }
  ]
}

const enSidebar = {
  '/en/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/en/guide/introduction' },
        { text: 'Quick Start', link: '/en/guide/getting-started' },
        { text: 'Deploy to Cloudflare', link: '/en/guide/deploy' },
        { text: 'Configuration', link: '/en/guide/configuration' },
        { text: 'User Guide', link: '/en/guide/usage' }
      ]
    }
  ],
  '/en/development/': [
    {
      text: 'Development',
      items: [
        { text: 'Overview', link: '/en/development/' },
        { text: 'Architecture', link: '/en/development/architecture' },
        { text: 'API Reference', link: '/en/development/api' },
        { text: 'Extending', link: '/en/development/extending' }
      ]
    }
  ]
}

export default defineConfig({
  title: 'PicDepot',
  description: 'Cloudflare-only image / file hosting built with Nuxt 4 + Workers + D1 + R2',
  // GitHub Pages 项目站：https://arturoyi.github.io/PicDepot/
  base: '/PicDepot/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/PicDepot/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ArturoYi/PicDepot' }
    ],
    search: {
      provider: 'local'
    }
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { label: '本页目录' },
        lastUpdated: { text: '最后更新' },
        docFooter: { prev: '上一页', next: '下一页' },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色',
        darkModeSwitchTitle: '切换到深色',
        editLink: {
          pattern: 'https://github.com/ArturoYi/PicDepot/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页'
        },
        footer: {
          message: '基于 MIT 许可发布',
          copyright: 'Copyright © PicDepot contributors'
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        editLink: {
          pattern: 'https://github.com/ArturoYi/PicDepot/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        },
        footer: {
          message: 'Released under the MIT License',
          copyright: 'Copyright © PicDepot contributors'
        }
      }
    }
  }
})
