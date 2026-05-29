// pages/css-unit/css-unit.js
Page({
  data: {
    inputValue: '16',
    baseSize: '375',
    results: {}
  },
  onLoad() { this._convert() },
  onInputChange(e) { this.setData({ inputValue: e.detail.value }); this._convert() },
  onBaseChange(e) { this.setData({ baseSize: e.detail.value }); this._convert() },
  _convert() {
    const px = parseFloat(this.data.inputValue)
    const base = parseFloat(this.data.baseSize)
    if (isNaN(px) || !Number.isFinite(base) || base <= 0) {
      this.setData({ results: {} })
      return
    }

    const fontSize = 16
    this.setData({
      results: {
        px: px.toFixed(2),
        rem: (px / fontSize).toFixed(4),
        em: (px / fontSize).toFixed(4),
        vw: ((px / base) * 100).toFixed(4),
        vh: ((px / 667) * 100).toFixed(4),
        rpx: ((px / base) * 750).toFixed(2)
      }
    })
  },
  onCopy(e) { wx.setClipboardData({ data: e.currentTarget.dataset.value }) }
})
