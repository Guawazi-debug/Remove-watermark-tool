const { parseDate, formatDate, diffCalendar } = require('../../utils/date')

Page({
  data: {
    mode: 'diff',
    date1: '',
    date2: '',
    days: '',
    result: ''
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, result: '' })
  },

  onDate1Change(e) {
    this.setData({ date1: e.detail.value })
  },

  onDate2Change(e) {
    this.setData({ date2: e.detail.value })
  },

  onDaysChange(e) {
    this.setData({ days: e.detail.value })
  },

  onToday1() {
    this.setData({ date1: this._getToday() })
  },

  onToday2() {
    this.setData({ date2: this._getToday() })
  },

  _getToday() {
    return this._formatDate(new Date())
  },

  _parseDate(value) {
    return parseDate(value)
  },

  _formatDate(date) {
    return formatDate(date)
  },

  _diffCalendar(startDate, endDate) {
    return diffCalendar(startDate, endDate)
  },

  _weekdayLabel(date) {
    return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  },

  onCalc() {
    if (this.data.mode === 'diff') {
      this._calcDiff()
    } else {
      this._calcAdd()
    }
  },

  _calcDiff() {
    const d1 = this._parseDate(this.data.date1)
    const d2 = this._parseDate(this.data.date2)
    if (!d1 || !d2) {
      wx.showToast({ title: '请选择有效日期', icon: 'none' })
      return
    }

    const start = d1 <= d2 ? d1 : d2
    const end = d1 <= d2 ? d2 : d1
    const totalDays = Math.round((end - start) / 86400000)
    const weeks = Math.floor(totalDays / 7)
    const remainingDays = totalDays % 7
    const exact = this._diffCalendar(start, end)

    this.setData({
      result: `${totalDays} 天 / ${weeks} 周 ${remainingDays} 天 / ${exact.years} 年 ${exact.months} 个月 ${exact.days} 天`
    })
  },

  _calcAdd() {
    const startDate = this._parseDate(this.data.date1)
    if (!startDate) {
      wx.showToast({ title: '请选择起始日期', icon: 'none' })
      return
    }

    const offsetDays = parseInt(this.data.days, 10)
    if (!Number.isInteger(offsetDays)) {
      wx.showToast({ title: '请输入有效天数', icon: 'none' })
      return
    }

    const resultDate = new Date(startDate)
    resultDate.setDate(resultDate.getDate() + offsetDays)

    this.setData({
      result: `${this._formatDate(resultDate)} (星期${this._weekdayLabel(resultDate)})`
    })
  },

  onClear() {
    this.setData({ date1: '', date2: '', days: '', result: '' })
  }
})
