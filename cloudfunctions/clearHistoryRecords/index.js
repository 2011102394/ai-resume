// 云函数：清空所有历史记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询所有历史记录（30天内）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const res = await db.collection('history_records')
      .where({
        _openid: openid,
        createTime: _.gte(thirtyDaysAgo)
      })
      .get()

    if (res.data.length === 0) {
      return {
        code: 0,
        message: '没有历史记录'
      }
    }

    // 批量删除（分批，每批20条）
    const batchSize = 20
    const batches = Math.ceil(res.data.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, res.data.length)
      const batch = res.data.slice(start, end)

      for (const record of batch) {
        try {
          await db.collection('history_records')
            .doc(record._id)
            .remove()
        } catch (err) {
          console.error('[HISTORY] 删除单条失败:', record._id, err)
        }
      }
    }

    console.log('[HISTORY] 清空历史记录成功:', {
      openid: openid.substring(0, 8) + '...',
      count: res.data.length
    })

    return {
      code: 0,
      data: {
        deletedCount: res.data.length
      },
      message: '清空成功'
    }
  } catch (err) {
    console.error('[HISTORY] 清空失败:', err)
    return {
      code: -1,
      message: err.message || '清空失败',
      type: 'ERROR'
    }
  }
}
