const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async function (event) {
  var userId = cloud.getWXContext().OPENID

  try {
    var userDoc = await db.collection('users').doc(userId).get()
    var userData = userDoc.data || {}

    var groupsResult = await db.collection('group_members')
      .where({
        userId: userId,
        status: 'approved'
      })
      .count()

    return {
      code: 200,
      data: {
        totalWords: userData.totalWordsLearned || 0,
        continuousDays: userData.continuousDays || 0,
        totalGroups: groupsResult.total || 0
      }
    }
  } catch (error) {
    console.error('获取总体统计失败:', error)
    return {
      code: 500,
      message: '获取总体统计失败'
    }
  }
}