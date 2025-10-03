// pages/group/group.js
Page({
    data: {
      sortBy: 'words',
      rankList: [],
      currentGroup: {
        _id: '',
        name: '加载中...',
        inviteCode: ''
      },
      userRole: 'member'
    },
  
    onLoad: function (options) {
      console.log('收到的路由参数:', options);
      
      if (options.groupId) {
        this.setData({
          'currentGroup._id': options.groupId
        });
        this.loadGroupDetail(options.groupId);
      } else {
        wx.showToast({
          title: '群组ID不存在',
          icon: 'none'
        });
      }
    },
  
    // 加载群组详细信息
    loadGroupDetail: function (groupId) {
      const that = this;
      const db = wx.cloud.database();
      
      wx.showLoading({
        title: '加载中...'
      });
  
      db.collection('groups').doc(groupId).get({
        success: (res) => {
          if (res.data) {
            console.log('群组详情:', res.data);
            that.setData({
              currentGroup: res.data
            });
            
            that.getUserRole(groupId);
          } else {
            wx.hideLoading();
            wx.showToast({
              title: '群组不存在',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('加载群组详情失败:', err);
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      });
    },
  
    // 获取当前用户在该群组的角色（安全版本）
    getUserRole: function (groupId) {
      const that = this;
      
      wx.cloud.callFunction({
        name: 'getUserRole',
        data: {
          groupId: groupId
        }
      }).then(res => {
        console.log('云函数返回:', res);
        console.log('云函数结果:', res.result);
        
        if (res.result && res.result.code === 200) {
          that.setData({
            userRole: res.result.data.role
          });
          console.log('✅ 设置用户角色为:', res.result.data.role);
        } else {
          console.error('❌ 云函数返回异常:', res.result);
          // 安全降级：不设置角色，使用默认值
        }
        
        // 加载排名数据
        that.getGroupRanking();
      }).catch(err => {
        console.error('❌ 调用云函数失败:', err);
        // 安全降级：继续加载排名数据
        that.getGroupRanking();
      });
    },
  
    // 获取群组排名
    getGroupRanking: function () {
      const that = this;
      
      if (!this.data.currentGroup._id) {
        console.error('groupId不存在，无法获取排名');
        wx.hideLoading();
        return;
      }
      
      wx.cloud.callFunction({
        name: 'getGroupRanking',
        data: {
          groupId: that.data.currentGroup._id,
          sortBy: that.data.sortBy
        }
      }).then(res => {
        wx.hideLoading();
        console.log('排名数据:', res.result);
  
        if (res.result.code === 200) {
          that.setData({
            rankList: res.result.data
          });
        } else {
          wx.showToast({
            title: '获取排名失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('获取排名失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      });
    },
  
    // 复制邀请码
    onCopyInviteCode: function () {
      const inviteCode = this.data.currentGroup.inviteCode;
      
      if (!inviteCode) {
        wx.showToast({
          title: '邀请码不存在',
          icon: 'none'
        });
        return;
      }
  
      wx.setClipboardData({
        data: inviteCode,
        success: function () {
          wx.showToast({
            title: '邀请码已复制',
            icon: 'success'
          });
        },
        fail: function () {
          wx.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },
  
    // 分享群组
    onShareGroup: function () {
      const groupId = this.data.currentGroup._id;
      
      wx.share({
        title: `加入${this.data.currentGroup.name}，一起学习编程单词！`,
        path: `/pages/group/join?groupId=${groupId}&invite=direct`,
        success: function (res) {
          console.log('分享成功', res);
        },
        fail: function (err) {
          console.error('分享失败', err);
        }
      });
    },
  
    // 分享到聊天
    onShareAppMessage: function () {
      const groupId = this.data.currentGroup._id;
      return {
        title: `加入${this.data.currentGroup.name}，一起学习编程单词！`,
        path: `/pages/group/join?groupId=${groupId}&invite=direct`,
        imageUrl: '/images/share-cover.png'
      };
    },
  
    // 分享到朋友圈
    onShareTimeline: function () {
      const groupId = this.data.currentGroup._id;
      return {
        title: `加入${this.data.currentGroup.name}，一起学习编程单词！`,
        query: `groupId=${groupId}&invite=direct`
      };
    },
  
    // 切换排名标签
    switchTab: function (e) {
      const sortBy = e.currentTarget.dataset.sort;
      console.log('切换排序方式:', sortBy);
      
      this.setData({
        sortBy: sortBy
      });
      
      this.getGroupRanking();
    },
  
    // 退出群组
    onQuitGroup: function () {
      const that = this;
      const groupId = this.data.currentGroup._id;
      
      wx.showModal({
        title: '确认退出',
        content: `确定要退出「${this.data.currentGroup.name}」群组吗？退出后将无法查看该群组排名。`,
        confirmColor: '#e74c3c',
        success: function (res) {
          if (res.confirm) {
            that.processQuitGroup(groupId);
          }
        }
      });
    },
  
    // 处理退出群组
    processQuitGroup: function (groupId) {
      const that = this;
      
      wx.showLoading({
        title: '处理中...',
        mask: true
      });
  
      wx.cloud.callFunction({
        name: 'quitGroup',
        data: {
          groupId: groupId
        }
      }).then(res => {
        wx.hideLoading();
        console.log('退出群组结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          });
  
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.message || '退出失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('退出群组失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
    },
    onShow: function () {
        // 页面显示时刷新排名数据
        if (this.data.currentGroup._id) {
          console.log('页面显示，刷新排名数据');
          this.getGroupRanking();
        }
      },
      // 开始学习
onStartLearning: function () {
    const groupId = this.data.currentGroup._id;
    const groupName = this.data.currentGroup.name;
    
    console.log('跳转到学习页面:', { groupId, groupName });
    
    wx.navigateTo({
      url: `/pages/learn/learn?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}`
    });
  },
  
    // 解散群组（创建者）
    onDissolveGroup: function () {
      const that = this;
      const groupId = this.data.currentGroup._id;
      const groupName = this.data.currentGroup.name;
      
      wx.showModal({
        title: '解散群组',
        content: `确定要解散「${groupName}」吗？\n\n解散后：\n• 群组将被永久删除\n• 所有成员关系将被清除\n• 此操作不可恢复`,
        confirmColor: '#e74c3c',
        confirmText: '确认解散',
        success: function (res) {
          if (res.confirm) {
            that.processDissolveGroup(groupId);
          }
        }
      });
    },
  
    // 处理解散群组
    processDissolveGroup: function (groupId) {
      const that = this;
      
      wx.showLoading({
        title: '解散中...',
        mask: true
      });
  
      wx.cloud.callFunction({
        name: 'dissolveGroup',
        data: {
          groupId: groupId
        }
      }).then(res => {
        wx.hideLoading();
        console.log('解散群组结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '解散成功',
            icon: 'success',
            duration: 2000
          });
  
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 2000);
        } else {
          wx.showToast({
            title: res.result.message || '解散失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('解散群组失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
    },
  
    // 管理成员
    onManageMembers: function () {
        const groupId = this.data.currentGroup._id;
        const groupName = this.data.currentGroup.name;
        
        wx.navigateTo({
        url: `/pages/group/manage?groupId=${groupId}&groupName=${groupName}`
        });
    },
    
    // 返回上一页
    onBack: function () {
      const pages = getCurrentPages();
      
      if (pages.length === 1) {
        wx.redirectTo({
          url: '/pages/group/list'
        });
      } else {
        wx.navigateBack({
          delta: 1
        });
      }
    }
  })