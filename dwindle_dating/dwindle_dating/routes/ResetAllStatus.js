/**
 * Created by anas on 28 Jan 2016.
 Reset all user status api : http://159.203.245.103:3000/ResetAllStatus
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};

router.get("/",function(req,res){
    resetAllStatus(req,res);

});

var resetAllStatus = function(req,res){


    var sql="UPDATE  `user_status` SET  `status` =  'loggedoff' , `isPlaying` = 0";
    console.log('Reset all `user_status` query : ' +sql);

    connection = sqlConnection.handleDisconnect();
    connection.query(sql, function (err, rows, fields) {
        if(!err){
                        response_JSON = {
                                  status: 'All user statuses have been reset successfully'
                              };
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));
        }
        else{
			response_JSON['status']="No record exist";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response_JSON));
        }
    });
};

 module.exports=router;