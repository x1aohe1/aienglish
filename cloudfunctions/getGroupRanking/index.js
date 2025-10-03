// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { groupId, sortBy = 'words' } = event //sortBy: 'words' 或 'time'

  // 构建排序规则
  const orderByField = sortBy === 'words' ? 'totalWordsLearned' : 'totalStudyTime'

  try {
    const rankingList = await db.collection('group_members')
      .aggregate()
      .match({ 
        groupId: groupId,
        status: 'approved'  // 新增：只查询已批准的正式成员
      })
      .lookup({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      })
      .unwind('$userInfo')
      .sort({ [orderByField]: -1 })
      .limit(50)
      .end()
      
    console.log(`获取到 ${rankingList.list.length} 个成员的排名数据`)
    
    return {
      code: 200,
      data: rankingList.list,
      sortBy: sortBy
    }
  } catch (err) {
    console.error('获取排名失败:', err)
    return { 
      code: 500, 
      message: "获取排名失败: " + err.message
    }
  }
}