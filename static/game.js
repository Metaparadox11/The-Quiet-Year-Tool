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

const HEARTS_CARDS = '?cards=AH,2H,3H,4H,5H,6H,7H,8H,9H,0H,JH,QH,KH';
const SPADES_CARDS = '?cards=AS,2S,3S,4S,5S,6S,7S,8S,9S,0S,JS,QS,KS';
const CLUBS_CARDS = '?cards=AC,2C,3C,4C,5C,6C,7C,8C,9C,0C,JC,QC,KC';
const DIAMONDS_CARDS = '?cards=AD,2D,3D,4D,5D,6D,7D,8D,9D,0D,JD,QD,KD';

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
            if (response.data.success){
                ids.hearts = response.data.deck_id;
            }
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_SPADES)
        .then(response => {
            if (response.data.success) {
                ids.spades = response.data.deck_id;
            }
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_CLUBS)
        .then(response => {
            if (response.data.success) {
                ids.clubs = response.data.deck_id;
            }
        })
        .catch(error => console.log('Error', error));

    axios.get(ENTIRE_API_URL_DIAMONDS)
        .then(response => {
            if (response.data.success) {
                ids.diamonds = response.data.deck_id;
            }
        })
        .catch(error => console.log('Error', error));
}
window.onload = loadCards;

// Not working????
function addCardButton() {
    var button = document.createElement("button");
    button.innerHTML = "Draw Card";

    var br = document.createElement("div");
    br.innerHTML = "<br><br>";
    divRight.appendChild(br);

    var divRight = document.getElementById("divright");
    divRight.appendChild(button);

    var br2 = document.createElement("div");
    br2.innerHTML = "<br><br>";
    divRight.appendChild(br2);
}

//window.onload = addCardButton;


var body = document.getElementsByTagName("body")[0];
var divRight = document.getElementById('divright');
var divLeft = document.getElementById('divleft');

var button = document.getElementById('but');

const DRAW_ONE = '/draw/?count=1';

var frostShepherds = false;
var cardImageShown = false;
var fsCode = 'KS';

button.addEventListener ("click", function() {
    const ENTIRE_API_URL_DRAW_HEARTS = API_URL + ids.hearts + DRAW_ONE;
    const ENTIRE_API_URL_DRAW_SPADES = API_URL + ids.spades + DRAW_ONE;
    const ENTIRE_API_URL_DRAW_CLUBS = API_URL + ids.clubs + DRAW_ONE;
    const ENTIRE_API_URL_DRAW_DIAMONDS = API_URL + ids.diamonds + DRAW_ONE;
    console.log('Clicked');
    if (heartsRemaining > 0) {
        axios.get(ENTIRE_API_URL_DRAW_HEARTS)
            .then(response => {
                if (response.data.success) {
                    var imageURL = response.data.cards[0].image;
                    if (cardImageShown){
                        var cardImage = document.getElementByID('cardimage');
                        cardImage.src = imageURL;
                    } else {
                        var img = document.createElement('img');
                        img.src = imageURL;
                        img.width = 30;
                        img.id  = 'cardimage';
                        img.onload = function(){
                            this.style.position = 'relative';
                            this.style.left = '50%';
                            this.style.top = '25%';
                        }
                        divRight.appendChild(img);
                        cardImageShown = true;
                    }
                }
                heartsRemaining = response.data.remaining;
            })
            .catch(error => console.log('Error', error));
    } else {
        if (diamondsRemaining > 0) {
            axios.get(ENTIRE_API_URL_DRAW_DIAMONDS)
                .then(response => {
                    if (response.data.success) {
                        var imageURL = response.data.cards[0].image;
                        var img = document.createElement('img');
                        img.src = imageURL;
                        img.width = 30;
                        divRight.appendChild(img);
                    }
                    diamondsRemaining = response.data.remaining;
                })
                .catch(error => console.log('Error', error));
        } else {
            if (clubsRemaining > 0) {
                axios.get(ENTIRE_API_URL_DRAW_CLUBS)
                    .then(response => {
                        if (response.data.success) {
                            var imageURL = response.data.cards[0].image;
                            var img = document.createElement('img');
                            img.src = imageURL;
                            img.width = 30;
                            divRight.appendChild(img);
                        }
                        clubsRemaining = response.data.remaining;
                    })
                    .catch(error => console.log('Error', error));
            } else {
                if (frostShepherds == false) {
                    if (spadesRemaining > 0) {
                        axios.get(ENTIRE_API_URL_DRAW_SPADES)
                            .then(response => {
                                if (response.data.success) {
                                    var imageURL = response.data.cards[0].image;
                                    var img = document.createElement('img');
                                    img.src = imageURL;
                                    img.width = 30;
                                    divRight.appendChild(img);
                                    if (response.data.cards[0].code == fsCode) {
                                        frostShepherds = true;
                                    }
                                }
                                spadesRemaining = response.data.remaining;
                            })
                            .catch(error => console.log('Error', error));
                    }
                }
            }
        }
    }
});
