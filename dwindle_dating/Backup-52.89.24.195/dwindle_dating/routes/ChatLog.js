/**
 * Created by ali on 5/15/2015.
 */
/**
 * Created by ali on 5/8/2015.
 */
var sqlConnection = require('./MySQLDbClass');
var fs = require('fs');
var Parse = require("parse").Parse;
var _ = require('underscore')._;
var connection = null;
var pic_folder = "uploadedImages/";
var save_directory = "/home/ubuntu/dwindle_dating/public/uploadedImages/";
var pic_path = "http://52.89.24.195:3000/";
//var save_directory = "public/uploadedImages/";
//var pic_path = "http://localhost:3000/";
var chatIo = null;
//var chatLogController = require('./ChatLog');


var ioChat = function (chatio) {
    if (!(this instanceof ioChat)) {
        return new ioChat(chatio);
    }

    this.chatIo = chatio;
    //console.log('IO: '+JSON.stringify(io));
    chatsLogScreen(this.chatIo);
};
var chatsLogScreen = function (io) {
    var user = {};
    var usernames = [];
    var rooms = [];
//    var sockets =[];

    //var chat=io.of("/Chat").on('connection', function (socket) {
    //chatSocket.on('connection', function (socket) {
    //var chat=io.of("/Chat");
    //var chat = io.sockets;// TODO - anas - making socket generic - 9 Oct 2015
    io.sockets.on('connection', function(socket){
        // chat.emit("updatechat","EveryOne: ","This Is Chat Log");
        console.log("LOG File");
        var msgStatus='';
        var from_user;
        var to_user;
        var chat_status;
        var totalPages;
        var item_per_page=20;
        var roomname;

        //TODO - Use case 7 - TODO - need to implement 
        //Remove below code later - start - setInAppPushNotificationFlag- 14 Oct 2015 - anas 
         /*socket.on('setInAppPushNotificationFlag', function (username) {
            console.log('setInAppPushNotificationFlag called ...');
            socket.inAppPushNotification = true;
            socket.respondTo = from_user;
         });*/
         //End-  setInAppPushNotificationFlag

        socket.on('chat', function (username,to_username,status) {
            socket.username=username;
            console.log('chat log - socket.username : ' + socket.username);//  comment this line - anas - 5 Oct 2015
            //socket.username=username;
            //console.log(socket.username);
            user[socket.username]=socket;
            from_user=username;
            to_user=to_username;
            chat_status=status;
            var chatJSON= new Object();
            var chat_array1=new Array();
            var chat_array=new Array();
            var chat_json;
            var count=1;
            if(connection===null) {
                connection = sqlConnection.handleDisconnect();
            }
            var sql = "update user_status set status = 'chat' where user_id='" + socket.username + "'";
            connection.query(sql, function (sqlerr, result) {
                if (sqlerr) {
                    function_result = "User Not Found";
                    response_JSON = {
                        signin_status: function_result
                    }
                }
                var sql1="update chat_log set status='read' where from_userid='"+to_username+"' and to_userid='"+username+"'";
                //console.log(sql1);
                connection.query(sql1, function (sqlerr, result) {
                    if(!sqlerr){
                        //console.log("Updated");
                    }
                    else{
                        //console.log("Error");
                    }

                });
                //io.of("/Chat").to(socket.id).emit('getChatLog',JSON.stringify("Test"));

                //socket.emit('getChatLog',JSON.stringify("Test"));


                funGetTotalRecords(1,from_user,to_user,function(total_Records){

                    totalPages=Math.ceil(total_Records/item_per_page);
                    var query="SELECT * FROM chat_log WHERE (to_userid='"+from_user+"' and from_userid='"+to_user+"') or (to_userid='"+to_user+"' and from_userid='"+from_user+"') ORDER BY date desc LIMIT 0,"+item_per_page;
                    //console.log(query);
                    connection.query(query, function (err, rows, fields) {
                        if(!err){
                            for(i in rows){
                                chat_json = new Object();
                                chat_json['FromUser']=rows[i].from_userid;
                                chat_json['ToUser']=rows[i].to_userid;
                                chat_json['Message']=rows[i].text;
                                chat_json['Date']=rows[i].date;
                                //chat_array['Chat'+count]=chat_json;
                                chat_array1.push(chat_json);
                                count=count+1;
                            }
                            chatJSON["Chat"]=chat_array1;
                            //chat_array.push(chatJSON);
//                  chat_array['RoomName']=from_user+"-"+to_user;
                        }
                        else{
                            chat_array.push("No Message Found");
                        }
                        funGetToUserPics(to_username,function(pic_json){
                            findUserRoom(1,from_user,to_user,function(resRoom) {
                                roomname = resRoom;
                                console.log("RoomName: "+roomname);
                                if(roomname){
                                    socket.room=roomname;
                                    socket.join(roomname);

                                }
                                var chat_pic = new Object();
                                chat_pic["Pictures"] = pic_json;
                                chat_array.push(chat_pic);
                                chatJSON['Pictures'] = pic_json;
                                chatJSON['TotalPages'] = totalPages;
                                // TODO - 'updatechat' updated with 'updatechat_chatlog'  and 'io.of('/Chat')' with io - anas - 14 oct 2015
                                io.to(socket.id).emit('getChatLog', JSON.stringify(chatJSON));
                                //socket.emit('getChatLog',JSON.stringify(chatJSON));
                            });
                        });

                    });
                });


            });


        });//End of socket 'chat' events.

        // when clients as chat log result for next page
        socket.on('getChatLogForPage', function (from_user,to_user,current_page) {
            console.log(current_page);
            var start_index = (current_page - 1) * item_per_page;
            var chatJSON= new Object();
            var chat_array1=new Array();
            var chat_array=new Array();
            var chat_json;
            var count=1;
            var query="SELECT * FROM chat_log WHERE (to_userid='"+from_user+"' and from_userid='"+to_user+"') or (to_userid='"+to_user+"' and from_userid='"+from_user+"') ORDER BY date desc LIMIT "+start_index+","+item_per_page;
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (!err) {
                    for (i in rows) {
                        chat_json = new Object();
//                        console.log(rows[i].text);
                        chat_json['FromUser'] = rows[i].from_userid;
                        chat_json['ToUser'] = rows[i].to_userid;
                        chat_json['Message'] = rows[i].text;
                        chat_json['Date'] = rows[i].date;
                        //chat_array['Chat'+count]=chat_json;
                        chat_array1.push(chat_json);
                        count = count + 1;
                    }

                    //chat_array.push(chatJSON);
//                  chat_array['RoomName']=from_user+"-"+to_user;
                }
                else {
                    chat_array1.push("No Message Found");
                }
                chatJSON["Chat"] = chat_array1;
                chatJSON["PageCount"]=current_page;
                socket.emit('getChatLogForPageResult',JSON.stringify(chatJSON));
            });

        });// End of getChatLogForPage event

        // when the client emits 'sendchat', this listens and executes
        // TODO - 'sendchat' updated with 'sendchat_chatlog' - anas - 14 oct 2015
        socket.on('sendchat_chatlog', function (data) {
                console.log('sendchat_chatlog called = '+socket.room);
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
                if(roomname){
                    var usersSocketIds = Object.keys(io.sockets.adapter.rooms[roomname]);// TODO chat. replace with io.sockets. - anas - 10 oct 2015
                    var usersAttendingInRoom = _.map(usersSocketIds, function(socketClientId){
//                        console.log(socketClientId);
                        return io.sockets.connected[socketClientId]// TODO chat. replace with io.sockets. - anas - 14 oct 2015
                    });
                    for(var i=0;i<usersAttendingInRoom.length;i++){
                        if(usersAttendingInRoom[i].username===to_user){
                            console.log(usersAttendingInRoom[i].username);
                            //var toUserSocket= findSocket(to_user,chat.sockets.connected);
                            //console.log("ToUser Socket "+toUserSocket);
                            msgStatus="read";
                            insertChatLogToDB(1, from_user, to_user, fullDate,fullTime ,data, msgStatus,roomname,function (getResult) {

                            });
                            // TODO - 'updatechat' updated with 'updatechat_chatlog'  and 'io.of('/Chat')' with io - anas - 10 oct 2015
                            io.to(roomname).emit("updatechat_chatlog",socket.username,data);
                        }
                        else
                        {   // start - throw in app notification if user is not on screen but available online ---  anas - 6 Oct 2015
                            var toUserName = to_user;
                            var mainSocket = findSocket(toUserName, io.sockets.connected);
                            console.log('Chatlog - mainSocket = '+ mainSocket+' to_username = ' + toUserName);// comment this line
                            if (mainSocket) {
                                mainSocket.emit('message_from_matches_screen', 'Event : message_from_matches_screen          Message : ' + data, from_user, 'MatchesScreen');// TODO-Imp remove 'Event : message_from_matches_screen          Message : ' 
                                insertChatLogToDB(1, from_user, to_user, fullDate,fullTime ,data, msgStatus,roomname,function (getResult) {
                                });
                            }//end - anas - 7 Oct 2015
                            else{
                                console.log(to_user+" User Not Connected");
                                msgStatus='unread';
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
                                            if(to_user===results[a].attributes.username){
                                                UserObjID=results[a].id;
                                                break;
                                            }
                                        }
                                        if(UserObjID!="") {
                                            console.log("OnjID: "+UserObjID);
                                            var query = new Parse.Query(Parse.Installation)
                                                , parser_                                = {
                                                    "alert": from_user+": "+data,
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
                                                    console.log("Push Notification Sent Successfully");
    //                                    console.log("arguments", arguments);
                                                },
                                                error: function (error) {
                                                    console.log("Error: " + error.code + " " + error.message);
                                                }
                                            });

                                        }
                                    },
                                    error: function() {
                                        console.error("User object lookup failed");
                                    }
                                });//End of query.find
                                insertChatLogToDB(1, from_user, to_user, fullDate,fullTime ,data, msgStatus,roomname,function (getResult) {

                                });
                                // TODO - 'updatechat' updated with 'updatechat_chatlog'  and 'io.of('/Chat')' with io - anas - 14 oct 2015
                                io.to(roomname).emit("updatechat_chatlog",socket.username,data);
                            }
                        }   
                    }

