/**
 * 次数控制工具函数
 * 采用24小时滚动重置机制
 */

const MAX_FREE = 3      // 每天免费次数
const MAX_TOTAL = 10     // 每天最大次数（免费+广告）
const MAX_AD = MAX_TOTAL - MAX_FREE  // 每天可通过广告获得的最大次数

/**
 * 检查使用次数
 * @returns {Object} { canUse, type, remaining, message }
 */
function checkUsage() {
  const freeCount = wx.getStorageSync('free_count') || 0
  const adCount = wx.getStorageSync('ad_count') || 0

  // 1. 检查免费次数
  if (freeCount > 0) {
    return {
      canUse: true,
      type: 'free',
      remaining: freeCount,
      message: `今日可用免费${freeCount}次`
    }
  }

  // 2. 检查广告次数
  const totalUsed = freeCount + adCount
  const adMax = MAX_AD

  if (adCount < adMax) {
    const remaining = MAX_TOTAL - totalUsed
    return {
      canUse: false,
      type: 'need_ad',
      remaining: remaining,
      message: '免费次数已用完，观看短视频可获取额外使用机会',
      adRemaining: adMax - adCount  // 还可以看几次广告
    }
  }

  // 3. 达到上限
  return {
    canUse: false,
    type: 'limit_reached',
    remaining: 0,
    message: '今日使用次数已达上限，24小时后重置'
  }
}

/**
 * 扣减使用次数
 * @param {String} type - 'free' | 'ad'
 * @returns {Boolean} 是否成功
 */
function consumeUsage(type = 'free') {
  if (type === 'free') {
    let count = wx.getStorageSync('free_count') || 0
    if (count > 0) {
      wx.setStorageSync('free_count', count - 1)
      console.log('[USAGE] 扣减免费次数:', count, '->', count - 1)
      return true
    } else {
      console.warn('[USAGE] 免费次数不足')
      return false
    }
  } else if (type === 'ad') {
    let count = wx.getStorageSync('ad_count') || 0
    const adMax = MAX_AD

    if (count < adMax) {
      wx.setStorageSync('ad_count', count + 1)
      console.log('[USAGE] 增加广告次数:', count, '->', count + 1)
      return true
    } else {
      console.warn('[USAGE] 广告次数已达上限')
      return false
    }
  } else {
    console.error('[USAGE] 无效的使用类型:', type)
    return false
  }
}

/**
 * 获取24小时剩余时间
 * @returns {String} 格式化的剩余时间
 */
function getRemainingTime() {
  const firstUseTime = wx.getStorageSync('first_use_time') || Date.now()
  const nextResetTime = firstUseTime + 24 * 60 * 60 * 1000
  const remaining = nextResetTime - Date.now()

  if (remaining <= 0) {
    // 需要重置，调用initDailyUsage
    const app = getApp()
    if (app && app.initDailyUsage) {
      app.initDailyUsage()
    }
    return '即将重置'
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `${hours}小时${minutes}分钟后重置`
  } else {
    return `${minutes}分钟后重置`
  }
}

/**
 * 获取使用统计信息
 * @returns {Object} 使用统计
 */
function getUsageStats() {
  const freeCount = wx.getStorageSync('free_count') || 0
  const adCount = wx.getStorageSync('ad_count') || 0
  const totalUsed = (MAX_FREE - freeCount) + adCount

  return {
    freeRemaining: freeCount,
    adRemaining: adCount,
    totalUsed: totalUsed,
    totalRemaining: MAX_TOTAL - totalUsed,
    remainingTime: getRemainingTime()
  }
}

/**
 * 检查是否需要重置
 * @returns {Boolean} 是否需要重置
 */
function checkNeedReset() {
  const firstUseTime = wx.getStorageSync('first_use_time')
  if (!firstUseTime) {
    return false
  }

  const now = Date.now()
  const elapsed = now - firstUseTime
  const hours24 = 24 * 60 * 60 * 1000

  return elapsed >= hours24
}

module.exports = {
  checkUsage,
  consumeUsage,
  getRemainingTime,
  getUsageStats,
  checkNeedReset,
  MAX_FREE,
  MAX_TOTAL
}
