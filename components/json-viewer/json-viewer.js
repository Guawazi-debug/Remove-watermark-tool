Component({
  properties: {
    json: { type: String, value: '' }
  },
  observers: {
    'json': function(val) {
      if (val) {
        this.setData({ lines: this._parseLines(val) })
      } else {
        this.setData({ lines: [] })
      }
    }
  },
  data: {
    lines: []
  },
  methods: {
    _parseLines(str) {
      return str.split('\n').map((line, i) => ({
        num: i + 1,
        segments: this._colorize(line)
      }))
    },
    _colorize(line) {
      const segments = []

      let i = 0
      while (i < line.length) {
        // 跳过空白
        if (line[i] === ' ' || line[i] === '\t') {
          let space = ''
          while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
            space += line[i]
            i++
          }
          segments.push({ text: space, type: 'plain' })
          continue
        }

        // 匹配字符串
        if (line[i] === '"') {
          let str = '"'
          i++
          while (i < line.length && line[i] !== '"') {
            if (line[i] === '\\') {
              str += line[i] + (line[i + 1] || '')
              i += 2
            } else {
              str += line[i]
              i++
            }
          }
          if (i < line.length) {
            str += '"'
            i++
          }

          // 判断是 key 还是 string value
          let j = i
          while (j < line.length && line[j] === ' ') j++
          if (line[j] === ':') {
            segments.push({ text: str, type: 'key' })
          } else {
            segments.push({ text: str, type: 'string' })
          }
          continue
        }

        // 匹配数字
        if (line[i] === '-' || (line[i] >= '0' && line[i] <= '9')) {
          let num = ''
          while (i < line.length && (line[i] === '-' || line[i] === '+' || line[i] === '.' || line[i] === 'e' || line[i] === 'E' || (line[i] >= '0' && line[i] <= '9'))) {
            num += line[i]
            i++
          }
          segments.push({ text: num, type: 'number' })
          continue
        }

        // 匹配 true/false/null
        const rest = line.substring(i)
        if (rest.startsWith('true')) {
          segments.push({ text: 'true', type: 'boolean' })
          i += 4
          continue
        }
        if (rest.startsWith('false')) {
          segments.push({ text: 'false', type: 'boolean' })
          i += 5
          continue
        }
        if (rest.startsWith('null')) {
          segments.push({ text: 'null', type: 'null' })
          i += 4
          continue
        }

        // 匹配括号和逗号
        if (line[i] === '{' || line[i] === '}' || line[i] === '[' || line[i] === ']') {
          segments.push({ text: line[i], type: 'bracket' })
          i++
          continue
        }
        if (line[i] === ':') {
          segments.push({ text: ':', type: 'colon' })
          i++
          continue
        }
        if (line[i] === ',') {
          segments.push({ text: ',', type: 'comma' })
          i++
          continue
        }

        // 其他字符
        segments.push({ text: line[i], type: 'plain' })
        i++
      }

      return segments
    }
  }
})
