// Load the TCP Library
var net = require('net');
var http = require('http');
var request = require('request');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mmoarena_db');

var db = mongoose.connection;

var characterSchema = mongoose.Schema({
    characterId: Number,
    hp: Number,
    x: Number,
    y: Number,
    z: Number
});

var fightSchema = mongoose.Schema({
    _id: Number,
    state: String,
    player1: [characterSchema],
    player2: [characterSchema]
}, { collection: 'mongoFight' });

// NOTE: methods must be added to the schema before compiling it with mongoose.model()
//kittySchema.methods.speak = function () {
//    var greeting = this.name
//        ? "Meow name is " + this.name
//        : "I don't have a name"
//    console.log(greeting);
//}

var Fight = mongoose.model('Fight', fightSchema)

// Start a TCP Server
net.createServer(function (socket) {
    // When data is received :
    socket.on('data', function (data) {
        try {
            receivedDataObj = JSON.parse(data)

            // get fight id and player id from input data from Unity client
            var fightId = receivedDataObj.fightId
            var playerId = receivedDataObj.playerId

            var response = null

            // fetch fight with given id from MongoDB
            Fight.findOne({"_id": fightId}, function (err, fightInstance) {
                if (err) throw err;

                console.log("Fight instance : " + fightInstance)

                var player = null
                var enemy = null
                var fightState = fightInstance.state

                console.log("Fight state == " + fightInstance.state)

                var response = ""

                //TODO: if gamestate is Waiting for second player then send it to backend
                if( fightState == "FINISHED" ) {
                    response = "FINISHED "
                } else if( fightState == "WAITING" ) {
                    response = "WAITING "
                } else {
                    //TODO: determine which player is "player", which is "enemy"
                    if( fightInstance.player1[0].characterId == playerId) {
                        player = fightInstance.player1[0]
                        enemy = fightInstance.player2[0]
                    } else if( fightInstance.player2[0].characterId == playerId )  {
                        player = fightInstance.player2[0]
                        enemy = fightInstance.player1[0]
                    }

                    //TODO: actualize player data in DB
                    player.x = receivedDataObj.newX;
                    player.y = receivedDataObj.newY;
                    player.z = receivedDataObj.newZ;
                    player.yaw = receivedDataObj.yaw;
                    player.hp = receivedDataObj.hp;

                    var updateQuery = {"_id": fightId};
                    Fight.findOneAndUpdate(updateQuery, { $set: fightInstance})

                    //TODO: if player or enemy hp is <= 0 then fight is finished
                    if( 1 == 3 ) {

                    } else {
                        console.log("Generating response from fightInstance")

                        // Generate response for Unity3D client
                        var responseArr = [{player: player, enemy: enemy}]

                        response = JSON.stringify(responseArr)
                    }
                }

                console.log("Response : " + response)

                //TODO: generate response
                response = response.length + '#' + response;

                console.log("Response after length adding")

                socket.write( response )

            })
        }catch(err) {
            console.log("Error occured : " + err)

            var response = "ERROR occured : " + err;
            response = response.length + '#' + response;
            socket.write(response)
        }
    });
}).listen(5000);

//Crossdomain issues - for Unity3D purposes
net.createServer(function(socket) {
    var crossDomainXml =
        "<?xml version=\"1.0\"?>" +
        "<cross-domain-policy>" +
        "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
        "</cross-domain-policy>";

    socket.write(crossDomainXml);
}).listen(843);

