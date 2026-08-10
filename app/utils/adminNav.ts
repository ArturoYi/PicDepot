export const adminNavItems = [
  {
    label: '文件浏览',
    to: '/admin/files',
    icon: 'i-lucide-images',
    description: '上传历史与文件管理'
  },
  {
    label: '用户管理',
    to: '/admin/users',
    icon: 'i-lucide-users',
    description: '账号与权限'
  },
  {
    label: '系统状态',
    to: '/admin/status',
    icon: 'i-lucide-bar-chart-3',
    description: '存储与上传统计'
  }
] as const

export function resolveAdminNav(path: string) {
  return adminNavItems.find(item => path.startsWith(item.to)) || adminNavItems[0]
}
