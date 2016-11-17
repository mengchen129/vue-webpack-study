# vue-webpack-study
整理在学习与工作中遇到的vue + webpack的相关经验和问题

## 目录
### Webpack
- 配置多入口文件打包
- 打包文件的缓存管理
- 将css/sass文件单独打包
- 对css样式兼容的处理

### Vue
- Vue-resource 与 Promise 的兼容性问题解决
- Vue-resource 1.x 与 0.x 版本的差别
- Vue-resource 拦截器的最佳实践
- Vue-router 的一些坑
- Vue ready钩子的注意点

### 其他



### Webpack - 配置多入口文件打包
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

### Webpack - 打包文件的缓存管理
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
另一个问题就是,如果用服务端渲染, 在html中会使用 <?php echo $script;?> 等语法而在纯静态调试时带来不方便, 所以我更推荐在html中编写完整路径, 只让时间戳由服务端生成, 如下:
```html
<script src="/dist/main.js?v=<?php echo $timestamp;?>"></script>
```

### Webpack - 将css/sass文件单独打包
默认情况下webpack会将css内容打包到js文件中, 运行时会在页面动态创建style标签, 这样的问题在于css样式无法充分利用缓存, 并且也增加了js文件的体积。我们希望将css与js分开打包。那么就需要一个webpack插件——extract-text-webpack-plugin。
在webpack.config.js中增加一个loaders配置:
```javascript
{
    test: /\.scss$/,
    loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader")
}
```
同时在plugins里配置一下输出的文件名:
```javascript
plugins: [
    //... 
    new ExtractTextPlugin("[name].css")
]
```
这个配置将对所有出现
```javascript
require('/path-to/xxx.scss');
```
的地方将单独打包出css文件, 与js文件存放在相同目录, 这样就可以在html中使用link标签加载了, 同时在dev模式下, css文件的变动可以出发热替换, 非常方便。

如果项目中没有用到sass而是普通css, 则就将上述配置改一下, 改成后缀为.css, 并去掉 sass-loader 即可。当然建议使用sass/less等css预处理器, 可以让css的开发更加便捷。

### Webpack - 对css样式兼容的处理
flex弹性盒模型布局给前端开发带来了极大的方便, 但新技术总会有兼容性问题, 在Android 4.3下再次出现对 flex 布局兼容的问题。查询caniuse.com 得知, Flex布局在Android 4.3及以下只支持旧式语法, 对于直接接触新式语法的开发者当然不情愿再去编写旧语法来兼容低版本浏览器, 本来想打算将这一项工作交给sass做, 因为编写的vue组件最终编译的css代码中会对sass代码中出现的display: flex等flex布局属性增加旧版盒模型的兼容。

本以为可以放心的在非vue组件内使用sass编写flex等样式了, 结果sass-loader却不对这些高级样式做兼容处理, 最终生成的css无法兼容低版安卓, 最初遇见了这个坑, 只能手工增加兼容代码。

后来了解到postcss后得知, 增加兼容代码是由postcss的autoprefixer插件做的, 基本的sass/less是不具备这个功能的。于是在项目中引入postcss-loader和autoprefixer-loader即可完美解决这个问题。
postcss项目的主页: https://github.com/postcss/postcss-loader

