/**
 * Created by ali on 5/8/2015.
 */
var sqlConnection = require('./MySQLDbClass');
var fs = require('fs');
var connection = null;
var pic_path = "uploadedImages/";
//var save_directory = "/home/ubuntu/dwindle_dating/public/uploadedImages/";//Live - TODO -UnComment this line before deployment
var save_directory = "/root/dwindle_dating/public/uploadedImages/";//Stagging - TODO -UnComment this line before deployment
var pic_path1 = "http://159.203.245.103:3000/";//TODO -UnComment this line before deployment
//var save_directory = "public/uploadedImages/";//TODO -Comment this line before deployment
//var pic_path1 = "http://localhost:3000/";//TODO -Comment this line before deployment

//Anas - 9 Sep 2015
var user_list=[];
var user_name;
var user_Lat;
var user_Lon;
var offline_user_list=[];
var status_loggedOff = "loggedoff";
var online_user_list =[];
var status_loggedIn = "loggedin";
var status_play = "play";
var status_playing = "playing";
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
var Parse = require("parse").Parse;// for APNS  - anas 13 Sep 2015
var _ = require('underscore')._;// for in app push notification - anas - 8 Oct 2015
var mainUserName;// 10 Oct 2015


var io = null;

var ioChat = function (io) {
   if (!(this instanceof ioChat)) {
        //console.log('true');
        return new ioChat(io);
    }

    this.io = io;
    //console.log('IO: ' + JSON.stringify(io));
    play(this.io);
};
var play = function (io) {
    var user = {};
    var usernames = [];
    var rooms = [];
    var msgStatus='read';
    var userCheck=[];
    var res_json=[];

    var secUserJson;
//    var sockets =[];


//     io.of('/').on('connection', function (socket) {
    
    io.sockets.on('connection', function (socket) {
        // when the client emits 'Play', this listens and executes

        //socket.emit("updatechat","EveryOne: ","This Is Play");
        var sec_user = new Object();
        var main_user = new Object();
        var result_json = new Object();
        var result_json1 = new Object();

        var userRequirement = {};
        var firstUserBoolean=true;
        var dwindleCondition;

        // Generic method for change status - anas - 13 Dec 2015
         socket.on('event_change_user_status', function(user_fb_id, status){

            console.log('event_change_user_status called with user_fb_id = '+ user_fb_id +' and status = '+status);
            if(connection===null){
                        connection = sqlConnection.handleDisconnect();
                }
                var sql = "update user_status set status = '" +status+ "' where user_id='" + user_fb_id + "'";
                connection.query(sql, function (sqlerr, result) {
                    if (sqlerr) {
                        console.log('event_change_user_status : user not found');
                    }
                });
        });

         //TODO - comment below code before deploying file on production this in only for testing purpose - 8 Oct 2015 - anas
        socket.on('connect with socket', function(username){
            socket.username = username;
            console.log('socket.username = '+socket.username +' connected with socket');
            if(connection===null){
                        connection = sqlConnection.handleDisconnect();
                }
                var sql = "update user_status set status = 'play' where user_id='" + username + "'";
                connection.query(sql, function (sqlerr, result) {
                    if (sqlerr) {
                        console.log('user not found');
                    }
                });
        });

        //Start -TODO - remove below code this is only for testing purpose - 17 Oct 2015
      socket.on('logout-temp', function (user_facebook_id) {
          var facebook_id = user_facebook_id;
          if (connection === null) {
              connection = sqlConnection.handleDisconnect();
          }

          var query = "update user_status set status = 'loggedoff' where user_id='" + facebook_id + "'";
          console.log(query);
          connection.query(query, function (err, rows, fields) {
              if (!err) {
                  response_JSON = {
                      status: 'User logout successfully'
                  };
                  io.sockets.emit('event_user_not_registered', JSON.stringify(response_JSON));
              }
              else {
                  response_JSON = {
                      status: 'NotRegistered'
                  };
                  io.sockets.emit('event_user_not_registered', JSON.stringify(response_JSON));
              }
          });
      });

      socket.on('login-temp', function (user_facebook_id) {
          var facebook_id = user_facebook_id;
          if (connection === null) {
              connection = sqlConnection.handleDisconnect();
          }

          var query = "update user_status set status = 'loggedin' where user_id='" + facebook_id + "'";
          console.log(query);
          connection.query(query, function (err, rows, fields) {
              if (!err) {
                  response_JSON = {
                      status: 'User logged in successfully'
                  };
                  io.sockets.emit('event_user_loggedIn_temp', JSON.stringify(response_JSON));
              }
              else {
                  response_JSON = {
                      status: 'NotRegistered'
                  };
                  io.sockets.emit('event_user_not_registered', JSON.stringify(response_JSON));
              }
          });
      });
      //End

        // TODO
        socket.on('disconnect socket', function () {
            socket.disconnect();
        });
        //TODO - comment below code before deploying file on production get users list for testing purpose - 3 Oct 2015 - anas
        socket.on('getUsersList', function(){
                console.log('getUsersList called');
                var userDropDownList = [];
                if(connection===null){
                    connection = sqlConnection.handleDisconnect();
                }
                var query = "Select user_name  FROM users";
                connection.query(query, function (err, rows, fields) {
                    if (!err) 
                    {
                        if(rows.length>0)
                        {
                            for (var i in rows) {
                                      console.log("push(rows["+i+"].user_name) "+ rows[i].user_name) // Comment this line
                                           userDropDownList.push(rows[i].user_name);
                                }

                                io.emit('setUserDropDownList', userDropDownList);
                        }
                        else
                        {
                             userDropDownList.push('10153221085360955');
                        }
                    }
                    else
                    {
                        console.log('Error fetching users for drop down list.');
                    }

              });
            });

        // APNS Response - anas - 4 Oct 2015
        socket.on('APNS Response', function(username,respondTo,userLat,userLon){
                console.log('APNS Response called ...'); //comment this line - anas
                response_to = respondTo;
                response_by = username;
                response_by_user_lat = userLat;
                response_by_user_long = userLon;
                var response_to_user_status;
                response_time = getCurrentDateTime();//"0000 00 00 00:00:00"
                getUserResponsetimeDifference(response_to,response_by,response_time);// check user response less or greater than 90 sec
     
                //play(username, userLon, userLat,'0');
              });

        // APNS response related methods - start
        // Get is user response less or greater than 90 sec
        var getUserResponsetimeDifference = function(response_to,response_by,response_time)
        {
            var isRespondedInTime = false;
            var sendAt;
            if(connection===null){
                    connection = sqlConnection.handleDisconnect();
                }
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
                    process(isRespondedInTime);
                }); 
        };

        //get current datetime - 16 Sep 2015
        var process = function(isRespondedInTime)
        {
            if(isRespondedInTime)// if responded less than 90 sec
                {
                    console.log('Responded within 90 seconds');// comment this line
                    getUserStatus(response_to);
                   
                }
                else
                {
                    console.log('Responded after 90 seconds');// comment this line

                    // Treating second user as main user if requestor user is busy in playing or gone offline 
                    play(response_by, response_by_user_long, response_by_user_lat,'0');
                }
        };  

        // Get user status - anas  - 17 Sep 2015
        var getUserStatus = function(response_to)
        {
            var main_user = response_by;
            var mainSocket = findSocket(main_user, io.sockets.connected);

            var response_to_user_status;
            if(connection===null){
                    connection = sqlConnection.handleDisconnect();
                }
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

                    
                    if(response_to_user_status == status_loggedOff)
                    {
                        console.log('response_to_user is logged off.');// comment this line
                        //iosocket.emit('message_user_loggedOff', 'Event : message_user_loggedOff -------------- Message :Sorry user has gone offline. Would you like to play with others?');
                        
                        var fullDateTime = getCalculatedDateTime(); 

                        // Send APNS to offline user
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
                                        for(var a=0;a<results.length;a++){
                                            if(response_to===results[a].attributes.username){
                                                UserObjID=results[a].id;
                                                break;
                                            }
                                        }
                                        if(UserObjID!="") {
                                            console.log("OnjID: "+UserObjID);
                                            var query = new Parse.Query(Parse.Installation)
                                                , parser_                                = {
                                                    "alert": response_by+": "+data,
                                                    "anotherObjectId": "", // extra data to send to the phone.
                                                    "sound": "cheering.caf" // default ios sound.
                                                };
                                            query.equalTo("user", {"objectId": UserObjID /* a user object id */, "className": "_User", "__type": "Pointer"}); // me.
                                            query.equalTo("deviceType", "ios");
                                            Parse.Push.send({
                                                where: query,
                                                data: parser_ //data - updated from 'parser_data' to 'parser_' - anas - 8 Oct 2015 - resolving parser error
                                            }, {
                                                success: function () {
                                                    console.log("Against APNS response - Push Notification Sent Successfully");
    //                                    console.log("arguments", arguments);
                                                },
                                                error: function (error) {
                                                    console.log("Error: " + error.code + " " + error.message);
                                                }
                                            });

                                        }
                                    },
                                    error: function() {
                                        console.error("Against APNS response - User object lookup failed");
                                    }
                                });//End of query.find
                                
                                 //Insert push notification detail in db - 15 Sep 2015 
                                 addPushNotificationRecordInDB(response_by,response_to,fullDateTime);

                        // Treating second user as main user if requestor user is busy in playing or gone offline 
                        play(response_by, response_by_user_long, response_by_user_lat,'0');
                    }
                    else if( response_to_user_status == status_playing)
                    {
                        if (mainSocket) {
                            mainSocket.emit('message_user_isBusy', 'Event : message_user_isBusy -------------- Message : Sorry user is busy in playing game with other user. Would you like to play with your preferences?');
                        }
                        // Treating second user as main user if requestor user is busy in playing or gone offline 
                        play(response_by, response_by_user_long, response_by_user_lat,'0');
                    }
                    else if( response_to_user_status == status_loggedIn || response_to_user_status == status_play)
                    {
                        console.log('User is online start game');// comment this line
                        playAgainstAPNSResponse();
                    }
                    else
                    {
                        console.log('response_to_user_status = '+ response_to_user_status);// comment this line
                        /*if (mainSocket) {
                            mainSocket.emit('message_online_user', 'Event : message_online_user -------------- Message : Sorry, User are online but not interested in play.');//, 'dwindle-any-user'
                        }*/

                        var isSocketExist = findSocket(response_to, io.sockets.connected);
                        if (isSocketExist) {
                            isSocketExist.emit('message_game_started', 'Game Started',response_by,'PlayScreen');
                            playAgainstAPNSResponse();
                        }
                    }
            });
        };

        // Play Against APNS Response - anas  - 19 Sep 2015
        var playAgainstAPNSResponse = function()
        {
                response_to_user = response_to;
                isAPNSResponsePlayRequest = true;
                console.log('playAgainstAPNSResponse : '+ isAPNSResponsePlayRequest);
                play(response_by, response_by_user_long, response_by_user_lat,'0');
        };

        //get current datetime - 16 Sep 2015 
        var getCurrentDateTime = function()
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
        };
        // APNS response related all methods - end

        // Force play request for next 10 users - anas - 3 Oct 2015
        socket.on('force play', function(username,userLat,userLon,user_count_for_pagination){
                page = user_count_for_pagination;
                console.log('force play called with pagination value :' + page); //comment this line - anas
                play(username, userLon, userLat,user_count_for_pagination);
              });

        //Start - Play event
        socket.on('Play', function (username, usrLon, usrLat, _page) {
            play(username, usrLon, usrLat,_page);
        });//End Of Socket.on Play event
            
            //start - Play - 3 Oct 2015 - anas
            var play = function (username, usrLon, usrLat,_page) 
            {
                //start -  - anas - 2 Oct 2015
                user_name=username;
                user_Lat=usrLat;
                user_Lon=usrLon;
                page = _page; // Handled pagination on socket response (Force play)
                from_user = user_name;
                console.log("Play called - User: "+user_name+", LAT:"+user_Lat+", LON:"+user_Lon, "Page:"+page);
                //End

                socket.username = username;
                //console.log(socket.username+", "+socket.id);
                //usernames.push(socket.username);
                var resJson={username:username,MainUser:[],SecondUser:[],OtherUsers:[]};
                res_json.push(resJson);
                console.log("Start Playing...");
                if(connection===null){
                        connection = sqlConnection.handleDisconnect();
                }
                var sql = "update user_status set status = 'play',location = POINT(" + usrLon + "," + usrLat + ") where user_id='" + username + "'";
                connection.query(sql, function (sqlerr, result) {
                    if (sqlerr) {
                        function_result = "user not found";
                        response_JSON = {
                            signin_status: function_result
                        }
                    }
                });
                var usrJSON=findUserJSon(username);
                var query = "select u.name,up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up,users u";
                query += " where us.user_id='" + username + "' and up.user_name ='" + username + "' and u.user_name='"+username+"' limit 1";
                //console.log(query);
                connection.query(query, function (err, rows, fields) {
                    main_user['fb_id'] = username;
                    if (!err) {
                        //console.log(rows.length);
                        //for (var i in rows) {
                        if(rows.length>0){
                            userRequirement['Required_Gender'] = rows[0].req_gender;
                            userRequirement['Required_From_Age'] = rows[0].req_from_age;
                            userRequirement['Required_To_Age'] = rows[0].req_to_age;
                            userRequirement['Distance'] = rows[0].distance;

                            var path = pic_path1 + pic_path + main_user['fb_id'] + "/" + rows[0].pic_name;
    //                        console.log(path);
                            if(rows[0].name){
                                var mainUserFullName=rows[0].name;
                                mainUserName = mainUserFullName; // get user for apns response user call to criteria function - anas - 4 oct 2015
                                console.log("mainUserName = " + mainUserName);
                                var mainUserName_Array=mainUserFullName.split(" ");
                                main_user['user_name']=mainUserName_Array[0];
                            }
                            else{
                                main_user['user_name']="";
                                mainUserName = "";// get user for apns response user call to criteria function - anas - 4 oct 2015
                            }

                            main_user['pic_name']=rows[0].pic_name;
                            main_user['pic_path'] = path;
    //                        main_user['RequiredGender'] = userRequirement['Required_Gender'];
                            var userInfo={username:username,requiredGender:userRequirement['Required_Gender']};
                            userCheck.push(userInfo);
                            result_json['MainUser'] = main_user;

                        }
                        console.log(JSON.stringify(main_user));
                        usrJSON.MainUser.push(main_user);
                        findUserAccordingToCriteria(userRequirement);
                    }else{
                        //sqlConnection.closeConnection(connection);
                    }


                });

            };
            //End - Play

            var findUserAccordingToCriteria = function (userRequirement) {
//                console.log("Finding user according to criteria...");
                var query = "Select name,user_id,status,(ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + user_Lat + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + user_Lat + "))*COS(RADIANS(X(location)- " + user_Lon + ")) ) * 6371)/1.60934 distance";
                query += " FROM users, user_status";
                /*query += " WHERE user_name = user_id and user_name != '" + username + "'  and gender = '" + userRequirement['Required_Gender'] + "' ";
                query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                query += " and `status` = 'play'";
                query += " HAVING distance <" + userRequirement['Distance'];
                query += " ORDER BY distance";*/

                //Query updated - status added in select and where clause added - anas - 9 Sep 2015
                query=query+ " where user_name = user_id and user_id <> '"+user_name+"' AND gender = '"+userRequirement['Required_Gender']+"' AND status <> 'playing'";//AND distance < "+userRequirement['Distance']+"
                query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                query += " HAVING distance <" + userRequirement['Distance'];
                query=query+" ORDER BY distance";
                query=query+ " LIMIT "+page+",10";//pagination anas - 12 Sep 2015

                var user_list = new Array();
                offline_user_list = new Array();// 9 Sep 2015 -  anas
                //console.log('Preferences query :' + query); // comment this line - anas

                // Preferences query Call - start
                connection.query(query, function (err, rows, fields) {

                    if (!err) {
                        var count = 1;
                        var shortestDistance = 0;

                        // 9 Sep 2015 - anas
                        var rowsLength = rows.length;
                        var offline_user_rowsLength = 0;
                        var online_user_rowsLength = 0;
                        var resJSON= new Object();
                        var main_user = user_name;//resJSON["MainUser"].fb_id;
                        var mainSocket = findSocket(main_user, io.sockets.connected);
                        console.log('No error in distance query and got rows count : ' + rowsLength); //  comment this line - anas
                        
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
                                           console.log("push(rows["+i+"].user_id) "+ rows[i].user_id) // Comment this line
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

                                   
                                 //console.log('offline_user_rowsLength : ' + offline_user_rowsLength); //  comment this line - anas
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

                                                var paginated_user_count = parseInt(page) + parseInt(rowsLength);//  Push, notification send successfully to selected user
                                                if (mainSocket) {// TODO remove - username,userLat,userLon - if these info will provided through IOS end
                                                    mainSocket.emit('message_push_notification_send', 'Event : message_push_notification_send  -------------        Message : Preferences exist but all users are offline. Push notification has been sent to offline users', user_name, user_Lat, user_Lon, paginated_user_count, offline_user_list, from_user);// TODO -remove user_name,user_Lat,user_Lon,  and  offline_user_list, from_user, currentDateTime remove these attributes for production - 14 Sep 2015                    
                                                }
                                            },
                                            error: function() {
                                                        console.error("Play - Parser Error : User object lookup failed");
                                                        if (mainSocket) {
                                                            mainSocket.emit('message_push_notification_Error', 'Event : message_push_notification_Error         Message : There is problem in sending push notification.Parser Error : User object lookup failed');
                                                        }
                                                    }
                                            });//End of query.find

                                           
                                }
                                else if(online_user_rowsLength > 0)
                                {
                                //End
                                    var userlimit = 0;//TODO Comment this line  - This is only for testing purpose
                                    for(var i in rows){
                                        console.log("Second User "+i+" = "+rows[i].user_id);
                                        
                                        if (rows[i].status == status_loggedIn || rows[i].status == status_play) {  //Fill only online user list found in preferences - 9 Sep 2015 - anas
                                               if(count<=5) {
                                                   user_list.push(rows[i].user_id);
                                                    //console.log('UserList ['+i+'] ' + rows[i].user_id); //  comment this line - anas
                                                    count = count + 1;
                                                }
                                        }

                                        //console.log('user_list[0] === ' + user_list[0]);//comment this line
                                        if(user_list[0] == null || user_list[0] == 'undefined')
                                        {
                                                if (mainSocket) {
                                                    mainSocket.emit('message_online_user', 'Sorry, User status is online (loggedin) but disconnected with socket.');//, '
                                                }
                                        }
                                        else
                                        {       
                                                //TODO Comment this socket code - This is only for testing purpose to display other user status in play
                                                if(userlimit == 0)
                                                {
                                                    if (mainSocket) {
                                                        mainSocket.emit('message_user_found', user_list[0]);//, 'dwindle-any-user'
                                                    }
                                                    userlimit = userlimit + 1;
                                                }
                                                //End

                                                console.log("User found to play game."); //Comment this line                                       
                                                var userSocket = findSocket(user_list[0], io.sockets.connected);
                                                console.log("Find socket of found user - userSocket = "+ userSocket); //Comment this line  
                                                if (userSocket) {
                                                    console.log("socket Connected");
                                                    isBothUserCriteriaMatch(rows[i].user_id, user_name,rows[i].name);// username repce with user_name -  anas - 9 Oct 2015
                                                    break;
                                                }
                                        }
                                    }
                                }
                                else
                                {
                                    if (mainSocket) {
                                    mainSocket.emit('message_no_online_user', 'Sorry, there is no user online.');//, 'dwindle-any-user'
                                    }
                                }
                            }
                            else
                            {
                                console.log('isAPNSResponsePlayRequest Value = '+isAPNSResponsePlayRequest);// Comment this line
                                //TODO Comment this socket code - This is only for testing purpose
                                var main_user_ = user_name;//resJSON["MainUser"].fb_id;
                                var mainSocket_ = findSocket(main_user_, io.sockets.connected);
                                                    if (mainSocket_) {
                                                        mainSocket_.emit('message_user_found', response_to_user);//, 'dwindle-any-user'
                                                    }
                                //End
                                console.log('APNS response play request user_name : '+user_name+' chatUser2 : ' + response_to_user); //  comment this line - anas
                                var userSocket = findSocket(response_to_user, io.sockets.connected);
                                if (userSocket) {
                                     console.log("APNS response  - socket Connected - mainUserName = " + mainUserName);
                                    //isBothUserCriteriaMatch(response_to_user, user_name,mainUserName);// username replacce with user_name -  anas - 9 Oct 2015
                                                    sec_user['fb_id'] = response_to_user;
                                                    console.log("Name: "+mainUserName);
                                                    if(mainUserName){
                                                        var secondUsrFullName=mainUserName.split(" ");
                                                        sec_user['user_name']=secondUsrFullName[0];
                                                    }
                                                    else{
                                                        sec_user['user_name']="";
                                                    }
                                                    getChatUsersPicturesName(sec_user, user_name);
                                }
                                else
                                {
                                    console.log('APNS response play request - chatUser2 socket not found.'); //  comment this line - anas
                                }

                                isAPNSResponsePlayRequest = false;//Fixing through APNS flag true application start chatting with same user -- anas 12 dec 12
                            }
                            //End !isAPNSResponsePlayRequest check

                        }
                        else
                        {

                            //start - handle if no user found w.r.t preferences against APNs request  -  19 sep 2015 - anas
                            console.log('isAPNSResponsePlayRequest Value = '+isAPNSResponsePlayRequest);// Comment this line
                            if(isAPNSResponsePlayRequest === true)
                            {
                                console.log('No user exist against APNS response play request.'); //  comment this line - anas

                                //TODO Comment this socket code - This is only for testing purpose
                            var main_user_ = user_name;//resJSON["MainUser"].fb_id;
                                var mainSocket_ = findSocket(main_user_, io.sockets.connected);
                                                    if (mainSocket_) {
                                                        mainSocket_.emit('message_user_found', response_to_user);//, 'dwindle-any-user'
                                                    }
                                //End
                                console.log('APNS response play request user_name : '+user_name+' chatUser2 : ' + response_to_user); //  comment this line - anas
                                
                                var userSocket = findSocket(response_to_user, io.sockets.connected);
                                if (userSocket) {
                                    console.log("APNS response  - socket Connected - mainUserName = " + mainUserName);
                                    //isBothUserCriteriaMatch(response_to_user, user_name,mainUserName);// username replacce with user_name -  anas - 9 Oct 2015
                                                    sec_user['fb_id'] = response_to_user;
                                                    console.log("Name: "+mainUserName);
                                                    if(mainUserName){
                                                        var secondUsrFullName=mainUserName.split(" ");
                                                        sec_user['user_name']=secondUsrFullName[0];
                                                    }
                                                    else{
                                                        sec_user['user_name']="";
                                                    }
                                                    getChatUsersPicturesName(sec_user, user_name);
                                }
                                else
                                {
                                    console.log('APNS response play request - chatUser2 socket not found.'); //  comment this line - anas
                                }

                                isAPNSResponsePlayRequest = false;//Fixing through APNS flag true application start chatting with same user -- anas 12 dec 12
                            }
                            //End
                            else
                            {
                                //console.log('dwindle - message - play -> message_not_found event fired');
                                if (mainSocket) {
                                    mainSocket.emit('message_not_found', 'Event : message_not_found         Message : Sorry, No user found.');//, 'dwindle-any-user'
                                }
                            }
                        }
                    }else{
                        console.log('Error in distance query'); // anas
                        //sqlConnection.closeConnection(connection);
                    }

                });// Preferences query Call - End

            }; // End of FindUserAccordingToCriteria Function

            var isBothUserCriteriaMatch = function (secondUser, firstUser,secUser_Name) {
                //var sec_user = new Object();
                console.log("inside both user criteria Match");
                var query = "select X(us.location) X,Y(us.location)Y, up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up";
                query += " where us.user_id='" + secondUser + "' and up.user_name ='" + secondUser + "'";
                //console.log("Select second user query "+query);
                connection.query(query, function (err, rows, fields) {
                    var main_user = new Object();
                    main_user['fb_id'] = user_name;// username replace with user_name - anas - 9 Oct 2015
                    var userRequirement = {};
                    if (!err) {

                        if (rows.length > 0) {
                            userRequirement['Required_Gender'] = rows[0].req_gender;
                            userRequirement['Required_From_Age'] = rows[0].req_from_age;
                            userRequirement['Required_To_Age'] = rows[0].req_to_age;
                            userRequirement['Distance'] = rows[0].distance;
                            userRequirement['Lat'] = rows[0].Y;
                            userRequirement['Lon'] = rows[0].X;
                            var query = "Select user_id, (ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + userRequirement['Lat'] + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + userRequirement['Lat'] + "))*COS(RADIANS(X(location)- " + userRequirement['Lon'] + ")) ) * 6371)/1.60934 distance";
                            query += " FROM users, user_status";
                            query += " WHERE user_name = user_id and user_name = '" + firstUser + "'  and gender ='" + userRequirement['Required_Gender'] + "' ";// TODO-Imp 
                            query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                            query += " and `status` = 'play' OR `status` = '"+status_loggedIn+"'";// OR `status` = '"+status_loggedIn+"'"//"previously :  and `status` = 'play'";  - Query updated - anas - 9 oct 2015
                            query += " HAVING distance <" + userRequirement['Distance'];
                            query += " ORDER BY distance";
                            console.log("Criteria query : "+query);
                            sync = true;
                            var user_list = new Array();
                            connection.query(query, function (err, rows, fields) {
                                if (!err) {
                                    console.log(rows.length);

                                    if (rows.length > 0) {
                                        var query ="select * from blocked_user where (blocked_user_id='"+secondUser+"' and user_id='"+firstUser+"') or (blocked_user_id='"+firstUser+"' and user_id='"+secondUser+"')";
                                        console.log("Blocked Query : "+ query);
                                        connection.query(query,function(err,rows,field){
                                            if (rows.length === 0) {
                                                console.log(secondUser);
                                                //var userSocket = findSocket(secondUser, io.sockets.connected);
                                                //if (userSocket) {
                                                    //console.log("socket Connected");
                                                    sec_user['fb_id'] = secondUser;
                                                    console.log("Name: "+secUser_Name);
                                                    if(secUser_Name){
                                                        var secondUsrFullName=secUser_Name.split(" ");
                                                        sec_user['user_name']=secondUsrFullName[0];
                                                    }
                                                    else{
                                                        sec_user['user_name']="";
                                                    }
//                                               console.log(sec_user + " Matched");
                                                    getChatUsersPicturesName(sec_user, firstUser);
                                               // }

                                            }
                                        });

                                    } else {
                                        console.log(sec_user + " didnt matched");
                                    }
                                }
                            });

                        }
                    }else{
                        //sqlConnection.closeConnection(connection);
                    }
                });


            }; //End of isBothUserCriteriaMatch function

            var getChatUsersPicturesName = function (sec_user,firstUser) {
                              console.log("inside getting Second user picture...");
                var query = "Select * from user_pics where user_name='" + sec_user['fb_id'] + "'";
                //console.log(query);
                var usrJson = findUserJSon(socket.username);

                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        var path = pic_path1 + pic_path + sec_user['fb_id'] + "/" + rows[0].pic_name;
                        sec_user['pic_name'] = rows[0].pic_name;
                        sec_user['pic_path'] = path;
                        result_json['SecondUser'] = sec_user;
                        usrJson.SecondUser.push(sec_user);
//                        console.log(JSON.stringify(usrJson));
                        //result_json1['SecondUser'] = sec_user;
                        getOtherUserPicInfo(sec_user['fb_id'],firstUser,userRequirement['Required_Gender']);
                    }else{
                        //sqlConnection.closeConnection(connection);
                    }


                });

            }; //End of getChatUsersPicturesName function

            var getOtherUserPicInfo = function (secUsr,firstUsr,usrReqGender) {
//                console.log("FU: "+firstUsr+" SU: "+secUsr);
                var other_users = new Array();
                var selectedUsr= findUserCheck(firstUsr);
//                var query = "Select DISTINCT(u.user_name) un, pic_name, pic_path from users u,user_pics up where u.user_name = up.user_name and u.gender = 'F'";
//                var query = "Select DISTINCT(u.user_name) un, pic_name, pic_path from users u,user_pics up where u.user_name = up.user_name and u.gender = 'Female' and u.user_name!='"+secUsr+"' and u.user_name!='"+firstUsr+"'";
                var query = "Select DISTINCT(u.user_name) un, pic_name, pic_path from users u,user_pics up where u.user_name = up.user_name and u.gender = '"+usrReqGender+"' and u.user_name!='"+secUsr+"' and u.user_name!='"+firstUsr+"'";
                query += " GROUP BY u.user_name";
                query += " ORDER BY RAND() LIMIT 4";
                //console.log(query);
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        var count=1;
                        for (var i in rows) {
                            if(count<=4){
                                var path = pic_path1 + pic_path + rows[i].un + "/" + rows[i].pic_name;
                                var user = new Object();
                                user['pic_name']=rows[i].pic_name;
                                user['fb_id'] = rows[i].un;
                                user['pic_path'] = path;
                                other_users.push(user);

                            }
                            count=count+1;
                        }
                        //console.log(JSON.stringify(other_users));
//                        console.log(firstUserBoolean);
                        if(firstUserBoolean){
                            funAddFirstUserInJSON(secUsr,firstUsr,other_users,function(jRes){
                            });
                        }
                        else{
                            funAddSecondUserInJSON(secUsr,firstUsr,other_users,function(jRes){
                            });
                        }



                    }else{
                        //sqlConnection.closeConnection(connection);
                    }
                });
            }; //End of getOtherUserPicInfo function

            var funAddSecondUserInJSON= function(secUsr,firstUsr,other_users,callback){
                //console.log(JSON.stringify(other_users));
                var usrJSON=findUserJSon(secUsr);
                if(usrJSON){
                    usrJSON.SecondUser.push(result_json['MainUser']);
                    usrJSON.OtherUsers.push(other_users);
                    var resJSON= new Object();
                    resJSON["MainUser"]=usrJSON.MainUser[0];
                    resJSON["SecondUser"]=usrJSON.SecondUser[0];
                    resJSON["OtherUsers"]=usrJSON.OtherUsers[0];
                    var roomname = result_json['MainUser'].fb_id+"-"+result_json['SecondUser'].fb_id;
                    resJSON["RoomName"]=roomname;
                    var main_user = resJSON["MainUser"].fb_id;
                    var mainSocket = findSocket(main_user, io.sockets.connected);
                    if (mainSocket) {
                        funAddUsersInfoToDB(1, main_user, resJSON, function (query_response) {
//                                        console.log(JSON.stringify(resJSON));
                            if (query_response === 'Success') {
                                mainSocket.emit('startgame', JSON.stringify(resJSON));
                            }
                        });
                    }
                }
                else {
                    var resJson = {username: result_json['SecondUser'].fb_id, MainUser: [], SecondUser: [], OtherUsers: []};
                    res_json.push(resJson);
                    var usrJSON=findUserJSon(secUsr);
                    var main_user1=new Object();
                    var query = "select u.name,up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up, users u";
                    query += " where us.user_id='" + secUsr + "' and up.user_name ='" + secUsr + "' limit 1";
                    connection.query(query, function (err, rows, fields) {
                        main_user1['fb_id'] = secUsr;
                        if (!err) {
                            for (var i in rows) {
                                userRequirement['Required_Gender'] = rows[i].req_gender;
                                userRequirement['Required_From_Age'] = rows[i].req_from_age;
                                userRequirement['Required_To_Age'] = rows[i].req_to_age;
                                userRequirement['Distance'] = rows[i].distance;

                                var path = pic_path1 + pic_path + main_user1['fb_id'] + "/" + rows[i].pic_name;
                                if(rows[i].name){
                                    var usrName=rows[i].name;
                                    var usrNamArr=usrName.split(" ");
                                    main_user1['user_name']=usrNamArr[0];
                                }
                                else{
                                    main_user1['user_name']="";
                                }
                                main_user1['pic_name'] = rows[i].pic_name;
                                main_user1['pic_path'] = path;
                                //result_json['MainUser'] = main_user;

                            }
                            usrJSON.MainUser.push(main_user1);
                        }
                        usrJSON.SecondUser.push(result_json['MainUser']);
                        usrJSON.OtherUsers.push(other_users);
                        var resJSON = new Object();
                        resJSON["MainUser"] = usrJSON.MainUser[0];
                        resJSON["SecondUser"] = usrJSON.SecondUser[0];
                        resJSON["OtherUsers"] = usrJSON.OtherUsers[0];
                        var roomname = result_json['MainUser'].fb_id + "-" + result_json['SecondUser'].fb_id;
                        resJSON["RoomName"] = roomname;
                        var main_user = resJSON["MainUser"].fb_id;
                        var mainSocket = findSocket(main_user, io.sockets.connected);
                        if (mainSocket) {
                            funAddUsersInfoToDB(1, main_user, resJSON, function (query_response) {
//                                        console.log(JSON.stringify(resJSON));
                                if (query_response === 'Success') {
                                    mainSocket.emit('startgame', JSON.stringify(resJSON));
                                }
                            });
                        }
                    });
                }
            };

            var funAddFirstUserInJSON=function(secUsr,firstUsr,other_users,callback){
//                console.log("FiU: "+JSON.stringify(other_users));
                var usrJSON=findUserJSon(firstUsr);
                usrJSON.OtherUsers.push(other_users);
//                console.log("FIRST USER: "+JSON.stringify(result_json));
                var resJSON= new Object();
                usrJSON=findUserJSon(result_json['MainUser'].fb_id);
                resJSON["MainUser"]=usrJSON.MainUser[0];
                resJSON["SecondUser"]=usrJSON.SecondUser[0];
                resJSON["OtherUsers"]=usrJSON.OtherUsers[0];
                var roomname = result_json['MainUser'].fb_id+"-"+result_json['SecondUser'].fb_id;
                resJSON["RoomName"]=roomname;

                var room = {name: roomname,userCount: 6, chatCount: 0, status: false, pic_count: 0, users: [],dwindleCount:0};
                rooms.push(room);
                result_json["RoomName"] = roomname;
                funAddChatUserToDB(1,result_json,other_users,function(resp) {
                    if (resp === 'Success') {
                        var main_user = resJSON["MainUser"].fb_id;
                        var mainSocket = findSocket(main_user, io.sockets.connected);
                        if (mainSocket) {
                            funAddUsersInfoToDB(1, main_user, resJSON, function (query_response) {
//                                        console.log(JSON.stringify(resJSON));
                                if (query_response === 'Success') {
                                    firstUserBoolean=false;
                                    //console.log(JSON.stringify(resJSON));
                                    mainSocket.emit('startgame', JSON.stringify(resJSON));
                                    getSecondUserReqGender(secUsr,function(callBackRes){
                                        getOtherUserPicInfo(secUsr,firstUsr,callBackRes);
                                    });
                                }
                            });
                        }
                    }
                });

            };
            var getSecondUserReqGender=function(usrName,cback){
                if(connection===null){
                    connection=sqlConnection.handleDisconnect();
                }
                var usr_req_gender="";
                secUserJson=new Object();
                var sql = "select us.req_gender,up.pic_name from user_status us,user_pics up where us.user_id='"+usrName+"' and us.user_id=up.user_name";
                connection.query(sql, function (err, rows, fields) {
                    if (!err) {
                        if (rows.length > 0) {
                            var path = pic_path1 + pic_path + usrName + "/" + rows[0].pic_name;
                            usr_req_gender= rows[0].req_gender;
                            secUserJson['pic_name']=rows[0].pic_name;
                            secUserJson['fb_id']=usrName;
                            secUserJson['pic_path']=path;
                        }
                        cback(usr_req_gender);
                    }
                });
            };
            var funAddChatUserToDB= function(rec,result_json,other_users,cb){
                if(connection===null){
                    connection=sqlConnection.handleDisconnect();
                }
                var query="select * from chat_room where room='"+result_json['RoomName']+"'";
                //              console.log(query);
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        if (rows.length > 0) {
                            for (var i = 0; i < other_users.length; i++) {
                                funAddOtherUserToDB(i,other_users,result_json,function(strSuccess){

                                    cb('Success');

                                });
                            }
                        }
                        else{
                            var query = "insert into chat_room(chatroom,user2,user_name,room) values('"+result_json['MainUser'].fb_id+"&"+result_json['MainUser'].pic_name+"','"+result_json['SecondUser'].fb_id+"&"+result_json['SecondUser'].pic_name+"','"+result_json['MainUser'].fb_id+"','"+result_json['RoomName']+"')";
                            connection.query(query,function(err1,result1) {
                                if (!err1) {
                                    for (var i = 0; i < other_users.length; i++) {
                                        funAddOtherUserToDB(i,other_users,result_json,function(strSuccess){
                                            cb('Success');
                                        });
                                    }
                                }
                                else {
                                    sqlConnection.closeConnection(connection);
                                }
                            });
                        }
                    }
                    else{
                        sqlConnection.closeConnection(connection);
                    }
                });

            }; //End of funAddChatUserToDB function
            var funAddOtherUserToDB = function(r,other_user,result_json,cb){
                if(connection===null){
                    connection=sqlConnection.handleDisconnect();
                }
                var a=r+1;
                var query = "update chat_room SET OtherUser"+a+"='"+other_user[r].fb_id+"&"+other_user[r].pic_name+"' where user_name='"+result_json['MainUser'].fb_id+"' and room='"+result_json['RoomName']+"'";
                connection.query(query,function(err1,result1){
                    if(!err1){
                        if(r === 3){
                            cb('Updated');
                        }
                    }
                });
            };// End of funAddOtherUserToDB function

        socket.on('addUser', function (roomname,mainusername){// TODO - mainusername added - anas - 11 Oct 2015) 


            var username = socket.username;
//            console.log("User: " + socket.username + " With: " + roomname);
            var room1 = findRoom(roomname,rooms);
            var user = {name:socket.username, chatCount:0};
            if (room1) {
                room1.users.push(user);
                socket.room = roomname;
                socket.join(roomname);
//                console.log(socket.username+" connected to "+roomname);
                setUserPlayStatus(1,socket.username,function(res){
                    io.sockets.in(socket.room).emit('updatechat', 'SERVER:', username + ' Connected to ' + roomname);
                    //socket.emit('updaterooms', rooms, roomname);

                });

                // start - throw in app notification if user press back after play and mean while second user got connected ---  anas - 11 Oct 2015
                var roomName = roomname;
                var isToUserInPlayScreen = false;
                if(roomName)
                        {
                            console.log('roomName : '+roomName);
                            var usersSocketIds = Object.keys(io.sockets.adapter.rooms[roomName]);
                            var usersAttendingInRoom = _.map(usersSocketIds, function(socketClientId){
        //                        console.log(socketClientId);
                                return io.sockets.connected[socketClientId]
                            });

                            for(var i=0;i<usersAttendingInRoom.length;i++){
                                    if(usersAttendingInRoom[i].username===mainusername){
                                        console.log('Main User : '+usersAttendingInRoom[i].username+' is within Play screen');
                                        isToUserInPlayScreen = true;
                                    }
                            }
                        }
                        else
                        {
                          console.log('Play Screen - No room created yet.');// comment this line
                        }

                if(isToUserInPlayScreen == false)
                {
                    var fromUser = socket.username; // Fixing formuser not found issue -- 12 dec 2015 // TODO-Imp
                    var toUserName = mainusername;
                    var mainSocket = findSocket(toUserName, io.sockets.connected);
                    //console.log('Play Screen - mainSocket = '+ mainSocket.username+' to_username = ' + toUserName);// comment this line
                            if (mainSocket) {
                                mainSocket.emit('message_game_started', 'Event : message_game_started ----------- Message : Game Started ',fromUser,'PlayScreen');
                            }
                            else 
                            {
                                console.log('send push notification if user press back or quite the app.');
                                /*
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

                                                    var to_user = toUserName;
                                                    var _fromUser = username;

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
                                                        console.log("Press back APNS - OnjID: "+UserObjID);
                                                        var query = new Parse.Query(Parse.Installation)
                                                            , parser_data = {
                                                                "alert": _fromUser+": Test Push notication from 'Play'",//+data 
                                                                "anotherObjectId": "", // extra data to send to the phone.
                                                                "sound": "cheering.caf" // default ios sound.
                                                            };
                                                        query.equalTo("user", {"objectId": UserObjID /* a user object id *//*TODO, "className": "_User", "__type": "Pointer"}); // me.
                                                        query.equalTo("deviceType", "ios");
                                                        ///* TODO uncomment this code
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
                                                        });//
                                                    }

                                                    //Insert push notification detail in db - 15 Sep 2015 
                                                    //addPushNotificationRecordInDB(from_user,to_user,fullDateTime);

                                                if (mainSocket) {// TODO remove - username,userLat,userLon - if these info will provided through IOS end
                                                    mainSocket.emit('message_user_loggedOff', 'User gone offline.');// TODO -remove user_name,user_Lat,user_Lon,  and  offline_user_list, from_user, currentDateTime remove these attributes for production - 14 Sep 2015                    
                                                }
                                            },
                                            error: function() {
                                                        console.error("Play - Parser Error : User object lookup failed");
                                                        if (mainSocket) {
                                                            mainSocket.emit('message_push_notification_Error', 'There is problem in sending push notification.Parser Error : User object lookup failed');          
                                                        }
                                                    }
                                            });//End of query.find*/

                            }
                }
                //end - anas - 11 Oct 2015
            }else{
                console.log("room not found..." + username);
            }
        }); // end of addUser event...

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
            console.log('sendchat - socket.room '+socket.room);//Comment this line
            var room = findChatRoom(socket.room);
            //console.log(room.chatCount);
            room.chatCount = parseInt(room.chatCount)+1;
            var us= room.users;
            if(us){
                var mainUser=findUserInRoom(room,us[1].name);
                var user = findUserInRoom(room,us[0].name);
            }
            if(user.name===socket.username){
                user.chatCount = parseInt(user.chatCount)+1;
            }

            if(mainUser.name===socket.username){
                mainUser.chatCount=parseInt(mainUser.chatCount)+1;
            }
            var fromUser = socket.username;
            var toUser = findToUser(room, fromUser);

            // start - throw in app notification if user is not on screen but available online ---  anas - 8 Oct 2015
            var roomName = socket.room;
            var isToUserInPlayScreen = false;
            if(roomName)
                    {
                        var usersSocketIds = Object.keys(io.sockets.adapter.rooms[roomName]);
                        var usersAttendingInRoom = _.map(usersSocketIds, function(socketClientId){
    //                        console.log(socketClientId);
                            return io.sockets.connected[socketClientId]
                        });

                        for(var i=0;i<usersAttendingInRoom.length;i++){
                                if(usersAttendingInRoom[i].username===toUser){
                                    console.log('Second User : '+usersAttendingInRoom[i].username+' is within Play screen');
                                    isToUserInPlayScreen = true;
                                }
                        }
                    }
                    else
                    {
                      console.log('Play Screen - No room created yet.');// comment this line
                    }

            if(isToUserInPlayScreen == false)
            {
                
                var toUserName = toUser;
                var mainSocket = findSocket(toUserName, io.sockets.connected);
                        if (mainSocket) {
                          console.log('Play Screen - mainSocket = '+ mainSocket.username+' to_username = ' + toUserName);// comment this line
                            console.log('Play Screen - within main socket check -- it mean user socket exist.');
                            mainSocket.emit('message_from_play_screen', 'Event : message_from_play_screen           Message : ' + data, fromUser, 'PlayScreen');// TODO-Imp =  remove 'Event : message_from_play_screen           Message : ' +
                        };
            }
            //end - anas - 8 Oct 2015


            msgStatus='read';

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

            var strChatRoom=socket.room+"1";
            io.sockets.in(socket.room).emit('updatechat', socket.username , data);
            var secondChatUser = "";
            if (room.userCount > 2) {
                if (connection == null) {
                    connection = sqlConnection.handleDisconnect();
                }
                insertChatHistory(1,fromUser,toUser,data,fullDate,fullTime,'read',socket.room,function(qres) {
                    if (room.dwindleCount === 0) {
                        if (room.chatCount >= 6 && user.chatCount >= 2 && mainUser.chatCount >= 2) {
                            room.dwindleCount = parseInt(room.dwindleCount) + 1;
                            room.userCount = parseInt(room.userCount) - 1;
                            var pc=room.pic_count;
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount,pc);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount,pc);
                            room.pic_count = parseInt(room.pic_count) + 1;

                        }
                    }
                    else if (room.dwindleCount === 1) {
                        if (room.chatCount >= 8 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            room.dwindleCount = parseInt(room.dwindleCount) + 1;
                            room.userCount = parseInt(room.userCount) - 1;
                            var pc=room.pic_count;
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount,pc);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount,pc);
                            room.pic_count = parseInt(room.pic_count) + 1;
                        }
                    }
                    else if (room.dwindleCount === 2) {
                        if (room.chatCount >= 8 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            room.dwindleCount = parseInt(room.dwindleCount) + 1;
                            room.userCount = parseInt(room.userCount) - 1;
                            var pc=room.pic_count;
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount,pc);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount,pc);
                            room.pic_count = parseInt(room.pic_count) + 1;
                        }
                    }
                    else if (room.dwindleCount === 3) {
//                        if (room.chatCount=== 9 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
//
//                        }
                        if (room.chatCount >= 10 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus,strChatRoom ,function (getResult) {
                                copyChatHistory(1,socket.room,function(cRes){

                                });
                                room.dwindleCount = parseInt(room.dwindleCount) + 1;
                                room.userCount = parseInt(room.userCount) - 1;
                                var pc=room.pic_count;
                                funDwindleDown(room, mainUser,room.dwindleCount,room.userCount,pc);
                                funDwindleDown2(room, user,room.dwindleCount,room.userCount,pc);
                                room.pic_count = parseInt(room.pic_count) + 1;
                                var fromUser = socket.username;
                                var toUser = findToUser(room, fromUser);
                                var strChatRoom=socket.room+"1";
                                blockUsers(1,fromUser,toUser,function(cRes){
//                                console.log(cRes);
                                });
                            });

                        }

                    }


                });
            }
            else if (room.userCount === 2) {

                var fromUser = socket.username;
                var toUser = findToUser(room, fromUser);
                var c = parseInt(room.pic_count);
                var userPicInfo = new Object();
//                if (c < 4) {
////                        console.log("Inside C: "+c);
//                    room.dwindleCount= parseInt(room.dwindleCount)+1;
//                    var userJson = new Object();
//                    var picCount = parseInt(room.pic_count) + 1;
//                    room.pic_count = parseInt(room.pic_count) + 1;
//
//                    var dir = save_directory + fromUser;
//                    var dir1 = pic_path1 + pic_path + fromUser;
//                    var files = fs.readdirSync(dir);
//                    var pic_Name = dir1 + '/' + files[picCount];
//
//                    userJson["fb_id"] = fromUser;
//                    userJson['pic_path'] = pic_Name;
//                    userPicInfo['User1'] = userJson;
//
//                    var dir = save_directory + toUser;
//                    var dir1 = pic_path1 + pic_path + toUser;
//                    var files = fs.readdirSync(dir);
//                    var pic_Name = dir1 + '/' + files[picCount];
//                    userJson["fb_id"] = toUser;
//                    userJson['pic_path'] = pic_Name;
//                    userPicInfo['User2'] = userJson;
//                    var dwindle_down= new Object();
//                    dwindle_down['DwindleDown']= userPicInfo;
//                    room.chatCount = 0;
//                    fromUser.chatCount = 0;
//                    toUser.chatCount = 0;
//                    room.dwindleCount=0;
//                    io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));
//
//                }

                insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus,strChatRoom,function (getResult) {
                });
            }
