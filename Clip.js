/**
 * 轻量图片裁剪插件
 * 作者： yang
 * new Clip(element, {
 *      file: 文件      file
 *      clipSize: 裁剪框尺寸  array
 *      outputSize: 输入图片尺寸 倍数 number
 *      wheelScale: 是否启用滚轮缩放   boolean
 *      scaleValue: 滑轮每次滚动缩放的值 number
 *      fillBackground: 图片的背景填充  string
 *      rangeStyle: 裁剪框样式 {} 键值对  object
 *      CrossOrigin: 网络图片是否跨域 boolean 
 *      loaddone: 图片加载完成回调  fn
 *      scaleChange: 图片缩放值改变回调  fn  agument[0] = 缩放值
 *      error: 图片加载错误回调  fn
 * });
 * Clip.load() 加载文件 如果options.file不存在 可通过调用这个方法触发加载
 * Clip.set() 重新设置 实例 options 对象
 * Clip.destroy() 销毁实例
 * Clip.toDataURL() 生成图片
 * Clip.scale() 设置/返回缩放值
 * Clip.el => 裁剪容器
 * Clip.sourceImage => 裁剪源图片
 * Clip.sourceImageURL => 源图片uri
 * Clip.sourceImageWidth => 原图尺寸
 * Clip.sourceImageHeight => 原图尺寸
 * Clip.imageScaleRatio => 当前图片缩放比
 * Clip.imageScaleMin => 当前图片最小缩放率
 * Clip.imageScaleMax => 当前图片最大缩放率
 */
