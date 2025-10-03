// cloudfunctions/createGroup/index.js - 修正版
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 生成唯一邀请码的函数
async function generateUniqueInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let isUnique = false
  let inviteCode = ''
  
  while (!isUnique) {
    // 生成6位随机码
    inviteCode = ''
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // 检查是否已存在
    const existing = await db.collection('groups').where({
      inviteCode: inviteCode
    }).get()
    
    if (existing.data.length === 0) {
      isUnique = true
    }
  }
  
  return inviteCode
}

exports.main = async (event) => {
  const { groupName } = event
  const userId = cloud.getWXContext().OPENID

  // 验证群组名称
  if (!groupName || groupName.trim().length < 2) {
    return { code: 400, message: '群组名称至少2个字符' }
  }

  try {
    // 1. 生成唯一邀请码
    const inviteCode = await generateUniqueInviteCode()
    
    // 2. 在groups集合中创建新群组
    const groupRes = await db.collection('groups').add({
      data: {
        name: groupName.trim(),
        creatorId: userId,
        creatorNickName: '创建者', // 实际应从users表获取，暂时写死
        memberCount: 1, // 创建者自己算一个成员
        pendingCount: 0,
        inviteCode: inviteCode,
        createdTime: new Date()
      }
    })

    const groupId = groupRes._id

    // 3. 在group_members集合中，将创建者添加为成员
    await db.collection('group_members').add({
      data: {
        groupId: groupId,
        userId: userId,
        role: 'creator', // 角色：创建者
        status: 'approved', // 状态：已批准
        joinMethod: 'create', // 加入方式：创建
        applyTime: new Date(),
        approvedTime: new Date(),
        totalStudyTime: 0,
        totalWordsLearned: 0
      }
    })

    console.log(`群组创建成功: ${groupId}, 邀请码: ${inviteCode}`)

    return { 
      code: 200, 
      message: '创建成功',
      data: { 
        groupId: groupId,
        inviteCode: inviteCode
      }
    }
  } catch (err) {
    console.error('创建群组失败:', err)
    return { code: 500, message: '创建群组失败' }
  }
}