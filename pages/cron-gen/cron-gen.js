// pages/cron-gen/cron-gen.js
Page({
  data: {
    minute: '*', hour: '*', day: '*', month: '*', week: '*',
    cron: '* * * * *',
    presets: [
      { name: '每分钟', value: '* * * * *' },
      { name: '每小时', value: '0 * * * *' },
      { name: '每天零点', value: '0 0 * * *' },
      { name: '每周一零点', value: '0 0 * * 1' },
      { name: '每月1号零点', value: '0 0 1 * *' },
      { name: '每5分钟', value: '*/5 * * * *' }
    ]
  },
  onMinuteChange(e) { this.setData({ minute: e.detail.value }); this._updateCron() },
  onHourChange(e) { this.setData({ hour: e.detail.value }); this._updateCron() },
  onDayChange(e) { this.setData({ day: e.detail.value }); this._updateCron() },
  onMonthChange(e) { this.setData({ month: e.detail.value }); this._updateCron() },
  onWeekChange(e) { this.setData({ week: e.detail.value }); this._updateCron() },
  _updateCron() {
    const { minute, hour, day, month, week } = this.data
    this.setData({ cron: `${minute} ${hour} ${day} ${month} ${week}` })
  },
  onPreset(e) {
    const val = e.currentTarget.dataset.value
    const parts = val.split(' ')
    this.setData({ minute: parts[0], hour: parts[1], day: parts[2], month: parts[3], week: parts[4], cron: val })
  },
  onCopy() { wx.setClipboardData({ data: this.data.cron }) },
  onClear() { this.setData({ minute: '*', hour: '*', day: '*', month: '*', week: '*', cron: '* * * * *' }) }
})
