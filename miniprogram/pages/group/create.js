// pages/group/create.js
Page({
    data: {
      groupName: ''
    },
  
    // 监听群组名称输入
    onNameInput: function (e) {
      this.setData({
        groupName: e.detail.value.trim()
      });
    },
  
    // 创建群组
    onCreateGroup: function () {
      const that = this;
      const groupName = this.data.groupName;
  
      if (!groupName) {
        wx.showToast({
          title: '请输入群组名称',
          icon: 'none'
        });
        return;
      }
  
      if (groupName.length < 2) {
        wx.showToast({
          title: '群组名称至少2个字',
          icon: 'none'
        });
        return;
      }
  
      wx.showLoading({
        title: '创建中...',
        mask: true
      });
  
      // 调用创建群组的云函数
      wx.cloud.callFunction({
        name: 'createGroup',
        data: {
          groupName: groupName
        }
      }).then(res => {
        wx.hideLoading(); // 确保隐藏loading
        console.log('创建群组结果:', res.result);
  
        if (res.result.code === 200) {
          wx.showToast({
            title: '创建成功',
            icon: 'success',
            duration: 2000
          });
  
          // 重要：获取页面栈，找到list页面并调用其刷新方法
          const pages = getCurrentPages();
          const listPage = pages.find(page => page.route === 'pages/group/list');
          
          if (listPage && listPage.loadGroupList) {
            listPage.loadGroupList(); // 调用list页面的刷新方法
          }
  
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
  
        } else {
          wx.showToast({
            title: res.result.message || '创建失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading(); // 确保在catch中也隐藏loading
        console.error('创建群组失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
    }
  })