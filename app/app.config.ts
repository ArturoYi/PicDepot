export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc'
    },
    /* ring 会在 overflow-hidden 下被裁掉，移动端边框几乎看不见 */
    card: {
      variants: {
        variant: {
          outline: {
            root: 'bg-default border border-default divide-y divide-default'
          }
        }
      }
    }
  }
})
