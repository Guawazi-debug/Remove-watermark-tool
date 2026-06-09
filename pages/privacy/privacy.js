const app = getApp()

Page({
  data: {
    privacyContent: ''
  },

  onLoad() {
    this.loadPrivacyContent()
  },

  // 加载隐私协议内容
  loadPrivacyContent() {
    // 从服务器获取隐私协议内容
    wx.request({
      url: app.globalData.apiBaseUrl + '/about.php',
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({
            privacyContent: res.data.data.privacy_content || this.getDefaultPrivacyContent()
          })
        } else {
          this.setData({
            privacyContent: this.getDefaultPrivacyContent()
          })
        }
      },
      fail: () => {
        this.setData({
          privacyContent: this.getDefaultPrivacyContent()
        })
      }
    })
  },

  // 获取默认隐私协议内容
  getDefaultPrivacyContent() {
    return `抹印小栈用户隐私保护指引

更新日期：2026年6月8日
生效日期：2026年6月8日

一、引言

欢迎使用抹印小栈小程序。我们非常重视用户的隐私保护。本隐私保护指引旨在向您说明我们如何收集、使用、存储和分享您的个人信息。

二、我们收集的信息

为保障小程序正常运行，我们会在您使用以下功能时收集相关信息：

1. 用户登录功能
   - 收集信息：微信昵称、微信头像
   - 使用目的：用于用户身份识别、个性化展示
   - 存储方式：加密存储于服务器，仅用于小程序功能展示

2. 工具使用统计
   - 收集信息：工具使用记录、IP地址
   - 使用目的：用于产品功能优化和数据分析
   - 存储方式：匿名化处理后存储

3. 意见反馈功能
   - 收集信息：反馈内容
   - 使用目的：用于问题处理和服务改进
   - 存储方式：加密存储于服务器

三、信息使用目的

我们收集的个人信息将用于以下目的：
1. 提供小程序核心功能
2. 优化产品体验
3. 处理用户反馈
4. 数据统计分析

四、信息保护措施

我们采取以下措施保护您的个人信息：
1. 数据加密存储
2. 访问权限控制
3. 安全审计机制
4. 定期数据清理

五、信息共享

我们不会向第三方分享您的个人信息，除非：
1. 获得您的明确同意
2. 法律法规要求
3. 保护公共利益

六、您的权利

您享有以下权利：
1. 查看您的个人信息
2. 更正您的个人信息
3. 删除您的个人信息
4. 撤回您的同意

七、联系我们

如您对本隐私保护指引有任何疑问，请联系我们：
- 邮箱：support@moyin.awenz.cn
- 小程序内反馈功能

八、更新说明

我们可能会不定期更新本隐私保护指引。更新后的指引将在小程序内公布。`
  },

  onShareAppMessage() {
    return {
      title: '工具小栈 - 实用小程序工具箱',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '工具小栈 - 实用小程序工具箱'
    }
  }
})
