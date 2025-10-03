// cloudfunctions/joinGroup/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 检查群组是否存在
    const group = await db.collection('groups').doc(groupId).get()
    if (!group.data) {
      return { code: 404, message: '群组不存在' }
    }

    // 2. 检查用户是否已经在该群组中
    const existingMember = await db.collection('group_members').where({
      groupId: groupId,
      userId: userId
    }).get()

    if (existingMember.data.length > 0) {
      return { code: 400, message: '您已经在该群组中' }
    }

    // 3. 将用户添加为群组预备成员，审核通过后修改状态
    await db.collection('group_members').add({
        data: {
          groupId: groupId,
          userId: userId,
          role: 'member',
          status: 'pending', // 等待审核
          joinMethod: 'search', // 标记为搜索申请
          applyTime: new Date(),
          totalStudyTime: 0,
          totalWordsLearned: 0
        }
      })

    // 4. 更新群组的成员数量
    await db.collection('groups').doc(groupId).update({
      data: {
        memberCount: _.inc(1)
      }
    })

    return { code: 200, message: '加入群组成功' }
  } catch (err) {
    console.error(err)
    return { code: 500, message: '加入群组失败' }
  }
}