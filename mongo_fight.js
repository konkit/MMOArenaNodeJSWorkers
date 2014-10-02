// Load the TCP Library
var net = require('net');
var http = require('http');
var request = require('request');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mmoarena_db');

var db = mongoose.connection;

var fightSchema_OLD = mongoose.Schema({
    _id: Number,
    player1: {
        playerId: Number,
        x: Number,
        y: Number,
        z: Number
    },
    player2: {
        playerId: Number,
        x: Number,
        y: Number,
        z: Number
    },
    state: String
})

var characterSchema = mongoose.Schema({
    characterId: Number,
    x: Number,
    y: Number,
    z: Number
});

var fightSchema = mongoose.Schema({
    _id: Number,
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
    // Handle incoming messages from clients.
    socket.on('data', function (data) {
        try {
            receivedDataObj = JSON.parse(data)

            //TODO: get fight id and player id from input data
            var fightId = receivedDataObj.fightId
            var playerId = receivedDataObj.playerId

            //TODO: fetch fight with given id from DB
            Fight.findOne({"_id": fightId}, function (err, fightInstance) {
                if (err) throw err;

                console.log( "Fight instance : " + fightInstance )

                var player = null
                var enemy = null

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

                console.log("Fight instance after edit : " + fightInstance)

//                fightInstance.save( function(error, data){
//                    if( error ){
//                        throw error
//                    }
//
//                    response = JSON.stringify(fightInstance)
//                });

                var updateQuery = {"_id": fightId};
                Fight.findOneAndUpdate(updateQuery, { $set: fightInstance})

                response = JSON.stringify(fightInstance)

                //TODO: generate response
                response = response.length + '#' + response;

                console.log("Response : " + response)

                socket.write( response )
            })
        }catch(err) {
            console.log("Error occured : " + err)

            var response = "ERROR occured : " + err;
            response = response.length + '#' + response;
            socket.write(response)
        }
    });

    // On disconnect
    socket.on('end', function () {

    });

}).listen(5000);

//Crossdomain issues
net.createServer(function(socket) {
    var crossDomainXml =
        "<?xml version=\"1.0\"?>" +
        "<cross-domain-policy>" +
        "  <allow-access-from domain=\"*\" to-ports=\"1-65536\"/>" +
        "</cross-domain-policy>";

    socket.write(crossDomainXml);
}).listen(843);

