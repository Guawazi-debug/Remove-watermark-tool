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
    favoriteToolIds: [],
    // 公告弹窗
    showAnnouncement: false,
    announcementData: null
  },

  onLoad() {
    this._syncView('')
  },

  onShow() {
    this.setData({
      recentTools: this._getRecentTools()
    })
    this._syncView(this.data.searchKeyword)
    // 异步加载收藏列表后刷新视图
    this._getFavoriteToolIds(() => {
      this._syncView(this.data.searchKeyword)
    })
    // 加载工具状态
    app.loadToolStatus()
    // 检查最新公告
    this._checkAnnouncement()
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

    // 等待工具状态加载完成后检查
    this._isNavigating = true
    app.loadToolStatus(() => {
      // 检查工具状态
      if (toolId) {
        const toolStatus = app.getToolStatus(toolId)
        if (toolStatus.status === 'maintenance' || toolStatus.status === 'disabled') {
          this._isNavigating = false
          const title = toolStatus.status === 'maintenance' ? '工具维护中' : '工具已停用'
          const msg = toolStatus.status_message || (toolStatus.status === 'maintenance'
            ? '该工具正在维护中，请稍后再试' : '该工具已停用')
          wx.showModal({
            title: title,
            content: msg,
            showCancel: false,
            confirmText: '我知道了'
          })
          return
        }
      }

      // 检查登录状态
      if (!app.isLoggedIn()) {
        // 未登录，显示登录弹窗
        app.showLoginModal(() => {
          // 登录成功后执行原来的操作
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
      } else {
        this._isNavigating = false
      }
    })
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
  _getFavoriteToolIds(callback) {
    // 未登录不显示收藏状态
    if (!app.isLoggedIn()) {
      this.setData({ favoriteToolIds: [] })
      callback && callback()
      return
    }

    // 从服务器获取收藏列表
    wx.request({
      url: app.globalData.apiBaseUrl + '/favorites.php?action=list&openid=' + app.globalData.openid,
      method: 'GET',
      header: { 'X-API-Key': 'moyin-api-key-v1.2.0' },
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const toolIds = res.data.data.tools || []
          this.setData({ favoriteToolIds: toolIds })
        }
        callback && callback()
      },
      fail: () => {
        callback && callback()
      }
    })
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

    const isFavorite = this.data.favoriteToolIds.includes(toolId)

    if (isFavorite) {
      // 已收藏，取消收藏
      wx.request({
        url: app.globalData.apiBaseUrl + '/favorites.php?action=remove',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-API-Key': 'moyin-api-key-v1.2.0'
        },
        data: {
          openid: app.globalData.openid,
          tool_id: toolId
        },
        timeout: 10000,
        success: () => {
          wx.showToast({ title: '已取消收藏', icon: 'none' })
          this._getFavoriteToolIds(() => {
            this._syncView(this.data.searchKeyword)
          })
        }
      })
    } else {
      // 未收藏，添加收藏
      wx.request({
        url: app.globalData.apiBaseUrl + '/favorites.php?action=add',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-API-Key': 'moyin-api-key-v1.2.0'
        },
        data: {
          openid: app.globalData.openid,
          tool_id: toolId
        },
        timeout: 10000,
        success: () => {
          wx.showToast({ title: '已收藏', icon: 'success' })
          this._getFavoriteToolIds(() => {
            this._syncView(this.data.searchKeyword)
          })
        }
      })
    }
  },

  // 获取工具的收藏状态
  _isFavorite(toolId) {
    return this.data.favoriteToolIds.includes(toolId)
  },

  // 检查最新公告
  _checkAnnouncement() {
    if (!app.globalData.openid) return

    app.getLatestAnnouncement((data) => {
      if (data) {
        this.setData({
          showAnnouncement: true,
          announcementData: data
        })
      }
    })
  },

  // 关闭公告弹窗
  onCloseAnnouncement() {
    this.setData({
      showAnnouncement: false,
      announcementData: null
    })
  },

  // 查看公告详情
  onViewAnnouncement() {
    const id = this.data.announcementData.id
    this.setData({
      showAnnouncement: false,
      announcementData: null
    })
    wx.navigateTo({
      url: '/pages/notification-detail/notification-detail?id=' + id
    })
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
