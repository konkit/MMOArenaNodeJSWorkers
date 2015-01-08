var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var BSON = require("bson");

mongoClient.connect('mongodb://localhost/mmoarena_db', function (err, db) {
    if (err) { throw err; }

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
                res.send({playerId: req.params.playerId, requestId: result[0]._id});
            }
        );
    });

    app.get('/getFight/:fightId', function (req, res) {
        var collection = db.collection('fightRequests');
        var searchedId = new BSON.ObjectId(req.params.fightId);
        collection.find({'_id': searchedId}).toArray(function (err, docs) {
            res.send({state: docs[0]});
        });
    });

    app.get('/hc', function (req, res) {        
        res.send("OK" + ", " + new Date());
    });

    app.get('/crossdomain.xml', function (req, res) {
        var crossDomainXml = "<?xml version=\"1.0\"?><cross-domain-policy>" +
            "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
            "</cross-domain-policy>";

        res.send(crossDomainXml);
    });

    app.listen(5000);
    console.log('Listening on port 5000...');

    require('./matchmaker.js')(db);
});