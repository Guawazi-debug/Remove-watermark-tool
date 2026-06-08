const app = getApp()

Page({
  data: {
    notification: null,
    loading: true
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      this.loadNotification(id)
    }
  },

  // 加载通知详情
  loadNotification(id) {
    this.setData({ loading: true })
    app.getMyNotifications((list) => {
      const notification = list.find(item => item.id == id)
      if (notification) {
        // 格式化时间
        const compatibleStr = (notification.published_at || notification.created_at).replace(/-/g, '/')
        const date = new Date(compatibleStr)
        notification.time = this.formatFullTime(date)

        let typeText = '公告'
        let typeColor = '#c2956a'
        if (notification.type === 'system') {
          typeText = '系统'
          typeColor = '#60a5fa'
        } else if (notification.type === 'update') {
          typeText = '更新'
          typeColor = '#34d399'
        }
        notification.typeText = typeText
        notification.typeColor = typeColor

        this.setData({
          notification: notification,
          loading: false
        })

        // 标记已读
        if (!notification.is_read) {
          app.markNotificationRead(id, () => {
            // 标记已读成功后，刷新未读数
            app.getUnreadCount((count) => {
              app.globalData.unreadCount = count
            })
          })
        }
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '通知不存在', icon: 'none' })
      }
    })
  },

  // 格式化完整时间
  formatFullTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
})
