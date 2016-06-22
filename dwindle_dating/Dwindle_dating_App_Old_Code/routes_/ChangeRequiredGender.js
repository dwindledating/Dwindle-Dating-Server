/**
 * Created by ali on 4/30/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection=require('../routes/MySQLDbClass');

/**
 * API for ChangeRequiredGender
 * @module ChangeRequiredGender
 * @param {String} fb_id  facebook ID of the User
 * @param {String} req_gender  User Required Gender
 * @returns {JSON} Results as Record Updated <p> Output Example: {"status":"Record Updated"}</p>
 * <p>If Error then Result will be JSON as Example: {"status":"UnSuccessful"}</p>
 * @description Usage/Examples: http://52.89.24.195:3000/ChangeRequiredGender?fb_id=FacebookID&req_gender=Gender<p></p>
 * <p>METHOD: GET</p>

 */

router.get("/",function(req,res){
    var query_request= req.query;
    var facebook_id=query_request.fb_id;
    var gender=query_request.req_gender;

    updateRecordToDB(1,facebook_id,gender, function(strRecordUpdated){
        //console.log(strRecordUpdated);
        var resJson=new Object();
        if(strRecordUpdated==="Successful"){
            resJson['status']="Record Updated";
            var resJson={
                status:'Record Updated'
            };
        }
        else{
            resJson['status']="Record Updated";
            var resJson={
                status:'UnSuccessful'
            };
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resJson));
    });
    function updateRecordToDB(rec,fb_id,gender,cb) {
        var connection = sqlConnection.handleDisconnect();
        var sql = "update user_status set req_gender='" + gender + "' where user_id='" + fb_id + "'";
        connection.query(sql, function (err, result) {
            if(!err){
                if(rec===1){
                    cb('Successful');
                }
            }
            else{
                connection=sqlConnection.closeConnection(connection);
                cb('UnSuccessful');
            }
        });
    };
});
module.exports=router;

