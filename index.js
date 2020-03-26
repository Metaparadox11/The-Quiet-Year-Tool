// Dependencies
var express = require('express');
const fs = require('fs');
const canvas = require('canvas');
const fabric = require('fabric').fabric;
const axios = require('axios');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
const app = express();
app.set('view engine', 'ejs');
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
});
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var roomName;

app.get('/page', function(request, response) {
    response.render('page', { roomname: request.body.name });
    roomName = request.body.name;
});

server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

let isRealString = (str) => {
    return typeof str === 'string' && str.trim().length > 0;
}

// Add the WebSocket handlers
var players = {};
var idsTemp;
var cardTemp;
var cardDrawn = false;
let roomData = new Map();

io.sockets.on('connection', function(socket) {
  var myGameID = ( Math.random() * 100000 ) | 0;

  socket.on('join', (rn, idsTemp, cardDrawnTemp, cardTemp, callback) => {
      if (!isRealString(rn)) {
          return callback('Room name required.');
      }
      socket.join(rn);

      var clientsTemp = [];
      io.in(rn).clients((error, clients) => {
          if (error) throw error;
          console.log('Current clients: ' + clients);
          clientsTemp = clients;
      });

      if (clientsTemp.length > 1) {
          io.to(rn).emit('session active', true);
      } else {
          io.to(rn).emit('session active', false);
      }



      if (typeof roomData.get(rn) === 'undefined') {
          var roomObj = {
            ids: idsTemp,
            cardDrawn: cardDrawnTemp,
            currentCard: cardTemp
          };
          roomData.set(rn, roomObj);
      } else {
          var roomObj = roomData.get(rn);
          //load the room
      }

      //io.to(rn).emit('session active', true);
      //io.to(rn).emit('update', arg);

      //callback('');
  });

  socket.on('update card', function(rn, card) {
      roomData.get(rn).currentCard = card;
  });

  socket.on('cards loaded', function(rn, ids) {
      console.log('Room Data: ' + roomData);
      roomData.get(rn).ids = ids;
  });

  socket.on('get ids', function() {
      io.to(rn).emit('update ids', roomData.get(rn).ids);
  });


  socket.on('new player', function() {
      console.log('New player joined ' + roomName);
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
