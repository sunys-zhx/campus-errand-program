// pages/recharge/recharge.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
       num:'',
       user_id:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

        
  },
   //金额输入，因为js对小数乘除很容易出问题，所以干脆就取整
   numInput(e) {
     let that = this;
     that.setData({
        num:e.detail.value
     })
   },
   check:function(){
     let that = this;
     if(!/^\+?[1-9][0-9]*$/.test(that.data.num)){
      wx.showToast({
        title: '充值金额必须为非零的正整数',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    //先获取用户的_id,
    that.get_userid();

   },
   get_userid:function(){
     let that = this;
     db.collection('user').where({
        _openid:app.globalData.openid,
     }).get({
       success:function(res){
            that.setData({
               user_id:res.data[0]._id,
            })
            //开始支付
            that. affair();
           
       },
       fail(er){
          wx.showToast({
            title: '获取错误，请重试',
            icon: 'none',
            duration: 2000
          })
       }
     })
     
   },

  

  //调用云函数来处理事务
  affair:function(){
    let that = this;
    wx.showLoading({
      title: '正在充值',
    })
    wx.cloud.callFunction({
      name:'recharge',
      data:{
        user_id:that.data.user_id,
        cost:that.data.num,
        name:'钱包充值',
        stamp:new Date().getTime(),
      },
      success:function(res){
           wx.hideLoading()
           console.log(res)
           //成功，则一秒后返回上一级页面
           if(res.result.success){
                wx.showToast({
                  title: '充值成功',
                  icon: 'success',
                  duration: 2000
                })
                setTimeout(function(){
                    wx.navigateBack({
                      delta: 0,
                    })
                },1000)
           }
           //如果失败，则提示重试
           if(!res.result.success){
             wx.showToast({
               title: '充值错误，请重试',
               icon: 'none',
               duration: 2000
             })
           }
      },
      fail(er){
         wx.hideLoading()
         //调用云函数失败
         wx.showToast({
          title: '调用错误，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})