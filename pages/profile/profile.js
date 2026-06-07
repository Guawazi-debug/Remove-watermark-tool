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
    tempNickName: ''
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
      nickName = nickName.trim()
    }

    const userInfo = {
      avatarUrl: tempAvatarUrl || '',
      nickName: nickName
    }

    console.log('保存的用户信息:', userInfo)
    wx.setStorageSync('user-info', userInfo)

    // 立即更新页面显示
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      showLoginModal: false
    })

    wx.showToast({ title: '登录成功', icon: 'success' })
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
    this.setData({
      showFeedback: true,
      feedbackText: ''
    })
  },

  // 关闭反馈弹窗
  onHideFeedback() {
    this.setData({ showFeedback: false })
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
    wx.showModal({
      title: '关于工具小栈',
      content: '版本：v1.1.0\n\n一个实用的微信小程序工具箱，提供30+款开发和生活工具。',
      showCancel: false
    })
  }
})
