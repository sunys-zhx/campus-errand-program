// pages/mai/mai.js
// 引入地图SDK核心类
var QQMapWX = require('../../util/qqmap-wx-jssdk.js');
// 实例化API核心类
var qqmapsdk = new QQMapWX({
    key: 'xiao-yuan' // 必填
});
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
   
    notes:'',
    note_counts:0,
    multiple:true,
    fileList:[],
    linshi:[],  //存放图片的临时地址

 
    mai_location:'请选择购买地点',
    mai_latitude:'',
    mai_longitude:'',
    location_show:false,
    radio:'2',
    end_location:'',
    end_latitude:'',
    end_longitude:'',
    polyline: [],

    no_jisuan:false,
    
    placeholder_value:'请输入购买商品大概价格，到时可当面核对',
    checked_jia:false,
    price:'',
    disabled_jia:false,
    error_redprice:false,
    
    endtime_show:false,
    end_time:'请选择送达时间',
    minDate:new Date().getTime(),


    error_red:false,
    balance:0,
    cost:3,
    user_parse:false,
    user_id:'',
    campus:['请选择校区'],
    campus_show:false,
    choose_campus:'请选择校区',
    name:'',
    phone:'',
    dizhi:'',
    
  },
    /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      let that = this;

      //获取钱包余额,保存user_id，后续使用
      that.get_balance();
      //查询是否有自己发布的未确认的订单，如果有，则跳转确认，如果没有可以继续发布
      that.get_publish();
  },
  go_bushouhuo:function(){
    let that = this;
    wx.navigateTo({
      url: '/pages/address/address',
    })
  },
  
  get_publish:function(){
    let that = this;
    db.collection('publish').where({
        state:5,
        _openid:app.globalData.openid,
    }).get({
       success:function(res){
          if(res.data.length==0){
            //没有则不做任何弹窗处理
            console.log('没有待确认的订单')
          }else{
            //如果还有未确认订单，则跳转确认页面
            wx.showModal({
              title: '提示',
              content: '您还有未确认的订单，请先确认',
              showCancel:false,
              confirmText:'前往确认',
              success (res) {
                if (res.confirm) {
                  console.log('用户点击确定')
                  wx.switchTab({
                    url: '/pages/fabu/fabu',
                  })
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            })
            
          }
          
       },
       fail(er){

       }
    })
  },
  //获取钱包余额
  get_balance:function(){
    let that = this;
    db.collection('user').where({
       _openid:app.globalData.openid,
    }).get({
      success:function(res){
        //用户不存在于user表里，则添加
        if(res.data.length==0){
            db.collection('user').add({
                  data:{
                    balance:0,
                  },
                  success:function(r){
                     console.log('添加balance字段成功')
                     //成功添加，不做任何处理
                    
                  },
                  fail(){
                    // 不成功，就退出此页面，防止使用钱包支付时候出错
                     wx.showToast({
                      title: '发送错误，请重试',
                      icon: 'none',
                      duration: 2000
                     })
                     setTimeout(function(){
                        wx.navigateBack({
                          delta: 0,
                        })
                     },1000)
                  }
            })
        }
        //用户存在于user表里
        if(res.data.length!==0){
          console.log(res.data[0].balance)
          that.setData({
              balance:res.data[0].balance,
              user_id:res.data[0]._id,
          })
        }
      }
   })
  },
    //检查各个输入是否都已经输入
    onSubmit:function(){
      let that = this;
      if(that.data.notes==''){
        wx.showToast({
          title: '请输入要购买的商品',
          icon: 'none',
          duration: 2000
        })
        return false;
      }
      
      if(that.data.end_location=='请选择收货地址'||!that.data.end_location){
        wx.showToast({
          title: '请选择收货地址',
          icon: 'none',
          duration: 2000
        })
        return false;
     }
      
      if(!/^\+?[1-9][0-9]*$/.test(that.data.cost)){
        wx.showToast({
          title: '跑腿费必须为非零的正整数',
          icon: 'none',
          duration: 2000
        })
        return false;
      }
     
      if(that.data.user_parse&&that.data.balance<that.data.cost){
        wx.showModal({
          title: '提示',
          content: '余额不足，请充值',
          success (res) {
            if (res.confirm) {
              console.log('用户点击确定')
              wx.redirectTo({
                url: '/pages/parse/parse',
              })
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
        return false;
      }

      if(that.data.user_parse&&that.data.balance>=that.data.cost){

   

          that.parse_pay();
          
      }

    },
 
  //使用钱包支付
  parse_pay:function(){
    let that = this;
    //这里采用事务，因为需要三个操作同时成功或者同时失败
    //第一个是减去钱包余额，第二是消费记录写入history数据库表，第三是写入publish数据库表
    console.log(that.data.user_id)
    console.log(app.globalData.openid)
    wx.showLoading({
      title: '正在支付',
    })
    wx.cloud.callFunction({
      name:'parse_pay',
      data:{
          user_id:that.data.user_id,
          cost:that.data.cost,
          name:'帮我买订单支付',
          stamp:new Date().getTime(),
          
      },
      success:function(res){
            console.log(res)
            //成功，则先获取抽成费率,再存入数据库
            if(res.result.success){
                that.get_rate();
            }
            //如果失败，则提示重试
            if(!res.result.success){
              wx.hideLoading()
              wx.showToast({
                title: '发布错误，请重试',
                icon: 'none',
                duration: 2000
              })
            }
           
            
      },
      fail(er){
        console.log(er)
      }
    })

  },


  //获取后台的抽成费率
  get_rate:function(){
    let that = this;
    db.collection('campus').where({
         campus_name:that.data.choose_campus,
    }).get({
      success:function(res){
           console.log(res.data[0].rate)
           let rate = 1-res.data[0].rate
          // 把抽成费率传给add_publish函数进行增加数据处理
          let cost = (rate*that.data.cost).toFixed(1)
          let costs = parseFloat(cost)
           that.add_publish(costs)
      }
    })
  },
   //把输入的信息提交到publish数据库表
   add_publish:function(e){
    let that = this;
    db.collection('publish').add({
       data:{
           choose_campus:that.data.choose_campus,
           notes:that.data.notes,
           shoujian_name:that.data.shoujian_name,
           phone:that.data.phone,
           mai_location:that.data.mai_location,
           mai_latitude:that.data.mai_latitude,
           mai_longitude:that.data.mai_longitude,
           end_location:that.data.end_location,
            end_latitude:that.data.end_latitude,
            end_longitude:that.data.end_longitude,
            polyline: that.data.polyline,
            distance:that.data.distance,
            duration:that.data.duration,
           fileList:that.data.fileList,
           end_time:that.data.end_time,
           cost:e,   
           creat:new Date().getTime(),
           category:'帮我买',
           price:that.data.price,
           state:1,
           yuanjia:that.data.cost,
       },
       success:function(res){
            wx.hideLoading()
            wx.showToast({
              title: '发布成功',
              icon: 'success',
              duration: 2000
            })
            setTimeout(function(){
              wx.navigateBack({
                delta: 0,
              })
            },1000)
       },
       fail(er){
         //存入数据库失败处理
        wx.showModal({
          title: '提示',
          content: '发布失败',
          confirmText:'联系客服',
          showCancel:false,
          success (res) {
            if (res.confirm) {
              console.log('用户点击确定')
              wx.navigateTo({
                url: '/pages/kefu/kefu',
              })
            } else if (res.cancel) {
              console.log('用户点击取消')

            }
          }
        })
       }
    })
  },
  //是否使用余额支付
  onChange_userparse:function(event){
    let that = this;
    console.log(event.detail)
    that.setData({
       user_parse:event.detail,
    })
  },
  //获取用户输入的跑腿费
  onChange_cost:function(event){
    let that = this;
    if(!/^\+?[1-9][0-9]*$/.test(event.detail)){
      wx.showToast({
        title: "请输入非零的正整数",
        icon: 'none',
      })
      that.setData({
        error_red:true,
      })
      return false;
    }
    //输入的是非零正整数，就赋值
    that.setData({
       cost:event.detail,
       error_red:false,
    })
    console.log(that.data.cost)
  },
   //跳转充值页面
   go_parse:function(){
    let that = this;
    wx.navigateTo({
      url: '/pages/recharge/recharge',
    })
  },
  //获取用户输入的商品费
  change_price:function(event){
    let that = this;
    console.log(event)
    if(!/^\+?[1-9][0-9]*$/.test(event.detail)){
      wx.showToast({
        title: "商品费请输入非零的正整数",
        icon: 'none',
      })
      that.setData({
        error_redprice:true,
      })
      return false;
    }
    //输入的是非零正整数，就赋值
    that.setData({
       price:event.detail,
       error_redprice:false,
    })
    console.log(that.data.price)
  },
  //是否选中“我不知道价格”，并判断显示样式
  onChange_checkjia:function(event){
    let that = this;
    console.log(event)
    that.setData({
       checked_jia:event.detail,
    })
    if(that.data.checked_jia){
        that.setData({
          placeholder_value:'如果不知道价格，可送到后当面核对发票',
          disabled_jia:true,
          price:'',
          error_redprice:false,
        })
    }
    if(!that.data.checked_jia){
      that.setData({
        placeholder_value:'请输入大概价格，送到后当面核对',
        disabled_jia:false,
      })
    }
  },
  //打开选择送达时间窗口
  popup_endtime:function(){
    let that = this;
    that.setData({
      endtime_show:true,
    })
  },
    //获取用户选择的送达时间
    endtime_change:function(event){
      let that = this;
      console.log(event.detail.getValues())
      let time = event.detail.getValues()
      that.setData({
         end_time:time[0]+'/'+time[1]+'/'+time[2]+' '+time[3]+':'+time[4],
      })
    },
    //确定送达时间
    endtime_confirm:function(){
      let that = this;
      that.setData({
          endtime_show:false,
      })
      //当客户没有滑动选择时间的时候，默认为现在时间
      if(that.data.end_time=="请选择送达时间"){
          let nian = new Date().getFullYear();
          let yue = new Date().getMonth()+1;
          let ri = new Date().getDate();
          let shi = new Date().getHours();
          let fen = new Date().getMinutes();
          that.setData({
              end_time:nian+'/'+yue+'/'+ri+' '+shi+':'+fen
          })
      }
    },
    //取消送达时间
    endtime_cancel:function(){
      let that = this;
      that.setData({
        endtime_show:false,
      })
    },
   
  //选择购买地址
  choose_mailocation:function(){
    let that = this;
    wx.chooseLocation({
              success:function(res){
                 console.log(res)
                 that.setData({
                     mai_location:res.name,
                     mai_latitude:res.latitude,
                     mai_longitude:res.longitude,
                 })
              }
    })
  },
  //购买方式
  onChange_method:function(event){
    let that = this;
    console.log(event)
    that.setData({
       radio:event.detail,
    })
    //如果是选择指定地点，则显示购买地点的选择
    if(that.data.radio==1){
       that.setData({
          location_show:true,
       })
    }
    //如果是选择就近购买，则隐藏购买地点的选择,并且mai_location等于原来的值，条件判断的时候用到
    if(that.data.radio==2){
      that.setData({
         location_show:false,
         mai_location:'请选择购买地点'
      })
    }
  },
    


  // 上传图片
  uploadToCloud(event) {
      let that = this;
     
      wx.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success (res) {
          wx.showLoading({
            title: '正在上传',
          })    
          console.log(res)
          that.setData({
            linshi:that.data.linshi.concat(res.tempFilePaths)
          })
          console.log(that.data.linshi)
          //临时数组
          let lujin = "bangmai_img/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000);
          const uploadTasks = that.data.linshi.map((item, index)  =>  that.uploadFilePromise(lujin+index, item)); //传给wx.cloud.uploadFile的cloudPath属性的值不能重复！！！巨坑，加个index就可以避免重复了
            Promise.all(uploadTasks)
            .then(data => {
              console.log(data)
              wx.hideLoading()
              wx.showToast({ 
                title: '上传成功', 
                icon: 'none' 
              });
              const newFileList = data.map(item => ({ url: item.fileID,isImage: true,}));
              console.log(newFileList)
              //每次上传成功后，都要清空一次临时数组，避免第二次重复上传，浪费存储资源，
              that.setData({ 
                fileList: that.data.fileList.concat(newFileList),
                linshi:[],
              });
              
            })
            .catch(e => {
              wx.showToast({ title: '上传失败', icon: 'none' });
              console.log(e);
            });
      
        }
      })
      
     
  },
   //上传到云存储，并且获得图片新路径
    uploadFilePromise(fileName, chooseResult) {
      return wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: chooseResult
      });
    },
  //预览图片
  previewImage:function(event){
    let that = this;
    console.log(event)
    wx.previewImage({
      urls: [event.currentTarget.dataset.url] // 需要预览的图片http链接列表
    })    
  },
  //删除图片
  delete:function(event){
    let that = this;
    console.log(event)
    let inde = event.currentTarget.dataset.id
    //删除数组里面的值
    that.data.fileList.splice(inde,1)
    that.setData({
        fileList:that.data.fileList,
    })
  },
  
   //获取用户输入的地址，且不计算地址
   onChange_inputend:function(event){
    let that = this;
    that.setData({
       mai_location:event.detail,
       no_jisuan:true,
       location_show:false,
    })
    console.log(that.data.mai_location)
  },
 
  //获取用户输入的商品内容
  noteInput(e){
    let that = this;
    console.log(e.detail.cursor)
    that.setData({
          note_counts: e.detail.cursor,
          notes: e.detail.value,
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
       console.log(app.globalData.dizhi)
       that.setData({
          choose_campus:app.globalData.dizhi.campus,
          end_location:app.globalData.dizhi.dizhi,
          shoujian_name:app.globalData.dizhi.name,
          phone:app.globalData.dizhi.phone,
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