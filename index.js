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

let isActiveUser = (num) => {
    return Number.isInteger(num);
}

// Add the WebSocket handlers
var players = {};
var idsTemp;
var cardTemp;
var cardDrawn = false;
let roomData = new Map();
let canvasStates = new Map();
let contemptTokens = new Map();
let ctPerRoom = new Map();

io.sockets.on('connection', function(socket) {
  socket.on('join', (rn, usr, idsTemp, cardDrawnTemp, cardTemp, callback) => {
      if (!isRealString(rn)) {
          return callback('Room name required.');
      }
      if (!isRealString(usr)) {
          return callback('Username required.');
      }
      if (typeof ctPerRoom.get(rn) !== 'undefined') {
          if (Number.isInteger(ctPerRoom.get(rn)[usr])) {
              return callback('Username taken.');
          }
      }
      socket.join(rn);

      var clientsTemp = [];
      io.in(rn).clients((error, clients) => {
          if (error) throw error;
          console.log('Current clients: ' + clients);
          clientsTemp = clients;
          console.log('Number of clients: ' + clientsTemp.length);
          // TODO: throw out client if # clients is > 4
          if (clientsTemp.length > 4) return callback('Limit 4 players per room.');
          if (clientsTemp.length > 1) {
              console.log('Emitting true');
              io.to(rn).emit('session active', true);
          } else {
              // if roomData exists for rn emit true
              if (typeof roomData.get(rn) !== 'undefined') {
                  console.log('emitting true');
                  io.to(rn).emit('session active', true);
              } else {
                  console.log('Emitting false');
                  io.to(rn).emit('session active', false);
              }

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
              io.to(rn).emit('change card image', roomObj.currentCard, roomObj.cardDrawn);

          }
      });


      socket.on('send canvas', function(rn, canvasobj){
          canvasStates.set(rn, canvasobj);
          io.to(rn).emit('receive canvas', canvasobj);
      });

      socket.on('load canvas', function(rn) {
          if (typeof canvasStates.get(rn) !== 'undefined') {
              io.to(rn).emit('receive canvas', canvasStates.get(rn));
          }
      });

      socket.on('base tokens', function(rn) {
          contemptTokens.set(rn, 20);
          ctPerRoom.set(rn, {});
      });

      socket.on('tokens per user', function(rn, user) {
          ctPerRoom.get(rn)[user] = 0;
      });

      socket.on('take token', function(rn, tokens, user) {
          if (contemptTokens.get(rn) > 1) {
              contemptTokens.set(rn, contemptTokens.get(rn) - tokens);
              ctPerRoom.get(rn)[user] = ctPerRoom.get(rn)[user] + tokens;
              io.to(rn).emit('tokens left', contemptTokens.get(rn));
          } else if (contemptTokens.get(rn) == 1) {
              contemptTokens.set(rn, contemptTokens.get(rn) - tokens);
              ctPerRoom.get(rn)[user] = ctPerRoom.get(rn)[user] + tokens;
              io.to(rn).emit('tokens gone');
              io.to(rn).emit('tokens left', 0);
          } else {
              io.to(rn).emit('tokens gone');
          }
      });

      socket.on('return token', function(rn, tokens, user) {
          contemptTokens.set(rn, contemptTokens.get(rn) + tokens);
          ctPerRoom.get(rn)[user] = ctPerRoom.get(rn)[user] - tokens;
          io.to(rn).emit('tokens left', contemptTokens.get(rn));
      });

      socket.on('get tokens', function(id, user) {
          if (typeof ctPerRoom.get(rn) !== 'undefined') {
              if (Number.isInteger(ctPerRoom.get(rn)[usr])) {
                  io.to(id).emit('load tokens', ctPerRoom.get(rn)[user], contemptTokens.get(rn));
              } else {
                  io.to(id).emit('load tokens', 0, contemptTokens.get(rn));
              }
          }
      });

      /*socket.on('send state', function(rn, obj) {
          if (typeof canvasStates.get(rn) === 'undefined') {
              var temp = [];
              temp.push(obj);
              canvasStates.set(rn, temp);
              console.log('Received path and created array with: ' + temp[0]);
              io.to(rn).emit('get state', canvasStates.get(rn));
          } else {
              //TODO: combine state with saved state if active
              canvasStates.get(rn).push(obj);
              for (var i = 0; i < canvasStates.get(rn); i++) {
                  console.log('Received path and pushed to array with: ' + canvasStates.get(rn)[i]);
              }
              io.to(rn).emit('get state', canvasStates.get(rn));
          }
      });*/

      socket.on('update card', function(rn, card) {
          roomData.get(rn).currentCard = card;
          roomData.get(rn).cardDrawn = true;
          io.to(rn).emit('change card image', card, true);
      });

      socket.on('cards loaded', function(rn, ids) {
          console.log('Room Data: ' + roomData.get(rn));
          roomData.get(rn).ids = ids;
      });

      socket.on('get ids', function() {
          console.log('Stored hearts id: ' + roomData.get(rn).ids.hearts);
          io.to(rn).emit('update ids', roomData.get(rn).ids);
      });



  });

  socket.on('delete', function(rm) {
      io.in(rm).clients((error, clients) => {
          if (error) throw error;
          console.log(clients.length + ' clients in room ' + rm + ' ' + clients);
          if (clients.length === 0) {
              console.log('0 clients in room ' + rm);
              roomData.delete(rm);
              canvasStates.delete(rm);
              contemptTokens.delete(rm);
              ctPerRoom.delete(rm);
          }
      });
  });

  /*socket.on('new player', function() {
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
});*/
});
