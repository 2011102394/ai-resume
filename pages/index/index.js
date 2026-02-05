// pages/index/index.js
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
    ]
  },

  onLoad: function () {
    this.startTypewriterAnimation()
    this.loadCategories()
  },

  onUnload: function () {
    this.stopTypewriterAnimation()
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
        // 优化成功，更新工作经历内容
        const optimizedText = res.result.data
        this.setData({
          workExperience: optimizedText
        })

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
  }
})
