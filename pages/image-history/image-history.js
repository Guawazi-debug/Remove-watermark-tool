const app = getApp()
const HISTORY_KEY = 'ai-image-history'

Page({
  data: {
    historyList: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const list = wx.getStorageSync(HISTORY_KEY) || []
    this.setData({
      historyList: list.map(item => ({
        ...item,
        expanded: false
      }))
    })
  },

  onToggleItem(e) {
    const index = e.currentTarget.dataset.index
    const key = `historyList[${index}].expanded`
    this.setData({
      [key]: !this.data.historyList[index].expanded
    })
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  onSaveImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return

    wx.showLoading({ title: '保存中...' })

    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: (err) => {
              wx.hideLoading()
              if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
                wx.showModal({
                  title: '提示',
                  content: '需要授权保存图片到相册',
                  confirmText: '去授权',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting()
                    }
                  }
                })
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' })
              }
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '下载失败', icon: 'none' })
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
