// pages/case-convert/case-convert.js
Page({
  data: {
    inputText: '',
    outputText: ''
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  onUpperCase() {
    this.setData({ outputText: this.data.inputText.toUpperCase() })
  },

  onLowerCase() {
    this.setData({ outputText: this.data.inputText.toLowerCase() })
  },

  onCapitalize() {
    const text = this.data.inputText.replace(/\b\w/g, c => c.toUpperCase())
    this.setData({ outputText: text })
  },

  onToggleCase() {
    const text = this.data.inputText.split('').map(c => {
      if (c === c.toUpperCase()) return c.toLowerCase()
      return c.toUpperCase()
    }).join('')
    this.setData({ outputText: text })
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
    this.setData({ inputText: '', outputText: '' })
  },

  onSwap() {
    this.setData({ inputText: this.data.outputText, outputText: '' })
  }
})
