var express = require('express');
var app = express();
var server = require('http').createServer(app);

//anas - if you creating a variable without var keyword then it will consider as global variable and will available in all files
//appServer = require('http').createServer(app); //require('./routes/getserver'); // TODO - Get app server intances - anas  - 5 Sep 2015

var io = require('socket.io').listen(server);
//var user_login_status= require('./routes/userLoginStatus'); 
//var add_pic=require('./routes/GetPictureFile');
//var user_signin= require('./routes/Signin');
var user_location=require('./routes/SetUserLocation');
var user_login=require('./routes/Login'); // TODO - anas - 13 - Commeted because it handle now with socket
var sign_up=require('./routes/Signup');
var getUserlists = require('./routes/GetUserListsToPlay');
var setAgeLimit = require('./routes/SettingAgeLimit');
var setDistance = require('./routes/ChangeDistanceRadius');
var userPics = require('./routes/GetUserPictures');
var updatePic = require('./routes/UpdateUserPicture');
var changeGender= require('./routes/ChangeRequiredGender');
var getMatchesResult = require('./routes/GetMatches');
var pushNotification=require('./routes/PushNotification');
//var doc=require('./routes/Documentation');
//Start-  29 Jan anas - APIs added for testing purpose
var unfriendMatch=require('./routes/UnfriendMatch');
var unfriendAllMatches=require('./routes/UnfriendMatches');
var resetAllUserStatus=require('./routes/ResetAllStatus');
var checkWithinRadius=require('./routes/CheckWithinRadius');//3 Feb 2016
var cleanAll = require('./routes/CleanAll'); // 15 Feb 2016
var getUsersByPreferences = require('./routes/GetUsersByPreferences'); // 5 April 2016
var deleteUserFromSystem = require('./routes/DeleteUserFromSystem'); // 10 April 2016
//End

app.use("/", express.static(__dirname + '/public'));
//console.log(__dirname);
process.env.PWD = process.cwd();
//console.log("Path: "+process.env.PWD);
app.use(express.static(process.env.PWD + '/dwindle_dating/public'));

//app.use("/user_login_status",user_login_status);
//app.use("/add_user_picture",add_pic);
//app.use("/signin",user_signin);
app.use("/setUser_location",user_location);
app.use("/login",user_login);// TODO - anas - 13 - Commeted because it handle now with socket
app.use("/signup",sign_up);
app.use("/Play",getUserlists);
app.use("/ChangeAgeLimit",setAgeLimit);
app.use("/ChangeDistanceRadius",setDistance);
app.use("/GetUserPictures",userPics);
app.use("/UpdateUserPicture",updatePic);
app.use("/ChangeRequiredGender",changeGender);
app.use("/GetMatches",getMatchesResult);
app.use("/Notification",pushNotification);
//app.use("/documentation",doc);
//Start-  29 Jan anas - APIs added for testing purposes
app.use("/UnfriendMatch",unfriendMatch);
app.use("/UnfriendMatches",unfriendAllMatches);
app.use("/ResetAllStatus",resetAllUserStatus);
app.use("/CheckWithinRadius",checkWithinRadius);//3 Feb 2016 
app.use("/CleanAll",cleanAll);// 15 Feb 2016
app.use("/GetUsersByPreferences",getUsersByPreferences);// 5 April 2016 
app.use("/DeleteUserFromSystem",deleteUserFromSystem);// 10 April 2016 
//End

		// verify features test page -anas - 4 sep 2015
		app.get('/verify', function (req, res) {
			//console.log(__dirname + '/public/verify.html');
		  res.sendFile(__dirname + '/public/verify.html');
		});

//TODO - Comment below code -  anas - 31/08/2015
/*server.listen(3000, function(){
  console.log('listening on *:3000');
});*/

module.exports = app;
