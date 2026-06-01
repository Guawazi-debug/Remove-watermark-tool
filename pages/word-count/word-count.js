// pages/word-count/word-count.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    inputText: '',
    stats: null
  },

  onInputChange(e) {
    const text = e.detail.value
    this.setData({ inputText: text })
    this._calcStats(text)
  },

  _calcStats(text) {
    if (!text) {
      this.setData({ stats: null })
      return
    }
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const chinese = (text.match(/[一-龥]/g) || []).length
    const english = (text.match(/[a-zA-Z]/g) || []).length
    const numbers = (text.match(/[0-9]/g) || []).length

    this.setData({
      stats: { chars, charsNoSpace, words, lines, chinese, english, numbers }
    })
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ inputText: res.data })
          this._calcStats(res.data)
        }
      }
    })
  },

  onClear() {
    this.setData({ inputText: '', stats: null })
  },

  onShareAppMessage() {
    return getShareAppMessage('字数统计', '/pages/word-count/word-count')
  },
  onShareTimeline() {
    return getShareTimeline('字数统计')
  }
})
