const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const db = cloud.database()
  
  // 要检查的集合列表
  const collectionsToCheck = [
    'groups', 'users', 'group_members', 'join_requests', 'study_records', 'words'
  ]

  console.log('开始诊断数据库结构...')
  
  try {
    const result = {
      timestamp: new Date(),
      collections: {}
    }

    // 检查每个集合
    for (const collectionName of collectionsToCheck) {
      console.log(`正在检查集合: ${collectionName}`)
      
      try {
        // 尝试获取集合的第一条记录
        const queryResult = await db.collection(collectionName).limit(1).get()
        
        result.collections[collectionName] = {
          exists: true,
          hasData: queryResult.data.length > 0,
          sampleFields: queryResult.data.length > 0 ? Object.keys(queryResult.data[0]) : [],
          totalCount: queryResult.data.length,
          sampleData: queryResult.data.length > 0 ? queryResult.data[0] : null
        }
        
        console.log(`✅ ${collectionName}: 存在, 有${queryResult.data.length}条数据`)
        if (queryResult.data.length > 0) {
          console.log(`字段: ${Object.keys(queryResult.data[0]).join(', ')}`)
        }
        
      } catch (error) {
        result.collections[collectionName] = {
          exists: false,
          error: error.message
        }
        console.log(`❌ ${collectionName}: 不存在 - ${error.message}`)
      }
    }

    console.log('诊断完成:', JSON.stringify(result, null, 2))
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('诊断失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}