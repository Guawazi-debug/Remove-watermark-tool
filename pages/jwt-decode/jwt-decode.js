const { base64UrlDecodeToString } = require('../../utils/encoding')
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    inputText: '',
    header: '',
    payload: '',
    errorMsg: ''
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value, errorMsg: '' })
  },

  onDecode() {
    const token = this.data.inputText.trim()
    if (!token) {
      this.setData({ errorMsg: '请输入 JWT Token' })
      return
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      this.setData({ errorMsg: '无效的 JWT 格式，应包含三部分' })
      return
    }

    try {
      const header = JSON.parse(this._base64UrlDecode(parts[0]))
      const payload = JSON.parse(this._base64UrlDecode(parts[1]))
      this.setData({
        header: JSON.stringify(header, null, 2),
        payload: JSON.stringify(payload, null, 2),
        errorMsg: ''
      })
    } catch (e) {
      this.setData({
        errorMsg: `解码失败：${e.message}`,
        header: '',
        payload: ''
      })
    }
  },

  _base64UrlDecode(str) {
    return base64UrlDecodeToString(str)
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ inputText: res.data })
      }
    })
  },

  onClear() {
    this.setData({ inputText: '', header: '', payload: '', errorMsg: '' })
  },

  onShareAppMessage() {
    return getShareAppMessage('JWT 解析', '/pages/jwt-decode/jwt-decode')
  },
  onShareTimeline() {
    return getShareTimeline('JWT 解析')
  }
})
