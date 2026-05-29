// pages/json-diff/json-diff.js
Page({
  data: { json1: '', json2: '', diffResult: [], hasDiff: false },
  onJson1Change(e) { this.setData({ json1: e.detail.value }) },
  onJson2Change(e) { this.setData({ json2: e.detail.value }) },
  onCompare() {
    const { json1, json2 } = this.data
    if (!json1 || !json2) { wx.showToast({ title: '请输入 JSON', icon: 'none' }); return }
    try {
      const obj1 = JSON.parse(json1)
      const obj2 = JSON.parse(json2)
      const diff = this._diff(obj1, obj2, '')
      this.setData({ diffResult: diff, hasDiff: diff.length > 0 })
    } catch (e) {
      wx.showToast({ title: 'JSON 格式错误', icon: 'none' })
    }
  },
  _diff(obj1, obj2, path) {
    const diff = []
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])
    keys.forEach(key => {
      const p = path ? path + '.' + key : key
      const v1 = obj1 ? obj1[key] : undefined
      const v2 = obj2 ? obj2[key] : undefined
      if (v1 === undefined) {
        diff.push({ path: p, type: 'added', value: v2 })
      } else if (v2 === undefined) {
        diff.push({ path: p, type: 'removed', value: v1 })
      } else if (typeof v1 === 'object' && typeof v2 === 'object' && v1 !== null && v2 !== null) {
        diff.push(...this._diff(v1, v2, p))
      } else if (v1 !== v2) {
        diff.push({ path: p, type: 'changed', value1: v1, value2: v2 })
      }
    })
    return diff
  },
  onPaste1() { wx.getClipboardData({ success: (res) => { if (res.data) this.setData({ json1: res.data }) } }) },
  onPaste2() { wx.getClipboardData({ success: (res) => { if (res.data) this.setData({ json2: res.data }) } }) },
  onClear() { this.setData({ json1: '', json2: '', diffResult: [], hasDiff: false }) }
})
