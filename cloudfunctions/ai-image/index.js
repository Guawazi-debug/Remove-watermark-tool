const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { prompt, size, revise, footnote, seed } = event

  // 参数验证
  if (!prompt || !prompt.trim()) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '请输入图片描述'
    }
  }

  try {
    const ai = cloud.extend.AI

    // 构建参数
    const params = {
      model: 'hunyuan-image',
      prompt: prompt.trim()
    }

    // 可选参数
    if (size) params.size = size
    if (revise !== undefined) params.revise = revise
    if (footnote) params.footnote = footnote
    if (seed) params.seed = seed

    // 调用生图模型
    const result = await ai.createImage(params)

    return {
      success: true,
      imageUrl: result.imageUrl || result.url,
      revised_prompt: result.revised_prompt || prompt,
      message: '生成成功'
    }
  } catch (err) {
    console.error('生图失败:', err)
    return {
      success: false,
      code: err.code || 'GENERATE_FAILED',
      message: err.message || '生成失败，请稍后重试'
    }
  }
}
