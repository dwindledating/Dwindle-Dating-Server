/**
 * Created by anas on 28 Jan 2016.
 unfriend all matches api : http://159.203.245.103:3000/UnfriendMatches
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};

router.get("/",function(req,res){
    unFriendAllMatches(req,res);

});

var unFriendAllMatches = function(req,res){


    var sql="Truncate table `chat_log`";
    console.log('Unfriend all matches `chat_log` query : ' +sql);

    connection = sqlConnection.handleDisconnect();
    connection.query(sql, function (err, rows, fields) {
        if(!err){
                sql="Truncate table `blocked_user`";
                console.log('Unfriend all matches `blocked_user` query : ' +sql);
                connection.query(sql, function (er, rows, fields) {
                    if(!er){
                        response_JSON = {
                                  status: 'All the Matches Unfriend successfully'
                              };
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
                    }
                    else{
                        response_JSON['status']="There are no Matches exit  because no record found in 'blocked_user'";
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
                    }
                });
        }
        else{
			response_JSON['status']="There are no Matches exit because no record found in 'chat_log'";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response_JSON));
        }
    });
};

 module.exports=router;