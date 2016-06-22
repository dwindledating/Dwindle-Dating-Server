/**
 * Created by ali on 3/16/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

/*router.get("/:fb_id/:lat/:lon",function(req,res){
    addUserLocationToDB(req,res);
});*/
router.get("/",function(req,res){
    addUserLocationToDB(req,res);
});

function addUserLocationToDB(req,res){
    
    var function_result;
    var response_JSON;
	/*
    var fb_user=req.params.fb_id;
    var lat=req.params.lat;
    var lon=req.params.lon;*/
	var query_request= req.query;
	var fb_user=query_request.fb_id;
	var lat=query_request.lat;
	var lon=query_request.lon;
	var connection = sqlConnection.handleDisconnect();
    var sql="Update user_status set location=PointFromText('POINT("+lat+" "+lon+")',4326) where user_id='"+fb_user+"'";
   // console.log(sql);
    connection.query(sql, function(sqlerr, result) {
        if (sqlerr){
            function_result= "unsuccess";
            response_JSON={
                location_added:function_result
            }
        }
        else{
            function_result= "success";
            response_JSON={
                location_added:function_result
            }
            res.send(""+JSON.stringify(response_JSON));
        }
    });



}
module.exports=router;