const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  console.log('开始生成测试数据...')
  
  try {
    // 1. 创建测试用户
    console.log('创建测试用户...')
    const testUsers = await createTestUsers(db)
    
    // 2. 创建测试群组
    console.log('创建测试群组...')
    const testGroups = await createTestGroups(db, testUsers)
    
    // 3. 创建群组成员关系
    console.log('创建群组成员...')
    await createGroupMembers(db, testUsers, testGroups)
    
    // 4. 创建加入申请（用于审核测试）
    console.log('创建加入申请...')
    await createJoinRequests(db, testUsers, testGroups)
    await createTechWordsData(db)
    // 5. 创建学习记录
    console.log('创建学习记录...')
    await createStudyRecords(db, testUsers, testGroups)
    
    console.log('✅ 测试数据生成完成！')
    
    return {
      success: true,
      data: {
        users: testUsers,
        groups: testGroups,
        message: '测试数据生成完成，可以测试审核功能了'
      }
    }
    
  } catch (error) {
    console.error('生成测试数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 创建测试用户
async function createTestUsers(db) {
  const users = [
    {
      _id: 'test_user_creator',
      nickName: '群主小明',
      avatarUrl: '',
      createdTime: new Date('2024-01-15T10:00:00Z')
    },
    {
      _id: 'test_user_member1',
      nickName: '学习达人小红',
      avatarUrl: '',
      createdTime: new Date('2024-01-16T14:30:00Z')
    },
    {
      _id: 'test_user_member2',
      nickName: '单词王刚',
      avatarUrl: '',
      createdTime: new Date('2024-01-17T09:15:00Z')
    },
    {
      _id: 'test_user_pending1',
      nickName: '申请者小李',
      avatarUrl: '',
      createdTime: new Date('2024-01-18T16:45:00Z')
    },
    {
      _id: 'test_user_pending2',
      nickName: '新手小张',
      avatarUrl: '',
      createdTime: new Date('2024-01-19T11:20:00Z')
    }
  ]
  
  for (const user of users) {
    try {
      await db.collection('users').add({
        data: user
      })
    } catch (error) {
      // 用户可能已存在，跳过
      console.log(`用户 ${user._id} 可能已存在`)
    }
  }
  
  return users
}

// 创建测试群组
async function createTestGroups(db, users) {
  const groups = [
    {
      _id: 'test_group_1',
      name: '英语学习精英组',
      creatorId: users[0]._id,
      inviteCode: 'ELITE2024',
      memberCount: 3,
      pendingCount: 2,
      createdTime: new Date('2024-01-20T10:00:00Z')
    },
    {
      _id: 'test_group_2', 
      name: '四级冲刺小队',
      creatorId: users[1]._id,
      inviteCode: 'CET4RUN',
      memberCount: 2,
      pendingCount: 1,
      createdTime: new Date('2024-01-21T14:20:00Z')
    }
  ]
  
  for (const group of groups) {
    try {
      await db.collection('groups').add({
        data: group
      })
    } catch (error) {
      console.log(`群组 ${group._id} 可能已存在`)
    }
  }
  
  return groups
}

// 创建群组成员关系
async function createGroupMembers(db, users, groups) {
  const members = [
    // 群组1的成员
    {
      _id: 'member_group1_creator',
      userId: users[0]._id,
      groupId: groups[0]._id,
      role: 'creator',
      status: 'approved',
      joinMethod: 'create',
      totalStudyTime: 7200,
      totalWordsLearned: 300,
      joinedTime: new Date('2024-01-20T10:00:00Z'),
      applyTime: new Date('2024-01-20T10:00:00Z'),
      approvedTime: new Date('2024-01-20T10:00:00Z')
    },
    {
      _id: 'member_group1_member1',
      userId: users[1]._id,
      groupId: groups[0]._id,
      role: 'member', 
      status: 'approved',
      joinMethod: 'invite',
      totalStudyTime: 5400,
      totalWordsLearned: 250,
      joinedTime: new Date('2024-01-21T09:30:00Z'),
      applyTime: new Date('2024-01-21T09:30:00Z'),
      approvedTime: new Date('2024-01-21T10:00:00Z')
    },
    {
      _id: 'member_group1_member2',
      userId: users[2]._id,
      groupId: groups[0]._id,
      role: 'member',
      status: 'approved', 
      joinMethod: 'invite',
      totalStudyTime: 4800,
      totalWordsLearned: 200,
      joinedTime: new Date('2024-01-22T14:15:00Z'),
      applyTime: new Date('2024-01-22T14:15:00Z'),
      approvedTime: new Date('2024-01-22T14:30:00Z')
    },
    
    // 群组2的成员
    {
      _id: 'member_group2_creator',
      userId: users[1]._id,
      groupId: groups[1]._id,
      role: 'creator',
      status: 'approved',
      joinMethod: 'create',
      totalStudyTime: 3600,
      totalWordsLearned: 180,
      joinedTime: new Date('2024-01-21T14:20:00Z'),
      applyTime: new Date('2024-01-21T14:20:00Z'),
      approvedTime: new Date('2024-01-21T14:20:00Z')
    },
    {
      _id: 'member_group2_member1',
      userId: users[2]._id,
      groupId: groups[1]._id,
      role: 'member',
      status: 'approved',
      joinMethod: 'invite', 
      totalStudyTime: 4200,
      totalWordsLearned: 220,
      joinedTime: new Date('2024-01-22T10:45:00Z'),
      applyTime: new Date('2024-01-22T10:45:00Z'),
      approvedTime: new Date('2024-01-22T11:00:00Z')
    }
  ]
  
  for (const member of members) {
    try {
      await db.collection('group_members').add({
        data: member
      })
    } catch (error) {
      console.log(`成员 ${member._id} 可能已存在`)
    }
  }
}

// 创建加入申请（需要先创建集合）
async function createJoinRequests(db, users, groups) {
  // 先确保集合存在（通过插入一条记录）
  const requests = [
    {
      _id: 'request_1',
      groupId: groups[0]._id,
      userId: users[3]._id,
      applicantInfo: {
        nickName: users[3].nickName,
        avatarUrl: users[3].avatarUrl
      },
      status: 'pending',
      applyTime: new Date('2024-01-23T09:00:00Z'),
      applyMethod: 'search'
    },
    {
      _id: 'request_2',
      groupId: groups[0]._id, 
      userId: users[4]._id,
      applicantInfo: {
        nickName: users[4].nickName,
        avatarUrl: users[4].avatarUrl
      },
      status: 'pending',
      applyTime: new Date('2024-01-23T14:30:00Z'),
      applyMethod: 'search'
    },
    {
      _id: 'request_3',
      groupId: groups[1]._id,
      userId: users[3]._id,
      applicantInfo: {
        nickName: users[3].nickName,
        avatarUrl: users[3].avatarUrl  
      },
      status: 'pending',
      applyTime: new Date('2024-01-24T11:20:00Z'),
      applyMethod: 'search'
    },
    {
        _id: 'request_4',
        groupId: '9aa61e7168dfd642013ea91e191b25b2',
        userId: users[3]._id,
        applicantInfo: {
          nickName: users[3].nickName,
          avatarUrl: users[3].avatarUrl  
        },
        status: 'pending',
        applyTime: new Date('2024-01-24T11:20:00Z'),
        applyMethod: 'search'
      }
  ]
  
  for (const request of requests) {
    try {
      await db.collection('join_requests').add({
        data: request
      })
    } catch (error) {
      console.log(`申请 ${request._id} 可能已存在`)
    }
  }
}
// 创建程序员和AI相关单词数据
async function createTechWordsData(db) {
    console.log('创建技术相关单词数据...')
    
    const techWords = [
      // 程序员相关单词 (25个)
      {
        word: "algorithm",
        meaning: "n. 算法",
        phonetic: "/ˈælɡərɪðəm/",
        type: "noun",
        example: "This sorting algorithm is very efficient.",
        example_zh: "这个排序算法非常高效。",
        example_en: "This sorting algorithm is very efficient."
      },
      {
        word: "debug",
        meaning: "v. 调试",
        phonetic: "/ˌdiːˈbʌɡ/",
        type: "verb",
        example: "I need to debug this code before deployment.",
        example_zh: "我需要在部署前调试这段代码。",
        example_en: "I need to debug this code before deployment."
      },
      {
        word: "syntax",
        meaning: "n. 语法",
        phonetic: "/ˈsɪntæks/",
        type: "noun",
        example: "Python has a clean and readable syntax.",
        example_zh: "Python有清晰易读的语法。",
        example_en: "Python has a clean and readable syntax."
      },
      {
        word: "framework",
        meaning: "n. 框架",
        phonetic: "/ˈfreɪmwɜːk/",
        type: "noun",
        example: "React is a popular JavaScript framework.",
        example_zh: "React是一个流行的JavaScript框架。",
        example_en: "React is a popular JavaScript framework."
      },
      {
        word: "repository",
        meaning: "n. 代码库",
        phonetic: "/rɪˈpɒzətri/",
        type: "noun",
        example: "Push your code to the Git repository.",
        example_zh: "将你的代码推送到Git代码库。",
        example_en: "Push your code to the Git repository."
      },
      {
        word: "deploy",
        meaning: "v. 部署",
        phonetic: "/dɪˈplɔɪ/",
        type: "verb",
        example: "We will deploy the application tomorrow.",
        example_zh: "我们明天将部署这个应用。",
        example_en: "We will deploy the application tomorrow."
      },
      {
        word: "compile",
        meaning: "v. 编译",
        phonetic: "/kəmˈpaɪl/",
        type: "verb",
        example: "The program needs to be compiled first.",
        example_zh: "程序需要先编译。",
        example_en: "The program needs to be compiled first."
      },
      {
        word: "interface",
        meaning: "n. 接口",
        phonetic: "/ˈɪntəfeɪs/",
        type: "noun",
        example: "This API provides a clean interface.",
        example_zh: "这个API提供了清晰的接口。",
        example_en: "This API provides a clean interface."
      },
      {
        word: "database",
        meaning: "n. 数据库",
        phonetic: "/ˈdeɪtəbeɪs/",
        type: "noun",
        example: "We use MySQL as our main database.",
        example_zh: "我们使用MySQL作为主数据库。",
        example_en: "We use MySQL as our main database."
      },
      {
        word: "variable",
        meaning: "n. 变量",
        phonetic: "/ˈveəriəbl/",
        type: "noun",
        example: "Declare the variable before using it.",
        example_zh: "在使用前声明变量。",
        example_en: "Declare the variable before using it."
      },
      {
        word: "function",
        meaning: "n. 函数",
        phonetic: "/ˈfʌŋkʃn/",
        type: "noun",
        example: "This function calculates the average.",
        example_zh: "这个函数计算平均值。",
        example_en: "This function calculates the average."
      },
      {
        word: "parameter",
        meaning: "n. 参数",
        phonetic: "/pəˈræmɪtə(r)/",
        type: "noun",
        example: "Pass the required parameters to the method.",
        example_zh: "将所需参数传递给方法。",
        example_en: "Pass the required parameters to the method."
      },
      {
        word: "recursion",
        meaning: "n. 递归",
        phonetic: "/rɪˈkɜːʃn/",
        type: "noun",
        example: "This problem can be solved with recursion.",
        example_zh: "这个问题可以用递归解决。",
        example_en: "This problem can be solved with recursion."
      },
      {
        word: "iteration",
        meaning: "n. 迭代",
        phonetic: "/ˌɪtəˈreɪʃn/",
        type: "noun",
        example: "We're on the third iteration of the design.",
        example_zh: "我们正处于设计的第三次迭代。",
        example_en: "We're on the third iteration of the design."
      },
      {
        word: "encapsulation",
        meaning: "n. 封装",
        phonetic: "/ɪnˌkæpsjuˈleɪʃn/",
        type: "noun",
        example: "Encapsulation is a key OOP concept.",
        example_zh: "封装是面向对象编程的关键概念。",
        example_en: "Encapsulation is a key OOP concept."
      },
      {
        word: "inheritance",
        meaning: "n. 继承",
        phonetic: "/ɪnˈherɪtəns/",
        type: "noun",
        example: "Java supports single inheritance.",
        example_zh: "Java支持单继承。",
        example_en: "Java supports single inheritance."
      },
      {
        word: "polymorphism",
        meaning: "n. 多态",
        phonetic: "/ˌpɒliˈmɔːfɪzəm/",
        type: "noun",
        example: "Polymorphism allows flexible code design.",
        example_zh: "多态允许灵活的代码设计。",
        example_en: "Polymorphism allows flexible code design."
      },
      {
        word: "asynchronous",
        meaning: "adj. 异步的",
        phonetic: "/eɪˈsɪŋkrənəs/",
        type: "adjective",
        example: "JavaScript handles asynchronous operations well.",
        example_zh: "JavaScript很好地处理异步操作。",
        example_en: "JavaScript handles asynchronous operations well."
      },
      {
        word: "concurrency",
        meaning: "n. 并发",
        phonetic: "/kənˈkʌrənsi/",
        type: "noun",
        example: "Go has excellent concurrency support.",
        example_zh: "Go有出色的并发支持。",
        example_en: "Go has excellent concurrency support."
      },
      {
        word: "optimization",
        meaning: "n. 优化",
        phonetic: "/ˌɒptɪmaɪˈzeɪʃn/",
        type: "noun",
        example: "Performance optimization is crucial.",
        example_zh: "性能优化至关重要。",
        example_en: "Performance optimization is crucial."
      },
      {
        word: "refactor",
        meaning: "v. 重构",
        phonetic: "/ˌriːˈfæktə(r)/",
        type: "verb",
        example: "We need to refactor this legacy code.",
        example_zh: "我们需要重构这个遗留代码。",
        example_en: "We need to refactor this legacy code."
      },
      {
        word: "middleware",
        meaning: "n. 中间件",
        phonetic: "/ˈmɪdlweə(r)/",
        type: "noun",
        example: "Express middleware handles authentication.",
        example_zh: "Express中间件处理身份验证。",
        example_en: "Express middleware handles authentication."
      },
      {
        word: "container",
        meaning: "n. 容器",
        phonetic: "/kənˈteɪnə(r)/",
        type: "noun",
        example: "Docker containers simplify deployment.",
        example_zh: "Docker容器简化了部署。",
        example_en: "Docker containers simplify deployment."
      },
      {
        word: "microservice",
        meaning: "n. 微服务",
        phonetic: "/ˈmaɪkrəʊsɜːvɪs/",
        type: "noun",
        example: "We're migrating to a microservice architecture.",
        example_zh: "我们正在迁移到微服务架构。",
        example_en: "We're migrating to a microservice architecture."
      },
      {
        word: "blockchain",
        meaning: "n. 区块链",
        phonetic: "/ˈblɒktʃeɪn/",
        type: "noun",
        example: "Blockchain technology ensures data security.",
        example_zh: "区块链技术确保数据安全。",
        example_en: "Blockchain technology ensures data security."
      },
  
    ]
    
    let successCount = 0
    for (const word of techWords) {
      try {
        await db.collection('words').add({
          data: {
            ...word,
            _id: undefined // 让数据库自动生成ID
          }
        })
        successCount++
      } catch (error) {
        console.log(`单词 ${word.word} 可能已存在:`, error.message)
      }
    }
    
    console.log(`✅ 成功创建 ${successCount} 个技术相关单词`)
    return successCount
  }
// 创建学习记录
async function createStudyRecords(db, users, groups) {
  const records = [
    {
      userId: users[0]._id,
      groupId: groups[0]._id,
      wordId: 'c075be1768df8cda013a124b787f76c6', // 使用现有的单词ID
      studyTime: 1800,
      wordsCount: 50,
      date: new Date('2024-01-23T08:00:00Z'),
      createdTime: new Date('2024-01-23T08:30:00Z')
    },
    {
      userId: users[1]._id,
      groupId: groups[0]._id,
      wordId: 'c075be1768df8cda013a124b787f76c6',
      studyTime: 1500, 
      wordsCount: 45,
      date: new Date('2024-01-23T10:15:00Z'),
      createdTime: new Date('2024-01-23T10:45:00Z')
    },
    {
      userId: users[2]._id,
      groupId: groups[0]._id,
      wordId: 'c075be1768df8cda013a124b787f76c6',
      studyTime: 1200,
      wordsCount: 40,
      date: new Date('2024-01-23T14:30:00Z'), 
      createdTime: new Date('2024-01-23T15:00:00Z')
    }
  ]
  
  for (const record of records) {
    try {
      await db.collection('study_records').add({
        data: record
      })
    } catch (error) {
      console.log('学习记录创建可能失败:', error)
    }
  }
}