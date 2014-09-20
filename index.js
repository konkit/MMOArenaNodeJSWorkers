// Load the TCP Library
var net = require('net');
var http = require('http');
var request = require('request');

var fightData = undefined;

var decoratePlayer = function(player) {
  player.x = 0.0;
  player.y = 0.0;
  player.z = 0.0;
  player.yaw = 0.0;

  delete player.class
}

var decorateFightData = function(backendData) {
  for(i=0; i<backendData.length; i++) {
    decoratePlayer(backendData[i].player1);
    decoratePlayer(backendData[i].player2);

    delete backendData[i].class
    delete backendData[i].state.enumType
  }

  backendData.getPlayerAndEnemy = function(fightId, playerId, socket) {
    var fight = null

    this.forEach(function(entry) {
        if(entry.id == fightId) {
          fight = entry
        }
    });

    if( fight == null || fight == "undefined") {
      throw "Fight not found";
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
      throw "Wrong fight for this player";
    }

    if( player.socket == "undefined" ) {
      player.socket = socket
    }

    return {'player': player, 'enemy': enemy}
  }

  backendData.actualizeData = function(dataFromPlayer, socket) {
    var fightId = dataFromPlayer.fightId
    var playerId = dataFromPlayer.playerId
    var cntFightResponse = this.getPlayerAndEnemy(fightId, playerId, socket)

    // actualize player properties with data sent from Unity
    cntFightResponse.player.x = receivedDataObj.posX;
    cntFightResponse.player.y = receivedDataObj.posY;
    cntFightResponse.player.z = receivedDataObj.posZ;
    cntFightResponse.player.yaw = receivedDataObj.yaw;

    return JSON.stringify(cntFightResponse)
  }
}

// HTTP request
var http_request_interval = 3 * 1000;
setInterval( function() { getNodeDataFromBackend() }, http_request_interval );

function getNodeDataFromBackend() {
  request('http://107.155.108.250:8888/GrailsMMOArena-0.1/fight/requestNodeData', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      fightData = JSON.parse(body)
      decorateFightData( fightData );

      console.log("HTTP data received");
    }
  })
}

// Start a TCP Server
net.createServer(function (socket) { 
  
  // Handle incoming messages from clients.
  socket.on('data', function (data) {   
    try {
      receivedDataObj = JSON.parse(data)
      //var response = fightContainer.actualizeData(receivedDataObj, socket)
      var response = fightData.actualizeData(receivedDataObj, socket);
      response = response.length + '#' + response;

      console.log("RESPONSE : " + response);

      socket.write( response )
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

