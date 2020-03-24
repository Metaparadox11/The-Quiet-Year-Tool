// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
const app = express();
//var server = http.Server(app);
//var io = socketIO(server);
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '/static/index.html'));
  //response.sendFile(path.join(__dirname, '/index.html'));
});// Starts the server.

server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

// Add the WebSocket handlers
var players = {};
io.sockets.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      x: 0,
      y: 0,
      xold: 0,
      yold: 0,
      c: false
    };
  });
  socket.on('clicked', function(data) {
    var player = players[socket.id] || {};
    player.c = data.c;
  });
  socket.on('pos', function(data) {
    var player = players[socket.id] || {};
    if (data.x) {
      player.xold = player.x;
      player.x = data.x;
    }
    if (data.y) {
      player.yold = player.y;
      player.y = data.y;
    }
  });
});setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);
