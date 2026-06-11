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

  onShow() {
    // 加载工具状态
    app.loadToolStatus()
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

    const page = e.currentTarget.dataset.page
    const toolId = e.currentTarget.dataset.toolId

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
          wx.navigateTo({
            url: page,
            complete: () => {
              setTimeout(() => {
                this._isNavigating = false
              }, 300)
            }
          })
        })
        return
      }

      // 已登录，执行原来的操作
      if (toolId) {
        recordRecentTool(toolId)
        recordUseCount()
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
  },

})
