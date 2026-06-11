const toolCategories = [
  {
    id: 'media',
    name: '媒体工具',
    accent: '#d36b4c',
    description: '处理视频解析与分享链接',
    tools: [
      { id: 'video-parse', name: '视频解析', desc: '短视频去水印与下载辅助', icon: 'VID', color: '#d36b4c', page: '/pages/video-parse/video-parse', keywords: ['视频', '解析', '下载', '去水印'], badge: '热门' },
      { id: 'ai-image', name: 'AI 生图', desc: '输入文字描述，AI 生成图片', icon: 'IMG', color: '#d36b4c', page: '/pages/ai-image/ai-image', keywords: ['AI', '生图', '文生图', '图片', '生成'], badge: 'AI' }
    ]
  },
  {
    id: 'text',
    name: '文本处理',
    accent: '#2e6f95',
    description: '面向日常编辑与格式处理',
    tools: [
      { id: 'json-parse', name: 'JSON 解析', desc: '格式化并检查 JSON 字符串', icon: 'JSON', color: '#2e6f95', page: '/pages/json-parse/json-parse', keywords: ['json', '解析', '格式化'] },
      { id: 'json-generate', name: 'JSON 生成', desc: '把文本转换成 JSON 结构', icon: 'MAKE', color: '#3f8f6b', page: '/pages/json-generate/json-generate', keywords: ['json', '生成', '键值对'] },
      { id: 'base64', name: 'Base64', desc: 'UTF-8 Base64 编解码', icon: 'B64', color: '#c06a3f', page: '/pages/base64/base64', keywords: ['base64', '编码', '解码'] },
      { id: 'url-encode', name: 'URL 编解码', desc: '处理 URL 编码与解码', icon: 'URL', color: '#4d7ea8', page: '/pages/url-encode/url-encode', keywords: ['url', 'encode', 'decode'] },
      { id: 'text-diff', name: '文本对比', desc: '快速对比两段文本差异', icon: 'DIFF', color: '#7b5ea7', page: '/pages/text-diff/text-diff', keywords: ['文本', 'diff', '对比'] },
      { id: 'word-count', name: '字数统计', desc: '统计字符、单词、行数', icon: 'COUNT', color: '#3f8f6b', page: '/pages/word-count/word-count', keywords: ['字数', '统计', '单词'] },
      { id: 'regex-test', name: '正则测试', desc: '在线验证正则表达式匹配', icon: 'REG', color: '#c49a3a', page: '/pages/regex-test/regex-test', keywords: ['正则', '匹配', '测试'] },
      { id: 'case-convert', name: '大小写转换', desc: '批量转换英文字母格式', icon: 'Aa', color: '#a14f7e', page: '/pages/case-convert/case-convert', keywords: ['大小写', '转换'] },
      { id: 'text-replace', name: '文本替换', desc: '查找并批量替换文本', icon: 'REPL', color: '#338c8c', page: '/pages/text-replace/text-replace', keywords: ['替换', '查找'] },
      { id: 'text-dedup', name: '文本去重', desc: '按行去除重复内容', icon: 'UNIQ', color: '#7b5ea7', page: '/pages/text-dedup/text-dedup', keywords: ['去重', '文本'] },
      { id: 'unicode', name: 'Unicode', desc: 'Unicode 编解码转换', icon: 'U+', color: '#c06a3f', page: '/pages/unicode/unicode', keywords: ['unicode', '编码', '解码'] },
      { id: 'html-escape', name: 'HTML 转义', desc: 'HTML 实体编码与解码', icon: 'HTML', color: '#4d7ea8', page: '/pages/html-escape/html-escape', keywords: ['html', '转义', '实体'] }
    ]
  },
  {
    id: 'security',
    name: '编码与安全',
    accent: '#50545d',
    description: '哈希、令牌与标识辅助',
    tools: [
      { id: 'hash', name: 'MD5 / SHA', desc: '基于 UTF-8 的哈希计算', icon: 'HASH', color: '#50545d', page: '/pages/hash/hash', keywords: ['hash', 'md5', 'sha1', 'sha256'], badge: '已升级' },
      { id: 'jwt-decode', name: 'JWT 解析', desc: '查看 Header 与 Payload', icon: 'JWT', color: '#338c8c', page: '/pages/jwt-decode/jwt-decode', keywords: ['jwt', 'token', '解析'], badge: '已升级' },
      { id: 'uuid', name: 'UUID 生成', desc: '生成 v4 标识符', icon: 'UUID', color: '#7b5ea7', page: '/pages/uuid/uuid', keywords: ['uuid', '随机', '标识'], badge: '已升级' }
    ]
  },
  {
    id: 'dev',
    name: '开发辅助',
    accent: '#264653',
    description: '开发调试与格式转换工具',
    tools: [
      { id: 'timestamp', name: '时间戳转换', desc: '秒、毫秒与日期互转', icon: 'TIME', color: '#264653', page: '/pages/timestamp/timestamp', keywords: ['时间戳', '日期', '转换'], badge: '已升级' },
      { id: 'color-convert', name: '颜色转换', desc: 'HEX / RGB / HSL 互转', icon: 'CLR', color: '#c06a3f', page: '/pages/color-convert/color-convert', keywords: ['颜色', 'hex', 'rgb', 'hsl'] },
      { id: 'password-gen', name: '密码生成', desc: '按规则生成强密码', icon: 'PWD', color: '#3f8f6b', page: '/pages/password-gen/password-gen', keywords: ['密码', '随机', '安全'], badge: '已升级' },
      { id: 'json-diff', name: 'JSON 对比', desc: '检查两个 JSON 的差异', icon: 'J-D', color: '#7b5ea7', page: '/pages/json-diff/json-diff', keywords: ['json', '对比', 'diff'] },
      { id: 'cron-gen', name: 'Cron 生成', desc: '生成常用定时表达式', icon: 'CRON', color: '#c49a3a', page: '/pages/cron-gen/cron-gen', keywords: ['cron', '定时'] },
      { id: 'css-unit', name: 'CSS 单位转换', desc: 'px / rem / vw / rpx 转换', icon: 'CSS', color: '#a14f7e', page: '/pages/css-unit/css-unit', keywords: ['css', '单位', 'rem', 'rpx'] },
      { id: 'code-format', name: '代码格式化', desc: '轻量格式整理与 JSON 美化', icon: 'FMT', color: '#338c8c', page: '/pages/code-format/code-format', keywords: ['代码', '格式化', 'json', 'css'] }
    ]
  },
  {
    id: 'life',
    name: '计算与生活',
    accent: '#a64b4b',
    description: '常用换算与计算器',
    tools: [
      { id: 'radix', name: '进制转换', desc: '十进制与二八十六进制互转', icon: '0x', color: '#7b5ea7', page: '/pages/radix/radix', keywords: ['进制', '二进制', '十六进制'] },
      { id: 'unit-convert', name: '单位转换', desc: '长度、重量、温度转换', icon: 'UNIT', color: '#c49a3a', page: '/pages/unit-convert/unit-convert', keywords: ['单位', '长度', '重量', '温度'] },
      { id: 'calculator', name: '计算器', desc: '支持括号与四则运算', icon: 'CALC', color: '#a14f7e', page: '/pages/calculator/calculator', keywords: ['计算器', '四则运算'] },
      { id: 'date-calc', name: '日期计算', desc: '自然年月日差值与推算', icon: 'DATE', color: '#4d7ea8', page: '/pages/date-calc/date-calc', keywords: ['日期', '天数', '推算'] },
      { id: 'age-calc', name: '年龄计算', desc: '精确到年月日的年龄结果', icon: 'AGE', color: '#c06a3f', page: '/pages/age-calc/age-calc', keywords: ['年龄', '生日'], badge: '已升级' },
      { id: 'bmi', name: 'BMI 计算', desc: '计算身体质量指数', icon: 'BMI', color: '#3f8f6b', page: '/pages/bmi/bmi', keywords: ['bmi', '体重', '健康'] },
      { id: 'tax-calc', name: '个税计算', desc: '工资税后收入快速估算', icon: 'TAX', color: '#50545d', page: '/pages/tax-calc/tax-calc', keywords: ['个税', '工资', '五险一金'], badge: '已升级' },
      { id: 'loan-calc', name: '贷款计算', desc: '月供、总还款与总利息', icon: 'LOAN', color: '#2e6f95', page: '/pages/loan-calc/loan-calc', keywords: ['贷款', '月供', '利息'] }
    ]
  }
]

const toolIndex = {}
toolCategories.forEach(category => {
  category.tools.forEach(tool => {
    toolIndex[tool.id] = Object.assign({ categoryId: category.id, categoryName: category.name }, tool)
  })
})

module.exports = {
  toolCategories,
  toolIndex
}
