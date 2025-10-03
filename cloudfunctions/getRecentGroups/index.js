const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async function (event) {
  var userId = cloud.getWXContext().OPENID

  try {
    var groupsResult = await db.collection('group_members')
      .where({
        userId: userId,
        status: 'approved'
      })
      .orderBy('lastStudiedTime', 'desc')
      .limit(3)
      .get()

    var recentGroups = []
    
    for (var i = 0; i < groupsResult.data.length; i++) {
      var member = groupsResult.data[i]
      var groupDoc = await db.collection('groups').doc(member.groupId).get()
      
      if (groupDoc.data) {
        var rankResult = await db.collection('group_members')
          .where({
            groupId: member.groupId,
            status: 'approved'
          })
          .orderBy('totalWordsLearned', 'desc')
          .get()
        
        var myRank = 0
        for (var j = 0; j < rankResult.data.length; j++) {
          if (rankResult.data[j].userId === userId) {
            myRank = j + 1
            break
          }
        }
        
        recentGroups.push({
          _id: groupDoc.data._id,
          name: groupDoc.data.name,
          memberCount: groupDoc.data.memberCount || 0,
          myRank: myRank
        })
      }
    }

    return {
      code: 200,
      data: recentGroups
    }
  } catch (error) {
    console.error('获取最近群组失败:', error)
    return {
      code: 500,
      message: '获取最近群组失败'
    }
  }
}