import { PlayerState } from "../services/playerState.js";
import { bulidNotification } from "../utils/buildNotification.js";
import { createGameId } from "../utils/createGameId.js";

const handleSocket = (io) => {

    //init player state
    const Players = new PlayerState()
    let tempGame;
    let clientNo = 0;

    io.on("connection", (socket) => {
        socket.emit(socket.id)
        console.log(socket.id);


        socket.on("enterRoom",({name,game}) => {
            
            let playersInGame = Players.getPlayers(game)
            if(playersInGame.length >= 2){
                socket.emit("notification",bulidNotification("Room is full"))
                return
            } 
            //leave previous room
            const prevGame = Players.getPlayer(socket.id)?.game
            //check if the game exists
            if(prevGame) {
                socket.leave(prevGame)
                io.to(prevGame).emit("notification",bulidNotification(`Your (${name}) oponent left the game`))
            }

            const player = Players.activatePlayer(socket.id,name,game)
            /////////////////////////////
            if(player.game === null){
                
                // if(!Players.playersQueue.length){
                //     Players.playersQueue.push(player)
                // }else{
                //     //const opponent = Players.playersQueue.shift()
                //     //const opponentSocket = io.sockets.sockets.get(opponent.id);
                //     //console.log("INPORTANT",opponent.id);
                    
                //     const gameId = createGameId()
                    
                //     // DO NOT DELETE THIS LOG 
                //     console.log();  // DO NOT DELETE THIS LOG 
                //     // DO NOT DELETE THIS LOG 
                    
                //     // [socket,opponentSocket].forEach(p => {
                //     //     p.game = gameId
                //     // })

                // }

                if(clientNo === 0){
                    tempGame = createGameId();
                    player.game = tempGame;
                    clientNo ++;
                }else{
                    player.game = tempGame;
                    clientNo = 0;
                }
            }   
            
            console.log("PLAYER:",player);
            socket.join(player.game)

            socket.to(player.game).emit("notification", bulidNotification(`${name} joined the game`))

            playersInGame = Players.getPlayers(player.game)
            console.log("players in game:",playersInGame);
            
            if(playersInGame.length === 2){
                io.to(player.game).emit("startGame",{
                    //fetch game logic and data and sent to room
                      
                    game: player.game,
                    playersInGame: playersInGame
                })
            }
        })

        socket.on("disconnect",() => {
            console.log(socket.id,"DISCONNECTED");
            
            const player = Players.getPlayer(socket.id)
            Players.playerLeaves(socket.id)

            if(player){
                
                const game = player.game
                const otherPlayer = Players.getPlayers(game).find(p => p.id !== socket.id)
                
                if(otherPlayer){
                    const opponentSocket = io.sockets.sockets.get(otherPlayer.id);
                    //io.to(otherPlayer.id).emit("notification",bulidNotification("Your oponent left"))
                    if(opponentSocket && opponentSocket.connected){
                        io.to(otherPlayer.id).emit("opponentLeft",bulidNotification("Your oponent left"))
                        // const index = Players.playersQueue.indexOf(otherPlayer)
                        // if(index !== -1){
                        //     Players.playersQueue.splice(index,1)
                        // }
                    }
                    if (opponentSocket) {
                        console.log(otherPlayer.name , "HAS LEFT");
                        opponentSocket.leave(otherPlayer.game);
                    }
                }
            }
        })
    })
}

export default handleSocket