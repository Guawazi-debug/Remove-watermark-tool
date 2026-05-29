const { getRandomInt } = require('../../utils/random')

Page({
  data: {
    length: 16,
    includeUpper: true,
    includeLower: true,
    includeNumbers: true,
    includeSymbols: true,
    password: '',
    passwords: []
  },

  onLengthChange(e) {
    this.setData({ length: parseInt(e.detail.value, 10) || 16 })
  },

  onToggleOption(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [key]: !this.data[key] })
  },

  onGenerate() {
    const { length, includeUpper, includeLower, includeNumbers, includeSymbols } = this.data
    const selectedGroups = this._getSelectedGroups(includeUpper, includeLower, includeNumbers, includeSymbols)

    if (selectedGroups.length === 0) {
      wx.showToast({ title: '请至少选择一种字符类型', icon: 'none' })
      return
    }

    if (length < selectedGroups.length) {
      wx.showToast({ title: '长度不能小于所选字符类型数', icon: 'none' })
      return
    }

    const passwords = []
    for (let i = 0; i < 5; i++) {
      passwords.push(this._generatePassword(length, includeUpper, includeLower, includeNumbers, includeSymbols))
    }

    this.setData({ passwords, password: passwords[0] })
  },

  _getSelectedGroups(upper, lower, numbers, symbols) {
    const groups = []
    if (upper) groups.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    if (lower) groups.push('abcdefghijklmnopqrstuvwxyz')
    if (numbers) groups.push('0123456789')
    if (symbols) groups.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
    return groups
  },

  _randomIndex(max) {
    return getRandomInt(max)
  },

  _randomChar(chars) {
    return chars.charAt(this._randomIndex(chars.length))
  },

  _shuffle(list) {
    const result = list.slice()
    for (let i = result.length - 1; i > 0; i--) {
      const j = this._randomIndex(i + 1)
      const temp = result[i]
      result[i] = result[j]
      result[j] = temp
    }
    return result
  },

  _generatePassword(length, upper, lower, numbers, symbols) {
    const groups = this._getSelectedGroups(upper, lower, numbers, symbols)
    const allChars = groups.join('')
    const passwordChars = groups.map(group => this._randomChar(group))

    while (passwordChars.length < length) {
      passwordChars.push(this._randomChar(allChars))
    }

    return this._shuffle(passwordChars).join('')
  },

  onCopy(e) {
    const pwd = e.currentTarget.dataset.pwd || this.data.password
    wx.setClipboardData({
      data: pwd,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  onCopyAll() {
    wx.setClipboardData({ data: this.data.passwords.join('\n') })
  }
})
