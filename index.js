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



function Player(backendData) {
console.log("Player backendData : " + backendData + ", id : " + backendData.id);

  this.id = backendData.id
  this.x = 0.0
  this.y = 0.0
  this.z = 0.0
  this.yaw = 0.0
}

function Fight(backendData) {
  console.log("Fight backendData : " + backendData + ", id : " + backendData.id);

  this.id = backendData.id;
  this.player1 = new Player(backendData.player1);
  this.player2 = new Player(backendData.player2);
}

function FightContainer() {
  this.fightList = []

  this.initWithBackendData = function(backendData) {
    fightList = []

    console.log("Fight container backendData : " + backendData + ", id : " + backendData.id);

    backendData.forEach(function(fight) {
      console.log("Fight id : " + fight.id)

      var fightObj = new Fight(fight)

      console.log("FightObj : " + fightObj);

      fightList.push(fightObj)
    });

    console.log("Fight list : " + JSON.stringify(fightList) );
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
}

var fightContainer = new FightContainer()
//fightContainer.fightList.push( new Fight(1, new Player(1), new Player(2) ))

fightContainer.initWithBackendData(backendExampleFightList)

// Start a TCP Server
net.createServer(function (socket) { 
  
  // Handle incoming messages from clients.
  socket.on('data', function (data) {   
    try {
      receivedDataObj = JSON.parse(data)

      var fightId = receivedDataObj.fightId
      var playerId = receivedDataObj.playerId
      var fightData = fightContainer.getPlayerAndEnemy(fightId, playerId, socket)
      //console.log("Fight data : " + fightData)

      // set player properties
      fightData.player.x = receivedDataObj.posX;
      fightData.player.y = receivedDataObj.posY;
      fightData.player.z = receivedDataObj.posZ;
      fightData.player.yaw = receivedDataObj.yaw;

      // respond with data
      var response = JSON.stringify(fightData);
      //console.log("Sending response : " + response)

      socket.write( response )
    }catch(err) {
      console.log("Error occured : " + err)
      socket.write("ERROR : " + err)
    }
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