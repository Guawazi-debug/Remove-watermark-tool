// pages/index/index.js

// ========== 接口配置 ==========
const PARSE_API = 'https://qsy.awenz.cn/api.php'
// =============================

Page({
  data: {
    inputUrl: '',
    loading: false,
    result: null,
    errorMsg: ''
  },


  // 从文本中提取 URL
  extractUrl(str) {
    const match = str.match(/https?:\/\/[^\s]+/)
    return match ? match[0] : ''
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({ inputUrl: e.detail.value, errorMsg: '' })
  },

  // 粘贴按钮 - 自动读取剪贴板
  onPaste() {
    this.setData({ errorMsg: '' })
    wx.getClipboardData({
      success: (res) => {
        const text = (res.data || '').trim()
        const url = this.extractUrl(text)
        if (url) {
          this.setData({ inputUrl: url })
        } else {
          this.setData({ inputUrl: text })
        }
      },
      fail: () => {
        this.setData({ errorMsg: '无法读取剪贴板，请手动粘贴' })
      }
    })
  },

  // 解析视频
  onParse() {
    // 自动从输入文本中提取 URL
    const url = this.extractUrl(this.data.inputUrl.trim())
    if (!url) {
      this.setData({ errorMsg: '请输入视频链接' })
      return
    }
    // 回填提取到的纯链接
    this.setData({ inputUrl: url })

    this.setData({ loading: true, errorMsg: '', result: null })

    wx.request({
      url: PARSE_API + '?url=' + encodeURIComponent(url),
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          // 返回格式: { code, msg, data: { title, cover, video, type, author } }
          this.setData({ result: res.data.data })
        } else {
          this.setData({ errorMsg: (res.data && res.data.msg) || '解析失败，请检查链接是否正确' })
        }
      },
      fail: () => {
        this.setData({ errorMsg: '网络请求失败，请稍后重试' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 保存到相册，失败则复制链接
  onDownload() {
    const result = this.data.result
    if (!result || !result.video) return

    wx.showLoading({ title: '下载中...' })
    wx.downloadFile({
      url: result.video,
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: () => {
              this.copyLink(result.video)
            }
          })
        } else {
          this.copyLink(result.video)
        }
      },
      fail: () => {
        wx.hideLoading()
        this.copyLink(result.video)
      }
    })
  },

  // 复制链接降级方案
  copyLink(url) {
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: '链接已复制',
          content: '小程序内无法直接保存，视频链接已复制到剪贴板，请在浏览器中打开下载',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 视频点击暂停/播放
  onVideoTap() {
    const videoCtx = wx.createVideoContext('videoPlayer', this)
    if (this.data._paused) {
      videoCtx.play()
      this.setData({ _paused: false })
    } else {
      videoCtx.pause()
      this.setData({ _paused: true })
    }
  },

  // 全屏状态变化
  onFullscreenChange(e) {
    this.setData({ _isFullscreen: e.detail.fullScreen })
  },

  // 清空输入
  onClear() {
    this.setData({ inputUrl: '', result: null, errorMsg: '' })
  }
})
