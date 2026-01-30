// 云函数：获取职业分类列表（预设 + 用户自定义）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 预设职业分类
const PRESET_CATEGORIES = [
  { value: 'tech', label: '技术研发', type: 'preset' },
  { value: 'product', label: '产品设计', type: 'preset' },
  { value: 'operation', label: '运营市场', type: 'preset' },
  { value: 'sales', label: '销售商务', type: 'preset' },
  { value: 'hr', label: '人力资源', type: 'preset' },
  { value: 'finance', label: '财务会计', type: 'preset' },
  { value: 'custom', label: '其他（自定义）', type: 'custom' }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户自定义分类
    const userRecord = await db.collection('user_custom_categories')
      .where({
        _openid: openid
      })
      .get()

    let customCategories = []
    if (userRecord.data.length > 0 && userRecord.data[0].categories) {
      customCategories = userRecord.data[0].categories.map(item => ({
        value: item.id,
        label: item.name,
        type: 'user_custom'
      }))
    }

    // 合并预设分类和用户自定义分类
    // 将用户自定义分类插入到"其他"之前
    const allCategories = [
      ...PRESET_CATEGORIES.slice(0, 6),
      ...customCategories,
      PRESET_CATEGORIES[6]
    ]

    return {
      code: 0,
      data: {
        categories: allCategories,
        preset: PRESET_CATEGORIES.slice(0, 6),
        custom: customCategories
      },
      message: 'success'
    }
  } catch (err) {
    console.error('获取分类列表失败:', err)
    return {
      code: -1,
      data: null,
      message: err.message || '获取分类列表失败'
    }
  }
}