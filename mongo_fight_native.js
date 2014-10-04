// Load the TCP Library
var net = require('net');
var http = require('http');
var request = require('request');

var mongoClient=require('mongodb').MongoClient;
var mongoDbObj;

mongoClient.connect('mongodb://localhost/mmoarena_db', function(err, db){
    if(err)
        throw err;

    console.log("Connected to MongoDB");

    // Start a TCP Server
    net.createServer(function (socket) {
        // When data is received :
        socket.on('data', function (data) {
            try {
                receivedDataObj = JSON.parse(data)

                console.log("! Recv data : " + data)

                // get fight id and player id from input data from Unity client
                var fightId = receivedDataObj.fightId
                var playerId = receivedDataObj.playerId

                var response = null

                //TODO: fetch fight with given id from MongoDB
                db.collection('mongoFight').find({"fightId":fightId}).toArray(function(err, data) {
                    if(err) throw err;

                    console.log("Found data : " + JSON.stringify(data) )

                    fightInstance = data[0];
                    var fightState = fightInstance.state

                    console.log("Fight instance found : " + JSON.stringify(fightInstance) )

                    //TODO: if gamestate is Waiting for second player then send it to backend
                    if( fightState == "FINISHED" ) {
                        response = "FINISHED "
                    } else if( fightState == "WAITING" ) {
                        response = "WAITING "
                    } else {
                        //TODO: determine which player is "player", which is "enemy"
                        console.log("player1 characterId = " + fightInstance.player1.characterId)
                        console.log("player2 characterId = " + fightInstance.player2.characterId)

                        var player = null;
                        var enemy = null;

                        if (fightInstance.player1.characterId == playerId) {
                            //TODO: actualize player data in DB
                            player = fightInstance.player1
                            enemy = fightInstance.player2;
                        } else if (fightInstance.player2.characterId == playerId) {
                            player = fightInstance.player2;
                            enemy = fightInstance.player1;
                        }

                        player.x = receivedDataObj.posX;
                        player.y = receivedDataObj.posY;
                        player.z = receivedDataObj.posZ;
                        player.yaw = receivedDataObj.yaw;
                        player.hp = receivedDataObj.hp;

                        //TODO: if player or enemy hp is <= 0 then fight is finished
                        if (player.hp <= 0) {

                        } else if (enemy.hp <= 0) {

                        } else {
                            //TODO: update player data
                            db.collection('mongoFight').update({fightId: fightId}, {$set:{player1: fightInstance.player1, player2: fightInstance.player2}}, {w:1}, function(err, result) {
                                if( err ) throw err


                            });

                            console.log("Generating response from fightInstance")

                            // Generate response for Unity3D client
                            var responseArr = [
                                {player: player, enemy: enemy}
                            ]

                            response = JSON.stringify(responseArr)
                        }
                    }

                    console.log("Response : " + response)

                    //TODO: generate response
                    response = response.length + '#' + response;

                    console.log("Response after length adding")

                    socket.write( response )
                });



            }catch(err) {
                console.log("Error occured : " + err)

                var response = "ERROR occured : " + err;
                response = response.length + '#' + response;
                socket.write(response)
            }
        });
    }).listen(5000);

});


//Crossdomain issues - for Unity3D purposes
net.createServer(function(socket) {
    var crossDomainXml =
        "<?xml version=\"1.0\"?>" +
        "<cross-domain-policy>" +
        "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
        "</cross-domain-policy>";

    socket.write(crossDomainXml);
}).listen(843);

