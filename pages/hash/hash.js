const { md5, sha1, sha256 } = require('../../utils/hash')
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    inputText: '',
    results: {}
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  onCalc() {
    const text = this.data.inputText
    if (!text) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    this.setData({
      results: {
        md5: this._md5(text),
        sha1: this._sha1(text),
        sha256: this._sha256(text)
      }
    })
  },

  onCopy(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.value })
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ inputText: res.data })
      }
    })
  },

  onClear() {
    this.setData({ inputText: '', results: {} })
  },

  _md5(text) {
    return md5(text)
  },

  _sha1(text) {
    return sha1(text)
  },

  _sha256(text) {
    return sha256(text)
  },

  onShareAppMessage() {
    return getShareAppMessage('MD5 / SHA', '/pages/hash/hash')
  },
  onShareTimeline() {
    return getShareTimeline('MD5 / SHA')
  }
})
