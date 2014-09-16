// Load the TCP Library
net = require('net');

var backendExampleFightList = [
  {
    class: "pl.tenerowicz.mmoarena.Fight",
    id: 22,
    player1: {
      class: "pl.tenerowicz.mmoarena.Character",
      id: 14
    },
    player2: {
      class: "pl.tenerowicz.mmoarena.Character",
      id: 18
    },
    state: {
      enumType: "pl.tenerowicz.mmoarena.fight.FightState",
      name: "PREPARED"
    },
    winnerId: -1
  },
  {
    class: "pl.tenerowicz.mmoarena.Fight",
    id: 23,
    player1: {
      class: "pl.tenerowicz.mmoarena.Character",
      id: 14
    },
    player2: {
      class: "pl.tenerowicz.mmoarena.Character",
      id: 18
    },
    state: {
      enumType: "pl.tenerowicz.mmoarena.fight.FightState",
      name: "PREPARED"
    },
    winnerId: -1
  }
]

function FightInstance() {

}

function Player(playerId) {
  this.id = playerId
  this.x = 0.0,
  this.y = 0.0,
  this.z = 0.0,
  this.yaw = 0.0
}

function Fight() {

}

var fightDataList = [
    {
      id: 1, 
      player1: new Player(1), 
      player2: new Player(2)
    },
];

var getPlayerAndEnemy = function(fightId, playerId, socket) {
  var fight = null

  fightDataList.forEach(function(entry) {
      if(entry.id == fightId) {
        fight = entry
      }
  });

  if( fight == "undefined") {
    //exception
  }

  var player = null
  var enemy = null
  if( fight.player1.id == playerId ) {
    player = fight.player1
    enemy = fight.player2
  } else if( fight.player2.id == playerId ) {
    enemy = fight.player1
    player = fight.player2
  } else {
    //exception
  }

  if( player.socket == "undefined" ) {
    player.socket = socket
  }

  return {'player': player, 'enemy': enemy}
}

// Start a TCP Server
net.createServer(function (socket) { 

  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    //console.log("Received data : " + data)
    receivedDataObj = JSON.parse(data)

    var fightId = receivedDataObj.fightId
    //console.log("Fight id : " + fightId)

    var playerId = receivedDataObj.playerId
    //console.log("Player id : " + playerId)

    var fightData = getPlayerAndEnemy(fightId, playerId, socket)
    //console.log("Fight data : " + fightData)

    // set player properties
    fightData.player.x = receivedDataObj.posX;
    fightData.player.y = receivedDataObj.posY;
    fightData.player.z = receivedDataObj.posZ;
    fightData.player.yaw = receivedDataObj.yaw;

    // respond with data
    var response = JSON.stringify(fightData);
    console.log("Sending response : " + response)

    socket.write( response )

    // current state debug : 
    //console.log("Fight data list : " + JSON.stringify( fightDataList ) );

  });
 
  // On disconnect
  socket.on('end', function () {
    //console.log("User disconnected");
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