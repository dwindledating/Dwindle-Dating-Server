/**
 * Created by ali on 5/8/2015.
 */
var sqlConnection = require('./MySQLDbClass');
var fs = require('fs');
var connection = null;
var pic_path = "uploadedImages/";
var save_directory = "/home/ubuntu/dwindle_dating/public/uploadedImages/";
var pic_path1 = "http://52.89.24.195:3000/";
//var save_directory = "public/uploadedImages/";
//var pic_path1 = "http://localhost:3000/";
var io = null;

var ioChat = function (io) {
    if (!(this instanceof ioChat)) {
        //console.log('true');
        return new ioChat(io);
    }

    this.io = io;
    //console.log('IO: '+JSON.stringify(io));
    play(this.io);
};
var play = function (io) {
    var user = {};
    var usernames = [];
    var rooms = [];
    var msgStatus='read';
    var userCheck=[];
    var res_json=[];
    var firstUserBoolean=true;
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

        var dwindleCondition;
        socket.on('Play', function (username, usrLon, usrLat) {

            socket.username = username;
            //usernames.push(socket.username);
            var resJson={username:username,MainUser:[],SecondUser:[],OtherUsers:[]};
            res_json.push(resJson);
            console.log("Start Playing...");
            var connection = sqlConnection.handleDisconnect();
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
                        main_user['user_name']=rows[0].name;
                        main_user['pic_name']=rows[0].pic_name;
                        main_user['pic_path'] = path;
//                        main_user['RequiredGender'] = userRequirement['Required_Gender'];
                        var userInfo={username:username,requiredGender:userRequirement['Required_Gender']};
                        userCheck.push(userInfo);
                        result_json['MainUser'] = main_user;

                    }
//                    console.log(JSON.stringify(main_user));
                    usrJSON.MainUser.push(main_user);
                    findUserAccordingToCriteria(userRequirement);
                }else{
                    sqlConnection.closeConnection(connection);
                }


            });
            var findUserAccordingToCriteria = function (userRequirement) {
//                console.log("Finding user according to criteria...");

                var query = "Select name,user_id,(ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + usrLat + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + usrLat + "))*COS(RADIANS(X(location)-" + usrLon + ")) ) * 6371)/1.60934 distance";
                query += " FROM users, user_status";
                query += " WHERE user_name = user_id and user_name != '" + username + "'  and gender = '" + userRequirement['Required_Gender'] + "' ";
                query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                query += " and `status` = 'play'";
                query += " HAVING distance <" + userRequirement['Distance'];
                query += " ORDER BY distance limit 1";