//                    if(socket.rooms.indexOf(roomname) >= 0){
//                        console.log("Innn");
//                    }
                    //console.log("Socket: "+socket.username+" to User: "+to_user);
                   // console.log(Object.keys(io.engine.clients));
//                    var clients_in_the_room = io.sockets.adapter.rooms[socket.id];
//                    for (var clientId in clients_in_the_room ) {
//                        console.log('client: %s', clientId); //Seeing is believing
//                        var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
//                    }
//                    var toUserSocket= findSocket(to_user,chat.sockets.connected);
//                    console.log("To: "+toUserSocket);
//                    if(toUserSocket){
//                        if(io.sockets.adapter.room[roomname][toUserSocket.id]){
//                            console.log("in room");
//                            msgStatus='read';
//                        }
//                        else{
//                            console.log("not in room");
//                        }
//                    }
//                    else{
//
//
//                    }

                    //var to_client= findConnectedClient(to_user,clientsByNS);
                }
            else{
                    console.log('No RoomName');
                }

////            console.log(fullDate);
//                insertChatLogToDB(1, from_user, to_user, fullDate,fullTime ,data, msgStatus,roomname,function (getResult) {
//                    //console.log("Chat Inserted To DB: " + getResult);
//                });

//            checkToUserStatus(to_user,function(res_status){
//                console.log(res_status);
//                chat_status=res_status;
//                var fromSocket=findSocket(from_user,user[socket.username]);
//                var toSocket=findSocket(to_user,user[to_user]);
//                if(chat_status==='chat'){
//                    msgStatus='read';
////            console.log("Socket ToUser: "+toSocket.username+", Socket From User: "+fromSocket.username);
//                    fromSocket.emit("updatechat",socket.username,data);
//                    toSocket.emit("updatechat",socket.username,data);
//                    io.sockets.emit("updatechat",socket.username,data);
//                }
//                else{
//                    msgStatus='unread';
//                    fromSocket.emit("updatechat",socket.username,data);
//                    //getToUserParserObjectId(1,to_user,function(obj_id){
//                    //if(obj_id){
//                    //  console.log(obj_id);
//                    Parse.initialize(
//                        "HEQ0TQq0Qvqdy7BAGii05miGcVp5AcvGbnvdhxQd", // applicationId
//                        "TMRcC6J1ns1tifkDutewTjgH4vRghDqV6ESfxZpI", // javaScriptKey
//                        "fOT4V8LCaHMO9NZN8agCzK4bdxRXsWRMEfHsU6wj" //MasterKey
//
//                    );
//                    var UserObjID="";
//                    var Installation = Parse.Object.extend("User");
//                    var query = new Parse.Query(Installation);
//                    query.find({
//                        success: function(results) {
//                            for(var a=0;a<results.length;a++){
//                                if(to_user===results[a].attributes.username){
//                                    UserObjID=results[a].id;
//                                    break;
//                                }
//                            }
//                            if(UserObjID!="") {
//                                console.log("OnjID: "+UserObjID);
//                                var query = new Parse.Query(Parse.Installation)
//                                    , parser_data = {
//                                        "alert": from_user+": "+data,
//                                        "anotherObjectId": "", // extra data to send to the phone.
//                                        "sound": "cheering.caf" // default ios sound.
//                                    };
//                                query.equalTo("user", {"objectId": UserObjID /* a user object id */, "className": "_User", "__type": "Pointer"}); // me.
//                                query.equalTo("deviceType", "ios");
//                                Parse.Push.send({
//                                    where: query,
//                                    data: parser_data
//                                }, {
//                                    success: function () {
//                                        console.log("Push Notification Sent Successfully");
////                                    console.log("arguments", arguments);
//                                    },
//                                    error: function (error) {
//                                        console.log("Error: " + error.code + " " + error.message);
//                                    }
//                                });
//
//                            }
//                        },
//                        error: function() {
//                            console.error("User object lookup failed");
//                        }
//                    });
                    //}
                    //});
