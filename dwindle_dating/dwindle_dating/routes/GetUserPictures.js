/**
 * Created by ali on 4/26/2015.
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection;
var path='http://159.203.245.103:3000/uploadedImages/';

/**
 * API for GetUserPictures
 * @module GetUserPictures
 * @param {String} fb_id  facebook ID of the User
 * @returns {JSON} Results as Record Updated <p> Returns fb_id:, Pic1 Name:, Pic1 Path<:, Pic2 Name:, Pic2 Path:, ...../p>
 * @description Usage/Examples: http://159.203.245.103:3000/GetUaserPictures?fb_id=FacebookID<p></p>
 * <p>METHOD: GET</p>

 */


router.get("/",function(req,res){
    //console.log("Inside ");
    getUserPicsFromDB(req,res);

});
var getUserPicsFromDB=function(req,res){
    var query_request= req.query;
    var facebook_id=query_request.fb_id;
    funGetPicList(6,facebook_id,function(userPicList){
        //console.log(userPicList);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(userPicList));
    });

};
function funGetPicList(rec,facebook_id,cb){
    var userPicInfo=new Object();
    userPicInfo['fb_id']=facebook_id;
    var c=1;
    connection = sqlConnection.handleDisconnect();
    var sql="select * from user_pics where user_name='"+facebook_id+"'";
    connection.query(sql,function(err,rows,fields){
        if(!err) {
            for (var i in rows) {
                var picVar='Pic' +c;
                var picVariable = 'Pic' +c;
                picVariable = picVariable + " Name";
                userPicInfo[picVariable] = rows[i].pic_name;
                userPicInfo[picVar+' Path'] = path + facebook_id+"/"+rows[i].pic_name;;
                c=c+1;
                //console.log(userPicInfo);
            }
            if(c===rec){
                cb(userPicInfo);
            }
        }
    });
}

module.exports=router;