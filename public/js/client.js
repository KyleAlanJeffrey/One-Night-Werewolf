const SERVER = 'localhost:5000';
let board = undefined;
let userList = undefined;
let socket = undefined;
let Players = undefined;
let username = undefined;
let server = undefined;

$(document).ready(function () {
    socket = io.connect(SERVER);
    $('#usr').val('User ' + Math.floor(100 * Math.random()));
    board = $('#board');
    userList = $('#user-list');
    socket.on('newPlayer', addPlayer);
    // preload();
});

function joinServer() {
    username = $('#usr').val();
    socket.emit('join', { name: username, }, (data, lead, serverName) => {
        if (lead) addLeadPermissions();
        server = serverName;
        Players = data;
        loadPlayers();
    });

    $('#join-game-overlay').css('opacity', '0');
    setTimeout(() => { $('#join-game-overlay').hide(); }, 1000);
}
function loadPlayers() {
    Players.forEach(player => {
        addPlayer(player);
    });
}
function addPlayer(player) {
    Players.push(player);
    // Add player to playerlist
    jQuery('<li/>', {
        "class": 'user',
        'text': player.name
    }).appendTo(userList);
    // Add pplayer card to board
    let card = jQuery('<div/>', {
        "class": 'card hidden-card m-3 new-card',
    });
    jQuery('<span/>', {
        "text": player.name,
    }).appendTo(card);
    card.appendTo(board);

    setTimeout(() => {
        $('.new-card').removeClass('new-card');
    }, 1000);
}

function addLeadPermissions() {
    $('#start-game-button').show();
}
function startGame() {
    socket.emit('startGame', server, (roles) => {
        setRoles(roles);
    });
    $('#start-game-button').hide();
}
function setRoles(roles) {
    Players = roles;
    Players.forEach(p => {

    });
}

class Player{
    constructor() {
        this.element;
        this.name;
        this.role;
    }
}