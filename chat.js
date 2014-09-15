
var http = false, tcp = false
if ( process.argv.length > 2 ) {
    process.argv.forEach(function (val, index, array) {
        switch(val)
        {
            case "http":
                http = true
                break;
            case "tcp":
                tcp = true
                break
        }
    });
} else {
    http = true;
    tcp = true;
}

// chat functions
var peeps = {};

function broadcast(message, sender) {
    for ( var sendTo in peeps ) {
        if ( sendTo != sender ) {
            console.log("checking " + sendTo + " in " + peeps);
            peeps[sendTo].send(message, sender);
        }
    }
}

function joined(name) {
    broadcast("I've joined the chat!", name)
}

function left(name) {
    broadcast(name + " left the chat.", name);
    delete peeps[name];
}

// HTTP stuff
if ( http ) {
    var http_port = process.env.PORT || 5000;

    var express = require('express'), app = express()
      , http = require('http')
      , server = http.createServer(app)
      , jade = require('jade');

    var sockjs = require('sockjs');
    var chatSocket = sockjs.createServer();
    chatSocket.installHandlers(server, {prefix:'/chat'});


    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set("view options", { layout: false });
    app.configure(function() {
        app.use(express.static(__dirname + '/public'));
    });
    app.get('/', function(req, res){
        var tcpURI = null;
        if ( tcp ) {
            tcpURI = process.env.RUPPELLS_SOCKETS_FRONTEND_URI;
        }
        res.render('home.jade', { 'tcpURI': tcpURI });
    });
    server.listen(http_port);
    console.log("HTTP listening on " + http_port);
    chatSocket.on('connection', function(conn) {
        var name = "HTTP -> " + conn.remoteAddress + ":" + conn.remotePort;
        peeps[name] = {
            'send' : function (message, sender) { conn.write(JSON.stringify({ 'message' : message, 'name' : sender })); }
        };
        conn.write(JSON.stringify({ 'message' : "Welcome " + name, 'name' : "Server"}));
        joined(name);
        conn.on('data', function (message) {
            broadcast(message, name);
        });
        conn.on('disconnect', function () {
            left(name);
        });

        conn.on('data', function(message) {
            conn.write(message);
        });
        conn.on('close', function() {});
    });
}

// TCP socket stuff
if ( tcp ) {
    var ruppells_sockets_port = process.env.RUPPELLS_SOCKETS_LOCAL_PORT || 1337;
    net = require('net');
    net.createServer(function (socket) {
        var name = "TCP -> " + socket.remoteAddress + ":" + socket.remotePort
        peeps[name] = {
            'send' : function(message, sender) { socket.write(sender + " said " + message + "\n") }
        };
        socket.write("Welcome " + name + "\n");
        joined(name);
        socket.on('data', function (data) {
            broadcast(data.toString().replace(/(\r\n|\n|\r)/gm,""), name);
        });
        socket.on('close', function (had_error) {
            if (had_error) {
                console.log("I closed due to an error!");
            }
            left(name);
        });
    }).listen(ruppells_sockets_port);
    console.log("TCP listening on " + ruppells_sockets_port);
}
