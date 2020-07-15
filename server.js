const express = require('express');
const socket = require('socket.io');

const app = express();

// Set static Folder that will automatically respond to get requests
app.use(express.static('./public'));

// Listen on port
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});


// let player = {
//     nickname: string,
//     id: ,
//     role: string,
//     leader: bool,
// }

/*-----------------------
        SOCKET IO 
-------------------------*/
// initialize io
const servers = [];
let newestServer = undefined;
const io = socket(server);

// THE PLAYERS WILL BE QUERY BY IP WHEN FINISHED
io.sockets.on('connection', (socket) => {
    console.log('New Connection From: ' + socket.id);

    socket.on('startGame', (serverName, clientRolesFn) => {
        let members = startGame(serverName);
        clientRolesFn(members);
    });

    socket.on('join', (data, sendPlayers) => {
        let leader = false;
        if (!servers.length) {
            leader = true;
            newestServer = new Server();
            servers.push(newestServer);
        }
        else if (newestServer.players.length > 7) {
            newestServer = new Server();
            servers.push(newestServer);
        }
        let server = newestServer;
        let players = server.players;
        let player = new Player(data.name);
        if (leader) server.leader = player.name;
        players.push(player);
        socket.join(server.name);
        socket.to(server.name).emit('newPlayer', player);
        sendPlayers(players, leader, server.name);

        console.log(data.name + ' joined ' + server.name);
    });
});

function startGame(serverName) {
    let server = servers.filter((serv) => { return serv.name = serverName })[0];
    console.log(server)
    let members = server.players;
    console.log(members)
    members.forEach(p => {
        let rolesLeft = server.roles.length;
        let roleIndex = Math.floor(rolesLeft * Math.random());
        let role = server.roles[roleIndex];
        p.role = role;
        server.roles.splice(roleIndex, 1);
    });
    return members;
}

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
    }
}
