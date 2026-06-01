const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    amount: '',
    rate: '',
    years: '',
    result: null
  },

  onAmountChange(e) {
    this.setData({ amount: e.detail.value })
  },

  onRateChange(e) {
    this.setData({ rate: e.detail.value })
  },

  onYearsChange(e) {
    this.setData({ years: e.detail.value })
  },

  onCalc() {
    const amountWan = parseFloat(this.data.amount)
    const annualRate = parseFloat(this.data.rate) / 100
    const years = parseInt(this.data.years, 10)

    if (!Number.isFinite(amountWan) || amountWan <= 0 || !Number.isFinite(annualRate) || annualRate < 0 || !Number.isInteger(years) || years <= 0) {
      wx.showToast({ title: '请输入有效的贷款参数', icon: 'none' })
      return
    }

    const amount = amountWan * 10000
    const months = years * 12
    const monthRate = annualRate / 12

    let monthly
    if (monthRate === 0) {
      monthly = amount / months
    } else {
      const factor = Math.pow(1 + monthRate, months)
      monthly = amount * monthRate * factor / (factor - 1)
    }

    const totalPayment = monthly * months
    const totalInterest = totalPayment - amount

    this.setData({
      result: {
        monthly: monthly.toFixed(2),
        totalPayment: totalPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        amount: amountWan,
        years
      }
    })
  },

  onClear() {
    this.setData({ amount: '', rate: '', years: '', result: null })
  },

  onShareAppMessage() {
    return getShareAppMessage('贷款计算', '/pages/loan-calc/loan-calc')
  },
  onShareTimeline() {
    return getShareTimeline('贷款计算')
  }
})
