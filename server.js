const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: "http://localhost:3000/"
});

const allUsers = []

io.on("connection", (socket) => {
    allUsers[socket.id] = { socket, online: true };

    socket.on('request_to_play', (data) => {
        const currentUser = allUsers[socket.id]
        currentUser.playerName = data.playerName;

        let opponentPlayer;

        for (const key in allUsers) {
            const user = allUsers[key];
            if (user.online && !user.playing && socket.id !== key) {
                opponentPlayer = user;
                break;
            }
        }


        if (opponentPlayer) {
            opponentPlayer.socket.emit("OpponentFound", {
                playerName: currentUser.playerName,
                playingAs: "circle"
            })
            currentUser.socket.emit("OpponentFound", {
                playerName: opponentPlayer.playerName,
                playingAs: "cross"
            })
            currentUser.socket.on("playerMoveFromClient", (data) => {
                opponentPlayer.socket.emit("playerMoveFromServer", {
                    ...data
                })
            })
            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                currentUser.socket.emit("playerMoveFromServer", {
                   ...data
                })
            })
        }
        else {
            currentUser.socket.emit("OpponentNotFound");
        }
    })

    socket.on('playerMoveFromClient', (data) => {

    })

    socket.on('disconnect', () => {
        const currentUser = allUsers[socket.id];
        currentUser.online = false;
    })
});

httpServer.listen(4000);