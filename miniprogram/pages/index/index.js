// index.js
// 获取应用实例
const app = getApp()

Page({

  data: {
    imgSrc: '',
  },

  myGetImg() {
    const fs = wx.getFileSystemManager()
    var flag = false;

    try {
      fs.accessSync(`${wx.env.USER_DATA_PATH}/temp.png`)
      app.globalData.userImgSrc = `${wx.env.USER_DATA_PATH}/temp.png`;
    } catch (e) {
      console.log("读取文件失败")
      flag = true;
    }

    this.setData({
      imgSrc: app.globalData.userImgSrc,
    });
  },


  onLoad: function () {
    console.log("刷新图片");
    this.myGetImg();
  },

  onShow: function () {
    this.setData({
      imgSrc: '',
    });
    this.onLoad();
  },

  buttonPicSelect() {
    //选择照片
    wx.chooseMedia({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album'],

      success: (res) => {
        var url = res.tempFiles.tempFilePath;
        wx.getImageInfo({
          src: url,
          success: (res) => {
            console.log("打开成功" + res.height + "px," + res.width + "px," + res.type);
            // if (res.height == 600 && res.width == 448 && res.type == 'png') {
            //   //需要处理一次抖动
            //   this.mySaveImg(url);
            // } else {
            wx.navigateTo({
              url: '/pages/cropper/cropper?imgSrc=' + url
            });
            // }
          },
          fail: () => {
            console.log("打开失败");
          },
        });
      },
    })
  },

  buttonLookBig() {
    //点开看大图
    wx.previewImage({
      current: this.data.imgSrc, // 当前显示图片的http链接
      urls: [this.data.imgSrc] // 需要预览的图片http链接列表
    })
  },

  buttonSend() {
    wx.navigateTo({
      url: '/pages/sendPage/sendPage',
    })
  },
  buttonInfo() {
    wx.navigateTo({
      url: '/pages/info/info',
    })
  },

})