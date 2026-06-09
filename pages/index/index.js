const { toolCategories, toolIndex } = require('../../utils/tool-meta')
const { recordUseCount, recordRecentTool } = require('../../utils/common')
const app = getApp()

const RECENT_TOOLS_KEY = 'recent-tools'
const FAVORITE_TOOLS_KEY = 'favorite-tools'
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
    categorySummary: [],
    favoriteToolIds: []
  },

  onLoad() {
    this._syncView('')
  },

  onShow() {
    this.setData({
      recentTools: this._getRecentTools(),
      favoriteToolIds: this._getFavoriteToolIds()
    })
    this._syncView(this.data.searchKeyword)
  },

  onUnload() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
  },

  onToolTap(e) {
    // 防止重复点击
    if (this._isNavigating) return

    // 从组件事件或原生事件中获取数据
    const page = e.detail.page || e.currentTarget.dataset.page
    const toolId = e.detail.toolId || e.currentTarget.dataset.toolId

    // 检查登录状态
    if (!app.isLoggedIn()) {
      // 未登录，显示登录弹窗
      app.showLoginModal(() => {
        // 登录成功后执行原来的操作
        this._isNavigating = true
        if (toolId) {
          recordRecentTool(toolId)
          recordUseCount()
          app.trackToolUse(toolId)
        }
        if (page) {
          wx.navigateTo({
            url: page,
            complete: () => {
              setTimeout(() => {
                this._isNavigating = false
              }, 300)
            }
          })
        }
      })
      return
    }

    // 已登录，执行原来的操作
    this._isNavigating = true
    if (toolId) {
      recordRecentTool(toolId)
      recordUseCount()
      app.trackToolUse(toolId)
    }
    if (page) {
      wx.navigateTo({
        url: page,
        complete: () => {
          setTimeout(() => {
            this._isNavigating = false
          }, 300)
        }
      })
    }
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
      return toolCategories.map(category => ({
        ...category,
        tools: category.tools.map(tool => ({
          ...tool,
          isFavorite: this._isFavorite(tool.id)
        }))
      }))
    }

    return toolCategories
      .map(category => {
        const tools = category.tools
          .filter(tool => tool.searchText.includes(keyword))
          .map(tool => ({
            ...tool,
            isFavorite: this._isFavorite(tool.id)
          }))
        return Object.assign({}, category, { tools })
      })
      .filter(category => category.tools.length > 0)
  },

  _getFeaturedTools() {
    return FEATURED_TOOL_IDS.map(id => {
      const tool = toolIndex[id]
      if (tool) {
        return Object.assign({}, tool, {
          isFavorite: this._isFavorite(id)
        })
      }
      return null
    }).filter(Boolean)
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

  // 获取收藏的工具ID列表
  _getFavoriteToolIds() {
    // 未登录不显示收藏状态
    if (!app.isLoggedIn()) return []
    return wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
  },

  // 收藏/取消收藏工具
  onFavoriteTool(e) {
    const toolId = e.detail.toolId
    if (!toolId) return

    // 未登录提示去登录
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再收藏工具',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/profile' })
          }
        }
      })
      return
    }

    const current = wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
    const index = current.indexOf(toolId)
    let next

    if (index > -1) {
      // 已收藏，取消收藏
      next = current.filter(id => id !== toolId)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      // 未收藏，添加收藏
      next = [toolId, ...current]
      wx.showToast({ title: '已收藏', icon: 'success' })
    }

    wx.setStorageSync(FAVORITE_TOOLS_KEY, next)
    this.setData({ favoriteToolIds: next })
    this._syncView(this.data.searchKeyword)
  },

  // 获取工具的收藏状态
  _isFavorite(toolId) {
    return this.data.favoriteToolIds.includes(toolId)
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
