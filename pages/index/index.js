const { toolCategories, toolIndex } = require('../../utils/tool-meta')

const RECENT_TOOLS_KEY = 'recent-tools'
const FEATURED_TOOL_IDS = ['video-parse', 'json-parse', 'timestamp', 'hash']
const CATEGORY_SUMMARY = toolCategories.map(category => ({
  id: category.id,
  name: category.name,
  count: category.tools.length,
  accent: category.accent
}))

Page({
  data: {
    searchKeyword: '',
    featuredTools: [],
    recentTools: [],
    filteredCategories: [],
    categorySummary: []
  },

  onLoad() {
    this._syncView('')
  },

  onShow() {
    this.setData({
      recentTools: this._getRecentTools()
    })
  },

  onUnload() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
  },

  onToolTap(e) {
    const page = e.currentTarget.dataset.page
    const toolId = e.currentTarget.dataset.toolId
    if (toolId) {
      this._recordRecentTool(toolId)
    }
    wx.navigateTo({ url: page })
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
    }
    this._searchTimer = setTimeout(() => {
      this._syncView(keyword)
      this._searchTimer = null
    }, 80)
  },

  onSearchClear() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
    this.setData({ searchKeyword: '' })
    this._syncView('')
  },

  _syncView(keyword) {
    this.setData({
      featuredTools: this._getFeaturedTools(),
      recentTools: this._getRecentTools(),
      filteredCategories: this._filterTools(keyword),
      categorySummary: CATEGORY_SUMMARY
    })
  },

  _filterTools(keyword) {
    if (!keyword) {
      return toolCategories
    }

    return toolCategories
      .map(category => {
        const tools = category.tools.filter(tool => tool.searchText.includes(keyword))
        return Object.assign({}, category, { tools })
      })
      .filter(category => category.tools.length > 0)
  },

  _getFeaturedTools() {
    return FEATURED_TOOL_IDS.map(id => toolIndex[id]).filter(Boolean)
  },

  _getRecentTools() {
    const recentIds = wx.getStorageSync(RECENT_TOOLS_KEY) || []
    return recentIds.map(id => toolIndex[id]).filter(Boolean)
  },

  _recordRecentTool(toolId) {
    const current = wx.getStorageSync(RECENT_TOOLS_KEY) || []
    const next = [toolId].concat(current.filter(id => id !== toolId)).slice(0, 6)
    wx.setStorageSync(RECENT_TOOLS_KEY, next)
  },

  onShareAppMessage() {
    return {
      title: '工具小栈 - 实用小程序工具箱',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '工具小栈 - 实用小程序工具箱'
    }
  }
})
