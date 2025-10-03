// cloudfunctions/joinByInvite/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { inviteCode } = event
  const userId = cloud.getWXContext().OPENID

  // 验证邀请码
  if (!inviteCode || inviteCode.length !== 6) {
    return { code: 400, message: '邀请码格式不正确' }
  }

  try {
    // 1. 通过邀请码找到群组
    const groupRes = await db.collection('groups').where({
      inviteCode: inviteCode.toUpperCase() // 统一大写
    }).get()

    if (groupRes.data.length === 0) {
      return { code: 404, message: '邀请码无效或群组不存在' }
    }

    const groupInfo = groupRes.data[0]
    const groupId = groupInfo._id

    // 2. 检查用户是否已经在该群组中
    const existingMember = await db.collection('group_members').where({
      groupId: groupId,
      userId: userId
    }).get()

    if (existingMember.data.length > 0) {
      const member = existingMember.data[0]
      if (member.status === 'pending') {
        return { code: 400, message: '您已提交申请，等待审核中' }
      } else if (member.status === 'approved') {
        return { code: 400, message: '您已经在该群组中' }
      }
    }

    // 3. 直接加入群组（免审核）
    await db.collection('group_members').add({
      data: {
        groupId: groupId,
        userId: userId,
        role: 'member',
        status: 'approved', // 直接批准
        joinMethod: 'invite', // 标记为邀请码加入
        applyTime: new Date(),
        approvedTime: new Date(), // 立即批准
        totalStudyTime: 0,
        totalWordsLearned: 0
      }
    })

    // 4. 更新群组成员数量
    await db.collection('groups').doc(groupId).update({
      data: {
        memberCount: _.inc(1)
      }
    })

    return { 
      code: 200, 
      message: '加入群组成功！',
      data: {
        groupId: groupId,
        groupName: groupInfo.name
      }
    }
  } catch (err) {
    console.error('邀请码加入失败:', err)
    return { code: 500, message: '加入失败，请重试' }
  }
}