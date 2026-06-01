// pages/radix/radix.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    // 数字转进制
    decInput: '',
    toResults: null,

    // 进制转数字
    fromBase: 16,
    fromInput: '',
    fromResults: null
  },

  // 数字转进制 - 输入
  onDecInputChange(e) {
    this.setData({ decInput: e.detail.value })
  },

  // 数字转进制 - 转换
  onToConvert() {
    const raw = String(this.data.decInput || '').trim()
    if (!/^-?\d+$/.test(raw)) {
      wx.showToast({ title: '请输入整数', icon: 'none' })
      return
    }

    const val = parseInt(raw, 10)
    this.setData({
      toResults: {
        bin: val.toString(2),
        oct: val.toString(8),
        hex: val.toString(16).toUpperCase()
      }
    })
  },

  // 进制转数字 - 选择进制
  onFromBaseChange(e) {
    this.setData({ fromBase: parseInt(e.currentTarget.dataset.base) })
  },

  // 进制转数字 - 输入
  onFromInputChange(e) {
    this.setData({ fromInput: e.detail.value })
  },

  // 进制转数字 - 转换
  onFromConvert() {
    const { fromBase } = this.data
    const fromInput = String(this.data.fromInput || '').trim()
    if (!fromInput) {
      wx.showToast({ title: '请输入数值', icon: 'none' })
      return
    }

    if (!this._isValidForBase(fromInput, fromBase)) {
      wx.showToast({ title: '输入格式错误', icon: 'none' })
      return
    }

    const dec = parseInt(fromInput, fromBase)
    this.setData({
      fromResults: {
        dec: dec.toString(10),
        bin: dec.toString(2),
        oct: dec.toString(8),
        hex: dec.toString(16).toUpperCase()
      }
    })
  },

  onCopy(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.value })
  },

  _isValidForBase(value, base) {
    const patterns = {
      2: /^-?[01]+$/,
      8: /^-?[0-7]+$/,
      10: /^-?\d+$/,
      16: /^-?[0-9a-fA-F]+$/
    }

    const pattern = patterns[base]
    return pattern ? pattern.test(value) : false
  },

  onClear() {
    this.setData({
      decInput: '',
      toResults: null,
      fromInput: '',
      fromResults: null
    })
  },

  onShareAppMessage() {
    return getShareAppMessage('进制转换', '/pages/radix/radix')
  },
  onShareTimeline() {
    return getShareTimeline('进制转换')
  }
})
