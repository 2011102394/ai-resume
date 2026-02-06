const app = getApp()
const { getUsageStats } = require('../../utils/usage')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    usageStats: null,
    loading: false
  },

  onLoad: function() {
    this.checkLogin()
  },

  onShow: function() {
    if (this.data.isLoggedIn) {
      this.loadUserStats()
    }
  },

  /**
   * 检查登录状态
   */
  checkLogin: function() {
    const isLoggedIn = app.checkLogin()
    const userInfo = app.globalData.userInfo

    if (!isLoggedIn || !userInfo) {
      // 未登录，跳转到登录页
      wx.showModal({
        title: '需要登录',
        content: '登录后可查看用户中心',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' })
          } else {
            wx.switchTab({ url: '/pages/index/index' })
          }
        }
      })
      return
    }

    this.setData({
      isLoggedIn: true,
      userInfo: userInfo
    })

    // 加载使用统计
    this.loadUserStats()
  },

  /**
   * 加载使用统计
   */
  loadUserStats: async function() {
    this.setData({ loading: true })

    try {
      // 从本地存储获取统计信息
      const stats = getUsageStats()

      this.setData({
        usageStats: stats,
        loading: false
      })
    } catch (err) {
      console.error('[USERCENTER] 加载统计失败:', err)
      this.setData({ loading: false })
    }
  },

  /**
   * 退出登录
   */
  handleLogout: async function() {
    const res = await wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消'
    })

    if (res.confirm) {
      app.logout()

      wx.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 1500
      })

      // 跳转回首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    }
  },

  /**
   * 查看历史记录
   */
  goToHistory: function() {
    // 暂时跳转到首页（历史记录页面后续开发）
    wx.showToast({
      title: '历史记录功能开发中',
      icon: 'none'
    })
  },

  /**
   * 打开设置
   */
  goToSettings: function() {
    // 暂时跳转到首页（设置页面后续开发）
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  /**
   * 关于我们
   */
  showAbout: function() {
    wx.showModal({
      title: '关于简历点睛',
      content: 'AI智能简历优化助手\n\n版本：v0.7.0\n\n使用腾讯混元大模型，帮助你快速优化工作经历描述',
      showCancel: false
    })
  }
})
