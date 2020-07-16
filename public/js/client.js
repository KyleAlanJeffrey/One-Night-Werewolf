const SERVER = 'localhost:3000';
let board = undefined;
let userList = undefined;
let socket = undefined;
let playerArray = [];
let username = undefined;
let server = undefined;
let countdown = 100;
let guess = undefined;

$(document).ready(function () {
    socket = io.connect(SERVER);
    $('#usr').val('User ' + Math.floor(100 * Math.random()));
    board = $('#board');
    userList = $('#user-list');
    socket.on('newPlayer', addPlayer);
    socket.on('startGame', startGame);
    // preload();
});

function joinServer() {
    username = $('#usr').val();
    socket.emit('join', { name: username, }, (data, lead, serverName) => {
        if (lead) addLeadPermissions();
        server = serverName;
        playerData = data;
        loadPlayers(playerData);
    });

    $('#join-game-overlay').css('opacity', '0');
    setTimeout(() => { $('#join-game-overlay').hide(); }, 1000);
}
function loadPlayers(playerData) {
    playerData.forEach(player => {
        addPlayer(player);
    });
}
function addPlayer(player) {
    let options = { item: '' };
    if (username == player.name) {
        options.item = 'good';

    }

    // Add player to playerlist
    let listItem = jQuery('<li/>', {
        "class": `user ${options.item}`,
        'text': player.name
    });
    listItem.appendTo(userList);

    // Add player card to board
    let card = jQuery('<div/>', {
        "class": 'card hidden-card m-3 new-card',
    });
    jQuery('<span/>', {
        "text": player.name,
    }).appendTo(card);

    card.appendTo(board);
    let playerObj = new Player(player.name, undefined, card, listItem);
    playerArray.push(playerObj);
    card.on('click', () => { cardClicked(playerObj); });

    setTimeout(() => {
        $('.new-card').removeClass('new-card');
    }, 1000);
}

function addLeadPermissions() {
    $('#start-game-button').show();
}

function hostRequestStart() {
    socket.emit('hostStartRequest', server, (playerData) => {
        startGame(playerData);
    });
    $('#start-game-button').hide();
}
function startGame(playerData) {
    setRoles(playerData);
    countDownClock();
    $('#game-start-message').css('top', '0');
    $('#game-start-message > h2').css('opacity', '1');
    setTimeout(() => {
        $('#game-start-message').css('top', '100%');
    }, 3500);
}
function countDownClock() {
    $('#timer').toggle().addClass('new-card');
    let x = setInterval(() => {
        countdown--;
        $('#timer').text('TIME: ' + countdown);
        if (!countdown) {
            clearInterval(x);
        }
    }, 1000);
}

function setRoles(playerData) {
    console.log(playerData)
    playerData.forEach(p => {
        if (p.name == username) return;
        let localP = playerArray.find((localPlayer) => {
            return localPlayer.name == p.name;
        });
        console.log('Setting ' + localP.name + ' to ' + p.role);
        localP.setRole(p.role);
    });
}

/*-------------------
        CARD EVENTS
------------------*/
function cardClicked(playerObj) {
    // if game started
    if (countdown < 100) {
        if (playerObj.name == username) return;
        $('.crosshair').remove();
        let crosshair = jQuery('<div/>', {
            "class": `crosshair`,
        }).appendTo(playerObj.cardElement);
        guess = card.name;
    }
    // console.log(card)
}



class Player {
    constructor(name, role, cardElement, listElement) {
        this.name = name;
        this.role = role;
        this.cardElement = cardElement;
        this.listElement = listElement;
    }
    setRole(role) {
        this.role = role;
        // animate adding the role
        setTimeout(() => { this.cardElement.removeClass('hidden-card'); }, 200);
        this.cardElement.addClass(role);
        this.cardElement.addClass('reveal-card')
    }
}