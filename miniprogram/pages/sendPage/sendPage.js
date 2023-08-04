// pages/sendPage/sendPage.js
const app = getApp()

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    listenCount: 0,
    listenSucceedCount: 0,
    bleState: false,
    devices: [],
    chs: [],
    connected: false,
    name: '',
    IdeviceId: '',
    battery: 50,
    UUID_bat_main: '0000180F-0000-1000-8000-00805F9B34FB',
    UUID_bat: '00002A19-0000-1000-8000-00805F9B34FB',
    UUID_main: '23330001-1024-2048-4096-998178563721',
    UUID_tx: '23330002-1024-2048-4096-998178563721',
    UUID_rx: '23330003-1024-2048-4096-998178563721',
    UUID_sta: '23330020-1024-2048-4096-998178563721',
    UUID_set0: '23330010-1024-2048-4096-998178563721',
    UUID_set1: '23330011-1024-2048-4096-998178563721',
    UUID_set2: '23330012-1024-2048-4096-998178563721',


    devicesBusyFlag: false,
    RxFlag: false,
    NowSendPage: 0,

    imgSrc: '',
    query: '',
    ctx: '',
    canvas: '',
    ImgData: '',
    startup: true,

    dataBuffer: '', //全部数据的buffer
    sendBuffer8b: '',

    send_step: 0,
    send_count: 0,

    pct_mun: 999,
    isDestroy: false,

    need_auto_refresh: true,
  },

  failedMessage(f) {
    wx.hideToast();
    wx.showModal({
      title: "蓝牙错误：" + f, // 提示的标题
      showCancel: false,
      confirmText: "确定",
      complete: () => {
        wx.navigateBack({
          delta: 10
        })
      }
    })
  },


  onBluetoothDeviceFound() {
    // 监听扫描到新设备事件
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach((device) => {
        // 这里可以做一些过滤
        if (!device.name && !device.localName) {
          return
        }
        if (device.name == "Eurry Card" || device.localName == "Eurry Card") {
          const foundDevices = this.data.devices
          const idx = inArray(foundDevices, 'deviceId', device.deviceId)
          const data = {}
          if (idx === -1) {
            data[`devices[${foundDevices.length}]`] = device
          } else {
            data[`devices[${idx}]`] = device
          }
          this.setData(data)
        }
      })
    })
  },

  createBLEConnection(e) {
    if (this.data.connected) {
      console.log("已经连接了");
      return;
    }
    wx.showToast({
      title: '连接中',
      icon: 'loading',
      duration: 60000,
    })
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          name,
          deviceId,
          IdeviceId: deviceId,
        })
        this.data.IdeviceId = deviceId;
        this.getBLEDeviceServices()
      }
    })

    wx.onBLEConnectionStateChange((res) => {
      if (res.connected == false) {
        console.log("蓝牙已断开");
        this.failedMessage("已断开")
      }
    })

    //停止发现
    wx.stopBluetoothDevicesDiscovery()
  },

  isMineDevices(res) {
    let batFlag = true;
    let mainFlag = true;
    for (let i = 0; i < res.services.length; i++) {
      if (res.services[i].uuid == this.data.UUID_bat_main) {
        //电池服务
        batFlag = false;
      } else if (res.services[i].uuid == this.data.UUID_main) {
        //主服务
        mainFlag = false;
      }
    }
    return batFlag | mainFlag;
  },

  //获取设备的所有服务
  getBLEDeviceServices() {
    wx.getBLEDeviceServices({
      deviceId: this.data.IdeviceId,
      success: (res) => {
        console.log(res)
        //判断是不是我的设备
        if (this.isMineDevices(res)) {
          this.failedMessage("设备错误");
          return;
        }
        console.log("获取服务成功")

        wx.getBLEDeviceCharacteristics({
          deviceId: this.data.IdeviceId,
          serviceId: this.data.UUID_bat_main,
          success: (res) => {
            console.log("扫描电池服务")
            wx.getBLEDeviceCharacteristics({
              deviceId: this.data.IdeviceId,
              serviceId: this.data.UUID_main,
              success: (res) => {
                console.log("扫描主服务")
                //开启监听
                this.listenAll();

                this.setData({
                  connected: true,
                })
                wx.hideToast();
                console.log("连接成功")
              },
              fail: () => {
                this.failedMessage("获取服务失败");
              },
            })
          },
          fail: () => {
            this.failedMessage("获取服务失败");
          },
        })
      }
    })
  },

  dispPCT(num) {
    let mun_ = Math.floor(num);
    if (this.data.pct_mun == mun_) {
      return;
    }
    this.data.pct_mun = mun_;
    wx.showToast({
      title: '发送中' + this.data.pct_mun + '%',
      icon: 'loading',
      duration: 60000,
    })
  },

  sendFream(num) {
    let addr = (num * 70 + this.data.send_count) * 240;
    let buffer = this.data.sendBuffer.slice(addr, addr + 240);
    let bufferu8b = new Uint8Array(buffer);
    let buffer1 = new ArrayBuffer(241);
    let buffer1u8b = new Uint8Array(buffer1);
    for (let i = 0; i < 240; i++) {
      buffer1u8b[i + 1] = bufferu8b[i];
    }
    buffer1u8b[0] = this.data.send_count + 1;

    let my_writeType;

    if(this.data.send_count == 35){
      my_writeType = 'write'
    }
    else{
      my_writeType = 'writeNoResponse'
    }
    wx.writeBLECharacteristicValue({
      deviceId: this.data.deviceId,
      serviceId: this.data.UUID_main,
      characteristicId: this.data.UUID_tx,
      value: buffer1,
      writeType: my_writeType,
      success: () => {
        this.data.send_count++;
        if (this.data.send_count < 70) {
          if (this.data.isDestroy) {
            return;
          }
          this.sendFream(num);
        } else {
          this.sendFreamEnd();
        }
        this.dispPCT((num + 1) * 10 + this.data.send_count / 7);
      },
      fail: () => {
        this.failedMessage("发送中断:1");
      },
    })
  },

  sendFreamEnd() {
    let buffer1 = new ArrayBuffer(1);
    let buffer1u8b = new Uint8Array(buffer1);
    buffer1u8b[0] = 0x55;

    wx.writeBLECharacteristicValue({
      deviceId: this.data.deviceId,
      serviceId: this.data.UUID_main,
      characteristicId: this.data.UUID_tx,
      value: buffer1,
      writeType: 'write',
      success: () => {

      },
      fail: () => {
        this.failedMessage("发送中断:3");
      },
    })
  },

  //发送整组240byte*70
  sendGroup(num, count_at) {
    console.log("sendGroup" + num);
    if (num >= 8) {
      return;
    }
    this.data.send_count = count_at;
    this.sendFream(num);
  },

  myBLECharacteristicValueChange() {
    console.log("开监听")
    wx.onBLECharacteristicValueChange((characteristic) => {
      if (characteristic.characteristicId == this.data.UUID_sta) {
        console.log("STA DATA:" + ab2hex(characteristic.value));
        if (characteristic.value.length != 0) {
          let temp = new Uint8Array(characteristic.value)
          let flag = temp[0] != 0;
          console.log("flag:" + flag);
          this.setData({
            devicesBusyFlag: flag,
          });
        }
      } else if (characteristic.characteristicId == this.data.UUID_rx) {
        console.log("RX DATA:" + ab2hex(characteristic.value));
        var bufferu8b = new Uint8Array(characteristic.value);
        if (bufferu8b[0] == 0xAA) {
          if (this.data.send_step > 0) {
            console.log("step " + this.data.send_step + " done")
            //当前正在发送
            //1:擦除完成
            //2~9 1~8组的写入成功
            //10 写入成功，发送一次刷屏命令.
            this.dispPCT(this.data.send_step * 10);

            if (this.data.send_step < 9) {
              //发送数据
              this.sendGroup(this.data.send_step - 1, 0); //0~8
              this.data.send_step++;
            } else if (this.data.send_step == 9) {
              if (this.data.need_auto_refresh) {
                this.writeStaValue(this.data.UUID_set2, 3);
              } else {
                this.writeStaValue(this.data.UUID_set2, 2);
              }
              this.data.send_step++;
            } else {
              this.data.send_step = 0;
              wx.hideToast();
            }
          }
        } else {
          if (bufferu8b[0] > 0 && bufferu8b[0] <= 70) {
            this.sendGroup(this.data.send_step - 2, bufferu8b[0] - 1)
          }
        }
        console.log("RX DATA:" + ab2hex(characteristic.value));
      } else if (characteristic.characteristicId == this.data.UUID_bat) {
        if (characteristic.value.length != 0) {
          let temp = new Uint8Array(characteristic.value)
          // console.log("battery changed");
          this.setData({
            battery: temp[0],
          });
        }
      }
    })
  },

  listenAll() {
    this.listenUUID(this.data.UUID_bat_main, this.data.UUID_bat);
    this.listenUUID(this.data.UUID_main, this.data.UUID_rx);
    this.listenUUID(this.data.UUID_main, this.data.UUID_sta);
  },

  ReadAll() {
    this.readUUID(this.data.UUID_bat_main, this.data.UUID_bat);
    this.readUUID(this.data.UUID_main, this.data.UUID_rx);
    this.readUUID(this.data.UUID_main, this.data.UUID_sta);
  },

  listenUUID(serId, charId) {
    console.log("Listen:" + charId)
    wx.notifyBLECharacteristicValueChange({
      deviceId: this.data.IdeviceId,
      serviceId: serId,
      characteristicId: charId,
      state: true,
      success: (res) => {
        this.data.listenSucceedCount = this.data.listenSucceedCount + 1
        if (this.data.listenSucceedCount >= 3) {
          this.myBLECharacteristicValueChange();
          this.ReadAll();
        }
      },
      fail: (res) => {
        this.data.listenSucceedCount++;
        if (this.data.listenSucceedCount > 20) {
          this.failedMessage("设备错误")
        } else {
          this.listenUUID(serId, charId)
        }
      }
    })
  },

  readUUID(serId, charId) {
    console.log("Read:" + charId)
    wx.readBLECharacteristicValue({
      deviceId: this.data.IdeviceId,
      serviceId: serId,
      characteristicId: charId,
      success: (res) => {},
      fail: (res) => {
        this.data.listenSucceedCount++;
        if (this.data.listenSucceedCount > 20) {
          this.failedMessage("设备错误")
        } else {
          this.readUUID(serId, charId)
        }
      }
    })
  },

  checkBusy() {
    if (this.data.devicesBusyFlag) {
      wx.showToast({
        title: '设备忙，请稍后',
        icon: 'none',
        duration: 1500,
      });
      return true;
    }
    return false
  },

  buttonFresh() {
    if (this.checkBusy()) {
      return;
    }
    wx.showToast({
      title: '正在刷新',
      icon: 'none',
      duration: 2000,
    });
    this.data.devicesBusyFlag = true;
    this.writeStaValue(this.data.UUID_set0, 4);
  },

  buttonClear() {
    if (this.checkBusy()) {
      return;
    }
    wx.showToast({
      title: '正在清屏',
      icon: 'none',
      duration: 2000,
    });
    this.data.devicesBusyFlag = true;
    this.writeStaValue(this.data.UUID_set0, 3);
  },

  buttonPowerOFF() {
    wx.showToast({
      title: '正在关机',
      icon: 'none',
      duration: 2000,
    });
    if (this.checkBusy()) {
      return;
    }
    this.data.devicesBusyFlag = true;
    this.writeStaValue(this.data.UUID_set0, 2);
  },

  sendPic() {
    if (this.checkBusy()) {
      return;
    }
    this.data.devicesBusyFlag = true;
    this.data.send_step = 1;
    this.writeStaValue(this.data.UUID_set2, 1);
    this.dispPCT(5);
  },

  writeStaValue(set, data) {
    // 向蓝牙设备发送byte
    let buffer = new ArrayBuffer(1);
    var bufferu8b = new Uint8Array(buffer);
    bufferu8b[0] = data;

    console.log("UUID:" + this.data.UUID_set0);
    console.log(ab2hex(buffer));

    wx.writeBLECharacteristicValue({
      deviceId: this.data.deviceId,
      serviceId: this.data.UUID_main,
      characteristicId: set,
      value: buffer,
    })
  },

  getColorError(R1, G1, B1, R2, G2, B2) {
    let Re = R1 - R2;
    let Ge = G1 - G2;
    let Be = B1 - B2;
    return Math.abs(Re) + Math.abs(Ge) + Math.abs(Be);
  },

  //RGB转数据
  getColorBit(R1, G1, B1) {
    let errors = new Array(7);
    // errors[0] = this.getColorError(R1, G1, B1, 0x00, 0x00, 0x00);
    // errors[1] = this.getColorError(R1, G1, B1, 0xFF, 0xFF, 0xFF);
    // errors[2] = this.getColorError(R1, G1, B1, 0x00, 0x96, 0x00);
    // errors[3] = this.getColorError(R1, G1, B1, 0x39, 0x48, 0x68);
    // errors[4] = this.getColorError(R1, G1, B1, 0x9B, 0x22, 0x00);
    // errors[5] = this.getColorError(R1, G1, B1, 0xFF, 0xFF, 0x00);
    // errors[6] = this.getColorError(R1, G1, B1, 0xFF, 0x80, 0x22);

    errors[0] = this.getColorError(R1, G1, B1, 0x28, 0x23, 0x32);
    errors[1] = this.getColorError(R1, G1, B1, 0xF3, 0xF3, 0xF3);
    errors[2] = this.getColorError(R1, G1, B1, 0x49, 0x89, 0x3D);
    errors[3] = this.getColorError(R1, G1, B1, 0x5C, 0x60, 0x89);
    errors[4] = this.getColorError(R1, G1, B1, 0xC2, 0x40, 0x40);
    errors[5] = this.getColorError(R1, G1, B1, 0xDB, 0xCE, 0x63);
    errors[6] = this.getColorError(R1, G1, B1, 0xC4, 0x99, 0x49);

    let num = 0;
    let error_min = errors[0];
    for (let i = 1; i < 7; i++) {
      if (errors[i] < error_min) {
        error_min = errors[i];
        num = i;
      }
    }
    return num;
  },


  switch1Change: function (e) {
    this.data.need_auto_refresh = e.detail.value;
  },

  getImgSendData() {
    //将图片数据转换为发送数据
    this.data.sendBuffer = new ArrayBuffer(600 * 224);
    this.data.sendBuffer8b = new Uint8Array(this.data.sendBuffer);

    for (let y = 0; y < 300; y++) {
      for (let x = 0; x < 448; x++) {
        let addr1 = (y * 448 * 2 + x) * 4;
        let addr2 = (y * 448 * 2 + x + 448) * 4;
        let temp = this.getColorBit(this.data.ImgData.data[addr1 + 0], this.data.ImgData.data[addr1 + 1], this.data.ImgData.data[addr1 + 2]);
        temp |= this.getColorBit(this.data.ImgData.data[addr2 + 0], this.data.ImgData.data[addr2 + 1], this.data.ImgData.data[addr2 + 2]) << 4;
        let addr = (x * 300) + 300 - y - 1;
        this.data.sendBuffer8b[addr] = temp;
      }
    }

    // for (let x = 0; x < 300; x++) {
    //   for (let y = 0; y < 448; y++) {
    //     let xx = y;
    //     let yy1 = x * 2;
    //     let yy2 = x * 2 + 1;
    //     let addr1 = (yy1 * 448 + xx) * 4;
    //     let addr2 = (yy2 * 448 + xx) * 4;
    //     let temp = this.getColorBit(this.data.ImgData.data[addr1 + 0], this.data.ImgData.data[addr1 + 1], this.data.ImgData.data[addr1 + 2]);
    //     temp |= this.getColorBit(this.data.ImgData.data[addr2 + 0], this.data.ImgData.data[addr2 + 1], this.data.ImgData.data[addr2 + 2]) << 4;
    //     this.data.sendBuffer8b[x * 300 + y] = temp;
    //   }
    // }
    //   console.log(ab2hex(this.data.sendBuffer));

    return;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 70 * 240; j++) {
        this.data.sendBuffer8b[i * 70 * 240 + j] = i | i << 4;
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.bleState = false;
    this.data.send_step = 0;
    this.data.send_count = 0;
    wx.openBluetoothAdapter({
      success: (res) => {
        this.data.bleState = true;
        console.log(res)
        wx.startBluetoothDevicesDiscovery({
          success: (res) => {
            console.log(res)
            this.onBluetoothDeviceFound();
          },
        });
      },
      fail: (res) => {
        console.log("open failed 1");
        this.failedMessage("打开失败");
      }
    });

    //获取图片数据
    this.data.query = wx.createSelectorQuery()
    this.data.query.select('#canvas').fields({
      node: true,
      size: true,
    })
    this.data.query.exec((res) => {

      this.data.canvas = res[0].node
      this.data.ctx = this.data.canvas.getContext('2d')
      this.data.canvas.width = 448
      this.data.canvas.height = 600

      this.data.ImgData = this.data.ctx.createImageData(448, 600);

      let img = this.data.canvas.createImage();
      img.src = app.globalData.userImgSrc;
      img.onload = (e) => {
        this.data.ctx.clearRect(0, 0, 448, 600)
        this.data.ctx.drawImage(img, 0, 0, 448, 600)
        this.data.ImgData = this.data.ctx.getImageData(0, 0, 448, 600);
        this.getImgSendData();
      }
    })

    wx.setKeepScreenOn({
      keepScreenOn: true
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
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("退出页面");
    this.data.isDestroy = true;
    wx.setKeepScreenOn({
      keepScreenOn: false
    })

    if (this.data.bleState) {
      wx.closeBluetoothAdapter({
        success(res) {}
      })
    }

    wx.navigateBack({
      delta: 10
    })

  },

})