附截图如下, 页面又两个header, 一个由普通sass-loader渲染, 一个由vue-loader渲染, 他们最终生成的css代码是不同的, 而对sass-loader后再配置一个postcss-loader即可生成与vue-loader相同的css代码:
![sass-loader](http://182.92.167.237/images/flex-sass-loader.png?_=1)
![vue-loader](http://182.92.167.237/images/flex-vue-loader.png?_=1)

### Vue-resource 与 Promise 的兼容性问题解决
Vue-Resource内部自己做了一个Promise实现, 经查看源码得知, 如果检测到有全局的Promise存在则就使用全局的, 而不再使用自己实现的, 看上去没有问题。但最近遇到的一个棘手的问题, 在vue+webpack架构下, 使用安卓4.3的手机使用vue-resource发起http请求报错。无奈之下求助了知乎: https://www.zhihu.com/question/51718659

最后的结论为: vue-resource内部的Promise实现经webpack打包后会有bug, 在不支持原生Promise的浏览器上将无法使用。经caniuse.com上查到, Android 4.4.2以下均不支持。

最后的解决方案: 用另一个ES6-Promise的polyfill库(https://github.com/stefanpenner/es6-promise), 让旧的浏览器拥有Promise, 避开vue-resource自己的实现。感谢那位给出回答的知乎朋友。

### Vue-resource 1.x 与 0.x 版本的差别
```javascript
this.$http.get(someUrl).then((resp) => {
    var result = resp.json();
});
```
上述代码, 在vue-resource 0.x版本下, result直接获取到了响应的json对象, 而在1.x版本上, result则又是一个Promise对象, 需要再次调用 then 才能获取结果。

### Vue-resource 拦截器的最佳实践
在开发中经常会编写大量的ajax请求, 而对于一个项目来说, 响应的json格式和公共处理逻辑都是一致的, 比如先判断code==0, 公共的error回调处理, 加载开始和完成的进度提示等等。这些通用操作可以放在拦截器里做统一处理。
下面是我在项目中编写的一个通用的处理逻辑:
```javascript
/**
 * Vue-resource 全局拦截器
 */
Vue.http.interceptors.push(function(request, next) {
    // 请求开始前设置加载状态 loading/submitting
    var method = request.method.toUpperCase(),
        isGet = (method === 'GET'),
        isPost = (method === 'POST');
    
    // 通过this.$http方式调用,在这里this与外部this保持一致指向当前vue实例; 如果通过Vue.http方式调用, 则this则指向执行环境上下文可能为空, 这里需要判断一下
    if (this) {
        isGet && (this.loading = true);            // 使用于Get请求
        isPost && (this.submitting = true);         // 适用于Post请求
    }
    next(function(resp) {
        if (this) {                                 // 请求完成后置回加载状态
            isGet && (this.loading = false);       
            isPost && (this.submitting = false);
        }

        if (!resp.ok) {             // 将error回调提前到这里执行
            if (this && this.alert) {
                this.alert('服务器异常');    // 这里this.alert将弹出一个自己封装的提示框组件
            } else {
                alert('服务器异常');
            }
            return;
        }

        var result = resp.json();
        resp.jsonData = result;     // 将json数据缓存, 因为每次调用 resp.json() 都会进行JSON.parse一次
        if (result.code != 0) {
            this.alert(result.msg);
            resp.abort = true;      // 设置abort, 当进入响应主逻辑时不再处理
            return;
        }

        return resp;
    });
});
```
然后在具体的ajax请求的响应里编写这两行代码即可:
```javascript
this.$http.get(SOME_URL).then((resp) => {
    if (resp.abort) return;
    var result = resp.jsonData;

    // 对result做处理
});
```

### Vue-router 的一些坑
我们可以用 this.$route.path 获得当前路由路径, 不过他有一个坑, 会把当前URL中的查询参数一并携带着。如果程序中出现了对这个值进行判断的逻辑一定要注意, 如果只需要hash部分则需要截取一下。

比如有个项目使用了vue-router, 页面访问地址为 http://www.example.com/?param=123 , 访问后自动进入index路由, 此时url变为 http://www.example.com/?param=123#!/index , 这个时候使用 this.$route.path 获取到的值不是 /index, 而是 /index?param=123。这个问题是在0.9版本上发现的, 最新的2.x版本尚未验证。

### Vue ready钩子的注意点
Vue实例的ready钩子函数的执行是在new Vue()的过程中进行的, 而不是等到new完之后的某一时刻才执行, 因此 ready函数比 new Vue() 之后的代码执行的早。比如下面的例子:
```javascript
new Vue({
        el: 'body',
        ready: function() {
            console.log('vue ready');
        }
});

console.log('after vue');
```
这段代码的执行结果是, 先打印 'vue ready', 再打印'after vue'。如果想要改变打印的顺序, 那么将 console.log('vue-ready') 放在 setTimeout 中即可。

在实际项目中遇到了这个问题, 当时是在new Vue之后将vm对象挂在全局window上, 但是在ready中调用了一个外部函数, 外部函数内部访问了这个全局vm对象为undefined. 最终的解决办法就是给外部函数的执行增加 setTimeout(fn, 0)的方式。