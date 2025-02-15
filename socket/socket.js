import { bulidNotification } from "../utils/buildNotification.js";
import { createGameId, createGameIdSingleGame } from "../utils/createGameId.js";
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
            console.log("gameOvde",game);
            
            if(game){
                if(gameId.slice(0,2) === "sg"){
                    socket.emit("playersState",game)                    
                }else{
                    io.to(gameId).emit("playersState",game)
                }
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

        
        socket.on("enterSinglePlayer",({name}) => {
            const gameId = createGameIdSingleGame() //promeni kod za ulazak u igru da ne bi neko iz multy playera ušao u single
            console.log(gameId);
            
            const singlePlayerGame = new Game(gameId)
            games[gameId] = singlePlayerGame
            games[gameId].addPlayer(socket.id,name)

            socket.emit("startSinglePlayerGame", {game:games[gameId]})
        })

        socket.on("checkIfCompleted",({gameId}) => {
            const game = games[gameId]
            if(game){
                const check = game.isCompleted()
                if(check){
                    const finalScore = game.checkWinner()
                    io.to(gameId).emit("gameCompleted",{
                        data: finalScore
                    })
                }
            }
        })

        socket.on("sendSlagalicaScore",({gameId,word}) => {
            const game = games[gameId]
            if(game){
                const validatedWord = game.validateSlagalica(word)
                game.addScore("slagalica",socket.id,validatedWord.score)
                console.log("SUBMITTED SLAGALICA SCORE,", validatedWord.score, validatedWord);
                
                socket.emit("scoreSubmitedSlagalica",{data:validatedWord.score})
            }else {
                console.error(`Game with id: ${gameId} not found`);
            }
        })
        socket.on("checkSkocko",({gameId,cardComb}) => {
            const game = games[gameId]
            if(game){
                const validateSkocko = game.validateSkocko(cardComb)
                if(validateSkocko.correctPositions === 4){
                    console.log(validateSkocko);
                    
                    game.addScore("skocko",socket.id,validateSkocko.score)
                    socket.emit("scoreSubmitedSkocko",{data:validateSkocko.score})
                }
                socket.emit("skockoCheckResult", validateSkocko)
            }
        })
        socket.on("submitSkocko",({gameId,cardComb}) => {
            const game = games[gameId]
            if(game){
                const validateSkocko = game.validateSkocko(cardComb)
                game.addScore("skocko",socket.id,validateSkocko.score)                    
                socket.emit("scoreSubmitedSkocko",{data:validateSkocko.score})
            }
        })
        socket.on("submitSpojnice",({gameId,correctPick}) => {
            const game = games[gameId]
            
            if(game){
                const validateSpojnice = game.validateSpojnice(correctPick)
                game.addScore("spojnice",socket.id,validateSpojnice)                    
                socket.emit("scoreSubmitedSpojnice",{data:validateSpojnice})
            }
        })
        socket.on("submitkoznazna",({gameId,points}) => {
            const game = games[gameId]
            
            if(game){
                const numericPoints = Number(points);

                game.addScore("koZnaZna",socket.id,numericPoints)    
                const player = game.getPlayer(socket.id)            
                                    
                socket.emit("addScoreKoznazna",{data:player.score.games.koZnaZna.score})
            }
        })
        socket.on("endKoznazna",({gameId}) => {
            const game = games[gameId]
            if(game){
                const player = game.getPlayer(socket.id)
                // console.log(player.score.games.koZnaZna.score);  
                           
                socket.emit("scoreSubmitedKoznazna",{data:player.score.games.koZnaZna.score})
            }
        })
        socket.on("submitAsocijacije",({gameId,points}) => {
            const game = games[gameId]            
            
            if(game){
                const numericPoints = Number(points);
                game.addScore("asocijacije",socket.id,numericPoints)    
                const player = game.getPlayer(socket.id)            
                                    //score IS SOMETIMES UNDEFINED
                socket.emit("scoreSubmitedAsocijacije",{data:player.score.games.asocijacije.score})
            }
        })
        socket.on("submitMojBroj",({gameId,combination}) => {
            const game = games[gameId]
            if(game){
                console.log(combination);
                
                const validateMojBroj = game.validateMojBroj(combination)
                // const player = game.getPlayer(socket.id)            
                game.addScore("mojBroj",socket.id,validateMojBroj)
                socket.emit("scoreSubmitedMojBroj",{data:validateMojBroj})
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