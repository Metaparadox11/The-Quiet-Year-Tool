var socket = io();

var ids = {
    hearts: '',
    spades: '',
    clubs: '',
    diamonds: ''
}
var currentCard;
var currentCardDefined = false;
var cardDrawn = false;

var rm;
var user;

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

var heartsRemaining = 13;
var spadesRemaining = 13;
var clubsRemaining = 13;
var diamondsRemaining = 13;

function loadCards() {
    //cardDrawn = false;
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
                console.log('Loaded this deck: ' + ids.hearts + ' in ' + rm);
                socket.emit('cards loaded', rm, ids);
            }
        })
        .catch(error => console.log('Error', error));
}


socket.on('message', function(data) {
  console.log(data);
});

socket.on('change card image', function(card, ccd) {
    if (ccd) {
        document.getElementById('cardimage').src = card.image;
    }
});

socket.on('update ids', function(idsTemp) {
    console.log('idsTemp: ' + idsTemp);
    ids = idsTemp;
    console.log('ids: ' + ids);
    console.log('New ids: ' + ids);
});

var sessionActive = false;
socket.on('session active', function(active) {
    sessionActive = active;
    if (!active) {
        console.log('Session is new');
        socket.emit('base tokens', rm);
        socket.emit('tokens per user', rm, user);
        loadCards();
    } else {
        console.log('Session is active');
        socket.emit('get ids');
        console.log('Getting tokens for: ' + socket.sessionid);
        socket.emit('get tokens', socket.sessionid, user);
    }
});

var c;
socket.on('connect', function() {
    console.log('Connected to server');
    let params = new URLSearchParams(window.location.search);
    const rn = params.get('roomname');
    const usr = params.get('username');
    rm = rn;
    user = usr;
    console.log('Room: ' + rn);

    socket.emit('join', rn, usr, ids, cardDrawn, currentCard, function(err) {
        if (err) {
            alert(err);
            window.location.href = '/';
        } else {

        }
    });

    var canvas = new fabric.Canvas('canvas', {
        isDrawingMode: true,
        fillStyle: 'white'
    });
    c = canvas;

    socket.emit('load canvas', rm);

    c.on('path:created', function(e){
        var canvasStr = c.toJSON();
        socket.emit('send canvas', rm, canvasStr);
    });
    //var context = canvas.getContext('2d');
    //context.fillStyle = 'white';

    /*canvas.on('path:created', function(e){
        console.log('Sending a path ' + e);
        socket.emit('send state', rm, e);
    });

    socket.on('get state', function(canvasState) {
        canvas.clear();
        var context = canvas.getContext('2d');
        context.fillStyle = 'white';
        for (index = 0; index < canvasState.length; index++) {
            console.log('Received array with: ' + canvasState[index]);
            canvas.add(canvasState[index]);
        }
    });*/

});

socket.on('receive canvas', function(canvasobj){
    c.clear();
    c.loadFromJSON(canvasobj, c.renderAll.bind(c));
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
    socket.emit('delete');
    // If this is the last person leaving, delete everything
});

/*var pos = {
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
});*/


/*setInterval(function() {
  //socket.emit('pos', pos);
  socket.emit('clicked', clicked);
}, 10);
*/

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
var tokenImagesSpan = document.getElementById('tokenimages');

const DRAW_ONE = '/draw/?count=1';

var frostShepherds = false;
var cardImageShown = false;
var fsCode = 'KS';

// Token: https://i.ibb.co/Y3WjFZC/token.png

var tokenButton = document.getElementById('taketoken');

var tokensGone = false;
socket.on('tokens gone', function() {
    tokensGone = true;
});

socket.on('tokens left', function(tokensLeft) {
    var tokenPool = document.getElementById('tokenpool');
    tokenPool.innerHTML = 'Contempt Tokens in Pool: ' + tokensLeft;
});

tokenButton.addEventListener("click", function() {
    if (!tokensGone) {
        socket.emit('take token', rm, 1, user);
        tokenImagesSpan.innerHTML += "<img src=https://i.ibb.co/Y3WjFZC/token.png width=40px />";
    }
});

socket.on('load tokens', function(tokens, tokensLeft) {
    var tokenPool = document.getElementById('tokenpool');
    tokenPool.innerHTML = 'Contempt Tokens in Pool: ' + tokensLeft;
    for (var i = 0; i < tokens; i++) {
        tokenImagesSpan.innerHTML += "<img src=https://i.ibb.co/Y3WjFZC/token.png width=40px />";
    }
});

button.addEventListener ("click", function() {
    var ENTIRE_API_URL_DRAW_HEARTS = API_URL + ids.hearts + DRAW_ONE;
    var ENTIRE_API_URL_DRAW_SPADES = API_URL + ids.spades + DRAW_ONE;
    var ENTIRE_API_URL_DRAW_CLUBS = API_URL + ids.clubs + DRAW_ONE;
    var ENTIRE_API_URL_DRAW_DIAMONDS = API_URL + ids.diamonds + DRAW_ONE;
    cardDrawn = true;
    console.log('Clicked');
    if (heartsRemaining > 0) {
        axios.get(ENTIRE_API_URL_DRAW_HEARTS)
            .then(response => {
                if (response.data.success) {
                    if (!cardImageShown){
                        cardImageShown = true;
                    }
                    heartsRemaining = response.data.remaining;
                    socket.emit('update card', rm, response.data.cards[0]);
                }
            })
            .catch(error => console.log('Error', error));
    } else {
        if (diamondsRemaining > 0) {
            axios.get(ENTIRE_API_URL_DRAW_DIAMONDS)
                .then(response => {
                    if (response.data.success) {
                        diamondsRemaining = response.data.remaining;
                        socket.emit('update card', rm, response.data.cards[0]);
                    }
                })
                .catch(error => console.log('Error', error));
        } else {
            if (clubsRemaining > 0) {
                axios.get(ENTIRE_API_URL_DRAW_CLUBS)
                    .then(response => {
                        if (response.data.success) {
                            clubsRemaining = response.data.remaining;
                            socket.emit('update card', rm, response.data.cards[0]);
                        }
                    })
                    .catch(error => console.log('Error', error));
            } else {
                if (frostShepherds == false) {
                    if (spadesRemaining > 0) {
                        axios.get(ENTIRE_API_URL_DRAW_SPADES)
                            .then(response => {
                                if (response.data.success) {
                                    spadesRemaining = response.data.remaining;
                                    socket.emit('update card', rm, response.data.cards[0]);
                                    if (response.data.cards[0].code == fsCode) {
                                        frostShepherds = true;
                                    }
                                }
                            })
                            .catch(error => console.log('Error', error));
                    }
                }
            }
        }
    }
});
