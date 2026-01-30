// 云函数：保存用户自定义职业分类
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name } = event

  // 参数校验
  if (!name || typeof name !== 'string') {
    return {
      code: -1,
      message: '职业名称不能为空'
    }
  }

  // 清理并验证名称
  const cleanName = name.trim()
  if (cleanName.length === 0) {
    return {
      code: -1,
      message: '职业名称不能为空'
    }
  }
  if (cleanName.length > 20) {
    return {
      code: -1,
      message: '职业名称不能超过20个字符'
    }
  }

  // 检查是否包含特殊字符
  const invalidChars = /[<>\"'&]/
  if (invalidChars.test(cleanName)) {
    return {
      code: -1,
      message: '职业名称包含非法字符'
    }
  }

  try {
    // 查询用户是否已有记录
    const userRecord = await db.collection('user_custom_categories')
      .where({
        _openid: openid
      })
      .get()

    const customId = `custom_${Date.now()}`
    const newCategory = {
      id: customId,
      name: cleanName,
      createdAt: new Date()
    }

    if (userRecord.data.length > 0) {
      // 已有记录，检查是否已存在同名分类
      const existingCategories = userRecord.data[0].categories || []
      const exists = existingCategories.some(
        item => item.name.toLowerCase() === cleanName.toLowerCase()
      )

      if (exists) {
        // 已存在同名分类，返回已存在的
        const existing = existingCategories.find(
          item => item.name.toLowerCase() === cleanName.toLowerCase()
        )
        return {
          code: 0,
          data: {
            id: existing.id,
            name: existing.name
          },
          message: '分类已存在'
        }
      }

      // 更新记录，添加新分类
      await db.collection('user_custom_categories')
        .doc(userRecord.data[0]._id)
        .update({
          data: {
            categories: _.push(newCategory),
            updateTime: new Date()
          }
        })
    } else {
      // 创建新记录
      await db.collection('user_custom_categories').add({
        data: {
          _openid: openid,
          categories: [newCategory],
          updateTime: new Date()
        }
      })
    }

    return {
      code: 0,
      data: {
        id: customId,
        name: cleanName
      },
      message: '保存成功'
    }
  } catch (err) {
    console.error('保存自定义分类失败:', err)
    return {
      code: -1,
      data: null,
      message: err.message || '保存失败'
    }
  }
}