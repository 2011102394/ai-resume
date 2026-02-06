// pages/index/index.js
const { checkUsage, consumeUsage, getRemainingTime, MAX_FREE, MAX_TOTAL } = require('../../utils/usage')
const config = require('../../config/config.js')
const app = getApp()

Page({
  data: {
    workExperience: '',
    selectedStyle: 'data', // 默认选择数据突出型
    isOptimizing: false,
    typedTitle: '',
    fullTitle: '为你的工作经历画龙点睛',
    // 复制按钮状态
    copySuccess: false,
    // 弹窗相关数据
    showExampleModal: false,
    isGeneratingExample: false,
    exampleForm: {
      category: '',
      experience: '',
      position: ''
    },
    // 自定义职业分类相关
    isCustomCategory: false,
    customCategoryInput: '',
    // 选项数据
    categoryOptions: [], // 动态加载（预设+用户自定义）
    experienceOptions: [
      { value: 'junior', label: '1-3年（初级）' },
      { value: 'middle', label: '3-5年（中级）' },
      { value: 'senior', label: '5-10年（高级）' },
      { value: 'expert', label: '10年以上（专家）' }
    ],
    // 用户系统相关
    usageInfo: null,           // 次数信息
    adLoaded: false,            // 广告是否加载
    showAdButton: false,        // 是否显示广告按钮
    remainingTime: ''           // 剩余重置时间
  },

  onLoad: function () {
    this.startTypewriterAnimation()
    this.loadCategories()

    // 初始化用户系统
    this.updateUsageDisplay()

    // 初始化激励视频广告
    if (wx.createRewardedVideoAd) {
      this.initRewardedAd()
    } else {
      console.warn('[AD] 基础库版本不支持激励视频广告')
    }
  },

  onUnload: function () {
    this.stopTypewriterAnimation()

    // 销毁广告实例
    if (this.rewardedVideoAd) {
      this.rewardedVideoAd = null
    }
  },

  startTypewriterAnimation: function () {
    this.stopTypewriterAnimation()
    this.data._animationState = {
      isAnimating: true,
      phase: 'typing',
      currentIndex: 0,
      lastFrameTime: 0,
      pauseStartTime: 0
    }
    this._animateLoop()
  },

  stopTypewriterAnimation: function () {
    const state = this.data._animationState
    if (state) {
      state.isAnimating = false
    }
    if (this._animationTimerId) {
      clearTimeout(this._animationTimerId)
      this._animationTimerId = null
    }
  },

  _animateLoop: function () {
    const state = this.data._animationState
    if (!state || !state.isAnimating) return

    const now = Date.now()
    const fullTitle = this.data.fullTitle
    const TYPE_SPEED = 150
    const DELETE_SPEED = 100
    const WAIT_AFTER_TYPE = 2000
    const WAIT_AFTER_DELETE = 1000

    if (state.phase === 'typing') {
      if (!state.lastFrameTime) state.lastFrameTime = now
      const elapsed = now - state.lastFrameTime

      if (elapsed >= TYPE_SPEED) {
        if (state.currentIndex < fullTitle.length) {
          state.currentIndex++
          this.setData({
            typedTitle: fullTitle.substring(0, state.currentIndex)
          })
          state.lastFrameTime = now
        } else {
          state.phase = 'waiting_to_delete'
          state.pauseStartTime = now
        }
      }
    } else if (state.phase === 'waiting_to_delete') {
      if (now - state.pauseStartTime >= WAIT_AFTER_TYPE) {
        state.phase = 'deleting'
        state.currentIndex = fullTitle.length
        state.lastFrameTime = now
      }
    } else if (state.phase === 'deleting') {
      if (now - state.lastFrameTime >= DELETE_SPEED) {
        if (state.currentIndex > 0) {
          state.currentIndex--
          this.setData({
            typedTitle: fullTitle.substring(0, state.currentIndex)
          })
          state.lastFrameTime = now
        } else {
          state.phase = 'waiting_to_restart'
          state.pauseStartTime = now
        }
      }
    } else if (state.phase === 'waiting_to_restart') {
      if (now - state.pauseStartTime >= WAIT_AFTER_DELETE) {
        state.phase = 'typing'
        state.currentIndex = 0
        state.lastFrameTime = now
      }
    }

    if (state.isAnimating) {
      this._animationTimerId = setTimeout(this._animateLoop.bind(this), 16)
    }
  },

  // 处理文本输入
  bindTextAreaInput: function (e) {
    this.setData({
      workExperience: e.detail.value
    })
  },

  // 复制到剪贴板
  copyToClipboard: function () {
    const text = this.data.workExperience
    if (!text || !text.trim()) {
      wx.showToast({
        title: '没有可复制的内容',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        // 显示复制成功状态
        this.setData({ copySuccess: true })

        // 2秒后恢复按钮状态
        setTimeout(() => {
          this.setData({ copySuccess: false })
        }, 2000)

        // 显示成功提示（使用 wx.hideToast 先隐藏 setClipboardData 的默认提示）
        wx.hideToast()
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 加载职业分类列表
  loadCategories: function () {
    wx.cloud.callFunction({
      name: 'getCategories'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({
          categoryOptions: res.result.data.categories
        })
      }
    }).catch(err => {
      console.error('加载分类失败:', err)
      // 失败时使用默认分类
      this.setData({
        categoryOptions: [
          { value: 'tech', label: '技术研发', type: 'preset' },
          { value: 'product', label: '产品设计', type: 'preset' },
          { value: 'operation', label: '运营市场', type: 'preset' },
          { value: 'sales', label: '销售商务', type: 'preset' },
          { value: 'hr', label: '人力资源', type: 'preset' },
          { value: 'finance', label: '财务会计', type: 'preset' },
          { value: 'custom', label: '其他（自定义）', type: 'custom' }
        ]
      })
    })
  },

  // 打开参考示例弹窗
  fillExample: function () {
    this.setData({
      showExampleModal: true,
      'exampleForm.category': '',
      'exampleForm.experience': '',
      'exampleForm.position': '',
      isCustomCategory: false,
      customCategoryInput: ''
    })
    // 重新加载分类（获取最新的自定义分类）
    this.loadCategories()
  },

  // 关闭参考示例弹窗
  closeExampleModal: function () {
    this.setData({
      showExampleModal: false
    })
  },

  // 选择职业分类
  selectCategory: function (e) {
    const value = e.currentTarget.dataset.value
    const isCustom = value === 'custom'
    this.setData({
      'exampleForm.category': value,
      isCustomCategory: isCustom
    })
  },

  // 输入自定义职业分类
  inputCustomCategory: function (e) {
    this.setData({
      customCategoryInput: e.detail.value
    })
  },

  // 选择工作年限
  selectExperience: function (e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'exampleForm.experience': value
    })
  },

  // 输入工作岗位
  inputPosition: function (e) {
    this.setData({
      'exampleForm.position': e.detail.value
    })
  },

  // 确认生成参考示例
  confirmGenerateExample: async function () {
    const { category, experience, position } = this.data.exampleForm
    const { isCustomCategory, customCategoryInput } = this.data

    // 表单验证
    if (!category) {
      wx.showToast({
        title: '请选择职业分类',
        icon: 'none'
      })
      return
    }

    // 如果选择自定义分类，验证输入
    if (isCustomCategory) {
      if (!customCategoryInput.trim()) {
        wx.showToast({
          title: '请输入自定义职业',
          icon: 'none'
        })
        return
      }
    }

    if (!experience) {
      wx.showToast({
        title: '请选择工作年限',
        icon: 'none'
      })
      return
    }
    if (!position.trim()) {
      wx.showToast({
        title: '请输入工作岗位',
        icon: 'none'
      })
      return
    }

    // 显示加载状态
    this.setData({
      isGeneratingExample: true
    })

    try {
      let finalCategory = category
      let customName = ''

      // 如果是自定义分类，先保存
      if (isCustomCategory) {
        const saveRes = await wx.cloud.callFunction({
          name: 'saveCustomCategory',
          data: {
            name: customCategoryInput.trim()
          }
        })

        if (saveRes.result && saveRes.result.code === 0) {
          customName = saveRes.result.data.name
        } else {
          // 保存失败但继续生成，使用输入的值
          customName = customCategoryInput.trim()
        }
      }

      // 调用云函数生成示例
      const generateRes = await wx.cloud.callFunction({
        name: 'generateExample',
        data: {
          category: finalCategory,
          experience,
          position: position.trim(),
          isCustom: isCustomCategory,
          customName: customName
        }
      })

      if (generateRes.result && generateRes.result.code === 0) {
        // 填充生成的示例
        this.setData({
          workExperience: generateRes.result.data,
          showExampleModal: false,
          // 清空自定义输入
          isCustomCategory: false,
          customCategoryInput: ''
        })
        wx.showToast({
          title: '示例生成成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: generateRes.result.message || '生成失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('生成示例失败:', err)
      wx.showToast({
        title: '生成失败，请稍后重试',
        icon: 'none'
      })
    } finally {
      this.setData({
        isGeneratingExample: false
      })
    }
  },

  // 选择优化风格
  selectStyle: function (e) {
    this.setData({
      selectedStyle: e.currentTarget.dataset.style
    })
  },

  // 开始AI优化
  startOptimization: async function () {
    if (!this.data.workExperience.trim()) {
      wx.showToast({
        title: '请输入工作经历描述',
        icon: 'none'
      })
      return
    }

    // 1. 检查使用次数
    const usage = checkUsage()

    if (!usage.canUse) {
      if (usage.type === 'need_ad') {
        // 免费次数用完，提示看广告
        await this.showAdPrompt()
      } else if (usage.type === 'limit_reached') {
        // 达到上限，引导登录
        await this.showLoginPrompt()
      }
      return
    }

    // 显示加载状态
    this.setData({
      isOptimizing: true
    })

    try {
      // 调用云函数优化简历
      const res = await wx.cloud.callFunction({
        name: 'optimizeResume',
        data: {
          content: this.data.workExperience,
          style: this.data.selectedStyle
        },
        timeout: 60000 // 60秒超时，需要与云函数超时时间匹配
      })

      // 优化完成，移除加载状态
      this.setData({
        isOptimizing: false
      })

      // 检查返回结果
      if (res.result && res.result.code === 0) {
        // 2. 优化成功，扣减次数
        consumeUsage('free')

        // 3. 更新工作经历内容
        const optimizedText = res.result.data
        this.setData({
          workExperience: optimizedText
        })

        // 4. 保存历史记录（仅登录用户）
        if (app.checkLogin()) {
          this.saveHistoryRecord(this.data.workExperience, optimizedText)
        }

        // 5. 更新次数显示
        this.updateUsageDisplay()

        // 显示优化成功提示
        wx.showToast({
          title: res.result.message || '优化完成',
          icon: 'success',
          duration: 2000
        })
      } else {
        // 优化失败
        const errorMsg = res.result ? res.result.message : '优化失败，请重试'
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
      }
    } catch (err) {
      console.error('调用云函数失败:', err)
      // 移除加载状态
      this.setData({
        isOptimizing: false
      })

      wx.showToast({
        title: '网络错误，请检查网络后重试',
        icon: 'none',
        duration: 3000
      })
    }
  },

  /**
   * 更新次数显示
   */
  updateUsageDisplay: function() {
    const usage = checkUsage()
    const remainingTime = getRemainingTime()

    this.setData({
      usageInfo: usage,
      remainingTime: remainingTime,
      showAdButton: usage.type === 'need_ad' && this.data.adLoaded
    })
  },

  /**
   * 提示看广告
   */
  async showAdPrompt() {
    const usage = checkUsage()

    const res = await wx.showModal({
      title: '次数不足',
      content: `今日免费次数已用完，观看短视频可获取额外${usage.remaining}次使用机会`,
      confirmText: '观看广告',
      cancelText: '取消'
    })

    if (res.confirm) {
      await this.showRewardedAd()
    } else {
      // 引导登录
      await this.showLoginPrompt()
    }
  },

  /**
   * 提示登录
   */
  async showLoginPrompt() {
    if (app.checkLogin()) {
      // 已经登录
      wx.showModal({
        title: '次数已用完',
        content: '今日次数已达上限，' + this.data.remainingTime + '后重置',
        showCancel: false
      })
      return
    }

    const res = await wx.showModal({
      title: '解锁更多次数',
      content: '登录后可查看历史记录，并在其他设备继续编辑',
      confirmText: '去登录',
      cancelText: '取消'
    })

    if (res.confirm) {
      wx.navigateTo({ url: '/pages/login/login' })
    }
  },

  /**
   * 初始化激励视频广告
   */
  initRewardedAd: function() {
    // 从配置文件读取广告单元ID
    const AD_UNIT_ID = config.getAdUnitId('rewardedVideo')

    if (!AD_UNIT_ID && !config.isDevelopment()) {
      console.error('[AD] 生产环境广告单元ID未配置，请在config/config.js中配置')
      wx.showToast({
        title: '广告配置有误',
        icon: 'none'
      })
      return
    }

    console.log('[AD] 使用广告单元ID:', AD_UNIT_ID)

    this.rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: AD_UNIT_ID
    })

    // 监听广告加载成功
    this.rewardedVideoAd.onLoad(() => {
      console.log('[AD] 广告加载成功')
      this.setData({ adLoaded: true })
      this.updateUsageDisplay()
    })

    // 监听广告加载错误
    this.rewardedVideoAd.onError((err) => {
      console.error('[AD] 广告加载失败:', err)

      // 根据错误码给出不同提示
      let message = '广告加载失败'
      switch (err.errCode) {
        case 1004:
          // 无适合广告，属于正常情况
          this.setData({ adAvailable: false, showAdButton: false })
          return
        case 1000:
        case 1003:
          message = '服务暂时不可用，请稍后再试'
          break
        case 1002:
          message = '广告配置错误，请联系客服'
          break
        case 1005:
          message = '广告审核中，暂不可用'
          break
        case 1006:
          message = '广告审核未通过'
          break
        case 1007:
          message = '广告功能已被禁用'
          break
        case 1008:
          message = '广告位已关闭'
          break
      }

      this.setData({ adLoaded: false, showAdButton: false })
      if (err.errCode !== 1004) {
        wx.showToast({ title: message, icon: 'none' })
      }
    })

    // 监听广告关闭
    this.rewardedVideoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 用户看完广告，发放奖励
        this.onAdRewarded()
      } else {
        wx.showToast({
          title: '需要完整观看广告才能获得奖励',
          icon: 'none'
        })
      }
    })

    // 预加载广告
    this.rewardedVideoAd.load().catch(err => {
      console.error('[AD] 预加载失败:', err)
    })
  },

  /**
   * 显示激励视频广告
   */
  async showRewardedAd() {
    if (!this.rewardedVideoAd) {
      this.initRewardedAd()
    }

    try {
      await this.rewardedVideoAd.show()
    } catch (err) {
      console.error('[AD] 广告显示失败:', err)
      // 广告未加载，先加载再显示
      try {
        await this.rewardedVideoAd.load()
        await this.rewardedVideoAd.show()
      } catch (loadErr) {
        wx.showToast({ title: '广告加载失败，请稍后重试', icon: 'none' })
      }
    }
  },

  /**
   * 广告奖励回调
   */
  onAdRewarded: async function() {
    try {
      // 1. 调用云函数记录广告观看
      const res = await wx.cloud.callFunction({
        name: 'recordAdWatch',
        data: {
          adUnitId: config.getAdUnitId('rewardedVideo')  // 从配置文件读取
        }
      })

      if (res.result && res.result.code === 0) {
        // 2. 扣减广告次数
        const success = consumeUsage('ad')

        if (success) {
          this.updateUsageDisplay()

          wx.showToast({
            title: `获得额外1次，今日剩余${res.result.data.remaining}次`,
            icon: 'success',
            duration: 2000
          })
        } else {
          wx.showToast({
            title: '奖励发放失败',
            icon: 'none'
          })
        }
      } else if (res.result && res.result.code === -1) {
        // 防刷拦截
        wx.showToast({
          title: res.result.message || '请勿频繁观看广告',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '奖励发放失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('[AD] 奖励发放失败:', err)
      wx.showToast({ title: '奖励发放失败', icon: 'none' })
    }
  },

  /**
   * 保存历史记录（仅登录用户）
   */
  saveHistoryRecord: async function(originalContent, optimizedContent) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'saveHistoryRecord',
        data: {
          originalContent,
          optimizedContent,
          style: this.data.selectedStyle,
          styleName: this.getStyleName(this.data.selectedStyle)
        }
      })

      if (res.result && res.result.code === 0) {
        console.log('[HISTORY] 保存成功:', res.result.data.id)
      } else {
        console.warn('[HISTORY] 保存失败:', res.result.message)
      }
    } catch (err) {
      console.error('[HISTORY] 保存失败:', err)
      // 历史记录保存失败不影响主流程，静默处理
    }
  },

  /**
   * 获取优化风格名称
   */
  getStyleName: function(style) {
    const styleMap = {
      'data': '数据突出型',
      'leadership': '领导力凸显型',
      'concise': '简洁通用型'
    }
    return styleMap[style] || '数据突出型'
  },

  /**
   * 跳转到用户中心
   */
  goToUserCenter: function() {
    wx.navigateTo({ url: '/pages/usercenter/usercenter' })
  },
})
