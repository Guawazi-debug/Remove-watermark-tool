// pages/unicode/unicode.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: { inputText: '', outputText: '', mode: 'encode' },
  onInputChange(e) { this.setData({ inputText: e.detail.value }) },
  onModeChange(e) { this.setData({ mode: e.currentTarget.dataset.mode }) },
  onConvert() {
    const text = this.data.inputText
    if (!text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    if (this.data.mode === 'encode') {
      let result = ''
      for (let i = 0; i < text.length; i++) {
        result += '\\u' + text.charCodeAt(i).toString(16).padStart(4, '0')
      }
      this.setData({ outputText: result })
    } else {
      const result = text.replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16)))
      this.setData({ outputText: result })
    }
  },
  onCopy() { wx.setClipboardData({ data: this.data.outputText }) },
  onPaste() { wx.getClipboardData({ success: (res) => { if (res.data) this.setData({ inputText: res.data }) } }) },
  onSwap() { this.setData({ inputText: this.data.outputText, outputText: '', mode: this.data.mode === 'encode' ? 'decode' : 'encode' }) },
  onClear() { this.setData({ inputText: '', outputText: '' }) },

  onShareAppMessage() {
    return getShareAppMessage('Unicode', '/pages/unicode/unicode')
  },
  onShareTimeline() {
    return getShareTimeline('Unicode')
  }
})
