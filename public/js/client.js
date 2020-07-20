const SERVER = '/';
const TITLE_ANIM_TIME = 3500;
const NO_VOTE = { name: 'none', role: 'none' };

let board = undefined;
let userList = undefined;
let socket = undefined;
let room = undefined;

let countdown = 300;
let myPlayer = undefined;
let music = undefined;

$(document).ready(function () {
    socket = io.connect(SERVER);
    $('#name-field').val('Gentleman ' + Math.floor(100 * Math.random()));
    board = $('#board');
    userList = $('#user-list');

    room = new Room('homepage', undefined);

    socket.on('newPlayer', addPlayer);
    socket.on('startGame', startGame);
    socket.on('playerLocked', playerLocked);
    socket.on('endGame', endGame);
    music = document.getElementById('music');
    music.volume = 0;

    // console.log(music)
    // music.click();
    // jqaud
    // preload();
});

/*----------------------------------
        Socket Listener Events
------------------------------------*/

function addPlayer(playerData) {
    room.addPlayer(playerData);
}
function startGame(playerData) {
    room.startGame(playerData)
}
function playerLocked(playerData) {
    room.playerLocked(playerData);
}
function endGame(winners, playerData) {
    room.endGame(winners, playerData);
}

/*----------------------------------
        Socket Emit Events
------------------------------------*/
function hostRequestStart() {
    // Need at least three players to start
    // if(playerArray.length < 3) return;
    socket.emit('hostStartRequest', room.name, (playerData) => {
        room.startGame(playerData);
    });
    $('#start-game-button').hide();
}

function joinServer() {
    let name = $('#name-field').val();
    myPlayer = new Player(name, undefined, undefined, undefined);

    socket.emit('join', { name: myPlayer.name, }, (playerData, lead, roomName) => {
        if (lead) {
            $('#start-game-button').css('display', 'flex');
            myPlayer.lead = true;
        }
        room.loadRoom(roomName, playerData, lead);
    });

    // Hide overlays 
    $('#join-game-overlay').css('opacity', '0');
    setTimeout(() => { $('#join-game-overlay').hide(); }, 1000);
}



/*------------------------
        Button EVENTS
-------------------------*/
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


function musicStart() {
    music.play();
}
function clearVote() {
    if (myPlayer.locked) return;
    if (myPlayer.vote.name == 'none') return;
    myPlayer.vote = NO_VOTE;

    $('#clear-vote-button').toggleClass('active');
    $('.crosshair').remove();
}
function lockVote() {
    if (!myPlayer.locked) {
        $('#submit-vote-button').addClass('active');
        myPlayer.lock();
        socket.emit('submitVote', { name: myPlayer.name, vote: myPlayer.vote.name, voteRoll: myPlayer.vote.role, room: room.name }, endGame);
    }
}
function serverBrowserClicked() {
    $('#server-browser').toggleClass('active');
}

/*------------------------
        CARD EVENTS
-------------------------*/
function cardClicked(playerObj) {
    // if game started
    if (countdown < 300) {
        if (myPlayer.voteLocked) return;
        if (playerObj.name == myPlayer.name) return;

        $('#clear-vote-button').removeClass('active');
        $('.crosshair').remove();
        let crosshair = jQuery('<div/>', {
            "class": `crosshair new-card`,
        }).appendTo(playerObj.cardElement);


        // ---------------------------------
        myPlayer.vote = playerObj;
    }
}


