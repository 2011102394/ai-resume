const app = getApp()

Page({
  data: {
    loading: false
  },

  /**
   * 微信授权登录
   */
  handleLogin: async function() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      // 获取用户信息
      const userProfile = await wx.getUserProfile({
        desc: '用于完善用户资料'  // 必传此参数，否则会报错
      })

      const userInfo = {
        nickName: userProfile.userInfo.nickName,
        avatarUrl: userProfile.userInfo.avatarUrl,
        gender: userProfile.userInfo.gender,
        language: userProfile.userInfo.language
      }

      // 调用云函数保存用户信息
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: { userInfo }
      })

      if (res.result && res.result.code === 0) {
        // 更新全局状态
        app.updateUserInfo(userInfo)

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        // 延迟跳转回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '登录失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('[LOGIN] 登录失败:', err)

      if (err.errMsg && err.errMsg.includes('getUserProfile:fail')) {
        wx.showToast({
          title: '已取消授权',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 返回首页
   */
  goBack: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
