// cloudfunctions/getUserGroups/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const userId = cloud.getWXContext().OPENID

  try {
    // 1. 获取用户加入的所有群组成员关系
    const memberships = await db.collection('group_members').where({
      userId: userId,
      status: 'approved' // 只获取已批准的成员关系
    }).get()

    console.log('用户成员关系:', memberships.data)

    if (memberships.data.length === 0) {
      return { code: 200, data: [] }
    }

    const groupIds = memberships.data.map(m => m.groupId)

    // 2. 获取这些群组的详细信息
    const groups = await db.collection('groups').where({
      _id: db.command.in(groupIds)
    }).get()

    console.log('找到群组:', groups.data)

    // 3. 合并数据：在群组信息中加入用户角色
    const groupData = groups.data.map(group => {
      const membership = memberships.data.find(m => m.groupId === group._id)
      return {
        ...group,
        userRole: membership ? membership.role : 'member'
      }
    })

    return { code: 200, data: groupData }
  } catch (err) {
    console.error('获取群组列表失败:', err)
    return { code: 500, message: '获取群组列表失败' }
  }
}