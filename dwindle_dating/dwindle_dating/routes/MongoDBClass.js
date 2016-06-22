//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/dwindle_dating';

// Use connect method to connect to the Server
var MongoDbConnection;
 MongoClient.connect(url, function (err, db) {
  if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
      return err;
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // do some work here with the database.

    //Close connection
    //db.close();
    MongoDbConnection = db;
    console.log(MongoDbConnection.collection('user_pics'));
  }
});


 exports.db = MongoDbConnection;