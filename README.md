# vue-webpack-study
整理vue+webpack的学习资料与开发过程中遇到的问题

## Webpack
- 配置多入口文件打包
- 打包文件的缓存管理
- 将css/sass文件单独打包

## Vue
- Vue 计算属性的一些坑
- Vue-resource 与 Promise 的兼容性问题解决
- Vue-resource 1.x 与 0.x 版本的差别
- Vue-router 的一些坑

## 其他
- flex布局在低版本安卓下的兼容性


## Webpack - 配置多入口文件打包
使用vue-cli脚手架搭建的vue+webpack项目只带有一个入口文件, 但通常项目会涉及多个页面,每个页面有各自独立的入口文件, webpack支持这一点, 将 module.exports.entry 从字符串更改为对象即可:
```javascript
module.exports = {
    entry: {
        'main': './src/main.js',
        'login': './src/login.js'
    }
}
```
这样, 每次执行 npm run build 后就会为entry的每一项生成一个打包后的文件。

## Webpack - 打包文件的缓存管理
使用webpack打包后的文件通常在html页面内通过&lt;script&gt;标签引入, 那么自然会带来缓存更新问题。当webpack重新打包后, 我们希望页面去加载最新的js, 而文件未变化时能够利用缓存。

webpack可以将 hash 占位符配置到output的filename中, 以实现入口文件更新后可以打包一份新的带有校验信息的文件, 但是这段hash信息只能存在于文件名中, 形成非覆盖式发布, 对html引用来说也不方便。

我们通常希望的是, 在url后面增加查询参数来控制缓存, 而不是通过改变url path的部分。可惜的是webpack并没有为我们完美的提供这个功能,需要配合服务端打造一个较好的方案:

引入assets-webpack-plugin, 并按下面的方式配置插件:
```javascript
plugins: [
    new AssetsPlugin({
        filename: 'template/assets.json',
        metadata: {v: new Date().getTime()}
    })
]
```
这样会在每次build时, 生成assets.json文件, 文件的内容为:
```json
{"main":{"js":"/dist/main.js"},"login":{"js":"/dist/login.js"},"metadata":{"v":1477042221273}}
```
然后我们要借助服务端, 在渲染html页面之前, 读取这个文件, 并将这里的uri以及metadata拼接成如下的形式渲染到页面中:
```html
<script src="/dist/main.js?v=1477042221273"></script>
```
这个方式的不足之处是, 由于这个v的值是时间戳, 而不是文件的hash值, 这样会导致在只打包部分文件时, 未更新的文件也将被浏览器强制下载, 缓存利用率会降低。

## Webpack - 将css/sass文件单独打包
