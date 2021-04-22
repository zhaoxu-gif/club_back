let express = require('express')
let sqlQuery = require('../lcmysql')
var multer = require('multer')
const fs = require('fs')
var crypto = require('crypto')
const { count } = require('console')
//实例化路由模块，此路由模块相当于一个小的app实例
//提供前端ajax请求的接口
let api = express.Router()

//允许前端跨域请求的中间件
api.use((req,res,next)=>{
    res.append('Access-Control-Allow-Origin','*')
    res.append('Access-Control-Allow-Content-Type','*')
    res.append('Access-Control-Allow-Headers','token,content-type')
    next();
})

//登录
api.post('/login',async(req,res)=>{
  //根据提交的信息判断是否为已注册的信息
  let strsql = 'select * from user_info where user_name = ? and user_pass = ?'
  let arr = [req.body.username,req.body.password]
  let result = await sqlQuery(strsql,arr)
  //console.log(result)
  if(result.length>0){
    //账号密码正确,登录成功
    let options = {
      status:0,
      data:{
        msg:'登陆成功',
        info:Array.from(result)
      },
    }
    res.json(options)
  }else{
    //登录失败
    let options = {
      status:1,
      data:'登录失败',
    }
    res.json(options)
  }
  
})

//注册
api.post('/register',async(req,res)=>{
  //console.log(req.body)
  let user_name = req.body.username;
  let user_pass = req.body.password;
  let user_phone = req.body.email;
  let user_email = req.body.phone;
  let time = req.body.time;
  //根据提交的信息判断是否为已注册的信息
  let strsql = 'select * from user_info where user_email = ?'
  //let arr = [req.body.username,req.body.password]
   let result = await sqlQuery(strsql,[req.body.email])
   console.log(result)
   if(result.length!=0){
     //邮箱已注册
     let options = {
      status:1,
      data:'注册失败',
    }
    res.json(options)
   }else{
     //邮箱未注册
     strsql = 'insert into user_info (user_name,user_pass,user_phone,user_email,creatTime,identity,point,status) values (?,?,?,?,?,0,1500,0)'
     await sqlQuery(strsql,[user_name,user_pass,user_email,user_phone,time])
     let options = {
       status:0,
       data:'注册成功'
     }
     res.json(options)
   }
  // console.log(result)
  
})

//修改密码
api.post('/changePass',async(req,res)=>{
  let id = req.body.id;
  let password = req.body.password;
  let strsql = 'update user_info set user_pass = ? where user_id = ?'
  sqlQuery(strsql,[password,id])
})

//首页列表
api.get('/top10',async(req,res)=>{
  let strsql = 'select *from homelist'
  let result = await sqlQuery(strsql) 
  let options = {
    data:Array.from(result),
  }
  res.json(options)
})

//场地信息查询
api.get('/location',async(req,res)=>{
  let strsql = 'select * from site_info'
  let result = await sqlQuery(strsql)
  let options = {
    msg:'查询成功',
    data:Array.from(result)
  }
  res.json(options)
})

//商品信息查询
api.get('/shop',async(req,res)=>{
  let strsql = 'select * from goods_info'
  let result = await sqlQuery(strsql)
  let options = {
    msg:'查询成功',
    data:Array.from(result)
  }
  res.json(options)
})

//场地删除
api.post('/location/delete',async(req,res)=>{
  let name = req.body.name;
  console.log(req.body)
  let strsql = 'delete from site_info where site_name = ?'
  sqlQuery(strsql,[name])
  let options = {
    msg:'删除成功'
  }
  res.json(options)
})

//场地新增
api.post('/location/add',async(req,res)=>{
  let name = req.body.name;
  let address = req.body.address;
  let price = req.body.price;
  let des = req.body.des;
  let strsql = "INSERT INTO site_info(site_name, site_address, site_status, site_price, site_des) VALUES(?, ?, 0, ?,?)"
  sqlQuery(strsql,[name,address,price,des])
  let options = {
    msg:'添加成功',
    data:0
  }
  res.json(options)
})

