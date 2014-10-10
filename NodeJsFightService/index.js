var express = require('express');



var mongoClient=require('mongodb').MongoClient;

var mongo = require('mongodb');
var BSON = require("bson")

mongoClient.connect('mongodb://localhost/mmoarena_db', function(err, db) {
    if (err) throw err;

    console.log("Connected to MongoDB");

    var app = express();

    app.get('/requestFight/:playerId', function(req, res) {
        var collection = db.collection('fightRequests')
        collection.insert(
            {
                playerId: req.params.playerId,
                fightState: "PENDING",
                fightId: -1
            },
            function(err, result) {
                if(err) throw err;
                res.send({playerId: req.params.playerId, requestId: result[0]._id});
            }
        );
    });

    app.get('/getFight/:fightId', function(req, res) {
        var collection = db.collection('fightRequests')

        console.log("finding by id : " + req.params.fightId)

        var searchedId = new BSON.ObjectId(req.params.fightId)
        collection.find({'_id': searchedId}).toArray(function(err, docs) {
            console.log("Docs : " + docs)

            res.send({state: docs[0]})
        });
    });

    app.listen(5000);
    console.log('Listening on port 5000...');


    setInterval(function() {
        var collection = db.collection('fightRequests')

        collection.count({fightState: "PENDING"}, function (err, count) {
            if (err) throw err;
            if( count < 2) {
                console.log("No pending fight requests")
                return;
            }

            collection.find({fightState: "PENDING"}, {limit: 2}).toArray(function(err, docs1) {
                if( err ) throw err;

                console.log("Found fight between ")
                console.log(JSON.stringify(docs1[0]) )
                console.log(" and ")
                console.log(JSON.stringify(docs1[1]) );

                if( (!docs1[0]._id || !docs1[1]._id) ) {
                    console.log("One of the fightRequest object is null")
                    return;
                }

                var fightCollections = db.collection('fights')
                fightCollections.insert(
                    {
                        player1: docs1[0].playerId,
                        player2: docs1[1].playerId
                    },
                    function(err, result) {
                        if( err ) throw err;

                        console.log( "CREATED FIGHT : " + JSON.stringify(result) )

                        var fightId = result[0]._id

                        collection.update(
                            {
                                $or:[
                                    {_id: docs1[0]._id},
                                    {_id: docs1[1]._id}
                                ]
                            },
                            {
                                $set: {
                                    fightId : fightId,
                                    fightState: "PREPARED"
                                }
                            },
                            { multi: true },
                            function(err, result) {

                            }
                        );
                    }
                )



            });
        });

    }, 2000)
});
