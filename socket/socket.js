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
                      
                    game:games[game], //ovde treba da se posalje ceo objekat igre game[game], najbitnije score u kojem se nalaze poeni
                    // playersInGame: playerGame.players
                })
            }
            //test
            //tempGame = null
        })

        socket.on("requestPlayerData",gameId => {
            const game = games[gameId]

            if(game){
                socket.emit("playersState",game)
            }
            
        })

        socket.on("opendGame",({gameId,gameKey,playerId}) => {
            console.log(gameId,gameKey,playerId);   
            
            const currentGame = games[gameId]
            if(currentGame){
                currentGame.handleOpendGame(gameKey,playerId)
                //new code 1st atempt
                //io.to(currentGame.gameId).emit("gameData",currentGame.gameState[gameKey])
                socket.emit("gameData",currentGame.gameState[gameKey])
            }
        })

        //SLAGALICA VALIDATE SCORES
        socket.on("checkWord",({gameId,word}) => {
            const game = games[gameId]
            if(game){
                const validatedWord = game.validateSlagalica(word)
                socket.emit("wordCheckResult",validatedWord)
            }
        })

        socket.on("sendSlagalicaScore",({gameId,word}) => {
            const game = games[gameId]
            if(game){
                const validatedWord = game.validateSlagalica(word)
                game.addScore("slagalica",socket.id,validatedWord.score)
                console.log("SUBMITTED SLAGALICA SCORE,", validatedWord.score, validatedWord);
                
                
                socket.emit("scoreSubmited",{data:validatedWord.score})
            }else {
                console.error(`Game with id: ${gameId} not found`);
            }
        })

        // socket.on("requestGame",({gameId,singleGame}) => {
        //     const game = games[gameId]
        //     if(game){
        //         socket.emit("gameData",game[singleGame])
        //     }
        // })

        socket.on("disconnect", (reason) => {
            console.log(socket.id, "DISCONNECTED",reason);
        
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