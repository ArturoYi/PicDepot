// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      // 允许 Vue3 template 多根节点
      'vue/no-multiple-template-root': 'off'
    }
  }
)
