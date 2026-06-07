const app = getApp()

Page({
  data: {
    notificationList: [],
    loading: true
  },

  onLoad() {
    this.loadNotificationList()
  },

  onShow() {
    this.loadNotificationList()
  },

  onPullDownRefresh() {
    this.loadNotificationList(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载通知列表
  loadNotificationList(callback) {
    this.setData({ loading: true })
    app.getMyNotifications((list) => {
      // 格式化时间
      const formattedList = list.map(item => {
        let typeText = '公告'
        let typeColor = '#c2956a'
        if (item.type === 'system') {
          typeText = '系统'
          typeColor = '#60a5fa'
        } else if (item.type === 'update') {
          typeText = '更新'
          typeColor = '#34d399'
        }
        return {
          ...item,
          typeText,
          typeColor,
          time: this.formatTime(item.published_at || item.created_at)
        }
      })
      this.setData({
        notificationList: formattedList,
        loading: false
      })
      callback && callback()
    })
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return ''
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

  // 点击通知
  onNotificationTap(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: '/pages/notification-detail/notification-detail?id=' + item.id
    })
  }
})
