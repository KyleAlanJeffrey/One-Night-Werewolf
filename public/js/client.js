const SERVER = '/';
const TITLE_ANIM_TIME = 3500;

let board = undefined;
let userList = undefined;
let socket = undefined;
let playerArray = [];
let username = undefined;
let room = undefined;
let countdown = 300;
let leader = false;
let voteLocked = false;
let vote = 'none';
let voteRoll = 'none';
let myPlayer = undefined;

$(document).ready(function () {
    socket = io.connect(SERVER);
    $('#name-field').val('User ' + Math.floor(100 * Math.random()));
    board = $('#board');
    userList = $('#user-list');
    socket.on('newPlayer', addPlayer);
    socket.on('startGame', startGame);
    socket.on('endGame', endGame);
    // preload();
});


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
    playerData.forEach(p => {
        let localP = playerArray.find((localPlayer) => {
            return localPlayer.name == p.name;
        });
        console.log('Setting ' + localP.name + ' to ' + p.role);
        // If player is client, don't reveal card
        if (p.name == username) {
            myPlayer.role = p.role;
            return;
        }
        localP.setRole(p.role);
    });
}
/*------------------------
        Socket EVENTS
-------------------------*/
function joinServer() {
    username = $('#name-field').val();
    socket.emit('join', { name: username, }, (data, lead, roomName) => {
        if (lead) {
            $('#start-game-button').css('display', 'flex');
            leader = true;
        }
        room = roomName;
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
    let options = { item: '', host: '' };
    if (username == player.name) {
        options.item = 'good';
    }
    if (player.leader) options.host = ' (host)';

    let playerObj = new Player(player.name, undefined, undefined, undefined);

    playerObj.createCardElement(options);
    playerObj.createListElement(options);
    if (options.item == 'good') myPlayer = playerObj;
    playerArray.push(playerObj);

    // Give cardElement events
    playerObj.cardElement.on('click', () => { cardClicked(playerObj); });
    playerObj.cardElement.on('onmouseover', () => { cardMousedOver(playerObj); });

    setTimeout(() => {
        $('.new-card').removeClass('new-card');
    }, 1000);
}

function startGame(playerData) {

    countDownClock();
    $('#game-start-message').css('top', '0');
    $('#game-start-message > h2').css('opacity', '1');

    setTimeout(() => {
        setTimeout(() => { setRoles(playerData); }, 1000);
        $('#game-start-message').css('top', '100%');
        $('#clear-vote-button').css('display', 'flex');
        $('#submit-vote-button').css('display', 'flex');
    }, TITLE_ANIM_TIME);
    // TITLE_ANIM_TIME
}
function endGame(winners) {
    setTimeout(() => {
        // Reveal Card
        myPlayer.setRole(myPlayer.role);
        $('.game-start-content').hide();

        let text = ' Won!';
        if (winners[0]) {
            let t = '';
            winners.forEach((winner) => { t += winner.name + ', ' });
            text = t + text;
        }
        else {
            text = 'Everyone Lost!';
        }
        console.log(text);
        // Print winners.
        $('.game-end-content').text(text);
        $('.game-end-content').show();

        // Slide title screen back up. 
        setTimeout(() => { $('#game-start-message').css('top', '0'); }, 2000);
    }, 1000)
    myPlayer.cardElement.addClass('')
    countdown = 1;
}
/*------------------------
        Button EVENTS
-------------------------*/
function hostRequestStart() {
    socket.emit('hostStartRequest', room, (playerData) => {
        startGame(playerData);
    });
    $('#start-game-button').hide();
}
function clearVote() {
    if (voteLocked) return;
    guess = 'none';
    $('#clear-vote-button').toggleClass('active');
    $('.crosshair').remove();
}
function lockVote() {
    if (!voteLocked) {
        voteLocked = true;
        $('#submit-vote-button').addClass('active');
        let crosshair = jQuery('<div/>', {
            "class": `locked`,
        }).appendTo(myPlayer.cardElement);

        socket.emit('submitVote', { name: username, vote: vote, voteRoll: voteRoll, room: room }, endGame);
    }
}

/*------------------------
        CARD EVENTS
-------------------------*/
function cardClicked(playerObj) {
    // if game started
    if (countdown < 300) {
        if (voteLocked) return;
        if (playerObj.name == username) return;
        $('.crosshair').remove();
        let crosshair = jQuery('<div/>', {
            "class": `crosshair new-card`,
        }).appendTo(playerObj.cardElement);
        vote = playerObj.name;
        voteRoll = playerObj.role;
    }
    // console.log(card)
}
function cardMousedOver(playerObj) {

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
        this.cardElement.addClass('reveal-card-' + role);
        setTimeout(() => {
            this.cardElement.addClass(role);
            this.cardElement.removeClass('hidden-card');
        }, 1000);
    }
    createCardElement(options) {

        // Add player card to board
        let card = jQuery('<div/>', {
            "class": 'card hidden-card m-3 new-card',
        });
        // Username 
        jQuery('<span/>', {
            "text": this.name,
        }).appendTo(card);

        this.cardElement = card;
        card.appendTo(board);

    }
    createListElement(options) {
        let listItem = jQuery('<li/>', {
            "class": `user ${options.item}`,
            'text': this.name + options.host,
        });
        this.listElement = listItem;
        listItem.appendTo(userList);

    }
}