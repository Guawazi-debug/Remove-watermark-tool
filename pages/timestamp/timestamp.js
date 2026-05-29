const { parseDateTime, formatDateTime } = require('../../utils/date')

Page({
  data: {
    timestamp: '',
    dateStr: '',
    currentDate: '',
    currentTime: '',
    mode: 'toDate'
  },

  onLoad() {
    this._updateCurrentTime()
  },

  _updateCurrentTime() {
    const now = new Date()
    this.setData({
      currentDate: formatDateTime(now),
      currentTime: String(Math.floor(now.getTime() / 1000))
    })
  },

  onTimestampChange(e) {
    this.setData({ timestamp: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ dateStr: e.detail.value })
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  onConvert() {
    if (this.data.mode === 'toDate') {
      const raw = String(this.data.timestamp || '').trim()
      if (!/^-?\d+$/.test(raw)) {
        wx.showToast({ title: '请输入有效时间戳', icon: 'none' })
        return
      }

      const ts = Number(raw)
      const milliseconds = Math.abs(ts) >= 1e12 ? ts : ts * 1000
      const date = new Date(milliseconds)
      if (Number.isNaN(date.getTime())) {
        wx.showToast({ title: '时间戳格式无效', icon: 'none' })
        return
      }

      this.setData({ dateStr: formatDateTime(date) })
      return
    }

    const date = parseDateTime(this.data.dateStr)
    if (!date) {
      wx.showToast({ title: '请输入有效日期时间', icon: 'none' })
      return
    }

    this.setData({ timestamp: String(Math.floor(date.getTime() / 1000)) })
  },

  onUseCurrent() {
    this._updateCurrentTime()
    this.setData({ timestamp: this.data.currentTime })
  },

  onCopy() {
    const text = this.data.mode === 'toDate' ? this.data.dateStr : this.data.timestamp
    wx.setClipboardData({ data: text })
  },

  onClear() {
    this.setData({ timestamp: '', dateStr: '' })
  }
})
