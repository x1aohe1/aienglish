const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async function (event) {
  var userId = cloud.getWXContext().OPENID

  try {
    var userDoc = await db.collection('users').doc(userId).get()
    var userData = userDoc.data || {
      nickName: '学习者',
      avatarUrl: ''
    }

    return {
      code: 200,
      data: userData
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      code: 500,
      message: '获取用户信息失败'
    }
  }
}