/** 表单 outline/subtle：真实 border，不用 ring（box-shadow） */
const fieldOutline = 'text-highlighted bg-default/90 border border-accented/80 ring-0 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 transition-all duration-200'
const fieldSubtle = 'text-highlighted bg-elevated/70 border border-accented/60 ring-0 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 transition-all duration-200'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    },
    /*
      UCard 默认 overflow-hidden + ring。
      同一元素上「圆角 + overflow + 1px 描边」在 iOS/WebKit 会把边框裁没。
    */
    card: {
      slots: {
        root: 'rounded-2xl overflow-visible transition-all duration-200'
      },
      variants: {
        variant: {
          outline: {
            root: 'bg-default/85 backdrop-blur-md border border-default/80 shadow-xs divide-y divide-default/80 ring-0 hover:border-default'
          },
          subtle: {
            root: 'bg-elevated/60 backdrop-blur-md border border-default/60 shadow-xs divide-y divide-default/60 ring-0'
          }
        }
      }
    },
    button: {
      slots: {
        base: 'transition-all duration-200 active:scale-[0.98]'
      }
    },
    badge: {
      slots: {
        base: 'font-medium transition-all duration-150'
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
        base: 'rounded-md border border-accented ring-0 focus-visible:outline-3 transition-colors'
      }
    },
    modal: {
      variants: {
        fullscreen: {
          false: {
            content: 'w-[calc(100vw-2rem)] max-w-lg rounded-2xl shadow-2xl border border-default/80 bg-default/95 backdrop-blur-xl ring-0'
          }
        }
      }
    }
  }
})
