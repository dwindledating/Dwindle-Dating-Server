/**
 * Created by ali on 3/26/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');
var connection=null;
//router.get("/:fb_id",function(req,res){
//    checkSignupStatus(req,res);
//
//});
router.get("/",function(req,res){
    checkSignupStatus(req,res);

});
 
function checkSignupStatus(req,res){
    var query_request= req.query;
    //console.log(query_request.fb_id);
    //var facebook_id=req.params.fb_id;
    var facebook_id=query_request.fb_id;
	res.setHeader('Content-Type', 'application/json');
    connection = sqlConnection.handleDisconnect();
    var query="select * from user_signup where facebook_id='"+facebook_id+"'";
    connection.query(query,function(err,rows,fields){
   if(rows.length==0){
           response_JSON={
               status:'NotRegistered'
           };

           res.send(JSON.stringify(response_JSON));
       }
        else{
           response_JSON={
               status:'RegisteredUser'

           };
           getUserPreferencesFromDB(1,facebook_id,response_JSON,function(resultJSON){
               res.send(JSON.stringify(resultJSON));
           });
//           res.setHeader('Content-Type', 'application/json');
//           res.send(JSON.stringify(response_JSON));
       }

    });
}
var getUserPreferencesFromDB=function(rec,facebook_id,response_JSON,callback){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var query="select * from users u,user_status us where u.user_name='"+facebook_id+"' and u.user_name=us.user_id";
    console.log(query);
    connection.query(query, function (err, rows, fields) {
        if(!err) {
           if (rows.length > 0) {
               response_JSON['Name'] = rows[0].name;
               response_JSON['RequiredGender'] = rows[0].req_gender;
               response_JSON['FromAge'] = rows[0].req_from_age;
               response_JSON['ToAge'] = rows[0].req_to_age;
               response_JSON['Distance'] = rows[0].distance;
           }
       }
        else{
            response_JSON={
               status:'NotRegistered'
           };
       }
        if(rec===1){
            callback(response_JSON);
        }
    });
};
module.exports=router;