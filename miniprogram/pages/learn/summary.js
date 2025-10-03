// pages/learn/summary.js
Page({
    data: {
      sessionStats: {
        totalWords: 0,
        correctCount: 0,
        studyTime: 0,
        accuracy: 0
      },
      userStats: {
        totalLearned: 0,
        continuousDays: 0,
        groupRank: 0
      },
      groupId: '',
      groupName: '',
      isLoading: true
    },
  
    onLoad: function (options) {
      console.log('summary页面接收到的参数:', options);
      
      // 安全地解析从学习页面传递过来的数据
      if (options.stats) {
        try {
          // 尝试直接解析
          const stats = JSON.parse(options.stats);
          this.handleStatsData(stats);
        } catch (firstError) {
          console.log('第一次解析失败，尝试解码:', firstError);
          try {
            // 如果直接解析失败，尝试先解码
            const decodedStats = decodeURIComponent(options.stats);
            const stats = JSON.parse(decodedStats);
            this.handleStatsData(stats);
          } catch (secondError) {
            console.error('解析学习数据失败:', secondError);
            wx.showToast({
              title: '数据加载失败',
              icon: 'none'
            });
            // 使用默认数据
            this.setData({ isLoading: false });
          }
        }
      } else {
        // 没有传递数据，使用默认值
        this.setData({ isLoading: false });
      }
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: '学习总结'
      });
    },

    // 处理统计数据
    handleStatsData: function(stats) {
      console.log('成功解析的学习数据:', stats);
      
      this.setData({
        sessionStats: stats.sessionStats || {
          totalWords: 0,
          correctCount: 0,
          studyTime: 0,
          accuracy: 0
        },
        groupId: stats.groupId || '',
        groupName: stats.groupName || ''
      });
      
      // 获取用户真实的学习统计数据
      this.getUserRealStats();
    },

    // 获取用户真实统计数据
    getUserRealStats: function() {
      const that = this;
      
      wx.showLoading({
        title: '加载数据中...'
      });

      wx.cloud.callFunction({
        name: 'getUserStats',
        data: {
          groupId: that.data.groupId
        }
      }).then(res => {
        wx.hideLoading();
        console.log('获取用户统计数据:', res.result);
        
        if (res.result.code === 200) {
          that.setData({
            'userStats.totalLearned': res.result.data.totalWordsLearned || 0,
            'userStats.continuousDays': res.result.data.continuousDays || 0,
            'userStats.groupRank': res.result.data.groupRank || 0,
            isLoading: false
          });
        } else {
          that.setData({
            isLoading: false
          });
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('获取用户统计数据失败:', err);
        that.setData({
          isLoading: false
        });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      });
    },
  
    // 继续学习下一组
    onContinueLearning: function () {
      // 返回到学习页面，触发重新开始学习
      const pages = getCurrentPages();
      const learnPage = pages[pages.length - 2]; // 上一个页面是学习页面
      
      if (learnPage && learnPage.startNewSession) {
        learnPage.startNewSession();
      }
      
      wx.navigateBack();
    },
  
    // 查看详细报告
    onViewReport: function () {
      wx.showToast({
        title: '详细报告功能开发中',
        icon: 'none'
      });
    },
  
    // 复习错题
    onReviewMistakes: function () {
      wx.showToast({
        title: '复习功能开发中', 
        icon: 'none'
      });
    },
  
    // 返回首页
    onBackToHome: function () {
      wx.switchTab({
        url: '/pages/index/index'  // 根据你的首页路径调整
      });
    },
  
    // 分享功能
    onShareAppMessage: function () {
      return {
        title: `我在${this.data.groupName || '群组'}完成了今日学习！`,
        path: `/pages/group/join?groupId=${this.data.groupId}`
      };
    }
  });