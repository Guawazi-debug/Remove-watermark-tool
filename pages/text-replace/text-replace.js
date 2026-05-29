// pages/text-replace/text-replace.js
Page({
  data: {
    inputText: '',
    findText: '',
    replaceText: '',
    result: '',
    replaceCount: 0
  },

  onInputChange(e) { this.setData({ inputText: e.detail.value }) },
  onFindChange(e) { this.setData({ findText: e.detail.value }) },
  onReplaceChange(e) { this.setData({ replaceText: e.detail.value }) },

  onReplace() {
    const { inputText, findText, replaceText } = this.data
    if (!inputText || !findText) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    const regex = new RegExp(this._escapeRegex(findText), 'g')
    const matches = inputText.match(regex)
    const result = inputText.replace(regex, replaceText)
    this.setData({
      result,
      replaceCount: matches ? matches.length : 0
    })
  },

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },

  onCopy() { wx.setClipboardData({ data: this.data.result }) },
  onPaste() {
    wx.getClipboardData({
      success: (res) => { if (res.data) this.setData({ inputText: res.data }) }
    })
  },
  onClear() { this.setData({ inputText: '', findText: '', replaceText: '', result: '', replaceCount: 0 }) }
})
