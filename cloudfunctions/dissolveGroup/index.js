// cloudfunctions/dissolveGroup/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 检查群组是否存在且用户是创建者
    const group = await db.collection('groups').doc(groupId).get()
    if (!group.data) {
      return { code: 404, message: '群组不存在' }
    }

    if (group.data.creatorId !== userId) {
      return { code: 403, message: '只有群组创建者可以解散群组' }
    }

    // 2. 删除群组所有相关数据（事务操作）
    const tasks = []

    // 2.1 删除群组成员记录
    tasks.push(
      db.collection('group_members').where({
        groupId: groupId
      }).remove()
    )

    // 2.2 删除群组本身
    tasks.push(
      db.collection('groups').doc(groupId).remove()
    )

    // 2.3 注意：这里应该还要删除与该群组相关的学习记录等
    // 但由于我们目前学习记录是跟用户绑定的，不是按群组分离的，所以暂时不处理

    // 执行所有删除操作
    await Promise.all(tasks)

    console.log(`群组 ${groupId} 已解散，删除了群组和成员记录`)

    return { code: 200, message: '群组已成功解散' }
  } catch (err) {
    console.error('解散群组失败:', err)
    return { code: 500, message: '解散失败，请重试' }
  }
}