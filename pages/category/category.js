const { toolCategories, toolIndex } = require('../../utils/tool-meta')
const { recordUseCount, recordRecentTool } = require('../../utils/common')
const app = getApp()

Page({
  data: {
    categories: [],
    selectedCategory: null,
    filteredTools: [],
    searchKeyword: ''
  },

  onLoad() {
    this.setData({
      categories: toolCategories
    })
  },

  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id
    const category = toolCategories.find(c => c.id === categoryId)
    if (category) {
      this.setData({
        selectedCategory: category,
        filteredTools: category.tools,
        searchKeyword: ''
      })
    }
  },

  onBackTap() {
    this.setData({
      selectedCategory: null,
      filteredTools: [],
      searchKeyword: ''
    })
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    this._filterTools(keyword)
  },

  onSearchClear() {
    this.setData({ searchKeyword: '' })
    this._filterTools('')
  },

  _filterTools(keyword) {
    if (!this.data.selectedCategory) return
    if (!keyword) {
      this.setData({ filteredTools: this.data.selectedCategory.tools })
      return
    }
    const filtered = this.data.selectedCategory.tools.filter(tool =>
      tool.searchText.includes(keyword)
    )
    this.setData({ filteredTools: filtered })
  },

  onToolTap(e) {
    // 防止重复点击
    if (this._isNavigating) return
    this._isNavigating = true

    const page = e.currentTarget.dataset.page
    const toolId = e.currentTarget.dataset.toolId
    if (toolId) {
      recordRecentTool(toolId)
      recordUseCount()
      // 记录到服务器
      app.trackToolUse(toolId)
    }
    wx.navigateTo({
      url: page,
      complete: () => {
        setTimeout(() => {
          this._isNavigating = false
        }, 300)
      }
    })
  },

})
