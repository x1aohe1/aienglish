// pages/index/index.js
Page({
    data: {
      userInfo: {},
      todayStats: {
        learnedWords: 0,
        studyTime: 0,
        accuracy: 0
      },
      overallStats: {
        totalWords: 0,
        continuousDays: 0,
        totalGroups: 0
      },
      recentGroups: [],
      quickActions: [
        { id: 'learn', name: '开始学习', icon: '📚', color: '#667eea' },
        { id: 'review', name: '复习', icon: '🔄', color: '#ff7675' },
        { id: 'groups', name: '我的群组', icon: '👥', color: '#74b9ff' },
        { id: 'stats', name: '学习报告', icon: '📊', color: '#55efc4' }
      ],
      isLoading: true
    },
  
    onLoad: function (options) {
      this.loadHomeData();
    },
  
    onShow: function () {
      this.loadHomeData();
    },
  
    // 加载首页数据
    loadHomeData: function () {
      var that = this;
      
      wx.showLoading({
        title: '加载中...'
      });
  
      // 设置默认数据，避免云函数不存在时页面空白
      that.setData({
        userInfo: { nickName: '学习者', avatarUrl: '' },
        todayStats: { learnedWords: 0, studyTime: 0, accuracy: 0 },
        overallStats: { totalWords: 0, continuousDays: 0, totalGroups: 0 },
        recentGroups: []
      });
  
      Promise.all([
        that.getUserInfo().catch(function(err) {
          console.log('获取用户信息失败，使用默认值');
          return Promise.resolve();
        }),
        that.getTodayStats().catch(function(err) {
          console.log('获取今日统计失败，使用默认值');
          return Promise.resolve();
        }),
        that.getOverallStats().catch(function(err) {
          console.log('获取总体统计失败，使用默认值');
          return Promise.resolve();
        }),
        that.getRecentGroups().catch(function(err) {
          console.log('获取最近群组失败，使用默认值');
          return Promise.resolve();
        })
      ]).then(function() {
        wx.hideLoading();
        that.setData({ isLoading: false });
      }).catch(function(err) {
        wx.hideLoading();
        console.error('加载首页数据失败:', err);
        that.setData({ isLoading: false });
      });
    },
  
    // 获取用户信息
    getUserInfo: function () {
      var that = this;
      return new Promise(function(resolve, reject) {
        wx.cloud.callFunction({
          name: 'getUserInfo'
        }).then(function(res) {
          if (res.result.code === 200) {
            that.setData({
              userInfo: res.result.data
            });
          }
          resolve();
        }).catch(function(err) {
          console.log('获取用户信息失败，使用默认值');
          resolve();
        });
      });
    },
  
    // 获取今日学习统计
    getTodayStats: function () {
      var that = this;
      return new Promise(function(resolve, reject) {
        wx.cloud.callFunction({
          name: 'getTodayStats'
        }).then(function(res) {
          if (res.result.code === 200) {
            that.setData({
              todayStats: res.result.data
            });
          }
          resolve();
        }).catch(function(err) {
          console.log('获取今日统计失败，使用默认值');
          resolve();
        });
      });
    },
  
    // 获取总体统计
    getOverallStats: function () {
      var that = this;
      return new Promise(function(resolve, reject) {
        wx.cloud.callFunction({
          name: 'getOverallStats'
        }).then(function(res) {
          if (res.result.code === 200) {
            that.setData({
              overallStats: res.result.data
            });
          }
          resolve();
        }).catch(function(err) {
          console.log('获取总体统计失败，使用默认值');
          resolve();
        });
      });
    },
  
    // 获取最近群组
    getRecentGroups: function () {
      var that = this;
      return new Promise(function(resolve, reject) {
        wx.cloud.callFunction({
          name: 'getRecentGroups'
        }).then(function(res) {
          if (res.result.code === 200) {
            that.setData({
              recentGroups: res.result.data
            });
          }
          resolve();
        }).catch(function(err) {
          console.log('获取最近群组失败，使用默认值');
          resolve();
        });
      });
    },
  
    // 快速操作点击
    onQuickAction: function (e) {
      var actionId = e.currentTarget.dataset.id;
      console.log('点击了按钮:', actionId);
      
      switch (actionId) {
        case 'learn':
          this.startLearning();
          break;
        case 'review':
          this.startReview();
          break;
        case 'groups':
          this.goToGroups();
          break;
        case 'stats':
          this.viewStats();
          break;
      }
    },
  
    // 开始学习
    startLearning: function () {
      console.log('开始学习');
      wx.navigateTo({
        url: '/pages/learn/learn'
      });
    },
  
    // 开始复习
    startReview: function () {
      console.log('开始复习');
      wx.showToast({
        title: '复习功能开发中',
        icon: 'none'
      });
    },
  
    // 前往群组
    goToGroups: function () {
      console.log('前往群组');
      wx.navigateTo({
        url: '/pages/group/list'
      });
    },
  
    // 查看统计
    viewStats: function () {
      console.log('查看统计');
      wx.showToast({
        title: '学习报告开发中',
        icon: 'none'
      });
    },
  
    // 点击群组
    onGroupTap: function (e) {
      var groupId = e.currentTarget.dataset.id;
      var groupName = e.currentTarget.dataset.name;
      
      console.log('点击群组:', groupName);
      wx.navigateTo({
        url: '/pages/group/group?groupId=' + groupId + '&groupName=' + encodeURIComponent(groupName)
      });
    },
  
    // 分享功能
    onShareAppMessage: function () {
      return {
        title: '我在用这个超好用的背单词小程序！',
        path: '/pages/index/index'
      };
    }
  })