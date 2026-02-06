// 云函数：查询用户历史记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { limit = 20, offset = 0 } = event

  try {
    // 查询最近30天的历史记录
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const res = await db.collection('history_records')
      .where({
        _openid: openid,
        createTime: _.gte(thirtyDaysAgo)
      })
      .orderBy('createTime', 'desc')
      .skip(offset)
      .limit(limit)
      .get()

    // 查询总数
    const countRes = await db.collection('history_records')
      .where({
        _openid: openid,
        createTime: _.gte(thirtyDaysAgo)
      })
      .count()

    console.log('[HISTORY] 查询历史记录成功:', {
      openid: openid.substring(0, 8) + '...',
      count: res.data.length,
      total: countRes.total
    })

    return {
      code: 0,
      data: {
        records: res.data,
        total: countRes.total,
        hasMore: offset + res.data.length < countRes.total
      },
      message: '查询成功'
    }
  } catch (err) {
    console.error('[HISTORY] 查询失败:', err)
    return {
      code: -1,
      message: err.message || '查询失败',
      type: 'ERROR'
    }
  }
}
