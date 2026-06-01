// pages/calculator/calculator.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    display: '',
    inputExpr: '',
    result: null,
    helperText: '支持括号、四则运算和百分比，结果会自动做显示层精度整理。'
  },

  onNumber(e) {
    const num = e.currentTarget.dataset.num
    this.setData({
      inputExpr: this.data.inputExpr + num
    })
  },

  onOperator(e) {
    const op = e.currentTarget.dataset.op
    this.setData({
      inputExpr: this.data.inputExpr + ' ' + op + ' '
    })
  },

  onLeftParen() {
    this.setData({
      inputExpr: this.data.inputExpr + '('
    })
  },

  onRightParen() {
    this.setData({
      inputExpr: this.data.inputExpr + ')'
    })
  },

  onEqual() {
    const expr = this.data.inputExpr.trim()
    if (!expr) return

    try {
      const result = this._eval(expr)
      this.setData({
        display: this._formatDisplayValue(result),
        result
      })
    } catch (e) {
      this.setData({
        display: 'Error',
        result: null
      })
    }
  },

  _eval(expr) {
    expr = expr.replace(/\s+/g, '')
    expr = expr.replace(/\u00D7/g, '*').replace(/\u00F7/g, '/')

    if (!/^[\d+\-*/().]+$/.test(expr)) {
      throw new Error('Invalid expression')
    }

    const ctx = { pos: 0 }
    const result = this._parseExpression(expr, ctx)
    if (ctx.pos !== expr.length) {
      throw new Error('Unexpected token')
    }
    if (!Number.isFinite(result)) {
      throw new Error('Invalid result')
    }

    return result
  },

  _formatDisplayValue(value) {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid result')
    }

    const normalized = Math.abs(value) < 1e-12 ? 0 : value
    return String(Number(normalized.toPrecision(12)))
  },

  _parseExpression(expr, ctx) {
    let result = this._parseTerm(expr, ctx)

    while (ctx.pos < expr.length) {
      const ch = expr[ctx.pos]
      if (ch === '+' || ch === '-') {
        ctx.pos++
        const right = this._parseTerm(expr, ctx)
        result = ch === '+' ? result + right : result - right
      } else {
        break
      }
    }

    return result
  },

  _parseTerm(expr, ctx) {
    let result = this._parseFactor(expr, ctx)

    while (ctx.pos < expr.length) {
      const ch = expr[ctx.pos]
      if (ch === '*' || ch === '/') {
        ctx.pos++
        const right = this._parseFactor(expr, ctx)
        if (ch === '/' && right === 0) {
          throw new Error('Division by zero')
        }
        result = ch === '*' ? result * right : result / right
      } else {
        break
      }
    }

    return result
  },

  _parseFactor(expr, ctx) {
    if (ctx.pos >= expr.length) {
      throw new Error('Unexpected end of expression')
    }

    if (expr[ctx.pos] === '-') {
      ctx.pos++
      return -this._parseFactor(expr, ctx)
    }

    if (expr[ctx.pos] === '+') {
      ctx.pos++
      return this._parseFactor(expr, ctx)
    }

    if (expr[ctx.pos] === '(') {
      ctx.pos++
      const result = this._parseExpression(expr, ctx)
      if (expr[ctx.pos] !== ')') {
        throw new Error('Missing closing parenthesis')
      }
      ctx.pos++
      return result
    }

    const match = expr.slice(ctx.pos).match(/^(?:\d+\.\d+|\d+|\.\d+)/)
    if (!match) {
      throw new Error('Expected number')
    }

    ctx.pos += match[0].length
    return parseFloat(match[0])
  },

  onClear() {
    this.setData({
      display: '',
      inputExpr: '',
      result: null
    })
  },

  onBackspace() {
    let expr = this.data.inputExpr
    if (expr.length === 0) return

    // 运算符格式为 " op "（前后各一个空格）
    const ops = [' + ', ' - ', ' * ', ' / ']
    for (const op of ops) {
      if (expr.endsWith(op)) {
        expr = expr.slice(0, -op.length)
        this.setData({ inputExpr: expr, display: '' })
        return
      }
    }
    expr = expr.slice(0, -1)
    this.setData({ inputExpr: expr, display: '' })
  },

  onPercent() {
    const expr = this.data.inputExpr
    if (expr) {
      this.setData({
        inputExpr: '(' + expr + ') / 100'
      })
    }
  },

  onCopy() {
    const text = this.data.display || this.data.inputExpr
    if (text) {
      wx.setClipboardData({ data: text })
    }
  },

  onShareAppMessage() {
    return getShareAppMessage('计算器', '/pages/calculator/calculator')
  },
  onShareTimeline() {
    return getShareTimeline('计算器')
  }
})
