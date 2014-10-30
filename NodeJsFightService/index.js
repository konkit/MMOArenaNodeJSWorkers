/*jslint node:true*/

var express = require('express');

var mongoClient = require('mongodb').MongoClient;

var mongo = require('mongodb');
var BSON = require("bson");

mongoClient.connect('mongodb://localhost/mmoarena_db', function (err, db) {
    if (err) { throw err; }

    console.log("Connected to MongoDB");

    var app = express();

    app.get('/requestFight/:playerId', function (req, res) {
        var collection = db.collection('fightRequests');
        collection.insert(
            {
                playerId: req.params.playerId,
                fightState: "PENDING",
                fightId: -1
            },
            function (err, result) {
                if (err) { throw err; }
                /*jslint nomen: true*/
                res.send({playerId: req.params.playerId, requestId: result[0]._id});
                /*jslint nomen: false*/
            }
        );
    });

    app.get('/getFight/:fightId', function (req, res) {
        var collection = db.collection('fightRequests');

        console.log("finding by id : " + req.params.fightId);

        var searchedId = new BSON.ObjectId(req.params.fightId);
        collection.find({'_id': searchedId}).toArray(function (err, docs) {
            console.log("Docs : " + docs);

            res.send({state: docs[0]});
        });
    });

    app.get('/hc', function (req, res) {
        var date = new Date();
        var current_hour = date.getHours();

        res.send("OK" + ", " + date);
    });

    app.get('/crossdomain.xml', function (req, res) {
        var crossDomainXml =
            "<?xml version=\"1.0\"?>" +
            "<cross-domain-policy>" +
            "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
            "</cross-domain-policy>";

        res.send(crossDomainXml);
    });

    app.get('/hc', function (req, res) {
        var date = new Date();
        var current_hour = date.getHours();

        res.send("OK" + ", " + date);
    });

    app.listen(5000);
    console.log('Listening on port 5000...');


    setInterval(function () {
        var collection = db.collection('fightRequests');

        collection.count({fightState: "PENDING"}, function (err, count) {
            if (err) { throw err; }
            if (count < 2) {
                console.log("No pending fight requests");
                return;
            }

            collection.find({fightState: "PENDING"}, {limit: 2}).toArray(function (err, docs1) {
                if (err) { throw err; }

                console.log("Found fight between ");
                console.log(JSON.stringify(docs1[0]));
                console.log(" and ");
                console.log(JSON.stringify(docs1[1]));

                if ((!docs1[0]._id || !docs1[1]._id)) {
                    console.log("One of the fightRequest object is null");
                    return;
                }

                var fightCollections = db.collection('fights');
                fightCollections.insert(
                    {
                        player1: docs1[0].playerId,
                        player2: docs1[1].playerId
                    },
                    function(err, result) {
                        if( err ) throw err;

                        console.log( "CREATED FIGHT : " + JSON.stringify(result));

                        /*jslint nomen: true*/
                        var fightId = result[0]._id;
                        /*jslint nomen: false*/

                        collection.update(
                            {
                                _id: docs1[0]._id
                            },
                            {
                                $set: {
                                    fightId : fightId,
                                    fightState: "PREPARED",
                                    enemyId: docs1[1].playerId
                                }
                            },
                            function(err, result) {

                            }
                        );

                        collection.update(
                            {
                                _id: docs1[1]._id
                            },
                            {
                                $set: {
                                    fightId : fightId,
                                    fightState: "PREPARED",
                                    enemyId: docs1[0].playerId
                                }
                            },
                            function(err, result) {

                            }
                        );
                    }
                );
            });
        });

    }, 2000)
});


// chat service
var http = require('http');
var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function (conn) {
    connections.push(conn);
    var number = connections.length;
    //conn.write("Welcome, User " + number);
    conn.on('data', function (message) {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write(message);
        }
    });
    conn.on('close', function() {
        for (var ii=0; ii < connections.length; ii++) {
            //connections[ii].write("User " + number + " has disconnected");
        }
    });
});

var server = http.createServer();
chat.installHandlers(server, {prefix:'/chat'});
server.listen(9999, '0.0.0.0');

