// cloudfunctions/quitGroup/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 检查用户是否在该群组中
    const memberRecord = await db.collection('group_members').where({
      groupId: groupId,
      userId: userId,
      status: 'approved'
    }).get()

    if (memberRecord.data.length === 0) {
      return { code: 404, message: '您不在该群组中' }
    }

    const member = memberRecord.data[0]

    // 2. 检查是否是群组创建者（创建者不能退出，只能解散）
    if (member.role === 'creator') {
      return { code: 403, message: '群组创建者不能退出，请解散群组' }
    }

    // 3. 删除成员记录
    await db.collection('group_members').doc(member._id).remove()

    // 4. 更新群组成员数量
    await db.collection('groups').doc(groupId).update({
      data: {
        memberCount: _.inc(-1)
      }
    })

    return { code: 200, message: '已成功退出群组' }
  } catch (err) {
    console.error('退出群组失败:', err)
    return { code: 500, message: '退出失败，请重试' }
  }
}