/**
 * Created by ali on 4/6/2015.
 */
var express = require('express');
var router= express.Router();
var formidable= require('formidable');
var format = require('util').format;
var util = require('util');
var sqlConnection=require('../routes/MySQLDbClass');
var fs = require('fs');
//var sync = require('synchronize');

var user_name;
var user_Lat;
var user_Lon;
var chatUser1;
var chatUser2;
var pic_path="uploadedImages/";
var pic_path1="http://52.11.98.82:3000/"
//var pic_path="/home/ubuntu/dwindle_dating/uploadedImages/";
var userRequirement=new Object();
var distance_Record = [];
var user_list=[];
var user_Pics = [];
var user_Pics_Name=[];
var chatUser1PicName;
var chatUser2PicName;


var imagedata;
var user1Image=[];
var user2Image=[];
var countt=0;

var mysql = require('mysql');



/**
 * API for Play Service
 * @module GetUserListsToPlay
 * @param {Stringa} fb_id  facebook ID of the User
 * @param {String} user_lat  Current Latitude of the User
 * @param {String} user_lon  Current Longitude of the User to date
 * @returns {JSON} Results as JSON <p> Json includes three types of users </p>
 * @description <p> I.MainUser - The user who started to play</p>
 * <p>II. SecondUser - Best closest Online user who is in that radius</p>
 * <p>III. OtherUsers - Other best user for dwindle play</p>
 * <p>MainUser and SecondUser Information: Name, PicName and Pic in Buffer form</p>
 * <p>OtherUsers: Information of three users with Name, PicName,Pic in Buffer form </p>
 * <p>Usage Example: http://52.11.98.82:3000/Play?fb_id=alirajab&user_lat=31.484&user_lon=74.389 </p>
 * <p>Result will be in JSON which will provide User Lists with there UserId, PicName, Picture in the form of Buffer </p>
 * <p>METHOD: GET</p>
 */

