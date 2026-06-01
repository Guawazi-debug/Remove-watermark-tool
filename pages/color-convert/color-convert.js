// pages/color-convert/color-convert.js
const { getShareAppMessage, getShareTimeline } = require('../../utils/share')

Page({
  data: {
    hex: '#4a90d9',
    r: 74, g: 144, b: 217,
    h: 211, s: 66, l: 57,
    previewColor: '#4a90d9'
  },

  onHexChange(e) {
    const rawHex = e.detail.value.trim()
    this.setData({ hex: rawHex })

    const normalizedHex = this._normalizeHex(rawHex)
    if (normalizedHex) {
      const rgb = this._hexToRgb(normalizedHex)
      const hsl = this._rgbToHsl(rgb.r, rgb.g, rgb.b)
      this.setData({
        hex: normalizedHex,
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        previewColor: normalizedHex
      })
    }
  },

  onRChange(e) { this._updateFromRgb('r', e.detail.value) },
  onGChange(e) { this._updateFromRgb('g', e.detail.value) },
  onBChange(e) { this._updateFromRgb('b', e.detail.value) },

  onHChange(e) { this._updateFromHsl('h', e.detail.value) },
  onSChange(e) { this._updateFromHsl('s', e.detail.value) },
  onLChange(e) { this._updateFromHsl('l', e.detail.value) },

  _updateFromRgb(key, val) {
    const parsed = this._parseBoundedInt(val, 0, 255)
    if (parsed === null) return

    const data = { [key]: parsed }
    this.setData(data)
    const { r, g, b } = { ...this.data, ...data }
    const hex = this._rgbToHex(r, g, b)
    const hsl = this._rgbToHsl(r, g, b)
    this.setData({ hex, h: hsl.h, s: hsl.s, l: hsl.l, previewColor: hex })
  },

  _updateFromHsl(key, val) {
    const limits = { h: [0, 360], s: [0, 100], l: [0, 100] }
    const range = limits[key]
    const parsed = this._parseBoundedInt(val, range[0], range[1])
    if (parsed === null) return

    const data = { [key]: parsed }
    this.setData(data)
    const { h, s, l } = { ...this.data, ...data }
    const rgb = this._hslToRgb(h, s, l)
    const hex = this._rgbToHex(rgb.r, rgb.g, rgb.b)
    this.setData({ r: rgb.r, g: rgb.g, b: rgb.b, hex, previewColor: hex })
  },

  _normalizeHex(hex) {
    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      return '#' + hex.slice(1).split('').map(char => char + char).join('')
    }

    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      return hex
    }

    return null
  },

  _parseBoundedInt(value, min, max) {
    const text = String(value).trim()
    if (!/^-?\d+$/.test(text)) {
      return null
    }

    const parsed = parseInt(text, 10)
    return Math.min(max, Math.max(min, parsed))
  },

  _hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    }
  },

  _rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  },

  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    if (max === min) { h = s = 0 } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  },

  _hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100
    let r, g, b
    if (s === 0) { r = g = b = l } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  },

  onCopy(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.value })
  },

  onShareAppMessage() {
    return getShareAppMessage('颜色转换', '/pages/color-convert/color-convert')
  },
  onShareTimeline() {
    return getShareTimeline('颜色转换')
  }
})