//                console.log(query);
                var user_list = new Array();
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        var count = 1;
                        var shortestDistance = 0;
                        if(rows.length>0){
                            isBothUserCriteriaMatch(rows[0].user_id, username,rows[0].name);

                        }
                    }else{
                        sqlConnection.closeConnection(connection);
                    }

                });

            }; // End of FindUserAccordingToCriteria Function

            var isBothUserCriteriaMatch = function (secondUser, firstUser,secUser_Name) {
                //var sec_user = new Object();
                console.log("inside both user criteria Match");

                var query = "select X(us.location) X,Y(us.location)Y, up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up";
                query += " where us.user_id='" + secondUser + "' and up.user_name ='" + secondUser + "'";
//                console.log(query);
                connection.query(query, function (err, rows, fields) {
                    var main_user = new Object();
                    main_user['fb_id'] = username;
                    var userRequirement = {};
                    if (!err) {

                        if (rows.length > 0) {
                            userRequirement['Required_Gender'] = rows[0].req_gender;
                            userRequirement['Required_From_Age'] = rows[0].req_from_age;
                            userRequirement['Required_To_Age'] = rows[0].req_to_age;
                            userRequirement['Distance'] = rows[0].distance;
                            userRequirement['Lat'] = rows[0].Y;
                            userRequirement['Lon'] = rows[0].X;
                            var query = "Select user_id, (ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + userRequirement['Lat'] + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + userRequirement['Lat'] + "))*COS(RADIANS(X(location)-" + userRequirement['Lon'] + ")) ) * 6371)/1.60934 distance";
                            query += " FROM users, user_status";
                            query += " WHERE user_name = user_id and user_name = '" + firstUser + "'  and gender = '" + userRequirement['Required_Gender'] + "' ";
                            query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                            query += " and `status` = 'play'";
                            query += " HAVING distance <" + userRequirement['Distance'];
                            query += " ORDER BY distance";
//                            console.log(query);
                            sync = true;
                            var user_list = new Array();
                            connection.query(query, function (err, rows, fields) {
                                if (!err) {
//                                    console.log(rows.length);

                                    if (rows.length > 0) {
                                        var query ="select * from blocked_user where (blocked_user_id='"+secondUser+"' and user_id='"+firstUser+"') or (blocked_user_id='"+firstUser+"' and user_id='"+secondUser+"')";
//                                        console.log(query);
                                        connection.query(query,function(err,rows,field){
                                            if (rows.length === 0) {
                                                // console.log(secondUser);
                                                var userSocket = findSocket(secondUser, io.sockets.connected);
                                                if (userSocket) {
                                                    sec_user['fb_id'] = secondUser;
                                                    sec_user['user_name']=secUser_Name;
//                                               console.log(sec_user + " Matched");
                                                    getChatUsersPicturesName(sec_user, firstUser);
                                                }
                                            }
                                        });

                                    } else {
                                        console.log(sec_user + " didnt matched");
                                    }
                                }
                            });

                        }
                    }else{
                        sqlConnection.closeConnection(connection);
                    }
                });


            }; //End of isBothUserCriteriaMatch function

            var getChatUsersPicturesName = function (sec_user,firstUser) {
                //              console.log("inside getting Second user picture...");
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

                        //result_json1['SecondUser'] = sec_user;
                        getOtherUserPicInfo(sec_user['fb_id'],firstUser,userRequirement['Required_Gender']);
                    }else{
                        sqlConnection.closeConnection(connection);
                    }


                });

            }; //End of getChatUsersPicturesName function

            var getOtherUserPicInfo = function (secUsr,firstUsr,usrReqGender) {
                //console.log("FU: "+firstUsr+" SU: "+secUsr);
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
                        if(firstUserBoolean){
                            funAddFirstUserInJSON(secUsr,firstUsr,other_users,function(jRes){
                            });
                        }
                        else{
                            funAddSecondUserInJSON(secUsr,firstUsr,other_users,function(jRes){
                            });
                        }



                    }else{
                        sqlConnection.closeConnection(connection);
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
                                main_user1['user_name']=rows[i].name;
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

        });//End Of Socket.on Play event

        socket.on('addUser', function (roomname) {
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


            }else{
                console.log("room not found..." + username);
            }
        }); // end of addUser event...

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
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
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount);
                            room.pic_count = parseInt(room.pic_count) + 1;

                        }
                    }
                    if (room.dwindleCount > 0 && room.dwindleCount <= 2) {
                        if (room.chatCount >= 8 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            room.dwindleCount = parseInt(room.dwindleCount) + 1;
                            room.userCount = parseInt(room.userCount) - 1;
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount);
                            room.pic_count = parseInt(room.pic_count) + 1;
                        }
                    }
                    if (room.dwindleCount === 3) {
                        if (room.chatCount >= 10 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            room.dwindleCount = parseInt(room.dwindleCount) + 1;
                            room.userCount = parseInt(room.userCount) - 1;
                            funDwindleDown(room, mainUser,room.dwindleCount,room.userCount);
                            funDwindleDown2(room, user,room.dwindleCount,room.userCount);
                            room.pic_count = parseInt(room.pic_count) + 1;
                        }
                        if (room.chatCount=== 9 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                            copyChatHistory(1,socket.room,function(cRes){

                            });
                        }
                        if (room.chatCount=== 10 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
//                                console.log("Inside 10");
                            var fromUser = socket.username;
                            var toUser = findToUser(room, fromUser);
                            var strChatRoom=socket.room+"1";
                            insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus,strChatRoom ,function (getResult) {
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
                if (c < 4) {
//                        console.log("Inside C: "+c);
                    room.dwindleCount= parseInt(room.dwindleCount)+1;
                    var userJson = new Object();
                    var picCount = parseInt(room.pic_count) + 1;
                    room.pic_count = parseInt(room.pic_count) + 1;

                    var dir = save_directory + fromUser;
                    var dir1 = pic_path1 + pic_path + fromUser;
                    var files = fs.readdirSync(dir);
                    var pic_Name = dir1 + '/' + files[picCount];

                    userJson["fb_id"] = fromUser;
                    userJson['pic_path'] = pic_Name;
                    userPicInfo['User1'] = userJson;

                    var dir = save_directory + toUser;
                    var dir1 = pic_path1 + pic_path + toUser;
                    var files = fs.readdirSync(dir);
                    var pic_Name = dir1 + '/' + files[picCount];
                    userJson["fb_id"] = toUser;
                    userJson['pic_path'] = pic_Name;
                    userPicInfo['User2'] = userJson;
                    var dwindle_down= new Object();
                    dwindle_down['DwindleDown']= userPicInfo;
                    room.chatCount = 0;
                    fromUser.chatCount = 0;
                    toUser.chatCount = 0;
                    room.dwindleCount=0;
                    io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));

                }
                var strChatRoom=socket.room+"1";
                insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus,strChatRoom,function (getResult) {
                });
            }
//            }

        }); //End of socket.on sendchat
        var funDwindleDown=function(room,mainUser,dwindleCount,roomUserCount){
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
                        var picCount = parseInt(room.pic_count) + 1;

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

        var funDwindleDown2=function(room,mainUser,dwindleCount,roomUserCount){

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
                        var picCount = parseInt(room.pic_count) + 1;

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
        socket.on('disconnect',function(){
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
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


                    io.sockets.in(socket.room).emit('updatechat', socket.username,socket.username+ " disconnected from room ");
                    funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
                        var us = room.users;
                        if(us){
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
            socket.emit('updatechat', socket.username, 'disconnected');

            //            var soc = findSocket(socket.username, io.sockets.connected);
            //            soc.disconnect();
            socket.leave(socket.room);


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
                        soc.emit('loggedoutResponse',socket.username,'Leave the chat');
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
                        soc.leave(socket.room);
                        //soc.disconnect();
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
                if(socketObj.username === socketId){
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

module.exports = ioChat;