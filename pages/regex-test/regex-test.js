// pages/regex-test/regex-test.js
Page({
  data: {
    pattern: '',
    flags: 'g',
    testText: '',
    matches: [],
    errorMsg: '',
    isValid: true
  },

  onPatternChange(e) {
    this.setData({ pattern: e.detail.value })
    this._test()
  },

  onFlagsChange(e) {
    this.setData({ flags: e.detail.value })
    this._test()
  },

  onTestTextChange(e) {
    this.setData({ testText: e.detail.value })
    this._test()
  },

  _test() {
    const { pattern, flags, testText } = this.data
    if (!pattern || !testText) {
      this.setData({ matches: [], errorMsg: '', isValid: true })
      return
    }
    try {
      const regex = new RegExp(pattern, flags)
      const matches = []
      let match
      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          matches.push({ value: match[0], index: match.index })
          if (match[0] === '') {
            regex.lastIndex += 1
          }
        }
      } else {
        match = regex.exec(testText)
        if (match) {
          matches.push({ value: match[0], index: match.index })
        }
      }
      this.setData({ matches, errorMsg: '', isValid: true })
    } catch (e) {
      this.setData({ matches: [], errorMsg: e.message, isValid: false })
    }
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ testText: res.data })
        this._test()
      }
    })
  },

  onClear() {
    this.setData({ pattern: '', testText: '', matches: [], errorMsg: '' })
  }
})
