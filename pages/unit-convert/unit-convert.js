// pages/unit-convert/unit-convert.js
Page({
  data: {
    category: 'length',
    categories: [
      { id: 'length', name: '长度' },
      { id: 'weight', name: '重量' },
      { id: 'temperature', name: '温度' }
    ],
    fromUnit: '',
    toUnit: '',
    inputValue: '',
    result: '',
    units: {}
  },

  onLoad() {
    this._initUnits()
  },

  _initUnits() {
    this.setData({
      units: {
        length: [
          { id: 'mm', name: '毫米', rate: 0.001 },
          { id: 'cm', name: '厘米', rate: 0.01 },
          { id: 'm', name: '米', rate: 1 },
          { id: 'km', name: '千米', rate: 1000 },
          { id: 'in', name: '英寸', rate: 0.0254 },
          { id: 'ft', name: '英尺', rate: 0.3048 },
          { id: 'mi', name: '英里', rate: 1609.344 }
        ],
        weight: [
          { id: 'mg', name: '毫克', rate: 0.000001 },
          { id: 'g', name: '克', rate: 0.001 },
          { id: 'kg', name: '千克', rate: 1 },
          { id: 't', name: '吨', rate: 1000 },
          { id: 'oz', name: '盎司', rate: 0.028349523 },
          { id: 'lb', name: '磅', rate: 0.4535924 }
        ],
        temperature: [
          { id: 'c', name: '摄氏度' },
          { id: 'f', name: '华氏度' },
          { id: 'k', name: '开尔文' }
        ]
      },
      fromUnit: 'm',
      toUnit: 'km'
    })
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category
    const units = this.data.units[category]
    this.setData({
      category,
      fromUnit: units[0].id,
      toUnit: units[1].id,
      result: ''
    })
  },

  onFromChange(e) {
    this.setData({ fromUnit: e.currentTarget.dataset.unit, result: '' })
  },

  onToChange(e) {
    this.setData({ toUnit: e.currentTarget.dataset.unit, result: '' })
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value })
  },

  onConvert() {
    const { category, fromUnit, toUnit, inputValue, units } = this.data
    const val = parseFloat(inputValue)
    if (isNaN(val)) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' })
      return
    }

    if (category === 'temperature') {
      this.setData({ result: this._convertTemp(val, fromUnit, toUnit) })
    } else {
      const unitList = units[category]
      const from = unitList.find(u => u.id === fromUnit)
      const to = unitList.find(u => u.id === toUnit)
      const baseVal = val * from.rate
      this.setData({ result: (baseVal / to.rate).toFixed(6).replace(/\.?0+$/, '') })
    }
  },

  _convertTemp(val, from, to) {
    let celsius
    if (from === 'c') celsius = val
    else if (from === 'f') celsius = (val - 32) * 5 / 9
    else celsius = val - 273.15

    let result
    if (to === 'c') result = celsius
    else if (to === 'f') result = celsius * 9 / 5 + 32
    else result = celsius + 273.15

    return result.toFixed(2).replace(/\.?0+$/, '')
  },

  onSwap() {
    this.setData({
      fromUnit: this.data.toUnit,
      toUnit: this.data.fromUnit,
      result: ''
    })
  },

  onCopy() {
    wx.setClipboardData({ data: this.data.result })
  },

  onClear() {
    this.setData({ inputValue: '', result: '' })
  }
})
