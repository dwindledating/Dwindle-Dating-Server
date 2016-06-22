/**
 * Created by ali on 4/21/2015.
 */

var express = require('express');
var router= express.Router();
var sqlConnection=require('../routes/MySQLDbClass');
/**
 * API for ChangeDistanceRadius
 * @module ChangeDistanceRadius
 * @param {String} fb_id  facebook ID of the User
 * @param {String} distance  Required Area/range distance buffer area where anyone connect
 * @returns {JSON} Results as Record Updated <p> Output Example: {"status":"Record Updated"}</p>
 * @description Usage/Examples: http://159.203.245.103:3000/ChangeDistanceRadius?fb_id=FacebookID&distance=SelectedDistance<p></p>
 * <p>METHOD: GET</p>

 */

router.get("/",function(req,res){
    var query_request= req.query;
    var facebook_id=query_request.fb_id;
    var distance=query_request.distance;

    updateRecordToDB(1,facebook_id,distance, function(strRecordUpdated){
        //console.log(strRecordUpdated);
        var resJson=new Object();
        resJson['status']="Record Updated";
        var resJson={
            status:'Record Updated'
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resJson));
    });
    function updateRecordToDB(rec,fb_id,distance,cb) {
        var connection = sqlConnection.handleDisconnect();
        var sql = "update user_status set distance='" + distance + "' where user_id='" + fb_id + "'";
        connection.query(sql, function (err, result) {
            if(!err){
                if(rec===1){
                    cb(result);
                }
            }
        });
    };
});
module.exports=router;

