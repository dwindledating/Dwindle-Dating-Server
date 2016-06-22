/**
 * Created by anas on 12 Oct 2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');
var connection=null;


//Start - open socket in start after login -- anas - 13 Oct 2015
var chatIo = null;
var ioChat = function (chatio) {
    if (!(this instanceof ioChat)) {
        return new ioChat(chatio);
    }

    this.chatIo = chatio;
    //console.log('IO: '+JSON.stringify(io));
    checkSignupStatus(this.chatIo);
};

 
function checkSignupStatus(io){

  io.sockets.on('connection', function(socket){

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

      socket.on('login', function (user_facebook_id) {

          var facebook_id=user_facebook_id;
          if(connection===null) {
                    connection = sqlConnection.handleDisconnect();
                }

          var query="select * from user_signup where facebook_id='"+facebook_id+"'";
          console.log('login query = ' + query);
          connection.query(query,function(err,rows,fields){
            console.log('login rows.length = ' + rows.length);
               if(rows.length==0){
                       response_JSON={
                           status:'NotRegistered'
                       };
                      
                          io.sockets.emit('event_user_not_registered', JSON.stringify(response_JSON));
                   }
                    else{
                       response_JSON={
                           status:'RegisteredUser'

                       };
                       getUserPreferencesFromDB(1,facebook_id,response_JSON,function(resultJSON){

                          socket.username=facebook_id;
                          var main_user = facebook_id;
                          var mainSocket = findSocket(main_user, io.sockets.connected);
                           if (mainSocket) {
                                mainSocket.emit('event_loggedIn', JSON.stringify(resultJSON));
                            }
                       });
            //           res.setHeader('Content-Type', 'application/json');
            //           res.send(JSON.stringify(response_JSON));
                   }

            });
          });
    });
}
    //End

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

var findSocket = function(socketId, sockets){
    for(var socketKey in sockets){
        var socketObj = sockets[socketKey];
        //console.log('findSocket - socketObj = '+sockets[socketKey]);// Comment this line
        if(socketObj.username === socketId){
            console.log('Login - findSocket - socketObj.username = '+socketObj.username);// Comment this line
            return socketObj;
        }
    }
    return null;
};// End of findSocket function

module.exports=ioChat;