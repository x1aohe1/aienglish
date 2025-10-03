const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { groupId, targetUserId } = event
  const userId = cloud.getWXContext().OPENID

  console.log('移除成员参数:', { groupId, targetUserId, userId })

  try {
    // 1. 验证操作者是否为群主
    const group = await db.collection('groups').doc(groupId).get()
    if (!group.data) {
      return { code: 404, message: '群组不存在' }
    }
    
    if (group.data.creatorId !== userId) {
      return { code: 403, message: '没有管理权限' }
    }

    // 2. 不能踢出自己
    if (targetUserId === userId) {
      return { code: 400, message: '不能踢出自己' }
    }

    // 3. 从群组成员表中移除该用户
    const removeRes = await db.collection('group_members')
      .where({
        groupId: groupId,
        userId: targetUserId
      })
      .remove()

    console.log('移除成员结果:', removeRes)

    if (removeRes.stats.removed === 0) {
      return { code: 404, message: '成员不存在' }
    }

    // 4. 更新群组成员数量
    await db.collection('groups').doc(groupId).update({
      data: {
        memberCount: _.inc(-1)
      }
    })

    return { code: 200, message: '移除成员成功' }

  } catch (err) {
    console.error('移除成员失败:', err)
    return { code: 500, message: '移除失败: ' + err.message }
  }
}