//场地修改
api.post('/location/update',async(req,res)=>{
    let name = req.body.name;
    let address = req.body.address;
    let price = req.body.price;
    let des = req.body.des;
    let oldname = req.body.oldname
  let strsql = "UPDATE site_info SET site_name = ?, site_address = ?, site_status=0, site_price = ?, site_des = ? WHERE site_name = ?"
  sqlQuery(strsql,[name,address,price,des,oldname])
})

//场地租用
api.post('/location/lease',async(req,res)=>{
  let userid = req.body.userid;
  let sitename = req.body.sitename;
  let price = req.body.price;
  console.log(price)
  let str = 'select point from user_info where user_id = ?'
  let result1 = await sqlQuery(str,[userid])
  let point = result1[0].point - price;
  if(point<0){
    let options = {
      data:1,
      msg:'余额不足'
    }
    res.json(options)
  }else{
    let strsql3 = 'update user_info set point = ? where user_id = ?'
  sqlQuery(strsql3,[point,userid])
  let options = {
    data:0,
    msg:'成功'
  }
  res.json(options)
  }
  let strsql = 'select * from site_info where site_name = ?'
  let result = await sqlQuery(strsql,[sitename])
  let siteid = result[0].site_id;
  let strsql1 = 'INSERT INTO site_lease (siteID, userID) VALUES(?, ?)'
  sqlQuery(strsql1,[siteid,userid])
  let strsql2 = 'UPDATE site_info SET site_status=1 WHERE site_name=?'
  sqlQuery(strsql2,[sitename])
})

//取消租用
api.post('/location/unlease',async(req,res)=>{
  let userid = req.body.userid;
  let name = req.body.sitename;
  let strsql = 'select site_id from site_info where site_name = ?'
  let result = await sqlQuery(strsql,[name])
  let siteid = result[0].site_id;
  let strsql1 = 'select * from site_lease where siteID = ? and userID = ?'
  let result1 = await sqlQuery(strsql1,[siteid,userid])
  if(result1.length>0){
    strsql = 'DELETE FROM site_lease WHERE siteID=? AND userID=?'
    sqlQuery(strsql,[siteid,userid])
    strsql1 = 'UPDATE site_info SET site_status=0 WHERE site_name=?'
  sqlQuery(strsql1,[name])
    let options = {
      msg:'取消成功',
      data:0
    }
    res.json(options)
  }else{
    let options = {
      msg:'取消失败',
      data:1
    }
    res.json(options)
  }
})

//商品页搜索
api.post('/shop/search',async(req,res)=>{
  let key = req.body.content;
  //模糊查询
  let strsql = `select * from goods_info where goods_name like '%${key}%'`
  let result = await sqlQuery(strsql)
  console.log(result)
  if(result.length>0){
    let options = {
      data:Array.from(result),
      msg:'搜索成功',
      status:0
    }
    res.json(options)
  }else{
    strsql = 'select * from goods_info'
    result = await sqlQuery(strsql)
    let option = {
      data:Array.from(result),
      msg:'搜索失败',
      status:1
    }
    res.json(option)
  }
})

//首页轮播
api.get('/home/carousel',async(req,res)=>{
  let strsql = 'select * from homeimg order by point DESC'
  let result = await sqlQuery(strsql)
  let options = {
    data:Array.from(result),
    msg:'查询成功',
  }
  res.json(options)
})

