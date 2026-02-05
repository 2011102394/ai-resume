/**
 * 混元大模型配置说明
 * ==================
 *
 * 支持的模型列表：
 * - hunyuan-turbos-latest：混元 Turbo S 最新版（推荐，速度快效果好）
 * - hunyuan-turbo：混元 Turbo 版
 * - hunyuan-pro：混元 Pro 版
 * - hunyuan-lite：混元 Lite 版（免费，效果一般）
 *
 * 配置方式：
 * 1. 直接填写（当前方式，适合测试）
 * 2. 环境变量（推荐，更安全，适合生产环境）
 */

// 云函数：调用混元大模型优化简历
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// ============================================
// 混元大模型配置（OpenAI 兼容接口）
// ============================================
// 配置方式一：直接填写（仅测试使用）
// const OPENAI_CONFIG = {
//   apiKey: 'sk-your-api-key',     // OpenAI 兼容接口的 API Key（以 sk- 开头）
//   baseURL: 'https://xxx.api.tcloudbasegateway.com/v1'  // OpenAI 兼容接口地址
// }

// ============================================
// 配置方式二：环境变量（推荐，更安全）
// ============================================
// 在微信开发者工具中，点击「云开发」→「云函数」→「环境变量」
// 添加两个变量：
//   - OPENAI_API_KEY: 你的 OpenAI 兼容接口 API Key
//   - OPENAI_BASE_URL: 你的 OpenAI 兼容接口地址
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
}

// 优化风格配置
const STYLE_CONFIG = {
  'data': {
    name: '数据突出型',
    prompt: '请优化以下工作经历描述，重点突出数据和量化成果，使简历更具说服力。要求：1）添加或强化具体的数字、百分比、金额等量化指标；2）用数据证明工作成效；3）保持专业性和真实性；4）字数控制在150-200字之间；5）只输出优化后的描述，不要解释。'
  },
  'leadership': {
    name: '领导力凸显型',
    prompt: '请优化以下工作经历描述，重点突出领导能力、团队管理和决策能力。要求：1）强调带领团队、跨部门协作、决策制定等经历；2）体现对业务的影响力；3）突出解决问题的能力和创新思维；4）字数控制在150-200字之间；5）只输出优化后的描述，不要解释。'
  },
  'concise': {
    name: '简洁通用型',
    prompt: '请优化以下工作经历描述，使其更加简洁专业、易于阅读。要求：1）使用精炼的语言，去除冗余信息；2）突出核心职责和成果；3）采用标准的简历表达方式；4）字数控制在100-150字之间；5）只输出优化后的描述，不要解释。'
  }
}

// 调用混元大模型（使用 OpenAI 兼容接口）
async function callHunyuan(prompt) {
  const OpenAI = require('openai')

  // 检查配置
  if (!OPENAI_CONFIG.apiKey || !OPENAI_CONFIG.baseURL) {
    throw new Error('OpenAI 配置不完整，请检查环境变量 OPENAI_API_KEY 和 OPENAI_BASE_URL')
  }

  const client = new OpenAI({
    apiKey: OPENAI_CONFIG.apiKey,
    baseURL: OPENAI_CONFIG.baseURL
  })

  const completion = await client.chat.completions.create({
    model: 'hunyuan-turbos-latest',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2048
  })

  return completion.choices[0].message.content
}

// 备用：模拟优化（当没有配置API Key时使用）
function mockOptimize(content, style) {
  const config = STYLE_CONFIG[style] || STYLE_CONFIG['data']

  // 简单的模拟优化逻辑
  let optimized = content.trim()

  // 移除多余的标点
  optimized = optimized.replace(/[。！，、；：]+/g, '，').replace(/，+/g, '，')

  // 确保以句号结尾
  if (!optimized.endsWith('。') && !optimized.endsWith('.')) {
    optimized += '。'
  }

  // 根据不同风格添加一些优化
  switch (style) {
    case 'data':
      optimized = optimized.replace(/(\d+)%/g, '$1%')
      if (!optimized.match(/\d+[千万百]?/)) {
        optimized = optimized.replace('。', '，效率提升30%，获得团队一致好评。')
      }
      break
    case 'leadership':
      if (!optimized.includes('带领') && !optimized.includes('主导') && !optimized.includes('负责')) {
        optimized = '主导' + optimized
      }
      break
    case 'concise':
      // 移除重复内容
      optimized = optimized.replace(/(\S{2,})\1+/g, '$1')
      break
  }

  return optimized
}

exports.main = async (event, context) => {
  const { content, style } = event

  // 参数校验
  if (!content || !content.trim()) {
    return {
      code: -1,
      message: '简历内容不能为空'
    }
  }

  if (!style) {
    return {
      code: -1,
      message: '优化风格不能为空'
    }
  }

  // 验证风格是否有效
  if (!STYLE_CONFIG[style]) {
    return {
      code: -1,
      message: `不支持的优化风格：${style}`
    }
  }

  const cleanContent = content.trim()
  const styleConfig = STYLE_CONFIG[style]

  // 构建完整的 prompt
  const fullPrompt = `${styleConfig.prompt}\n\n【原始内容】\n${cleanContent}`

  try {
    let result

    // 如果有配置 OpenAI API Key，调用真实API；否则使用模拟数据
    if (OPENAI_CONFIG.apiKey && OPENAI_CONFIG.baseURL) {
      result = await callHunyuan(fullPrompt)
    } else {
      console.log('未配置 OpenAI API Key 或 BaseURL，使用模拟优化')
      result = mockOptimize(cleanContent, style)
    }

    return {
      code: 0,
      data: result,
      style: style,
      styleName: styleConfig.name,
      message: '优化成功'
    }
  } catch (err) {
    console.error('优化简历失败:', err)
    // 出错时使用模拟优化兜底
    const fallback = mockOptimize(cleanContent, style)
    return {
      code: 0,
      data: fallback,
      style: style,
      styleName: styleConfig.name,
      message: '使用默认优化（API调用失败）'
    }
  }
}
