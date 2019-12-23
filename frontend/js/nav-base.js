$(window).ready(() => {
    if(!sessionStorage.getItem('sn')){
        alert("请先登录")
        location.href = 'login.html'
    }
    if(sessionStorage.post != '总经理'){
        $('#departmentManagement').addClass("hidden")
        if(sessionStorage.post != '部门经理'){
            $('#employeeManagement').addClass("hidden")
            $('#infoManagmentLabel').addClass("hidden")
        }
    }
    $('#rname').html(sessionStorage.getItem("name"))
    $('#lname').html(sessionStorage.getItem("name"))
    $('#post1').html(sessionStorage.getItem("post"))
})

//注销session,退出登录
function quit(){
    $.ajax({
        method:'GET',
        url:'http://127.0.0.1:5050/logout',
        xhrFields:{withCredentials:true},
        data:``,
        success:function(data,msg,xhr){
            sessionStorage.removeItem("sn")
            sessionStorage.removeItem("name")
            sessionStorage.removeItem("department")
            sessionStorage.removeItem("post")
            //跳转到登录页
            window.location.href = "login.html"
        },
        error:function(xhr,err){
            console.log('异步请求失败'),
            console.log(xhr)
            console.log(err)
        }
    })
}

//判断 部门管理 员工管理 的用户权限
$('#allEmployee').click(function (){
    let post = $('#post1').html()
    if(post == '部门经理' || post == '总经理'){
        window.location.href = "employee_list.html"
    }
    else{
        $('#modelMsgTitle').html("无法访问")
        $('#modelMsgBody').html("您的权限不够")
        $('#modelMsg').modal()
    }
})
$('#addEmployee').click(function (){
    let post = $('#post1').html()
    if(post == '部门经理' || post == '总经理'){
        window.location.href = "employee_add.html"
    }
    else{
        $('#modelMsgTitle').html("无法访问")
        $('#modelMsgBody').html("您的权限不够")
        $('#modelMsg').modal()
    }
})
$('#allDepartment').click(function (){
    let post = $('#post1').html()
    if( post == '总经理'){
        window.location.href = "department_list.html"
    }
    else{
        $('#modelMsgTitle').html("无法访问")
        $('#modelMsgBody').html("您的权限不够")
        $('#modelMsg').modal()
    }
})
$('#addDepartment').click(function (){
    let post = $('#post1').html()
    if( post == '总经理'){
        window.location.href = "department_add.html"
    }
    else{
        $('#modelMsgTitle').html("无法访问")
        $('#modelMsgBody').html("您的权限不够")
        $('#modelMsg').modal()
    }
})