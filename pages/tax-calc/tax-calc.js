const regions = require('../../config/tax-regions')

Page({
  data: {
    salary: '',
    provinceIndex: 0,
    provinces: regions,
    currentProvince: regions[0],
    autoInsurance: true,
    customInsurance: '',
    result: null,
    estimateNotice: '结果按月度速算口径估算，仅供参考；未包含专项附加扣除、社保上下限和累计预扣等复杂情形。'
  },

  onSalaryChange(e) {
    this.setData({ salary: e.detail.value })
  },

  onProvinceChange(e) {
    const index = parseInt(e.detail.value, 10) || 0
    this.setData({
      provinceIndex: index,
      currentProvince: this.data.provinces[index]
    })
  },

  onAutoInsuranceChange(e) {
    this.setData({ autoInsurance: e.detail.value })
  },

  onCustomInsuranceChange(e) {
    this.setData({ customInsurance: e.detail.value })
  },

  onCalc() {
    const salary = parseFloat(this.data.salary)
    if (!Number.isFinite(salary) || salary <= 0) {
      wx.showToast({ title: '请输入有效月薪', icon: 'none' })
      return
    }

    let insurance = 0
    if (this.data.autoInsurance) {
      const region = this.data.currentProvince
      const ratio = region.pension + region.medical + region.unemployment + region.housing
      insurance = salary * ratio / 100
    } else {
      insurance = parseFloat(this.data.customInsurance)
      if (!Number.isFinite(insurance) || insurance < 0) {
        wx.showToast({ title: '请输入有效五险一金金额', icon: 'none' })
        return
      }
    }

    const taxBase = Math.max(0, salary - insurance - 5000)
    const bracket = this._getTaxBracket(taxBase)
    const tax = Math.max(0, taxBase * bracket.rate - bracket.quickDeduction)
    const afterTax = salary - insurance - tax

    this.setData({
      result: {
        salary: salary.toFixed(2),
        insurance: insurance.toFixed(2),
        taxBase: taxBase.toFixed(2),
        tax: tax.toFixed(2),
        afterTax: afterTax.toFixed(2),
        level: bracket.label,
        quickDeduction: bracket.quickDeduction.toFixed(2),
        provinceName: this.data.currentProvince.name,
        totalRate: (this.data.currentProvince.pension + this.data.currentProvince.medical + this.data.currentProvince.unemployment + this.data.currentProvince.housing).toFixed(1)
      }
    })
  },

  _getTaxBracket(taxBase) {
    if (taxBase <= 0) return { rate: 0, quickDeduction: 0, label: '无需缴税' }
    if (taxBase <= 3000) return { rate: 0.03, quickDeduction: 0, label: '3%' }
    if (taxBase <= 12000) return { rate: 0.1, quickDeduction: 210, label: '10%' }
    if (taxBase <= 25000) return { rate: 0.2, quickDeduction: 1410, label: '20%' }
    if (taxBase <= 35000) return { rate: 0.25, quickDeduction: 2660, label: '25%' }
    if (taxBase <= 55000) return { rate: 0.3, quickDeduction: 4410, label: '30%' }
    if (taxBase <= 80000) return { rate: 0.35, quickDeduction: 7160, label: '35%' }
    return { rate: 0.45, quickDeduction: 15160, label: '45%' }
  },

  onClear() {
    this.setData({
      salary: '',
      customInsurance: '',
      result: null,
      provinceIndex: 0,
      currentProvince: this.data.provinces[0],
      autoInsurance: true
    })
  }
})
