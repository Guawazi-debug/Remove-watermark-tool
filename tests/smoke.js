const assert = require('assert')
const fs = require('fs')
const path = require('path')

function loadPage(pagePath, wxOverrides = {}) {
  let pageDef = null
  global.Page = obj => {
    pageDef = obj
  }
  global.wx = Object.assign(
    {
      showToast() {},
      setClipboardData() {},
      getClipboardData() {},
      request() {},
      downloadFile() {},
      saveVideoToPhotosAlbum() {},
      showLoading() {},
      hideLoading() {},
      showModal() {},
      createVideoContext() {
        return {
          play() {},
          pause() {}
        }
      }
    },
    wxOverrides
  )
  delete require.cache[require.resolve(pagePath)]
  require(pagePath)
  return pageDef
}

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`)
    process.exitCode = 1
  }
}

const codeFormatPage = loadPage('../pages/code-format/code-format.js')
const calculatorPage = loadPage('../pages/calculator/calculator.js')
const taxCalcPage = loadPage('../pages/tax-calc/tax-calc.js')
const videoParsePage = loadPage('../pages/video-parse/video-parse.js')
const toolMeta = require('../utils/tool-meta')

runTest('code-format: JS 正则量词不应被拆坏', () => {
  const input = 'const re=/a{2,3}\\/b/g;const x={a:1,b:[2,3]};'
  const output = codeFormatPage._formatCode.call(codeFormatPage, input, 2, 'js')
  assert.ok(output.includes('/a{2,3}\\/b/g;'), `unexpected output: ${output}`)
})

runTest('calculator: 表达式优先级正常', () => {
  const result = calculatorPage._eval.call(calculatorPage, '(1+2)*3')
  assert.strictEqual(result, 9)
})

runTest('calculator: 显示层应处理浮点误差', () => {
  const formatted = calculatorPage._formatDisplayValue.call(calculatorPage, 0.1 + 0.2)
  assert.strictEqual(formatted, '0.3')
})

runTest('tax-calc: 级距边界正确', () => {
  const bracket = taxCalcPage._getTaxBracket.call(taxCalcPage, 3001)
  assert.deepStrictEqual(bracket, { rate: 0.1, quickDeduction: 210, label: '10%' })
})

runTest('video-parse: 文本中可提取 URL', () => {
  const url = videoParsePage.extractUrl.call(videoParsePage, '看看这个 https://example.com/a?b=1 再说')
  assert.strictEqual(url, 'https://example.com/a?b=1')
})

runTest('video-parse: 兼容替代字段名并归一化结果', () => {
  const normalized = videoParsePage._normalizeParseResult.call(videoParsePage, {
    title: '测试视频',
    playUrl: 'https://example.com/play.m3u8',
    downloadUrl: 'https://example.com/video.mp4',
    pic: 'https://example.com/cover.jpg'
  })

  assert.deepStrictEqual(normalized, {
    title: '测试视频',
    video: 'https://example.com/play.m3u8',
    downloadUrl: 'https://example.com/video.mp4',
    playUrl: 'https://example.com/play.m3u8',
    cover: 'https://example.com/cover.jpg',
    onlineUrl: '',
    author: '',
    raw: {
      title: '测试视频',
      playUrl: 'https://example.com/play.m3u8',
      downloadUrl: 'https://example.com/video.mp4',
      pic: 'https://example.com/cover.jpg'
    }
  })
})

runTest('video-parse: 没有下载地址时也应能选取可用保存地址', () => {
  const saveUrl = videoParsePage._getDownloadTarget.call(videoParsePage, {
    playUrl: 'https://example.com/play.mp4',
    video: 'https://example.com/play.mp4'
  })

  assert.strictEqual(saveUrl, 'https://example.com/play.mp4')
})

runTest('video-parse: 兼容接口示例并标准化封面协议', () => {
  const normalized = videoParsePage._normalizeParseResult.call(videoParsePage, {
    title: 'session 直接登录 codex 跳过手机号验证教程',
    cover: 'http://i2.hdslb.com/bfs/archive/demo.jpg',
    video: 'https://qsy.awenz.cn/cache/demo.mp4',
    type: 'video',
    author: '接口维护中！QQ：32992819977'
  })

  assert.deepStrictEqual(normalized, {
    title: 'session 直接登录 codex 跳过手机号验证教程',
    video: 'https://qsy.awenz.cn/cache/demo.mp4',
    playUrl: 'https://qsy.awenz.cn/cache/demo.mp4',
    downloadUrl: '',
    cover: 'https://i2.hdslb.com/bfs/archive/demo.jpg',
    onlineUrl: '',
    author: '接口维护中！QQ：32992819977',
    raw: {
      title: 'session 直接登录 codex 跳过手机号验证教程',
      cover: 'http://i2.hdslb.com/bfs/archive/demo.jpg',
      video: 'https://qsy.awenz.cn/cache/demo.mp4',
      type: 'video',
      author: '接口维护中！QQ：32992819977'
    }
  })
})

runTest('video-parse: 复制播放地址默认不弹信息框', () => {
  let modalTitle = ''
  let clipboardData = ''
  const page = loadPage('../pages/video-parse/video-parse.js', {
    setClipboardData({ data, success }) {
      clipboardData = data
      success && success()
    },
    showModal({ title }) {
      modalTitle = title
    },
    showToast() {}
  })

  page.copyLink.call(page, 'https://example.com/play.mp4', {
    modal: false,
    toast: true
  })

  assert.strictEqual(clipboardData, 'https://example.com/play.mp4')
  assert.strictEqual(modalTitle, '')
})

runTest('video-parse: 下载状态初始化正确', () => {
  const page = loadPage('../pages/video-parse/video-parse.js')
  assert.strictEqual(page.data.isDownloading, false)
  assert.strictEqual(page.data.downloadProgress, 0)
  assert.strictEqual(page.data.downloadStatusText, '')
})

runTest('video-parse: 下载中禁止重复触发保存', () => {
  let requestCount = 0
  let toastTitle = ''
  let pageDef = null
  global.Page = obj => {
    pageDef = obj
  }
  global.wx = {
    downloadFile() {
      requestCount += 1
      return { onProgressUpdate() {} }
    },
    showToast({ title }) {
      toastTitle = title
    },
    setClipboardData() {},
    saveVideoToPhotosAlbum() {},
    showModal() {}
  }
  delete require.cache[require.resolve('../pages/video-parse/video-parse.js')]
  require('../pages/video-parse/video-parse.js')
  const page = Object.assign({}, pageDef, {
    data: Object.assign({}, pageDef.data, {
      isDownloading: true,
      result: {
        video: 'https://example.com/video.mp4'
      }
    }),
    setData(obj) {
      this.data = Object.assign({}, this.data, obj)
    }
  })

  page.onDownload.call(page)

  assert.strictEqual(requestCount, 0)
  assert.strictEqual(toastTitle, '正在下载，请勿重复点击')
})

runTest('tool-meta: 能按页面路由找到工具元数据', () => {
  const tool = toolMeta.findToolByRoute('pages/video-parse/video-parse')
  assert.ok(tool)
  assert.strictEqual(tool.id, 'video-parse')
  assert.strictEqual(tool.badge, '热门')
})

runTest('tool-hero: 所有工具页都已接入统一页头组件', () => {
  const pagesDir = path.join(__dirname, '..', 'pages')
  const toolPages = fs.readdirSync(pagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'index')
    .map(entry => entry.name)

  for (const name of toolPages) {
    const jsonContent = fs.readFileSync(path.join(pagesDir, name, `${name}.json`), 'utf8')
    const wxmlContent = fs.readFileSync(path.join(pagesDir, name, `${name}.wxml`), 'utf8')
    assert.ok(jsonContent.includes('"tool-hero": "/components/tool-hero/tool-hero"'), `${name}.json missing tool-hero`)
    assert.ok(wxmlContent.includes('<tool-hero></tool-hero>'), `${name}.wxml missing tool-hero`)
  }
})
