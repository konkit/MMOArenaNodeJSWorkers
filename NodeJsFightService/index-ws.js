var app = require('express')();
var mongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var BSON = require("bson");

var server = require('http').createServer(app);
var io = require('socket.io')(server)



mongoClient.connect('mongodb://localhost/mmoarena_db', function (err, db) {
    if (err) { throw err; }

    // service healthcheck
    app.get('/hc', function (req, res) {        
        res.send("OK" + ", " + new Date());
    });

    // crossdomain policy
    app.get('/crossdomain.xml', function (req, res) {
        var crossDomainXml = "<?xml version=\"1.0\"?><cross-domain-policy>" +
            "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
            "</cross-domain-policy>";

        res.send(crossDomainXml);
    });

    // serving static files - here the HTML client of matchmaker
    app.use(require('express').static(__dirname + '/public'));

    var requestCollection = db.collection('fightRequests');
    var fightCollection = db.collection('fights');

    // websocket connection itself
    io.on('connection', function(socket) {
        console.log('[SocketIO] A user connected');

        socket.emit('message', {'message': 'Connected successfully'});

        var fightRequestId = -1;
        var fightId = -1;
        var playerId = -1;

        var fightRequestCheckInterval = -1;

        socket.on('fightRequest', function(data){
            playerId = data.playerId;

            requestCollection.insert(
                {
                    playerId: playerId,
                    fightState: "PENDING",
                    fightId: -1
                },
                function (err, result) {
                    if (err) { 
                        socket.emit('error', err);
                        throw err; 
                    }

                    socket.emit('requestCreated', {playerId: data.playerId, requestId: result[0]._id});
                    fightRequestId = result[0]._id;
                    fightRequestCheckInterval = setInterval( function() { 
                        checkFightRequest(db) 
                    }, 1000);
                }
            );
        });

        function checkFightRequest(db) {
            requestCollection.find({'_id': fightRequestId}).toArray(function (err, docs) {
                if (err) { 
                    socket.emit('error', err);
                    throw err; 
                }

                if( docs[0].fightState == 'PREPARED') {
                    
                    fightCollection.find({'_id': docs[0].fightId }).toArray(function(err, fights){
                        if (err) { 
                            socket.emit('error', err);
                            throw err; 
                        }

                        fightId = fights[0]._id;
                        var enemyId = -1;
                        if( fights[0].player1 === playerId) {
                            enemyId = fights[0].player2
                        } else {
                            enemyId = fights[0].player1
                        }

                        clearInterval(fightRequestCheckInterval);
                        socket.emit('fightFound', {'roomId': fightId, 'playerId': playerId, 'enemyId': enemyId} )
                    });
                }
                
            });
        }

        socket.on('disconnect', function(){
            console.log('user disconnected, reqId : ' + fightRequestId + ', fightId : ' + fightId);

            clearInterval(fightRequestCheckInterval);

            if( fightRequestId !== -1) {
                console.log("Removing fight request " + fightRequestId);

                requestCollection.remove({'_id': fightRequestId}, function(err, data) { } )
            }
            if( fightId !== -1) {
                console.log("Setting fight " + fightId + " to FINISHED");

                fightCollection.update(
                    { '_id': fightId},
                    {
                        $set: {fightState: 'FINISHED'}
                    },
                    function(err, result) {
                        if (err) { 
                            socket.emit('error', err);
                            throw err; 
                        }
                    }
                );
            }
        });
    });

    server.listen(5000);
    console.log('Listening on port 5000...');

    require('./matchmaker.js')(db);


    



});