//首页饼图
api.get('/home/worldRankings',async(req,res)=>{
  let strsql = 'select * from homeEcharts'
  let result = await sqlQuery(strsql)
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//新闻详情页
api.post('/news',async(req,res)=>{
  let id = req.body.id
  let strsql = 'select * from homeimg where id = ?'
  let result = await sqlQuery(strsql,[id])
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//新闻页点赞
api.post('/news/point',async(req,res)=>{
  let id = req.body.id;
  let point = req.body.point;
  let author = req.body.author;
  let strsql = 'update homeimg set point = ? where id = ?'
  sqlQuery(strsql,[point,id])
  //作者积分+50
  let strsql1 = 'select point from user_info where user_name = ?'
  let result = await sqlQuery(strsql1,[author])
  let userpoint = result[0].point + 50;
  let strsql2 = 'update user_info set point = ? where user_name = ?'
  sqlQuery(strsql2,[userpoint,author])
})

//新闻收藏
api.post('/news/collect',async(req,res)=>{
  let userid = req.body.userid;
  let newsid = req.body.newsid;
  let strsql = 'select * from news_collect where userid = ? and newsid = ?'
  let result = await sqlQuery(strsql,[userid,newsid])
  if(result.length==0){
    //未收藏过此新闻
    strsql = 'INSERT INTO news_collect (userid, newsid) VALUES(?, ?);'
    sqlQuery(strsql,[userid,newsid])
    let options = {
      data:0,
      msg:'收藏成功'
    }
    res.json(options)
  }else{
    let options = {
      data:1,
      msg:'已收藏过此新闻，请勿重新点击'
    }
    res.json(options)
  }
})

//查询收藏新闻
api.post('/news/collected',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'select * from homeimg where id in (select newsid from news_collect where userid = ?)'
  let result = await sqlQuery(strsql,[id])
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//取消收藏新闻
api.post('/news/uncollect',async(req,res)=>{
  let userid = req.body.userid;
  let newsid = req.body.newsid;
  let strsql = 'delete from news_collect where userid = ? and newsid = ?'
  sqlQuery(strsql,[userid,newsid])
})

//商品收藏
api.post('/shop/collect',async(req,res)=>{
  let userid = req.body.userid;
  let goodsid = req.body.goodsid;
  let strsql = 'select * from goods_collect where goodsid = ? and userid = ?'
  let result = await sqlQuery(strsql,[goodsid,userid])
  if(result.length==0){
    //此用户未收藏此商品
    strsql = 'INSERT INTO goods_collect (goodsid, userid) VALUES(?, ?)'
    sqlQuery(strsql,[goodsid,userid])
    let options = {
      data:0,
      msg:'收藏成功'
    }
    res.json(options)
  }else{
    //此用户收藏过此商品
    let options = {
      data:1,
      msg:'已收藏此商品'
    }
    res.json(options)
  }
  
})

//查询收藏商品
api.post('/shop/collect/list',async(req,res)=>{
  let userid = req.body.userid;
  let strsql = 'select * from goods_info where goods_id in (select goodsid from goods_collect where userid = ?)'
  let result = await sqlQuery(strsql,[userid])
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//取消收藏商品
api.post('/shop/uncollect',async(req,res)=>{
  let userid = req.body.userid;
  let goodsid = req.body.goodsid;
  let strsql = 'DELETE FROM goods_collect WHERE goodsid = ? AND userid = ?'
  sqlQuery(strsql,[goodsid,userid])
})

//查询活动信息
api.get('/active',async(req,res)=>{
  let strsql = 'select * from act_info'
  let result = await sqlQuery(strsql);
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//发起线下活动
api.post('/active/create',async(req,res)=>{
  let userid = req.body.userid;
  let signtime = req.body.signtime;
  let des = req.body.des;
  let time = req.body.time;
  let maxnum = req.body.maxnum;
  let minnum = req.body.minnum;
  let price = req.body.price;
  let strsql = 'INSERT INTO act_info (act_signtime, act_time, act_minNum, act_maxNum, act_des, act_price,count) VALUES(?,?,?,?,?,?,0)'
  sqlQuery(strsql,[signtime,time,minnum,maxnum,des,price])

  let strsql1 = 'select act_id from act_info where act_des = ?'
  let result = await sqlQuery(strsql1,[des])
  if(result.length>0){
    strsql1 = 'insert into act_create (actid,userid) values(?,?)'
    sqlQuery(strsql1,[result[0].act_id,userid])
  }
})

//参与活动
api.post('/active/join',async(req,res)=>{
  let userid = req.body.userid;
  let actid = req.body.actid;
  let strsql = 'select * from act_join_info where act_id = ? and user_id = ?'
  let result = await sqlQuery(strsql,[actid,userid])
  if(result.length==0){
    //此用户未参与
    //判断是否已达到最大人数
    let strsql1 = 'select count(act_id) from act_join_info where act_id = ?'
    let result1 = await sqlQuery(strsql1,[actid])
    let strsql2 = 'select act_maxNum,count from act_info where act_id = ?'
    let result2 = await sqlQuery(strsql2,[actid]) 
    let max = result2[0].act_maxNum
    let percount = result2[0].count+1;
    let count = result1[0]["count(act_id)"]+1
    if(count<=max){
      //人数未到最大值
    strsql = 'insert into act_join_info (act_id,user_id) values(?,?)'
    sqlQuery(strsql,[actid,userid])
    strsql1 = 'update act_info set count = ? where act_id = ?'
    sqlQuery(strsql1,[percount,actid])
    let options = {
      data:0,
      msg:'参与成功'
    }
    res.json(options)
  }else{
    let options = {
      data:2,
      msg:'参与人数已达到最大值'
    }
    res.json(options)
  }
    }   
  else{
    let options = {
      data:1,
      msg:'已参与，请勿再次点击'
    }
    res.json(options)
  }
  
})

//获取购买页商品详情
api.post('/shop/buy',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'select * from goods_info where goods_id = ?';
  let result = await sqlQuery(strsql,[id])
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//获取所有用户信息
api.get('/userinfo',async(req,res)=>{
  let strsql = 'select * from user_info'
  let result = await sqlQuery(strsql)
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//封停账号
api.post('/userinfo/ban',async(req,res)=>{
  let idArr = req.body.idArr
  console.log(idArr)
  idArr.forEach(item => {
    let strsql = 'update user_info set status = 1 where user_id = ?'
    sqlQuery(strsql,[item])
    // console.log(item)
  });
})

//解封账号
api.post('/userinfo/unban',async(req,res)=>{
  let arr = req.body.arr
  arr.forEach(item=>{
    let strsql = 'update user_info set status = 0 where user_id = ?'
    sqlQuery(strsql,[item])
  })
})

//封停新闻
api.post('/news/ban',async(req,res)=>{
  let idArr = req.body.idArr
  console.log(idArr)
  idArr.forEach(item => {
    let strsql = 'update homeimg set status = 1 where id = ?'
    sqlQuery(strsql,[item])
  });
})

//解封新闻
api.post('/news/unban',async(req,res)=>{
  let arr = req.body.arr
  arr.forEach(item=>{
    let strsql = 'update homeimg set status = 0 where id = ?'
    sqlQuery(strsql,[item])
  })
})

//删除新闻
api.post('/news/delete',async(req,res)=>{
  let id = req.body.id
  let strsql = 'delete from homeimg where id = ?'
  sqlQuery(strsql,[id])
})

//删除商品
api.post('/goods/delete',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'delete from goods_info where goods_id = ?'
  sqlQuery(strsql,[id])
})

//下架商品
api.post('/goods/off',async(req,res)=>{
  let arr = req.body.arr;
  arr.forEach(item=>{
    let strsql = 'update goods_info set status = 1 where goods_id = ?'
    sqlQuery(strsql,[item])
  })
})

//上架商品
api.post('/goods/put',async(req,res)=>{
  let arr = req.body.arr;
  arr.forEach(item=>{
    let strsql = 'update goods_info set status = 0 where goods_id = ?'
    sqlQuery(strsql,[item])
  })
})

//上传文件
api.post('/upload', multer({
  //设置文件存储路径
  dest: 'public/upload'
}).array('file', 1), async(req, res, next)=> {
  let files = req.files;
  let file = files[0];
  let fileInfo = {};
  let path = 'public/upload/' + Date.now().toString() + '_' + file.originalname;
  fs.renameSync('./public/upload/' + file.filename, path);
  //获取文件基本信息
  fileInfo.type = file.mimetype;
  fileInfo.name = file.originalname;
  fileInfo.size = file.size;
  fileInfo.path = 'http://localhost:3000/'+path.slice(7);
  console.log(path)
  res.json({
    code: 0,
    msg: 'OK',
    data: fileInfo
  })
}); 

//新增商品
api.post('/goods/increase',async(req,res)=>{
  let name = req.body.name;
  let address = req.body.address;
  let price = req.body.price;
  let path = req.body.path;
  let strsql = 'INSERT INTO goods_info (goods_name, goods_address, goods_time, goods_price, goods_count, imgurl, status) VALUES(?, ?, "2021-04", ?, 0, ?, 0)'
  sqlQuery(strsql,[name,address,price,path])
})

//发布新闻
api.post('/news/increase',async(req,res)=>{
  let title = req.body.title;
  let content = req.body.content;
  let path = req.body.path;
  let author = req.body.username;
  let strsql = 'INSERT INTO homeimg (title, content, imgurl, author, `point`, status) VALUES(?, ?, ?, ?, 0, 0)'
  sqlQuery(strsql,[title,content,path,author])
})

//商品购买
api.post('/goods/buy',async(req,res)=>{
  let userid = req.body.userid;
  let goodsid = req.body.goodsid;
  let num = req.body.num;
  let price = req.body.price;
  let time = req.body.time;
  let str1 = 'select point from user_info where user_id = ?'
  let result = await sqlQuery(str1,[userid])
  let point = result[0].point - price;
  let str2 = 'select goods_count from goods_info where goods_id = ?'
  let result1 = await sqlQuery(str2,[goodsid])
  let count = result1[0].goods_count + num;
  if(point>0){
    str1 = 'INSERT INTO goods_buy (userid, goods_id, count, `time`,price) VALUES(?, ?, ?, ?,?)'
    sqlQuery(str1,[userid,goodsid,num,time,price])
    let str3 = 'update user_info set point = ? where user_id = ?'
    sqlQuery(str3,[point,userid])
    str2 = 'update goods_info set goods_count = ? where goods_id = ?'
    sqlQuery(str2,[count,goodsid])
    let options = {
      data:0,
      msg:'购买成功'
    }
    res.json(options)
  }else{
    let options = {
      data:1,
      msg:'购买失败'
    }
    res.json(options)
  }
})

//订单查询
api.post('/order/select',async(req,res)=>{
  let userid = req.body.userid;
  let strsql = 'select * from goods_buy where userid = ?'
  let result = await sqlQuery(strsql,[userid])
  let goodsinfo = [];
  result.forEach(async (item)=>{
    let strsql1 = 'select * from goods_info where goods_id in (select goods_id from goods_buy where goods_id = ?)'
    let arr = await sqlQuery(strsql1,[item.goods_id])
    goodsinfo.push(arr)
    //console.log(goodsinfo)
  })
  //解决异步问题
  setTimeout(()=>{
    let options = {
      orderdata:Array.from(result),
      goodsinfo:Array.from(goodsinfo)
    }
    res.json(options)
  },2000)
})

//删除历史订单
api.post('/order/delete',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'delete from goods_buy where id = ?'
  sqlQuery(strsql,[id])
})

//删除选中的的订单
api.post('/order/deleteAll',async(req,res)=>{
  let arr = req.body.arr;
  arr.forEach(item=>{
    let strsql = 'delete from goods_buy where id = ?'
    sqlQuery(strsql,[item])
  })
})

//查询新闻评论
api.post('/news/comment/select',async(req,res)=>{
  let newsid = req.body.newsid
  let strsql ='select * from replay_info where type = 0 and news_id = ?'
  let result = await sqlQuery(strsql,[newsid])
  result.forEach(item=>{
    item.children = [];
  })

  let strsql1 = 'select * from replay_info where type = 1 and news_id = ?'
  let result1 = await sqlQuery(strsql1,[newsid])
  result1.forEach(item=>{
    let index = result.findIndex(i=>
      i.replay_id === item.im_id
    )
    result[index].children.unshift(item)
  })
  
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//新闻评论
api.post('/news/comment',async(req,res)=>{
  let userid = req.body.userid;
  let name = req.body.username;
  let content = req.body.content;
  let time = req.body.time;
  let newsid = req.body.newsid;
  let replayed_id = req.body.replayed_id
  let strsql = 'INSERT INTO replay_info (`type`, replay_time, replay_content, replay_point, im_id, user_id, username,news_id,replayed_id) VALUES(0, ?, ?, 0, -1, ?, ?,?,?)'
  sqlQuery(strsql,[time,content,userid,name,newsid,replayed_id])
})

//新闻回复
api.post('/news/replay',async(req,res)=>{
  let userid = req.body.userid;
  let name = req.body.username;
  let content = req.body.content;
  let time = req.body.time;
  let newsid = req.body.newsid;
  let id = req.body.id;
  let replayed_id = req.body.replayed_id
  let strsql = 'INSERT INTO replay_info (`type`, replay_time, replay_content, replay_point, im_id, user_id, username,news_id,replayed_id) VALUES(1, ?, ?, 0, ?, ?, ?,?,?)'
  sqlQuery(strsql,[time,content,id,userid,name,newsid,replayed_id])
})

//评论点赞
api.post('/news/thumbs',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'select replay_point from replay_info where replay_id = ?'
  let result = await sqlQuery(strsql,[id])
  let point = result[0].replay_point+1;
  strsql = 'update replay_info set replay_point = ? where  replay_id = ?'
  sqlQuery(strsql,[point,id])
})

//发布视频
api.post('/video/increase',async(req,res)=>{
  let title = req.body.title;
  let time = req.body.time;
  let username = req.body.username;
  let url = req.body.url;
  let strsql = 'INSERT INTO video_info (video_title, video_point, video_time, video_author, video_url,status) VALUES(?, 0, ?, ?, ?,0)'
  sqlQuery(strsql,[title,time,username,url])
})

//查询所有视频信息
api.get('/video/select',async(rea,res)=>{
  let strsql = 'select * from video_info'
  let result = await sqlQuery(strsql);
  let options = {
    data:Array.from(result),
    msg:'查询成功'
  }
  res.json(options)
})

//视频点赞
api.post('/video/point',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'select video_point,video_author from video_info where video_id = ?'
  let result = await sqlQuery(strsql,[id])
  let point = result[0].video_point+1;
  let author = result[0].video_author;
  let strsql1 = 'update video_info set video_point = ? where video_id = ?'
  sqlQuery(strsql1,[point,id])
  //作者积分+100
  let strsql2 = 'select point from user_info where user_name = ?'
  let result1 = await sqlQuery(strsql2,[author]);
  let userpoint = result1[0].point + 100;
  let strsql3 = 'update user_info set point = ? where user_name = ?'
  sqlQuery(strsql3,[userpoint,author])
  let options = {
    data:0,
    msg:'点赞成功'
  }
  res.json(options)
})

//删除视频
api.post('/video/delete',async(req,res)=>{
  let id = req.body.id;
  let strsql = 'delete from video_info where video_id = ?'
  sqlQuery(strsql,[id]);
  let options = {
    data:0,
    msg:'删除成功'
  }
  res.json(options);
})

//禁用视频
api.post('/video/off',async(req,res)=>{
  let arr = req.body.arr;
  arr.forEach(item=>{
    let strsql = 'update video_info set status = 1 where video_id = ?'
    sqlQuery(strsql,[item])
  })
  let options = {
    data:0,
    msg:'停用成功'
  }
  res.json(options)
})

//启用视频
api.post('/video/put',async(req,res)=>{
  let arr = req.body.arr;
  arr.forEach(item=>{
    let strsql = 'update video_info set status = 0 where video_id = ?'
    sqlQuery(strsql,[item])
  })
  let options = {
    data:0,
    msg:'启用成功'
  }
  res.json(options)
})

module.exports = api