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
    }
}
class Room {
    constructor() {
        this.players = [];
        this.leader = undefined;
        this.roles = ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'alpha', 'robber', 'tanner'];
        this.name = 'room ' + (rooms.length + 1);
        this.gameRunning = false;
        this.votesSubmitted = 0;
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
    socket.on('submitVote', (player) => {
        console.log(`${player.name} voted against ${player.vote}`);
        let room = rooms.find(r => { return player.room == r.name; });
        room.votesSubmitted++;
        let serverPlayer = room.players.find(p => { return player.name == p.name; });
        serverPlayer.vote = room.players.find(p => { return player.vote == p.name; });

        // If everyone but one has submitted vote
        if (room.votesSubmitted == room.players.length - 1) {
            console.log(`Determing Winners in ${room.name}`);
            let winners = determineWinners(room);
            socket.emit('endGame', winners);
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

        console.log(data.name + ' joined ' + room.name);
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

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player.role == 'tanner') {
            console.log('Tanner')
        }
    }
    return winners;
}

