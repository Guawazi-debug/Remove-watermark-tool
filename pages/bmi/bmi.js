// pages/bmi/bmi.js
Page({
  data: { height: '', weight: '', result: null },
  onHeightChange(e) { this.setData({ height: e.detail.value }) },
  onWeightChange(e) { this.setData({ weight: e.detail.value }) },
  onCalc() {
    const h = parseFloat(this.data.height)
    const w = parseFloat(this.data.weight)
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' }); return
    }
    const hm = h / 100
    const bmi = w / (hm * hm)
    let level = '', color = ''
    if (bmi < 18.5) { level = '偏瘦'; color = '#0984e3' }
    else if (bmi < 24) { level = '正常'; color = '#00b894' }
    else if (bmi < 28) { level = '偏胖'; color = '#fdcb6e' }
    else { level = '肥胖'; color = '#e74c3c' }
    const minW = (18.5 * hm * hm).toFixed(1)
    const maxW = (24 * hm * hm).toFixed(1)
    this.setData({
      result: {
        bmi: bmi.toFixed(1), level, color,
        range: `${minW}kg ~ ${maxW}kg`
      }
    })
  },
  onClear() { this.setData({ height: '', weight: '', result: null }) }
})
