const express = require('express');
const socket = require('socket.io');

const app = express();

// Set static Folder that will automatically respond to get requests
app.use(express.static('public'));

// Listen on port
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});

const io = socket(server);

/*-----------------------
        SOCKET IO 
-------------------------*/
// initialize io
class Player {
    constructor(name) {
        this.name = name;
        this.role = undefined;
    }
}
class Server {
    constructor() {
        this.players = [];
        this.leader = undefined;
        this.roles = ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'alpha', 'robber', 'tanner'];
        this.name = 'server ' + (servers.length + 1);
        this.gameRunning = false;
    }
}
const servers = [];
const SERVER_SIZE = 8;
servers.push(new Server()); //Initialize first server

// THE PLAYERS WILL BE QUERY BY IP WHEN FINISHED
io.sockets.on('connection', (socket) => {
    // console.log('New Connection From: ' + socket.id);

    socket.on('hostStartRequest', (serverName, hostCallback) => {
        console.log('Host started game on ' + serverName);
        let members = startGame(serverName);
        hostCallback(members);
        socket.to(serverName).emit('startGame', members);
    });

    socket.on('join', (data, sendPlayers) => {
        let leader = false;

        // Find server
        let server = servers.find(server => { return server.players.length < SERVER_SIZE && server.gameRunning == false });
        if (server == null) {
            server = new Server();
            servers.push(server);
        }
        let players = server.players;
        if (!players.length) leader = true;
        let player = new Player(data.name);
        if (leader) server.leader = player.name;
        players.push(player);
        socket.join(server.name); // Join the socket room 
        socket.to(server.name).emit('newPlayer', player); // Alert other players in room of new player
        sendPlayers(players, leader, server.name);

        console.log(data.name + ' joined ' + server.name);
    });
});

function startGame(serverName) {
    let server = servers.find((serv) => { return serv.name == serverName });
    server.gameRunning = true;
    let members = server.players;
    members.forEach(p => {
        let rolesLeft = server.roles.length;
        let roleIndex = Math.floor(rolesLeft * Math.random());
        let role = server.roles[roleIndex];
        p.role = role;
        server.roles.splice(roleIndex, 1);
    });
    return members;
}

