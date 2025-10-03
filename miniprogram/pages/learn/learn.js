// pages/learn/learn.js
Page({
    data: {
      learnStatus: 'judging',
      currentWord: {},
      wordQueue: [],
      currentIndex: 0,
      sessionStats: {
        totalWords: 0,
        correctCount: 0,
        studyTime: 0,
        startTime: null
      },
      groupId: '',      // 新增：群组ID
      groupName: ''     // 新增：群组名称
    },
  
    onLoad: function (options) {
        console.log('=== 页面加载 onLoad ===', options);
        
        // 从路由参数获取群组信息
        if (options.groupId) {
          this.setData({
            groupId: options.groupId,
            groupName: options.groupName || '学习群组'
          });
          console.log('设置群组信息:', this.data.groupId, this.data.groupName);
        } else {
          console.log('未传递群组信息，使用默认值');
          this.setData({
            groupId: 'default_group',
            groupName: '默认群组'
          });
        }
        
        this.initSessionStats();
        this.getNewWords();
      },

    onShow: function() {
      console.log('=== 页面显示 onShow ===');
      console.log('当前数据状态:', {
        learnStatus: this.data.learnStatus,
        currentIndex: this.data.currentIndex,
        wordQueueLength: this.data.wordQueue.length,
        sessionStats: this.data.sessionStats
      });
    },

    onReady: function() {
      console.log('=== 页面准备完成 onReady ===');
    },

    // 初始化学习会话统计
    initSessionStats: function() {
      console.log('初始化学习统计');
      this.setData({
        sessionStats: {
          totalWords: 0,
          correctCount: 0,
          studyTime: 0,
          startTime: new Date()
        }
      });
    },

    // 从云函数获取新单词
    getNewWords: function () {
      console.log('=== 开始获取新单词 ===');
      var that = this;
      wx.showLoading({
        title: '加载中...',
      });
  
      wx.cloud.callFunction({
        name: 'getWords',
        data: {
          count: 10
        }
      }).then(function(res) {
        wx.hideLoading();
        console.log('获取单词成功:', res.result);
  
        if (res.result.code === 200) {
          that.setData({
            wordQueue: res.result.data,
            currentIndex: 0,
            learnStatus: 'judging'
          });
          console.log('设置初始状态: judging');
          that.setCurrentWord();
        } else {
          wx.showToast({
            title: '获取单词失败',
            icon: 'none'
          });
        }
      }).catch(function(err) {
        wx.hideLoading();
        console.error('获取单词失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      });
    },
  
    // 设置当前显示的单词
    setCurrentWord: function () {
      var wordQueue = this.data.wordQueue;
      var currentIndex = this.data.currentIndex;
      console.log('设置当前单词, 索引:', currentIndex, '单词:', wordQueue[currentIndex]);
      if (wordQueue && wordQueue[currentIndex]) {
        this.setData({
          currentWord: wordQueue[currentIndex]
        });
      }
    },
  
    // 状态一：点击"认识"
    onTapKnow: function () {
      console.log('点击了"认识"按钮');
      this.recordAnswer(true);
      this.setData({
        learnStatus: 'learning'
      });
      console.log('状态变为: learning');
    },
  
    // 状态一：点击"不认识"
    onTapDontKnow: function () {
      console.log('点击了"不认识"按钮');
      this.recordAnswer(false);
      this.setData({
        learnStatus: 'hinting'
      });
      console.log('状态变为: hinting');
    },
  
    // 状态二：点击"想起来了"
    onTapRemember: function () {
      console.log('点击了"想起来了"按钮');
      this.recordAnswer(true);
      this.setData({
        learnStatus: 'learning'
      });
      console.log('状态变为: learning');
    },
  
    // 状态二：点击"还是不认识"
    onTapStillDontKnow: function () {
      console.log('点击了"还是不认识"按钮');
      this.recordAnswer(false);
      this.setData({
        learnStatus: 'learning'
      });
      console.log('状态变为: learning');
    },
  
    // 状态三：点击"下一个"
    onTapNext: function () {
      console.log('点击了"下一个"按钮');
      
      var currentIndex = this.data.currentIndex;
      var wordQueue = this.data.wordQueue;
      var nextIndex = currentIndex + 1;

      console.log('计算下一个索引:', nextIndex, '队列长度:', wordQueue.length);

      if (nextIndex < wordQueue.length) {
        console.log('继续学习下一个单词');
        this.setData({
          currentIndex: nextIndex,
          learnStatus: 'judging'
        });
        this.setCurrentWord();
      } else {
        console.log('学习完成，显示总结页面');
        this.showLearningSummary();
      }

      this.updateUserStats();
    },

    // 记录用户答案
    recordAnswer: function(isCorrect) {
      console.log('记录答案:', isCorrect ? '正确' : '错误');
      var stats = {
        totalWords: this.data.sessionStats.totalWords,
        correctCount: this.data.sessionStats.correctCount,
        studyTime: this.data.sessionStats.studyTime,
        startTime: this.data.sessionStats.startTime
      };
      
      stats.totalWords += 1;
      if (isCorrect) {
        stats.correctCount += 1;
      }
      
      this.setData({
        sessionStats: stats
      });
      console.log('更新后统计:', this.data.sessionStats);
    },

    // 显示学习总结页面
    showLearningSummary: function() {
    console.log('=== 执行 showLearningSummary 方法 ===');
    
    const { sessionStats, groupId, groupName } = this.data;
    
    // 计算学习时长（分钟）
    const endTime = new Date();
    const studyTime = Math.round((endTime - sessionStats.startTime) / 1000 / 60);
    
    // 计算正确率
    const accuracy = sessionStats.totalWords > 0 
      ? Math.round((sessionStats.correctCount / sessionStats.totalWords) * 100)
      : 0;
  
    const summaryData = {
      sessionStats: {
        totalWords: sessionStats.totalWords,
        correctCount: sessionStats.correctCount,
        studyTime: studyTime,
        accuracy: accuracy
      },
      groupId: groupId,      // 使用动态的 groupId
      groupName: groupName   // 使用动态的 groupName
    };
  
    console.log('准备跳转到总结页面，数据:', summaryData);
  
    wx.navigateTo({
      url: `/pages/learn/summary?stats=${encodeURIComponent(JSON.stringify(summaryData))}`
    });
  
    this.initSessionStats();
  },

    // 更新用户学习数据到云端
    updateUserStats: function(isSessionEnd) {
    if (isSessionEnd === undefined) isSessionEnd = false;
    
    console.log('更新用户学习数据到云端, isSessionEnd:', isSessionEnd);
    var that = this;
    
    return new Promise(function(resolve, reject) {
      var sessionStats = that.data.sessionStats;
      var groupId = that.data.groupId; // 获取动态群组ID
      
      wx.cloud.callFunction({
        name: 'updateUserStats',
        data: {
          groupId: groupId, // 使用动态群组ID
          studyTime: isSessionEnd ? sessionStats.studyTime * 60 : 30,
          wordsCount: isSessionEnd ? sessionStats.totalWords : 1,
          correctCount: isSessionEnd ? sessionStats.correctCount : 0,
          isSessionEnd: isSessionEnd
        }
      }).then(function(res) {
        console.log('学习数据更新成功', res);
        resolve(res);
      }).catch(function(err) {
        console.error('学习数据更新失败', err);
        reject(err);
      });
    });
  },
  
    // 播放单词发音
    playAudio: function () {
      console.log('播放单词发音');
      var currentWord = this.data.currentWord;
      if (currentWord && currentWord.word) {
        wx.speak({
          text: currentWord.word,
          lang: 'en_US'
        });
      }
    },

    // 开始新的学习会话
    startNewSession: function() {
      console.log('开始新的学习会话');
      this.initSessionStats();
      this.getNewWords();
    }
  })