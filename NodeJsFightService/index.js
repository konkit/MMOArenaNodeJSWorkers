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

    require('./matchmaker.js')(db);
});

require('./websocket_chat.js');