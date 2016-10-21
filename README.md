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
使用webpack打包后的文件通常在html页面内通过<script>标签引入, 那么自然会带来缓存更新问题。当webpack重新打包后, 我们希望页面去加载最新的js, 而文件未变化时能够利用缓存。