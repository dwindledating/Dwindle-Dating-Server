/**
 * Created by anas on 5 April 2016.
   Get all users within preferences : 
   http://159.203.245.103:3000/GetUsersByPreferences?fb_id=FacebookId&usrLon=longitude&usrLat=latitude
 	http://159.203.245.103:3000/GetUsersByPreferences?fb_id=1384562411874160&usrLon=34.04641749806147&usrLat=-118.4635917564095
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};
var userRequirement = {};

router.get("/",function(req,res){
    GetAllUsersByPreferences(req,res);
});


var GetAllUsersByPreferences = function(req,res){
	var query_request= req.query;
    var user_name = query_request.fb_id;
    var username = query_request.fb_id;
	var user_Lon = query_request.usrLon;
	var user_Lat = query_request.usrLat;
	connection = sqlConnection.handleDisconnect();

    var query = "select u.name,up.user_name,us.user_id,req_gender,req_from_age,req_to_age,distance, up.pic_name,up.pic_path from user_status us, user_pics up,users u";
                query += " where us.user_id='" + username + "' and up.user_name ='" + username + "' and u.user_name='"+username+"' limit 1";
                console.log('API : '+ query);
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
                        //console.log(rows.length);
                        //for (var i in rows) {
                        if(rows.length>0){
                            userRequirement['Required_Gender'] = rows[0].req_gender;
                            userRequirement['Required_From_Age'] = rows[0].req_from_age;
                            userRequirement['Required_To_Age'] = rows[0].req_to_age;
                            userRequirement['Distance'] = rows[0].distance;
                        }

                        findUserAccordingToCriteria(userRequirement,user_name,user_Lon,user_Lat,res);
                    }else{
						            response_JSON['status']="No User found";
						            res.setHeader('Content-Type', 'application/json');
						            res.send(JSON.stringify(response_JSON));
						 }
                });
};

var findUserAccordingToCriteria = function (userRequirement,user_name,user_Lon,user_Lat,res) {
                console.log("API - Finding user according to criteria...");
                var query = "Select name,user_id,status,(ACOS( SIN(RADIANS(Y(location)))*SIN(RADIANS(" + user_Lat + ")) + COS(RADIANS(Y(location)))*COS(RADIANS(" + user_Lat + "))*COS(RADIANS(X(location)- " + user_Lon + ")) ) * 6371)/1.60934 distance";
                query += " FROM users, user_status";
                query=query+ " where user_name = user_id and user_id <> '"+user_name+"' AND gender = '"+userRequirement['Required_Gender']+"' AND status <> 'playing' AND isPlaying = 0";// TODO-Imp  'AND isPlaying = 0' added on  19 Dec 2015 //AND distance < "+userRequirement['Distance']+" 
                query += " and age >=" + userRequirement['Required_From_Age'] + " and age <=" + userRequirement['Required_To_Age'];
                query += " AND `user_status`.`user_id` NOT IN (SELECT `blocked_user_id` FROM (`blocked_user`) where user_id='"+user_name+"')";//added on 19 Dec 2015 // updated on 14 Jan 2016 - TODO-Imp (where user_id='"+user_name+"') added
                query += " AND `user_status`.`user_id` NOT IN (SELECT `user_id` FROM (`blocked_user`) where blocked_user_id='"+user_name+"')";//added on 19 Dec 2015 // updated on 14 Jan 2016 - TODO-Imp ( where blocked_user_id='"+user_name+"') added
                query += " HAVING distance <" + userRequirement['Distance']; 
                query=query+" ORDER BY distance";

                // Preferences query Call - start
                connection.query(query, function (err, rows, fields) {
                    if (!err) {
	                    	if(rows.length > 0)
	                        {
	                        	response_JSON['status'] = "Successful";
	                        	var count = 0;
	                        	var user;
		                    	for (var i in rows) {
		                    		count =count +1;
		                    		user = 'user' + count;
		                            response_JSON[user]  = rows[i].user_id;
		                          }

						            res.setHeader('Content-Type', 'application/json');
						            res.send(JSON.stringify(response_JSON));
	                    	}
	                    	else{
						            response_JSON['status']="No User found";
						            res.setHeader('Content-Type', 'application/json');
						            res.send(JSON.stringify(response_JSON));
						        }
                    	}
                    	else{
				            response_JSON['status']="No User found";
				            res.setHeader('Content-Type', 'application/json');
				            res.send(JSON.stringify(response_JSON));
				        }
                    });
            };

 module.exports=router;