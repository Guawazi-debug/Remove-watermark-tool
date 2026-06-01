// pages/text-diff/text-diff.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    text1: '',
    text2: '',
    diffLines: [],
    diffCount: 0,
    hasResult: false,
    // 统计信息
    stats: null
  },

  onText1Change(e) {
    this.setData({ text1: e.detail.value })
  },

  onText2Change(e) {
    this.setData({ text2: e.detail.value })
  },

  onCompare() {
    const { text1, text2 } = this.data
    if (!text1 && !text2) {
      wx.showToast({ title: '请输入文本', icon: 'none' })
      return
    }

    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    const maxLen = Math.max(lines1.length, lines2.length)
    const diffLines = []
    let diffCount = 0
    let totalChars1 = text1.length
    let totalChars2 = text2.length
    let diffChars = 0

    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i] !== undefined ? lines1[i] : null
      const l2 = lines2[i] !== undefined ? lines2[i] : null

      // 逐字符对比
      const charResult = this._diffChars(l1, l2)
      const isLineDiff = l1 !== l2

      if (isLineDiff) {
        diffCount++
        diffChars += charResult.diffCharCount
      }

      diffLines.push({
        line: i + 1,
        isDiff: isLineDiff,
        text1: l1,
        text2: l2,
        // 字符级别的差异结果
        chars1: charResult.chars1,
        chars2: charResult.chars2
      })
    }

    this.setData({
      diffLines,
      diffCount,
      hasResult: true,
      stats: {
        lines1: lines1.length,
        lines2: lines2.length,
        chars1: totalChars1,
        chars2: totalChars2,
        diffLines: diffCount,
        diffChars: diffChars
      }
    })
  },

  // 逐字符对比
  _diffChars(str1, str2) {
    if (str1 === str2) {
      return {
        chars1: [{ text: str1 || '', isDiff: false }],
        chars2: [{ text: str2 || '', isDiff: false }],
        diffCharCount: 0
      }
    }

    if (str1 === null) {
      return {
        chars1: [{ text: '(空)', isDiff: false }],
        chars2: this._markAllDiff(str2),
        diffCharCount: str2.length
      }
    }

    if (str2 === null) {
      return {
        chars1: this._markAllDiff(str1),
        chars2: [{ text: '(空)', isDiff: false }],
        diffCharCount: str1.length
      }
    }

    // 找到最长公共子序列来确定相同部分
    const result1 = []
    const result2 = []
    let diffCharCount = 0

    const len1 = str1.length
    const len2 = str2.length
    const maxLen = Math.max(len1, len2)

    // 简单的逐字符对比
    let i = 0, j = 0
    while (i < len1 || j < len2) {
      if (i < len1 && j < len2 && str1[i] === str2[j]) {
        // 相同字符
        result1.push({ text: str1[i], isDiff: false })
        result2.push({ text: str2[j], isDiff: false })
        i++
        j++
      } else {
        // 不同字符，尝试向前找匹配
        let found1 = -1, found2 = -1

        // 在 str2 中找 str1[i]
        if (i < len1) {
          for (let k = j + 1; k < Math.min(j + 5, len2); k++) {
            if (str1[i] === str2[k]) {
              found2 = k
              break
            }
          }
        }

        // 在 str1 中找 str2[j]
        if (j < len2) {
          for (let k = i + 1; k < Math.min(i + 5, len1); k++) {
            if (str1[k] === str2[j]) {
              found1 = k
              break
            }
          }
        }

        if (found2 !== -1 && (found1 === -1 || found2 - j <= found1 - i)) {
          // str2 中有缺失，添加空位
          result1.push({ text: '', isDiff: false })
          result2.push({ text: str2[j], isDiff: true })
          diffCharCount++
          j++
        } else if (found1 !== -1) {
          // str1 中有缺失，添加空位
          result1.push({ text: str1[i], isDiff: true })
          result2.push({ text: '', isDiff: false })
          diffCharCount++
          i++
        } else {
          // 普通替换
          if (i < len1) {
            result1.push({ text: str1[i], isDiff: true })
            diffCharCount++
            i++
          }
          if (j < len2) {
            result2.push({ text: str2[j], isDiff: true })
            diffCharCount++
            j++
          }
        }
      }
    }

    return {
      chars1: result1,
      chars2: result2,
      diffCharCount: diffCharCount
    }
  },

  _markAllDiff(str) {
    return str.split('').map(ch => ({ text: ch, isDiff: true }))
  },

  // 定位到差异
  onLocateDiff() {
    const { diffLines } = this.data
    const firstDiff = diffLines.find(l => l.isDiff)
    if (firstDiff) {
      this.setData({
        scrollToLine: 'line-' + firstDiff.line
      })
    } else {
      wx.showToast({ title: '没有差异', icon: 'none' })
    }
  },

  onPaste1() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ text1: res.data })
      }
    })
  },

  onPaste2() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ text2: res.data })
      }
    })
  },

  onClear() {
    this.setData({
      text1: '',
      text2: '',
      diffLines: [],
      diffCount: 0,
      hasResult: false,
      stats: null,
      scrollToLine: ''
    })
  },

  onShareAppMessage() {
    return getShareAppMessage('文本对比', '/pages/text-diff/text-diff')
  },
  onShareTimeline() {
    return getShareTimeline('文本对比')
  }
})
