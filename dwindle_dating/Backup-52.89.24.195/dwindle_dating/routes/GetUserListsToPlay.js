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
var Parse = require("parse").Parse;// for APNS  - anas 13 Sep 2015
//var sync = require('synchronize');

var user_name;
var user_Lat;
var user_Lon;
var page; // for pagination - anas - 12 Sep 2015
var force_play_request;// for force play socket request - anas - 12 Sep 2015
var force_play_resource;// for force play socket request - anas - 12 Sep 2015
var from_user; // for APNS - 13 sep 2015 - anas
var response_to;//16 Sep 2015
var response_by;
var response_by_user_lat;
var response_by_user_long;
var response_time;
var response_to_user;
var isAPNSResponsePlayRequest = false;

var chatUser1;
var chatUser2;
var pic_path="uploadedImages/";
var pic_path1="http://52.89.24.195:3000/"
//var pic_path="/home/ubuntu/dwindle_dating/uploadedImages/";
var userRequirement=new Object();
var distance_Record = [];
var user_list=[];
var user_Pics = [];
var user_Pics_Name=[];
var chatUser1PicName;
var chatUser2PicName;
//Anas - 9 Sep 2015
var offline_user_list=[];
var status_loggedOff = "loggedoff";
var online_user_list =[];
var status_loggedIn = "loggedin";
var status_play = "play";
var status_playing = "playing";


var imagedata;
var user1Image=[];
var user2Image=[];
var countt=0;

var mysql = require('mysql');

// Get Socket's global object - anas - 6 sep 2015
var iosocket = require('socket.io')();// TODO UNDO require('socket.io')(appServer)

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
 * <p>Usage Example: http://52.89.24.195:3000/Play?fb_id=alirajab&user_lat=31.484&user_lon=74.389 </p>
 * <p>Result will be in JSON which will provide User Lists with there UserId, PicName, Picture in the form of Buffer </p>
 * <p>METHOD: GET</p>
 */

//router.get("/:fb_id/:user_lat/:user_lon",function(req,res){
//
//    checkOtherParametersFromDB(req,res);
//
//});

var connection;// anas - 12 Sep 2015
router.get("/",function(req,res){
	connection = sqlConnection.handleDisconnect();

    // start - Socket connection -  anas -  6 Sep 2015
    iosocket.sockets.on('connection', function (socket) {
            //console.log('socket: '+ socket );

    var query_request= req.query;
    if(query_request.fb_id != null && query_request.user_lat != null && query_request.user_lon)// anas - 16 Sep 2015
    {
        //start - Initialize reuired variables - anas - 12 Sep 2015
        user_name=query_request.fb_id;
        user_Lat=query_request.user_lat;
        user_Lon=query_request.user_lon;
        page = query_request.page; // Handled pagination on socket response (Force play)
        force_play_request = req;
        force_play_resource = res;
        from_user = user_name; // 13 sep 2015
        //end

        checkOtherParametersFromDB(req,res,connection);
        

    }//Start - Handle APNS response against request -  anas - 16 Sep 2015
    else
    {
        response_to = query_request.respond_to;
        response_by = query_request.respond_by;
        response_by_user_lat = query_request.respond_by_lat;
        response_by_user_long = query_request.respond_by_long;
        var response_to_user_status;
        //console.log("respond_to = "+response_to+"  & respond_by = "+response_by+"&response_time = "+response_time); //comment this line - anas
        
         // start - Socket connection -  anas -  16 Sep 2015
        //iosocket.sockets.on('connection', function (socket) {
            handlePushNotificationResponse(req,res,connection);
            //});
    }
    // End

    // Force play requeest for next 10 users 
    socket.on('force play', function(user_count_for_pagination){
                page = user_count_for_pagination;
                console.log('force play called with pagination value :' + page); //comment this line - anas
                checkOtherParametersFromDB(force_play_request,force_play_resource,connection);
              });

    });//End Socket Connection - anas - 6 Sep 2015
});

