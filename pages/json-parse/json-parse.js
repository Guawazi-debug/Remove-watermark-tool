// pages/json-parse/json-parse.js
Page({
  data: {
    inputText: '',
    formattedText: '',
    errorMsg: '',
    parseTime: '',
    showResult: false,
    isMinified: false
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value, errorMsg: '' })
  },

  // 从剪贴板粘贴
  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ inputText: res.data, errorMsg: '' })
        }
      },
      fail: () => {
        this.setData({ errorMsg: '无法读取剪贴板，请手动粘贴' })
      }
    })
  },

  // 解析 JSON
  onParse() {
    const text = this.data.inputText.trim()
    if (!text) {
      this.setData({ errorMsg: '请输入 JSON 字符串' })
      return
    }
    const startTime = Date.now()
    try {
      const obj = JSON.parse(text)
      const formatted = JSON.stringify(obj, null, 2)
      this.setData({
        formattedText: formatted,
        errorMsg: '',
        parseTime: (Date.now() - startTime) + 'ms',
        showResult: true,
        isMinified: false
      })
    } catch (err) {
      this.setData({
        formattedText: '',
        errorMsg: 'JSON 格式错误：' + err.message,
        showResult: false
      })
    }
  },

  // 复制格式化结果
  onCopyResult() {
    wx.setClipboardData({
      data: this.data.formattedText,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 切换压缩/格式化
  onToggleFormat() {
    if (!this.data.formattedText) return
    if (this.data.isMinified) {
      // 恢复格式化
      const obj = JSON.parse(this.data.formattedText)
      this.setData({
        formattedText: JSON.stringify(obj, null, 2),
        isMinified: false
      })
    } else {
      // 压缩
      const obj = JSON.parse(this.data.formattedText)
      this.setData({
        formattedText: JSON.stringify(obj),
        isMinified: true
      })
    }
  },

  // 清空
  onClear() {
    this.setData({
      inputText: '',
      formattedText: '',
      errorMsg: '',
      parseTime: '',
      showResult: false,
      isMinified: false
    })
  }
})
