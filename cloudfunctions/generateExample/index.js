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
// 混元大模型配置 - 方式一：直接填写（仅测试使用，生产环境请用方式二）
// ============================================
// const HUNYUAN_CONFIG = {
//   secretId: '你的SecretId',      // 替换为你的腾讯云 SecretId
//   secretKey: '你的SecretKey',    // 替换为你的腾讯云 SecretKey
//   region: 'ap-guangzhou'          // 广州地域
// }

// ============================================
// 混元大模型配置 - 方式二：环境变量（推荐，更安全）
// ============================================
// 1. 在微信开发者工具中，点击「云开发」→「云函数」→「环境变量」
// 2. 添加两个变量：TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY
// 3. 然后使用下面的配置：
const HUNYUAN_CONFIG = {
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  region: 'ap-guangzhou'
}

// 工作年限映射
const EXPERIENCE_MAP = {
  'junior': '1-3年（初级）',
  'middle': '3-5年（中级）',
  'senior': '5-10年（高级）',
  'expert': '10年以上（专家）'
}

// 调用混元大模型
async function callHunyuan(prompt) {
  // 使用腾讯云 API 3.0 签名方式
  const tencentcloud = require('tencentcloud-sdk-nodejs')
  const HunyuanClient = tencentcloud.hunyuan.v20230901.Client
  const models = tencentcloud.hunyuan.v20230901.Models

  const clientConfig = {
    credential: {
      secretId: HUNYUAN_CONFIG.secretId,
      secretKey: HUNYUAN_CONFIG.secretKey,
    },
    region: HUNYUAN_CONFIG.region,
    profile: {
      signMethod: 'TC3-HMAC-SHA256',
      httpProfile: {
        reqMethod: 'POST',
        reqTimeout: 30,
      },
    },
  }

  const client = new HunyuanClient(clientConfig)
  const req = new models.ChatCompletionsRequest()

  req.Model = 'hunyuan-turbos-latest'  // 使用混元 Turbo S 最新版
  req.Messages = [
    {
      Role: 'user',
      Content: prompt
    }
  ]
  req.Temperature = 0.7
  req.TopP = 0.8

  return new Promise((resolve, reject) => {
    client.ChatCompletions(req, (err, response) => {
      if (err) {
        reject(err)
        return
      }
      resolve(response.Choices[0].Message.Content)
    })
  })
}

// 备用：模拟生成（当没有配置API Key时使用）
function mockGenerate(category, experience, position) {
  const examples = {
    'tech': `负责公司${position}核心模块开发（S），承担系统性能优化与高并发处理目标（T），通过引入微服务架构+Redis缓存优化方案（A），将接口响应时间从800ms降至120ms，支撑日活用户从10万增长至100万，代码质量提升40%（R）`,
    'product': `主导${position}从0到1产品设计（S），承担用户增长与留存优化目标（T），通过深度用户调研+数据驱动迭代+精细化运营策略（A），实现DAU增长300%，用户留存率从30%提升至65%，NPS评分达到45分（R）`,
    'operation': `统筹${position}渠道运营工作（S），承担粉丝增长与转化提升目标（T），通过策划系列专题内容+裂变活动+精准投放策略（A），3个月内公众号涨粉200%，阅读量提升150%，转化率提升3个百分点（R）`,
    'sales': `负责华东区域${position}大客户拓展（S），承担年度销售业绩目标（T），通过建立客户分级管理体系+定制化解决方案+定期回访机制（A），年度签约额达1200万，超额完成KPI 140%，客户续约率95%（R）`,
    'hr': `主导${position}招聘体系搭建（S），承担人才梯队建设目标（T），通过优化招聘流程+建立人才库+完善面试评估体系（A），招聘周期缩短30%，年度招聘完成率110%，员工试用期通过率提升至92%（R）`,
    'finance': `负责公司${position}财务报表与预算管理（S），承担成本控制与财务合规目标（T），通过优化核算流程+建立预警机制+推进财务数字化（A），月度结账周期缩短5天，成本节约15%，审计合规率100%（R）`,
    'default': `负责${position}日常工作（S），承担业务目标与团队任务（T），通过优化工作流程+加强团队协作+提升专业能力（A），工作效率提升30%，任务完成率达到95%，获得客户/领导一致好评（R）`
  }

  return examples[category] || examples['default']
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

【要求】
1. 严格遵循STAR法则（Situation情境、Task任务、Action行动、Result结果）
2. 包含具体的量化数据（百分比、金额、人数、时间等）
3. 使用专业术语，体现岗位特性
4. 字数控制在80-150字之间
5. 只输出最终优化后的描述，不要解释

【示例格式】
"负责公司核心业务系统架构设计（S），承担百万级用户并发性能优化目标（T），通过引入Redis缓存+数据库分库分表方案（A），将接口响应时间从800ms降至120ms，支撑日活从10万增长至100万（R）"`

  try {
    let result

    // 如果有配置API Key，调用真实API；否则使用模拟数据
    if (HUNYUAN_CONFIG.secretId && HUNYUAN_CONFIG.secretKey) {
      result = await callHunyuan(prompt)
    } else {
      console.log('未配置混元API Key，使用模拟数据')
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
