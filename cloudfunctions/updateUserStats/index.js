const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { groupId, studyTime = 0, wordsCount = 0, correctCount = 0, isSessionEnd = false } = event
  const userId = cloud.getWXContext().OPENID

  console.log('更新用户学习数据:', {
    userId, groupId, studyTime, wordsCount, correctCount, isSessionEnd
  })

  try {
    // 1. 更新用户个人学习统计
    await updateUserLearningStats(userId, studyTime, wordsCount, correctCount, isSessionEnd)
    
    // 2. 如果指定了群组且不是空值，更新群组成员学习数据
    if (groupId && groupId.trim() !== '') {
      await updateGroupMemberStats(userId, groupId, studyTime, wordsCount, correctCount)
    }

    return { code: 200, message: "学习数据更新成功" }
  } catch (err) {
    console.error('更新学习数据失败:', err)
    return { code: 500, message: "更新失败: " + err.message }
  }
}

// 更新用户个人学习统计
async function updateUserLearningStats(userId, studyTime, wordsCount, correctCount, isSessionEnd) {
  const userRef = db.collection('users').doc(userId)
  
  // 获取用户当前数据
  const userDoc = await userRef.get()
  const userData = userDoc.data || {}
  
  const updateData = {
    lastStudiedTime: new Date(),
    totalStudyTime: _.inc(studyTime),
    totalWordsLearned: _.inc(wordsCount),
    totalCorrectAnswers: _.inc(correctCount)
  }

  // 如果是学习会话结束，更新连续学习天数
  if (isSessionEnd) {
    await updateContinuousDays(userRef, userData)
  }

  // 更新用户数据
  try {
    await userRef.update({
      data: updateData
    })
  } catch (error) {
    // 如果用户记录不存在，创建新记录
    if (error.errCode === 'DATABASE_PERMISSION_DENIED') {
      await userRef.set({
        data: {
          _id: userId,
          ...updateData,
          createdTime: new Date(),
          continuousDays: 1
        }
      })
    } else {
      throw error
    }
  }
}

// 更新连续学习天数
async function updateContinuousDays(userRef, userData) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastStudied = userData.lastStudiedTime ? new Date(userData.lastStudiedTime) : null
  
  // 如果是今天第一次学习，检查是否需要更新连续天数
  if (!lastStudied || lastStudied.toDateString() !== today.toDateString()) {
    let continuousDays = userData.continuousDays || 0
    
    // 如果昨天有学习，连续天数+1，否则重置为1
    if (lastStudied && lastStudied.toDateString() === yesterday.toDateString()) {
      continuousDays += 1
    } else {
      continuousDays = 1
    }
    
    await userRef.update({
      data: {
        continuousDays: continuousDays
      }
    })
  }
}

// 更新群组成员学习统计
async function updateGroupMemberStats(userId, groupId, studyTime, wordsCount, correctCount) {
  console.log('更新群组成员数据:', { userId, groupId, studyTime, wordsCount, correctCount });
  
  const memberQuery = {
    groupId: groupId,
    userId: userId
  }

  try {
    // 先检查成员是否存在且状态为 approved
    const memberCheck = await db.collection('group_members')
      .where(memberQuery)
      .get()
    
    console.log('成员查询结果:', memberCheck.data);

    if (memberCheck.data.length === 0) {
      console.log('用户不是该群组的正式成员，跳过群组数据更新');
      return;
    }

    const member = memberCheck.data[0];
    if (member.status !== 'approved') {
      console.log('用户状态不是approved，跳过群组数据更新');
      return;
    }

    // 更新现有记录
    const updateRes = await db.collection('group_members')
      .where(memberQuery)
      .update({
        data: {
          totalStudyTime: _.inc(studyTime),
          totalWordsLearned: _.inc(wordsCount),
          lastStudiedTime: new Date()
        }
      })

    console.log('群组成员数据更新结果:', updateRes);

  } catch (error) {
    console.error('更新群组成员数据失败:', error);
  }
}