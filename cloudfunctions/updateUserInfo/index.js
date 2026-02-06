// 云函数：更新用户信息（登录）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { userInfo } = event

  // 参数校验
  if (!userInfo) {
    return {
      code: -1,
      message: '用户信息不能为空',
      type: 'INVALID_PARAM'
    }
  }

  if (!userInfo.nickName || !userInfo.avatarUrl) {
    return {
      code: -1,
      message: '用户信息不完整',
      type: 'INVALID_PARAM'
    }
  }

  try {
    // 查询用户记录
    const userRes = await db.collection('users')
      .where({ _openid: openid })
      .get()

    const now = new Date()

    if (userRes.data.length === 0) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          _openid: openid,
          userType: 'registered',
          userInfo: userInfo,
          quota: {
            freeRemaining: 3,
            adRemaining: 0,
            totalUsed: 0,
            firstUseTime: now,
            lastUseTime: now
          },
          stats: {
            totalOptimizeCount: 0,
            totalAdWatchCount: 0,
            registerTime: now,
            lastLoginTime: now
          },
          createTime: now,
          updateTime: now
        }
      })

      console.log('[USER] 创建新用户成功:', {
        openid: openid.substring(0, 8) + '...',
        nickName: userInfo.nickName
      })
    } else {
      // 更新现有用户
      await db.collection('users')
        .doc(userRes.data[0]._id)
        .update({
          data: {
            userType: 'registered',
            userInfo: userInfo,
            'stats.lastLoginTime': now,
            updateTime: now
          }
        })

      console.log('[USER] 更新用户信息成功:', {
        openid: openid.substring(0, 8) + '...',
        nickName: userInfo.nickName
      })
    }

    return {
      code: 0,
      data: {
        openid: openid,
        userInfo: userInfo
      },
      message: '登录成功'
    }
  } catch (err) {
    console.error('[USER] 更新用户信息失败:', err)
    return {
      code: -1,
      message: err.message || '登录失败',
      type: 'ERROR'
    }
  }
}
