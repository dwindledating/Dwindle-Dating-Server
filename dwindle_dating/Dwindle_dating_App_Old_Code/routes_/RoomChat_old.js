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
            var query = "select up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up";
            query += " where us.user_id='" + username + "' and up.user_name ='" + username + "' limit 1";
            connection.query(query, function (err, rows, fields) {
                main_user['fb_id'] = username;
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
                        var userInfo={username:username,requiredGender:userRequirement['Required_Gender']};
                        userCheck.push(userInfo);
                        result_json['MainUser'] = main_user;

                    }
                    usrJSON.MainUser.push(main_user);
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
                        if(rows.length>0){
                              isBothUserCriteriaMatch(rows[0].user_id, username);

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
                                            var query ="select * from blocked_u