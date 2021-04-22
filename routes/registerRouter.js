var express = require('express');
var router = express.Router();
var sqlQuery = require('../lcmysql')
var crypto = require('crypto')//加密

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('register')
});

function jiami(str){
    let salt = 'aascacacaca'//盐,自定义
    let obj = crypto.createHash('md5');
    str=salt + str;
    obj.update(str)
    return obj.digest('hex')
}

router.post('/',async(req,res)=>{
    //获取表单提交的邮箱密码用户名
    console.log(req.body)
    let email = req.body.email
    let username = req.body.username
    let password = jiami(req.body.password)
    //判断邮箱是否已注册
    let strsql = 'select * from book.user where email = ?'
    let result = await sqlQuery(strsql,[email])
    if(result.length!=0){
        //已注册
        res.render('info',{
            title:'注册失败',
            content:'此邮箱已注册',
            href:'/register',
            hrefTxt:'回到注册页面'
        })
    }else{
        //此邮箱未注册
        strsql = 'insert into book.user (username,password,email) values(?,?,?)'
        await sqlQuery(strsql,[username,password,email])
        res.render('info',{
            title:'注册成功',
            content:'请登录',
            href:'/login',
            hrefTxt:'回到登录页面'
        })
    }
})

module.exports = router;
