// pages/html-escape/html-escape.js
Page({
  data: { inputText: '', outputText: '', mode: 'encode' },
  onInputChange(e) { this.setData({ inputText: e.detail.value }) },
  onModeChange(e) { this.setData({ mode: e.currentTarget.dataset.mode }) },
  onConvert() {
    const text = this.data.inputText
    if (!text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    if (this.data.mode === 'encode') {
      const result = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      this.setData({ outputText: result })
    } else {
      const result = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      this.setData({ outputText: result })
    }
  },
  onCopy() { wx.setClipboardData({ data: this.data.outputText }) },
  onPaste() { wx.getClipboardData({ success: (res) => { if (res.data) this.setData({ inputText: res.data }) } }) },
  onSwap() { this.setData({ inputText: this.data.outputText, outputText: '', mode: this.data.mode === 'encode' ? 'decode' : 'encode' }) },
  onClear() { this.setData({ inputText: '', outputText: '' }) }
})
