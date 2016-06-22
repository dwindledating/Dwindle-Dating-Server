var express = require('express');
var router= express.Router();
var mysql = require('mysql');

router.get("/:fb_id",function(req,res){
    getUserStatus(req,res);

});

function handleDisconnect() {
       var db_config={
    host: 'localhost',
    user: 'root',
    password: 'dwindle21212',
    database: 'dwindle_dating'
};
    var connection;
    connection = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
    return connection;
}



function getUserStatus(req,res){
    var connection= handleDisconnect();
    var user_id= req.params.fb_id;
    var queryString = "SELECT * FROM user_status where user_id='"+user_id+"'";
    console.log(queryString);
    var response_JSON;
    connection.query(queryString, function(err, rows, fields) {
        if (err){
            response_JSON={
                status:'loggedout'
            };
        }
        else {
            var numRows = 0;
            numRows = rows.length;
            if(numRows!=0) {
                for (var i in rows) {
                    status=rows[i].status;
                    //console.log("status: "+status);
                    response_JSON={
                        status:status
                    };
                }

            }
            else{
                response_JSON={
                    status:'loggedout'
                };
            }
        }
        //console.log(JSON.stringify(response_JSON));
        res.send(""+JSON.stringify(response_JSON));
    });

}
module.exports=router;