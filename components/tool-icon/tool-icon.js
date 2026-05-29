const ICON_SRC_MAP = {
  'video-parse': '/assets/tool-icons/video-parse.svg',
  'json-parse': '/assets/tool-icons/json-parse.svg',
  'json-generate': '/assets/tool-icons/json-generate.svg',
  'base64': '/assets/tool-icons/base64.svg',
  'url-encode': '/assets/tool-icons/url-encode.svg',
  'text-diff': '/assets/tool-icons/text-diff.svg',
  'word-count': '/assets/tool-icons/word-count.svg',
  'regex-test': '/assets/tool-icons/regex-test.svg',
  'case-convert': '/assets/tool-icons/case-convert.svg',
  'text-replace': '/assets/tool-icons/text-replace.svg',
  'text-dedup': '/assets/tool-icons/text-dedup.svg',
  'unicode': '/assets/tool-icons/unicode.svg',
  'html-escape': '/assets/tool-icons/html-escape.svg',
  'hash': '/assets/tool-icons/hash.svg',
  'jwt-decode': '/assets/tool-icons/jwt-decode.svg',
  'uuid': '/assets/tool-icons/uuid.svg',
  'timestamp': '/assets/tool-icons/timestamp.svg',
  'color-convert': '/assets/tool-icons/color-convert.svg',
  'password-gen': '/assets/tool-icons/password-gen.svg',
  'json-diff': '/assets/tool-icons/json-diff.svg',
  'cron-gen': '/assets/tool-icons/cron-gen.svg',
  'css-unit': '/assets/tool-icons/css-unit.svg',
  'code-format': '/assets/tool-icons/code-format.svg',
  'radix': '/assets/tool-icons/radix.svg',
  'unit-convert': '/assets/tool-icons/unit-convert.svg',
  'calculator': '/assets/tool-icons/calculator.svg',
  'date-calc': '/assets/tool-icons/date-calc.svg',
  'age-calc': '/assets/tool-icons/age-calc.svg',
  'bmi': '/assets/tool-icons/bmi.svg',
  'tax-calc': '/assets/tool-icons/tax-calc.svg',
  'loan-calc': '/assets/tool-icons/loan-calc.svg'
}

function getIconSrc(iconId) {
  return ICON_SRC_MAP[iconId] || '/assets/tool-icons/_fallback.svg'
}

Component({
  options: {
    virtualHost: true
  },
  properties: {
    iconId: { type: String, value: '' }
  },
  observers: {
    iconId(value) {
      this.setData({
        iconSrc: getIconSrc(value)
      })
    }
  },
  data: {
    iconSrc: '/assets/tool-icons/_fallback.svg'
  },
  lifetimes: {
    attached() {
      this.setData({
        iconSrc: getIconSrc(this.properties.iconId)
      })
    }
  }
})
