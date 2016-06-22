var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('socket.io').listen(server);
//var user_login_status= require('./routes/userLoginStatus');
//var add_pic=require('./routes/GetPictureFile');
//var user_signin= require('./routes/Signin');
var user_location=require('./routes/SetUserLocation');
var user_login=require('./routes/Login');
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

//app.use("/", express.static(__dirname + '/public'));
//console.log(__dirname);
process.env.PWD = process.cwd();
//console.log("Path: "+process.env.PWD);
app.use(express.static(process.env.PWD + '/dwindle_dating/public'));

//app.use("/user_login_status",user_login_status);
//app.use("/add_user_picture",add_pic);
//app.use("/signin",user_signin);
app.use("/setUser_location",user_location);
app.use("/login",user_login);
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


module.exports = app;