//                }

            //});




        });// End of socket 'sendchat'
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
                delete user[socket.username];
            });
            //console.log(roomname);
            socket.leave(roomname);
            socket.disconnect();

        }); //End of socket disconnect event

        socket.on('loggedout', function () {
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

                delete user[socket.username];
                socket.disconnect();

            });

        });// End of Socket .on loggedout event
       function findConnectedClient(to_user,clients){
           for(var i=0;i<clients.length;i++){
               var client = clients[i];
               if(client.username===to_user){
                   if(client.connected){
                       return client;
                   }
               }
           }
           return null;
       }

    });// End of socket 'Connection'

    //chat.emit("EveryOne: ","This Is Chat Log");
}; //End Of chatsLogScreen Function

var funGetTotalRecords=function(check_val,from_user,to_user,totalRecCallBack){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var total_no_of_records;
    var query="SELECT count(*) as totalRec FROM chat_log WHERE (to_userid='"+from_user+"' and from_userid='"+to_user+"') or (to_userid='"+to_user+"' and from_userid='"+from_user+"') ORDER BY date desc";
    connection.query(query, function (err, rows, fields) {
        if(!err){
            total_no_of_records=rows[0].totalRec;
        }
        else{
            total_no_of_records=0;
        }
        if(check_val===1){
            totalRecCallBack(total_no_of_records);
        }
    });
};

