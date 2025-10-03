const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { groupId } = event
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 获取用户基本信息
    const userDoc = await db.collection('users').doc(userId).get()
    const userData = userDoc.data || {}
    
    // 2. 获取用户在群组中的排名
    let groupRank = 0
    if (groupId) {
      groupRank = await getUserGroupRank(userId, groupId)
    }

    return {
      code: 200,
      data: {
        totalWordsLearned: userData.totalWordsLearned || 0,
        continuousDays: userData.continuousDays || 0,
        groupRank: groupRank
      }
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    return {
      code: 500,
      message: '获取数据失败: ' + error.message
    }
  }
}

// 获取用户在群组中的排名
async function getUserGroupRank(userId, groupId) {
  try {
    // 获取群组所有成员按单词数排序
    const members = await db.collection('group_members')
      .where({
        groupId: groupId,
        status: 'approved'
      })
      .orderBy('totalWordsLearned', 'desc')
      .get()

    // 查找当前用户的排名
    const userIndex = members.data.findIndex(member => member.userId === userId)
    return userIndex >= 0 ? userIndex + 1 : 0
  } catch (error) {
    console.error('获取用户排名失败:', error)
    return 0
  }
}