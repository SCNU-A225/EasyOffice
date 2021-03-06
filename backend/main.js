let MODE = 'PRODUCTION'
if(process.argv.splice(2)[0]=='DEBUG'){
    MODE = 'DEBUG'
    console.log("正在使用本地测试环境！")
}

//导入其他的包
let mysql =  require('mysql')

//使用第三方包提供的函数和对象
//创建数据库连接池
//创建数据库连接 少一个connectionLimit
let pool
if(MODE=='PRODUCTION'){
    pool = mysql.createPool({
        host : '172.19.9.23',
        port : '3306',
        user : 'root',
        password : 'root',
        database : 'easyoffice',
        connectionLimit : '50'    //连接池大小限制
    })
} else {
    pool = mysql.createPool({
        host : 'localhost',
        port : '3306',
        user : 'root',
        password : '123456',
        database : 'easyoffice',
        connectionLimit : '10'    //连接池大小限制
    })
}


//导入第三方模块：express，创建基于NOde.js的web服务器
let express = require('express')
let cookieParser = require('cookie-parser')
let session = require('express-session')

//调用功能
let server = express()
//使用express-session记录用户登录状态，session的认证机制离不开cookie，需要同时使用cookieParser 中间件
server.use(cookieParser())
server.use(session({
    name: 'easyoffice',   //cookie的name，默认为connect.sid
    secret: 'easyoffice',
    resave: true, //每次请求都重新设置session cookie，假设你的cookie是10分钟过期，每次请求都会再设置10分钟
    saveUninitialized: true, //无论有没有session cookie，每次请求都设置个session cookie 默认给个标示(name)为 connect.sid
    cookie: {
        secure:false
    //    maxAge: 1000 * 60 * 60 //过期时间 毫秒ms,如果maxAge不设置，默认为null，这样的expire的时间就是浏览器的关闭时间，即每次关闭浏览器的时候，session都会失效。
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
//允许处理json
server.use(express.json())
//自定义中间件，跨域访问
server.use(function(request,response,next){
    if(MODE=='PRODUCTION')  response.header("Access-Control-Allow-Origin", "http://47.100.10.67");//前端域名
    else response.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500");//前端域名
    response.header("Access-Control-Allow-Credentials",'true');
    response.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
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
    let sql = 'SELECT * FROM employee WHERE sn=? and password=?'
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
            let sql = 'SELECT * FROM department WHERE sn=?'
            pool.query(sql,[result[0].department_sn],function(err,result){
                if(err) throw err
                if(result.length > 0){
                    //员工部门
                    let department = result[0].name
                    request.session.department = department
                    response.json({code:200, sn:sn, name:name, post:post, department:department})
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
    // console.log(request.session)
    let sn = request.session.sn
    if(sn == null){
        response.json({code:401, msg:"请登录"})
    }else{
        response.json({
            code:200,
            sn: request.session.sn,
            name: request.session.name,
            department: request.session.department,
            post: request.session.post
        })
    }
})

/**
 * 修改密码
 */
server.post('/password', function(request, response){
    let sn = request.session.sn
    let password = request.body.password
    let newPassword = request.body.newPassword
    let sql1 = 'SELECT * FROM employee WHERE sn=? and password=?'
    pool.query(sql1, [sn, password],function(err, result){
        if(err) throw err
        if(result.length > 0){
            let sql = 'update employee set password=? WHERE sn=?'
            pool.query(sql, [newPassword, sn], function(err, result){
                if(err) throw err
                response.json({code:200, msg:'修改成功'})
            })
        }else{
            response.json({code:401, msg:'原密码错误'})
        }
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
     let sql1 = 'SELECT * FROM department WHERE sn=? or name=?'
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
     let sql1 = 'delete FROM employee WHERE department_sn=?'
     pool.query(sql1, [sn], function(err, result){
         if(err) throw err
         let sql2 = 'delete FROM department WHERE sn=?'
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
     let sql = 'SELECT * FROM department'
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
    let sql = 'update department set name=?, address=? WHERE sn=?'
    pool.query(sql, [name, address, sn], function(err, result){
        if(err) throw err
        response.json({code:200, msg:'更新成功'})
    })
})

 /**
  * 1.5获取特定部门信息
  */
 server.post('/department/info',function(request,response){
    let sn = request.body.sn
    let sql = 'SELECT * FROM department WHERE sn = ?'
    pool.query(sql,[sn],function(err, result){
        if(err) throw err
        response.json({department:result[0]})
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
     let password = '000000'
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
    if(department_sn == ''){
        response.json({code:404, msg:'请输入部门编号'})
        return
    }
    if(post == ''){
        response.json({code:405, msg:'请输入职务'})
        return
    }
     let sql1 = 'SELECT * FROM employee WHERE sn=?'
     pool.query(sql1, [sn], function(err, result){
         if(err) throw err
         if(result.length > 0){
             response.json({code:501, msg:'员工编号已存在'})
         }else{
             let sql2 = 'SELECT * FROM department WHERE sn=?'
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
  */
 server.post('/employee/delete', function(request, response){
     let sn = request.body.sn
     let sql = 'delete FROM employee WHERE sn=?'
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
     let sql = 'SELECT employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName FROM employee,department WHERE employee.department_sn = department.sn and employee.department_sn=?'
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
 server.post('/employee/all',function(request, response){
    let post = request.session.post
    if(post == '总经理'){
        let sql = 'SELECT employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName FROM employee,department WHERE employee.department_sn = department.sn'
        pool.query(sql, function(err, result){
            if(err) throw err
            let resultData = {employees:null}
            resultData.employees = result
            response.json(resultData)
        })
    }else{
        let department = request.body.department
        let sql = 'SELECT employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName FROM employee,department WHERE employee.department_sn = department.sn and department.name=?'
        pool.query(sql, [department],function(err, result){
            if(err) throw err
            let resultData = {employees:null}
            resultData.employees = result
            response.json(resultData)
        })
    }
 })

 /**
  * 2.5按员工编号查找员工信息
  */
 server.post('/employee/info',function(request,response){
     let sn = request.body.sn
     let sql = 'SELECT employee.sn, employee.name, employee.department_sn, employee.post, department.name as departmentName FROM employee,department WHERE employee.department_sn = department.sn and employee.sn=?'
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
     let name = request.body.name
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
     let sql = 'update employee set name=?, department_sn=?, post=? WHERE sn=?'
     pool.query(sql, [name,department_sn,post,sn], function(err,result){
         if(err) throw err
         response.json({code:200, msg:'修改成功'})
     })
 })

 /*
 ******************************
 *员工管理
 ****************************** 
 */

 /**
  * 3.1创建并保存报销单
  */
  server.post('/expense/create',function(request, response){
    let formData = JSON.parse(request.body.formData)
    let cause = formData.cause
    let create_sn = request.session.sn
    let next_deal_sn = create_sn
    let total_amount = formData.total_amount  
    let status = '已创建'
    let items = formData.items
    if(items == null || items == ''){
        response.json({code:401, msg:'报销单明细不能为空'})
        return
    }
    if(cause == ''){
        response.json({code:402, msg:'事由不能为空'})
        return
    }
    let sql1 = 'insert into claim_voucher values(null,?,?,NOW(),?,?,?)'
    let itemsLength = items.length
    let itemsFinish = 0
    let sql2Finish = false
    //创建报销单
    pool.query(sql1,[cause,create_sn,next_deal_sn,total_amount,status],function(err, result){
        let claim_voucher_id = result.insertId
        //创建报销单的处理记录条目
        let deal_way = '创建'
        let deal_result = '已保存'
        let comment = '创建报销单'
        let sql2 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
        pool.query(sql2,[claim_voucher_id,create_sn,deal_way,deal_result,comment],function(err, result){
            if(err) throw err
            sql2Finish = true
            if(itemsFinish == itemsLength){
                response.json({code:200, msg:'保存成功'})
            }
        })
        let sql3 = 'insert into claim_voucher_item values(null,?,?,?,?)'
        for(let i = 0; i < itemsLength; i++){
            pool.query(sql3,[claim_voucher_id,items[i][0],items[i][1],items[i][2]],function(err,result){
                if(err) throw err
                itemsFinish = itemsFinish + 1
                if(itemsFinish == itemsLength && sql2Finish){
                    response.json({code:200, msg:'保存成功'})
                }
            })
        }
    })
  })

  /**
   * TODO
   * 3.2修改报销单
   */
  server.post('/expense/update', function(request,response){
      let formData = JSON.parse(request.body.formData)
      let sn = request.session.sn
      let claim_voucher_id = formData.id
      let cause = formData.cause
      let total_amount = formData.total_amount
      let status = '已修改'
      let items = formData.items
      let itemsLength = items.length
      let itemsFinish = 0
      let claimFinish = false
      let detailFinish = false
      let sql1 = 'update claim_voucher set cause=?,total_amount=?,status=? WHERE id=?'
      //修改报销单
      pool.query(sql1,[cause,total_amount,status,claim_voucher_id],function(err, result){
          if(err) throw err
          claimFinish = true
          if(itemsFinish == itemsLength && detailFinish){
              response.json({code:200, msg:'修改成功'})
          }
      })
      //修改报销单明细:先删除再插入
      let sql2 = 'delete FROM claim_voucher_item WHERE claim_voucher_id=?'
      pool.query(sql2,[claim_voucher_id],function(err, result){
          if(err) throw err
          let sql3 = 'insert into claim_voucher_item values(null,?,?,?,?)'
          for(let i = 0; i < itemsLength; i++){
              pool.query(sql3,[claim_voucher_id,items[i][0],items[i][1],items[i][2]],function(err, result){
                  if(err) throw err
                  itemsFinish =  itemsFinish + 1
                  if(claimFinish && detailFinish && itemsFinish == itemsLength){
                      response.json({code:200, msg:'修改成功'})
                  }
            })
          }
      })
      //处理记录
      let deal_way = '修改'
      let deal_result = '已修改'
      let comment = '修改报销单'
      let sql4 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
      pool.query(sql4, [claim_voucher_id,sn,deal_way,deal_result,comment],function(err, result){
          if(err) throw err
          detailFinish = true
          if(claimFinish && itemsFinish == itemsLength){
            response.json({code:200, msg:'修改成功'})
          }
      })
  })

  /**
   * TODO
   * 3.3提交报销单
   */
  server.post('/expense/submit',function(request, response){
      let sn = request.session.sn
    let department_sn = request.session.department_sn
    let claim_voucher_id = request.body.id
    let total_amount = request.body.amount
    let status = '已提交'
    let submitFinish = false
    let recordFinish = false
    //提交给总经理审核
    if(total_amount >= 5000){
        let post = '总经理'
        let sql1 = 'SELECT sn FROM employee WHERE post=?'
        pool.query(sql1, [post], function(err, result){
            if(err) throw err
            //更新报销单状态与待处理人
            let sql2 = 'update claim_voucher set next_deal_sn=?, status=? where id = ?'
            pool.query(sql2,[result[0].sn, status,claim_voucher_id], function(err, result){
                submitFinish = true
                if(recordFinish){
                    response.json({code:200, msg:'提交成功'})
                }
            })
            //处理记录
            let deal_way = '提交'
            let deal_result = '已提交'
            let comment = '提交报销单'
            let sql4 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
            pool.query(sql4, [claim_voucher_id,sn,deal_way,deal_result,comment],function(err, result){
                if(err) throw err
                recordFinish = true
                if(submitFinish){
                    response.json({code:200, msg:'提交成功'})
                }
            })
        })
    }else{
        let post = '部门经理'
        let sql1 = 'SELECT sn FROM employee WHERE department_sn=? and post=?'
        pool.query(sql1, [department_sn,post], function(err, result){
            if(err) throw err
            //更新报销单状态与待处理人
            let sql2 = 'update claim_voucher set next_deal_sn=?, status=?  where id = ?'
            pool.query(sql2,[result[0].sn, status,claim_voucher_id], function(err, result){
                submitFinish = true
                if(recordFinish){
                    response.json({code:200, msg:'提交成功'})
                }
            })
            //处理记录
            let deal_way = '提交'
            let deal_result = '已提交'
            let comment = '提交报销单'
            let sql4 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
            pool.query(sql4, [claim_voucher_id,sn,deal_way,deal_result,comment],function(err, result){
                if(err) throw err
                recordFinish = true
                if(submitFinish){
                    response.json({code:200, msg:'提交成功'})
                }
            })
        })
    }
  })

  /**
   * 3.4通过报销单
   */
  server.post('/expense/agree', function(request, response){
      let deal_sn = request.session.sn
    let claim_voucher_id = request.body.id
    let comment = request.body.comment
    let status = '已通过'
    let post = '财务'
    let sql1 = 'SELECT sn FROM employee WHERE post=?'
    let claimFinish = false
    let recordFinish = false
    pool.query(sql1, [post], function(err, result){
        if(err) throw err
        //修改报销单状态
        let sql2 = 'update claim_voucher set next_deal_sn=?,status=? WHERE id=?'
        pool.query(sql2, [result[0].sn,status,claim_voucher_id], function(err, result){
            if(err) throw err
            claimFinish = true
            if(recordFinish){
                response.json({code:200, msg:'审核成功'})
            }
        })
        //处理记录
        let deal_way = '审核'
        let deal_result = '通过'
        let sql3 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
        pool.query(sql3, [claim_voucher_id,deal_sn,deal_way,deal_result,comment], function(err, result){
            if(err) throw err
            recordFinish = true
            if(claimFinish){
                response.json({code:200, msg:'审核成功'})
            }
        })
    })
  })

  /**
   * 3.5打回报销单
   */
  server.post('/expense/return', function(request, response){
      let deal_sn = request.session.sn
    let claim_voucher_id = request.body.id
    let comment = request.body.comment
    let status = '已打回'
    let sql1 = 'SELECT create_sn FROM claim_voucher WHERE id=?'
    let claimFinish = false
    let recordFinish = false
    pool.query(sql1, [claim_voucher_id], function(err, result){
        if(err) throw err
        //修改报销单状态
        let sql2 = 'update claim_voucher set next_deal_sn=?,status=? WHERE id=?'
        pool.query(sql2, [result[0].create_sn,status,claim_voucher_id], function(err, result){
            if(err) throw err
            claimFinish = true
            if(recordFinish){
                response.json({code:200, msg:'审核成功'})
            }
        })
        //处理记录
        let deal_way = '审核'
        let deal_result = '打回'
        let sql3 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
        pool.query(sql3, [claim_voucher_id,deal_sn,deal_way,deal_result,comment], function(err, result){
            if(err) throw err
            recordFinish = true
            if(claimFinish){
                response.json({code:200, msg:'审核成功'})
            }
        })
    })
  })

  /**
   * 3.6拒绝报销单
   */
  server.post('/expense/refuse', function(request, response){
      let deal_sn = request.session.sn
    let claim_voucher_id = request.body.id
    let comment = request.body.comment
    let status = '已拒绝'
    let next_deal_sn = '00000' //所有已完成报销单（已拒绝和已打款）待处理人为00000
    let claimFinish = false
    let recordFinish = false
    //修改报销单状态
    let sql2 = 'update claim_voucher set next_deal_sn=?,status=? WHERE id=?'
    pool.query(sql2, [next_deal_sn,status,claim_voucher_id], function(err, result){
        if(err) throw err
        claimFinish = true
        if(recordFinish){
            response.json({code:200, msg:'审核成功'})
        }
    })
    //处理记录
    let deal_way = '审核'
    let deal_result = '已拒绝'
    let sql3 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
    pool.query(sql3, [claim_voucher_id,deal_sn,deal_way,deal_result,comment], function(err, result){
        if(err) throw err
        recordFinish = true
        if(claimFinish){
            response.json({code:200, msg:'审核成功'})
        }
    })
  })

  /**
   * 3.7打款报销单
   */
  server.post('/expense/pay', function(request, response){
      let deal_sn = request.session.sn
    let claim_voucher_id = request.body.id
    let comment = request.body.comment
    let status = '已打款'
    let next_deal_sn = '00000' //所有已完成报销单（已拒绝和已打款）待处理人为00000
    let claimFinish = false
    let recordFinish = false
    //修改报销单状态
    let sql2 = 'update claim_voucher set next_deal_sn=?,status=? WHERE id=?'
    pool.query(sql2, [next_deal_sn,status,claim_voucher_id], function(err, result){
        if(err) throw err
        claimFinish = true
        if(recordFinish){
            response.json({code:200, msg:'审核成功'})
        }
    })
    //处理记录
    let deal_way = '审核'
    let deal_result = '已打款'
    let sql3 = 'insert into deal_record values(null,?,?,NOW(),?,?,?)'
    pool.query(sql3, [claim_voucher_id,deal_sn,deal_way,deal_result,comment], function(err, result){
        if(err) throw err
        recordFinish = true
        if(claimFinish){
            response.json({code:200, msg:'审核成功'})
        }
    })
  })

  /**
   * 3.8查看待处理报销单
   */
  server.get('/expense/todo', function(request, response){
    let sn = request.session.sn
    let resultData = {arr:null}
    let sql = 'SELECT c.id, c.cause, c.create_time, c.total_amount, c.status, e.name FROM claim_voucher c,\
                employee e WHERE c.next_deal_sn=? AND c.create_sn=e.sn;'
    pool.query(sql,[sn],function(err, result){
        if(err) throw err
        resultData.arr = result
        response.json(resultData)
    })
  })

/**
 * 3.9查看个人报销单
 */
  server.get('/expense/history', function(request, response){
    let sn = request.session.sn
    let resultData = {arr:null}
    let sql = 'SELECT id, cause, create_time, total_amount, status FROM claim_voucher WHERE create_sn=?'
    pool.query(sql,[sn],function(err, result){
        if(err) throw err
        resultData.arr = result
        response.json(resultData)
    })
  })

  /**
   * 3.10查看报销单详细
   */
  server.post('/expense/detail', function(request, response){
      let claim_voucher_id = request.body.id
      let resultData = {info:null, detail:null, record:null}
      let claimFinish = false
      let detailFinish = false
      let recordFinish = false
      //获取基本信息
      let sql1 = 'SELECT * FROM claim_voucher WHERE id = ?'
      pool.query(sql1, [claim_voucher_id], function(err, result){
          if(err) throw err
          resultData.info = result[0]
          claimFinish = true
          if(detailFinish && recordFinish){
              response.json(resultData)
          }
      })

      //获取费用明细
      let sql2 = 'SELECT item, amount, comment FROM claim_voucher_item WHERE claim_voucher_id=?'
      pool.query(sql2, [claim_voucher_id], function(err, result){
          if(err) throw err
          resultData.detail = result
          detailFinish = true
          if(claimFinish && recordFinish){
              response.json(resultData)
          }
      })

      //获取处理记录
      let sql3 = 'SELECT deal_sn, deal_time, deal_way, deal_result, comment FROM deal_record WHERE claim_voucher_id=?'
      pool.query(sql3, [claim_voucher_id], function(err, result){
          if(err) throw err
          resultData.record = result
          recordFinish = true
          if(claimFinish && detailFinish){
              response.json(resultData)
          }
      })
  })
