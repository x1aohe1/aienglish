// pages/group/list.js
Page({
    data: {
      stats: {
        createdCount: 0,
        joinedCount: 0
      },
      groupList: []
    },
  
    onLoad: function (options) {
      this.loadGroupList();
    },
  
    onShow: function () {
      // 当从创建/加入页面返回时刷新列表
      this.loadGroupList();
    },
  
    // 在页面的js文件中添加这个方法
async callGenerateTestData() {
    try {
      wx.showLoading({
        title: '生成测试数据中...',
      })
  
      const result = await wx.cloud.callFunction({
        name: 'generateTestData',
        data: {}  // 不需要参数
      })
  
      wx.hideLoading()
      
      console.log('生成结果:', result)
      
      if (result.result.success) {
        wx.showModal({
          title: '成功',
          content: '测试数据生成完成！现在可以测试审核功能了。',
          showCancel: false
        })
      } else {
        wx.showModal({
          title: '失败', 
          content: result.result.error,
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('调用失败:', error)
      wx.showModal({
        title: '调用失败',
        content: error.message,
        showCancel: false
      })
    }
  },

    // 加载群组列表
    loadGroupList: function () {
      const that = this;
      wx.showLoading({
        title: '加载中...',
      });
  
      wx.cloud.callFunction({
        name: 'getUserGroups'
      }).then(res => {
        wx.hideLoading(); // 成功时隐藏loading
        console.log('群组列表:', res.result);
  
        if (res.result.code === 200) {
          const groupList = res.result.data || [];
          
          // 计算统计信息
          const createdCount = groupList.filter(group => group.userRole === 'creator').length;
          const joinedCount = groupList.length;
  
          that.setData({
            groupList: groupList,
            stats: {
              createdCount: createdCount,
              joinedCount: joinedCount
            }
          });
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading(); // 失败时也隐藏loading
        console.error('加载群组列表失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      });
    },
  
    // 跳转到创建群组页
    goToCreate: function () {
      wx.navigateTo({
        url: '/pages/group/create'
      });
    },
  
    // 跳转到加入群组页
    goToJoin: function () {
      wx.navigateTo({
        url: '/pages/group/join'
      });
    },
  
    // 跳转到群组详情（排名页）
    goToGroupDetail: function (e) {
      const groupId = e.currentTarget.dataset.groupid;
      wx.navigateTo({
        url: `/pages/group/group?groupId=${groupId}`
      });
    }
  })
 