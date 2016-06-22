/**
 * Created by ali on 5/13/2015.
 */
var express = require('express');
//var apns= require('apns');
//var apn= require('apn');
var Parse = require("parse").Parse;
var fs = require('fs');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

router.get("/",function(req,res){
    setPushNotification(req,res);

});
var setPushNotification = function (req,res){
    Parse.initialize(
        "HEQ0TQq0Qvqdy7BAGii05miGcVp5AcvGbnvdhxQd", // applicationId
        "TMRcC6J1ns1tifkDutewTjgH4vRghDqV6ESfxZpI" // javaScriptKey

    );
    Parse.Push.send({
        channels: [ "Parse", "test" ],
        data: {
            alert: "This is Test Notification from Rajab from Parse."
        }
    }, {
        success: function() {
            console.log("send okkkkkk");
			var response_JSON={
				status:'Notification Sent'
			};
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(response_JSON));
        },
        error: function(error) {
            console.log("send error" + error);
			var response_JSON={
				status:'Notification Sending Failed'
			};
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(response_JSON));
            //console.dir(error)
            // Handle error
        }
    });
/*
    var options = {
        keyFile : fs.readFileSync("./routes/certs/apnagent-dev-key.pem"),
        certFile :fs.readFileSync("./routes/certs/apnagent-dev-cert.pem"),
        debug : true,
        "batchFeedback": true,
        "interval": 300
    };
    var token = "810e571068db6f3082b29802ce250e89568d5ec734ee59b9535419b76638934b";
    var apnConnection = new apn.Connection(options);
    var myDevice = new apn.Device(token);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    console.log("Expiry: "+note.expiry);
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = {'messageFrom': 'Caroline'};

    apnConnection.pushNotification(note,myDevice);

    var feedback = new apn.Feedback(options);
    feedback.on("feedback", function(devices) {
        devices.forEach(function(item) {
            // Do something with item.device and item.time;
            console.log("Device Token: "+item.device+" , Time: "+item.time);
        });
    });
*/

    /*var apnconnection = new apns.Connection(options);


     var token = "810e571068db6f3082b29802ce250e89568d5ec734ee59b9535419b76638934b",
     notification = new apns.Notification(),
     device = new apns.Device(token);

     notification.alert = "Push Notification Test From Ali Rajab!";
     notification.device = new apns.Device(token);

     apnconnection.sendNotification(notification);*/
    
};


module.exports=router;