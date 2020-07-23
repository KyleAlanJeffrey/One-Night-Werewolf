
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
        let playerObj = new Player(player.name, undefined, undefined, undefined, player.leader);
        let options = { color: '', host: '' };
        // if (myPlayer.name == player.name) { options.color = 'good'; playerObj = myPlayer; }
        if (player.leader) options.host = ' (host)';

        playerObj.createCardElement(options);
        playerObj.createListElement(options);

        // Give cardElement events
        playerObj.cardElement.on('click', () => { cardClicked(playerObj); });

        this.players.push(playerObj);

        // Remove animation class
        setTimeout(() => { $('.new-card').removeClass('new-card'); }, 1000);
    }
    wipeRoles() {
        $('.card').removeClass('wolf villager alpha robber tanner').addClass('hidden-card');
        $('.card div').remove();
    }
    restartGame(playerData) {
        countdown = 300;
        $('.kill-display h1').remove();
        this.wipeRoles();
        this.startGame(playerData);
    }

    startGame(playerData) {
        this.phase = 'voting';
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
        this.phase = 'end';
        this.setVotes(playerData);
        countdown = 1;

        // Reveal my card at 2s from now and then show votes at 4 seconds from now
        setTimeout(() => { myPlayer.setRole(myPlayer.role); }, 2000);
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
    constructor(name, role, cardElement, listElement, lead) {
        this.name = name;
        this.role = role;
        this.lead = lead;
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

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";";
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
