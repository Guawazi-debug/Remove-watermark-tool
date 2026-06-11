const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

const app = getApp()
const HISTORY_KEY = 'ai-image-history'

Page({
  data: {
    prompt: '',
    showSettings: false,
    selectedModel: 'hunyuan',
    selectedSize: '1024x1024',
    revise: true,
    footnote: '',
    seed: '',
    sizeOptions: [
      { label: '1:1', value: '1024x1024' },
      { label: '4:3', value: '1024x768' },
      { label: '3:4', value: '768x1024' }
    ],
    gptSizeOptions: [
      { label: '1:1', value: '1024x1024' },
      { label: '16:9', value: '3840x2160' },
      { label: '9:16', value: '2160x3840' }
    ],
    loading: false,
    imageUrl: '',
    errorMsg: ''
  },

  onPromptInput(e) {
    this.setData({ prompt: e.detail.value })
  },

  onModelTap(e) {
    const model = e.currentTarget.dataset.model
    this.setData({
      selectedModel: model,
      selectedSize: model === 'gpt' ? '3840x2160' : '1024x1024',
      imageUrl: '',
      errorMsg: ''
    })
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
    const { prompt, selectedModel, selectedSize, revise, footnote, seed } = this.data

    if (!prompt.trim()) {
      wx.showToast({ title: '请输入图片描述', icon: 'none' })
      return
    }

    this.setData({ loading: true, errorMsg: '', imageUrl: '' })

    try {
      let imageUrl = ''

      if (selectedModel === 'hunyuan') {
        // 混元生图（云函数）
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
          imageUrl = result.imageUrl
        } else {
          throw new Error(result.message || '生成失败')
        }
      } else {
        // GPT生图（直接调用API）
        const res = await this._callGptApi(prompt.trim(), selectedSize)
        imageUrl = res
      }

      if (imageUrl) {
        // 保存生成历史
        this._saveHistory(prompt.trim(), imageUrl, selectedSize)

        this.setData({
          imageUrl: imageUrl,
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

  // 调用GPT生图API（通过代理）
  _callGptApi(prompt, size) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.apiBaseUrl + '/gpt_image.php',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-API-Key': 'moyin-api-key-v1.2.0'
        },
        data: {
          prompt: prompt,
          size: size
        },
        timeout: 120000,
        success: (res) => {
          if (res.data && res.data.code === 200 && res.data.url) {
            resolve(res.data.url)
          } else {
            reject(new Error(res.data.message || '生成失败'))
          }
        },
        fail: (err) => {
          reject(new Error('网络错误'))
        }
      })
    })
  },

  // 保存生成历史
  _saveHistory(prompt, imageUrl, size) {
    // 未登录不保存
    if (!app.isLoggedIn()) return

    // 保存到服务器（图片URL存在服务器，不存本地）
    wx.request({
      url: app.globalData.apiBaseUrl + '/image_history.php?action=save',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        openid: app.globalData.openid,
        prompt: prompt,
        image_url: imageUrl,
        size: size
      },
      timeout: 10000,
      success: (res) => {
        console.log('生图历史保存到服务器成功', res.data)
      },
      fail: (err) => {
        console.error('生图历史保存到服务器失败', err)
      }
    })
  }
})
