/**
 * Created by ali on 4/21/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection=require('../routes/MySQLDbClass');

/**
 * API for ChangeAgeLimit
 * @module ChangeAgeLimit
 * @param {String} fb_id  facebook ID of the User
 * @param {String} req_from_age  Required Age Group Range(From)
 * @param {String} req_to_age  Required Age Group Range(To)
 * @returns {JSON} Results as Record Updated <p> Output Example: {"status":"Record Updated"}</p>
 * @description Usage/Examples: http://159.203.245.103:3000/ChangeAgeLimit?fb_id=FacebookID&req_from_age=25&req_to_age=30<p></p>
 * <p>METHOD: GET</p>

 */

router.get("/",function(req,res){
    var query_request= req.query;
    var facebook_id=query_request.fb_id;
    var fromAge=query_request.req_from_age;
    var toAge=query_request.req_to_age;
    updateRecordToDB(1,facebook_id,fromAge,toAge, function(strRecordUpdated){
        //console.log(strRecordUpdated);
        var resJson=new Object();
        resJson['status']="Record Updated";
        var resJson={
            status:'Record Updated'
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resJson));
    });
    function updateRecordToDB(rec,fb_id,from_age,to_age,cb) {
        var connection = sqlConnection.handleDisconnect();
        var sql = "update user_status set req_from_age='" + from_age + "',req_to_age='" + toAge + "' where user_id='" + fb_id + "'";
        connection.query(sql, function (err, result) {
            if(rec===1){
                cb(result);
            }
        });
    };
});
module.exports=router;

