// cloudfunctions/getUserRole/index.js
const cloud = require('wx-server-sdk')

// 必须初始化
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  console.log('开始执行 getUserRole 云函数')
  console.log('事件参数:', event)
  
  try {
    const { groupId } = event
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID

    console.log('用户ID:', userId)
    console.log('群组ID:', groupId)

    // 必须使用 await，确保数据库操作完成
    const db = cloud.database()
    
    // 查询用户在群组中的成员记录
    const result = await db.collection('group_members').where({
      groupId: groupId,
      userId: userId
    }).get()

    console.log('数据库查询结果:', result)

    let userRole = 'guest' // 默认角色
    
    if (result.data && result.data.length > 0) {
      userRole = result.data[0].role
      console.log('找到用户角色:', userRole)
    } else {
      console.log('用户不在群组中')
    }

    // 返回结构化的数据
    const response = {
      code: 200,
      message: '获取成功',
      data: {
        role: userRole,
        status: result.data && result.data.length > 0 ? result.data[0].status : 'none'
      }
    }
    
    console.log('云函数返回:', response)
    return response

  } catch (err) {
    console.error('云函数执行错误:', err)
    
    // 返回错误信息
    return {
      code: 500,
      message: '获取用户角色失败: ' + err.message,
      data: {
        role: 'member',
        status: 'error'
      }
    }
  }
}