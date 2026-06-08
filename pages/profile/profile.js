const { toolIndex } = require('../../utils/tool-meta')
const { recordUseCount } = require('../../utils/common')
const app = getApp()

const RECENT_TOOLS_KEY = 'recent-tools'
const FAVORITE_TOOLS_KEY = 'favorite-tools'
const USER_STATS_KEY = 'user-stats'
const VIP_KEY = 'vip-member'

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    isVip: false,
    unreadCount: 0,
    stats: {
      totalUseCount: 0,
      firstUseDate: '',
      favoriteCount: 0
    },
    recentTools: [],
    showFeedback: false,
    feedbackText: '',
    showLoginModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
    showAbout: false,
    aboutData: {
      content: '',
      version: '',
      update_log: ''
    }
  },

  onLoad(options) {
    this._loadData()
    // 请求用户信息授权
    this._authorizeUser()

    // 检查是否从外部触发登录弹窗
    if (options.showLogin === 'true') {
      setTimeout(() => {
        this.onQuickLogin()
      }, 300)
    }
  },

  // 请求用户信息授权
  _authorizeUser() {
    // 检查是否已授权
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          // 已授权，可以获取用户信息
          console.log('已授权用户信息')
        } else {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.userInfo',
            success: () => {
              console.log('用户信息授权成功')
            },
            fail: () => {
              console.log('用户信息授权失败')
            }
          })
        }
      }
    })
  },

  onShow() {
    this._loadData()

    // 检查登录状态变化，触发回调
    const app = getApp()
    if (app.globalData._loginCallback && this.data.hasUserInfo) {
      app.onLoginSuccess()
    }

    // 刷新未读通知数量
    if (this.data.hasUserInfo) {
      app.getUnreadCount((count) => {
        this.setData({ unreadCount: count })
      })
    }

    // 注册未读数更新回调
    app.globalData._unreadCountCallback = (count) => {
      this.setData({ unreadCount: count })
    }
  },

  onUnload() {
    // 清除未读数更新回调
    const app = getApp()
    app.globalData._unreadCountCallback = null
  },

  // 加载数据
  _loadData() {
    // 加载用户信息
    const userInfo = wx.getStorageSync('user-info')
    console.log('加载的用户信息:', userInfo)

    if (userInfo) {
      // 有用户信息，检查是否有有效的昵称或头像
      const hasValidInfo = (userInfo.nickName && userInfo.nickName !== '微信用户') || userInfo.avatarUrl
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    } else {
      this.setData({
        userInfo: null,
        hasUserInfo: false
      })
    }

    // 加载会员状态
    const isVip = wx.getStorageSync(VIP_KEY) || false
    this.setData({ isVip })

    // 加载使用统计
    const stats = wx.getStorageSync(USER_STATS_KEY) || {
      totalUseCount: 0,
      firstUseDate: new Date().toISOString().split('T')[0]
    }
    const favoriteIds = wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
    stats.favoriteCount = favoriteIds.length
    this.setData({ stats })

    // 加载最近使用
    const recentIds = wx.getStorageSync(RECENT_TOOLS_KEY) || []
    const recentTools = recentIds.slice(0, 5).map(id => toolIndex[id]).filter(Boolean)
    this.setData({ recentTools })

    // 加载未读通知数量
    if (this.data.hasUserInfo) {
      app.getUnreadCount((count) => {
        this.setData({ unreadCount: count })
      })
    }
  },

  // 一键登录 - 显示登录弹窗
  onQuickLogin() {
    this.setData({
      showLoginModal: true,
      tempAvatarUrl: '',
      tempNickName: ''
    })
  },

  // 关闭登录弹窗
  onCloseLoginModal() {
    this.setData({ showLoginModal: false })
  },

  // 选择头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    if (avatarUrl) {
      this.setData({ tempAvatarUrl: avatarUrl })
    }
  },

  // 输入昵称（手动输入）
  onTempNicknameInput(e) {
    console.log('输入昵称:', e.detail.value)
    this.setData({ tempNickName: e.detail.value })
  },

  // 昵称变化（选择微信昵称）
  onNicknameChange(e) {
    console.log('昵称变化:', e.detail.value)
    const nickName = e.detail.value
    if (nickName) {
      this.setData({ tempNickName: nickName })
    }
  },

  // 确认登录
  onConfirmLogin() {
    const { tempAvatarUrl, tempNickName } = this.data
    console.log('输入的昵称:', tempNickName)
    console.log('选择的头像:', tempAvatarUrl)

    // 验证昵称
    let nickName = tempNickName
    if (!nickName || !nickName.trim()) {
      // 如果没有输入昵称，尝试使用微信默认昵称
      nickName = '微信用户'
    } else {
      nickName = tempNickName.trim()
    }

    // 获取当前已有的头像URL（如果有的话）
    const existingUserInfo = wx.getStorageSync('user-info') || {}
    const existingAvatarUrl = existingUserInfo.avatarUrl || ''

    // 保存用户信息
    const userInfo = {
      avatarUrl: tempAvatarUrl || existingAvatarUrl,
      nickName: nickName
    }

    console.log('保存的用户信息:', userInfo)
    wx.setStorageSync('user-info', userInfo)
    app.globalData.userInfo = userInfo

    // 立即更新页面显示
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      showLoginModal: false
    })

    wx.showToast({ title: '登录成功', icon: 'success' })

    // 只有选择了新头像时才上传到服务器
    if (tempAvatarUrl && tempAvatarUrl !== existingAvatarUrl) {
      const fs = wx.getFileSystemManager()
      try {
        const base64 = fs.readFileSync(tempAvatarUrl, 'base64')
        console.log('读取头像成功，长度:', base64.length)
        // 上传头像到服务器
        wx.request({
          url: app.globalData.apiBaseUrl + '/track.php',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-API-Key': 'moyin-api-key-v1.2.0'
          },
          data: {
            action: 'login',
            openid: app.globalData.openid,
            nickname: nickName,
            avatar_url: tempAvatarUrl,
            avatar_data: base64
          },
          timeout: 8000,
          success: (res) => {
            console.log('登录同步成功', res.data)
            // 更新头像URL为服务器返回的永久URL
            if (res.data && res.data.data && res.data.data.avatar_url) {
              const savedUserInfo = wx.getStorageSync('user-info') || {}
              savedUserInfo.avatarUrl = res.data.data.avatar_url
              wx.setStorageSync('user-info', savedUserInfo)
              app.globalData.userInfo = savedUserInfo
              this.setData({ userInfo: savedUserInfo })
              console.log('头像已更新为:', res.data.data.avatar_url)
            }
          },
          fail: (err) => {
            console.log('登录同步失败', err)
          }
        })
      } catch (e) {
        console.log('读取头像失败:', e)
        // 读取失败，仅同步登录信息
        app._syncLogin()
      }
    } else {
      // 没有新头像，仅同步登录信息
      app._syncLogin()
    }
  },

  // 点击工具
  onToolTap(e) {
    const page = e.currentTarget.dataset.page
    const toolId = e.currentTarget.dataset.toolId
    if (toolId) {
      recordUseCount()
      app.trackToolUse(toolId)
    }
    wx.navigateTo({ url: page })
  },


  // 打开反馈弹窗
  onShowFeedback() {
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再提交反馈',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.onQuickLogin()
          }
        }
      })
      return
    }

    this.setData({
      showFeedback: true,
      feedbackText: ''
    })
  },

  // 关闭反馈弹窗
  onHideFeedback() {
    this.setData({ showFeedback: false })
  },

  // 阻止弹窗内容区域的触摸移动事件
  preventMove() {
    return
  },

  // 输入反馈内容
  onFeedbackInput(e) {
    this.setData({ feedbackText: e.detail.value })
  },

  // 提交反馈
  onSubmitFeedback() {
    const { feedbackText } = this.data
    if (!feedbackText.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    // 提交到服务器
    app.submitFeedback(feedbackText.trim(), (success) => {
      wx.hideLoading()
      if (success) {
        this.setData({ showFeedback: false, feedbackText: '' })
        wx.showToast({ title: '感谢反馈', icon: 'success' })
      } else {
        // 服务器提交失败，保存到本地
        const feedbacks = wx.getStorageSync('feedbacks') || []
        feedbacks.unshift({
          content: feedbackText.trim(),
          time: new Date().toISOString()
        })
        wx.setStorageSync('feedbacks', feedbacks.slice(0, 50))
        this.setData({ showFeedback: false, feedbackText: '' })
        wx.showToast({ title: '已保存到本地', icon: 'success' })
      }
    })
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？这不会删除你的收藏和设置',
      success: (res) => {
        if (res.confirm) {
          // 清除最近使用记录
          wx.removeStorageSync(RECENT_TOOLS_KEY)
          // 重置使用统计
          wx.setStorageSync(USER_STATS_KEY, {
            totalUseCount: 0,
            firstUseDate: new Date().toISOString().split('T')[0]
          })
          this._loadData()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  // 跳转反馈列表
  onFeedbackList() {
    wx.navigateTo({
      url: '/pages/feedback-list/feedback-list'
    })
  },

  // 跳转通知列表
  onNotificationList() {
    wx.navigateTo({
      url: '/pages/notification-list/notification-list'
    })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('user-info')
          this.setData({
            userInfo: null,
            hasUserInfo: false
          })

          // 清除全局登录状态
          const app = getApp()
          app.globalData.userInfo = null

          wx.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  },

  // 关于我们
  onAbout() {
    wx.showLoading({ title: '加载中...' })

    // 从服务器获取关于我们内容
    wx.request({
      url: app.globalData.apiBaseUrl + '/about.php',
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.code === 200 && res.data.data) {
          const data = res.data.data
          this.setData({
            aboutData: {
              content: data.content || '一个实用的微信小程序工具箱，提供30+款开发和生活工具。',
              version: data.version || 'v1.3.0',
              update_log: data.update_log || ''
            },
            showAbout: true
          })
        } else {
          this._showDefaultAbout()
        }
      },
      fail: () => {
        wx.hideLoading()
        this._showDefaultAbout()
      }
    })
  },

  // 显示默认关于我们
  _showDefaultAbout() {
    this.setData({
      aboutData: {
        content: '一个实用的微信小程序工具箱，提供30+款开发和生活工具。',
        version: 'v1.3.0',
        update_log: ''
      },
      showAbout: true
    })
  },

  // 关闭关于我们弹窗
  onCloseAbout() {
    this.setData({ showAbout: false })
  },

  // 查看隐私协议
  onViewPrivacy() {
    // 检查API是否可用
    if (typeof wx.openPrivacyContract === 'function') {
      wx.openPrivacyContract({
        success: () => {},
        fail: () => {
          wx.showToast({ title: '打开失败', icon: 'none' })
        }
      })
    } else {
      // 降级方案：跳转到隐私协议页面
      wx.navigateTo({
        url: '/pages/privacy/privacy'
      })
    }
  }
})
