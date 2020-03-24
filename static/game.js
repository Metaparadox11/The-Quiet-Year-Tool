var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

var pos = {
    x: -1,
    y: -1,
    xold: -1,
    yold: -1
}
var clicked = {
    c: false
}

document.addEventListener('mousedown', function(event) {
  event = event || window.event;
  pos.x = event.pageX;
  pos.y = event.pageY;
  socket.emit('pos', pos);
  clicked.c = true;
});
document.addEventListener('mousemove', function(event) {
  event = event || window.event;
  pos.x = event.pageX;
  pos.y = event.pageY;
  if (clicked.c == false) {
      socket.emit('pos', pos);
  }
});
document.addEventListener('mouseup', function(event) {
  event = event || window.event;
  pos.xold = -1;
  pos.yold = -1;
  socket.emit('pos', pos);
  clicked.c = false;
});

socket.emit('new player');
setInterval(function() {
  //socket.emit('pos', pos);
  socket.emit('clicked', clicked);
}, 10);

var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');
socket.on('state', function(players) {
  context.fillStyle = 'white';
  for (var id in players) {
    var player = players[id];
    if (player.c) {
        console.log('drawing');
        context.beginPath();
        context.lineWidth = "3";
        context.lineJoin = "round";
        context.strokeStyle = "green";
        if (player.xold == -1) {
            pos.xold = pos.x;
            pos.yold = pos.y;
            player.xold = pos.x;
            player.yold = pos.y;
        }
        if (player.x == -1) {
            player.x = pos.x;
            player.y = pos.y;
        }
        context.moveTo(player.xold, player.yold);
        //context.lineTo(pos.x, pos.y);
        context.lineTo(player.x, player.y);
        context.stroke();
        pos.xold = player.x;
        pos.yold = player.y;
        socket.emit('pos', pos);
    }
  }
});
