var express = require('express');
var router = express.Router();
var sqlQuery = require('../lcmysql')
var crypto = require('crypto')
let loginRouter = express.Router()

//允许前端跨域请求的中间件
loginRouter.use((req,res,next)=>{
    res.append('Access-Control-Allow-Origin','*')
    res.append('Access-Control-Allow-Content-Type','*')
    next();
})

function jiami(str){
    let salt = 'aascacacaca'//盐,自定义
    let obj = crypto.createHash('md5');
    str=salt + str;
    obj.update(str)
    return obj.digest('hex')
}

router.post('/login',async(req,res)=>{
    //根据提交的信息判断是否为已注册的信息
    let strsql = 'select * from book.user where email = ? and password = ?'
    let arr = [req.body.email,jiami(req.body.password)]
    let result = await sqlQuery(strsql,arr)
    let options = {
        user:Array.from(result)
    }
    res.json(options)
})
module.exports = router;
