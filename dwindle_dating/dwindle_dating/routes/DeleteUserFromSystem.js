/**
 * Created by anas on 28 Jan 2016.
 api : http://159.203.245.103:3000/DeleteUserFromSystem?fb_id=696284960499030
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};

router.get("/",function(req,res){
    deleteUserFromSystem(req,res);

});

var deleteUserFromSystem = function(req,res){
    var query_request= req.query;
    var userId=query_request.fb_id;


    var sql="DELETE FROM `push_notification`"; 
    sql = sql+" WHERE `send_from` = '"+userId+"' OR send_to = '"+userId+"'";
    console.log('Delete specific User `push_notification` query : ' +sql);

    connection = sqlConnection.handleDisconnect();
    connection.query(sql, function (err, rows, fields) {
        if(!err){

                sql="DELETE FROM `chat_log`"; 
                sql=sql+" WHERE (from_userid = '"+userId+"' OR to_userid = '"+userId+"')";
                console.log('Delete specific User `chat_log` query : ' +sql);

                connection.query(sql, function (er, rows, fields) {
                    if(!er){

                            sql="DELETE FROM `blocked_user`";
                            sql=sql+" WHERE (user_id = '"+userId+"' OR blocked_user_id = '"+userId+"')"; 
                            sql=sql+" OR (user_id = '"+userId+"' OR blocked_user_id = '"+userId+"')"; 
                            console.log('Delete specific User - `blocked_user` query : ' +sql);

                            connection.query(sql, function (er, rows, fields) {
                                if(!er){
                                        sql="DELETE FROM `user_pics`";
                                        sql=sql+" WHERE user_name = '"+userId+"'";
                                        console.log('Delete specific User - `user_pics` query : ' +sql);

                                        connection.query(sql, function (er, rows, fields) {
                                            if(!er){
                                                    sql="DELETE FROM `user_log`";
                                                    sql=sql+" WHERE user_id = '"+userId+"'";
                                                    console.log('Delete specific User - `user_log` query : ' +sql);

                                                    connection.query(sql, function (er, rows, fields) {
                                                        if(!er){
                                                                sql="DELETE FROM `user_status`";
                                                                sql=sql+" WHERE user_id = '"+userId+"'";
                                                                console.log('Delete specific User - `user_status` query : ' +sql);

                                                                connection.query(sql, function (er, rows, fields) {
                                                                    if(!er){
                                                                            sql="DELETE FROM `users`";
                                                                            sql=sql+" WHERE user_name = '"+userId+"'";
                                                                            console.log('Delete specific User - `users` query : ' +sql);

                                                                            connection.query(sql, function (er, rows, fields) {
                                                                                if(!er){
                                                                                        sql="DELETE FROM `user_signup`";
                                                                                        sql=sql+" WHERE facebook_id = '"+userId+"'";
                                                                                        console.log('Delete specific User - `user_signup` query : ' +sql);

                                                                                        connection.query(sql, function (er, rows, fields) {
                                                                                            if(!er){
                                                                                                response_JSON = {
                                                                                                          status: 'User has been successfully removed from system.'
                                                                                                      };
                                                                                                res.setHeader('Content-Type', 'application/json');
                                                                                                res.send(JSON.stringify(response_JSON));
                                                                                            }
                                                                                            else{
                                                                                                response_JSON['status']="Unsuccesfull `user_signup` data deletion process.";
                                                                                                res.setHeader('Content-Type', 'application/json');
                                                                                                res.send(JSON.stringify(response_JSON));
                                                                                            }
                                                                                        });
                                                                                }
                                                                                else{
                                                                                    response_JSON['status']="Unsuccesfull `users` data deletion process.";
                                                                                    res.setHeader('Content-Type', 'application/json');
                                                                                    res.send(JSON.stringify(response_JSON));
                                                                                }
                                                                            });
                                                                    }
                                                                    else{
                                                                        response_JSON['status']="Unsuccesfull `user_status` data deletion process.";
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.send(JSON.stringify(response_JSON));
                                                                    }
                                                                });
                                                        }
                                                        else{
                                                            response_JSON['status']="Unsuccesfull `user_log` data deletion process.";
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.send(JSON.stringify(response_JSON));
                                                        }
                                                    });
                                            }
                                            else{
                                                response_JSON['status']="Unsuccesfull `user_pics` data deletion process.";
                                                res.setHeader('Content-Type', 'application/json');
                                                res.send(JSON.stringify(response_JSON));
                                            }
                                        });
                                }
                                else{
                                    response_JSON['status']="Unsuccesfull `blocked_user` data deletion process.";
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify(response_JSON));
                                }
                            });
                    }
                    else{
                        response_JSON['status']="Unsuccesfull `chat_log` data deletion process.";
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
                    }
                });
            
        }
        else{
			response_JSON['status']="Unsuccesfull `push_notification` data deletion process.";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response_JSON));
        }
    });
};

    module.exports=router;