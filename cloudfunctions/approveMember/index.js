const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { memberId, groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 验证管理权限
    const group = await db.collection('groups').doc(groupId).get()
    if (!group.data || group.data.creatorId !== userId) {
      return { code: 403, message: '没有管理权限' }
    }

    // 2. 获取申请信息
    const request = await db.collection('join_requests').doc(memberId).get()
    if (!request.data) {
      return { code: 404, message: '申请记录不存在' }
    }

    // 3. 更新申请状态为已批准
    await db.collection('join_requests').doc(memberId).update({
      data: {
        status: 'approved',
        approvedTime: new Date()
      }
    })

    // 4. 添加到群组成员表
    await db.collection('group_members').add({
      data: {
        userId: request.data.userId,
        groupId: groupId,
        role: 'member',
        status: 'approved',
        joinMethod: 'approve',
        totalStudyTime: 0,
        totalWordsLearned: 0,
        joinedTime: new Date(),
        applyTime: request.data.applyTime,
        approvedTime: new Date()
      }
    })

    // 5. 更新群组成员数量
    await db.collection('groups').doc(groupId).update({
      data: {
        memberCount: _.inc(1),
        pendingCount: _.inc(-1)
      }
    })

    return { code: 200, message: '已批准加入' }
  } catch (err) {
    console.error('批准成员失败:', err)
    return { code: 500, message: '批准失败: ' + err.message }
  }
}