var getToUserParserObjectId=function(r,toUsr,call_back){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var strObjId="";
    var strSql="select * from users where user_name='"+toUsr+"'";
    connection.query(strSql, function (err, rows, fields) {
        if(!err){
            for(i in rows){
                strObjId=rows[i].parser_id;
            }
        }
        else{
            strObjId=null;
        }
        if(r===1){
            call_back(strObjId);
        }
    });
};
var funGetToUserPics = function(toUsr,cback){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var c=1;
    var pic_json=new Object();
    var strSql="select * from user_pics where user_name='"+toUsr+"'";
//    console.log(strSql);
    connection.query(strSql, function (err, rows, fields) {
        if(!err){
            for(i in rows){
                if(i<5) {
                    //console.log("I: "+i+" C: "+c+", PicPath: "+pic_path + pic_folder + toUsr + "/" + rows[i].pic_name);
                    pic_json["Picture" + c] = pic_path + pic_folder + toUsr + "/" + rows[i].pic_name;
                    c=c+1;
                }
            }
            if(c===6){
                //console.log("C: "+c+" json: "+JSON.stringify(pic_json));
                cback(pic_json);
            }


        }
    });
};

var insertChatLogToDB=function(count, fromUser, toUser, fullDate,fullTime ,data,msg_Status,roomName,cb) {
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var strSql = "insert into chat_log(from_userid,to_userid,text,date,time,status,roomname) values('" + fromUser + "','" + toUser + "','" + data + "','" + fullDate +" " +fullTime+"','"+fullTime+"','"+msg_Status+"','"+roomName+"')";
    //console.log(strSql);
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
};
var findUserRoom=function(r,fromUsr,toUsr,callBack){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var usrStatus;
    var query="select distinct(roomname) from chat_log where(from_userid='"+fromUsr+"' and to_userid='"+toUsr+"') or (from_userid='"+toUsr+"' and to_userid='"+fromUsr+"')";
    console.log(query);
    connection.query(query, function (err, rows, fields) {
        if (!err) {
            if(rows.length>0){
                usrStatus=rows[0].roomname;
            }
            if(r===1){
                callBack(usrStatus);
            }
        }
    });
};
var checkToUserStatus = function(toUsr,cb){
    if(connection===null){
        connection=sqlConnection.handleDisconnect();
    }
    var usr_Status;
    var query= "select status from user_status where user_id='"+toUsr+"'";
    connection.query(query, function (err, rows, fields) {
        if (!err) {
            usr_Status=rows[0].status;
        }
        cb(usr_Status);
    });
};
var findSocket = function(socketId, sockets){
    for(var socketKey in sockets){
        var socketObj = sockets[socketKey];
        //console.log('findSocket - socketObj = '+sockets[socketKey]);// Comment this line
        if(socketObj.username === socketId){
            console.log('findSocket - socketObj.username = '+socketObj.username);// Comment this line
            return socketObj;
        }
    }
    return null;
};// End of findSocket function

module.exports = ioChat;
