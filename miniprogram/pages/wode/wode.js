// pages/my/my.js
const app = getApp();
const db = wx.cloud.database();
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({

  /**
   * 页面的初始数据
   */
  data: {
      show:1,  //show等于1代表可以提交信息，等于2代表等待审核或者违规无权限，等于3代表审核成功
      renzheng:'接单认证',
      _openid:'',
      avatarUrl: defaultAvatarUrl,
      isShow1:true, 
      isShow2:false, 



  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
       let that = this;
       //查询用户的接单认证状态，是否显示认证标志
       that.get();
      
       
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    let that = this;
    if(that.data.userInfo!==''){
          that.upload_toux();
    }
    if(that.data.userInfo==''){
          wx.getUserProfile({
                desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
                success: (res) => {
                      that.setData({
                         userInfo: res.userInfo,
                      })
                      console.log(that.data.userInfo)
                      that.upload_toux();
                },
                fail(){
                      wx.showToast({
                            title: '请授权后方可使用',
                            icon: 'none',
                            duration: 2000
                      });
                }
          })
    }
    
  },
    //上传头像
    upload_toux:function(){
      let that = this;
       //选择图片
       wx.chooseImage({
        count : 1, //规定选择图片的数量，默认9
        sizeType : ['original','compressed'], //规定图片的尺寸， 原图/压缩图
        sourceType : ['album','camera'], //从哪里选择图片， 相册/相机
        success : (chooseres)=>{ //接口调用成功的时候执行的函数
            console.log(chooseres);
            wx.showLoading({
              title: '图片上传中',
            })
            //选择图片后可以在这里上传
            wx.cloud.uploadFile({
              cloudPath: "sheng_img/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000),//云储存的路径及文件名
              filePath : chooseres.tempFilePaths[0], //要上传的图片/文件路径 这里使用的是选择图片返回的临时地址
              success : (uploadres) => { 
                //上传图片到云储存成功,拿到了图片地址
                console.log(uploadres)
                 that.setData({
                  avatarUrl:uploadres.fileID,
                 })  
                  wx.hideLoading();
                  wx.showToast({
                      title: '图片上传成功',
                      icon: 'success',
                      duration: 2000
                  })
              },
              fail : (err) => {
                console.log(err)
              }
            })
        },
        fail : (err) => {
          console.log(err)
        }
    })
    },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  },
onClick:function(e){
  this.setData({
    isShow1:false, 
    isShow2:true, 
  })
},


  //查询该用户的交押金认证状态
  get:function(){
    let that = this;
    db.collection('runner').where({
        _openid:app.globalData.openid,
    }).get({
      success:function(res){
           //还没提交信息
           if(res.data.length==0){
                //不做任何处理
           }
           if(res.data.length!==0){
              //有但还没有审核通过或者违规无权限
              if(res.data[0].pass==false){
                  that.setData({
                    show:2,
                    renzheng:'正在审核'
                  })
              }
              //有而且审核通过
              if(res.data[0].pass==true){
                 that.setData({
                   show:3,
                   renzheng:'已认证'
                 })
              }
           }
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
        let that = this;
        that.get();
        that.setData({
          _openid:app.globalData.openid
        })
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