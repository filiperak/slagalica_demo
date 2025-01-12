import { capitalizeAfterSpaces } from "./util/helperFunctions.js"

export class GameUi{
    constructor(element,players,gameId,socket){
        this._element = element
        this._players = players
        this._gameId = gameId
        this._socket = socket
    }

    set players(players){
        this._players = players
        this.reversePlayerIndex()
    }

    get players(){
        return this._players
    }
    createGameMenu(){

        //add request to fetch game data
        this._socket.emit("requestGameData",this._gameId)
        this._socket.on("gameState",data => {
            
            const menu = document.createElement("div")
            menu.classList.add("game-menu")

            //header -- players names
            const header = document.createElement("header")
            header.classList.add("game-menu--header")

            data.players.forEach(elem => {
                let name = document.createElement("p")
                name.innerText = elem.name
                header.append(name)
            })

            //exit button -- leave game
            const exitBtn = document.createElement("div")
            exitBtn.classList.add("game-menu--exit-btn")
            exitBtn.innerText = "Leave"
            exitBtn.addEventListener("click",() => {
                this._socket.emit("leaveGame")
                this.removeEveryElement()
            })

            //game options
            const games = ["slagalica","moj broj","spojnice","skočko","ko zna zna","asocijacije"]
            // map out the games to the correct game key in object (socket package)
            const gameKeys = {
                "slagalica": "slagalica",
                "moj broj": "mojBroj",
                "spojnice": "spojnice",
                "skočko": "skocko",
                "ko zna zna": "koZnaZna",
                "asocijacije": "asocijacije"
            }

            const gameOptions = document.createElement("div")
            gameOptions.classList.add("game-options")

            games.forEach(game => {
                const gameKey = gameKeys[game]
                const gameOption = document.createElement("div")
                gameOption.classList.add("game-option")
    
                const gameOptionName = document.createElement("p")
                const gameClass = (g) => g.trim().replace(/\s+/g, '-')
                gameOptionName.classList.add(gameClass(game),"game-option--container")
                gameOptionName.innerText = capitalizeAfterSpaces(game)

                //add eventlistener to open game

                
                //promeni ovu u pravu datu iz socket paketa
                const playerIndex = data.players.findIndex(player => player.id === this._socket.id)
                if(playerIndex !== -1){
                    const player = data.players[playerIndex]
                    if(player.score.games[gameKey].opend){
                        gameOptionName.classList.add("game-opened")
                    }else{
                        const handleOpenGameClick = () => {
                            this._element.appendChild(this.createGameContainer(game))
                            this._socket.emit("opendGame",{
                                gameId:this._gameId,
                                gameKey,
                                playerId:this._socket.id
                            })                            
                        }
                        gameOptionName.addEventListener("click",handleOpenGameClick)
                    }
                }
                gameOption.append(gameOptionName)
                this._players.forEach(p => {
                    const gameOptionScore = document.createElement("p")
                    gameOptionScore.classList.add("game-option--score")
                    gameOptionScore.innerText = p.score.games[gameKey].score
                    gameOption.append(gameOptionScore)   
                })

               


                // const scorePOne = document.createElement("p")
                // scorePOne.innerText = "0"
                // scorePOne.classList.add("game-option--score")
    
                // const scorePTwo = document.createElement("p")
                // scorePTwo.innerText = "80"
                // scorePTwo.classList.add("game-option--score")
    
                // gameOption.append(gameOptionName,scorePOne,scorePTwo)
                //gameOption.append(gameOptionName,gameOptionScore)
    
                // gameOptionName.addEventListener("click",() => {
                //     this._element.appendChild(this.createGameContainer(game))
                // })
    
                gameOptions.appendChild(gameOption)
            })
            const scoreBoard = this.createScoreBoard()
    
            menu.appendChild(header)  
            menu.appendChild(gameOptions) 
            menu.appendChild(scoreBoard) 
            menu.appendChild(exitBtn)
            
            this._element.appendChild(menu)
        })

    }

    createScoreBoard(){

        //implment scores recived from socket 
        const scoreBoard = document.createElement("div")
        scoreBoard.classList.add("score-board")
        const spacer = document.createElement("div")
        spacer.classList.add("spacer")

        const playerOneScore = document.createElement("p")
        playerOneScore.innerText = "0"
        playerOneScore.classList.add("sore-board--player-score")    
        
        const playerTwoScore = document.createElement("p")
        playerTwoScore.innerText = "10"
        playerTwoScore.classList.add("sore-board--player-score")    
        
        scoreBoard.append(spacer,playerOneScore,playerTwoScore)
        return scoreBoard
    }

    createGameContainer(game){

        const gameContainer = document.createElement("div")
        gameContainer.classList.add("game-container")

        const gameContainerHeader = document.createElement("header")
        const backButton = document.createElement("div")
        backButton.classList.add("game-container--back-btn")
        backButton.innerText = "\u2190 Back"
        gameContainerHeader.appendChild(backButton)

        const header = document.createElement("h1")
        // header.classList.add("game-container--header")

        header.innerText = capitalizeAfterSpaces(game)


        gameContainer.append(gameContainerHeader,header)

        backButton.addEventListener("click",() => {
            this.removeEveryElement()
            this.createGameMenu()
        })

        switch(game){
            case "slagalica":
                this.slagalica()
                break
            case "moj broj":
                this.mojBroj()
                break
            case "spojnice":
                this.spojnice()
                break
            case "skocko":
                this.skocko()
                break
            case "ko zna zna":
                this.koZnaZna()
                break
            case "asocijacije":
                this.asocijacije()
                break
            default:
                console.log("game not found")
        }

        return gameContainer
    }
    slagalica(){

    }
    mojBroj(){

    }
    spojnice(){

    }
    skocko(){

    }
    koZnaZna(){

    }
    asocijacije(){

    }


    removeEveryElement(){
        if(this._element.firstChild){
            while(this._element.firstChild){
                this._element.removeChild(this._element.firstChild)
            }
        }
    }
    removeElement(elem){
        if(elem){
            while(elem.firstChild){
                elem.removeChild(elem.firstChild)
            }
        }
    }
    reversePlayerIndex() {
        if (this._players[0].id !== this._socket.id) {
            if (this._players[1].id === this._socket.id) {
                [this._players[0], this._players[1]] = [this._players[1], this._players[0]];
            }
        }
    }
}