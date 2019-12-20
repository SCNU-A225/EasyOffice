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
    password : '',
    database : 'easyoffice',
    connectionLimit : '10'    //连接池大小限制
})

//导入第三方模块：express，创建基于NOde.js的web服务器
let express = require('express')
let cookieParser = require('cookie-parser')
let session = require('express-session')

//调用功能
let server = express()
//使用express-session记录用户登录状态，session的认证机制离不开cookie，需要同时使用cookieParser 中间件
server.use(cookieParser())
server.use(session({
    name: 'xuezi_web',   //cookie的name，默认为connect.sid
    secret: 'login secret',
    resave: true, //每次请求都重新设置session cookie，假设你的cookie是10分钟过期，每次请求都会再设置10分钟
    saveUninitialized: true, //无论有没有session cookie，每次请求都设置个session cookie 默认给个标示(name)为 connect.sid
    cookie: {
    //    maxAge: 1000 * 60 //过期时间 毫秒ms,如果maxAge不设置，默认为null，这样的expire的时间就是浏览器的关闭时间，即每次关闭浏览器的时候，session都会失效。
    } 
}))
/*
secret:通过secret字符串，计算hash值之后存贮在cookie中 
      以防止singnedCookie被篡改
cookie：设置存放session id的cookie相关选项，默认为：
  (default:{
    path:'/',
    httpOnly:true,
    secure:false,  //https访问网站时secure必须为true
    maxAge:null
  })
*/

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

//数据库insert,delete操作返回result示例
/** insert result:
 *   fieldCount: 0,
    affectedRows: 1,
    insertId: 3,
    serverStatus: 2,
    warningCount: 0,
    message: '',
    protocol41: true,
    changedRows: 0
*/

/**
 * delete result
 * OkPacket {
    fieldCount: 0,
    affectedRows: 0,
    insertId: 0,
    serverStatus: 2,
    warningCount: 0,
    message: '',
    protocol41: true,
    changedRows: 0
    }
*/

/**
 * 用户登录
 */
server.post('/login',function(request,response){
    let sn = request.body.sn
    let password = request.body.password
    if(sn == ''){
        response.json({msg:'employee number required'})
        return
    }
    if(password == ''){
        response.json({msg:'password required'})
        return
    }
    let sql = 'select * from employee where sn=? and password=?'
    pool.query(sql,[sn,password],function(err,result){
        if(err) throw err
        if(result.length > 0){
            //session记录用户信息
            //员工编号
            request.session.sn = sn
            //员工姓名
            let name = result[0].name
            //员工职务
            let post = result[0].post
            //员工部门编号
            request.session.department_sn = result[0].department_sn
            let sql = 'select * from department where sn=?'
            pool.query(sql,[result[0].department_sn],function(err,result){
                if(err) throw err
                if(result.length > 0){
                    //员工部门
                    let department = result[0].name
                    response.json({sn:sn, name:name, post:post, department:department})
                }
            })
        }else{
            response.json({msg:'sn or password error'})
        }
    })
})

/**
 * 用户注销
 * 删除session记录并重定向（跳转）到登录页面
 */
server.get('/logout',function(request, response){
    delete request.session.sn
    delete request.session.department_sn
    //response.redirect(301,'login') 第一个参数为http状态码，第二个参数为跳转到html的url
    // 301 redirect: 301 代表永久性转移(Permanently Moved)，清除就地址的资源，不可返回
    // 302 redirect: 302 代表暂时性转移(Temporarily Moved )，保留就地址内容，可以返回到跳转前的页面及状态
})