function checkOtherParametersFromDB(req,res,connection){


    //    user_name=req.params.fb_id;
//    user_Lat=req.params.user_lat;
//    user_Lon=req.params.user_lon;

    //Comment by  anas - 12 Sep 2015
    /* var query_request= req.query;
    user_name=query_request.fb_id;
    user_Lat=query_request.user_lat;
    user_Lon=query_request.user_lon;*/

    chatUser1=user_name;
    console.log('checkOtherParametersFromDB called - username = ' + chatUser1);

    // Sample user ID =1395888427404363 - anas - 1Sep 2015 
    // Test Updated Link : http://localhost:3000/Play?fb_id=1395888427404363&user_lat=31.484&user_lon=74.389&page=0
    console.log("User: "+user_name+", LAT:"+user_Lat+", LON:"+user_Lon, "Page:"+page);
    
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
		var query="SELECT req_gender,user_id, status, ( 3959 * acos( cos( radians( "+user_Lat+" ) ) * cos( radians( X( location ) ) ) * cos( radians( Y( location ) ) - radians( "+user_Lon+" ) ) + sin( radians( "+user_Lat+" ) ) * sin( radians( X( location ) ) ) ) ) AS distance";
            query=query+" FROM user_status";
            //query=query+" HAVING distance <"+userRequirement['Distance'];
            //Query updated - status added in select and where clause added - anas - 9 Sep 2015
            query=query+ " where user_id <> '"+user_name+"' AND req_gender <> '"+userRequirement['Required_Gender']+"' AND distance < "+userRequirement['Distance']+" AND status <> 'playing'";
            query=query+" ORDER BY distance";
            query=query+ " LIMIT "+page+",10";//pagination anas - 12 Sep 2015

        user_list = new Array();
        offline_user_list = new Array();// 9 Sep 2015 -  anas
        //console.log('Distance query :' + query); // comment this line - anas
        connection.query(query,function(err,rows,fields){
            if(!err){
                var count=1;
                var shortestDistance=0;
                
                // 9 Sep 2015 - anas
                var rowsLength = rows.length;
                var offline_user_rowsLength = 0;
                var online_user_rowsLength = 0;
                //console.log('No error in distance query and got rows count : ' + rowsLength); //  comment this line - anas
                
                //Return an event no match found if no user matches preference of current user - anas - 6 Sep 2015
                if(rowsLength > 0)
                {
                    //start - Check is that APNS response play request or normal play request  -  19 sep 2015 - anas
                    if(isAPNSResponsePlayRequest === false)
                    {
                        console.log('isAPNSResponsePlayRequest = '+isAPNSResponsePlayRequest);// Comment this line
                        //Start - Fill offline user list found in preferences - 9 Sep 2015 - anas
                        for (var i in rows) {
                            //console.log('status : ' + rows[i].status + ' == status_loggedOff:'+ status_loggedOff); //  comment this line - anas
                            if(rows[i].status == status_loggedOff) { //not needed handled in Query updated - where clause added - anas - 9 Sep 2015
                                   offline_user_list.push(rows[i].user_id);
                                   offline_user_rowsLength = offline_user_rowsLength + 1;
                            }
                        }
                        //End

                        //Start - Fill online user list found in preferences - 9 Sep 2015 - anas
                        for (var i in rows) {
                            if(rows[i].status == status_loggedIn || rows[i].status == status_play) { //not needed handled in Query updated - where clause added - anas - 9 Sep 2015
                                   //online_user_list.push(rows[i].user_id);
                                   online_user_rowsLength = online_user_rowsLength + 1;
                            }
                        }
                        //End

                           
                         console.log('offline_user_rowsLength : ' + offline_user_rowsLength); //  comment this line - anas
                         //console.log('Online_user_rowsLength : ' + online_user_rowsLength); //  comment this line - anas
                        
                        if(offline_user_rowsLength == rowsLength)
                        {
                            console.log('preferences exist but all users are offline.');
                            //start - Send APNS to offline users found - anas - 13 Sep  2015
                                var fullDateTime = getCalculatedDateTime();//get current datetime - 14 Sep 2015 

                                Parse.initialize(
                                    "HEQ0TQq0Qvqdy7BAGii05miGcVp5AcvGbnvdhxQd", // applicationId
                                    "TMRcC6J1ns1tifkDutewTjgH4vRghDqV6ESfxZpI", // javaScriptKey
                                    "fOT4V8LCaHMO9NZN8agCzK4bdxRXsWRMEfHsU6wj" //MasterKey

                                );
                                var UserObjID="";
                                var Installation = Parse.Object.extend("User");
                                var query = new Parse.Query(Installation);
                                query.find({
                                    success: function(results) {

                                        for(var index =0 ; index < offline_user_rowsLength;  index++ )
                                        {
                                            //console.log('offline_user_list['+index+'] : '+offline_user_list[index]); //  comment this line - anas
                                            var to_user = offline_user_list[index];

                                            //console.log("Parser query results.length: "+results.length);//  comment this line - anas
                                            for(var a=0;a<results.length;a++){
                                                //console.log("to_user: "+to_user+" === results[a].attributes.username: "+ results[a].attributes.username);//  comment this line - anas
                                                if(to_user===results[a].attributes.username){
                                                    //console.log('to user : '+to_user); //  comment this line - anas
                                                    UserObjID = results[a].id; //;    //TODO Muhammad yunas : S8eatsJ2O3
                                                    break;
                                                }
                                            }

                                             if(UserObjID!="") {
                                                console.log("OnjID: "+UserObjID);
                                                var query = new Parse.Query(Parse.Installation)
                                                    , parser_data = {
                                                        "alert": from_user+": Test Push notication from 'Play'",//+data 
                                                        "anotherObjectId": "", // extra data to send to the phone.
                                                        "sound": "cheering.caf" // default ios sound.
                                                    };
                                                query.equalTo("user", {"objectId": UserObjID /* a user object id */, "className": "_User", "__type": "Pointer"}); // me.
                                                query.equalTo("deviceType", "ios");
                                                /* TODO uncomment this code
                                                Parse.Push.send({
                                                    where: query,
                                                    data: parser_data
                                                }, {
                                                    success: function () {
                                                        console.log("Play - Push Notification Sent Successfully");
                                                    //  console.log("arguments", arguments);
                                                    },
                                                    error: function (error) {
                                                        console.log("Play - Error: " + error.code + " " + error.message);
                                                    }
                                                });//*/
                                            }

                                            //Insert push notification detail in db - 15 Sep 2015 
                                            addPushNotificationRecordInDB(from_user,to_user,fullDateTime);

                                        }// end forloop

                                },
                                error: function() {
                                            console.error("Play - Parser Error : User object lookup failed");
                                        }
                                });//End of query.find

                            var paginated_user_count = parseInt(page) + parseInt(rowsLength);//  Push, notification send successfully to selected user
                            iosocket.emit('message_push_notification_send', 'Preferences exist but all users are offline.', paginated_user_count, offline_user_list, from_user);// TODO - offline_user_list, from_user, currentDateTime remove these attributes for production - 14 Sep 2015                    
                        }
                        else if(online_user_rowsLength > 0)
                        {
                        //End

                            for (var i in rows) {
                                var otherUser_required_gender=rows[i].req_gender;
                                //if(user_name!=rows[i].user_id && userRequirement['Required_Gender']!=otherUser_required_gender) { //not needed handled in Query updated - where clause added - anas - 9 Sep 2015
                                    if(rows[i].status == status_loggedIn || rows[i].status == status_play) { //Fill only online user list found in preferences - 9 Sep 2015 - anas
                                        if(count<=5) {
                                            user_list.push(rows[i].user_id);
                                            distance_Record.push( rows[i].distance);
                                            count = count + 1;

                                            //console.log('UserList ['+i+'] ' + rows[i].user_id); //  comment this line - anas

                                        }
                                    }
                               // }
                            }

                                chatUser2=user_list[0];
                                console.log('Normal play request chatUser2 : ' + chatUser2); //  comment this line - anas
                        }
                        else
                        {
                            iosocket.emit('message_no_online_user', 'Sorry, there is no user online.');//, 'dwindle-any-user'
                        }

                    }
                    else
                    {
                        for (var i in rows) {
                                    var otherUser_required_gender=rows[i].req_gender;
                                    //if(user_name!=rows[i].user_id && userRequirement['Required_Gender']!=otherUser_required_gender) { //not needed handled in Query updated - where clause added - anas - 9 Sep 2015
                                        if(rows[i].status == status_loggedIn || rows[i].status == status_play) { //Fill only online user list found in preferences - 9 Sep 2015 - anas
                                            if(count<=5) {
                                                user_list.push(rows[i].user_id);
                                                distance_Record.push( rows[i].distance);
                                                count = count + 1;

                                                //console.log('UserList ['+i+'] ' + rows[i].user_id); //  comment this line - anas

                                            }
                                        }
                                   // }
                                }
                                
                        chatUser2=response_to_user;
                        console.log('APNS response play request chatUser2 : ' + response_to_user); //  comment this line - anas
                    }
                    //End !isAPNSResponsePlayRequest check
                }
                else
                {
                    //start - handle if no user found w.r.t preferences against APNs request  -  19 sep 2015 - anas
                    if(isAPNSResponsePlayRequest === true)
                    {
                        console.log('No user exist against APNS response play request.'); //  comment this line - anas

                        query="SELECT req_gender,user_id, status, ( 3959 * acos( cos( radians( "+response_by_user_lat+" ) ) * cos( radians( X( location ) ) ) * cos( radians( Y( location ) ) - radians( "+response_by_user_long+" ) ) + sin( radians( "+user_Lat+" ) ) * sin( radians( X( location ) ) ) ) ) AS distance";
                        query=query+" FROM user_status";
                        //query=query+" HAVING distance <"+userRequirement['Distance'];
                        //Query updated - status added in select and where clause added - anas - 9 Sep 2015
                        query=query+ " where user_id <> '"+user_name+"' AND req_gender <> '"+userRequirement['Required_Gender']+"' AND status <> 'playing'";
                        query=query+" ORDER BY distance";
                        query=query+ " LIMIT "+page+",10";//pagination anas - 12 Sep 2015

                        console.log('APNS Distance :' + query); // comment this line - anas
                        connection.query(query,function(err,rows,fields){
                            if(!err)
                            {
                                for (var i in rows) {
                                    var otherUser_required_gender=rows[i].req_gender;
                                    //if(user_name!=rows[i].user_id && userRequirement['Required_Gender']!=otherUser_required_gender) { //not needed handled in Query updated - where clause added - anas - 9 Sep 2015
                                        if(rows[i].status == status_loggedIn || rows[i].status == status_play) { //Fill only online user list found in preferences - 9 Sep 2015 - anas
                                            if(count<=5) {
                                                user_list.push(rows[i].user_id);
                                                distance_Record.push( rows[i].distance);
                                                count = count + 1;

                                                //console.log('UserList ['+i+'] ' + rows[i].user_id); //  comment this line - anas

                                            }
                                        }
                                   // }
                                }
                                
                                chatUser2=response_to_user;
                                console.log('APNS response play request chatUser2 : ' + response_to_user); //  comment this line - anas
                            }
                            else
                            {
                                console.log('Error in APNS Distance query '); // comment this line - anas
                            }
                        });
                    }
                    //End
                    else
                    {
                        //console.log('dwindle - message - play -> message_not_found event fired');
                        iosocket.emit('message_not_found', 'Sorry, No user found.');//, 'dwindle-any-user'
                    }
                }

            }
            else
            {
                console.log('Error in distance query'); // anas
            }
            getChatUsersPicturesName(req,res);
        });

    };
    var getChatUsersPicturesName=function(req,res){
        var query = "Select * from user_pics where user_name='"+chatUser1+"'";
        connection.query(query,function(err,rows,fields){
            if(!err){

                chatUser1PicName=rows[0].pic_name;
                console.log('chatUser1PicName : '+ chatUser1PicName);// comment this line
            }

            getOtherUserPicInfo(req,res);
        });

    };
    var pending = distance_Record.length;
    var getOtherUserPicInfo=function(req,res){

        user_Pics_Name = new Array();
		console.log('distance_Record: '+ pending);//anas
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
               console.log('Error in chatroom insertion query');// comment this line
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

    // 15 Sep 2015- anas
    var addPushNotificationRecordInDB=function(sendFrom,sendTo,createdAt){
        //console.log('createdAt : '+ createdAt);
        var query = "insert into push_notification(send_from,send_to,created_at) values('"+sendFrom+"','"+sendTo+"','"+createdAt+"')";
        connection.query(query,function(err1,result1){
            if(!err1){
               //console.log('Push notification detail has been successfully inserted in database.');
            }
            else{
               console.log('Error  in Push notification detail insertion in database.');
            }
        });
    };

    //get minute and seconds added datetime - 16 Sep 2015 
    var getCalculatedDateTime=function()
    {
        var date = new Date();
                                var getYear = date.getFullYear();
                                var getMonth = date.getMonth()+1;
                                getMonth = (getMonth < 10 ? "0" : "") + getMonth;

                                var getDay = date.getDate();
                                getDay = (getDay < 10 ? "0" : "") + getDay;


                                var fullDate = getYear + "/" + getMonth + "/" + getDay;
                                var hour = date.getHours();
                                hour = (hour < 10 ? "0" : "") + hour;
                                var min  = date.getMinutes() + 1;
                                min = (min < 10 ? "0" : "") + min;
                                var sec  = date.getSeconds() + 30;
                                if(sec > 60)
                                {
                                    sec = 30;
                                }
                                sec = (sec < 10 ? "0" : "") + sec;
                                var fullTime= hour+":"+min+":"+sec;
                                var fullDateTime = fullDate+" "+fullTime;

                            //console.log('fullDateTime = ' + fullDateTime)
        return fullDateTime;
    };
}

