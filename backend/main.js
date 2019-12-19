//Node中无需指定package

//导入其他的包
let mysql =  require('mysql')

//使用第三方包提供的函数和对象
//创建数据库连接池
//创建数据库连接 少一个connectionLimit
let pool = mysql.createPool({
    host : '127.0.0.1',
    port : '3306',
    user : 'root',
    password : '123456',
    database : 'oa',
    connectionLimit : '10'    //连接池大小限制
})

/**测试：使用连接池查询数据库数据 */
let sql = "select * from employee"
let insertsql = "insert into xz_user(uid,uname,upwd) values(NULL,'king','999')"
let deletesql = "delete from xz_user where uname = 'king'"
/**err:错误信息  result:结果  metadata: */
pool.query(sql,function(err,result){
    if(err)                             
        throw err
    console.log(result)
})

//导入第三方模块：express，创建基于NOde.js的web服务器
let express = require('express')

//调用功能
let server = express()

//运行服务器，监听特定端口
let port = 5050
server.listen(port, function(){
    console.log('服务器成功启动，正在监听端口：', port)
})

/******************************* */
/******************************* */
/************后台API************ */
/******************************* */
//使用express提供的 中间件:处理post请求的主体数据
//只能处理application/x-www-form-urlencoded类型的数据
server.use(express.urlencoded({
    extended:false
}))
//自定义中间件，跨域访问
server.use(function(request,response,next){
    response.set('Access-Control-Allow-Origin','*')
    next()  //放行，让后续的请求处理方法继续处理
})

/**
 * 1.用户登录
 */
server.get('/login',function(request,response){
    let uid 
})