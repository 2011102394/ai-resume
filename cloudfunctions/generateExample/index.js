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

// 云函数：调用混元大模型生成参考示例
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

// 工作年限映射
const EXPERIENCE_MAP = {
  'junior': '1-3年（初级）',
  'middle': '3-5年（中级）',
  'senior': '5-10年（高级）',
  'expert': '10年以上（专家）'
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

// 备用：模拟生成（当没有配置API Key时使用）
function mockGenerate(category, experience, position) {
  // 根据岗位关键词返回更贴合的示例
  const positionLower = position.toLowerCase()

  // 前端相关
  if (positionLower.includes('前端') || positionLower.includes('frontend') || positionLower.includes('web')) {
    return `负责公司电商平台前端架构升级，承担首页加载性能优化目标，通过引入Vue3+TypeScript重构核心组件、实施代码分割和懒加载策略，将首屏加载时间从4.2秒降至1.1秒，用户跳出率降低35%，代码可维护性评分从60分提升至92分，获得季度技术之星称号。`
  }

  // 后端相关
  if (positionLower.includes('后端') || positionLower.includes('backend') || positionLower.includes('java') || positionLower.includes('node')) {
    return `负责订单系统高并发架构设计，承担双十一峰值流量支撑目标，通过引入Redis集群缓存+消息队列异步处理+数据库读写分离方案，将接口QPS从500提升至8000，系统可用性达到99.99%，成功支撑单日千万级订单处理。`
  }

  // 产品经理
  if (positionLower.includes('产品') || positionLower.includes('pm')) {
    return `主导供应链金融产品设计，承担产品商业化落地目标，通过深入调研10+核心客户+设计差异化风控模型+推动敏捷迭代，实现产品上线3个月签约客户50家，放款规模突破2亿元，产品复购率达到78%，成为公司新增长引擎。`
  }

  // UI设计
  if (positionLower.includes('ui') || positionLower.includes('设计') || positionLower.includes('ux')) {
    return `负责公司设计系统搭建，承担提升设计效率和用户体验一致性目标，通过建立组件库+制定设计规范+推动设计走查机制，设计交付效率提升60%，设计还原度从75%提升至95%，用户满意度调研得分提升28%。`
  }

  // 测试
  if (positionLower.includes('测试') || positionLower.includes('qa')) {
    return `负责自动化测试体系建设，承担提升测试覆盖率和发布效率目标，通过引入Playwright自动化测试框架+搭建CI/CD流水线+实施质量门禁，自动化测试覆盖率从30%提升至85%，回归测试时间从3天缩短至2小时，线上Bug率降低60%。`
  }

  // 运维
  if (positionLower.includes('运维') || positionLower.includes('devops') || positionLower.includes('sre')) {
    return `负责云原生架构改造，承担提升系统稳定性和资源利用率目标，通过引入Kubernetes容器编排+Prometheus监控体系+GitOps部署流程，系统可用性从99.5%提升至99.99%，服务器成本降低45%，故障平均恢复时间从30分钟缩短至5分钟。`
  }

  // 运营
  if (category === 'operation') {
    return `统筹公司新媒体矩阵运营，承担粉丝增长与转化提升目标，通过策划系列专题内容+裂变活动+精准投放策略，3个月内公众号涨粉200%，阅读量提升150%，转化率提升3个百分点，单月GMV突破500万。`
  }

  // 销售
  if (category === 'sales') {
    return `负责华东区域大客户拓展，承担年度销售业绩目标，通过建立客户分级管理体系+定制化解决方案+定期回访机制，年度签约额达1200万，超额完成KPI 140%，客户续约率95%，新签3家行业头部客户。`
  }

  // HR
  if (category === 'hr') {
    return `主导公司招聘体系搭建，承担人才梯队建设目标，通过优化招聘流程+建立人才库+完善面试评估体系，招聘周期缩短30%，年度招聘完成率110%，员工试用期通过率提升至92%，关键岗位到岗时间缩短50%。`
  }

  // 财务
  if (category === 'finance') {
    return `负责公司财务报表与预算管理，承担成本控制与财务合规目标，通过优化核算流程+建立预警机制+推进财务数字化，月度结账周期缩短5天，成本节约15%，审计合规率100%，为公司融资提供精准财务数据支持。`
  }

  // 默认通用
  return `负责${position}核心工作，承担业务目标与团队任务，通过优化工作流程+提升专业能力+加强团队协作，工作效率提升30%，任务完成率达到95%，获得客户和领导一致好评，连续两个季度绩效评级为A。`
}

exports.main = async (event, context) => {
  const { category, experience, position, isCustom, customName } = event

  // 参数校验
  if (!category) {
    return {
      code: -1,
      message: '职业分类不能为空'
    }
  }
  if (!experience) {
    return {
      code: -1,
      message: '工作年限不能为空'
    }
  }
  if (!position || !position.trim()) {
    return {
      code: -1,
      message: '工作岗位不能为空'
    }
  }

  const cleanPosition = position.trim()
  const categoryName = isCustom ? customName : getCategoryLabel(category)
  const experienceLabel = EXPERIENCE_MAP[experience] || experience

  const prompt = `你是一位资深HR和简历优化专家。请根据以下信息，用STAR法则生成一段高质量的工作经历描述：

【岗位信息】
- 职业分类：${categoryName}
- 工作年限：${experienceLabel}
- 具体岗位：${cleanPosition}

【核心要求】
1. 严格遵循STAR法则内在逻辑（情境-任务-行动-结果），但**不要**在文本中出现（S）（T）（A）（R）标识
2. 内容必须紧密结合"${cleanPosition}"这个具体岗位的实际工作内容，使用真实的技术/工具/方法
3. 包含具体的量化数据（百分比、金额、人数、时间、代码量等）
4. 使用专业术语，体现该岗位的专业性和技术深度
5. 字数控制在80-150字之间
6. 只输出最终优化后的描述，不要解释，不要分段

【不同岗位的示例】

前端工程师示例：
负责公司电商平台前端架构升级，承担首页加载性能优化目标，通过引入Vue3+TypeScript重构核心组件、实施代码分割和懒加载策略，将首屏加载时间从4.2秒降至1.1秒，用户跳出率降低35%，代码可维护性评分从60分提升至92分，获得季度技术之星称号。

后端工程师示例：
负责订单系统高并发架构设计，承担双十一峰值流量支撑目标，通过引入Redis集群缓存+消息队列异步处理+数据库读写分离方案，将接口QPS从500提升至8000，系统可用性达到99.99%，成功支撑单日千万级订单处理，为公司节省服务器成本40%。

产品经理示例：
主导供应链金融产品设计，承担产品商业化落地目标，通过深入调研10+核心客户+设计差异化风控模型+推动敏捷迭代，实现产品上线3个月签约客户50家，放款规模突破2亿元，产品复购率达到78%，成为公司新增长引擎。

【重要提醒】
- 你是为"${cleanPosition}"写简历，内容必须真实反映该岗位的工作
- 技术岗位要写具体技术栈（如Vue/React/Node.js/MySQL等）
- 不要生搬硬套，要结合年限体现相应的能力深度
- 直接输出纯文本，不要有任何格式标记`

  try {
    let result

    // 如果有配置 OpenAI API Key，调用真实API；否则使用模拟数据
    if (OPENAI_CONFIG.apiKey && OPENAI_CONFIG.baseURL) {
      result = await callHunyuan(prompt)
    } else {
      console.log('未配置 OpenAI API Key 或 BaseURL，使用模拟数据')
      result = mockGenerate(category, experience, cleanPosition)
    }

    return {
      code: 0,
      data: result,
      message: '生成成功'
    }
  } catch (err) {
    console.error('生成示例失败:', err)
    // 出错时使用模拟数据兜底
    const fallback = mockGenerate(category, experience, cleanPosition)
    return {
      code: 0,
      data: fallback,
      message: '使用默认示例'
    }
  }
}

// 获取分类标签
function getCategoryLabel(value) {
  const map = {
    'tech': '技术研发',
    'product': '产品设计',
    'operation': '运营市场',
    'sales': '销售商务',
    'hr': '人力资源',
    'finance': '财务会计'
  }
  return map[value] || value
}
