// Load the TCP Library
var net = require('net');
var http = require('http');
var request = require('request');

function Player(backendData) {
  this.id = backendData.id
  this.x = 0.0
  this.y = 0.0
  this.z = 0.0
  this.yaw = 0.0
}

function Fight(backendData) {
  this.id = backendData.id;
  this.player1 = new Player(backendData.player1);
  this.player2 = new Player(backendData.player2);
}

function FightContainer() {
  this.fightList = []

  this.initWithBackendData = function(backendData) {
    fightList = []

    backendData.forEach(function(fight) {
      var fightObj = new Fight(fight)
      fightList.push(fightObj)
    });
  }

  this.getPlayerAndEnemy = function(fightId, playerId, socket) {
    var fight = null

    fightList.forEach(function(entry) {
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

  this.actualizeData = function(dataFromPlayer, socket) {
    var fightId = dataFromPlayer.fightId
    var playerId = dataFromPlayer.playerId
    var fightData = this.getPlayerAndEnemy(fightId, playerId, socket)

    // actualize player properties with data sent from Unity
    fightData.player.x = receivedDataObj.posX;
    fightData.player.y = receivedDataObj.posY;
    fightData.player.z = receivedDataObj.posZ;
    fightData.player.yaw = receivedDataObj.yaw;

    return JSON.stringify(fightData)
  }
}



var fightContainer = new FightContainer();

// HTTP request
var http_request_interval = 1 * 1000;
setInterval( function() { 
  getNodeDataFromBackend(); 
}, http_request_interval );

function getNodeDataFromBackend() {
  request('http://107.155.108.250:8888/GrailsMMOArena-0.1/fight/requestNodeData', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      fightContainer.initWithBackendData( JSON.parse( body ) );
    }
  })
}

// Start a TCP Server
net.createServer(function (socket) { 
  
  // Handle incoming messages from clients.
  socket.on('data', function (data) {   
    try {
      receivedDataObj = JSON.parse(data)
      var response = fightContainer.actualizeData(receivedDataObj, socket)
      socket.write( response )
    }catch(err) {
      console.log("Error occured : " + err)
      socket.write("ERROR : " + err)
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

