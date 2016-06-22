/**
 * Created by ali on 5/16/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var pic_path = "uploadedImages/";
var save_directory = "/home/ubuntu/dwindle_dating/public/uploadedImages/";
var pic_path1 = "http://52.11.98.82:3000/";
//var save_directory = "public/uploadedImages/";
//var pic_path1 = "http://localhost:3000/";
var ERR_response_JSON={};
var matchedRecord;

router.get("/",function(req,res){
    funGetMatches(req,res);

});
var funGetMatches = function(req,res){
    var query_request= req.query;
    var facebook_id=query_request.fb_id;
    var userData= new Object();
    var chatData= new Object();

    var usersList = new Array();
    if(connection===null) {
        connection = sqlConnection.handleDisconnect();
    }
    var sql="Select distinct(oUserId)";
    sql=sql+" from";
    sql=sql+" (SELECT from_userid aUserId, to_userid oUserId,date FROM `chat_log` WHERE from_userid='"+facebook_id+"'";
    sql=sql+" UNION";
    sql=sql+" SELECT to_userid aUserId,from_userid oUserId,date FROM `chat_log` WHERE to_userid='"+facebook_id+"'order by date desc) userchat";
    console.log(sql);
    connection.query(sql, function (err, rows, fields) {
        if(!err){
            for (var i in rows) {
                usersList.push(rows[i].oUserId);
            }
        }
        else{
			ERR_response_JSON['status']="No Record Found";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(ERR_response_JSON));
        }
        if(usersList.length>0){
            var count=1;
            var ln= usersList.length;
			matchedRecord=new Array();
            for(var a=0;a<usersList.length;a++){
                var usr=usersList[a];
//            console.log(usr);
                funGetPicandStatus(a,count,ln,usr,facebook_id,userData,function(resData){
                    count=count+1;
					 if(count>ln){
                        //console.log(JSON.stringify(cbResult));
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(resData));
                    }

                });
            }
        }
        else if(usersList.length===0){
            ERR_response_JSON['status']="No Record Found";
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(ERR_response_JSON));
        }
    });



};
var funGetPicandStatus=function(r,count,length,usr,fbId,userData,cb){
    if(connection===null) {
        connection = sqlConnection.handleDisconnect();
    }
    userData= new Object();
    //var sql ="select DISTINCT(up.user_name) un, pic_name,us.status from user_pics up, user_status us where us.user_id=up.user_name and up.user_name='"+usr+"' limit 1";
	var sql ="select DISTINCT(up.user_name) un, pic_name,us.status,u.name from user_pics up, user_status us,users u where us.user_id=up.user_name and up.user_name='"+usr+"' and up.user_name=u.user_name limit 1";
//    console.log("PicSql: "+sql );
    connection.query(sql, function (err, rows, fields) {
       if(!err){
              var cc=r+1;
               var picPath= pic_path1+"uploadedImages/"+usr+"/"+rows[0].pic_name;
               userData['fb_id']=usr;
			   //userData['Name']=rows[0].name;
			    if(rows[0].name){
                   var strUserName=rows[0].name;
                   var strUsrNamArr=strUserName.split(" ");
                   userData['Name']=strUsrNamArr[0];
                   //userData['user_name']=strUsrNamArr[0];
               }
               else{
                   userData['Name']="";
                   //userData['user_name']="";
               }
			   //userData['user_name']=rows[0].name;
               userData['PicPath']=picPath;
               userData['Status']=rows[0].status;
               //matchedRecord["User"+cc]=userData;
			    funGetChatDetails(r,count,length, usr, fbId, userData, function (cbResult) {
//               console.log(JSON.stringify(cbResult));
                 if(count<=length){
						cb(cbResult);
					}
				});
           }

    });
};

var funGetChatDetails= function(rec,countt,length,userResult,fbId,chatData,callBack){
    if(connection===null) {
        connection = sqlConnection.handleDisconnect();
    }
    //chatData=new Object();
    var sql = "select text,date,status from chat_log where (to_userid='"+userResult+"' and from_userid='"+fbId+"') OR (to_userid='"+fbId+"' and from_userid='"+userResult+"') order by date desc limit 1";
//    console.log(sql);
    connection.query(sql, function (err, rows, fields) {
       if(!err){
               var cc=rec+1;
               //chatData['fb_id']=userResult;
               chatData['Text']=rows[0].text;
               chatData['Date']=rows[0].date;
			   chatData['MessageStatus']=rows[0].status;
			   matchedRecord.push(chatData);
       }
        if(countt<=length){
            callBack(matchedRecord);
        }

    });
};

var funGetUserList = function(facebook_id,cb){
    var usersList = new Array();
    if(connection===null) {
        connection = sqlConnection.handleDisconnect();
    }
    var sql="Select distinct(oUserId)";
        sql=sql+" from";
        sql=sql+" (SELECT from_userid aUserId, to_userid oUserId,date FROM `chat_log` WHERE from_userid='"+facebook_id+"'";
        sql=sql+" UNION";
        sql=sql+" SELECT to_userid aUserId,from_userid oUserId,date FROM `chat_log` WHERE to_userid='"+facebook_id+"'order by date desc) userchat";
    //console.log(sql);
    connection.query(sql, function (err, rows, fields) {
        if(!err){
            for (var i in rows) {
                usersList.push(rows[i].oUserId);
            }
            cb(usersList);
        }
    });
};

module.exports=router;