const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Set static Folder that will automatically respond to get requests
app.use(express.static('public'));

// Listen on port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});

// const io = socket(server);

/*-----------------------
        SOCKET IO 
-------------------------*/
// initialize io
class Player {
    constructor(name, lead) {
        this.name = name;
        this.role = undefined;
        this.vote = undefined;
        this.leader = lead; // bool
        this.votesAgainst = 0;
    }
    swapRole() {
        if (this.role == 'wolf') this.role = 'villager'
        else if (this.role == 'villager') this.role = 'wolf';
    }
    print() {
        let string = `Player: ${this.name} Role: ${this.role}`;
        console.log(string);
        return string;
    }
}
class Room {
    constructor() {
        this.players = [];
        this.leader = undefined;
        this.roles = ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'alpha', 'robber', 'tanner'];
        // this.roles = ['wolf', 'villager', 'wolf'];
        this.name = 'room ' + (rooms.length + 1);
        this.gameRunning = false;
        this.votesSubmitted = 0;
    }
    submitVote(playerData) {
        this.votesSubmitted++;
        let serverPlayerObject = this.players.find(player => { return playerData.name == player.name; });
        if (playerData.vote == 'none') serverPlayerObject.vote = { name: 'none', roll: 'none' };
        else { serverPlayerObject.vote = { name: playerData.vote, roll: playerData.voteRoll } };
    }
    allVotesSubmitted() {
        if (this.players.length == this.votesSubmitted) {
            return true;
        } else {
            return false;
        }
    }
    everyOtherPlayer(player) {
        return this.players.filter((p) => { return p.name != player.name });
    }
    findPlayer(name) {
        return this.players.find((p) => { return p.name == name });
    }
    alphaSwap(alpha) {
        this.print();
        let others = this.everyOtherPlayer(alpha);
        alpha.role = 'wolf';
        others.forEach((player) => { player.swapRole(); });
        this.print();
    }
    robberSwap(robber) {
        this.print();
        let others = this.everyOtherPlayer(robber);
        robber.role = 'villager';
        others.forEach((player) => { player.swapRole(); });
        this.print();

    }
    print() {
        console.log(this.name + '\n---------------');
        this.players.forEach((player) => {
            player.print();
        });
        console.log('\n');
    }
}
const rooms = [];
const ROOM_SIZE = 3;
rooms.push(new Room()); //Initialize first server

// THE PLAYERS WILL BE QUERY BY IP WHEN FINISHED
io.sockets.on('connection', (socket) => {

    /*------------------ Start Game Event ------------------ */
    socket.on('hostStartRequest', (roomName, hostCallback) => {
        console.log('Host started game on ' + roomName);
        let members = startGame(roomName);
        hostCallback(members);
        socket.to(roomName).emit('startGame', members);
    });

    /*------------------ Vote Submission Event ------------------ */
    socket.on('submitVote', (playerData, callback) => {
        console.log(`${playerData.name} voted against ${playerData.vote}`);
        let room = rooms.find(r => { return playerData.room == r.name; });
        room.submitVote(playerData);

        // Tell every other player who locked in
        socket.to(playerData.room).emit('playerLocked', playerData);

        if (room.allVotesSubmitted()) {
            console.log(`Determining Winners in ${room.name}`);
            let winners = determineWinners(room);
            socket.to(room.name).emit('endGame', winners);
            callback(winners);
        }
    })

    /*------------------ Join A Room Event ------------------ */
    socket.on('join', (data, sendPlayers) => {
        let leader = false;

        // Find room
        let room = rooms.find(room => { return room.players.length < ROOM_SIZE && room.gameRunning == false });
        if (room == null) {
            room = new Room();
            rooms.push(room);
        }
        let players = room.players;
        if (!players.length) leader = true;
        let player = new Player(data.name, leader);
        if (leader) room.leader = player.name;
        players.push(player);
        socket.join(room.name); // Join the socket room 
        socket.to(room.name).emit('newPlayer', player); // Alert other players in room of new player
        sendPlayers(players, leader, room.name);

        console.log('-------' + data.name + ' joined ' + room.name + '-------');
    });
});

function startGame(roomName) {
    let room = rooms.find((serv) => { return serv.name == roomName });
    room.gameRunning = true;
    let members = room.players;
    members.forEach(p => {
        let rolesLeft = room.roles.length;
        let roleIndex = Math.floor(rolesLeft * Math.random());
        let role = room.roles[roleIndex];
        p.role = role;
        room.roles.splice(roleIndex, 1);
    });
    return members;
}
function determineWinners(room) {
    let winners = [];
    let players = room.players;


    let votes = [];

    // Turn everyone into either villager or wolf and end if theres a tanner
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        votes.push(player.vote);
        switch (player.role) {
            case ('alpha'): {
                alpha = true;
                room.alphaSwap(player);
                break;
            }
            case ('robber'): {
                robber = true;
                room.robberSwap(player);
                break;
            }
            // Tanner
            case ('tanner'): {
                winners = [];
                if (player.vote.name == 'none') {
                    winners.push(player);
                } else {
                    let w = players.find((p) => { return p.name != player.name && p.name != player.vote.name });
                    winners.push(w);
                }
                return winners;
            }
        }
    }
    const villagers = players.filter((player) => { return player.role == 'villager'; });
    const wolves = players.filter((player) => { return player.role == 'wolf'; });
    if (wolves.length == players.length) {
        let win = players.every((villager) => { return villager.vote.name == 'none'; });
        if (win) {
            players.forEach(villager => { winners.push(villager); });
        }
    }
    else if (villagers.length == wolves.length) {
        let win = players.every((wolf) => { return wolf.vote.name == 'none'; });
        if (win) {
            players.forEach(wolf => { winners.push(wolf); });
        }
    } else {





        // Check who was killed
        // killed = person with most votes/ if no most votes        

        console.log(votes);
        let voteCount = [];
        let roleKilled = undefined;
        votes.forEach((vote) => {
            if (vote.name == 'none') return;
            // if vote is already in vote count, increment votecount
            let i = voteCount.findIndex((v) => { return v.name == vote.name });
            if (i != -1) {
                voteCount[i].number++;
                if (voteCount[i].number == 2) {
                    roleKilled = voteCount[i].role;
                }
                return;
            }
            voteCount.push({ name: vote.name, number: 1, role: vote.role });
        });


        // If one person targeted 
        if (voteCount.length == 1) {
            roleKilled = voteCount.pop().role;
        }

        // if nobody killed minority wins. 
        if (roleKilled == undefined) {
            if (villagers.length > wolves.length) {
                roleKilled = 'villager';
            }
            else {
                roleKilled = 'wolf';
            }
        }

        if (roleKilled == 'wolf') {
            //add villagers to winners
            // If person killed is wolf, villagers win
            wolves.forEach((wolf) => { winners.push(wolf); });
        } else if (roleKilled == 'villager') {
            //add wolves to winners
            // else if villager is killed, wolves win
            villagers.forEach((villager) => { winners.push(villager); });
        }
    }



    return winners;
}
