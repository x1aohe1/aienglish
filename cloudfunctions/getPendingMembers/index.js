const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    const db = cloud.database()
    
    // 1. 验证用户是否有管理权限（群组创建者）
    const group = await db.collection('groups').doc(groupId).get()
    if (!group.data || group.data.creatorId !== userId) {
      return { code: 403, message: '没有管理权限' }
    }

    // 2. 获取待审核成员列表 - 从 join_requests 表获取
    const pendingRequests = await db.collection('join_requests')
      .where({
        groupId: groupId,
        status: 'pending'
      })
      .orderBy('applyTime', 'asc')
      .get()

    console.log('待审核申请:', pendingRequests.data)

    // 3. 获取用户信息
    const pendingMembers = []
    for (const request of pendingRequests.data) {
      const userInfo = await db.collection('users').doc(request.userId).get()
      pendingMembers.push({
        ...request,
        userInfo: userInfo.data
      })
    }

    return {
      code: 200,
      message: '获取成功',
      data: pendingMembers
    }
  } catch (err) {
    console.error('获取待审核成员失败:', err)
    return { code: 500, message: '获取失败: ' + err.message }
  }
}