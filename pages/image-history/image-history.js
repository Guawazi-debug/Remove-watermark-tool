const app = getApp()

Page({
  data: {
    historyList: [],
    loading: false
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    // 未登录不加载
    if (!app.isLoggedIn()) {
      console.log('[生图历史] 未登录，不加载')
      this.setData({ historyList: [] })
      return
    }

    const openid = app.globalData.openid
    console.log('[生图历史] 开始加载, openid:', openid)

    this.setData({ loading: true })

    const url = `${app.globalData.apiBaseUrl}/image_history.php?action=list&openid=${openid}`
    console.log('[生图历史] 请求URL:', url)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      timeout: 30000,
      success: (res) => {
        console.log('[生图历史] 服务器返回:', res.data)
        if (res.data && res.data.code === 200) {
          const list = res.data.data.list || []
          console.log('[生图历史] 记录数:', list.length)
          this.setData({
            historyList: list,
            loading: false
          })
        } else {
          this.setData({ historyList: [], loading: false })
        }
      },
      fail: (err) => {
        console.error('[生图历史] 请求失败:', err)
        this.setData({ historyList: [], loading: false })
      }
    })
  },

  // 复制图片链接
  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url
    console.log('[生图历史] 复制链接:', url)
    if (!url) {
      wx.showToast({ title: '链接为空', icon: 'none' })
      return
    }

    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      },
      fail: (err) => {
        console.error('[生图历史] 复制失败:', err)
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  // 复制提示词
  onCopyPrompt(e) {
    const prompt = e.currentTarget.dataset.prompt
    console.log('[生图历史] 复制提示词:', prompt)
    if (!prompt) {
      wx.showToast({ title: '提示词为空', icon: 'none' })
      return
    }

    wx.setClipboardData({
      data: prompt,
      success: () => {
        wx.showToast({ title: '提示词已复制', icon: 'success' })
      },
      fail: (err) => {
        console.error('[生图历史] 复制失败:', err)
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '工具小栈 - AI 生图历史',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '工具小栈 - AI 生图历史'
    }
  }
})
