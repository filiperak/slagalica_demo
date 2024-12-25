import { PlayerState } from "../services/playerState.js";
import { bulidNotification } from "../utils/buildNotification.js";
import { createGameId } from "../utils/createGameId.js";

const handleSocket = (io) => {

    //init player state
    const Players = new PlayerState()
    const waitingPlayers = []


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
            console.log("PLAYER:",player);
            

            socket.join(player.game)

            socket.to(player.game).emit("notification", bulidNotification(`${name} joined the game`))

            playersInGame = Players.getPlayers(game)
            console.log("players in game:",playersInGame);
            
            if(playersInGame.length === 2){
                io.to(player.game).emit("startGame",{
                    //fetch game logic and data and sent to room
                      
                    game: player.game,
                    playersInGame: playersInGame
                })
            }
        })

        socket.on("joinRandomGame",({name}) => {
            if(waitingPlayers.length > 0){
                const opponent = waitingPlayers.shift()
                const gameId = createGameId()

                // DONT DELETE THIS LOG 
                console.log();  // DONT DELETE THIS LOG 
                // DONT DELETE THIS LOG 
                
                [socket,opponent.socket].forEach((p) => {
                    p.join(gameId) 
                    io.to(p.id).emit("startGame",{
                        game: gameId,
                        playersInGame: [
                            { id: socket.id, name },
                            { id: opponent.socket.id, name: opponent.name },
                        ],
                    })
                })
            }else{
                waitingPlayers.push({socket,name})
                console.log("PLAYER IF WAITHING" ,socket.id,name);
                
            }
        })

        socket.on("disconnect",() => {
            //dodaj da izbacuje i ljude iz multyplayera 
            console.log(socket.id,"DISCONNECTED");
            
            const player = Players.getPlayer(socket.id)
            Players.playerLeaves(socket.id)

            if(player){
                
                const game = player.game
                const otherPlayer = Players.getPlayers(game).find(p => p.id !== socket.id)
                
                if(otherPlayer){
                    //io.to(otherPlayer.id).emit("notification",bulidNotification("Your oponent left"))
                    io.to(otherPlayer.id).emit("opponentLeft",bulidNotification("Your oponent left"))
                    
                    //OVDE JE PROBLEM POSTO ISKLJUČIŠ OVOG DRUGOG ON SE NEĆE SAM PONOVO KONEKTOVATI!!!!!!!!!!!
                    const socketToRemove = io.sockets.sockets.get(otherPlayer.id);

                    if (socketToRemove) {
                        console.log(socket.rooms);
                        
                        socketToRemove.leave(game);
                        console.log(game);
                        console.log(socket.rooms);

                        
                        console.log(otherPlayer.name , "HAS LEFT");
    
                    }
                }
            }
            //Remove player if waithing in queue
            const index = waitingPlayers.findIndex((p) => p.socket.id === socket.id)
            if(index !== -1){
                waitingPlayers.splice(index,1)
            }
        })
        
    })
}

export default handleSocket