(function (root, fn) {
    "use strict";
    typeof module === 'object' && typeof module.exports === 'object' ? module.exports = root.document ? fn(root,
        undefined) : function (w) {
        if (!w.document) throw new Error('document does not exist !');
        return fn(w);
    } : fn(root, undefined);
})(window || this, function (w, u) {
    var Clip = function (element, options) {
        if (element.nodeType !== 1) {
            if (typeof t.opt.error === 'function') t.opt.error();
            throw new Error('aguments[0] not is element');
        }
        var opt = {
            file: null,
            clipSize: [200, 200],
            outputSize: 1,
            wheelScale: true,
            scaleValue: 10,
            CrossOrigin: false,
            fillBackground: '',
            rangeStyle: null,
            loaddone: null,
            scaleChange: null,
            error: null,
        };
        var t = this;
        opt = Object.assign(opt, options);
        if (!(opt.clipSize instanceof Array) || opt.clipSize.length < 2 || isNaN(Number(opt.clipSize[0])) || isNaN(Number(opt.clipSize[1]))) {
            if (typeof t.opt.error === 'function') t.opt.error();
            throw new Error('options.clipSize invalid value');
        }
        if (opt.outputSize && isNaN(opt.outputSize)) {
            if (typeof t.opt.error === 'function') t.opt.error();
            throw new Error('options.outputSize invalid value');
        }
        t.el = element;
        t.opt = opt;
        if (opt.file) {
            init(t, opt.file);
        }
    }
    /**
     * methods
     */
    // 内部方法
    if (typeof Object.assign !== 'function') {
        Object.defineProperty(Object, "assign", {
            value: function assign(target, varArgs) {
                if (target === null || target === undefined) throw new TypeError('Cannot convert undefined or null to object');
                var to = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var nextSource = arguments[index];
                    if (nextSource !== null && nextSource !== undefined) {
                        for (var nextKey in nextSource) {
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                return to;
            },
            writable: true,
            configurable: true
        });
    }
    // 渲染结构
    function create(t) {
        var el = t.el;
        // 容器样式
        var position = getComputedStyle(el)['position'];
        if (!/(fixed|absolute|relative)/.test(position)) {
            el.style.position = 'relative';
        }
        el.innerHTML = '';
        el.style.overflow = 'hidden';
        el.style.userSelect = 'none';
        var elW = el.clientWidth;
        var elH = el.clientHeight;
        // 裁剪框结构
        var fragment = document.createDocumentFragment();
        // 裁剪层
        var layer = document.createElement('div');
        var clipAreaStyle = 'position: absolute; top: 50%; left: 50%; pointer-events: none; box-sizing: border-box; text-align: left;';
        layer.className = 'clip-layer';
        layer.setAttribute('style', clipAreaStyle);
        layer.style.width = t.opt.clipSize[0] + 'px';
        layer.style.height = t.opt.clipSize[1] + 'px';
        layer.style.marginLeft = -(t.opt.clipSize[0] / 2) + 'px';
        layer.style.marginTop = -(t.opt.clipSize[1] / 2) + 'px';
        // 裁剪层图片
        var layerImg = new Image();
        if (t.opt.CrossOrigin) {
            layerImg.crossOrigin = 'anonymous';
        }
        layerImg.src = t.sourceImageURL;
        layerImg.onload = function (e) {
            t.sourceImage = this;
            t.sourceImageWidth = this.width;
            t.sourceImageHeight = this.height;
            var imgRatio = this.width / this.height;
            // 图片自适应居中
            this.width = t.opt.clipSize[0];
            this.height = this.width / imgRatio;
            layer.appendChild(this);
            t.imageScaleRatio = this.width / t.sourceImageWidth;
            t.imageScaleMin = t.opt.clipSize[0] / 5 / t.sourceImageWidth;
            t.imageScaleMax = t.opt.clipSize[0] * 5 / t.sourceImageWidth;
            this.style.position = 'relative';
            this.style.left = -((this.width - t.opt.clipSize[0]) / 2) + 'px';
            this.style.top = -((this.height - t.opt.clipSize[1]) / 2) + 'px';
            this.removeAttribute('height');
            if (typeof t.opt.loaddone === 'function') t.opt.loaddone();
        };
        layerImg.onerror = function () {
            if (typeof t.opt.error === 'function') t.opt.error();
        };
        fragment.appendChild(layer);
        // 遮罩层
        var mask = document.createElement('div');
        var maskStyle = 'position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; box-sizing: border-box;';
        mask.className = 'clip-mask';
        mask.setAttribute('style', maskStyle);
        var maskCenter = document.createElement('div');
        maskCenter.className = 'clip-mask-center';
        maskCenter.setAttribute('style', clipAreaStyle);
        maskCenter.style.width = t.opt.clipSize[0] + 'px';
        maskCenter.style.height = t.opt.clipSize[1] + 'px';
        maskCenter.style.marginLeft = -(t.opt.clipSize[0] / 2) + 'px';
        maskCenter.style.marginTop = -(t.opt.clipSize[1] / 2) + 'px';
        var rangeStyle = t.opt.rangeStyle;
        maskCenter.style.border = '1px dashed #007dfe';
        for (var rangeItem in rangeStyle) {
            maskCenter.style[rangeItem] = rangeStyle[rangeItem];
        }
        var maskTop = document.createElement('div');
        maskTop.className = 'clip-mask-top';
        maskTop.setAttribute('style', 'position: absolute; top: 0; right: 0; bottom: 50%; left: 0; background-color: rgba(0, 0, 0, 0.5);');
        maskTop.style.marginBottom = (t.opt.clipSize[1] / 2) + 'px';
        var maskRight = document.createElement('div');
        maskRight.className = 'clip-mask-right';
        maskRight.setAttribute('style', 'position: absolute; top: 50%; right: 0; bottom: 50%; left: 50%; background-color: rgba(0, 0, 0, 0.5);');
        maskRight.style.marginTop = -(t.opt.clipSize[1] / 2) + 'px';
        maskRight.style.marginBottom = -(t.opt.clipSize[1] / 2) + 'px';
        maskRight.style.marginLeft = (t.opt.clipSize[0] / 2) + 'px';
        var maskBottom = document.createElement('div');
        maskBottom.className = 'clip-mask-bottom';
        maskBottom.setAttribute('style', 'position: absolute; top: 50%; right: 0; bottom: 0; left: 0; background-color: rgba(0, 0, 0, 0.5);');
        maskBottom.style.marginTop = (t.opt.clipSize[1] / 2) + 'px';
        var maskLeft = document.createElement('div');
        maskLeft.className = 'clip-mask-left';
        maskLeft.setAttribute('style', 'position: absolute; top: 50%; right: 50%; bottom: 50%; left: 0; background-color: rgba(0, 0, 0, 0.5);');
        maskLeft.style.marginTop = -(t.opt.clipSize[1] / 2) + 'px';
        maskLeft.style.marginBottom = -(t.opt.clipSize[1] / 2) + 'px';
        maskLeft.style.marginRight = (t.opt.clipSize[0] / 2) + 'px';
        mask.appendChild(maskTop);
        mask.appendChild(maskBottom);
        mask.appendChild(maskRight);
        mask.appendChild(maskLeft);
        mask.appendChild(maskCenter);
        fragment.appendChild(mask);
        // 插入实体dom
        el.appendChild(fragment);
    };
    // 绑定拖动
    function bindDrag(t) {
        var dragEl = t.el;
        var isMobile = /(Mobile|iPhone|iPod|iPad|Linux|Android)/ig.test(w.navigator.userAgent);
        var pointX, pointY;
        var elLeft, elTop;
        isMobile ? dragEl.ontouchstart = dragStart : dragEl.onmousedown = dragStart;

        function dragStart(e) {
            var moveEl = t.sourceImage;
            elLeft = parseInt(moveEl.style.left);
            elTop = parseInt(moveEl.style.top);
            pointX = isMobile ? e.changedTouches[0].clientX : e.clientX;
            pointY = isMobile ? e.changedTouches[0].clientY : e.clientY;
            document.addEventListener(isMobile ? 'touchmove' : 'mousemove', dragMove);
            document.addEventListener(isMobile ? 'touchend' : 'mouseup', dragEnd);
            e.preventDefault();
        }

        function dragMove(e) {
            var moveEl = t.sourceImage;
            var moveX = (isMobile ? e.changedTouches[0].clientX : e.clientX) - pointX;
            var moveY = (isMobile ? e.changedTouches[0].clientY : e.clientY) - pointY;
            moveEl.style.left = (elLeft + moveX) + 'px';
            moveEl.style.top = (elTop + moveY) + 'px';
        }

        function dragEnd(e) {
            document.removeEventListener(isMobile ? 'touchmove' : 'mousemove', dragMove);
            document.removeEventListener(isMobile ? 'touchend' : 'mouseup', dragEnd);
        }
    };
    // 绑定滚动缩放
    function bindWheel(t) {
        var wheelEl = t.el;
        wheelEl.onwheel = null;
        wheelEl.onwheel = function (e) {
            var dy = e.deltaY || e.wheelDeltaY;
            var value = dy < 0 ? t.opt.scaleValue : -t.opt.scaleValue;
            t.scale(value);
            e.preventDefault();
        }
    };
    // 裁剪功能创建
    function init(t, file) {
        // 重新初始化元素操作
        t.el.innerHTML = '';
        t.el.onmousedown = null;
        t.el.onwheel = null;
        // 网络地址请求
        if (typeof file === 'string' && /^http(s)?:\/\//.test(file)) {
            t.sourceImageURL = file + '?t=' + new Date().getTime();
            create(t);
            bindDrag(t);
            if (t.opt.wheelScale) {
                bindWheel(t);
            }
        } else {
            // 文件
            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = function (e) {
                if (fileReader.result.indexOf('image') < 0) {
                    if (typeof t.opt.error === 'function') t.opt.error();
                    throw new Error('options.file not is image');
                }
                t.sourceImageURL = fileReader.result;
                create(t);
                bindDrag(t);
                if (t.opt.wheelScale) {
                    bindWheel(t);
                }
            }
            fileReader.onerror = function (e) {
                if (typeof t.opt.error === 'function') t.opt.error();
            }
        }
    };
    // 原型方法
    Clip.prototype = {
        constructor: Clip,
        /**
         * 加载文件
         * @param {*} file = 文件对象 || url
         */
        load: function (file) {
            var t = this;
            if (!file) {
                if (typeof t.opt.error === 'function') t.opt.error();
                throw new Error('file undefined');
            }
            if (t.opt.file) return;
            init(t, file);
            return this;
        },
        /**
         * 重新设置 options 参数
         * @param {*} key 
         * @param {*} value 
         */
        set: function (key, value) {
            if (typeof this.opt[key] === 'undefined' || typeof value === 'undefined') return;
            this.opt[key] = value;
            // 重绘裁剪框
            if (key === 'clipSize') {
                create(this);
            }
            // 滚动缩放事件
            if (key === 'wheelScale') {
                if (value) {
                    bindWheel(this);
                } else {
                    this.el.onwheel = null;
                }
            }
            return this;
        },
        // 销毁实例
        destroy: function () {
            if (!this.sourceImage) return;
            this.el.innerHTML = '';
            this.el.onmousedown = null;
            this.el.onwheel = null;
            delete this.el;
            delete this.opt;
            delete this.sourceImage;
            delete this.sourceImageURL;
        },
        /**
         * 生成裁剪后的base64
         * @param {*} type = 图片类型
         * @param {*} quality = 图片质量 0.1 - 1
         */
        toDataURL: function (type, quality) {
            if (!this.sourceImage) return;
            var imageType = type ? 'image/' + type : 'image/png';
            var imageQuality = quality || 1;
            var img = this.sourceImage;
            var canvas = document.createElement('canvas');
            var outputRatio = this.opt.outputSize;
            canvas.width = this.opt.clipSize[0] * outputRatio;
            canvas.height = this.opt.clipSize[1] * outputRatio;
            var ctx = canvas.getContext('2d');
            var background = this.opt.fillBackground;
            // 背景填充
            if (background !== '' && background !== 'transparent') {
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, parseInt(img.style.left) * outputRatio, parseInt(img.style.top) * outputRatio, img.width * outputRatio, img.height * outputRatio);
            return canvas.toDataURL(imageType, imageQuality);
        },
        /**
         * 缩放图片 设置 value 像素值 支持负数
         * @param {*} value = number 像素值
         */
        scale: function (value) {
            if (!this.sourceImage) return;
            if (isNaN(value)) throw new Error('fn:scale agument[0] is not number');
            var v = Math.round(value);
            var img = this.sourceImage;
            var imgLeft = Number(getComputedStyle(img)['left'].slice(0, -2));
            var imgTop = Number(getComputedStyle(img)['top'].slice(0, -2));
            // 最小值
            if (v < 0 && (img.width + v) <= this.sourceImageWidth * this.imageScaleMin) return;
            // 最大值
            if (v > 0 && (img.width + v) >= this.sourceImageWidth * this.imageScaleMax) return;
            img.width += v;
            img.style.left = (imgLeft - v / 2) + 'px';
            var imgRatio = Number((img.height / img.width).toFixed(1));
            img.style.top = (imgTop - v / 2 * imgRatio) + 'px';
            this.imageScaleRatio = img.width / this.sourceImageWidth;
            if (typeof this.opt.scaleChange === 'function') this.opt.scaleChange(this.imageScaleRatio);
            return this;
        },
    }
    // 暴露接口
    w['Clip'] = Clip;
});