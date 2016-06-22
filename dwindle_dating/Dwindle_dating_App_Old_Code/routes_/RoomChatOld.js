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
//    var sockets =[];


//     io.of('/').on('connection', function (socket) {
    io.sockets.on('connection', function (socket) {
        // when the client emits 'Play', this listens and executes

        //socket.emit("updatechat","EveryOne: ","This Is Play");
        var sec_user = new Object();
        var main_user = new Object();
        var result_json = new Object();
        var dwindleCondition;
        socket.on('Play', function (username, usrLon, usrLat) {

            socket.username = username;
            //usernames.push(socket.username);
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
            var query = "select up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up";
            query += " where us.user_id='" + username + "' and up.user_name ='" + username + "' limit 1";
//            console.log(query);
            connection.query(query, function (err, rows, fields) {
                //var main_user = new Object();
                main_user['fb_id'] = username;
                var userRequirement = {};
                if (!err) {
                    for (var i in rows) {
                        userRequirement['Required_Gender'] = rows[i].req_gender;
                        userRequirement['Required_From_Age'] = rows[i].req_from_age;
                        userRequirement['Required_To_Age'] = rows[i].req_to_age;
                        userRequirement['Distance'] = rows[i].distance;
                        var path = pic_path1 + pic_path + main_user['fb_id'] + "/" + rows[i].pic_name;
                        main_user['pic_name']=rows[i].pic_name;
                        main_user['pic_path'] = path;
//                        main_user['RequiredGender'] = userRequirement['Required_Gender'];
                        result_json['MainUser'] = main_user;
                    }
                    //console.log(userRequirement);
                    findUserAccordingToCriteria(userRequirement);
                }else{
                    sqlConnection.closeConnection(connection);
                }


            });
            var findUserAccordingToCriteria = function (userRequirement) {
//                console.log("Finding user according to criteria...");

                var query = "Select user_id,(ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + usrLat + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + usrLat + "))*COS(RADIANS(X(location)-" + usrLon + ")) ) * 6371)/1.60934 distance";
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
                        //                      console.log("user found:" + rows.length);
                        for (var i = 0; i < rows.length; i++) {
                            isBothUserCriteriaMatch(rows[i].user_id, username)
                        }
                    }else{
                        sqlConnection.closeConnection(connection);
                    }

                });

            }; // End of FindUserAccordingToCriteria Function

            var isBothUserCriteriaMatch = function (secondUser, firstUser) {
                //var sec_user = new Object();
//                console.log("inside both user criteria Match");
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
                                            if (rows.length == 0) {
                                                sec_user['fb_id'] = secondUser;
//                                               console.log(sec_user + " Matched");
                                                getChatUsersPicturesName(sec_user, firstUser);
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
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        var path = pic_path1 + pic_path + sec_user['fb_id'] + "/" + rows[0].pic_name;
                        sec_user['pic_name'] = rows[0].pic_name;
                        sec_user['pic_path'] = path;
                        result_json['SecondUser'] = sec_user;
                        getOtherUserPicInfo(sec_user['fb_id'],firstUser);
                    }else{
                        sqlConnection.closeConnection(connection);
                    }


                });

            }; //End of getChatUsersPicturesName function

            var getOtherUserPicInfo = function (secUsr,firstUsr) {
                //console.log("inside other random user pictures");
                var other_users = new Array();
                //var query = "Select DISTINCT(u.user_name) un, pic_name, pic_path from users u,user_pics up where u.user_name = up.user_name and u.gender = 'F'";
                var query = "Select DISTINCT(u.user_name) un, pic_name, pic_path from users u,user_pics up where u.user_name = up.user_name and u.gender = 'F' and u.user_name!='"+secUsr+"' and u.user_name!='"+firstUsr+"'";
                query += " GROUP BY u.user_name";
                query += " ORDER BY RAND() LIMIT 4";
//                console.log(query);
//                var user_Pics_Name = new Array();
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        for (var i in rows) {
                            var path = pic_path1 + pic_path + rows[i].un + "/" + rows[i].pic_name;
                            var user = new Object();
                            user['pic_name']=rows[i].pic_name;
                            user['fb_id'] = rows[i].un;
                            user['pic_path'] = path;
                            other_users.push(user);

                        }
                        result_json['OtherUsers'] = other_users;
                        var roomname = result_json['MainUser'].fb_id+"-"+result_json['SecondUser'].fb_id;
                        //var roomname = result_json['MainUser'].fb_id+result_json['SecondUser'].fb_id;
                        //var user = {name: username, chatCount: 0};
                        var room = {name: roomname, userCount: 6, chatCount: 0, status: false, pic_count: 0, users: [],dwindleCount:0};
                        rooms.push(room);
                        result_json["RoomName"] = roomname;
                        funAddChatUserToDB(1,result_json,other_users,function(res){
                            if(res==='Success'){
                                // console.log("Final JSON:" + JSON.stringify(result_json));
                                var othUser = result_json['SecondUser'].fb_id;
                                var othSocket = findSocket(othUser,io.sockets.connected);
                                if(othSocket) {

                                    socket.emit('startgame', JSON.stringify(result_json));
                                    var nresult_json=new Object();
                                    nresult_json['MainUser']=sec_user;
                                    nresult_json['SecondUser']=main_user;
                                    nresult_json['OtherUsers']= other_users;
                                    nresult_json["RoomName"] = roomname;
                                    othSocket.emit('startgame', JSON.stringify(nresult_json));
                                }
                            }
                        });


                    }else{
                        sqlConnection.closeConnection(connection);
                    }
                });
            }; //End of getOtherUserPicInfo function
            var funAddChatUserToDB= function(rec,result_json,other_users,cb){
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
//            insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus, function (getResult) {
//                //console.log("Chat Inserted To DB: " + getResult);
//            });
            //console.log("MUser: "+mainUser.name+", MUserChatCount: "+mainUser.chatCount+", User: "+user.name+", UserChatCount: "+user.chatCount+", UserCount: "+room.userCount);
            io.sockets.in(socket.room).emit('updatechat', socket.username , data);
           // console.log(room.dwindleCount);
            var secondChatUser = "";
            if (room.userCount > 2) {
//                funGetUserFromDB(1, room.name, function (chatUser2) {
                    if (connection == null) {
                        connection = sqlConnection.handleDisconnect();
                    }
//                    secondChatUser = chatUser2;
                    insertChatHistory(1,fromUser,toUser,data,fullDate,fullTime,'read',socket.room,function(qres) {
                        if (room.dwindleCount === 0) {
                            if (room.chatCount >= 6 && user.chatCount >= 2 && mainUser.chatCount >= 2) {
                                funDwindleDown(room, mainUser);

                            }
                        }
                        if (room.dwindleCount > 0 && room.dwindleCount <= 2) {
                            if (room.chatCount >= 8 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                                funDwindleDown(room, mainUser);
                            }
                        }
                        if (room.dwindleCount === 3) {
                            if (room.chatCount >= 10 && user.chatCount >= 3 && mainUser.chatCount >= 3) {
                                funDwindleDown(room, mainUser);
                            }
                        }

                    });
//                });
            }
            else if (room.userCount === 2) {
                // start loging chats
                //console.log(room.dwindleCount);
                if(room.dwindleCount===4){
                    copyChatHistory(1,socket.room,function(cRes){
                        room.dwindleCount=parseInt(room.dwindleCount)+1;
                        insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus, function (getResult) {
                            //console.log("Chat Inserted To DB: " + getResult);
                        });
                    });
                }
                else{
                    var fromUser = socket.username;
                    var toUser = findToUser(room, fromUser);
                    //console.log("FromUser: " + fromUser + " , ToUser: " + toUser + ", PicCount: " + room.pic_count);
                    var c = parseInt(room.pic_count);
//                console.log("PicCount: "+c);
                    var userPicInfo = new Object();
                    if (c < 4) {
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
                        //console.log(JSON.stringify(userPicInfo));
                        var dwindle_down= new Object();
                        dwindle_down['DwindleDown']= userPicInfo;
                        io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));
                        //io.sockets.emit('adduserspic', JSON.stringify(userPicInfo));
                    }

                    //console.log("Message: "+data+",From User: "+fromUser+", To User: "+toUser+ " Date: "+fullDate);
                    insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus, function (getResult) {
                        //console.log("Chat Inserted To DB: " + getResult);
                    });
                }
