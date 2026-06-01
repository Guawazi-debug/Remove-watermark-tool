const { parseDate, diffCalendar, nextBirthdayDate, stripTime } = require('../../utils/date')
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    birthday: '',
    result: null
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value })
  },

  onCalc() {
    const birthday = parseDate(this.data.birthday)
    if (!birthday) {
      wx.showToast({ title: '请选择有效出生日期', icon: 'none' })
      return
    }

    const today = stripTime(new Date())
    if (birthday > today) {
      wx.showToast({ title: '出生日期不能晚于今天', icon: 'none' })
      return
    }

    const exact = diffCalendar(birthday, today)
    const totalDays = Math.floor((today - birthday) / 86400000)
    const totalWeeks = Math.floor(totalDays / 7)
    const nextBirthday = nextBirthdayDate(birthday, today)

    this.setData({
      result: {
        years: exact.years,
        months: exact.months,
        days: exact.days,
        totalDays,
        totalWeeks,
        nextBirthday: Math.ceil((nextBirthday - today) / 86400000)
      }
    })
  },

  onClear() {
    this.setData({ birthday: '', result: null })
  },

  onShareAppMessage() {
    return getShareAppMessage('年龄计算', '/pages/age-calc/age-calc')
  },
  onShareTimeline() {
    return getShareTimeline('年龄计算')
  }
})
