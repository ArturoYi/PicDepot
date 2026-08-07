export type CopyFormat = 'url' | 'markdown' | 'html' | 'bbcode'

export const copyFormatLabels: Record<CopyFormat, string> = {
  url: '直链',
  markdown: 'Markdown',
  html: 'HTML',
  bbcode: 'BBCode'
}

export function formatLink(url: string, format: CopyFormat, fileName = 'image'): string {
  const alt = fileName.replace(/[[\]"']/g, '') || 'image'
  switch (format) {
    case 'url':
      return url
    case 'markdown':
      return `![${alt}](${url})`
    case 'html':
      return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" />`
    case 'bbcode':
      return `[img]${url}[/img]`
  }
}
