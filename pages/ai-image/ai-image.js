const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

const app = getApp()
const HISTORY_KEY = 'ai-image-history'

Page({
  data: {
    prompt: '',
    showSettings: false,
    selectedSize: '1024x1024',
    revise: true,
    footnote: '',
    seed: '',
    sizeOptions: [
      { label: '1:1', value: '1024x1024' },
      { label: '4:3', value: '1024x768' },
      { label: '3:4', value: '768x1024' }
    ],
    loading: false,
    imageUrl: '',
    errorMsg: ''
  },

  onPromptInput(e) {
    this.setData({ prompt: e.detail.value })
  },

  onToggleSettings() {
    this.setData({ showSettings: !this.data.showSettings })
  },

  onSizeTap(e) {
    this.setData({ selectedSize: e.currentTarget.dataset.value })
  },

  onReviseChange(e) {
    this.setData({ revise: e.detail.value })
  },

  onFootnoteInput(e) {
    this.setData({ footnote: e.detail.value })
  },

  onSeedInput(e) {
    this.setData({ seed: e.detail.value })
  },

  async onGenerate() {
    const { prompt, selectedSize, revise, footnote, seed } = this.data

    if (!prompt.trim()) {
      wx.showToast({ title: '请输入图片描述', icon: 'none' })
      return
    }

    this.setData({ loading: true, errorMsg: '', imageUrl: '' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'generateImage-AmUdTa',
        data: {
          prompt: prompt.trim(),
          size: selectedSize,
          revise: revise,
          footnote: footnote || undefined,
          seed: seed ? parseInt(seed) : undefined
        }
      })

      const result = res.result

      if (result.success) {
        // 保存生成历史
        this._saveHistory(prompt.trim(), result.imageUrl, selectedSize)

        this.setData({
          imageUrl: result.imageUrl,
          loading: false
        })
      } else {
        this.setData({
          errorMsg: result.message || '生成失败',
          loading: false
        })
      }
    } catch (err) {
      console.error('调用失败:', err)
      this.setData({
        errorMsg: '网络错误，请稍后重试',
        loading: false
      })
    }
  },

  onPreviewImage() {
    const { imageUrl } = this.data
    if (imageUrl) {
      wx.previewImage({
        urls: [imageUrl],
        current: imageUrl
      })
    }
  },

  onCopyUrl() {
    const { imageUrl } = this.data
    if (!imageUrl) return
    wx.setClipboardData({
      data: imageUrl,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  onSaveImage() {
    const { imageUrl } = this.data
    if (!imageUrl) return

    wx.showLoading({ title: '保存中...' })

    // 下载图片到临时文件
    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
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
    return getShareAppMessage('AI 生图', '/pages/ai-image/ai-image')
  },

  onShareTimeline() {
    return getShareTimeline('AI 生图')
  },

  // 保存生成历史
  _saveHistory(prompt, imageUrl, size) {
    // 未登录不保存
    if (!app.isLoggedIn()) return

    const list = wx.getStorageSync(HISTORY_KEY) || []
    const now = new Date()
    const time = `${now.getMonth() + 1}-${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    list.unshift({
      id: Date.now(),
      prompt,
      imageUrl,
      size,
      time
    })

    // 最多保留50条
    wx.setStorageSync(HISTORY_KEY, list.slice(0, 50))
  }
})
