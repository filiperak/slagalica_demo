import { PlayerState } from "../services/playerState.js";
import { bulidNotification } from "../utils/buildNotification.js";
import { createGameId } from "../utils/createGameId.js";
import { Game } from "../services/game.js";

const handleSocket = (io) => {

    //init player state
    //const Players = new PlayerState()
    let tempGame;
    let clientNo = 0;
    const games = {}

    io.on("connection", (socket) => {
        socket.emit(socket.id)
        console.log(socket.id);


        socket.on("enterRoom",({name,game}) => {
            
            let playerGame;

            if(game === null){
                if(clientNo === 0){
                    tempGame = createGameId()
                    game = tempGame
                    clientNo++
                }else{
                    game = tempGame
                    clientNo = 0
                }
            }

            if(games[game]){
                playerGame = games[game];
            }else{
                // dodaj logiku kada nema game id
                playerGame = new Game(game)
                games[game] = playerGame
            }

            if(playerGame.players.length >= 2){
                socket.emit("notification",bulidNotification("Room is full"))
                return
            }
            const newPlayer = playerGame.addPlayer(socket.id,name)
            if(!newPlayer){
                socket.emit("notification",bulidNotification("Room is full"))
                return
            }

            socket.join(game)
            console.log(`Player ${name} joined game ${game}`)

            socket.to(game).emit("notification", bulidNotification(`${name} joined the game`))

            
            if(playerGame.isReady()){
                io.to(game).emit("startGame",{
                    //fetch game logic and data and sent to room
                      
                    game:game,
                    playersInGame: playerGame.players
                })
            }
        })

        socket.on("disconnect",() => {
            // console.log(socket.id,"DISCONNECTED");
            
            // const player = Players.getPlayer(socket.id)
            // Players.playerLeaves(socket.id)

            // if(player){
                
            //     const game = player.game
            //     const otherPlayer = Players.getPlayers(game).find(p => p.id !== socket.id)
                
            //     if(otherPlayer){
            //         const opponentSocket = io.sockets.sockets.get(otherPlayer.id);
            //         if(opponentSocket && opponentSocket.connected){
            //             io.to(otherPlayer.id).emit("opponentLeft",bulidNotification("Your oponent left"))

            //         }
            //         if (opponentSocket) {
            //             console.log(otherPlayer.name , "HAS LEFT");
            //             opponentSocket.leave(otherPlayer.game);
            //         }
            //     }
            // }
        })
    })
}

export default handleSocket