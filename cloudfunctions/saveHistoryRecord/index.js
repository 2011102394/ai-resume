// 云函数：保存历史记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const {
    originalContent,
    optimizedContent,
    style,
    styleName
  } = event

  // 参数校验
  if (!originalContent || !optimizedContent) {
    return {
      code: -1,
      message: '内容不能为空',
      type: 'INVALID_PARAM'
    }
  }

  try {
    const now = new Date()

    const res = await db.collection('history_records').add({
      data: {
        _openid: openid,
        originalContent,
        optimizedContent,
        style,
        styleName,
        modelName: 'hunyuan-turbos-latest',
        contentLength: originalContent.length,
        optimizedLength: optimizedContent.length,
        improvementRate: ((optimizedContent.length - originalContent.length) / originalContent.length * 100).toFixed(2),
        createTime: now,
        updateTime: now
      }
    })

    console.log('[HISTORY] 保存历史记录成功:', {
      openid: openid.substring(0, 8) + '...',
      recordId: res._id
    })

    return {
      code: 0,
      data: {
        id: res._id,
        createTime: now
      },
      message: '保存成功'
    }
  } catch (err) {
    console.error('[HISTORY] 保存失败:', err)
    return {
      code: -1,
      message: err.message || '保存失败',
      type: 'ERROR'
    }
  }
}
