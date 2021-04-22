var express = require('express');
var path = require('path');
var fs = require('fs');
var moment = require('moment')
var bodyParser = require('body-parser')
//let router1 = require('./routes/mail')
//引入cookie模块
var cookieParser = require('cookie-parser');
//引入session模块
var session = require('express-session');
let api = require('./routes/api');

var app = express();

//引入上传模块
let multer = require('multer')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({  //配置这两行代码
  extended: true
}));
app.use(bodyParser.json());      

app.get('/',(req,res)=>{
  res.send('首页')
})

//在public/upload的文件下；通过当前日期创建目录
let uploadDir=`./public/upload/${moment().format('YYYYMMDD')}`;
fs.mkdirSync(uploadDir,{
    recursive:true  //递归创建目录
});
//multer配置
let upload=multer({dest:uploadDir});
api.use(upload.any())


app.use('/api',api)

app.use(express.static(path.join(__dirname,'public')))
module.exports = app;
