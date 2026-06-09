const app = getApp()

Page({
  data: {
    feedbackList: [],
    loading: true
  },

  onLoad() {
    this.loadFeedbackList()
  },

  onShow() {
    this.loadFeedbackList()
  },

  onPullDownRefresh() {
    this.loadFeedbackList(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载反馈列表
  loadFeedbackList(callback) {
    // 未登录不加载数据
    if (!app.isLoggedIn()) {
      this.setData({
        feedbackList: [],
        loading: false
      })
      callback && callback()
      return
    }

    this.setData({ loading: true })
    app.getMyFeedbackList((list) => {
      // 格式化状态
      const formattedList = list.map(item => {
        let statusText = '待处理'
        let statusColor = '#fbbf24'
        if (item.status === 'read') {
          statusText = '已阅读'
          statusColor = '#60a5fa'
        } else if (item.status === 'replied') {
          statusText = '已回复'
          statusColor = '#34d399'
        }
        return {
          ...item,
          statusText,
          statusColor,
          time: this.formatTime(item.created_at)
        }
      })
      this.setData({
        feedbackList: formattedList,
        loading: false
      })
      callback && callback()
    })
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return ''
    // 将 "yyyy-MM-dd HH:mm:ss" 转为 "yyyy/MM/dd HH:mm:ss" 以兼容iOS
    const compatibleStr = dateStr.replace(/-/g, '/')
    const date = new Date(compatibleStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return minutes + '分钟前'
    if (hours < 24) return hours + '小时前'
    if (days < 7) return days + '天前'
    return dateStr.substring(0, 10)
  },

  onShareAppMessage() {
    return {
      title: '工具小栈 - 实用小程序工具箱',
      path: '/pages/index/index'
    }
  }
})
