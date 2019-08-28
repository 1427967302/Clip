# PhotoClip
 * 轻量图片裁剪插件
 * 作者： yangxiao
 
使用方法:
var clip = new Clip(element, options);

参数:
element         =>   裁剪框容器
options         =>   配置

options:
file            => type = File 
clipSize        => type = array; 裁剪框尺寸，默认 [200,200]
outputSize      => type = number; 输出图片的尺寸，默认 1
wheelScale      => type = boolean; 是否启用滚轮缩放，默认 false
scaleValue      => type = number; 滚动时缩放的值，像素单位，默认 10
fillBackground  => type = string; 背景填充，默认 transparent
rangeStyle      => type = object; 裁剪框样式，键值对{'border': '1px solid'}
CrossOrigin     => type = boolean; 网络图片跨域设置，需要后端设置资源可跨域，默认 false
loaddone        => type = function; 图片载入完成回调
scaleChange     => type = function; 图片缩放改变回调，agument[0] = 缩放比
error           => type = function; 错误回调，文件加载错误、裁剪错误触发

对象:
el              => 当前裁剪框dom
sourceImage     => 当前裁剪图片dom
sourceImageURL  => 当前裁剪图片的base64码
sourceImageWidth => 原图宽
sourceImageHeight => 原图高
imageScaleRatio => 当前缩放比
imageScaleMin   => 最小缩放比
imageScaleMax   => 最大缩放比
(缩放比 = 缩放后的width / 原图width)

方法:
load()          => 如果options.file不存在，可通过调用这个方法触发加载，agument[0] = file | url
set()           => 重新配置options, agument[0] = key, agument[1] = value
toDataURL()     => 方法返回裁剪后的base64码
scale()         => 设置缩放，单位像素，agument[0] = 缩放值
destroy()       => 销毁当前实例