class Room {
    constructor(phase, name) {
        this.players = [];
        this.phase = phase;
        this.name = name;
    }
    loadRoom(roomName, playerData, lead) {
        this.name = roomName;
        this.loadPlayers(playerData);
    }
    loadPlayers(playerData) {
        playerData.forEach(player => {
            this.addPlayer(player);
        });
    }
    findPlayer(name) {
        return this.players.find((player) => { return player.name == name; });
    }
    addPlayer(player) {
        let playerObj = new Player(player.name, undefined, undefined, undefined);
        let options = { color: '', host: '' };
        if (myPlayer.name == player.name) { options.color = 'good'; playerObj = myPlayer; }
        if (player.leader) options.host = ' (host)';

        playerObj.createCardElement(options);
        playerObj.createListElement(options);

        // Give cardElement events
        playerObj.cardElement.on('click', () => { cardClicked(playerObj); });

        this.players.push(playerObj);

        // Remove animation class
        setTimeout(() => { $('.new-card').removeClass('new-card'); }, 1000);
    }
    startGame(playerData) {
        musicStart();
        countDownClock();
        $('#game-start-message').css('top', '0');
        $('#game-start-message > h2').css('opacity', '1');

        setTimeout(() => {
            setTimeout(() => { this.setRoles(playerData); }, 1000);
            $('#game-start-message').css('top', '100%');
            $('#clear-vote-button').css('display', 'flex');
            $('#submit-vote-button').css('display', 'flex');
        }, 1);
        // TITLE_ANIM_TIME
    }
    setRoles(playerData) {
        playerData.forEach(p => {
            let localP = this.players.find((localPlayer) => {
                return localPlayer.name == p.name;
            });

            // If player is client, don't reveal card
            if (p.name == myPlayer.name) {
                myPlayer.role = p.role;
                return;
            }
            console.log('Setting ' + localP.name + ' to ' + p.role);
            localP.setRole(p.role);
        });
    }
    playerLocked(playerData) {
        let lockedPlayer = this.players.find((player) => { return playerData.name == player.name });
        lockedPlayer.lock();
    }
    setVotes(playerData) {
        // Iterate through each player
        playerData.forEach(p => {
            // find the local player object
            let localP = this.players.find((localPlayer) => {
                return localPlayer.name == p.name;
            });
            localP.vote = p.vote;
            console.log(`Setting ${localP.name} vote to ${localP.vote.name}`);
        });

    }
    endGame(winners, playerData) {
        this.setVotes(playerData);
        // Reveal my card
        setTimeout(()=> { myPlayer.setRole(myPlayer.role); }, 2000);
        countdown = 1;

        setTimeout(() => {
            let timeWait = this.showVotes();
            let text = ' Won!';
            if (winners[0]) {
                let t = '';
                winners.forEach((winner) => { t += winner.name + ', ' });
                text = t + text;
            }
            else {
                text = 'Everyone Lost!';
            }

            // Print winners.
            $('.game-start-content').hide();
            $('.game-end-content').text(text);
            $('.game-end-content').show();

            // Slide title screen back up. 
            setTimeout(() => { $('#game-start-message').css('top', '0'); }, timeWait + 1500);

        }, 4000)

    }
    showVotes() {

        this.killDisplay = $('.kill-display');
        // Remove all existing animation classes
        $('.card div').fadeOut(1000);
        $('.card').removeClass('reveal-card-robber reveal-card-tanner reveal-card-alpha reveal-card-wolf reveal-card-villager');

        // Create The header with who a person attacked
        let t = 500, dt = 5000;
        this.players.forEach((player) => {
            setTimeout(() => { player.showVote(this); }, t);
            t += dt;
        });
        return t;
    }
    clearVoteAnimations() {
        $('.kill-display h1').remove();
        $('.kill').removeClass('kill');
        $('.killed').removeClass('killed');
    }
}




class Player {
    constructor(name, role, cardElement, listElement) {
        this.name = name;
        this.role = role;
        this.lead = false;
        this.locked = false;
        this.vote = NO_VOTE;
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
            "class": 'card hidden-card my-3 mx-5 new-card',
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
    lock() {
        let lock = jQuery('<div/>', {
            "class": `locked`,
        }).appendTo(this.cardElement);
    }
    showVote(room) {
        room.clearVoteAnimations();
        let mainText = jQuery('<h1/>', {
            'class': 'mx-2',
            'text': `${this.name} killed `,
        }).appendTo(room.killDisplay);

        let killText = jQuery('<h1/>', {
            'class': 'fade-in',
            'text': this.vote.name,
        }).appendTo(room.killDisplay);


        if (this.vote.name != 'none') {
            let killed = room.findPlayer(this.vote.name);

            let killSettings = setKillAnimationSettings(this, killed);

            killed.cardElement.addClass('killed');
            this.cardElement.addClass('kill');
        } else {

        }



    }

}

function setKillAnimationSettings(playerKilling, playerKilled) {
    let angle = undefined;
    let d = playerKilled.cardElement.offset().left - playerKilling.cardElement.offset().left;
    if (d < 0) { angle = -10 } else { angle = 10 }
    let root = document.documentElement.style;
    root.setProperty('--kill-dist', `${d}px`);
    root.setProperty('--kill-angle', `${angle}deg`);

}