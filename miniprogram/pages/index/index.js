// pages/index/index.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    autoplay:true,
    circular:true,
    banner:[],

    nomore:false,
    page:0,
    tongzhi:'',
    campus:['请选择校区'],
    campus_show:false,
    choose_campus:'请选择校区',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      let  that = this;
      that.get_campus();
     
      wx.getStorage({
        key: 'openid',
        success (res) {
          console.log(res.data)
          //把缓存的openid赋给全局变量openid
          app.globalData.openid = res.data;
         
        },
        fail(er){
          console.log('第一次进来')
          //第一次进来没有这个openid缓存，可以获取存进去
          //获取用户的_openid
          that.get_openid();
        }
      })
      
     
      //获取轮播图
      that.get_banner();
      //获取公告通知
      that.get_tongzhi();
  },
    //打开选择校区窗口
    popup_campus:function(){
      let that = this;
      that.setData({
        campus_show:true,
      })
    },
    //监听选择校区变化
    campus_change:function(event){
         let that = this;
         console.log(event)
         that.setData({
           choose_campus:event.detail.value
         })
    },
    //取消选择校区
    campus_cancel:function(){
      let that = this;
      //关闭选择校区窗口
      that.setData({
         campus_show:false,
      })
    },
    //确定校区选择
    campus_confirm:function(){
      let that = this;
      //关闭选择校区窗口
      that.setData({
        campus_show:false,
      })
    },
   //获取校区
   get_campus:function(){
    let that = this;
    db.collection('campus').get({
       success:function(res){
         console.log(res)
         for(let i=0;i<res.data.length;i++){
              that.setData({
                campus:that.data.campus.concat(res.data[i].campus_name),
              })
         }
       }
    })
  },
  get_tongzhi:function(){
    let that = this;
    db.collection('tongzhi').limit(1).get({
      success:function(res){
           that.setData({
              tongzhi:res.data[0].tongzhi,
           })
          
      }
    })
  },
  
  get_banner:function(){
    let that = this;
    db.collection('banner').limit(2).get({
      success:function(res){
           that.setData({
              banner:res.data,
           })
      }
    })
  },
  get_openid:function(){
     let that = this;
     //调用云函数，获取用户的_openid
     wx.cloud.callFunction({
       name:'login',     //要调用的函数名
       data:{

       },                //要传给login云函数的数据
       success:function(res){
            console.log(res.result.openid)
            app.globalData.openid = res.result.openid;
            //把openid放到缓存里面
            wx.setStorage({
              key:"openid",
              data:res.result.openid
            })
             
            
       },
       fail(){
           //提示用户获取openid失败
           wx.showToast({
            title: '获取openid失败',
            icon: 'none',
            duration: 2000
          })
         
       }
    
     })
  },




      
  //跳转到帮我送、帮我取页面
  go:function(e){
    console.log(e.currentTarget.dataset.id)
    wx.navigateTo({
      url: e.currentTarget.dataset.id,
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