// 云函数：删除单条历史记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { id } = event

  // 参数校验
  if (!id) {
    return {
      code: -1,
      message: '记录ID不能为空',
      type: 'INVALID_PARAM'
    }
  }

  try {
    // 先查询记录是否存在且属于当前用户
    const record = await db.collection('history_records')
      .where({
        _id: id,
        _openid: openid
      })
      .get()

    if (record.data.length === 0) {
      return {
        code: -1,
        message: '记录不存在或无权限',
        type: 'NOT_FOUND'
      }
    }

    // 删除记录
    await db.collection('history_records')
      .doc(id)
      .remove()

    console.log('[HISTORY] 删除历史记录成功:', {
      openid: openid.substring(0, 8) + '...',
      recordId: id
    })

    return {
      code: 0,
      message: '删除成功'
    }
  } catch (err) {
    console.error('[HISTORY] 删除失败:', err)
    return {
      code: -1,
      message: err.message || '删除失败',
      type: 'ERROR'
    }
  }
}
