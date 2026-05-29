// pages/json-generate/json-generate.js
Page({
  data: {
    inputText: '',
    generatedJson: '',
    errorMsg: '',
    mode: 'keyvalue',
    modes: [
      { id: 'keyvalue', name: '键值对', desc: 'name=value 或 name:value' },
      { id: 'lines', name: '列表', desc: '每行一个值' },
      { id: 'auto', name: '自动', desc: '智能识别格式' }
    ],
    showResult: false
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value, errorMsg: '' })
  },

  // 模式切换
  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
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

  // 生成 JSON
  onGenerate() {
    const text = this.data.inputText.trim()
    if (!text) {
      this.setData({ errorMsg: '请输入文本内容' })
      return
    }
    try {
      let result
      const mode = this.data.mode
      if (mode === 'keyvalue') {
        result = this._parseKeyValue(text)
      } else if (mode === 'lines') {
        result = this._parseLines(text)
      } else {
        result = this._autoDetect(text)
      }
      const formatted = JSON.stringify(result, null, 2)
      this.setData({ generatedJson: formatted, errorMsg: '', showResult: true })
    } catch (err) {
      this.setData({ errorMsg: '转换失败：' + err.message, generatedJson: '', showResult: false })
    }
  },

  // key=value / key:value 解析
  _parseKeyValue(text) {
    const obj = {}
    const lines = text.split('\n').filter(l => l.trim())
    for (const line of lines) {
      const match = line.match(/^\s*(.+?)\s*[=:]\s*(.+)\s*$/)
      if (match) {
        obj[match[1]] = this._castValue(match[2])
      }
    }
    return obj
  },

  // 每行一个值 -> 数组
  _parseLines(text) {
    return text.split('\n')
      .filter(l => l.trim())
      .map(l => this._castValue(l.trim()))
  },

  // 自动识别
  _autoDetect(text) {
    try { return JSON.parse(text) } catch(e) {}
    const kv = this._parseKeyValue(text)
    if (Object.keys(kv).length > 0) return kv
    return this._parseLines(text)
  },

  // 类型转换
  _castValue(val) {
    if (val === 'true') return true
    if (val === 'false') return false
    if (val === 'null') return null
    if (!isNaN(val) && val !== '') return Number(val)
    return val
  },

  // 复制结果
  onCopyResult() {
    wx.setClipboardData({
      data: this.data.generatedJson,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 清空
  onClear() {
    this.setData({
      inputText: '',
      generatedJson: '',
      errorMsg: '',
      showResult: false
    })
  }
})
