const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    inputCode: '',
    outputCode: '',
    mode: 'js',
    indent: 2
  },

  onInputChange(e) {
    this.setData({ inputCode: e.detail.value })
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  onIndentChange(e) {
    this.setData({ indent: parseInt(e.detail.value, 10) || 2 })
  },

  onFormat() {
    const code = this.data.inputCode
    if (!code) {
      wx.showToast({ title: '请输入代码', icon: 'none' })
      return
    }

    try {
      let outputCode = code
      if (this.data.mode === 'json') {
        outputCode = JSON.stringify(JSON.parse(code), null, this.data.indent)
      } else {
        outputCode = this._formatCode(code, this.data.indent, this.data.mode)
      }
      this.setData({ outputCode })
    } catch (e) {
      wx.showToast({ title: '格式化失败', icon: 'none' })
    }
  },

  _formatCode(code, indent, mode) {
    if (mode === 'js') {
      return this._formatJsSafely(code, indent)
    }

    const indentUnit = ' '.repeat(indent)
    let result = ''
    let level = 0
    let inString = false
    let stringQuote = ''
    let escaped = false
    let inLineComment = false
    let inBlockComment = false
    let parenDepth = 0
    let atLineStart = true

    const append = (text) => {
      if (!text) return
      if (atLineStart && text !== '\n') {
        result += indentUnit.repeat(level)
        atLineStart = false
      }
      result += text
    }

    const newLine = () => {
      result = result.replace(/[ \t]+$/g, '')
      if (!result.endsWith('\n')) {
        result += '\n'
      }
      atLineStart = true
    }

    for (let i = 0; i < code.length; i++) {
      const ch = code[i]
      const next = code[i + 1]

      if (inLineComment) {
        append(ch)
        if (ch === '\n') {
          inLineComment = false
          atLineStart = true
        }
        continue
      }

      if (inBlockComment) {
        append(ch)
        if (ch === '*' && next === '/') {
          append(next)
          i++
          inBlockComment = false
        }
        continue
      }

      if (inString) {
        append(ch)
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === stringQuote) {
          inString = false
          stringQuote = ''
        }
        continue
      }

      if ((mode === 'js' || mode === 'css') && ch === '/' && next === '/') {
        append('//')
        i++
        inLineComment = true
        continue
      }

      if ((mode === 'js' || mode === 'css') && ch === '/' && next === '*') {
        append('/*')
        i++
        inBlockComment = true
        continue
      }

      if (ch === '"' || ch === '\'' || (mode === 'js' && ch === '`')) {
        append(ch)
        inString = true
        stringQuote = ch
        escaped = false
        continue
      }

      if (ch === '\r') {
        continue
      }

      if (ch === '\n') {
        newLine()
        continue
      }

      if (ch === '(') {
        parenDepth++
        append(ch)
        continue
      }

      if (ch === ')') {
        parenDepth = Math.max(0, parenDepth - 1)
        append(ch)
        continue
      }

      if (ch === '{' || ch === '[') {
        append(ch)
        level++
        newLine()
        continue
      }

      if (ch === '}' || ch === ']') {
        level = Math.max(0, level - 1)
        if (!atLineStart) {
          newLine()
        }
        append(ch)
        if (next && next !== ';' && next !== ',' && next !== ')' && next !== ']' && next !== '}') {
          newLine()
        }
        continue
      }

      if (ch === ';') {
        append(ch)
        if (parenDepth === 0 || mode === 'css') {
          newLine()
        }
        continue
      }

      if (mode === 'css' && ch === ':') {
        append(': ')
        while (code[i + 1] === ' ') {
          i++
        }
        continue
      }

      if (ch === ',') {
        append(ch)
        if (mode === 'css' && parenDepth === 0) {
          append(' ')
        }
        continue
      }

      if (/\s/.test(ch)) {
        if (!atLineStart && !/[ \n\t]$/.test(result)) {
          append(' ')
        }
        continue
      }

      append(ch)
    }

    return result
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  },

  _formatJsSafely(code, indent) {
    const indentUnit = ' '.repeat(indent)
    let result = ''
    let level = 0
    let inString = false
    let stringQuote = ''
    let escaped = false
    let inLineComment = false
    let inBlockComment = false
    let inRegex = false
    let regexEscaped = false
    let parenDepth = 0
    let bracketDepth = 0
    let atLineStart = true

    const append = (text) => {
      if (!text) return
      if (atLineStart && text !== '\n') {
        result += indentUnit.repeat(level)
        atLineStart = false
      }
      result += text
    }

    const newLine = () => {
      result = result.replace(/[ \t]+$/g, '')
      if (!result.endsWith('\n')) {
        result += '\n'
      }
      atLineStart = true
    }

    const prevMeaningfulChar = () => {
      for (let i = result.length - 1; i >= 0; i--) {
        const ch = result[i]
        if (!/\s/.test(ch)) {
          return ch
        }
      }
      return ''
    }

    const canStartRegex = () => {
      const prev = prevMeaningfulChar()
      return !prev || '([{:;,=!?&|+-*%^<>'.includes(prev)
    }

    for (let i = 0; i < code.length; i++) {
      const ch = code[i]
      const next = code[i + 1]

      if (inLineComment) {
        append(ch)
        if (ch === '\n') {
          inLineComment = false
          atLineStart = true
        }
        continue
      }

      if (inBlockComment) {
        append(ch)
        if (ch === '*' && next === '/') {
          append(next)
          i++
          inBlockComment = false
        }
        continue
      }

      if (inRegex) {
        append(ch)
        if (regexEscaped) {
          regexEscaped = false
        } else if (ch === '\\') {
          regexEscaped = true
        } else if (ch === '/') {
          inRegex = false
        }
        continue
      }

      if (inString) {
        append(ch)
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === stringQuote) {
          inString = false
          stringQuote = ''
        }
        continue
      }

      if (ch === '/' && next === '/') {
        append('//')
        i++
        inLineComment = true
        continue
      }

      if (ch === '/' && next === '*') {
        append('/*')
        i++
        inBlockComment = true
        continue
      }

      if (ch === '/' && canStartRegex()) {
        append(ch)
        inRegex = true
        regexEscaped = false
        continue
      }

      if (ch === '"' || ch === '\'' || ch === '`') {
        append(ch)
        inString = true
        stringQuote = ch
        escaped = false
        continue
      }

      if (ch === '\r') {
        continue
      }

      if (ch === '\n') {
        newLine()
        continue
      }

      if (ch === '(') {
        parenDepth++
        append(ch)
        continue
      }

      if (ch === ')') {
        parenDepth = Math.max(0, parenDepth - 1)
        append(ch)
        continue
      }

      if (ch === '[') {
        bracketDepth++
        append(ch)
        continue
      }

      if (ch === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1)
        append(ch)
        continue
      }

      if (ch === '{') {
        append(ch)
        if (parenDepth === 0 && bracketDepth === 0) {
          level++
          newLine()
        }
        continue
      }

      if (ch === '}') {
        if (parenDepth === 0 && bracketDepth === 0) {
          level = Math.max(0, level - 1)
          if (!atLineStart) {
            newLine()
          }
        }
        append(ch)
        if (parenDepth === 0 && bracketDepth === 0 && next && next !== ';' && next !== ',' && next !== ')' && next !== ']') {
          newLine()
        }
        continue
      }

      if (ch === ';') {
        append(ch)
        if (parenDepth === 0 && bracketDepth === 0) {
          newLine()
        }
        continue
      }

      if (ch === ',') {
        append(ch)
        if (bracketDepth === 0 && parenDepth === 0) {
          append(' ')
        }
        continue
      }

      if (/\s/.test(ch)) {
        if (!atLineStart && !/[ \n\t]$/.test(result)) {
          append(' ')
        }
        continue
      }

      append(ch)
    }

    return result
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  },

  onCopy() {
    wx.setClipboardData({ data: this.data.outputCode })
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) this.setData({ inputCode: res.data })
      }
    })
  },

  onClear() {
    this.setData({ inputCode: '', outputCode: '' })
  },

  onShareAppMessage() {
    return getShareAppMessage('代码格式化', '/pages/code-format/code-format')
  },
  onShareTimeline() {
    return getShareTimeline('代码格式化')
  }
})
