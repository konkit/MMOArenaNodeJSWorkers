// Load the TCP Library
net = require('net');

var fightDataList = [
    {
      id: 1, 
      player1: {
        id: 1,
        x: 0.0,
        y: 0.0,
        z: 0.0
      }, 
      player2: {
        id: 2,  
        x: 0.0,
        y: 0.0,
        z: 0.0  
      }
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

    // respond with data
    socket.write( JSON.stringify(fightData) )

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