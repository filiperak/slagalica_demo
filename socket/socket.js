import { PlayerState } from "../services/playerState";
import { bulidNotification } from "../utils/buildNotification";

const handleSocket = (io) => {

    //init player state
    const Players = new PlayerState()

    io.on("connection", (socket) => {
        socket.emit(socket.id)
        console.log(socket.id);

        socket.on("enterRoom",({name,game}) => {

            //leave previous room
            const prevGame = Players.getPlayer(socket.id)?.game

            if(prevGame) {
                socket.leave(prevGame)
                io.to(prevGame).emit("notification",bulidNotification(`Your (${name}) oponent lest the game`))
            }

            const player = Players.activatePlayer(socket.id,name,game)

            socket.join(player.game)

            socket.brodcast.to(player.room)
        })
        
    })
}

export default handleSocket