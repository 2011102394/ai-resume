// 云函数：记录广告观看情况
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { adUnitId } = event

  const now = new Date()

  try {
    // 1. 防刷检查：查询最近10秒内的广告观看记录
    const recentAds = await db.collection('ad_logs')
      .where({
        _openid: openid,
        createTime: _.gte(new Date(now.getTime() - 10 * 1000))
      })
      .count()

    if (recentAds.total > 0) {
      console.log('[AD RECORD] 防刷拦截：10秒内已有观看记录')
      return {
        code: -1,
        message: '请勿频繁观看广告',
        type: 'RATE_LIMIT'
      }
    }

    // 2. 记录此次广告观看
    await db.collection('ad_logs').add({
      data: {
        _openid: openid,
        adUnitId: adUnitId || 'unknown',
        adType: 'rewarded_video',
        isEnded: true,
        rewardAmount: 1,
        startTime: now,
        endTime: now,
        createTime: now
      }
    })

    // 3. 查询用户剩余次数
    const userAdLogs = await db.collection('ad_logs')
      .where({
        _openid: openid,
        createTime: _.gte(new Date(now.getTime() - 24 * 60 * 60 * 1000))
      })
      .count()

    const adCount = userAdLogs.total
    const MAX_AD = 7  // 每天最多7次广告
    const MAX_TOTAL = 10  // 每天最多10次

    const remaining = MAX_TOTAL - (3 - (wx.getStorageSync('free_count') || 0)) - adCount

    console.log('[AD RECORD] 广告观看记录成功:', {
      openid: openid.substring(0, 8) + '...',
      adCount: adCount,
      remaining: remaining
    })

    return {
      code: 0,
      data: {
        remaining: Math.max(0, remaining)
      },
      message: '观看成功'
    }
  } catch (err) {
    console.error('[AD RECORD] 记录失败:', err)
    return {
      code: -1,
      message: err.message || '记录失败',
      type: 'ERROR'
    }
  }
}
