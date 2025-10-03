// pages/group/manage.js
Page({
    data: {
      groupId: '',
      groupName: '',
      pendingMembers: [],
      approvedMembers: [],
      stats: {
        pendingCount: 0,
        approvedCount: 0
      }
    },
  
    onLoad: function (options) {
      if (options.groupId) {
        this.setData({
          groupId: options.groupId,
          groupName: options.groupName || '群组'
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: `管理 - ${this.data.groupName}`
        });
        
        this.loadMembers();
      } else {
        wx.showToast({
          title: '参数错误',
          icon: 'none'
        });
      }
    },
  
    onShow: function () {
      // 页面显示时刷新数据
      if (this.data.groupId) {
        this.loadMembers();
      }
    },
  
    // 修复后的 loadMembers 函数
loadMembers: function () {
    const that = this;
    
    // 先隐藏可能存在的 loading
    wx.hideLoading();
    
    wx.showLoading({
      title: '加载中...'
    });
  
    // 并行获取待审核成员和已批准成员
    const pendingPromise = wx.cloud.callFunction({
      name: 'getPendingMembers',
      data: {
        groupId: that.data.groupId
      }
    });
  
    const rankingPromise = wx.cloud.callFunction({
      name: 'getGroupRanking',
      data: {
        groupId: that.data.groupId,
        sortBy: 'words'
      }
    });
  
    // 使用 Promise.all 并行处理
    Promise.all([pendingPromise, rankingPromise]).then(function(results) {
      var pendingRes = results[0];
      var rankingRes = results[1];
      
      console.log('待审核成员:', pendingRes.result);
      console.log('已批准成员:', rankingRes.result);
      
      var pendingMembers = [];
      var approvedMembers = [];
  
      // 处理待审核成员数据
      if (pendingRes.result.code === 200) {
        pendingMembers = pendingRes.result.data || [];
      } else {
        console.error('获取待审核成员失败:', pendingRes.result);
      }
  
      // 处理已批准成员数据
      if (rankingRes.result.code === 200) {
        approvedMembers = rankingRes.result.data || [];
      } else {
        console.error('获取已批准成员失败:', rankingRes.result);
      }
  
      that.setData({
        pendingMembers: pendingMembers,
        approvedMembers: approvedMembers,
        stats: {
          pendingCount: pendingMembers.length,
          approvedCount: approvedMembers.length
        }
      });
  
    }).catch(function(err) {
      console.error('加载成员失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }).then(function() {
      // 使用 then 替代 finally，确保 hideLoading 执行
      setTimeout(() => {
        wx.hideLoading();
      }, 100);
    });
  },
  // 移出成员
onRemoveMember: function (e) {
    const userId = e.currentTarget.dataset.userid;
    const userName = e.currentTarget.dataset.username;
    const that = this;
    
    wx.showModal({
      title: '移出成员',
      content: `确定要将「${userName}」移出群组吗？`,
      confirmColor: '#ff7675',
      success: function (res) {
        if (res.confirm) {
          that.processRemoveMember(userId);
        }
      }
    });
  },
  
  // 处理移出成员
  processRemoveMember: function (targetUserId) {
    const that = this;
    
    wx.showLoading({
      title: '处理中...'
    });
  
    wx.cloud.callFunction({
      name: 'removeMember',
      data: {
        targetUserId: targetUserId,
        groupId: this.data.groupId
      }
    }).then(res => {
      wx.hideLoading();
      console.log('移出成员结果:', res.result);
  
      if (res.result.code === 200) {
        wx.showToast({
          title: '移出成功',
          icon: 'success'
        });
        // 刷新成员列表
        that.loadMembers();
      } else {
        wx.showToast({
          title: res.result.message || '移出失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('移出成员失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },
    // 批准成员
    onApprove: function (e) {
      const memberId = e.currentTarget.dataset.memberid;
      const that = this;
      
      wx.showModal({
        title: '批准加入',
        content: '确定批准该用户加入群组吗？',
        success: function (res) {
          if (res.confirm) {
            that.processApprove(memberId);
          }
        }
      });
    },
  
    // 处理批准 - 使用传统 Promise 语法
    processApprove: function (memberId) {
      const that = this;
      
      wx.showLoading({
        title: '处理中...'
      });
  
      wx.cloud.callFunction({
        name: 'approveMember',
        data: {
          memberId: memberId,
          groupId: this.data.groupId
        }
      }).then(function(res) {
        console.log('批准结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '批准成功',
            icon: 'success'
          });
          // 刷新成员列表
          that.loadMembers();
        } else {
          wx.showToast({
            title: res.result.message || '批准失败',
            icon: 'none'
          });
        }
      }).catch(function(err) {
        console.error('批准失败:', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }).finally(function() {
        wx.hideLoading();
      });
    },
  
    // 拒绝成员
    onReject: function (e) {
      const memberId = e.currentTarget.dataset.memberid;
      const that = this;
      
      wx.showModal({
        title: '拒绝加入',
        content: '确定拒绝该用户加入群组吗？',
        confirmColor: '#ff7675',
        success: function (res) {
          if (res.confirm) {
            that.processReject(memberId);
          }
        }
      });
    },
  
    // 处理拒绝 - 使用传统 Promise 语法
    processReject: function (memberId) {
      const that = this;
      
      wx.showLoading({
        title: '处理中...'
      });
  
      wx.cloud.callFunction({
        name: 'rejectMember',
        data: {
          memberId: memberId,
          groupId: this.data.groupId
        }
      }).then(function(res) {
        console.log('拒绝结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '已拒绝',
            icon: 'success'
          });
          // 刷新成员列表
          that.loadMembers();
        } else {
          wx.showToast({
            title: res.result.message || '操作失败',
            icon: 'none'
          });
        }
      }).catch(function(err) {
        console.error('拒绝失败:', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }).finally(function() {
        wx.hideLoading();
      });
    },
  
    // 格式化时间
    formatTime: function (timestamp) {
      if (!timestamp) return '未知时间';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // 如果是今天
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        });
      }
    }
  });