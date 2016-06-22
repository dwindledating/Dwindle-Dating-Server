/**
 * Created by ali on 3/27/2015.
 */
var express = require('express');
var router= express.Router();
var formidable= require('formidable');
var format = require('util').format;
var util = require('util');
var sqlConnection=require('../routes/MySQLDbClass');
var fs = require('fs-extra');

var user_name;
var output = new Object();
var output_JSON={};
var count=1;
/**
 * API for UploadPictureToServer
 * @module addUserPicture
 * @param {Multipart/form-data} fb_id  facebook ID of the User
 * @param {Multipart/form-data} user_gender  Gender of the User
 * @param {Multipart/form-data} req_gender  required gender of the User to date
 * @param {Multipart/form-data} req_from_age  Required Age Group Range
 * @param {Multipart/form-data} req_to_age  Required Age Group Range
 * @param {Multipart/form-data} distance  Required Area/range distance buffer area where anyone connect
 * @param {Multipart/form-data} image Multiple Picture format(jpg) more then l
 * @returns {JSON} Results as RegisteredSuccessful or RegisteredUnSuccessful <p> Output Example: {"STATUS":"Registered Successful"}</p>
 * @description Usage: http://159.203.245.103:3000/signup <p>Form will be POST whose type is multipart/form-data</p>
 * <p>METHOD: POST</p>
 */
router.post("/",function(req,res,next){
    //console.log("ID: "+req.fb_id);
    dumpSignUpRecordToDB(req,res);
    //res.send(JSON.stringify(output));
});

/**
 *
 * @param req
 * @param res
 * @param next
 */
function dumpSignUpRecordToDB(req,res){
//    var form = new multiparty.Form();

    var image;
	var pic_count=1;
    var save_directory="/home/ubuntu/dwindle_dating/public/uploadedImages/";
	var pic_path1="uploadedImages/"
    var temp_path;
    var inputData = new Object();
    var pic_name=[];

    var connection = sqlConnection.handleDisconnect();
    var data={};
    var form = new formidable.IncomingForm();

    data['req']=req;
    data['res']=res;

    var request=data.req;
    var response=data.res;

    form.on('field', function(field, value) {

        data[field]=value;
    });
    form.on('end', function(field, value) {
        addUserStatus(req,res);
        var resJson=new Object();
        //resJson['STATUS']="Registered Successful";
        //res.send(JSON.stringify(resJson));
		var resJson={
            STATUS:'Registered Successful'
        };
		res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resJson));

    });

    form.on('fileBegin', function(name, file) {
        //console.log("Count: "+name);
        var dir= save_directory+data.fb_id;
		 var f_name=file.name;
        var f_name_arr=f_name.split(".");
        file.name=pic_count+"."+f_name_arr[1];
        //console.log("Name: "+name+", File Name: "+file.name);
        pic_count=pic_count+1;
        data['pic_name']=file.name;
        data['pic_path']=pic_path1+data.fb_id+"/";
		//console.log(file.path);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir); 
        }
		 
        file.path = dir +"/"+ file.name;
        dumpDataToDB(req,res);
    });

    form.parse(req, function(err, fields, files) {


    });



    var dumpDataToDB = function(req,res){
        var picTableData={};
       // console.log("A: "+count);
        count=count+1;
       // picTableData['user_id']=data.user_id;
        picTableData['user_name']=data.fb_id;
        picTableData['pic_path']=data.pic_path;
        picTableData['pic_name']=data.pic_name;
        var insertQuery = "Insert into user_pics SET ?";
        connection.query(insertQuery, picTableData, function(err,result){

            if(!err){

                output["PicId"] = result.insertId;
                output["UserName"] = data.fb_id;
                output["Pic_Path"] = "http://159.203.245.103:3000/"+data.pic_path+data.pic_name;
                output["Pic_Name"] = data.pic_name;
                output["Status"] = "UserRegistered";
                output_JSON[count]=output;
                //console.log(JSON.stringify(output_JSON));
                //res.send(JSON.stringify(output));
            }else{
                console.log("Dumping Error:"+ err);
            }
        });
    };


    function addUserStatus(req,res){
        var userStatus_data={};
        userStatus_data['user_id']=data.fb_id;
        userStatus_data['status']="loggedin";
        userStatus_data['req_gender']=data.req_gender;
        userStatus_data['req_from_age']=data.req_from_age;
        userStatus_data['req_to_age']=data.req_to_age;
        userStatus_data['distance']=data.distance;

        var query="insert into user_status SET ? ";
        connection.query(query, userStatus_data, function(err,result){
            if(!err){
                var userTable_Data={};
				var date_of_birth=data.dob;
				var today = new Date();
				var parts = date_of_birth.match(/(\d{4})(\d{2})(\d{2})/),
				dateObj = new Date(parts[1], parts[2]-1, parts[3]); // months 0-based!
				var birthDate = new Date(dateObj);
				var age = today.getFullYear() - birthDate.getFullYear();
				var m = today.getMonth() - birthDate.getMonth();
				if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
						age--;
				}
				
                userTable_Data['user_name']=data.fb_id;
                userTable_Data['gender']=data.user_gender;
				//userTable_Data['age']='20';
				userTable_Data['age']=age;
				userTable_Data['name']=data.user_name;
				userTable_Data['dob']=data.dob;
				console.log(JSON.stringify(userTable_Data));
                var query1="insert into users SET ? ";
                //console.log(query1);
                connection.query(query1, userTable_Data, function(err1,result1){
                    if(!err1){
                        data['user_id']=result1.insertId;
                        dumDataToUserSignup(req,res);

                    } 
                    else{
                        var response_JSON={
                            status:'UnSuccessful'
                        };
                        res.send(JSON.stringify(response_JSON));
                    }
                });
            }
            else{
                console.log(err);
                var response_JSON={
                    status:'UnSuccessful'
                };
				console.log(JSON.stringify(response_JSON));
                //res.send(""+JSON.stringify(response_JSON));
            }
        });
    }
    var dumDataToUserSignup=function(req,res){
        var userSignUp_Data={};
        userSignUp_Data['facebook_id']=data.fb_id;
        userSignUp_Data['status']="RegisteredUser";
        var query1="insert into user_signup SET ? ";
        connection.query(query1, userSignUp_Data, function(err1,result1){
            if(!err1){
                //dumpDataToDB(req,res);
                //uploadUserImagesToServer(req,res,field, file);
            }
            else{

                var response_JSON={
                    status:'UnSuccessful'
                };
                res.send(""+JSON.stringify(response_JSON));
            }
        });
    };

}

module.exports=router;