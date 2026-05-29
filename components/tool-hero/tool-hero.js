const { findToolByRoute } = require('../../utils/tool-meta')

Component({
  options: {
    virtualHost: true
  },
  data: {
    tool: null
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const tool = currentPage ? findToolByRoute(currentPage.route) : null
      if (tool) {
        this.setData({ tool })
      }
    }
  }
})
