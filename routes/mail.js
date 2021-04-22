let express = require('express')

//实例化路由模块，此路由模块相当于一个小的app实例\
let router1 = express.Router()
router1.use((req,res,next)=>{
    console.log('判断是否是商城用户')
    next()
})
router1.get('/',(req,res)=>{
  res.send('商城首页')
})
router1.get('/list',(req,res)=>{
  res.send('列表页')
})

module.exports = router1