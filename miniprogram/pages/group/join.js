// pages/group/join.js
Page({
    data: {
      activeTab: 'search', // search: 搜索加入, invite: 邀请码加入
      groupId: '',
      inviteCode: '',
      searchedGroup: null,
      invitedGroup: null
    },
  
    onLoad: function (options) {
      // 可以在这里处理分享链接的自动加入逻辑
      // 暂时留空，后续实现
    },
  
    // 切换选项卡
    switchTab: function (e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({
        activeTab: tab,
        searchedGroup: null,
        invitedGroup: null
      });
    },
  
    // 监听群组ID输入
    onGroupIdInput: function (e) {
      this.setData({
        groupId: e.detail.value.trim()
      });
    },
  
    // 监听邀请码输入
    onInviteCodeInput: function (e) {
      this.setData({
        inviteCode: e.detail.value.trim().toUpperCase()
      });
    },
  
    // 搜索群组
    onSearchGroup: function () {
      const that = this;
      const groupId = this.data.groupId;
  
      if (!groupId) {
        wx.showToast({
          title: '请输入群组ID',
          icon: 'none'
        });
        return;
      }
  
      wx.showLoading({
        title: '搜索中...'
      });
  
      // 调用数据库查询群组信息
      const db = wx.cloud.database();
      db.collection('groups').doc(groupId).get({
        success: (res) => {
          wx.hideLoading();
          console.log('搜索到群组:', res.data);
          
          if (res.data) {
            that.setData({
              searchedGroup: res.data
            });
            wx.showToast({
              title: '找到群组',
              icon: 'success'
            });
          } else {
            that.setData({
              searchedGroup: null
            });
            wx.showToast({
              title: '群组不存在',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('搜索群组失败:', err);
          that.setData({
            searchedGroup: null
          });
          wx.showToast({
            title: '群组不存在',
            icon: 'none'
          });
        }
      });
    },
  
    // 通过邀请码加入群组
    onJoinByInvite: function () {
      const that = this;
      const inviteCode = this.data.inviteCode;
  
      if (!inviteCode || inviteCode.length !== 6) {
        wx.showToast({
          title: '请输入6位邀请码',
          icon: 'none'
        });
        return;
      }
  
      wx.showLoading({
        title: '加入中...',
        mask: true
      });
  
      // 调用邀请码加入的云函数
      wx.cloud.callFunction({
        name: 'joinByInvite',
        data: {
          inviteCode: inviteCode
        }
      }).then(res => {
        wx.hideLoading();
        console.log('邀请码加入结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '加入成功！',
            icon: 'success',
            duration: 2000
          });
  
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
  
        } else if (res.result.code === 400) {
          wx.showToast({
            title: res.result.message,
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: res.result.message || '加入失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('邀请码加入失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
    }
  })