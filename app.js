// app.js
App({
  globalData: {
    openid: null,
    userType: 'implicit',  // implicit | registered
    userInfo: null
  },

  onLaunch: async function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    // 初始化云开发
    wx.cloud.init({
      traceUser: true,
    })

    // 初始化用户系统
    await this.initUserSystem()
  },

  /**
   * 初始化用户系统
   * 1. 静默获取OpenID
   * 2. 初始化每日使用统计
   */
  async initUserSystem() {
    try {
      // 1. 检查本地缓存的OpenID
      let openid = wx.getStorageSync('openid')
      let userInfo = wx.getStorageSync('userInfo')

      // 2. 如果没有OpenID，调用云函数获取
      if (!openid) {
        try {
          const res = await wx.cloud.callFunction({
            name: 'login'
          })
          openid = res.result.openid
          wx.setStorageSync('openid', openid)
          console.log('[USER SYSTEM] OpenID获取成功:', openid)
        } catch (err) {
          console.error('[USER SYSTEM] 获取OpenID失败:', err)
          // OpenID获取失败，不影响基本功能，可以后续重试
          openid = null
        }
      }

      // 3. 更新全局状态
      this.globalData.openid = openid
      this.globalData.userInfo = userInfo
      this.globalData.userType = userInfo ? 'registered' : 'implicit'

      // 4. 初始化每日使用统计（24小时滚动重置）
      this.initDailyUsage()

      console.log('[USER SYSTEM] 初始化完成:', {
        openid: openid ? '已获取' : '未获取',
        userType: this.globalData.userType,
        isLoggedIn: this.checkLogin()
      })
    } catch (err) {
      console.error('[USER SYSTEM] 初始化失败:', err)
    }
  },

  /**
   * 初始化每日使用统计
   * 采用24小时滚动重置机制
   */
  initDailyUsage() {
    const now = Date.now()
    const firstUseTime = wx.getStorageSync('first_use_time')

    if (!firstUseTime) {
      // 首次使用，记录时间
      wx.setStorageSync('first_use_time', now)
      wx.setStorageSync('free_count', 3)
      wx.setStorageSync('ad_count', 0)
      console.log('[USER SYSTEM] 首次使用，初始化配额')
    } else {
      // 检查是否超过24小时
      const elapsed = now - firstUseTime
      const hours24 = 24 * 60 * 60 * 1000

      if (elapsed >= hours24) {
        // 超过24小时，重置配额
        wx.setStorageSync('first_use_time', now)
        wx.setStorageSync('free_count', 3)
        wx.setStorageSync('ad_count', 0)
        console.log('[USER SYSTEM] 24小时重置，配额已更新')
      }
    }

    // 确保有初始值（防止数据异常）
    if (wx.getStorageSync('free_count') === undefined || wx.getStorageSync('free_count') === null) {
      wx.setStorageSync('free_count', 3)
    }
    if (wx.getStorageSync('ad_count') === undefined || wx.getStorageSync('ad_count') === null) {
      wx.setStorageSync('ad_count', 0)
    }
  },

  /**
   * 检查登录状态
   * @returns {Boolean} 是否已登录
   */
  checkLogin() {
    return this.globalData.userType === 'registered'
  },

  /**
   * 更新用户信息（登录后调用）
   * @param {Object} userInfo - 用户信息对象
   */
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.userType = 'registered'
    wx.setStorageSync('userInfo', userInfo)
    console.log('[USER SYSTEM] 用户信息已更新:', userInfo)
  },

  /**
   * 退出登录
   */
  logout() {
    this.globalData.userInfo = null
    this.globalData.userType = 'implicit'
    wx.removeStorageSync('userInfo')
    console.log('[USER SYSTEM] 用户已退出登录')
  },

  /**
   * 获取当前OpenID
   * @returns {String} OpenID
   */
  getOpenId() {
    return this.globalData.openid
  }
})
