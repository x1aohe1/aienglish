// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 1. 从客户端传来的参数中获取要获取的单词数量，默认10个
  const count = event.count || 10

  try{
    // 2. 从数据库的“words”集合中随机获取指定数量的单词
    // 这里使用了聚合操作(.aggregate)和随机取样(.sample)来实现
    const result = await db.collection('words')
      .aggregate()
      .sample({
          size: count
      })
      .end()
    
    // 3. 成功获取，返回单词列表给小程序端
    return {
        code: 200,
        message: "成功",
        data: result.list
      }

  } catch (err) {
    // 4. 如果出错，返回错误信息
    console.error(err)
    return {
      code: 500,
      message: "服务器错误，获取单词失败",
      data: null
    }
   }
}