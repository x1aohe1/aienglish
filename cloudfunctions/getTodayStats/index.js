const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async function (event) {
  try {
    return {
      code: 200,
      data: {
        learnedWords: 0,
        studyTime: 0,
        accuracy: 0
      }
    }
  } catch (error) {
    console.error('获取今日统计失败:', error)
    return {
      code: 500,
      message: '获取今日统计失败'
    }
  }
}