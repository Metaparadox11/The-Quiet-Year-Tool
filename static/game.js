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
  pos.xold = event.pageX;
  pos.yold = event.pageY;
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

//var canvas = document.getElementById('canvas');
var canvas = new fabric.Canvas('canvas', {
    isDrawingMode: false
});
var context = canvas.getContext('2d');
socket.on('state', function(players) {
  context.fillStyle = 'white';
  for (var id in players) {
    var player = players[id];
    if (player.c) {
        console.log('drawing');

    }
  }
});

// API specific settings.
const API_URL = 'https://deckofcardsapi.com/api/deck/';

const NEW_SHUFFLED_DECK = 'new/shuffle/';

const HEARTS_CARDS = '?cards=AH,2H,3H,4H,5H,6H,7H,8H,9H,10H,JH,QH,KH';
const SPADES_CARDS = '?cards=AS,2S,3S,4S,5S,6S,7S,8S,9S,10S,JS,QS,KS';
const CLUBS_CARDS = '?cards=AC,2C,3C,4C,5C,6C,7C,8C,9C,10C,JC,QC,KC';
const DIAMONDS_CARDS = '?cards=AD,2D,3D,4D,5D,6D,7D,8D,9D,10D,JD,QD,KD';

const ENTIRE_API_URL_HEARTS = API_URL + NEW_SHUFFLED_DECK + HEARTS_CARDS;
const ENTIRE_API_URL_SPADES = API_URL + NEW_SHUFFLED_DECK + SPADES_CARDS;
const ENTIRE_API_URL_CLUBS = API_URL + NEW_SHUFFLED_DECK + CLUBS_CARDS;
const ENTIRE_API_URL_DIAMONDS = API_URL + NEW_SHUFFLED_DECK + DIAMONDS_CARDS;

var ids = {
    hearts: '',
    spades: '',
    clubs: '',
    diamonds: ''
}

var heartsRemaining = 13;
var spadesRemaining = 13;
var clubsRemaining = 13;
var diamondsRemaining = 13;

function loadCards() {
    axios.get(ENTIRE_API_URL_HEARTS)
        .then(response => {
            ids.hearts = response.deck_id;
            console.log(ids.hearts);
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_SPADES)
        .then(response => {
            if (response.success) {
                ids.spades = response.deck_id;
            }
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_CLUBS)
        .then(response => {
            if (response.success) {
                ids.clubs = response.deck_id;
            }
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_DIAMONDS)
        .then(response => {
            if (response.success) {
                ids.diamonds = response.deck_id;
            }
        })
        .catch(error => console.log('Error', error));
}
window.onload = loadCards;


var button = document.createElement("button");
button.innerHTML = "Draw Card";

var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

const DRAW_ONE = '/draw/?count=1';


button.addEventListener ("click", function() {
    const ENTIRE_API_URL_DRAW_HEARTS = API_URL + ids.hearts + DRAW_ONE;
    axios.get(ENTIRE_API_URL_DRAW_HEARTS)
        .then(response => {
            if (response.success) {
                var imageURL = response.cards.image;
                var img = document.createElement('img');
                img.src = imageURL;
                body.appendChild(img);
            }
        })
        .catch(error => console.log('Error', error));
});
