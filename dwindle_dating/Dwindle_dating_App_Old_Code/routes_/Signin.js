/**
 * Created by ali on 3/16/2015.
 */
var express = require('express');
var router= express.Router();
var mysql = require('mysql');

router.get("/:fb_id/:gender",function(req,res){
    addUserToDB(req,res);
});
function handleDisconnect() {
    var db_config={
    host: 'localhost',
    user: 'root',
    password: 'dwindle21212',
    database: 'dwindle_dating'
};

    var connection;
    connection = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
    return connection;
}
function addUserToDB(req,res){
    var connection= handleDisconnect();
    var function_result;
    var response_JSON;
    var fb_user=req.params.fb_id;
    var gender=req.params.gender;
    var sql="insert into users(user_name,gender) values('"+fb_user+"','"+gender+"')";

    connection.query(sql, function(sqlerr, result) {
        if (sqlerr){
            function_result= "signin unsuccessful";
            response_JSON={
                signin_status:function_result
            }
        }
        else{
            var now = new Date();
            var time= now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
            var jsonDate = now.toJSON();
            var then = new Date(jsonDate);
            console.log(then);
            var sql="insert into user_status(user_id,status,date,time) values('"+fb_user+"','loggedin','"+then+"','"+time+"')";
            connection.query(sql, function(err1,result2){
                if(!err1){
                    function_result= "signin successful";
                    response_JSON={
                        signin_status:function_result
                    };
                    //  res.set('Content-Type', 'appication/json');
                    res.send(""+JSON.stringify(response_JSON));
                }
            });

        }
    });

}
module.exports=router;