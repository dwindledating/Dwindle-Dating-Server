/**
 * Created by ali on 3/18/2015.
 */
var express = require('express');
var router= express.Router();
var multiparty = require('multiparty');
var format = require('util').format;
var sqlConnection=require('../routes/MySQLDbClass');
var fs = require('fs');
var img_chunks=[];
var user_name;
var img_name;
var function_result;
/**
 * API for UploadPictureToServer
 * @module addUserPicture
 * @param {Multipart/form-data} fb_id  facebook ID of the User
 * @param {Multipart/form-data} image Single Picture format(jpg)

 * @returns {JSON} Results as Successful or UnSuccessful <p> Output Example: {"PicId":7,"UserName":"alirajabraza","Pic_Path":"uploadedImages/alirajabraza/","Pic_Name":"1962695.jpg"}</p>
 * @description Usage: http://159.203.245.103:3000/add_user_picture <p>Form will be POST whose type is multipart/form-data</p>
 * <p>METHOD: POST</p>
 */
router.post("/",function(req,res,next){
    getPictures(req,res,next);

});
// function to read the image file from client side
/**
 *
 * @param req
 * @param res
 * @param next
 */
function getPictures(req,res,next){
    var form = new multiparty.Form();

//    userId=req.params.fb_id;
//    console.log(userId);
    var image;
    var save_directory="uploadedImages";
    var inputData = new Object();
    console.log("In Function");
    // listen on part event for image file
    /**
     * @apiDefine form.on event
     *
     * @apiParam {part} form parts
     *
     */

    form.on('part', function(part){
        if (part.name === 'image') {
            image = {};
            image.filename = part.filename;
            image.size = 0;
            //  reading image from form and adding image data to array
            part.on('data', function (buf) {
                image.size += buf.length;
                img_chunks.push(buf);
            });
        }else {
            part.on('data', function(buf){
//                user_name = buf.toLocaleString();
                inputData[part.name] = buf.toLocaleString();
            });
        }
    });
    // listen close part event for image file
    form.on('close', function(){
        /**
         * checking whether user exists in db
         * @type {*}
         */
        var connection = sqlConnection.handleDisconnect();
        var query = "Select * from users where user_name = '"+inputData["fb_id"]+"'";
        connection.query(query,function(err,rows,fields){
           if(err){
               console.log("Select Error:"+err);
           } else{
               if(rows.length > 0 ){
                   var data = {};
//                   (user_id,pic_path,pic_name)
                   data["user_id"] = rows[0].id;
                   data["pic_path"] = save_directory+"/"+ inputData["fb_id"] + "/";
                   data["pic_name"]=image.filename;
                   // image file
                   createImageFile(data["pic_path"], data["pic_name"]);
                   // dumping vlaues
                   dumpDataIntoDb(data,res,inputData["fb_id"]);
               }else{

               }
           }
        });
        /**
         * create image file on server
         * @type {string}
         */
        var createImageFile = function(dir,img_name){
            console.log(dir);
            var buffer = Buffer.concat(img_chunks);
            if (!fs.existsSync(dir)){
                fs.mkdirSync("/home/ubuntu/dwindle_dating/"+dir);
            }
            // saving image file to server
            var ws=fs.createWriteStream("/home/ubuntu/dwindle_dating/"+dir+img_name);
            ws.write(buffer);
            ws.end();
            console.log("File Saved");
        };
        /**
         * dumping information into database
         * @param data
         * @param res
         * @param username
         */
        var dumpDataIntoDb = function(data,res,username){
            var insertQuery = "Insert into user_pics SET ?";
            console.log("InsertQuery: "+insertQuery);
            connection.query(insertQuery, data, function(err,result){

                if(!err){
                    var output = new Object();
                    output["PicId"] = result.insertId;
                    output["UserName"] = username;
                    output["Pic_Path"] = "http://159.203.245.103:3000/"+data.pic_path;
                    output["Pic_Name"] = data.pic_name;
//                    output["UserID"] = data.user_id;
//                    output["data"]=data;
//                    console.log("Output:"+JSON.stringify(output));
                    res.send(JSON.stringify(output));
                }else{
                    console.log("Dumping Error:"+ err);
                }
            });
        };

    });

    // parse request as form multipart
    form.parse(req);

}

module.exports=router;