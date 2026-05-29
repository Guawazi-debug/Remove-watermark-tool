// pages/text-dedup/text-dedup.js
Page({
  data: { inputText: '', result: '', beforeCount: 0, afterCount: 0 },
  onInputChange(e) { this.setData({ inputText: e.detail.value }) },
  onDedup() {
    const text = this.data.inputText
    if (!text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    const lines = text.split('\n')
    const unique = [...new Set(lines)]
    this.setData({
      result: unique.join('\n'),
      beforeCount: lines.length,
      afterCount: unique.length
    })
  },
  onCopy() { wx.setClipboardData({ data: this.data.result }) },
  onPaste() { wx.getClipboardData({ success: (res) => { if (res.data) this.setData({ inputText: res.data }) } }) },
  onClear() { this.setData({ inputText: '', result: '', beforeCount: 0, afterCount: 0 }) }
})
