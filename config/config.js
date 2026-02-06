/**
 * 小程序配置文件
 * 开发环境使用开发环境广告ID
 * 生产环境使用生产环境广告ID
 */

// 获取当前环境
const env = wx.getAccountInfoSync().miniProgram.envVersion

const config = {
  // 当前环境
  env: env === 'develop' ? 'development' : 'production',

  // 激励视频广告配置
  ad: {
    // 激励视频广告单元ID（需要替换为真实的广告单元ID）
    // 在微信小程序后台 → 推广与搜索 → 流量主 → 广告位管理中创建激励视频广告位
    // 创建成功后，页面会显示广告单元ID，格式为：adunit-xxxxxxxxxxxxxxx
    rewardedVideo: {
      // 开发环境：可以先留空，广告在开发者工具中可能无法预览
      development: '',  // 例如：'adunit-dev-1234567890123456'

      // 生产环境：必须替换为真实的广告单元ID
      production: 'adunit-xxxxxxxxxxxxxxx'  // ⚠️ 替换为真实的广告单元ID
    }
  },

  // 获取当前环境的广告单元ID
  getAdUnitId: function(adName = 'rewardedVideo') {
    const currentEnv = this.env === 'development' ? 'development' : 'production'
    const adUnitId = this.ad[adName][currentEnv]

    if (!adUnitId && this.env === 'production') {
      console.warn('[CONFIG] 生产环境广告单元ID未配置，请在微信小程序后台创建激励视频广告位')
    }

    return adUnitId
  },

  // 开发环境标识
  isDevelopment: function() {
    return this.env === 'development'
  },

  // 生产环境标识
  isProduction: function() {
    return this.env === 'production'
  }
}

module.exports = config
