const app = getApp()

Page({
  data: {
    historyList: [],
    loading: false,
    loadingMore: false,
    page: 1,
    hasMore: true,
    total: 0,
    // 搜索和筛选
    keyword: '',
    dateStart: '',
    dateEnd: '',
    showFilter: false
  },

  onShow() {
    this.resetAndLoad()
  },

  resetAndLoad() {
    this.setData({ page: 1, hasMore: true, historyList: [] })
    this.loadHistory()
  },

  loadHistory() {
    if (!app.isLoggedIn()) {
      this.setData({ historyList: [] })
      return
    }

    const openid = app.globalData.openid
    const { page, keyword, dateStart, dateEnd } = this.data

    this.setData({ loading: true })

    let url = `${app.globalData.apiBaseUrl}/image_history.php?action=list&openid=${openid}&page=${page}&page_size=20`
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
    if (dateStart) url += `&date_start=${dateStart}`
    if (dateEnd) url += `&date_end=${dateEnd}`

    wx.request({
      url: url,
      method: 'GET',
      header: { 'X-API-Key': 'moyin-api-key-v1.2.0' },
      timeout: 30000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const list = res.data.data.list || []
          const total = res.data.data.total || 0
          const newList = page === 1 ? list : [...this.data.historyList, ...list]

          this.setData({
            historyList: newList,
            total: total,
            hasMore: newList.length < total,
            loading: false,
            loadingMore: false
          })
        } else {
          this.setData({ historyList: [], loading: false, loadingMore: false })
        }
      },
      fail: () => {
        this.setData({ loading: false, loadingMore: false })
      }
    })
  },

  // 搜索关键词输入
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 搜索
  onSearch() {
    this.resetAndLoad()
  },

  // 清空搜索
  onClearKeyword() {
    this.setData({ keyword: '' })
    this.resetAndLoad()
  },

  // 切换筛选面板
  onToggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  // 日期选择
  onDateStartChange(e) {
    this.setData({ dateStart: e.detail.value })
  },

  onDateEndChange(e) {
    this.setData({ dateEnd: e.detail.value })
  },

  // 应用筛选
  onApplyFilter() {
    this.setData({ showFilter: false })
    this.resetAndLoad()
  },

  // 重置筛选
  onResetFilter() {
    this.setData({ dateStart: '', dateEnd: '', showFilter: false })
    this.resetAndLoad()
  },

  // 加载更多
  onLoadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return
    this.setData({ page: this.data.page + 1, loadingMore: true })
    this.loadHistory()
  },

  // 复制图片链接
  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },

  // 复制提示词
  onCopyPrompt(e) {
    const prompt = e.currentTarget.dataset.prompt
    if (!prompt) return
    wx.setClipboardData({
      data: prompt,
      success: () => wx.showToast({ title: '提示词已复制', icon: 'success' })
    })
  },

  onShareAppMessage() {
    return { title: '工具小栈 - AI 生图历史', path: '/pages/index/index' }
  },

  onShareTimeline() {
    return { title: '工具小栈 - AI 生图历史' }
  }
})
