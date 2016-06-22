/**
 * @author Ali Rajab
 * @class MySQLDBConnection
 * @function handleDBConnection
 * @param{array}[DB Connection Parameters]
 * @returns{connection}


 */
var mysql = require('mysql');
/**
     *  Creating connection with MySQLDB
     *  MySQLDBClass defines the configuration file for connection, host, user, password, port, and DB name.
     *  handleDisconnect() function defines/create connection with MySQL , if server is either down or restarting (takes a while sometimes),
     *  introduce a delay before attempting to reconnect,
     *  to avoid a hot loop, and to allow our node script to process asynchronous requests in the meantime.
     *  if condition which shows: Connection to the MySQL server is usually lost due to either server restart, or a.
     *  connection idle timeout (the wait_timeout server variable configures this).
     *  after creating connection it return connection.
     *  function addChatToDB(chatData) gets chat data from the server.
     *  chatData is JSON which contains username and chat message.
     *  chatData.name and chat_data.msg.
     *  Insert records in the db table.
 */
/**
 *
  * @type {{db_config: {host: string, user: string, password: string, port: string, database: string}, handleDisconnect: handleDisconnect, addChatToDB: addChatToDB}}
 */
//DB connect live configurations - anas - 31 aug 2015 - TODO uncomment live settings and comment local settings before deployment
var MySQLDbClass={
    db_config:{
        host: 'localhost',
		user: 'root',
		password: 'dwindle21212',//AWS = dwindle21212,   dwindle2868
		database: 'dwindle_dating',
		port: 3306,
		socketPath  : '/var/run/mysqld/mysqld.sock'
    },
/*
//DB connect local configurations - anas - 31 aug 2015
var MySQLDbClass={
    db_config:{
         host     : 'localhost',
         user     : 'root',
         password :  null,
         database : 'dwindle_dating'
    }, 
    /**
     *
      * @return {*}
     */

    handleDisconnect:function(){
        var connection;
        connection = mysql.createConnection(this.db_config); // Recreate the connection, since
        // the old one cannot be reused.
		console.log('DB Connecting');
        connection.connect(function(err) {              // The server is either down
            if(err) {                                     // or restarting (takes a while sometimes).
                console.log('error when connecting to db:', err);
                //setTimeout(this.handleDisconnect(), 2000); // We introduce a delay before attempting to reconnect,
				MySQLDbClass.handleDisconnect(); // We introduce a delay before attempting to reconnect,
            }  
            // anas - 31 aug 2015
            else
            {
                console.log('Connected successfully with DB');
            }                                   // to avoid a hot loop, and to allow our node script to
        });                                     // process asynchronous requests in the meantime.
        // If you're also serving http, display a 503 error.
        connection.on('error', function(err) {
            console.log('db error', err+' -- '+err.code);
            if(err.code === 'PROTOCOL_CONNECTION_LOST') {
				// Connection to the MySQL server is usually
				//console.log('closiing DB Connection');
                //MySQLDbClass.closeConnection();                         // lost due to either server restart, or a
				console.log('Again Connecting DB');
				 MySQLDbClass.handleDisconnect();                         // lost due to either server restart, or a
            } else {                                      // connnection idle timeout (the wait_timeout
                throw err;                                  // server variable configures this)
            }
        });
        return connection;
    },
	closeConnection:function(connection){
        connection.end();
    }
   

};
 /**
     * @function addChatToDB
     * @param chat_data
     *
     */
  /* addChatToDB:function(chat_data){
        //    client.connect();
        // Create exhibit.
        var client=this.handleDisconnect();
        var sql = 'INSERT INTO test_chat (user_name,chat) VALUES ("' + chat_data.name + '","' + chat_data.msg + '")';
        client.query(sql,function(err,result){
            if(err){
                console.log(err);
            }
            else{
                console.log("Result Updated: "+result);
            }
        });
    }*/


/**
 *
 * @type {{db_config: {host: string, user: string, password: string, port: string, database: string}, handleDisconnect: handleDisconnect, addChatToDB: addChatToDB}}
 */
module.exports=MySQLDbClass;

