import { bulidNotification } from "../utils/buildNotification.js";
import { createGameId } from "../utils/createGameId.js";
import { Game } from "../services/game.js";

const handleSocket = (io) => {

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
                      
                    game:game, //ovde treba da se posalje ceo objekat igre game[game], najbitnije score u kojem se nalaze poeni
                    playersInGame: playerGame.players
                })
            }
            //test
            //tempGame = null
        })

        socket.on("disconnect", () => {
            console.log(socket.id, "DISCONNECTED");
        
            for (const gameId in games) {
                const game = games[gameId];
        
                if (game.players.some(player => player.id === socket.id)) {
                    const otherPlayer = game.players.find(p => p.id !== socket.id);
                    if (otherPlayer) {
                        console.log(otherPlayer);
                        
                        io.to(otherPlayer.id).emit("opponentLeft",bulidNotification("Opponent left the game"));
                    }else{
                        if(gameId === tempGame){
                            tempGame = null
                            clientNo = 0
                        }
                        delete games[gameId]; 
                        console.log(`Game ${gameId} deleted`);
                    }
                    break;
                }
            }        
        });

        socket.on("leaveGame",() => {
            console.log(("leave game"));
            
            for (const gameId in games) {
                const game = games[gameId];
        
                if (game.players.some(player => player.id === socket.id)) {

                    game.removePlayer(socket.id)
                    socket.leave(game)
                    const otherPlayer = game.players.find(p => p.id !== socket.id);
                    if (otherPlayer) {
                        console.log(otherPlayer);
                        
                        io.to(otherPlayer.id).emit("opponentLeft",bulidNotification("Opponent left the game"));
                    }else{
                        //PROBLEM SA OVOM LOGIKOM JE AKO IGRAČ KOJI JE UŠAO U CUSTOM SOBU
                        //IZAĐE ONDA ĆE SE LOBY (CLIENTNO) VRATITI NA NULU I ONDA CE UVEK 
                        //BITI VIŠE IGRAČA NEGO STO CE BITI SOBA
                        if(gameId === tempGame){
                            tempGame = null
                            clientNo = 0
                        }
                        delete games[gameId]; 
                        console.log(`Game ${gameId} deleted`);
                    }
        
                    break;
                }
            } 
        })
    })
}

export default handleSocket