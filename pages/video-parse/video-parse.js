// pages/video-parse/video-parse.js

// ========== 接口配置 ==========
const PARSE_API = 'https://qsy.awenz.cn/api.php'
// =============================

Page({
  data: {
    inputUrl: '',
    loading: false,
    result: null,
    hasResolvedResult: false,
    isDownloading: false,
    downloadProgress: 0,
    downloadStatusText: '',
    errorMsg: '',
    serviceHint: '解析依赖外部服务与平台下载权限，若保存失败会自动复制视频链接。',
    parseSuccessText: ''
  },

  // 从文本中提取 URL
  extractUrl(str) {
    const match = str.match(/https?:\/\/[^\s]+/)
    return match ? match[0] : ''
  },

  _pickFirstValue(source, keys) {
    for (let i = 0; i < keys.length; i++) {
      const value = source && source[keys[i]]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  },

  _normalizeUrl(url) {
    if (typeof url !== 'string') {
      return ''
    }

    const trimmed = url.trim()
    if (!trimmed) {
      return ''
    }

    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`
    }

    if (trimmed.startsWith('http://')) {
      return `https://${trimmed.slice(7)}`
    }

    return trimmed
  },

  _normalizeParseResult(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      return null
    }

    const type = this._pickFirstValue(rawData, ['type']) || 'video'
    const playUrl = this._normalizeUrl(this._pickFirstValue(rawData, ['playUrl', 'play_url', 'video', 'url', 'src']))
    const downloadUrl = this._normalizeUrl(this._pickFirstValue(rawData, ['downloadUrl', 'download_url', 'videoUrl', 'video_url', 'mp4', 'file']))
    const cover = this._normalizeUrl(this._pickFirstValue(rawData, ['cover', 'pic', 'image', 'poster', 'coverUrl', 'cover_url']))
    const title = this._pickFirstValue(rawData, ['title', 'desc', 'name', 'text'])
    const onlineUrl = this._normalizeUrl(this._pickFirstValue(rawData, ['onlineUrl', 'online_url', 'pageUrl', 'page_url', 'shareUrl', 'share_url']))
    const author = this._pickFirstValue(rawData, ['author', 'nickname', 'userName', 'user_name'])
    const video = playUrl || downloadUrl

    // 处理图片类型
    if (type === 'images') {
      const images = rawData.images || []
      const music = this._normalizeUrl(this._pickFirstValue(rawData, ['music']))
      if (images.length === 0 && !title && !author) {
        return null
      }
      return {
        title: title || '解析结果',
        video: '',
        playUrl: '',
        downloadUrl: '',
        cover: images[0] || '',
        onlineUrl,
        author,
        type: 'images',
        images: images.map(url => this._normalizeUrl(url)).filter(Boolean),
        music,
        raw: rawData
      }
    }

    if (!video && !cover && !title && !onlineUrl && !author) {
      return null
    }

    return {
      title: title || '解析结果',
      video,
      playUrl,
      downloadUrl,
      cover,
      onlineUrl,
      author,
      type: 'video',
      raw: rawData
    }
  },

  _getDownloadTarget(result) {
    if (!result || typeof result !== 'object') {
      return ''
    }
    return result.downloadUrl || result.video || result.playUrl || result.onlineUrl || ''
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
    const url = this.extractUrl(this.data.inputUrl.trim())
    if (!url) {
      this.setData({ errorMsg: '请输入视频链接' })
      return
    }
    this.setData({ inputUrl: url })
    this.setData({ loading: true, errorMsg: '', result: null, hasResolvedResult: false, parseSuccessText: '' })

    wx.request({
      url: PARSE_API + '?url=' + encodeURIComponent(url),
      method: 'GET',
      timeout: 12000,
      success: (res) => {
        const data = res.data && typeof res.data === 'object' ? res.data.data : null
        const normalized = this._normalizeParseResult(data)
        if (res.statusCode === 200 && res.data && res.data.code === 200 && normalized) {
          this.setData({
            result: normalized,
            hasResolvedResult: true,
            parseSuccessText: res.data.msg || '解析成功'
          })
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

  // 保存到相册
  onDownload() {
    if (this.data.isDownloading) {
      wx.showToast({ title: '正在下载，请勿重复点击', icon: 'none' })
      return
    }

    const result = this.data.result

    // 图片类型：逐张保存
    if (result && result.type === 'images' && result.images && result.images.length > 0) {
      this._saveImages(result.images)
      return
    }

    const downloadTarget = this._getDownloadTarget(result)
    if (!downloadTarget) {
      this.setData({ errorMsg: '当前结果未提供可下载地址，请先复制在线播放地址。' })
      return
    }

    this.setData({
      errorMsg: '',
      isDownloading: true,
      downloadProgress: 0,
      downloadStatusText: '准备下载...'
    })
    const task = wx.downloadFile({
      url: downloadTarget,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          this.setData({
            downloadProgress: 100,
            downloadStatusText: '下载完成，准备保存到相册...'
          })
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              this.setData({
                isDownloading: false,
                downloadStatusText: ''
              })
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: () => {
              this.setData({
                isDownloading: false,
                downloadStatusText: ''
              })
              this.setData({ errorMsg: '保存到相册失败，已为你切换到复制链接方案。' })
              this.copyLink(downloadTarget, {
                title: '下载地址已复制',
                modal: true
              })
            }
          })
        } else {
          this.setData({
            isDownloading: false,
            downloadStatusText: ''
          })
          this.setData({ errorMsg: '下载地址不可直接保存，已为你切换到复制链接方案。' })
          this.copyLink(downloadTarget, {
            title: '下载地址已复制',
            modal: true
          })
        }
      },
      fail: () => {
        this.setData({
          isDownloading: false,
          downloadStatusText: ''
        })
        this.setData({ errorMsg: '下载失败，已为你切换到复制链接方案。' })
        this.copyLink(downloadTarget, {
          title: '下载地址已复制',
          modal: true
        })
      }
    })

    if (task && typeof task.onProgressUpdate === 'function') {
      task.onProgressUpdate((progress) => {
        this.setData({
          downloadProgress: progress.progress || 0,
          downloadStatusText: `下载中 ${progress.progress || 0}%`
        })
      })
    }
  },

  // 保存图片列表到相册
  _saveImages(images) {
    if (!images || images.length === 0) return

    this.setData({
      errorMsg: '',
      isDownloading: true,
      downloadProgress: 0,
      downloadStatusText: `准备保存 ${images.length} 张图片...`
    })

    let savedCount = 0
    let failCount = 0

    const onComplete = () => {
      this.setData({ isDownloading: false, downloadStatusText: '' })
      if (failCount > 0 && savedCount === 0) {
        this.setData({ errorMsg: '保存到相册失败，已为你切换到复制链接方案。' })
        this.copyLink(images.join('\n'), {
          title: '图片地址已复制',
          modal: true
        })
      } else if (failCount > 0) {
        const msg = `已保存 ${savedCount} 张，${failCount} 张失败，失败地址已复制`
        this.copyLink(images.slice(savedCount).join('\n'), {
          title: msg,
          modal: true
        })
      } else {
        wx.showToast({ title: `已保存 ${savedCount} 张图片`, icon: 'success' })
      }
    }

    images.forEach((imageUrl, index) => {
      wx.downloadFile({
        url: imageUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                savedCount++
                const progress = Math.round(((savedCount + failCount) / images.length) * 100)
                this.setData({
                  downloadProgress: progress,
                  downloadStatusText: `已保存 ${savedCount}/${images.length}`
                })
                if (savedCount + failCount === images.length) onComplete()
              },
              fail: () => {
                failCount++
                if (savedCount + failCount === images.length) onComplete()
              }
            })
          } else {
            failCount++
            if (savedCount + failCount === images.length) onComplete()
          }
        },
        fail: () => {
          failCount++
          if (savedCount + failCount === images.length) onComplete()
        }
      })
    })
  },

  onCopyPlayUrl() {
    const playUrl = this.data.result && (this.data.result.playUrl || this.data.result.video || '')
    if (!playUrl) {
      this.setData({ errorMsg: '当前结果未提供在线播放地址。' })
      return
    }
    this.copyLink(playUrl, {
      title: '播放地址已复制',
      modal: false,
      toast: true
    })
  },

  onCopyDownloadUrl() {
    const downloadUrl = this._getDownloadTarget(this.data.result)
    if (!downloadUrl) {
      this.setData({ errorMsg: '当前结果未提供下载地址。' })
      return
    }
    this.copyLink(downloadUrl, {
      title: '下载地址已复制',
      modal: false,
      toast: true
    })
  },

  onCopyOnlineUrl() {
    const onlineUrl = this.data.result && this.data.result.onlineUrl || ''
    if (!onlineUrl) {
      this.setData({ errorMsg: '当前结果未提供在线页面地址。' })
      return
    }
    this.copyLink(onlineUrl, {
      title: '页面地址已复制',
      modal: false,
      toast: true
    })
  },

  // 复制链接降级方案
  copyLink(url, options) {
    const config = typeof options === 'string'
      ? { title: options, modal: true, toast: false }
      : Object.assign({ title: '链接已复制', modal: true, toast: false }, options || {})
    wx.setClipboardData({
      data: url,
      success: () => {
        if (config.toast) {
          wx.showToast({ title: config.title, icon: 'success' })
        }
        if (config.modal) {
          wx.showModal({
            title: config.title,
            content: '小程序内无法直接保存，视频链接已复制到剪贴板，请在浏览器中打开下载',
            showCancel: false,
            confirmText: '知道了'
          })
        }
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

  // 图片点击预览
  onImageTap(e) {
    const index = e.currentTarget.dataset.index || 0
    const images = (this.data.result && this.data.result.images) || []
    if (images.length === 0) return
    wx.previewImage({
      current: images[index],
      urls: images
    })
  },

  // 复制图片地址
  onCopyImageUrl(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    this.copyLink(url, {
      title: '图片地址已复制',
      modal: false,
      toast: true
    })
  },

  // 清空输入
  onClear() {
    this.setData({
      inputUrl: '',
      result: null,
      hasResolvedResult: false,
      isDownloading: false,
      downloadProgress: 0,
      downloadStatusText: '',
      errorMsg: '',
      parseSuccessText: ''
    })
  }
})