// start -  handle APNS response - anas - 17 Sep  2015
function handlePushNotificationResponse(req,res,connection){

    response_time = getCurrentDateTime();//"0000 00 00 00:00:00"
    getUserResponsetimeDifference(response_to,response_by,response_time,req,res,connection);// check user response less or greater than 90 sec
         
        
}// End -  handle APNS response - anas - 17 Sep  2015

    
    //get current datetime - 16 Sep 2015 
    function getCurrentDateTime()
    {
        var date = new Date();
                                var getYear = date.getFullYear();
                                var getMonth = date.getMonth()+1;
                                getMonth = (getMonth < 10 ? "0" : "") + getMonth;

                                var getDay = date.getDate();
                                getDay = (getDay < 10 ? "0" : "") + getDay;

                                var fullDate = getYear + "/" + getMonth + "/" + getDay;
                                var hour = date.getHours();
                                hour = (hour < 10 ? "0" : "") + hour;
                                var min  = date.getMinutes();
                                min = (min < 10 ? "0" : "") + min;
                                var sec  = date.getSeconds();
                                sec = (sec < 10 ? "0" : "") + sec;
                                var fullTime= hour+":"+min+":"+sec;
                                var fullDateTime = fullDate+" "+fullTime;
        return fullDateTime;
    }

    // Get is user response less or greater than 90 sec
    function getUserResponsetimeDifference(response_to,response_by,response_time,req,res,connection)
    {
        var isRespondedInTime = false;
        var sendAt;
        var query = "select DATE_FORMAT(created_at,'%Y/%m/%d %T') As created_At from push_notification where send_from='"+response_to+"' AND send_to='"+response_by+"' ORDER BY id DESC LIMIT 1";
            //console.log('push notification query: '+query);
            connection.query(query,function(err,rows,fields){
               if(!err){
                   for (var i in rows) {
                       //console.log('rows[i].created_at = '+ rows[i].created_At)
                       sendAt=rows[i].created_At;
                   }

               }
               else{
                    console.log('Error in fetching user push notification detail'); //comment this line
               }

               console.log('response_time = ' +response_time + ' sendAt = '+sendAt );//Comment this line
                if(sendAt == null)
                {
                    isRespondedInTime = false;
                }
                else if(response_time < sendAt)
                {
                    isRespondedInTime = true;
                }
                else
                {
                    isRespondedInTime = false;
                }

                console.log('isRespondedInTime = ' + isRespondedInTime);// comment this line
                process(isRespondedInTime,req,res,connection);
            }); 
    }

    //get current datetime - 16 Sep 2015 
    function process(isRespondedInTime,req,res,connection)
    {
        if(isRespondedInTime)// if responded less than 90 sec
            {
                console.log('Responded within 90 seconds');// comment this line
                getUserStatus(response_to,req,res,connection);
               
            }
            else
            {
                console.log('Responded after 90 seconds');// comment this line

                // Treating second user as main user if requestor user is busy in playing or gone offline 
                user_name=response_by;
                user_Lat=response_by_user_lat;
                user_Lon=response_by_user_long;
                page = 0; // Handled pagination on socket response (Force play)
                force_play_request = req;
                force_play_resource = res;
                from_user = user_name; 

                checkOtherParametersFromDB(req,res,connection);
            }
    }  

    // Get user status - anas  - 17 Sep 2015
    function getUserStatus(response_to,req,res,connection)
    {
        var response_to_user_status;
        var query = "select status from user_status where user_id='"+response_to+"'";
                connection.query(query,function(err,rows,fields){
                   if(!err){
                       for (var i in rows) {
                           //console.log('rows[i].status = '+ rows[i].status)
                           response_to_user_status=rows[i].status;
                       }

                   }
                   else{
                        console.log('Error in fetching respond_to status'); //comment this line
                   }

                /*
                if(response_to_user_status == status_loggedOff)
                {
                    iosocket.emit('message_user_loggedOff', 'Sorry user has gone offline. Would you like to play with others?');
                }
                else */
                if( response_to_user_status == status_playing || response_to_user_status == status_loggedOff)
                {
                    iosocket.emit('message_user_isBusy', 'Sorry user has gone offline or busy in playing game with other user. Would you like to play with your preferences?');
                    
                    // Treating second user as main user if requestor user is busy in playing or gone offline 
                    user_name=response_by;
                    user_Lat=response_by_user_lat;
                    user_Lon=response_by_user_long;
                    page = 0; // Handled pagination on socket response (Force play)
                    force_play_request = req;
                    force_play_resource = res;
                    from_user = user_name; 

                    checkOtherParametersFromDB(req,res,connection);
                }
                else if( response_to_user_status == status_loggedIn || response_to_user_status == status_play)
                {
                    console.log('User is online start game');// comment this line
                    playAgainstAPNSResponse(req,res,connection);
                }
                else
                {
                    console.log('response_to_user_status = '+ response_to_user_status);// comment this line
                }
        });
    }

    // Play Against APNS Response - anas  - 19 Sep 2015
    function playAgainstAPNSResponse(req,res,connection)
    {
            user_name=response_by;
            user_Lat=response_by_user_lat;
            user_Lon=response_by_user_long;
            page = 0; // Handled pagination on socket response (Force play)
            force_play_request = req;
            force_play_resource = res;
            from_user = user_name; 
            response_to_user = response_to;
            isAPNSResponsePlayRequest = true;
            console.log('playAgainstAPNSResponse : '+ isAPNSResponsePlayRequest);
            checkOtherParametersFromDB(req,res,connection);
    }

module.exports=router;