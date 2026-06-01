const { getRandomInt } = require('../../utils/random')
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    uuids: [],
    count: 1
  },

  onCountChange(e) {
    const count = parseInt(e.detail.value, 10) || 1
    this.setData({ count: Math.min(Math.max(count, 1), 50) })
  },

  onGenerate() {
    const uuids = []
    for (let i = 0; i < this.data.count; i++) {
      uuids.push(this._generateUUID())
    }
    this.setData({ uuids })
  },

  _generateUUID() {
    const hex = []
    for (let i = 0; i < 16; i++) {
      hex.push(getRandomInt(256))
    }
    hex[6] = (hex[6] & 0x0f) | 0x40
    hex[8] = (hex[8] & 0x3f) | 0x80

    const bytes = hex.map(value => value.toString(16).padStart(2, '0'))
    return `${bytes[0]}${bytes[1]}${bytes[2]}${bytes[3]}-${bytes[4]}${bytes[5]}-${bytes[6]}${bytes[7]}-${bytes[8]}${bytes[9]}-${bytes[10]}${bytes[11]}${bytes[12]}${bytes[13]}${bytes[14]}${bytes[15]}`
  },

  onCopyAll() {
    wx.setClipboardData({
      data: this.data.uuids.join('\n'),
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  onCopyOne(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.uuid })
  },

  onClear() {
    this.setData({ uuids: [] })
  },

  onShareAppMessage() {
    return getShareAppMessage('UUID 生成', '/pages/uuid/uuid')
  },
  onShareTimeline() {
    return getShareTimeline('UUID 生成')
  }
})
