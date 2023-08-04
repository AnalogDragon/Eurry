// pages/imagefilters/imagefilters.js

const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgSrcIN: '',
        imgSrcOUT: '',
        myImgData: '',
        newImgData: '',
        query: '',
        ctx: '',
        canvas: '',
        startup: true,

        valueR: 0,
        valueG: 0,
        valueB: 0,

        valueD: 0,
        valueL: 0,
        valueS: 0,

        valueQ: 90,

        SetHSL: true,

        real_time_set: false,
    },

    backToIndex() {
        wx.navigateBack({
            delta: 10,
        })
    },

    mySaveImg(url) {
        //console.log(url);
        const fs = wx.getFileSystemManager()

        if (url.indexOf("data:image/png;base64,") >= 0) {

            const result = fs.removeSavedFile({
                filePath: `${wx.env.USER_DATA_PATH}/temp.png`,
                success: () => {
                    console.log("删除成功" + `${wx.env.USER_DATA_PATH}/temp.png`);
                },
                fail: (res) => {
                    console.log("删除失败" + `${wx.env.USER_DATA_PATH}/temp.png`);
                    console.error(res);
                },
                complete: () => {
                    try {
                        const res = fs.writeFileSync(
                            `${wx.env.USER_DATA_PATH}/temp.png`,
                            url.slice(22),
                            'base64'
                        )
                        console.log("save as:" + `${wx.env.USER_DATA_PATH}/temp.png`);
                    } catch (e) {
                        console.error(e);
                    }
                    this.backToIndex();
                },
            });
        } else if (url.indexOf("http") >= 0) {

            const result = fs.removeSavedFile({
                filePath: `${wx.env.USER_DATA_PATH}/temp.png`,
                success: () => {
                    console.log("删除" + res.fileList[i].filePath);
                },
                fail: (res) => {
                    console.log("删除失败" + `${wx.env.USER_DATA_PATH}/temp.png`);
                    console.error(res);
                },
                complete: () => {
                    try {
                        const result = fs.saveFileSync(url, `${wx.env.USER_DATA_PATH}/temp.png`);
                        console.log(result);
                    } catch (e) {
                        console.error(e);
                    }
                    this.backToIndex();
                },
            });
        } else {
            console.error("传入参数无效");
            this.backToIndex();
        }
    },

    clickcut() {
        console.log("clickcut");
        wx.previewImage({
            current: this.data.imgSrcOUT, // 当前显示图片的http链接
            urls: [this.data.imgSrcOUT] // 需要预览的图片http链接列表
        })
    },

    submit() {
        this.exchangeDithor();
        console.log("第二步结束");
        this.mySaveImg(this.data.imgSrcOUT);
    },

    myshow() {
        this.data.ctx.putImageData(this.data.newImgData, 0, 0);
        this.data.imgSrcOUT = this.data.canvas.toDataURL('png', 1);
        this.setData({
            imgSrcOUT: this.data.imgSrcOUT,
        });
        wx.hideToast({
            success: (res) => {},
        })
    },

    exchangeHSL() {
        this.data.SetHSL = !this.data.SetHSL;
        this.setData({
            SetHSL: this.data.SetHSL,
            valueR: this.data.valueR,
            valueG: this.data.valueG,
            valueB: this.data.valueB,
            valueD: this.data.valueD,
            valueS: this.data.valueS,
            valueL: this.data.valueL,
            valueQ: this.data.valueQ,
        });
    },

    switch1Change(e){
        this.data.real_time_set = e.detail.value;
        if(this.data.real_time_set){
            wx.showToast({
                title: '开启自动预览',
                icon: 'none',
                duration: 1000,
            })
            this.doAllFilter();
        }
        else{
            wx.showToast({
                title: '关闭自动预览',
                icon: 'none',
                duration: 500,
            })
        }
    },

    doAllFilter(){
        this.mySetRGBImg();
        this.data.newImgData = this.Dither(this.data.newImgData);
        this.data.ctx.putImageData(this.data.newImgData, 0, 0);
        this.myshow();
    },

    doRGBFilter(){
        this.mySetRGBImg();
        this.myshow();
    },

    exchangeDithor() {
        wx.showToast({
            title: '处理中',
            icon: 'loading',
            duration: 60000,
        })
        this.doAllFilter();
        wx.hideToast({
            success: (res) => {},
        })
    },

    ontimeShowRGB() {
        if (this.data.real_time_set) {
            wx.showToast({
                title: '处理中',
                icon: 'loading',
                duration: 60000,
            })
            this.doRGBFilter();
            wx.hideToast({
                success: (res) => {},
            })
        }
    },

    ontimeShowDither() {
        if (this.data.real_time_set) {
            this.exchangeDithor();
        }
    },

    doSilderR(e) {
        this.data.valueR = e.detail.value;
        this.ontimeShowRGB();
    },
    doSilderG(e) {
        this.data.valueG = e.detail.value;
        this.ontimeShowRGB();
    },
    doSilderB(e) {
        this.data.valueB = e.detail.value;
        this.ontimeShowRGB();
    },

    doSilderD(e) {
        this.data.valueD = e.detail.value;
        this.ontimeShowRGB();
    },

    doSilderS(e) {
        this.data.valueS = e.detail.value;
        this.ontimeShowRGB();
    },

    doSilderL(e) {
        this.data.valueL = e.detail.value;
        this.ontimeShowRGB();
    },

    doSilderQ(e) {
        this.data.valueQ = e.detail.value;
        this.ontimeShowDither();
    },

    imgReset() {
        let img = this.data.canvas.createImage();
        img.src = this.data.imgSrcIN;
        img.onload = (e) => {
            this.data.ctx.clearRect(0, 0, 448, 600)
            this.data.ctx.drawImage(img, 0, 0, 448, 600)
            this.data.myImgData = this.data.ctx.getImageData(0, 0, 448, 600);
            this.data.newImgData = this.data.ctx.getImageData(0, 0, 448, 600);
            this.myshow();
        }
        console.log(img);

        this.data.valueR = 0;
        this.data.valueG = 0;
        this.data.valueB = 0;

        this.data.valueD = 0;
        this.data.valueS = 0;
        this.data.valueL = 0;

        this.data.valueQ = 90;

        this.setData({
            valueR: this.data.valueR,
            valueG: this.data.valueG,
            valueB: this.data.valueB,
            valueD: this.data.valueD,
            valueS: this.data.valueS,
            valueL: this.data.valueL,
            valueQ: this.data.valueQ,
        });

        this.myshow();
    },

    hslToRgb(h, s, l) {
        var m1, m2, hue,
            r, g, b,
            rgb = [];

        if (s === 0) {
            r = g = b = l * 255 + 0.5 | 0;
            rgb = [r, g, b];
        } else {
            if (l <= 0.5) {
                m2 = l * (s + 1);
            } else {
                m2 = l + s - l * s;
            }

            m1 = l * 2 - m2;
            hue = h + 1 / 3;

            var tmp;
            for (var i = 0; i < 3; i += 1) {
                if (hue < 0) {
                    hue += 1;
                } else if (hue > 1) {
                    hue -= 1;
                }

                if (6 * hue < 1) {
                    tmp = m1 + (m2 - m1) * hue * 6;
                } else if (2 * hue < 1) {
                    tmp = m2;
                } else if (3 * hue < 2) {
                    tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
                } else {
                    tmp = m1;
                }

                rgb[i] = tmp * 255 + 0.5 | 0;

                hue -= 1 / 3;
            }
        }

        return rgb;
    },
    rgbToHsl: function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        //        var max = Math.max(r, g, b),
        //            min = Math.min(r, g, b),
        var max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
            min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
            chroma = max - min,
            h = 0,
            s = 0,
            // Lightness
            l = (min + max) / 2;

        if (chroma !== 0) {
            // Hue
            if (r === max) {
                h = (g - b) / chroma + ((g < b) ? 6 : 0);
            } else if (g === max) {
                h = (b - r) / chroma + 2;
            } else {
                h = (r - g) / chroma + 4;
            }
            h /= 6;

            // Saturation
            s = (l > 0.5) ? chroma / (2 - max - min) : chroma / (max + min);
        }

        return [h, s, l];
    },




    findNearestColor(_color, _palette) {
        var minDistanceSquared = 255 * 255 * 3 + 1
        var bestIndex = 0
        for (var i = 0; i < _palette.length; i++) {
            var Rdiff = (_color[0] & 0xff) - (_palette[i][0] & 0xff)
            var Gdiff = (_color[1] & 0xff) - (_palette[i][1] & 0xff)
            var Bdiff = (_color[2] & 0xff) - (_palette[i][2] & 0xff)

            var distanceSquared = Rdiff * Rdiff + Gdiff * Gdiff + Bdiff * Bdiff
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared
                bestIndex = i
            }
        }
        return bestIndex
    },

    plus_truncate_uchar(a, b) {
        let Qut = (50 - this.data.valueQ + 5);
        if ((a & 0xff) + b < 0) {
            return 0;
        } else if ((a & 0xff) + b > 255) {
            return 255;
        } else if (Math.abs(b) < Qut) {
            return a;
        } else {
            return (a + b);
        }
    },

    buildMap(f) {
        for (var m = [], k = 0, v; k < 256; k += 1) {
            m[k] = (v = f(k)) > 255 ? 255 : v < 0 ? 0 : v | 0;
        }
        return m;
    },

    applyMap(src, dst, map) {
        for (var i = 0, l = src.length; i < l; i += 4) {
            dst[i] = map[src[i]];
            dst[i + 1] = map[src[i + 1]];
            dst[i + 2] = map[src[i + 2]];
        }
    },
    mapRGB(src, dst, func) {
        this.applyMap(src, dst, this.buildMap(func));
    },

    BrightnessContrastPhotoshop(srcImageData, brightness, contrast) {

        // fix to 0 <= n <= 2;
        brightness = (brightness + 100) / 100;
        contrast = (contrast + 100) / 100;

        this.mapRGB(srcImageData.data, srcImageData.data, function (value) {
            value *= brightness;
            value = (value - 127.5) * contrast + 127.5;
            return value + 0.5 | 0;
        });
    },



    myFloydDither(_imgdata) {
        var srcWidth = _imgdata.width,
            srcHeight = _imgdata.height,
            dstPixels = _imgdata.data;

        let palette = new Array();
        // palette[0] = [0x00, 0x00, 0x00];
        // palette[1] = [0xFF, 0xFF, 0xFF];
        // palette[2] = [0x00, 0x96, 0x00];
        // palette[3] = [0x39, 0x48, 0x68];
        // palette[4] = [0x9B, 0x22, 0x00];
        // palette[5] = [0xFF, 0xFF, 0x00];
        // palette[6] = [0xFF, 0x80, 0x22];

        palette[0] = [0x28, 0x23, 0x32];
        palette[1] = [0xF3, 0xF3, 0xF3];
        palette[2] = [0x49, 0x89, 0x3D];
        palette[3] = [0x5C, 0x60, 0x89];
        palette[4] = [0xC2, 0x40, 0x40];
        palette[5] = [0xDB, 0xCE, 0x63];
        palette[6] = [0xC4, 0x99, 0x49];

        let pixel = new Array();
        let pixnumInLine = _imgdata.width * 4;

        var index, index0
        old_r, old_g, old_b,
        new_r, new_g, new_b,
        err_r, err_g, err_b,
        nbr_r, nbr_g, nbr_b,
        srcWidthMinus1 = srcWidth - 1,
            srcHeightMinus1 = srcHeight - 1,
            A = 7 / 16,
            B = 3 / 16,
            C = 5 / 16,
            D = 1 / 16;

        for (var y = 0; y < srcHeight; y++) {
            for (var x = 0; x < srcWidth; x++) {
                index = (y * srcWidth + x) << 2;

                old_r = dstPixels[index];
                old_g = dstPixels[index + 1];
                old_b = dstPixels[index + 2];

                index0 = this.findNearestColor([old_r, old_g, old_b], palette)

                // Apply the posterize map
                new_r = palette0[index2][0];
                new_g = palette0[index2][1];
                new_b = palette0[index2][2];

                // Set the current pixel.
                dstPixels[index] = new_r;
                dstPixels[index + 1] = new_g;
                dstPixels[index + 2] = new_b;

                // errors
                err_r = old_r - new_r;
                err_g = old_g - new_g;
                err_b = old_b - new_b;


                var index2 = this.findNearestColor(pixel, palette)

                var error = (pixel[0] % 256) - (palette[index][0] % 256)
                var error = (pixel[1] % 256) - (palette[index][1] % 256)
                var error = (pixel[2] % 256) - (palette[index][2] % 256)

                if (x < srcWidthMinus1) {
                    channelsIndex = (y + 0) * pixnumInLine + (x + 1) * 4
                    dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 7) >> 4);
                    dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 7) >> 4);
                    dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 7) >> 4);
                }

                if (y < srcHeightMinus1) {
                    if (x - 1 > 0) {
                        channelsIndex = (y + 1) * pixnumInLine + (x - 1) * 4
                        dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 3) >> 4);
                    }
                    channelsIndex = (y + 1) * pixnumInLine + (x + 0) * 4
                    dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 5) >> 4);

                    if (x + 1 < _imgdata.width) {
                        channelsIndex = (y + 1) * pixnumInLine + (x + 1) * 4
                        dstPixels[channelsIndex + i] = this.plus_truncate_uchar(dstPixels[channelsIndex + i], (error * 1) >> 4);
                    }
                }

                dstPixels[(y + 0) * pixnumInLine + (x + 0) * 4 + 0] = palette[index][0]
                dstPixels[(y + 0) * pixnumInLine + (x + 0) * 4 + 1] = palette[index][1]
                dstPixels[(y + 0) * pixnumInLine + (x + 0) * 4 + 2] = palette[index][2]
            }
        }
        return _imgdata;
    },

    mySetRGBImg() {
        var i, v;

        this.data.ctx.putImageData(this.data.myImgData, 0, 0);
        this.data.newImgData = this.data.ctx.getImageData(0, 0, 448, 600);


        if (this.data.valueR != 0 || this.data.valueG != 0 || this.data.valueB != 0) {
            let temp = 0;

            if (this.data.valueR > 0 && this.data.valueG > 0 && this.data.valueB > 0) {
                temp = (this.data.valueR < this.data.valueG) ? this.data.valueR : this.data.valueG;
                temp = (temp < this.data.valueB) ? temp : this.data.valueB;
            } else if (this.data.valueR < 0 && this.data.valueG < 0 && this.data.valueB < 0) {
                temp = (this.data.valueR > this.data.valueG) ? this.data.valueR : this.data.valueG;
                temp = (temp > this.data.valueB) ? temp : this.data.valueB;
            }
            let valueR = this.data.valueR - temp;
            let valueG = this.data.valueG - temp;
            let valueB = this.data.valueB - temp;

            for (i = 0; i < this.data.newImgData.data.length; i += 4) {
                let r = this.data.newImgData.data[i];
                let g = this.data.newImgData.data[i + 1];
                let b = this.data.newImgData.data[i + 2];

                this.data.newImgData.data[i] = (v = this.data.newImgData.data[i] + valueR) > 255 ? 255 : v < 0 ? 0 : v;
                this.data.newImgData.data[i + 1] = (v = this.data.newImgData.data[i + 1] + valueG) > 255 ? 255 : v < 0 ? 0 : v;
                this.data.newImgData.data[i + 2] = (v = this.data.newImgData.data[i + 2] + valueB) > 255 ? 255 : v < 0 ? 0 : v;
                if (this.data.newImgData.data[i + 3] < 255) {
                    this.data.newImgData.data[i] += 255 - this.data.newImgData.data[i + 3];
                    this.data.newImgData.data[i + 1] += 255 - this.data.newImgData.data[i + 3];
                    this.data.newImgData.data[i + 2] += 255 - this.data.newImgData.data[i + 3];
                    this.data.newImgData.data[i + 3] = 255;
                }
            }
        }

        if (this.data.valueS != 0) {
            for (i = 0; i < this.data.newImgData.data.length; i += 4) {
                let hsl = this.rgbToHsl(this.data.newImgData.data[i], this.data.newImgData.data[i + 1], this.data.newImgData.data[i + 2]);

                // saturation
                let s = hsl[1] + hsl[1] * this.data.valueS / 100;
                if (s < 0) {
                    s = 0;
                } else if (s > 1) {
                    s = 1;
                }

                // convert back to rgb
                let rgb = this.hslToRgb(hsl[0], s, hsl[2]);

                this.data.newImgData.data[i] = rgb[0];
                this.data.newImgData.data[i + 1] = rgb[1];
                this.data.newImgData.data[i + 2] = rgb[2];
            }
        }

        if (this.data.valueL != 0 || this.data.valueD != 0) {
            this.BrightnessContrastPhotoshop(this.data.newImgData, this.data.valueL, this.data.valueD)
        }
    },



    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (this.data.startup == false) {
            return;
        }
        this.data.startup = false;
        console.log("onload")
        let src = app.globalData.userImgSrc;
        if (app.globalData.src_temp) {
            src = app.globalData.src_temp;
        }
        this.data.imgSrcIN = src;
        this.setData({
            imgSrcIN: this.data.imgSrcIN,
        });
        console.log(this.data.imgSrcIN);

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

            this.data.myImgData = this.data.ctx.createImageData(448, 600);
            this.data.newImgData = this.data.ctx.createImageData(448, 600);
            this.imgReset();
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

    Dither(_srcImageData) {
        var srcWidth = _srcImageData.width,
            srcHeight = _srcImageData.height,
            dstPixels = _srcImageData.data;

        let palette = new Array();
        let palette0 = new Array();
        // palette[0] = [0x00, 0x00, 0x00];
        // palette[1] = [0xFF, 0xFF, 0xFF];
        // palette[2] = [0x00, 0x96, 0x00];
        // palette[3] = [0x39, 0x48, 0x68];
        // palette[4] = [0x9B, 0x22, 0x00];
        // palette[5] = [0xFF, 0xFF, 0x00];
        // palette[6] = [0xFF, 0x80, 0x22];

        palette[0] = [0x28, 0x23, 0x32];
        palette[1] = [0xF3, 0xF3, 0xF3];
        palette[2] = [0x49, 0x89, 0x3D];
        palette[3] = [0x5C, 0x60, 0x89];
        palette[4] = [0xC2, 0x40, 0x40];
        palette[5] = [0xDB, 0xCE, 0x63];
        palette[6] = [0xC4, 0x99, 0x49];

        palette0[0] = [0x28, 0x23, 0x32];
        palette0[1] = [0xF3, 0xF3, 0xF3];
        palette0[2] = [0x40, 0xf3, 0x3D];
        palette0[3] = [0x40, 0x40, 0xf3];
        palette0[4] = [0xC2, 0x40, 0x40];
        palette0[5] = [0xDB, 0xCE, 0x63];
        palette0[6] = [0xC4, 0x99, 0x49];

        // apply the dithering algorithm to each pixel
        var x, y,
            index,
            valueQ,
            old_r, old_g, old_b,
            new_r, new_g, new_b,
            err_r, err_g, err_b,
            nbr_r, nbr_g, nbr_b,
            srcWidthMinus1 = srcWidth - 1,
            srcHeightMinus1 = srcHeight - 1,
            A = 7 / 16,
            B = 3 / 16,
            C = 5 / 16,
            D = 1 / 16;

        valueQ = this.data.valueQ / 100;

        for (y = 0; y < srcHeight; y += 1) {
            for (x = 0; x < srcWidth; x += 1) {
                // Retrieve current RGB value.
                index = (y * srcWidth + x) << 2;

                old_r = dstPixels[index];
                old_g = dstPixels[index + 1];
                old_b = dstPixels[index + 2];

                var index2 = this.findNearestColor([old_r, old_g, old_b], palette0)

                // Apply the posterize map
                new_r = palette0[index2][0];
                new_g = palette0[index2][1];
                new_b = palette0[index2][2];

                // Set the current pixel.
                dstPixels[index] = new_r;
                dstPixels[index + 1] = new_g;
                dstPixels[index + 2] = new_b;

                // errors
                err_r = (old_r - new_r) * valueQ;
                err_g = (old_g - new_g) * valueQ;
                err_b = (old_b - new_b) * valueQ;

                // Apply the kernel.
                // x + 1, y
                index += 1 << 2;
                if (x < srcWidthMinus1) {
                    nbr_r = dstPixels[index] + A * err_r;
                    nbr_g = dstPixels[index + 1] + A * err_g;
                    nbr_b = dstPixels[index + 2] + A * err_b;

                    dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x - 1, y + 1
                index += (srcWidth - 2) << 2;
                if (x > 0 && y < srcHeightMinus1) {
                    nbr_r = dstPixels[index] + B * err_r;
                    nbr_g = dstPixels[index + 1] + B * err_g;
                    nbr_b = dstPixels[index + 2] + B * err_b;

                    dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x, y + 1
                index += 1 << 2;
                if (y < srcHeightMinus1) {
                    nbr_r = dstPixels[index] + C * err_r;
                    nbr_g = dstPixels[index + 1] + C * err_g;
                    nbr_b = dstPixels[index + 2] + C * err_b;

                    dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x + 1, y + 1
                index += 1 << 2;
                if (x < srcWidthMinus1 && y < srcHeightMinus1) {
                    nbr_r = dstPixels[index] + D * err_r;
                    nbr_g = dstPixels[index + 1] + D * err_g;
                    nbr_b = dstPixels[index + 2] + D * err_b;

                    dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }
            }
        }

        //进行一个简单的颜色替换
        for (y = 0; y < srcHeight; y += 1) {
            for (x = 0; x < srcWidth; x += 1) {
                index = (y * srcWidth + x) << 2;
                if (dstPixels[index] == palette0[3][0] && dstPixels[index + 1] == palette0[3][1]) {
                    dstPixels[index] = palette[3][0];
                    dstPixels[index + 1] = palette[3][1];
                    dstPixels[index + 2] = palette[3][2];
                }
                if (dstPixels[index] == palette0[2][0] && dstPixels[index + 1] == palette0[2][1]) {
                    dstPixels[index] = palette[2][0];
                    dstPixels[index + 1] = palette[2][1];
                    dstPixels[index + 2] = palette[2][2];
                }
            }
        }

        return _srcImageData;
    },

})