//router.get("/:fb_id/:user_lat/:user_lon",function(req,res){
//
//    checkOtherParametersFromDB(req,res);
//
//});
router.get("/",function(req,res){
	var connection = sqlConnection.handleDisconnect();
    checkOtherParametersFromDB(req,res,connection);

});
function checkOtherParametersFromDB(req,res,connection){
    //    user_name=req.params.fb_id;
//    user_Lat=req.params.user_lat;
//    user_Lon=req.params.user_lon;
    var query_request= req.query;
    user_name=query_request.fb_id;
    user_Lat=query_request.user_lat;
    user_Lon=query_request.user_lon;
    chatUser1=user_name;

    //console.log("User: "+user_name+", LAT:"+user_Lat+", LON:"+user_Lon);

    var query = "select req_gender,req_from_age,req_to_age,distance from user_status where user_id='"+user_name+"'";
    connection.query(query,function(err,rows,fields){
       if(!err){
           for (var i in rows) {
               //console.log(rows[i].req_gender);
               userRequirement['Required_Gender']=rows[i].req_gender;
               userRequirement['Required_From_Age']=rows[i].req_from_age;
               userRequirement['Required_To_Age']=rows[i].req_to_age;
               userRequirement['Distance']=rows[i].distance;
           }

       }
       else{

       }
        calculateDistance(req,res);

    });
    var calculateDistance=function(req,res){
        distance_Record = [];
		var query="SELECT req_gender,user_id, ( 3959 * acos( cos( radians( "+user_Lat+" ) ) * cos( radians( X( location ) ) ) * cos( radians( Y( location ) ) - radians( "+user_Lon+" ) ) + sin( radians( "+user_Lat+" ) ) * sin( radians( X( location ) ) ) ) ) AS distance";
            query=query+" FROM user_status";
            query=query+" HAVING distance <"+userRequirement['Distance'];
            query=query+" ORDER BY distance";
        user_list = new Array();
        connection.query(query,function(err,rows,fields){
            if(!err){
                var count=1;
                var shortestDistance=0;

                for (var i in rows) {
                    var otherUser_required_gender=rows[i].req_gender;
                    if(user_name!=rows[i].user_id && userRequirement['Required_Gender']!=otherUser_required_gender) {
                        if(count<=5) {
                            user_list.push(rows[i].user_id);
                            distance_Record.push( rows[i].distance);
                            count = count + 1;

                        }
                    }
                }
                chatUser2=user_list[0];
            }
            getChatUsersPicturesName(req,res);
        });

    };
    var getChatUsersPicturesName=function(req,res){
        var query = "Select * from user_pics where user_name='"+chatUser1+"'";
        connection.query(query,function(err,rows,fields){
            if(!err){

                chatUser1PicName=rows[0].pic_name;
            }

            getOtherUserPicInfo(req,res);
        });

    };
    var pending = distance_Record.length;
    var getOtherUserPicInfo=function(req,res){

        user_Pics_Name = new Array();
		console.log(distance_Record.length);
        for(var rec=0;rec<distance_Record.length;rec++){
            funDBQuery(rec, function(user_Pics_Name){
                //console.log("IN CB: "+user_Pics_Name);
                addUsersRecordInDB(req,res);
                //getChatUsersPictures(req,res);
        });

        }


    };

    var funDBQuery=function(rec,cb){

        var query = "Select pic_name from user_pics where user_name='"+user_list[rec]+"'";
        var user=user_list[rec];
        connection.query(query,function(err1,rows1,fields){
            if(!err1) {
                //console.log(user+" = "+chatUser2);
                if (user == chatUser2) {
                    chatUser2PicName = rows1[0].pic_name;
                    if( rec === 3 ) {
                        cb(user_Pics_Name); //callback if all queries are processed
                    }
                }
                else {
                    user_Pics_Name.push(rows1[0].pic_name);
                    if( rec === 3 ) {
                        cb(user_Pics_Name); //callback if all queries are processed
                    }

                }

            }
        });
    };
    var addUsersRecordInDB=function(req,res){
        var query = "insert into chat_room(chatroom,user2,user_name) values('"+chatUser1+"&"+chatUser1PicName+"','"+chatUser2+"&"+chatUser2PicName+"','"+chatUser1+"')";
        connection.query(query,function(err1,result1){
            if(!err1){
                for(var cc=0;cc<user_Pics_Name.length;cc++){
                    funAddOtherUsers(cc, function(rowsUpdated){
                        //console.log("IN CB: "+rowsUpdated);
                        //addUsersRecordInDB(req,res);
                        getChatUsersPictures(req,res);
                    });
                }
            }
            else{

            }
        });
    };
    function funAddOtherUsers(counter,callback){
        var a=counter+1;
        //var room_name=chatUser1+"&"+chatUser1PicName;
        var query = "update chat_room SET OtherUser"+a+"='"+user_list[a]+"&"+user_Pics_Name[counter]+"' where user_name='"+chatUser1+"'";
        //console.log(query);
        connection.query(query,function(err1,result1){
            if(!err1){
                if(counter === 2){
                    callback('Updated');
                }
            }
        });
    }
    var getChatUsersPictures=function(req,res){
        var result_json=new Object();
        var main_user = new Object();
        var sec_user = new Object();
        var other_users = new Array();

		var path=pic_path1+pic_path+chatUser1+"/"+chatUser1PicName;
        main_user['fb_id'] = user_name;
        main_user['pic_path'] = path;
        //var data=fs.readFileSync(path);
       // main_user['picData'] = new Array(data);

        result_json['MainUser'] = main_user;
		
        path=pic_path1+pic_path+chatUser2+"/"+chatUser2PicName;
        
        sec_user['fb_id']= chatUser2;
        sec_user['pic_path'] = path;
        result_json['SecondUser'] = sec_user;

        //console.log(JSON.stringify(result_json));
        var chatUsersPic=[];
        var count=1;

        for(var i=0;i<user_Pics_Name.length;i++){
			path=pic_path1+pic_path+user_list[i+1]+"/"+user_Pics_Name[i];
            
            var user= new Object();
            user['fb_id']= user_list[i+1];
            user['pic_path'] = path;
            other_users.push(user);

        }
        result_json['OtherUsers'] = other_users;
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result_json));



    };

}

module.exports=router;