//                var fromUser = socket.username;
//                var toUser = findToUser(room, fromUser);
//                //console.log("FromUser: " + fromUser + " , ToUser: " + toUser + ", PicCount: " + room.pic_count);
//                var c = parseInt(room.pic_count);
////                console.log("PicCount: "+c);
//                var userPicInfo = new Object();
//                if (c < 4) {
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
//                    //console.log(JSON.stringify(userPicInfo));
//                    var dwindle_down= new Object();
//                    dwindle_down['DwindleDown']= userPicInfo;
//                    io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));
//                    //io.sockets.emit('adduserspic', JSON.stringify(userPicInfo));
//                }
//
//                //console.log("Message: "+data+",From User: "+fromUser+", To User: "+toUser+ " Date: "+fullDate);
//                insertChatLogToDB(1, fromUser, toUser, fullDate,fullTime ,data,msgStatus, function (getResult) {
//                    //console.log("Chat Inserted To DB: " + getResult);
//                });
            }

        }); //End of socket.on sendchat
        var funDwindleDown=function(room,mainUser){
            room.dwindleCount = parseInt(room.dwindleCount) + 1;
            room.userCount = parseInt(room.userCount) - 1;
            var userChatVal = parseInt(room.userCount);
            userChatVal = userChatVal - 1;
            getOtherUserNamesFromDB(1, userChatVal, room.name, function (otherUserVal) {
                //emiting to client the username to be faded..
                //io.sockets.in(socket.room).emit('deleteuser', otherUserVal.name);
                var fadedUser = new Object();
                fadedUser['fb_id'] = otherUserVal.name;

                //io.sockets.emit('deleteuser', otherUserVal.name);
                updateChatRoomTable(1, userChatVal, room.name, function (userUpdated) {
                    // console.log(userChatVal + " UserUpdated: " + userUpdated);
                    getOldUserPicInfo(1, room.name, function (userInfo) {
                        //console.log("Old Info: "+JSON.stringify(userInfo));
                        var userPicInfo = new Object();
                        var other_Users = new Array();
                        userPicInfo['DeletedUser'] = fadedUser;
                        userPicInfo['DwindleCount'] = room.dwindleCount;
                        var picCount = parseInt(room.pic_count) + 1;
                        room.pic_count = parseInt(room.pic_count) + 1;
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
                        io.sockets.in(socket.room).emit('dwindledown', JSON.stringify(dwindle_down));
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
                                });
                            }
                            deleteChatHistory(1,socket.room, function(cres){

                            });


                        });

                    }

                });
                var othSocket = findSocket(blockedUsr,io.sockets.connected);
                othSocket.emit('skipchat',socket.username,'skipped the chat');
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
                        othUsr=us[0].name;
                    }
                    if(othUsr===socket.username){
                        if(us[1].name){
                            othUsr=us[1].name;
                        }

                    }

                }

                updateOtherUserStatus(othUsr,function(strResult){


                    io.sockets.in(socket.room).emit('updatechat', socket.username,socket.username+ " disconnected from room ");
                    funDeleteChatRoomFromDB(1, socket.room, function (delResult) {
                        var us = room.users;
                        if(us[1].name){
                            var mainUser = findUserInRoom(room, us[1].name);
                            mainUser.chatCount = 0;
                        }
                        if(us[0].name){
                            var user = findUserInRoom(room, us[0].name);
                            user.chatCount = 0;
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

                            var us = room.users;
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
                        var strSql1="insert into chat_log(from_userid,to_userid,text,date,status) values('"+rows[i].from_userid+"','"+rows[i].to_userid+"','"+rows[i].text+"','"+rows[i].year+"-"+rows[i].month+"-"+rows[i].day+" "+rows[i].time_part+"','"+rows[i].status+"')";
                        connection.query(strSql1, function (err1, result1) {

                        });
                    }
                    if(rc===1){
                        clbk("updated");
                    }
                }
            });
        };
        var funAddToDB=function(r,rowId,rows,cb){

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
                    console.log(sql1);
                    function_result = "room not found...";
                    console.log(function_result);
                    response_JSON = {
                        signin_status: function_result
                    };
                    cb(function_result);
                }
                else{
                    if(rec===1){
                        console.log(sql1);
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
//            for (var i = 0; i < sockets.length; i++) {
//                var socket = sockets[i];
//                if (socket.username === socketId) {
//                    return socket;
//                }
//            }
            return null;
        };// End of findSocket function

        var findRoom = function (roomName,rooms) {
            for (var i = 0; i < rooms.length; i++) {
                var room = rooms[i];
                if (room.name === roomName) {
                    return room;
                }
            }
            return null;
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

        function getOtherUserNamesFromDB(count, chatUserVal, roomname, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var key = chatUserVal.toString();
            var query = "select OtherUser" + key + " from chat_room where room='" + roomname + "'";
            //console.log(query);
            var userInfo = [];
            var str = "";
            connection.query(query, function (err, rows, fields) {
                if (!err) {
                    for (var i in rows) {
                        if (chatUserVal === 1) {
                            str = rows[i].OtherUser1;
                        }
                        if (chatUserVal === 2) {
                            str = rows[i].OtherUser2;
                        }
                        if (chatUserVal === 3) {
                            str = rows[i].OtherUser3;
                        }
                        if (chatUserVal === 4) {
                            str = rows[i].OtherUser4;
                        }

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

        function updateChatRoomTable(rec, userChatVal, roomname, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var key = userChatVal.toString();
            var query = "update chat_room set OtherUser" + key + "='NULL' where room='" + roomname + "'";
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

        function getOldUserPicInfo(rec, roomname, cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSQL = "select * from chat_room where room='" + roomname + "'";
            //console.log(strSQL);
            var usersList = new Object();
            connection.query(strSQL, function (err, rows, fields) {
                if (!err) {
                    for (var i in rows) {

                        var str = rows[i].chatroom;
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
                else{
                    sqlConnection.closeConnection(connection);
                }
            });
        }
        function insertChatHistory(cc,fromUser,toUser,data,fullDate,fullTime,msg_status,roomName,cback){
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSql = "insert into chat_history(from_userid,to_userid,text,date,status,roomname) values('" + fromUser + "','" + toUser + "','" + data + "','" + fullDate +" " +fullTime+"','"+msg_status+"','"+roomName+"')";
            connection.query(strSql, function (err1, result1) {
                if (!err1) {
                    if (cc === 1) {
                        cback('Updated');
                    }
                }
                else{
					if(connection!=null){
							sqlConnection.closeConnection(connection);
					}
                    
                }
            });
        }
        function insertChatLogToDB(count, fromUser, toUser, fullDate,fullTime ,data, msg_Status,cb) {
            if(connection===null){
                connection=sqlConnection.handleDisconnect();
            }
            var strSql = "insert into chat_log(from_userid,to_userid,text,date,time,status) values('" + fromUser + "','" + toUser + "','" + data + "','" + fullDate +" " +fullTime+"','"+fullTime+"','"+msg_Status+"')";
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