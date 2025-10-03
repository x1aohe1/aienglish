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

    // 2. 更新申请状态为已拒绝
    await db.collection('join_requests').doc(memberId).update({
      data: {
        status: 'rejected',
        rejectedTime: new Date()
      }
    })

    // 3. 更新群组待审核数量
    await db.collection('groups').doc(groupId).update({
      data: {
        pendingCount: _.inc(-1)
      }
    })

    return { code: 200, message: '已拒绝加入' }
  } catch (err) {
    console.error('拒绝成员失败:', err)
    return { code: 500, message: '拒绝失败: ' + err.message }
  }
}