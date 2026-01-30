// pages/index/index.js
Page({
  data: {
    workExperience: '',
    selectedStyle: 'data', // 默认选择数据突出型
    isOptimizing: false,
    typedTitle: '',
    fullTitle: '为你的工作经历画龙点睛',
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
    this.typeWriter()
    this.loadCategories()
  },

  // 打字机效果函数 - 循环版
  typeWriter: function () {
    const fullTitle = this.data.fullTitle
    let typedTitle = ''
    let index = 0
    
    // 打字阶段
    const typeInterval = setInterval(() => {
      if (index < fullTitle.length) {
        typedTitle += fullTitle.charAt(index)
        this.setData({
          typedTitle: typedTitle
        })
        index++
      } else {
        clearInterval(typeInterval)
        // 打字完成后，等待2秒开始消失
        setTimeout(() => {
          this.fadeOutTitle()
        }, 2000)
      }
    }, 150) // 每个字符的间隔时间，单位毫秒
  },

  // 标题淡出效果
  fadeOutTitle: function () {
    const fullTitle = this.data.fullTitle
    let typedTitle = fullTitle
    let index = fullTitle.length - 1
    
    const fadeInterval = setInterval(() => {
      if (index >= 0) {
        typedTitle = typedTitle.substring(0, index)
        this.setData({
          typedTitle: typedTitle
        })
        index--
      } else {
        clearInterval(fadeInterval)
        // 消失完成后，等待1秒重新开始
        setTimeout(() => {
          this.typeWriter()
        }, 1000)
      }
    }, 100) // 每个字符的消失间隔时间，单位毫秒
  },

  // 处理文本输入
  bindTextAreaInput: function (e) {
    this.setData({
      workExperience: e.detail.value
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
  startOptimization: function () {
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

    // 模拟AI优化过程（实际项目中这里会调用云函数）
    setTimeout(() => {
      // 优化完成
      this.setData({
        isOptimizing: false
      })
      
      // 显示优化成功提示
      wx.showToast({
        title: '优化完成',
        icon: 'success'
      })
      
      // 这里可以添加优化结果的处理逻辑
    }, 2000)
  }
})