//            }

        }); //End of socket.on sendchat
        var funDwindleDown=function(room,mainUser,dwindleCount,roomUserCount,picCount){
            var userChatVal = parseInt(roomUserCount);
            userChatVal = userChatVal - 1;
            getOtherUserNamesFromDB(1, userChatVal, room.name,mainUser.name ,function (otherUserVal) {
                var fadedUser = new Object();
                fadedUser['fb_id'] = otherUserVal.name;

                updateChatRoomTable(1, userChatVal, room.name,mainUser.name ,function (userUpdated) {
//                    console.log(mainUser.name);
                    getOldUserPicInfo(1, room.name,mainUser.name, function (userInfo) {
//                        console.log(JSON.stringify(userInfo));
                        var userPicInfo = new Object();
                        var other_Users = new Array();
                        userPicInfo['DeletedUser'] = fadedUser;
                        userPicInfo['DwindleCount'] = dwindleCount;
                        picCount=parseInt(picCount)+1;
                        var user1 = userInfo['User1'];
                        if (user1 != "NULL") {
                            var mainUser1 = new Object();
                            var dir = save_directory + user1;
                            var dir1 = pic_path1 + pic_path + user1;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            mainUser1["fb_id"] = user1;
                            mainUser1['pic_path'] = pic_Name;
                            userPicInfo["User1"] = mainUser1;
                        }
                        var strUser = userInfo['User2'];
                        if (strUser != "NULL") {
                            var secondUser = new Object();
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            secondUser["fb_id"] = strUser;
                            secondUser['pic_path'] = pic_Name;
                            userPicInfo["User2"] = secondUser;
                        }
                        var strUser = userInfo['OtherUser1'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
//                            console.log(dir);
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson1 = new Object();
                            userJson1["fb_id"] = strUser;
                            userJson1['pic_path'] = pic_Name;
                            userPicInfo["OtherUser1"] = userJson1;
                        }
                        var strUser = userInfo['OtherUser2'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson2 = new Object();
                            userJson2["fb_id"] = strUser;
                            userJson2['pic_path'] = pic_Name;
                            userPicInfo["OtherUser2"] = userJson2;
                        }
                        var strUser = userInfo['OtherUser3'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson3 = new Object();
                            userJson3["fb_id"] = strUser;
                            userJson3['pic_path'] = pic_Name;
                            userPicInfo["OtherUser3"] = userJson3;
                        }
                        var strUser = userInfo['OtherUser4'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson4 = new Object();
                            userJson4["fb_id"] = strUser;
                            userJson4['pic_path'] = pic_Name;
                            userPicInfo["OtherUser4"] = userJson4;
                        }
                        var dwindle_down = new Object();
                        dwindle_down['DwindleDown'] = userPicInfo;
                        var usrSocket = findSocket(mainUser.name,io.sockets.connected);
                        if(usrSocket){
                            usrSocket.emit('dwindledown', JSON.stringify(dwindle_down));
                        }

                        room.chatCount = 0;
                        user.chatCount = 0;
                        mainUser.chatCount = 0;

                    });
                });


            });
        };

        var funDwindleDown2=function(room,mainUser,dwindleCount,roomUserCount,picCount){

            var userChatVal = parseInt(roomUserCount);
            userChatVal = userChatVal - 1;
            getOtherUserNamesFromDB(1, userChatVal, room.name,mainUser.name ,function (otherUserVal) {
                //emiting to client the username to be faded..
                var fadedUser = new Object();
                fadedUser['fb_id'] = otherUserVal.name;

                //io.sockets.emit('deleteuser', otherUserVal.name);
                //updateChatRoomTable(1, userChatVal, room.name, function (userUpdated) {
                updateChatRoomTable(1, userChatVal, room.name,mainUser.name ,function (userUpdated) {
//                    console.log(mainUser.name);
                    getOldUserPicInfo(1, room.name,mainUser.name, function (userInfo) {
//                        console.log(JSON.stringify(userInfo));
                        var userPicInfo = new Object();
                        var other_Users = new Array();
                        userPicInfo['DeletedUser'] = fadedUser;
                        userPicInfo['DwindleCount'] = dwindleCount;
                        picCount=parseInt(picCount)+1;
                        var user1 = userInfo['User1'];
                        if (user1 != "NULL") {
                            var mainUser1 = new Object();
                            var dir = save_directory + user1;
                            var dir1 = pic_path1 + pic_path + user1;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            mainUser1["fb_id"] = user1;
                            mainUser1['pic_path'] = pic_Name;
                            userPicInfo["User1"] = mainUser1;
                        }
                        var strUser = userInfo['User2'];
                        if (strUser != "NULL") {
                            var secondUser = new Object();
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            secondUser["fb_id"] = strUser;
                            secondUser['pic_path'] = pic_Name;
                            userPicInfo["User2"] = secondUser;
                        }
                        var strUser = userInfo['OtherUser1'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson1 = new Object();
                            userJson1["fb_id"] = strUser;
                            userJson1['pic_path'] = pic_Name;
                            userPicInfo["OtherUser1"] = userJson1;
                        }
                        var strUser = userInfo['OtherUser2'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson2 = new Object();
                            userJson2["fb_id"] = strUser;
                            userJson2['pic_path'] = pic_Name;
                            userPicInfo["OtherUser2"] = userJson2;
                        }
                        var strUser = userInfo['OtherUser3'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson3 = new Object();
                            userJson3["fb_id"] = strUser;
                            userJson3['pic_path'] = pic_Name;
                            userPicInfo["OtherUser3"] = userJson3;
                        }
                        var strUser = userInfo['OtherUser4'];
                        if (strUser != "NULL") {
                            var dir = save_directory + strUser;
                            var dir1 = pic_path1 + pic_path + strUser;
                            var files = fs.readdirSync(dir);
                            var pic_Name = dir1 + '/' + files[picCount];
                            var userJson4 = new Object();
                            userJson4["fb_id"] = strUser;
                            userJson4['pic_path'] = pic_Name;
                            userPicInfo["OtherUser4"] = userJson4;
                        }
                        var dwindle_down = new Object();
                        dwindle_down['DwindleDown'] = userPicInfo;
                        var usrSocket = findSocket(mainUser.name,io.sockets.connected);
                        if(usrSocket){
                            usrSocket.emit('dwindledown', JSON.stringify(dwindle_down));
                        }
                        //io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));
//                                            io.sockets.in(socket.room).emit('adduserspic', JSON.stringify(userPicInfo));
                        room.chatCount = 0;
                        user.chatCount = 0;
                        mainUser.chatCount = 0;

                    });
                });


            });
        };

        socket.on('skip',function(){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var room = findChatRoom(socket.room);
            if(room){
                var us = room.users;
                var blockedUsr="";
                var skipUser=socket.username;
                for(var i=0;i<us.length;i++){
                    if(us[i].name!=skipUser){
                        blockedUsr=us[i].name;
                    }
                }
                var sql= "insert into blocked_user(blocked_user_id,user_id) values('"+blockedUsr+"','"+skipUser+"')";
                connection.query(sql, function (err1, result1) {
                    if (!err1) {
                        var strSql="update user_status SET";
                        strSql=strSql+" status=CASE WHEN user_id='"+blockedUsr+"' THEN 'play' ELSE 'play' END";
                        strSql=strSql+" where user_id IN('"+blockedUsr+"','"+skipUser+"')";
//                        console.log(strSql);
                        connection.query(strSql, function (err1, result1) {
                            if(!err1){
                                funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
                                    var us = room.users;
                                    var mainUser = findUserInRoom(room, us[1].name);
                                    var user = findUserInRoom(room, us[0].name);
                                    room.chatCount = 0;
                                    user.chatCount = 0;
                                    mainUser.chatCount = 0;
                                    room.dwindleCount= 0;

                                    console.log("Skipped-- Socket User: "+socket.username+", BlockedUser: "+blockedUsr);
                                    deleteUserFromJsonDB(1,socket.room,socket.username,function(d_response){

                                    });

                                    deleteUserFromJson(1, socket.room, blockedUsr, function (d_response) {

                                    });
                                });

                            }
                            deleteChatHistory(1,socket.room, function(cres){

                            });


                        });

                    }

                });
                var othSocket = findSocket(blockedUsr,io.sockets.connected);
                if(othSocket){
                    othSocket.emit('skipchat',socket.username,'skipped the chat');
                }

                //socket.leave(socket.room);
                //othSocket.leave(socket.room);
            }


        }); //End of Skip Event
        socket.on('restartGamePlay', function () {
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var sql = "update user_status set status = 'play' where user_id='" + socket.username + "'";
            connection.query(sql, function (sqlerr, result) {
                if (!sqlerr) {
                    delete usernames[socket.username];
                    var room = findChatRoom(socket.room);
                    if(room){
                        console.log("Restart Play");
                        var othUsr='';
                        var us = room.users;
                        if(us){
                            if(us[0].name){
                                console.log("U1: "+us[0].name);
                                othUsr=us[0].name;
                            }
                            if(othUsr===socket.username){
                                if(us[1].name){
                                    console.log("U2: "+us[1].name);
                                    othUsr=us[1].name;
                                }

                            }
                            updateOtherUserStatus(othUsr,function(strResult){
                                funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
                                    deleteUserFromJsonDB(1,socket.room,socket.username,function(d_response){
                                        //console.log(d_response);
                                        var mainUser = findUserInRoom(room, socket.username);
                                        mainUser.chatCount = 0;
                                        deleteUserFromJson(1,socket.room,othUsr,function(d_response){
                                            //console.log(d_response);
                                            var user = findUserInRoom(room, othUsr);
                                            user.chatCount = 0;

                                            if(room.chatCount){
                                                room.chatCount = 0;
                                            }
                                            if(room.dwindleCount){
                                                room.dwindleCount= 0;
                                            }
                                            deleteChatHistory(1,socket.room, function(cres){


                                            });
                                            var otherUser_soc = findSocket(othUsr, io.sockets.connected);
                                            var user_soc = findSocket(socket.username, io.sockets.connected);
                                            if(otherUser_soc){
                                                otherUser_soc.leave(socket.room);
                                                otherUser_soc.disconnect();
                                            }
                                            if(user_soc){
                                                user_soc.leave(socket.room);
                                            }
                                            delete usernames[othUsr];
                                            delete usernames[socket.username];
                                            delete rooms[room];
                                        });

                                    });

                                });
                            });
                        }

                    }

                }
            });


        });//End of restartGamePlay

        socket.on('disconnect',function(){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            // 11 Oct 2015 - anas - changes user status - 'loggedoff'
            var sql = "update user_status set status = 'loggedoff' where user_id='" + socket.username + "'";
            connection.query(sql, function (sqlerr, result) {
                if (sqlerr) {
                    function_result = "user not found";
                    console.log(function_result);
                    response_JSON = {
                        signin_status: function_result
                    };
                }
                delete usernames[socket.username];
            });
            var othUsr='';
            var room = findChatRoom(socket.room);
            if(room){
                var us = room.users;
                if(us){
                    if(us[0].name){
                        console.log("U1: "+us[0].name);
                        othUsr=us[0].name;
                    }
                    if(othUsr===socket.username){
                        if(us[1].name){
                            console.log("U2: "+us[1].name);
                            othUsr=us[1].name;
                        }

                    }

                }

                updateOtherUserStatus(othUsr,function(strResult){

                    /* if(room.dwindleCount){
                     console.log(room.dwindleCount);
                     if(room.dwindleCount===4){

                     }
                     else{
                     io.sockets.in(socket.room).emit('updatechat', socket.username,socket.username+ " disconnected from room ");
                     }
                     }*/

                    funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
                        var us = room.users;
                        if(us){
                            if(us[0].name){
                                if(socket.username===us[0].name){

                                    othUser=us[1].name
                                }
                                else{
                                    othUser=us[0].name;
                                }
                            }
                            console.log(othUser);
                            var soc = findSocket(othUser, io.sockets.connected);
                            if(soc){
                                if(room.dwindleCount){
                                    if(room.dwindleCount===4){

                                    }
                                    else{
                                        soc.emit('disconnectResponse', socket.username, 'disconnected');
                                    }
                                }
                                else{
                                    soc.emit('disconnectResponse', socket.username, 'disconnected');
                                    //io.sockets.in(socket.room).emit('disconnectResponse', socket.username, 'disconnected');
                                }
                            }
                            console.log("Disconnect-- Socket User: "+socket.username+", OtherUser: "+othUsr);
                            deleteUserFromJsonDB(1,socket.room,socket.username,function(d_response){
                                //console.log(d_response);
                                var mainUser = findUserInRoom(room, us[1].name);
                                mainUser.chatCount = 0;
                            });
                            deleteUserFromJson(1,socket.room,othUsr,function(d_response){
                                //console.log(d_response);
                                var user = findUserInRoom(room, us[0].name);
                                user.chatCount = 0;
                            });

                        }

                        if(room.chatCount){
                            room.chatCount = 0;
                        }
                        if(room.dwindleCount){
                            room.dwindleCount= 0;
                        }


                    });


                });
                deleteChatHistory(1,socket.room, function(cres){
                    socket.disconnect();
                });

            }



            //            var soc = findSocket(socket.username, io.sockets.connected);
            //            soc.disconnect();
            //socket.leave(socket.room); // TODO-Imp - leave room commented


        }); //End of socket disconnect event
        socket.on('loggedout', function () {
            var room = findChatRoom(socket.room);
            if(room){
                console.log("1st Check");
                var us = room.users;
                var loggedOutUser;
                var othUser;
                if(us){
                    if(us[0].name){
                        if(socket.username===us[0].name){

                            othUser=us[1].name
                        }
                        else{
                            othUser=us[0].name;
                        }
                    }

                    var soc = findSocket(othUser, io.sockets.connected);
                    if(soc){
                        if(room.dwindleCount){
                            console.log("InDwindle Count");
                            if(room.dwindleCount===4){

                            }
                            else{
                                //soc.emit('updatechat','SERVER: ',socket.username+' Loggedout');
                                soc.emit('loggedoutResponse',socket.username,'Leave the chat');
                            }
                        }
                        else{
                            //soc.emit('updatechat','SERVER: ',socket.username+' Loggedout');
                            soc.emit('loggedoutResponse',socket.username,'Leave the chat');
                        }

                    }
                }
                else{}
            }
//          else{
//                //socket.emit('updatechat', socket.username,'Leave the chat');
//            }
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var sql = "update user_status set status = 'loggedin' where user_id='" + socket.username + "'";
            //console.log(sql);

            connection.query(sql, function (sqlerr, result) {
                if (sqlerr) {
                    function_result = "user not found";
                    console.log(function_result);
                    response_JSON = {
                        signin_status: function_result
                    };
                }
//                console.log(result);
                else {
                    var room = findChatRoom(socket.room);
                    if (room) {
                        console.log("2nd Check");
                        funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
//                            console.log(delResult);
                            //var room = findChatRoom(socket.room);
                            //console.log(room.users);

//                            var us = room.users;
                            var us = room.users;
                            if(us){
                                console.log("LoggedOut-- Socket User: "+socket.username+", OtherUser: "+othUser);
                                deleteUserFromJsonDB(1,socket.room,socket.username,function(d_response){
                                    //console.log(d_response);
                                    var mainUser = findUserInRoom(room, us[1].name);
                                    mainUser.chatCount = 0;
                                });
                                deleteUserFromJson(1,socket.room,othUser,function(d_response){
                                    //console.log(d_response);
                                    var user = findUserInRoom(room, us[0].name);
                                    user.chatCount = 0;
                                });

                            }
                            if(us[0].name){
                                var othUsr=us[0].name;
                            }
                            if(othUsr===socket.username){
                                if(us[1].name){
                                    othUsr=us[1].name;
                                }

                            }
                            updateOtherUserStatus(othUsr,function(strResult) {
                                var us = room.users;
                                var mainUser = findUserInRoom(room, us[1].name);
                                var user = findUserInRoom(room, us[0].name);
                                room.chatCount = 0;
                                user.chatCount = 0;
                                mainUser.chatCount = 0;
                                room.dwindleCount = 0;
                                delete usernames[socket.username];
                                delete rooms[room];
                            });

                        });
                        deleteChatHistory(1,socket.room, function(cres){

                        });
                    }

                    var soc = findSocket(socket.username, io.sockets.connected);
                    if(soc){
                        console.log(soc.id);
                        if (io.sockets.sockets[soc.id]) {
                            console.log("Inside");
                            io.sockets.sockets[soc.id].disconnect();
                        }
                        soc.leave(socket.room);
                        //io.socket.manager.onClientDisconnect(soc.id);
                        soc.disconnect();
                    }

                }
            });

        });// End of Socket .on loggedout event
        var  funAddUsersInfoToDB=function(a,mainUser,resultJSON,callback){
            //console.log("Res: "+JSON.stringify(resultJSON));
            //console.log(resultJSON['RoomName']+" --- "+resultJSON.OtherUsers.fb_id);
            //var obj=resultJSON.OtherUsers[3];
            //var obj0=obj[0];
            //console.log(resultJSON.OtherUsers[3].fb_id);

            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var query="insert into chat_users(chatroom,username,user2,OtherUser1,OtherUser2,OtherUser3,OtherUser4,roomname) values(";
            query=query+"'"+resultJSON['MainUser'].fb_id+"&"+resultJSON['MainUser'].pic_name+"',";
            query = query + "'"+mainUser+"',";
            query=query+"'"+resultJSON['SecondUser'].fb_id+"&"+resultJSON['SecondUser'].pic_name+"',";
            query=query+"'"+resultJSON.OtherUsers[0].fb_id+"&"+resultJSON.OtherUsers[0].pic_name+"',";
            query=query+"'"+resultJSON.OtherUsers[1].fb_id+"&"+resultJSON.OtherUsers[1].pic_name+"',";
            query=query+"'"+resultJSON.OtherUsers[2].fb_id+"&"+resultJSON.OtherUsers[2].pic_name+"',";
            query=query+"'"+resultJSON.OtherUsers[3].fb_id+"&"+resultJSON.OtherUsers[3].pic_name+"',";
            query=query+"'"+resultJSON['RoomName']+"')";
//             var query="insert into chat_users(chatroom,username,user2,OtherUser1,OtherUser2,OtherUser3,OtherUser4,roomname) values(";
//                 query=query+"'"+resultJSON['MainUser'][0].fb_id+"&"+resultJSON['MainUser'][0].pic_name+"',";
//                 query = query + "'"+mainUser+"',";
//                 query=query+"'"+resultJSON['SecondUser'][0].fb_id+"&"+resultJSON['SecondUser'][0].pic_name+"',";
//                 query=query+"'"+resultJSON['OtherUsers'][0][0].fb_id+"&"+resultJSON['OtherUsers'][0][0].pic_name+"',";
//                 query=query+"'"+resultJSON['OtherUsers'][0][1].fb_id+"&"+resultJSON['OtherUsers'][0][1].pic_name+"',";
//                 query=query+"'"+resultJSON['OtherUsers'][0][2].fb_id+"&"+resultJSON['OtherUsers'][0][2].pic_name+"',";
//                 query=query+"'"+resultJSON['OtherUsers'][0][3].fb_id+"&"+resultJSON['OtherUsers'][0][3].pic_name+"',";
//                 query=query+"'"+resultJSON['RoomName']+"')";
//                 console.log(query);
            connection.query(query, function (err1, result1) {
                if(!err1){
                    if(a===1){
                        callback("Success");
                    }
                }
            });
        };
        var deleteUserFromJson=function(uVal,roomname,userName,uCback){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            //deleteUsrObjectFromJSON(userName);
            console.log("Emtying Array: "+userName);
            firstUserBoolean=true;
            emptyJSONfromArray(userName);
            var sql="delete from chat_users where username='"+userName+"' and roomname='"+roomname+"'";
            connection.query(sql, function (serr1, result1) {

                if (!serr1) {
                    uCback("Deleted");
                }

            });

        };
        var deleteUserFromJsonDB=function(uVal,roomname,userName,uCback){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            firstUserBoolean=true;
            //emptyJSONfromArray(userName);
            deleteUsrObjectFromJSON(userName);
            var sql="delete from chat_users where username='"+userName+"' and roomname='"+roomname+"'";
            connection.query(sql, function (serr1, result1) {

                if (!serr1) {
                    uCback("Deleted");
                }

            });

        };
        var deleteChatHistory=function(sval,roomNam, cbak){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var strSql="delete from chat_history where roomname='"+roomNam+"'";
            connection.query(strSql, function (serr1, result1) {

                if (!serr1) {
                    cbak("Deleted");
                }

            });
        };
        var copyChatHistory=function(rc,roomname,clbk){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var strSql="select *,YEAR(date) as year,Month(date) as month,Day(date) as day, TIME(date) as time_part from chat_history where roomname='"+socket.room+"'";
//            console.log(strSql);
            connection.query(strSql, function (err, rows, fields) {
                if (!err) {
                    for (var i in rows) {
                        var strSql1="insert into chat_log(from_userid,to_userid,text,date,status,roomname) values('"+rows[i].from_userid+"','"+rows[i].to_userid+"','"+rows[i].text+"','"+rows[i].year+"-"+rows[i].month+"-"+rows[i].day+" "+rows[i].time_part+"','"+rows[i].status+"','"+rows[i].room+"')";
                        connection.query(strSql1, function (err1, result1) {

                        });
                    }
                    deleteChatHistory(1,roomname,function(){

                    });
                    if(rc===1){
                        clbk("updated");
                    }
                }
            });
        };

        var setUserPlayStatus = function(r,user_nam,callback){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var sql1 = "update user_status set status='playing' where user_id='"+user_nam+"'";
            connection.query(sql1, function (sqlerr, result) {
                if (!sqlerr) {
                    callback('success');
                }
            });
        };
        var funDeleteChatRoomFromDB=function(rec,room_name,cb){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var sql1 = "delete from chat_room where room='"+socket.room+"'";
            //console.log(sql1);
            connection.query(sql1, function (sqlerr1, result1) {

                if (sqlerr1) {
//                    console.log(sql1);
                    function_result = "room not found...";
                    console.log(function_result);
                    response_JSON = {
                        signin_status: function_result
                    };
                    cb(function_result);
                }
                else{
                    if(rec===1){
//                        console.log(sql1);
                        cb('Room Deleted..');
                    }
                }
            });
        };

        var findSocket = function(socketId, sockets){
            for(var socketKey in sockets){
                var socketObj = sockets[socketKey];
                //console.log('Play Screen - findSocket - socketObj = '+sockets[socketKey]+'  - socketId : '+socketId);// Comment this line
                if(socketObj.username === socketId){
                    console.log('Play Screen - findSocket - socketObj.username = '+socketObj.username);// Comment this line
                    return socketObj;
                }
            }
            return null;
        };// End of findSocket function

        var emptyJSONfromArray=function(username){
            for (var i = 0; i < res_json.length; i++) {
                var usr_json=res_json[i];
//                console.log(JSON.stringify(usr_json));
                if(usr_json){
                    if(usr_json.username===username){
                        //res_json.splice(i,1);
                        res_json=[];
                        break;
                    }
                }
            }
        };
        var deleteUsrObjectFromJSON=function(username){
//            console.log("DeletedUser: "+username+", Length: "+res_json.length);
            for (var i = 0; i < res_json.length; i++) {
                var usr_json=res_json[i];
//                console.log(JSON.stringify(usr_json));
                if(usr_json){
                    if(usr_json.username===username){
                        res_json.splice(i,1);
                        //delete res_json[i];
                        break;
                    }
                }
            }
        };
        var findUserJSon=function(username){
            for (var i = 0; i < res_json.length; i++) {
                var usr_json=res_json[i];
                if(usr_json.username===username){
                    return usr_json;
                }
            }
        };
        var findRoom = function (roomName,rooms) {
            for (var i = 0; i < rooms.length; i++) {
                var room = rooms[i];
                if (room.name === roomName) {
                    return room;
                }
            }
            return null;
        };
        var findUserCheck = function(username){
            for(var i=0;i<userCheck.length;i++){
                var usr = userCheck[i];
                if(usr.username === username){
                    return usr;
                }
            }
        };
        var findChatRoom = function(roomName){
            for(var i=0;i<rooms.length;i++){
                var room = rooms[i];
                if(room.name === roomName){
                    return room;
                }
            }
        };
        var findUserInRoom = function (room, userName) {
            var users = room.users;
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                if (user.name === userName) {
                    //console.log(user.name);
                    return user;
                }
            }
        };
        var findSecondUser=function(firstUsr){
            var secUsr= usernames[0];
            if(secUsr===firstUsr){
                secUsr=usernames[1];
                return secUsr;
            }
            else{
                return secUsr;
            }
        };
        var findToUser = function (room, fromUser) {
            var users = room.users;
            var user;
            user = users[0];
            //console.log(users[0].name);
            if (fromUser == user.name) {
                user = users[1];
                return user.name;
            } else {

                return user.name
            }
        };
        function updateOtherUserStatus(othUsr,callback){
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var sql="update user_status set status='play' where user_id='"+othUsr+"'";
//            console.log(sql);
            connection.query(sql, function (sqlerr, result) {
                if(!sqlerr){
                    callback("updated");
                }
                else{
                    callback("updated");
                }
            });
        }
        function funGetUserFromDB(rec, roomname, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            //var connection = sqlConnection.handleDisconnect();
            var query = "select user2 from chat_room where room='" + roomname + "'";
            //console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (!err) {
                    for (var i in rows) {
                        var str = rows[i].user2;
                        var arr = str.split('&');
                        var chatUser2 = arr[0];
                        if (rec === 1) {
                            cb(chatUser2);
                        }
                    }
                }else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }

        function getOtherUserNamesFromDB(count, chatUserVal, roomname,username, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var key = chatUserVal.toString();
            //var query = "select OtherUser" + key + " from chat_room where room='" + roomname + "'";
            var query = "select OtherUser" + key + " from chat_users where roomname='" + roomname + "' and username='"+username+"'";
//            console.log(query);
//            console.log(chatUserVal);
            var userInfo = [];
            var str = "";
            connection.query(query, function (err, rows, fields) {
                if (!err) {
//                    for (var i in rows) {
                    if(rows.length>0){
                        if (chatUserVal === 1) {
                            str = rows[0].OtherUser1;
                        }
                        if (chatUserVal === 2) {
                            str = rows[0].OtherUser2;
                        }
                        if (chatUserVal === 3) {
                            str = rows[0].OtherUser3;
                        }
                        if (chatUserVal === 4) {
                            str = rows[0].OtherUser4;
                        }
//                        console.log(str);
                        var arr = str.split('&');
                        userInfo['name'] = arr[0];
                        userInfo['picName'] = arr[1];
                        if (count === 1) {
                            cb(userInfo);
                        }
                    }
                }
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }

        function updateChatRoomTable(rec, userChatVal, roomname,username, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var key = userChatVal.toString();
            //var query = "update chat_room set OtherUser" + key + "='NULL' where room='" + roomname + "'";
            var query = "update chat_users set OtherUser" + key + "='NULL' where roomname='" + roomname + "' and username='"+username+"'";
            //console.log(query);
            connection.query(query, function (err1, result1) {
                if (!err1) {
                    if (rec === 1) {
                        cb('Updated');
                    }
                }
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }

        function getOldUserPicInfo(rec, roomname,username ,cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            //var strSQL = "select * from chat_room where room='" + roomname + "'";
            var strSQL = "select * from chat_users where roomname='" + roomname + "' and username='"+username+"'";
            //console.log(strSQL);
            var usersList = new Object();
            connection.query(strSQL, function (err, rows, fields) {
                if (!err) {
                    for (var i in rows) {
                        if(i!='contains'){
//                            console.log(i);

                            var str = rows[i].chatroom;
//                            console.log(str);
                            if (str != 'NULL') {
                                var arr = str.split('&');
                                usersList['User1'] = arr[0];
                                usersList['User1PicName'] = arr[1];
                            }
                            else {
                                usersList['User1'] = "NULL";
                                usersList['User1PicName'] = "NULL";
                            }

                            str = rows[i].user2;
//                            console.log(str);
                            if (str != 'NULL') {
                                arr = str.split("&");
                                usersList['User2'] = arr[0];
                                usersList['User2PicName'] = arr[1];
                            }
                            else {
                                usersList['User2'] = "NULL";
                                usersList['User2PicName'] = "NULL";
                            }

                            str = rows[i].OtherUser1;
//                            console.log(str);
                            if (str != "NULL") {
                                arr = str.split("&");
                                usersList['OtherUser1'] = arr[0];
                                usersList['OtherUser1PicName'] = arr[1];
                            }
                            else {
                                usersList['OtherUser1'] = "NULL";
                                usersList['OtherUser1PicName'] = "NULL";
                            }

                            str = rows[i].OtherUser2;
//                            console.log(str);
                            if (str != "NULL") {
                                arr = str.split("&");
                                usersList['OtherUser2'] = arr[0];
                                usersList['OtherUser2PicName'] = arr[1];
                            }
                            else {
                                usersList['OtherUser2'] = "NULL";
                                usersList['OtherUser2PicName'] = "NULL";
                            }

                            str = rows[i].OtherUser3;
//                            console.log(str);
                            if (str != "NULL") {
                                arr = str.split("&");
                                usersList['OtherUser3'] = arr[0];
                                usersList['OtherUser3PicName'] = arr[1];
                            }
                            else {
                                usersList['OtherUser3'] = "NULL";
                                usersList['OtherUser3PicName'] = "NULL";
                            }
                            str = rows[i].OtherUser4;
//                            console.log(str);
                            if (str != "NULL") {
                                arr = str.split("&");
                                usersList['OtherUser4'] = arr[0];
                                usersList['OtherUser4PicName'] = arr[1];
                            }
                            else {
                                usersList['OtherUser4'] = "NULL";
                                usersList['OtherUser4PicName'] = "NULL";
                            }
                            if (rec === 1) {
                                cb(usersList); //callback if all queries are processed
                            }
                        }

                    }
                }
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }
        function blockUsers(r,fromUser,toUser,resCallBack){
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSql="select * from blocked_user where (blocked_user_id='"+fromUser+"' and user_id='"+toUser+"') or (blocked_user_id='"+toUser+"' and user_id='"+fromUser+"')";
//            console.log(strSql);
            connection.query(strSql, function (err, rows, fields) {
                if(!err){
//                    console.log(rows.length);
                    if(rows.length>0){
                        resCallBack("User already in block list");

                    }
                    else{
                        var query="insert into blocked_user(blocked_user_id,user_id) values('"+toUser+"','"+fromUser+"')";
                        connection.query(query, function (err1, result1) {
                            if (!err1) {
                                resCallBack("Blocked");
                            }
                        });
                    }
                }

            });
        }
        function insertChatHistory(cc,fromUser,toUser,data,fullDate,fullTime,msg_status,roomName,cback){
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSql = "insert into chat_history(from_userid,to_userid,text,date,status,roomname,room) values('" + fromUser + "','" + toUser + "','" + data + "','" + fullDate +" " +fullTime+"','"+msg_status+"','"+roomName+"','"+roomName+"1')";
            connection.query(strSql, function (err1, result1) {
                if (!err1) {
                    if (cc === 1) {
                        cback('Updated');
                    }
                }
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }
        function insertChatLogToDB(count, fromUser, toUser, fullDate,fullTime ,data, msg_Status,strChatRoom,cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSql = "insert into chat_log(from_userid,to_userid,text,date,time,status,roomname) values('" + fromUser + "','" + toUser + "','" + data + "','" + fullDate +" " +fullTime+"','"+fullTime+"','"+msg_Status+"','"+strChatRoom+"')";
            connection.query(strSql, function (err1, result1) {
                if (!err1) {
                    if (count === 1) {
                        cb('Updated');
                    }
                }
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }


    }); // End of Io.On Connection

}; //End Of Play Function

    // 15 Sep 2015- anas
    function addPushNotificationRecordInDB(sendFrom,sendTo,createdAt){
        //console.log('createdAt : '+ createdAt);
        var query = "insert into push_notification(send_from,send_to,created_at) values('"+sendFrom+"','"+sendTo+"','"+createdAt+"')";
        if(connection===null){
                    connection = sqlConnection.handleDisconnect();
            }
        connection.query(query,function(err1,result1){
            if(!err1){
               console.log('Push notification detail has been successfully inserted in database.');
            }
            else{
               console.log('Error  in Push notification detail insertion in database.');
            }
        });
    }

    //get minute and seconds added datetime - 16 Sep 2015 - anas
    function getCalculatedDateTime()
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
    }

module.exports = ioChat;