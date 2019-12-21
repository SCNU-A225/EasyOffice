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


/*
 ******************************
 *个人信息管理
 ****************************** 
 */
/**
 * 用户登录
 */
server.post('/user/login',function(request,response){
    let sn = request.body.sn
    let password = request.body.password
    if(sn == ''){
        response.json({code:401, msg:'请输入员工编号'})
        return
    }
    if(password == ''){
        response.json({code:402, msg:'请输入密码'})
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
            request.session.name = name
            //员工职务
            let post = result[0].post
            request.session.post = post
            //员工部门编号
            request.session.department_sn = result[0].department_sn
            let sql = 'select * from department where sn=?'
            pool.query(sql,[result[0].department_sn],function(err,result){
                if(err) throw err
                if(result.length > 0){
                    //员工部门
                    let department = result[0].name
                    request.session.department = department
                    response.json({code:200, sn:sn, name:name, post:post, department:department})
                    //response.redirect(302,'http://127.0.0.1/self.html')
                }
            })
        }else{
            response.json({code:403, msg:'员工编号或密码错误'})
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
    response.json({code:200, msg:'注销成功'})
    //TODO
    //response.redirect(301,'login') 第一个参数为http状态码，第二个参数为跳转到html的url
    // 301 redirect: 301 代表永久性转移(Permanently Moved)，清除就地址的资源，不可返回
    // 302 redirect: 302 代表暂时性转移(Temporarily Moved )，保留就地址内容，可以返回到跳转前的页面及状态
})

/**
 * 查看个人信息
 */
server.get('/info',function(request, response){
    console.log(request.session)
    response.json({
        sn: request.session.sn,
        name: request.session.name,
        department: request.session.department,
        post: request.session.post
    })
})

/**
 * 修改密码
 */
server.post('/password', function(request, response){
    let sn = request.session.sn
    let password = request.body.password
    let sql = 'update employee set password=? where sn=?'
    pool.query(sql, [password, sn], function(err, result){
        if(err) throw err
        response.json({code:200, msg:'修改成功'})
    })
})
/*
 ******************************
 *部门管理
 ****************************** 
 */

 /**
  * 1.1添加部门
  */
 server.post('/department/add',function(request, response){
     let sn = request.body.sn
     let name = request.body.name
     let address = request.body.address
     if(sn == ''){
         response.json({code:401, msg:'请输入部门编号'})
         return
     }
     if(name == ''){
        response.json({code:402, msg:'请输入部门名称'})
        return
     }
     if(address == ''){
        response.json({code:403, msg:'请输入部门地址'})
        return
     }
     let sql1 = 'select * from department where sn=? or name=?'
     pool.query(sql1, [sn, name], function(err, result){
         if(err) throw err
         if(result.length > 0){
             response.json({code:501, msg:'部门编号或部门名称已存在'})
             return
         }else{
             let sql2 = 'insert into department values(?,?,?)'
             pool.query(sql2, [sn, name, address], function(err, result){
                 if(err) throw err
                 response.json({code:200, msg:'添加成功'})
             })
         }
     })
 })

 /**
  * 1.2删除部门
  * 删除部门，同时部门的员工也要删除
  * 先删除同部门的员工才能删除部门记录，否则外键约束检查发现部门记录与响应部门员工存在外键依赖无法修改或删除外键
  */
 server.post('/department/delete',function(request,response){
     let sn = request.body.sn
     let sql1 = 'delete from employee where department_sn=?'
     pool.query(sql1, [sn], function(err, result){
         if(err) throw err
         let sql2 = 'delete from department where sn=?'
         pool.query(sql2, [sn], function(err, result){
             if(err) throw err
             response.json({code:200, msg:'删除成功'})
         })
     })
 })

 /**
  * 1.3查找所有部门
  */
 server.get('/department/all',function(request,response){
     let sql = 'select * from department'
     let resData = {departmentList:null}
     pool.query(sql,function(err, result){
         if(err) throw err
         resData.departmentList = result
         response.json(resData)
     })
 })

 /**
  * 1.4修改部门
  */
server.post('/department/update',function(request,response){
    let sn = request.body.sn
    let name = request.body.name
    let address = request.body.address
    if(name == ''){
       response.json({code:401, msg:'请输入部门名称'})
       return
    }
    if(address == ''){
       response.json({code:402, msg:'请输入部门地址'})
       return
    }
    let sql = 'update department set name=?, address=? where sn=?'
    pool.query(sql, [name, address, sn], function(err, result){
        if(err) throw err
        response.json({cond:200, msg:'更新成功'})
    })
})

/*
 ******************************
 *员工管理
 ****************************** 
 */

 /**
  * 2.1 添加员工
  */
 server.post('/employee/add',function(request,response){
     let sn = request.body.sn
     let name = request.body.name
     let password = request.body.password
     let department_sn = request.body.department_sn
     let post = request.body.post
     if(sn == ''){
         response.json({code:401, msg:'请输入员工编号'})
         return
     }
     if(name == ''){
        response.json({code:402, msg:'请输入员工姓名'})
        return
    }
    if(password == ''){
        response.json({code:403, msg:'请输入密码'})
        return
    }
    if(department_sn == ''){
        response.json({code:404, msg:'请输入部门编号'})
        return
    }
    if(post == ''){
        response.json({code:405, msg:'请输入职务'})
        return
    }
     let sql1 = 'select * from employee where sn=?'
     pool.query(sql1, [sn], function(err, result){
         if(err) throw err
         if(result.length > 0){
             response.json({code:501, msg:'员工编号已存在'})
         }else{
             let sql2 = 'select * from department where sn=?'
             pool.query(sql2, [department_sn], function(err, result){
                 if(result.length > 0){
                    let sql3 = 'insert into employee values(?,?,?,?,?)'
                    pool.query(sql3, [sn, password, name, department_sn, post],function(err, result){
                        if(err) throw err
                        response.json({code:200, msg:'添加成功'})
                    })
                 }else{
                     response.json({code:502, msg:'部门编号不存在'})
                 }
             })
         }
     })
 })

 /**
  * 2.2删除员工
  * 删除员工同时删除该员工的报销单
  * 根据外键约束检查机制删除顺序如下
  * 报销单明细与报销单处理记录->报销单->员工
  */
 server.post('/employee/delete', function(request, response){
     let sn = request.body.sn
     let sql = 'delete from employee where sn=?'
     pool.query(sql, [sn], function(err, result){
         if(err) throw err
         response.json({code:200, msg:'删除成功'})
     })
 })

 /**
  * 2.3按部门查找员工
  */
 server.post('/employee/departlist',function(request, response){
     let department_sn = request.body.department_sn
     let sql = 'select employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName from employee,department where employee.department_sn = department.sn and employee.department_sn=?'
     pool.query(sql, [department_sn,department_sn],function(err, result){
         if(err) throw err
         let resultData = {employees:null}
         resultData.employees = result
         response.json(resultData)
     })
 })

 /**
  * 2.4查找所有员工
  */
 server.get('/employee/all',function(request, response){
    let sql = 'select employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName from employee,department where employee.department_sn = department.sn'
    pool.query(sql, function(err, result){
        if(err) throw err
        let resultData = {employees:null}
        resultData.employees = result
        response.json(resultData)
    })
 })

 /**
  * 2.5按员工编号查找员工信息
  */
 server.post('/employee/info',function(request,response){
     let sn = request.body.sn
     let sql = 'select employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName from employee,department where employee.department_sn = department.sn and employee.sn=?'
     pool.query(sql, [sn], function(err, result){
         if(err) throw err
         response.json({employee:result[0]})
     })
 })

 /**
  * 2.6修改员工信息
  */
 server.post('/employee/update',function(request,response){
     let sn = request.body.sn
     let department_sn = request.body.department_sn
     let post = request.body.post
     if(department_sn == ''){
        response.json({code:401, msg:'请输入部门编号'})
        return
    }
    if(post == ''){
       response.json({code:402, msg:'请输入职务'})
       return
   }
     let sql = 'update employee set department_sn=?, post=? where sn=?'
     pool.query(sql, [department_sn,post,sn], function(err,result){
         if(err) throw err
         response.json({code:200, msg:'修改成功'})
     })
 })