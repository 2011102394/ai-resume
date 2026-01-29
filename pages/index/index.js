// pages/index/index.js
Page({
  data: {
    workExperience: '',
    selectedStyle: 'data', // 默认选择数据突出型
    isOptimizing: false,
    typedTitle: '',
    fullTitle: '为你的工作经历画龙点睛'
  },

  onLoad: function () {
    this.typeWriter()
  },

  // 打字机效果函数
  typeWriter: function () {
    let typedTitle = ''
    const fullTitle = this.data.fullTitle
    let index = 0
    
    const typeInterval = setInterval(() => {
      if (index < fullTitle.length) {
        typedTitle += fullTitle.charAt(index)
        this.setData({
          typedTitle: typedTitle
        })
        index++
      } else {
        clearInterval(typeInterval)
      }
    }, 150) // 每个字符的间隔时间，单位毫秒
  },

  // 处理文本输入
  bindTextAreaInput: function (e) {
    this.setData({
      workExperience: e.detail.value
    })
  },

  // 填充参考示例
  fillExample: function () {
    this.setData({
      workExperience: '负责公司公众号运营，撰写文章，增加粉丝'
    })
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
