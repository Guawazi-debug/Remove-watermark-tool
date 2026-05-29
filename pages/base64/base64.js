// pages/base64/base64.js
const { encodeBase64, decodeBase64ToString } = require('../../utils/encoding')

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
      this.setData({ errorMsg: '\u8BF7\u8F93\u5165\u5185\u5BB9' })
      return
    }

    try {
      const outputText = this.data.mode === 'encode' ? this._encode(text) : this._decode(text)
      this.setData({ outputText, errorMsg: '' })
    } catch (e) {
      this.setData({
        outputText: '',
        errorMsg: '\u8F6C\u6362\u5931\u8D25\uFF1A' + e.message
      })
    }
  },

  _encode(str) {
    return encodeBase64(str)
  },

  _decode(str) {
    return decodeBase64ToString(str)
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
  }
})
