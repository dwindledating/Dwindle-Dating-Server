/**
 * Created by ali on 4/26/2015.
 */
var express = require('express');
var router= express.Router();
var formidable= require('formidable');
var format = require('util').format;
var util = require('util');
var sqlConnection = require('../routes/MySQLDbClass');
var fs = require('fs-extra');
var connection;
var path='http://52.11.98.82:3000/uploadedImages/';
var pic_path="/home/ubuntu/dwindle_dating/public/uploadedImages/";

/**
 * API for UpdateUserPicture
 * @module UpdateUserPicture
 * @param {Multipart/form-data} fb_id  facebook ID of the User
 * @param {Multipart/form-data} pic_name  Gender of the User
 * @param {Multipart/form-data} image Single Picture format(jpg) more then l
 * @returns {JSON} Results as RegisteredSuccessful or RegisteredUnSuccessful <p> Output Example: {"STATUS":"Picture Updated"}</p>
 * @description Usage: http://52.11.98.82:3000/UpdateUserPicture <p>Form will be POST whose type is multipart/form-data</p>
 * <p>feilds names {fb_id},{pic_name}, image  </p>
 * <p>Multipart/Multidata  Form will be used to post fields and image for update</p>
 * <p>METHOD: POST</p>
 */


router.post("/",function(req,res){
    updateUserPic(req,res);
});
var updateUserPic = function(req,res){
//    var query_request= req.query;
//    var facebook_id=query_request.fb_id;
//    var old_pic_name=query_request.pic_name;
//    console.log(facebook_id + " , "+old_pic_name);
    var form = new formidable.IncomingForm();
    var data={};
    var pic_count=1;
    form.on('field', function(field, value) {
        //console.log("Field Count: "+field.count);
        //console.log(field);
        data[field]=value;
       // console.log(data);
    });
    form.on('end', function(field, value) {
        //console.log("Done");
        var resJson={
            STATUS:'Picture Updated'
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resJson));

    });
    form.on('fileBegin', function(name, file) {
        var fb_id=data['fb_id'];
        var old_pic_name=data['pic_name'];

        var f_name=file.name;
        funUpdatePicInDB(1,fb_id,old_pic_name,f_name,function(recUpdated){

        });
        //var f_name_arr=f_name.split(".");
        var dir= pic_path+fb_id;
        file.name=old_pic_name;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        file.path = pic_path+fb_id+"/" + file.name;

    });

    form.parse(req, function(err, fields, files) {


    });
function funUpdatePicInDB(rec,fb_id,oldPicName,newPicName,cb){
    var query="update user_pics set pic_name='"+oldPicName+"' where user_name='"+fb_id+"' and pic_name='"+oldPicName+"'";
    connection = sqlConnection.handleDisconnect();
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

};

module.exports=router;