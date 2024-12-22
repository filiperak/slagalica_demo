import { PlayerState } from "../services/playerState.js";
import { bulidNotification } from "../utils/buildNotification.js";

const handleSocket = (io) => {

    //init player state
    const Players = new PlayerState()

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
                io.to(prevGame).emit("notification",bulidNotification(`Your (${name}) oponent lest the game`))
            }

            const player = Players.activatePlayer(socket.id,name,game)
            console.log(player);
            

            socket.join(player.game)

            socket.to(player.game).emit("notification", bulidNotification(`${name} joined the game`))

            playersInGame = Players.getPlayers(game)
            console.log(playersInGame);
            
            if(playersInGame.length === 2){
                io.to(player.game).emit("startGame",{
                    //fetch game logic and data and sent to room
                      
                        game: player.game,
                        playersInGame: playersInGame
                })
            }
        })

        
        
    })
}

export default handleSocket