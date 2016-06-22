/**
 * Created by anas on 28 Jan 2016.
 api : http://159.203.245.103:3000/UnfriendMatch?mainuser_fb_id=10153221085360955&otheruser_fb_id=
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};

router.get("/",function(req,res){
    unFriendMatch(req,res);

});

var unFriendMatch = function(req,res){
    var query_request= req.query;
    var mainuser_id=query_request.mainuser_fb_id;
    var otheruser_id=query_request.otheruser_fb_id;


    var sql="DELETE FROM `chat_log`"; 
    sql=sql+" WHERE (from_userid = '"+mainuser_id+"' and to_userid = '"+otheruser_id+"')";
    sql=sql+" OR (from_userid = '"+otheruser_id+"' and to_userid = '"+mainuser_id+"')";
    console.log('Unfriend specific match `chat_log` query : ' +sql);

    connection = sqlConnection.handleDisconnect();
    connection.query(sql, function (err, rows, fields) {
        if(!err){
                sql="DELETE FROM `blocked_user`";
                sql=sql+" WHERE (user_id = '"+mainuser_id+"' and blocked_user_id = '"+otheruser_id+"')"; 
                sql=sql+" OR (user_id = '"+otheruser_id+"' and blocked_user_id = '"+mainuser_id+"')"; 
                console.log('Unfriend specific match `blocked_user` query : ' +sql);
                connection.query(sql, function (er, rows, fields) {
                    if(!er){
                        response_JSON = {
                                  status: 'Unfriend Match performed successfully'
                              };
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
                    }
                    else{
                        response_JSON['status']="No Match record found in `blocked_user`";
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
                    }
                });
        }
        else{
			response_JSON['status']="No Match record found in `chat_log`";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response_JSON));
        }
    });
};

    module.exports=router;