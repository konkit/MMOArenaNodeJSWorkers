module.exports = function() {
    var http = require('http');
    var sockjs = require('sockjs');

    var connections = [];

    var chat = sockjs.createServer();
    chat.on('connection', function (conn) {
        connections.push(conn);
        var number = connections.length;
        conn.write("Connected to chat");
        conn.on('data', function (message) {
            for (var ii=0; ii < connections.length; ii++) {
                connections[ii].write(message);
            }
        });
        conn.on('close', function() {
            for (var ii=0; ii < connections.length; ii++) {
                //connections[ii].write("User " + number + " has disconnected");
            }
        });
    });

    var server = http.createServer();
    chat.installHandlers(server, {prefix:'/chat'});
    server.listen(9999, '0.0.0.0');
}