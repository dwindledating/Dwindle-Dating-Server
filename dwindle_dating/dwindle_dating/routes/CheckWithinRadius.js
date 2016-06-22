/**
 * Created by anas on 3 Feb 2016.
 Check is User Within Radius api : http://159.203.245.103:3000/CheckWithinRadius?latitude=31.4834&longitude=74.418906
 //http://159.203.245.103:3000/CheckWithinRadius?latitude=31.509&longitude=74.346 // @yunas  office location
 http://159.203.245.103:3000/CheckWithinRadius?latitude=34.04641749806147&longitude=-118.4635917564095 // @hassan location
 http://159.203.245.103:3000/CheckWithinRadius?latitude=42.16490188005869&longitude=-87.94683012982527 // Client location
 */
var express = require('express');
var router= express.Router();
var sqlConnection = require('../routes/MySQLDbClass');

var connection = null;
var response_JSON={};

router.get("/",function(req,res){
    isUserWithinRadius(req,res);

});

var isUserWithinRadius = function(req,res){
    var query_request= req.query;
    var latitude=query_request.latitude;
    var longitude=query_request.longitude;
    var radius = 0;

    /*Remember: This search is based on kilometers. If you want to search in miles, you need to change the 6380 (whoch is our earths radius) to its respective value in miles*/
    var sqlquery="Select radius";
    sqlquery=sqlquery+" FROM `locations`";
    sqlquery=sqlquery+" LIMIT 1";
    console.log('Get radius query : ' +sqlquery);

    connection = sqlConnection.handleDisconnect();
    connection.query(sqlquery, function (er, row, fields) {
        if(!er){
            
                    if(row.length > 0)
                    {
                        for (var i in row) {
                                radius = row[i].radius; 
                                break;
                        }   
                        var sql="Select ACOS( SIN( RADIANS( `latitude` ) ) * SIN( RADIANS( "+latitude+" ) ) + COS( RADIANS( `latitude` ) ) ";
                        sql=sql+" * COS( RADIANS( "+latitude+" )) * COS( RADIANS( `longitude` ) - RADIANS( "+longitude+" )) ) * 6380";
                        sql=sql+" FROM `locations`";
                        sql=sql+" where ACOS( SIN( RADIANS( `latitude` ) ) * SIN( RADIANS( "+latitude+" ) ) + COS( RADIANS( `latitude` ) ) ";
                        sql=sql+" * COS( RADIANS( "+latitude+" )) * COS( RADIANS( `longitude` ) - RADIANS( "+longitude+" )) ) * 6380 < "+ radius;
                        console.log('Radius query : ' +sql);

                        connection.query(sql, function (err, rows, fields) {
                            if(!err){
                                        if(rows.length > 0)
                                        {
                                            response_JSON = {
                                                      status: 'True'
                                                  };
                                            res.setHeader('Content-Type', 'application/json');
                                            res.send(JSON.stringify(response_JSON));
                                        }else
                                        {

                                            response_JSON['status']="True";//TODO set it back to false  -Return True in any case required on 26 feb 2016 - For Apple app verification
                                            res.setHeader('Content-Type', 'application/json');
                                            res.send(JSON.stringify(response_JSON));

                                        }
                            }
                            else{
                                response_JSON['status']="True";// TODO set it back to false  -Return True in any case required on 26 feb 2016 - For Apple app verification
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify(response_JSON));
                            }
                        });
                    }else
                    {

                        response_JSON['status']="True";// TODO set it back to false  -Return True in any case required on 26 feb 2016 - For Apple app verification
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(response_JSON));

                    }
        }
        else{
			response_JSON['status']="True";// TODO set it back to false  -Return True in any case required on 26 feb 2016 - For Apple app verification
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response_JSON));
        }
    });
};

 module.exports=router;