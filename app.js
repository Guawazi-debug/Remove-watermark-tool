// app.js
App({
  globalData: {
    openid: '',
    userInfo: null,
    apiBaseUrl: 'https://moyin.awenz.cn/admin/api',
    apiReady: false,
    _loginCallback: null,  // 登录成功回调
    _privacyResolve: null,  // 隐私授权回调
    showPrivacyModal: false,  // 是否显示隐私弹窗
    privacySetting: null  // 隐私设置
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: "xiaozhan-d3gf24jlb2bb48af1",
        traceUser: true
      })
    }

    // 获取用户信息
    const userInfo = wx.getStorageSync('user-info')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }

    // 生成或获取openid
    this._initOpenid()

    // 隐私保护授权监听
    this._initPrivacy()

    // 延迟执行API请求，避免阻塞界面加载
    setTimeout(() => {
      this._syncLogin()
    }, 1000)
  },

  // 初始化隐私保护
  _initPrivacy() {
    // 获取隐私设置，检查是否需要弹窗
    if (typeof wx.getPrivacySetting === 'function') {
      wx.getPrivacySetting({
        success: (res) => {
          console.log('隐私设置:', res)
          this.globalData.privacySetting = res
          // 如果需要弹窗，通知页面
          if (res.needUpdate) {
            this.globalData.showPrivacyModal = true
          }
        }
      })
    }
  },

  // 检查是否已登录
  isLoggedIn() {
    const userInfo = wx.getStorageSync('user-info')
    return userInfo && userInfo.avatarUrl
  },

  // 显示登录弹窗
  showLoginModal(callback) {
    this.globalData._loginCallback = callback
    wx.switchTab({
      url: '/pages/profile/profile',
      success: () => {
        // 通知profile页面显示登录弹窗
        const pages = getCurrentPages()
        const profilePage = pages[pages.length - 1]
        if (profilePage) {
          setTimeout(() => {
            profilePage.onQuickLogin()
          }, 300)
        }
      }
    })
  },

  // 登录成功回调
  onLoginSuccess() {
    if (this.globalData._loginCallback) {
      const callback = this.globalData._loginCallback
      this.globalData._loginCallback = null
      callback()
    }
  },

  _initOpenid() {
    let openid = wx.getStorageSync('openid')
    if (!openid) {
      // 生成临时openid
      openid = 'wx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      wx.setStorageSync('openid', openid)
    }
    this.globalData.openid = openid
  },

  _syncLogin() {
    const userInfo = this.globalData.userInfo
    if (!userInfo) return

    // 如果头像URL已经是服务器上的永久URL，不需要重新上传
    if (userInfo.avatarUrl && userInfo.avatarUrl.indexOf('moyin.awenz.cn') > -1) {
      this._uploadLogin(userInfo, '')
      return
    }

    // 如果有头像URL，尝试读取并转换为base64
    if (userInfo.avatarUrl) {
      const fs = wx.getFileSystemManager()
      // 判断是否为本地临时文件路径
      if (userInfo.avatarUrl.startsWith('http://tmp/') || userInfo.avatarUrl.startsWith('wxfile://') || userInfo.avatarUrl.startsWith('https://tmp/')) {
        // 本地临时文件，尝试读取
        try {
          const base64 = fs.readFileSync(userInfo.avatarUrl, 'base64')
          this._uploadLogin(userInfo, base64)
        } catch (e) {
          console.log('本地头像读取失败，清除无效URL')
          // 清除无效的头像URL
          userInfo.avatarUrl = ''
          wx.setStorageSync('user-info', userInfo)
          this.globalData.userInfo = userInfo
          this._uploadLogin(userInfo, '')
        }
      } else if (userInfo.avatarUrl.startsWith('http://') || userInfo.avatarUrl.startsWith('https://')) {
        // 远程URL，下载后读取
        wx.downloadFile({
          url: userInfo.avatarUrl,
          timeout: 5000,
          success: (res) => {
            if (res.statusCode === 200) {
              try {
                const base64 = fs.readFileSync(res.tempFilePath, 'base64')
                this._uploadLogin(userInfo, base64)
              } catch (e) {
                console.log('头像读取失败', e)
                this._uploadLogin(userInfo, '')
              }
            } else {
              this._uploadLogin(userInfo, '')
            }
          },
          fail: () => {
            this._uploadLogin(userInfo, '')
          }
        })
      } else {
        this._uploadLogin(userInfo, '')
      }
    } else {
      this._uploadLogin(userInfo, '')
    }
  },

  _uploadLogin(userInfo, avatarBase64) {
    console.log('开始上传登录，头像数据长度:', avatarBase64 ? avatarBase64.length : 0)
    wx.request({
      url: this.globalData.apiBaseUrl + '/track.php',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        action: 'login',
        openid: this.globalData.openid,
        nickname: userInfo.nickName || '微信用户',
        avatar_url: userInfo.avatarUrl || '',
        avatar_data: avatarBase64
      },
      timeout: 8000,
      success: (res) => {
        console.log('登录同步成功', res.data)
        this.globalData.apiReady = true
        // 保存VIP状态到本地
        if (res.data && res.data.data && res.data.data.is_vip !== undefined) {
          wx.setStorageSync('vip-member', res.data.data.is_vip == 1)
        }
        // 如果服务器返回了头像URL，更新本地存储
        if (res.data && res.data.data) {
          const serverAvatarUrl = res.data.data.avatar_url
          console.log('服务器返回的头像URL:', serverAvatarUrl)
          if (serverAvatarUrl) {
            const savedUserInfo = wx.getStorageSync('user-info') || {}
            savedUserInfo.avatarUrl = serverAvatarUrl
            wx.setStorageSync('user-info', savedUserInfo)
            this.globalData.userInfo = savedUserInfo
            console.log('已更新本地头像URL为:', serverAvatarUrl)
          }
        }
      },
      fail: (err) => {
        console.log('登录同步失败，不影响使用', err)
        // 即使失败也不影响小程序使用
      }
    })
  },

  // 记录工具使用 - 后台异步执行
  trackToolUse(toolId) {
    if (!toolId || !this.globalData.openid) return

    // 使用setTimeout延迟执行，避免阻塞
    setTimeout(() => {
      wx.request({
        url: this.globalData.apiBaseUrl + '/track.php',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-API-Key': 'moyin-api-key-v1.2.0'
        },
        data: {
          action: 'track',
          openid: this.globalData.openid,
          tool_id: toolId
        },
        timeout: 5000,
        success: (res) => {
          console.log('使用记录成功', res.data)
        },
        fail: (err) => {
          console.log('使用记录失败，不影响使用', err)
        }
      })
    }, 100)
  },

  // 提交意见反馈
  submitFeedback(content, callback) {
    const userInfo = this.globalData.userInfo || {}
    wx.request({
      url: this.globalData.apiBaseUrl + '/feedback.php?action=submit',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        openid: this.globalData.openid,
        nickname: userInfo.nickName || '匿名用户',
        content: content
      },
      timeout: 5000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          callback && callback(true)
        } else {
          callback && callback(false)
        }
      },
      fail: () => {
        callback && callback(false)
      }
    })
  },

  // 获取我的反馈列表
  getMyFeedbackList(callback) {
    wx.request({
      url: this.globalData.apiBaseUrl + '/feedback.php?action=my',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        openid: this.globalData.openid
      },
      timeout: 5000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          callback && callback(res.data.data.list)
        } else {
          callback && callback([])
        }
      },
      fail: () => {
        callback && callback([])
      }
    })
  },

  // 获取我的通知列表
  getMyNotifications(callback) {
    wx.request({
      url: this.globalData.apiBaseUrl + '/notification.php?action=my',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        openid: this.globalData.openid
      },
      timeout: 5000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          callback && callback(res.data.data.list)
        } else {
          callback && callback([])
        }
      },
      fail: () => {
        callback && callback([])
      }
    })
  },

  // 获取未读通知数量
  getUnreadCount(callback) {
    wx.request({
      url: this.globalData.apiBaseUrl + '/notification.php?action=unread_count',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        openid: this.globalData.openid
      },
      timeout: 5000,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          callback && callback(res.data.data.count)
        } else {
          callback && callback(0)
        }
      },
      fail: () => {
        callback && callback(0)
      }
    })
  },

  // 标记通知已读
  markNotificationRead(notificationId, callback) {
    wx.request({
      url: this.globalData.apiBaseUrl + '/notification.php?action=read',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'moyin-api-key-v1.2.0'
      },
      data: {
        notification_id: notificationId,
        openid: this.globalData.openid
      },
      timeout: 5000,
      success: (res) => {
        callback && callback(res.data && res.data.code === 200)
      },
      fail: () => {
        callback && callback(false)
      }
    })
  }
})
