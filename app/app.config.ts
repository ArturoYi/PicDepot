/** 表单 outline/subtle：真实 border，不用 ring（box-shadow） */
const fieldOutline = 'text-highlighted bg-default border border-accented ring-0'
const fieldSubtle = 'text-highlighted bg-elevated border border-accented ring-0'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc'
    },
    /*
      UCard 默认 overflow-hidden + ring。
      同一元素上「圆角 + overflow + 1px 描边」在 iOS/WebKit 会把边框裁没。
    */
    card: {
      slots: {
        root: 'rounded-lg overflow-visible'
      },
      variants: {
        variant: {
          outline: {
            root: 'bg-default border border-default divide-y divide-default ring-0'
          },
          subtle: {
            root: 'bg-elevated/50 border border-default divide-y divide-default ring-0'
          }
        }
      }
    },
    input: {
      variants: {
        variant: {
          outline: fieldOutline,
          subtle: fieldSubtle
        }
      }
    },
    inputMenu: {
      variants: {
        variant: {
          outline: fieldOutline,
          subtle: fieldSubtle
        }
      }
    },
    textarea: {
      variants: {
        variant: {
          outline: fieldOutline,
          subtle: fieldSubtle
        }
      }
    },
    select: {
      variants: {
        variant: {
          outline: `${fieldOutline} hover:bg-elevated disabled:bg-default`,
          subtle: `${fieldSubtle} hover:bg-accented/75 disabled:bg-elevated`
        }
      }
    },
    selectMenu: {
      variants: {
        variant: {
          outline: `${fieldOutline} hover:bg-elevated disabled:bg-default`,
          subtle: `${fieldSubtle} hover:bg-accented/75 disabled:bg-elevated`
        }
      }
    },
    checkbox: {
      slots: {
        base: 'rounded-sm border border-accented ring-0 focus-visible:outline-3'
      }
    },
    modal: {
      variants: {
        fullscreen: {
          false: {
            content: 'w-[calc(100vw-2rem)] max-w-lg rounded-lg shadow-lg border border-default ring-0'
          }
        }
      }
    }
  }
})
