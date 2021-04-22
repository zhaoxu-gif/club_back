let mysql = require('mysql');

let options = {
    host:"localhost",
    port:"3306",/* 端口号默认3306 */
    user:"root",
    password:"password",
    database:"club_info"
}

//创建连接
let con = mysql.createConnection(options);

//建立连接
con.connect((err)=>{
    if(err){
        console.log(err)
    }
    console.log('connect success')
})

function sqlQuery(strSql,arr){
    return new Promise((reslove,reject)=>{
        con.query(strSql,arr,(err,results)=>{
            if(err){
                reject(err)
            }else{
                reslove(results);
            }
        })
    })
}

module.exports = sqlQuery;