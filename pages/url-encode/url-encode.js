// pages/url-encode/url-encode.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    inputText: '',
    outputText: '',
    mode: 'encode',
    errorMsg: ''
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value, errorMsg: '' })
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, errorMsg: '' })
  },

  onConvert() {
    const text = this.data.inputText
    if (text === '') {
      this.setData({ errorMsg: '请输入内容' })
      return
    }
    try {
      if (this.data.mode === 'encode') {
        this.setData({ outputText: encodeURIComponent(text) })
      } else {
        this.setData({ outputText: decodeURIComponent(text) })
      }
    } catch (e) {
      this.setData({ errorMsg: '转换失败：' + e.message })
    }
  },

  onCopy() {
    wx.setClipboardData({ data: this.data.outputText })
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ inputText: res.data })
      }
    })
  },

  onClear() {
    this.setData({ inputText: '', outputText: '', errorMsg: '' })
  },

  onSwap() {
    this.setData({
      inputText: this.data.outputText,
      outputText: '',
      mode: this.data.mode === 'encode' ? 'decode' : 'encode',
      errorMsg: ''
    })
  },

  onShareAppMessage() {
    return getShareAppMessage('URL 编解码', '/pages/url-encode/url-encode')
  },
  onShareTimeline() {
    return getShareTimeline('URL 编解码')
  }
})
